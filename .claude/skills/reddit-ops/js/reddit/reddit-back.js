import { PinchTabClient } from "../api.js";
import {
  humanPause,
  humanMouseMove,
  humanClickElement,
  randomViewportPosition,
  locateAndScrollByJS,
  ensurePostDetailPage
} from "./reddit-human.js";
import { outputResult, getCliOptions, requireTabId, runMain } from "./cli.js";
const kBackTag = "back";
const JS_BACK_BUTTON = `
(function(){var pdp=document.querySelector('pdp-back-button');if(!pdp||!pdp.shadowRoot)return null;var btn=pdp.shadowRoot.querySelector('button, a');if(!btn)return null;var r=btn.getBoundingClientRect();return{x:Math.round(r.left+r.width/2),y:Math.round(r.top+r.height/2),w:Math.round(r.width),h:Math.round(r.height)}})()
`;
async function goBack(client, tabId, options) {
  await humanPause(600, 1500);
  const isDetailPage = await ensurePostDetailPage(client, tabId);
  const usePageBack = isDetailPage && Math.random() < 0.5;
  let method;
  client.logInfo(tabId, "Navigating back", [kBackTag]);
  if (usePageBack) {
    console.log("[back] looking for page back button...");
    const backLoc = await locateAndScrollByJS(client, tabId, JS_BACK_BUTTON);
    if (backLoc) {
      console.log("[back] found page back button, clicking...");
      try {
        await humanClickElement(client, tabId, backLoc, { ...options, skipMoveAway: true });
      } catch (e) {
        const status = e?.status || e?.error;
        if (status === 409 || String(e?.body || e?.message || "").includes("navigation_changed")) {
          console.log("[back] page navigated after click (expected)");
        } else {
          throw e;
        }
      }
      method = "page_button";
    } else {
      console.log("[back] page back button not found, falling back to browser back");
      await browserBack(client, tabId);
      method = "browser_back";
    }
  } else {
    console.log("[back] using browser history.back()...");
    await browserBack(client, tabId);
    method = "browser_back";
  }
  await humanPause(800, 2e3);
  console.log("[back] done");
  client.logInfo(tabId, `Back navigation done via ${method}`, [kBackTag]);
  return {
    status: "success",
    message: `navigated back via ${method}`,
    data: { method }
  };
}
async function browserBack(client, tabId) {
  const drift = randomViewportPosition(400, 300);
  await humanMouseMove(client, tabId, drift.x, drift.y);
  await humanPause(300, 800);
  await client.back(tabId);
}
async function main() {
  const cli = await getCliOptions();
  const tabId = requireTabId();
  const client = new PinchTabClient({ baseUrl: cli.baseUrl, token: cli.token });
  const result = await goBack(client, tabId);
  outputResult(result);
}
runMain(main, "reddit-back.ts");
export {
  goBack
};
