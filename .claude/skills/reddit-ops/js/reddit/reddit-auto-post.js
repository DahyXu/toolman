import { execFile } from "node:child_process";
import { join } from "node:path";
import {
  getCliArg,
  getCliOptions,
  requireTabId,
  outputResult,
  runMain
} from "./cli.js";
async function fetchPostContent(apiBase, subreddit, limit) {
  const url = `${apiBase}/browserauto/v1/get_post_content?subreddit=${encodeURIComponent(subreddit)}&limit=${encodeURIComponent(limit)}`;
  console.log(`[auto-post] fetching content: ${url}`);
  const response = await fetch(url, {
    headers: { Accept: "application/json" }
  });
  if (!response.ok) {
    throw new Error(
      `get_post_content failed: HTTP ${response.status} ${response.statusText}`
    );
  }
  const body = await response.json();
  if (body.code !== 0) {
    throw new Error(`get_post_content API error: code=${body.code} msg=${body.msg}`);
  }
  return body;
}
async function markPostUsed(apiBase, title, subreddit) {
  const url = `${apiBase}/browserauto/v1/update_post_content_used`;
  console.log(`[auto-post] marking post as used: title="${title}", subreddit="${subreddit}"`);
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title, subreddit })
  });
  if (!response.ok) {
    console.log(
      `[auto-post] \u26A0 update_post_content_used failed: HTTP ${response.status}, continuing...`
    );
    return;
  }
  const body = await response.json();
  if (body.code !== void 0 && body.code !== 0) {
    console.log(
      `[auto-post] \u26A0 update_post_content_used API error: code=${body.code} msg=${body.msg}, continuing...`
    );
  } else {
    console.log(`[auto-post] \u2713 post marked as used`);
  }
}
function spawnSubmitPost(scriptPath, args) {
  return new Promise((resolve) => {
    const child = execFile(
      process.execPath,
      ["--import", "tsx/esm", scriptPath, ...args],
      {
        cwd: join(import.meta.dirname, ".."),
        timeout: 3e5
        // 5 min timeout per post
      },
      (error, stdout, stderr) => {
        if (error) {
          const lastLine2 = stdout.trim().split("\n").pop() || "";
          try {
            const parsed = JSON.parse(lastLine2);
            resolve(parsed);
            return;
          } catch {
          }
          resolve({
            status: "failed",
            message: `submit-post process failed: ${error.message}`,
            data: { stderr: stderr.slice(-500) }
          });
          return;
        }
        const lastLine = stdout.trim().split("\n").pop() || "";
        try {
          const parsed = JSON.parse(lastLine);
          resolve(parsed);
        } catch {
          resolve({
            status: "failed",
            message: `failed to parse submit-post output: ${lastLine.slice(0, 200)}`
          });
        }
      }
    );
    child.stderr?.on("data", (data) => {
      process.stderr.write(data);
    });
  });
}
async function main() {
  const cli = await getCliOptions();
  const tabId = requireTabId();
  const subreddit = getCliArg("subreddit") || "AskReddit";
  const limitStr = getCliArg("limit") || "1";
  const limit = parseInt(limitStr, 10) || 1;
  const apiBase = getCliArg("api-base") || "http://automate.test.huya.info";
  console.log(`[auto-post] starting \u2014 subreddit="${subreddit}", limit=${limit}`);
  let content;
  try {
    content = await fetchPostContent(apiBase, subreddit, limit);
  } catch (err) {
    console.log(JSON.stringify({
      status: "failed",
      message: `Failed to fetch post content: ${err.message}`
    }));
    process.exit(1);
  }
  if (!content.contents || content.contents.length === 0) {
    console.log(JSON.stringify({
      status: "skipped",
      message: "No post content available"
    }));
    process.exit(0);
  }
  console.log(`[auto-post] got ${content.contents.length} post(s) to submit`);
  const results = [];
  let successCount = 0;
  let failCount = 0;
  for (let i = 0; i < content.contents.length; i++) {
    const post = content.contents[i];
    console.log(
      `[auto-post] [${i + 1}/${content.contents.length}] submitting: "${post.title}" \u2192 r/${post.subreddit}`
    );
    const submitArgs = [
      "--tab-id",
      tabId,
      "--title",
      post.title,
      "--subreddit",
      post.subreddit,
      "--base-url",
      cli.baseUrl,
      "--token",
      cli.token
    ];
    if (post.body) {
      submitArgs.push("--body", post.body);
    }
    if (post.wrong_title) {
      submitArgs.push("--wrong-title", post.wrong_title);
    }
    console.log(`[auto-post] spawning: node --import tsx/esm reddit-submit-post.ts ${submitArgs.map((a) => `"${a}"`).join(" ")}`);
    const result = await spawnSubmitPost(join(import.meta.dirname, "reddit-submit-post.ts"), submitArgs);
    results.push({ content: post, result });
    console.log(`[auto-post] submit result: status=${result.status}, message=${result.message}`);
    if (result.status === "success") {
      successCount++;
      try {
        await markPostUsed(apiBase, post.title, post.subreddit);
      } catch (err) {
        console.log(
          `[auto-post] \u26A0 markPostUsed error: ${err.message}`
        );
      }
    } else {
      failCount++;
    }
  }
  const summary = {
    status: failCount === 0 ? "success" : successCount > 0 ? "success" : "failed",
    message: `auto-post complete: ${successCount} succeeded, ${failCount} failed out of ${content.contents.length}`,
    data: {
      total: content.contents.length,
      success: successCount,
      failed: failCount,
      details: results.map((r) => ({
        title: r.content.title,
        subreddit: r.content.subreddit,
        status: r.result.status,
        message: r.result.message
      }))
    }
  };
  outputResult(summary);
}
runMain(main, "reddit-auto-post.ts");
