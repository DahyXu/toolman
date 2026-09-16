import { PinchTabClient } from "../api.js";
import {
  clearRegisterNameInputFocusedText,
  clearRegisterPasswordInputFocusedText,
  ensureTabFocus,
  hoverWithHesitation,
  humanClickElement,
  humanMouseMove,
  humanPause,
  humanType,
  JS_REGISTER_BIRTHDAY_DAY_INPUT,
  JS_REGISTER_BIRTHDAY_LABELS,
  JS_REGISTER_BIRTHDAY_MONTH_INPUT,
  JS_REGISTER_BIRTHDAY_SKIP_BUTTON,
  JS_REGISTER_BIRTHDAY_YEAR_INPUT,
  JS_REGISTER_CONFIRM_BIRTHDAY_YES_BUTTON,
  JS_REGISTER_CONTINUE_BUTTON,
  JS_REGISTER_DETECT_PAGE_TITLE,
  JS_REGISTER_EMAIL_INPUT,
  JS_REGISTER_FEED_TITLE,
  JS_REGISTER_FEED_CHIPS,
  JS_REGISTER_FEED_CHIP_COORD,
  JS_REGISTER_GENDER_MAN,
  JS_REGISTER_GENDER_NON_BINARY,
  JS_REGISTER_GENDER_PREFER_NOT_SAY,
  JS_REGISTER_GENDER_WOMAN,
  JS_REGISTER_INTEREST,
  JS_REGISTER_INTEREST_CONTINUE_BUTTON,
  JS_REGISTER_INTERESTS_TITLE,
  JS_REGISTER_PASSWORD_INPUT,
  JS_REGISTER_PASSWORD_TOGGLE,
  JS_REGISTER_PASSWORD_TYPE,
  JS_REGISTER_SKIP_BUTTON,
  JS_REGISTER_TOPIC_CONTINUE_BUTTON,
  JS_REGISTER_USERNAME_CONTINUE_BUTTON,
  JS_REGISTER_USERNAME_INPUT,
  JS_REGISTER_USERNAME_SUGGEST_BUTTON,
  JS_REGISTER_VERIFY_CODE_INPUT,
  JS_REGISTER_VERIFY_CONTINUE_BUTTON,
  JS_REGISTER_VERIFY_RESEND_BUTTON,
  locateAndScrollByJS,
  locateByJS,
  pageWarmUp,
  readRegisterInputValues,
  simulateTabSwitch
} from "./reddit-human.js";
import { getCliArg, getCliOptions, runMain } from "./cli.js";
import { enterRedditViaSearch, stepEnterRegister } from "./reddit-entry.js";
import { browsePostList } from "./reddit-post-list.js";
import { clickPost } from "./reddit-post-click.js";
import { browsePost } from "./reddit-browse-post.js";
const JS_REDDIT_LOGO = `
(function(){var el=document.querySelector('#reddit-logo');if(!el)el=document.querySelector('a[href="https://www.reddit.com/"]');if(!el)return null;var r=el.getBoundingClientRect();if(r.width===0)return null;return{x:Math.round(r.left+r.width/2),y:Math.round(r.top+r.height/2),w:Math.round(r.width),h:Math.round(r.height)}}})()
`;
const PERSONAS = [
  {
    gender: "man",
    interests: ["Gaming", "Technology", "Sports"]
  },
  {
    gender: "man",
    interests: ["Gaming", "Entertainment", "Food"]
  },
  {
    gender: "man",
    interests: ["Gaming", "Technology", "News"]
  },
  {
    gender: "woman",
    interests: ["Art", "Beauty", "Travel"]
  },
  {
    gender: "woman",
    interests: ["Food", "Wellness", "Travel"]
  },
  {
    gender: "woman",
    interests: ["Entertainment", "Art", "Beauty"]
  },
  {
    gender: "non_binary",
    interests: ["Technology", "Gaming", "Career"]
  },
  {
    gender: "prefer_not_say",
    interests: ["Entertainment", "Art", "Wellness"]
  },
  {
    gender: "skip",
    interests: ["Gaming", "Food", "Travel"]
  },
  {
    gender: "man",
    interests: ["Sports", "News", "Career"]
  },
  {
    // Index 10 — minimal: skip gender, pick 1 interest
    gender: "skip",
    interests: ["Technology"]
  }
];
const PW_WORDS = [
  "shadow",
  "dragon",
  "phoenix",
  "thunder",
  "blaze",
  "frost",
  "crystal",
  "ember",
  "raven",
  "falcon",
  "viper",
  "tiger",
  "eagle",
  "wolf",
  "lion",
  "knight",
  "ninja",
  "pirate",
  "wizard",
  "hunter",
  "storm",
  "ocean",
  "river",
  "star",
  "moon",
  "cloud",
  "night",
  "dawn",
  "dust",
  "steel",
  "iron",
  "gold",
  "silver",
  "bronze",
  "stone",
  "flame",
  "ice",
  "wind"
];
const PW_SYMBOLS = ["!", "@", "#", "$", "%", "&", "*", "?", "_", "-", "."];
function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}
async function waitForElement(client, tabId, jsExpr, label, maxAttempts = 12) {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const el = await locateByJS(client, tabId, jsExpr);
    if (el) {
      if (attempt > 0) {
        console.log(`[register] ${label} appeared after ${attempt + 1} attempts`);
      }
      return el;
    }
    const delay = Math.min(1500 * Math.pow(1.3, attempt), 8e3);
    const jitter = delay * (0.7 + Math.random() * 0.6);
    console.log(`[register] waiting for ${label}... (attempt ${attempt + 1}/${maxAttempts}, next in ${Math.round(jitter)}ms)`);
    await new Promise((r) => setTimeout(r, jitter));
  }
  throw new Error(`${label} did not appear within timeout`);
}
function generatePassword() {
  const roll = Math.random();
  if (roll < 0.25) {
    return pick(PW_WORDS) + randInt(10, 9999);
  } else if (roll < 0.5) {
    const w = pick(PW_WORDS);
    return w.charAt(0).toUpperCase() + w.slice(1) + pick(PW_SYMBOLS) + randInt(10, 999);
  } else if (roll < 0.75) {
    return pick(PW_WORDS) + "_" + pick(PW_WORDS) + randInt(10, 99);
  } else {
    const w1 = pick(PW_WORDS);
    const w2 = pick(PW_WORDS.filter((w) => w !== w1));
    return w1.charAt(0).toUpperCase() + w1.slice(1) + w2.charAt(0).toUpperCase() + w2.slice(1) + randInt(1e3, 9999);
  }
}
const GAMER_SHORT = [
  "Kai",
  "Vex",
  "Zed",
  "Nex",
  "Jax",
  "Dex",
  "Lux",
  "Zyn",
  "Ryk",
  "Kov",
  "Tyn",
  "Rex",
  "Lev",
  "Maz",
  "Quin",
  "Kaz",
  "Dax",
  "Zan",
  "Fen",
  "Raze",
  "Skye",
  "Jett",
  "Sova",
  "Omen",
  "Yoru",
  "Kayo",
  "Reyna",
  "Sage",
  "Brim",
  "Vexx",
  "Ryze",
  "Talon",
  "Zedx",
  "Kova",
  "Maxx",
  "Torv",
  "Halen",
  "Dren",
  "Ash",
  "Nyro",
  "Voss",
  "Jinn",
  "Kael",
  "Thorn",
  "Zeph",
  "Cryo",
  "Syl",
  "Krynn",
  "Vyn",
  "Gorr",
  "Solv",
  "Crix",
  "Pryn",
  "Rokk",
  "Tess",
  "Wyld",
  "Nomm",
  "Jolt",
  "Synt",
  "Brix",
  "Fynx",
  "Zorr",
  "Myth",
  "Lynk",
  "Dusk",
  "Vale",
  "Rift",
  "Glyn",
  "Haze",
  "Therm",
  "Korr",
  "Vice",
  "Noxx",
  "Ferro"
];
const GAMER_STYLE = [
  "Shadow",
  "Blaze",
  "Frost",
  "Storm",
  "Flux",
  "Nova",
  "Cobra",
  "Raven",
  "Viper",
  "Phoenix",
  "Falcon",
  "Hawk",
  "Wolf",
  "Tiger",
  "Eagle",
  "Lynx",
  "Drift",
  "Surge",
  "Cipher",
  "Vector",
  "Razor",
  "Havoc",
  "Rumble",
  "Echo",
  "Wraith",
  "Mirage",
  "Crypto",
  "Octane",
  "Fuse",
  "Pulse",
  "Hex",
  "Arcane",
  "Circuit",
  "Splice",
  "Prism",
  "Static",
  "Glitch",
  "Vortex",
  "Nebula",
  "Tundra",
  "Monsoon",
  "Ember",
  "Shard",
  "Hollow",
  "Chasm",
  "Boulder",
  "Mantle",
  "Craggy",
  "Trench",
  "Aether",
  "Maelstrom",
  "Scorch",
  "Warp",
  "Sonic",
  "Pyre",
  "Quarry",
  "Ledger",
  "Silo",
  "Ridge",
  "Fractal",
  "Quasar"
];
const REAL_NAME_MALE = [
  "Cole",
  "Wade",
  "Brett",
  "Troy",
  "Drew",
  "Chase",
  "Grant",
  "Blake",
  "Scott",
  "Trent",
  "Craig",
  "Ross",
  "Shane",
  "Jake",
  "Luke",
  "Kyle",
  "Reed",
  "Brock",
  "Dane",
  "Gage",
  "Reese",
  "Vince",
  "Zack",
  "Miles",
  "Dustin",
  "Cliff",
  "Heath",
  "Damon",
  "Ellis",
  "Rhett",
  "Pierce",
  "Flint"
];
const REAL_NAME_FEMALE = [
  "Ella",
  "Lena",
  "Maya",
  "Rosa",
  "Iris",
  "Aria",
  "Zara",
  "Nora",
  "Cleo",
  "Rhea",
  "Yara",
  "Luna",
  "Mira",
  "Sage",
  "Fern",
  "Thea",
  "Rue",
  "Veda",
  "Elara",
  "Sia",
  "Tessa",
  "Gwen",
  "Corra",
  "Faye",
  "Willa",
  "Marnie",
  "Linnea",
  "Seren",
  "Briar",
  "Petra",
  "Davina",
  "Lyra"
];
const GAMER_SUFFIX = [
  "X",
  "OG",
  "HD",
  "R6",
  "GG",
  "OP",
  "FX",
  "Pro",
  "Elite",
  "TV",
  "MVP",
  "N7",
  "IQ",
  "XP",
  "A1",
  "Zen",
  "Raw",
  "Solo"
];
const ADJECTIVES = [
  "Silent",
  "Quick",
  "Rusty",
  "Bold",
  "Lazy",
  "Sly",
  "Odd",
  "Faint",
  "Calm",
  "Brisk",
  "Wry",
  "Vast",
  "Lean",
  "Mild",
  "Keen",
  "Grim",
  "Slick",
  "Stark",
  "Bleak",
  "Crisp",
  "Plain",
  "Sparse",
  "Hazy",
  "Damp"
];
const generatedNames = /* @__PURE__ */ new Set();
function generateUsername() {
  for (let guard = 0; guard < 80; guard++) {
    const roll = Math.random();
    let name;
    if (roll < 0.25) {
      const w1 = pick(GAMER_STYLE);
      const pool = Math.random() < 0.5 ? GAMER_STYLE : GAMER_SHORT;
      const w2 = pick(pool.filter((w) => w !== w1));
      name = `${w1}_${w2}`;
    } else if (roll < 0.45) {
      const adj = pick(ADJECTIVES);
      const w = pick(Math.random() < 0.5 ? GAMER_STYLE : [...GAMER_STYLE, ...GAMER_SHORT]);
      name = `${adj}_${w}`;
    } else if (roll < 0.6) {
      const w = pick([...GAMER_STYLE, ...GAMER_SHORT]);
      name = `${w}${randInt(10, 999)}`;
    } else if (roll < 0.72) {
      const w1 = pick(GAMER_STYLE);
      const w2 = pick(GAMER_SHORT.filter((w) => w !== w1));
      name = `${w1}_${w2}${randInt(10, 99)}`;
    } else if (roll < 0.82) {
      const w = pick(GAMER_SHORT);
      const s = pick(GAMER_SUFFIX);
      name = `${w}_${s}`;
    } else if (roll < 0.92) {
      const rname = pick(Math.random() < 0.5 ? REAL_NAME_MALE : REAL_NAME_FEMALE);
      const w = pick([...GAMER_STYLE, ...GAMER_SHORT]);
      name = `${rname}_${w}`;
    } else {
      const adj = pick(ADJECTIVES);
      const w = pick(GAMER_SHORT);
      name = `${adj}_${w}${randInt(10, 99)}`;
    }
    if (Math.random() < 0.6 && roll >= 0.45 && roll < 0.5) {
      name = name + randInt(10, 999);
    } else if (Math.random() < 0.6 && roll < 0.25) {
      name = name + randInt(10, 99);
    } else if (Math.random() < 0.6 && roll >= 0.82 && roll < 0.92) {
      name = name + randInt(10, 99);
    }
    if (!generatedNames.has(name.toLowerCase())) {
      generatedNames.add(name.toLowerCase());
      return name;
    }
  }
  const fallback = pick(GAMER_STYLE) + "_" + pick(GAMER_SHORT) + randInt(100, 999) + Date.now().toString(36).slice(-3);
  generatedNames.add(fallback.toLowerCase());
  return fallback;
}
function pickPersona(index) {
  if (index !== void 0 && index >= 0 && index < PERSONAS.length) {
    return { persona: PERSONAS[index], index };
  }
  const i = Math.floor(Math.random() * PERSONAS.length);
  return { persona: PERSONAS[i], index: i };
}
async function extractFeedItems(client, tabId) {
  const result = await client.evaluateV2(tabId, JS_REGISTER_FEED_CHIPS);
  const raw = result.result;
  if (!raw) return [];
  let data;
  if (typeof raw === "string") {
    try {
      data = JSON.parse(raw);
    } catch {
      return [];
    }
  } else if (Array.isArray(raw)) {
    data = raw;
  } else {
    return [];
  }
  return data.filter((t) => t && typeof t.name === "string" && typeof t.topicId === "string" && typeof t.x === "number" && typeof t.y === "number").map((t) => ({ text: t.name, topicId: t.topicId, x: t.x, y: t.y, w: t.w, h: t.h }));
}
async function feedChipCoord(client, tabId, topicId) {
  try {
    const result = await client.evaluateV2(tabId, JS_REGISTER_FEED_CHIP_COORD(topicId));
    const raw = result.result;
    if (!raw) return null;
    const d = typeof raw === "string" ? JSON.parse(raw) : raw;
    if (!d || typeof d.x !== "number") return null;
    return { x: d.x, y: d.y, w: d.w, h: d.h };
  } catch {
    return null;
  }
}
async function isUsernameTaken(client, tabId) {
  const result = await client.evaluateV2(tabId, `(function(){
    var errs=document.querySelectorAll('[class*="error"],[class*="Error"],faceplate-errors,[id*="error"]');
    for(var i=0;i<errs.length;i++){
      var text=errs[i].innerText||errs[i].textContent||"";
      if(text.match(/taken|unavailable|exists|already|tried/i))return text.trim();
    }
    return null;
  })()`);
  const raw = result.result;
  if (typeof raw === "string" && raw.length > 0) {
    console.log(`[register] username error: ${raw}`);
    return true;
  }
  return false;
}
async function isOnGenderPage(client, tabId) {
  const woman = await locateByJS(client, tabId, JS_REGISTER_GENDER_WOMAN);
  const man = await locateByJS(client, tabId, JS_REGISTER_GENDER_MAN);
  const skip = await locateByJS(client, tabId, JS_REGISTER_SKIP_BUTTON);
  return !!(woman || man || skip);
}
async function detectPage(client, tabId) {
  let titles = [];
  try {
    const result = await client.evaluateV2(tabId, JS_REGISTER_DETECT_PAGE_TITLE);
    const raw = result.result;
    if (typeof raw === "string") {
      try {
        titles = JSON.parse(raw);
      } catch {
        titles = [];
      }
    } else if (Array.isArray(raw)) {
      titles = raw;
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err ?? "unknown");
    console.log(`[register] detectPage title lookup failed: ${msg}`);
  }
  for (const t of titles) {
    if (t === "About you") {
      try {
        const monthInput = await locateByJS(client, tabId, JS_REGISTER_BIRTHDAY_MONTH_INPUT);
        if (monthInput) return { kind: "birthday", titles };
      } catch {
      }
      try {
        const labelsResult = await client.evaluateV2(tabId, JS_REGISTER_BIRTHDAY_LABELS);
        const labelsRaw = labelsResult.result;
        let labelsData;
        if (typeof labelsRaw === "string") {
          try {
            labelsData = JSON.parse(labelsRaw);
          } catch {
            labelsData = [];
          }
        } else if (Array.isArray(labelsRaw)) {
          labelsData = labelsRaw;
        } else {
          labelsData = [];
        }
        const labelTexts = labelsData.map((l) => (l.text || "").toUpperCase());
        const matchCount = ["MONTH", "DAY", "YEAR"].filter((k) => labelTexts.includes(k)).length;
        if (matchCount >= 2) return { kind: "birthday", titles };
      } catch {
      }
      return { kind: "gender", titles };
    }
    if (t.indexOf("Choose your interests") !== -1) return { kind: "interests", titles };
    if (t.indexOf("Customize your feed") !== -1) return { kind: "feed", titles };
  }
  try {
    const homeResult = await client.evaluateV2(tabId, `(function(){
      var url=location.href;
      var isHomeUrl=url==="https://www.reddit.com/"||url==="https://www.reddit.com"||url.startsWith("https://www.reddit.com/?");
      var btn=document.getElementById("expand-user-drawer-button");
      var loggedIn=btn?btn.getBoundingClientRect().width>0:false;
      return JSON.stringify({isHomeUrl:isHomeUrl, loggedIn:loggedIn});
    })()`);
    const raw = homeResult.result;
    const hd = typeof raw === "string" ? JSON.parse(raw) : raw;
    if (hd?.isHomeUrl && hd?.loggedIn) {
      return { kind: "home", titles };
    }
  } catch {
  }
  try {
    const monthInput = await locateByJS(client, tabId, JS_REGISTER_BIRTHDAY_MONTH_INPUT);
    if (monthInput) return { kind: "birthday", titles };
  } catch {
  }
  try {
    const labelsResult = await client.evaluateV2(tabId, JS_REGISTER_BIRTHDAY_LABELS);
    const labelsRaw = labelsResult.result;
    let labelsData;
    if (typeof labelsRaw === "string") {
      try {
        labelsData = JSON.parse(labelsRaw);
      } catch {
        labelsData = [];
      }
    } else if (Array.isArray(labelsRaw)) {
      labelsData = labelsRaw;
    } else {
      labelsData = [];
    }
    const labelTexts = labelsData.map((l) => (l.text || "").toUpperCase());
    const matchCount = ["MONTH", "DAY", "YEAR"].filter((k) => labelTexts.includes(k)).length;
    if (matchCount >= 2) return { kind: "birthday", titles };
  } catch {
  }
  try {
    const genderVisible = await isOnGenderPage(client, tabId);
    if (genderVisible) return { kind: "gender", titles };
  } catch {
  }
  try {
    const interestsTitle = await locateByJS(client, tabId, JS_REGISTER_INTERESTS_TITLE);
    if (interestsTitle) return { kind: "interests", titles };
  } catch {
  }
  try {
    const feedTitle = await locateByJS(client, tabId, JS_REGISTER_FEED_TITLE);
    if (feedTitle) return { kind: "feed", titles };
  } catch {
  }
  return { kind: "unknown", titles };
}
async function stepNavigateToRegister(client, instanceId, entryMode = "search", engine = "auto") {
  if (entryMode === "direct") {
    console.log("[register] step 2: navigating directly to register page...");
    const tab = await client.instanceTabsOpen(instanceId, "https://www.reddit.com/register/");
    const tabId2 = tab.tabId;
    if (!tabId2) {
      throw { error: "Failed to open tab to register page \u2014 instanceTabsOpen returned no tabId" };
    }
    console.log(`[register] opened tab ${tabId2} to register page`);
    await humanPause(2e3, 4e3);
    await waitForRegisterEmailInput(client, tabId2);
    console.log("[register] register page loaded");
    await pageWarmUp(client, tabId2);
    return tabId2;
  }
  console.log(`[register] step 2: entering reddit via search (engine=${engine})...`);
  const entered = await enterRedditViaSearch(client, instanceId, { engine });
  console.log(`[register] entered reddit via ${entered.engine}: ${entered.entryUrl}${entered.entryDesc ? " (" + entered.entryDesc + ")" : ""}`);
  const tabId = entered.tabId;
  await stepEnterRegister(client, tabId);
  console.log("[register] register page loaded");
  await pageWarmUp(client, tabId);
  return tabId;
}
async function waitForRegisterEmailInput(client, tabId) {
  for (let attempt = 0; attempt < 12; attempt++) {
    const el = await locateByJS(client, tabId, JS_REGISTER_EMAIL_INPUT);
    if (el) {
      if (attempt > 0) {
        console.log(`[register] register page appeared after ${attempt + 1} attempts`);
      }
      return;
    }
    const delay = Math.min(1500 * Math.pow(1.3, attempt), 8e3);
    const jitter = delay * (0.7 + Math.random() * 0.6);
    console.log(`[register] waiting for register page... (attempt ${attempt + 1}/12, next in ${Math.round(jitter)}ms)`);
    await new Promise((r) => setTimeout(r, jitter));
  }
  const finalCheck = await locateByJS(client, tabId, JS_REGISTER_EMAIL_INPUT);
  if (!finalCheck) {
    throw new Error("register page email input did not appear within timeout");
  }
}
async function humanTypeBatched(client, tabId, text) {
  let i = 0;
  while (i < text.length) {
    const size = 3 + Math.floor(Math.random() * 2);
    await client.humanKeyboardType(tabId, { text: text.slice(i, i + size) });
    i += size;
    if (i < text.length) await humanPause(300, 800);
  }
}
const DIGIT_NEIGHBORS = {
  "1": ["2"],
  "2": ["1", "3"],
  "3": ["2", "4"],
  "4": ["3", "5"],
  "5": ["4", "6"],
  "6": ["5", "7"],
  "7": ["6", "8"],
  "8": ["7", "9"],
  "9": ["8", "0"],
  "0": ["9"]
};
async function humanTypeCodeWithTypo(client, tabId, code, inputLoc, typoProbability = 0.3) {
  const wantTypo = Math.random() < typoProbability;
  const digitIdxs = [];
  for (let i = 0; i < code.length; i++) {
    if (DIGIT_NEIGHBORS[code[i]]) digitIdxs.push(i);
  }
  const typoIdx = wantTypo && digitIdxs.length > 0 ? digitIdxs[Math.floor(Math.random() * digitIdxs.length)] : -1;
  for (let i = 0; i < code.length; i++) {
    let ch = code[i];
    if (i === typoIdx) {
      const nbrs = DIGIT_NEIGHBORS[ch];
      ch = nbrs[Math.floor(Math.random() * nbrs.length)];
      console.log(`[register] mistyping code digit ${i + 1} ("${code[i]}" \u2192 "${ch}") to correct later`);
    }
    await client.humanKeyboardType(tabId, { text: ch });
    await humanPause(120, 280);
  }
  if (typoIdx < 0) return;
  await blurNearInput(client, tabId, inputLoc);
  await humanPause(1200, 2800);
  await humanClickElement(client, tabId, inputLoc);
  await humanPause(200, 500);
  await client.humanKeyboardCombo(tabId, { modifiers: [], key: "End" });
  await humanPause(120, 260);
  const movesLeft = code.length - 1 - typoIdx;
  for (let m = 0; m < movesLeft; m++) {
    await client.humanKeyboardPress(tabId, { key: "ArrowLeft" });
    await humanPause(70, 160);
  }
  await humanPause(150, 350);
  await client.humanKeyboardPress(tabId, { key: "Backspace" });
  await humanPause(150, 350);
  await client.humanKeyboardType(tabId, { text: code[typoIdx] });
  console.log(`[register] corrected code digit ${typoIdx + 1} back to "${code[typoIdx]}"`);
  await humanPause(300, 700);
}
async function blurNearInput(client, tabId, inputLoc) {
  const cx = Math.round(inputLoc.x);
  const cy = Math.round(inputLoc.y);
  const candidates = [];
  for (let k = 0; k < 6; k++) {
    candidates.push({
      x: cx + Math.round((Math.random() - 0.5) * 40),
      y: cy + Math.round(inputLoc.h / 2) + 15 + Math.round(Math.random() * 35)
      // below
    });
    candidates.push({
      x: cx + Math.round(inputLoc.w / 2) + 15 + Math.round(Math.random() * 35),
      // right
      y: cy + Math.round((Math.random() - 0.5) * 40)
    });
  }
  let blank = null;
  try {
    const res = await client.evaluateV2(tabId, `(function(){
      var pts=${JSON.stringify(candidates)};
      for(var i=0;i<pts.length;i++){
        var el=document.elementFromPoint(pts[i].x,pts[i].y);
        var tag=el?el.tagName:"";
        if(!el||/^(DIV|SPAN|P|SECTION|MAIN|ARTICLE|UL|LI|FORM|LABEL)$/.test(tag)){
          return JSON.stringify(pts[i]);
        }
      }
      return null;
    })()`);
    const raw = res.result;
    if (raw) blank = typeof raw === "string" ? JSON.parse(raw) : raw;
  } catch {
  }
  if (!blank) {
    blank = { x: cx + 30, y: cy + Math.round(inputLoc.h / 2) + 25 };
  }
  await client.humanMouseClick(tabId, blank);
  await humanPause(150, 400);
  await client.humanMouseMove(tabId, {
    x: blank.x + Math.round((Math.random() - 0.5) * 60),
    y: blank.y + Math.round((Math.random() - 0.5) * 40)
  });
}
async function stepInputEmail(client, tabId, email) {
  await ensureTabFocus(client, tabId);
  console.log(`[register] step 3: inputting email ${email}`);
  let emailInput = await locateAndScrollByJS(client, tabId, JS_REGISTER_EMAIL_INPUT);
  if (!emailInput) {
    throw new Error("could not locate email input");
  }
  await humanClickElement(client, tabId, emailInput);
  await humanPause(300, 600);
  await humanTypeBatched(client, tabId, email);
  await humanPause(300, 700);
  await blurNearInput(client, tabId, emailInput);
  const continueBtn = await locateAndScrollByJS(client, tabId, JS_REGISTER_CONTINUE_BUTTON);
  if (!continueBtn) {
    throw new Error("could not locate Continue button after email input");
  }
  console.log(`[register] clicking Continue (email step)...`);
  await hoverWithHesitation(client, tabId, continueBtn);
  await humanPause(2e3, 4e3);
}
async function stepWaitForVerificationCode(client, tabId) {
  console.log("[register] step 4: waiting for verification code page...");
  for (let attempt = 0; attempt < 10; attempt++) {
    const codeInput = await locateByJS(client, tabId, JS_REGISTER_VERIFY_CODE_INPUT);
    if (codeInput) {
      console.log("[register] verification code input found");
      return;
    }
    console.log(`[register] code input not yet visible, waiting... (attempt ${attempt + 1}/10)`);
    await humanPause(1500, 3e3);
  }
  throw new Error("verification code page did not appear within timeout");
}
function extractRedditCode(html) {
  const m1 = html.match(/\b(\d{6})\b is your Reddit verification code/);
  if (m1) return m1[1];
  const m2 = html.match(/font-size:\s*32px[^>]*>\s*(\d{6})\s*</i);
  if (m2) return m2[1];
  const m3 = html.match(/(\d{6})[\s\S]{0,80}verification code/i);
  if (m3) return m3[1];
  const m4 = html.match(/verification code[\s\S]{0,80}(\d{6})/i);
  if (m4) return m4[1];
  const text = html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ");
  const m5 = text.match(/\b(\d{6})\b/);
  return m5 ? m5[1] : null;
}
async function stepGetVerificationCode(client, instanceId, fetchUrl, registerTabId) {
  console.log("[register] step 5: getting verification code from email...");
  const tab = await client.instanceTabsOpen(instanceId, fetchUrl);
  const fetchTabId = tab.tabId;
  console.log(`[register] opened fetch tab ${fetchTabId}`);
  const pollForCode = async (failReasonOut) => {
    const initialDelay = 3e3 + Math.random() * 5e3;
    console.log(`[register] waiting ${Math.round(initialDelay / 1e3)}s for email to arrive...`);
    await new Promise((r) => setTimeout(r, initialDelay));
    const MAX_RELOADS = 5;
    let reloads = 0;
    const totalAttemt = 90;
    for (let attempt = 0; attempt < totalAttemt; attempt++) {
      if (attempt > 0) {
        await new Promise((r) => setTimeout(r, 1e3));
      }
      try {
        const result = await client.evaluateV2(fetchTabId, `(function(){
          // verification code body \u2014 b2u.me \u6539\u7248\u540E\u90AE\u4EF6\u6B63\u6587\u88C5\u5728 same-origin iframe \u91CC
          // \uFF08\u4E3B\u6587\u6863 #msg2 \u4E3A\u7A7A\uFF09\uFF0C\u6240\u4EE5\u540C\u65F6\u6536\u96C6 #msg2 \u548C\u6240\u6709\u53EF\u8BBF\u95EE iframe \u7684 body\u3002
          var parts=[];
          var msg2=document.getElementById("msg2");
          if(msg2){var t=msg2.innerText||msg2.textContent||""; if(t.trim())parts.push(t);}
          var ifs=document.querySelectorAll("iframe");
          for(var i=0;i<ifs.length;i++){
            try{
              var f=ifs[i];
              if(f.contentDocument&&f.contentDocument.body){
                var ft=f.contentDocument.body.innerText||f.contentDocument.body.textContent||"";
                if(ft.trim())parts.push(ft);
              }
            }catch(e){}
          }
          var body=parts.join("\\n");
          // failure state: #diverr visible + its reason text in #msg1
          var diverr=document.getElementById("diverr");
          var errVisible=diverr && diverr.style.display!=="none" && diverr.offsetParent!==null;
          var reason="";
          if(errVisible){var m1=document.getElementById("msg1");reason=m1?(m1.innerText||m1.textContent||"").trim():"";}
          return JSON.stringify({body:body,errVisible:!!errVisible,reason:reason});
        })()`);
        const raw = result.result;
        const data = typeof raw === "string" ? JSON.parse(raw) : raw;
        if (data?.body) {
          const c = extractRedditCode(data.body);
          if (c) {
            console.log(`[register] extracted verification code: ${c}`);
            return c;
          }
        }
        if (data?.errVisible) {
          failReasonOut.reason = data.reason || "unknown fetch error";
          if (reloads < MAX_RELOADS) {
            reloads++;
            console.log(`[register] email fetch failed ("${failReasonOut.reason}") \u2014 reloading fetch page (${reloads}/${MAX_RELOADS})...`);
            try {
              await client.reload(fetchTabId);
            } catch {
            }
            await new Promise((r) => setTimeout(r, 3e3 + Math.random() * 2e3));
            continue;
          }
          console.log(`[register] email fetch still failing after ${MAX_RELOADS} reloads ("${failReasonOut.reason}")`);
          return null;
        }
        if (attempt % 5 === 0) {
          console.log(`[register] waiting for email... (poll ${attempt + 1}/${totalAttemt})`);
        }
      } catch (err) {
        console.log(`[register] evaluate error: ${err.message}`);
      }
    }
    return null;
  };
  let code = null;
  const failReasonBox = { reason: null };
  try {
    code = await pollForCode(failReasonBox);
    if (!code) {
      console.log("[register] first code-fetch round failed \u2014 clicking Resend on the register tab...");
      try {
        await client.tabFocus(registerTabId);
      } catch {
      }
      await humanPause(800, 1500);
      const resendBtn = await locateByJS(client, registerTabId, JS_REGISTER_VERIFY_RESEND_BUTTON);
      if (resendBtn) {
        if (resendBtn.attrs?.disabled) {
          console.log("[register] Resend button is disabled (cooldown) \u2014 cannot resend, giving up");
        } else {
          await humanClickElement(client, registerTabId, resendBtn);
          console.log("[register] clicked Resend \u2014 switching back to inbox for a second round...");
          await humanPause(1500, 3e3);
          try {
            await client.tabFocus(fetchTabId);
          } catch {
          }
          await humanPause(1e3, 2e3);
          const failReasonBox2 = { reason: null };
          code = await pollForCode(failReasonBox2);
          if (!code) failReasonBox.reason = failReasonBox2.reason ?? failReasonBox.reason;
        }
      } else {
        console.log("[register] Resend button not found \u2014 cannot resend, giving up");
      }
    }
  } finally {
    if (code) {
      const roll = Math.random();
      let awayMs;
      if (roll < 0.6) {
        awayMs = 5e3 + Math.round(Math.random() * 5e3);
      } else if (roll < 0.85) {
        awayMs = 1e4 + Math.round(Math.random() * 2e4);
      } else {
        awayMs = 3e4 + Math.round(Math.random() * 3e4);
      }
      console.log(`[register] code read \u2014 lingering on inbox ${Math.round(awayMs / 1e3)}s to read it...`);
      await humanPause(awayMs, awayMs);
      console.log(`[register] switching back to register tab...`);
      try {
        await client.tabFocus(registerTabId);
      } catch {
      }
      await humanPause(500, 1500);
    }
    try {
      await client.tabClose(fetchTabId);
    } catch {
    }
  }
  if (!code) {
    throw new Error(
      failReasonBox.reason ? `email fetch failed: ${failReasonBox.reason}` : "could not find Reddit verification code within timeout"
    );
  }
  return code;
}
async function stepInputVerificationCode(client, tabId, code) {
  await ensureTabFocus(client, tabId);
  console.log(`[register] step 6: inputting verification code`);
  let codeInput = await locateAndScrollByJS(client, tabId, JS_REGISTER_VERIFY_CODE_INPUT);
  if (!codeInput) {
    throw new Error("could not locate verification code input");
  }
  await humanClickElement(client, tabId, codeInput);
  await humanPause(200, 500);
  let usedTypoTyper = false;
  if (Math.random() < 0.5) {
    console.log(`[register] typing verification code digit-by-digit`);
    await humanTypeCodeWithTypo(client, tabId, code, codeInput);
    usedTypoTyper = true;
  } else {
    console.log(`[register] pasting verification code`);
    try {
      await client.humanClipboardPaste(tabId, { text: code, triggerCtrlV: true });
    } catch (e) {
      console.log(`[register] paste failed (${e?.message ?? e}), falling back to typing`);
      await humanTypeCodeWithTypo(client, tabId, code, codeInput);
      usedTypoTyper = true;
    }
  }
  await humanPause(400, 800);
  if (!usedTypoTyper) {
    await blurNearInput(client, tabId, codeInput);
  }
  const continueBtn = await locateAndScrollByJS(client, tabId, JS_REGISTER_VERIFY_CONTINUE_BUTTON);
  if (!continueBtn) {
    throw new Error("could not locate Continue button after code input");
  }
  console.log(`[register] clicking Continue (verification step)...`);
  await hoverWithHesitation(client, tabId, continueBtn);
}
async function readCurrentUsername(client, tabId) {
  for (let t = 0; t < 4; t++) {
    try {
      const { username } = await readRegisterInputValues(client, tabId);
      return username || "";
    } catch (err) {
      if (t === 3) {
        console.log(`[register] read username failed after retries: ${err?.message ?? err}`);
        return "";
      }
      await humanPause(400, 800);
    }
  }
  return "";
}
async function clickSuggestUsername(client, tabId, times) {
  for (let i = 0; i < times; i++) {
    let btn = null;
    for (let t = 0; t < 4 && !btn; t++) {
      try {
        btn = await locateByJS(client, tabId, JS_REGISTER_USERNAME_SUGGEST_BUTTON);
      } catch (err) {
        if (t === 3) {
          console.log(`[register] suggest button lookup failed after retries, keeping current name: ${err?.message ?? err}`);
        } else {
          await humanPause(400, 800);
        }
      }
    }
    if (!btn) break;
    await humanClickElement(client, tabId, btn);
    await humanPause(400, 900);
  }
  return await readCurrentUsername(client, tabId) || "";
}
async function editUsernameSuffixChars(client, tabId) {
  await client.humanKeyboardCombo(tabId, { modifiers: [], key: "End" });
  await humanPause(150, 350);
  const delCount = 1 + Math.floor(Math.random() * 2);
  for (let i = 0; i < delCount; i++) {
    await client.humanKeyboardPress(tabId, { key: "Backspace" });
    await humanPause(80, 200);
  }
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  const addCount = 1 + Math.floor(Math.random() * 2);
  let suffix = "";
  for (let i = 0; i < addCount; i++) suffix += chars[Math.floor(Math.random() * chars.length)];
  await humanType(client, tabId, suffix);
  await humanPause(300, 700);
  const { username } = await readRegisterInputValues(client, tabId);
  return username;
}
async function populateUsernameField(client, tabId, personaUsername) {
  const roll = Math.random();
  if (roll < 0.3) {
    return typePersonaUsername(client, tabId, personaUsername);
  }
  if (roll < 0.4) {
    const prefill = await readCurrentUsername(client, tabId);
    if (prefill) {
      console.log(`[register] using pre-filled suggested username as-is: ${prefill}`);
      return prefill;
    }
    const suggested2 = await clickSuggestUsername(client, tabId, 1);
    console.log(`[register] using suggested username as-is: ${suggested2}`);
    return suggested2;
  }
  const times = 1 + Math.floor(Math.random() * 3);
  const suggested = await clickSuggestUsername(client, tabId, times);
  if (Math.random() < 0.5) {
    const edited = await editUsernameSuffixChars(client, tabId);
    console.log(`[register] using suggested username, edited to: ${edited}`);
    return edited;
  }
  console.log(`[register] using suggested username as-is: ${suggested}`);
  return suggested;
}
async function typePersonaUsername(client, tabId, personaUsername) {
  await clearRegisterNameInputFocusedText(client, tabId);
  console.log(`[register] typing username: ${personaUsername}`);
  await humanTypeBatched(client, tabId, personaUsername);
  await humanPause(400, 800);
  return personaUsername;
}
async function passwordIsVisible(client, tabId) {
  try {
    const r = await client.evaluateV2(tabId, JS_REGISTER_PASSWORD_TYPE);
    return (r?.result ?? r) === "text";
  } catch {
    return false;
  }
}
async function setPasswordVisible(client, tabId, wantVisible) {
  for (let i = 0; i < 2; i++) {
    const visible = await passwordIsVisible(client, tabId);
    if (visible === wantVisible) return;
    const btn = await locateByJS(client, tabId, JS_REGISTER_PASSWORD_TOGGLE);
    if (!btn) return;
    await humanClickElement(client, tabId, btn);
    await humanPause(300, 600);
  }
}
async function editPasswordOneChar(client, tabId) {
  await client.humanKeyboardCombo(tabId, { modifiers: [], key: "End" });
  await humanPause(150, 350);
  await client.humanKeyboardPress(tabId, { key: "Backspace" });
  await humanPause(80, 200);
  const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  await humanType(client, tabId, chars[Math.floor(Math.random() * chars.length)]);
  await humanPause(300, 700);
}
async function typePasswordWithVisibility(client, tabId, password) {
  const startShown = Math.random() < 0.4;
  if (startShown) {
    await setPasswordVisible(client, tabId, true);
    await humanPause(300, 700);
  }
  await humanTypeBatched(client, tabId, password);
  await humanPause(500, 1e3);
  if (!startShown && Math.random() < 0.4) {
    await setPasswordVisible(client, tabId, true);
    await humanPause(900, 1600);
  }
  const visible = await passwordIsVisible(client, tabId);
  if (visible && Math.random() < 0.3) {
    console.log("[register] editing one password char while shown");
    await editPasswordOneChar(client, tabId);
  }
  if (visible && Math.random() < 0.15) {
    await setPasswordVisible(client, tabId, false);
    await humanPause(300, 600);
  }
}
async function stepUsernamePassword(client, tabId, initialUsername, password) {
  await ensureTabFocus(client, tabId);
  console.log(`[register] step 7: username/password (initial: ${initialUsername})`);
  await waitForElement(client, tabId, JS_REGISTER_USERNAME_INPUT, "username input");
  await pageWarmUp(client, tabId);
  let username = initialUsername;
  for (let attempt = 0; attempt < 5; attempt++) {
    if (attempt > 0) {
      await humanPause(1e3, 2e3);
    }
    let usernameInput = await locateAndScrollByJS(client, tabId, JS_REGISTER_USERNAME_INPUT);
    if (!usernameInput) {
      throw new Error(`could not locate username input (attempt ${attempt + 1})`);
    }
    await humanClickElement(client, tabId, usernameInput);
    await humanPause(300, 500);
    username = await populateUsernameField(client, tabId, username);
    await blurNearInput(client, tabId, usernameInput);
    await humanPause(1e3, 2500);
    const takenEarly = await isUsernameTaken(client, tabId);
    if (takenEarly) {
      const newUsername = generateUsername();
      console.log(`[register] username "${username}" unavailable, retrying with "${newUsername}"`);
      username = newUsername;
      continue;
    }
    let passwordInput = await locateByJS(client, tabId, JS_REGISTER_PASSWORD_INPUT);
    if (!passwordInput) {
      throw new Error(`could not locate password input (attempt ${attempt + 1})`);
    }
    await humanClickElement(client, tabId, passwordInput);
    await humanPause(200, 400);
    await clearRegisterPasswordInputFocusedText(client, tabId);
    await typePasswordWithVisibility(client, tabId, password);
    await humanPause(400, 900);
    const actualValues = await readRegisterInputValues(client, tabId);
    const actualUsername = actualValues.username;
    const actualPassword = actualValues.password;
    if (actualUsername !== username) {
      console.warn(`[register] WARNING: username mismatch! generated="${username}" actual="${actualUsername}"`);
    }
    if (actualPassword !== password) {
      console.warn(`[register] WARNING: password mismatch! generated="${password}" actual="${actualPassword}"`);
    }
    console.log(`[register] input verification \u2014 username match: ${actualUsername === username}, password match: ${actualPassword === password}`);
    await blurNearInput(client, tabId, passwordInput);
    try {
      console.log("[register] switching tabs briefly before Continue...");
      await simulateTabSwitch(client, tabId);
    } catch {
    }
    let continueBtn = await locateAndScrollByJS(client, tabId, JS_REGISTER_USERNAME_CONTINUE_BUTTON);
    if (!continueBtn) {
      throw new Error(`could not locate Continue button (attempt ${attempt + 1})`);
    }
    if (continueBtn.attrs?.disabled) {
      console.log(`[register] Continue button is disabled, waiting for it to become enabled...`);
      for (let di = 0; di < 3; di++) {
        await humanPause(2e3, 3e3);
        continueBtn = await locateAndScrollByJS(client, tabId, JS_REGISTER_USERNAME_CONTINUE_BUTTON);
        if (continueBtn && !continueBtn.attrs?.disabled) break;
        console.log(`[register] Continue still disabled (${di + 1}/10)...`);
      }
      if (!continueBtn || continueBtn.attrs?.disabled) {
        console.log(`[register] Continue button stayed disabled, retrying with new username...`);
        username = generateUsername();
        continue;
      }
    }
    console.log(`[register] clicking Continue (username/password step)...`);
    await hoverWithHesitation(client, tabId, continueBtn);
    let advanced = false;
    for (let ga = 0; ga < 10; ga++) {
      if (ga > 0) await new Promise((r) => setTimeout(r, Math.min(2e3 * Math.pow(1.2, ga), 8e3)));
      try {
        const page = await detectPage(client, tabId);
        if (page.kind !== "unknown" && page.kind !== "home") {
          advanced = true;
          console.log(`[register] advanced to page "${page.kind}" after username/password`);
          break;
        }
        if (page.kind === "home") {
          advanced = true;
          console.log(`[register] already on logged-in home after username/password`);
          break;
        }
        const onGender = await isOnGenderPage(client, tabId);
        if (onGender) {
          advanced = true;
          break;
        }
      } catch {
      }
    }
    if (advanced) {
      console.log(`[register] username "${username}" accepted`);
      return { username, actualUsername, actualPassword };
    }
    const taken = await isUsernameTaken(client, tabId);
    if (taken) {
      const newUsername = generateUsername();
      console.log(`[register] username "${username}" taken, retrying with "${newUsername}"`);
      username = newUsername;
      continue;
    }
    try {
      const page = await detectPage(client, tabId);
      const btn = await locateByJS(client, tabId, JS_REGISTER_USERNAME_CONTINUE_BUTTON);
      console.log(`[register] unclear result \u2014 page kind="${page.kind}", titles=${JSON.stringify(page.titles)}, continueDisabled=${!!btn?.attrs?.disabled}`);
    } catch {
    }
    console.log(`[register] unclear result, retrying with new username...`);
    username = generateUsername();
  }
  throw new Error(`failed to set username after 5 attempts (last tried: "${username}")`);
}
function randomAdultBirthday() {
  const curYear = (/* @__PURE__ */ new Date()).getFullYear();
  const year = curYear - (18 + Math.floor(Math.random() * 45));
  const month = 1 + Math.floor(Math.random() * 12);
  const day = 1 + Math.floor(Math.random() * 28);
  const mm = String(month), dd = String(day), yyyy = String(year);
  return { month: mm, day: dd, year: yyyy, iso: `${yyyy}-${mm.padStart(2, "0")}-${dd.padStart(2, "0")}` };
}
async function fillBirthday(client, tabId, bday) {
  const month = await locateAndScrollByJS(client, tabId, JS_REGISTER_BIRTHDAY_MONTH_INPUT);
  const day = await locateAndScrollByJS(client, tabId, JS_REGISTER_BIRTHDAY_DAY_INPUT);
  const year = await locateAndScrollByJS(client, tabId, JS_REGISTER_BIRTHDAY_YEAR_INPUT);
  if (!month || !day || !year) return false;
  await humanClickElement(client, tabId, month);
  await humanPause(200, 400);
  await humanType(client, tabId, bday.month);
  await humanPause(250, 550);
  await humanClickElement(client, tabId, day);
  await humanPause(200, 400);
  await humanType(client, tabId, bday.day);
  await humanPause(250, 550);
  await humanClickElement(client, tabId, year);
  await humanPause(200, 400);
  await humanType(client, tabId, bday.year);
  await humanPause(700, 1200);
  const cont = await locateAndScrollByJS(client, tabId, JS_REGISTER_CONTINUE_BUTTON);
  if (cont) {
    await hoverWithHesitation(client, tabId, cont);
    await humanPause(1e3, 2e3);
  }
  for (let i = 0; i < 8; i++) {
    const yes = await locateAndScrollByJS(client, tabId, JS_REGISTER_CONFIRM_BIRTHDAY_YES_BUTTON);
    if (yes) {
      await hoverWithHesitation(client, tabId, yes);
      return true;
    }
    await humanPause(700, 1200);
  }
  return false;
}
async function stepBirthday(client, tabId) {
  await ensureTabFocus(client, tabId);
  console.log("[register] step 8: checking for birthday popup...");
  let monthInput = null;
  let birthdayLabelsDetected = false;
  for (let attempt = 0; attempt < 4; attempt++) {
    try {
      monthInput = await locateByJS(client, tabId, JS_REGISTER_BIRTHDAY_MONTH_INPUT);
      if (monthInput) break;
    } catch (err) {
      console.log(`[register] locateByJS for MonthInput failed (attempt ${attempt + 1}): ${err.message}`);
    }
    if (!monthInput) {
      try {
        const labelsResult = await client.evaluateV2(tabId, JS_REGISTER_BIRTHDAY_LABELS);
        const labelsRaw = labelsResult.result;
        let labelsData;
        if (typeof labelsRaw === "string") {
          try {
            labelsData = JSON.parse(labelsRaw);
          } catch {
            labelsData = [];
          }
        } else if (Array.isArray(labelsRaw)) {
          labelsData = labelsRaw;
        } else {
          labelsData = [];
        }
        const labelTexts = labelsData.map((l) => (l.text || "").toUpperCase());
        const matchCount = ["MONTH", "DAY", "YEAR"].filter((k) => labelTexts.includes(k)).length;
        if (matchCount >= 2) {
          birthdayLabelsDetected = true;
          console.log(`[register] birthday labels detected (Month/Day/Year): ${labelTexts.join(", ")}`);
          break;
        }
      } catch {
      }
    }
    await humanPause(800, 1500);
  }
  if (!monthInput && !birthdayLabelsDetected) {
    try {
      const diagResult = await client.evaluateV2(tabId, `(function(){
        var h1s=document.querySelectorAll('h1');
        var titles=[];
        for(var i=0;i<h1s.length;i++){
          var r=h1s[i].getBoundingClientRect();
          if(r.width>0)titles.push(h1s[i].innerText.trim());
        }
        var btns=document.querySelectorAll('button');
        var btnTexts=[];
        for(var j=0;j<btns.length;j++){
          var br=btns[j].getBoundingClientRect();
          if(br.width>0)btnTexts.push(btns[j].innerText.trim());
        }
        return JSON.stringify({titles:titles,buttons:btnTexts.slice(0,10),url:location.href});
      })()`);
      const diagData = typeof diagResult.result === "string" ? JSON.parse(diagResult.result) : diagResult.result;
      console.log(`[register] page diagnostic \u2014 titles: ${JSON.stringify(diagData?.titles)}, buttons: ${JSON.stringify(diagData?.buttons)}, url: ${diagData?.url}`);
    } catch (err) {
      console.log(`[register] diagnostic evaluateV2 failed: ${err.message}`);
    }
    console.log("[register] no birthday popup found, skipping step 8");
    return { shown: false, skipped: false };
  }
  if (Math.random() < 0.5) {
    const bday = randomAdultBirthday();
    console.log(`[register] filling birthday ${bday.iso}...`);
    const filled = await fillBirthday(client, tabId, bday);
    if (filled) {
      console.log("[register] birthday filled and confirmed");
      return { shown: true, skipped: false, birthday: bday.iso };
    }
    console.log("[register] birthday fill failed \u2014 falling back to Skip");
  }
  let skipBtn = null;
  try {
    skipBtn = await locateByJS(client, tabId, JS_REGISTER_BIRTHDAY_SKIP_BUTTON);
  } catch (err) {
    console.log(`[register] locateByJS for birthday Skip failed: ${err.message}`);
  }
  if (!skipBtn) {
    console.log("[register] birthday inputs found but no Skip button, leaving step 8 without clicking");
    return { shown: true, skipped: false };
  }
  await pageWarmUp(client, tabId);
  console.log("[register] skipping birthday popup...");
  await humanizedBirthdaySkipPrep(client, tabId);
  await hoverWithHesitation(client, tabId, skipBtn);
  return { shown: true, skipped: true };
}
async function humanizedGenderSkipPrep(client, tabId) {
  if (Math.random() < 0.5) {
    for (const js of [JS_REGISTER_GENDER_WOMAN, JS_REGISTER_GENDER_MAN, JS_REGISTER_GENDER_NON_BINARY]) {
      try {
        const loc = await locateByJS(client, tabId, js);
        if (loc) {
          await humanMouseMove(client, tabId, loc.x, loc.y);
          await humanPause(300, 700);
        }
      } catch {
      }
    }
  } else {
    await humanPause(1500, 3e3);
  }
}
async function humanizedBirthdaySkipPrep(client, tabId) {
  const fields = [JS_REGISTER_BIRTHDAY_MONTH_INPUT, JS_REGISTER_BIRTHDAY_DAY_INPUT, JS_REGISTER_BIRTHDAY_YEAR_INPUT];
  if (Math.random() < 0.5) {
    for (const js of fields) {
      const loc = await locateByJS(client, tabId, js);
      if (!loc) continue;
      await humanClickElement(client, tabId, loc);
      await humanPause(150, 350);
      const n = 1 + Math.floor(Math.random() * 2);
      let digits = "";
      for (let i = 0; i < n; i++) digits += String(Math.floor(Math.random() * 10));
      await humanType(client, tabId, digits);
      await humanPause(300, 700);
    }
    for (const js of fields) {
      const loc = await locateByJS(client, tabId, js);
      if (!loc) continue;
      await humanClickElement(client, tabId, loc);
      await humanPause(100, 250);
      try {
        await client.humanKeyboardCombo(tabId, { modifiers: [], key: "End" });
      } catch {
      }
      for (let i = 0; i < 2; i++) {
        try {
          await client.humanKeyboardPress(tabId, { key: "Backspace" });
        } catch {
        }
        await humanPause(60, 160);
      }
    }
  } else {
    await humanPause(1500, 3e3);
  }
}
async function stepGenderSelection(client, tabId, gender) {
  await ensureTabFocus(client, tabId);
  console.log(`[register] step 9: gender selection (${gender})`);
  await humanPause(500, 1e3);
  await pageWarmUp(client, tabId);
  if (gender !== "skip" && Math.random() < 0.5) {
    const skipBtn = await locateAndScrollByJS(client, tabId, JS_REGISTER_SKIP_BUTTON);
    if (skipBtn) {
      console.log("[register] randomly skipping gender");
      await humanizedGenderSkipPrep(client, tabId);
      await hoverWithHesitation(client, tabId, skipBtn);
      return "skipped";
    }
    console.log("[register] wanted to skip gender but no Skip button \u2014 selecting instead");
  }
  let genderLabel;
  let jsExpr;
  switch (gender) {
    case "woman":
      jsExpr = JS_REGISTER_GENDER_WOMAN;
      genderLabel = "Woman";
      break;
    case "man":
      jsExpr = JS_REGISTER_GENDER_MAN;
      genderLabel = "Man";
      break;
    case "non_binary":
      jsExpr = JS_REGISTER_GENDER_NON_BINARY;
      genderLabel = "Non-binary";
      break;
    case "prefer_not_say":
      jsExpr = JS_REGISTER_GENDER_PREFER_NOT_SAY;
      genderLabel = "I prefer not to say";
      break;
    case "skip":
    default:
      jsExpr = JS_REGISTER_SKIP_BUTTON;
      genderLabel = "Skip";
      break;
  }
  let genderBtn = await locateAndScrollByJS(client, tabId, jsExpr);
  if (!genderBtn && (gender === "non_binary" || gender === "prefer_not_say")) {
    const fallback = Math.random() < 0.5 ? "man" : "woman";
    const fallbackLabel = fallback === "man" ? "Man" : "Woman";
    const fallbackExpr = fallback === "man" ? JS_REGISTER_GENDER_MAN : JS_REGISTER_GENDER_WOMAN;
    console.log(`[register] gender "${genderLabel}" not found, falling back to ${fallbackLabel}`);
    genderLabel = fallbackLabel;
    genderBtn = await locateAndScrollByJS(client, tabId, fallbackExpr);
  }
  if (!genderBtn) {
    console.log(`[register] gender button "${genderLabel}" not found, trying Skip...`);
    const skipBtn = await locateAndScrollByJS(client, tabId, JS_REGISTER_SKIP_BUTTON);
    if (!skipBtn) {
      console.log("[register] no gender button or Skip found, skipping step 9");
      return "skipped";
    }
    await hoverWithHesitation(client, tabId, skipBtn);
    genderLabel = "Skip";
  } else {
    console.log(`[register] selecting gender: ${genderLabel}`);
    await hoverWithHesitation(client, tabId, genderBtn);
  }
  return genderLabel;
}
async function stepInterestSelection(client, tabId, interests) {
  await ensureTabFocus(client, tabId);
  console.log(`[register] step 10: selecting interests: ${interests.join(", ")}`);
  await waitForElement(client, tabId, JS_REGISTER_INTEREST_CONTINUE_BUTTON, "interest page");
  await pageWarmUp(client, tabId);
  const selected = [];
  for (const interest of interests) {
    const interestJs = JS_REGISTER_INTEREST(interest);
    const el = await locateAndScrollByJS(client, tabId, interestJs);
    if (!el) {
      console.log(`[register] interest "${interest}" not found on page, skipping`);
      continue;
    }
    console.log(`[register] selecting interest: ${interest}`);
    await humanClickElement(client, tabId, el);
    selected.push(interest);
    await humanPause(400, 1e3);
  }
  if (selected.length === 0) {
    console.log("[register] no interests matched, proceeding without selection");
  }
  const continueBtn = await locateAndScrollByJS(client, tabId, JS_REGISTER_INTEREST_CONTINUE_BUTTON);
  if (!continueBtn) {
    console.log("[register] Continue button not found on interest page, skipping click");
  } else {
    console.log(`[register] clicking Continue (interest step)...`);
    await hoverWithHesitation(client, tabId, continueBtn);
  }
  return selected;
}
function findNeighbor(items, target, dir) {
  const tcx = target.x + target.w / 2;
  const tcy = target.y + target.h / 2;
  let best = null;
  let bestScore = Infinity;
  for (const it of items) {
    if (it.x === target.x && it.y === target.y && it.text === target.text) continue;
    const icx = it.x + it.w / 2;
    const icy = it.y + it.h / 2;
    const dx = icx - tcx;
    const dy = icy - tcy;
    let primaryGap;
    let crossDist;
    if (dir === "up") {
      if (dy > -target.h * 0.5) continue;
      primaryGap = -dy;
      crossDist = Math.abs(dx);
    } else if (dir === "down") {
      if (dy < target.h * 0.5) continue;
      primaryGap = dy;
      crossDist = Math.abs(dx);
    } else if (dir === "left") {
      if (dx > -target.w * 0.5) continue;
      primaryGap = -dx;
      crossDist = Math.abs(dy);
    } else {
      if (dx < target.w * 0.5) continue;
      primaryGap = dx;
      crossDist = Math.abs(dy);
    }
    const score = primaryGap + crossDist * 2;
    if (score < bestScore) {
      bestScore = score;
      best = it;
    }
  }
  return best;
}
async function clickFeedItemWithMisclick(client, tabId, items, target) {
  if (Math.random() < 0.3) {
    const dirs = ["up", "down", "left", "right"];
    const neighbor = findNeighbor(items, target, dirs[Math.floor(Math.random() * 4)]);
    if (neighbor) {
      console.log(`[register] mis-clicked neighbor "${neighbor.text}" near "${target.text}", correcting...`);
      const n1 = await feedChipCoord(client, tabId, neighbor.topicId) ?? { x: neighbor.x, y: neighbor.y, w: neighbor.w, h: neighbor.h };
      await humanClickElement(client, tabId, n1);
      await humanPause(500, 1400);
      const n2 = await feedChipCoord(client, tabId, neighbor.topicId) ?? n1;
      await humanClickElement(client, tabId, n2);
      await humanPause(300, 800);
    }
  }
  const tc = await feedChipCoord(client, tabId, target.topicId) ?? { x: target.x, y: target.y, w: target.w, h: target.h };
  await humanClickElement(client, tabId, tc);
  await humanPause(400, 1e3);
}
async function stepFeedCustomization(client, tabId) {
  await ensureTabFocus(client, tabId);
  console.log("[register] step 11: feed customization \u2014 picking feed items...");
  await waitForElement(client, tabId, JS_REGISTER_TOPIC_CONTINUE_BUTTON, "feed customization page");
  await pageWarmUp(client, tabId);
  const allFeedItems = await extractFeedItems(client, tabId);
  console.log(`[register] extracted ${allFeedItems.length} feed items from page`);
  if (allFeedItems.length === 0) {
    console.log("[register] no feed items found, skipping feed customization step");
    return [];
  }
  const pickCount = Math.min(1 + Math.floor(Math.random() * 10), allFeedItems.length);
  const shuffled = [...allFeedItems].sort(() => Math.random() - 0.5);
  const pickedIds = new Set(shuffled.slice(0, pickCount).map((p) => p.topicId));
  console.log(`[register] will pick ${pickCount} feed items: ${shuffled.slice(0, pickCount).map((t) => t.text).join(", ")}`);
  const readingOrder = [...allFeedItems].sort((a, b) => {
    const ra = Math.floor(a.y / 50), rb = Math.floor(b.y / 50);
    if (ra !== rb) return ra - rb;
    return a.x - b.x;
  });
  const selected = [];
  for (const it of readingOrder) {
    const c = await feedChipCoord(client, tabId, it.topicId) ?? it;
    await humanMouseMove(client, tabId, c.x, c.y);
    if (pickedIds.has(it.topicId)) {
      await clickFeedItemWithMisclick(client, tabId, allFeedItems, it);
      selected.push(it.text);
    } else {
      await humanPause(120, 380);
    }
  }
  return selected;
}
async function stepFeedCustomizationContinue(client, tabId) {
  await ensureTabFocus(client, tabId);
  console.log("[register] step 12: clicking feed customization Continue...");
  await humanPause(500, 1e3);
  const continueBtn = await locateAndScrollByJS(client, tabId, JS_REGISTER_TOPIC_CONTINUE_BUTTON);
  if (!continueBtn) {
    const fallback = await locateAndScrollByJS(client, tabId, JS_REGISTER_INTEREST_CONTINUE_BUTTON);
    if (!fallback) {
      console.log("[register] Continue button not found on feed customization page, skipping step 12");
      return;
    }
    await hoverWithHesitation(client, tabId, fallback);
  } else {
    await hoverWithHesitation(client, tabId, continueBtn);
  }
}
async function stepVerifySuccess(client, tabId) {
  console.log("[register] step 13: verifying registration success...");
  for (let attempt = 0; attempt < 15; attempt++) {
    const result = await client.evaluateV2(tabId, `(function(){
      var url=location.href;
      var isHome=url==="https://www.reddit.com/"||url==="https://www.reddit.com"||url.startsWith("https://www.reddit.com/?");
      var btn=document.getElementById("expand-user-drawer-button");
      var loggedIn=btn?btn.getBoundingClientRect().width>0:false;
      return {url:url,isHome:isHome,loggedIn:loggedIn};
    })()`);
    const raw = result.result;
    let data;
    if (typeof raw === "string") {
      try {
        data = JSON.parse(raw);
      } catch {
        data = raw;
      }
    } else {
      data = raw;
    }
    const success = !!(data?.isHome && data?.loggedIn);
    if (success) {
      console.log(`[register] registration appears successful \u2014 logged in on home page (url: ${data?.url || "unknown"})`);
      return true;
    }
    if (attempt === 0) {
      console.log(`[register] not yet logged in on home page (url: ${data?.url || "unknown"}, loggedIn=${data?.loggedIn}), waiting...`);
    }
    const delay = Math.min(1e3 * Math.pow(1.4, attempt), 1e4);
    await new Promise((r) => setTimeout(r, delay));
  }
  console.log("[register] timed out waiting for logged-in home page");
  return false;
}
async function browseAfterRegister(client, tabId, instanceId) {
  try {
    console.log("[register] waiting for post-registration page to settle...");
    await humanPause(3e3, 5e3);
    for (let i = 0; i < 8; i++) {
      try {
        await client.evaluateV2(tabId, `(function(){return 1;})()`);
        break;
      } catch {
        await humanPause(1e3, 2e3);
      }
    }
    await humanPause(1e3, 2e3);
    try {
      const urlRes = await client.evaluateV2(tabId, `(function(){return location.href;})()`);
      const url = String(typeof urlRes.result === "string" ? urlRes.result : urlRes.result ?? "");
      if (url.indexOf("/comments/") !== -1) {
        console.log("[register] on a post detail page \u2014 clicking logo to go to homepage feed...");
        const logo = await locateByJS(client, tabId, JS_REDDIT_LOGO);
        if (logo) {
          await humanClickElement(client, tabId, logo);
          await humanPause(2500, 4e3);
        } else {
          await client.tabNav(tabId, "https://www.reddit.com/", { waitFor: "networkidle", timeout: 15e3 });
          await humanPause(2e3, 4e3);
        }
      }
    } catch (err) {
      console.log(`[register] homepage navigation check failed: ${err?.message ?? err}`);
    }
    const targetCount = 2 + Math.floor(Math.random() * 4);
    console.log(`[register] collecting posts from feed, will browse ${targetCount}...`);
    const listResult = await browsePostList(client, tabId, Math.max(targetCount + 2, 6));
    const posts = listResult?.data?.posts ?? [];
    if (posts.length === 0) {
      console.log("[register] no posts collected from feed, skipping detail browsing");
    } else {
      const shuffled = [...posts].sort(() => Math.random() - 0.5);
      const picked = shuffled.slice(0, Math.min(targetCount, shuffled.length));
      let browsed = 0;
      for (const post of picked) {
        const postId = post.id;
        if (!postId) continue;
        console.log(`[register] clicking into post ${postId} (${browsed + 1}/${picked.length})...`);
        const clickRes = await clickPost(client, tabId, postId);
        if (clickRes?.status !== "success") {
          console.log(`[register] clickPost ${postId} did not succeed (${clickRes?.status}), stopping browsing`);
          break;
        }
        await browsePost(client, tabId);
        browsed++;
        if (browsed < picked.length) {
          const logo = await locateByJS(client, tabId, JS_REDDIT_LOGO);
          if (logo) {
            await humanClickElement(client, tabId, logo);
          } else {
            await client.tabNav(tabId, "https://www.reddit.com/", { waitFor: "networkidle", timeout: 15e3 });
          }
          await humanPause(2e3, 4e3);
        }
      }
      console.log(`[register] browsed ${browsed} post(s) as the new user`);
    }
    const newTab = await client.instanceTabsOpen(instanceId, "https://www.bing.com/");
    if (newTab.tabId) {
      await client.tabFocus(newTab.tabId);
      console.log(`[register] opened new tab ${newTab.tabId} and switched to it (reddit tab backgrounded)`);
    }
  } catch (err) {
    console.log(`[register] post-register activity skipped: ${err?.message ?? err}`);
  }
}
async function register(client, options) {
  const { persona, index: personaIndex } = pickPersona(options.personaIndex);
  const username = options.manualUsername || generateUsername();
  let password = options.manualPassword || generatePassword();
  console.log(`[register] === Starting Reddit Registration ===`);
  console.log(`[register] persona index: #${personaIndex}`);
  console.log(`[register] gender: ${persona.gender}`);
  console.log(`[register] interests: ${persona.interests.join(", ")}`);
  console.log(`[register] email: ${options.emailUsername}`);
  console.log(`[register] username: ${username}`);
  console.log(`[register] password: ${"*".repeat(password.length)}`);
  let tabId;
  let finalUsername = username;
  let finalActualUsername = "";
  let finalActualPassword = "";
  let selectedGender = "";
  let actualGender = "";
  let birthdaySkipped;
  let birthdayFilled;
  let selectedInterests = [];
  let selectedFeedItems = [];
  let stoppedAtStep = 0;
  let partialSuccess = false;
  let webauthnEnabled = false;
  const skippedSteps = [];
  try {
    stoppedAtStep = 2;
    tabId = await stepNavigateToRegister(client, options.instanceId, options.entryMode, options.engine);
    stoppedAtStep = 3;
    await stepInputEmail(client, tabId, options.emailUsername);
    stoppedAtStep = 4;
    await stepWaitForVerificationCode(client, tabId);
    stoppedAtStep = 5;
    const code = await stepGetVerificationCode(client, options.instanceId, options.emailCodeUrl, tabId);
    stoppedAtStep = 6;
    await stepInputVerificationCode(client, tabId, code);
    webauthnEnabled = false;
    try {
      const wa = await client.webauthnEnable(tabId);
      webauthnEnabled = true;
      console.log(`[register] virtual WebAuthn authenticator enabled on register tab (${wa.authenticatorId})`);
    } catch (err) {
      const msg = err?.error ?? err.message ?? String(err);
      console.log(`[register] WARNING: webauthnEnable failed (${msg}); native security-key dialog may appear at step 7`);
    }
    stoppedAtStep = 7;
    const step7Result = await stepUsernamePassword(client, tabId, username, password);
    finalUsername = step7Result.username;
    finalActualUsername = step7Result.actualUsername;
    finalActualPassword = step7Result.actualPassword;
    if (finalActualPassword) password = finalActualPassword;
    partialSuccess = true;
    const completedPages = /* @__PURE__ */ new Set();
    await (async () => {
      for (let wi = 0; wi < 10; wi++) {
        await humanPause(1e3, 2e3);
        try {
          await client.evaluateV2(tabId, `(function(){return 1;})()`);
          console.log(`[register] tab is evaluatable, starting page detection`);
          return;
        } catch {
        }
        console.log(`[register] tab not yet evaluatable (${wi + 1}/10), waiting...`);
      }
      console.log(`[register] tab still not evaluatable after wait, proceeding anyway`);
    })();
    for (let pageRound = 0; pageRound < 8; pageRound++) {
      stoppedAtStep = 8 + pageRound;
      await humanPause(500, 1500);
      let kind;
      let titles;
      try {
        const detection = await detectPage(client, tabId);
        kind = detection.kind;
        titles = detection.titles;
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err ?? "unknown");
        console.log(`[register] detectPage failed (round ${pageRound + 1}): ${msg}, falling back to element checks...`);
        titles = [];
        kind = "unknown";
        try {
          if (await locateByJS(client, tabId, JS_REGISTER_BIRTHDAY_MONTH_INPUT)) kind = "birthday";
        } catch {
        }
        if (kind === "unknown") {
          try {
            const labelsResult = await client.evaluateV2(tabId, JS_REGISTER_BIRTHDAY_LABELS);
            const labelsRaw = labelsResult.result;
            let labelsData;
            if (typeof labelsRaw === "string") {
              try {
                labelsData = JSON.parse(labelsRaw);
              } catch {
                labelsData = [];
              }
            } else if (Array.isArray(labelsRaw)) {
              labelsData = labelsRaw;
            } else {
              labelsData = [];
            }
            const labelTexts = labelsData.map((l) => (l.text || "").toUpperCase());
            if (["MONTH", "DAY", "YEAR"].filter((k) => labelTexts.includes(k)).length >= 2) kind = "birthday";
          } catch {
          }
        }
        if (kind === "unknown") {
          try {
            if (await isOnGenderPage(client, tabId)) kind = "gender";
          } catch {
          }
        }
        if (kind === "unknown") {
          try {
            if (await locateByJS(client, tabId, JS_REGISTER_INTERESTS_TITLE)) kind = "interests";
          } catch {
          }
        }
        if (kind === "unknown") {
          try {
            if (await locateByJS(client, tabId, JS_REGISTER_FEED_TITLE)) kind = "feed";
          } catch {
          }
        }
        console.log(`[register] fallback element check result: kind=${kind}`);
      }
      console.log(`[register] page detection round ${pageRound + 1}: kind=${kind}, titles=${JSON.stringify(titles)}`);
      if (kind === "home") {
        console.log("[register] reached home page, stopping page detection loop");
        break;
      }
      if (kind === "unknown") {
        console.log("[register] unknown page, trying Skip button as fallback...");
        try {
          const skipBtn = await locateAndScrollByJS(client, tabId, JS_REGISTER_SKIP_BUTTON);
          if (skipBtn) {
            await hoverWithHesitation(client, tabId, skipBtn);
            console.log("[register] clicked Skip on unknown page");
          } else {
            const continueBtn = await locateAndScrollByJS(client, tabId, JS_REGISTER_INTEREST_CONTINUE_BUTTON);
            if (continueBtn) {
              await hoverWithHesitation(client, tabId, continueBtn);
              console.log("[register] clicked Continue on unknown page");
            } else {
              console.log("[register] no Skip or Continue found on unknown page, moving on");
            }
          }
        } catch (err) {
          console.log(`[register] fallback Skip/Continue failed: ${err.message}`);
        }
        continue;
      }
      if (completedPages.has(kind)) {
        console.log(`[register] page "${kind}" already completed, clicking Skip/Continue to move on...`);
        try {
          const skipBtn = await locateAndScrollByJS(client, tabId, JS_REGISTER_SKIP_BUTTON);
          if (skipBtn) {
            await hoverWithHesitation(client, tabId, skipBtn);
          } else {
            const continueBtn = await locateAndScrollByJS(client, tabId, JS_REGISTER_INTEREST_CONTINUE_BUTTON) || await locateAndScrollByJS(client, tabId, JS_REGISTER_TOPIC_CONTINUE_BUTTON);
            if (continueBtn) await hoverWithHesitation(client, tabId, continueBtn);
          }
        } catch (err) {
          console.log(`[register] skip-on-repeat failed: ${err.message}`);
        }
        continue;
      }
      try {
        switch (kind) {
          case "birthday": {
            console.log("[register] detected birthday page");
            const birthdayResult = await stepBirthday(client, tabId);
            birthdaySkipped = birthdayResult.shown ? birthdayResult.skipped : void 0;
            if (birthdayResult.birthday) birthdayFilled = birthdayResult.birthday;
            completedPages.add("birthday");
            break;
          }
          case "gender": {
            console.log("[register] detected gender page");
            selectedGender = persona.gender;
            actualGender = await stepGenderSelection(client, tabId, persona.gender);
            if (actualGender === "skipped") skippedSteps.push(9);
            completedPages.add("gender");
            break;
          }
          case "interests": {
            console.log("[register] detected interests page");
            selectedInterests = await stepInterestSelection(client, tabId, persona.interests);
            completedPages.add("interests");
            break;
          }
          case "feed": {
            console.log("[register] detected feed customization page");
            selectedFeedItems = await stepFeedCustomization(client, tabId);
            await stepFeedCustomizationContinue(client, tabId);
            completedPages.add("feed");
            break;
          }
        }
      } catch (err) {
        const msg = err.error ?? err.message ?? String(err);
        console.log(`[register] step for "${kind}" failed: ${msg}, skipping`);
        skippedSteps.push(stoppedAtStep);
        completedPages.add(kind);
        try {
          const skipBtn = await locateAndScrollByJS(client, tabId, JS_REGISTER_SKIP_BUTTON);
          if (skipBtn) {
            await hoverWithHesitation(client, tabId, skipBtn);
            console.log(`[register] clicked Skip after "${kind}" failure`);
          } else {
            const continueBtn = await locateAndScrollByJS(client, tabId, JS_REGISTER_INTEREST_CONTINUE_BUTTON) || await locateAndScrollByJS(client, tabId, JS_REGISTER_TOPIC_CONTINUE_BUTTON);
            if (continueBtn) {
              await hoverWithHesitation(client, tabId, continueBtn);
              console.log(`[register] clicked Continue after "${kind}" failure`);
            }
          }
        } catch {
        }
      }
    }
    stoppedAtStep = 13;
    let success = false;
    try {
      success = await stepVerifySuccess(client, tabId);
    } catch (err) {
      const msg13 = err.error ?? err.message ?? String(err);
      console.log(`[register] step 13 error, skipping: ${msg13}`);
      skippedSteps.push(13);
    }
    let webauthnCredential;
    if (success && webauthnEnabled) {
      try {
        const creds = await client.webauthnGetCredentials(tabId);
        if (creds.credentials && creds.credentials.length > 0) {
          webauthnCredential = creds.credentials[0];
          console.log(
            `[register] exported WebAuthn credential (rpId=${webauthnCredential.rpId ?? "?"}, id=${webauthnCredential.credentialId.slice(0, 12)}\u2026, ${webauthnCredential.isResidentCredential ? "resident" : "server-side"})`
          );
        } else {
          console.log("[register] WebAuthn enabled but no credential was enrolled (reddit skipped passkey step)");
        }
      } catch (err) {
        const msg = err?.error ?? err.message ?? String(err);
        console.log(`[register] WARNING: webauthnGetCredentials failed (${msg})`);
      }
    }
    if (webauthnEnabled) {
      try {
        await client.webauthnDisable(tabId);
        console.log("[register] virtual WebAuthn authenticator disabled (passkey exported)");
      } catch (err) {
        const msg = err?.error ?? err.message ?? String(err);
        console.log(`[register] WARNING: webauthnDisable failed (${msg})`);
      }
    }
    if (success) {
      await browseAfterRegister(client, tabId, options.instanceId);
    }
    return {
      status: success ? "success" : "partial",
      message: success ? "registration completed successfully" : "registration completed but could not verify home page redirect",
      stoppedAtStep: 13,
      data: {
        username: finalUsername,
        password,
        actualUsername: finalActualUsername,
        actualPassword: finalActualPassword,
        email: options.emailUsername,
        personaIndex,
        gender: selectedGender,
        actualGender,
        birthdaySkipped,
        birthday: birthdayFilled,
        selectedInterests,
        selectedFeedItems,
        skippedSteps: skippedSteps.length > 0 ? skippedSteps : void 0,
        webauthnCredential
      }
    };
  } catch (err) {
    const errorMsg = err?.error ?? err.message ?? JSON.stringify(err) ?? String(err);
    console.log(`[register] FAILED at step ${stoppedAtStep}: ${errorMsg}`);
    if (webauthnEnabled) {
      try {
        await client.webauthnDisable(tabId);
      } catch {
      }
    }
    const data = {
      username: finalUsername,
      password,
      email: options.emailUsername,
      personaIndex
    };
    if (finalActualUsername) data.actualUsername = finalActualUsername;
    if (finalActualPassword) data.actualPassword = finalActualPassword;
    if (selectedGender) data.gender = selectedGender;
    if (actualGender) data.actualGender = actualGender;
    if (birthdaySkipped !== void 0) data.birthdaySkipped = birthdaySkipped;
    if (birthdayFilled) data.birthday = birthdayFilled;
    if (selectedInterests.length > 0) data.selectedInterests = selectedInterests;
    if (selectedFeedItems.length > 0) data.selectedFeedItems = selectedFeedItems;
    if (skippedSteps.length > 0) data.skippedSteps = skippedSteps;
    return {
      status: partialSuccess ? "partial" : "failed",
      message: `step ${stoppedAtStep} failed: ${errorMsg}`,
      stoppedAtStep,
      data
    };
  }
}
async function main() {
  const cli = await getCliOptions();
  const instanceId = getCliArg("instance-id");
  if (!instanceId) {
    console.log(JSON.stringify({ status: "failed", message: "--instance-id is required" }));
    process.exit(1);
  }
  const emailUsername = getCliArg("email-username");
  const emailCodeUrl = getCliArg("email-code-url");
  if (!emailUsername || !emailCodeUrl) {
    console.log(JSON.stringify({ status: "failed", message: "--email-username and --email-code-url are required" }));
    process.exit(1);
  }
  const personaIndexStr = getCliArg("persona-index");
  const personaIndex = personaIndexStr ? parseInt(personaIndexStr, 10) : void 0;
  const manualUsername = getCliArg("username");
  const manualPassword = getCliArg("password");
  const entryMode = getCliArg("entry") ?? "search";
  const engine = getCliArg("engine") ?? "auto";
  const client = new PinchTabClient({ baseUrl: cli.baseUrl, token: cli.token });
  const result = await register(client, {
    instanceId,
    emailUsername,
    emailCodeUrl,
    personaIndex,
    manualUsername,
    manualPassword,
    entryMode,
    engine
  });
  console.log(JSON.stringify(result));
  process.exit(result.status === "failed" ? 1 : 0);
}
runMain(main, "reddit-register.ts");
export {
  register
};
