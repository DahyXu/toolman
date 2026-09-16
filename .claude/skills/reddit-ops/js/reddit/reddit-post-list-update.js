import { PinchTabClient } from "../api.js";
import { getCliArg, outputResult, getCliOptions, requireTabId, runMain } from "./cli.js";
const kPostListUpdateTag = "post-list-update";
const DEFAULT_MAX_POSTS = 20;
const ATTR_BLACKLIST = /* @__PURE__ */ new Set([
  "class",
  "style",
  "icon-url",
  "award-icon-url",
  "avatar-icon-url",
  "community-icon-url"
]);
function JS_EXTRACT_POSTS(blacklist, maxPosts) {
  const blacklistJS = JSON.stringify(blacklist);
  return `
(function(){
  var blacklist = new Set(${blacklistJS});
  var max = ${maxPosts === 0 ? "Infinity" : maxPosts};
  var posts = document.querySelectorAll('shreddit-post');
  var results = [];
  // Content-tag check (NSFW / Spoiler). Present as boolean attributes on
  // shreddit-post (value ""), mirrored on <shreddit-content-tags>.
  function hasTag(el, tagName) {
    if (el.hasAttribute(tagName)) return true;
    var ct = el.querySelector('shreddit-content-tags');
    return !!(ct && ct.hasAttribute(tagName));
  }

  for (var i = 0; i < posts.length && results.length < max; i++) {
    var el = posts[i];
    var id = el.getAttribute('id') || '';
    if (!id) continue;
    var attrs = {};
    for (var j = 0; j < el.attributes.length; j++) {
      var name = el.attributes[j].name;
      if (blacklist.has(name)) continue;
      var value = el.attributes[j].value;
      attrs[name] = value.length > 300 ? value.substring(0, 300) : value;
    }
    // Content-tag flags: normalize the empty-string nsfw/spoiler attributes
    // to explicit true/false so agents can distinguish tagged vs plain posts.
    attrs.nsfw = hasTag(el, 'nsfw');
    attrs.spoiler = hasTag(el, 'spoiler');
    results.push(attrs);
  }
  return JSON.stringify(results);
})()
`;
}
async function updatePostList(client, tabId, maxPosts = DEFAULT_MAX_POSTS) {
  client.logInfo(tabId, `Updating post list (max=${maxPosts})`, [kPostListUpdateTag]);
  const blacklistArr = Array.from(ATTR_BLACKLIST);
  const result = await client.evaluateV2(tabId, JS_EXTRACT_POSTS(blacklistArr, maxPosts));
  const raw = result.result;
  let posts = [];
  if (raw && raw !== "[]") {
    try {
      posts = typeof raw === "string" ? JSON.parse(raw) : raw;
    } catch {
      return { status: "failed", message: "failed to parse post data", data: { posts: [] } };
    }
  }
  client.logInfo(tabId, `Extracted ${posts.length} posts from DOM`, [kPostListUpdateTag]);
  return {
    status: "success",
    message: `extracted ${posts.length} posts`,
    data: { posts, total: posts.length }
  };
}
async function main() {
  const cli = await getCliOptions();
  const tabId = requireTabId();
  const maxPostsStr = getCliArg("max-posts");
  const maxPosts = maxPostsStr ? parseInt(maxPostsStr, 10) || DEFAULT_MAX_POSTS : DEFAULT_MAX_POSTS;
  const client = new PinchTabClient({ baseUrl: cli.baseUrl, token: cli.token });
  const result = await updatePostList(client, tabId, maxPosts);
  outputResult(result);
}
runMain(main, "reddit-post-list-update.ts");
export {
  updatePostList
};
