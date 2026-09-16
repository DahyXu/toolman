import { PinchTabClient } from "../api.js";
import {
  ensureTabFocus,
  ensurePostDetailPage,
  humanClickElement,
  humanPause,
  humanScrollDown,
  scrollToTopHuman,
  JS_REGISTER_EMAIL_INPUT,
  locateByJS,
  pageWarmUp
} from "./reddit-human.js";
import { getCliArg, runMain } from "./cli.js";
import { browsePost } from "./reddit-browse-post.js";
const PIERCE = "function pierce(root,sel){var rs=Array.prototype.slice.call(root.querySelectorAll(sel));var all=root.querySelectorAll('*');for(var i=0;i<all.length;i++){if(all[i].shadowRoot)rs=rs.concat(pierce(all[i].shadowRoot,sel));}return rs;}";
const JS_SEARCH_BOX = `(function(){${PIERCE}var els=pierce(document,'textarea[name="q"], input[name="q"]');for(var i=0;i<els.length;i++){var r=els[i].getBoundingClientRect();if(r.width>0&&r.height>0){return{x:Math.round(r.left+r.width/2),y:Math.round(r.top+r.height/2),w:Math.round(r.width),h:Math.round(r.height),attrs:{tag:els[i].tagName.toLowerCase()}}}}return null})()`;
const JS_AUTOCOMPLETE_REDDIT = `(function(){${PIERCE}function rectOf(el){var r=el.getBoundingClientRect();if(r.width<=0||r.height<=0)return null;return{x:Math.round(r.left+r.width/2),y:Math.round(r.top+r.height/2),w:Math.round(r.width),h:Math.round(r.height)};}var boxes=pierce(document,'[role="listbox"], ul#sa_ul');var best=null;var bestY=Infinity;for(var b=0;b<boxes.length;b++){var lis=boxes[b].querySelectorAll('li');for(var i=0;i<lis.length;i++){var li=lis[i];var t=(li.innerText||li.textContent||'').trim().toLowerCase();if(t.indexOf('reddit')!==0)continue;var rc=rectOf(li);if(!rc)continue;if(rc.y<bestY){bestY=rc.y;best=rc;}}}return best;})()`;
const JS_DETECT_CHALLENGE = `(function(){var h=location.href.toLowerCase();var challenge=h.indexOf('sorry')!==-1||h.indexOf('captcha')!==-1||h.indexOf('consent.google')!==-1||h.indexOf('/accounts/checkpoint')!==-1;var recaptcha=!!document.querySelector('iframe[src*="recaptcha"]');var ttl=(document.title||'').toLowerCase();var titleHit=ttl.indexOf('unusual traffic')!==-1||ttl.indexOf('are you a robot')!==-1;return JSON.stringify({challenge:challenge,recaptcha:recaptcha,titleHit:titleHit})})()`;
const JS_GOOGLE_ENTRIES = `(function(){${PIERCE}var out=[];var all=pierce(document,'a[href]');for(var i=0;i<all.length;i++){var a=all[i];var href=a.href||'';if(!href)continue;var u;try{u=new URL(href,location.href);}catch(e){continue;}var host=u.hostname;if(host==='www.reddit.com')host='reddit.com';if(host!=='reddit.com')continue;var r=a.getBoundingClientRect();if(r.width<=0||r.height<=0)continue;var path=u.pathname;out.push({href:href,path:path,isRoot:(path==='/'||path===''),isLogin:path.indexOf('/login')===0,x:Math.round(r.left+r.width/2),y:Math.round(r.top+r.height/2),w:Math.round(r.width),h:Math.round(r.height)});}var seen={};out=out.filter(function(e){if(seen[e.href])return false;seen[e.href]=1;return true;});out.sort(function(a,b){return a.y-b.y;});return JSON.stringify(out);})()`;
const JS_BING_ENTRIES = `(function(){${PIERCE}var out=[];var seen={};function decodeU(href){var m=href.match(/[?&]u=([^&]+)/);if(!m)return'';var b64=m[1];if(b64.indexOf('a1')===0)b64=b64.slice(2);while(b64.length%4!==0)b64+='=';try{return atob(b64);}catch(e){return'';}}function isRoot(url){try{var u=new URL(url);return u.pathname==='/'||u.pathname==='/';}catch(e){return false;}}function pushEntry(a,text,realUrl){if(!a||!realUrl)return;var r=a.getBoundingClientRect();if(r.width<=0||r.height<=0)return;var key=realUrl;if(seen[key])return;seen[key]=1;out.push({realUrl:realUrl,text:(text||'').trim().slice(0,30),isRoot:isRoot(realUrl),x:Math.round(r.left+r.width/2),y:Math.round(r.top+r.height/2),w:Math.round(r.width),h:Math.round(r.height)});}var algos=pierce(document,'li.b_algo');for(var k=0;k<algos.length;k++){var li=algos[k];var citeEl=li.querySelector('cite');var cite=citeEl?(citeEl.innerText||citeEl.textContent||'').trim():'';if(cite.toLowerCase().indexOf('reddit.com')===-1)continue;var a=li.querySelector('h2 a')||li.querySelector('a[href]');if(!a)continue;if((a.href||'').indexOf('/aclk')!==-1)continue;var ru=decodeU(a.href);if(ru.toLowerCase().indexOf('reddit.com')===-1)continue;pushEntry(a,(a.innerText||a.textContent||'').trim(),ru);}var anchors=pierce(document,'a[href]');for(var m=0;m<anchors.length;m++){var aa=anchors[m];var t=(aa.innerText||aa.textContent||'').trim();if((aa.href||'').indexOf('ck/a')===-1)continue;if((aa.href||'').indexOf('/aclk')!==-1)continue;var ru2=decodeU(aa.href);if(ru2.toLowerCase().indexOf('reddit.com')===-1)continue;pushEntry(aa,t,ru2);}out.sort(function(a,b){if(a.isRoot!==b.isRoot)return a.isRoot?-1:1;return a.y-b.y;});return JSON.stringify(out);})()`;
const JS_REDDIT_SIGNUP = `(function(){${PIERCE}var cand=pierce(document,'a#signup-button, button#signup-button');for(var i=0;i<cand.length;i++){var r=cand[i].getBoundingClientRect();if(r.width>0&&r.height>0){return{x:Math.round(r.left+r.width/2),y:Math.round(r.top+r.height/2),w:Math.round(r.width),h:Math.round(r.height),attrs:{id:'signup-button'}}}}var anchors=pierce(document,'a[href]');for(var j=0;j<anchors.length;j++){var a=anchors[j];var u;try{u=new URL(a.href,location.href);}catch(e){continue;}if(u.pathname.indexOf('/register')!==0)continue;var rr=a.getBoundingClientRect();if(rr.width<=0||rr.height<=0)continue;return{x:Math.round(rr.left+rr.width/2),y:Math.round(rr.top+rr.height/2),w:Math.round(rr.width),h:Math.round(rr.height),attrs:{id:'',href:a.href}}}return null})()`;
const JS_REGISTER_EMAIL_RAIL = `(function(){${PIERCE}var el=pierce(document,'auth-flow-link[step="register-email-only"]')[0];if(!el)return null;var r=el.getBoundingClientRect();if(r.width<=0||r.height<=0)return null;return{x:Math.round(r.left+r.width/2),y:Math.round(r.top+r.height/2),w:Math.round(r.width),h:Math.round(r.height)}})()`;
const JS_RANDOM_POST = `(function(){${PIERCE}var titles=pierce(document,'a[id^="post-title-"]');var out=[];for(var i=0;i<titles.length;i++){var a=titles[i];var r=a.getBoundingClientRect();if(r.width<=0||r.height<=0)continue;if(r.top<120||r.bottom>window.innerHeight-120)continue;out.push({x:Math.round(r.left+r.width/2),y:Math.round(r.top+r.height/2),w:Math.round(r.width),h:Math.round(r.height),title:(a.innerText||'').trim().slice(0,40)});}return JSON.stringify(out);})()`;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
async function evalJson(client, tabId, js) {
  const r = await client.evaluateV2(tabId, js);
  let raw = r?.result ?? r;
  if (typeof raw === "string") {
    try {
      return JSON.parse(raw);
    } catch {
      return raw;
    }
  }
  return raw;
}
async function curHostname(client, tabId) {
  try {
    const u = String(await evalJson(client, tabId, "(function(){return location.href;})()"));
    return new URL(u).hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
}
async function detectChallenge(client, tabId) {
  try {
    return await evalJson(client, tabId, JS_DETECT_CHALLENGE);
  } catch {
    return { challenge: false, recaptcha: false, titleHit: false };
  }
}
async function searchWithAutocomplete(client, tabId, engine) {
  const QUERY = "reddit";
  const threshold = 2 + Math.floor(Math.random() * (QUERY.length - 1));
  for (let i = 0; i < QUERY.length; i++) {
    await client.humanKeyboardType(tabId, { text: QUERY[i] });
    await humanPause(90, 260);
    const typed = i + 1;
    if (typed < threshold) continue;
    for (let p = 0; p < 3; p++) {
      const sug = await locateByJS(client, tabId, JS_AUTOCOMPLETE_REDDIT);
      if (sug) {
        console.log(`[entry] ${engine}: autocomplete "reddit" after ${typed} char(s) \u2014 clicking`);
        await humanPause(180, 480);
        await humanClickElement(client, tabId, sug);
        return { viaSuggestion: true };
      }
      await sleep(140);
    }
  }
  await client.humanKeyboardPress(tabId, { key: "Enter" });
  return { viaSuggestion: false };
}
async function safeClose(client, tabId) {
  try {
    await client.tabClose(tabId);
  } catch {
  }
}
function pickRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}
function gDesc(e) {
  return `${e.isRoot ? "root" : e.path}${e.isLogin ? "(login)" : ""}`;
}
function bDesc(e) {
  return `${e.isRoot ? "root" : e.realUrl} "${e.text}"`;
}
function normalizePath(p) {
  const s = (p || "").toLowerCase().replace(/\/+$/g, "");
  return s === "" ? "/" : s;
}
const GOOGLE_ALLOWED_PATHS = ["/", "/r/popular", "/r/all", "/r/askreddit"].map(normalizePath);
function googleWhitelist(entries) {
  const allowed = entries.filter((e) => !e.isLogin && GOOGLE_ALLOWED_PATHS.includes(normalizePath(e.path)));
  if (allowed.length) return allowed;
  const root = entries.find((e) => e.isRoot && !e.isLogin);
  if (root) return [root];
  const nonLogin = entries.filter((e) => !e.isLogin);
  return nonLogin.length ? nonLogin : entries;
}
function bingWhitelist(entries) {
  const allowed = entries.filter((e) => {
    try {
      const u = new URL(e.realUrl);
      return GOOGLE_ALLOWED_PATHS.includes(normalizePath(u.pathname));
    } catch {
      return false;
    }
  });
  if (allowed.length) return allowed;
  const root = entries.find((e) => e.isRoot);
  if (root) return [root];
  return entries;
}
async function enterRedditViaSearch(client, instanceId, opts = {}) {
  const want = opts.engine ?? "auto";
  const order = want === "auto" ? ["google", "bing"] : [want];
  for (const engine of order) {
    try {
      const r = await tryEngine(client, instanceId, engine, opts.randomize ?? true);
      if (r) return r;
    } catch (err) {
      const msg = err?.message ?? JSON.stringify(err);
      console.log(`[entry] ${engine} errored: ${msg}`);
    }
  }
  console.log("[entry] no usable search engine \u2014 falling back to reddit homepage");
  const tab = await client.instanceTabsOpen(instanceId, "https://www.reddit.com/");
  const tabId = tab.tabId;
  await ensureTabFocus(client, tabId);
  await humanPause(2e3, 4e3);
  return { tabId, engine: "direct", entryUrl: "https://www.reddit.com/" };
}
async function tryEngine(client, instanceId, engine, randomize) {
  const home = engine === "google" ? "https://www.google.com/" : "https://www.bing.com/";
  const tab = await client.instanceTabsOpen(instanceId, home);
  const tabId = tab.tabId;
  console.log(`[entry] ${engine}: opened ${home} (tab ${tabId})`);
  await ensureTabFocus(client, tabId);
  await humanPause(2e3, 3500);
  let searchBox = null;
  for (let i = 0; i < 15; i++) {
    const ch = await detectChallenge(client, tabId);
    if (ch?.challenge || ch?.recaptcha || ch?.titleHit) {
      console.log(`[entry] ${engine}: challenge/consent detected \u2014 skipping engine`);
      await safeClose(client, tabId);
      return null;
    }
    searchBox = await locateByJS(client, tabId, JS_SEARCH_BOX);
    if (searchBox) {
      console.log(`[entry] ${engine}: search box ready`);
      break;
    }
    await sleep(1e3);
  }
  if (!searchBox) {
    console.log(`[entry] ${engine}: search box never appeared \u2014 skipping engine`);
    await safeClose(client, tabId);
    return null;
  }
  await humanClickElement(client, tabId, searchBox);
  await humanPause(300, 700);
  const { viaSuggestion } = await searchWithAutocomplete(client, tabId, engine);
  console.log(`[entry] ${engine}: ${viaSuggestion ? "clicked autocomplete suggestion" : 'submitted "reddit" via Enter'}`);
  const collect = engine === "google" ? () => collectGoogle(client, tabId) : () => collectBing(client, tabId);
  let entries = [];
  let directLanding = false;
  for (let i = 0; i < 25; i++) {
    const ch = await detectChallenge(client, tabId);
    if (ch?.challenge || ch?.recaptcha || ch?.titleHit) {
      console.log(`[entry] ${engine}: human challenge after search \u2014 skipping engine`);
      await safeClose(client, tabId);
      return null;
    }
    if (await curHostname(client, tabId) === "reddit.com") {
      directLanding = true;
      break;
    }
    entries = await collect();
    if (entries.length > 0) break;
    await sleep(800);
  }
  if (directLanding) {
    const entryUrl2 = String(await evalJson(client, tabId, "(function(){return location.href;})()"));
    console.log(`[entry] ${engine}: suggestion landed directly on ${entryUrl2}`);
    return { tabId, engine, entryUrl: entryUrl2, entryDesc: viaSuggestion ? "autocomplete" : "direct" };
  }
  if (entries.length === 0) {
    console.log(`[entry] ${engine}: no reddit entries on results page \u2014 skipping engine`);
    await safeClose(client, tabId);
    return null;
  }
  const pool = engine === "google" ? googleWhitelist(entries) : bingWhitelist(entries);
  if (pool.length === 0) {
    console.log(`[entry] ${engine}: no usable reddit entry \u2014 skipping engine`);
    await safeClose(client, tabId);
    return null;
  }
  const chosen = randomize ? pickRandom(pool) : pool[0];
  console.log(`[entry] ${engine}: ${pool.length} whitelisted entr${pool.length === 1 ? "y" : "ies"}, chose ${engine === "google" ? gDesc(chosen) : bDesc(chosen)}`);
  await pageWarmUp(client, tabId);
  let landed = false;
  if (engine === "google") {
    await humanClickElement(client, tabId, chosen);
    for (let i = 0; i < 20; i++) {
      if (await curHostname(client, tabId) === "reddit.com") {
        landed = true;
        break;
      }
      await sleep(700);
    }
    if (!landed) {
      console.log(`[entry] google: click did not land, fallback tabNav(${chosen.href})`);
      try {
        await client.tabNav(tabId, chosen.href);
      } catch {
      }
      for (let i = 0; i < 15; i++) {
        if (await curHostname(client, tabId) === "reddit.com") {
          landed = true;
          break;
        }
        await sleep(700);
      }
    }
  } else {
    await evalJson(client, tabId, `(function(){${PIERCE}var all=pierce(document,'a[target="_blank"]');for(var i=0;i<all.length;i++){all[i].removeAttribute('target');}return all.length;})()`);
    await humanPause(200, 400);
    await humanClickElement(client, tabId, chosen);
    for (let i = 0; i < 20; i++) {
      if (await curHostname(client, tabId) === "reddit.com") {
        landed = true;
        break;
      }
      await sleep(700);
    }
    if (!landed) {
      console.log(`[entry] bing: click did not land, fallback tabNav(${chosen.realUrl})`);
      try {
        await client.tabNav(tabId, chosen.realUrl);
      } catch {
      }
      for (let i = 0; i < 15; i++) {
        if (await curHostname(client, tabId) === "reddit.com") {
          landed = true;
          break;
        }
        await sleep(700);
      }
    }
  }
  if (!landed) {
    console.log(`[entry] ${engine}: did not land on reddit \u2014 skipping engine`);
    await safeClose(client, tabId);
    return null;
  }
  const entryUrl = String(await evalJson(client, tabId, "(function(){return location.href;})()"));
  console.log(`[entry] ${engine}: landed on ${entryUrl}`);
  return { tabId, engine, entryUrl, entryDesc: engine === "google" ? gDesc(chosen) : bDesc(chosen) };
}
async function collectGoogle(client, tabId) {
  const arr = await evalJson(client, tabId, JS_GOOGLE_ENTRIES);
  return Array.isArray(arr) ? arr : [];
}
async function collectBing(client, tabId) {
  const arr = await evalJson(client, tabId, JS_BING_ENTRIES);
  return Array.isArray(arr) ? arr : [];
}
async function openAndReadPost(client, tabId, logTag, index, total) {
  const arr = await evalJson(client, tabId, JS_RANDOM_POST);
  const posts = Array.isArray(arr) ? arr : [];
  if (!posts.length) return false;
  const post = posts[Math.floor(Math.random() * posts.length)];
  console.log(`${logTag} reading post (${index}/${total}) "${post.title}"`);
  await humanClickElement(client, tabId, post);
  let onDetail = false;
  for (let w = 0; w < 12; w++) {
    if (await ensurePostDetailPage(client, tabId)) {
      onDetail = true;
      break;
    }
    await sleep(500);
  }
  if (onDetail) {
    try {
      await browsePost(client, tabId);
    } catch {
    }
  } else {
    await humanPause(2e3, 3500);
  }
  return true;
}
async function browseFeedPosts(client, tabId, opts) {
  const { postCount, scrollPx } = opts;
  const tag = opts.logTag ?? "[browse]";
  try {
    console.log(`${tag} browsing feed (${scrollPx}px scroll, ${postCount} post${postCount > 1 ? "s" : ""})`);
    await humanScrollDown(client, tabId, scrollPx);
    await humanPause(800, 1600);
    for (let p = 0; p < postCount; p++) {
      const opened = await openAndReadPost(client, tabId, tag, p + 1, postCount);
      if (!opened) break;
      try {
        await client.back(tabId);
      } catch {
      }
      await humanPause(1500, 2500);
      await humanScrollDown(client, tabId, 300 + Math.floor(Math.random() * 400));
      await humanPause(500, 1e3);
    }
  } catch {
  }
}
async function maybeBrowseBeforeRegister(client, tabId) {
  try {
    const roll = Math.random();
    let scrollPx;
    let postCount;
    if (roll < 0.3) {
      scrollPx = 500 + Math.floor(Math.random() * 500);
      postCount = 1 + Math.floor(Math.random() * 2);
    } else if (roll < 0.7) {
      scrollPx = 800 + Math.floor(Math.random() * 900);
      postCount = 2 + Math.floor(Math.random() * 2);
    } else {
      scrollPx = 1200 + Math.floor(Math.random() * 1e3);
      postCount = 3 + Math.floor(Math.random() * 3);
    }
    const registerFromDetail = postCount > 0 && Math.random() < 0.5;
    const postLabel = postCount ? `, ${postCount} post${postCount > 1 ? "s" : ""}` : "";
    console.log(`[entry] browsing feed (${scrollPx}px scroll${postLabel})`);
    await humanScrollDown(client, tabId, scrollPx);
    await humanPause(800, 1600);
    for (let p = 0; p < postCount; p++) {
      const isLast = p === postCount - 1;
      const opened = await openAndReadPost(client, tabId, "[entry]", p + 1, postCount);
      if (!opened) break;
      if (isLast && registerFromDetail) {
        console.log("[entry] registering from this detail page");
        break;
      }
      try {
        await client.back(tabId);
      } catch {
      }
      await humanPause(1500, 2500);
      await humanScrollDown(client, tabId, 300 + Math.floor(Math.random() * 400));
      await humanPause(500, 1e3);
    }
    await scrollToTopHuman(client, tabId);
  } catch {
  }
}
async function locateRegisterEntry(client, tabId) {
  const tryRailFirst = Math.random() < 0.3;
  const order = tryRailFirst ? [["rail", JS_REGISTER_EMAIL_RAIL], ["signup", JS_REDDIT_SIGNUP]] : [["signup", JS_REDDIT_SIGNUP], ["rail", JS_REGISTER_EMAIL_RAIL]];
  for (const [key, js] of order) {
    const loc = await locateByJS(client, tabId, js);
    if (loc) {
      const method = key === "rail" ? 'left-rail "Continue with Email"' : "top-right #signup-button";
      return { loc, method };
    }
  }
  return null;
}
async function stepEnterRegister(client, tabId) {
  await ensureTabFocus(client, tabId);
  for (let i = 0; i < 6; i++) {
    if (await locateByJS(client, tabId, JS_REGISTER_EMAIL_INPUT)) {
      console.log("[entry] already on register page (case \u2461) \u2014 no entry click needed");
      return;
    }
    await sleep(700);
  }
  console.log("[entry] content page (case \u2460)");
  await maybeBrowseBeforeRegister(client, tabId);
  for (let attempt = 0; attempt < 2; attempt++) {
    let entry = await locateRegisterEntry(client, tabId);
    if (!entry && attempt === 0) {
      console.log("[entry] no register entry here \u2014 navigating to reddit home");
      try {
        await client.tabNav(tabId, "https://www.reddit.com/");
        await humanPause(2e3, 3e3);
      } catch {
      }
      entry = await locateRegisterEntry(client, tabId);
    }
    if (entry) {
      console.log(`[entry] opening register via ${entry.method}`);
      await humanClickElement(client, tabId, entry.loc);
    }
    for (let i = 0; i < 15; i++) {
      if (await locateByJS(client, tabId, JS_REGISTER_EMAIL_INPUT)) {
        console.log("[entry] register page ready (email input present)");
        return;
      }
      await sleep(700);
    }
    console.log(`[entry] register entry did not open the form (attempt ${attempt + 1}/2)${attempt === 0 ? " \u2014 retrying from reddit home" : ""}`);
    if (attempt === 0) {
      try {
        await client.tabNav(tabId, "https://www.reddit.com/");
        await humanPause(2e3, 3e3);
      } catch {
      }
    }
  }
  console.log("[entry] fallback tabNav to /register/");
  try {
    await client.tabNav(tabId, "https://www.reddit.com/register/");
    await humanPause(2e3, 3e3);
  } catch {
  }
  for (let i = 0; i < 15; i++) {
    if (await locateByJS(client, tabId, JS_REGISTER_EMAIL_INPUT)) {
      console.log("[entry] register page ready via fallback");
      return;
    }
    await sleep(700);
  }
  throw new Error("register email input did not appear after entering Sign Up");
}
async function main() {
  const baseUrl = getCliArg("base-url") ?? process.env.PINCHTAB_BASE_URL;
  const token = getCliArg("token") ?? process.env.PINCHTAB_TOKEN;
  const profileId = getCliArg("profile-id");
  const engine = getCliArg("engine") ?? "auto";
  if (!baseUrl || !token || !profileId) {
    console.log(JSON.stringify({ status: "failed", message: "--base-url, --token, --profile-id are required" }));
    process.exit(1);
  }
  const client = new PinchTabClient({ baseUrl, token });
  const inst = (await client.profileEnsure(profileId)).id;
  console.log(`>> instance ${inst}`);
  const r = await enterRedditViaSearch(client, inst, { engine });
  console.log(`>> entered reddit via ${r.engine}: ${r.entryUrl} (${r.entryDesc ?? "-"})`);
  await stepEnterRegister(client, r.tabId);
  console.log(">> on register page \u2705 (tab left open for inspection)");
}
runMain(main, "reddit-entry.ts");
export {
  browseFeedPosts,
  enterRedditViaSearch,
  stepEnterRegister
};
