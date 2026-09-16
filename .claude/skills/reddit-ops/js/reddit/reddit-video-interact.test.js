import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  JS_VIDEO_PLAY,
  JS_VIDEO_MUTE,
  JS_VIDEO_FULLSCREEN,
  JS_VIDEO_PROGRESS_BAR,
  JS_VIDEO_VOLUME,
  JS_VIDEO_INFO,
  JS_VIDEO_SETTINGS,
  JS_VIDEO_QUALITY_OPTIONS
} from "./reddit-human.ts";
import {
  pickQualityOption,
  unmuteGate,
  fullscreenGate,
  qualityGate,
  decideSeek,
  watchMsFor
} from "./reddit-video-interact.ts";
describe("JS_VIDEO_* postId scoping", () => {
  it("scopes to shreddit-post[id] when postId given", () => {
    const s = JS_VIDEO_PLAY("t3_abc");
    assert.ok(
      s.includes('shreddit-post[id="t3_abc"] shreddit-player'),
      `scoped form must include post scope; got: ${s.slice(0, 160)}`
    );
  });
  it("is global (no post scope) when postId omitted", () => {
    const s = JS_VIDEO_PLAY();
    assert.ok(!s.includes("shreddit-post[id="), "omitted postId must be global");
    assert.ok(s.includes("shreddit-player"));
  });
  it("JS_VIDEO_QUALITY_OPTIONS targets data-testid quality/auto options", () => {
    const s = JS_VIDEO_QUALITY_OPTIONS();
    assert.ok(s.includes('data-testid="quality-option"'));
    assert.ok(s.includes('data-testid="auto-quality-option"'));
    assert.ok(s.includes("shreddit-video-settings"));
  });
  it("JS_VIDEO_SETTINGS targets the settings gear", () => {
    const s = JS_VIDEO_SETTINGS();
    assert.ok(s.includes('icon-name="settings-fill"'));
    assert.ok(s.includes("shreddit-video-settings"));
  });
  it("all control selectors pierce shreddit-media-ui shadow", () => {
    for (const fn of [
      JS_VIDEO_PLAY,
      JS_VIDEO_MUTE,
      JS_VIDEO_FULLSCREEN,
      JS_VIDEO_PROGRESS_BAR,
      JS_VIDEO_VOLUME,
      JS_VIDEO_SETTINGS,
      JS_VIDEO_QUALITY_OPTIONS
    ]) {
      assert.ok(fn().includes("shreddit-media-ui"), `expected ${fn.name} to pierce media-ui`);
    }
  });
  it("JS_VIDEO_INFO is global when postId omitted and scoped when given", () => {
    assert.ok(JS_VIDEO_INFO().includes("shreddit-player"));
    assert.ok(!JS_VIDEO_INFO().includes("shreddit-post[id="));
    assert.ok(JS_VIDEO_INFO("t3_x").includes('shreddit-post[id="t3_x"]'));
  });
});
describe("pickQualityOption", () => {
  const opts = [
    { testid: "quality-option", text: "720p", x: 1, y: 1, w: 96, h: 31, selected: false },
    { testid: "quality-option", text: "480p", x: 1, y: 1, w: 96, h: 31, selected: true },
    { testid: "auto-quality-option", text: "Auto", x: 1, y: 1, w: 96, h: 31, selected: false }
  ];
  it("never returns a selected option", () => {
    for (let i = 0; i < 20; i++) {
      const o = pickQualityOption(opts, () => i / 20);
      assert.ok(o && !o.selected, "must not pick selected");
    }
  });
  it("never returns a hidden (0-width) option", () => {
    const hidden = [
      { testid: "quality-option", text: "240p", x: 1, y: 1, w: 0, h: 0, selected: false }
    ];
    assert.equal(pickQualityOption(hidden), null);
  });
  it("returns null when all selected", () => {
    const all = opts.map((o) => ({ ...o, selected: true }));
    assert.equal(pickQualityOption(all), null);
  });
  it("returns null for empty input", () => {
    assert.equal(pickQualityOption([]), null);
  });
});
describe("gates", () => {
  it("unmuteGate: high interest or replayed always unmutes", () => {
    assert.equal(unmuteGate("detail", 0.8, false, () => 0.99), true);
    assert.equal(unmuteGate("listing", 0.2, true, () => 0.99), true);
  });
  it("unmuteGate: mid interest honors the 40% chance", () => {
    assert.equal(unmuteGate("detail", 0.5, false, () => 0), true);
    assert.equal(unmuteGate("detail", 0.5, false, () => 0.99), false);
  });
  it("fullscreenGate: detail heavier than listing; low interest never", () => {
    assert.equal(fullscreenGate("detail", 0.7, () => 0.1), true);
    assert.equal(fullscreenGate("listing", 0.7, () => 0.1), true);
    assert.equal(fullscreenGate("detail", 0.2, () => 0), false);
  });
  it("fullscreenGate: detail p=0.35 vs listing p=0.20 at interest 0.7", () => {
    assert.equal(fullscreenGate("detail", 0.7, () => 0.34), true);
    assert.equal(fullscreenGate("detail", 0.7, () => 0.36), false);
    assert.equal(fullscreenGate("listing", 0.7, () => 0.19), true);
    assert.equal(fullscreenGate("listing", 0.7, () => 0.21), false);
  });
  it("qualityGate: disabled at low interest; both modes at mid+", () => {
    assert.equal(qualityGate("detail", 0.2, () => 0), false);
    assert.equal(qualityGate("detail", 0.5, () => 0), true);
    assert.equal(qualityGate("listing", 0.5, () => 0), true);
    assert.equal(qualityGate("detail", 0.5, () => 0.99), false);
  });
});
describe("decideSeek", () => {
  it("low interest detail seeks forward often", () => {
    const d = decideSeek("detail", 0.2, 0.1, () => 0);
    assert.ok(d && d.targetRatio > 0.1, "should seek forward");
  });
  it("high interest listing never auto-seeks", () => {
    for (let i = 0; i < 10; i++) {
      assert.equal(decideSeek("listing", 0.8, 0.5, () => i / 10), null);
    }
  });
  it("never seeks beyond 0.9", () => {
    for (let i = 0; i < 20; i++) {
      const d = decideSeek("detail", 0.2, 0.8, () => i / 20);
      if (d) assert.ok(d.targetRatio <= 0.9 + 1e-9);
    }
  });
  it("high interest detail re-watches backward only when currentRatio>0.2", () => {
    const d = decideSeek("detail", 0.8, 0.5, () => 0);
    assert.ok(d && d.targetRatio < 0.5);
    assert.equal(decideSeek("detail", 0.8, 0.1, () => 0), null);
  });
});
describe("watchMsFor", () => {
  it("detail high interest maps to 50% of duration at rng=0", () => {
    assert.equal(watchMsFor("detail", 0.7, 100, 0, () => 0), 5e4);
  });
  it("listing caps at 45s; detail caps at 60s", () => {
    assert.equal(watchMsFor("listing", 0.7, 1e3, 0, () => 0), 45e3);
    assert.equal(watchMsFor("detail", 0.7, 1e3, 0, () => 0), 6e4);
  });
  it("low interest floor is 2000ms", () => {
    assert.ok(watchMsFor("detail", 0.1, 1, 0, () => 0) >= 2e3);
  });
});
