import {
  clamp,
  humanClick,
  humanClickElement,
  humanMouseMove,
  humanPause,
  locateByJS,
  locateAndScrollByJS,
  JS_VIDEO_INFO,
  JS_VIDEO_PLAYER_RECT,
  JS_VIDEO_PLAY,
  JS_VIDEO_MUTE,
  JS_VIDEO_FULLSCREEN,
  JS_VIDEO_PROGRESS_BAR,
  JS_VIDEO_VOLUME,
  JS_VIDEO_SETTINGS,
  JS_VIDEO_QUALITY_OPTIONS
} from "./reddit-human.js";
function pickQualityOption(opts, rng = Math.random) {
  const cands = opts.filter((o) => !o.selected && o.w > 0);
  if (cands.length === 0) return null;
  return cands[Math.floor(rng() * cands.length)];
}
function unmuteGate(_mode, interest, replayed, rng = Math.random) {
  return interest > 0.65 || replayed || interest > 0.3 && rng() < 0.4;
}
function fullscreenGate(mode, interest, rng = Math.random) {
  const p = mode === "listing" ? interest > 0.65 ? 0.2 : interest > 0.3 ? 0.1 : 0 : interest > 0.65 ? 0.35 : interest > 0.3 ? 0.15 : 0;
  return p > 0 && rng() < p;
}
function qualityGate(mode, interest, rng = Math.random) {
  if (interest <= 0.3) return false;
  const p = mode === "listing" ? 0.15 : 0.12;
  return rng() < p;
}
function decideSeek(mode, interest, currentRatio, rng = Math.random) {
  if (mode === "listing") {
    if (interest < 0.3 && rng() < 0.4)
      return { targetRatio: Math.min(0.9, currentRatio + 0.3 + rng() * 0.3) };
    if (interest >= 0.3 && interest <= 0.65 && rng() < 0.1)
      return { targetRatio: Math.min(0.85, currentRatio + 0.1 + rng() * 0.15) };
    return null;
  }
  if (interest < 0.3 && rng() < 0.6)
    return { targetRatio: Math.min(0.9, currentRatio + 0.3 + rng() * 0.3) };
  if (interest >= 0.3 && interest <= 0.65 && rng() < 0.15)
    return { targetRatio: Math.min(0.85, currentRatio + 0.1 + rng() * 0.15) };
  if (interest > 0.65 && rng() < 0.05 && currentRatio > 0.2)
    return { targetRatio: Math.max(0, currentRatio - 0.05 - rng() * 0.1) };
  return null;
}
function watchMsFor(mode, interest, duration, currentTime, rng = Math.random) {
  const remaining = Math.max(0, (duration - currentTime) * 1e3);
  const ratio = interest > 0.65 ? mode === "listing" ? 0.4 + rng() * 0.3 : 0.5 + rng() * 0.3 : interest > 0.3 ? mode === "listing" ? 0.25 + rng() * 0.25 : 0.3 + rng() * 0.25 : 0.15 + rng() * 0.2;
  const desired = Math.round(duration * ratio * 1e3);
  const minMs = interest < 0.3 ? 2e3 : 5e3;
  const maxMs = mode === "listing" ? 45e3 : 6e4;
  return clamp(Math.min(desired, remaining + 2e3), minMs, maxMs);
}
async function getVideoInfo(client, tabId, postId) {
  const result = await client.evaluateV2(tabId, JS_VIDEO_INFO(postId));
  const raw = result.result;
  let data = raw;
  if (typeof raw === "string") {
    try {
      data = JSON.parse(raw);
    } catch {
      data = null;
    }
  }
  if (!data) return { paused: true, muted: true, duration: 0, currentTime: 0, ended: false };
  return {
    paused: data.paused !== false,
    muted: data.muted !== false,
    duration: Number(data.duration) || 0,
    currentTime: Number(data.currentTime) || 0,
    ended: data.ended === true
  };
}
async function seekVideo(client, tabId, targetRatio, postId) {
  const barLoc = await locateByJS(client, tabId, JS_VIDEO_PROGRESS_BAR(postId));
  if (!barLoc) return;
  const barLeft = barLoc.x - barLoc.w / 2;
  const targetX = Math.round(barLeft + barLoc.w * clamp(targetRatio, 0, 1));
  await humanMouseMove(client, tabId, targetX, barLoc.y);
  await humanPause(600, 1200);
  await humanClick(client, tabId, targetX, barLoc.y);
  await humanPause(500, 1e3);
  const awayY = barLoc.y - 80 - Math.round(Math.random() * 60);
  await humanMouseMove(client, tabId, targetX, Math.max(awayY, 50));
  await humanPause(200, 400);
}
async function switchVideoQuality(client, tabId, postId) {
  const tag = ["video-quality"];
  try {
    const gear = await locateByJS(client, tabId, JS_VIDEO_SETTINGS(postId));
    if (gear) {
      await humanClickElement(client, tabId, gear);
      await humanPause(300, 600);
    }
    let options = [];
    for (let attempt = 0; attempt < 6; attempt++) {
      const res = await client.evaluateV2(tabId, JS_VIDEO_QUALITY_OPTIONS(postId));
      const raw = res.result;
      try {
        options = typeof raw === "string" ? JSON.parse(raw) : raw || [];
      } catch {
        options = [];
      }
      if (options.some((o) => o.w > 0)) break;
      await humanPause(250, 400);
    }
    const pick = pickQualityOption(options);
    if (!pick) {
      client.logInfo(tabId, "no switchable quality option available", tag);
      return { changed: false };
    }
    await humanClickElement(client, tabId, pick, { skipMoveAway: true });
    client.logInfo(tabId, `switched video quality to ${pick.text} (${pick.testid})`, tag);
    await humanPause(500, 900);
    return { changed: true, to: pick.text };
  } catch (e) {
    client.logWarn(tabId, `quality switch failed: ${e?.message || e}`, tag);
    return { changed: false };
  }
}
async function interactWithVideo(client, tabId, opts) {
  const { postId, interest, mode, humanConfig: _hc } = opts;
  const tag = mode === "listing" ? ["listing-media"] : ["browse-post"];
  const vid = postId ? ` ${postId}` : "";
  if (interest < 0.3 && Math.random() < 0.5) {
    await humanPause(1e3, 2e3);
    return { status: "skipped", message: `low interest, skipped video${vid}`, data: { postId } };
  }
  let rect = null;
  try {
    rect = await locateAndScrollByJS(client, tabId, JS_VIDEO_PLAYER_RECT(postId));
  } catch (e) {
    client.logWarn(tabId, `[${mode}] player locate failed: ${e?.message || e}`, tag);
  }
  if (!rect) {
    return { status: "skipped", message: `video player not located${vid}`, data: { postId } };
  }
  if (mode === "listing") {
    await humanMouseMove(client, tabId, rect.x, rect.y);
    await humanPause(400, 800);
  } else {
    await humanPause(300, 600);
  }
  let info = await getVideoInfo(client, tabId, postId);
  const duration = info.duration || 30;
  const isShort = duration <= 30;
  client.logInfo(
    tabId,
    `[${mode}] video${vid} state: paused=${info.paused} muted=${info.muted} ended=${info.ended} dur=${duration}s t=${info.currentTime}s`,
    tag
  );
  let replayed = false;
  if (info.duration > 0 && (info.ended || info.currentTime >= info.duration - 0.5)) {
    if (interest > 0.3) {
      const playLoc = await locateByJS(client, tabId, JS_VIDEO_PLAY(postId));
      if (playLoc) {
        await humanClickElement(client, tabId, playLoc);
        await humanPause(isShort ? 800 : 1500, isShort ? 1500 : 2500);
        info = await getVideoInfo(client, tabId, postId);
        replayed = true;
      }
    } else {
      return { status: "skipped", message: `video ended, low interest${vid}`, data: { postId } };
    }
  }
  if (info.paused) {
    const playLoc = await locateByJS(client, tabId, JS_VIDEO_PLAY(postId));
    if (playLoc) {
      await humanClickElement(client, tabId, playLoc);
      await humanPause(isShort ? 500 : 1e3, isShort ? 1200 : 2e3);
      info = await getVideoInfo(client, tabId, postId);
      if (info.paused) {
        const retry = await locateByJS(client, tabId, JS_VIDEO_PLAY(postId));
        if (retry) {
          await humanClickElement(client, tabId, retry);
          await humanPause(500, 1e3);
          info = await getVideoInfo(client, tabId, postId);
        }
      }
    }
  }
  if (info.muted && unmuteGate(mode, interest, replayed)) {
    try {
      const muteLoc = await locateByJS(client, tabId, JS_VIDEO_MUTE(postId));
      if (muteLoc) {
        await humanClickElement(client, tabId, muteLoc);
        await humanPause(300, 600);
      }
    } catch (e) {
      client.logWarn(tabId, `[${mode}] unmute failed: ${e?.message || e}`, tag);
    }
  }
  const goFs = fullscreenGate(mode, interest);
  if (goFs) {
    try {
      const fsLoc = await locateByJS(client, tabId, JS_VIDEO_FULLSCREEN(postId));
      if (fsLoc) {
        await humanClickElement(client, tabId, fsLoc);
        await humanPause(isShort ? 500 : 1e3, isShort ? 1e3 : 2e3);
      }
    } catch (e) {
      client.logWarn(tabId, `[${mode}] fullscreen failed: ${e?.message || e}`, tag);
    }
  }
  if (qualityGate(mode, interest)) {
    await switchVideoQuality(client, tabId, postId);
  }
  const watchMs = watchMsFor(mode, interest, duration, info.currentTime);
  const loopMin = isShort ? 400 : 800;
  const loopMax = isShort ? 800 : 1500;
  const seekCooldown = (isShort ? 1500 : 3e3) * (mode === "listing" ? 1.5 : 1);
  client.logInfo(tabId, `[${mode}] watch ~${Math.round(watchMs / 1e3)}s${vid}`, tag);
  const start = Date.now();
  let lastSeek = 0;
  let lastPlayCheck = 0;
  while (Date.now() - start < watchMs) {
    const elapsed = Date.now() - start;
    if (elapsed - lastPlayCheck > 5e3) {
      lastPlayCheck = elapsed;
      try {
        const ci = await getVideoInfo(client, tabId, postId);
        const ended = ci.duration > 0 && (ci.ended || ci.currentTime >= ci.duration - 0.5);
        if (ci.paused && !ended) {
          const p = await locateByJS(client, tabId, JS_VIDEO_PLAY(postId));
          if (p) await humanClickElement(client, tabId, p);
        }
      } catch {
      }
    }
    if (elapsed - lastSeek > seekCooldown) {
      const ci = await getVideoInfo(client, tabId, postId);
      const cur = ci.currentTime / (ci.duration || 1);
      const d = decideSeek(mode, interest, cur);
      if (d) {
        await seekVideo(client, tabId, d.targetRatio, postId);
        lastSeek = Date.now();
        continue;
      }
    }
    if (mode === "detail" && interest > 0.3 && Math.random() < (interest > 0.65 ? 0.08 : 0.04)) {
      try {
        const p = await locateByJS(client, tabId, JS_VIDEO_PLAY(postId));
        if (p) {
          await humanClickElement(client, tabId, p);
          await humanPause(1500, 3500);
          await humanClickElement(client, tabId, p);
          await humanPause(500, 1e3);
        }
      } catch {
      }
    }
    if (mode === "detail" && interest > 0.3 && !info.muted && Math.random() < 0.05) {
      try {
        const vol = await locateByJS(client, tabId, JS_VIDEO_VOLUME(postId));
        if (vol) {
          const clickX = vol.x - Math.round(vol.w / 2) + Math.round(Math.random() * vol.w);
          await humanClick(client, tabId, clickX, vol.y);
          await humanPause(500, 1e3);
        }
      } catch {
      }
    }
    await humanPause(loopMin, loopMax);
  }
  if (goFs) {
    try {
      await client.humanKeyboardPress(tabId, { key: "Escape" });
      await humanPause(500, 1e3);
    } catch {
    }
  }
  return {
    status: "success",
    message: `watched video${vid} ~${Math.round(watchMs / 1e3)}s`,
    data: { postId, mode, watchSec: Math.round(watchMs / 1e3) }
  };
}
export {
  decideSeek,
  fullscreenGate,
  getVideoInfo,
  interactWithVideo,
  pickQualityOption,
  qualityGate,
  seekVideo,
  switchVideoQuality,
  unmuteGate,
  watchMsFor
};
