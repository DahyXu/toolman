#!/usr/bin/env tsx
import { PinchTabClient } from "../api.js";
import { getCliOptions, requireTabId, runMain } from "./cli.js";
async function main() {
  const cli = await getCliOptions();
  const tabId = requireTabId();
  const client = new PinchTabClient({ baseUrl: cli.baseUrl, token: cli.token });
  const result = await client.tabClose(tabId);
  console.log(JSON.stringify({ status: "success", tabId, result }));
}
runMain(main, "reddit-close-tab.ts");
