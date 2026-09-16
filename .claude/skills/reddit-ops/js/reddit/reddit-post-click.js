import { PinchTabClient } from "../api.js";
import {
  humanClickElement,
  humanMouseMove,
  humanPause,
  humanScrollDown,
  humanScrollUp,
  briefBrowseAfterAction,
  locateByJS,
  ensureTabFocus,
  JS_LISTING_BODY_ENTRY,
  JS_LISTING_COMMENTS_ENTRY
} from "./reddit-human.js";
import { getCliArg, outputResult, getCliOptions, requireTabId, runMain } from "./cli.js";
const kPostClickTag = "post-click";
const SCROLL_UP_TRAVEL = { travel: true, noReadingFollow: true, readPauseProbability: 0, scrollBackProbability: 0 };
function JS_POST_CARD(postId) {
  return `
(function(){
  // Priority 1: listing page a[data-ks-id] wrapper
  var el = document.querySelector('a[data-ks-id="${postId}"]');
  // Priority 2: shreddit-post element by id
  if (!el) {
    var posts = document.querySelectorAll('shreddit-post');
    for (var i = 0; i < posts.length; i++) {
      if (posts[i].getAttribute('id') === '${postId}') { el = posts[i]; break; }
    }
  }
  // Priority 3: any element with the id
  if (!el) el = document.getElementById('${postId}');
  // Priority 4: shreddit-post by ks-id attribute
  if (!el) {
    var posts2 = document.querySelectorAll('shreddit-post');
    for (var i = 0; i < posts2.length; i++) {
      if (posts2[i].getAttribute('ks-id') === '${postId}') { el = posts2[i]; break; }
    }
  }
  if (!el) return null;
  var r = el.getBoundingClientRect();
  if (r.width === 0 || r.height === 0) return null;
  return {
    x: Math.round(r.left + r.width / 2),
    y: Math.round(r.top + r.height / 2),
    w: Math.round(r.width),
    h: Math.round(r.height),
    attrs: { tag: el.tagName.toLowerCase(), href: el.getAttribute('href') || '' }
  };
})()
`;
}
function JS_POST_CLICK_POINT(postId) {
  return `
(function(){
  // \u2500\u2500 Strategy 1: Listing page \u2014 a[data-ks-id] wrapper \u2500\u2500
  var wrapper = document.querySelector('a[data-ks-id="${postId}"]');
  if (wrapper) {
    // Find the [slot="title"] <a> inside the wrapper
    var titleA = wrapper.querySelector('a[slot="title"]');
    if (titleA) {
      var r = titleA.getBoundingClientRect();
      if (r.width > 0 && r.height > 0) {
        return {
          x: Math.round(r.left + r.width / 2),
          y: Math.round(r.top + r.height / 2),
          w: Math.round(r.width),
          h: Math.round(r.height),
          attrs: { target: 'listing title link', href: titleA.getAttribute('href') || '' }
        };
      }
    }

    // Fallback inside wrapper: any [slot="title"] element (may be <h1> on some pages)
    var titleSlot = wrapper.querySelector('[slot="title"]');
    if (titleSlot) {
      var rs = titleSlot.getBoundingClientRect();
      if (rs.width > 0 && rs.height > 0) {
        return {
          x: Math.round(rs.left + rs.width / 2),
          y: Math.round(rs.top + rs.height / 2),
          w: Math.round(rs.width),
          h: Math.round(rs.height),
          attrs: { target: 'listing title slot' }
        };
      }
    }
  }

  // \u2500\u2500 Strategy 2: shreddit-post by id (listing or detail page) \u2500\u2500
  var post = document.getElementById('${postId}');
  if (!post || post.tagName !== 'SHREDDIT-POST') {
    // Try finding shreddit-post with matching id
    var posts = document.querySelectorAll('shreddit-post');
    for (var i = 0; i < posts.length; i++) {
      if (posts[i].getAttribute('id') === '${postId}' || posts[i].getAttribute('ks-id') === '${postId}') {
        post = posts[i];
        break;
      }
    }
  }
  if (post) {
    // Look for [slot="title"] in light DOM
    var titleA = post.querySelector('a[slot="title"]');
    if (!titleA) titleA = post.querySelector('[slot="title"] a');
    if (!titleA) titleA = post.querySelector('[slot="title"] h1, [slot="title"] h2, [slot="title"] h3');
    if (titleA) {
      var r = titleA.getBoundingClientRect();
      if (r.width > 0 && r.height > 0) {
        return {
          x: Math.round(r.left + r.width / 2),
          y: Math.round(r.top + r.height / 2),
          w: Math.round(r.width),
          h: Math.round(r.height),
          attrs: { target: 'post title link/a' }
        };
      }
    }
    var titleSlot = post.querySelector('[slot="title"]');
    if (titleSlot) {
      var rs = titleSlot.getBoundingClientRect();
      if (rs.width > 0 && rs.height > 0) {
        return {
          x: Math.round(rs.left + rs.width / 2),
          y: Math.round(rs.top + rs.height / 2),
          w: Math.round(rs.width),
          h: Math.round(rs.height),
          attrs: { target: 'post title slot' }
        };
      }
    }

    // Last resort inside shreddit-post: first visible text child
    for (var i = 0; i < post.children.length; i++) {
      var c = post.children[i];
      if (c.offsetWidth === 0 || c.offsetHeight === 0) continue;
      if ((c.textContent || '').trim().length > 10) {
        var cr = c.getBoundingClientRect();
        return {
          x: Math.round(cr.left + cr.width / 2),
          y: Math.round(cr.top + cr.height / 2),
          w: Math.round(cr.width),
          h: Math.round(cr.height),
          attrs: { target: 'post first text child' }
        };
      }
    }
  }

  // \u2500\u2500 Strategy 3: Last-resort fallback \u2014 any element with the id \u2500\u2500
  var any = document.getElementById('${postId}');
  if (any) {
    var r = any.getBoundingClientRect();
    if (r.width > 0 && r.height > 0) {
      var upperH = Math.round(r.height * 0.25);
      return {
        x: Math.round(r.left + r.width / 2),
        y: Math.round(r.top + upperH / 2),
        w: Math.round(r.width * 0.6),
        h: upperH,
        attrs: { target: 'element upper 25%' }
      };
    }
  }

  return null;
})()
`;
}
async function resolveClickEntry(client, tabId, postId, entry) {
  if (entry === "title") return { entry: "title", selector: JS_POST_CLICK_POINT(postId) };
  if (entry === "body") return { entry: "body", selector: JS_LISTING_BODY_ENTRY(postId) };
  if (entry === "comments") return { entry: "comments", selector: JS_LISTING_COMMENTS_ENTRY(postId) };
  const candidates = [
    { entry: "title", selector: JS_POST_CLICK_POINT(postId), weight: 0.6 },
    { entry: "comments", selector: JS_LISTING_COMMENTS_ENTRY(postId), weight: 0.25 },
    { entry: "body", selector: JS_LISTING_BODY_ENTRY(postId), weight: 0.15 }
  ];
  const reachable = [];
  for (const c of candidates) {
    if (await locateByJS(client, tabId, c.selector)) reachable.push(c);
  }
  if (reachable.length === 0) return { entry: "title", selector: JS_POST_CLICK_POINT(postId) };
  const total = reachable.reduce((s, c) => s + c.weight, 0);
  let r = Math.random() * total;
  for (const c of reachable) {
    r -= c.weight;
    if (r <= 0) return { entry: c.entry, selector: c.selector };
  }
  return { entry: reachable[0].entry, selector: reachable[0].selector };
}
async function findPostInDOM(client, tabId, postId, speed = "normal", browseEndScrollY) {
  let loc = await locateByJS(client, tabId, JS_POST_CARD(postId));
  if (loc) return loc;
  const initEnv = await client.viewportGet(tabId);
  const vh = initEnv.vh;
  const fast = speed === "fast";
  const nearTop = initEnv.scrollY < 1800;
  const SEARCH_UP_CAP = 40;
  const roundScrollPx = () => Math.round(vh * (0.8 + Math.random() * 0.4));
  const renderWait = () => humanPause(fast ? 300 : 500, fast ? 500 : 800);
  const scrollYCeiling = browseEndScrollY !== void 0 ? browseEndScrollY + Math.round(vh * 2.5) : void 0;
  async function scrollDownSearch(maxRounds) {
    for (let round = 0; round < maxRounds; round++) {
      await humanScrollDown(client, tabId, roundScrollPx(), {
        travel: true,
        readPauseProbability: fast ? 0 : 0.05,
        scrollBackProbability: fast ? 0 : 0.02,
        noReadingFollow: fast ? true : false
      });
      await renderWait();
      loc = await locateByJS(client, tabId, JS_POST_CARD(postId));
      if (loc) {
        client.logInfo(tabId, `[click] found post after scrolling down (round ${round + 1})`, [kPostClickTag]);
        return loc;
      }
      const env = await client.viewportGet(tabId);
      if (scrollYCeiling !== void 0 && env.scrollY >= scrollYCeiling) {
        client.logInfo(tabId, `[click] passed browse-end ceiling ${scrollYCeiling}px (round ${round + 1}) \u2014 target not below, stop.`, [kPostClickTag]);
        return null;
      }
      if (env.scrollY + env.vh >= env.scrollHeight - 400) {
        client.logInfo(tabId, `[click] reached feed bottom (round ${round + 1}), waiting for lazy-load...`, [kPostClickTag]);
        await humanPause(fast ? 600 : 900, fast ? 1e3 : 1500);
        loc = await locateByJS(client, tabId, JS_POST_CARD(postId));
        if (loc) client.logInfo(tabId, "[click] post appeared after final wait", [kPostClickTag]);
        return loc ?? null;
      }
    }
    return null;
  }
  async function scrollUpSearch(maxRoundsCap) {
    let prevScrollY = Infinity;
    for (let round = 0; round < maxRoundsCap; round++) {
      const { scrollY } = await client.viewportGet(tabId);
      if (scrollY <= 10) {
        client.logInfo(tabId, `[click] reached top (round ${round + 1}), polling for re-render...`, [kPostClickTag]);
        for (let t = 0; t < 6; t++) {
          await humanPause(450, 800);
          loc = await locateByJS(client, tabId, JS_POST_CARD(postId));
          if (loc) {
            client.logInfo(tabId, `[click] found post after reaching top (poll ${t + 1})`, [kPostClickTag]);
            return loc;
          }
        }
        return null;
      }
      await humanScrollUp(client, tabId, Math.min(scrollY, roundScrollPx()), SCROLL_UP_TRAVEL);
      await renderWait();
      loc = await locateByJS(client, tabId, JS_POST_CARD(postId));
      if (loc) {
        client.logInfo(tabId, `[click] found post while scanning up (round ${round + 1})`, [kPostClickTag]);
        return loc;
      }
      if (scrollY >= prevScrollY - 50) {
        client.logWarn(tabId, `[click] scrollUp stalled at scrollY=${scrollY}`, [kPostClickTag]);
        break;
      }
      prevScrollY = scrollY;
    }
    return null;
  }
  const downCap = scrollYCeiling !== void 0 ? 30 : fast ? 6 : 10;
  if (nearTop) {
    client.logInfo(tabId, `[click] post not in DOM, near top \u2014 searching down first...`, [kPostClickTag]);
    loc = await scrollDownSearch(downCap);
    if (!loc) {
      client.logInfo(tabId, `[click] not found below, scrolling up to top...`, [kPostClickTag]);
      loc = await scrollUpSearch(SEARCH_UP_CAP);
    }
  } else {
    client.logInfo(tabId, `[click] post not in DOM, deep \u2014 scrolling up to top first (unloaded posts live above)...`, [kPostClickTag]);
    loc = await scrollUpSearch(SEARCH_UP_CAP);
    if (!loc) {
      client.logInfo(tabId, `[click] not found above, searching down as fallback...`, [kPostClickTag]);
      loc = await scrollDownSearch(downCap);
    }
  }
  return loc ?? null;
}
async function adjustPostIntoView(client, tabId, postId, cardLoc, fast = false) {
  const titleLoc = await locateByJS(client, tabId, JS_POST_CLICK_POINT(postId));
  const ref = titleLoc ?? cardLoc;
  const { vh } = await client.viewportGet(tabId);
  const elTop = ref.y - Math.round(ref.h / 2);
  const elBottom = ref.y + Math.round(ref.h / 2);
  const topMargin = 80;
  const bottomMargin = 200;
  if (elTop < topMargin) {
    const overflow = topMargin - elTop;
    const adjustPx = overflow + 100 + Math.round(Math.random() * 100);
    client.logInfo(tabId, `[click] post above viewport, scrolling up ${adjustPx}px...`, [kPostClickTag]);
    await humanScrollUp(client, tabId, adjustPx, fast ? SCROLL_UP_TRAVEL : void 0);
  } else if (elBottom > vh - bottomMargin) {
    const overflow = elBottom - (vh - bottomMargin);
    const adjustPx = overflow + 80 + Math.round(Math.random() * 100);
    client.logInfo(tabId, `[click] post below comfortable zone, scrolling down ${adjustPx}px...`, [kPostClickTag]);
    await humanScrollDown(client, tabId, adjustPx, {
      travel: true,
      readPauseProbability: fast ? 0 : 0.15,
      scrollBackProbability: 0,
      noReadingFollow: fast
    });
  } else {
    client.logInfo(tabId, `[click] post already in comfortable zone (elTop=${elTop}, vh=${vh})`, [kPostClickTag]);
    return cardLoc;
  }
  return await locateByJS(client, tabId, JS_POST_CARD(postId));
}
async function clickPost(client, tabId, postId, options) {
  await ensureTabFocus(client, tabId);
  client.logInfo(tabId, `Starting clickPost for ${postId}`, [kPostClickTag]);
  const speed = options?.speed ?? (Math.random() < 0.8 ? "fast" : "normal");
  const fast = speed === "fast";
  client.logInfo(tabId, `[click] search speed: ${speed}`, [kPostClickTag]);
  const cardLoc = await findPostInDOM(client, tabId, postId, speed, options?.browseEndScrollY);
  if (!cardLoc) {
    client.logError(tabId, `Post ${postId} not found in listing page`, [kPostClickTag]);
    return {
      status: "failed",
      message: `could not locate post ${postId} in listing page`,
      data: { postId }
    };
  }
  client.logInfo(tabId, `Post found in DOM at (${cardLoc.x}, ${cardLoc.y}), size ${cardLoc.w}x${cardLoc.h}`, [kPostClickTag]);
  const loc = await adjustPostIntoView(client, tabId, postId, cardLoc, fast);
  if (!loc) {
    client.logError(tabId, `Post ${postId} lost after viewport adjustment`, [kPostClickTag]);
    return {
      status: "failed",
      message: `post ${postId} disappeared after viewport adjustment`,
      data: { postId }
    };
  }
  const entry = options?.entry ?? "auto";
  const { entry: chosenEntry, selector: entrySelector } = await resolveClickEntry(client, tabId, postId, entry);
  let clickLoc = await locateByJS(client, tabId, entrySelector);
  if (!clickLoc && chosenEntry !== "title") {
    client.logWarn(tabId, `[click] ${chosenEntry} entry not located, falling back to title`, [kPostClickTag]);
    clickLoc = await locateByJS(client, tabId, JS_POST_CLICK_POINT(postId));
  }
  const target = clickLoc ?? loc;
  if (clickLoc) {
    client.logInfo(tabId, `[click] entry=${chosenEntry}, clicking at (${clickLoc.x}, ${clickLoc.y})`, [kPostClickTag]);
  } else {
    client.logWarn(tabId, "Click point not found, using card center fallback", [kPostClickTag]);
  }
  const nearX = target.x + Math.round((Math.random() - 0.5) * 30);
  const nearY = target.y - Math.round(target.h * 0.4 + Math.random() * 10);
  await humanMouseMove(client, tabId, nearX, nearY);
  await humanPause(150, 400);
  client.logInfo(tabId, `[click] clicking post at (${target.x}, ${target.y})...`, [kPostClickTag]);
  await humanClickElement(client, tabId, target, { skipMoveAway: true });
  client.logInfo(tabId, "[click] waiting for navigation...", [kPostClickTag]);
  await humanPause(1e3, 2e3);
  const onDetail = await isPostDetailPage(client, tabId);
  if (onDetail) {
    client.logInfo(tabId, `Click success \u2014 navigated to post detail page`, [kPostClickTag]);
    if (!fast) {
      await humanPause(500, 1500);
      await briefBrowseAfterAction(client, tabId);
    } else {
      client.logWarn(tabId, "[click] landed on post detail page (fast mode, skip browse)", [kPostClickTag]);
    }
  } else {
    client.logWarn(tabId, "Still on listing page after click, navigation may have failed", [kPostClickTag]);
  }
  client.logInfo(tabId, "[click] done", [kPostClickTag]);
  return {
    status: "success",
    message: `clicked post ${postId}`,
    data: { postId, navigated: onDetail }
  };
}
async function isPostDetailPage(client, tabId) {
  try {
    const result = await client.evaluateV2(
      tabId,
      `(function(){return !!(location.pathname.match(/\\/comments\\//) && document.querySelector('shreddit-post'));})()`
    );
    return !!result.result;
  } catch {
    return false;
  }
}
async function main() {
  const cli = await getCliOptions();
  const tabId = requireTabId();
  const postId = getCliArg("post-id");
  if (!postId) {
    console.log(
      JSON.stringify({ status: "failed", message: "--post-id is required" })
    );
    process.exit(1);
  }
  const client = new PinchTabClient({ baseUrl: cli.baseUrl, token: cli.token });
  const entryArg = getCliArg("entry");
  const browseEndScrollYStr = getCliArg("browse-end-scroll");
  const browseEndScrollY = browseEndScrollYStr ? parseInt(browseEndScrollYStr, 10) : void 0;
  const result = await clickPost(client, tabId, postId, {
    ...entryArg ? { entry: entryArg } : {},
    ...browseEndScrollY !== void 0 ? { browseEndScrollY } : {}
  });
  outputResult(result);
}
runMain(main, "reddit-post-click.ts");
export {
  clickPost
};
