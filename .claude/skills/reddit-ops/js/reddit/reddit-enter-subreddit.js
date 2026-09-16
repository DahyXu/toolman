import { PinchTabClient } from "../api.js";
import {
  humanPause,
  humanScrollDown,
  humanClick,
  humanClickElement,
  humanMouseMove,
  locateByJS,
  scrollToTopHuman,
  ensureTabFocus,
  parseEvalResult,
  clamp
} from "./reddit-human.js";
import { getCliArg, outputResult, getCliOptions, requireTabId, runMain } from "./cli.js";
import {
  searchEnter,
  typeIntoSearchBox,
  switchToType,
  locateCommunityInResults,
  locateCommunityInSidebar
} from "./reddit-search.js";
const SPECIAL_FEEDS = ["popular", "news", "explore", "home"];
const FEED_SPECS = {
  popular: {
    hrefMatch: (h) => h.includes("/r/popular"),
    navUrl: "https://www.reddit.com/r/popular",
    urlConfirm: (u) => u.includes("/r/popular")
  },
  news: {
    hrefMatch: (h) => h.includes("/news"),
    navUrl: "https://www.reddit.com/news",
    urlConfirm: (u) => u.includes("/news")
  },
  explore: {
    hrefMatch: (h) => h.includes("/explore"),
    navUrl: "https://www.reddit.com/explore",
    urlConfirm: (u) => u.includes("/explore")
  },
  home: {
    // Home link's href is "/?feed=home", but bare "/" also counts — don't require the query param.
    hrefMatch: (h) => h.includes("feed=home") || h === "/" || h === "https://www.reddit.com/" || h === "https://www.reddit.com",
    navUrl: "https://www.reddit.com/",
    urlConfirm: (u) => /reddit\.com\/(\?|$)/.test(u)
  }
};
function isSpecialFeed(name) {
  return SPECIAL_FEEDS.includes(name.toLowerCase());
}
function feedSpec(name) {
  const f = name.toLowerCase();
  return isSpecialFeed(f) ? FEED_SPECS[f] : null;
}
const JS_SIDEBAR_SUBREDDIT = (name) => `
(function(){var nav=document.querySelector('reddit-sidebar-nav');if(!nav)return null;var links=nav.querySelectorAll('a[href^="/r/"]');var target='/r/${name.toLowerCase()}/';for(var i=0;i<links.length;i++){var href=(links[i].getAttribute('href')||'').toLowerCase();if(href===target||href===target.slice(0,-1)){var r=links[i].getBoundingClientRect();if(r.width>0)return{x:Math.round(r.x+r.width/2),y:Math.round(r.y+r.height/2),w:Math.round(r.width),h:Math.round(r.height)}}}return null})()
`;
const JS_TOP_SECTION_LINKS = `
(function(){var el=document.querySelector('left-nav-top-section');if(!el||!el.shadowRoot)return null;var links=el.shadowRoot.querySelectorAll('a');var out=[];for(var i=0;i<links.length;i++){var r=links[i].getBoundingClientRect();if(r.width>0&&r.height>0){out.push({href:links[i].getAttribute('href')||'',x:Math.round(r.x+r.width/2),y:Math.round(r.y+r.height/2),w:Math.round(r.width),h:Math.round(r.height)})}}return JSON.stringify(out)})()
`;
async function locateTopSectionFeed(client, tabId, spec) {
  const res = await client.evaluateV2(tabId, JS_TOP_SECTION_LINKS);
  const links = parseEvalResult(res.result);
  if (!links) return null;
  for (const l of links) {
    if (spec.hrefMatch(l.href.toLowerCase())) {
      return { x: l.x, y: l.y, w: l.w, h: l.h };
    }
  }
  return null;
}
const JS_SEARCH_INPUT = `
(function(){var search=document.querySelector('reddit-search-large');if(!search||!search.shadowRoot)return null;var input=search.shadowRoot.querySelector('faceplate-search-input');if(!input)return null;var r=input.getBoundingClientRect();return{x:Math.round(r.x+r.width/2),y:Math.round(r.y+r.height/2),w:Math.round(r.width),h:Math.round(r.height)}})()
`;
const JS_SEARCH_RESULT = (name) => `
(function(){var search=document.querySelector('reddit-search-large');if(!search||!search.shadowRoot)return null;var target='/r/${name.toLowerCase()}';var items=search.shadowRoot.querySelectorAll('li a[href^="/r/"]');for(var i=0;i<items.length;i++){var href=(items[i].getAttribute('href')||'').toLowerCase().replace(/\\/+$/,'');if(href===target){var r=items[i].getBoundingClientRect();if(r.width>0&&r.height>0){return{x:Math.round(r.x+r.width/2),y:Math.round(r.y+r.height/2),w:Math.round(r.width),h:Math.round(r.height)}}}}return null})()
`;
const JS_SUBREDDIT_HEADER_DATA = `
(function(){
  var h = document.querySelector('shreddit-subreddit-header');
  if (!h) return JSON.stringify({ error: 'no shreddit-subreddit-header' });
  var result = {};

  // Title from shadow DOM #title element
  if (h.shadowRoot) {
    var titleEl = h.shadowRoot.querySelector('#title');
    if (titleEl) result.title = (titleEl.textContent || '').trim();
  }

  // Description from element attribute
  result.description = h.getAttribute('description') || '';

  // Weekly active users: prefer attribute (raw number), fallback to slot (formatted text)
  result.weeklyActiveUsers = h.getAttribute('weekly-active-users') || '';
  if (!result.weeklyActiveUsers) {
    var activeSlot = h.querySelector('[slot="weekly-active-users-count"]');
    if (activeSlot) result.weeklyActiveUsers = (activeSlot.textContent || '').trim();
  }

  // Weekly contributions
  result.weeklyContributions = h.getAttribute('weekly-contributions') || '';
  if (!result.weeklyContributions) {
    var contribSlot = h.querySelector('[slot="weekly-contributions-count"]');
    if (contribSlot) result.weeklyContributions = (contribSlot.textContent || '').trim();
  }

  // Community details slot (creation date, restriction status, etc.)
  var detailsSlot = h.querySelector('[slot="community-details"]');
  if (detailsSlot) {
    var detailsText = (detailsSlot.textContent || '').trim();
    result.communityDetails = detailsText;
    // Detect restriction status from SVG icon-name (language-independent):
    // The 2nd rpl-tooltip in community-details has icon-name="show" for restricted,
    // icon-name="browser" for public communities.
    var tooltips = detailsSlot.querySelectorAll('rpl-tooltip');
    if (tooltips.length >= 2) {
      var svg = tooltips[1].querySelector('svg');
      if (svg) result.restrictionIcon = svg.getAttribute('icon-name') || '';
      result.isRestricted = result.restrictionIcon === 'show';
    }
  }

  // Page-level checks
  result.hasCreatePostButton = !!document.querySelector('create-post-entry-point-wrapper');
  // protected-community-modal-trigger only appears when restricted \u2192 "\u8BF7\u6C42\u53D1\u5E16" instead of "\u521B\u5EFA\u5E16\u5B50"
  result.hasProtectedPostTrigger = !!document.querySelector('protected-community-modal-trigger');

  return JSON.stringify(result);
})()
`;
async function enterViaTopSection(client, tabId, feed, spec, targetLoc) {
  console.log(`[enter-sub] found ${feed} in top-section at y=${targetLoc.y}`);
  if (Math.random() < 0.15) {
    const altFeeds = SPECIAL_FEEDS.filter((f) => f !== feed);
    const alt = altFeeds[Math.floor(Math.random() * altFeeds.length)];
    const altLoc = await locateTopSectionFeed(client, tabId, FEED_SPECS[alt]);
    if (altLoc) {
      await humanMouseMove(client, tabId, altLoc.x, altLoc.y);
      await humanPause(300, 800);
    }
  }
  try {
    await humanClickElement(client, tabId, targetLoc, { skipMoveAway: true });
    console.log(`[enter-sub] clicked top-section link for ${feed}`);
  } catch (err) {
    const errMsg = err?.message || err?.error || String(err);
    console.log(`[enter-sub] click error (top-section): ${errMsg}`);
    await humanPause(2e3, 3e3);
    try {
      const urlCheck = await client.pageUrl(tabId);
      if (spec.urlConfirm((urlCheck.url ?? "").toLowerCase())) {
        console.log(`[enter-sub] navigation happened despite click error`);
        return;
      }
    } catch {
    }
    console.log(`[enter-sub] falling back to direct navigation`);
    await client.tabNav(tabId, spec.navUrl);
  }
}
async function enterViaSidebar(client, tabId, subreddit, targetLoc) {
  console.log(`[enter-sub] found r/${subreddit} in sidebar at y=${targetLoc.y}`);
  const vpResult = await client.evaluateV2(tabId, `window.innerHeight`);
  const vpRaw = parseEvalResult(vpResult.result);
  const viewportH = Number(vpRaw) || 800;
  if (targetLoc.y > viewportH - 20 || targetLoc.y < 20) {
    const sidebarX = clamp(targetLoc.x, 50, 200);
    const sidebarY = 70;
    await humanClick(client, tabId, sidebarX, sidebarY, { skipMoveAway: true });
    await humanPause(300, 500);
    const scrollNeeded = targetLoc.y > viewportH ? targetLoc.y - viewportH / 2 : -(viewportH / 2 - targetLoc.y);
    const absScroll = Math.abs(scrollNeeded);
    console.log(`[enter-sub] scrolling sidebar ${scrollNeeded > 0 ? "down" : "up"} ${absScroll}px`);
    for (let i = 0; i < 10; i++) {
      const chunk = Math.min(200, absScroll - i * 200);
      if (chunk <= 0) break;
      const key = scrollNeeded > 0 ? "ArrowDown" : "ArrowUp";
      const pressCount = Math.ceil(chunk / 40);
      for (let p = 0; p < pressCount; p++) {
        await client.humanKeyboardPress(tabId, { key });
        await new Promise((r) => setTimeout(r, 50 + Math.round(Math.random() * 50)));
      }
      await humanPause(300, 500);
      const newLoc = await locateByJS(client, tabId, JS_SIDEBAR_SUBREDDIT(subreddit));
      if (newLoc && newLoc.y > 50 && newLoc.y < viewportH - 50) {
        targetLoc.y = newLoc.y;
        targetLoc.x = newLoc.x;
        console.log(`[enter-sub] target now in viewport at y=${newLoc.y}`);
        break;
      }
    }
  }
  if (Math.random() < 0.2) {
    const otherLinks = await client.evaluateV2(
      tabId,
      `(function(){var nav=document.querySelector('reddit-sidebar-nav');if(!nav)return[];var links=nav.querySelectorAll('a[href^="/r/"]');return Array.from(links).filter(function(a){return a.getBoundingClientRect().width>0}).map(function(a){return{x:Math.round(a.getBoundingClientRect().x+a.getBoundingClientRect().width/2),y:Math.round(a.getBoundingClientRect().y+a.getBoundingClientRect().height/2)}}).slice(0,5)})()`
    );
    const coords = parseEvalResult(otherLinks.result) || [];
    if (coords.length > 1) {
      const other = coords[Math.floor(Math.random() * coords.length)];
      await humanMouseMove(client, tabId, other.x, other.y);
      await humanPause(300, 800);
    }
  }
  if (Math.random() < 0.1) {
    await humanMouseMove(client, tabId, targetLoc.x, targetLoc.y);
    await humanPause(200, 400);
    const awayX = clamp(targetLoc.x + 50 + Math.round(Math.random() * 80), 50, 1230);
    const awayY = clamp(targetLoc.y - 30 - Math.round(Math.random() * 40), 50, 800);
    await humanMouseMove(client, tabId, awayX, awayY);
    await humanPause(300, 600);
  }
  try {
    await humanClickElement(client, tabId, targetLoc, { skipMoveAway: true });
    console.log(`[enter-sub] clicked sidebar link for r/${subreddit}`);
  } catch (err) {
    const errMsg = err?.message || err?.error || String(err);
    console.log(`[enter-sub] click error (sidebar): ${errMsg}`);
    await humanPause(2e3, 3e3);
    try {
      const urlCheck = await client.pageUrl(tabId);
      if (urlCheck.url?.toLowerCase().includes(`/r/${subreddit.toLowerCase()}`)) {
        console.log(`[enter-sub] navigation happened despite click error`);
        return;
      }
    } catch {
    }
    console.log(`[enter-sub] falling back to direct navigation`);
    await client.tabNav(tabId, `https://www.reddit.com/r/${subreddit}`, { waitFor: "networkidle" });
  }
}
async function confirmedAtSubreddit(client, tabId, subreddit) {
  try {
    const u = await client.pageUrl(tabId);
    return !!u.url?.toLowerCase().includes(`/r/${subreddit.toLowerCase()}`);
  } catch {
    return false;
  }
}
async function tryEnterViaDropdown(client, tabId, subreddit) {
  console.log("[enter-sub] way-a: dropdown suggestion");
  try {
    const cur = await client.pageUrl(tabId);
    const u = cur.url || "";
    const onHome = /reddit\.com\/?$/.test(u) || /reddit\.com\/\?/.test(u);
    if (!onHome) {
      await client.tabNav(tabId, "https://www.reddit.com/");
      await humanPause(4e3, 6e3);
    }
  } catch {
  }
  const searchLoc = await locateByJS(client, tabId, JS_SEARCH_INPUT);
  if (!searchLoc) throw new Error("could not locate search input");
  await humanClickElement(client, tabId, searchLoc);
  await humanPause(500, 1500);
  await typeIntoSearchBox(client, tabId, subreddit);
  await humanPause(1500, 2500);
  const target = await locateByJS(client, tabId, JS_SEARCH_RESULT(subreddit));
  if (!target) {
    console.log("[enter-sub] way-a: target not in dropdown");
    try {
      await client.humanKeyboardPress(tabId, { key: "Escape" });
    } catch {
    }
    await humanPause(500, 1e3);
    return false;
  }
  try {
    await humanClickElement(client, tabId, target, { skipMoveAway: true });
  } catch {
  }
  await humanPause(2e3, 3e3);
  return await confirmedAtSubreddit(client, tabId, subreddit);
}
async function tryEnterViaCommunitiesTab(client, tabId, subreddit) {
  console.log("[enter-sub] way-b: communities tab");
  await searchEnter(client, tabId, subreddit);
  await switchToType(client, tabId, "community");
  await humanPause(1e3, 2e3);
  const loc = await locateCommunityInResults(client, tabId, subreddit);
  if (!loc) {
    console.log("[enter-sub] way-b: target not in communities tab results");
    return false;
  }
  try {
    await humanClickElement(client, tabId, loc, { skipMoveAway: true });
  } catch {
  }
  await humanPause(2e3, 3e3);
  return await confirmedAtSubreddit(client, tabId, subreddit);
}
async function tryEnterViaSidebarRelated(client, tabId, subreddit) {
  console.log("[enter-sub] way-c: sidebar related community");
  await searchEnter(client, tabId, subreddit);
  await humanPause(1e3, 2e3);
  const loc = await locateCommunityInSidebar(client, tabId, subreddit);
  if (!loc) {
    console.log("[enter-sub] way-c: target not in right sidebar");
    return false;
  }
  try {
    await humanClickElement(client, tabId, loc, { skipMoveAway: true });
  } catch {
  }
  await humanPause(2e3, 3e3);
  return await confirmedAtSubreddit(client, tabId, subreddit);
}
async function enterViaSearch(client, tabId, subreddit) {
  console.log(`[enter-sub] r/${subreddit} not in sidebar, using search`);
  const r = Math.random();
  let order;
  if (r < 0.5) order = ["a", "b", "c"];
  else if (r < 0.75) order = ["b", "c", "a"];
  else order = ["c", "a", "b"];
  for (const way of order) {
    try {
      if (way === "a" && await tryEnterViaDropdown(client, tabId, subreddit)) return "dropdown";
      if (way === "b" && await tryEnterViaCommunitiesTab(client, tabId, subreddit)) return "communities-tab";
      if (way === "c" && await tryEnterViaSidebarRelated(client, tabId, subreddit)) return "sidebar-related";
    } catch (e) {
      console.log(`[enter-sub] way ${way} error: ${e?.message || e}`);
    }
  }
  console.log(`[enter-sub] all search ways failed, navigating directly to /r/${subreddit}`);
  await client.tabNav(tabId, `https://www.reddit.com/r/${subreddit}`, { waitFor: "networkidle" });
  return "direct-nav";
}
async function browseAfterEntry(client, tabId) {
  await scrollToTopHuman(client, tabId);
  await humanPause(1e3, 2e3);
  const scrollPx = 200 + Math.round(Math.random() * 200);
  await humanScrollDown(client, tabId, scrollPx);
  await humanPause(1500, 3e3);
}
async function extractSubredditRawData(client, tabId) {
  try {
    const result = await client.evaluateV2(tabId, JS_SUBREDDIT_HEADER_DATA);
    const raw = result.result;
    if (typeof raw === "string") {
      return JSON.parse(raw);
    }
    return raw;
  } catch (err) {
    console.log(`[enter-sub] raw data extraction failed: ${err?.message || err}`);
    return null;
  }
}
async function enterSubreddit(client, tabId, subreddit, options) {
  await ensureTabFocus(client, tabId);
  const urlResult = await client.pageUrl(tabId);
  if (!urlResult.url?.includes("reddit.com")) {
    return { status: "invalid_page", message: "not on a Reddit page" };
  }
  let method;
  let searchMethod = "";
  const feed = subreddit.toLowerCase();
  const spec = feedSpec(feed);
  if (spec) {
    const topLoc = await locateTopSectionFeed(client, tabId, spec);
    if (topLoc) {
      method = "top-section";
      await enterViaTopSection(client, tabId, feed, spec, topLoc);
    } else {
      console.log(`[enter-sub] ${feed} not found in top-section, navigating directly`);
      method = "top-section";
      await client.tabNav(tabId, spec.navUrl);
    }
  } else {
    const sidebarLoc = await locateByJS(client, tabId, JS_SIDEBAR_SUBREDDIT(subreddit));
    if (sidebarLoc) {
      method = "sidebar";
      await enterViaSidebar(client, tabId, subreddit, sidebarLoc);
    } else {
      method = "search";
      searchMethod = await enterViaSearch(client, tabId, subreddit);
    }
  }
  await humanPause(2e3, 3500);
  let navigated = false;
  let finalUrl = "";
  const isFeed = isSpecialFeed(feed);
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const urlCheck = await client.pageUrl(tabId);
      finalUrl = urlCheck.url ?? "";
      const u = finalUrl.toLowerCase();
      navigated = isFeed ? spec.urlConfirm(u) : u.includes(`/r/${subreddit.toLowerCase()}`);
      if (navigated) break;
    } catch {
      console.log(`[enter-sub] tab busy, retrying URL check (${attempt + 1}/3)`);
    }
    await humanPause(2e3, 3e3);
  }
  if (navigated) {
    await browseAfterEntry(client, tabId);
  }
  let rawData = null;
  if (navigated && options?.extractRawData) {
    rawData = await extractSubredditRawData(client, tabId);
  }
  return {
    status: navigated ? "success" : "failed",
    message: navigated ? isSpecialFeed(feed) ? feed === "home" ? `entered home via ${method}` : `entered /${feed} via ${method}` : `entered r/${subreddit} via ${method}` : isSpecialFeed(feed) ? feed === "home" ? `navigation to home not confirmed` : `navigation to /${feed} not confirmed` : `navigation to r/${subreddit} not confirmed`,
    data: {
      subreddit,
      method,
      searchMethod,
      navigated,
      url: finalUrl,
      ...rawData ? { rawData } : {}
    }
  };
}
async function main() {
  const cli = await getCliOptions();
  const tabId = requireTabId();
  const subreddit = getCliArg("subreddit");
  if (!subreddit) {
    console.log(JSON.stringify({ status: "failed", message: "--subreddit is required" }));
    process.exit(1);
  }
  const extractRawData = process.argv.includes("--raw-data");
  const client = new PinchTabClient({ baseUrl: cli.baseUrl, token: cli.token });
  const result = await enterSubreddit(client, tabId, subreddit, { extractRawData });
  outputResult(result);
}
runMain(main, "reddit-enter-subreddit.ts");
export {
  enterSubreddit,
  extractSubredditRawData
};
