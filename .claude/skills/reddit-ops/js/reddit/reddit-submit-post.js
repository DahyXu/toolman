import { PinchTabClient } from "../api.js";
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import {
  humanPause,
  humanClickElement,
  humanType,
  humanReview,
  hoverWithHesitation,
  briefBrowseAfterAction,
  humanScrollDown,
  ensureTabFocus,
  locateByJS,
  locateAndScrollByJS,
  simulateTabSwitch,
  parseEvalResult,
  JS_POST_TYPE_TAB,
  JS_SUBMIT_TITLE,
  JS_SUBMIT_BODY,
  JS_SUBMIT_POST_BUTTON,
  JS_SAVE_DRAFT_BUTTON,
  JS_CREATE_POST_HEADER,
  JS_CREATE_POST_SIDEBAR,
  JS_IS_SUBREDDIT_PAGE,
  JS_TAG_TRIGGER_BUTTON,
  JS_LIST_FLAIRS,
  JS_FLAIR_LOCATION_BY_TEXT,
  JS_EXPAND_ALL_FLAIRS_LOCATION,
  JS_TAG_SWITCH_LOCATION,
  JS_FLAIR_APPLY_LOCATION,
  JS_FLAIR_CANCEL_LOCATION,
  JS_SUBMIT_ERROR,
  JS_SUBMIT_TITLE_VALUE,
  createTabSwitchScheduler,
  settleAfterLoad,
  clickBlankArea,
  mouseScanReview,
  refocusAndBlurTitle
} from "./reddit-human.js";
import { getCliArg, outputResult, getCliOptions, requireTabId, runMain } from "./cli.js";
import { enterSubreddit } from "./reddit-enter-subreddit.js";
const kTag = "submit-post";
const FLAIR_CACHE_DIR = join(import.meta.dirname, "flairs");
function loadFlairCache(subreddit) {
  try {
    const file = join(FLAIR_CACHE_DIR, `${subreddit}.json`);
    if (!existsSync(file)) return null;
    return JSON.parse(readFileSync(file, "utf-8"));
  } catch {
    return null;
  }
}
function saveFlairCache(subreddit, flairs, meta) {
  try {
    if (!existsSync(FLAIR_CACHE_DIR)) mkdirSync(FLAIR_CACHE_DIR, { recursive: true });
    const entry = {
      subreddit,
      bodyRequired: meta.bodyRequired,
      flairsRequired: meta.flairsRequired,
      flairsAllowed: meta.flairsAllowed,
      spoilerAllowed: meta.spoilerAllowed,
      flairs,
      cachedAt: (/* @__PURE__ */ new Date()).toISOString()
    };
    writeFileSync(join(FLAIR_CACHE_DIR, `${subreddit}.json`), JSON.stringify(entry, null, 2));
  } catch {
  }
}
const JS_REDDIT_LOGO = `
(function(){var el=document.querySelector('#reddit-logo');if(!el)el=document.querySelector('a[href="https://www.reddit.com/"]');if(!el)return null;var r=el.getBoundingClientRect();if(r.width===0)return null;return{x:Math.round(r.left+r.width/2),y:Math.round(r.top+r.height/2),w:Math.round(r.width),h:Math.round(r.height)}})()
`;
const HU_CLICK_UPLOAD_BTN = `js:(function(){
  function box(r){return {found:true,x:Math.round(r.left+r.width/2),y:Math.round(r.top+r.height/2),w:Math.round(r.width),h:Math.round(r.height)}}
  function pierce(root,sel){var rs=Array.prototype.slice.call(root.querySelectorAll(sel));var all=root.querySelectorAll('*');for(var i=0;i<all.length;i++){if(all[i].shadowRoot)rs=rs.concat(pierce(all[i].shadowRoot,sel))}return rs}
  var media=document.querySelector('r-post-media-input');
  if(media&&media.shadowRoot){var btn=media.shadowRoot.querySelector('button')||media.shadowRoot.querySelector('#fileInputInnerWrapper');if(btn){var r=btn.getBoundingClientRect();if(r.width>0&&r.height>0)return box(r)}}
  var host=pierce(document,'post-composer-toolbar-button-image')[0];
  if(host&&host.shadowRoot){var btns=pierce(host.shadowRoot,'button');for(var i=0;i<btns.length;i++){var r=btns[i].getBoundingClientRect();if(r.width>0)return box(r)}}
  return null;
})()`;
const JS_IMAGE_INPUT_SELECTOR = `js:(function(){
  function pierce(root,sel){var rs=Array.prototype.slice.call(root.querySelectorAll(sel));var all=root.querySelectorAll('*');for(var i=0;i<all.length;i++){if(all[i].shadowRoot)rs=rs.concat(pierce(all[i].shadowRoot,sel))}return rs}
  var media=document.querySelector('r-post-media-input');
  if(media&&media.shadowRoot){var mr=media.getBoundingClientRect();if(mr.width>0&&mr.height>0){var is=media.shadowRoot.querySelectorAll('input[type="file"]');for(var i=0;i<is.length;i++){if((is[i].accept||'').includes('image'))return is[i]}}}
  var host=pierce(document,'post-composer-toolbar-button-image')[0];
  if(host&&host.shadowRoot){var fis=pierce(host.shadowRoot,'input[type="file"]');for(var i=0;i<fis.length;i++){if((fis[i].accept||'').includes('image'))return fis[i]}if(fis.length)return fis[0]}
  return null;
})()`;
const JS_POST_ELIGIBILITY_MODAL = `
(function(){var m=document.querySelector('rpl-modal-card#post-eligibility-content');if(!m)return null;var r=m.getBoundingClientRect();if(r.width===0)return null;var titleEl=m.querySelector('[slot="title"]');var bodyEl=m.querySelector('faceplate-tracker p');var reqItems=m.querySelectorAll('ul li');var title=titleEl?(titleEl.textContent||'').trim():'';var body=bodyEl?(bodyEl.textContent||'').trim():'';var reqs=[];for(var i=0;i<reqItems.length;i++){var t=(reqItems[i].textContent||'').trim().replace(/\\s+/g,' ');if(t.length>3)reqs.push(t)}var btns=m.querySelectorAll('button');var buttons=[];for(var i=0;i<btns.length;i++){var b=btns[i];var br=b.getBoundingClientRect();var bt=(b.textContent||'').trim();if(bt&&br.width>0)buttons.push({text:bt,x:Math.round(br.left+br.width/2),y:Math.round(br.top+br.height/2),w:Math.round(br.width),h:Math.round(br.height)})}return JSON.stringify({title:title,body:body,requirements:reqs,buttons:buttons})})()
`;
const JS_CAROUSEL_NEXT = `
(function(){var el=document.querySelector('r-post-media-input');if(!el||!el.shadowRoot)return null;var btn=el.shadowRoot.querySelector('#media-carousel-next');if(!btn)return null;var r=btn.getBoundingClientRect();if(r.width===0)return null;return{x:Math.round(r.left+r.width/2),y:Math.round(r.top+r.height/2),w:Math.round(r.width),h:Math.round(r.height)}})()
`;
const JS_CAROUSEL_PREV = `
(function(){var el=document.querySelector('r-post-media-input');if(!el||!el.shadowRoot)return null;var btn=el.shadowRoot.querySelector('#media-carousel-prev');if(!btn)return null;var r=btn.getBoundingClientRect();if(r.width===0)return null;return{x:Math.round(r.left+r.width/2),y:Math.round(r.top+r.height/2),w:Math.round(r.width),h:Math.round(r.height)}})()
`;
const JS_FORM_IS_EMPTY = `
(function(){function qsa(root,sel){var rs=Array.from(root.querySelectorAll(sel));var all=root.querySelectorAll('*');for(var i=0;i<all.length;i++){if(all[i].shadowRoot)rs=rs.concat(qsa(all[i].shadowRoot,sel))}return rs}
var titleEls=qsa(document,'textarea[name="title"]');
var titleEmpty=true;
for(var ti=0;ti<titleEls.length;ti++){var tr=titleEls[ti].getBoundingClientRect();if(tr.width>0){titleEmpty=(titleEls[ti].value||'').trim().length===0;break}}
var bodyEls=qsa(document,'[contenteditable="true"][role="textbox"]');
var bodyEmpty=true;
for(var i=0;i<bodyEls.length;i++){var r=bodyEls[i].getBoundingClientRect();if(r.width>0){bodyEmpty=(bodyEls[i].textContent||'').trim().length===0;break}}
var imagesEmpty=true;
var mediaEl=document.querySelector('r-post-media-input');
if(mediaEl&&mediaEl.shadowRoot){var nextBtn=mediaEl.shadowRoot.querySelector('#media-carousel-next');if(nextBtn){var nr=nextBtn.getBoundingClientRect();if(nr.width>0&&nr.height>0)imagesEmpty=false}}
return titleEmpty&&bodyEmpty&&imagesEmpty;
})()
`;
const JS_SCAN_REQUIRED = `
(function(){var r={titleRequired:true};var bc=document.getElementById('post-composer_bodytext');r.bodyRequired=bc?bc.getAttribute('aria-required')==='true':false;var fm=document.getElementById('post-flair-modal');r.flairRequired=fm?fm.hasAttribute('flairs-required'):false;return JSON.stringify(r)})()
`;
function chooseImageTextOrder(hasImages, hasBody) {
  if (!hasImages) return "text-first";
  if (!hasBody) return "images-first";
  const r = Math.random();
  if (r < 0.3) return "images-first";
  if (r < 0.65) return "text-first";
  return "interleaved";
}
function chooseFlairOrder() {
  const r = Math.random();
  if (r < 0.3) return "flair-first";
  if (r < 0.6) return "flair-after-title";
  return "flair-last";
}
function planUploadBatches(images) {
  const n = images.length;
  if (n <= 1) return [images];
  const r = Math.random();
  if (r < 0.5) return [images];
  if (r < 0.8) {
    const mid = Math.floor(n / 2) + (Math.random() < 0.5 ? -1 : 1);
    const split = Math.max(1, Math.min(n - 1, mid));
    return [images.slice(0, split), images.slice(split)];
  }
  return images.map((img) => [img]);
}
function shouldMidwaySave(ctx) {
  if (ctx.bodyProgress > 100 && Math.random() < 0.15) return true;
  if (ctx.imagesUploaded > 0 && Math.random() < 0.2) return true;
  return false;
}
async function scanRequiredFields(client, activeTabId, options) {
  const missing = [];
  const data = {};
  const cacheKey = options.subreddit || "";
  const cached = cacheKey ? loadFlairCache(cacheKey) : null;
  let bodyRequired = false;
  if (cached) {
    bodyRequired = cached.bodyRequired;
  } else {
    const result = await client.evaluateV2(activeTabId, JS_SCAN_REQUIRED);
    const req = parseEvalResult(result?.result ?? result);
    bodyRequired = req?.bodyRequired ?? false;
  }
  if (bodyRequired && !options.body) {
    missing.push("body text is required");
    data.bodyRequired = true;
  }
  if (cached) {
    if (cached.flairsRequired && !options.flair) {
      missing.push("flair is required");
      data.flairRequired = true;
      console.log(`[submit-post] using cached data for r/${cacheKey}`);
      data.flairs = cached.flairs;
    }
  } else if (cacheKey) {
    const result = await client.evaluateV2(activeTabId, JS_SCAN_REQUIRED);
    const req = parseEvalResult(result?.result ?? result);
    bodyRequired = req?.bodyRequired ?? false;
    if (req?.flairRequired && !options.flair) {
      missing.push("flair is required");
      data.flairRequired = true;
      console.log("[submit-post] flair is required but not provided, fetching list...");
      const tagList = await listPostTags(client, activeTabId);
      const flairs = tagList.flairs.filter((f) => f.text !== "No flair").map((f) => f.text);
      data.flairs = flairs;
      saveFlairCache(cacheKey, flairs, {
        bodyRequired,
        flairsRequired: tagList.flairsRequired,
        flairsAllowed: tagList.flairsAllowed,
        spoilerAllowed: tagList.spoilerAllowed
      });
    } else if ((!req?.flairRequired || options.flair) && !missing.length) {
      saveFlairCache(cacheKey, [], {
        bodyRequired,
        flairsRequired: req?.flairRequired ?? false,
        flairsAllowed: true,
        spoilerAllowed: true
      });
    }
  }
  if (missing.length === 0) return null;
  console.log(`[submit-post] missing required fields: ${missing.join(", ")}`);
  return {
    status: "failed",
    message: missing.join("; "),
    data
  };
}
async function checkSubmitFormContent(client, activeTabId) {
  const result = await client.evaluateV2(activeTabId, JS_FORM_IS_EMPTY);
  const isEmpty = parseEvalResult(result?.result ?? result);
  return isEmpty !== true;
}
async function navigateToSubmitPage(client, activeTabId, subreddit) {
  const pageResult = await client.pageUrl(activeTabId);
  const currentUrl = typeof pageResult === "string" ? pageResult : typeof pageResult?.url === "string" ? pageResult.url : "";
  let skipNavigation = false;
  if (currentUrl.includes("/submit")) {
    if (subreddit) {
      const expectedPath = `/r/${subreddit.toLowerCase()}/submit`;
      const urlLower = currentUrl.toLowerCase();
      if (!urlLower.includes(expectedPath)) {
        console.log(
          `[submit-post] on submit page but wrong subreddit, clicking logo to go home...`
        );
        const logo = await locateByJS(client, activeTabId, JS_REDDIT_LOGO);
        if (logo) {
          await humanClickElement(client, activeTabId, logo);
          await humanPause(2e3, 3500);
        }
      }
    }
    const formCheck = await client.evaluateV2(
      activeTabId,
      `(function(){return !!document.querySelector('r-post-composer-form')})()`
    );
    const hasForm = parseEvalResult(formCheck?.result ?? formCheck) === true;
    if (hasForm) {
      const hasContent = await checkSubmitFormContent(client, activeTabId);
      if (!hasContent) {
        console.log("[submit-post] already on blank submit page, proceeding directly");
        skipNavigation = true;
      } else {
        console.log("[submit-post] form has residual content, going home to start fresh...");
        const logo = await locateByJS(client, activeTabId, JS_REDDIT_LOGO);
        if (logo) {
          await humanClickElement(client, activeTabId, logo);
          await humanPause(2e3, 3500);
        }
      }
    } else {
      console.log("[submit-post] submit page URL but no form found, refreshing...");
      await client.reload(activeTabId);
      await humanPause(3e3, 5e3);
    }
  }
  if (!skipNavigation) {
    const isSubResult = await client.evaluateV2(activeTabId, JS_IS_SUBREDDIT_PAGE);
    const isOnSubreddit = parseEvalResult(isSubResult?.result ?? isSubResult) === true;
    if (!isOnSubreddit && subreddit) {
      console.log(`[submit-post] navigating to r/${subreddit} first...`);
      const enterResult = await enterSubreddit(client, activeTabId, subreddit);
      if (enterResult.status === "failed") {
        console.log(
          "[submit-post] enterSubreddit failed, navigating directly..."
        );
        await client.tabNav(activeTabId, `https://www.reddit.com/r/${subreddit}/`);
        await humanPause(2e3, 4e3);
      }
    } else if (!isOnSubreddit && !subreddit) {
      return {
        status: "failed",
        message: "not on a subreddit page and no --subreddit provided"
      };
    }
    const useHeader = Math.random() < 0.55;
    const jsExpr = useHeader ? JS_CREATE_POST_HEADER : JS_CREATE_POST_SIDEBAR;
    const label = useHeader ? "header" : "sidebar";
    console.log(`[submit-post] clicking ${label} create-post entry...`);
    let entry = await locateAndScrollByJS(client, activeTabId, jsExpr);
    if (!entry) {
      const fallbackJs = useHeader ? JS_CREATE_POST_SIDEBAR : JS_CREATE_POST_HEADER;
      const fallbackLabel = useHeader ? "sidebar" : "header";
      console.log(
        `[submit-post] ${label} entry not found, trying ${fallbackLabel}...`
      );
      entry = await locateAndScrollByJS(client, activeTabId, fallbackJs);
    }
    if (entry) {
      await humanClickElement(client, activeTabId, entry, { skipMoveAway: true });
    } else {
      const sub = subreddit || "all";
      console.log(
        "[submit-post] no entry found, navigating directly to submit..."
      );
      await client.tabNav(
        activeTabId,
        `https://www.reddit.com/r/${sub}/submit?type=TEXT`
      );
    }
    try {
      await client.wait(activeTabId, { url: "/submit", timeout: 1e4 });
    } catch {
    }
    await humanPause(1500, 3e3);
  }
  await humanPause(1e3, 2e3);
  const eligibilityRaw = await client.evaluateV2(activeTabId, JS_POST_ELIGIBILITY_MODAL);
  const eligibility = parseEvalResult(eligibilityRaw?.result ?? eligibilityRaw);
  if (eligibility?.title) {
    const reqText = eligibility.requirements.length > 0 ? eligibility.requirements.join(" | ") : "";
    console.log(`[submit-post] post eligibility blocked: ${eligibility.title}`);
    return {
      status: "failed",
      message: `${eligibility.title}\u3002${eligibility.body} \u8981\u6C42\uFF1A${reqText}`,
      data: { reason: "post_eligibility", ...eligibility }
    };
  }
  return { status: "success", message: "navigated to submit page" };
}
async function validateSubmitPage(client, activeTabId) {
  const result = await client.evaluateV2(
    activeTabId,
    `
    (function(){return !!document.querySelector('r-post-composer-form')})()
  `
  );
  return parseEvalResult(result?.result ?? result) === true;
}
async function switchToImageMode(client, activeTabId, options) {
  console.log("[submit-post] switching to IMAGE mode...");
  const tab = await locateAndScrollByJS(
    client,
    activeTabId,
    JS_POST_TYPE_TAB("IMAGE")
  );
  if (!tab) {
    console.log("[submit-post] IMAGE tab not found");
    return;
  }
  await humanClickElement(client, activeTabId, tab, options);
  try {
    await client.wait(activeTabId, { url: "type=IMAGE", timeout: 5e3 });
  } catch {
  }
  await humanPause(500, 1e3);
}
function splitTitleText(text) {
  if (!text) return { first: "", second: "" };
  const words = text.match(/\s*\S+\s*/g);
  if (!words || words.length <= 1) {
    const mid = Math.floor(text.length * (0.4 + Math.random() * 0.2));
    return { first: text.slice(0, mid), second: text.slice(mid) };
  }
  const targetIdx = Math.max(1, Math.floor(words.length * (0.4 + Math.random() * 0.2)));
  return {
    first: words.slice(0, targetIdx).join(""),
    second: words.slice(targetIdx).join("")
  };
}
async function typeTitleText(client, activeTabId, text, midHook) {
  const { first, second } = splitTitleText(text);
  if (first) await humanType(client, activeTabId, first);
  if (midHook) await midHook();
  if (second) await humanType(client, activeTabId, second);
}
async function typeTitle(client, activeTabId, title, options = {}) {
  const { midHook, review = true, humanConfig } = options;
  console.log("[submit-post] locating title input...");
  const titleLoc = await locateAndScrollByJS(client, activeTabId, JS_SUBMIT_TITLE);
  if (!titleLoc) {
    return { status: "failed", message: "could not locate title input" };
  }
  console.log(`[submit-post] typing title (${title.length} chars)...`);
  await humanClickElement(client, activeTabId, titleLoc, humanConfig);
  await humanPause(1e3, 2500);
  await typeTitleText(client, activeTabId, title, midHook);
  if (review) {
    await humanReview(client, activeTabId, titleLoc, title.length);
  }
  return { status: "success", message: "title typed" };
}
async function readTitleValue(client, activeTabId) {
  try {
    const r = await client.evaluateV2(activeTabId, JS_SUBMIT_TITLE_VALUE);
    const v = parseEvalResult(r?.result ?? r) ?? "";
    return (v || "").trim().length;
  } catch {
    return 0;
  }
}
async function verifyTitleBeforeSubmit(client, activeTabId, expectedTitle) {
  const result = await client.evaluateV2(activeTabId, JS_SUBMIT_TITLE_VALUE);
  const actual = parseEvalResult(result?.result ?? result) ?? "";
  if (actual.trim() !== expectedTitle.trim()) {
    console.log(`[submit-post] title mismatch \u2014 aborting submit. expected="${expectedTitle}" actual="${actual}"`);
    return {
      status: "failed",
      message: `\u6807\u9898\u6587\u6848\u4E0E\u9884\u671F\u4E0D\u4E00\u81F4\uFF0C\u653E\u5F03\u63D0\u4EA4\uFF1Aexpected="${expectedTitle}", actual="${actual}"`,
      data: { expected: expectedTitle, actual }
    };
  }
  console.log("[submit-post] title verified, matches expected");
  return null;
}
async function deleteTitleText(client, activeTabId) {
  await client.humanKeyboardPress(activeTabId, { key: "End" });
  await humanPause(100, 200);
  let remaining = await readTitleValue(client, activeTabId);
  if (remaining === 0) {
    console.log("[submit-post] (wrong-title) title already empty");
    return { status: "success", message: "title cleared" };
  }
  console.log(`[submit-post] (wrong-title) clearing ${remaining} chars with Backspace...`);
  const BATCH = 8;
  let noProgress = 0;
  for (let batch = 0; batch < 30; batch++) {
    const count = Math.min(BATCH, remaining + 3);
    for (let i = 0; i < count; i++) {
      await client.humanKeyboardPress(activeTabId, { key: "Backspace" });
      await humanPause(15, 55);
    }
    await humanPause(80, 150);
    const now = await readTitleValue(client, activeTabId);
    if (now === 0) {
      console.log(`[submit-post] (wrong-title) cleared after ${batch + 1} batches`);
      return { status: "success", message: "title cleared" };
    }
    if (now >= remaining) {
      noProgress++;
      if (noProgress >= 3) {
        console.log(`[submit-post] (wrong-title) Backspace stalled at ${now} chars, aborting`);
        return {
          status: "failed",
          message: `Backspace \u65E0\u6CD5\u6E05\u7A7A\u6807\u9898\u6587\u6848\uFF08\u5361\u5728 ${now} \u5B57\uFF09\uFF0C\u6309\u7EA6\u5B9A\u653E\u5F03\u63D0\u4EA4`,
          data: { remainingChars: now }
        };
      }
    } else {
      noProgress = 0;
    }
    remaining = now;
  }
  console.log(`[submit-post] (wrong-title) exhausted batches, ${remaining} chars remain`);
  return {
    status: "failed",
    message: `Backspace \u65E0\u6CD5\u6E05\u7A7A\u6807\u9898\u6587\u6848\uFF08\u5269\u4F59 ${remaining} \u5B57\uFF09\uFF0C\u6309\u7EA6\u5B9A\u653E\u5F03\u63D0\u4EA4`,
    data: { remainingChars: remaining }
  };
}
async function typeTitleWithMistake(client, activeTabId, wrongTitle, correctTitle, scheduler, options) {
  const wrongMidHook = async () => {
    if (Math.random() < 0.3) await humanPause(1500, 3500);
    await scheduler.maybeSwitch("mid-wrong");
  };
  const correctMidHook = async () => {
    if (Math.random() < 0.3) await humanPause(1500, 3500);
    await scheduler.maybeSwitch("mid-correct");
  };
  console.log("[submit-post] (wrong-title) locating title input...");
  const titleLoc = await locateAndScrollByJS(client, activeTabId, JS_SUBMIT_TITLE);
  if (!titleLoc) {
    return { status: "failed", message: "could not locate title input" };
  }
  await humanClickElement(client, activeTabId, titleLoc, options);
  await humanPause(1e3, 2500);
  console.log(`[submit-post] (wrong-title) typing wrong title (${wrongTitle.length} chars)...`);
  await typeTitleText(client, activeTabId, wrongTitle, wrongMidHook);
  console.log("[submit-post] (wrong-title) blurring title field...");
  await clickBlankArea(client, activeTabId);
  console.log("[submit-post] (wrong-title) hesitating after wrong title...");
  await humanPause(2e3, 5e3);
  await scheduler.maybeSwitch("post-wrong");
  const titleLoc2 = await locateAndScrollByJS(client, activeTabId, JS_SUBMIT_TITLE);
  if (!titleLoc2) {
    return { status: "failed", message: "could not re-locate title input after blur" };
  }
  await humanClickElement(client, activeTabId, titleLoc2, options);
  const deleteResult = await deleteTitleText(client, activeTabId);
  if (deleteResult.status === "failed") return deleteResult;
  await humanPause(1e3, 2500);
  console.log(`[submit-post] (wrong-title) typing correct title (${correctTitle.length} chars)...`);
  await typeTitleText(client, activeTabId, correctTitle, correctMidHook);
  await humanReview(client, activeTabId, titleLoc2, correctTitle.length);
  return { status: "success", message: "wrong-title replaced with correct title" };
}
async function typeTitleEntry(client, activeTabId, options, scheduler, opts) {
  if (options.wrongTitle) {
    return typeTitleWithMistake(client, activeTabId, options.wrongTitle, options.title, scheduler, opts);
  }
  const midHook = async () => {
    await humanPause(1500, 3500);
    await scheduler.maybeSwitch("mid-correct");
  };
  return typeTitle(client, activeTabId, options.title, { midHook, review: true, humanConfig: opts });
}
async function typeBody(client, activeTabId, body, options) {
  console.log("[submit-post] locating body editor...");
  const bodyLoc = await locateAndScrollByJS(client, activeTabId, JS_SUBMIT_BODY);
  if (!bodyLoc) {
    return { status: "failed", message: "could not locate body editor" };
  }
  console.log(`[submit-post] typing body (${body.length} chars)...`);
  await humanClickElement(client, activeTabId, bodyLoc, options);
  await humanPause(300, 600);
  await humanType(client, activeTabId, body);
  if (body.length > 30 || Math.random() < 0.8) {
    await humanReview(client, activeTabId, bodyLoc, body.length);
  }
  return { status: "success", message: "body typed" };
}
const JS_CAROUSEL_IMAGE_COUNT = `
(function(){var el=document.querySelector('r-post-media-input');if(!el||!el.shadowRoot)return 0;var imgs=el.shadowRoot.querySelectorAll('img');var count=0;for(var i=0;i<imgs.length;i++){var r=imgs[i].getBoundingClientRect();if(r.width>0&&r.height>0)count++}return count})()
`;
async function browseUploadedImages(client, activeTabId, options) {
  const countResult = await client.evaluateV2(activeTabId, JS_CAROUSEL_IMAGE_COUNT);
  const imageCount = parseEvalResult(countResult?.result ?? countResult) ?? 0;
  if (imageCount <= 1) return;
  console.log(`[submit-post] browsing ${imageCount} uploaded images...`);
  const clicks = Math.min(imageCount - 1, 1 + Math.floor(Math.random() * 3));
  for (let i = 0; i < clicks; i++) {
    const nextBtn = await locateByJS(client, activeTabId, JS_CAROUSEL_NEXT);
    if (!nextBtn) break;
    await humanClickElement(client, activeTabId, nextBtn, options);
    await humanPause(1500, 3500);
  }
  if (Math.random() < 0.3) {
    const prevBtn = await locateByJS(client, activeTabId, JS_CAROUSEL_PREV);
    if (prevBtn) {
      await humanClickElement(client, activeTabId, prevBtn, options);
      await humanPause(1e3, 2500);
    }
  }
}
async function uploadImagesBatch(client, activeTabId, imagePaths, uploadMode, options) {
  if (!imagePaths.length) {
    return { status: "skipped", message: "no images to upload" };
  }
  console.log(
    `[submit-post] uploading ${imagePaths.length} image(s) (mode=${uploadMode})...`
  );
  try {
    const fileEntries = imagePaths.map((p) => {
      switch (uploadMode) {
        case "base64":
          return { base64: p };
        // raw base64 or data: URL — server handles both
        case "url":
          return { url: p };
        default:
          return { path: p };
      }
    });
    const result = await client.humanUpload(activeTabId, {
      clickSelector: HU_CLICK_UPLOAD_BTN,
      inputSelector: JS_IMAGE_INPUT_SELECTOR,
      files: fileEntries
    });
    if (!result?.uploaded) {
      return { status: "failed", message: "humanUpload returned uploaded=false" };
    }
    console.log(
      `[submit-post] uploaded \u2014 ${result.files} file(s), click=(${result.clickX},${result.clickY})`
    );
  } catch (e) {
    const errMsg = e instanceof Error ? e.message : JSON.stringify(e);
    console.log(`[submit-post] upload failed: ${errMsg}`);
    return { status: "failed", message: `image upload failed: ${errMsg}` };
  }
  await humanPause(2e3, 4e3);
  await humanScrollDown(
    client,
    activeTabId,
    100 + Math.floor(Math.random() * 200),
    options
  );
  const browseChance = imagePaths.length > 1 ? 0.55 : 0.15;
  if (Math.random() < browseChance) {
    await browseUploadedImages(client, activeTabId, options);
  }
  return { status: "success", message: `${imagePaths.length} image(s) uploaded` };
}
async function midwaySaveDraft(client, activeTabId, options) {
  console.log("[submit-post] midway saving draft...");
  const draftBtn = await locateAndScrollByJS(
    client,
    activeTabId,
    JS_SAVE_DRAFT_BUTTON
  );
  if (!draftBtn) return;
  if (draftBtn.attrs?.disabled === "true") return;
  await hoverWithHesitation(client, activeTabId, draftBtn, options);
  await humanPause(800, 1500);
  console.log("[submit-post] draft saved, continuing...");
}
async function locateAndClickInDialog(client, activeTabId, jsLocator, label) {
  const raw = await client.evaluateV2(activeTabId, jsLocator);
  const loc = parseEvalResult(
    raw?.result ?? raw
  );
  if (!loc || loc.w === 0) return false;
  console.log(`[submit-post] clicking ${label} at (${loc.x}, ${loc.y})`);
  await humanClickElement(client, activeTabId, loc);
  return true;
}
async function listPostTags(client, activeTabId) {
  console.log("[submit-post] opening flair dialog to list tags...");
  const triggerBtn = await locateByJS(client, activeTabId, JS_TAG_TRIGGER_BUTTON);
  if (!triggerBtn) {
    return { flairsRequired: false, flairsAllowed: true, spoilerAllowed: true, flairs: [], tags: [] };
  }
  await humanClickElement(client, activeTabId, triggerBtn);
  await humanPause(1500, 2500);
  await locateAndClickInDialog(client, activeTabId, JS_EXPAND_ALL_FLAIRS_LOCATION, "expand all flairs");
  await humanPause(500, 1e3);
  const rawResult = await client.evaluateV2(activeTabId, JS_LIST_FLAIRS);
  const result = parseEvalResult(
    rawResult?.result ?? rawResult
  ) ?? { flairsRequired: false, flairsAllowed: true, spoilerAllowed: true, flairs: [], tags: [] };
  await locateAndClickInDialog(client, activeTabId, JS_FLAIR_CANCEL_LOCATION, "cancel");
  await humanPause(500, 1e3);
  return result;
}
async function selectFlairAndTags(client, activeTabId, options) {
  const hasFlair = !!options.flair;
  const hasSwitches = !!(options.tagSwitches && options.tagSwitches.length > 0);
  if (!hasFlair && !hasSwitches) {
    return { status: "skipped", message: "no flair or tags to select" };
  }
  console.log("[submit-post] opening flair dialog...");
  const triggerBtn = await locateAndScrollByJS(
    client,
    activeTabId,
    JS_TAG_TRIGGER_BUTTON
  );
  if (!triggerBtn) {
    console.log("[submit-post] no flair trigger button found, skipping tags");
    return { status: "skipped", message: "no flair trigger on this page" };
  }
  await humanClickElement(client, activeTabId, triggerBtn);
  await humanPause(1500, 2500);
  if (hasFlair) {
    const expanded = await locateAndClickInDialog(
      client,
      activeTabId,
      JS_EXPAND_ALL_FLAIRS_LOCATION,
      "expand all flairs"
    );
    if (expanded) {
      console.log("[submit-post] expanded all flairs");
      await humanPause(800, 1500);
    }
  }
  if (hasFlair && options.flair) {
    console.log(`[submit-post] selecting flair matching "${options.flair}"...`);
    const rawFlairs = await client.evaluateV2(activeTabId, JS_LIST_FLAIRS);
    const flairData = parseEvalResult(
      rawFlairs?.result ?? rawFlairs
    );
    const targetLocRaw = await client.evaluateV2(
      activeTabId,
      JS_FLAIR_LOCATION_BY_TEXT(options.flair)
    );
    const targetLoc = parseEvalResult(targetLocRaw?.result ?? targetLocRaw);
    if (!targetLoc?.found) {
      console.log(
        `[submit-post] flair "${options.flair}" not found, cancelling dialog`
      );
      await locateAndClickInDialog(client, activeTabId, JS_FLAIR_CANCEL_LOCATION, "cancel");
      return {
        status: "failed",
        message: `flair "${options.flair}" not found`
      };
    }
    const doMistake = flairData && flairData.flairs.length > 2 && Math.random() < 0.25;
    if (doMistake) {
      const targetTextLower = (targetLoc.text || "").toLowerCase();
      const targetY = targetLoc.y || 0;
      const wrongCandidates = flairData.flairs.filter(
        (f) => f.text.toLowerCase() !== targetTextLower && f.x > 0 && f.y > 0 && f.w > 0
      ).map((f) => ({ ...f, dist: Math.abs(f.y - targetY) })).sort((a, b) => a.dist - b.dist);
      if (wrongCandidates.length > 0) {
        const wrong = wrongCandidates.length > 1 && Math.random() < 0.3 ? wrongCandidates[1] : wrongCandidates[0];
        console.log(`[submit-post] (mistake) accidentally clicking "${wrong.text}" first...`);
        await humanClickElement(
          client,
          activeTabId,
          { x: wrong.x, y: wrong.y, w: wrong.w, h: wrong.h }
        );
        await humanPause(800, 2e3);
      }
    }
    console.log(`[submit-post] clicking flair: ${targetLoc.text}`);
    await humanClickElement(
      client,
      activeTabId,
      { x: targetLoc.x, y: targetLoc.y, w: targetLoc.w, h: targetLoc.h }
    );
    await humanPause(500, 1200);
  }
  if (hasSwitches && options.tagSwitches) {
    for (const switchName of options.tagSwitches) {
      console.log(`[submit-post] toggling tag switch: ${switchName}`);
      const rawSw = await client.evaluateV2(
        activeTabId,
        JS_TAG_SWITCH_LOCATION(switchName)
      );
      const swLoc = parseEvalResult(rawSw?.result ?? rawSw);
      if (!swLoc?.found) {
        console.log(`[submit-post] tag switch "${switchName}" not found`);
      } else {
        await humanClickElement(
          client,
          activeTabId,
          { x: swLoc.x, y: swLoc.y, w: swLoc.w, h: swLoc.h }
        );
      }
      await humanPause(300, 800);
    }
  }
  console.log("[submit-post] applying flair/tag selection...");
  const applyRaw = await client.evaluateV2(activeTabId, JS_FLAIR_APPLY_LOCATION);
  const applyLoc = parseEvalResult(
    applyRaw?.result ?? applyRaw
  );
  if (!applyLoc || applyLoc.w === 0) {
    console.log("[submit-post] apply button not found, trying cancel");
    await locateAndClickInDialog(client, activeTabId, JS_FLAIR_CANCEL_LOCATION, "cancel");
    return { status: "failed", message: "could not apply flair selection" };
  }
  await hoverWithHesitation(client, activeTabId, applyLoc);
  await humanPause(800, 1500);
  console.log("[submit-post] flair/tag selection applied");
  return { status: "success", message: "flair/tag selected" };
}
async function finalSubmit(client, activeTabId, options) {
  const hasImages = !!(options.images && options.images.length > 0);
  const saveDraft = options.saveAsDraft === true && !hasImages;
  const jsExpr = saveDraft ? JS_SAVE_DRAFT_BUTTON : JS_SUBMIT_POST_BUTTON;
  const label = saveDraft ? "save draft" : "post";
  console.log(`[submit-post] locating ${label} button...`);
  const btn = await locateAndScrollByJS(client, activeTabId, jsExpr);
  if (!btn) {
    return { status: "failed", message: `could not locate ${label} button` };
  }
  let retries = 0;
  while (btn.attrs?.disabled === "true" && retries < 5) {
    console.log(`[submit-post] ${label} button disabled, waiting...`);
    await humanPause(500, 1e3);
    const recheck = await locateByJS(client, activeTabId, jsExpr);
    if (!recheck || recheck.attrs?.disabled !== "true") break;
    retries++;
  }
  console.log(`[submit-post] clicking ${label}...`);
  if (process.env.PINCHTAB_TEST_NO_SUBMIT === "1") {
    console.log(`[submit-post] [TEST] PINCHTAB_TEST_NO_SUBMIT=1 \u2014 skipping ${label} click`);
    return {
      status: "skipped",
      message: `[TEST] ${label} click skipped (PINCHTAB_TEST_NO_SUBMIT)`,
      data: { action: label, title: options.title, testMode: true }
    };
  }
  await hoverWithHesitation(client, activeTabId, btn, options.humanConfig);
  let curUrl = "";
  for (let attempt = 0; attempt < 8; attempt++) {
    await humanPause(1e3, 2e3);
    const urlResult = await client.pageUrl(activeTabId);
    curUrl = urlResult?.url || "";
    if (!curUrl.includes("/submit")) break;
  }
  if (curUrl.includes("/submit")) {
    console.log("[submit-post] still on submit page, checking for validation errors...");
    const errResult = await client.evaluateV2(activeTabId, JS_SUBMIT_ERROR);
    const errData = parseEvalResult(
      errResult?.result ?? errResult
    );
    if (errData?.hasError && errData.errors?.length) {
      const visibleErrors = errData.errors.filter((e) => e.visible);
      const errorText = visibleErrors.length > 0 ? visibleErrors.map((e) => `[${e.field}] ${e.text}`).join("; ") : errData.errors.map((e) => `[${e.field}] ${e.text}`).join("; ");
      console.log(`[submit-post] submission rejected: ${errorText}`);
      return {
        status: "failed",
        message: `${saveDraft ? "draft save" : "post"} rejected: ${errorText}`,
        data: { action: label, title: options.title, errors: errData.errors }
      };
    }
    return {
      status: "failed",
      message: `${saveDraft ? "draft save" : "post"} may have failed (still on submit page, no specific error found)`,
      data: { action: label, title: options.title }
    };
  }
  await briefBrowseAfterAction(client, activeTabId, options.humanConfig);
  if (Math.random() < 0.25) {
    await simulateTabSwitch(client, activeTabId);
  }
  return {
    status: "success",
    message: saveDraft ? "draft saved" : "post submitted",
    data: { action: label, title: options.title }
  };
}
async function submitPost(client, tabId, options) {
  let activeTabId = tabId;
  await ensureTabFocus(client, activeTabId);
  console.log("[submit-post] starting...");
  client.logInfo(activeTabId, "Starting post submission", [kTag]);
  const scheduler = createTabSwitchScheduler({
    slots: {
      "pre-input": 0.3,
      "mid-wrong": 0.3,
      "post-wrong": 0.3,
      "mid-correct": 0.3,
      "pre-submit": 0.4
    },
    switchFn: () => simulateTabSwitch(client, activeTabId)
  });
  const opts = options.humanConfig;
  const navResult = await navigateToSubmitPage(
    client,
    activeTabId,
    options.subreddit
  );
  if (navResult.status === "failed") return navResult;
  if (!await validateSubmitPage(client, activeTabId)) {
    return { status: "failed", message: "not on Reddit submit page" };
  }
  const requiredCheck = await scanRequiredFields(client, activeTabId, options);
  if (requiredCheck) return requiredCheck;
  await settleAfterLoad(client, activeTabId);
  await scheduler.maybeSwitch("pre-input");
  const hasImages = !!(options.images && options.images.length > 0);
  const hasBody = !!options.body;
  if (hasImages && options.saveAsDraft) {
    console.log("[submit-post] \u274C --save-draft is not supported for image posts (Reddit limitation)");
    return { status: "failed", message: "--save-draft is not supported for image posts (Reddit limitation). Either remove --save-draft or omit images." };
  }
  if (hasImages) {
    await switchToImageMode(client, activeTabId, opts);
  }
  const uploadMode = options.uploadMode || "path";
  const order = chooseImageTextOrder(hasImages, hasBody);
  const hasFlairOrTags = !!(options.flair || options.tagSwitches?.length);
  const flairOrder = hasFlairOrTags ? chooseFlairOrder() : "flair-last";
  console.log(`[submit-post] execution order: ${order}, flair: ${flairOrder}`);
  const ctx = {
    bodyProgress: 0,
    imagesUploaded: 0
  };
  const planBatches = hasImages ? planUploadBatches(options.images) : [];
  let batchIndex = 0;
  const uploadNextBatch = async () => {
    if (batchIndex >= planBatches.length) return null;
    const batch = planBatches[batchIndex];
    const result2 = await uploadImagesBatch(
      client,
      activeTabId,
      batch,
      uploadMode,
      opts
    );
    if (result2.status === "success") {
      ctx.imagesUploaded += batch.length;
      batchIndex++;
    }
    return result2;
  };
  const maybeMidwaySave = async () => {
    if (hasImages) return;
    if (shouldMidwaySave(ctx)) {
      await midwaySaveDraft(client, activeTabId, opts);
    }
  };
  let flairDone = false;
  const doSelectFlair = async () => {
    if (!hasFlairOrTags || flairDone) return null;
    const r = await selectFlairAndTags(client, activeTabId, options);
    if (r.status === "failed") return r;
    flairDone = true;
    if (Math.random() < 0.15) {
      console.log("[submit-post] pausing after setting flair...");
      await simulateTabSwitch(client, activeTabId);
    }
    return null;
  };
  if (order === "images-first") {
    if (flairOrder === "flair-first") {
      const r = await doSelectFlair();
      if (r) return r;
    }
    while (batchIndex < planBatches.length) {
      const r = await uploadNextBatch();
      if (r?.status === "failed") return r;
      await maybeMidwaySave();
    }
    if (Math.random() < 0.2) {
      console.log("[submit-post] pausing after image uploads...");
      await simulateTabSwitch(client, activeTabId);
    }
    const titleResult = await typeTitleEntry(client, activeTabId, options, scheduler, opts);
    if (titleResult.status === "failed") return titleResult;
    if (flairOrder === "flair-after-title") {
      const r = await doSelectFlair();
      if (r) return r;
    }
    await maybeMidwaySave();
    if (hasBody && Math.random() < 0.15) {
      console.log("[submit-post] thinking about what to write...");
      await simulateTabSwitch(client, activeTabId);
    }
    if (hasBody && options.body) {
      const bodyResult = await typeBody(client, activeTabId, options.body, opts);
      if (bodyResult.status === "failed") return bodyResult;
      ctx.bodyProgress = options.body.length;
      await maybeMidwaySave();
    }
  } else if (order === "text-first") {
    if (flairOrder === "flair-first") {
      const r = await doSelectFlair();
      if (r) return r;
    }
    const titleResult = await typeTitleEntry(client, activeTabId, options, scheduler, opts);
    if (titleResult.status === "failed") return titleResult;
    if (flairOrder === "flair-after-title") {
      const r = await doSelectFlair();
      if (r) return r;
    }
    await maybeMidwaySave();
    if (hasBody && Math.random() < 0.15) {
      console.log("[submit-post] thinking about what to write...");
      await simulateTabSwitch(client, activeTabId);
    }
    if (hasBody && options.body) {
      const bodyResult = await typeBody(client, activeTabId, options.body, opts);
      if (bodyResult.status === "failed") return bodyResult;
      ctx.bodyProgress = options.body.length;
      await maybeMidwaySave();
    }
    if (hasImages && Math.random() < 0.2) {
      console.log("[submit-post] looking for images to attach...");
      await simulateTabSwitch(client, activeTabId);
    }
    while (batchIndex < planBatches.length) {
      const r = await uploadNextBatch();
      if (r?.status === "failed") return r;
      await maybeMidwaySave();
    }
  } else {
    if (flairOrder === "flair-first") {
      const r = await doSelectFlair();
      if (r) return r;
    }
    const titleResult = await typeTitleEntry(client, activeTabId, options, scheduler, opts);
    if (titleResult.status === "failed") return titleResult;
    if (flairOrder === "flair-after-title") {
      const r = await doSelectFlair();
      if (r) return r;
    }
    const preBodyBatches = Math.max(1, Math.floor(planBatches.length * (0.3 + Math.random() * 0.4)));
    while (batchIndex < preBodyBatches && batchIndex < planBatches.length) {
      const r = await uploadNextBatch();
      if (r?.status === "failed") return r;
    }
    if (batchIndex < planBatches.length) {
      if (Math.random() < 0.2) {
        console.log("[submit-post] browsing images before continuing...");
        await browseUploadedImages(client, activeTabId, opts);
      }
    }
    await maybeMidwaySave();
    if (hasBody && Math.random() < 0.2) {
      console.log("[submit-post] pausing before writing body...");
      await simulateTabSwitch(client, activeTabId);
    }
    if (hasBody && options.body) {
      const bodyResult = await typeBody(client, activeTabId, options.body, opts);
      if (bodyResult.status === "failed") return bodyResult;
      ctx.bodyProgress = options.body.length;
    }
    while (batchIndex < planBatches.length) {
      const r = await uploadNextBatch();
      if (r?.status === "failed") return r;
      if (batchIndex < planBatches.length && Math.random() < 0.25) {
        await browseUploadedImages(client, activeTabId, opts);
      }
    }
    await maybeMidwaySave();
  }
  if (hasImages && ctx.imagesUploaded > 1) {
    await browseUploadedImages(client, activeTabId, opts);
  }
  if (flairOrder === "flair-last") {
    const flairResult = await selectFlairAndTags(client, activeTabId, options);
    if (flairResult.status === "failed") return flairResult;
    if (Math.random() < 0.15) {
      console.log("[submit-post] final review before posting...");
      await simulateTabSwitch(client, activeTabId);
    }
  }
  console.log("[submit-post] pre-submit title scan...");
  await mouseScanReview(client, activeTabId, JS_SUBMIT_TITLE);
  await humanPause(3e3, 8e3);
  if (Math.random() < 0.45) {
    console.log("[submit-post] pre-submit review scroll...");
    await humanScrollDown(
      client,
      activeTabId,
      100 + Math.floor(Math.random() * 200),
      opts
    );
  }
  await scheduler.maybeSwitch("pre-submit");
  await scheduler.ensureSwitched();
  await humanPause(1e3, 2500);
  if (Math.random() < 0.75) {
    console.log("[submit-post] pre-submit title re-confirm...");
    await refocusAndBlurTitle(client, activeTabId, JS_SUBMIT_TITLE);
  }
  const titleVerify = await verifyTitleBeforeSubmit(client, activeTabId, options.title);
  if (titleVerify) return titleVerify;
  const result = await finalSubmit(client, activeTabId, options);
  console.log("[submit-post] done");
  client.logInfo(activeTabId, "Post submission complete", [kTag]);
  return result;
}
function getImagesInput() {
  const imagesFile = getCliArg("images-file");
  if (imagesFile) {
    try {
      return readFileSync(imagesFile, "utf-8");
    } catch (err) {
      console.log(
        JSON.stringify({
          status: "failed",
          message: `Failed to read --images-file: ${err.message}`
        })
      );
      process.exit(1);
    }
  }
  return getCliArg("images");
}
async function main() {
  const cli = await getCliOptions();
  const tabId = requireTabId();
  if (process.argv.includes("--form-info")) {
    const client2 = new PinchTabClient({
      baseUrl: cli.baseUrl,
      token: cli.token
    });
    const subreddit2 = getCliArg("subreddit");
    if (subreddit2) {
      await navigateToSubmitPage(client2, tabId, subreddit2);
    }
    const scanResult = await client2.evaluateV2(tabId, JS_SCAN_REQUIRED);
    const req = parseEvalResult(
      scanResult?.result ?? scanResult
    );
    const tagList = await listPostTags(client2, tabId);
    const flairs = tagList.flairs.filter((f) => f.text !== "No flair").map((f) => f.text);
    if (subreddit2) {
      saveFlairCache(subreddit2, flairs, {
        bodyRequired: req?.bodyRequired ?? false,
        flairsRequired: tagList.flairsRequired,
        flairsAllowed: tagList.flairsAllowed,
        spoilerAllowed: tagList.spoilerAllowed
      });
    }
    console.log(JSON.stringify({
      bodyRequired: req?.bodyRequired ?? false,
      flairRequired: tagList.flairsRequired,
      flairs
    }, null, 2));
    return;
  }
  const title = getCliArg("title");
  if (!title) {
    console.log(
      JSON.stringify({ status: "failed", message: "--title is required" })
    );
    process.exit(1);
  }
  const body = getCliArg("body");
  const imagesStr = getImagesInput();
  const uploadModeStr = getCliArg("upload-mode");
  const uploadMode = uploadModeStr === "url" ? "url" : uploadModeStr === "base64" ? "base64" : "path";
  const imageSeparator = uploadMode !== "path" ? "|" : ",";
  const images = imagesStr ? imagesStr.split(imageSeparator).map((s) => s.trim()).filter(Boolean) : void 0;
  const subreddit = getCliArg("subreddit");
  if (!subreddit) {
    console.log(
      JSON.stringify({ status: "failed", message: "--subreddit is required" })
    );
    process.exit(1);
  }
  const saveDraft = getCliArg("save-draft") !== void 0;
  const flair = getCliArg("flair");
  const tagSwitchesStr = getCliArg("tag-switches");
  const tagSwitches = tagSwitchesStr ? tagSwitchesStr.split(",").map((s) => s.trim()).filter(Boolean) : void 0;
  const wrongTitle = getCliArg("wrong-title");
  const client = new PinchTabClient({ baseUrl: cli.baseUrl, token: cli.token });
  const result = await submitPost(client, tabId, {
    title,
    body: body || void 0,
    images,
    subreddit: subreddit || void 0,
    saveAsDraft: saveDraft,
    flair: flair || void 0,
    tagSwitches,
    uploadMode,
    wrongTitle: wrongTitle || void 0
  });
  outputResult(result);
}
runMain(main, "reddit-submit-post.ts");
export {
  listPostTags,
  splitTitleText,
  submitPost,
  typeTitleEntry,
  typeTitleText,
  verifyTitleBeforeSubmit
};
