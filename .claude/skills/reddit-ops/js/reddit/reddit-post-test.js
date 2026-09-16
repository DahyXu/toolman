#!/usr/bin/env node
import { PinchTabClient } from "../api.js";
import { getCliArg, outputResult, getCliOptions, runMain } from "./cli.js";
async function main() {
  const cli = await getCliOptions();
  const profileId = getCliArg("profile-id");
  const postUrl = getCliArg("post-url");
  if (!profileId || !postUrl) {
    throw new Error("--profile-id and --post-url are required");
  }
  const pt = new PinchTabClient({ baseUrl: cli.baseUrl, token: cli.token });
  await pt.health();
  const instance = await pt.profileEnsure(profileId);
  const tabs = await pt.instanceTabsList(instance.id);
  let tab = tabs.find((t) => t.url === postUrl);
  if (!tab) {
    tab = await pt.instanceTabsOpen(instance.id, postUrl);
  }
  const navResult = await pt.tabNav(tab.tabId, postUrl, { waitFor: "networkidle" });
  console.log("Navigated to post page:", navResult);
  const result = {
    status: "success",
    message: "navigated to post page",
    data: {
      tabId: navResult.tabId
    }
  };
  outputResult(result);
}
runMain(main, "reddit-post-test.ts");
