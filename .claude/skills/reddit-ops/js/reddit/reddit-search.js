import { PinchTabClient } from "../api.js";
import {
  humanClickElement,
  humanType,
  humanPause,
  humanScrollDown,
  scrollToTopHuman,
  locateByJS,
  pollLocate,
  clamp,
  gaussianRandom,
  ensureTabFocus,
  ensurePostDetailPage,
  briefBrowseAfterAction
} from "./reddit-human.js";
import { goBack } from "./reddit-back.js";
import { browsePost } from "./reddit-browse-post.js";
import { getCliArg, getCliOptions, outputResult, requireTabId, runMain } from "./cli.js";
const TYPE_PARAM = {
  post: "posts",
  community: "communities",
  comment: "comments",
  media: "media",
  profile: "people"
};
const VALID_TYPES = ["post", "community", "comment", "media", "profile"];
const SORT_VALUES = ["relevance", "hot", "top", "new", "comments"];
const SORTABLE_TYPES = ["posts", "comments", "media"];
const JS_SEARCH_INPUT = `
(function(){var s=document.querySelector('reddit-search-large');if(!s||!s.shadowRoot)return JSON.stringify(null);var i=s.shadowRoot.querySelector('faceplate-search-input')||s.shadowRoot.querySelector('input');if(!i)return JSON.stringify(null);var r=i.getBoundingClientRect();return JSON.stringify({x:Math.round(r.x+r.width/2),y:Math.round(r.y+r.height/2),w:Math.round(r.width),h:Math.round(r.height)});})()`;
const JS_TYPE_TAB = (typeParam) => `
(function(){var tg=document.querySelector('faceplate-tabgroup');if(!tg)return JSON.stringify(null);var a=tg.querySelector('a[href*="type=${typeParam}"]');if(!a)return JSON.stringify(null);var r=a.getBoundingClientRect();if(r.width<1||r.height<1)return JSON.stringify(null);return JSON.stringify({x:Math.round(r.x+r.width/2),y:Math.round(r.y+r.height/2),w:Math.round(r.width),h:Math.round(r.height)});})()`;
const JS_URL_PARAMS = `
(function(){var p=new URLSearchParams(location.search);return JSON.stringify({type:p.get('type')||'',sort:p.get('sort')||'',q:p.get('q')||'',path:location.pathname,href:location.href});})()`;
const JS_SORT_INFO = `
(function(){var dd=document.querySelector('search-sort-dropdown-menu');if(!dd)return JSON.stringify({exists:false,trigger:null});var r=dd.getBoundingClientRect();var exists=r.height>0&&r.width>0;var trigger=null;if(exists&&dd.shadowRoot){var btn=dd.shadowRoot.querySelector('button[aria-haspopup="true"]')||dd.shadowRoot.querySelector('button[role="button"]')||dd.shadowRoot.querySelector('button');if(btn){var br=btn.getBoundingClientRect();if(br.width>0&&br.height>0)trigger={x:Math.round(br.x+br.width/2),y:Math.round(br.y+br.height/2),w:Math.round(br.width),h:Math.round(br.height)};}}return JSON.stringify({exists:exists,trigger:trigger});})()`;
const JS_SORT_OPTION = (sort) => `
(function(){var dd=document.querySelector('search-sort-dropdown-menu');if(!dd)return JSON.stringify(null);
function hrefSort(h){if(!h)return null;var q=h.split('?')[1]||'';var ps=q.split('&');for(var i=0;i<ps.length;i++){var kv=ps[i].split('=');if(kv[0]==='sort')return decodeURIComponent(kv.slice(1).join('='));}return null;}
function rectOf(a){var r=a.getBoundingClientRect();if(r.width<1||r.height<1)return null;return{x:Math.round(r.x+r.width/2),y:Math.round(r.y+r.height/2),w:Math.round(r.width),h:Math.round(r.height)};}
var all=dd.querySelectorAll('a[href]');
for(var i=0;i<all.length;i++){if(hrefSort(all[i].getAttribute('href'))===${JSON.stringify(sort)}){var rr=rectOf(all[i]);if(rr)return JSON.stringify(rr);}}
return JSON.stringify(null);})()`;
function resultSelector(typeParam) {
  if (typeParam === "communities") return 'a[href^="/r/"]';
  if (typeParam === "people") return 'a[href^="/user/"]';
  return 'a[href*="/comments/"]';
}
const JS_RESULT_ITEMS = (typeParam) => {
  const sel = resultSelector(typeParam);
  const communityFilter = typeParam === "communities" ? `if((a.getAttribute('href')||'').indexOf('/comments/')>=0)return;` : "";
  return `
(function(){function vis(r){return r.width>1&&r.height>1&&r.bottom>0&&r.top<innerHeight;}var seen={};var out=[];var scope=document.querySelector('main,#main-content,[role="main"]')||document;scope.querySelectorAll('${sel}').forEach(function(a){${communityFilter}var r=a.getBoundingClientRect();if(!vis(r))return;if(r.width<50)return;var key=Math.round(r.top/6)+'|'+(a.getAttribute('href')||'');if(seen[key])return;seen[key]=true;out.push({href:(a.getAttribute('href')||'').slice(0,140),w:Math.round(r.width),h:Math.round(r.height),x:Math.round(r.x+r.width/2),y:Math.round(r.y+r.height/2)});});out.sort(function(a,b){return a.y-b.y;});return JSON.stringify(out);})()`;
};
const JS_SEARCH_SUGGESTION = (query) => `
(function(){var s=document.querySelector('reddit-search-large');if(!s||!s.shadowRoot)return JSON.stringify(null);var target=${JSON.stringify(query.toLowerCase())};var found=null;s.shadowRoot.querySelectorAll('a[href*="/search/?q="]').forEach(function(a){if(found)return;var h=a.getAttribute('href')||'';var q=h.split('?')[1]||'';var qp=null;try{qp=new URLSearchParams(q).get('q');}catch(e){}if(qp&&qp.toLowerCase()===target){var r=a.getBoundingClientRect();if(r.width>0&&r.height>0)found={x:Math.round(r.x+r.width/2),y:Math.round(r.y+r.height/2),w:Math.round(r.width),h:Math.round(r.height)};}});return JSON.stringify(found);})()`;
const JS_COMMUNITY_MATCH = (name, where) => {
  const target = "/r/" + name.toLowerCase();
  const xTest = where === "sidebar" ? "r.x>vw*0.60" : "r.x<vw*0.75";
  return `
(function(){var vw=innerWidth;var target=${JSON.stringify(target)};var found=null;document.querySelectorAll('a[href^="/r/"]').forEach(function(a){if(found)return;var h=(a.getAttribute('href')||'').toLowerCase();var path=h.split('?')[0].replace(/\\/+$/,'');if(path===target){var r=a.getBoundingClientRect();if(r.width>1&&r.height>1&&${xTest}){found={x:Math.round(r.x+r.width/2),y:Math.round(r.y+r.height/2),w:Math.round(r.width),h:Math.round(r.height)};}}});return JSON.stringify(found);})()`;
};
async function evalJSON(client, tabId, js) {
  const res = await client.evaluateV2(tabId, js);
  const raw = res.result;
  if (raw == null) return null;
  if (typeof raw === "string") {
    try {
      return JSON.parse(raw);
    } catch {
      return raw;
    }
  }
  return raw;
}
async function currentUrlParams(client, tabId) {
  return await evalJSON(client, tabId, JS_URL_PARAMS) ?? {
    type: "",
    sort: "",
    q: "",
    path: "",
    href: ""
  };
}
async function currentHref(client, tabId) {
  return (await currentUrlParams(client, tabId)).href;
}
async function isOnSearchPage(client, tabId) {
  const p = await currentUrlParams(client, tabId);
  return p.path.startsWith("/search") && !p.href.includes("/answers/");
}
async function typeIntoSearchBox(client, tabId, text, opts) {
  const method = opts?.inputMethod ?? (Math.random() < 0.7 ? "type" : "paste");
  if (method === "paste") {
    await client.keyboardInsertText(tabId, text);
  } else {
    await humanType(client, tabId, text);
  }
  return { inputMethod: method };
}
async function searchEnter(client, tabId, query, opts) {
  await ensureTabFocus(client, tabId);
  const cur = await currentUrlParams(client, tabId);
  if (cur.path && cur.path !== "/" && !cur.path.startsWith("/search")) {
    console.log(`[search] current path "${cur.path}" scopes search; navigating to homepage first`);
    await client.tabNav(tabId, "https://www.reddit.com/");
    await humanPause(4e3, 6e3);
  }
  const loc = await pollLocate(client, tabId, JS_SEARCH_INPUT);
  if (!loc) throw new Error("could not locate search input");
  await humanClickElement(client, tabId, loc);
  await humanPause(500, 1500);
  const { inputMethod } = await typeIntoSearchBox(client, tabId, query, { inputMethod: opts?.inputMethod });
  await humanPause(1500, 2500);
  const sugg = await pollLocate(client, tabId, JS_SEARCH_SUGGESTION(query), 10, 200, 400);
  if (sugg) {
    console.log(`[search] clicking exact-match suggestion to submit (input=${inputMethod})`);
    try {
      await humanClickElement(client, tabId, sugg);
    } catch {
    }
    await humanPause(2500, 4e3);
    for (let attempt = 0; attempt < 12; attempt++) {
      const p = await currentUrlParams(client, tabId);
      if (p.path.startsWith("/search") && !p.href.includes("/answers/")) {
        return { url: p.href, inputMethod };
      }
      await humanPause(800, 1200);
    }
    throw new Error("clicked suggestion but did not land on /search/");
  }
  console.log(`[search] no exact suggestion for "${query}", falling back to Enter`);
  await client.humanKeyboardPress(tabId, { key: "Enter" });
  await humanPause(2500, 4e3);
  for (let attempt = 0; attempt < 12; attempt++) {
    const p = await currentUrlParams(client, tabId);
    if (p.path.startsWith("/search") && !p.href.includes("/answers/")) {
      return { url: p.href, inputMethod };
    }
    await humanPause(800, 1200);
  }
  throw new Error("did not land on /search/ (at " + await currentHref(client, tabId) + ")");
}
async function switchToType(client, tabId, type) {
  const typeParam = TYPE_PARAM[type];
  if (typeParam === "posts") return "posts";
  const loc = await pollLocate(client, tabId, JS_TYPE_TAB(typeParam));
  if (!loc) throw new Error(`type tab ${typeParam} not found`);
  await humanClickElement(client, tabId, loc, { skipMoveAway: true });
  await humanPause(2e3, 3500);
  for (let i = 0; i < 12; i++) {
    const p = await currentUrlParams(client, tabId);
    if (p.type === typeParam) return typeParam;
    await humanPause(700, 1100);
  }
  console.log(`[search] type switch to ${typeParam} not confirmed by URL, continuing`);
  return typeParam;
}
async function switchSearchSort(client, tabId, sort) {
  const info = await evalJSON(client, tabId, JS_SORT_INFO);
  if (!info || !info.exists || !info.trigger) return false;
  try {
    await humanClickElement(client, tabId, info.trigger, { skipMoveAway: true });
  } catch {
  }
  await humanPause(800, 1400);
  const opt = await pollLocate(client, tabId, JS_SORT_OPTION(sort), 15, 250, 450);
  if (!opt) {
    try {
      await client.humanKeyboardPress(tabId, { key: "Escape" });
    } catch {
    }
    return false;
  }
  try {
    await humanClickElement(client, tabId, opt);
  } catch {
  }
  await humanPause(2e3, 3500);
  for (let i = 0; i < 10; i++) {
    const p = await currentUrlParams(client, tabId);
    if (p.sort === sort) return true;
    await humanPause(600, 1e3);
  }
  return false;
}
async function switchSearchSortRandom(client, tabId) {
  const p = await currentUrlParams(client, tabId);
  const current = p.sort || "relevance";
  const candidates = SORT_VALUES.filter((s) => s !== current);
  const target = candidates[Math.floor(Math.random() * candidates.length)];
  const ok = await switchSearchSort(client, tabId, target);
  return ok ? target : null;
}
async function verifyDetail(client, tabId, typeParam) {
  const p = await currentUrlParams(client, tabId);
  if (typeParam === "communities") return p.path.startsWith("/r/") && !p.path.includes("/comments/");
  if (typeParam === "people") return p.path.startsWith("/user/");
  try {
    const pid = await ensurePostDetailPage(client, tabId);
    return !!pid;
  } catch {
    return p.path.includes("/comments/");
  }
}
async function browseOne(client, tabId, typeParam, visited) {
  const picked = [];
  const want = Math.random() < 0.2 ? 2 : 1;
  for (let n = 0; n < want; n++) {
    await humanScrollDown(client, tabId, 150 + Math.round(Math.random() * 250));
    await humanPause(600, 1200);
    const items = await evalJSON(client, tabId, JS_RESULT_ITEMS(typeParam)) || [];
    const candidates = items.filter((it) => !visited.has(it.href));
    if (candidates.length === 0) break;
    const idx = clamp(
      Math.round(gaussianRandom(candidates.length / 2, candidates.length / 3)),
      0,
      candidates.length - 1
    );
    const item = candidates[idx];
    visited.add(item.href);
    const beforeUrl = await currentHref(client, tabId);
    console.log(`[search] open detail: ${item.href.slice(0, 70)}`);
    try {
      await humanClickElement(client, tabId, { x: item.x, y: item.y, w: item.w, h: item.h });
    } catch {
    }
    await humanPause(1800, 2800);
    let ok = await verifyDetail(client, tabId, typeParam);
    if (!ok) {
      await humanPause(2e3, 3e3);
      ok = await verifyDetail(client, tabId, typeParam);
    }
    if (ok) {
      if (typeParam !== "communities" && typeParam !== "people") {
        try {
          const r = await browsePost(client, tabId, {
            interest: clamp(0.05 + Math.random() * 0.2, 0.03, 0.28)
          });
          console.log(`[search] browsePost: ${r.status} \u2014 ${r.message}`);
        } catch (e) {
          try {
            await briefBrowseAfterAction(client, tabId);
          } catch {
          }
        }
      } else {
        try {
          await briefBrowseAfterAction(client, tabId);
        } catch {
        }
      }
      await humanPause(1e3, 2500);
      picked.push(item.href);
    } else {
      console.log(`[search] detail not confirmed for ${item.href.slice(0, 50)}`);
    }
    try {
      await goBack(client, tabId);
    } catch {
    }
    await humanPause(1e3, 2e3);
    if (!await isOnSearchPage(client, tabId)) {
      console.log(`[search] back landed off search, restoring URL`);
      try {
        await client.tabNav(tabId, beforeUrl);
        await humanPause(1500, 2500);
      } catch {
      }
    }
    if (want === 2) await humanPause(800, 1500);
  }
  return picked;
}
async function browseAndRotateSort(client, tabId, o) {
  const browsed = [];
  const visited = /* @__PURE__ */ new Set();
  let sortSwitchCount = o.forcedSort ? 1 : 0;
  const SORT_CAP = 3;
  for (let i = 0; i < o.browseCount; i++) {
    if (o.sortable) {
      let doSwitch = false;
      if (i === 0) {
        if (o.browseCount === 1 && !o.forcedSort && sortSwitchCount === 0) doSwitch = true;
      } else {
        if (!o.forcedSort && sortSwitchCount === 0) doSwitch = true;
        else if (sortSwitchCount < SORT_CAP && Math.random() < 0.4) doSwitch = true;
      }
      if (doSwitch) {
        const target = await switchSearchSortRandom(client, tabId);
        if (target) {
          sortSwitchCount++;
          console.log(`[search] rotated sort \u2192 ${target}`);
          await humanPause(1500, 2500);
          await scrollToTopHuman(client, tabId);
          await humanPause(500, 1e3);
        }
      }
    }
    const picked = await browseOne(client, tabId, o.typeParam, visited);
    browsed.push(...picked);
  }
  return { browsed, sortSwitched: sortSwitchCount > 0, sortSwitchCount };
}
async function locateCommunityInResults(client, tabId, name) {
  return locateByJS(client, tabId, JS_COMMUNITY_MATCH(name, "results"));
}
async function locateCommunityInSidebar(client, tabId, name) {
  return locateByJS(client, tabId, JS_COMMUNITY_MATCH(name, "sidebar"));
}
async function searchReddit(client, tabId, options) {
  await ensureTabFocus(client, tabId);
  const urlCheck = await client.pageUrl(tabId);
  if (!urlCheck.url?.includes("reddit.com")) {
    return { status: "invalid_page", message: "not on a Reddit page" };
  }
  const query = (options.query || "").trim();
  if (!query) return { status: "failed", message: "empty query" };
  const type = options.type ?? (Math.random() < 0.5 ? "post" : "media");
  const browseCount = options.browseCount ?? 1 + Math.floor(Math.random() * 3);
  const m1 = Math.random() < 0.7 ? "type" : "paste";
  let enter;
  try {
    enter = await searchEnter(client, tabId, query, { inputMethod: m1 });
  } catch (e1) {
    console.log(`[search] first enter failed (${e1?.message}); retrying other input method`);
    try {
      enter = await searchEnter(client, tabId, query, { inputMethod: m1 === "type" ? "paste" : "type" });
    } catch (e2) {
      return { status: "failed", message: `search did not reach /search/: ${e2?.message}` };
    }
  }
  const searchUrl = enter.url;
  console.log(`[search] landed on ${searchUrl.slice(0, 70)} (input=${enter.inputMethod})`);
  let typeParam;
  try {
    typeParam = await switchToType(client, tabId, type);
  } catch (e) {
    typeParam = TYPE_PARAM[type];
    console.log(`[search] type switch error: ${e?.message}`);
  }
  await scrollToTopHuman(client, tabId);
  await humanPause(800, 1500);
  const sortable = SORTABLE_TYPES.includes(typeParam);
  let forcedSwitched = false;
  if (options.sort && sortable) {
    forcedSwitched = await switchSearchSort(client, tabId, options.sort);
    await scrollToTopHuman(client, tabId);
    await humanPause(800, 1500);
  } else if (options.sort && !sortable) {
    console.log(`[search] --sort ignored: type "${type}" has no sort dropdown`);
  }
  const { browsed, sortSwitched, sortSwitchCount } = await browseAndRotateSort(client, tabId, {
    typeParam,
    browseCount,
    forcedSort: options.sort,
    sortable
  });
  return {
    status: "success",
    message: `searched "${query}" (type=${type}, browsed=${browsed.length})`,
    data: {
      query,
      type,
      typeParam,
      searchUrl,
      inputMethod: enter.inputMethod,
      sortSwitched: forcedSwitched || sortSwitched,
      sortSwitchCount,
      browseCount,
      browsed
    }
  };
}
async function main() {
  const cli = await getCliOptions();
  const tabId = requireTabId();
  const query = getCliArg("query");
  if (!query) {
    console.log(JSON.stringify({ status: "failed", message: "--query is required" }));
    process.exit(1);
  }
  const typeArg = getCliArg("type");
  const sortArg = getCliArg("sort");
  const bcArg = getCliArg("browse-count");
  if (typeArg && !VALID_TYPES.includes(typeArg)) {
    console.log(
      JSON.stringify({ status: "failed", message: `invalid --type "${typeArg}". Valid: ${VALID_TYPES.join(", ")}` })
    );
    process.exit(1);
  }
  if (sortArg && !SORT_VALUES.includes(sortArg)) {
    console.log(
      JSON.stringify({ status: "failed", message: `invalid --sort "${sortArg}". Valid: ${SORT_VALUES.join(", ")}` })
    );
    process.exit(1);
  }
  const browseCount = bcArg ? parseInt(bcArg, 10) : void 0;
  const client = new PinchTabClient({ baseUrl: cli.baseUrl, token: cli.token });
  const result = await searchReddit(client, tabId, {
    query,
    type: typeArg,
    sort: sortArg,
    browseCount: browseCount && browseCount > 0 ? browseCount : void 0
  });
  outputResult(result);
}
runMain(main, "reddit-search.ts");
export {
  locateCommunityInResults,
  locateCommunityInSidebar,
  searchEnter,
  searchReddit,
  switchSearchSort,
  switchToType,
  typeIntoSearchBox
};
