import { PinchTabClient } from "../api.js";
import {
  humanPause,
  humanScrollDown,
  humanMouseMove,
  hoverWithHesitation,
  locateByJS,
  locateAndScrollByJS,
  ensureTabFocus
} from "./reddit-human.js";
import {
  openUserMenu,
  clickReliable,
  ev,
  JS_MENU_SETTINGS
} from "./reddit-edit-avatar.js";
import {
  getCliOptions,
  getCliArg,
  requireTabId,
  outputResult,
  runMain,
  processExit
} from "./cli.js";
const FIND_SEC = `function findSec(root){var s=root.querySelector('settings-profile-content-and-activity-section');if(s&&s.shadowRoot)return s;var all=root.querySelectorAll('*');for(var i=0;i<all.length;i++){if(all[i].shadowRoot){var f=findSec(all[i].shadowRoot);if(f&&f.shadowRoot)return f;}}return null}`;
const JS_ACTIVITY_STATE = `(function(){${FIND_SEC};var sec=findSec(document);if(!sec)return JSON.stringify({sectionFound:false,current:null,expanded:false,options:[]});var sr=sec.shadowRoot;var radios=sr.querySelectorAll('faceplate-radio-input');var current=null;var opts=[];for(var i=0;i<radios.length;i++){var rb=radios[i];var val=rb.getAttribute('value')||'';var checked=rb.getAttribute('aria-checked')==='true'||rb.hasAttribute('checked');if(!checked&&rb.shadowRoot){var svg=rb.shadowRoot.querySelector('svg[icon-name]');if(svg&&svg.getAttribute('icon-name')==='radio-button-fill')checked=true;}opts.push({value:val,checked:checked,ariaChecked:rb.getAttribute('aria-checked')||''});if(checked&&current===null)current=val;}var expanded=true;var opt=sr.querySelector('[data-testid="content-and-activity-option"]');if(opt){var p=opt.parentElement;while(p){var cs=getComputedStyle(p);if(cs.overflow==='hidden'||cs.overflowY==='hidden'){expanded=p.clientHeight>5;break;}p=p.parentElement;}}return JSON.stringify({sectionFound:true,current:current,expanded:expanded,options:opts})})()`;
const JS_ACTIVITY_TOGGLE = `(function(){${FIND_SEC};var sec=findSec(document);if(!sec)return JSON.stringify(null);var b=sec.shadowRoot.querySelector('button[data-testid="content-and-activity-toggle"]');if(!b)return JSON.stringify(null);var r=b.getBoundingClientRect();if(r.width<1)return JSON.stringify(null);return JSON.stringify({x:Math.round(r.x+r.width/2),y:Math.round(r.y+r.height/2),w:Math.round(r.width),h:Math.round(r.height)})})()`;
const activityOptionJs = (value) => `(function(){${FIND_SEC};var sec=findSec(document);if(!sec)return JSON.stringify(null);var sr=sec.shadowRoot;var opts=sr.querySelectorAll('[data-testid="content-and-activity-option"]');for(var i=0;i<opts.length;i++){var rb=opts[i].querySelector('faceplate-radio-input[value="${value}"]');if(!rb)continue;var expanded=true;var p=opts[i].parentElement;while(p){var cs=getComputedStyle(p);if(cs.overflow==='hidden'||cs.overflowY==='hidden'){expanded=p.clientHeight>5;break;}p=p.parentElement;}if(!expanded)return JSON.stringify(null);var r=opts[i].getBoundingClientRect();if(r.width<5)return JSON.stringify(null);return JSON.stringify({x:Math.round(r.x+r.width/2),y:Math.round(r.y+r.height/2),w:Math.round(r.width),h:Math.round(r.height)})}return JSON.stringify(null)})()`;
const settingsTabJs = (seg) => `(function(){function qs(root,sel){var r=root.querySelector(sel);if(r)return r;var all=root.querySelectorAll('*');for(var i=0;i<all.length;i++){if(all[i].shadowRoot){r=qs(all[i].shadowRoot,sel);if(r)return r;}}return null}var a=qs(document,'a[href*="/settings/${seg}"]:not([href*="#"])');if(!a)return JSON.stringify(null);var r=a.getBoundingClientRect();if(r.width<5)return JSON.stringify(null);return JSON.stringify({x:Math.round(r.x+r.width/2),y:Math.round(r.y+r.height/2),w:Math.round(r.width),h:Math.round(r.height),href:a.getAttribute('href')||''})})()`;
async function navigateToSettingsProfile(client, tabId) {
  let onSettings = false;
  try {
    const u = await client.pageUrl(tabId);
    onSettings = !!u.url?.includes("/settings");
  } catch {
  }
  if (!onSettings) {
    console.log("[settings] opening menu \u2192 Settings");
    const menuBtn = await openUserMenu(client, tabId);
    if (!menuBtn) return { status: "failed", message: "user menu not found (not logged in?)" };
    let link = null;
    for (let p = 0; p < 5; p++) {
      link = await locateByJS(client, tabId, JS_MENU_SETTINGS);
      if (link) break;
      await humanPause(800, 1200);
    }
    if (!link) return { status: "failed", message: "Settings menu item not found" };
    await clickReliable(client, tabId, link, "Settings");
    await humanPause(1e4, 13e3);
  }
  let profTab = null;
  for (let p = 0; p < 6; p++) {
    profTab = await locateAndScrollByJS(client, tabId, settingsTabJs("profile"));
    if (profTab) break;
    await humanPause(800, 1200);
  }
  if (profTab) {
    console.log("[settings] clicking Profile sub-tab");
    await clickReliable(client, tabId, profTab, "Profile sub-tab");
    await humanPause(2500, 3500);
  } else {
    console.log("[settings] Profile sub-tab not found (maybe already on profile?)");
  }
  return null;
}
const BROWSE_SEGS = ["account", "emails", "notifications", "preferences", "privacy"];
async function humanizeBrowseOtherTab(client, tabId) {
  try {
    const seg = BROWSE_SEGS[Math.floor(Math.random() * BROWSE_SEGS.length)];
    console.log(`[settings] humanize: browse ${seg} sub-tab`);
    const t = await locateAndScrollByJS(client, tabId, settingsTabJs(seg));
    if (!t) {
      console.log(`[settings] ${seg} sub-tab not found, skipping humanize`);
      return;
    }
    await clickReliable(client, tabId, t, `${seg} sub-tab`);
    await humanPause(2500, 3500);
    await humanScrollDown(client, tabId, 200 + Math.round(Math.random() * 300), { readPauseProbability: 0.2, scrollBackProbability: 0.3, noReadingFollow: true });
    await humanPause(1500, 3e3);
    const prof = await locateAndScrollByJS(client, tabId, settingsTabJs("profile"));
    if (prof) {
      await clickReliable(client, tabId, prof, "Profile sub-tab back");
      await humanPause(2500, 3500);
    }
  } catch (e) {
    console.log(`[settings] humanize skipped (non-fatal): ${e?.message || e}`);
  }
}
const JS_RANDOM_VIEW_POINTS = `(function(){var out=[];var vh=innerHeight,vw=innerWidth;var tries=0;while(out.length<3&&tries<30){tries++;var x=Math.round(vw*(0.2+Math.random()*0.6));var y=Math.round(vh*(0.25+Math.random()*0.5));var el=document.elementFromPoint(x,y);if(!el)continue;var tag=el.tagName.toLowerCase();var role=el.getAttribute('role')||'';if(['a','button','input','select','textarea'].indexOf(tag)>=0||['button','link','tab','checkbox','radio','switch'].indexOf(role)>=0)continue;out.push({x:x,y:y});}return JSON.stringify(out)})()`;
async function browseAfterSetting(client, tabId) {
  try {
    const seg = BROWSE_SEGS[Math.floor(Math.random() * BROWSE_SEGS.length)];
    console.log(`[settings] after-action: browse ${seg} sub-tab`);
    const t = await locateAndScrollByJS(client, tabId, settingsTabJs(seg));
    if (t) {
      await clickReliable(client, tabId, t, `${seg} sub-tab`);
      await humanPause(2500, 3500);
    }
    await humanScrollDown(client, tabId, 300 + Math.round(Math.random() * 400), { readPauseProbability: 0.3, scrollBackProbability: 0.3, noReadingFollow: true });
    await humanPause(1200, 2500);
    try {
      const pts = await ev(client, tabId, JS_RANDOM_VIEW_POINTS);
      for (const p of pts || []) {
        await humanMouseMove(client, tabId, p.x, p.y);
        await humanPause(700, 1600);
      }
    } catch {
    }
    const prof = await locateAndScrollByJS(client, tabId, settingsTabJs("profile"));
    if (prof) {
      await clickReliable(client, tabId, prof, "Profile sub-tab back");
      await humanPause(2e3, 3500);
    }
  } catch (e) {
    console.log(`[settings] after-action browse skipped (non-fatal): ${e?.message || e}`);
  }
}
async function pollActivityState(client, tabId, rounds = 12) {
  for (let i = 0; i < rounds; i++) {
    const s = await ev(client, tabId, JS_ACTIVITY_STATE);
    if (s && s.sectionFound) return s;
    await humanPause(500, 900);
  }
  return null;
}
async function hideActivity(client, tabId) {
  await ensureTabFocus(client, tabId);
  console.log("[settings] starting action=hide-activity");
  const nav = await navigateToSettingsProfile(client, tabId);
  if (nav) return nav;
  await humanizeBrowseOtherTab(client, tabId);
  const state = await pollActivityState(client, tabId);
  if (!state) {
    return { status: "failed", message: "content-and-activity section not found (account may lack this feature or not on /settings/profile)" };
  }
  const before = state.current;
  console.log(`[settings] state: current=${before} expanded=${state.expanded}`);
  if (before === "hide_all") {
    console.log("[settings] already hide_all, skipping");
    return { status: "skipped", message: "already hide_all", data: { action: "hide-activity", before: "hide_all", after: "hide_all", changed: false, verified: true } };
  }
  let verified = false;
  for (let attempt = 0; attempt < 3; attempt++) {
    const st = await ev(client, tabId, JS_ACTIVITY_STATE);
    if (st && !st.expanded) {
      const tog = await locateAndScrollByJS(client, tabId, JS_ACTIVITY_TOGGLE);
      if (!tog) return { status: "failed", message: "content-and-activity toggle not found" };
      await hoverWithHesitation(client, tabId, tog, { skipMoveAway: true });
      await humanPause(400, 700);
    }
    let opt = null;
    for (let p = 0; p < 10; p++) {
      opt = await locateByJS(client, tabId, activityOptionJs("hide_all"));
      if (opt) break;
      await humanPause(250, 450);
    }
    if (!opt) {
      console.log(`[settings] hide_all option not located (attempt ${attempt + 1})`);
      continue;
    }
    await hoverWithHesitation(client, tabId, opt, { skipMoveAway: true });
    await humanPause(600, 1e3);
    const vst = await ev(client, tabId, JS_ACTIVITY_STATE);
    if (vst && vst.current === "hide_all") {
      verified = true;
      console.log(`[settings] verified hide_all on attempt ${attempt + 1}`);
      break;
    }
    console.log(`[settings] verify attempt ${attempt + 1} not confirmed (current=${vst?.current})`);
  }
  if (!verified) console.log("[settings] could not verify hide_all (degraded, returning success per guide \xA7\u516D)");
  await browseAfterSetting(client, tabId);
  return {
    status: "success",
    message: verified ? "profile activity hidden (hide_all)" : "hide_all clicked but unverified",
    data: { action: "hide-activity", before: before ?? null, after: "hide_all", changed: before !== "hide_all", verified }
  };
}
async function main() {
  const cli = await getCliOptions();
  const tabId = requireTabId();
  const action = getCliArg("action") ?? "hide-activity";
  if (action !== "hide-activity") {
    console.log(JSON.stringify({ status: "failed", message: `invalid action "${action}" (allowed: hide-activity)` }));
    await processExit(1);
  }
  const client = new PinchTabClient({ baseUrl: cli.baseUrl, token: cli.token });
  const result = await hideActivity(client, tabId);
  outputResult(result);
}
runMain(main, "reddit-account-settings.ts");
