import { PinchTabClient } from "../api.js";
import {
  humanPause,
  hoverWithHesitation,
  briefBrowseAfterAction,
  locateByJS,
  locateAndScrollByJS,
  clickBlankArea,
  ensureTabFocus,
  ensurePostDetailPage,
  parseEvalResult
} from "./reddit-human.js";
import { getCliArg, getCliOptions, requireTabId, outputResult, runMain } from "./cli.js";
const kShareTag = "share";
function shouldShare(interest, random = Math.random) {
  return interest > 0.6 && random() < 0.02;
}
function shouldUpvote(interest, random = Math.random) {
  const prob = interest > 0.6 ? 0.03 : interest > 0.3 ? 0.015 : 5e-3;
  return random() < prob;
}
const JS_POST_SHARE = (postId) => `(function(){
  var p = document.querySelector('shreddit-post[id="${postId}"]');
  if (!p) return JSON.stringify(null);
  // Candidate 1 (detail page): light-DOM rpl-dropdown[slot="ssr-share-button"]
  var drop = p.querySelector('rpl-dropdown[slot="ssr-share-button"]');
  if (drop) {
    var svgs = drop.querySelectorAll('svg[icon-name="share"]');
    for (var i = 0; i < svgs.length; i++) {
      var btn = svgs[i].closest('button');
      if (!btn) continue;
      var r = btn.getBoundingClientRect();
      if (r.width === 0) continue;
      return JSON.stringify({
        x: Math.round(r.left + r.width/2), y: Math.round(r.top + r.height/2),
        w: Math.round(r.width), h: Math.round(r.height),
        attrs: { 'aria-haspopup': btn.getAttribute('aria-haspopup') || '' }
      });
    }
  }
  // Candidate 2 (listing page): shadow shreddit-post-share-button host
  if (p.shadowRoot) {
    var host = p.shadowRoot.querySelector('shreddit-post-share-button');
    if (host && host.shadowRoot) {
      var svgs2 = host.shadowRoot.querySelectorAll('svg[icon-name="share"]');
      for (var j = 0; j < svgs2.length; j++) {
        var btn2 = svgs2[j].closest('button');
        if (!btn2) continue;
        var r2 = btn2.getBoundingClientRect();
        if (r2.width === 0) continue;
        return JSON.stringify({
          x: Math.round(r2.left + r2.width/2), y: Math.round(r2.top + r2.height/2),
          w: Math.round(r2.width), h: Math.round(r2.height),
          attrs: { 'aria-haspopup': btn2.getAttribute('aria-haspopup') || '' }
        });
      }
    }
  }
  return JSON.stringify(null);
})()`;
const JS_COMMENT_SHARE = (thingId) => `(function(){
  var c = document.querySelector('shreddit-comment[thingid="${thingId}"]');
  if (!c) return JSON.stringify(null);
  // The comment's own action row (shreddit-comment-action-row). Direct
  // children only via :scope traversal to avoid grabbing nested replies' rows.
  var row = c.querySelector(':scope shreddit-comment-action-row, shreddit-comment-action-row');
  if (!row) return JSON.stringify(null);
  var host = row.querySelector('shreddit-comment-share-button');
  if (!host) return JSON.stringify(null);
  var drop = host.querySelector('rpl-dropdown[slot="ssr-share-button"]') || host;
  var svgs = drop.querySelectorAll('svg[icon-name="share"]');
  for (var i = 0; i < svgs.length; i++) {
    var btn = svgs[i].closest('button');
    if (!btn) continue;
    var r = btn.getBoundingClientRect();
    if (r.width === 0) continue;
    return JSON.stringify({
      x: Math.round(r.left + r.width/2), y: Math.round(r.top + r.height/2),
      w: Math.round(r.width), h: Math.round(r.height)
    });
  }
  return JSON.stringify(null);
})()`;
const SHARE_VALUES = ["copy-link", "share-to-x", "share-to-whatsapp", "native-share"];
const JS_SHARE_ENTRIES = `(function(){
  var out = [];
  (function walk(r){
    if (!r || !r.querySelectorAll) return;
    r.querySelectorAll('[role="menuitem"]').forEach(function(b){
      var v = b.getAttribute('value');
      if (!v) return;
      var r2 = b.getBoundingClientRect();
      if (r2.width < 5) return;
      out.push({ value: v, x: Math.round(r2.left + r2.width/2), y: Math.round(r2.top + r2.height/2), w: Math.round(r2.width), h: Math.round(r2.height) });
    });
    r.querySelectorAll('*').forEach(function(e){ if (e.shadowRoot) walk(e.shadowRoot); });
  })(document);
  return JSON.stringify(out);
})()`;
async function readShareEntries(client, tabId) {
  const res = await client.evaluateV2(tabId, JS_SHARE_ENTRIES);
  const parsed = parseEvalResult(res.result);
  return Array.isArray(parsed) ? parsed : [];
}
async function pickShareEntry(client, tabId) {
  let entries = [];
  for (let i = 0; i < 20; i++) {
    await humanPause(250, 450);
    entries = await readShareEntries(client, tabId);
    if (entries.some((e) => e.value === "copy-link")) break;
  }
  if (!entries.some((e) => e.value === "copy-link")) return null;
  const present = SHARE_VALUES.filter((v) => entries.some((e) => e.value === v));
  const chosen = present[Math.floor(Math.random() * present.length)];
  return entries.find((e) => e.value === chosen) ?? null;
}
async function sharePost(client, tabId, postId, options) {
  await ensureTabFocus(client, tabId);
  console.log("[share] starting post share...");
  client.logInfo(tabId, "Starting post share", [kShareTag]);
  const detectedPostId = await ensurePostDetailPage(client, tabId);
  if (!detectedPostId) {
    return { status: "invalid_page", message: "not a Reddit post detail page" };
  }
  if (!postId) postId = detectedPostId;
  let loc = await locateAndScrollByJS(client, tabId, JS_POST_SHARE(postId), 280);
  if (!loc) {
    for (let i = 0; i < 15 && !loc; i++) {
      await humanPause(250, 450);
      loc = await locateByJS(client, tabId, JS_POST_SHARE(postId));
    }
  }
  if (!loc) {
    client.logError(tabId, `Share button not found for post ${postId}`, [kShareTag]);
    return { status: "failed", message: `could not locate share button for post ${postId}` };
  }
  console.log(`[share] found share button at (${loc.x}, ${loc.y}), size ${loc.w}x${loc.h}`);
  await hoverWithHesitation(client, tabId, loc, options);
  await humanPause(1200, 2800);
  const entry = await pickShareEntry(client, tabId);
  if (!entry) {
    client.logWarn(tabId, "Share menu did not appear (no entries found)", [kShareTag]);
    return { status: "failed", message: "share menu did not appear after click" };
  }
  console.log(`[share] picked entry "${entry.value}" at (${entry.x}, ${entry.y})`);
  await hoverWithHesitation(client, tabId, entry, options);
  await humanPause(1e3, 2200);
  await clickBlankArea(client, tabId);
  await humanPause(500, 1e3);
  const remaining = await readShareEntries(client, tabId);
  const shared = remaining.length === 0;
  if (shared) {
    console.log(`[share] "${entry.value}" clicked, menu closed`);
    client.logInfo(tabId, `Share completed via ${entry.value}`, [kShareTag]);
  } else {
    client.logWarn(tabId, "Share menu still open after entry click + blank click", [kShareTag]);
  }
  await briefBrowseAfterAction(client, tabId, options);
  console.log("[share] done");
  return { status: "success", message: `shared post ${postId}`, data: { postId, shared, via: entry.value } };
}
async function shareComment(client, tabId, thingId, options) {
  await ensureTabFocus(client, tabId);
  console.log(`[share] starting comment share for ${thingId}...`);
  client.logInfo(tabId, `Starting comment share for ${thingId}`, [kShareTag]);
  if (!await ensurePostDetailPage(client, tabId)) {
    return { status: "invalid_page", message: "not a Reddit post detail page" };
  }
  let loc = await locateAndScrollByJS(client, tabId, JS_COMMENT_SHARE(thingId), 280);
  if (!loc) {
    for (let i = 0; i < 15 && !loc; i++) {
      await humanPause(250, 450);
      loc = await locateByJS(client, tabId, JS_COMMENT_SHARE(thingId));
    }
  }
  if (!loc) {
    client.logError(tabId, `Comment share button not found for ${thingId}`, [kShareTag]);
    return { status: "failed", message: `could not locate share button for comment ${thingId}` };
  }
  console.log(`[share] found comment share button at (${loc.x}, ${loc.y}), size ${loc.w}x${loc.h}`);
  await hoverWithHesitation(client, tabId, loc, options);
  await humanPause(1200, 2800);
  const entry = await pickShareEntry(client, tabId);
  if (!entry) {
    client.logWarn(tabId, "Share menu did not appear (no entries found)", [kShareTag]);
    return { status: "failed", message: "share menu did not appear after click" };
  }
  console.log(`[share] picked entry "${entry.value}" at (${entry.x}, ${entry.y})`);
  await hoverWithHesitation(client, tabId, entry, options);
  await humanPause(1e3, 2200);
  await clickBlankArea(client, tabId);
  await humanPause(500, 1e3);
  const shared = (await readShareEntries(client, tabId)).length === 0;
  if (shared) {
    console.log(`[share] comment ${thingId} shared via ${entry.value}`);
    client.logInfo(tabId, `Comment share applied via ${entry.value}`, [kShareTag]);
  } else {
    client.logWarn(tabId, "Comment share menu still open", [kShareTag]);
  }
  await briefBrowseAfterAction(client, tabId, options);
  return { status: "success", message: `shared comment ${thingId}`, data: { thingId, shared, via: entry.value } };
}
async function listingShare(client, tabId, postId, options) {
  await ensureTabFocus(client, tabId);
  console.log(`[share] starting listing share for ${postId}...`);
  client.logInfo(tabId, `Starting listing share for ${postId}`, [kShareTag]);
  let loc = await locateAndScrollByJS(client, tabId, JS_POST_SHARE(postId), 280);
  if (!loc) {
    for (let i = 0; i < 15 && !loc; i++) {
      await humanPause(250, 450);
      loc = await locateByJS(client, tabId, JS_POST_SHARE(postId));
    }
  }
  if (!loc) {
    client.logError(tabId, `Share button not found for post ${postId}`, [kShareTag]);
    return { status: "failed", message: `could not locate share button for post ${postId}` };
  }
  console.log(`[share] found listing share button at (${loc.x}, ${loc.y})`);
  await hoverWithHesitation(client, tabId, loc, options);
  await humanPause(1200, 2800);
  const entry = await pickShareEntry(client, tabId);
  if (!entry) {
    client.logWarn(tabId, "Share menu did not appear (no entries found)", [kShareTag]);
    return { status: "failed", message: "share menu did not appear after click" };
  }
  console.log(`[share] picked entry "${entry.value}" at (${entry.x}, ${entry.y})`);
  await hoverWithHesitation(client, tabId, entry, options);
  await humanPause(1e3, 2200);
  await clickBlankArea(client, tabId);
  await humanPause(500, 1e3);
  const shared = (await readShareEntries(client, tabId)).length === 0;
  if (shared) {
    console.log(`[share] listing share applied for ${postId} via ${entry.value}`);
    client.logInfo(tabId, `Listing share applied via ${entry.value}`, [kShareTag]);
  } else {
    client.logWarn(tabId, "Listing share menu still open", [kShareTag]);
  }
  await briefBrowseAfterAction(client, tabId, options);
  return { status: "success", message: `shared post ${postId}`, data: { postId, shared } };
}
async function isListingPage(client, tabId) {
  try {
    const res = await client.evaluateV2(
      tabId,
      `(function(){return !/\\/comments\\//.test(location.pathname) && document.querySelectorAll('shreddit-post').length > 1;})()`
    );
    return !!res.result;
  } catch {
    return false;
  }
}
async function main() {
  const cli = await getCliOptions();
  const tabId = requireTabId();
  const client = new PinchTabClient({ baseUrl: cli.baseUrl, token: cli.token });
  const thingId = getCliArg("thing-id");
  const postId = getCliArg("post-id");
  let result;
  if (thingId) {
    result = await shareComment(client, tabId, thingId);
  } else if (postId && await isListingPage(client, tabId)) {
    result = await listingShare(client, tabId, postId);
  } else {
    result = await sharePost(client, tabId, postId);
  }
  outputResult(result);
}
runMain(main, "reddit-share.ts");
export {
  listingShare,
  shareComment,
  sharePost,
  shouldShare,
  shouldUpvote
};
