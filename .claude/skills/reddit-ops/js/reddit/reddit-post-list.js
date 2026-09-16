import { PinchTabClient } from "../api.js";
import {
  humanPause,
  humanScrollDown,
  quickScrollDown,
  humanMouseMove,
  readingTremor,
  randomViewportPosition,
  ensureTabFocus,
  clamp,
  gaussianRandom,
  symmetricNormal,
  simulateTabSwitch
} from "./reddit-human.js";
import { getCliArg, outputResult, getCliOptions, requireTabId, runMain } from "./cli.js";
import { listingImageLightbox, listingVideoWatch, listingGalleryBrowse } from "./reddit-listing-media.js";
import { listingUpvote } from "./reddit-upvote.js";
import { listingShare, shouldShare, shouldUpvote } from "./reddit-share.js";
const kPostListTag = "post-list";
const DEFAULT_MAX_POSTS = 20;
const ATTR_BLACKLIST = /* @__PURE__ */ new Set([
  // CSS / styling (huge strings)
  "class",
  "style",
  "icon-url",
  "award-icon-url",
  "avatar-icon-url",
  "community-icon-url"
]);
function JS_EXTRACT_POSTS(seenIds, blacklist) {
  const blacklistJS = JSON.stringify(blacklist);
  const seenJS = JSON.stringify(seenIds);
  return `
(function(){
  var blacklist = new Set(${blacklistJS});
  var seen = new Set(${seenJS});
  var posts = document.querySelectorAll('shreddit-post');
  var results = [];

  function slotText(el, slotName) {
    var nodes = el.querySelectorAll('[slot="' + slotName + '"]');
    var parts = [];
    nodes.forEach(function(n) {
      var t = n.textContent.trim();
      if (t) parts.push(t);
    });
    return parts.join(' ').replace(/\\s+/g, ' ').trim();
  }

  function collectMedia(el) {
    var urls = [];
    el.querySelectorAll('[slot="post-media-container"] img[src]').forEach(function(img) {
      if (img.src && urls.indexOf(img.src) === -1) urls.push(img.src);
    });
    el.querySelectorAll('[slot^="page-"] img[src]').forEach(function(img) {
      if (img.src && urls.indexOf(img.src) === -1) urls.push(img.src);
    });
    el.querySelectorAll('[slot="poster"] img[src]').forEach(function(img) {
      if (img.src && urls.indexOf(img.src) === -1) urls.push(img.src);
    });
    if (el.shadowRoot) {
      el.shadowRoot.querySelectorAll('img[src]').forEach(function(img) {
        if (img.src && urls.indexOf(img.src) === -1) urls.push(img.src);
      });
      el.shadowRoot.querySelectorAll('video[src], video source[src]').forEach(function(v) {
        var src = v.src || v.getAttribute('src');
        if (src && urls.indexOf(src) === -1) urls.push(src);
      });
    }
    return urls;
  }

  // Content-tag check (NSFW / Spoiler). Reddit renders these as boolean
  // attributes on shreddit-post (present \u21D2 tagged, value is ""), mirrored on
  // the inner <shreddit-content-tags>. Check both so the flag still resolves
  // if Reddit moves it to the tags element only.
  function hasTag(el, tagName) {
    if (el.hasAttribute(tagName)) return true;
    var ct = el.querySelector('shreddit-content-tags');
    return !!(ct && ct.hasAttribute(tagName));
  }

  for (var i = 0; i < posts.length; i++) {
    var el = posts[i];
    var id = el.getAttribute('id') || '';
    if (!id || seen.has(id)) continue;
    var attrs = {};
    for (var j = 0; j < el.attributes.length; j++) {
      var name = el.attributes[j].name;
      if (blacklist.has(name)) continue;
      var value = el.attributes[j].value;
      // Truncate very long values (e.g. post-title can be hundreds of chars)
      attrs[name] = value.length > 300 ? value.substring(0, 300) : value;
    }
    // Computed fields \u2014 not DOM attributes, extracted from element content
    attrs.body = slotText(el, 'text-body');
    attrs.mediaUrls = collectMedia(el);
    // Content-tag flags. The raw nsfw/spoiler attributes are collected above
    // as "" (empty) when present \u2014 overwrite with explicit true/false so the
    // agent can tell a tagged post (nsfw=true / spoiler=true) from a plain
    // one (false), instead of parsing empty-string-vs-absent.
    attrs.nsfw = hasTag(el, 'nsfw');
    attrs.spoiler = hasTag(el, 'spoiler');
    results.push(attrs);
  }
  return JSON.stringify(results);
})()
`;
}
async function performListingAction(client, tabId, post, upvoteEnabled = false) {
  const postId = post["id"];
  if (!postId) return;
  const type = post["post-type"] || "";
  const postInterest = clamp(0.5 + 0.25 * symmetricNormal(), 0, 1);
  try {
    let r = null;
    if (type === "image") {
      r = await listingImageLightbox(client, tabId, postId, postInterest);
    } else if (type === "gallery") {
      r = await listingGalleryBrowse(client, tabId, postId, postInterest);
    } else if (type === "video") {
      r = await listingVideoWatch(client, tabId, postId, postInterest);
    }
    if (r) {
      console.log(`[list] in-feed ${type} on ${postId}: ${r.status} \u2014 ${r.message}`);
    }
  } catch (e) {
    client.logWarn(tabId, `[list] media action failed: ${e?.message || e}`, [kPostListTag]);
  }
  if (upvoteEnabled && shouldUpvote(postInterest)) {
    try {
      const r = await listingUpvote(client, tabId, postId);
      console.log(`[list] upvote ${postId}: ${r.status}`);
    } catch (e) {
      client.logWarn(tabId, `[list] upvote failed: ${e?.message || e}`, [kPostListTag]);
    }
  }
  if (shouldShare(postInterest)) {
    try {
      const r = await listingShare(client, tabId, postId);
      console.log(`[list] share ${postId}: ${r.status}`);
    } catch (e) {
      client.logWarn(tabId, `[list] share failed: ${e?.message || e}`, [kPostListTag]);
    }
  }
}
async function browsePostList(client, tabId, maxPosts = DEFAULT_MAX_POSTS, baseInterest, upvoteEnabled = false) {
  await ensureTabFocus(client, tabId);
  let onListing = true;
  try {
    const g = await client.evaluateV2(
      tabId,
      `(function(){return !/\\/comments\\//.test(location.pathname) && document.querySelectorAll('shreddit-post').length > 1;})()`
    );
    onListing = !!g.result;
  } catch {
  }
  if (!onListing) {
    return { status: "invalid_page", message: "not a Reddit listing page" };
  }
  const interest = baseInterest ?? clamp(gaussianRandom(0.5, 0.2), 0, 1);
  const vp = await client.viewportGet(tabId);
  const vh = vp.vh;
  let scrollYMax = vp.scrollY;
  const startPos = randomViewportPosition();
  await humanMouseMove(client, tabId, startPos.x, startPos.y);
  await humanPause(300, 800);
  console.log(
    `[list] start (vh=${vh}px, interest=${interest.toFixed(2)}, maxPosts=${maxPosts})`
  );
  client.logInfo(tabId, `Starting post list scrape (maxPosts=${maxPosts})`, [kPostListTag]);
  const blacklistArr = Array.from(ATTR_BLACKLIST);
  const seenIds = [];
  const allPosts = [];
  let tabSwitched = false;
  let staleRounds = 0;
  const maxRounds = clamp(Math.round(vh < 800 ? 25 : 35), 20, 40);
  client.logInfo(tabId, "Starting scroll phase", [kPostListTag]);
  for (let round = 0; round < maxRounds && allPosts.length < maxPosts; round++) {
    const scrollFraction = interest > 0.6 ? 0.12 + Math.random() * 0.15 : interest > 0.3 ? 0.22 + Math.random() * 0.2 : 0.35 + Math.random() * 0.3;
    const scrollPx = Math.round(vh * scrollFraction);
    await humanScrollDown(client, tabId, scrollPx, {
      readPauseProbability: interest > 0.5 ? 0.4 : 0.15,
      scrollBackProbability: interest > 0.5 ? 0.1 : 0.03,
      noReadingFollow: false
    });
    await humanPause(400, 1e3);
    try {
      const v = await client.viewportGet(tabId);
      if (v.scrollY > scrollYMax) scrollYMax = v.scrollY;
    } catch {
    }
    const result = await client.evaluateV2(tabId, JS_EXTRACT_POSTS(seenIds, blacklistArr));
    const raw = result.result;
    if (!raw || raw === "[]") {
      staleRounds++;
      const vpCheck = await client.viewportGet(tabId);
      if (vpCheck.atBottom) {
        console.log(`[list] round ${round + 1}: bottom reached, ${allPosts.length} posts`);
        break;
      }
      if (staleRounds >= 3) {
        const aggressivePx = Math.round(vh * (0.6 + Math.random() * 0.4));
        console.log(`[list] round ${round + 1}: ${staleRounds} stale, aggressive scroll ${aggressivePx}px`);
        await quickScrollDown(client, tabId, aggressivePx);
        await humanPause(800, 1500);
      } else if (staleRounds >= 2) {
        const extraPx = Math.round(vh * (0.25 + Math.random() * 0.15));
        console.log(`[list] round ${round + 1}: ${staleRounds} stale, extra scroll ${extraPx}px`);
        await humanScrollDown(client, tabId, extraPx, {
          readPauseProbability: 0.05,
          scrollBackProbability: 0,
          noReadingFollow: true
        });
        await humanPause(500, 1e3);
      }
      if (staleRounds >= 6) {
        console.log(`[list] round ${round + 1}: ${staleRounds} stale, feed exhausted`);
        client.logWarn(tabId, `Feed exhausted after ${staleRounds} stale rounds`, [kPostListTag]);
        break;
      }
      continue;
    }
    staleRounds = 0;
    let batch;
    try {
      batch = typeof raw === "string" ? JSON.parse(raw) : raw;
    } catch {
      continue;
    }
    for (const post of batch) {
      if (post.id && !seenIds.includes(post.id)) {
        seenIds.push(post.id);
        allPosts.push(post);
        await performListingAction(client, tabId, post, upvoteEnabled);
      }
    }
    console.log(`[list] round ${round + 1}: +${batch.length} new, ${allPosts.length}/${maxPosts} total; scroll=${scrollPx}px`);
    if (batch.length > 0) {
      client.logInfo(tabId, `Found ${allPosts.length} posts so far`, [kPostListTag]);
    }
    if (Math.random() < (interest > 0.5 ? 0.4 : 0.15)) {
      const pauseMs = clamp(gaussianRandom(1500, 800), 600, 4e3);
      await readingTremor(client, tabId);
      await humanPause(pauseMs, pauseMs);
    }
    if (!tabSwitched && Math.random() < 0.06) {
      await simulateTabSwitch(client, tabId);
      tabSwitched = true;
    }
    if (Math.random() < 0.3) {
      const driftPos = randomViewportPosition();
      await humanMouseMove(client, tabId, driftPos.x, driftPos.y);
    }
  }
  console.log(`[list] done: ${allPosts.length} posts (${maxPosts} target, interest=${interest.toFixed(2)}, deepest=${scrollYMax}px)`);
  client.logInfo(tabId, `Post list scrape done: ${allPosts.length} posts collected, browsed to ${scrollYMax}px`, [kPostListTag]);
  return {
    status: "success",
    message: `collected ${allPosts.length} posts`,
    data: {
      posts: allPosts,
      total: allPosts.length,
      interest: Math.round(interest * 100) / 100,
      // Furthest scrollY reached while browsing. Pass to post-click
      // (--browse-end-scroll) so it bounds its search to [0, browseEndScrollY]
      // instead of chasing the infinite feed. See findPostInDOM in reddit-post-click.ts.
      browseEndScrollY: scrollYMax
    }
  };
}
async function main() {
  const cli = await getCliOptions();
  const tabId = requireTabId();
  const maxPostsStr = getCliArg("max-posts");
  const maxPosts = maxPostsStr ? parseInt(maxPostsStr, 10) || DEFAULT_MAX_POSTS : DEFAULT_MAX_POSTS;
  const interestStr = getCliArg("interest");
  const interest = interestStr ? clamp(parseFloat(interestStr), 0, 1) : void 0;
  const upvoteEnabled = getCliArg("enable-upvote") !== void 0;
  const client = new PinchTabClient({ baseUrl: cli.baseUrl, token: cli.token });
  const result = await browsePostList(client, tabId, maxPosts, interest, upvoteEnabled);
  outputResult(result);
}
runMain(main, "reddit-post-list.ts");
export {
  browsePostList
};
