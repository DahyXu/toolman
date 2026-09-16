import { PinchTabClient } from "../api.js";
import { getCliArg, getCliOptions, runMain } from "./cli.js";
const EXTRACT_FIRST_POST_JS = `
(function() {
  // Find the first post in user's profile
  var postEl = document.querySelector('shreddit-post');
  if (!postEl) return null;

  var postId = postEl.getAttribute('id') || '';
  var title = postEl.getAttribute('post-title') || '';
  var subreddit = postEl.getAttribute('subreddit-prefixed-name') || '';
  var createdAt = postEl.getAttribute('created-timestamp') || '';
  var permalink = postEl.getAttribute('permalink') || '';
  var scoreRaw = postEl.getAttribute('score') || '0';
  var commentCountRaw = postEl.getAttribute('comment-count') || '0';
  var postType = postEl.getAttribute('post-type') || '';

  function parseCount(s) {
    if (!s) return 0;
    s = s.replace(/^Votes*/i, '').trim();
    if (/k$/i.test(s)) return Math.round(parseFloat(s) * 1000);
    if (/m$/i.test(s)) return Math.round(parseFloat(s) * 1000000);
    return parseInt(s) || 0;
  }

  return {
    postId: postId,
    title: title,
    subreddit: subreddit,
    createdAt: createdAt,
    permalink: permalink.startsWith('http') ? permalink : 'https://www.reddit.com' + permalink,
    score: parseCount(scoreRaw),
    commentCount: parseCount(commentCountRaw),
    postType: postType
  };
})()
`;
async function getUserLastPost(client, tabId) {
  await new Promise((r) => setTimeout(r, 2e3));
  const result = await client.evaluateV2(tabId, EXTRACT_FIRST_POST_JS);
  const data = result.result;
  if (!data || !data.postId) {
    return null;
  }
  return data;
}
async function main() {
  const cli = await getCliOptions();
  const instanceId = getCliArg("instance-id");
  const userUrl = getCliArg("user-url");
  if (!instanceId || !userUrl) {
    throw new Error("--instance-id and --user-url are required");
  }
  const client = new PinchTabClient({ baseUrl: cli.baseUrl, token: cli.token });
  const tabs = await client.instanceTabsList(instanceId);
  let tab = tabs.find((t) => t.url?.includes("/user/"));
  const submittedUrl = userUrl.replace(/\/$/, "") + "/submitted/";
  if (tab) {
    await client.tabNav(tab.tabId, submittedUrl, { waitFor: "networkidle" });
  } else {
    tab = await client.instanceTabsOpen(instanceId, submittedUrl);
  }
  console.log(`tabId: ${tab.tabId}`);
  await new Promise((r) => setTimeout(r, 3e3));
  const postInfo = await getUserLastPost(client, tab.tabId);
  if (!postInfo) {
    console.log(JSON.stringify({
      status: "no_posts",
      message: "no posts found on user profile"
    }));
    return;
  }
  console.log(JSON.stringify({
    status: "success",
    message: `found post ${postInfo.postId}`,
    data: postInfo
  }));
}
runMain(main, "reddit-user-last-post.ts");
export {
  getUserLastPost
};
