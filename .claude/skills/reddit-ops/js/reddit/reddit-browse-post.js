import { PinchTabClient } from "../api.js";
import { getPostDetail } from "./reddit-post-detail.js";
import {
  humanPause,
  humanScrollDown,
  humanMouseMove,
  humanClickElement,
  locateByJS,
  locateAndScrollByJS,
  scrollToTopHuman,
  ensureTabFocus,
  ensurePostDetailPage,
  findInstanceIdForTab,
  waitForNewTab,
  middleClickAt,
  JS_GALLERY_NEXT,
  JS_GALLERY_PREV,
  JS_GALLERY_PAGE_COUNT,
  JS_GALLERY_CURRENT_IMAGE,
  JS_POST_IMAGE,
  JS_LINK_CARD_ENTRY,
  JS_LINK_OPEN_BAR,
  clamp,
  gaussianRandom,
  simulateTabSwitch
} from "./reddit-human.js";
import { interactWithVideo } from "./reddit-video-interact.js";
import { outputResult, getCliOptions, getCliArg, requireTabId, runMain } from "./cli.js";
const kBrowsePostTag = "browse-post";
function computeAttention(baseInterest, elapsedMs, wavePeriodMs) {
  const phase = elapsedMs % wavePeriodMs / wavePeriodMs;
  const wave = 0.6 + 0.4 * Math.sin(phase * 2 * Math.PI);
  let spike = 0;
  if (Math.random() < (baseInterest > 0.65 ? 0.25 : baseInterest > 0.3 ? 0.15 : 0.05)) {
    spike = 0.5 + Math.random() * 0.5;
  } else if (Math.random() < 0.12) {
    spike = -(0.3 + Math.random() * 0.4);
  }
  const att = clamp(baseInterest * 0.4 + wave * 0.3 + spike * 0.3, 0, 1);
  return { att, spike };
}
async function browseLinkPost(client, tabId, options) {
  const interest = options?.interest ?? 0.5;
  let contentHref = null;
  try {
    const r = await client.evaluateV2(
      tabId,
      `(function(){var p=document.querySelector('shreddit-post');return JSON.stringify({href:p?p.getAttribute('content-href'):null,domain:p?p.getAttribute('domain'):null})})()`
    );
    const d = typeof r.result === "string" ? JSON.parse(r.result) : r.result;
    contentHref = d?.href || null;
  } catch {
  }
  if (Math.random() >= 0.8) {
    console.log("[browse] link post \u2014 skipping external open (20%)");
    client.logInfo(tabId, "Link post \u2014 skipping external open", [kBrowsePostTag]);
    await humanPause(800, 1800);
    await humanScrollDown(client, tabId, 100 + Math.round(Math.random() * 150), {
      ...options,
      interest
    });
    return;
  }
  const useCard = Math.random() < 0.6;
  let loc = await locateAndScrollByJS(
    client,
    tabId,
    useCard ? JS_LINK_CARD_ENTRY : JS_LINK_OPEN_BAR
  );
  let entryName = useCard ? "card-center" : "open-button";
  if (!loc) {
    loc = await locateAndScrollByJS(
      client,
      tabId,
      useCard ? JS_LINK_OPEN_BAR : JS_LINK_CARD_ENTRY
    );
    entryName = useCard ? "open-button" : "card-center";
  }
  if (!loc) {
    console.log("[browse] link post \u2014 no external entry located, just waiting");
    client.logInfo(tabId, "Link post \u2014 no external entry found", [kBrowsePostTag]);
    await humanPause(2e3, 3500);
    return;
  }
  const instanceId = await findInstanceIdForTab(client, tabId);
  const beforeIds = new Set(
    instanceId ? (await client.instanceTabsList(instanceId)).map((t) => t.id) : []
  );
  console.log(`[browse] link post \u2014 middle-clicking ${entryName} to open external`);
  client.logInfo(tabId, `Link post \u2014 opening external via ${entryName}`, [kBrowsePostTag]);
  try {
    await middleClickAt(client, tabId, loc);
  } catch (e) {
    console.log(`[browse] middle-click failed: ${e?.message || e?.error}`);
  }
  let newTab = await waitForNewTab(client, instanceId, beforeIds, 1e4);
  if (!newTab && instanceId && contentHref) {
    try {
      const nt = await client.instanceTabsOpen(instanceId, contentHref);
      newTab = { id: nt?.tabId || nt?.id, url: contentHref };
      console.log("[browse] link post \u2014 opened external via API fallback");
    } catch {
    }
  }
  if (!newTab) {
    console.log("[browse] link post \u2014 could not open external, continuing");
    await humanPause(1500, 2500);
    return;
  }
  const newTabId = newTab.id || newTab.tabId;
  console.log(
    `[browse] link post \u2014 browsing external tab ${newTabId} (${(newTab.url || "").slice(0, 60)})`
  );
  try {
    await client.tabFocus(newTabId);
  } catch {
  }
  await humanPause(2500, 4500);
  const dwellMs = interest > 0.65 ? 45e3 + Math.round(Math.random() * 11e4) : interest > 0.3 ? 2e4 + Math.round(Math.random() * 5e4) : 12e3 + Math.round(Math.random() * 28e3);
  const dwellEnd = Date.now() + dwellMs;
  console.log(
    `[browse] link post \u2014 dwelling on external ~${Math.round(dwellMs / 1e3)}s`
  );
  while (Date.now() < dwellEnd) {
    const seg = 200 + Math.round(Math.random() * 500);
    try {
      await humanScrollDown(client, newTabId, seg, { ...options, interest });
    } catch {
    }
    await humanPause(1500, 3500);
    if (Math.random() < 0.3) {
      const mx = Math.round(clamp(300 + gaussianRandom(0, 250), 50, 1200));
      const my = Math.round(clamp(300 + gaussianRandom(0, 200), 50, 800));
      try {
        await humanMouseMove(client, newTabId, mx, my);
      } catch {
      }
    }
  }
  try {
    await client.tabFocus(tabId);
  } catch {
  }
  await humanPause(800, 1600);
  try {
    await client.tabClose(newTabId);
  } catch {
  }
  console.log("[browse] link post \u2014 returned from external, closed tab");
}
async function browseTextPost(client, tabId, options) {
  const interest = options?.interest ?? 0.5;
  if (interest < 0.3 && Math.random() < 0.5) {
    console.log("[browse] low interest \u2014 skipping text post body");
    return;
  }
  console.log("[browse] text post \u2014 reading content...");
  const contentCfg = {
    ...options,
    readPauseProbability: interest > 0.5 ? 0.5 : 0.15
  };
  const pixels = interest > 0.5 ? 400 + Math.round(Math.random() * 400) : 150 + Math.round(Math.random() * 200);
  await humanScrollDown(client, tabId, pixels, contentCfg);
}
async function browseImagePost(client, tabId, options) {
  const interest = options?.interest ?? 0.5;
  console.log("[browse] image post \u2014 viewing image...");
  if (interest < 0.3 && Math.random() < 0.4) {
    console.log("[browse] low interest \u2014 skipping image lightbox");
    await humanPause(800, 1500);
    return;
  }
  const imgLoc = await locateAndScrollByJS(client, tabId, JS_POST_IMAGE);
  if (imgLoc) {
    await humanClickElement(client, tabId, imgLoc, options);
    console.log("[browse] opened image lightbox");
    await humanPause(2e3, 4e3);
    await client.humanKeyboardPress(tabId, { key: "Escape" });
    await humanPause(500, 1e3);
  } else {
    console.log("[browse] could not locate image, just waiting");
    await humanPause(2e3, 3500);
  }
}
async function browseGalleryPost(client, tabId, options) {
  const interest = options?.interest ?? 0.5;
  let pageCount = 0;
  try {
    const result = await client.evaluateV2(tabId, JS_GALLERY_PAGE_COUNT);
    pageCount = Number(
      typeof result.result === "string" ? JSON.parse(result.result) : result.result
    ) || 0;
  } catch {
  }
  if (pageCount <= 0) pageCount = 4;
  console.log(`[browse] gallery post \u2014 ${pageCount} images`);
  const viewRatio = interest < 0.3 ? 0.2 + Math.random() * 0.2 : 0.4 + Math.random() * 0.5;
  const viewCount = Math.max(1, Math.round(pageCount * viewRatio));
  console.log(`[browse] will view ${viewCount} of ${pageCount} images`);
  if (Math.random() < 0.5) {
    const firstImg = await locateAndScrollByJS(
      client,
      tabId,
      JS_GALLERY_CURRENT_IMAGE
    );
    if (firstImg) {
      await humanMouseMove(client, tabId, firstImg.x, firstImg.y);
      await humanPause(300, 600);
      console.log("[browse] opening lightbox...");
      await humanClickElement(client, tabId, firstImg);
      await humanPause(1500, 2500);
      for (let i = 0; i < viewCount; i++) {
        console.log(`[browse] viewing lightbox image ${i + 1}/${viewCount}`);
        await humanPause(1500, 3500);
        if (i < viewCount - 1) {
          const nextBtn = await locateByJS(client, tabId, JS_GALLERY_NEXT);
          if (nextBtn) {
            await humanClickElement(client, tabId, nextBtn);
            await humanPause(800, 1500);
          }
        }
      }
      if (Math.random() < 0.3 && viewCount > 1) {
        console.log("[browse] going back to previous image in lightbox");
        const prevBtn = await locateByJS(client, tabId, JS_GALLERY_PREV);
        if (prevBtn) {
          await humanClickElement(client, tabId, prevBtn);
          await humanPause(1e3, 2e3);
        }
      }
      await client.humanKeyboardPress(tabId, { key: "Escape" });
      await humanPause(800, 1500);
      return;
    }
  }
  for (let i = 0; i < viewCount; i++) {
    await humanPause(800, 1500);
    const imgLoc = await locateAndScrollByJS(
      client,
      tabId,
      JS_GALLERY_CURRENT_IMAGE
    );
    if (imgLoc) {
      await humanMouseMove(client, tabId, imgLoc.x, imgLoc.y);
    }
    console.log(`[browse] viewing gallery image ${i + 1}/${viewCount}`);
    await humanPause(1500, 3500);
    if (i < viewCount - 1) {
      const nextLoc = await locateByJS(client, tabId, JS_GALLERY_NEXT);
      if (nextLoc) {
        await humanClickElement(client, tabId, nextLoc, options);
        await humanPause(1e3, 1800);
      } else {
        await client.humanKeyboardPress(tabId, { key: "ArrowRight" });
        await humanPause(1e3, 1800);
      }
    }
  }
}
async function browseVideoPost(client, tabId, options) {
  const interest = options?.interest ?? 0.5;
  console.log("[browse] video post \u2014 interacting with player...");
  await interactWithVideo(client, tabId, { interest, mode: "detail", humanConfig: options });
}
async function browsePost(client, tabId, options) {
  await ensureTabFocus(client, tabId);
  const postId = await ensurePostDetailPage(client, tabId);
  if (!postId) {
    client.logError(tabId, "browsePost: not on a Reddit post detail page", [kBrowsePostTag]);
    return { status: "invalid_page", message: "not a Reddit post detail page" };
  }
  client.logInfo(tabId, `Starting browsePost for ${postId}`, [kBrowsePostTag]);
  const baseInterest = options?.interest ?? clamp(gaussianRandom(0.5, 0.2), 0, 1);
  const currentUrl = await client.pageUrl(tabId);
  if (currentUrl.url?.includes("#lightbox")) {
    console.log("[browse] detected image lightbox overlay (#lightbox) \u2014 closing...");
    await client.humanKeyboardPress(tabId, { key: "Escape" });
    await humanPause(800, 1500);
    console.log("[browse] lightbox overlay closed");
  }
  await scrollToTopHuman(client, tabId);
  await humanPause(500, 1e3);
  const topPos = {
    x: Math.round(clamp(gaussianRandom(650, 80), 350, 950)),
    y: 100
  };
  await humanMouseMove(client, tabId, topPos.x, topPos.y);
  console.log("[browse] reading post title...");
  if (baseInterest < 0.3) {
    await humanPause(300, 600);
  } else {
    await humanPause(800, 1500);
  }
  let postType = "text";
  try {
    const loc = await client.humanLocator(tabId, {
      selector: "shreddit-post",
      attrs: ["post-type"]
    });
    if (loc.found && loc.attrs) {
      postType = loc.attrs["post-type"] ?? "text";
    }
  } catch {
  }
  console.log(
    `[browse] post type: ${postType}, id: ${postId}, interest: ${baseInterest.toFixed(2)}`
  );
  client.logInfo(tabId, `Post type: ${postType}, interest: ${baseInterest.toFixed(2)}`, [kBrowsePostTag]);
  switch (postType) {
    case "image":
      client.logInfo(tabId, "Browsing image post", [kBrowsePostTag]);
      await browseImagePost(client, tabId, {
        ...options,
        interest: baseInterest
      });
      break;
    case "gallery":
      client.logInfo(tabId, "Browsing gallery post", [kBrowsePostTag]);
      await browseGalleryPost(client, tabId, {
        ...options,
        interest: baseInterest
      });
      break;
    case "video":
      client.logInfo(tabId, "Browsing video post", [kBrowsePostTag]);
      await browseVideoPost(client, tabId, {
        ...options,
        interest: baseInterest
      });
      break;
    case "link":
      client.logInfo(tabId, "Browsing link post (external)", [kBrowsePostTag]);
      await browseLinkPost(client, tabId, {
        ...options,
        interest: baseInterest
      });
      break;
    default:
      client.logInfo(tabId, "Browsing text post", [kBrowsePostTag]);
      await browseTextPost(client, tabId, {
        ...options,
        interest: baseInterest
      });
      break;
  }
  if (postType !== "video" && postType !== "link" && Math.random() < 0.18) {
    await simulateTabSwitch(client, tabId);
  }
  const commentX = Math.round(clamp(gaussianRandom(550, 80), 350, 950));
  const commentY = 300 + Math.round(Math.random() * 200);
  await humanMouseMove(client, tabId, commentX, commentY);
  let commentCount = 0;
  let commentContentLen = 0;
  try {
    let sumBody2 = function(nodes) {
      let total = 0;
      for (const n of nodes) {
        total += n.body.length;
        total += sumBody2(n.children);
      }
      return total;
    };
    var sumBody = sumBody2;
    const detail = await getPostDetail(client, tabId);
    commentCount = detail.post.commentCount;
    commentContentLen = sumBody2(detail.comments);
  } catch {
  }
  let commentsSkipped = false;
  if (baseInterest < 0.3 && Math.random() < 0.3) {
    console.log("[browse] low interest \u2014 skipping comments");
    client.logInfo(tabId, "Low interest \u2014 skipping comments", [kBrowsePostTag]);
    commentsSkipped = true;
  }
  let segmentsScrolled = 0;
  let tabSwitchCount = 0;
  let lastTabSwitchSeg = -4;
  if (!commentsSkipped) {
    await humanPause(1e3, 2e3);
    const interestMax = baseInterest > 0.65 ? 10 + Math.round(Math.random() * 6) : baseInterest > 0.3 ? 4 + Math.round(Math.random() * 5) : 1 + Math.round(Math.random() * Math.random() * 3);
    const contentMax = Math.max(1, Math.round(commentContentLen / 500));
    const maxSegments = Math.min(interestMax, contentMax);
    const pxScale = clamp(commentContentLen / 5e3, 0.3, 2.5);
    const wavePeriodMs = baseInterest > 0.65 ? 4e4 + Math.random() * 2e4 : baseInterest > 0.3 ? 25e3 + Math.random() * 15e3 : 15e3 + Math.random() * 1e4;
    console.log(
      `[browse] ${commentCount} comments (${commentContentLen} chars), will read up to ${maxSegments} segments, wave period ~${Math.round(wavePeriodMs / 1e3)}s`
    );
    const browseStart = Date.now();
    const recentAtt = [];
    for (let seg = 0; seg < maxSegments; seg++) {
      const elapsed = Date.now() - browseStart;
      const { att, spike } = computeAttention(
        baseInterest,
        elapsed,
        wavePeriodMs
      );
      recentAtt.push(att);
      if (recentAtt.length > 3) recentAtt.shift();
      const recentAvg = recentAtt.reduce((a, b) => a + b, 0) / recentAtt.length;
      if (seg >= 2 && recentAvg < 0.15 && Math.random() < 0.6) {
        console.log(`[browse] attention lost at seg ${seg}, stopping early`);
        break;
      }
      const basePixels = att > 0.6 ? 40 + Math.random() * 60 : att > 0.3 ? 70 + Math.random() * 110 : 120 + Math.random() * 180;
      const segPixels = Math.round(basePixels * pxScale);
      const segCfg = {
        ...options,
        interest: baseInterest,
        readPauseProbability: att > 0.6 ? 0.5 + Math.random() * 0.15 : att > 0.3 ? 0.15 + Math.random() * 0.2 : Math.random() * 0.08,
        scrollBackProbability: att > 0.6 ? 0.1 + Math.random() * 0.1 : att > 0.3 ? 0.02 + Math.random() * 0.06 : 0,
        scrollSpeedRange: att > 0.6 ? [25, 55] : att > 0.3 ? [50, 95] : [120, 250]
      };
      if (att < 0.2 && Math.random() < 0.4) {
        console.log(`[browse] seg ${seg}: fast-skip (att=${att.toFixed(2)})`);
        await humanScrollDown(client, tabId, segPixels, {
          ...segCfg,
          noReadingFollow: true,
          readPauseProbability: 0,
          scrollBackProbability: 0,
          scrollSpeedRange: [180, 300]
        });
        segmentsScrolled++;
        continue;
      }
      if (spike > 0) {
        console.log(
          `[browse] seg ${seg}: attention spike! (att=${att.toFixed(2)})`
        );
      } else if (spike < 0) {
        console.log(`[browse] seg ${seg}: zoned out (att=${att.toFixed(2)})`);
      }
      await humanScrollDown(client, tabId, segPixels, segCfg);
      segmentsScrolled++;
      if (tabSwitchCount < 2 && seg - lastTabSwitchSeg >= 3 && Math.random() < 0.05) {
        await simulateTabSwitch(client, tabId);
        tabSwitchCount++;
        lastTabSwitchSeg = seg;
      }
      if (Math.random() < 0.3) {
        await humanPause(300, 800);
      }
    }
  }
  console.log("[browse] finished reading comments");
  client.logInfo(tabId, `Scrolling done, ${segmentsScrolled} segments read`, [kBrowsePostTag]);
  await humanPause(500, 1500);
  console.log("[browse] done");
  client.logInfo(tabId, `browsePost complete (postType=${postType})`, [kBrowsePostTag]);
  return {
    status: "success",
    message: `browsed post ${postId}`,
    data: {
      postId,
      postType,
      interest: baseInterest,
      segmentsScrolled,
      commentsSkipped,
      commentCount
    }
  };
}
async function main() {
  const cli = await getCliOptions();
  const tabId = requireTabId();
  const interestStr = getCliArg("interest");
  const interest = interestStr ? clamp(parseFloat(interestStr), 0, 1) : void 0;
  const client = new PinchTabClient({ baseUrl: cli.baseUrl, token: cli.token });
  const result = await browsePost(client, tabId, {
    interest
  });
  outputResult(result);
}
runMain(main, "reddit-browse-post.ts");
export {
  browsePost
};
