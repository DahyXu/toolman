import { PinchTabClient } from "../api.js";
import {
  ensureTabFocus,
  hoverWithHesitation,
  humanClickElement,
  humanPause,
  humanType,
  locateAndScrollByJS,
  locateByJS
} from "./reddit-human.js";
import { getCliArg, outputResult, getCliOptions, requireTabId, runMain } from "./cli.js";
const kLoginTag = "login";
async function safeClick(client, tabId, target, options) {
  try {
    await humanClickElement(client, tabId, target, options);
    return true;
  } catch (err) {
    const msg = err.message || String(err);
    if (msg.includes("409") || msg.includes("Conflict")) {
      console.log(`[click] 409 ignored (operation likely succeeded)`);
      return true;
    }
    console.log(`[click] failed: ${msg}`);
    return false;
  }
}
const JS_CHECK_LOGIN_STATE = `
(function(){
  // \u2500\u2500 Strategy 1: User avatar button (light DOM, actual current Reddit) \u2500\u2500
  var userBtn = document.querySelector('#expand-user-drawer-button');
  if (userBtn) return { loggedIn: true };

  // \u2500\u2500 Strategy 2: User avatar image in header \u2500\u2500
  var avatar = document.querySelector('img[alt="User Avatar"]');
  if (avatar) {
    var btn = avatar.closest('button, a');
    if (btn) return { loggedIn: true };
    return { loggedIn: true };
  }

  // \u2500\u2500 Strategy 3: Check for "Log In" button \u2014 if present, not logged in \u2500\u2500
  var loginLinks = document.querySelectorAll('a[href*="/login"]');
  for (var i = 0; i < loginLinks.length; i++) {
    var txt = (loginLinks[i].textContent || '').trim();
    if (/^(log\\s*in|sign\\s*in)$/i.test(txt)) {
      return { loggedIn: false };
    }
  }

  // \u2500\u2500 Strategy 4: reddit_session cookie check \u2500\u2500
  try {
    if (document.cookie.indexOf('reddit_session') !== -1) return { loggedIn: true };
  } catch(e) {}

  return { loggedIn: false };
})()
`;
const JS_LOGIN_ENTRY_BUTTON = `
(function(){
  // Strategy 1: Direct login link (top-level, not in footer/dropdown)
  var loginLinks = document.querySelectorAll('a[href*="/login"]');
  for (var i = 0; i < loginLinks.length; i++) {
    var r = loginLinks[i].getBoundingClientRect();
    if (r.width > 0 && r.height > 0) {
      var txt = (loginLinks[i].textContent || '').trim().toLowerCase();
      if (txt === 'log in' || txt === 'login' || txt === 'sign in' || txt === 'signin') {
        return {
          x: Math.round(r.left + r.width / 2),
          y: Math.round(r.top + r.height / 2),
          w: Math.round(r.width),
          h: Math.round(r.height),
          attrs: { target: 'login link', href: loginLinks[i].getAttribute('href') || '' }
        };
      }
    }
  }

  // Strategy 2: Any button with login text visible on page
  var allBtns = document.querySelectorAll('button, a, [role="button"]');
  for (var j = 0; j < allBtns.length; j++) {
    var r = allBtns[j].getBoundingClientRect();
    if (r.width > 0 && r.height > 0) {
      var txt = (allBtns[j].textContent || '').trim().toLowerCase();
      if (txt === 'log in' || txt === 'login' || txt === 'sign in') {
        return {
          x: Math.round(r.left + r.width / 2),
          y: Math.round(r.top + r.height / 2),
          w: Math.round(r.width),
          h: Math.round(r.height),
          attrs: { target: 'login button' }
        };
      }
    }
  }

  return null;
})()
`;
const JS_LOGIN_USERNAME_INPUT = `
(function(){
  // Strategy 1: faceplate-text-input for username (current Reddit)
  var username = document.querySelector('#login-username');
  if (username) {
    var r = username.getBoundingClientRect();
    if (r.width > 0) return { x: Math.round(r.left + r.width / 2), y: Math.round(r.top + r.height / 2), w: Math.round(r.width), h: Math.round(r.height) };
  }

  // Strategy 2: Standard input in light DOM
  var inp = document.querySelector('input[name="username"], input[autocomplete="username"], #regUsername');
  if (inp) {
    var r = inp.getBoundingClientRect();
    if (r.width > 0) return { x: Math.round(r.left + r.width / 2), y: Math.round(r.top + r.height / 2), w: Math.round(r.width), h: Math.round(r.height) };
  }

  // Strategy 3: First visible text input
  var all = document.querySelectorAll('input:not([type="hidden"]):not([type="submit"]):not([type="password"])');
  for (var i = 0; i < all.length; i++) {
    var r = all[i].getBoundingClientRect();
    if (r.width > 0 && r.height > 0) {
      return { x: Math.round(r.left + r.width / 2), y: Math.round(r.top + r.height / 2), w: Math.round(r.width), h: Math.round(r.height) };
    }
  }

  return null;
})()
`;
const JS_LOGIN_PASSWORD_INPUT = `
(function(){
  // Strategy 1: faceplate-text-input for password (current Reddit)
  var pwd = document.querySelector('#login-password');
  if (pwd) {
    var r = pwd.getBoundingClientRect();
    if (r.width > 0) return { x: Math.round(r.left + r.width / 2), y: Math.round(r.top + r.height / 2), w: Math.round(r.width), h: Math.round(r.height) };
  }

  // Strategy 2: Standard password input in light DOM
  var inp = document.querySelector('input[name="password"], input[autocomplete="current-password"], #regPassword');
  if (inp) {
    var r = inp.getBoundingClientRect();
    if (r.width > 0) return { x: Math.round(r.left + r.width / 2), y: Math.round(r.top + r.height / 2), w: Math.round(r.width), h: Math.round(r.height) };
  }

  // Strategy 3: Any visible password input
  var all = document.querySelectorAll('input[type="password"]');
  for (var i = 0; i < all.length; i++) {
    var r = all[i].getBoundingClientRect();
    if (r.width > 0 && r.height > 0) {
      return { x: Math.round(r.left + r.width / 2), y: Math.round(r.top + r.height / 2), w: Math.round(r.width), h: Math.round(r.height) };
    }
  }

  return null;
})()
`;
const JS_LOGIN_SUBMIT_BUTTON = `
(function(){
  // Strategy 1: Visible button with "Log In" text (current Reddit)
  var btns = document.querySelectorAll('button');
  for (var i = 0; i < btns.length; i++) {
    var txt = (btns[i].textContent || '').trim().toLowerCase();
    if (txt === 'log in' || txt === 'login' || txt === 'sign in') {
      var r = btns[i].getBoundingClientRect();
      if (r.width > 0) return { x: Math.round(r.left + r.width / 2), y: Math.round(r.top + r.height / 2), w: Math.round(r.width), h: Math.round(r.height) };
    }
  }

  // Strategy 2: Any submit button on the page
  var subs = document.querySelectorAll('button[type="submit"], input[type="submit"]');
  for (var j = 0; j < subs.length; j++) {
    var r = subs[j].getBoundingClientRect();
    if (r.width > 0) return { x: Math.round(r.left + r.width / 2), y: Math.round(r.top + r.height / 2), w: Math.round(r.width), h: Math.round(r.height) };
  }

  return null;
})()
`;
const JS_USER_MENU_BUTTON = `
(function(){
  var HEADER_MAX_Y = 80;

  // Strategy 1: User avatar button (actual current Reddit ID)
  var btn = document.querySelector('#expand-user-drawer-button');
  if (btn) {
    var r = btn.getBoundingClientRect();
    if (r.width > 0 && r.top < HEADER_MAX_Y) {
      return { x: Math.round(r.left + r.width / 2), y: Math.round(r.top + r.height / 2), w: Math.round(r.width), h: Math.round(r.height), attrs: { target: 'expand-user-drawer-button' } };
    }
  }

  // Strategy 2: Avatar image with alt="User Avatar" \u2014 get parent button
  var avatar = document.querySelector('img[alt="User Avatar"]');
  if (avatar) {
    var parentBtn = avatar.closest('button, a, [role="button"]');
    if (parentBtn) {
      var r = parentBtn.getBoundingClientRect();
      if (r.width > 0 && r.top < HEADER_MAX_Y) {
        return { x: Math.round(r.left + r.width / 2), y: Math.round(r.top + r.height / 2), w: Math.round(r.width), h: Math.round(r.height), attrs: { target: 'avatar parent button' } };
      }
    }
  }

  // Strategy 3: Any header button with "user" or "profile" in text/id
  var headerBtns = document.querySelectorAll('header button, header a, [role="banner"] button, [role="banner"] a');
  for (var i = 0; i < headerBtns.length; i++) {
    var txt = (headerBtns[i].textContent || '').toLowerCase();
    var id = (headerBtns[i].id || '').toLowerCase();
    if (txt.indexOf('user') !== -1 || id.indexOf('user') !== -1 || id.indexOf('profile') !== -1) {
      var r = headerBtns[i].getBoundingClientRect();
      if (r.width > 0 && r.top < HEADER_MAX_Y) {
        return { x: Math.round(r.left + r.width / 2), y: Math.round(r.top + r.height / 2), w: Math.round(r.width), h: Math.round(r.height), attrs: { target: 'header user button' } };
      }
    }
  }

  return null;
})()
`;
const JS_LOGOUT_OPTION = `
(function(){
  // Strategy 1: Find <LI> containing "Log Out" text inside user-drawer-content
  var drawer = document.querySelector('#user-drawer-content');
  if (drawer) {
    var lis = drawer.querySelectorAll('li');
    for (var i = 0; i < lis.length; i++) {
      var txt = (lis[i].textContent || '').trim().toLowerCase();
      if (txt === 'log out' || txt === 'logout' || txt === 'sign out' || txt === 'signout') {
        var r = lis[i].getBoundingClientRect();
        if (r.width > 0 && r.height > 0) return { x: Math.round(r.left + r.width / 2), y: Math.round(r.top + r.height / 2), w: Math.round(r.width), h: Math.round(r.height) };
      }
    }
  }

  // Strategy 2: "Log Out" <LI> in any visible dropdown
  var dropdowns = document.querySelectorAll('[role="menu"], [role="listbox"], [role="dialog"], [id*="dropdown"], [id*="menu"], [id*="drawer"], [id*="popup"]');
  for (var d = 0; d < dropdowns.length; d++) {
    if (dropdowns[d].offsetWidth === 0 && dropdowns[d].offsetHeight === 0) continue;
    var lis = dropdowns[d].querySelectorAll('li');
    for (var j = 0; j < lis.length; j++) {
      var txt = (lis[j].textContent || '').trim().toLowerCase();
      if (txt === 'log out' || txt === 'logout' || txt === 'sign out') {
        var r = lis[j].getBoundingClientRect();
        if (r.width > 0) return { x: Math.round(r.left + r.width / 2), y: Math.round(r.top + r.height / 2), w: Math.round(r.width), h: Math.round(r.height) };
      }
    }
  }

  // Strategy 3: Any element on page containing "Log Out"
  var all = document.querySelectorAll('li, a, button, [role="menuitem"], [role="button"]');
  for (var k = 0; k < all.length; k++) {
    var txt = (all[k].textContent || '').trim().toLowerCase();
    if (txt === 'log out' || txt === 'logout' || txt === 'sign out') {
      var r = all[k].getBoundingClientRect();
      if (r.width > 0) return { x: Math.round(r.left + r.width / 2), y: Math.round(r.top + r.height / 2), w: Math.round(r.width), h: Math.round(r.height) };
    }
  }

  return null;
})()
`;
const JS_VIEW_PROFILE_LINK = `
(function(){
  // Strategy 1: "View Profile" <a> inside user-drawer-content (actual current Reddit)
  var drawer = document.querySelector('#user-drawer-content');
  if (drawer) {
    var links = drawer.querySelectorAll('a');
    for (var i = 0; i < links.length; i++) {
      var txt = (links[i].textContent || '').trim().toLowerCase();
      if (txt === 'view profile' || txt === 'my profile' || txt === 'profile') {
        var r = links[i].getBoundingClientRect();
        if (r.width > 0 && r.height > 0) {
          return { x: Math.round(r.left + r.width / 2), y: Math.round(r.top + r.height / 2), w: Math.round(r.width), h: Math.round(r.height), attrs: { target: 'drawer view profile' } };
        }
      }
    }
  }

  // Strategy 2: "View Profile" in any visible dropdown/menu
  var dropdowns = document.querySelectorAll('[role="menu"], [role="dialog"], [id*="dropdown"], [id*="drawer"], [id*="menu"]');
  for (var d = 0; d < dropdowns.length; d++) {
    if (dropdowns[d].offsetWidth === 0 && dropdowns[d].offsetHeight === 0) continue;
    var dLinks = dropdowns[d].querySelectorAll('a');
    for (var j = 0; j < dLinks.length; j++) {
      var txt = (dLinks[j].textContent || '').trim().toLowerCase();
      if (txt === 'view profile' || txt === 'my profile' || txt === 'profile') {
        var r = dLinks[j].getBoundingClientRect();
        if (r.width > 0 && r.height > 0) {
          return { x: Math.round(r.left + r.width / 2), y: Math.round(r.top + r.height / 2), w: Math.round(r.width), h: Math.round(r.height), attrs: { target: 'dropdown view profile' } };
        }
      }
    }
  }

  // Strategy 3: Any "View Profile" link on the right side of page
  var all = document.querySelectorAll('a');
  for (var k = 0; k < all.length; k++) {
    var txt = (all[k].textContent || '').trim().toLowerCase();
    if (txt === 'view profile' || txt === 'my profile') {
      var r = all[k].getBoundingClientRect();
      if (r.width > 0 && r.height > 0) {
        return { x: Math.round(r.left + r.width / 2), y: Math.round(r.top + r.height / 2), w: Math.round(r.width), h: Math.round(r.height), attrs: { target: 'any view profile' } };
      }
    }
  }

  return null;
})()
`;
const JS_PROFILE_USERNAME = `
(function(){
  // \u2500\u2500 Strategy 1: Extract from URL pathname \u2500\u2500
  var m = location.pathname.match(/\\/user\\/([^\\/]+)/i);
  if (m && m[1]) return m[1];

  // \u2500\u2500 Strategy 2: OG title meta tag \u2500\u2500
  var ogTitle = document.querySelector('meta[property="og:title"]');
  if (ogTitle) {
    var content = ogTitle.getAttribute('content') || '';
    var om = content.match(/^u\\/([a-zA-Z0-9_-]+)/);
    if (om) return om[1];
    var om2 = content.match(/^([a-zA-Z0-9_-]+)\\s*(\\(u\\/|\\(|\\|)/);
    if (om2) return om2[1];
    var om3 = content.match(/^([a-zA-Z0-9_-]{3,20})/);
    if (om3) return om3[1];
  }

  // \u2500\u2500 Strategy 3: Page heading (h1 or profile heading element) \u2500\u2500
  var h1 = document.querySelector('h1');
  if (h1) {
    var txt = h1.textContent.trim();
    var um = txt.match(/^u\\/([a-zA-Z0-9_-]{3,20})$/);
    if (um) return um[1];
    if (txt.length >= 3 && txt.length <= 20 && /^[a-zA-Z0-9_-]+$/.test(txt)) return txt;
  }

  // \u2500\u2500 Strategy 4: shreddit-profile or profile page specific elements \u2500\u2500
  var profileEl = document.querySelector('shreddit-profile, reddit-profile');
  if (profileEl) {
    var nameEl = profileEl.querySelector('[slot="profile-display-name"], h1, h2, [slot="display-name"]');
    if (nameEl) {
      var txt = (nameEl.textContent || '').trim();
      var um = txt.match(/^u\\/([a-zA-Z0-9_-]{3,20})$/);
      if (um) return um[1];
      if (txt.length >= 3 && txt.length <= 20 && /^[a-zA-Z0-9_-]+$/.test(txt)) return txt;
    }
  }

  // \u2500\u2500 Strategy 5: Document title \u2500\u2500
  var title = document.title || '';
  var tm = title.match(/^([a-zA-Z0-9_-]+)\\s*\\(/);
  if (tm) return tm[1];
  var tm2 = title.match(/([a-zA-Z0-9_-]{3,20})\\s*\\(u\\//);
  if (tm2) return tm2[1];

  // \u2500\u2500 Strategy 6: Any "u/username" pattern in visible text near top of page \u2500\u2500
  var topElements = document.querySelectorAll('h1, h2, h3, [role="heading"], [slot="title"]');
  for (var i = 0; i < topElements.length; i++) {
    var r = topElements[i].getBoundingClientRect();
    if (r.width > 0 && r.top < 400) {
      var txt = (topElements[i].textContent || '').trim();
      var um = txt.match(/u\\/([a-zA-Z0-9_-]{3,20})/);
      if (um) return um[1];
    }
  }

  return null;
})()
`;
const JS_CHECK_HOMEPAGE = `
(function(){
  var host = location.hostname;
  var path = location.pathname;
  var isReddit = host === 'www.reddit.com' || host === 'reddit.com' || host.endsWith('.reddit.com');
  var isHomepage = path === '/' || path === '' || path === '/hot' || path === '/best' || path === '/new' || path.startsWith('/?');
  return { isReddit: !!isReddit, isHomepage: !!isReddit && isHomepage, host: host, path: path };
})()
`;
async function checkLoginState(client, tabId) {
  const result = await client.evaluateV2(tabId, JS_CHECK_LOGIN_STATE);
  const raw = result.result;
  if (!raw) return { loggedIn: false };
  let data;
  if (typeof raw === "string") {
    try {
      data = JSON.parse(raw);
    } catch {
      return { loggedIn: false };
    }
  } else {
    data = raw;
  }
  return {
    loggedIn: Boolean(data.loggedIn),
    username: data.username ? String(data.username) : void 0
  };
}
async function ensureHomepage(client, tabId) {
  const result = await client.evaluateV2(tabId, JS_CHECK_HOMEPAGE);
  const raw = result.result;
  if (!raw) return false;
  let data;
  if (typeof raw === "string") {
    try {
      data = JSON.parse(raw);
    } catch {
      return false;
    }
  } else {
    data = raw;
  }
  return Boolean(data.isHomepage);
}
async function clickAvatarAndGetUsername(client, tabId, options) {
  console.log("[login] looking for user avatar to open drawer...");
  const avatar = await locateByJS(client, tabId, JS_USER_MENU_BUTTON);
  if (!avatar) {
    console.log("[login] no avatar button found \u2192 not logged in");
    return { loggedIn: false };
  }
  console.log(`[login] clicking avatar at (${avatar.x}, ${avatar.y})`);
  const avatarClicked = await safeClick(client, tabId, avatar, options);
  if (!avatarClicked) {
    console.log("[login] avatar click failed, trying JS...");
    const jsResult = await client.evaluateV2(tabId, JS_OPEN_USER_MENU);
    console.log(`[login] JS avatar click: ${jsResult.result}`);
    if (jsResult.result === "not-found") return { loggedIn: false };
  }
  await humanPause(1200, 2e3);
  console.log("[login] looking for 'View Profile' in drawer...");
  let viewProfile = await locateByJS(client, tabId, JS_VIEW_PROFILE_LINK);
  if (!viewProfile) {
    await humanPause(800, 1500);
    viewProfile = await locateByJS(client, tabId, JS_VIEW_PROFILE_LINK);
  }
  if (!viewProfile) {
    console.log("[login] 'View Profile' not found in drawer");
    await client.humanKeyboardPress(tabId, { key: "Escape" });
    await humanPause(300, 600);
    return { loggedIn: true };
  }
  console.log(`[login] clicking 'View Profile' at (${viewProfile.x}, ${viewProfile.y})`);
  await safeClick(client, tabId, viewProfile, options);
  console.log("[login] waiting for profile page to load...");
  await humanPause(2e3, 4e3);
  let onProfilePage = false;
  for (let retry = 0; retry < 5; retry++) {
    const onProfile = await client.evaluateV2(tabId, `
      (function(){ return !!(location.pathname.match(/\\/user\\//)); })()
    `);
    if (onProfile.result) {
      onProfilePage = true;
      break;
    }
    console.log(`[login] still navigating to profile... (${retry + 1}/5)`);
    await humanPause(1e3, 2e3);
  }
  if (!onProfilePage) {
    console.log("[login] 'View Profile' click didn navigate \u2014 falling back to /user/me/...");
    await client.tabNav(tabId, "https://www.reddit.com/user/me/", {
      waitFor: "networkidle",
      timeout: 15e3
    });
    await humanPause(2e3, 4e3);
    for (let retry = 0; retry < 5; retry++) {
      const pathResult = await client.evaluateV2(tabId, `
        (function(){ return location.pathname; })()
      `);
      const pathStr = String(pathResult.result || "");
      if (pathStr.match(/\/user\/[a-zA-Z0-9_-]/)) {
        onProfilePage = true;
        break;
      }
      if (pathStr && !pathStr.includes("/me/")) break;
      console.log(`[login] waiting for /user/me/ redirect... (${retry + 1}/5)`);
      await humanPause(1e3, 2e3);
    }
  }
  let username;
  if (onProfilePage) {
    username = await extractUsernameFromProfile(client, tabId);
    if (username) {
      console.log(`[login] current logged-in account: "${username}"`);
    } else {
      console.log("[login] could not extract username from profile page");
    }
  } else {
    console.log("[login] never reached profile page \u2014 username unknown");
  }
  return { loggedIn: true, username };
}
async function extractUsernameFromProfile(client, tabId) {
  const result = await client.evaluateV2(tabId, JS_PROFILE_USERNAME);
  const raw = result.result;
  if (!raw) return void 0;
  if (typeof raw === "string") return raw;
  return String(raw);
}
async function extractUsernameFromDrawer(client, tabId) {
  const result = await client.evaluateV2(tabId, `
    (function(){
      var drawer = document.querySelector('reddit-user-drawer');
      if (drawer) {
        var uname = drawer.getAttribute('username');
        if (uname && uname.length > 1) return uname;
        var displayName = drawer.querySelector('[slot="profile-display-name"]');
        if (displayName) {
          var txt = (displayName.textContent || '').trim();
          if (txt && txt.length > 1 && txt.length < 25) return txt;
        }
        var spans = drawer.querySelectorAll('span, a, p');
        for (var i = 0; i < spans.length; i++) {
          var txt = (spans[i].textContent || '').trim();
          var um = txt.match(/^u\\/([a-zA-Z0-9_-]{3,20})$/);
          if (um) return um[1];
        }
      }
      return null;
    })()
  `);
  const raw = result.result;
  if (!raw) return void 0;
  if (typeof raw === "string") return raw;
  return String(raw);
}
async function navigateBackToHomepage(client, tabId) {
  console.log("[login] navigating back to homepage...");
  await client.tabNav(tabId, "https://www.reddit.com/", {
    waitFor: "networkidle",
    timeout: 15e3
  });
  await humanPause(2e3, 4e3);
}
const JS_OPEN_USER_MENU = `
(function(){
  // Strategy 1: Expand user drawer button (actual current Reddit ID)
  var btn = document.querySelector('#expand-user-drawer-button');
  if (btn) { btn.click(); return 'drawer-btn-clicked'; }

  // Strategy 2: Click avatar image's parent button
  var avatar = document.querySelector('img[alt="User Avatar"]');
  if (avatar) {
    var parentBtn = avatar.closest('button, a');
    if (parentBtn) { parentBtn.click(); return 'avatar-parent-clicked'; }
    avatar.click();
    return 'avatar-clicked';
  }

  // Strategy 3: Header button with "user" in id or text
  var headerBtns = document.querySelectorAll('header button, header a, [role="banner"] button, [role="banner"] a');
  for (var i = 0; i < headerBtns.length; i++) {
    var id = (headerBtns[i].id || '').toLowerCase();
    var txt = (headerBtns[i].textContent || '').toLowerCase();
    if (id.indexOf('user') !== -1 || txt.indexOf('user') !== -1) {
      headerBtns[i].click();
      return 'header-btns-clicked';
    }
  }

  return 'not-found';
})()
`;
const JS_CLICK_LOGOUT = `
(function(){
  // Strategy 1: "Log Out" inside user-drawer-content \u2014 search ALL elements
  // Reddit uses <LI>\u2192<DIV> for Log Out (not <a>/<button>), so we must
  // click the <LI> parent which has the React event delegation handler.
  var drawer = document.querySelector('#user-drawer-content');
  if (drawer) {
    var all = drawer.querySelectorAll('*');
    for (var i = 0; i < all.length; i++) {
      var txt = (all[i].textContent || '').trim().toLowerCase();
      if (txt === 'log out' || txt === 'logout' || txt === 'sign out' || txt === 'signout') {
        // Click the element itself first
        all[i].click();
        // Also dispatch click on parent LI (handles React delegation)
        var li = all[i].closest('li');
        if (li) { li.click(); li.dispatchEvent(new MouseEvent('click', {bubbles: true, cancelable: true})); }
        return 'drawer-content-clicked';
      }
    }
  }

  // Strategy 2: Any visible dropdown/menu/dialog \u2014 search ALL elements
  var dropdowns = document.querySelectorAll('[role="menu"], [role="dialog"], [role="listbox"], [id*="dropdown"], [id*="menu"], [id*="drawer"], [id*="popup"], [id*="overflow"]');
  for (var d = 0; d < dropdowns.length; d++) {
    if (dropdowns[d].offsetWidth === 0 && dropdowns[d].offsetHeight === 0) continue;
    var children = dropdowns[d].querySelectorAll('*');
    for (var j = 0; j < children.length; j++) {
      var txt = (children[j].textContent || '').trim().toLowerCase();
      if (txt === 'log out' || txt === 'logout' || txt === 'sign out') {
        children[j].click();
        var li = children[j].closest('li');
        if (li) { li.click(); li.dispatchEvent(new MouseEvent('click', {bubbles: true, cancelable: true})); }
        return 'dropdown-clicked';
      }
    }
  }

  // Strategy 3: Any element with logout-related aria-label
  var ariaEls = document.querySelectorAll('[aria-label*="log out" i], [aria-label*="logout" i], [aria-label*="sign out" i]');
  for (var k = 0; k < ariaEls.length; k++) {
    ariaEls[k].click();
    return 'aria-clicked';
  }

  // Strategy 4: Any element on the page with "Log Out" text
  var pageAll = document.querySelectorAll('*');
  for (var n = 0; n < pageAll.length; n++) {
    var txt = (pageAll[n].textContent || '').trim().toLowerCase();
    if (txt === 'log out' || txt === 'logout' || txt === 'sign out') {
      var rect = pageAll[n].getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        pageAll[n].click();
        var li = pageAll[n].closest('li');
        if (li) { li.click(); }
        return 'any-clicked';
      }
    }
  }

  // Strategy 5: Last resort \u2014 navigate to /logout
  window.location.href = '/logout';
  return 'location-redirect';
})()
`;
async function openDrawerAndLogout(client, tabId) {
  console.log("[login] opening user menu for logout...");
  const avatar = await locateByJS(client, tabId, JS_USER_MENU_BUTTON);
  if (avatar) {
    console.log(`[login] clicking avatar at (${avatar.x}, ${avatar.y})`);
    const clicked = await safeClick(client, tabId, avatar);
    if (!clicked) {
      console.log("[login] avatar click failed, trying JS click...");
      const jsResult = await client.evaluateV2(tabId, JS_OPEN_USER_MENU);
      console.log(`[login] JS click result: ${jsResult.result}`);
      if (jsResult.result === "not-found") {
        return false;
      }
    }
  } else {
    console.log("[login] avatar not found via locateByJS, trying JS dispatch...");
    const jsResult = await client.evaluateV2(tabId, JS_OPEN_USER_MENU);
    console.log(`[login] JS click result: ${jsResult.result}`);
    if (jsResult.result === "not-found") {
      console.log("[login] avatar button not found by any method");
      return false;
    }
  }
  console.log("[login] waiting for drawer to render...");
  await humanPause(1200, 2e3);
  console.log("[login] clicking 'Log Out' in drawer...");
  const logoutResult = await client.evaluateV2(tabId, JS_CLICK_LOGOUT);
  console.log(`[login] logout JS click result: ${logoutResult.result}`);
  if (logoutResult.result === "location-redirect") {
    console.log("[login] JS didn't find logout button, fell back to /logout redirect");
    await humanPause(2e3, 4e3);
  } else {
    await humanPause(500, 1e3);
    const logoutBtn = await locateByJS(client, tabId, JS_LOGOUT_OPTION);
    if (logoutBtn) {
      console.log(`[login] also clicking logout via CDP at (${logoutBtn.x}, ${logoutBtn.y})`);
      try {
        await humanClickElement(client, tabId, logoutBtn);
      } catch {
      }
    }
  }
  await humanPause(2e3, 4e3);
  const verifyResult = await client.evaluateV2(tabId, `
    (function(){
      var header = document.querySelector('reddit-header-large, reddit-header-small');
      var root = (header && header.shadowRoot) ? header.shadowRoot : document;
      var btn = root.querySelector('#reddit-header-user-menu-button');
      return !btn;
    })()
  `);
  if (verifyResult.result) {
    console.log("[login] logout successful \u2713");
    return true;
  }
  console.log("[login] user menu button still present \u2014 logout may not have completed");
  return false;
}
async function forceLogout(client, tabId) {
  console.log("[login] force-clearing session cookies and storage...");
  await client.evaluateV2(tabId, `
    (function(){
      document.cookie.split(";").forEach(function(c) {
        var eqPos = c.indexOf("=");
        var name = eqPos > -1 ? c.substr(0, eqPos).trim() : c.trim();
        if (name) {
          document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=.reddit.com";
          document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=reddit.com";
          document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/";
        }
      });
      try { localStorage.clear(); } catch(e) {}
      try { sessionStorage.clear(); } catch(e) {}
      return "cleared";
    })()
  `);
}
async function loginToReddit(client, tabId, username, password, options) {
  await ensureTabFocus(client, tabId);
  console.log(`[login] starting login flow for "${username}"...`);
  client.logInfo(tabId, `Starting login flow for "${username}"`, [kLoginTag]);
  const onHomepage = await ensureHomepage(client, tabId);
  if (!onHomepage) {
    client.logError(tabId, "Login must start from reddit.com homepage", [kLoginTag]);
    return {
      status: "invalid_page",
      message: "login must start from reddit.com homepage. Current page is not the homepage."
    };
  }
  console.log("[login] confirmed on reddit.com homepage \u2713");
  client.logInfo(tabId, "Confirmed on reddit.com homepage", [kLoginTag]);
  const profileState = await clickAvatarAndGetUsername(client, tabId, options);
  const targetUser = username.toLowerCase();
  if (profileState.loggedIn) {
    const currentUser = (profileState.username || "").toLowerCase();
    if (currentUser && currentUser === targetUser) {
      console.log(`[login] already logged in as "${profileState.username}" \u2014 success`);
      client.logInfo(tabId, `Already logged in as "${profileState.username}"`, ["login", "verify"]);
      await navigateBackToHomepage(client, tabId);
      return {
        status: "success",
        message: `already logged in as "${profileState.username}"`,
        data: { username: profileState.username, action: "noop" }
      };
    }
    const displayUser = currentUser || "unknown";
    console.log(`[login] current account "${displayUser}" != target "${username}" \u2014 logging out`);
    client.logWarn(tabId, `Logged in as "${displayUser}", logging out to switch`, [kLoginTag]);
    const loggedOut = await openDrawerAndLogout(client, tabId);
    if (!loggedOut) {
      console.log("[login] URL logout failed, force-clearing cookies...");
      await forceLogout(client, tabId);
      await client.tabNav(tabId, "https://www.reddit.com/", { waitFor: "networkidle", timeout: 15e3 });
      await humanPause(2e3, 4e3);
    }
    await humanPause(2e3, 4e3);
    const stillLoggedIn = await client.evaluateV2(tabId, `
        (function(){
          var h = document.querySelector('reddit-header-large, reddit-header-small');
          var root = (h && h.shadowRoot) ? h.shadowRoot : document;
          var btn = root.querySelector('#reddit-header-user-menu-button');
          return !!btn;
        })()
      `);
    if (stillLoggedIn.result) {
      console.log("[login] still appears logged in, force-clearing...");
      await forceLogout(client, tabId);
      await client.tabNav(tabId, "https://www.reddit.com/", { waitFor: "networkidle", timeout: 15e3 });
      await humanPause(2e3, 4e3);
    }
  } else {
    console.log("[login] not logged in \u2014 proceeding to login");
    client.logInfo(tabId, "Not logged in, proceeding to login", [kLoginTag]);
  }
  const onHP = await ensureHomepage(client, tabId);
  if (!onHP) {
    console.log("[login] navigating to homepage...");
    await client.tabNav(tabId, "https://www.reddit.com/", { waitFor: "networkidle", timeout: 15e3 });
    await humanPause(2e3, 4e3);
  }
  console.log("[login] locating login entry button on homepage...");
  let loginBtn = null;
  for (let attempt = 0; attempt < 8; attempt++) {
    loginBtn = await locateAndScrollByJS(client, tabId, JS_LOGIN_ENTRY_BUTTON);
    if (loginBtn) break;
    if (attempt === 0) {
      console.log("[login] scrolling to top to find login button...");
      for (let i = 0; i < 5; i++) {
        await client.humanMouseWheelTick(tabId, { x: 600, y: 300, direction: "up" });
        await humanPause(40, 80);
      }
      await humanPause(500, 1e3);
    } else {
      console.log(`[login] login button not found, retrying (${attempt + 1}/8)...`);
      await humanPause(1e3, 2e3);
    }
  }
  if (!loginBtn) {
    client.logError(tabId, "Could not locate login button on homepage", [kLoginTag]);
    return {
      status: "failed",
      message: "could not locate login button on homepage header"
    };
  }
  console.log(`[login] found login button at (${loginBtn.x}, ${loginBtn.y}) [${loginBtn.attrs?.target}]`);
  const clicked = await safeClick(client, tabId, loginBtn, options);
  if (!clicked) {
    console.log("[login] click failed, navigating to /login/ via JS...");
    await client.evaluateV2(tabId, `(function(){ location.href = '/login/'; return 'navigating'; })()`);
  }
  await humanPause(2e3, 4e3);
  const loginReady = await client.evaluateV2(tabId, `
    (function(){
      var onLoginPage = location.pathname.indexOf('/login') !== -1;
      if (onLoginPage) return 'url';
      var usernameInput = document.querySelector('#login-username, input[name="username"], input[autocomplete="username"]');
      var passwordInput = document.querySelector('#login-password, input[type="password"]');
      var hasUsername = usernameInput && usernameInput.getBoundingClientRect().width > 0;
      var hasPassword = passwordInput && passwordInput.getBoundingClientRect().width > 0;
      if (hasUsername || hasPassword) return 'form';
      return null;
    })()
  `);
  if (loginReady.result === "url") {
    console.log("[login] on /login/ page \u2713");
  } else if (loginReady.result === "form") {
    console.log("[login] login form visible (modal overlay) \u2713");
  } else {
    console.log("[login] login form not found, navigating to /login/...");
    await client.tabNav(tabId, "https://www.reddit.com/login/", { waitFor: "networkidle", timeout: 15e3 });
    await humanPause(2e3, 4e3);
  }
  console.log("[login] locating username/email input...");
  let usernameInput = await locateByJS(client, tabId, JS_LOGIN_USERNAME_INPUT);
  if (!usernameInput) {
    await humanPause(1e3, 2e3);
    usernameInput = await locateByJS(client, tabId, JS_LOGIN_USERNAME_INPUT);
  }
  if (!usernameInput) {
    client.logError(tabId, "Could not locate username input in login form", [kLoginTag]);
    return { status: "failed", message: "could not locate username input in login form" };
  }
  console.log(`[login] found username input at (${usernameInput.x}, ${usernameInput.y})`);
  client.logInfo(tabId, "Login form found, filling credentials", ["login", "form"]);
  await safeClick(client, tabId, usernameInput, options);
  await humanPause(300, 600);
  await client.evaluateV2(tabId, `(function(){
  var el = document.querySelector('#login-username');
  if (!el || !el.shadowRoot) return 'not-found';
  var input = el.shadowRoot.querySelector('input');
  if (!input) return 'no-input';
  input.focus();
  input.value = '';
  input.dispatchEvent(new Event('input', {bubbles: true}));
  return 'cleared';
})()`);
  await client.humanKeyboardCombo(tabId, { modifiers: ["Control"], key: "a" });
  await humanPause(100, 200);
  console.log(`[login] typing username (${username.length} chars)...`);
  await humanType(client, tabId, username);
  await humanPause(200, 500);
  console.log("[login] locating password input...");
  const passwordInput = await locateByJS(client, tabId, JS_LOGIN_PASSWORD_INPUT);
  if (!passwordInput) {
    client.logError(tabId, "Could not locate password input in login form", [kLoginTag]);
    return { status: "failed", message: "could not locate password input in login form" };
  }
  console.log(`[login] found password input at (${passwordInput.x}, ${passwordInput.y})`);
  await safeClick(client, tabId, passwordInput, options);
  await humanPause(300, 600);
  await client.evaluateV2(tabId, `(function(){
  var el = document.querySelector('#login-password');
  if (!el || !el.shadowRoot) return 'not-found';
  var input = el.shadowRoot.querySelector('input');
  if (!input) return 'no-input';
  input.focus();
  input.value = '';
  input.dispatchEvent(new Event('input', {bubbles: true}));
  return 'cleared';
})()`);
  await client.humanKeyboardCombo(tabId, { modifiers: ["Control"], key: "a" });
  await humanPause(100, 200);
  console.log(`[login] typing password (${password.length} chars)...`);
  await humanType(client, tabId, password);
  await humanPause(300, 800);
  console.log("[login] locating submit button...");
  const submitBtn = await locateByJS(client, tabId, JS_LOGIN_SUBMIT_BUTTON);
  if (!submitBtn) {
    console.log("[login] submit button not found, pressing Enter...");
    client.logWarn(tabId, "Submit button not found, falling back to Enter key", [kLoginTag]);
    await client.humanKeyboardPress(tabId, { key: "Enter" });
  } else {
    console.log(`[login] clicking submit at (${submitBtn.x}, ${submitBtn.y})`);
    client.logInfo(tabId, "Credentials typed, submitting login form", [kLoginTag]);
    await hoverWithHesitation(client, tabId, submitBtn, options);
    await safeClick(client, tabId, submitBtn, options);
  }
  console.log("[login] waiting for login to complete...");
  await humanPause(3e3, 6e3);
  console.log("[login] refreshing Reddit homepage to verify login...");
  await client.tabNav(tabId, "https://www.reddit.com/");
  await humanPause(1e3, 2e3);
  await client.evaluateV2(tabId, `(function(){ location.reload(); return 'reloaded'; })()`);
  await humanPause(2e3, 4e3);
  const finalState = await checkLoginState(client, tabId);
  if (!finalState.loggedIn) {
    client.logError(tabId, "Login failed: not logged in after submit", ["login", "verify"]);
    return {
      status: "failed",
      message: "login submit completed but not logged in (wrong credentials or rate limited)",
      data: { username }
    };
  }
  console.log(`[login] successfully logged in as "${finalState.username || username}"`);
  client.logInfo(tabId, `Login success: logged in as "${finalState.username || username}"`, ["login", "verify"]);
  return {
    status: "success",
    message: `logged in as "${finalState.username || username}"`,
    data: { username: finalState.username || username }
  };
}
async function getLoginState(client, tabId) {
  await ensureTabFocus(client, tabId);
  const state = await checkLoginState(client, tabId);
  return {
    status: "success",
    message: state.loggedIn ? `logged in as "${state.username || "unknown"}"` : "not logged in",
    data: state
  };
}
async function ensureLoggedIn(client, tabId, username, password, options) {
  await ensureTabFocus(client, tabId);
  const onHomepage = await ensureHomepage(client, tabId);
  if (!onHomepage) {
    console.log("[login] not on homepage, navigating to reddit.com...");
    await client.tabNav(tabId, "https://www.reddit.com/", {
      waitFor: "networkidle",
      timeout: 3e4
    });
    await humanPause(2e3, 4e3);
  }
  return loginToReddit(client, tabId, username, password, options);
}
async function main() {
  const cli = await getCliOptions();
  const tabId = requireTabId();
  let username = getCliArg("username");
  let password = getCliArg("password");
  if (!username) username = process.env.REDDIT_USERNAME;
  if (!password) password = process.env.REDDIT_PASSWORD;
  if (!username || !password) {
    console.log(
      JSON.stringify({
        status: "failed",
        message: "--username and --password are required (or set REDDIT_USERNAME / REDDIT_PASSWORD env vars)"
      })
    );
    process.exit(1);
  }
  const checkOnly = getCliArg("check");
  const client = new PinchTabClient({ baseUrl: cli.baseUrl, token: cli.token });
  let result;
  if (checkOnly) {
    result = await getLoginState(client, tabId);
  } else {
    result = await ensureLoggedIn(client, tabId, username, password);
  }
  outputResult(result);
}
runMain(main, "reddit-login.ts");
export {
  checkLoginState,
  ensureLoggedIn,
  getLoginState,
  loginToReddit
};
