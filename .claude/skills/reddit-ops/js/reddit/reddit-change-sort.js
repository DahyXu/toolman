import { PinchTabClient } from "../api.js";
import {
  humanPause,
  humanClickElement,
  locateAndScrollByJS,
  pollLocate,
  ensureTabFocus
} from "./reddit-human.js";
import { getCliOptions, getCliArg, requireTabId, outputResult, runMain } from "./cli.js";
const VALID_MODES = ["hot", "new", "rising", "top"];
const SORT_VALUE = {
  hot: "HOT",
  new: "NEW",
  rising: "RISING",
  top: "TOP"
};
const JS_DROPDOWN_RESOLVER = `
(function(){
  return document.querySelector('shreddit-sort-dropdown[sort-event="feed-sort-change"]')
      || document.querySelector('shreddit-sort-dropdown[telemetry-source="sort_switch"]')
      || document.querySelectorAll('shreddit-sort-dropdown')[0]
      || null;
})()
`;
const JS_FIND_TRIGGER = `
(function(){
  var dd=${JS_DROPDOWN_RESOLVER};
  if(!dd)return null;
  var sr=dd.shadowRoot;
  if(!sr)return null;
  var btn=sr.querySelector('button[aria-haspopup="true"]')||sr.querySelector('button[role="button"]')||sr.querySelector('button');
  if(!btn)return null;
  var r=btn.getBoundingClientRect();
  if(r.width===0||r.height===0)return null;
  return{x:Math.round(r.x+r.width/2),y:Math.round(r.y+r.height/2),w:Math.round(r.width),h:Math.round(r.height)};
})()
`;
const JS_FIND_OPTION = (mode) => {
  const valueUpper = SORT_VALUE[mode];
  return `
(function(){
  var mode=${JSON.stringify(mode)};
  var valueUpper=${JSON.stringify(valueUpper)};
  function hrefSort(h){
    if(!h)return null;
    var clean=h.split('#')[0];
    var path=clean.split('?')[0].replace(/\\/+$/,'');
    var seg=path.split('/').pop();
    if(seg===mode)return true;
    var q=clean.split('?')[1]||'';
    return new RegExp('(^|&)sort='+mode+'(&|$)').test(q);
  }
  function rectOf(a){
    if(!a)return null;
    var r=a.getBoundingClientRect();
    if(r.width===0||r.height===0)return null;
    return{x:Math.round(r.x+r.width/2),y:Math.round(r.y+r.height/2),w:Math.round(r.width),h:Math.round(r.height)};
  }
  var dd=${JS_DROPDOWN_RESOLVER};
  if(dd){
    var a1=dd.querySelector('data[value="'+valueUpper+'"] a[href]');
    var r1=rectOf(a1);if(r1)return r1;
    var anchors=dd.querySelectorAll('a[href]');
    for(var i=0;i<anchors.length;i++){
      if(hrefSort(anchors[i].getAttribute('href'))){var rr=rectOf(anchors[i]);if(rr)return rr;}
    }
  }
  var all=document.querySelectorAll('a[href]');
  for(var j=0;j<all.length;j++){
    if(hrefSort(all[j].getAttribute('href'))){var r2=rectOf(all[j]);if(r2)return r2;}
  }
  return null;
})()
`;
};
const JS_VERIFY = (mode) => {
  const valueUpper = SORT_VALUE[mode];
  return `
(function(){
  var mode=${JSON.stringify(mode)};
  var valueUpper=${JSON.stringify(valueUpper)};
  var path=(location.pathname||'').replace(/\\/+$/,'').split('/').pop();
  if(path===mode)return{verified:true,reason:'url',path:path};
  var query=location.search||'';
  if(new RegExp('(^|\\?|&)sort='+mode+'(&|$)').test(query))return{verified:true,reason:'url-query',path:path};
  var dd=${JS_DROPDOWN_RESOLVER};
  if(dd){
    var sel=dd.querySelector('data[value="'+valueUpper+'"] li[rpl-selected]')
        || dd.querySelector('data[value="'+valueUpper+'"] a[class*="selected"]');
    if(sel)return{verified:true,reason:'selected',path:path};
  }
  return{verified:false,path:path};
})()
`;
};
async function evalObject(client, tabId, jsExpr) {
  const res = await client.evaluateV2(tabId, jsExpr);
  const raw = res?.result;
  if (raw == null) return null;
  if (typeof raw === "string") {
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }
  return raw;
}
async function changeSort(client, tabId, mode) {
  await ensureTabFocus(client, tabId);
  let triggerLoc = await pollLocate(client, tabId, JS_FIND_TRIGGER);
  if (!triggerLoc) {
    return { status: "failed", message: "sort dropdown trigger not found" };
  }
  triggerLoc = await locateAndScrollByJS(client, tabId, JS_FIND_TRIGGER) || triggerLoc;
  console.log(`[sort] clicking sort trigger at y=${triggerLoc.y}`);
  await humanClickElement(client, tabId, triggerLoc, { skipMoveAway: true });
  await humanPause(800, 1500);
  const optionLoc = await pollLocate(client, tabId, JS_FIND_OPTION(mode));
  if (!optionLoc) {
    return { status: "failed", message: `sort option "${mode}" not found in dropdown` };
  }
  console.log(`[sort] clicking "${mode}" option at y=${optionLoc.y}`);
  await humanClickElement(client, tabId, optionLoc);
  await humanPause(2e3, 3500);
  let verified = false;
  let verifyReason = "";
  for (let i = 0; i < 10; i++) {
    try {
      const v = await evalObject(
        client,
        tabId,
        JS_VERIFY(mode)
      );
      if (v?.verified) {
        verified = true;
        verifyReason = v.reason ?? "";
        break;
      }
    } catch {
    }
    await humanPause(400, 700);
  }
  if (!verified) {
    return { status: "failed", message: `sort change to "${mode}" could not be verified` };
  }
  return {
    status: "success",
    message: `changed sort to ${mode} (${verifyReason})`,
    data: { mode }
  };
}
async function main() {
  const cli = await getCliOptions();
  const tabId = requireTabId();
  const mode = getCliArg("mode");
  if (!mode) {
    console.log(JSON.stringify({ status: "failed", message: "--mode is required (hot|new|rising|top)" }));
    process.exit(1);
  }
  if (!VALID_MODES.includes(mode)) {
    console.log(JSON.stringify({ status: "failed", message: `invalid mode "${mode}". Valid: ${VALID_MODES.join(", ")}` }));
    process.exit(1);
  }
  const client = new PinchTabClient({ baseUrl: cli.baseUrl, token: cli.token });
  const result = await changeSort(client, tabId, mode);
  outputResult(result);
}
runMain(main, "reddit-change-sort.ts");
export {
  changeSort
};
