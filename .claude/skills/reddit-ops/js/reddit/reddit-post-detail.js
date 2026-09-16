import { PinchTabClient } from "../api.js";
import { ensurePostDetailPage } from "./reddit-human.js";
import { getCliOptions, requireTabId, runMain, processExit } from "./cli.js";
const EXTRACT_DETAIL_JS = `
(function() {
  function parseCount(s) {
    if (!s) return 0;
    s = s.replace(/^Vote\\s*/i, '').trim();
    if (/k$/i.test(s)) return Math.round(parseFloat(s) * 1000);
    if (/m$/i.test(s)) return Math.round(parseFloat(s) * 1000000);
    return parseInt(s) || 0;
  }

  function slotText(el, slotName) {
    var nodes = el.querySelectorAll('[slot="' + slotName + '"]');
    var parts = [];
    var seen = {};
    nodes.forEach(function(n) {
      var t = n.textContent.trim();
      if (t && !seen[t]) { seen[t] = true; parts.push(t); }
    });
    return parts.join('\\n');
  }

  function collectMedia(el, urls) {
    var raw = [];
    el.querySelectorAll('[slot="post-media-container"] img[src]').forEach(function(img) {
      if (img.src && !raw.includes(img.src)) raw.push(img.src);
    });
    el.querySelectorAll('[slot^="page-"] img[src]').forEach(function(img) {
      if (img.src && !raw.includes(img.src)) raw.push(img.src);
    });
    if (el.shadowRoot) {
      el.shadowRoot.querySelectorAll('img[src]').forEach(function(img) {
        if (img.src && !raw.includes(img.src)) raw.push(img.src);
      });
      el.shadowRoot.querySelectorAll('video[src], video source[src]').forEach(function(v) {
        var src = v.src || v.getAttribute('src');
        if (src && !raw.includes(src)) raw.push(src);
      });
    }
    el.querySelectorAll('video[src], video source[src]').forEach(function(v) {
      var src = v.src || v.getAttribute('src');
      if (src && !raw.includes(src)) raw.push(src);
    });
    // Sort: prefer original URLs (i.redd.it) over preview/thumbnail URLs (preview.redd.it)
    raw.sort(function(a, b) {
      var aOrig = /\\/i\\.redd\\.it\\//.test(a) ? 0 : 1;
      var bOrig = /\\/i\\.redd\\.it\\//.test(b) ? 0 : 1;
      return aOrig - bOrig;
    });
    raw.forEach(function(u) { if (!urls.includes(u)) urls.push(u); });
  }

  var postEl = document.querySelector('shreddit-post');
  if (!postEl) return null;

  var postId = postEl.getAttribute('id') || '';
  var title = postEl.getAttribute('post-title') || '';
  var postType = postEl.getAttribute('post-type') || '';
  var author = postEl.getAttribute('author') || '';
  var subreddit = postEl.getAttribute('subreddit-prefixed-name') || '';
  var scoreRaw = postEl.getAttribute('score') || '0';
  var commentCountRaw = postEl.getAttribute('comment-count') || '0';
  var createdAt = postEl.getAttribute('created-timestamp') || '';
  var permalink = postEl.getAttribute('permalink') || '';

  var body = slotText(postEl, 'text-body');

  var urls = [];
  collectMedia(postEl, urls);

  var upvoted = false;
  if (postEl.shadowRoot) {
    var voteBtns = postEl.shadowRoot.querySelectorAll('button[aria-pressed]');
    for (var bi = 0; bi < voteBtns.length; bi++) {
      var svg = voteBtns[bi].querySelector('svg');
      if (svg && svg.getAttribute('icon-name') === 'upvote' && voteBtns[bi].getAttribute('aria-pressed') === 'true') {
        upvoted = true;
        break;
      }
    }
  }

  // 'link' is kept as its own type (external-link post) so callers can branch
  // on it \u2014 browsing a link post means opening the external URL, not reading
  // a text body. Only collapse self-posts and galleries.
  var typeMap = { 'self': 'text', 'gallery': 'image' };
  var mappedType = typeMap[postType] || postType;

  if (mappedType === 'crosspost') {
    var domain = (postEl.getAttribute('domain') || '').toLowerCase();
    if (domain === 'v.redd.it') {
      mappedType = 'video';
    } else if (domain === 'i.redd.it' || domain === 'i.imgur.com') {
      mappedType = 'image';
    }
  }

  var post = {
    postId: postId,
    title: title,
    body: body,
    postType: mappedType,
    author: author,
    subreddit: subreddit,
    score: parseCount(scoreRaw),
    commentCount: parseCount(commentCountRaw),
    createdAt: createdAt,
    permalink: permalink.startsWith('http') ? permalink : 'https://www.reddit.com' + permalink,
    mediaUrls: urls,
    upvoted: upvoted
  };

  var flat = [];
  document.querySelectorAll('shreddit-comment').forEach(function(el) {
    var thingId = el.getAttribute('thingid') || '';
    var parentCommentId = el.getAttribute('parentid') || '';
    var postId = el.getAttribute('postid') || '';
    var cAuthor = el.getAttribute('author') || '[deleted]';
    var cScoreRaw = el.getAttribute('score') || '0';
    var depth = parseInt(el.getAttribute('depth') || '0') || 0;
    var cCreatedAt = el.getAttribute('created') || '';
    var parentId = parentCommentId || postId;
    var voteState = 'NONE';
    var actionRow = el.querySelector('[slot="actionRow"] shreddit-comment-action-row');
    if (actionRow) {
      voteState = actionRow.getAttribute('vote-state') || 'NONE';
    }

    var cBody = '';
    var commentSlot = el.querySelector(':scope > [slot="comment"]');
    if (!commentSlot) {
      // New Reddit UI nests [slot="comment"] under details>div.grid>div.min-w-0,
      // so it is no longer a direct child of shreddit-comment. Pick the FIRST
      // [slot="comment"] belonging to THIS comment \u2014 excluding any nested inside
      // a child shreddit-comment \u2014 so reply bodies don't leak into the parent.
      var slots = el.querySelectorAll('[slot="comment"]');
      for (var si = 0; si < slots.length; si++) {
        var anc = slots[si].parentElement, nested = false;
        while (anc && anc !== el) {
          if (anc.tagName === 'SHREDDIT-COMMENT') { nested = true; break; }
          anc = anc.parentElement;
        }
        if (!nested) { commentSlot = slots[si]; break; }
      }
    }
    if (commentSlot) {
      var bodyDiv = commentSlot.querySelector(':scope > div') || commentSlot;
      var pParts = [];
      bodyDiv.querySelectorAll('p').forEach(function(p) {
        if (!p.closest('blockquote')) {
          var t = p.textContent.trim();
          if (t) pParts.push(t);
        }
      });
      cBody = pParts.join('\\n');
    }

    flat.push({
      thingId: thingId,
      parentId: parentId,
      author: cAuthor,
      body: cBody,
      score: parseCount(cScoreRaw),
      depth: depth,
      createdAt: cCreatedAt,
      voteState: voteState,
      children: []
    });
  });

  var nodeMap = {};
  for (var i = 0; i < flat.length; i++) {
    nodeMap[flat[i].thingId] = flat[i];
  }
  var roots = [];
  for (var i = 0; i < flat.length; i++) {
    var c = flat[i];
    if (c.depth === 0 || c.parentId.indexOf('t3_') === 0) {
      roots.push(c);
    } else if (nodeMap[c.parentId]) {
      nodeMap[c.parentId].children.push(c);
    } else {
      roots.push(c);
    }
  }

  return { post: post, comments: roots };
})()
`;
async function getPostDetail(client, tabId) {
  const result = await client.evaluateV2(tabId, EXTRACT_DETAIL_JS);
  const data = result.result;
  if (!data) throw new Error("failed to extract post detail \u2014 no shreddit-post found");
  if (!data.post) throw new Error("failed to extract post detail \u2014 missing post data");
  return data;
}
async function main() {
  const cli = await getCliOptions();
  const tabId = requireTabId();
  const client = new PinchTabClient({ baseUrl: cli.baseUrl, token: cli.token });
  try {
    const postId = await ensurePostDetailPage(client, tabId);
    if (!postId) {
      console.log(JSON.stringify({ status: "invalid_page", message: "not a Reddit post detail page" }));
      await processExit(1);
    }
    const result = await getPostDetail(client, tabId);
    console.log(JSON.stringify({ status: "success", message: `extracted post ${result.post.postId}`, data: result }));
    await processExit(0);
  } catch (err) {
    const message = err?.message || err?.error || JSON.stringify(err);
    console.log(JSON.stringify({ status: "failed", message }));
    await processExit(1);
  }
}
runMain(main, "reddit-post-detail.ts");
export {
  getPostDetail
};
