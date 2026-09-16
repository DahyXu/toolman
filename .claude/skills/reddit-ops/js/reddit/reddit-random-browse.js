import { PinchTabClient } from "../api.js";
import {
  humanPause,
  humanScrollDown,
  humanMouseMove,
  hoverWithHesitation,
  humanClickElement,
  locateByJS,
  locateAndScrollByJS,
  pollLocate,
  briefBrowseAfterAction,
  ensureTabFocus,
  scrollToTopHuman,
  clamp,
  middleClickAt,
  findInstanceIdForTab,
  waitForNewTab
} from "./reddit-human.js";
import { openUserMenu, clickReliable, ev } from "./reddit-edit-avatar.js";
import { goBack } from "./reddit-back.js";
import {
  getCliOptions,
  getCliArg,
  requireTabId,
  outputResult,
  runMain,
  processExit
} from "./cli.js";
const kTag = "random-browse";
const shuffle = (a) => {
  const b = [...a];
  for (let i = b.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [b[i], b[j]] = [b[j], b[i]];
  }
  return b;
};
const ALL_ACTIONS = ["displaymode", "premium", "achievements", "profile-update", "mod-tools", "avatar-update", "social-link", "manage-communities"];
const menuLinkJs = (sel) => `(function(){var c=document.getElementById('user-drawer-content');if(!c)return JSON.stringify(null);var a=c.querySelector('${sel}');if(!a)return JSON.stringify(null);var r=a.getBoundingClientRect();if(r.width<5)return JSON.stringify(null);return JSON.stringify({x:Math.round(r.x+r.width/2),y:Math.round(r.y+r.height/2),w:Math.round(r.width),h:Math.round(r.height),href:a.getAttribute('href')||''})})()`;
const JS_DM_ITEM = `(function(){var li=document.getElementById('darkmode-list-item');if(!li)return JSON.stringify(null);var d=li.querySelector('div[tabindex]')||li;var r=d.getBoundingClientRect();if(r.width<5)return JSON.stringify(null);return JSON.stringify({x:Math.round(r.x+r.width/2),y:Math.round(r.y+r.height/2),w:Math.round(r.width),h:Math.round(r.height)})})()`;
const JS_PREFS_DISPLAY_THEME_BTN = `(function(){function qs(root,s){var r=root.querySelector(s);if(r)return r;var all=root.querySelectorAll('*');for(var i=0;i<all.length;i++){if(all[i].shadowRoot){r=qs(all[i].shadowRoot,s);if(r)return r;}}return null}var row=qs(document,'[data-testid="display-theme"]');if(!row)return JSON.stringify(null);var b=row.querySelector('button')||row;var r=b.getBoundingClientRect();if(r.width<5)return JSON.stringify(null);return JSON.stringify({x:Math.round(r.x+r.width/2),y:Math.round(r.y+r.height/2),w:Math.round(r.width),h:Math.round(r.height)})})()`;
const settingsTabJs = (seg) => `(function(){function qs(root,s){var r=root.querySelector(s);if(r)return r;var all=root.querySelectorAll('*');for(var i=0;i<all.length;i++){if(all[i].shadowRoot){r=qs(all[i].shadowRoot,s);if(r)return r;}}return null}var a=qs(document,'a[href*="/settings/${seg}"]:not([href*="#"])');if(!a)return JSON.stringify(null);var r=a.getBoundingClientRect();if(r.width<5)return JSON.stringify(null);return JSON.stringify({x:Math.round(r.x+r.width/2),y:Math.round(r.y+r.height/2),w:Math.round(r.width),h:Math.round(r.height),href:a.getAttribute('href')||''})})()`;
const themeOptionJs = (n) => `(function(){function qs(root,s){var r=root.querySelector(s);if(r)return r;var all=root.querySelectorAll('*');for(var i=0;i<all.length;i++){if(all[i].shadowRoot){r=qs(all[i].shadowRoot,s);if(r)return r;}}return null}var li=qs(document,'li[data-testid="theme-option-${n}"]');if(!li)return JSON.stringify(null);var d=li.querySelector('div[role="option"]')||li;var r=d.getBoundingClientRect();if(r.width<5)return JSON.stringify(null);return JSON.stringify({x:Math.round(r.x+r.width/2),y:Math.round(r.y+r.height/2),w:Math.round(r.width),h:Math.round(r.height)})})()`;
const JS_THEME_MODAL_OPEN = `(function(){var m=document.querySelector('rpl-modal-card.theme-switcher-modal-card');if(!m)return JSON.stringify(false);var r=m.getBoundingClientRect();return JSON.stringify(r.width>50);})()`;
const JS_DARK_STATE = `(function(){return JSON.stringify({dark:document.documentElement.classList.contains('theme-dark')})})()`;
const JS_MODAL_CLOSE = `(function(){function vis(r){return r.width>30&&r.height>30&&r.bottom>0&&r.top<innerHeight;}var mods=document.querySelectorAll('faceplate-modal,rpl-modal-card,[role="dialog"],achievement-modal');for(var i=0;i<mods.length;i++){var m=mods[i];if(!vis(m.getBoundingClientRect()))continue;var found=null;(function hunt(root,d){if(!root||d>3)return;root.querySelectorAll('button,[role="button"]').forEach(function(b){if(found)return;var ic=b.querySelector('svg[icon-name]');if(ic&&ic.getAttribute('icon-name')==='close'){var r=b.getBoundingClientRect();if(r.width>5)found={x:Math.round(r.x+r.width/2),y:Math.round(r.y+r.height/2),w:Math.round(r.width),h:Math.round(r.height)};}});if(!found){var all=root.querySelectorAll('*');for(var j=0;j<all.length;j++){if(all[j].shadowRoot)hunt(all[j].shadowRoot,d+1);}}})(m,0);if(found)return JSON.stringify(found);if(m.shadowRoot){(function hunt2(root,d){if(!root||d>3||found)return;root.querySelectorAll('button,[role="button"]').forEach(function(b){if(found)return;var ic=b.querySelector('svg[icon-name]');if(ic&&ic.getAttribute('icon-name')==='close'){var r=b.getBoundingClientRect();if(r.width>5)found={x:Math.round(r.x+r.width/2),y:Math.round(r.y+r.height/2),w:Math.round(r.width),h:Math.round(r.height)};}});if(!found){var all=root.querySelectorAll('*');for(var j=0;j<all.length;j++){if(all[j].shadowRoot)hunt2(all[j].shadowRoot,d+1);}}})(m.shadowRoot,1);if(found)return JSON.stringify(found);}}return JSON.stringify(null)})()`;
const JS_ACH_DETAIL_CLOSE = `(function(){var found=null;(function hunt(root,d){if(!root||d>3)return;root.querySelectorAll('[data-testid="close-button"],button svg[icon-name="close"],button,[role="button"]').forEach(function(b){if(found)return;var isClose = b.getAttribute("data-testid")==="close-button";if(!isClose){var ic=b.querySelector("svg[icon-name]");if(!ic||ic.getAttribute("icon-name")!=="close")return;}var r=b.getBoundingClientRect();if(r.width>10&&r.height>10&&r.bottom>0&&r.top<innerHeight)found={x:Math.round(r.x+r.width/2),y:Math.round(r.y+r.height/2),w:Math.round(r.width),h:Math.round(r.height)};});if(!found){var all=root.querySelectorAll('*');for(var j=0;j<all.length;j++){if(all[j].shadowRoot)hunt(all[j].shadowRoot,d+1);}}})(document,0);return JSON.stringify(found)})()`;
const JS_RANDOM_VIEW_POINTS = `(function(){var out=[];var vh=innerHeight,vw=innerWidth;var tries=0;while(out.length<3&&tries<30){tries++;var x=Math.round(vw*(0.2+Math.random()*0.6));var y=Math.round(vh*(0.25+Math.random()*0.5));var el=document.elementFromPoint(x,y);if(!el)continue;var tag=el.tagName.toLowerCase();var role=el.getAttribute('role')||'';if(['a','button','input','select','textarea'].indexOf(tag)>=0||['button','link','tab','checkbox','radio','switch'].indexOf(role)>=0)continue;out.push({x:x,y:y});}return JSON.stringify(out)})()`;
const achBadgeJs = (unlockedOnly) => `(function(){var bs=document.querySelectorAll('achievement-badge');var vis=[];for(var i=0;i<bs.length;i++){var b=bs[i];var r=b.getBoundingClientRect();if(r.width<30||r.height<30)continue;if(r.bottom<20||r.top>innerHeight-20)continue;if(${unlockedOnly ? "true" : "false"}&&!(b.getAttribute('unlocked-at')||''))continue;vis.push(b);}if(!vis.length)return JSON.stringify(null);var b=vis[Math.floor(Math.random()*vis.length)];var r=b.getBoundingClientRect();return JSON.stringify({x:Math.round(r.x+r.width/2),y:Math.round(r.y+r.height/2),w:Math.round(r.width),h:Math.round(r.height),attrs:{title:b.getAttribute('title')||''}})})()`;
const JS_ACH_VIEW_ALL = `(function(){function qs(root,s){var r=root.querySelector(s);if(r)return r;var all=root.querySelectorAll("*");for(var i=0;i<all.length;i++){if(all[i].shadowRoot){r=qs(all[i].shadowRoot,s);if(r)return r;}}return null}var b=qs(document,"button[data-testid='achievements-view-link']");if(!b)return JSON.stringify(null);var r=b.getBoundingClientRect();if(r.width<5)return JSON.stringify(null);return JSON.stringify({x:Math.round(r.x+r.width/2),y:Math.round(r.y+r.height/2),w:Math.round(r.width),h:Math.round(r.height)})})()`;
const JS_PROFILE_UPDATE_LINK_RAW = `(function(){var ls=document.querySelectorAll('a[href="/settings/profile"]');for(var i=0;i<ls.length;i++){var r=ls[i].getBoundingClientRect();if(r.width>10&&r.height>10)return JSON.stringify({x:Math.round(r.x+r.width/2),y:Math.round(r.y+r.height/2),w:Math.round(r.width),h:Math.round(r.height)})}return JSON.stringify(null)})()`;
const JS_MOD_TOOLS_LINK_RAW = `(function(){var ls=document.querySelectorAll('a[href]');for(var i=0;i<ls.length;i++){var h=ls[i].getAttribute('href')||'';if(h.indexOf('/about/edit/moderation')<0)continue;var r=ls[i].getBoundingClientRect();if(r.width>10&&r.height>10)return JSON.stringify({x:Math.round(r.x+r.width/2),y:Math.round(r.y+r.height/2),w:Math.round(r.width),h:Math.round(r.height)})}return JSON.stringify(null)})()`;
const JS_AVATAR_UPDATE_LINK_RAW = `(function(){var ls=document.querySelectorAll('a[href="/avatar"]');for(var i=0;i<ls.length;i++){var r=ls[i].getBoundingClientRect();if(r.width>10&&r.height>10)return JSON.stringify({x:Math.round(r.x+r.width/2),y:Math.round(r.y+r.height/2),w:Math.round(r.width),h:Math.round(r.height)})}return JSON.stringify(null)})()`;
const JS_SOCIAL_LINK_RAW = `(function(){var ls=document.querySelectorAll('a[href="/settings/profile"]');for(var i=ls.length-1;i>=0;i--){var ic=ls[i].querySelector('svg[icon-name]');if(ic&&ic.getAttribute('icon-name')==='add'){var r=ls[i].getBoundingClientRect();if(r.width>10&&r.height>10)return JSON.stringify({x:Math.round(r.x+r.width/2),y:Math.round(r.y+r.height/2),w:Math.round(r.width),h:Math.round(r.height)})}}return JSON.stringify(null)})()`;
const JS_SETTINGS_SOCIAL_SECTION = `(function(){function qs(root,s){var r=root.querySelector(s);if(r)return r;var all=root.querySelectorAll("*");for(var i=0;i<all.length;i++){if(all[i].shadowRoot){r=qs(all[i].shadowRoot,s);if(r)return r;}}return null}var el=qs(document,"[data-testid='social-links']");if(!el)return JSON.stringify(null);var r=el.getBoundingClientRect();if(r.width<10)return JSON.stringify(null);return JSON.stringify({x:Math.round(r.x+r.width/2),y:Math.round(r.y+r.height/2),w:Math.round(r.width),h:Math.round(r.height)})})()`;
const JS_SOCIAL_LINKS_OPEN_BTN = `(function(){function qs(root,s){var r=root.querySelector(s);if(r)return r;var all=root.querySelectorAll("*");for(var i=0;i<all.length;i++){if(all[i].shadowRoot){r=qs(all[i].shadowRoot,s);if(r)return r;}}return null}var sec=qs(document,"[data-testid='social-links']");if(!sec)return JSON.stringify(null);var btn=null;sec.querySelectorAll("button").forEach(function(b){if(btn)return;var ic=b.querySelector("svg[icon-name]");if(ic&&ic.getAttribute("icon-name")==="caret-right")btn=b;});if(!btn)return JSON.stringify(null);var r=btn.getBoundingClientRect();if(r.width<5)return JSON.stringify(null);return JSON.stringify({x:Math.round(r.x+r.width/2),y:Math.round(r.y+r.height/2),w:Math.round(r.width),h:Math.round(r.height)})})()`;
const JS_SETTINGS_CARET_BTN = `(function(){var mc=document.getElementById("main-content");if(!mc)return JSON.stringify(null);var vis=[];var skip=/delete|deactivate|two.factor|2fa|password|passkey/i;(function hunt(root){root.querySelectorAll('button').forEach(function(b){var r=b.getBoundingClientRect();if(r.width<10||r.height<10)return;if(r.bottom<0||r.top>innerHeight)return;var ic=b.querySelector('svg[icon-name]');if(!ic||ic.getAttribute('icon-name')!=='caret-right')return;var row=b.closest('label,[data-testid]');var tid=(row?row.getAttribute('data-testid')||'':'');if(skip.test(tid))return;vis.push({r:r,lab:tid.slice(0,30)});});var all=root.querySelectorAll("*");for(var j=0;j<all.length;j++)if(all[j].shadowRoot)hunt(all[j].shadowRoot);})(mc);if(!vis.length)return JSON.stringify(null);var p=vis[Math.floor(Math.random()*vis.length)];var rr=p.r;return JSON.stringify({x:Math.round(rr.x+rr.width/2),y:Math.round(rr.y+rr.height/2),w:Math.round(rr.width),h:Math.round(rr.height),attrs:{label:p.lab}})})()`;
const JS_VIEW_PROFILE_MENU = `(function(){var c=document.getElementById('user-drawer-content');if(!c)return JSON.stringify(null);var a=c.querySelector('a[noun="profile"]')||c.querySelector('a[href="/user/me/"]')||c.querySelector('a[href*="/user/me"]');if(!a)return JSON.stringify(null);var r=a.getBoundingClientRect();if(r.width<5)return JSON.stringify(null);return JSON.stringify({x:Math.round(r.x+r.width/2),y:Math.round(r.y+r.height/2),w:Math.round(r.width),h:Math.round(r.height),href:a.getAttribute('href')})})()`;
const JS_COMM_SUMMARY = `(function(){var s=document.querySelector("summary[aria-controls=communities_section]");if(!s)return JSON.stringify(null);var r=s.getBoundingClientRect();if(r.width<5)return JSON.stringify(null);return JSON.stringify({x:Math.round(r.x+r.width/2),y:Math.round(r.y+r.height/2),w:Math.round(r.width),h:Math.round(r.height),attrs:{expanded:s.getAttribute("aria-expanded")||""}})})()`;
const JS_COMM_STATE = `(function(){var cs=document.getElementById("communities_section");var s=document.querySelector("summary[aria-controls=communities_section]");return JSON.stringify({csDisplay:cs?getComputedStyle(cs).display:"",expanded:s?s.getAttribute("aria-expanded"):""})})()`;
const JS_MANAGE_LINK = `(function(){var cs=document.getElementById("communities_section");if(!cs)return JSON.stringify(null);var a=null;(function hunt(root){root.querySelectorAll("a").forEach(function(el){if(a)return;var svg=el.querySelector("svg[icon-name]");if(svg&&svg.getAttribute("icon-name")==="settings"){if((el.getAttribute("href")||"").indexOf("/communities")>=0)a=el;}});var all=root.querySelectorAll("*");for(var j=0;j<all.length;j++)if(all[j].shadowRoot)hunt(all[j].shadowRoot);})(cs);if(!a)return JSON.stringify(null);var r=a.getBoundingClientRect();if(r.width<5)return JSON.stringify(null);return JSON.stringify({x:Math.round(r.x+r.width/2),y:Math.round(r.y+r.height/2),w:Math.round(r.width),h:Math.round(r.height)})})()`;
const JS_COMM_FAV_POOL = `(function(){var fav=[],unfav=[];(function hunt(root,d){if(d>6)return;root.querySelectorAll("shreddit-favorite-button").forEach(function(h){var r=h.getBoundingClientRect();if(r.width<5)return;var ic=h.shadowRoot?h.shadowRoot.querySelector("svg[icon-name]"):null;var id=h.getAttribute("community-id")||"";var name=h.getAttribute("community-name")||"";if(!id)return;if(ic&&ic.getAttribute("icon-name")==="star-fill")fav.push({id:id,name:name});else unfav.push({id:id,name:name});});var all=root.querySelectorAll("*");for(var j=0;j<all.length;j++)if(all[j].shadowRoot)hunt(all[j].shadowRoot,d+1);})(document,0);return JSON.stringify({fav:fav,unfav:unfav})})()`;
const commFavBtnJs = (commId) => `(function(){var id=${JSON.stringify(commId)};var h=null;document.querySelectorAll("shreddit-favorite-button").forEach(function(x){if(x.getAttribute("community-id")===id)h=x;});if(!h||!h.shadowRoot)return JSON.stringify(null);var b=h.shadowRoot.querySelector("button");if(!b)return JSON.stringify(null);var r=b.getBoundingClientRect();if(r.width<5)return JSON.stringify(null);return JSON.stringify({x:Math.round(r.x+r.width/2),y:Math.round(r.y+r.height/2),w:Math.round(r.width),h:Math.round(r.height),attrs:{name:h.getAttribute("community-name")||""}})})()`;
const commFavStateJs = (commId) => `(function(){var id=${JSON.stringify(commId)};var h=null;document.querySelectorAll("shreddit-favorite-button").forEach(function(x){if(x.getAttribute("community-id")===id)h=x;});if(!h||!h.shadowRoot)return JSON.stringify(null);var ic=h.shadowRoot.querySelector("svg[icon-name]");return JSON.stringify({fav:!!(ic&&ic.getAttribute("icon-name")==="star-fill")})})()`;
const JS_COMM_FILTER_TABS = `(function(){var tabs=[];(function hunt(root,d){if(d>5)return;root.querySelectorAll("button").forEach(function(b){var cls=(b.className||"").toString();if(cls.indexOf("filter-button")<0)return;var r=b.getBoundingClientRect();if(r.width<5||r.height<5)return;if(r.bottom<0||r.top>innerHeight)return;tabs.push({x:Math.round(r.x+r.width/2),y:Math.round(r.y+r.height/2),w:Math.round(r.width),h:Math.round(r.height),attrs:{text:(b.textContent||"").replace(/\\s+/g," ").trim().slice(0,20)}})});var all=root.querySelectorAll("*");for(var j=0;j<all.length;j++)if(all[j].shadowRoot)hunt(all[j].shadowRoot,d+1)})(document,0);return JSON.stringify(tabs)})()`;
async function scrollInsideContainerIntoView(client, tabId, loc, js, focus) {
  let cur = loc;
  let vh = 800;
  try {
    const r = await client.viewportGet(tabId);
    if (r.vh) vh = r.vh;
  } catch {
  }
  if (cur.y >= 60 && cur.y <= vh - 80) return cur;
  const fx = clamp(focus.x, 1, 9999);
  const fy = clamp(focus.y, 1, 9999);
  await humanMouseMove(client, tabId, fx, fy);
  await humanPause(200, 400);
  try {
    await client.humanMouseDown(tabId, { x: fx, y: fy, button: "left" });
    await humanPause(30, 60);
    await client.humanMouseUp(tabId, { x: fx, y: fy, button: "left" });
  } catch {
  }
  await humanPause(300, 500);
  const needDown = cur.y > vh - 80;
  const target = needDown ? vh / 2 : vh / 2;
  const dist = Math.abs(cur.y - target);
  const key = needDown ? "ArrowDown" : "ArrowUp";
  const maxRounds = Math.min(10, Math.ceil(dist / 40) + 2);
  for (let i = 0; i < maxRounds; i++) {
    const presses = Math.min(5, Math.max(1, Math.ceil((dist - i * 200) / 40)));
    for (let p = 0; p < presses; p++) {
      try {
        await client.humanKeyboardPress(tabId, { key });
      } catch {
      }
      await humanPause(50, 100);
    }
    await humanPause(250, 450);
    const nl = await locateByJS(client, tabId, js);
    if (!nl) break;
    cur = nl;
    if (cur.y >= 60 && cur.y <= vh - 80) break;
  }
  return cur;
}
async function pageUrlStr(client, tabId) {
  try {
    const r = await client.pageUrl(tabId);
    return r.url ?? "";
  } catch {
    return "";
  }
}
async function readDark(client, tabId) {
  try {
    const r = await ev(client, tabId, JS_DARK_STATE);
    return !!r?.dark;
  } catch {
    return false;
  }
}
async function themeModalOpen(client, tabId) {
  try {
    return !!await ev(client, tabId, JS_THEME_MODAL_OPEN);
  } catch {
    return false;
  }
}
async function closeModal(client, tabId) {
  try {
    const c = await locateByJS(client, tabId, JS_MODAL_CLOSE);
    if (c) {
      await clickReliable(client, tabId, c, "modal close");
      await humanPause(700, 1300);
      return;
    }
    const c2 = await locateByJS(client, tabId, `(function(){var found=null;(function hunt(root,d){if(!root||d>3)return;root.querySelectorAll("button,[role=button]").forEach(function(b){if(found)return;var ic=b.querySelector("svg[icon-name]");if(ic&&ic.getAttribute("icon-name")==="close"){var r=b.getBoundingClientRect();if(r.width>8&&r.height>8&&r.bottom>0&&r.top<innerHeight)found={x:Math.round(r.x+r.width/2),y:Math.round(r.y+r.height/2),w:Math.round(r.width),h:Math.round(r.height)};}});if(!found){var all=root.querySelectorAll("*");for(var j=0;j<all.length;j++){if(all[j].shadowRoot)hunt(all[j].shadowRoot,d+1);}}})(document,0);return JSON.stringify(found)})()`);
    if (c2) {
      await clickReliable(client, tabId, c2, "modal close (global)");
      await humanPause(700, 1300);
    }
  } catch (e) {
    console.log(`[${kTag}] close modal skipped (non-fatal): ${e?.message || e}`);
  }
}
async function goToProfile(client, tabId) {
  await ensureTabFocus(client, tabId);
  try {
    const u = await pageUrlStr(client, tabId);
    if (u.includes("/user/") && !u.includes("/achievements") && !u.includes("/about/") && !u.includes("/avatar") && !u.includes("/settings")) return true;
  } catch {
  }
  if (!await openUserMenu(client, tabId)) return false;
  const vp = await pollLocate(client, tabId, JS_VIEW_PROFILE_MENU, 6);
  if (!vp) return false;
  try {
    await hoverWithHesitation(client, tabId, vp, { skipMoveAway: true });
  } catch (e) {
    if (e?.status !== 409) throw e;
  }
  await humanPause(3500, 5e3);
  return (await pageUrlStr(client, tabId)).includes("/user/");
}
async function browseSettings(client, tabId) {
  await humanScrollDown(client, tabId, 200 + Math.round(Math.random() * 300), {
    readPauseProbability: 0.3,
    scrollBackProbability: 0.2,
    noReadingFollow: true
  });
  await humanPause(1200, 2200);
  const SEGS = ["account", "emails", "notifications", "preferences", "privacy"];
  const n = Math.random() < 0.5 ? 1 : 2;
  const pool = shuffle(SEGS);
  for (const seg of pool.slice(0, n)) {
    let tabLoc = await locateAndScrollByJS(client, tabId, settingsTabJs(seg));
    if (!tabLoc) {
      tabLoc = await pollLocate(client, tabId, settingsTabJs(seg), 5);
    }
    if (!tabLoc) continue;
    try {
      await hoverWithHesitation(client, tabId, tabLoc, { skipMoveAway: true });
    } catch (e) {
      if (e?.status !== 409) continue;
    }
    await humanPause(3500, 5e3);
    await humanScrollDown(client, tabId, 300 + Math.round(Math.random() * 400), {
      readPauseProbability: 0.25,
      scrollBackProbability: 0.2,
      noReadingFollow: true
    });
    await humanPause(1e3, 2e3);
    try {
      const pts = await ev(client, tabId, JS_RANDOM_VIEW_POINTS);
      for (const p of pts || []) {
        await humanMouseMove(client, tabId, p.x, p.y);
        await humanPause(700, 1600);
      }
    } catch {
    }
  }
  if (Math.random() < 0.4) {
    try {
      const btn = await locateByJS(client, tabId, JS_SETTINGS_CARET_BTN);
      if (btn) {
        console.log(`[${kTag}] settings: peek modal row "${btn.attrs?.label || "?"}"`);
        await clickReliable(client, tabId, btn, `settings modal row: ${btn.attrs?.label || "?"}`);
        await humanPause(1500, 2800);
        await closeModal(client, tabId);
      }
    } catch (e) {
      console.log(`[${kTag}] settings modal peek skipped: ${e?.message || e}`);
    }
  }
}
async function openThemeModalViaMenu(client, tabId) {
  if (!await openUserMenu(client, tabId)) return false;
  const dm = await pollLocate(client, tabId, JS_DM_ITEM, 6);
  if (!dm) return false;
  await clickReliable(client, tabId, dm, "Display Mode (menu)");
  await humanPause(1500, 2500);
  return themeModalOpen(client, tabId);
}
async function openThemeModalViaSettings(client, tabId) {
  if (!await openUserMenu(client, tabId)) return false;
  const set = await pollLocate(client, tabId, menuLinkJs('a[href*="/settings"]'), 6);
  if (!set) return false;
  await hoverWithHesitation(client, tabId, set, { skipMoveAway: true });
  await humanPause(1e4, 13e3);
  const ptab = await locateAndScrollByJS(client, tabId, settingsTabJs("preferences"));
  if (!ptab) return false;
  await hoverWithHesitation(client, tabId, ptab, { skipMoveAway: true });
  await humanPause(3e3, 4500);
  const btn = await locateAndScrollByJS(client, tabId, JS_PREFS_DISPLAY_THEME_BTN);
  if (!btn) return false;
  await clickReliable(client, tabId, btn, "Display Mode (settings)");
  await humanPause(1500, 2500);
  return themeModalOpen(client, tabId);
}
async function actionDisplayMode(client, tabId) {
  await ensureTabFocus(client, tabId);
  const via = Math.random() < 0.5 ? "menu" : "settings";
  console.log(`[displaymode] entry=${via}`);
  let opened = via === "menu" ? await openThemeModalViaMenu(client, tabId) : await openThemeModalViaSettings(client, tabId);
  let entryUsed = via;
  if (!opened) {
    console.log(`[displaymode] ${via} entry failed, falling back`);
    opened = via === "menu" ? await openThemeModalViaSettings(client, tabId) : await openThemeModalViaMenu(client, tabId);
    entryUsed = via === "menu" ? "settings" : "menu";
  }
  if (!opened) {
    return { status: "failed", message: "could not open Display Mode modal", data: { entry: entryUsed } };
  }
  const beforeDark = await readDark(client, tabId);
  let currentN = 0;
  try {
    const sel = await ev(client, tabId, `(function(){var m=document.querySelector('rpl-modal-card.theme-switcher-modal-card');if(!m)return JSON.stringify(null);for(var i=0;i<3;i++){var li=m.querySelector('li[data-testid="theme-option-'+i+'"]');if(!li)continue;var d=li.querySelector('div[role="option"]');if(d&&d.getAttribute('aria-selected')==='true')return JSON.stringify({n:i})}return JSON.stringify(null)})()`);
    if (sel?.n !== void 0) currentN = sel.n;
  } catch {
  }
  const pool = [0, 1, 2].filter((x) => x !== currentN);
  const target = pool[Math.floor(Math.random() * pool.length)];
  const labels = ["Auto", "Light", "Dark"];
  console.log(`[displaymode] selected=${labels[currentN]}(${currentN}) -> target ${labels[target]}(${target})`);
  const opt = await pollLocate(client, tabId, themeOptionJs(target), 10);
  if (!opt) {
    await closeModal(client, tabId);
    return { status: "failed", message: `theme-option-${target} not found`, data: { entry: entryUsed } };
  }
  await hoverWithHesitation(client, tabId, opt, { skipMoveAway: true });
  await humanPause(600, 1100);
  const afterDark = await readDark(client, tabId);
  const changed = afterDark !== beforeDark;
  if (!changed) console.log(`[displaymode] effective theme unchanged (verify degraded)`);
  await closeModal(client, tabId);
  await briefBrowseAfterAction(client, tabId);
  return {
    status: "success",
    message: `display mode: ${labels[currentN]} -> ${labels[target]} (via ${entryUsed})`,
    data: { entry: entryUsed, before: labels[currentN], after: labels[target], beforeDark: beforeDark ? "dark" : "light", afterDark: afterDark ? "dark" : "light", changed }
  };
}
async function actionPremium(client, tabId) {
  await ensureTabFocus(client, tabId);
  if (!await openUserMenu(client, tabId)) return { status: "failed", message: "user menu not found" };
  const prem = await pollLocate(client, tabId, menuLinkJs('a[href="/premium"]'), 6);
  if (!prem) return { status: "failed", message: "premium menu entry not found" };
  try {
    await hoverWithHesitation(client, tabId, prem, { skipMoveAway: true });
  } catch (e) {
    if (e?.status !== 409) throw e;
  }
  await humanPause(4e3, 6e3);
  const landed = (await pageUrlStr(client, tabId)).includes("/premium");
  if (!landed) console.log("[premium] did not land on /premium (continuing to browse anyway)");
  await humanScrollDown(client, tabId, 400 + Math.round(Math.random() * 400), {
    readPauseProbability: 0.3,
    scrollBackProbability: 0.25,
    noReadingFollow: true
  });
  await humanPause(1200, 2400);
  try {
    const pts = await ev(client, tabId, JS_RANDOM_VIEW_POINTS);
    for (const p of pts || []) {
      await humanMouseMove(client, tabId, p.x, p.y);
      await humanPause(800, 1800);
    }
  } catch {
  }
  const nClicks = 1 + (Math.random() < 0.35 ? 1 : 0);
  for (let ci = 0; ci < nClicks; ci++) {
    const onPrem = (await pageUrlStr(client, tabId)).includes("/premium");
    if (!onPrem) await goBack(client, tabId);
    await humanScrollDown(client, tabId, 250 + Math.round(Math.random() * 200), { readPauseProbability: 0.1, scrollBackProbability: 0, noReadingFollow: true });
    await humanPause(800, 1400);
    try {
      const btn = await locateByJS(client, tabId, `(function(){var vis=[];document.querySelectorAll('svg[icon-name="caret-right"]').forEach(function(s){var r=s.getBoundingClientRect();if(r.width<10||r.bottom<0||r.top>innerHeight)return;var anc=s;for(var k=0;k<6;k++){anc=anc.parentElement;if(!anc)break;if(anc.tagName==='A'){var tt=(anc.textContent||'').replace(/\\\\s+/g,' ').trim();if(tt.length>3){vis.push({el:anc,text:tt});return;}}}anc=s;for(var k2=0;k2<6;k2++){anc=anc.parentElement;if(!anc)break;var t2=(anc.textContent||'').replace(/\\\\s+/g,' ').trim();if(t2.length>10&&anc.tagName!=='A'){vis.push({el:anc,text:t2});break;}}});if(vis.length>0){var pick=vis[Math.floor(Math.random()*vis.length)];var rr=pick.el.getBoundingClientRect();return JSON.stringify({x:Math.round(rr.x+rr.width/2),y:Math.round(rr.y+rr.height/2),w:Math.round(rr.width),h:Math.round(rr.height),attrs:{text:pick.text.slice(0,28)}})}return JSON.stringify(null)})()`);
      if (!btn) continue;
      console.log(`[premium] click feature: "${btn.attrs?.text || "?"}"`);
      let navigated = false;
      try {
        await hoverWithHesitation(client, tabId, btn, { skipMoveAway: true });
      } catch (e) {
        if (e?.status === 409 || String(e?.message || "").includes("navigation")) {
          navigated = true;
        } else {
          console.log(`[premium] feature click error: ${e?.message || e}`);
        }
      }
      await humanPause(1200, 2200);
      if (navigated) {
        await humanScrollDown(client, tabId, 200 + Math.round(Math.random() * 300), { readPauseProbability: 0.25, noReadingFollow: true });
        await humanPause(1e3, 2e3);
        await goBack(client, tabId);
      } else {
        await closeModal(client, tabId);
      }
    } catch {
    }
    await humanPause(800, 1400);
  }
  await briefBrowseAfterAction(client, tabId);
  await goBack(client, tabId);
  const left = !(await pageUrlStr(client, tabId)).includes("/premium");
  if (!left) console.log("[premium] still on /premium after goBack");
  return { status: "success", message: "browsed premium + content clicks + went back", data: { landed, left } };
}
async function actionAchievements(client, tabId) {
  await ensureTabFocus(client, tabId);
  let entryUsed = null;
  if (await goToProfile(client, tabId)) {
    await scrollToTopHuman(client, tabId);
    await humanPause(800, 1400);
    let vbtn = await locateByJS(client, tabId, JS_ACH_VIEW_ALL);
    if (vbtn) {
      vbtn = await scrollInsideContainerIntoView(client, tabId, vbtn, JS_ACH_VIEW_ALL, { x: 1347, y: 200 });
      console.log("[achievements] clicking profile 'View All' entry");
      try {
        await hoverWithHesitation(client, tabId, vbtn, { skipMoveAway: true });
      } catch (e) {
        if (e?.status !== 409) throw e;
      }
      await humanPause(4e3, 6e3);
      if ((await pageUrlStr(client, tabId)).includes("/achievements")) entryUsed = "profile";
    }
  }
  if (!entryUsed) {
    console.log("[achievements] profile entry did not reach /achievements, trying menu entry");
    if (await openUserMenu(client, tabId)) {
      const ach = await pollLocate(client, tabId, menuLinkJs('a[href$="/achievements"]'), 6);
      if (ach) {
        try {
          await hoverWithHesitation(client, tabId, ach, { skipMoveAway: true });
        } catch (e) {
          if (e?.status !== 409) throw e;
        }
        await humanPause(4e3, 6e3);
        if ((await pageUrlStr(client, tabId)).includes("/achievements")) entryUsed = "menu";
      }
    }
  }
  if (!entryUsed) {
    console.log("[achievements] no entry reached /achievements (banned account?), skipping");
    return { status: "skipped", message: "achievements entry not reachable (banned account?)", data: { entry: "profile+menu" } };
  }
  const landed = (await pageUrlStr(client, tabId)).includes("/achievements");
  if (!landed) console.log("[achievements] did not land on /achievements (continuing)");
  async function clickBadgeDetail(client2, tabId2, excludeTitles) {
    try {
      const excludeJS = JSON.stringify([...excludeTitles]);
      const ub = await locateAndScrollByJS(client2, tabId2, `(function(){var excl=new Set(${excludeJS});var vis=[];document.querySelectorAll("achievement-badge").forEach(function(badge){var t=badge.getAttribute("title")||"";if(excl.has(t))return;if(!badge.shadowRoot)return;var btn=badge.shadowRoot.querySelector("button.badge");if(!btn)return;var r=btn.getBoundingClientRect();if(r.width<30)return;vis.push({btn:btn,title:t});});if(!vis.length)return JSON.stringify(null);var p=vis[Math.floor(Math.random()*vis.length)];var r=p.btn.getBoundingClientRect();return JSON.stringify({x:Math.round(r.x+r.width/2),y:Math.round(r.y+r.height/2),w:Math.round(r.width),h:Math.round(r.height),attrs:{title:p.title}})})()`);
      if (!ub) return;
      const title = ub.attrs?.title || "";
      excludeTitles.add(title);
      console.log(`[achievements] click badge detail: ${title}`);
      await hoverWithHesitation(client2, tabId2, ub, { skipMoveAway: true });
      await humanPause(1500, 2800);
      const cb = await locateByJS(client2, tabId2, JS_ACH_DETAIL_CLOSE);
      if (cb) {
        await clickReliable(client2, tabId2, cb, "ach detail close");
        await humanPause(600, 1100);
      } else await closeModal(client2, tabId2);
      return title;
    } catch (e) {
      console.log(`[achievements] badge detail skipped: ${e?.message || e}`);
    }
  }
  const clickedBadges = /* @__PURE__ */ new Set();
  for (let i = 0; i < 4; i++) {
    await humanScrollDown(client, tabId, 450 + Math.round(Math.random() * 250), {
      readPauseProbability: 0.3,
      scrollBackProbability: 0.1
    });
    await humanPause(900, 1800);
    let carouselClicked = false;
    if (Math.random() < 0.4) {
      try {
        const cb = await locateByJS(client, tabId, `(function(){var vis=[];document.querySelectorAll("achievement-category").forEach(function(cat){if(!cat.shadowRoot)return;cat.shadowRoot.querySelectorAll("button").forEach(function(b){if(b.disabled||b.getAttribute("aria-disabled")==="true")return;var r=b.getBoundingClientRect();if(r.width<20||r.bottom<0||r.top>innerHeight)return;var ic=b.querySelector("svg[icon-name]");if(ic&&ic.getAttribute("icon-name")==="caret-right")vis.push(b);});});if(!vis.length)return JSON.stringify(null);var b=vis[Math.floor(Math.random()*vis.length)];var r=b.getBoundingClientRect();return JSON.stringify({x:Math.round(r.x+r.width/2),y:Math.round(r.y+r.height/2),w:Math.round(r.width),h:Math.round(r.height)})})()`);
        if (cb) {
          await humanClickElement(client, tabId, cb, { skipMoveAway: true });
          console.log("[achievements] carousel right");
          carouselClicked = true;
          await humanPause(400, 800);
        }
      } catch (e) {
        if (String(e?.message || "").includes("timeout")) console.log("[achievements] carousel timeout");
      }
    }
    try {
      const b = await locateByJS(client, tabId, achBadgeJs(false));
      if (b) {
        await humanMouseMove(client, tabId, b.x, b.y);
        console.log(`[achievements] hover: ${b.attrs?.title}`);
        await humanPause(700, 1500);
      }
    } catch {
    }
    if (Math.random() < (carouselClicked ? 0.6 : 0.2)) {
      await clickBadgeDetail(client, tabId, clickedBadges);
    }
  }
  if (Math.random() < 0.5) {
    try {
      const va = await locateByJS(client, tabId, `(function(){var vis=[];document.querySelectorAll("achievement-category").forEach(function(cat){if(!cat.shadowRoot)return;cat.shadowRoot.querySelectorAll("a[href]").forEach(function(a){var h=a.getAttribute("href")||"";if(h.indexOf("/achievements/c")<0)return;var r=a.getBoundingClientRect();if(r.width>20&&r.bottom>0&&r.top<innerHeight)vis.push(a);});});if(!vis.length)return JSON.stringify(null);var a=vis[Math.floor(Math.random()*vis.length)];var r=a.getBoundingClientRect();return JSON.stringify({x:Math.round(r.x+r.width/2),y:Math.round(r.y+r.height/2),w:Math.round(r.width),h:Math.round(r.height)})})()`);
      if (va) {
        console.log("[achievements] click view-all");
        const beforeUrl = await pageUrlStr(client, tabId);
        try {
          await hoverWithHesitation(client, tabId, va, { skipMoveAway: true });
        } catch (e) {
        }
        await humanPause(1500, 2500);
        const afterUrl = await pageUrlStr(client, tabId);
        if (afterUrl !== beforeUrl) {
          await humanScrollDown(client, tabId, 300 + Math.round(Math.random() * 400), { readPauseProbability: 0.25, noReadingFollow: true });
          await humanPause(1e3, 2e3);
          if (Math.random() < 0.4) {
            await clickBadgeDetail(client, tabId, clickedBadges);
          }
          await goBack(client, tabId);
        }
      }
    } catch (e) {
      console.log(`[achievements] view-all skipped: ${e?.message || e}`);
    }
  }
  if (Math.random() < 0.5) {
    await clickBadgeDetail(client, tabId, clickedBadges);
  }
  await briefBrowseAfterAction(client, tabId);
  return { status: "success", message: "browsed achievements detail", data: { landed, entry: entryUsed } };
}
async function actionProfileUpdate(client, tabId) {
  await ensureTabFocus(client, tabId);
  if (!await goToProfile(client, tabId)) return { status: "failed", message: "could not reach profile page" };
  await scrollToTopHuman(client, tabId);
  await humanPause(800, 1400);
  let link = await locateByJS(client, tabId, JS_PROFILE_UPDATE_LINK_RAW);
  if (link) {
    link = await scrollInsideContainerIntoView(client, tabId, link, JS_PROFILE_UPDATE_LINK_RAW, { x: 1347, y: 200 });
  }
  if (!link) return { status: "failed", message: "profile Update link not found on profile page" };
  try {
    await hoverWithHesitation(client, tabId, link, { skipMoveAway: true });
  } catch (e) {
    if (e?.status !== 409) throw e;
  }
  await humanPause(4e3, 6e3);
  await browseSettings(client, tabId);
  await briefBrowseAfterAction(client, tabId);
  return { status: "success", message: "profile Update \u2192 settings browsed" };
}
async function actionModTools(client, tabId) {
  await ensureTabFocus(client, tabId);
  if (!await goToProfile(client, tabId)) return { status: "failed", message: "could not reach profile page" };
  await scrollToTopHuman(client, tabId);
  await humanPause(800, 1400);
  let link = await locateByJS(client, tabId, JS_MOD_TOOLS_LINK_RAW);
  if (link) {
    link = await scrollInsideContainerIntoView(client, tabId, link, JS_MOD_TOOLS_LINK_RAW, { x: 1347, y: 200 });
  }
  if (!link) return { status: "skipped", message: "mod tools Update link not found on profile page", data: { entry: "profile" } };
  try {
    await hoverWithHesitation(client, tabId, link, { skipMoveAway: true });
  } catch (e) {
    if (e?.status !== 409) throw e;
  }
  await humanPause(4e3, 6e3);
  await humanScrollDown(client, tabId, 300 + Math.round(Math.random() * 400), {
    readPauseProbability: 0.3,
    scrollBackProbability: 0.15
  });
  await humanPause(1e3, 2e3);
  await briefBrowseAfterAction(client, tabId);
  await goBack(client, tabId);
  return { status: "success", message: "mod tools browsed + back" };
}
async function actionAvatarUpdate(client, tabId) {
  await ensureTabFocus(client, tabId);
  if (!await goToProfile(client, tabId)) return { status: "failed", message: "could not reach profile page" };
  await humanScrollDown(client, tabId, 400 + Math.round(Math.random() * 200), {
    readPauseProbability: 0.1,
    scrollBackProbability: 0,
    noReadingFollow: true
  });
  await humanPause(800, 1500);
  let link = await locateByJS(client, tabId, JS_AVATAR_UPDATE_LINK_RAW);
  if (link) {
    link = await scrollInsideContainerIntoView(client, tabId, link, JS_AVATAR_UPDATE_LINK_RAW, { x: 1347, y: 200 });
  }
  if (!link) return { status: "failed", message: "avatar Update link not found" };
  try {
    await hoverWithHesitation(client, tabId, link, { skipMoveAway: true });
  } catch (e) {
    if (e?.status !== 409) throw e;
  }
  await humanPause(4e3, 6e3);
  await humanScrollDown(client, tabId, 300 + Math.round(Math.random() * 400), {
    readPauseProbability: 0.3,
    scrollBackProbability: 0.15
  });
  await humanPause(1e3, 2e3);
  await briefBrowseAfterAction(client, tabId);
  await goBack(client, tabId);
  return { status: "success", message: "avatar page browsed + back" };
}
async function actionSocialLink(client, tabId) {
  await ensureTabFocus(client, tabId);
  if (!await goToProfile(client, tabId)) return { status: "failed", message: "could not reach profile page" };
  await scrollToTopHuman(client, tabId);
  await humanPause(800, 1400);
  let slink = await locateByJS(client, tabId, JS_SOCIAL_LINK_RAW);
  if (slink) {
    slink = await scrollInsideContainerIntoView(client, tabId, slink, JS_SOCIAL_LINK_RAW, { x: 1347, y: 200 });
  }
  if (!slink) return { status: "skipped", message: "Add Social Link not found on profile page", data: { entry: "profile" } };
  const instanceId = await findInstanceIdForTab(client, tabId);
  const beforeIds = instanceId ? new Set((await client.instanceTabsList(instanceId)).map((t) => t.id || t.tabId)) : /* @__PURE__ */ new Set();
  console.log("[social-link] middle-clicking entry to open settings in new tab");
  try {
    await middleClickAt(client, tabId, slink);
  } catch (e) {
    console.log(`[social-link] middle-click err: ${e?.message || e}`);
  }
  const newTab = await waitForNewTab(client, instanceId, beforeIds, 8e3);
  let browseTabId = tabId;
  let openedNewTab = false;
  if (newTab) {
    browseTabId = newTab.id || newTab.tabId;
    openedNewTab = true;
    console.log(`[social-link] opened new tab ${browseTabId} \u2014 ${(newTab.url || "").slice(0, 50)}`);
    try {
      await client.tabFocus(browseTabId);
    } catch {
    }
    await humanPause(5e3, 7e3);
  } else {
    console.log("[social-link] middle-click did not open new tab, fallback via profile Update link");
    const plink = await locateByJS(client, tabId, JS_PROFILE_UPDATE_LINK_RAW);
    if (plink) {
      const plinkS = await scrollInsideContainerIntoView(client, tabId, plink, JS_PROFILE_UPDATE_LINK_RAW, { x: 1347, y: 200 });
      try {
        await hoverWithHesitation(client, tabId, plinkS, { skipMoveAway: true });
      } catch (e) {
        if (e?.status !== 409) throw e;
      }
      await humanPause(4e3, 6e3);
    }
    if (!(await pageUrlStr(client, tabId)).includes("/settings/profile")) {
      await briefBrowseAfterAction(client, tabId);
      return { status: "skipped", message: "social link entry did not reach settings page", data: { entry: "profile" } };
    }
  }
  const sec = await locateAndScrollByJS(client, browseTabId, JS_SETTINGS_SOCIAL_SECTION);
  if (!sec) {
    console.log("[social-link] Social links section not found, generic settings browse");
    await browseSettings(client, browseTabId);
  } else {
    console.log(`[social-link] at Social links section @ (${sec.x},${sec.y})`);
    const openBtn = await locateByJS(client, browseTabId, JS_SOCIAL_LINKS_OPEN_BTN);
    if (!openBtn) {
      console.log("[social-link] open-modal button not found in section, generic browse");
      await browseSettings(client, browseTabId);
    } else {
      try {
        await hoverWithHesitation(client, browseTabId, openBtn, { skipMoveAway: true });
      } catch (e) {
        if (e?.status !== 409) throw e;
      }
      await humanPause(1500, 2500);
      try {
        await humanScrollDown(client, browseTabId, 150 + Math.round(Math.random() * 200), {
          readPauseProbability: 0.2,
          scrollBackProbability: 0.1,
          noReadingFollow: true
        });
        await humanPause(900, 1600);
        try {
          const modalBtn = await locateByJS(client, browseTabId, `(function(){function vis(r){return r.width>10&&r.height>10&&r.bottom>0&&r.top<innerHeight;}var mods=document.querySelectorAll('faceplate-modal,rpl-modal-card,[role="dialog"],rpl-popover');for(var i=0;i<mods.length;i++){var m=mods[i];if(!vis(m.getBoundingClientRect()))continue;var items=[];m.querySelectorAll('button,a,[role="button"]').forEach(function(el){var r=el.getBoundingClientRect();if(!vis(r))return;if(el.querySelector('svg[icon-name="close"]'))return;items.push(el);});if(!items.length)continue;var p=items[Math.floor(Math.random()*items.length)];var r=p.getBoundingClientRect();return JSON.stringify({x:Math.round(r.x+r.width/2),y:Math.round(r.y+r.height/2),w:Math.round(r.width),h:Math.round(r.height)})}return JSON.stringify(null)})()`);
          if (modalBtn) {
            console.log("[social-link] hover a modal item");
            await hoverWithHesitation(client, browseTabId, modalBtn, { skipMoveAway: true });
            await humanPause(1e3, 2e3);
          }
        } catch {
        }
      } catch {
      }
      await humanPause(600, 1200);
      await closeModal(client, browseTabId);
    }
  }
  await briefBrowseAfterAction(client, browseTabId);
  if (openedNewTab) {
    try {
      await client.tabFocus(tabId);
    } catch {
    }
    await humanPause(500, 1e3);
    try {
      await client.tabClose(browseTabId);
    } catch {
    }
  }
  return { status: "success", message: "social links modal opened + browsed" };
}
async function toggleCommunityFavorite(client, tabId, commId, commName, action) {
  const want = action === "add";
  let loc = await locateAndScrollByJS(client, tabId, commFavBtnJs(commId));
  if (!loc) {
    for (let i = 0; i < 3; i++) {
      await humanScrollDown(client, tabId, 200, { readPauseProbability: 0, scrollBackProbability: 0, noReadingFollow: true });
      await humanPause(500, 800);
      loc = await locateAndScrollByJS(client, tabId, commFavBtnJs(commId));
      if (loc) break;
    }
  }
  if (!loc) {
    console.log(`[manage-communities] ${commName}: button not found`);
    return false;
  }
  for (let attempt = 0; attempt < 2; attempt++) {
    loc = await locateByJS(client, tabId, commFavBtnJs(commId)) || loc;
    try {
      await clickReliable(client, tabId, loc, `${action} ${commName}${attempt ? " (retry)" : ""}`);
    } catch (e) {
      console.log(`[manage-communities] ${commName}: click err ${e?.message || e}`);
      return false;
    }
    await humanPause(1200, 2e3);
    let ok = false;
    try {
      const s = await ev(client, tabId, commFavStateJs(commId));
      ok = !!s?.fav === want;
    } catch {
    }
    if (ok) {
      console.log(`[manage-communities] ${commName}: ${action} -> \u2713`);
      return true;
    }
    console.log(`[manage-communities] ${commName}: ${action} -> \u2717(attempt ${attempt + 1}), re-locate + retry`);
  }
  console.log(`[manage-communities] ${commName}: ${action} -> \u2717(unverified)`);
  return false;
}
async function actionManageCommunities(client, tabId) {
  await ensureTabFocus(client, tabId);
  const k = "manage-communities";
  let url = await pageUrlStr(client, tabId);
  if (!url.includes("/communities")) {
    if (!url.includes("reddit.com")) {
      await client.tabNav(tabId, "https://www.reddit.com/");
      await humanPause(5e3, 7e3);
    }
    await pollLocate(client, tabId, JS_COMM_SUMMARY, 10);
    try {
      const st = await ev(client, tabId, JS_COMM_STATE);
      console.log(`[${k}] communities_section: display=${st?.csDisplay} expanded=${st?.expanded}`);
      if (st && (st.csDisplay === "none" || st.expanded === "false")) {
        const sum = await pollLocate(client, tabId, JS_COMM_SUMMARY, 6);
        if (sum) {
          try {
            await clickReliable(client, tabId, sum, "expand communities section");
          } catch (e) {
            if (e?.status !== 409) console.log(`[${k}] expand err: ${e?.message || e}`);
          }
          await humanPause(1500, 2500);
        }
      }
    } catch {
    }
    let link = await pollLocate(client, tabId, JS_MANAGE_LINK, 8);
    if (!link) return { status: "failed", message: "Manage Communities link not found in left nav" };
    link = await scrollInsideContainerIntoView(client, tabId, link, JS_MANAGE_LINK, { x: 120, y: 70 });
    console.log(`[${k}] click Manage Communities @ (${link.x},${link.y})`);
    try {
      await hoverWithHesitation(client, tabId, link, { skipMoveAway: true });
    } catch (e) {
      if (e?.status !== 409) throw e;
    }
    await humanPause(4e3, 6e3);
    if (!(await pageUrlStr(client, tabId)).includes("/communities")) {
      const link2 = await locateByJS(client, tabId, JS_MANAGE_LINK);
      if (link2) {
        const link2s = await scrollInsideContainerIntoView(client, tabId, link2, JS_MANAGE_LINK, { x: 120, y: 70 });
        console.log(`[${k}] retry click Manage Communities @ (${link2s.x},${link2s.y})`);
        try {
          await hoverWithHesitation(client, tabId, link2s, { skipMoveAway: true });
        } catch (e) {
          if (e?.status !== 409) throw e;
        }
        await humanPause(4e3, 6e3);
      }
    }
  }
  const landed = (await pageUrlStr(client, tabId)).includes("/communities");
  if (!landed) return { status: "failed", message: "did not land on /communities" };
  for (let s = 0; s < 2; s++) {
    await humanScrollDown(client, tabId, 250 + Math.round(Math.random() * 200), {
      readPauseProbability: 0.1,
      scrollBackProbability: 0,
      noReadingFollow: true
    });
    await humanPause(700, 1200);
  }
  const pool = await ev(client, tabId, JS_COMM_FAV_POOL);
  const fav = pool?.fav || [];
  const unfav = pool?.unfav || [];
  const F = fav.length;
  console.log(`[${k}] communities: favorited=${F} unfav=${unfav.length}`);
  const pickN = () => 1 + Math.floor(Math.random() * 3);
  let toAdd = [];
  let toRemove = [];
  const wantAdd = Math.random() < 0.5;
  if (wantAdd) {
    if (F >= 6) {
      console.log(`[${k}] random=add but F=${F}\u22656, skip`);
    } else {
      const n = Math.min(unfav.length, pickN());
      const cap = 6 - F;
      const n2 = Math.min(n, cap);
      toAdd = shuffle(unfav).slice(0, n2);
      if (n2 < n) console.log(`[${k}] random=add n=${n} capped to ${n2} (F=${F}, limit 6)`);
    }
  } else {
    if (F === 0) {
      console.log(`[${k}] random=remove but F=0, skip`);
    } else {
      const n = Math.min(fav.length, pickN());
      toRemove = shuffle(fav).slice(0, n);
    }
  }
  console.log(`[${k}] plan: add [${toAdd.map((c) => c.name).join(", ")}] | remove [${toRemove.map((c) => c.name).join(", ")}]`);
  for (const c of toAdd) {
    await toggleCommunityFavorite(client, tabId, c.id, c.name, "add");
    await humanPause(600, 1200);
  }
  for (const c of toRemove) {
    await toggleCommunityFavorite(client, tabId, c.id, c.name, "remove");
    await humanPause(600, 1200);
  }
  if (Math.random() < 0.5) {
    try {
      const tabs = await ev(client, tabId, JS_COMM_FILTER_TABS);
      if (Array.isArray(tabs) && tabs.length > 0) {
        const pick = tabs[Math.floor(Math.random() * tabs.length)];
        console.log(`[${k}] browse filter tab: "${pick.attrs?.text || ""}"`);
        try {
          await clickReliable(client, tabId, pick, `filter tab: ${pick.attrs?.text || ""}`);
        } catch (e) {
          if (e?.status !== 409) console.log(`[${k}] filter tab click err: ${e?.message || e}`);
        }
        await humanPause(1500, 2500);
        await humanScrollDown(client, tabId, 200 + Math.round(Math.random() * 200), { readPauseProbability: 0.2, noReadingFollow: true });
        await humanPause(800, 1400);
      }
    } catch (e) {
      console.log(`[${k}] filter tab skipped: ${e?.message || e}`);
    }
  }
  await briefBrowseAfterAction(client, tabId);
  await goBack(client, tabId);
  const finalF = Math.max(0, F + toAdd.length - toRemove.length);
  return {
    status: "success",
    message: `communities: fav ${F} -> ~${finalF} (added ${toAdd.length}, removed ${toRemove.length})`,
    data: { before: F, added: toAdd.length, removed: toRemove.length, addedNames: toAdd.map((c) => c.name), removedNames: toRemove.map((c) => c.name) }
  };
}
async function runAction(client, tabId, action) {
  try {
    let r;
    if (action === "displaymode") r = await actionDisplayMode(client, tabId);
    else if (action === "premium") r = await actionPremium(client, tabId);
    else if (action === "achievements") r = await actionAchievements(client, tabId);
    else if (action === "profile-update") r = await actionProfileUpdate(client, tabId);
    else if (action === "mod-tools") r = await actionModTools(client, tabId);
    else if (action === "avatar-update") r = await actionAvatarUpdate(client, tabId);
    else if (action === "social-link") r = await actionSocialLink(client, tabId);
    else r = await actionManageCommunities(client, tabId);
    return { ...r, action };
  } catch (e) {
    console.log(`[${kTag}] ${action} threw: ${e?.message || e}`);
    return { status: "failed", message: `${action}: ${e?.message || e}`, action };
  }
}
async function main() {
  const cli = await getCliOptions();
  const tabId = requireTabId();
  const actionArg = getCliArg("action");
  let actions;
  if (actionArg) {
    if (!ALL_ACTIONS.includes(actionArg)) {
      console.log(JSON.stringify({ status: "failed", message: `invalid action "${actionArg}" (allowed: ${ALL_ACTIONS.join(", ")})` }));
      await processExit(1);
    }
    actions = [actionArg];
  } else {
    const n = Math.random() < 0.5 ? 1 : 2;
    const pool = shuffle(ALL_ACTIONS);
    actions = pool.slice(0, n);
  }
  console.log(`[${kTag}] actions: ${actions.join(", ")}`);
  const client = new PinchTabClient({ baseUrl: cli.baseUrl, token: cli.token });
  const results = [];
  for (const a of actions) {
    const r = await runAction(client, tabId, a);
    console.log(`[${kTag}] ${a}: ${r.status} \u2014 ${r.message}`);
    results.push(r);
    if (actions.indexOf(a) < actions.length - 1) await humanPause(1500, 3500);
  }
  const anyFailed = results.some((r) => r.status === "failed");
  const overall = {
    status: anyFailed ? "failed" : "success",
    message: `ran ${results.length} action(s): ${results.map((r) => `${r.action}=${r.status}`).join(", ")}`,
    data: { actionsRun: results }
  };
  outputResult(overall);
}
runMain(main, "reddit-random-browse.ts");
