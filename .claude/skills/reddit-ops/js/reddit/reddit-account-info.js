import { PinchTabClient } from "../api.js";
import {
  humanClickElement,
  humanMouseMove,
  humanPause,
  humanScrollDown,
  randomViewportPosition,
  locateByJS,
  scrollToTopHuman,
  ensureTabFocus,
  briefBrowseAfterAction,
  simulateTabSwitch,
  parseEvalResult,
  JS_DISMISS_TOAST_BUTTON
} from "./reddit-human.js";
import { outputResult, getCliOptions, requireTabId, runMain } from "./cli.js";
import { readUnreadBadges, readNotifications, readChatMessages } from "./reddit-inbox-chat.js";
import { JS_USER_MENU_BUTTON, JS_VIEW_PROFILE_LINK } from "./reddit-edit-avatar.js";
const JS_PROFILE_SIDEBAR_DATA = `
(function(){try{var sb=document.getElementById("right-sidebar-contents");if(!sb)return null;var r={username:null,karma:null,redditAge:null,contributions:null,cakeDay:null,url:window.location.href};var nameEl=sb.querySelector('[data-testid="profile-display-name"]');r.username=nameEl?nameEl.textContent.trim():null;var karmaEl=sb.querySelector('[data-testid="karma-number"]');r.karma=karmaEl?karmaEl.textContent.trim():null;var contribEl=sb.querySelector('[data-testid="contribution-count"]');r.contributions=contribEl?contribEl.textContent.trim():null;var cakeEl=sb.querySelector('[data-testid="cake-day"]');if(cakeEl){r.redditAge=cakeEl.textContent.trim();r.cakeDay=cakeEl.getAttribute("datetime")||null}return r}catch(e){return null}})()
`;
const JS_PROFILE_TABS = `
(function(){var pm=window.location.pathname.match(/^\\/user\\/([^/]+)/);if(!pm)return null;var user=pm[1];var suffixes=['submitted','comments','saved','history','hidden','upvoted','downvoted'];var tabs=[];var seenHref={};var root=document.querySelector('main,#main-content,[role="main"]')||document;var allLinks=root.querySelectorAll('a[href*="/user/"]');for(var i=0;i<allLinks.length;i++){var href=allLinks[i].getAttribute('href')||'';var r=allLinks[i].getBoundingClientRect();if(r.width===0||r.height===0)continue;var ok=false;for(var s=0;s<suffixes.length;s++){if(href==='/user/'+user+'/'+suffixes[s]+'/'||href==='/user/'+user+'/'+suffixes[s]){ok=true;break;}}if(!ok)continue;if(seenHref[href])continue;seenHref[href]=true;tabs.push({text:allLinks[i].textContent.trim(),href:href,x:Math.round(r.x+r.width/2),y:Math.round(r.y+r.height/2),w:Math.round(r.width),h:Math.round(r.height)})}return tabs.length>0?tabs:null})()
`;
const JS_DETECTION_PROBE = `
(function(){
  var zp=["__webdriver_evaluate","__selenium_evaluate","__webdriver_script_function","webdriver-evaluate","selenium-evaluate"];
  function decode(raw){
    if(!raw) return {decoded:"",version:null,segments:[]};
    var d; try{d=atob(raw);}catch(e){return {decoded:"<atob failed>",version:null,segments:[]};}
    var p=d.split(".");
    if(p.length<2) return {decoded:d,version:null,segments:[]};
    var vm=p[0].match(/^v(\\d+)$/);
    if(!vm) return {decoded:d,version:null,segments:[]};
    if(!/^[1-9]\\d*$/.test(vm[1])) return {decoded:d,version:null,segments:[]};
    var s=p.slice(1);
    if(!s.every(function(x){return /^[a-zA-Z0-9]+$/.test(x);})) return {decoded:d,version:null,segments:[]};
    return {decoded:d,version:vm[1],segments:s};
  }
  var Wp=[
    ["webdriver",function(){return !0===navigator.webdriver;}],
    ["cdc_globals",function(){return Object.keys(window).some(function(e){return e.startsWith("cdc_");});}],
    ["selenium_markers",function(){return zp.some(function(e){return e in window;})||"$cdc_asdjflasutopfhvcZLmcfl_" in document;}],
    ["phantomjs",function(){return "callPhantom" in window||"_phantom" in window;}],
    ["nightmare",function(){return "__nightmare" in window;}],
    ["playwright",function(){return "__playwright" in window||"__pw_manualMouseLockState" in window;}],
    ["headless_ua",function(){return /HeadlessChrome/u.test(navigator.userAgent);}]
  ];
  var app=document.querySelector("shreddit-app");
  var out={url:location.href,foundApp:!!app,platformHealth:null,isBot:null,userTime:null,a1SelfTest:null,a1Flagged:[]};
  if(app){
    var raw=app.getAttribute("platform-health-id")||"";
    out.platformHealth={enabled:raw.length>0,raw:raw,decode:decode(raw)};
    var ib=app.getAttribute("is-bot");
    out.isBot=ib===null?null:(ib==="true");
  }
  var cfg=window.__REDDIT_TIME_CONFIG;
  out.userTime=cfg?{enabled:true,idleThresholdMs:cfg.idleThresholdMs??30000,flushIntervalMs:cfg.flushIntervalMs??15000}:{enabled:false};
  out.a1SelfTest=Wp.map(function(t){var h;try{h=t[1]();}catch(e){h="ERR";}return {name:t[0],detected:h};});
  out.a1Flagged=out.a1SelfTest.filter(function(r){return r.detected===true;}).map(function(r){return r.name;});
  return out;
})()
`;
const JS_COMMENT_TAB = `
(function(){var root=document.querySelector('main,#main-content,[role="main"]')||document;var links=root.querySelectorAll("a");for(var i=0;i<links.length;i++){var h=links[i].getAttribute("href")||"";var r=links[i].getBoundingClientRect();if(r.width>0&&r.height>0&&h.indexOf("/user/")>-1&&h.indexOf("/comments/")>-1&&h.indexOf("/comment/")===-1)return JSON.stringify({x:Math.round(r.x+r.width/2),y:Math.round(r.y+r.height/2),w:Math.round(r.width),h:Math.round(r.height),attrs:{href:h,text:links[i].textContent.trim()}})}return null})()
`;
const JS_PROFILE_COMMENTS = `
(function(){var comments=document.querySelectorAll("shreddit-profile-comment");var result=[];comments.forEach(function(c){var commentId=c.getAttribute("comment-id")||"";var row=c.querySelector("shreddit-comment-action-row");var score=parseInt(row?row.getAttribute("score")||"0":"0")||0;var voteState=row?row.getAttribute("vote-state")||"NONE":"NONE";var permalink=row?row.getAttribute("permalink")||"":"";var timeEl=c.querySelector("faceplate-timeago time");var createdAt=timeEl?timeEl.getAttribute("datetime")||"":"";var subreddit="";var postTitle="";var postUrl="";c.querySelectorAll("a").forEach(function(a){var h=a.getAttribute("href")||"";var m=h.match(/^\\/r\\/([^/]+)\\/?$/);if(m&&!subreddit)subreddit=m[1];var m2=h.match(/^\\/r\\/[^/]+\\/comments\\/([^/]+)\\/[^/]+\\/?$/);if(m2&&!postUrl){postUrl=h;postTitle=a.textContent.trim()}});var body="";var mediaUrls=[];var contentEl=c.querySelector('[id$="-post-rtjson-content"]');if(contentEl){var pEls=contentEl.querySelectorAll("p");for(var pi=0;pi<pEls.length;pi++){if(pEls[pi].textContent.trim())body+=(body?"\\n":"")+pEls[pi].textContent.trim()};var imgs=contentEl.querySelectorAll("figure img[src]");for(var ii=0;ii<imgs.length;ii++){var src=imgs[ii].getAttribute("src")||"";if(src&&mediaUrls.indexOf(src)===-1)mediaUrls.push(src)}};var views=0;var showSvg=c.querySelector('svg[icon-name="show"]');if(showSvg){var outer=showSvg.closest("span");if(outer){var spans=outer.querySelectorAll("span");for(var si=0;si<spans.length;si++){var vt=spans[si].textContent.trim();var v=parseInt(vt);if(v>0){views=v;break}}}};result.push({commentId:commentId,body:body,mediaUrls:mediaUrls,score:score,voteState:voteState,views:views,subreddit:subreddit,postTitle:postTitle,postUrl:postUrl,permalink:permalink,createdAt:createdAt})});return JSON.stringify(result)})()
`;
async function navigateToProfile(client, tabId) {
  let hadServerError = false;
  await ensureTabFocus(client, tabId);
  await humanPause(12e3, 15e3);
  const urlResult = await client.pageUrl(tabId);
  if (!urlResult.url?.includes("reddit.com")) {
    return { status: "invalid_page", message: "not on a Reddit page" };
  }
  console.log("[browse-profile] looking for user menu button...");
  const menuBtn = await locateByJS(client, tabId, JS_USER_MENU_BUTTON);
  if (!menuBtn) {
    return { status: "failed", message: "could not find user menu button" };
  }
  console.log(`[browse-profile] found menu button at (${menuBtn.x}, ${menuBtn.y})`);
  if (Math.random() < 0.1) {
    const randomSpot = randomViewportPosition();
    await humanMouseMove(client, tabId, randomSpot.x, randomSpot.y);
    await humanPause(300, 800);
  }
  await humanClickElement(client, tabId, menuBtn, { skipMoveAway: true });
  console.log("[browse-profile] clicked user menu button");
  await humanPause(2e3, 3e3);
  const JS_MENU_OPEN = `(function(){var b=document.getElementById("expand-user-drawer-button");var dd=document.querySelector("rpl-dropdown");if(b&&b.getAttribute("aria-expanded")==="true")return true;if(dd&&dd.hasAttribute("open"))return true;var c=document.getElementById("user-drawer-content");if(c&&c.getBoundingClientRect().height>0)return true;return false;})()`;
  let menuOpened = false;
  try {
    const raw = await client.evaluateV2(tabId, JS_MENU_OPEN);
    menuOpened = !!parseEvalResult(raw.result);
  } catch {
  }
  if (!menuOpened) {
    console.log("[browse-profile] menu did not open on first click, retrying");
    const btn2 = await locateByJS(client, tabId, JS_USER_MENU_BUTTON);
    if (btn2) {
      await humanClickElement(client, tabId, btn2, { skipMoveAway: true });
      await humanPause(2e3, 3e3);
      console.log("[browse-profile] retried menu click");
    }
  }
  try {
    const toastBtn = await locateByJS(client, tabId, JS_DISMISS_TOAST_BUTTON);
    if (toastBtn) {
      hadServerError = true;
      console.log("[browse-profile] server error toast found, dismissing via real click");
      await humanClickElement(client, tabId, toastBtn, { skipMoveAway: true });
      await humanPause(800, 1500);
      await humanClickElement(client, tabId, menuBtn, { skipMoveAway: true });
      console.log("[browse-profile] re-clicked user menu button");
      await humanPause(1e3, 1800);
    }
  } catch {
  }
  let navigatedViaMenu = false;
  let profileLink = null;
  for (let pollAttempt = 0; pollAttempt < 5; pollAttempt++) {
    await humanPause(800, 1200);
    try {
      profileLink = await locateByJS(client, tabId, JS_VIEW_PROFILE_LINK);
    } catch (err) {
      console.log(`[browse-profile] locateByJS error on poll ${pollAttempt + 1}: ${JSON.stringify(err)} | status=${err?.status} | message=${err?.message}`);
      continue;
    }
    if (profileLink) {
      console.log(`[browse-profile] View Profile link found on poll ${pollAttempt + 1} at (${profileLink.x}, ${profileLink.y})`);
      break;
    }
    console.log(`[browse-profile] View Profile link not visible yet, polling (${pollAttempt + 1}/5)...`);
  }
  if (!profileLink) {
    console.log(`[browse-profile] View Profile link: not found after polling`);
  }
  if (profileLink) {
    const safeX = Math.round(menuBtn.x - 50 + Math.random() * 30);
    const safeY = Math.round(menuBtn.y + 40 + Math.random() * 20);
    await humanMouseMove(client, tabId, safeX, safeY);
    await humanPause(300, 600);
    try {
      await humanClickElement(client, tabId, profileLink, { skipMoveAway: true });
      console.log("[browse-profile] clicked View Profile");
    } catch (err) {
      if (err?.status === 409) {
        console.log("[browse-profile] View Profile click triggered navigation (409)");
      } else {
        console.log(`[browse-profile] View Profile click error: ${err?.message || err}`);
      }
    }
    await humanPause(2e3, 3500);
    const urlCheck = await client.pageUrl(tabId);
    if (urlCheck.url?.includes("/user/")) {
      navigatedViaMenu = true;
      console.log(`[browse-profile] navigated to profile: ${urlCheck.url}`);
    }
  }
  if (!navigatedViaMenu) {
    return { status: "failed", message: "could not navigate to profile via menu" };
  }
  let finalUrl = "";
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const urlCheck = await client.pageUrl(tabId);
      finalUrl = urlCheck.url ?? "";
      if (finalUrl.includes("/user/")) break;
    } catch {
      console.log(`[browse-profile] tab busy, retrying URL check (${attempt + 1}/3)`);
    }
    await humanPause(1e3, 2e3);
  }
  if (!finalUrl.includes("/user/")) {
    return { status: "failed", message: "navigation to profile page not confirmed" };
  }
  console.log(`[browse-profile] on profile page: ${finalUrl}`);
  return { status: "success", message: "navigated to profile page", data: { url: finalUrl, serverError: hadServerError } };
}
async function extractAccountInfo(client, tabId) {
  await scrollToTopHuman(client, tabId);
  await humanPause(500, 1e3);
  const scrollPx = 100 + Math.round(Math.random() * 150);
  await client.humanMouseScroll(tabId, { x: 600, y: 400, totalPx: scrollPx });
  await humanPause(1e3, 2e3);
  console.log("[browse-profile] extracting sidebar data...");
  const raw = await client.evaluateV2(tabId, JS_PROFILE_SIDEBAR_DATA);
  const data = parseEvalResult(raw.result);
  if (!data) throw new Error("could not extract profile sidebar data");
  console.log(`[browse-profile] extracted: username=${data.username}, karma=${data.karma}, age=${data.redditAge}`);
  return data;
}
async function extractComments(client, tabId) {
  console.log("[browse-profile] extracting comments from profile...");
  await scrollToTopHuman(client, tabId);
  await humanPause(300, 600);
  let commentTab;
  try {
    commentTab = await locateByJS(client, tabId, JS_COMMENT_TAB);
  } catch (locErr) {
    console.log(`[browse-profile] locateByJS failed: ${locErr?.message || locErr?.error || JSON.stringify(locErr)}`);
    return [];
  }
  if (!commentTab) {
    console.log("[browse-profile] comments tab not found, skipping comment extraction");
    return [];
  }
  console.log(`[browse-profile] clicking comments tab at (${commentTab.x}, ${commentTab.y})`);
  await humanClickElement(client, tabId, commentTab, { skipMoveAway: true });
  await humanPause(2500, 4e3);
  let onCommentsPage = false;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const urlResult = await client.pageUrl(tabId);
      if (urlResult.url?.includes("/comments/")) {
        onCommentsPage = true;
        break;
      }
    } catch {
      console.log(`[browse-profile] tab busy, retrying URL check (${attempt + 1}/3)`);
    }
    await humanPause(1e3, 2e3);
  }
  if (!onCommentsPage) {
    console.log("[browse-profile] did not reach comments page, skipping comment extraction");
    return [];
  }
  await scrollToTopHuman(client, tabId);
  await humanPause(500, 1e3);
  const scrollPx = 150 + Math.round(Math.random() * 200);
  await client.humanMouseScroll(tabId, { x: 600, y: 400, totalPx: scrollPx });
  await humanPause(1500, 2500);
  try {
    const raw = await client.evaluateV2(tabId, JS_PROFILE_COMMENTS);
    const data = parseEvalResult(raw.result) ?? [];
    console.log(`[browse-profile] extracted ${data.length} comments`);
    return data;
  } catch (err) {
    console.log(`[browse-profile] comment extraction failed: ${err?.message || err}`);
    return [];
  }
}
async function browseProfileTabs(client, tabId) {
  const rawTabs = await client.evaluateV2(tabId, JS_PROFILE_TABS);
  const tabs = parseEvalResult(rawTabs.result);
  if (!tabs || tabs.length <= 1) {
    console.log("[browse-profile] no extra profile tabs found, skipping tab browsing");
    return;
  }
  console.log(`[browse-profile] found ${tabs.length} tabs: ${tabs.map((t) => t.text).join(", ")}`);
  const tabCount = 1 + Math.floor(Math.random() * Math.min(3, tabs.length - 1));
  const shuffled = [...tabs].sort(() => Math.random() - 0.5);
  const toVisit = shuffled.slice(0, tabCount);
  console.log(`[browse-profile] will visit ${tabCount} tabs: ${toVisit.map((t) => t.text).join(", ")}`);
  for (const tab of toVisit) {
    const rawRefreshed = await client.evaluateV2(tabId, JS_PROFILE_TABS);
    const currentTabs = parseEvalResult(rawRefreshed.result);
    if (!currentTabs) {
      console.log("[browse-profile] could not re-locate tabs, stopping");
      break;
    }
    const target = currentTabs.find((t) => t.href === tab.href);
    if (!target) {
      console.log(`[browse-profile] tab "${tab.href}" not found, skipping`);
      continue;
    }
    console.log(`[browse-profile] clicking tab: ${target.text}`);
    const wander = randomViewportPosition();
    await humanMouseMove(client, tabId, wander.x, wander.y);
    await humanPause(500, 1200);
    try {
      await humanClickElement(client, tabId, target, { skipMoveAway: true });
    } catch (err) {
      if (err?.status === 409) {
        console.log(`[browse-profile] tab "${target.text}" click triggered navigation (409)`);
      } else {
        console.log(`[browse-profile] tab click error: ${err?.message || err}, continuing`);
        continue;
      }
    }
    await humanPause(2e3, 3500);
    const browsePx = 200 + Math.round(Math.random() * 400);
    await humanScrollDown(client, tabId, browsePx, {
      readPauseProbability: 0.3,
      scrollBackProbability: 0.1
    });
    await humanPause(1500, 4e3);
    if (Math.random() < 0.3) {
      const extraPx = 150 + Math.round(Math.random() * 300);
      await humanScrollDown(client, tabId, extraPx, {
        readPauseProbability: 0.25,
        scrollBackProbability: 0.08
      });
      await humanPause(1e3, 2500);
    }
    if (Math.random() < 0.2) {
      const idle = randomViewportPosition();
      await humanMouseMove(client, tabId, idle.x, idle.y);
      await humanPause(2e3, 5e3);
    }
    await scrollToTopHuman(client, tabId);
    await humanPause(800, 1500);
  }
}
async function probeDetection(client, tabId) {
  try {
    const raw = await client.evaluateV2(tabId, JS_DETECTION_PROBE);
    const data = parseEvalResult(raw.result);
    if (!data) {
      console.log("[detection-probe] could not parse probe result");
      return null;
    }
    const codes = data.platformHealth?.decode?.segments ?? [];
    console.log(
      `[detection-probe] platformHealth=${data.platformHealth?.enabled ? codes.join("+") : "off"} isBot=${data.isBot} userTime=${data.userTime?.enabled ? "on" : "off"} a1Flagged=${data.a1Flagged.length ? data.a1Flagged.join(",") : "none"}`
    );
    return data;
  } catch (err) {
    console.log(`[detection-probe] failed (non-fatal): ${err?.message || err}`);
    return null;
  }
}
async function browseProfile(client, tabId) {
  const detectionProbe = await probeDetection(client, tabId);
  const badges = await readUnreadBadges(client, tabId);
  const doNotif = badges.notifications > 0 || Math.random() < 0.25;
  const doChat = badges.chat > 0 || Math.random() < 0.25;
  const notifSlot = Math.random() < 0.5 ? "after-tabs" : "tail";
  const chatSlots = ["after-extract", "after-scroll", "after-wander", "after-comments", "after-tabs", "tail"];
  const chatSlot = chatSlots[Math.floor(Math.random() * chatSlots.length)];
  const navResult = await navigateToProfile(client, tabId);
  if (navResult.status !== "success") {
    return navResult;
  }
  let info;
  try {
    info = await extractAccountInfo(client, tabId);
  } catch (err) {
    return {
      status: "failed",
      message: `failed to extract account info: ${err?.message || err}`
    };
  }
  const serverError = navResult.data?.serverError || false;
  if (doChat && chatSlot === "after-extract") {
    await safeReadChat(client, tabId);
  }
  const overviewScrollPx = 200 + Math.round(Math.random() * 300);
  await humanScrollDown(client, tabId, overviewScrollPx, {
    readPauseProbability: 0.35,
    scrollBackProbability: 0.1
  });
  await humanPause(1500, 3e3);
  if (doChat && chatSlot === "after-scroll") {
    await safeReadChat(client, tabId);
  }
  const wanderSteps = 1 + Math.floor(Math.random() * 2);
  for (let i = 0; i < wanderSteps; i++) {
    const pos = randomViewportPosition();
    await humanMouseMove(client, tabId, pos.x, pos.y);
    await humanPause(800, 2e3);
  }
  if (doChat && chatSlot === "after-wander") {
    await safeReadChat(client, tabId);
  }
  let comments = [];
  try {
    comments = await extractComments(client, tabId);
  } catch (err) {
    console.log(`[browse-profile] comment extraction error (non-fatal): ${err?.message || err?.error || JSON.stringify(err)}`);
  }
  if (doChat && chatSlot === "after-comments") {
    await safeReadChat(client, tabId);
  }
  if (Math.random() < 0.7) {
    await browseProfileTabs(client, tabId);
  }
  if (doNotif && notifSlot === "after-tabs") {
    await safeReadNotifications(client, tabId);
  }
  if (doChat && chatSlot === "after-tabs") {
    await safeReadChat(client, tabId);
  }
  if (doNotif && notifSlot === "tail") {
    await safeReadNotifications(client, tabId);
  }
  if (doChat && chatSlot === "tail") {
    await safeReadChat(client, tabId);
  }
  if (Math.random() < 0.15) {
    await simulateTabSwitch(client, tabId);
  }
  await scrollToTopHuman(client, tabId);
  await humanPause(1e3, 2e3);
  try {
    await briefBrowseAfterAction(client, tabId);
  } catch {
  }
  return {
    status: "success",
    message: "profile browsed",
    data: {
      username: info.username || "unknown",
      karma: info.karma ? parseInt(info.karma, 10) || 0 : 0,
      redditAge: info.redditAge || null,
      contributions: info.contributions || null,
      cakeDay: info.cakeDay || null,
      url: info.url,
      serverError,
      comments,
      detectionProbe
    }
  };
}
async function safeReadNotifications(client, tabId) {
  try {
    await readNotifications(client, tabId);
  } catch (err) {
    console.log(`[browse-profile] notifications check failed (non-fatal): ${err?.message || err}`);
  }
}
async function safeReadChat(client, tabId) {
  try {
    await readChatMessages(client, tabId);
  } catch (err) {
    console.log(`[browse-profile] chat check failed (non-fatal): ${err?.message || err}`);
  }
}
const collectAccountInfo = browseProfile;
async function main() {
  const cli = await getCliOptions();
  const tabId = requireTabId();
  const client = new PinchTabClient({ baseUrl: cli.baseUrl, token: cli.token });
  const result = await browseProfile(client, tabId);
  outputResult(result);
}
runMain(main, "reddit-account-info.ts");
export {
  JS_PROFILE_SIDEBAR_DATA,
  browseProfile,
  collectAccountInfo,
  probeDetection
};
