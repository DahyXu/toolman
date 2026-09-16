#!/usr/bin/env node
import { getCliArg, getCliOptions, runMain } from "./cli.js";
function required(value, name) {
  if (!value || value.trim() === "") {
    throw new Error(`Missing required argument: --${name}`);
  }
  return value;
}
async function main() {
  const cli = await getCliOptions();
  const url = required(getCliArg("url"), "url");
  const token = required(getCliArg("token"), "token");
  const recordId = Number(required(getCliArg("record-id"), "record-id"));
  const status = Number(required(getCliArg("status"), "status"));
  const taskResult = required(getCliArg("task-result"), "task-result");
  const errorMsg = required(getCliArg("error-msg"), "error-msg");
  const retryCountArg = getCliArg("retry-count");
  const retryCount = retryCountArg !== void 0 ? Number(retryCountArg) : void 0;
  const businessId = getCliArg("business-id") || "BrowserAuto";
  if (!Number.isFinite(recordId) || recordId < 0) {
    throw new Error("Invalid record-id, must be a non-negative number.");
  }
  if (!Number.isFinite(status) || status < 0) {
    throw new Error("Invalid status, must be a non-negative number.");
  }
  if (retryCount !== void 0 && (!Number.isFinite(retryCount) || retryCount < 0)) {
    throw new Error("Invalid retry-count, must be a non-negative number.");
  }
  const payload = {
    record_id: recordId,
    status,
    task_result: taskResult,
    error_msg: errorMsg
  };
  if (retryCount !== void 0) {
    payload.retry_count = retryCount;
  }
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "X-Business-Id": businessId,
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });
  const text = await res.text();
  if (!res.ok) {
    throw new Error(`Report failed: ${res.status} ${res.statusText} - ${text}`);
  }
  console.log("Report success:", text || JSON.stringify(payload));
}
runMain(main, "reddit-report-result.ts");
