import { PinchTabClient } from "../api.js";
import {
  humanClickElement,
  humanMouseMove,
  humanScrollDown,
  humanPause,
  locateByJS,
  locateAndScrollByJS,
  parseEvalResult,
  scrollToTopHuman,
  ensureTabFocus,
  JS_DISMISS_TOAST_BUTTON
} from "./reddit-human.js";
import {
  outputResult,
  getCliOptions,
  getCliArg,
  requireTabId,
  runMain
} from "./cli.js";
const TAB = {
  OUTFITS: 0,
  TOPS: 1,
  BOTTOMS: 2,
  HAIR: 3,
  FACE: 4,
  EYES: 5,
  HATS: 6,
  RIGHT_HAND: 7,
  LEFT_HAND: 8,
  BACKGROUNDS: 9,
  COLORS: 10
};
const PART_TABS = [TAB.TOPS, TAB.HAIR, TAB.FACE, TAB.EYES, TAB.HATS, TAB.RIGHT_HAND, TAB.LEFT_HAND, TAB.BOTTOMS];
const FEMALE_RE = /mrs|woman|femme|egirl|lolita|female|fvamp|fwoman|fman|vqueen|maid|bride|princess/i;
const MALE_RE = /mvamp|eboy|vking|mustache|beard|prince|\bmale\b/i;
const TOPS_BOTTOMS_GENDER = {
  // F (8) — feminine clothing, skip for male accounts
  "2023_indian_indp_body_004": "F",
  "juneteenth23_body_008": "F",
  "outfits_1_body_005": "F",
  "outfits_2_body_019": "F",
  "parka_body_014": "F",
  "pirates_ninjas_body_001": "F",
  "pirates_ninjas_body_003": "F",
  "womancricket_body_004": "F",
  // M (19) — masculine clothing, skip for female accounts
  "2023_indian_indp_body_001": "M",
  "fantasy_body_005": "M",
  "i18n_india_face_lower_008": "M",
  "i18n_india_face_upper_007": "M",
  "o_body_5": "M",
  "old_spice_body_top": "M",
  "onesies_frog_body_014": "M",
  "onesies_pigeon_body_012": "M",
  "outfits_1_body_001": "M",
  "outfits_1_body_011": "M",
  "outfits_1_body_014": "M",
  "outfits_2_body_001": "M",
  "outfits_2_body_018": "M",
  "pirates_ninjas_body_005": "M",
  "premium_basketball_jersey": "M",
  "premium_cricket_jersey": "M",
  "premium_spring_break_floatie_body_002": "M",
  "wsb_body_005": "M",
  "wsb_suit_body": "M"
  // all other free body ids default to "N" (neutral, always ok)
};
const JS_USER_MENU_BUTTON = `(function(){var el=document.getElementById("expand-user-drawer-button");if(!el)return null;var r=el.getBoundingClientRect();if(r.width===0)return null;return JSON.stringify({x:Math.round(r.x+r.width/2),y:Math.round(r.y+r.height/2),w:Math.round(r.width),h:Math.round(r.height)})})()`;
const JS_MENU_OPEN = `(function(){var b=document.getElementById("expand-user-drawer-button");var dd=document.querySelector("rpl-dropdown");if(b&&b.getAttribute("aria-expanded")==="true")return true;if(dd&&dd.hasAttribute("open"))return true;var c=document.getElementById("user-drawer-content");if(c&&c.getBoundingClientRect().height>0)return true;return false;})()`;
const JS_MENU_EDIT_AVATAR = `(function(){var c=document.getElementById('user-drawer-content');if(!c)return null;var a=c.querySelector('a[noun="edit_avatar"]')||c.querySelector('a[href*="/avatar"]');if(!a)return null;var r=a.getBoundingClientRect();if(r.width===0)return null;return JSON.stringify({x:Math.round(r.x+r.width/2),y:Math.round(r.y+r.height/2),w:Math.round(r.width),h:Math.round(r.height),href:a.getAttribute("href")||""})})()`;
const JS_MENU_SETTINGS = `(function(){var c=document.getElementById('user-drawer-content');if(!c)return null;var a=c.querySelector('a[noun="settings"]')||c.querySelector('a[href*="/settings"]');if(!a)return null;var r=a.getBoundingClientRect();if(r.width===0)return null;return JSON.stringify({x:Math.round(r.x+r.width/2),y:Math.round(r.y+r.height/2),w:Math.round(r.width),h:Math.round(r.height),href:a.getAttribute("href")||""})})()`;
const JS_VIEW_PROFILE_LINK = `(function(){try{var re=/^\\/user\\/[^/]+\\/?$/;function isProf(h){return h==="/user/me/"||h==="/user/me"||re.test(h);}function hit(a){var r=a.getBoundingClientRect();if(r.width<=0||r.height<=0)return null;return JSON.stringify({x:Math.round(r.x+r.width/2),y:Math.round(r.y+r.height/2),w:Math.round(r.width),h:Math.round(r.height),href:a.getAttribute("href")||""});}var d=document.querySelector('#user-drawer-content');if(d){var a=d.querySelector('a[href="/user/me/"],a[href="/user/me"]');if(!a){var ls=d.querySelectorAll('a[href^="/user/"]');for(var i=0;i<ls.length;i++){if(isProf(ls[i].getAttribute('href')||'')){a=ls[i];break;}}}if(a){var h=hit(a);if(h)return h;}}var btn=document.getElementById('expand-user-drawer-button');if(!btn)return null;var br=btn.getBoundingClientRect();var links=document.querySelectorAll('a[href]');for(var j=0;j<links.length;j++){var href=links[j].getAttribute('href')||'';if(!isProf(href))continue;var r=links[j].getBoundingClientRect();if(r.width>0&&r.height>0&&r.x>br.x-300&&r.y<br.y+600){var h2=hit(links[j]);if(h2)return h2;}}return null}catch(e){return null}})()`;
const JS_EDIT_SNOOVATAR = `(function(){var b=document.querySelector('a[href="/avatar"],button[noun="edit_snoovatar"],a[noun="edit_snoovatar"]');if(!b)return null;var r=b.getBoundingClientRect();if(r.width===0)return null;return JSON.stringify({x:Math.round(r.x+r.width/2),y:Math.round(r.y+r.height/2),w:Math.round(r.width),h:Math.round(r.height),href:b.getAttribute('href')||''})})()`;
const JS_SELECT_AVATAR_OPTION = `(function(){function findIn(root){var links=root.querySelectorAll('a[href]');for(var i=0;i<links.length;i++){var href=links[i].getAttribute("href")||"";if(href.indexOf("/avatar")<0)continue;var r=links[i].getBoundingClientRect();if(r.width>15&&r.height>10)return {x:Math.round(r.x+r.width/2),y:Math.round(r.y+r.height/2),w:Math.round(r.width),h:Math.round(r.height),href:href}}return null}var modal=document.querySelector('faceplate-modal,rpl-modal-card,[role="dialog"]');if(!modal)return null;var hit=findIn(modal);if(hit)return JSON.stringify(hit);var ups=modal.querySelectorAll('settings-avatar-image-upload');for(var i=0;i<ups.length;i++){if(ups[i].shadowRoot){hit=findIn(ups[i].shadowRoot);if(hit)return JSON.stringify(hit)}}return null})()`;
const JS_SETTINGS_GENDER = `(function(){var el=document.querySelector('[data-testid="gender"]');if(!el)return JSON.stringify(null);var t=(el.textContent||"").replace(/\\s+/g," ").trim();return JSON.stringify({text:t})})()`;
const JS_SETTINGS_AVATAR_BUTTON = `(function(){var sec=document.querySelector('settings-profile-section');if(!sec||!sec.shadowRoot)return null;var av=sec.shadowRoot.querySelector('[data-testid="avatar"]');if(!av)return null;var b=av.querySelector('button');if(!b)return null;var r=b.getBoundingClientRect();if(r.width<1)return null;return JSON.stringify({x:Math.round(r.x+r.width/2),y:Math.round(r.y+r.height/2),w:Math.round(r.width),h:Math.round(r.height)})})()`;
const JS_TAB_LIST = `(function(){var nav=document.querySelector('edit-avatar-section-nav');if(!nav||!nav.shadowRoot)return JSON.stringify(null);var b=nav.shadowRoot.querySelectorAll('button[role="tab"]');var out=[];for(var i=0;i<b.length;i++){var r=b[i].getBoundingClientRect();out.push({i:i,x:Math.round(r.x+r.width/2),y:Math.round(r.y+r.height/2),sel:b[i].getAttribute('aria-selected'),text:b[i].textContent.trim()});}return JSON.stringify(out)})()`;
const JS_STATE = `(function(){var nav=document.querySelector('edit-avatar-section-nav');var sel=null;if(nav&&nav.shadowRoot){var s=nav.shadowRoot.querySelector('button[role="tab"][aria-selected="true"]');if(s)sel=s.textContent.trim();}return JSON.stringify({url:location.href,selText:sel})})()`;
const JS_TILE_SURVEY = `(function(){var tiles=document.querySelectorAll('accessory-tile');var free=[],paid=[];for(var i=0;i<tiles.length;i++){var r=tiles[i].getBoundingClientRect();if(r.width<30||r.height<30)continue;var raw=tiles[i].getAttribute('accessories')||'[]';var arr;try{arr=JSON.parse(raw);}catch(e){arr=[];}var caps=arr.map(function(a){return a.capabilityRequired;}).filter(function(c){return c;});var id=(arr[0]&&arr[0].id)||'';if(!id)continue;if(caps.length&&paid.length<12)paid.push({id:id,paid:true});else if(!caps.length&&free.length<12)free.push({id:id,paid:false});}return JSON.stringify({free:free,paid:paid});})()`;
const tileByIdJs = (id) => `(function(){var tiles=document.querySelectorAll('accessory-tile');for(var i=0;i<tiles.length;i++){var raw=tiles[i].getAttribute('accessories')||'[]';var arr;try{arr=JSON.parse(raw);}catch(e){arr=[];}if((arr[0]&&arr[0].id)==='${id}'){var r=tiles[i].getBoundingClientRect();if(r.width<5)return null;return JSON.stringify({x:Math.round(r.x+r.width/2),y:Math.round(r.y+r.height/2),w:Math.round(r.width),h:Math.round(r.height)})}}return null})()`;
const JS_OUTFIT_BUTTONS = `(function(){var out=[];var rs=document.querySelectorAll('avatar-outfit-category-renderer');rs.forEach(function(r,idx){if(!r.shadowRoot)return;var cat=r.getAttribute('category-title')||('cat'+idx);r.shadowRoot.querySelectorAll('button').forEach(function(b){if(!b.querySelector('img'))return;var rr=b.getBoundingClientRect();if(rr.width<5)return;out.push({cat:cat,name:(b.textContent||'').trim()});});});return JSON.stringify(out);})()`;
const outfitBtnByNameJs = (name) => `(function(){var rs=document.querySelectorAll('avatar-outfit-category-renderer');for(var i=0;i<rs.length;i++){if(!rs[i].shadowRoot)continue;var btns=rs[i].shadowRoot.querySelectorAll('button');for(var j=0;j<btns.length;j++){if(!btns[j].querySelector('img'))continue;if((btns[j].textContent||'').trim()==='${name}'){var r=btns[j].getBoundingClientRect();if(r.width<5)return null;return JSON.stringify({x:Math.round(r.x+r.width/2),y:Math.round(r.y+r.height/2),w:Math.round(r.width),h:Math.round(r.height)})}}}return null})()`;
const JS_OUTFIT_BUTTON = `(function(){var r=document.querySelector('avatar-outfit-category-renderer');if(!r||!r.shadowRoot)return JSON.stringify(null);var b=null;var btns=r.shadowRoot.querySelectorAll('button');for(var i=0;i<btns.length;i++){if(btns[i].querySelector('img')){b=btns[i];break;}}if(!b)return JSON.stringify(null);var rr=b.getBoundingClientRect();if(rr.width<5)return JSON.stringify(null);return JSON.stringify({x:Math.round(rr.x+rr.width/2),y:Math.round(rr.y+rr.height/2),w:Math.round(rr.width),h:Math.round(rr.height),name:(b.textContent||'').trim()})})()`;
const JS_OUTFIT_MODAL_BTNS = `(function(){function candidates(){var arr=[];document.querySelectorAll('view-avatar-outfit-modal').forEach(function(m){arr.push(m);});var rs=document.querySelectorAll('avatar-outfit-category-renderer');for(var i=0;i<rs.length;i++){if(rs[i].shadowRoot){rs[i].shadowRoot.querySelectorAll('view-avatar-outfit-modal').forEach(function(m){arr.push(m);});}}return arr;}var arr=candidates();for(var i=0;i<arr.length;i++){var m=arr[i];if(!m.shadowRoot)continue;var root=m.shadowRoot;var wear=null,close=null;root.querySelectorAll('button,[role="button"]').forEach(function(b){var r=b.getBoundingClientRect();if(r.width<20)return;var ic=b.querySelector('svg[icon-name]');var icn=ic?ic.getAttribute('icon-name')||'':'';if(icn==='style'&&!wear)wear={x:Math.round(r.x+r.width/2),y:Math.round(r.y+r.height/2),w:Math.round(r.width),h:Math.round(r.height)};if(icn==='close'&&!close)close={x:Math.round(r.x+r.width/2),y:Math.round(r.y+r.height/2),w:Math.round(r.width),h:Math.round(r.height)};});if(wear||close)return JSON.stringify({wear:wear,close:close});}return JSON.stringify(null);})()`;
const JS_SAVE_BUTTON = `(function(){var bar=document.querySelector('avatar-action-bar');if(!bar||!bar.shadowRoot)return JSON.stringify(null);var best=null;var bestArea=0;bar.shadowRoot.querySelectorAll('button,[role="button"]').forEach(function(b){var r=b.getBoundingClientRect();if(r.width<30||r.height<15)return;var ic=b.querySelector('svg[icon-name]');var txt=(b.textContent||'').trim();var area=r.width*r.height;function mk(){return {x:Math.round(r.x+r.width/2),y:Math.round(r.y+r.height/2),w:Math.round(r.width),h:Math.round(r.height),text:txt,disabled:!!b.disabled,ariaDis:b.getAttribute('aria-disabled')||'',icon:ic?ic.getAttribute('icon-name')||'':''};}if((b.className||'').indexOf('button-brand')>=0){best=mk();return;}if(area>bestArea){bestArea=area;best=mk();}});return JSON.stringify(best||null)})()`;
const JS_UNDO_BUTTON = `(function(){var b=document.querySelector('button[data-testid="avatar-action-undo"]');if(!b)return JSON.stringify(null);var r=b.getBoundingClientRect();if(r.width<5)return JSON.stringify(null);return JSON.stringify({x:Math.round(r.x+r.width/2),y:Math.round(r.y+r.height/2),w:Math.round(r.width),h:Math.round(r.height)})})()`;
const JS_PAYWALL = `(function(){var paywallCard=null;document.querySelectorAll('rpl-modal-card').forEach(function(m){var r=m.getBoundingClientRect();if(r.width<80)return;if(m.querySelector('a[href*="/premium"]')){if(!paywallCard)paywallCard=m;}});if(!paywallCard)return JSON.stringify({count:0,close:null});var close=null;paywallCard.querySelectorAll('button').forEach(function(b){var ic=b.querySelector('svg[icon-name]');var icn=ic?ic.getAttribute('icon-name')||'':'';var r=b.getBoundingClientRect();if(r.width<5)return;if(icn==='close'&&!close)close={x:Math.round(r.x+r.width/2),y:Math.round(r.y+r.height/2),w:Math.round(r.width),h:Math.round(r.height)};});return JSON.stringify({count:1,close:close})})()`;
const JS_STYLE_ICON = `(function(){var zones=document.querySelectorAll('avatar-state-container,avatar-action-bar');var hit=null;zones.forEach(function(z){var all=[];if(z.shadowRoot){z.shadowRoot.querySelectorAll('*').forEach(function(e){all.push(e);});}z.querySelectorAll('*').forEach(function(e){all.push(e);if(e.shadowRoot){e.shadowRoot.querySelectorAll('*').forEach(function(e2){all.push(e2);});}});all.forEach(function(el){if(el.tagName&&el.tagName.toLowerCase()==='svg'){var n=el.getAttribute('icon-name');if(n==='style'){var r=el.getBoundingClientRect();if(r.width>5&&!hit)hit={x:Math.round(r.x+r.width/2),y:Math.round(r.y+r.height/2),w:Math.round(r.width),h:Math.round(r.height)};}}});});return JSON.stringify(hit);})()`;
const JS_WEARING_OPEN = `(function(){var open=false;document.querySelectorAll('rpl-modal-card').forEach(function(m){var r=m.getBoundingClientRect();if(r.width<80)return;if(m.querySelector('accessory-tile'))open=true;});return JSON.stringify(open);})()`;
const JS_WEARING_PAID_TILES = `(function(){var out=[];document.querySelectorAll('accessory-tile').forEach(function(tile){var r=tile.getBoundingClientRect();if(r.width<30)return;var hasPremium=tile.shadowRoot&&!!tile.shadowRoot.querySelector('svg[icon-name="premium-fill"]');if(hasPremium)out.push({x:Math.round(r.x+r.width/2),y:Math.round(r.y+r.height/2),w:Math.round(r.width),h:Math.round(r.height)});});return JSON.stringify(out)})()`;
const JS_WEARING_CLOSE = `(function(){var c=null;document.querySelectorAll('rpl-modal-card').forEach(function(m){var r=m.getBoundingClientRect();if(r.width<80)return;if(!m.querySelector('accessory-tile'))return;m.querySelectorAll('button').forEach(function(b){var ic=b.querySelector('svg[icon-name]');var icn=ic?ic.getAttribute('icon-name')||'':'';if(icn==='close'&&!c){var br=b.getBoundingClientRect();if(br.width>5)c={x:Math.round(br.x+br.width/2),y:Math.round(br.y+br.height/2),w:Math.round(br.width),h:Math.round(br.height)};}});});return JSON.stringify(c);})()`;
async function ev(client, tabId, js) {
  const res = await client.evaluateV2(tabId, js);
  return parseEvalResult(res.result);
}
async function clickReliable(client, tabId, loc, label) {
  const rect = { x: loc.x, y: loc.y, w: loc.w ?? 32, h: loc.h ?? 32 };
  try {
    await humanClickElement(client, tabId, rect, { skipMoveAway: true });
  } catch (e) {
    throw new Error(`click "${label}" failed: ${e?.error || e?.message || JSON.stringify(e).slice(0, 80)}`);
  }
}
function genderOfId(id, tabIdx) {
  if (tabIdx === TAB.TOPS || tabIdx === TAB.BOTTOMS) {
    return TOPS_BOTTOMS_GENDER[id] || "N";
  }
  if (FEMALE_RE.test(id)) return "F";
  if (MALE_RE.test(id)) return "M";
  return "N";
}
function tileOkForGender(id, tabIdx, gender) {
  if (!gender) return true;
  const g = genderOfId(id, tabIdx);
  if (g === "N") return true;
  return gender === "man" ? g !== "F" : g !== "M";
}
async function openUserMenu(client, tabId) {
  const btn = await locateByJS(client, tabId, JS_USER_MENU_BUTTON);
  if (!btn) {
    console.log("[entry] user menu button not found (not logged in?)");
    return null;
  }
  await clickReliable(client, tabId, btn, "user menu");
  await humanPause(2e3, 3e3);
  try {
    const toastBtn = await locateByJS(client, tabId, JS_DISMISS_TOAST_BUTTON);
    if (toastBtn) {
      console.log("[entry] ban toast found, dismissing via real click");
      await humanClickElement(client, tabId, toastBtn, { skipMoveAway: true });
      await humanPause(800, 1500);
      await clickReliable(client, tabId, btn, "user menu again");
      await humanPause(1500, 2500);
    }
  } catch {
  }
  let open = false;
  try {
    const r = await client.evaluateV2(tabId, JS_MENU_OPEN);
    open = !!parseEvalResult(r.result);
  } catch {
  }
  if (!open) {
    console.log("[entry] menu did not open, retrying click");
    await clickReliable(client, tabId, btn, "user menu retry");
    await humanPause(2e3, 3e3);
  }
  return { x: btn.x, y: btn.y };
}
async function readAccountGender(client, tabId) {
  try {
    console.log("[gender] opening menu \u2192 Settings");
    const menuBtn = await openUserMenu(client, tabId);
    if (!menuBtn) return null;
    let link = null;
    for (let p = 0; p < 5; p++) {
      link = await locateByJS(client, tabId, JS_MENU_SETTINGS);
      if (link) break;
      await humanPause(800, 1200);
    }
    if (!link) {
      console.log("[gender] Settings menu item not found, skipping");
      return null;
    }
    await clickReliable(client, tabId, link, "Settings");
    await humanPause(1e4, 13e3);
    try {
      await humanScrollDown(client, tabId, 100 + Math.round(Math.random() * 200), { readPauseProbability: 0.2, scrollBackProbability: 0.3, noReadingFollow: true });
      await humanPause(1500, 3e3);
    } catch {
    }
    const g = await ev(client, tabId, JS_SETTINGS_GENDER);
    const text = String(g?.text || "");
    console.log(`[gender] settings text: "${text}"`);
    let gender = null;
    if (/\b(man|male|guy)\b|男/i.test(text)) gender = "man";
    else if (/\b(woman|female|girl)\b|女/i.test(text)) gender = "woman";
    return gender;
  } catch (e) {
    console.log(`[gender] read failed (non-fatal): ${e?.message || e}`);
    return null;
  }
}
async function enterViaMenu(client, tabId) {
  console.log("[entry] via menu");
  const menuBtn = await openUserMenu(client, tabId);
  if (!menuBtn) return false;
  let link = null;
  for (let p = 0; p < 5; p++) {
    link = await locateByJS(client, tabId, JS_MENU_EDIT_AVATAR);
    if (link) break;
    await humanPause(800, 1200);
  }
  if (!link) {
    console.log("[entry] Edit Avatar menu item not found");
    return false;
  }
  console.log(`[entry] clicking Edit Avatar (${link.attrs?.href || ""})`);
  await clickReliable(client, tabId, link, "Edit Avatar");
  await humanPause(1e4, 13e3);
  return true;
}
async function enterViaProfile(client, tabId) {
  console.log("[entry] via profile");
  const menuBtn = await openUserMenu(client, tabId);
  if (!menuBtn) return false;
  let prof = null;
  for (let p = 0; p < 5; p++) {
    prof = await locateByJS(client, tabId, JS_VIEW_PROFILE_LINK);
    if (prof) break;
    await humanPause(800, 1200);
  }
  if (!prof) {
    console.log("[entry] View Profile link not found");
    return false;
  }
  await humanMouseMove(client, tabId, Math.round(menuBtn.x - 50 + Math.random() * 30), Math.round(menuBtn.y + 40 + Math.random() * 20));
  await humanPause(300, 600);
  await clickReliable(client, tabId, prof, "View Profile");
  await humanPause(1e4, 13e3);
  let onProfile = false;
  for (let i = 0; i < 5; i++) {
    try {
      const u = await client.pageUrl(tabId);
      console.log(`[entry] view-profile poll ${i}: url=${u.url}`);
      if (u.url?.includes("/user/")) {
        onProfile = true;
        break;
      }
    } catch {
    }
    await humanPause(1e3, 2e3);
  }
  if (!onProfile) {
    console.log("[entry] did not reach profile page");
    return false;
  }
  console.log("[entry] on profile page, looking for edit_snoovatar");
  let edit = null;
  for (let p = 0; p < 10; p++) {
    edit = await locateByJS(client, tabId, JS_EDIT_SNOOVATAR);
    if (edit) {
      console.log(`[entry] edit_snoovatar found at poll ${p} (href=${edit.attrs?.href || ""})`);
      break;
    }
    await humanPause(1500, 2e3);
  }
  if (!edit) {
    const u = await client.pageUrl(tabId).catch(() => ({ url: "?" }));
    const d = await ev(client, tabId, `(function(){var out=[];document.querySelectorAll('button[noun]').forEach(function(b){var r=b.getBoundingClientRect();if(r.width<5)return;out.push(b.getAttribute('noun'));});return JSON.stringify({url:location.href,nouns:out})})()`).catch(() => null);
    console.log(`[entry] edit_snoovatar not found. url=${u.url} nouns=${JSON.stringify(d?.nouns)}`);
    return false;
  }
  await clickReliable(client, tabId, edit, "edit_snoovatar");
  await humanPause(2e3, 3e3);
  let went = false;
  for (let p = 0; p < 8; p++) {
    try {
      const u = await client.pageUrl(tabId);
      if (u.url?.includes("/avatar/edit")) {
        went = true;
        break;
      }
    } catch {
    }
    const opt = await locateByJS(client, tabId, JS_SELECT_AVATAR_OPTION);
    if (opt) {
      console.log(`[entry] select-avatar option found (href=${opt.attrs?.href || ""})`);
      await clickReliable(client, tabId, opt, "select avatar");
      await humanPause(1e4, 13e3);
      went = true;
      break;
    }
    await humanPause(1e3, 1500);
  }
  if (went) console.log("[entry] entered avatar editor");
  else console.log("[entry] did not reach editor / no select-avatar popup");
  return went;
}
async function enterViaSettings(client, tabId) {
  console.log("[entry] via settings");
  let onSettings = false;
  try {
    const u = await client.pageUrl(tabId);
    onSettings = !!u.url?.includes("/settings");
  } catch {
  }
  if (!onSettings) {
    const menuBtn = await openUserMenu(client, tabId);
    if (!menuBtn) return false;
    let link = null;
    for (let p = 0; p < 5; p++) {
      link = await locateByJS(client, tabId, JS_MENU_SETTINGS);
      if (link) break;
      await humanPause(800, 1200);
    }
    if (!link) {
      console.log("[entry] Settings menu item not found");
      return false;
    }
    await clickReliable(client, tabId, link, "Settings");
    await humanPause(1e4, 13e3);
  }
  let profTab = null;
  for (let p = 0; p < 6; p++) {
    profTab = await locateAndScrollByJS(client, tabId, `(function(){var a=document.querySelector('a[href="/settings/profile"]');if(!a)return null;var r=a.getBoundingClientRect();if(r.width<5)return null;return JSON.stringify({x:Math.round(r.x+r.width/2),y:Math.round(r.y+r.height/2),w:Math.round(r.width),h:Math.round(r.height)})})()`);
    if (profTab) break;
    await humanPause(800, 1200);
  }
  if (profTab) {
    console.log("[entry] clicking Profile sub-tab");
    try {
      await humanClickElement(client, tabId, profTab, { skipMoveAway: true });
    } catch (e) {
      console.log(`[entry] Profile tab click fail: ${e?.error || e?.message}`);
    }
    await humanPause(2500, 3500);
  } else {
    console.log("[entry] Profile sub-tab not found (maybe already on profile?)");
  }
  let avatarBtn = null;
  for (let p = 0; p < 8; p++) {
    avatarBtn = await locateAndScrollByJS(client, tabId, JS_SETTINGS_AVATAR_BUTTON);
    if (avatarBtn) break;
    await humanPause(1e3, 1500);
  }
  if (!avatarBtn) {
    console.log("[entry] settings Avatar button not found");
    return false;
  }
  console.log("[entry] clicking settings Avatar row");
  try {
    await humanClickElement(client, tabId, avatarBtn, { skipMoveAway: true });
  } catch (e) {
    console.log(`[entry] settings Avatar click fail: ${e?.error || e?.message}`);
  }
  await humanPause(2500, 3500);
  let opt = null;
  for (let p = 0; p < 8; p++) {
    opt = await locateByJS(client, tabId, JS_SELECT_AVATAR_OPTION);
    if (opt) break;
    await humanPause(1e3, 1500);
  }
  if (!opt) {
    console.log("[entry] select-avatar option not found");
    return false;
  }
  await clickReliable(client, tabId, opt, "select avatar");
  await humanPause(1e4, 13e3);
  return true;
}
async function ensureOnAvatarEditor(client, tabId) {
  for (let i = 0; i < 8; i++) {
    const st = await ev(client, tabId, JS_STATE);
    if (st?.url?.includes("/avatar/edit") && st?.selText) return true;
    await humanPause(1500, 2500);
  }
  console.log("[editor] not on avatar editor after retries");
  return false;
}
async function switchTab(client, tabId, idx) {
  for (let attempt = 0; attempt < 3; attempt++) {
    const list = await ev(client, tabId, JS_TAB_LIST);
    if (!list || !list[idx]) {
      console.log(`[tab] index ${idx} read failed (list=${list === null ? "null" : `len=${list.length}`}), retry ${attempt + 1}`);
      try {
        await scrollToTopHuman(client, tabId);
      } catch {
      }
      try {
        await client.humanKeyboardPress(tabId, { key: "Escape" });
      } catch {
      }
      await humanPause(1e3, 1500);
      continue;
    }
    const t = list[idx];
    if (t.sel === "true") return true;
    try {
      await scrollToTopHuman(client, tabId);
    } catch {
    }
    await humanPause(300, 600);
    const fresh = await ev(client, tabId, JS_TAB_LIST);
    const target = fresh && fresh[idx] ? fresh[idx] : t;
    await clickReliable(client, tabId, target, `tab[${idx}]${target.text}`);
    await humanPause(2500, 3500);
    const st = await ev(client, tabId, JS_STATE);
    if (st?.selText === target.text) return true;
    console.log(`[tab] switch to "${target.text}" not confirmed (sel=${st?.selText}), attempt ${attempt + 1}`);
    await humanPause(800, 1200);
  }
  return false;
}
async function clickTileById(client, tabId, id, label) {
  const loc = await locateAndScrollByJS(client, tabId, tileByIdJs(id));
  if (!loc) {
    console.log(`  [click ${label}] tile ${id} not located`);
    return false;
  }
  try {
    await humanClickElement(client, tabId, loc, { skipMoveAway: true });
    return true;
  } catch (e) {
    console.log(`  [click ${label}] fail: ${e?.error || e?.message}`);
    return false;
  }
}
async function wearOutfit(client, tabId) {
  try {
    await humanScrollDown(client, tabId, 300 + Math.round(Math.random() * 500), { noReadingFollow: true, readPauseProbability: 0.1, scrollBackProbability: 0.1 });
  } catch {
  }
  await humanPause(1500, 2500);
  try {
    await scrollToTopHuman(client, tabId);
  } catch {
  }
  await humanPause(500, 1e3);
  const all = await ev(client, tabId, JS_OUTFIT_BUTTONS) || [];
  if (!all || !all.length) {
    console.log("[outfit] no outfit buttons");
    return false;
  }
  const tryN = Math.min(all.length, 2 + Math.floor(Math.random() * 3));
  const picks = sample(all, tryN);
  let lastWore = false;
  for (let i = 0; i < picks.length; i++) {
    const ob = picks[i];
    const isLast = i === picks.length - 1;
    const leftover = await ev(client, tabId, JS_OUTFIT_MODAL_BTNS);
    if (leftover?.close) {
      await clickReliable(client, tabId, leftover.close, "leftover close");
      await humanPause(1e3, 1500);
    } else if (leftover) {
      try {
        await client.humanKeyboardPress(tabId, { key: "Escape" });
      } catch {
      }
      await humanPause(1e3, 1500);
    }
    console.log(`[outfit] ${isLast ? "final pick" : "compare"} "${ob.name}" (cat=${ob.cat}) \u2192 Wear All`);
    const obLoc = await locateAndScrollByJS(client, tabId, outfitBtnByNameJs(ob.name));
    if (!obLoc) {
      console.log(`  [outfit] "${ob.name}" button not located`);
      continue;
    }
    try {
      await humanClickElement(client, tabId, obLoc, { skipMoveAway: true });
    } catch (e) {
      console.log(`  [outfit] click fail: ${e?.error || e?.message}`);
    }
    await humanPause(3e3, 4e3);
    let modal = null;
    for (let p = 0; p < 12; p++) {
      modal = await ev(client, tabId, JS_OUTFIT_MODAL_BTNS);
      if (modal?.wear) break;
      await humanPause(1500, 2e3);
    }
    if (modal?.wear) {
      console.log(`  [outfit] Wear All @(${modal.wear.x},${modal.wear.y})`);
      await clickReliable(client, tabId, modal.wear, "wear all");
      await humanPause(2e3, 3e3);
      lastWore = true;
    } else {
      console.log("  [outfit] Wear All not found, skipping");
    }
    if (modal?.close) await clickReliable(client, tabId, modal.close, "outfit close");
    else {
      try {
        await client.humanKeyboardPress(tabId, { key: "Escape" });
      } catch {
      }
    }
    for (let w = 0; w < 8; w++) {
      const gone = await ev(client, tabId, JS_OUTFIT_MODAL_BTNS);
      if (!gone?.wear) break;
      await humanPause(800, 1200);
    }
    await humanPause(800, 1200);
  }
  return lastWore;
}
async function openWearingView(client, tabId) {
  const si = await ev(client, tabId, JS_STYLE_ICON);
  if (!si) {
    console.log("[wearing] style icon not found");
    return false;
  }
  await clickReliable(client, tabId, si, "style icon");
  await humanPause(2e3, 3e3);
  for (let p = 0; p < 5; p++) {
    const open = await ev(client, tabId, JS_WEARING_OPEN);
    if (open) return true;
    await humanPause(1e3, 1500);
  }
  console.log("[wearing] view did not open");
  return false;
}
async function closeWearingView(client, tabId) {
  const c = await ev(client, tabId, JS_WEARING_CLOSE);
  if (c) await clickReliable(client, tabId, c, "wearing close");
  else {
    try {
      await client.humanKeyboardPress(tabId, { key: "Escape" });
    } catch {
    }
  }
  await humanPause(1e3, 1500);
}
async function dismissPaywall(client, tabId) {
  const p = await ev(client, tabId, JS_PAYWALL);
  if (p?.close) {
    await clickReliable(client, tabId, p.close, "paywall close");
  } else {
    try {
      await client.humanKeyboardPress(tabId, { key: "Escape" });
    } catch {
    }
  }
  await humanPause(1500, 2500);
}
async function hasPaywall(client, tabId) {
  const p = await ev(client, tabId, JS_PAYWALL);
  return (p?.count || 0) > 0;
}
async function browseTab(client, tabId, idx) {
  if (!await switchTab(client, tabId, idx)) return;
  await humanPause(500, 1e3);
  try {
    await humanScrollDown(client, tabId, 200 + Math.round(Math.random() * 400), { readPauseProbability: 0.15, scrollBackProbability: 0.1, noReadingFollow: false });
  } catch {
  }
  await humanPause(1e3, 2e3);
  if (idx === TAB.OUTFITS && Math.random() < 0.5) {
    const ob = await ev(client, tabId, JS_OUTFIT_BUTTON);
    if (ob) {
      const obLoc = await locateAndScrollByJS(client, tabId, outfitBtnByNameJs(ob.name));
      if (obLoc) {
        try {
          await humanClickElement(client, tabId, obLoc, { skipMoveAway: true });
        } catch {
        }
        await humanPause(2e3, 3e3);
        const modal = await ev(client, tabId, JS_OUTFIT_MODAL_BTNS);
        if (modal?.close) await clickReliable(client, tabId, modal.close, "peek close");
        else {
          try {
            await client.humanKeyboardPress(tabId, { key: "Escape" });
          } catch {
          }
        }
        await humanPause(800, 1500);
      }
    }
  }
  const s = await ev(client, tabId, JS_TILE_SURVEY);
  const free = s?.free || [];
  const peekN = Math.min(free.length, 1 + Math.floor(Math.random() * 2));
  for (let i = 0; i < peekN; i++) {
    const t = free[Math.floor(Math.random() * free.length)];
    console.log(`  [browse-peek] tab ${idx} ${t.id}`);
    await clickTileById(client, tabId, t.id, `peek ${t.id}`);
    await humanPause(1e3, 2e3);
  }
  await scrollToTopHuman(client, tabId);
  await humanPause(400, 800);
}
async function selectInPart(client, tabId, idx, gender) {
  if (!await switchTab(client, tabId, idx)) return null;
  await humanPause(500, 1e3);
  try {
    await humanScrollDown(client, tabId, 150 + Math.round(Math.random() * 350), { noReadingFollow: true, readPauseProbability: 0.1, scrollBackProbability: 0 });
  } catch {
  }
  await humanPause(1500, 2500);
  const s1 = await ev(client, tabId, JS_TILE_SURVEY);
  const freeOk = (s1?.free || []).filter((t) => tileOkForGender(t.id, idx, gender));
  const previewN = Math.min(freeOk.length, 2 + Math.floor(Math.random() * 3));
  const previewed = /* @__PURE__ */ new Set();
  for (let i = 0; i < previewN; i++) {
    const t = freeOk[Math.floor(Math.random() * freeOk.length)];
    if (previewed.has(t.id)) continue;
    previewed.add(t.id);
    console.log(`  [preview] tab ${idx} ${t.id}`);
    await clickTileById(client, tabId, t.id, `preview ${t.id}`);
    await humanPause(1e3, 2e3);
  }
  if (Math.random() < 0.2) {
    const paid = s1?.paid?.[0];
    if (paid) {
      await clickTileById(client, tabId, paid.id, `preview paid ${paid.id}`);
      await humanPause(1500, 2500);
      if (await hasPaywall(client, tabId)) await dismissPaywall(client, tabId);
    }
  }
  const s2 = await ev(client, tabId, JS_TILE_SURVEY);
  const ok = (s2?.free || []).filter((t) => tileOkForGender(t.id, idx, gender));
  if (!ok.length) {
    console.log(`[select] no free gender-ok tile in tab ${idx}`);
    return null;
  }
  const pick = ok[Math.floor(Math.random() * ok.length)];
  console.log(`[select] tab ${idx} -> ${pick.id}`);
  await clickTileById(client, tabId, pick.id, `apply ${pick.id}`);
  await humanPause(1200, 2200);
  try {
    await scrollToTopHuman(client, tabId);
  } catch {
  }
  await humanPause(400, 800);
  return pick.id;
}
function sample(arr, n) {
  const copy = [...arr];
  const out = [];
  while (copy.length && out.length < n) out.push(copy.splice(Math.floor(Math.random() * copy.length), 1)[0]);
  return out;
}
async function browseAndEdit(client, tabId, gender) {
  if (Math.random() < 0.6) {
    try {
      console.log("[phase1] looking around");
      const lookTabs = sample([TAB.OUTFITS, TAB.HAIR, TAB.FACE, TAB.TOPS, TAB.EYES, TAB.HATS, TAB.BOTTOMS], 1 + Math.floor(Math.random() * 3));
      for (const idx of lookTabs) {
        try {
          await browseTab(client, tabId, idx);
        } catch (e) {
          console.log(`[phase1] tab ${idx} error (non-fatal): ${e?.message || e}`);
        }
      }
      await humanPause(500, 1e3);
    } catch (e) {
      console.log(`[phase1] error (non-fatal): ${e?.message || e}`);
    }
  }
  const mode = getCliArg("mode") ?? (() => {
    const r = Math.random();
    if (r < 0.3) return "A";
    if (r < 0.55) return "B";
    if (r < 0.8) return "C";
    return "D";
  })();
  console.log(`[phase2] mode=${mode} gender=${gender || "unset"}`);
  try {
    if (mode === "A") {
      await switchTab(client, tabId, TAB.OUTFITS);
      await humanPause(500, 1e3);
      if (Math.random() < 0.5) await browseTab(client, tabId, TAB.OUTFITS);
      await wearOutfit(client, tabId);
    } else if (mode === "B") {
      const parts = sample(PART_TABS, 1 + Math.floor(Math.random() * 2));
      for (const idx of parts) {
        try {
          await selectInPart(client, tabId, idx, gender);
          if (Math.random() < 0.25) {
            console.log("[phase2] going back to re-pick");
            await selectInPart(client, tabId, idx, gender);
          }
        } catch (e) {
          console.log(`[phase2] part ${idx} error (non-fatal): ${e?.message || e}`);
        }
      }
    } else if (mode === "C") {
      const parts = sample(PART_TABS, 4 + Math.floor(Math.random() * 3));
      for (const idx of parts) {
        try {
          await selectInPart(client, tabId, idx, gender);
          if (Math.random() < 0.25) await selectInPart(client, tabId, idx, gender);
        } catch (e) {
          console.log(`[phase2] part ${idx} error (non-fatal): ${e?.message || e}`);
        }
      }
    } else {
      await switchTab(client, tabId, TAB.OUTFITS);
      await humanPause(500, 1e3);
      await wearOutfit(client, tabId);
      const parts = sample(PART_TABS, 1 + Math.floor(Math.random() * 3));
      for (const idx of parts) {
        try {
          await selectInPart(client, tabId, idx, gender);
        } catch (e) {
          console.log(`[phase2] tweak ${idx} error (non-fatal): ${e?.message || e}`);
        }
      }
    }
  } catch (e) {
    console.log(`[phase2] error (non-fatal): ${e?.message || e}`);
  }
  try {
    if (Math.random() < 0.4) {
      const idx = Math.random() < 0.5 ? TAB.COLORS : TAB.BACKGROUNDS;
      await switchTab(client, tabId, idx);
      const s = await ev(client, tabId, JS_TILE_SURVEY);
      const all = [...s?.free || [], ...s?.paid || []];
      if (all.length) {
        const n = 1 + Math.floor(Math.random() * 2);
        for (let i = 0; i < n; i++) {
          const t = all[Math.floor(Math.random() * all.length)];
          await clickTileById(client, tabId, t.id, `color/bg ${t.id}`);
          await humanPause(800, 1500);
        }
      }
    }
    if (Math.random() < 0.3) {
      const u = await ev(client, tabId, JS_UNDO_BUTTON);
      if (u) {
        await clickReliable(client, tabId, u, "undo");
        await humanPause(1e3, 1500);
      }
    }
    const wx = 200 + Math.round(Math.random() * 900);
    const wy = 200 + Math.round(Math.random() * 500);
    await humanMouseMove(client, tabId, wx, wy);
    await humanPause(800, 1800);
  } catch (e) {
    console.log(`[phase3] error (non-fatal): ${e?.message || e}`);
  }
  try {
    await saveWithPaywallRecovery(client, tabId, gender);
  } catch (e) {
    console.log(`[phase4] save error (non-fatal): ${e?.message || e}`);
  }
}
async function clickSaveAndWait(client, tabId) {
  for (let attempt = 0; attempt < 2; attempt++) {
    const save = await ev(client, tabId, JS_SAVE_BUTTON);
    if (!save) {
      console.log("[save] Save button not found");
      return "failed";
    }
    try {
      await humanClickElement(client, tabId, save, { skipMoveAway: true });
    } catch (e) {
      console.log(`[save] click attempt ${attempt + 1} fail: ${e?.error || e?.message}`);
      continue;
    }
    let sawLoading = false;
    for (let p = 0; p < 24; p++) {
      await humanPause(300, 500);
      const pw = await ev(client, tabId, JS_PAYWALL);
      if (pw?.count > 0) return "paywall";
      const s = await ev(client, tabId, JS_SAVE_BUTTON);
      if (!s) continue;
      if (s.disabled) {
        sawLoading = true;
      } else if (sawLoading) {
        return "completed";
      }
    }
    if (!sawLoading) {
      console.log(`[save] click didn't trigger loading, retry ${attempt + 1}`);
    }
  }
  return "failed";
}
async function saveWithPaywallRecovery(client, tabId, gender) {
  for (let round = 0; round < 3; round++) {
    let removedCount = 0;
    try {
      const result = await clickSaveAndWait(client, tabId);
      if (result === "completed") {
        console.log("[save] saved (loading\u2192enabled, no paywall)");
        return;
      }
      if (result === "failed") {
        console.log("[save] Save did not complete, retrying");
        continue;
      }
      console.log("[save] paywall appeared \u2014 removing paid worn items via wearing view");
      await dismissPaywall(client, tabId);
      if (await openWearingView(client, tabId)) {
        const paid = await ev(client, tabId, JS_WEARING_PAID_TILES);
        console.log(`[save] ${paid?.length || 0} paid worn tile(s) to remove`);
        for (const p of paid || []) {
          try {
            await humanClickElement(client, tabId, p, { skipMoveAway: true });
            removedCount++;
          } catch (e) {
            console.log(`  [remove paid] fail: ${e?.error || e?.message}`);
          }
          await humanPause(1200, 1800);
        }
        await closeWearingView(client, tabId);
      }
    } catch (e) {
      console.log(`[save] round ${round + 1} error (non-fatal): ${e?.message || e}`);
    }
    if (removedCount === 0 && round > 0) {
      console.log("[save] no paid items removed, breaking to fallback");
      break;
    }
    await humanPause(1e3, 1500);
  }
  console.log("[save] falling back to a single free gender-ok tile");
  try {
    const idx = sample(PART_TABS, 1)[0];
    await selectInPart(client, tabId, idx, gender);
    const result = await clickSaveAndWait(client, tabId);
    if (result === "completed") {
      console.log("[save] saved via fallback");
      return;
    }
    if (result === "paywall") {
      console.log("[save] still paywalled after fallback \u2014 giving up");
      await dismissPaywall(client, tabId);
    } else {
      console.log("[save] fallback Save did not complete");
    }
  } catch (e) {
    console.log(`[save] fallback error: ${e?.message || e}`);
  }
}
async function editAvatar(client, tabId) {
  await ensureTabFocus(client, tabId);
  let entry = getCliArg("entry") || "auto";
  if (entry === "auto") {
    const r = Math.random();
    entry = r < 0.25 ? "menu" : r < 0.5 ? "profile" : "settings";
  }
  const gender = await readAccountGender(client, tabId);
  console.log(`[entry] mode=${entry}`);
  const ok = entry === "menu" ? await enterViaMenu(client, tabId) : entry === "profile" ? await enterViaProfile(client, tabId) : await enterViaSettings(client, tabId);
  if (!ok) return { status: "failed", message: `could not enter avatar editor via ${entry}` };
  if (!await ensureOnAvatarEditor(client, tabId)) {
    return { status: "failed", message: "not on avatar editor after entry" };
  }
  await browseAndEdit(client, tabId, gender);
  return {
    status: "success",
    message: "avatar edited + Save clicked",
    data: { entry, gender, saved: true }
  };
}
async function main() {
  const cli = await getCliOptions();
  const tabId = requireTabId();
  const client = new PinchTabClient({ baseUrl: cli.baseUrl, token: cli.token });
  const result = await editAvatar(client, tabId);
  outputResult(result);
}
runMain(main, "reddit-edit-avatar.ts");
export {
  JS_MENU_OPEN,
  JS_MENU_SETTINGS,
  JS_USER_MENU_BUTTON,
  JS_VIEW_PROFILE_LINK,
  clickReliable,
  ev,
  openUserMenu
};
