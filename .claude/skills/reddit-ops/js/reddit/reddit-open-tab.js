import { PinchTabClient } from "../api.js";
import { getCliArg, getCliOptions, runMain } from "./cli.js";
async function main() {
  const cli = await getCliOptions();
  const instanceId = getCliArg("instance-id");
  const url = getCliArg("url");
  if (!instanceId || !url) {
    throw new Error("--instance-id and --url are required");
  }
  const postLinkPattern = /reddit\.com\/r\/[^/]+\/comments\//i;
  if (postLinkPattern.test(url)) {
    console.log(JSON.stringify({
      status: "failed",
      message: "\u4E0D\u5141\u8BB8\u76F4\u63A5\u5BFC\u822A\u5230\u5E16\u5B50\u94FE\u63A5\uFF0C\u8BF7\u4F7F\u7528 reddit-post-click.ts \u70B9\u51FB\u8FDB\u5165\u5E16\u5B50"
    }));
    process.exit(1);
  }
  const pt = new PinchTabClient({ baseUrl: cli.baseUrl, token: cli.token });
  const tabs = await pt.instanceTabsList(instanceId);
  let tab = tabs.find((t) => t.url === url);
  if (tab) {
    const navResult = await pt.tabNav(tab.id, url, { waitFor: "networkidle" });
    console.log("Navigated to post page:", navResult);
  } else {
    tab = await pt.instanceTabsOpen(instanceId, url);
    console.log("Opened new tab:", JSON.stringify(tab));
  }
  console.log(`tabId: ${tab.id || tab.tabId}`);
}
runMain(main, "reddit-open-tab.ts");
