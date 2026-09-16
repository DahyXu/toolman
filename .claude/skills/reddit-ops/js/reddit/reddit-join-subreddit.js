import { PinchTabClient } from "../api.js";
import {
  humanPause,
  humanScrollDown,
  scrollToTop,
  hoverWithHesitation,
  briefBrowseAfterAction,
  randomViewportPosition,
  humanMouseMove,
  readingTremor,
  ensureTabFocus,
  parseEvalResult,
  clamp
} from "./reddit-human.js";
import { outputResult, getCliOptions, requireTabId, runMain } from "./cli.js";
import { clickPost } from "./reddit-post-click.js";
import { browsePost } from "./reddit-browse-post.js";
import { goBack } from "./reddit-back.js";
const JS_JOIN_BUTTON = `
(function(){
  var headerBtns = document.querySelector('shreddit-subreddit-header-buttons');
  if (!headerBtns || !headerBtns.shadowRoot) return null;
  var joinBtn = headerBtns.shadowRoot.querySelector('shreddit-join-button');
  if (!joinBtn || !joinBtn.shadowRoot) return null;
  var btn = joinBtn.shadowRoot.querySelector('button');
  if (!btn) return null;
  var r = btn.getBoundingClientRect();
  var cls = btn.className || '';
  var joined = cls.indexOf('button-bordered') !== -1 && cls.indexOf('button-primary') === -1;
  return {
    x: Math.round(r.x + r.width / 2),
    y: Math.round(r.y + r.height / 2),
    w: Math.round(r.width),
    h: Math.round(r.height),
    joined: joined,
    text: btn.textContent.trim()
  };
})()
`;
const JS_SUBREDDIT_NAME = `
(function(){
  var header = document.querySelector('shreddit-subreddit-header');
  if (!header) return null;
  return header.getAttribute('name') || header.getAttribute('display-name') || null;
})()
`;
const JS_COLLECT_POST_IDS = `
(function(){
  var posts = document.querySelectorAll('shreddit-post');
  var results = [];
  for (var i = 0; i < posts.length; i++) {
    var p = posts[i];
    var r = p.getBoundingClientRect();
    if (r.height > 0 && p.id) {
      results.push({ id: p.id, postType: p.getAttribute('post-type') || '' });
    }
  }
  return results;
})()
`;
async function findJoinButton(client, tabId) {
  const result = await client.evaluateV2(tabId, JS_JOIN_BUTTON);
  return parseEvalResult(result.result);
}
async function getSubredditName(client, tabId) {
  const result = await client.evaluateV2(tabId, JS_SUBREDDIT_NAME);
  const raw = result.result;
  return typeof raw === "string" ? raw : null;
}
async function clickJoinButton(client, tabId) {
  for (let attempt = 0; attempt < 3; attempt++) {
    const btn = await findJoinButton(client, tabId);
    if (!btn) continue;
    if (btn.joined) return true;
    console.log(`[join-sub] clicking Join button (attempt ${attempt + 1})`);
    const loc = { x: btn.x, y: btn.y, w: btn.w, h: btn.h };
    await hoverWithHesitation(client, tabId, loc, { skipMoveAway: true });
    await humanPause(800, 1500);
    const updated = await findJoinButton(client, tabId);
    if (updated?.joined) {
      console.log("[join-sub] verified: button state is now joined");
      return true;
    }
    console.log(`[join-sub] attempt ${attempt + 1} failed, retrying...`);
  }
  return false;
}
async function collectVisiblePosts(client, tabId) {
  const result = await client.evaluateV2(tabId, JS_COLLECT_POST_IDS);
  const posts = parseEvalResult(result.result);
  return posts || [];
}
function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}
async function browseListingOnly(client, tabId) {
  console.log("[join-sub] browsing: listing scroll only");
  const scrollPx = 200 + Math.round(Math.random() * 400);
  await humanScrollDown(client, tabId, scrollPx);
  await humanPause(1500, 3e3);
  if (Math.random() < 0.4) {
    await readingTremor(client, tabId);
    await humanPause(800, 2e3);
  }
  if (Math.random() < 0.3) {
    const extraPx = 150 + Math.round(Math.random() * 300);
    await humanScrollDown(client, tabId, extraPx);
    await humanPause(1e3, 2500);
  }
  if (Math.random() < 0.35) {
    const pos = randomViewportPosition();
    await humanMouseMove(client, tabId, pos.x, pos.y);
    await humanPause(500, 1200);
  }
}
async function browsePosts(client, tabId, postCount, joinOnLastDetail) {
  console.log(`[join-sub] browsing: ${postCount} posts, joinOnLastDetail=${joinOnLastDetail}`);
  let posts = await collectVisiblePosts(client, tabId);
  if (posts.length === 0) {
    await humanScrollDown(client, tabId, 300 + Math.round(Math.random() * 200));
    await humanPause(1e3, 2e3);
    posts = await collectVisiblePosts(client, tabId);
  }
  if (posts.length === 0) {
    console.log("[join-sub] no posts found, skipping post browsing");
    return false;
  }
  const count = clamp(postCount, 1, Math.min(postCount, posts.length));
  const selected = shuffle(posts).slice(0, count);
  console.log(`[join-sub] selected ${selected.length} posts: ${selected.map((p) => p.id).join(", ")}`);
  let joinedOnDetail = false;
  for (let i = 0; i < selected.length; i++) {
    const post = selected[i];
    const isLast = i === selected.length - 1;
    console.log(`[join-sub] clicking post ${post.id} (${i + 1}/${selected.length})`);
    try {
      await clickPost(client, tabId, post.id);
    } catch (err) {
      console.log(`[join-sub] clickPost failed for ${post.id}: ${err?.message || err}`);
      continue;
    }
    await humanPause(1e3, 2e3);
    try {
      const interest = clamp(0.3 + Math.random() * 0.5, 0.2, 0.9);
      await browsePost(client, tabId, { interest });
    } catch (err) {
      console.log(`[join-sub] browsePost failed: ${err?.message || err}`);
    }
    if (joinOnLastDetail && isLast) {
      const btn = await findJoinButton(client, tabId);
      if (btn && !btn.joined) {
        await clickJoinButton(client, tabId);
        joinedOnDetail = true;
        await humanPause(1e3, 2e3);
      }
    }
    if (!isLast || !joinedOnDetail) {
      try {
        await goBack(client, tabId);
        await humanPause(1500, 3e3);
      } catch (err) {
        console.log(`[join-sub] goBack failed: ${err?.message || err}`);
      }
    }
  }
  return joinedOnDetail;
}
async function joinSubreddit(client, tabId, checkedOnly = false) {
  await ensureTabFocus(client, tabId);
  const btnInfo = await findJoinButton(client, tabId);
  if (!btnInfo) {
    return { status: "invalid_page", message: "not on a subreddit page or Join button not found" };
  }
  const name = await getSubredditName(client, tabId);
  if (checkedOnly) {
    return {
      status: btnInfo.joined ? "skipped" : "success",
      message: btnInfo.joined ? `already joined r/${name || "unknown"}` : `not yet joined r/${name || "unknown"}`,
      data: { subreddit: name, joined: btnInfo.joined }
    };
  }
  if (btnInfo.joined) {
    return {
      status: "skipped",
      message: `already joined r/${name || "unknown"}`,
      data: { subreddit: name, joined: true }
    };
  }
  const subredditName = await getSubredditName(client, tabId);
  console.log(`[join-sub] joining r/${subredditName || "unknown"} (button text: ${btnInfo.text})`);
  const entryPoint = Math.random() < 0.5 ? "listing" : "detail";
  const mustBrowse = entryPoint === "detail";
  const browseBehavior = mustBrowse ? "posts" : Math.random() < 0.5 ? "scroll" : "posts";
  const postCount = 1;
  console.log(`[join-sub] plan: entry=${entryPoint}, browse=${browseBehavior}${browseBehavior === "posts" ? ` (${postCount} posts)` : ""}`);
  await humanPause(800, 2e3);
  let joinedOnDetail = false;
  if (browseBehavior === "scroll") {
    await browseListingOnly(client, tabId);
  } else {
    joinedOnDetail = await browsePosts(client, tabId, postCount, entryPoint === "detail");
  }
  if (joinedOnDetail) {
    await briefBrowseAfterAction(client, tabId);
    return {
      status: "success",
      message: `joined r/${subredditName} via detail page`,
      data: {
        subreddit: subredditName,
        joined: true,
        entryPoint: "detail",
        browseBehavior,
        postsBrowsed: browseBehavior === "posts" ? postCount : 0
      }
    };
  }
  if (entryPoint === "listing") {
    await scrollToTop(client, tabId);
    await humanPause(500, 1500);
  } else {
    console.log("[join-sub] detail entry failed, falling back to listing");
    await scrollToTop(client, tabId);
    await humanPause(500, 1500);
  }
  const joined = await clickJoinButton(client, tabId);
  if (joined) {
    await briefBrowseAfterAction(client, tabId);
  }
  return {
    status: joined ? "success" : "failed",
    message: joined ? `joined r/${subredditName} via listing page` : `failed to join r/${subredditName} \u2014 button state did not change`,
    data: {
      subreddit: subredditName,
      joined,
      entryPoint,
      browseBehavior,
      postsBrowsed: browseBehavior === "posts" ? postCount : 0
    }
  };
}
async function main() {
  const cli = await getCliOptions();
  const tabId = requireTabId();
  const client = new PinchTabClient({ baseUrl: cli.baseUrl, token: cli.token });
  const checkedOnly = process.argv.includes("--checked");
  const result = await joinSubreddit(client, tabId, checkedOnly);
  outputResult(result);
}
runMain(main, "reddit-join-subreddit.ts");
export {
  joinSubreddit
};
