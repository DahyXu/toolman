import { PinchTabClient } from "../api.js";
import {
  humanPause,
  briefBrowseAfterAction,
  hoverWithHesitation,
  locateByJS,
  locateAndScrollByJS,
  ensureTabFocus,
  ensurePostDetailPage,
  JS_POST_UPVOTE,
  JS_COMMENT_UPVOTE
} from "./reddit-human.js";
import { getCliArg, outputResult, getCliOptions, requireTabId, runMain } from "./cli.js";
import { getPostDetail } from "./reddit-post-detail.js";
const kUpvoteTag = "upvote";
async function upvotePost(client, tabId, postId, options) {
  await ensureTabFocus(client, tabId);
  console.log("[upvote] starting post upvote...");
  client.logInfo(tabId, "Starting post upvote", [kUpvoteTag]);
  const detectedPostId = await ensurePostDetailPage(client, tabId);
  if (!detectedPostId) {
    return { status: "invalid_page", message: "not a Reddit post detail page" };
  }
  if (!postId) postId = detectedPostId;
  try {
    const detail = await getPostDetail(client, tabId);
    if (detail.post.upvoted) {
      console.log("[upvote] post already upvoted, skipping");
      return { status: "skipped", message: `post ${postId} already upvoted`, data: { postId, upvoted: true } };
    }
  } catch {
  }
  console.log(`[upvote] targeting post ${postId}`);
  let loc = await locateAndScrollByJS(
    client,
    tabId,
    JS_POST_UPVOTE(postId)
  );
  if (!loc) {
    console.log("[upvote] not found, scrolling and retrying...");
    await humanPause(300, 600);
    loc = await locateByJS(client, tabId, JS_POST_UPVOTE(postId));
  }
  if (!loc) {
    client.logError(tabId, `Upvote button not found for post ${postId}`, [kUpvoteTag]);
    return { status: "failed", message: `could not locate upvote button for post ${postId}` };
  }
  console.log(`[upvote] found button at (${loc.x}, ${loc.y}), size ${loc.w}x${loc.h}`);
  client.logInfo(tabId, `Upvote button found at (${loc.x}, ${loc.y})`, [kUpvoteTag]);
  logVoteState(loc);
  const wasPressed = loc.attrs?.["aria-pressed"] === "true";
  await hoverWithHesitation(client, tabId, loc, options);
  await humanPause(500, 1e3);
  const after = await locateByJS(client, tabId, JS_POST_UPVOTE(postId));
  let upvoted = false;
  if (after) {
    const nowPressed = after.attrs?.["aria-pressed"] === "true";
    upvoted = nowPressed;
    if (nowPressed !== wasPressed) {
      console.log("[upvote] vote state changed successfully");
      client.logInfo(tabId, `Upvote clicked, vote state changed`, [kUpvoteTag]);
    } else {
      console.log("[upvote] vote state unchanged (may already be voted or not logged in)");
      client.logWarn(tabId, "Vote state unchanged after click", [kUpvoteTag]);
    }
  }
  await briefBrowseAfterAction(client, tabId, options);
  console.log("[upvote] done");
  client.logInfo(tabId, `Upvote done (upvoted=${upvoted})`, [kUpvoteTag]);
  return { status: "success", message: `upvoted post ${postId}`, data: { postId, upvoted } };
}
async function upvoteComment(client, tabId, thingId, options) {
  await ensureTabFocus(client, tabId);
  console.log(`[upvote] upvoting comment ${thingId}...`);
  if (!await ensurePostDetailPage(client, tabId)) {
    return { status: "invalid_page", message: "not a Reddit post detail page" };
  }
  try {
    const detail = await getPostDetail(client, tabId);
    const findComment = (nodes) => {
      for (const c of nodes) {
        if (c.thingId === thingId) return c;
        const found = findComment(c.children);
        if (found) return found;
      }
      return void 0;
    };
    const comment = findComment(detail.comments);
    if (comment && comment.voteState === "UP") {
      console.log(`[upvote] comment ${thingId} already upvoted, skipping`);
      return { status: "skipped", message: `comment ${thingId} already upvoted`, data: { thingId, voteState: "UP" } };
    }
  } catch {
  }
  let loc = await locateAndScrollByJS(
    client,
    tabId,
    JS_COMMENT_UPVOTE(thingId)
  );
  if (!loc) {
    console.log("[upvote] not found, retrying...");
    await humanPause(300, 600);
    loc = await locateByJS(client, tabId, JS_COMMENT_UPVOTE(thingId));
  }
  if (!loc) {
    return { status: "failed", message: `could not locate upvote button for comment ${thingId}` };
  }
  console.log(`[upvote] found comment button at (${loc.x}, ${loc.y})`);
  await hoverWithHesitation(client, tabId, loc, options);
  await briefBrowseAfterAction(client, tabId, options);
  console.log("[upvote] done");
  return { status: "success", message: `upvoted comment ${thingId}`, data: { thingId, voteState: "UP" } };
}
async function listingUpvote(client, tabId, postId, options) {
  await ensureTabFocus(client, tabId);
  console.log(`[upvote] starting listing upvote for ${postId}...`);
  client.logInfo(tabId, `Starting listing upvote for ${postId}`, [kUpvoteTag]);
  let loc = await locateAndScrollByJS(client, tabId, JS_POST_UPVOTE(postId));
  if (!loc) {
    await humanPause(300, 600);
    loc = await locateByJS(client, tabId, JS_POST_UPVOTE(postId));
  }
  if (!loc) {
    client.logError(tabId, `Upvote button not found for post ${postId}`, [kUpvoteTag]);
    return { status: "failed", message: `could not locate upvote button for post ${postId}` };
  }
  if (loc.attrs?.["aria-pressed"] === "true") {
    console.log(`[upvote] post ${postId} already upvoted, skipping`);
    return { status: "skipped", message: `post ${postId} already upvoted`, data: { postId, upvoted: true } };
  }
  console.log(`[upvote] found listing button at (${loc.x}, ${loc.y})`);
  await hoverWithHesitation(client, tabId, loc, options);
  await humanPause(500, 1e3);
  const after = await locateByJS(client, tabId, JS_POST_UPVOTE(postId));
  const upvoted = after?.attrs?.["aria-pressed"] === "true";
  if (upvoted) {
    console.log(`[upvote] listing vote state changed`);
    client.logInfo(tabId, `Listing upvote applied`, [kUpvoteTag]);
  } else {
    client.logWarn(tabId, "Listing vote state unchanged (may not be logged in)", [kUpvoteTag]);
  }
  await briefBrowseAfterAction(client, tabId, options);
  return { status: "success", message: `upvoted post ${postId}`, data: { postId, upvoted } };
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
function logVoteState(loc) {
  if (loc.attrs) {
    const pressed = loc.attrs["aria-pressed"];
    console.log(`[upvote] current state: aria-pressed=${pressed}`);
  }
}
async function main() {
  const cli = await getCliOptions();
  const tabId = requireTabId();
  const client = new PinchTabClient({ baseUrl: cli.baseUrl, token: cli.token });
  const thingId = getCliArg("thing-id");
  let result;
  if (thingId) {
    result = await upvoteComment(client, tabId, thingId);
  } else {
    const postId = getCliArg("post-id");
    const onListing = await isListingPage(client, tabId);
    if (onListing && postId) {
      result = await listingUpvote(client, tabId, postId);
    } else {
      result = await upvotePost(client, tabId, postId);
    }
  }
  outputResult(result);
}
runMain(main, "reddit-upvote.ts");
export {
  listingUpvote,
  upvoteComment,
  upvotePost
};
