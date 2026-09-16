#!/usr/bin/env tsx
import { getCliArg, getCliOptions, runMain } from "./cli.js";
async function main() {
  const cli = await getCliOptions();
  const email = getCliArg("email");
  const username = getCliArg("username");
  const password = getCliArg("password");
  const emailPassword = getCliArg("email-password") || "";
  const apiUrl = getCliArg("api-url") || "http://automate.test.huya.info/browserauto/v1/update_account";
  const apiToken = getCliArg("api-token") || "fakeToken";
  if (!email || !username || !password) {
    throw new Error("Missing required arguments: --email, --username, --password");
  }
  const now = /* @__PURE__ */ new Date();
  const registerAt = now.toISOString().replace("T", " ").substring(0, 19);
  const payload = {
    email,
    account: {
      username,
      password,
      emailPassword,
      registerAt
    }
  };
  const response = await fetch(apiUrl, {
    method: "POST",
    headers: {
      "X-Business-Id": "BrowserAuto",
      "Authorization": `Bearer ${apiToken}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });
  const text = await response.text();
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${text}`);
  }
  console.log(JSON.stringify({ status: "success", response: text }));
}
runMain(main, "reddit-account-update.ts");
