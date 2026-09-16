import { PinchTabClient } from "../api.js";
import {
  humanPause,
  humanClickElement,
  humanType,
  humanReview,
  hoverWithHesitation,
  clearComposerText,
  briefBrowseAfterAction,
  locateByJS,
  locateAndScrollByJS,
  ensureTabFocus,
  ensurePostDetailPage,
  JS_COMMENT_TRIGGER,
  JS_COMPOSER_TEXTAREA,
  JS_SUBMIT_BUTTON,
  JS_CANCEL_BUTTON,
  JS_COMMENT_REPLY_BUTTON,
  JS_COMMENT_POSITION,
  JS_REPLY_TEXTAREA,
  JS_REPLY_SUBMIT,
  JS_TOPLEVEL_TEXT_LEN,
  JS_REPLY_TEXT_LEN
} from "./reddit-human.js";
import { getCliArg, outputResult, getCliOptions, requireTabId, runMain } from "./cli.js";
import { getPostDetail } from "./reddit-post-detail.js";
const kCommentTag = "comment";
async function submitComment(client, tabId, commentText, options) {
  await ensureTabFocus(client, tabId);
  console.log("[comment] starting top-level comment...");
  client.logInfo(tabId, "Starting top-level comment submission", [kCommentTag]);
  if (!await ensurePostDetailPage(client, tabId)) {
    return { status: "invalid_page", message: "not a Reddit post detail page" };
  }
  try {
    const detail = await getPostDetail(client, tabId);
    const findComment = (nodes, text) => {
      for (const c of nodes) {
        if (c.body.trim() === text.trim()) return true;
        if (findComment(c.children, text)) return true;
      }
      return false;
    };
    if (findComment(detail.comments, commentText)) {
      console.log("[comment] similar comment already exists, skipping");
      return {
        status: "skipped",
        message: "similar comment already exists",
        data: { commentText }
      };
    }
  } catch {
  }
  console.log("[comment] locating top-level comment composer...");
  let textarea = await locateAndScrollByJS(
    client,
    tabId,
    JS_COMPOSER_TEXTAREA
  );
  if (textarea) {
    console.log(`[comment] top-level composer already open at (${textarea.x}, ${textarea.y}), reusing`);
    client.logInfo(tabId, "Top-level composer already open, reusing", [kCommentTag]);
  } else {
    console.log("[comment] top-level composer not open, expanding via trigger...");
    const trigger = await locateAndScrollByJS(client, tabId, JS_COMMENT_TRIGGER);
    if (!trigger) {
      console.log("[comment] trigger not visible, scrolling up...");
      let viewportHeight = 800;
      try {
        const { vh } = await client.viewportGet(tabId);
        if (vh) viewportHeight = vh;
      } catch {
      }
      for (let i = 0; i < 5; i++) {
        const wx = 600 + Math.round((Math.random() - 0.5) * 200);
        const wy = 400 + Math.round((Math.random() - 0.5) * 200);
        await client.humanMouseWheelTick(tabId, {
          x: wx,
          y: wy,
          direction: "up"
        });
        await humanPause(300, 500);
        const t = await locateByJS(client, tabId, JS_COMMENT_TRIGGER);
        if (t && t.y >= 50 && t.y <= viewportHeight - 80) {
          await humanClickElement(client, tabId, t, options);
          break;
        }
      }
    } else {
      console.log(`[comment] clicking trigger at (${trigger.x}, ${trigger.y})`);
      client.logInfo(tabId, "Comment box found, clicking to open composer", [
        kCommentTag
      ]);
      await humanClickElement(client, tabId, trigger, options);
    }
    await humanPause(1e3, 2e3);
    textarea = await locateByJS(client, tabId, JS_COMPOSER_TEXTAREA);
    if (!textarea) {
      for (let retry = 0; retry < 3; retry++) {
        await humanPause(800, 1200);
        textarea = await locateByJS(client, tabId, JS_COMPOSER_TEXTAREA);
        if (textarea) break;
      }
    }
    if (!textarea) {
      console.log("[comment] could not locate comment textarea");
      client.logError(
        tabId,
        "Comment textarea not found after expanding composer",
        [kCommentTag]
      );
      await cancelComposer(client, tabId);
      return { status: "failed", message: "could not locate comment textarea" };
    }
  }
  console.log(`[comment] found textarea at (${textarea.x}, ${textarea.y})`);
  await humanClickElement(client, tabId, textarea, options);
  await humanPause(300, 500);
  await clearComposerText(client, tabId, JS_TOPLEVEL_TEXT_LEN);
  console.log(`[comment] typing (${commentText.length} chars)...`);
  client.logInfo(tabId, `Typing comment (${commentText.length} chars)`, [
    kCommentTag
  ]);
  await humanType(client, tabId, commentText);
  console.log("[comment] reviewing typed comment...");
  await humanReview(client, tabId, textarea, commentText.length);
  const verifyResult = await client.evaluateV2(
    tabId,
    `(function(){
    var hosts = document.querySelectorAll('comment-composer-host');
    for (var i = 0; i < hosts.length; i++) {
      if (hosts[i].closest('shreddit-comment[thingid]')) continue;
      var ce = hosts[i].querySelector('[contenteditable="true"]');
      if (ce) { var r = ce.getBoundingClientRect(); if (r.width > 0) return JSON.stringify({text: (ce.textContent || '').trim()}); }
    }
    return JSON.stringify({error: 'no top-level contenteditable'});
  })()`
  );
  const verifyData = typeof verifyResult.result === "string" ? JSON.parse(verifyResult.result) : verifyResult.result;
  const actualText = verifyData?.text || "";
  if (actualText !== commentText.trim()) {
    console.log(
      `[comment] VERIFY FAIL: expected "${commentText}", got "${actualText}"`
    );
    client.logError(
      tabId,
      `Text mismatch: expected "${commentText}", got "${actualText}"`,
      [kCommentTag]
    );
    await cancelComposer(client, tabId);
    return {
      status: "failed",
      message: `text mismatch after typing: expected "${commentText.substring(0, 30)}...", got "${actualText.substring(0, 30)}..."`
    };
  }
  console.log(`[comment] verify OK: text matches`);
  console.log("[comment] locating submit button...");
  const submit = await locateAndScrollByJS(client, tabId, JS_SUBMIT_BUTTON);
  if (!submit) {
    console.log("[comment] could not locate submit button");
    client.logError(tabId, "Submit button not found after typing comment", [
      kCommentTag
    ]);
    await cancelComposer(client, tabId);
    return { status: "failed", message: "could not locate submit button" };
  }
  console.log(`[comment] found submit at (${submit.x}, ${submit.y})`);
  client.logInfo(tabId, "Submitting comment", [kCommentTag]);
  console.log("[comment] submitting comment...");
  await hoverWithHesitation(client, tabId, submit, options);
  const preview = commentText.substring(0, Math.min(30, commentText.length));
  console.log(`[comment] waiting for "${preview}..." to appear in thread`);
  await client.wait(tabId, { text: preview, timeout: 1e4 }).catch(() => {
    console.log("[comment] comment text not found in thread after submit");
  });
  await briefBrowseAfterAction(client, tabId, options);
  console.log("[comment] done");
  client.logInfo(tabId, "Comment submitted", [kCommentTag]);
  return {
    status: "success",
    message: "comment submitted",
    data: { commentText }
  };
}
async function submitReply(client, tabId, thingId, commentText, options) {
  await ensureTabFocus(client, tabId);
  console.log(`[comment] replying to comment ${thingId}...`);
  if (!await ensurePostDetailPage(client, tabId)) {
    return { status: "invalid_page", message: "not a Reddit post detail page" };
  }
  try {
    const detail = await getPostDetail(client, tabId);
    const findComment = (nodes, id) => {
      for (const c of nodes) {
        if (c.thingId === id) return c;
        const found = findComment(c.children, id);
        if (found) return found;
      }
      return void 0;
    };
    const target = findComment(detail.comments, thingId);
    if (target) {
      const alreadyReplied = target.children.some(
        (c) => c.body.trim() === commentText.trim()
      );
      if (alreadyReplied) {
        console.log(
          `[comment] similar reply already exists under ${thingId}, skipping`
        );
        return {
          status: "skipped",
          message: `similar reply already exists under ${thingId}`,
          data: { thingId, commentText }
        };
      }
    }
  } catch {
  }
  let replyTextarea = await locateAndScrollByJS(
    client,
    tabId,
    JS_REPLY_TEXTAREA(thingId)
  );
  if (replyTextarea) {
    console.log(`[comment] reply box for ${thingId} already open at (${replyTextarea.x}, ${replyTextarea.y}), reusing`);
  } else {
    await locateAndScrollByJS(client, tabId, JS_COMMENT_POSITION(thingId));
    await humanPause(500, 1e3);
    console.log("[comment] locating reply button...");
    const replyBtn = await locateAndScrollByJS(
      client,
      tabId,
      JS_COMMENT_REPLY_BUTTON(thingId)
    );
    if (!replyBtn) {
      return {
        status: "failed",
        message: `could not locate reply button for ${thingId}`
      };
    }
    console.log(
      `[comment] clicking reply button at (${replyBtn.x}, ${replyBtn.y})`
    );
    await humanClickElement(client, tabId, replyBtn, options);
    await humanPause(800, 1500);
    replyTextarea = await locateByJS(client, tabId, JS_REPLY_TEXTAREA(thingId));
    if (!replyTextarea) {
      return {
        status: "failed",
        message: `could not locate reply textarea for ${thingId}`
      };
    }
  }
  await humanClickElement(client, tabId, replyTextarea, options);
  await humanPause(300, 500);
  await clearComposerText(client, tabId, JS_REPLY_TEXT_LEN(thingId));
  console.log(`[comment] typing reply (${commentText.length} chars)...`);
  await humanType(client, tabId, commentText);
  await humanReview(client, tabId, replyTextarea, commentText.length);
  const verifyResult = await client.evaluateV2(
    tabId,
    `(function(){
    var el = document.querySelector('shreddit-comment[thingid="${thingId}"]');
    if (!el) return JSON.stringify({error: 'comment not found'});
    var slots = el.querySelectorAll('[slot="comment-composer"], [slot="ready"], [slot="next-reply"]');
    for (var i = 0; i < slots.length; i++) {
      var ce = slots[i].querySelector('[contenteditable="true"]');
      if (ce && ce.getBoundingClientRect().width > 0) return JSON.stringify({text: (ce.textContent || '').trim()});
    }
    return JSON.stringify({error: 'no visible reply textarea'});
  })()`
  );
  const verifyData = typeof verifyResult.result === "string" ? JSON.parse(verifyResult.result) : verifyResult.result;
  const actualText = verifyData?.text || "";
  if (actualText !== commentText.trim()) {
    console.log(
      `[comment] VERIFY FAIL: expected "${commentText}", got "${actualText}"`
    );
    client.logError(
      tabId,
      `Text mismatch: expected "${commentText}", got "${actualText}"`,
      [kCommentTag]
    );
    return {
      status: "failed",
      message: `text mismatch after typing: expected "${commentText.substring(0, 30)}...", got "${actualText.substring(0, 30)}..."`
    };
  }
  console.log(`[comment] verify OK: text matches`);
  console.log("[comment] locating reply submit button...");
  const replySubmit = await locateAndScrollByJS(
    client,
    tabId,
    JS_REPLY_SUBMIT(thingId)
  );
  if (!replySubmit) {
    return {
      status: "failed",
      message: `could not locate reply submit button for ${thingId}`
    };
  }
  console.log("[comment] submitting reply...");
  await hoverWithHesitation(client, tabId, replySubmit, options);
  const preview = commentText.substring(0, Math.min(30, commentText.length));
  await client.wait(tabId, { text: preview, timeout: 1e4 }).catch(() => {
    console.log("[comment] reply text not found after submit");
  });
  await briefBrowseAfterAction(client, tabId, options);
  console.log("[comment] reply done");
  return {
    status: "success",
    message: `reply submitted for ${thingId}`,
    data: { thingId, commentText }
  };
}
async function cancelComposer(client, tabId) {
  console.log("[comment] attempting to cancel composer...");
  try {
    const cancel = await locateByJS(client, tabId, JS_CANCEL_BUTTON);
    if (cancel) {
      await humanClickElement(client, tabId, cancel);
    }
  } catch {
  }
}
async function fetchCommentText(prompt, clientTag) {
  const fnStart = Date.now();
  try {
    const url = "http://10.171.203.126:9555/hermes-chat";
    const reqBody = {
      prompt,
      humanizer: true,
      skills: ["reddit-community-styles"]
    };
    if (clientTag) {
      reqBody.client_tag = clientTag;
    }
    console.log(`[comment] ===== chat API request =====`);
    console.log(`[comment] POST ${url}`);
    console.log(`[comment] request body: ${JSON.stringify(reqBody)}`);
    console.log(`[comment] ===== chat API request end =====`);
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 180 * 1e3);
    let response;
    const fetchStart = Date.now();
    try {
      response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(reqBody),
        signal: controller.signal
      });
    } catch (err) {
      const e = err;
      const elapsedMs = Date.now() - fetchStart;
      let causeDetail = "none";
      if (e.cause) {
        const c = e.cause;
        causeDetail = `name=${c.name ?? ""}, message=${c.message ?? ""}, code=${String(c.code ?? "")}`;
      }
      console.log(`[comment] fetch error: name=${e.name}, message=${e.message}, elapsed=${elapsedMs}ms, cause=[${causeDetail}]`);
      if (e.name === "AbortError") {
        throw new Error("chat API timeout after 180s");
      }
      throw err;
    } finally {
      clearTimeout(timer);
    }
    if (!response.ok) {
      throw new Error(
        `chat API failed: HTTP ${response.status} ${response.statusText}`
      );
    }
    const body = await response.json();
    console.log(`[comment] ===== chat API response =====`);
    console.log(`[comment] HTTP status: ${response.status} ${response.statusText}`);
    console.log(`[comment] response body: ${JSON.stringify(body)}`);
    console.log(`[comment] ===== chat API response end =====`);
    if (body.code !== 0) {
      throw new Error(`chat API error: code=${body.code} message=${body.message}`);
    }
    if (!body.result) {
      throw new Error(`chat API returned no result: ${JSON.stringify(body)}`);
    }
    console.log(`[comment] raw result (${body.result.length} chars)`);
    const beginTag = "===comment begin===";
    const endTag = "===comment end===";
    const beginIdx = body.result.indexOf(beginTag);
    const endIdx = body.result.indexOf(endTag);
    let commentText;
    if (beginIdx >= 0 && endIdx > beginIdx) {
      commentText = body.result.slice(beginIdx + beginTag.length, endIdx).trim();
    } else {
      commentText = "";
    }
    console.log(`[comment] got comment text (${commentText.length} chars)`);
    return commentText;
  } finally {
    console.log(`[comment] fetchCommentText elapsed=${Date.now() - fnStart}ms`);
  }
}
const COMMENT_GEN_RULES = `\u3010\u751F\u6210\u89C4\u5219\u3011
1. \u5FC5\u987B\u5148\u52A0\u8F7D skill_view('reddit-community-styles') \u8BFB\u53D6\u5F53\u524D subreddit \u7684\u793E\u533A\u98CE\u683C\uFF08\u8BCD\u6C47\u3001\u8BED\u6C14\u3001\u5B57\u6570\u4E0A\u9650\uFF09\uFF0C\u4E0D\u53EF\u51ED\u8BB0\u5FC6\u63A8\u65AD\u3002
2. \u8D77\u8349\u8BC4\u8BBA\uFF1A\u56DE\u590D\u8BC4\u8BBA\u65F6\u7ED3\u5408\u5E16\u5B50\u5185\u5BB9\u4E0E\u76EE\u6807\u8BC4\u8BBA\u5185\u5BB9\uFF1B\u8BC4\u8BBA\u4E3B\u5E16\u65F6\u5BF9\u5E16\u5B50\u5185\u5BB9\u505A\u51FA\u53CD\u5E94\u3002\u4E25\u683C\u9075\u5FAA\u793E\u533A\u98CE\u683C\uFF0C\u7981\u6B62\u56FA\u5B9A\u6A21\u677F\u3002
3. \u8BC4\u8BBA\u610F\u601D\u4E0D\u5F97\u4E0E\u5176\u4ED6\u8BC4\u8BBA\u76F8\u540C\u6216\u7C7B\u4F3C\uFF08\u542B\u4E3B\u5E16\u5DF2\u6709\u8BC4\u8BBA\u548C\u5DF2\u751F\u6210\u8BC4\u8BBA\uFF09\uFF0C\u540C\u4E49/\u8FD1\u4E49\u5373\u89C6\u4E3A\u91CD\u590D\uFF0C\u9700\u6539\u5199\u89D2\u5EA6\u6216\u8DF3\u8FC7\u3002
4. \u8BC4\u8BBA\u9996\u5B57\u6BCD\u5FC5\u987B\u5927\u5199\u3002`;
async function main() {
  const cli = await getCliOptions();
  const tabId = requireTabId();
  const replyTarget = getCliArg("reply-target");
  const clientTag = getCliArg("client-tag");
  const client = new PinchTabClient({ baseUrl: cli.baseUrl, token: cli.token });
  console.log("[comment] extracting post detail...");
  let detail;
  try {
    detail = await getPostDetail(client, tabId);
  } catch (err) {
    console.log(JSON.stringify({
      status: "failed",
      message: `Failed to extract post detail: ${err.message}`
    }));
    process.exit(1);
  }
  let prompt;
  try {
    if (replyTarget) {
      const targetIdx = detail.comments.findIndex((c) => c.thingId === replyTarget);
      if (targetIdx > 9) {
        const [target] = detail.comments.splice(targetIdx, 1);
        detail.comments.unshift(target);
      }
    }
    if (detail.comments.length > 10) {
      detail.comments.splice(10);
    }
    for (const c of detail.comments) {
      if (c.thingId === replyTarget) {
        if (c.children.length > 10) {
          c.children.splice(10);
        }
        for (const child of c.children) {
          child.children = [];
        }
      } else {
        c.children = [];
      }
    }
    detail.post.permalink = "";
  } catch {
    console.log("[comment] trim comments failed, using raw detail");
  }
  let detail_str = JSON.stringify(detail);
  if (replyTarget) {
    prompt = `\u6839\u636E\u5E16\u5B50\u5185\u5BB9\u751F\u6210\u8BC4\u8BBA\uFF0C\u56DE\u590DthingId\u4E3A ${replyTarget} \u7684\u8BC4\u8BBA\uFF0C\u5E16\u5B50\u5185\u5BB9\u5982\u4E0B\uFF1A
${detail_str}

${COMMENT_GEN_RULES}

\u8BF7\u7528 ===comment begin=== \u548C ===comment end=== \u5305\u88F9\u4F60\u7684\u8BC4\u8BBA\u5185\u5BB9\uFF0C\u683C\u5F0F\u5982\u4E0B\uFF1A
===comment begin===
\u8BC4\u8BBA\u5185\u5BB9
===comment end===`;
  } else {
    prompt = `\u6839\u636E\u5E16\u5B50\u5185\u5BB9\u751F\u6210\u8BC4\u8BBA\uFF0C\u76F4\u63A5\u56DE\u590D\u4E3B\u8D34\uFF0C\u5E16\u5B50\u5185\u5BB9\u5982\u4E0B\uFF1A
${detail_str}

${COMMENT_GEN_RULES}

\u8BF7\u7528 ===comment begin=== \u548C ===comment end=== \u5305\u88F9\u4F60\u7684\u8BC4\u8BBA\u5185\u5BB9\uFF0C\u683C\u5F0F\u5982\u4E0B\uFF1A
===comment begin===
\u8BC4\u8BBA\u5185\u5BB9
===comment end===`;
  }
  console.log(`[comment] prompt (${prompt.length} chars)`);
  let text;
  // `--text` is documented in reference/script-reference.md but was missing from
  // this build, so every call fell through to the generation service whatever
  // the caller passed. Restoring it: a caller that supplies the comment body
  // uses it, and only a caller that does not still asks the service.
  const suppliedText = getCliArg("text");
  if (suppliedText) {
    console.log(`[comment] using --text (${suppliedText.length} chars), skipping generation`);
    text = suppliedText;
  } else {
  try {
    text = await fetchCommentText(prompt, clientTag);
  } catch (err) {
    console.log(JSON.stringify({
      status: "failed",
      message: `Failed to fetch comment text: ${err.message}`
    }));
    process.exit(1);
  }
  }
  console.log(`[comment] comment text: ${text}`);
  let result;
  if (replyTarget) {
    result = await submitReply(client, tabId, replyTarget, text);
  } else {
    result = await submitComment(client, tabId, text);
  }
  outputResult(result);
}
runMain(main, "reddit-comment.ts");
export {
  submitComment,
  submitReply
};
