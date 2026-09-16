import {
  humanClickElement,
  humanMouseMove,
  humanPause,
  locateByJS,
  locateAndScrollByJS,
  ensureTabFocus,
  JS_LISTING_IMAGE,
  JS_LISTING_GALLERY_CURRENT,
  JS_LISTING_GALLERY_NEXT,
  JS_LISTING_GALLERY_PREV,
  JS_LISTING_GALLERY_PAGE_COUNT
} from "./reddit-human.js";
import { interactWithVideo } from "./reddit-video-interact.js";
async function listingImageLightbox(client, tabId, postId, interest = 0.5, options) {
  await ensureTabFocus(client, tabId);
  if (interest < 0.3 && Math.random() < 0.4) {
    await humanPause(800, 1500);
    return { status: "skipped", message: "low interest, skipped image lightbox", data: { postId } };
  }
  const imgLoc = await locateAndScrollByJS(client, tabId, JS_LISTING_IMAGE(postId));
  if (!imgLoc) {
    await humanPause(1500, 2500);
    return { status: "skipped", message: "image not located on listing", data: { postId } };
  }
  client.logInfo(tabId, `[listing] image lightbox ${postId}`, ["listing-media"]);
  await humanClickElement(client, tabId, imgLoc, options);
  await humanPause(2e3, 4e3);
  await client.humanKeyboardPress(tabId, { key: "Escape" });
  await humanPause(500, 1e3);
  return { status: "success", message: "viewed image lightbox", data: { postId } };
}
async function listingVideoWatch(client, tabId, postId, interest = 0.5, _options) {
  return interactWithVideo(client, tabId, { postId, interest, mode: "listing" });
}
async function listingGalleryBrowse(client, tabId, postId, interest = 0.5, options) {
  await ensureTabFocus(client, tabId);
  let pageCount = 0;
  try {
    const res = await client.evaluateV2(tabId, JS_LISTING_GALLERY_PAGE_COUNT(postId));
    const raw = res.result;
    pageCount = Number(typeof raw === "string" ? JSON.parse(raw) : raw) || 0;
  } catch {
  }
  if (pageCount <= 0) pageCount = 4;
  const viewRatio = interest < 0.3 ? 0.15 + Math.random() * 0.5 : interest < 0.6 ? 0.3 + Math.random() * 0.6 : 0.4 + Math.random() * 0.6;
  const viewCount = Math.max(1, Math.min(pageCount, Math.round(pageCount * viewRatio)));
  client.logInfo(
    tabId,
    `[listing] gallery ${postId}: ${pageCount} pages, will view ${viewCount}`,
    ["listing-media"]
  );
  if (Math.random() < 0.5) {
    const firstImg = await locateAndScrollByJS(client, tabId, JS_LISTING_GALLERY_CURRENT(postId));
    if (firstImg) {
      await humanMouseMove(client, tabId, firstImg.x, firstImg.y);
      await humanPause(300, 600);
      await humanClickElement(client, tabId, firstImg);
      await humanPause(1500, 2500);
      for (let i = 0; i < viewCount; i++) {
        await humanPause(1500, 3500);
        if (i < viewCount - 1) {
          const nextBtn = await locateByJS(client, tabId, JS_LISTING_GALLERY_NEXT(postId));
          if (nextBtn) {
            await humanClickElement(client, tabId, nextBtn);
            await humanPause(800, 1500);
          } else {
            await client.humanKeyboardPress(tabId, { key: "ArrowRight" });
            await humanPause(800, 1500);
          }
        }
      }
      if (Math.random() < 0.3 && viewCount > 1) {
        const prevBtn = await locateByJS(client, tabId, JS_LISTING_GALLERY_PREV(postId));
        if (prevBtn) {
          await humanClickElement(client, tabId, prevBtn);
          await humanPause(1e3, 2e3);
        }
      }
      await client.humanKeyboardPress(tabId, { key: "Escape" });
      await humanPause(800, 1500);
      return {
        status: "success",
        message: `browsed gallery (lightbox) ${viewCount}/${pageCount}`,
        data: { postId, mode: "lightbox", viewCount, pageCount }
      };
    }
  }
  for (let i = 0; i < viewCount; i++) {
    await humanPause(800, 1500);
    const imgLoc = await locateAndScrollByJS(client, tabId, JS_LISTING_GALLERY_CURRENT(postId));
    if (imgLoc) {
      await humanMouseMove(client, tabId, imgLoc.x, imgLoc.y);
    }
    await humanPause(1500, 3500);
    if (i < viewCount - 1) {
      const nextLoc = await locateByJS(client, tabId, JS_LISTING_GALLERY_NEXT(postId));
      if (nextLoc) {
        await humanClickElement(client, tabId, nextLoc, options);
        await humanPause(1e3, 1800);
      } else {
        await client.humanKeyboardPress(tabId, { key: "ArrowRight" });
        await humanPause(1e3, 1800);
      }
    }
  }
  return {
    status: "success",
    message: `browsed gallery (inline) ${viewCount}/${pageCount}`,
    data: { postId, mode: "inline", viewCount, pageCount }
  };
}
export {
  listingGalleryBrowse,
  listingImageLightbox,
  listingVideoWatch
};
