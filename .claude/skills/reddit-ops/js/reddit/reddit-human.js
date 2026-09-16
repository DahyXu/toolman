const TRAVEL_CHUNK_MEAN = 400;
const DEFAULT_CFG = {
  scrollSpeedRange: [40, 100],
  readPauseProbability: 0.35,
  scrollBackProbability: 0.08,
  noReadingFollow: false,
  interest: 0.5,
  skipMoveAway: false,
  travel: false
};
function cfg(c) {
  return { ...DEFAULT_CFG, ...c };
}
function gaussianRandom(mean, stddev) {
  const u1 = Math.random();
  const u2 = Math.random();
  const v = Math.sqrt(-2 * Math.log(u1 || 1e-10)) * Math.cos(2 * Math.PI * u2);
  return Math.max(0, mean + stddev * v);
}
function clamp(val, lo, hi) {
  return Math.max(lo, Math.min(hi, val));
}
async function humanPause(minMs = 500, maxMs = 1500) {
  const ms = Math.floor(Math.random() * (maxMs - minMs) + minMs);
  await new Promise((r) => setTimeout(r, ms));
}
function humanClickPoint(loc) {
  const sigmaX = loc.w * 0.22;
  const sigmaY = loc.h * 0.22;
  const insetX = Math.max(3, Math.round(loc.w * 0.1));
  const insetY = Math.max(3, Math.round(loc.h * 0.1));
  const minX = loc.x - loc.w / 2 + insetX;
  const maxX = loc.x + loc.w / 2 - insetX;
  const minY = loc.y - loc.h / 2 + insetY;
  const maxY = loc.y + loc.h / 2 - insetY;
  return {
    x: Math.round(clamp(loc.x + sigmaX * symmetricNormal(), minX, maxX)),
    y: Math.round(clamp(loc.y + sigmaY * symmetricNormal(), minY, maxY))
  };
}
function symmetricNormal() {
  const u1 = Math.random() || 1e-10;
  const u2 = Math.random();
  return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
}
async function humanMouseMove(client, tabId, endX, endY) {
  await client.humanMouseMove(tabId, { x: endX, y: endY });
  if (Math.random() < 0.4) {
    await new Promise((r) => setTimeout(r, 20));
    const tremorX = endX + Math.round((Math.random() - 0.5) * 3);
    const tremorY = endY + Math.round((Math.random() - 0.5) * 3);
    await client.humanMouseMove(tabId, { x: tremorX, y: tremorY });
  }
}
async function readingFollowMove(client, tabId, scrollDeltaY) {
  const readingCenterX = 600 + Math.round((Math.random() - 0.5) * 200);
  const readingCenterY = 350 + Math.round((Math.random() - 0.5) * 100);
  const horizDrift = Math.round((Math.random() - 0.5) * 70);
  const readingCenter = 350;
  const vertBias = scrollDeltaY > 0 ? 10 + Math.round(Math.random() * 20) : -(10 + Math.round(Math.random() * 20));
  const centerPull = Math.round((readingCenter - readingCenterY) * (0.3 + Math.random() * 0.2));
  const vertOffset = vertBias + centerPull;
  const targetX = clamp(readingCenterX + horizDrift, 250, 1e3);
  const targetY = clamp(readingCenterY + vertOffset, 150, 550);
  await client.humanMouseMove(tabId, { x: targetX, y: targetY });
}
async function readingTremor(client, tabId) {
  await client.humanMouseTremor(tabId);
}
async function humanClick(client, tabId, targetX, targetY, options) {
  await client.humanMouseClick(tabId, { x: targetX, y: targetY });
  if (!options?.skipMoveAway) {
    const awayAngle = Math.random() * Math.PI * 2;
    const awayDist = 10 + Math.round(Math.random() * 20);
    const awayX = Math.round(targetX + Math.cos(awayAngle) * awayDist);
    const awayY = Math.round(targetY + Math.sin(awayAngle) * awayDist);
    await client.humanMouseMove(tabId, { x: awayX, y: awayY });
  }
}
async function humanClickElement(client, tabId, loc, options) {
  let pt = humanClickPoint(loc);
  try {
    const { vh, vw } = await client.viewportGet(tabId);
    const clampHi = (n, hi) => n > hi - 10 ? Math.round(hi - 10 + Math.random() * 10) : n;
    const clampLo = (n, lo) => n < lo + 10 ? Math.round(lo + Math.random() * 10) : n;
    pt = {
      ...pt,
      x: vw ? clampHi(clampLo(pt.x, 0), vw) : pt.x,
      y: vh ? clampHi(clampLo(pt.y, 0), vh) : pt.y
    };
  } catch {
  }
  await humanClick(client, tabId, pt.x, pt.y, options);
}
async function humanScrollDown(client, tabId, totalPixels, options) {
  const c = cfg(options);
  if (c.travel) {
    if (totalPixels === 0) return;
    const wx = clamp(600 + Math.round((Math.random() - 0.5) * 200), 50, 1230);
    const wy = clamp(400 + Math.round((Math.random() - 0.5) * 150), 50, 750);
    await client.humanMouseScroll(tabId, {
      x: wx,
      y: wy,
      totalPx: totalPixels,
      chunkMean: TRAVEL_CHUNK_MEAN,
      backtrackProb: 0
    });
    if (!c.noReadingFollow) await readingFollowMove(client, tabId, totalPixels);
    return;
  }
  const follow = !c.noReadingFollow;
  let remaining = totalPixels;
  while (remaining > 0) {
    const tickCount = 1 + Math.floor(Math.random() * 3);
    const burstPx = Math.min(
      remaining,
      Math.round(
        tickCount * (c.scrollSpeedRange[0] + Math.random() * (c.scrollSpeedRange[1] - c.scrollSpeedRange[0]))
      )
    );
    const wx = clamp(600 + Math.round((Math.random() - 0.5) * 200), 50, 1230);
    const wy = clamp(400 + Math.round((Math.random() - 0.5) * 150), 50, 750);
    await client.humanMouseScroll(tabId, {
      x: wx,
      y: wy,
      totalPx: burstPx,
      chunkMean: Math.round((c.scrollSpeedRange[0] + c.scrollSpeedRange[1]) / 2),
      backtrackProb: c.scrollBackProbability
    });
    remaining -= burstPx;
    if (follow) {
      await readingFollowMove(client, tabId, burstPx);
    }
    if (Math.random() < c.readPauseProbability) {
      const pauseMs = clamp(gaussianRandom(1200, 600), 400, 3e3);
      if (follow) {
        await readingTremor(client, tabId);
      }
      await new Promise((r) => setTimeout(r, pauseMs));
    } else {
      const gapMs = c.readPauseProbability > 0 ? clamp(gaussianRandom(250, 100), 120, 500) : clamp(gaussianRandom(80, 30), 40, 160);
      await new Promise((r) => setTimeout(r, gapMs));
    }
  }
}
async function humanScrollUp(client, tabId, totalPixels, options) {
  return humanScrollDown(client, tabId, -totalPixels, { ...options, travel: true });
}
async function pageWarmUp(client, tabId) {
  console.log("[warmup] simulating page browsing...");
  const moveCount = 2 + Math.floor(Math.random() * 3);
  for (let i = 0; i < moveCount; i++) {
    const target = randomViewportPosition();
    await humanMouseMove(client, tabId, target.x, target.y);
    await humanPause(200, 600);
  }
  const pauseMs = 2e3 + Math.round(Math.random() * 3e3);
  console.log(`[warmup] reading pause ${(pauseMs / 1e3).toFixed(1)}s...`);
  await new Promise((r) => setTimeout(r, pauseMs));
}
async function clickBlankArea(client, tabId) {
  const JS_FIND_BLANK = `(function(){
    function isInteractive(el){
      // Walk up the ancestor chain \u2014 elementFromPoint often returns a child
      // (span/icon) inside a button, and custom-element hosts (e.g.
      // r-post-form-submit-button) expose their clickable inner button in
      // shadow DOM, so the host tag itself must be checked.
      for(var i=0;i<6&&el;i++){
        var tag=(el.tagName||'').toLowerCase();
        if(['button','input','a','textarea','select'].indexOf(tag)>=0) return true;
        if(tag.indexOf('button')>=0) return true; // custom elements like r-post-form-submit-button
        if(tag.indexOf('link')>=0) return true;   // custom link elements like shreddit-dynamic-ad-link
        if(el.getAttribute){
          if(el.getAttribute('contenteditable')==='true') return true;
          var role=el.getAttribute('role');
          if(role==='button'||role==='link'||role==='checkbox'||role==='radio'||role==='tab'||role==='menuitem'||role==='option'||role==='combobox') return true;
        }
        el=el.parentElement;
      }
      return false;
    }
    var vw=window.innerWidth, vh=window.innerHeight;
    for(var i=0;i<8;i++){
      var x=Math.floor(Math.random()*(vw-40))+20;
      var y=Math.floor(Math.random()*(vh-40))+20;
      var el=document.elementFromPoint(x,y);
      if(!isInteractive(el)){
        return JSON.stringify({x:x,y:y,tag:el?(el.tagName||'').toLowerCase():'none'});
      }
    }
    return JSON.stringify(null);
  })()`;
  const result = await client.evaluateV2(tabId, JS_FIND_BLANK);
  const point = parseEvalResult(result?.result ?? result);
  if (!point) {
    const fx = 30, fy = 200;
    console.log(`[click-blank] all samples interactive, clicking gutter (${fx},${fy})`);
    await client.humanMouseClick(tabId, { x: fx, y: fy });
    return { x: fx, y: fy };
  }
  console.log(`[click-blank] clicking blank point (${point.x},${point.y}) on <${point.tag}>`);
  await client.humanMouseClick(tabId, { x: point.x, y: point.y });
  return { x: point.x, y: point.y };
}
async function settleAfterLoad(client, tabId) {
  console.log("[settle] settling on page before interaction...");
  const moveCount = 2 + Math.floor(Math.random() * 2);
  for (let i = 0; i < moveCount; i++) {
    const target = randomViewportPosition();
    await humanMouseMove(client, tabId, target.x, target.y);
    await humanPause(200, 600);
  }
  await clickBlankArea(client, tabId);
  await humanPause(2e3, 5e3);
  console.log("[settle] done");
}
async function mouseScanReview(client, tabId, jsLocator) {
  const loc = await locateAndScrollByJS(client, tabId, jsLocator);
  if (!loc) {
    console.log("[scan-review] element not found, skipping");
    return;
  }
  const sweeps = 2 + Math.floor(Math.random() * 2);
  const left = loc.x - loc.w / 2 + 10;
  const right = loc.x + loc.w / 2 - 10;
  for (let s = 0; s < sweeps; s++) {
    const yStart = loc.y - loc.h / 2 + Math.random() * loc.h;
    await client.humanMouseMove(tabId, { x: Math.round(left), y: Math.round(yStart) });
    await humanPause(300, 700);
    const mids = 1 + Math.floor(Math.random() * 2);
    for (let m = 1; m <= mids; m++) {
      const mx = left + (right - left) * (m / (mids + 1));
      const my = loc.y - loc.h / 2 + Math.random() * loc.h;
      await client.humanMouseMove(tabId, { x: Math.round(mx), y: Math.round(my) });
      await humanPause(300, 700);
    }
    const yEnd = loc.y - loc.h / 2 + Math.random() * loc.h;
    await client.humanMouseMove(tabId, { x: Math.round(right), y: Math.round(yEnd) });
    await humanPause(400, 1e3);
  }
  console.log(`[scan-review] scanned element (${sweeps} sweeps)`);
}
async function refocusAndBlurTitle(client, tabId, titleLocator) {
  const loc = await locateAndScrollByJS(client, tabId, titleLocator);
  if (!loc) {
    console.log("[refocus-blur] title not found, skipping");
    return;
  }
  await humanClickElement(client, tabId, loc);
  await humanPause(600, 1400);
  await clickBlankArea(client, tabId);
  await humanPause(500, 1200);
  console.log("[refocus-blur] re-focused title then clicked away");
}
async function quickScrollDown(client, tabId, totalPixels) {
  let remaining = totalPixels;
  while (remaining > 0) {
    const stepPx = Math.min(remaining, 400 + Math.round(Math.random() * 200));
    const wx = 600 + Math.round((Math.random() - 0.5) * 200);
    const wy = 400 + Math.round((Math.random() - 0.5) * 150);
    await client.humanMouseScroll(tabId, { x: wx, y: wy, totalPx: stepPx, chunkMean: 150 });
    remaining -= stepPx;
    await humanPause(500, 1e3);
  }
}
async function scrollToTop(client, tabId) {
  for (let round = 0; round < 20; round++) {
    const { scrollY: curScrollY } = await client.viewportGet(tabId);
    if (curScrollY <= 5) break;
    const burstPx = Math.min(curScrollY, 300 + Math.round(Math.random() * 300));
    const wx = 600 + Math.round((Math.random() - 0.5) * 200);
    const wy = 400 + Math.round((Math.random() - 0.5) * 150);
    await client.humanMouseScroll(tabId, { x: wx, y: wy, totalPx: -burstPx, chunkMean: 150 });
    await humanPause(80, 200);
  }
  await humanPause(200, 400);
}
async function scrollToTopHuman(client, tabId) {
  for (let round = 0; round < 25; round++) {
    const { scrollY: curScrollY } = await client.viewportGet(tabId);
    if (curScrollY <= 5) break;
    const burstPx = Math.min(curScrollY, 250 + Math.round(Math.random() * 250));
    const wx = 600 + Math.round((Math.random() - 0.5) * 200);
    const wy = 400 + Math.round((Math.random() - 0.5) * 150);
    await client.humanMouseScroll(tabId, { x: wx, y: wy, totalPx: -burstPx, chunkMean: 150 });
    await readingFollowMove(client, tabId, -burstPx);
    if (Math.random() < 0.12) {
      await readingTremor(client, tabId);
      await humanPause(300, 800);
    } else {
      await humanPause(80, 180);
    }
  }
  await humanPause(200, 400);
}
async function briefBrowseAfterAction(client, tabId, options) {
  const scrollPx = 50 + Math.round(Math.random() * 150);
  await humanScrollDown(client, tabId, scrollPx, {
    ...options,
    readPauseProbability: 0.3,
    scrollBackProbability: 0.05,
    noReadingFollow: false
  });
  await humanPause(800, 2500);
}
async function clearFocusedText(client, tabId) {
  const JS_LIST_NON_EMPTY = `(function(){
    var results = [];
    var ces = document.querySelectorAll('div[contenteditable="true"]');
    for (var i = 0; i < ces.length; i++) {
      var txt = (ces[i].textContent || '').trim();
      if (txt.length > 0) {
        var r = ces[i].getBoundingClientRect();
        if (r.width > 0) {
          results.push({idx: i, len: txt.length, x: Math.round(r.left + r.width/2), y: Math.round(r.top + r.height/2)});
        }
      }
    }
    var rtes = document.querySelectorAll('reddit-rte');
    for (var i = 0; i < rtes.length; i++) {
      if (!rtes[i].shadowRoot) continue;
      var ta = rtes[i].shadowRoot.querySelector('textarea');
      if (ta && ta.value && ta.value.trim().length > 0) {
        var r = ta.getBoundingClientRect();
        if (r.width > 0) {
          results.push({idx: -1, source: 'redditRte', len: ta.value.trim().length, x: Math.round(r.left + r.width/2), y: Math.round(r.top + r.height/2)});
        }
      }
    }
    var host = document.querySelector('comment-composer-host');
    if (host) {
      var ta2 = host.querySelector('textarea');
      if (ta2 && ta2.value && ta2.value.trim().length > 0) {
        var r = ta2.getBoundingClientRect();
        if (r.width > 0) {
          results.push({idx: -2, source: 'composerHostTA', len: ta2.value.trim().length, x: Math.round(r.left + r.width/2), y: Math.round(r.top + r.height/2)});
        }
      }
    }
    return JSON.stringify(results);
  })()`;
  const JS_READ_CE_LEN = (idx) => `(function(){
    var ces = document.querySelectorAll('[contenteditable="true"]');
    if (idx < 0 || idx >= ces.length) return -1;
    return (ces[${idx}].textContent || '').trim().length;
  })()`;
  const JS_READ_TA_LEN = (source) => {
    if (source === "composerHostTA") {
      return `(function(){var h=document.querySelector('comment-composer-host');if(!h)return -1;var ta=h.querySelector('textarea');if(!ta)return -1;return(ta.value||'').trim().length;})()`;
    }
    return `(function(){var rtes=document.querySelectorAll('reddit-rte');for(var i=0;i<rtes.length;i++){if(!rtes[i].shadowRoot)continue;var ta=rtes[i].shadowRoot.querySelector('textarea');if(ta){var v=(ta.value||'').trim();if(v.length>0)return v.length}}return -1;})()`;
  };
  const checkResult = await client.evaluateV2(tabId, JS_LIST_NON_EMPTY);
  let targets;
  try {
    targets = typeof checkResult.result === "string" ? JSON.parse(checkResult.result) : checkResult.result;
  } catch {
    return false;
  }
  if (!targets || targets.length === 0) return false;
  console.log(`[clear] found ${targets.length} non-empty textarea(s):`, targets.map((t) => `${t.len}ch@idx${t.idx}${t.source ? "(" + t.source + ")" : ""}`).join(", "));
  let allCleared = true;
  for (const target of targets) {
    console.log(`[clear] clearing ${target.len} chars at idx=${target.idx}${target.source ? " (" + target.source + ")" : ""}...`);
    try {
      await client.humanMouseClick(tabId, { x: target.x, y: target.y });
    } catch (err) {
      console.log(`[clear] click failed, trying keyboard focus: ${err?.message || err}`);
    }
    await humanPause(200, 400);
    await client.humanKeyboardPress(tabId, { key: "End" });
    await humanPause(100, 200);
    const readLenJS = target.source ? JS_READ_TA_LEN(target.source) : JS_READ_CE_LEN(target.idx);
    let remaining = target.len;
    let noProgressBatches = 0;
    const BATCH_SIZE = 8;
    for (let batch = 0; batch < 30; batch++) {
      const count = Math.min(BATCH_SIZE, remaining + 3);
      for (let i = 0; i < count; i++) {
        await client.humanKeyboardPress(tabId, { key: "Backspace" });
        await humanPause(15, 55);
      }
      await humanPause(80, 150);
      let newRemaining = 0;
      try {
        const r = await client.evaluateV2(tabId, readLenJS);
        newRemaining = Number(r.result) || 0;
      } catch {
        newRemaining = Math.max(0, remaining - BATCH_SIZE);
      }
      if (newRemaining <= 0) {
        console.log(`[clear] idx=${target.idx} cleared after ${batch + 1} batches`);
        remaining = 0;
        break;
      }
      if (newRemaining >= remaining) {
        noProgressBatches++;
        if (noProgressBatches >= 3) {
          console.log(`[clear] idx=${target.idx} stuck at ${newRemaining} chars, trying JS fallback`);
          break;
        }
      } else {
        noProgressBatches = 0;
      }
      remaining = newRemaining;
    }
    if (remaining > 0) {
      if (target.source) {
        try {
          await client.evaluateV2(tabId, target.source === "composerHostTA" ? `(function(){var h=document.querySelector('comment-composer-host');if(h){var ta=h.querySelector('textarea');if(ta){ta.value='';ta.dispatchEvent(new Event('input',{bubbles:true}))}}return'ok';})()` : `(function(){var rtes=document.querySelectorAll('reddit-rte');for(var i=0;i<rtes.length;i++){if(!rtes[i].shadowRoot)continue;var ta=rtes[i].shadowRoot.querySelector('textarea');if(ta&&ta.value.trim().length>0){ta.value='';ta.dispatchEvent(new Event('input',{bubbles:true}))}}return'ok';})()`);
        } catch (err) {
          console.log(`[clear] JS textarea clear failed: ${err?.message || err}`);
        }
      } else {
        try {
          await client.evaluateV2(tabId, `(function(){var ces=document.querySelectorAll('[contenteditable="true"]');var ce=ces[${target.idx}];if(ce&&(ce.textContent||'').trim().length>0){ce.innerHTML='<p class="first:mt-0 last:mb-0"><br></p>';ce.dispatchEvent(new Event('input',{bubbles:true}));}return'ok';})()`);
        } catch (err) {
          console.log(`[clear] JS ce clear failed: ${err?.message || err}`);
        }
      }
      await humanPause(200, 400);
      try {
        const finalCheck = await client.evaluateV2(tabId, readLenJS);
        const finalRemaining = Number(finalCheck.result) || 0;
        if (finalRemaining > 0) {
          console.log(`[clear] idx=${target.idx} still has ${finalRemaining} chars after JS fallback`);
          allCleared = false;
        } else {
          console.log(`[clear] idx=${target.idx} JS fallback succeeded`);
        }
      } catch {
        allCleared = false;
      }
    }
  }
  return allCleared;
}
const JS_TOPLEVEL_TEXT_LEN = `
(function(){var hosts=document.querySelectorAll('comment-composer-host');for(var i=0;i<hosts.length;i++){if(hosts[i].closest('shreddit-comment[thingid]'))continue;var ce=hosts[i].querySelector('[contenteditable="true"]');if(ce){var r=ce.getBoundingClientRect();if(r.width>0)return (ce.textContent||'').trim().length}}return 0})()
`;
const JS_REPLY_TEXT_LEN = (thingId) => `
(function(){var el=document.querySelector('shreddit-comment[thingid="${thingId}"]');if(!el)return 0;var slots=el.querySelectorAll('[slot="comment-composer"], [slot="ready"], [slot="next-reply"]');for(var i=0;i<slots.length;i++){var ta=slots[i].querySelector('[contenteditable="true"], [role="textbox"]');if(ta){var r=ta.getBoundingClientRect();if(r.width>0)return (ta.textContent||'').trim().length}}return 0})()
`;
async function clearComposerText(client, tabId, readLenJS) {
  let remaining;
  try {
    const r = await client.evaluateV2(tabId, readLenJS);
    remaining = Number(r.result) || 0;
  } catch {
    remaining = 0;
  }
  if (remaining <= 0) {
    console.log("[clear] composer already empty");
    return true;
  }
  console.log(`[clear] clearing ${remaining} chars from target composer`);
  await client.humanKeyboardPress(tabId, { key: "End" });
  await humanPause(100, 200);
  const BATCH_SIZE = 8;
  let noProgress = 0;
  for (let batch = 0; batch < 40; batch++) {
    const count = Math.min(BATCH_SIZE, remaining + 3);
    for (let i = 0; i < count; i++) {
      await client.humanKeyboardPress(tabId, { key: "Backspace" });
      await humanPause(15, 55);
    }
    await humanPause(80, 150);
    let now;
    try {
      const r = await client.evaluateV2(tabId, readLenJS);
      now = Number(r.result) || 0;
    } catch {
      now = Math.max(0, remaining - BATCH_SIZE);
    }
    if (now >= remaining) {
      noProgress++;
      if (noProgress >= 2) {
        console.log("[clear] backspace stalled, trying Ctrl+A + Delete");
        await client.humanKeyboardCombo(tabId, { modifiers: ["ctrl"], key: "a" });
        await humanPause(80, 150);
        await client.humanKeyboardPress(tabId, { key: "Backspace" });
        await humanPause(150, 300);
        try {
          const r = await client.evaluateV2(tabId, readLenJS);
          now = Number(r.result) || 0;
        } catch {
          now = 0;
        }
        break;
      }
    } else {
      noProgress = 0;
    }
    remaining = now;
    if (remaining <= 0) {
      console.log(`[clear] target composer cleared after ${batch + 1} batches`);
      break;
    }
  }
  try {
    const r = await client.evaluateV2(tabId, readLenJS);
    remaining = Number(r.result) || 0;
  } catch {
    remaining = 0;
  }
  return remaining <= 0;
}
async function findInstanceIdForTab(client, tabId) {
  try {
    const allTabs = await client.instancesTabsAll();
    if (!Array.isArray(allTabs)) return void 0;
    return allTabs.find((t) => t.id === tabId)?.instanceId;
  } catch {
    return void 0;
  }
}
async function waitForNewTab(client, instanceId, beforeIds, timeoutMs = 1e4) {
  if (!instanceId) return null;
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    await new Promise((r) => setTimeout(r, 500));
    try {
      const tabs = await client.instanceTabsList(instanceId);
      const nt = tabs.find((t) => !beforeIds.has(t.id));
      if (nt) return nt;
    } catch {
    }
  }
  return null;
}
async function middleClickAt(client, tabId, loc) {
  const pt = humanClickPoint(loc);
  await client.mouseDown(tabId, { x: pt.x, y: pt.y, button: "middle" });
  await new Promise((r) => setTimeout(r, 60 + Math.round(Math.random() * 80)));
  await client.mouseUp(tabId, { x: pt.x, y: pt.y, button: "middle" });
}
async function simulateTabSwitch(client, tabId) {
  const roll = Math.random();
  let awayMs;
  if (roll < 0.6) {
    awayMs = 5e3 + Math.round(Math.random() * 25e3);
  } else if (roll < 0.85) {
    awayMs = 3e4 + Math.round(Math.random() * 9e4);
  } else {
    awayMs = 12e4 + Math.round(Math.random() * 18e4);
  }
  console.log(
    `[browse] switching away from tab for ~${Math.round(awayMs / 1e3)}s...`
  );
  const instanceId = await findInstanceIdForTab(client, tabId);
  if (!instanceId) {
    console.log("[browse] could not find instance for tab, waiting without tab switch");
  }
  let newTabId;
  if (instanceId) {
    try {
      const newTab = await client.instanceTabsOpen(instanceId, "https://www.google.com");
      newTabId = newTab?.tabId || newTab?.id;
    } catch {
      console.log("[browse] instanceTabsOpen failed, waiting without tab switch");
    }
  }
  if (newTabId) {
    try {
      await client.tabFocus(newTabId);
    } catch {
    }
  }
  await new Promise((r) => setTimeout(r, awayMs));
  if (newTabId) {
    try {
      await client.tabFocus(tabId);
    } catch {
    }
    try {
      await client.tabClose(newTabId);
    } catch {
    }
  }
  await humanPause(500, 1e3);
  console.log("[browse] returned to tab");
}
function createTabSwitchScheduler(config) {
  const maxFires = config.maxFires ?? 2;
  const decay = config.decay ?? 0.4;
  const random = config.random ?? Math.random;
  let firedCount = 0;
  return {
    async maybeSwitch(slot) {
      if (firedCount >= maxFires) return;
      const baseP = config.slots[slot] ?? 0;
      const p = firedCount > 0 ? baseP * decay : baseP;
      if (random() < p) {
        await config.switchFn();
        firedCount++;
      }
    },
    async ensureSwitched() {
      if (firedCount === 0) {
        await config.switchFn();
        firedCount++;
      }
    },
    getFiredCount() {
      return firedCount;
    }
  };
}
async function clearRegisterNameInputFocusedText(client, tabId) {
  const checkResult = await client.evaluateV2(tabId, `(function(){
    var host=document.querySelector("faceplate-text-input#register-username");
    if(!host||!host.shadowRoot)return{has:false};
    var inp=host.shadowRoot.querySelector("input");
    if(!inp)return{has:false};
    var val=(inp.value||"").trim();
    if(val.length===0)return{has:false};
    return{has:true,len:val.length};
  })()`);
  const data = typeof checkResult.result === "string" ? JSON.parse(checkResult.result) : checkResult.result;
  if (!data?.has) return false;
  console.log(`[clear] register username input has pre-filled content (${data.len} chars), clearing with Backspace...`);
  await client.press(tabId, "End");
  await humanPause(100, 200);
  for (let i = 0; i < data.len + 5; i++) {
    await client.press(tabId, "Backspace");
    if (i > 0 && i % (10 + Math.floor(Math.random() * 10)) === 0) {
      await humanPause(80, 200);
    } else {
      await humanPause(15, 55);
    }
  }
  return true;
}
async function clearRegisterPasswordInputFocusedText(client, tabId) {
  const checkResult = await client.evaluateV2(tabId, `(function(){
    var host=document.querySelector("faceplate-text-input#register-password");
    if(!host||!host.shadowRoot)return{has:false};
    var inp=host.shadowRoot.querySelector("input");
    if(!inp)return{has:false};
    var val=(inp.value||"").trim();
    if(val.length===0)return{has:false};
    return{has:true,len:val.length};
  })()`);
  const data = typeof checkResult.result === "string" ? JSON.parse(checkResult.result) : checkResult.result;
  if (!data?.has) return false;
  console.log(`[clear] register password input has content (${data.len} chars), clearing with Backspace...`);
  await client.press(tabId, "End");
  await humanPause(100, 200);
  for (let i = 0; i < data.len + 5; i++) {
    await client.press(tabId, "Backspace");
    if (i > 0 && i % (10 + Math.floor(Math.random() * 10)) === 0) {
      await humanPause(80, 200);
    } else {
      await humanPause(15, 55);
    }
  }
  return true;
}
async function readRegisterInputValues(client, tabId) {
  const result = await client.evaluateV2(tabId, `(function(){
    function getVal(sel){
      var hosts=document.querySelectorAll(sel);
      var visVal="", lastNonEmpty="";
      for(var i=0;i<hosts.length;i++){
        var h=hosts[i]; if(!h.shadowRoot) continue;
        var inp=h.shadowRoot.querySelector("input"); if(!inp) continue;
        var v=inp.value||"";
        if(v) lastNonEmpty=v;
        var r=inp.getBoundingClientRect();
        if(r.width>0&&r.height>0&&v) visVal=v;
      }
      return visVal||lastNonEmpty;
    }
    return JSON.stringify({username:getVal("faceplate-text-input#register-username"),password:getVal("faceplate-text-input#register-password")});
  })()`);
  try {
    const data = typeof result.result === "string" ? JSON.parse(result.result) : result.result;
    return { username: String(data?.username ?? ""), password: String(data?.password ?? "") };
  } catch {
    return { username: "", password: "" };
  }
}
async function humanReview(client, tabId, textareaLoc, textLength) {
  const reviewDepth = textLength > 200 ? 3 : textLength > 100 ? 2 : 1;
  if (Math.random() < 0.3) {
    console.log(`[review] cursor-based review (depth=${reviewDepth})`);
    await client.humanKeyboardCombo(tabId, { modifiers: ["ctrl"], key: "Home" });
    await humanPause(800, 1500);
    for (let i = 0; i < reviewDepth; i++) {
      const downCount = 1 + Math.floor(Math.random() * 2);
      for (let d = 0; d < downCount; d++) {
        await client.humanKeyboardPress(tabId, { key: "ArrowDown" });
        await humanPause(200, 400);
      }
      await humanPause(800, 2e3);
    }
    await client.humanKeyboardCombo(tabId, { modifiers: ["ctrl"], key: "End" });
    await humanPause(300, 600);
  } else {
    console.log(`[review] mouse-scan review (depth=${reviewDepth})`);
    const tx = textareaLoc.x;
    const ty = textareaLoc.y;
    const halfH = textareaLoc.h / 2;
    for (let i = 0; i < reviewDepth; i++) {
      const targetY = ty - halfH + Math.round(Math.random() * textareaLoc.h);
      const drift = Math.round((Math.random() - 0.5) * textareaLoc.w * 0.4);
      const scanX = clamp(tx + drift, tx - textareaLoc.w / 2 + 20, tx + textareaLoc.w / 2 - 20);
      await client.humanMouseMove(tabId, { x: scanX, y: targetY });
      await humanPause(600, 1500);
      if (Math.random() < 0.1) {
        console.log("[review] click-and-edit at scan position");
        await client.humanMouseDown(tabId, { x: scanX, y: targetY, button: "left" });
        await humanPause(60, 120);
        await client.humanMouseUp(tabId, { x: scanX, y: targetY, button: "left" });
        await humanPause(300, 600);
        const len = 2 + Math.floor(Math.random() * 3);
        for (let j = 0; j < len; j++) {
          await client.humanKeyboardCombo(tabId, { modifiers: ["shift"], key: "ArrowLeft" });
          await humanPause(40, 80);
        }
        await humanPause(200, 500);
        let captured = "";
        try {
          const copyRes = await client.humanClipboardCopy(tabId);
          if (copyRes && typeof copyRes.text === "string") captured = copyRes.text;
        } catch {
          continue;
        }
        if (!captured) continue;
        await client.humanKeyboardPress(tabId, { key: "Backspace" });
        await humanPause(300, 600);
        await client.humanKeyboardType(tabId, { text: captured });
        await humanPause(300, 600);
      }
    }
    await client.humanMouseMove(tabId, { x: tx, y: ty + halfH * 0.5 });
    await humanPause(300, 600);
  }
}
async function hoverWithHesitation(client, tabId, target, options) {
  const offsetX = Math.round((Math.random() - 0.5) * 60);
  const offsetY = Math.round((Math.random() - 0.5) * 60);
  await client.humanMouseMove(tabId, { x: target.x + offsetX, y: target.y + offsetY });
  await humanPause(800, 1500);
  if (Math.random() < 0.15) {
    const wanderX = target.x + Math.round((Math.random() - 0.5) * 200);
    const wanderY = target.y - 50 - Math.round(Math.random() * 100);
    await client.humanMouseMove(tabId, { x: wanderX, y: wanderY });
    await humanPause(1e3, 2e3);
  }
  await humanClickElement(client, tabId, target, options);
}
function splitTextByWords(text, minWords = 8, maxWords = 10) {
  if (!text) return [];
  const tokens = text.match(/\s*\S+\s*/g);
  if (!tokens) return [text];
  const chunks = [];
  for (let i = 0; i < tokens.length; ) {
    const size = minWords + Math.floor(Math.random() * (maxWords - minWords + 1));
    const end = Math.min(i + size, tokens.length);
    chunks.push(tokens.slice(i, end).join(""));
    i = end;
  }
  return chunks;
}
async function humanType(client, tabId, text) {
  for (const chunk of splitTextByWords(text)) {
    await client.humanKeyboardType(tabId, { text: chunk });
  }
}
async function locateByJS(client, tabId, jsExpr) {
  const result = await client.evaluateV2(tabId, jsExpr);
  const raw = result.result;
  if (raw == null) return null;
  let data;
  if (typeof raw === "string") {
    try {
      data = JSON.parse(raw);
    } catch {
      return null;
    }
  } else if (typeof raw === "object") {
    data = raw;
  } else {
    return null;
  }
  if (!data || data.x == null || data.y == null) return null;
  return {
    x: Number(data.x),
    y: Number(data.y),
    w: Number(data.w ?? 0),
    h: Number(data.h ?? 0),
    attrs: data.attrs
  };
}
async function pollLocate(client, tabId, jsExpr, tries = 20, minMs = 250, maxMs = 450) {
  for (let i = 0; i < tries; i++) {
    const loc = await locateByJS(client, tabId, jsExpr);
    if (loc) return loc;
    await humanPause(minMs, maxMs);
  }
  return null;
}
async function locateAndScrollByJS(client, tabId, jsExpr, reserveBottom = 100) {
  let loc = await locateByJS(client, tabId, jsExpr);
  if (!loc) return null;
  let viewportHeight = 800;
  try {
    const { vh } = await client.viewportGet(tabId);
    if (vh) viewportHeight = vh;
  } catch {
  }
  const topMargin = 60;
  const center = Math.round(viewportHeight / 2);
  const bandHalf = 60 + Math.floor(Math.random() * 81);
  let lo = center - bandHalf;
  let hi = center + bandHalf;
  if (reserveBottom > 0) {
    lo -= reserveBottom;
    hi -= reserveBottom;
  }
  if (lo < topMargin) {
    hi += topMargin - lo;
    lo = topMargin;
  }
  for (let attempt = 0; attempt < 10; attempt++) {
    const cy = loc.y;
    if (cy >= lo && cy <= hi) break;
    if (cy < lo) {
      let scrollY = 0;
      try {
        scrollY = (await client.viewportGet(tabId)).scrollY ?? 0;
      } catch {
      }
      if (scrollY <= 0) break;
      const wx = 600 + Math.round((Math.random() - 0.5) * 200);
      const wy = 400 + Math.round((Math.random() - 0.5) * 200);
      const maxTicks = Math.max(1, Math.ceil(scrollY / 120));
      const ticksNeeded = Math.min(
        Math.max(1, Math.round((lo - cy + 50) / 120)),
        maxTicks
      );
      for (let t = 0; t < ticksNeeded; t++) {
        await client.humanMouseWheelTick(tabId, { x: wx, y: wy, direction: "up" });
        await humanPause(40, 80);
      }
      await humanPause(200, 400);
    } else {
      const overflowPx = cy - hi;
      const scrollPx = Math.max(200, Math.min(400, overflowPx + 100));
      await humanScrollDown(client, tabId, scrollPx, { readPauseProbability: 0.05, scrollBackProbability: 0, noReadingFollow: true });
      await humanPause(200, 400);
    }
    const prevCy = cy;
    loc = await locateByJS(client, tabId, jsExpr);
    if (!loc) return null;
    if (Math.abs(loc.y - prevCy) < 1) break;
  }
  return loc;
}
function randomViewportPosition(width = 1280, height = 800) {
  const x = Math.round(clamp(gaussianRandom(width / 2, width / 6), 50, width - 50));
  const y = Math.round(clamp(gaussianRandom(height / 2, height / 6), 50, height - 50));
  return { x, y };
}
const JS_POST_UPVOTE = (postId) => `
(function(){var el=document.querySelector('shreddit-post[id="${postId}"]');if(!el||!el.shadowRoot)return null;var svgs=el.shadowRoot.querySelectorAll('svg[icon-name="upvote"]');for(var i=0;i<svgs.length;i++){var btn=svgs[i].closest('button');if(!btn)continue;var r=btn.getBoundingClientRect();if(r.width===0)continue;return{x:Math.round(r.left+r.width/2),y:Math.round(r.top+r.height/2),w:Math.round(r.width),h:Math.round(r.height),attrs:{'aria-pressed':btn.getAttribute('aria-pressed')}}}return null})()
`;
const JS_COMMENT_UPVOTE = (thingId) => `
(function(){var el=document.querySelector('shreddit-comment[thingid="${thingId}"]');if(!el)return null;var row=el.querySelector('shreddit-comment-action-row');if(!row||!row.shadowRoot)return null;var svgs=row.shadowRoot.querySelectorAll('svg[icon-name="upvote"]');for(var i=0;i<svgs.length;i++){var btn=svgs[i].closest('button');if(!btn)continue;var r=btn.getBoundingClientRect();if(r.width===0)continue;return{x:Math.round(r.left+r.width/2),y:Math.round(r.top+r.height/2),w:Math.round(r.width),h:Math.round(r.height),attrs:{'aria-pressed':btn.getAttribute('aria-pressed')}}}return null})()
`;
const JS_COMMENT_POSITION = (thingId) => `
(function(){var el=document.querySelector('shreddit-comment[thingid="${thingId}"]');if(!el)return null;var r=el.getBoundingClientRect();return{x:Math.round(r.left+r.width/2),y:Math.round(r.top+r.height/2),w:Math.round(r.width),h:Math.round(r.height)}})()
`;
const JS_COMMENT_TRIGGER = `
(function(){var hosts=document.querySelectorAll('comment-composer-host');for(var i=0;i<hosts.length;i++){if(hosts[i].closest('shreddit-comment[thingid]'))continue;var ta=hosts[i].querySelector('faceplate-textarea-input');if(!ta||!ta.shadowRoot)continue;var lbl=ta.shadowRoot.querySelector('label');if(!lbl)continue;var r=lbl.getBoundingClientRect();if(r.width>0)return{x:Math.round(r.left+r.width/2),y:Math.round(r.top+r.height/2),w:Math.round(r.width),h:Math.round(r.height)}}return null})()
`;
const JS_COMPOSER_TEXTAREA = `
(function(){var rect=function(r){return{x:Math.round(r.left+r.width/2),y:Math.round(r.top+r.height/2),w:Math.round(r.width),h:Math.round(r.height)}};var hosts=document.querySelectorAll('comment-composer-host');for(var i=0;i<hosts.length;i++){var host=hosts[i];if(host.closest('shreddit-comment[thingid]'))continue;var ce3=host.querySelector('[contenteditable="true"]');if(ce3){var r=ce3.getBoundingClientRect();if(r.width>0)return rect(r)}}var allSc=document.querySelectorAll('shreddit-composer');for(var i=0;i<allSc.length;i++){if(allSc[i].closest('shreddit-comment[thingid]'))continue;var ce=allSc[i].querySelector('div[contenteditable="true"]');if(ce){var r=ce.getBoundingClientRect();if(r.width>0)return rect(r)}}var allRte=document.querySelectorAll('reddit-rte');for(var i=0;i<allRte.length;i++){if(allRte[i].closest('shreddit-comment[thingid]'))continue;if(!allRte[i].shadowRoot)continue;var ce2=allRte[i].shadowRoot.querySelector('[contenteditable="true"]');if(!ce2)ce2=allRte[i].shadowRoot.querySelector('textarea');if(ce2){var r=ce2.getBoundingClientRect();if(r.width>0)return rect(r)}}return null})()
`;
const JS_SUBMIT_BUTTON = `
(function(){var rect=function(r){return{x:Math.round(r.left+r.width/2),y:Math.round(r.top+r.height/2),w:Math.round(r.width),h:Math.round(r.height)}};var byId=document.querySelectorAll('#comment-composer-submit-button');for(var i=0;i<byId.length;i++){if(byId[i].closest('shreddit-comment[thingid]'))continue;var r=byId[i].getBoundingClientRect();if(r.width>0)return rect(r)}var roots=document.querySelectorAll('comment-composer-host, #fixed-comment-composer-wrapper, #sticky-comment-composer-wrapper');for(var i=0;i<roots.length;i++){if(roots[i].closest('shreddit-comment[thingid]'))continue;var btns=roots[i].querySelectorAll('button[type="submit"]');for(var j=0;j<btns.length;j++){var r=btns[j].getBoundingClientRect();if(r.width>0)return rect(r)}}return null})()
`;
const JS_CANCEL_BUTTON = `
(function(){var rect=function(r){return{x:Math.round(r.left+r.width/2),y:Math.round(r.top+r.height/2),w:Math.round(r.width),h:Math.round(r.height)}};var byId=document.querySelectorAll('#comment-composer-cancel-button');for(var i=0;i<byId.length;i++){if(byId[i].closest('shreddit-comment[thingid]'))continue;var r=byId[i].getBoundingClientRect();if(r.width>0)return rect(r)}var roots=document.querySelectorAll('comment-composer-host, #fixed-comment-composer-wrapper, #sticky-comment-composer-wrapper');for(var i=0;i<roots.length;i++){if(roots[i].closest('shreddit-comment[thingid]'))continue;var btns=roots[i].querySelectorAll('button[type="reset"]');for(var j=0;j<btns.length;j++){var r=btns[j].getBoundingClientRect();if(r.width>0)return rect(r)}}return null})()
`;
const JS_COMMENT_REPLY_BUTTON = (thingId) => `
(function(){var el=document.querySelector('shreddit-comment[thingid="${thingId}"]');if(!el)return null;var slot=el.querySelector('[slot="comment-reply"]');if(!slot)return null;var btn=slot.querySelector('button');if(!btn)return null;var r=btn.getBoundingClientRect();if(r.width===0)return null;return{x:Math.round(r.left+r.width/2),y:Math.round(r.top+r.height/2),w:Math.round(r.width),h:Math.round(r.height)}})()
`;
const JS_REPLY_TEXTAREA = (thingId) => `
(function(){var el=document.querySelector('shreddit-comment[thingid="${thingId}"]');if(!el)return null;var slots=el.querySelectorAll('[slot="comment-composer"], [slot="ready"], [slot="next-reply"]');for(var i=0;i<slots.length;i++){var ta=slots[i].querySelector('textarea, [contenteditable="true"], [role="textbox"]');if(!ta){var rte=slots[i].querySelector('reddit-rte');if(rte&&rte.shadowRoot)ta=rte.shadowRoot.querySelector('textarea, [contenteditable="true"], [role="textbox"]')}if(ta){var r=ta.getBoundingClientRect();if(r.width>0)return{x:Math.round(r.left+r.width/2),y:Math.round(r.top+r.height/2),w:Math.round(r.width),h:Math.round(r.height)}}}return null})()
`;
const JS_REPLY_SUBMIT = (thingId) => `
(function(){var el=document.querySelector('shreddit-comment[thingid="${thingId}"]');if(!el)return null;var slots=el.querySelectorAll('[slot="comment-composer"], [slot="ready"], [slot="next-reply"]');for(var i=0;i<slots.length;i++){var btns=slots[i].querySelectorAll('button[type="submit"]');for(var j=0;j<btns.length;j++){var r=btns[j].getBoundingClientRect();if(r.width>0)return{x:Math.round(r.left+r.width/2),y:Math.round(r.top+r.height/2),w:Math.round(r.width),h:Math.round(r.height)}}}return null})()
`;
const JS_GALLERY_NEXT = `
(function(){var gc=document.querySelector('gallery-carousel');if(!gc||!gc.shadowRoot)return null;var btns=gc.shadowRoot.querySelectorAll('button');if(btns.length>=2){var btn=btns[btns.length-1];var r=btn.getBoundingClientRect();if(r.width>0)return{x:Math.round(r.left+r.width/2),y:Math.round(r.top+r.height/2),w:Math.round(r.width),h:Math.round(r.height)}}return null})()
`;
const JS_GALLERY_PREV = `
(function(){var gc=document.querySelector('gallery-carousel');if(!gc||!gc.shadowRoot)return null;var btns=gc.shadowRoot.querySelectorAll('button');if(btns.length>=2){var btn=btns[0];var r=btn.getBoundingClientRect();if(r.width>0)return{x:Math.round(r.left+r.width/2),y:Math.round(r.top+r.height/2),w:Math.round(r.width),h:Math.round(r.height)}}return null})()
`;
const JS_GALLERY_PAGE_COUNT = `
(function(){var gc=document.querySelector('gallery-carousel');if(!gc)return 0;return gc.querySelectorAll('li[slot^="page-"]').length})()
`;
const JS_GALLERY_CURRENT_IMAGE = `
(function(){var gc=document.querySelector('gallery-carousel');if(!gc)return null;var visible=gc.querySelector('li[style*="visibility: visible"] img.media-lightbox-img');if(!visible)visible=gc.querySelector('li[slot^="page-"] img.media-lightbox-img');if(!visible)return null;var r=visible.getBoundingClientRect();return{x:Math.round(r.left+r.width/2),y:Math.round(r.top+r.height/2),w:Math.round(r.width),h:Math.round(r.height)}})()
`;
const JS_POST_IMAGE = `
(function(){var div=document.querySelector('div.media-lightbox-img');if(!div)div=document.querySelector('shreddit-media-lightbox-listener');if(!div){var img=document.querySelector('img#post-image');if(img)div=img.parentElement}if(!div)return null;var r=div.getBoundingClientRect();return{x:Math.round(r.left+r.width/2),y:Math.round(r.top+r.height/2),w:Math.round(r.width),h:Math.round(r.height)}})()
`;
const JS_LINK_CARD_ENTRY = `
(function(){var post=document.querySelector('shreddit-post');if(!post)return null;var img=post.querySelector('img#post-image, img[data-post-media-primary]');if(!img){var ch=post.getAttribute('content-href')||'';var ar=post.querySelector('[data-aspect-ratio-container]')||post;var best=null;ar.querySelectorAll('a').forEach(function(a){if((a.href||'').indexOf(ch)!==0)return;var r=a.getBoundingClientRect();if(r.width<40||r.height<40)return;var area=r.width*r.height;if(!best||area>best.area)best=a;});img=best;}if(!img)return null;var r=img.getBoundingClientRect();if(r.width<40||r.height<40)return null;return{x:Math.round(r.left+r.width/2),y:Math.round(r.top+r.height/2),w:Math.round(r.width),h:Math.round(r.height)}})()
`;
const JS_LINK_OPEN_BAR = `
(function(){var post=document.querySelector('shreddit-post');if(!post)return null;var ch=post.getAttribute('content-href')||'';var bar=null;post.querySelectorAll('a').forEach(function(a){if((a.href||'').indexOf(ch)!==0)return;var p=a.parentElement;if(p&&p.tagName.toLowerCase()==='faceplate-tracker')bar=a;});if(!bar){var best=null;post.querySelectorAll('a').forEach(function(a){if((a.href||'').indexOf(ch)!==0)return;var r=a.getBoundingClientRect();if(r.width<40||r.height<16)return;var area=r.width*r.height;if(!best||area>best.area)best=a;});bar=best;}if(!bar)return null;var r=bar.getBoundingClientRect();if(r.width<40)return null;return{x:Math.round(r.left+r.width/2),y:Math.round(r.top+r.height/2),w:Math.round(r.width),h:Math.round(r.height)}})()
`;
const JS_DISMISS_TOAST_BUTTON = `
(function(){var ac=document.querySelector('alert-controller');if(!ac||!ac.shadowRoot)return JSON.stringify(null);var bc=ac.shadowRoot.querySelector('banner-controller');if(!bc||!bc.shadowRoot)return JSON.stringify(null);var fb=bc.shadowRoot.querySelector('faceplate-banner');if(!fb)return JSON.stringify(null);var btn=fb.querySelector('button');if(!btn)return JSON.stringify(null);var r=btn.getBoundingClientRect();if(r.width<2||r.height<2)return JSON.stringify(null);return JSON.stringify({x:Math.round(r.x+r.width/2),y:Math.round(r.y+r.height/2),w:Math.round(r.width),h:Math.round(r.height)})})()
`;
const JS_VIDEO_PLAY = (postId) => {
  const sc = postId ? `shreddit-post[id="${postId}"] ` : "";
  return `(function(){var p=document.querySelector('${sc}shreddit-player');if(!p||!p.shadowRoot)return null;var ui=p.shadowRoot.querySelector('shreddit-media-ui');if(!ui||!ui.shadowRoot)return null;var btn=ui.shadowRoot.querySelector('button.play-pause-button');if(!btn)return null;var r=btn.getBoundingClientRect();if(r.width===0)return null;return{x:Math.round(r.left+r.width/2),y:Math.round(r.top+r.height/2),w:Math.round(r.width),h:Math.round(r.height),attrs:{'aria-label':btn.getAttribute('aria-label')}}})()`;
};
const JS_VIDEO_MUTE = (postId) => {
  const sc = postId ? `shreddit-post[id="${postId}"] ` : "";
  return `(function(){var p=document.querySelector('${sc}shreddit-player');if(!p||!p.shadowRoot)return null;var ui=p.shadowRoot.querySelector('shreddit-media-ui');if(!ui||!ui.shadowRoot)return null;var btn=ui.shadowRoot.querySelector('button.mute-button');if(!btn)return null;var r=btn.getBoundingClientRect();if(r.width===0)return null;return{x:Math.round(r.left+r.width/2),y:Math.round(r.top+r.height/2),w:Math.round(r.width),h:Math.round(r.height),attrs:{'aria-label':btn.getAttribute('aria-label')}}})()`;
};
const JS_VIDEO_FULLSCREEN = (postId) => {
  const sc = postId ? `shreddit-post[id="${postId}"] ` : "";
  return `(function(){var p=document.querySelector('${sc}shreddit-player');if(!p||!p.shadowRoot)return null;var ui=p.shadowRoot.querySelector('shreddit-media-ui');if(!ui||!ui.shadowRoot)return null;var btn=ui.shadowRoot.querySelector('button.fullscreen-button');if(!btn)return null;var r=btn.getBoundingClientRect();if(r.width===0)return null;return{x:Math.round(r.left+r.width/2),y:Math.round(r.top+r.height/2),w:Math.round(r.width),h:Math.round(r.height),attrs:{'aria-label':btn.getAttribute('aria-label')}}})()`;
};
const JS_VIDEO_VOLUME = (postId) => {
  const sc = postId ? `shreddit-post[id="${postId}"] ` : "";
  return `(function(){var p=document.querySelector('${sc}shreddit-player');if(!p||!p.shadowRoot)return null;var ui=p.shadowRoot.querySelector('shreddit-media-ui');if(!ui||!ui.shadowRoot)return null;var slider=ui.shadowRoot.querySelector('shreddit-volume-slider');if(!slider||!slider.shadowRoot)return null;var input=slider.shadowRoot.querySelector('input[type="range"]');if(!input)return null;var r=input.getBoundingClientRect();return{x:Math.round(r.left+r.width/2),y:Math.round(r.top+r.height/2),w:Math.round(r.width),h:Math.round(r.height)}})()`;
};
const JS_VIDEO_PROGRESS_BAR = (postId) => {
  const sc = postId ? `shreddit-post[id="${postId}"] ` : "";
  return `(function(){var p=document.querySelector('${sc}shreddit-player');if(!p||!p.shadowRoot)return null;var ui=p.shadowRoot.querySelector('shreddit-media-ui');if(!ui||!ui.shadowRoot)return null;var bar=ui.shadowRoot.querySelector('shreddit-progress-bar');if(!bar)return null;var r=bar.getBoundingClientRect();if(r.width===0)return null;return{x:Math.round(r.left+r.width/2),y:Math.round(r.top+r.height/2),w:Math.round(r.width),h:Math.round(r.height)}})()`;
};
const JS_VIDEO_SETTINGS = (postId) => {
  const sc = postId ? `shreddit-post[id="${postId}"] ` : "";
  return `(function(){var p=document.querySelector('${sc}shreddit-player');if(!p||!p.shadowRoot)return null;var ui=p.shadowRoot.querySelector('shreddit-media-ui');if(!ui||!ui.shadowRoot)return null;var vs=ui.shadowRoot.querySelector('shreddit-video-settings');if(!vs||!vs.shadowRoot)return null;var btns=vs.shadowRoot.querySelectorAll('button');var gear=null;for(var i=0;i<btns.length;i++){if(btns[i].querySelector('svg[icon-name="settings-fill"]')){gear=btns[i];break;}}if(!gear)return null;var r=gear.getBoundingClientRect();if(r.width===0)return null;return{x:Math.round(r.left+r.width/2),y:Math.round(r.top+r.height/2),w:Math.round(r.width),h:Math.round(r.height)}})()`;
};
const JS_VIDEO_QUALITY_OPTIONS = (postId) => {
  const sc = postId ? `shreddit-post[id="${postId}"] ` : "";
  return `(function(){var p=document.querySelector('${sc}shreddit-player');if(!p||!p.shadowRoot)return null;var ui=p.shadowRoot.querySelector('shreddit-media-ui');if(!ui||!ui.shadowRoot)return null;var vs=ui.shadowRoot.querySelector('shreddit-video-settings');if(!vs||!vs.shadowRoot)return null;var btns=vs.shadowRoot.querySelectorAll('button[data-testid="quality-option"], button[data-testid="auto-quality-option"]');var out=[];for(var i=0;i<btns.length;i++){var b=btns[i];var r=b.getBoundingClientRect();var ck=b.querySelector('svg[icon-name="checkmark"]');out.push({testid:b.getAttribute('data-testid'),text:(b.innerText||'').trim(),x:Math.round(r.left+r.width/2),y:Math.round(r.top+r.height/2),w:Math.round(r.width),h:Math.round(r.height),selected:!!ck});}return out})()`;
};
const JS_VIDEO_PLAYER_RECT = (postId) => {
  const sc = postId ? `shreddit-post[id="${postId}"] ` : "";
  return `(function(){var p=document.querySelector('${sc}shreddit-player');if(!p)return null;var r=p.getBoundingClientRect();return{x:Math.round(r.left+r.width/2),y:Math.round(r.top+r.height/2),w:Math.round(r.width),h:Math.round(r.height)}})()`;
};
const JS_VIDEO_INFO = (postId) => {
  const sc = postId ? `shreddit-post[id="${postId}"] ` : "";
  return `(function(){var p=document.querySelector('${sc}shreddit-player');if(!p||!p.shadowRoot)return null;var v=p.shadowRoot.querySelector('video');if(!v)return null;return{duration:v.duration||0,currentTime:v.currentTime||0,paused:v.paused,muted:v.muted,ended:v.ended}})()`;
};
const JS_LISTING_COMMENTS_ENTRY = (postId) => `
(function(){var el=document.querySelector('shreddit-post[id="${postId}"]');if(!el||!el.shadowRoot)return null;var a=el.shadowRoot.querySelector('a[name="comments-action-button"]');if(!a){var s=el.shadowRoot.querySelector('svg[icon-name="comment"]');if(s)a=s.closest('a')}if(!a)return null;var r=a.getBoundingClientRect();if(r.width===0)return null;return{x:Math.round(r.left+r.width/2),y:Math.round(r.top+r.height/2),w:Math.round(r.width),h:Math.round(r.height),attrs:{href:a.getAttribute('href')||''}}})()
`;
const JS_LISTING_BODY_ENTRY = (postId) => `
(function(){var el=document.querySelector('shreddit-post[id="${postId}"]');if(!el)return null;var b=el.querySelector('shreddit-post-text-body[slot="text-body"], [slot="text-body"]');if(!b)return null;var r=b.getBoundingClientRect();if(r.width===0||r.height===0)return null;return{x:Math.round(r.left+r.width/2),y:Math.round(r.top+r.height/2),w:Math.round(r.width),h:Math.round(r.height)}})()
`;
const JS_LISTING_IMAGE = (postId) => `
(function(){var el=document.querySelector('shreddit-post[id="${postId}"]');if(!el)return null;var cands=el.querySelectorAll('img#post-image, img[data-post-media-primary], div.media-lightbox-img, shreddit-media-lightbox-listener');for(var i=0;i<cands.length;i++){var r=cands[i].getBoundingClientRect();if(r.width>2&&r.height>2)return{x:Math.round(r.left+r.width/2),y:Math.round(r.top+r.height/2),w:Math.round(r.width),h:Math.round(r.height)}}return null})()
`;
const JS_LISTING_VIDEO_PLAYER = (postId) => `
(function(){var el=document.querySelector('shreddit-post[id="${postId}"]');if(!el)return null;var p=el.querySelector('shreddit-player[data-post-click-location="video-player"], shreddit-player');if(!p)return null;var r=p.getBoundingClientRect();if(r.width===0||r.height===0)return null;var dur=0;try{var pj=JSON.parse(p.getAttribute('packaged-media-json')||'{}');if(pj&&pj.playbackMp4s&&pj.playbackMp4s.duration)dur=pj.playbackMp4s.duration}catch(e){}return{x:Math.round(r.left+r.width/2),y:Math.round(r.top+r.height/2),w:Math.round(r.width),h:Math.round(r.height),attrs:{duration:String(dur||'')}}})()
`;
const JS_LISTING_GALLERY_CURRENT = (postId) => `
(function(){var el=document.querySelector('shreddit-post[id="${postId}"]');if(!el)return null;var gc=el.querySelector('gallery-carousel');if(!gc)return null;var img=gc.querySelector('li[style*="visibility: visible"] img, li[slot^="page-"] img');if(!img)return null;var r=img.getBoundingClientRect();if(r.width===0)return null;return{x:Math.round(r.left+r.width/2),y:Math.round(r.top+r.height/2),w:Math.round(r.width),h:Math.round(r.height)}})()
`;
const JS_LISTING_GALLERY_NEXT = (postId) => `
(function(){var gc=document.querySelector('shreddit-post[id="${postId}"] gallery-carousel');if(!gc||!gc.shadowRoot)return null;var svg=gc.shadowRoot.querySelector('svg[icon-name="caret-right"]');if(!svg)return null;var btn=svg.closest('button');if(!btn)return null;var r=btn.getBoundingClientRect();if(r.width===0)return null;return{x:Math.round(r.left+r.width/2),y:Math.round(r.top+r.height/2),w:Math.round(r.width),h:Math.round(r.height)}})()
`;
const JS_LISTING_GALLERY_PREV = (postId) => `
(function(){var gc=document.querySelector('shreddit-post[id="${postId}"] gallery-carousel');if(!gc||!gc.shadowRoot)return null;var svg=gc.shadowRoot.querySelector('svg[icon-name="caret-left"]');if(!svg)return null;var btn=svg.closest('button');if(!btn)return null;var r=btn.getBoundingClientRect();if(r.width===0)return null;return{x:Math.round(r.left+r.width/2),y:Math.round(r.top+r.height/2),w:Math.round(r.width),h:Math.round(r.height)}})()
`;
const JS_LISTING_GALLERY_PAGE_COUNT = (postId) => `
(function(){var gc=document.querySelector('shreddit-post[id="${postId}"] gallery-carousel');if(!gc)return 0;return gc.querySelectorAll('li[slot^="page-"]').length})()
`;
const JS_REGISTER_EMAIL_INPUT = `
(function(){var host=document.querySelector("faceplate-text-input#register-email");if(!host||!host.shadowRoot)return null;var inp=host.shadowRoot.querySelector("input");if(!inp)return null;var r=inp.getBoundingClientRect();if(r.width===0)return null;return{x:Math.round(r.left+r.width/2),y:Math.round(r.top+r.height/2),w:Math.round(r.width),h:Math.round(r.height),attrs:{type:inp.type,name:inp.name,value:inp.value}}})()
`;
const JS_REGISTER_CONTINUE_BUTTON = `
(function(){var btns=document.querySelectorAll("button.continue");for(var i=0;i<btns.length;i++){var btn=btns[i];var r=btn.getBoundingClientRect();if(r.width>0){return{x:Math.round(r.left+r.width/2),y:Math.round(r.top+r.height/2),w:Math.round(r.width),h:Math.round(r.height),attrs:{disabled:btn.disabled,text:btn.innerText.trim()}}}}return null})()
`;
const JS_REGISTER_VERIFY_CODE_INPUT = `
(function(){var hosts=document.querySelectorAll("faceplate-text-input");for(var i=0;i<hosts.length;i++){var host=hosts[i];if(!host.shadowRoot)continue;var inp=host.shadowRoot.querySelector("input");if(!inp)continue;var r=inp.getBoundingClientRect();if(r.width>0){return{x:Math.round(r.left+r.width/2),y:Math.round(r.top+r.height/2),w:Math.round(r.width),h:Math.round(r.height),attrs:{type:inp.type,name:inp.name,value:inp.value}}}}return null})()
`;
const JS_REGISTER_VERIFY_CONTINUE_BUTTON = `
(function(){var btns=document.querySelectorAll("button");for(var i=0;i<btns.length;i++){var btn=btns[i];var r=btn.getBoundingClientRect();var text=btn.innerText.trim();if(r.width>0&&text==="Continue"){return{x:Math.round(r.left+r.width/2),y:Math.round(r.top+r.height/2),w:Math.round(r.width),h:Math.round(r.height),attrs:{disabled:btn.disabled,text:text}}}}return null})()
`;
const JS_REGISTER_VERIFY_RESEND_BUTTON = `
(function(){var b=document.querySelector("button#auth-email-verify-otp-resend-cta");if(!b)return null;var r=b.getBoundingClientRect();if(r.width<=0)return null;return{x:Math.round(r.left+r.width/2),y:Math.round(r.top+r.height/2),w:Math.round(r.width),h:Math.round(r.height),attrs:{disabled:b.disabled,text:(b.innerText||"").trim()}}})()
`;
const JS_REGISTER_USERNAME_INPUT = `
(function(){var host=document.querySelector("faceplate-text-input#register-username");if(!host||!host.shadowRoot)return null;var inp=host.shadowRoot.querySelector("input");if(!inp)return null;var r=inp.getBoundingClientRect();if(r.width===0)return null;return{x:Math.round(r.left+r.width/2),y:Math.round(r.top+r.height/2),w:Math.round(r.width),h:Math.round(r.height),attrs:{type:inp.type,name:inp.name,value:inp.value}}})()
`;
const JS_REGISTER_USERNAME_SUGGEST_BUTTON = `
(function(){var b=document.querySelector("button.suggest-username");if(!b)return null;var r=b.getBoundingClientRect();if(r.width<=0)return null;return{x:Math.round(r.left+r.width/2),y:Math.round(r.top+r.height/2),w:Math.round(r.width),h:Math.round(r.height)}})()
`;
const JS_REGISTER_PASSWORD_INPUT = `
(function(){var host=document.querySelector("faceplate-text-input#register-password");if(!host||!host.shadowRoot)return null;var inp=host.shadowRoot.querySelector("input");if(!inp)return null;var r=inp.getBoundingClientRect();if(r.width===0)return null;return{x:Math.round(r.left+r.width/2),y:Math.round(r.top+r.height/2),w:Math.round(r.width),h:Math.round(r.height),attrs:{type:inp.type,name:inp.name}}})()
`;
const JS_REGISTER_PASSWORD_TOGGLE = `
(function(){var btns=document.querySelectorAll("button");for(var i=0;i<btns.length;i++){var t=(btns[i].innerText||btns[i].textContent||"").trim();if(t==="Show password"||t==="Hide password"){var r=btns[i].getBoundingClientRect();if(r.width>0&&r.height>0)return{x:Math.round(r.left+r.width/2),y:Math.round(r.top+r.height/2),w:Math.round(r.width),h:Math.round(r.height)}}}return null})()
`;
const JS_REGISTER_PASSWORD_TYPE = `
(function(){var h=document.querySelector("faceplate-text-input#register-password");var i=h&&h.shadowRoot?h.shadowRoot.querySelector("input"):null;return i?i.type:""})()
`;
const JS_REGISTER_USERNAME_CONTINUE_BUTTON = `
(function(){var btns=document.querySelectorAll("button");for(var i=0;i<btns.length;i++){var btn=btns[i];var r=btn.getBoundingClientRect();var text=btn.innerText.trim();if(r.width>0&&text==="Continue"){return{x:Math.round(r.left+r.width/2),y:Math.round(r.top+r.height/2),w:Math.round(r.width),h:Math.round(r.height),attrs:{disabled:btn.disabled,text:text}}}}return null})()
`;
const JS_REGISTER_BIRTHDAY_SKIP_BUTTON = `
(function(){function findInShadow(selector,checkFn){var hosts=document.querySelectorAll("*");for(var i=0;i<hosts.length;i++){var host=hosts[i];if(!host.shadowRoot)continue;var els=host.shadowRoot.querySelectorAll(selector);for(var j=0;j<els.length;j++){var el=els[j];var result=checkFn(el);if(result)return result;}}return null}function findInMain(selector,checkFn){var els=document.querySelectorAll(selector);for(var i=0;i<els.length;i++){var el=els[i];var result=checkFn(el);if(result)return result;}return null}function checkBtn(btn){var t=btn.innerText||btn.textContent||"";if(t.trim()==="Skip"){var r=btn.getBoundingClientRect();if(r.width>0&&r.height>0){return{x:Math.round(r.left+r.width/2),y:Math.round(r.top+r.height/2),w:Math.round(r.width),h:Math.round(r.height),attrs:{text:"Skip"}};}}return null}return findInShadow("button",checkBtn)||findInMain("button",checkBtn);})()
`;
const JS_REGISTER_BIRTHDAY_ABOUT_TITLE = `
(function(){function findTitle(root,depth){if(depth>15)return null;var h1s=root.querySelectorAll?root.querySelectorAll("h1"):[];for(var i=0;i<h1s.length;i++){var t=h1s[i].innerText||h1s[i].textContent||"";if(t.trim()==="About you"){var r=h1s[i].getBoundingClientRect();if(r.width>0&&r.height>0){return{x:Math.round(r.left+r.width/2),y:Math.round(r.top+r.height/2),w:Math.round(r.width),h:Math.round(r.height),attrs:{text:t.trim()}};}}}var allElements=root.querySelectorAll?root.querySelectorAll("*"):[];for(var i=0;i<allElements.length;i++){if(allElements[i].shadowRoot){var result=findTitle(allElements[i].shadowRoot,depth+1);if(result)return result;}}return null;}return findTitle(document,0);})()
`;
const JS_REGISTER_INTERESTS_TITLE = `
(function(){function findTitle(root,depth){if(depth>15)return null;var h1s=root.querySelectorAll?root.querySelectorAll("h1"):[];for(var i=0;i<h1s.length;i++){var t=h1s[i].innerText||h1s[i].textContent||"";if(t.indexOf("Choose your interests")!==-1){var r=h1s[i].getBoundingClientRect();if(r.width>0&&r.height>0){return{x:Math.round(r.left+r.width/2),y:Math.round(r.top+r.height/2),w:Math.round(r.width),h:Math.round(r.height),attrs:{text:t.trim()}};}}}var allElements=root.querySelectorAll?root.querySelectorAll("*"):[];for(var i=0;i<allElements.length;i++){if(allElements[i].shadowRoot){var result=findTitle(allElements[i].shadowRoot,depth+1);if(result)return result;}}return null;}return findTitle(document,0);})()
`;
const JS_REGISTER_FEED_TITLE = `
(function(){function findTitle(root,depth){if(depth>15)return null;var h1s=root.querySelectorAll?root.querySelectorAll("h1"):[];for(var i=0;i<h1s.length;i++){var t=h1s[i].innerText||h1s[i].textContent||"";if(t.indexOf("Customize your feed")!==-1){var r=h1s[i].getBoundingClientRect();if(r.width>0&&r.height>0){return{x:Math.round(r.left+r.width/2),y:Math.round(r.top+r.height/2),w:Math.round(r.width),h:Math.round(r.height),attrs:{text:t.trim()}};}}}var allElements=root.querySelectorAll?root.querySelectorAll("*"):[];for(var i=0;i<allElements.length;i++){if(allElements[i].shadowRoot){var result=findTitle(allElements[i].shadowRoot,depth+1);if(result)return result;}}return null;}return findTitle(document,0);})()
`;
const JS_REGISTER_DETECT_PAGE_TITLE = `
(function(){function findTitles(root,depth){if(depth>15)return[];var titles=[];var h1s=root.querySelectorAll?root.querySelectorAll("h1"):[];for(var i=0;i<h1s.length;i++){var r=h1s[i].getBoundingClientRect();if(r.width>0&&r.height>0){titles.push((h1s[i].innerText||h1s[i].textContent||"").trim());}}var allElements=root.querySelectorAll?root.querySelectorAll("*"):[];for(var i=0;i<allElements.length;i++){if(allElements[i].shadowRoot){var sub=findTitles(allElements[i].shadowRoot,depth+1);for(var j=0;j<sub.length;j++)titles.push(sub[j]);}}return titles;}var titles=findTitles(document,0);return JSON.stringify(titles);})()
`;
const JS_REGISTER_BIRTHDAY_MONTH_INPUT = `
(function(){function findInput(root,depth){if(depth>15)return null;var inputs=root.querySelectorAll?root.querySelectorAll("input"):[];for(var i=0;i<inputs.length;i++){var inp=inputs[i];var placeholder=(inp.getAttribute("placeholder")||"").trim();var aria=(inp.getAttribute("aria-label")||"").trim();var name=inp.name||"";var phUp=placeholder.toUpperCase();var ariaLc=aria.toLowerCase();var nameLc=name.toLowerCase();if(phUp==="MM"||phUp==="MONTH"||ariaLc.indexOf("month")!==-1||nameLc.indexOf("month")!==-1){var r=inp.getBoundingClientRect();if(r.width>0&&r.height>0){return{x:Math.round(r.left+r.width/2),y:Math.round(r.top+r.height/2),w:Math.round(r.width),h:Math.round(r.height),attrs:{placeholder:placeholder,aria:aria,name:name}};}}}var labels=root.querySelectorAll?root.querySelectorAll("label"):[];for(var i=0;i<labels.length;i++){var lbl=labels[i];var lblText=(lbl.innerText||lbl.textContent||"").trim();if(lblText.toUpperCase()==="MONTH"){var forId=lbl.getAttribute("for")||"";var target=forId?root.querySelector("#"+forId):lbl.querySelector("input");if(target&&target.tagName==="INPUT"){var r2=target.getBoundingClientRect();if(r2.width>0&&r2.height>0){return{x:Math.round(r2.left+r2.width/2),y:Math.round(r2.top+r2.height/2),w:Math.round(r2.width),h:Math.round(r2.height),attrs:{placeholder:target.getAttribute("placeholder")||"",aria:target.getAttribute("aria-label")||"",name:target.name||"",matchedVia:"label:"+lblText}};}}}}}var allElements=root.querySelectorAll?root.querySelectorAll("*"):[];for(var i=0;i<allElements.length;i++){if(allElements[i].shadowRoot){var result=findInput(allElements[i].shadowRoot,depth+1);if(result)return result;}}return null;}return findInput(document,0);})()
`;
const JS_REGISTER_BIRTHDAY_DAY_INPUT = `
(function(){function findInput(root,depth){if(depth>15)return null;var inputs=root.querySelectorAll?root.querySelectorAll("input"):[];for(var i=0;i<inputs.length;i++){var inp=inputs[i];var placeholder=(inp.getAttribute("placeholder")||"").trim();var aria=(inp.getAttribute("aria-label")||"").trim();var name=inp.name||"";var phUp=placeholder.toUpperCase();var ariaLc=aria.toLowerCase();var nameLc=name.toLowerCase();if(phUp==="DD"||phUp==="DAY"||ariaLc.indexOf("day")!==-1||nameLc.indexOf("day")!==-1){var r=inp.getBoundingClientRect();if(r.width>0&&r.height>0){return{x:Math.round(r.left+r.width/2),y:Math.round(r.top+r.height/2),w:Math.round(r.width),h:Math.round(r.height),attrs:{placeholder:placeholder,aria:aria,name:name}};}}}var labels=root.querySelectorAll?root.querySelectorAll("label"):[];for(var i=0;i<labels.length;i++){var lbl=labels[i];var lblText=(lbl.innerText||lbl.textContent||"").trim();if(lblText.toUpperCase()==="DAY"){var forId=lbl.getAttribute("for")||"";var target=forId?root.querySelector("#"+forId):lbl.querySelector("input");if(target&&target.tagName==="INPUT"){var r2=target.getBoundingClientRect();if(r2.width>0&&r2.height>0){return{x:Math.round(r2.left+r2.width/2),y:Math.round(r2.top+r2.height/2),w:Math.round(r2.width),h:Math.round(r2.height),attrs:{placeholder:target.getAttribute("placeholder")||"",aria:target.getAttribute("aria-label")||"",name:target.name||"",matchedVia:"label:"+lblText}};}}}}}var allElements=root.querySelectorAll?root.querySelectorAll("*"):[];for(var i=0;i<allElements.length;i++){if(allElements[i].shadowRoot){var result=findInput(allElements[i].shadowRoot,depth+1);if(result)return result;}}return null;}return findInput(document,0);})()
`;
const JS_REGISTER_BIRTHDAY_YEAR_INPUT = `
(function(){function findInput(root,depth){if(depth>15)return null;var inputs=root.querySelectorAll?root.querySelectorAll("input"):[];for(var i=0;i<inputs.length;i++){var inp=inputs[i];var placeholder=(inp.getAttribute("placeholder")||"").trim();var aria=(inp.getAttribute("aria-label")||"").trim();var name=inp.name||"";var phUp=placeholder.toUpperCase();var ariaLc=aria.toLowerCase();var nameLc=name.toLowerCase();if(phUp==="YYYY"||phUp==="YEAR"||ariaLc.indexOf("year")!==-1||nameLc.indexOf("year")!==-1){var r=inp.getBoundingClientRect();if(r.width>0&&r.height>0){return{x:Math.round(r.left+r.width/2),y:Math.round(r.top+r.height/2),w:Math.round(r.width),h:Math.round(r.height),attrs:{placeholder:placeholder,aria:aria,name:name}};}}}var labels=root.querySelectorAll?root.querySelectorAll("label"):[];for(var i=0;i<labels.length;i++){var lbl=labels[i];var lblText=(lbl.innerText||lbl.textContent||"").trim();if(lblText.toUpperCase()==="YEAR"){var forId=lbl.getAttribute("for")||"";var target=forId?root.querySelector("#"+forId):lbl.querySelector("input");if(target&&target.tagName==="INPUT"){var r2=target.getBoundingClientRect();if(r2.width>0&&r2.height>0){return{x:Math.round(r2.left+r2.width/2),y:Math.round(r2.top+r2.height/2),w:Math.round(r2.width),h:Math.round(r2.height),attrs:{placeholder:target.getAttribute("placeholder")||"",aria:target.getAttribute("aria-label")||"",name:target.name||"",matchedVia:"label:"+lblText}};}}}}}var allElements=root.querySelectorAll?root.querySelectorAll("*"):[];for(var i=0;i<allElements.length;i++){if(allElements[i].shadowRoot){var result=findInput(allElements[i].shadowRoot,depth+1);if(result)return result;}}return null;}return findInput(document,0);})()
`;
const JS_REGISTER_BIRTHDAY_LABELS = `
(function(){function findLabels(root,depth){if(depth>15)return[];var found=[];var labels=root.querySelectorAll?root.querySelectorAll("label,span,div,p"):[];for(var i=0;i<labels.length;i++){var el=labels[i];var text=(el.innerText||el.textContent||"").trim();var r=el.getBoundingClientRect();if(r.width>0&&r.height>0){var up=text.toUpperCase();if(up==="MONTH"||up==="DAY"||up==="YEAR"){found.push({text:text,x:Math.round(r.left+r.width/2),y:Math.round(r.top+r.height/2),w:Math.round(r.width),h:Math.round(r.height)});}}}var allElements=root.querySelectorAll?root.querySelectorAll("*"):[];for(var i=0;i<allElements.length;i++){if(allElements[i].shadowRoot){var sub=findLabels(allElements[i].shadowRoot,depth+1);for(var j=0;j<sub.length;j++)found.push(sub[j]);}}return found;}var results=findLabels(document,0);return JSON.stringify(results);})()
`;
const JS_REGISTER_CONFIRM_BIRTHDAY_TITLE = `
(function(){var h1s=document.querySelectorAll('h1');for(var i=0;i<h1s.length;i++){var t=h1s[i].innerText||h1s[i].textContent||"";if(t.indexOf("Confirm your birthday")!==-1){var r=h1s[i].getBoundingClientRect();if(r.width>0&&r.height>0){return{x:Math.round(r.left+r.width/2),y:Math.round(r.top+r.height/2),w:Math.round(r.width),h:Math.round(r.height),attrs:{text:t.trim()}};}}}return null;})()
`;
const JS_REGISTER_CONFIRM_BIRTHDAY_YES_BUTTON = `
(function(){var btns=document.querySelectorAll('button');for(var i=0;i<btns.length;i++){var t=btns[i].innerText||btns[i].textContent||"";if(t.indexOf("Yes")!==-1&&t.indexOf("Confirm")!==-1){var r=btns[i].getBoundingClientRect();if(r.width>0&&r.height>0){return{x:Math.round(r.left+r.width/2),y:Math.round(r.top+r.height/2),w:Math.round(r.width),h:Math.round(r.height),attrs:{text:t.trim()}};}}}return null;})()
`;
const JS_REGISTER_SKIP_BUTTON = `
(function(){function findInShadow(selector,checkFn){var hosts=document.querySelectorAll("*");for(var i=0;i<hosts.length;i++){var host=hosts[i];if(!host.shadowRoot)continue;var els=host.shadowRoot.querySelectorAll(selector);for(var j=0;j<els.length;j++){var el=els[j];var result=checkFn(el);if(result)return result;}}return null}function findInMain(selector,checkFn){var els=document.querySelectorAll(selector);for(var i=0;i<els.length;i++){var el=els[i];var result=checkFn(el);if(result)return result;}return null}function checkBtn(btn){var t=btn.innerText||btn.textContent||"";if(t.trim()==="Skip"){var r=btn.getBoundingClientRect();if(r.width>0&&r.height>0){return{x:Math.round(r.left+r.width/2),y:Math.round(r.top+r.height/2),w:Math.round(r.width),h:Math.round(r.height),attrs:{text:"Skip"}};}}return null}return findInShadow("button",checkBtn)||findInMain("button",checkBtn);})()
`;
const JS_REGISTER_GENDER_WOMAN = `
(function(){var hosts=document.querySelectorAll("*");for(var i=0;i<hosts.length;i++){var host=hosts[i];if(!host.shadowRoot)continue;var btns=host.shadowRoot.querySelectorAll("button");for(var j=0;j<btns.length;j++){var btn=btns[j];var text=btn.innerText.trim();if(text==="Woman"){var r=btn.getBoundingClientRect();if(r.width>0){return{x:Math.round(r.left+r.width/2),y:Math.round(r.top+r.height/2),w:Math.round(r.width),h:Math.round(r.height),attrs:{text:text}}}}}}return null})()
`;
const JS_REGISTER_GENDER_MAN = `
(function(){var hosts=document.querySelectorAll("*");for(var i=0;i<hosts.length;i++){var host=hosts[i];if(!host.shadowRoot)continue;var btns=host.shadowRoot.querySelectorAll("button");for(var j=0;j<btns.length;j++){var btn=btns[j];var text=btn.innerText.trim();if(text==="Man"){var r=btn.getBoundingClientRect();if(r.width>0){return{x:Math.round(r.left+r.width/2),y:Math.round(r.top+r.height/2),w:Math.round(r.width),h:Math.round(r.height),attrs:{text:text}}}}}}return null})()
`;
const JS_REGISTER_GENDER_NON_BINARY = `
(function(){var hosts=document.querySelectorAll("*");for(var i=0;i<hosts.length;i++){var host=hosts[i];if(!host.shadowRoot)continue;var btns=host.shadowRoot.querySelectorAll("button");for(var j=0;j<btns.length;j++){var btn=btns[j];var text=btn.innerText.trim();if(text==="Non-binary"){var r=btn.getBoundingClientRect();if(r.width>0){return{x:Math.round(r.left+r.width/2),y:Math.round(r.top+r.height/2),w:Math.round(r.width),h:Math.round(r.height),attrs:{text:text}}}}}}return null})()
`;
const JS_REGISTER_GENDER_PREFER_NOT_SAY = `
(function(){var hosts=document.querySelectorAll("*");for(var i=0;i<hosts.length;i++){var host=hosts[i];if(!host.shadowRoot)continue;var btns=host.shadowRoot.querySelectorAll("button");for(var j=0;j<btns.length;j++){var btn=btns[j];var text=btn.innerText.trim();if(text==="I prefer not to say"){var r=btn.getBoundingClientRect();if(r.width>0){return{x:Math.round(r.left+r.width/2),y:Math.round(r.top+r.height/2),w:Math.round(r.width),h:Math.round(r.height),attrs:{text:text}}}}}}return null})()
`;
const JS_REGISTER_INTEREST = (interestName) => `
(function(){var hosts=document.querySelectorAll("*");for(var i=0;i<hosts.length;i++){var host=hosts[i];if(!host.shadowRoot)continue;var labels=host.shadowRoot.querySelectorAll("label, [role=button], faceplate-checkbox");for(var j=0;j<labels.length;j++){var label=labels[j];var text=label.innerText.trim();if(text==="${interestName}"){var r=label.getBoundingClientRect();if(r.width>0){return{x:Math.round(r.left+r.width/2),y:Math.round(r.top+r.height/2),w:Math.round(r.width),h:Math.round(r.height),attrs:{text:text}}}}}}return null})()
`;
const JS_REGISTER_INTEREST_CONTINUE_BUTTON = `
(function(){function findButton(root,depth){if(depth>15)return null;var btns=root.querySelectorAll?root.querySelectorAll("button"):[];for(var i=0;i<btns.length;i++){var btn=btns[i];var r=btn.getBoundingClientRect();var text=btn.innerText?btn.innerText.trim():"";if(r.width>0&&text==="Continue"){return{x:Math.round(r.left+r.width/2),y:Math.round(r.top+r.height/2),w:Math.round(r.width),h:Math.round(r.height),attrs:{text:text}}}}var allElements=root.querySelectorAll?root.querySelectorAll("*"):[];for(var i=0;i<allElements.length;i++){if(allElements[i].shadowRoot){var result=findButton(allElements[i].shadowRoot,depth+1);if(result)return result}}return null}return findButton(document,0)})()
`;
const JS_REGISTER_TOPIC_SEARCH = `
(function(){function findInput(root,depth){if(depth>15)return null;var inputs=root.querySelectorAll?root.querySelectorAll("input, textarea"):[];for(var i=0;i<inputs.length;i++){var inp=inputs[i];var r=inp.getBoundingClientRect();if(r.width>0){return{x:Math.round(r.left+r.width/2),y:Math.round(r.top+r.height/2),w:Math.round(r.width),h:Math.round(r.height)}}}var allElements=root.querySelectorAll?root.querySelectorAll("*"):[];for(var i=0;i<allElements.length;i++){if(allElements[i].shadowRoot){var result=findInput(allElements[i].shadowRoot,depth+1);if(result)return result}}return null}return findInput(document,0)})()
`;
const JS_REGISTER_SHOW_MORE_TOPICS = `
(function(){function findButton(root,depth){if(depth>15)return null;var btns=root.querySelectorAll?root.querySelectorAll("button, [role=button]"):[];for(var i=0;i<btns.length;i++){var btn=btns[i];var r=btn.getBoundingClientRect();var t=btn.innerText?btn.innerText.trim():"";if(r.width>0&&t==="Show More Topics"){return{x:Math.round(r.left+r.width/2),y:Math.round(r.top+r.height/2),w:Math.round(r.width),h:Math.round(r.height),attrs:{text:t}}}}var allElements=root.querySelectorAll?root.querySelectorAll("*"):[];for(var i=0;i<allElements.length;i++){if(allElements[i].shadowRoot){var result=findButton(allElements[i].shadowRoot,depth+1);if(result)return result}}return null}return findButton(document,0)})()
`;
const JS_REGISTER_TOPIC_CONTINUE_BUTTON = `
(function(){function findButton(root,depth){if(depth>15)return null;var btns=root.querySelectorAll?root.querySelectorAll("button, [role=button]"):[];for(var i=0;i<btns.length;i++){var btn=btns[i];var r=btn.getBoundingClientRect();var t=btn.innerText?btn.innerText.trim():"";if(r.width>0&&t==="Continue"){return{x:Math.round(r.left+r.width/2),y:Math.round(r.top+r.height/2),w:Math.round(r.width),h:Math.round(r.height),attrs:{text:t,disabled:btn.disabled}}}}var allElements=root.querySelectorAll?root.querySelectorAll("*"):[];for(var i=0;i<allElements.length;i++){if(allElements[i].shadowRoot){var result=findButton(allElements[i].shadowRoot,depth+1);if(result)return result}}return null}return findButton(document,0)})()
`;
const JS_REGISTER_TOPIC_EXTRACT = `
(function(){var results=[];function find(root,depth){if(depth>12)return;try{var els=root.querySelectorAll('button,[role="button"],faceplate-checkbox,faceplate-pill,label,[class*="topic"],[class*="pill"]');for(var i=0;i<els.length;i++){var el=els[i];var r=el.getBoundingClientRect();if(r.width>30&&r.height>20&&r.width<600&&r.height<200){var text=(el.innerText||el.textContent||"").trim().replace(/\\s+/g," ");if(text.length>1&&text.length<60&&text!=="Continue"&&text!=="Skip"&&text!=="Show More Topics"){results.push({text:text,x:Math.round(r.left+r.width/2),y:Math.round(r.top+r.height/2),w:Math.round(r.width),h:Math.round(r.height)})}}}}catch(e){}try{var all=root.querySelectorAll("*");for(var i=0;i<all.length;i++){if(all[i].shadowRoot)find(all[i].shadowRoot,depth+1)}}catch(e){}}find(document,0);return results})()
`;
const JS_REGISTER_FEED_CHIPS = `
(function(){function pierce(root,sel){var rs=Array.prototype.slice.call(root.querySelectorAll(sel));var all=root.querySelectorAll('*');for(var i=0;i<all.length;i++){if(all[i].shadowRoot)rs=rs.concat(pierce(all[i].shadowRoot,sel));}return rs;}var modal=document.querySelector('auth-flow-manager')||document.querySelector('[role=dialog]')||document;var chips=pierce(modal,'rpl-filter-chip[data-topic-id]');var out=[];for(var i=0;i<chips.length;i++){var c=chips[i];var r=c.getBoundingClientRect();if(r.width<=0||r.height<=0)continue;out.push({topicId:c.getAttribute('data-topic-id')||'',name:c.getAttribute('data-topic-name')||'',x:Math.round(r.left+r.width/2),y:Math.round(r.top+r.height/2),w:Math.round(r.width),h:Math.round(r.height)});}return JSON.stringify(out);})()
`;
const JS_REGISTER_FEED_CHIP_COORD = (topicId) => `
(function(){function pierce(root,sel){var rs=Array.prototype.slice.call(root.querySelectorAll(sel));var all=root.querySelectorAll('*');for(var i=0;i<all.length;i++){if(all[i].shadowRoot)rs=rs.concat(pierce(all[i].shadowRoot,sel));}return rs;}var modal=document.querySelector('auth-flow-manager')||document.querySelector('[role=dialog]')||document;var chips=pierce(modal,'rpl-filter-chip[data-topic-id]');var id=${JSON.stringify(topicId)};for(var i=0;i<chips.length;i++){if(chips[i].getAttribute('data-topic-id')===id){var r=chips[i].getBoundingClientRect();if(r.width<=0)return null;return JSON.stringify({x:Math.round(r.left+r.width/2),y:Math.round(r.top+r.height/2),w:Math.round(r.width),h:Math.round(r.height)});}}return null;})()
`;
const JS_POST_TYPE_TAB = (type) => `
(function(){var el=document.querySelector('r-post-type-select');if(!el||!el.shadowRoot)return null;var btn=el.shadowRoot.querySelector('button[data-select-value="${type}"]');if(!btn)return null;var r=btn.getBoundingClientRect();if(r.width===0)return null;return{x:Math.round(r.left+r.width/2),y:Math.round(r.top+r.height/2),w:Math.round(r.width),h:Math.round(r.height),attrs:{'aria-selected':btn.getAttribute('aria-selected')}}})()
`;
const JS_SUBMIT_TITLE = `
(function(){function qsa(root,sel){var rs=Array.from(root.querySelectorAll(sel));var all=root.querySelectorAll('*');for(var i=0;i<all.length;i++){if(all[i].shadowRoot)rs=rs.concat(qsa(all[i].shadowRoot,sel))}return rs}var els=qsa(document,'textarea[name="title"]');for(var i=0;i<els.length;i++){var r=els[i].getBoundingClientRect();if(r.width>0)return{x:Math.round(r.left+r.width/2),y:Math.round(r.top+r.height/2),w:Math.round(r.width),h:Math.round(r.height)}}return null})()
`;
const JS_SUBMIT_TITLE_VALUE = `
(function(){function qsa(root,sel){var rs=Array.from(root.querySelectorAll(sel));var all=root.querySelectorAll('*');for(var i=0;i<all.length;i++){if(all[i].shadowRoot)rs=rs.concat(qsa(all[i].shadowRoot,sel))}return rs}var els=qsa(document,'textarea[name="title"]');for(var i=0;i<els.length;i++){var r=els[i].getBoundingClientRect();if(r.width>0)return JSON.stringify(els[i].value||'')}return JSON.stringify('')})()
`;
const JS_SUBMIT_BODY = `
(function(){function qsa(root,sel){var rs=Array.from(root.querySelectorAll(sel));var all=root.querySelectorAll('*');for(var i=0;i<all.length;i++){if(all[i].shadowRoot)rs=rs.concat(qsa(all[i].shadowRoot,sel))}return rs}var els=qsa(document,'[contenteditable="true"][role="textbox"]');for(var i=0;i<els.length;i++){var r=els[i].getBoundingClientRect();if(r.width>0)return{x:Math.round(r.left+r.width/2),y:Math.round(r.top+r.height/2),w:Math.round(r.width),h:Math.round(r.height)}}return null})()
`;
const JS_SUBMIT_POST_BUTTON = `
(function(){function qsa(root,sel){var rs=Array.from(root.querySelectorAll(sel));var all=root.querySelectorAll('*');for(var i=0;i<all.length;i++){if(all[i].shadowRoot)rs=rs.concat(qsa(all[i].shadowRoot,sel))}return rs}var form=document.querySelector('r-post-composer-form');var root=form||document;var btns=qsa(root,'button');for(var i=0;i<btns.length;i++){if(btns[i].id==='inner-post-submit-button'){var r=btns[i].getBoundingClientRect();if(r.width>0)return{x:Math.round(r.left+r.width/2),y:Math.round(r.top+r.height/2),w:Math.round(r.width),h:Math.round(r.height),attrs:{disabled:String(btns[i].disabled)}}}}return null})()
`;
const JS_SAVE_DRAFT_BUTTON = `
(function(){function qsa(root,sel){var rs=Array.from(root.querySelectorAll(sel));var all=root.querySelectorAll('*');for(var i=0;i<all.length;i++){if(all[i].shadowRoot)rs=rs.concat(qsa(all[i].shadowRoot,sel))}return rs}var form=document.querySelector('r-post-composer-form');var root=form||document;var btns=qsa(root,'button');for(var i=0;i<btns.length;i++){if(btns[i].id==='inner-save-draft-button'){var r=btns[i].getBoundingClientRect();if(r.width>0)return{x:Math.round(r.left+r.width/2),y:Math.round(r.top+r.height/2),w:Math.round(r.width),h:Math.round(r.height),attrs:{disabled:String(btns[i].disabled)}}}}return null})()
`;
const JS_DRAFTS_BUTTON = `
(function(){var el=document.querySelector('drafts-button');if(!el||!el.shadowRoot)return null;var btn=el.shadowRoot.querySelector('button');if(!btn)return null;var r=btn.getBoundingClientRect();if(r.width===0)return null;return{x:Math.round(r.left+r.width/2),y:Math.round(r.top+r.height/2),w:Math.round(r.width),h:Math.round(r.height)}})()
`;
const JS_COMMUNITY_PICKER = `
(function(){var el=document.querySelector('community-picker');if(!el||!el.shadowRoot)return null;var btn=el.shadowRoot.querySelector('button');if(!btn)return null;var r=btn.getBoundingClientRect();if(r.width===0)return null;return{x:Math.round(r.left+r.width/2),y:Math.round(r.top+r.height/2),w:Math.round(r.width),h:Math.round(r.height)}})()
`;
const JS_DROP_ZONE = `
(function(){var el=document.querySelector('r-post-media-input');if(!el||!el.shadowRoot)return null;var dz=el.shadowRoot.querySelector('#fileInputInnerWrapper');if(!dz)return null;var r=dz.getBoundingClientRect();if(r.width===0)return null;return{x:Math.round(r.left+r.width/2),y:Math.round(r.top+r.height/2),w:Math.round(r.width),h:Math.round(r.height)}})()
`;
const JS_UPLOAD_BUTTON = `
(function(){var el=document.querySelector('r-post-media-input');if(!el||!el.shadowRoot)return null;var btn=el.shadowRoot.querySelector('#device-upload-button');if(!btn)return null;var r=btn.getBoundingClientRect();if(r.width===0)return null;return{x:Math.round(r.left+r.width/2),y:Math.round(r.top+r.height/2),w:Math.round(r.width),h:Math.round(r.height)}})()
`;
const JS_CREATE_POST_HEADER = `
(function(){function qsa(root,sel){var rs=Array.from(root.querySelectorAll(sel));for(var i=0;i<root.children.length;i++){if(root.children[i].shadowRoot)rs=rs.concat(qsa(root.children[i].shadowRoot,sel))}return rs}var links=qsa(document,'a');for(var i=0;i<links.length;i++){var h=links[i].href||'';if(h.includes('/submit')){var pr=links[i].parentElement;if(pr&&pr.tagName==='RPL-TOOLTIP'){var r=links[i].getBoundingClientRect();if(r.width>0)return{x:Math.round(r.left+r.width/2),y:Math.round(r.top+r.height/2),w:Math.round(r.width),h:Math.round(r.height),attrs:{href:h}}}}}return null})()
`;
const JS_CREATE_POST_SIDEBAR = `
(function(){function qsa(root,sel){var rs=Array.from(root.querySelectorAll(sel));for(var i=0;i<root.children.length;i++){if(root.children[i].shadowRoot)rs=rs.concat(qsa(root.children[i].shadowRoot,sel))}return rs}var links=qsa(document,'a');for(var i=0;i<links.length;i++){var h=links[i].href||'';if(h.includes('/submit')){var pr=links[i].parentElement;if(pr&&pr.tagName==='FACEPLATE-TRACKER'){var r=links[i].getBoundingClientRect();if(r.width>0)return{x:Math.round(r.left+r.width/2),y:Math.round(r.top+r.height/2),w:Math.round(r.width),h:Math.round(r.height),attrs:{href:h}}}}}return null})()
`;
const JS_IS_SUBREDDIT_PAGE = `
(function(){return /\\/r\\/[^/]+\\/?$/.test(window.location.href)})()
`;
const JS_IMAGE_UPLOAD_SELECTOR = "js:document.querySelector('r-post-media-input#post-composer_media').shadowRoot.querySelector('input[type=file].file-input')";
const JS_IMAGE_UPLOAD_BUTTON_SELECTOR = "js:document.querySelector('r-post-media-input#post-composer_media').shadowRoot.querySelector('#device-upload-button')";
const JS_TAG_TRIGGER_BUTTON = `
(function(){var modal=document.getElementById('post-flair-modal');if(!modal||!modal.shadowRoot)return null;var btn=modal.shadowRoot.getElementById('reddit-post-flair-button');if(!btn)return null;var r=btn.getBoundingClientRect();if(r.width===0)return null;return{x:Math.round(r.left+r.width/2),y:Math.round(r.top+r.height/2),w:Math.round(r.width),h:Math.round(r.height)}})()
`;
const JS_FLAIR_REQUIRED = `
(function(){var modal=document.getElementById('post-flair-modal');if(!modal)return JSON.stringify({error:'no modal'});return JSON.stringify({flairsRequired:modal.hasAttribute('flairs-required'),flairsAllowed:modal.hasAttribute('flairs-allowed'),spoilerAllowed:modal.hasAttribute('spoiler-tag-allowed'),ariaDisabled:modal.getAttribute('aria-disabled')==='true'})})()
`;
const JS_LIST_FLAIRS = `
(function(){function qs(root,sel){var r=root.querySelector(sel);if(r)return r;for(var j=0;j<root.querySelectorAll('*').length;j++){var el=root.querySelectorAll('*')[j];if(el.shadowRoot){r=qs(el.shadowRoot,sel);if(r)return r}}return null}var dialog=qs(document,'faceplate-dialog');if(!dialog)return JSON.stringify({error:'no dialog'});var modal=document.getElementById('post-flair-modal');var reqInfo={flairsRequired:false,flairsAllowed:true,spoilerAllowed:true};if(modal){reqInfo.flairsRequired=modal.hasAttribute('flairs-required');reqInfo.flairsAllowed=modal.hasAttribute('flairs-allowed');reqInfo.spoilerAllowed=modal.hasAttribute('spoiler-tag-allowed')}var radios=dialog.querySelectorAll('faceplate-radio-input[name="flairId"]');var flairs=[];for(var i=0;i<radios.length;i++){var radio=radios[i];var svg=radio.shadowRoot?radio.shadowRoot.querySelector('svg'):null;var selected=svg?svg.getAttribute('icon-name')==='radio-button-fill':false;var rr=radio.getBoundingClientRect();flairs.push({id:radio.id||'',text:(radio.textContent||'').trim(),value:radio.getAttribute('value')||'',selected:selected,x:rr.width>0?Math.round(rr.left+rr.width/2):0,y:rr.width>0?Math.round(rr.top+rr.height/2):0,w:Math.round(rr.width),h:Math.round(rr.height)})}var switches=dialog.querySelectorAll('faceplate-switch-input');var tags=[];for(var k=0;k<switches.length;k++){var sw=switches[k];var label=sw.parentElement?sw.parentElement.querySelector('p'):null;var sr=sw.getBoundingClientRect();tags.push({name:sw.getAttribute('name')||'',label:label?(label.textContent||'').trim():'',checked:sw.getAttribute('data-checked')==='true',x:sr.width>0?Math.round(sr.left+sr.width/2):0,y:sr.width>0?Math.round(sr.top+sr.height/2):0,w:Math.round(sr.width),h:Math.round(sr.height)})}return JSON.stringify({flairsRequired:reqInfo.flairsRequired,flairsAllowed:reqInfo.flairsAllowed,spoilerAllowed:reqInfo.spoilerAllowed,flairs:flairs,tags:tags})})()
`;
const JS_FLAIR_LOCATION_BY_TEXT = (text) => `
(function(){function qs(root,sel){var r=root.querySelector(sel);if(r)return r;for(var j=0;j<root.querySelectorAll('*').length;j++){var el=root.querySelectorAll('*')[j];if(el.shadowRoot){r=qs(el.shadowRoot,sel);if(r)return r}}return null}var dialog=qs(document,'faceplate-dialog');if(!dialog)return JSON.stringify({found:false,error:'no dialog'});var radios=dialog.querySelectorAll('faceplate-radio-input[name="flairId"]');var needle='${text.replace(/'/g, "\\'")}'.toLowerCase();for(var i=0;i<radios.length;i++){var t=(radios[i].textContent||'').trim().toLowerCase();if(t.indexOf(needle)>=0){var r=radios[i].getBoundingClientRect();return JSON.stringify({found:true,text:(radios[i].textContent||'').trim(),x:Math.round(r.left+r.width/2),y:Math.round(r.top+r.height/2),w:Math.round(r.width),h:Math.round(r.height)})}}return JSON.stringify({found:false})})()
`;
const JS_EXPAND_ALL_FLAIRS_LOCATION = `
(function(){function qs(root,sel){var r=root.querySelector(sel);if(r)return r;for(var j=0;j<root.querySelectorAll('*').length;j++){var el=root.querySelectorAll('*')[j];if(el.shadowRoot){r=qs(el.shadowRoot,sel);if(r)return r}}return null}var dialog=qs(document,'faceplate-dialog');if(!dialog)return null;var btn=dialog.querySelector('#view-all-flairs-button');if(!btn)return null;var r=btn.getBoundingClientRect();if(r.width===0)return null;return{x:Math.round(r.left+r.width/2),y:Math.round(r.top+r.height/2),w:Math.round(r.width),h:Math.round(r.height)}})()
`;
const JS_TAG_SWITCH_LOCATION = (tagName) => `
(function(){function qs(root,sel){var r=root.querySelector(sel);if(r)return r;for(var j=0;j<root.querySelectorAll('*').length;j++){var el=root.querySelectorAll('*')[j];if(el.shadowRoot){r=qs(el.shadowRoot,sel);if(r)return r}}return null}var dialog=qs(document,'faceplate-dialog');if(!dialog)return JSON.stringify({found:false});var sw=dialog.querySelector('faceplate-switch-input[name="${tagName}"]');if(!sw)return JSON.stringify({found:false});var r=sw.getBoundingClientRect();return JSON.stringify({found:true,name:"${tagName}",x:Math.round(r.left+r.width/2),y:Math.round(r.top+r.height/2),w:Math.round(r.width),h:Math.round(r.height)})})()
`;
const JS_FLAIR_APPLY_LOCATION = `
(function(){function qs(root,sel){var r=root.querySelector(sel);if(r)return r;for(var j=0;j<root.querySelectorAll('*').length;j++){var el=root.querySelectorAll('*')[j];if(el.shadowRoot){r=qs(el.shadowRoot,sel);if(r)return r}}return null}var dialog=qs(document,'faceplate-dialog');if(!dialog)return null;var btn=dialog.querySelector('#post-flair-modal-apply-button');if(!btn)return null;var r=btn.getBoundingClientRect();if(r.width===0)return null;return{x:Math.round(r.left+r.width/2),y:Math.round(r.top+r.height/2),w:Math.round(r.width),h:Math.round(r.height)}})()
`;
const JS_FLAIR_CANCEL_LOCATION = `
(function(){function qs(root,sel){var r=root.querySelector(sel);if(r)return r;for(var j=0;j<root.querySelectorAll('*').length;j++){var el=root.querySelectorAll('*')[j];if(el.shadowRoot){r=qs(el.shadowRoot,sel);if(r)return r}}return null}var dialog=qs(document,'faceplate-dialog');if(!dialog)return null;var btn=dialog.querySelector('#post-flair-modal-cancel-button');if(!btn)return null;var r=btn.getBoundingClientRect();if(r.width===0)return null;return{x:Math.round(r.left+r.width/2),y:Math.round(r.top+r.height/2),w:Math.round(r.width),h:Math.round(r.height)}})()
`;
const JS_SUBMIT_ERROR = `
(function(){var msgs=document.querySelectorAll('r-form-validation-message');var errors=[];for(var i=0;i<msgs.length;i++){var m=msgs[i];var sr=m.shadowRoot;if(!sr)continue;var t=(sr.textContent||'').trim();if(t.length>3){var r=m.getBoundingClientRect();errors.push({field:m.getAttribute('field-name')||'',text:t,visible:r.width>0&&r.height>0})}}if(errors.length>0)return JSON.stringify({hasError:true,errors:errors});return JSON.stringify({hasError:false})})()
`;
async function ensureTabFocus(client, tabId) {
  await client.tabFocus(tabId);
}
async function ensurePostDetailPage(client, tabId) {
  const result = await client.evaluateV2(tabId, `(function(){if(!location.pathname.match(/\\/comments\\//))return null;var p=document.querySelector('shreddit-post');if(!p)return null;return p.getAttribute('id')||null})()`);
  const postId = result.result;
  if (!postId) {
    console.log("[validate] current page is not a Reddit post detail page");
  }
  return postId;
}
function parseEvalResult(raw) {
  if (raw == null) return null;
  if (typeof raw === "string") {
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }
  return raw;
}
export {
  JS_CANCEL_BUTTON,
  JS_COMMENT_POSITION,
  JS_COMMENT_REPLY_BUTTON,
  JS_COMMENT_TRIGGER,
  JS_COMMENT_UPVOTE,
  JS_COMMUNITY_PICKER,
  JS_COMPOSER_TEXTAREA,
  JS_CREATE_POST_HEADER,
  JS_CREATE_POST_SIDEBAR,
  JS_DISMISS_TOAST_BUTTON,
  JS_DRAFTS_BUTTON,
  JS_DROP_ZONE,
  JS_EXPAND_ALL_FLAIRS_LOCATION,
  JS_FLAIR_APPLY_LOCATION,
  JS_FLAIR_CANCEL_LOCATION,
  JS_FLAIR_LOCATION_BY_TEXT,
  JS_FLAIR_REQUIRED,
  JS_GALLERY_CURRENT_IMAGE,
  JS_GALLERY_NEXT,
  JS_GALLERY_PAGE_COUNT,
  JS_GALLERY_PREV,
  JS_IMAGE_UPLOAD_BUTTON_SELECTOR,
  JS_IMAGE_UPLOAD_SELECTOR,
  JS_IS_SUBREDDIT_PAGE,
  JS_LINK_CARD_ENTRY,
  JS_LINK_OPEN_BAR,
  JS_LISTING_BODY_ENTRY,
  JS_LISTING_COMMENTS_ENTRY,
  JS_LISTING_GALLERY_CURRENT,
  JS_LISTING_GALLERY_NEXT,
  JS_LISTING_GALLERY_PAGE_COUNT,
  JS_LISTING_GALLERY_PREV,
  JS_LISTING_IMAGE,
  JS_LISTING_VIDEO_PLAYER,
  JS_LIST_FLAIRS,
  JS_POST_IMAGE,
  JS_POST_TYPE_TAB,
  JS_POST_UPVOTE,
  JS_REGISTER_BIRTHDAY_ABOUT_TITLE,
  JS_REGISTER_BIRTHDAY_DAY_INPUT,
  JS_REGISTER_BIRTHDAY_LABELS,
  JS_REGISTER_BIRTHDAY_MONTH_INPUT,
  JS_REGISTER_BIRTHDAY_SKIP_BUTTON,
  JS_REGISTER_BIRTHDAY_YEAR_INPUT,
  JS_REGISTER_CONFIRM_BIRTHDAY_TITLE,
  JS_REGISTER_CONFIRM_BIRTHDAY_YES_BUTTON,
  JS_REGISTER_CONTINUE_BUTTON,
  JS_REGISTER_DETECT_PAGE_TITLE,
  JS_REGISTER_EMAIL_INPUT,
  JS_REGISTER_FEED_CHIPS,
  JS_REGISTER_FEED_CHIP_COORD,
  JS_REGISTER_FEED_TITLE,
  JS_REGISTER_GENDER_MAN,
  JS_REGISTER_GENDER_NON_BINARY,
  JS_REGISTER_GENDER_PREFER_NOT_SAY,
  JS_REGISTER_GENDER_WOMAN,
  JS_REGISTER_INTEREST,
  JS_REGISTER_INTERESTS_TITLE,
  JS_REGISTER_INTEREST_CONTINUE_BUTTON,
  JS_REGISTER_PASSWORD_INPUT,
  JS_REGISTER_PASSWORD_TOGGLE,
  JS_REGISTER_PASSWORD_TYPE,
  JS_REGISTER_SHOW_MORE_TOPICS,
  JS_REGISTER_SKIP_BUTTON,
  JS_REGISTER_TOPIC_CONTINUE_BUTTON,
  JS_REGISTER_TOPIC_EXTRACT,
  JS_REGISTER_TOPIC_SEARCH,
  JS_REGISTER_USERNAME_CONTINUE_BUTTON,
  JS_REGISTER_USERNAME_INPUT,
  JS_REGISTER_USERNAME_SUGGEST_BUTTON,
  JS_REGISTER_VERIFY_CODE_INPUT,
  JS_REGISTER_VERIFY_CONTINUE_BUTTON,
  JS_REGISTER_VERIFY_RESEND_BUTTON,
  JS_REPLY_SUBMIT,
  JS_REPLY_TEXTAREA,
  JS_REPLY_TEXT_LEN,
  JS_SAVE_DRAFT_BUTTON,
  JS_SUBMIT_BODY,
  JS_SUBMIT_BUTTON,
  JS_SUBMIT_ERROR,
  JS_SUBMIT_POST_BUTTON,
  JS_SUBMIT_TITLE,
  JS_SUBMIT_TITLE_VALUE,
  JS_TAG_SWITCH_LOCATION,
  JS_TAG_TRIGGER_BUTTON,
  JS_TOPLEVEL_TEXT_LEN,
  JS_UPLOAD_BUTTON,
  JS_VIDEO_FULLSCREEN,
  JS_VIDEO_INFO,
  JS_VIDEO_MUTE,
  JS_VIDEO_PLAY,
  JS_VIDEO_PLAYER_RECT,
  JS_VIDEO_PROGRESS_BAR,
  JS_VIDEO_QUALITY_OPTIONS,
  JS_VIDEO_SETTINGS,
  JS_VIDEO_VOLUME,
  briefBrowseAfterAction,
  clamp,
  clearComposerText,
  clearFocusedText,
  clearRegisterNameInputFocusedText,
  clearRegisterPasswordInputFocusedText,
  clickBlankArea,
  createTabSwitchScheduler,
  ensurePostDetailPage,
  ensureTabFocus,
  findInstanceIdForTab,
  gaussianRandom,
  hoverWithHesitation,
  humanClick,
  humanClickElement,
  humanClickPoint,
  humanMouseMove,
  humanPause,
  humanReview,
  humanScrollDown,
  humanScrollUp,
  humanType,
  locateAndScrollByJS,
  locateByJS,
  middleClickAt,
  mouseScanReview,
  pageWarmUp,
  parseEvalResult,
  pollLocate,
  quickScrollDown,
  randomViewportPosition,
  readRegisterInputValues,
  readingFollowMove,
  readingTremor,
  refocusAndBlurTitle,
  scrollToTop,
  scrollToTopHuman,
  settleAfterLoad,
  simulateTabSwitch,
  symmetricNormal,
  waitForNewTab
};
