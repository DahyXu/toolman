import { appendFileSync, mkdirSync } from "node:fs";
import { execFile } from "node:child_process";
import { createServer } from "node:http";
import { join, resolve } from "node:path";
import { getCliArg } from "./cli.js";
const PORT = parseInt(getCliArg("port") || "9555", 10) || 9555;
const HERMES_TIMEOUT_MS = 3 * 60 * 1e3;
const REQUEST_TIMEOUT_MS = 5 * 60 * 1e3;
const HERMES_MAX_BUFFER = 20 * 1024 * 1024;
const MAX_CONCURRENT = parseInt(getCliArg("max-concurrent") || "5", 10) || 5;
const LOG_DIR = resolve(
  getCliArg("log-dir") || process.env.HERMES_CHAT_LOG_DIR || join(process.cwd(), "logs")
);
class DailyFileLogger {
  directory;
  currentDate = "";
  currentPath = "";
  constructor(directory) {
    this.directory = directory;
  }
  localDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }
  filePath(date) {
    const localDate = this.localDate(date);
    if (localDate !== this.currentDate) {
      this.currentDate = localDate;
      this.currentPath = join(this.directory, `hermes-chat-server-${localDate}.log`);
    }
    return this.currentPath;
  }
  write(level, message) {
    const now = /* @__PURE__ */ new Date();
    const normalized = String(message).replace(/\r\n/g, "\n").replace(/\r/g, "\n").replace(/\n+$/, "");
    const lines = (normalized || "").split("\n");
    const entry = lines.map((line) => `[${now.toISOString()}] [${level}] ${line}`).join("\n") + "\n";
    try {
      mkdirSync(this.directory, { recursive: true });
      appendFileSync(this.filePath(now), entry, { encoding: "utf8" });
    } catch {
    }
  }
  info(message) {
    this.write("INFO", message);
  }
  error(message) {
    this.write("ERROR", message);
  }
}
const logger = new DailyFileLogger(LOG_DIR);
function createAbortError(message) {
  const error = new Error(message);
  error.name = "AbortError";
  return error;
}
function runHermesChat(prompt, skills, request, pass, signal) {
  return new Promise((resolve2, reject) => {
    if (signal.aborted) {
      reject(createAbortError("request aborted"));
      return;
    }
    const skillArg = skills.length > 0 ? skills.join(",") : "humanizer,reddit-community-styles";
    const args = [
      "chat",
      "--toolsets",
      "terminal,skills,web",
      "-s",
      skillArg,
      "-Q",
      "-q",
      prompt
    ];
    logger.info(`[hermes] request_id=${request.id} pass=${pass} input=${JSON.stringify({ command: "hermes", args })}`);
    execFile(
      "hermes",
      args,
      { maxBuffer: HERMES_MAX_BUFFER, timeout: HERMES_TIMEOUT_MS, signal },
      (error, stdout, stderr) => {
        const output = { stdout, stderr };
        if (error) {
          logger.error(`[hermes] request_id=${request.id} pass=${pass} output=${JSON.stringify(output)} error=${JSON.stringify(error.message)}`);
          reject(new Error(`hermes \u6267\u884C\u5931\u8D25: ${error.message}${stderr ? ` | stderr: ${stderr.slice(-500)}` : ""}`));
          return;
        }
        logger.info(`[hermes] request_id=${request.id} pass=${pass} output=${JSON.stringify(output)}`);
        resolve2(stdout.trim());
      }
    );
  });
}
function sendJson(res, status, body, request) {
  if (request.responseSent || res.writableEnded || res.destroyed) {
    return;
  }
  request.responseSent = true;
  const payload = JSON.stringify(body);
  const headers = { "Content-Type": "application/json" };
  res.writeHead(status, headers);
  logger.info(`[http] request_id=${request.id} response status=${status} headers=${JSON.stringify(headers)} body=${JSON.stringify(payload)} duration_ms=${Date.now() - request.startedAt}`);
  res.end(payload);
}
class Semaphore {
  constructor(limit) {
    this.limit = limit;
  }
  limit;
  active = 0;
  waiters = [];
  get activeCount() {
    return this.active;
  }
  get queuedCount() {
    return this.waiters.length;
  }
  async acquire(signal) {
    if (signal?.aborted) {
      throw createAbortError("request aborted");
    }
    if (this.active < this.limit) {
      this.active++;
      return;
    }
    logger.info(`[hermes] concurrency full (${this.limit}), queuing (queued=${this.waiters.length + 1})`);
    await new Promise((resolve2, reject) => {
      let waiter;
      const onAbort = () => {
        const index = this.waiters.indexOf(waiter);
        if (index < 0) {
          return;
        }
        this.waiters.splice(index, 1);
        waiter.cancel(createAbortError("request aborted"));
      };
      waiter = {
        grant: () => {
          signal?.removeEventListener("abort", onAbort);
          resolve2();
        },
        cancel: (reason) => {
          signal?.removeEventListener("abort", onAbort);
          reject(reason);
        }
      };
      this.waiters.push(waiter);
      signal?.addEventListener("abort", onAbort, { once: true });
      if (signal?.aborted) {
        onAbort();
      }
    });
  }
  release() {
    this.active--;
    const next = this.waiters.shift();
    if (next) {
      this.active++;
      next.grant();
    }
  }
}
const semaphore = new Semaphore(MAX_CONCURRENT);
async function runHermesChatLimited(prompt, skills, request, pass) {
  await semaphore.acquire(request.signal);
  logger.info(`[hermes] request_id=${request.id} pass=${pass} slot acquired (active=${semaphore.activeCount}, queued=${semaphore.queuedCount})`);
  try {
    return await runHermesChat(prompt, skills, request, pass, request.signal);
  } finally {
    semaphore.release();
    logger.info(`[hermes] request_id=${request.id} pass=${pass} slot released (active=${semaphore.activeCount}, queued=${semaphore.queuedCount})`);
  }
}
let nextRequestId = 1;
const server = createServer((req, res) => {
  const controller = new AbortController();
  const request = {
    id: nextRequestId++,
    startedAt: Date.now(),
    signal: controller.signal,
    timedOut: false,
    responseSent: false
  };
  let requestTimeoutTimer;
  const clearRequestTimeout = () => clearTimeout(requestTimeoutTimer);
  requestTimeoutTimer = setTimeout(() => {
    if (request.responseSent || res.writableEnded || res.destroyed) {
      clearRequestTimeout();
      return;
    }
    request.timedOut = true;
    controller.abort();
    logger.error(`[http] request_id=${request.id} timeout after ${REQUEST_TIMEOUT_MS}ms`);
    sendJson(
      res,
      504,
      { code: 504, message: `request timed out after ${REQUEST_TIMEOUT_MS / 1e3}s`, result: "" },
      request
    );
    req.resume();
  }, REQUEST_TIMEOUT_MS);
  res.once("finish", clearRequestTimeout);
  res.once("close", () => {
    if (!res.writableFinished && !request.responseSent && !controller.signal.aborted) {
      controller.abort();
      clearRequestTimeout();
      logger.error(`[http] request_id=${request.id} client disconnected`);
    }
  });
  const path = req.url?.split("?")[0];
  logger.info(`[http] request_id=${request.id} accepted method=${JSON.stringify(req.method)} url=${JSON.stringify(req.url ?? "")} headers=${JSON.stringify(req.headers)}`);
  let raw = "";
  req.on("data", (chunk) => {
    if (!request.signal.aborted) {
      raw += chunk.toString("utf8");
    }
  });
  req.on("aborted", () => {
    logger.error(`[http] request_id=${request.id} aborted body=${JSON.stringify(raw)}`);
    if (!request.timedOut && !controller.signal.aborted) {
      controller.abort();
      clearRequestTimeout();
    }
  });
  req.on("end", async () => {
    logger.info(`[http] request_id=${request.id} request_body=${JSON.stringify(raw)}`);
    if (request.signal.aborted) {
      return;
    }
    if (req.method !== "POST" || path !== "/hermes-chat") {
      sendJson(res, 404, { code: 404, message: "not found, expected POST /hermes-chat", result: "" }, request);
      return;
    }
    let requestBody;
    try {
      requestBody = JSON.parse(raw);
    } catch {
      sendJson(res, 400, { code: 400, message: "invalid JSON body", result: "" }, request);
      return;
    }
    const prompt = requestBody.prompt?.trim();
    if (!prompt) {
      sendJson(res, 400, { code: 400, message: "missing prompt", result: "" }, request);
      return;
    }
    logger.info(`[hermes] request_id=${request.id} received prompt=${JSON.stringify(prompt)} skills=${JSON.stringify(requestBody.skills ?? [])} humanizer=${JSON.stringify(Boolean(requestBody.humanizer))}`);
    const skills = requestBody.skills ?? [];
    try {
      const firstResult = await runHermesChatLimited(prompt, skills, request, "first");
      let finalResult;
      if (requestBody.humanizer) {
        const humanizerPrompt = ` \u4F7F\u7528 humanizer skill \u5BF9\u4E0B\u9762\u8BC4\u8BBA\u6587\u672C\u53BB AI \u5473,  \u539F\u8BC4\u8BBA\u5185\u5BB9\u5982\u4E0B:
${firstResult} 
 \u8F93\u51FA\u65B0\u8BC4\u8BBA\u5185\u5BB9\uFF0C\u8BF7\u7528 ===comment begin=== \u548C ===comment end=== \u5305\u88F9\uFF0C\u683C\u5F0F\u5982\u4E0B\uFF1A
===comment begin===
\u65B0\u8BC4\u8BBA\u5185\u5BB9
===comment end===`;
        const secondResult = await runHermesChatLimited(humanizerPrompt, ["humanizer"], request, "humanizer");
        finalResult = secondResult;
      } else {
        finalResult = firstResult;
      }
      sendJson(res, 200, { code: 0, message: "ok", result: finalResult }, request);
    } catch (err) {
      if (request.timedOut || request.signal.aborted || request.responseSent || res.destroyed) {
        return;
      }
      const message = err.message;
      logger.error(`[hermes] request_id=${request.id} error=${JSON.stringify(message)}`);
      sendJson(res, 500, { code: 500, message, result: "" }, request);
    }
  });
});
server.listen(PORT, () => {
  logger.info(`[hermes-server] listening on http://localhost:${PORT}/hermes-chat`);
  logger.info(`[hermes-server] daily log directory: ${LOG_DIR}`);
});
