import { PinchTabClient } from "../api.js";
import {
  humanClickElement,
  humanMouseMove,
  humanPause,
  humanScrollDown,
  locateByJS,
  ensureTabFocus,
  briefBrowseAfterAction,
  scrollToTopHuman,
  parseEvalResult
} from "./reddit-human.js";
import { goBack } from "./reddit-back.js";
import {
  getCliArg,
  getCliOptions,
  requireTabId,
  outputResult,
  runMain
} from "./cli.js";
const kTag = "inbox-chat";
const JS_CHAT_BTN = `(function(){
  var b=document.getElementById('header-action-item-chat-button');
  if(!b)return JSON.stringify(null);
  var r=b.getBoundingClientRect();
  if(r.width===0)return JSON.stringify(null);
  return JSON.stringify({x:Math.round(r.x+r.width/2),y:Math.round(r.y+r.height/2),w:Math.round(r.width),h:Math.round(r.height)});
})()`;
const JS_INBOX_BELL = `(function(){
  var el=document.getElementById('notifications-inbox-button');
  if(!el)return JSON.stringify(null);
  var r=el.getBoundingClientRect();
  if(r.width===0)return JSON.stringify(null);
  return JSON.stringify({x:Math.round(r.x+r.width/2),y:Math.round(r.y+r.height/2),w:Math.round(r.width),h:Math.round(r.height),attrs:{href:el.getAttribute('href')||'/notifications'}});
})()`;
const JS_UNREAD_BADGES = `(function(){
  function read(badge){
    if(!badge)return 0;
    var n=0;
    if(badge.shadowRoot){var t=(badge.shadowRoot.textContent||'').trim();var m=t.match(/\\d+/);if(m)n=parseInt(m[0],10);}
    if(!n){var ic=badge.getAttribute('initial-count');if(ic){var mi=ic.match(/\\d+/);if(mi)n=parseInt(mi[0],10);}}
    return n;
  }
  var chat=document.getElementById('header-action-item-chat-button-badge');
  var notif=document.querySelector('dynamic-badge[data-id="notification-count-element"]');
  return JSON.stringify({chat:read(chat),notifications:read(notif)});
})()`;
const RS_HOST_FIND = `var container=null;var __rsBest=-1;document.querySelectorAll('div').forEach(function(d){if(!d.shadowRoot)return;if(!d.shadowRoot.querySelector('rs-app'))return;var cs=getComputedStyle(d);var r=d.getBoundingClientRect();var score=(cs.position==='fixed'?1:0)*10000000+Math.round(r.width*r.height);if(score>__rsBest){__rsBest=score;container=d;}});`;
const JS_RS_APP_STATE = `(function(){
  ${RS_HOST_FIND}
  if(!container||!container.shadowRoot)return JSON.stringify({found:false});
  var app=container.shadowRoot.querySelector('rs-app');
  if(!app)return JSON.stringify({found:false});
  return JSON.stringify({found:true,hasShadow:!!app.shadowRoot});
})()`;
const JS_REQUESTS_BTN = `(function(){
  ${RS_HOST_FIND}
  if(!container||!container.shadowRoot)return JSON.stringify(null);
  var app=container.shadowRoot.querySelector('rs-app');
  if(!app||!app.shadowRoot)return JSON.stringify(null);
  var nav=app.shadowRoot.querySelector('rs-rooms-nav');
  if(!nav||!nav.shadowRoot)return JSON.stringify(null);
  var vs=nav.shadowRoot.querySelector('rs-virtual-scroll');
  if(!vs||!vs.shadowRoot)return JSON.stringify(null);
  // \u627E\u542B span[data-testid="nav-item-requests"] \u7684\u53EF\u70B9\u51FB\u9879\uFF08div[role=button]\uFF09
  var spans=vs.shadowRoot.querySelectorAll('span[data-testid="nav-item-requests"]');
  for(var i=0;i<spans.length;i++){
    var btn=spans[i].closest('div[role="button"],[role="button"],button,a');
    if(btn){var r=btn.getBoundingClientRect();if(r.width>5&&r.height>5)return JSON.stringify({x:Math.round(r.x+r.width/2),y:Math.round(r.y+r.height/2),w:Math.round(r.width),h:Math.round(r.height)});}
  }
  return JSON.stringify(null);
})()`;
const JS_REQUESTS_VIEW_STATE = `(function(){
  ${RS_HOST_FIND}
  if(!container||!container.shadowRoot)return JSON.stringify({found:false});
  var app=container.shadowRoot.querySelector('rs-app');
  if(!app||!app.shadowRoot)return JSON.stringify({found:false});
  var rv=app.shadowRoot.querySelector('rs-requests-view');
  return JSON.stringify({found:!!rv});
})()`;
const JS_REQUEST_ITEMS = `(function(){
  function vis(r){return r.width>2&&r.height>2&&r.bottom>0&&r.top<innerHeight&&r.right>0&&r.left<innerWidth;}
  ${RS_HOST_FIND}
  if(!container||!container.shadowRoot)return JSON.stringify([]);
  var app=container.shadowRoot.querySelector('rs-app');
  if(!app||!app.shadowRoot)return JSON.stringify([]);
  var rv=app.shadowRoot.querySelector('rs-requests-view');
  if(!rv||!rv.shadowRoot)return JSON.stringify([]);
  var vs=rv.shadowRoot.querySelector('rs-virtual-scroll');
  if(!vs||!vs.shadowRoot)return JSON.stringify([]);
  var items=vs.shadowRoot.querySelectorAll('rs-requests-view-request');
  var out=[];
  for(var i=0;i<items.length;i++){
    var item=items[i];if(!item.shadowRoot)continue;
    var ir=item.getBoundingClientRect();
    if(!vis(ir))continue;  // \u8DF3\u8FC7\u672A\u6E32\u67D3/\u9690\u85CF\u9879
    var room=item.getAttribute('room')||'';
    // sender: span.line-clamp-1.text-ellipsis\uFF08"from r/gaming"\uFF09
    var senderEl=item.shadowRoot.querySelector('span.line-clamp-1.text-ellipsis');
    var sender=senderEl?(senderEl.textContent||'').trim():'';
    // preview: span.text-neutral-content-strong.font-semibold
    var prevEl=item.shadowRoot.querySelector('span.text-neutral-content-strong');
    var preview=prevEl?(prevEl.textContent||'').trim():'';
    // isMod: span.text-global-moderator \u5B58\u5728
    var isMod=!!item.shadowRoot.querySelector('span.text-global-moderator, span.text-identity-moderator');
    out.push({room:room,sender:sender,preview:preview,isMod:isMod});
  }
  return JSON.stringify(out);
})()`;
function JS_REQUEST_ITEM_BUTTONS(room) {
  const cssEscaped = String(room).replace(/\\/g, "\\\\").replace(/"/g, '\\"');
  const jsEscaped = cssEscaped.replace(/\\/g, "\\\\").replace(/'/g, "\\'");
  return `(function(){
  function vis(r){return r.width>2&&r.height>2&&r.bottom>0&&r.top<innerHeight&&r.right>0&&r.left<innerWidth;}
  ${RS_HOST_FIND}
  if(!container||!container.shadowRoot)return JSON.stringify({viewReqBtn:null,btnDump:null});
  var app=container.shadowRoot.querySelector('rs-app');
  if(!app||!app.shadowRoot)return JSON.stringify({viewReqBtn:null,btnDump:null});
  var rv=app.shadowRoot.querySelector('rs-requests-view');
  if(!rv||!rv.shadowRoot)return JSON.stringify({viewReqBtn:null,btnDump:null});
  var vs=rv.shadowRoot.querySelector('rs-virtual-scroll');
  if(!vs||!vs.shadowRoot)return JSON.stringify({viewReqBtn:null,btnDump:null});
  var item=vs.shadowRoot.querySelector('rs-requests-view-request[room="${jsEscaped}"]');
  if(!item||!item.shadowRoot)return JSON.stringify({viewReqBtn:null,btnDump:null});
  var vrb=null;var dump=[];
  var btns=item.shadowRoot.querySelectorAll('button,[role="button"]');
  for(var j=0;j<btns.length;j++){
    var b=btns[j];var r=b.getBoundingClientRect();
    if(!vis(r))continue;
    var cls=b.className||'';
    var al=(b.getAttribute('aria-label')||'').trim();
    var ti=(b.getAttribute('data-testid')||b.getAttribute('test-id')||'').trim();
    dump.push({i:j,text:(b.textContent||'').trim().slice(0,40),role:b.getAttribute('role')||'',aria:al,testid:ti,primary:cls.indexOf('button-primary')>=0});
    if(!vrb&&cls.indexOf('button-primary')>=0){vrb={x:Math.round(r.x+r.width/2),y:Math.round(r.y+r.height/2),w:Math.round(r.width),h:Math.round(r.height)};}
  }
  return JSON.stringify({viewReqBtn:vrb,btnDump:vrb?null:dump});
})()`;
}
const JS_ROOM_STATE = `(function(){
  ${RS_HOST_FIND}
  if(!container||!container.shadowRoot)return JSON.stringify({found:false});
  var app=container.shadowRoot.querySelector('rs-app');
  if(!app||!app.shadowRoot)return JSON.stringify({found:false});
  // \u7CBE\u786E\u5339\u914D rs-room\uFF08\u4E0D\u80FD\u5339\u914D rs-rooms-nav\uFF09
  var room=app.shadowRoot.querySelector('rs-room');
  return JSON.stringify({found:!!room});
})()`;
const JS_ROOM_MESSAGE = `(function(){
  ${RS_HOST_FIND}
  if(!container||!container.shadowRoot)return JSON.stringify(null);
  var app=container.shadowRoot.querySelector('rs-app');
  if(!app||!app.shadowRoot)return JSON.stringify(null);
  var room=app.shadowRoot.querySelector('rs-room');
  if(!room||!room.shadowRoot)return JSON.stringify(null);
  // \u627E rs-timeline
  var tl=room.shadowRoot.querySelector('rs-timeline');
  var sender='';var timestamp='';var fullText='';
  if(tl&&tl.shadowRoot){
    var evt=tl.shadowRoot.querySelector('rs-timeline-event');
    if(evt){
      var sn=evt.querySelector('span.user-name');if(sn)sender=(sn.textContent||'').trim();
      var tm=evt.querySelector('time[datetime]');if(tm)timestamp=tm.getAttribute('datetime')||'';
      var rt=evt.querySelector('rs-rtjson-renderer');
      if(rt)fullText=(rt.textContent||'').replace(/\\s+/g,' ').trim();
    }
  }
  return JSON.stringify({sender:sender,timestamp:timestamp,fullText:fullText});
})()`;
const JS_MARKREAD_BTN = `(function(){
  function vis(r){return r.width>2&&r.height>2&&r.bottom>0&&r.top<innerHeight&&r.right>0&&r.left<innerWidth;}
  ${RS_HOST_FIND}
  if(!container||!container.shadowRoot)return JSON.stringify(null);
  var app=container.shadowRoot.querySelector('rs-app');
  if(!app||!app.shadowRoot)return JSON.stringify(null);
  var nav=app.shadowRoot.querySelector('rs-rooms-nav');
  if(!nav||!nav.shadowRoot)return JSON.stringify(null);
  var svg=nav.shadowRoot.querySelector('svg[icon-name="mark-read"]');
  if(!svg)return JSON.stringify(null);
  var btn=svg.closest('button,[role="button"]');
  if(!btn)return JSON.stringify(null);
  var r=btn.getBoundingClientRect();
  if(!vis(r))return JSON.stringify(null);
  return JSON.stringify({x:Math.round(r.x+r.width/2),y:Math.round(r.y+r.height/2),w:Math.round(r.width),h:Math.round(r.height)});
})()`;
const JS_DIALOG_STATE = `(function(){
  var dl=document.querySelector('rs-rpl-dialog-content');
  if(!dl)return JSON.stringify({found:false});
  return JSON.stringify({found:true,hasShadow:!!dl.shadowRoot});
})()`;
const JS_CONFIRM_BTN = `(function(){
  function vis(r){return r.width>2&&r.height>2&&r.bottom>0&&r.top<innerHeight&&r.right>0&&r.left<innerWidth;}
  var dl=document.querySelector('rs-rpl-dialog-content');
  if(!dl||!dl.shadowRoot)return JSON.stringify(null);
  var footer=dl.shadowRoot.querySelector('footer,[class*="footer"],[slot="footer"]');
  if(!footer)return JSON.stringify(null);
  var btns=footer.querySelectorAll('button,[role="button"]');
  for(var i=0;i<btns.length;i++){
    var b=btns[i];var cls=(b.className||'').toString();
    if(/button-primary/i.test(cls)){
      var r=b.getBoundingClientRect();
      if(vis(r))return JSON.stringify({x:Math.round(r.x+r.width/2),y:Math.round(r.y+r.height/2),w:Math.round(r.width),h:Math.round(r.height)});
    }
  }
  return JSON.stringify(null);
})()`;
const JS_NOTIFICATIONS_DATA = `(function(){
  function vis(r){return r.width>2&&r.height>2&&r.bottom>0&&r.top<innerHeight&&r.right>0&&r.left<innerWidth;}
  function typeOf(href){
    if(!href)return 'other';
    if(href.indexOf('/achievements/')>=0)return 'achievements';
    if(href.indexOf('/comments/')>=0||href.indexOf('/comment/')>=0)return 'comments';
    return 'other';
  }
  var rows=document.querySelectorAll('rpl-inbox-row');
  var out=[];
  for(var i=0;i<rows.length;i++){
    var row=rows[i];
    var r=row.getBoundingClientRect();
    if(!vis(r))continue;
    var href=row.getAttribute('inaccessiblehref')||'';
    var sel=row.getAttribute('selected');
    out.push({
      href:href,
      type:typeOf(href),
      unread:(sel===null?false:true),  // selected="" \u2192 \u672A\u8BFB\uFF1Bselected \u4E0D\u5B58\u5728(null) \u2192 \u5DF2\u8BFB
      x:Math.round(r.x+r.width/2),y:Math.round(r.y+r.height/2),
      w:Math.round(r.width),h:Math.round(r.height)
    });
  }
  var unreadCount=0;for(var k=0;k<out.length;k++){if(out[k].unread)unreadCount++;}
  return JSON.stringify({rows:out,totalCount:out.length,unreadCount:unreadCount});
})()`;
function JS_NOTIF_ROW_BY_HREF(href) {
  const cssEscaped = String(href).replace(/\\/g, "\\\\").replace(/"/g, '\\"');
  const jsEscaped = cssEscaped.replace(/\\/g, "\\\\").replace(/'/g, "\\'");
  return `(function(){
    function vis(r){return r.width>2&&r.height>2&&r.bottom>0&&r.top<innerHeight&&r.right>0&&r.left<innerWidth;}
    var rows=document.querySelectorAll('rpl-inbox-row[inaccessiblehref="${jsEscaped}"]');
    for(var i=0;i<rows.length;i++){
      var r=rows[i].getBoundingClientRect();
      if(vis(r))return JSON.stringify({x:Math.round(r.x+r.width/2),y:Math.round(r.y+r.height/2),w:Math.round(r.width),h:Math.round(r.height)});
    }
    return JSON.stringify(null);
  })()`;
}
const JS_FIRST_NOTIF = `(function(){
  function vis(r){return r.width>2&&r.height>2&&r.bottom>0&&r.top<innerHeight&&r.right>0&&r.left<innerWidth;}
  var rows=document.querySelectorAll('rpl-inbox-row');
  for(var i=0;i<rows.length;i++){
    var row=rows[i];var href=row.getAttribute('inaccessiblehref')||'';
    if(!href)continue;
    var r=row.getBoundingClientRect();
    if(vis(r))return JSON.stringify({x:Math.round(r.x+r.width/2),y:Math.round(r.y+r.height/2),w:Math.round(r.width),h:Math.round(r.height),href:href});
  }
  return JSON.stringify(null);
})()`;
async function readUnreadBadges(client, tabId) {
  await ensureTabFocus(client, tabId);
  try {
    const res = await client.evaluateV2(tabId, JS_UNREAD_BADGES);
    const data = parseEvalResult(res.result);
    if (data && typeof data.chat === "number" && typeof data.notifications === "number") {
      client.logInfo(tabId, `unread badges: chat=${data.chat} notif=${data.notifications}`, [kTag]);
      return { chat: data.chat, notifications: data.notifications };
    }
  } catch (e) {
    client.logWarn(tabId, `readUnreadBadges error: ${e?.message || e}`, [kTag]);
  }
  client.logWarn(tabId, "unread badges unreadable, defaulting to 0", [kTag]);
  return { chat: 0, notifications: 0 };
}
async function readChatMessages(client, tabId) {
  await ensureTabFocus(client, tabId);
  client.logInfo(tabId, "Starting chat messages read", [kTag]);
  const messages = [];
  const chatBtn = await locateByJS(client, tabId, JS_CHAT_BTN);
  if (!chatBtn) {
    client.logWarn(tabId, "chat button not found", [kTag]);
    return { messages, requestCount: 0 };
  }
  await humanMouseMove(client, tabId, chatBtn.x - 40, chatBtn.y);
  await humanPause(300, 600);
  try {
    await humanClickElement(client, tabId, chatBtn, { skipMoveAway: true });
    client.logInfo(tabId, "clicked chat button", [kTag]);
  } catch (e) {
    if (e?.status === 409) {
      client.logInfo(tabId, "chat click 409 (nav)", [kTag]);
    } else {
      client.logWarn(tabId, `chat click error: ${e?.message || e}`, [kTag]);
      return { messages, requestCount: 0 };
    }
  }
  await humanPause(2500, 3500);
  const appOk = await pollState(client, tabId, JS_RS_APP_STATE, "found");
  if (!appOk) {
    client.logWarn(tabId, "rs-app did not appear", [kTag]);
    return { messages, requestCount: 0 };
  }
  const reqBtn = await locateByJS(client, tabId, JS_REQUESTS_BTN);
  if (!reqBtn) {
    client.logWarn(tabId, "Requests nav button not found", [kTag]);
    await closeChatModule(client, tabId);
    return { messages, requestCount: 0 };
  }
  await humanMouseMove(client, tabId, reqBtn.x, reqBtn.y);
  await humanPause(400, 800);
  try {
    await humanClickElement(client, tabId, reqBtn, { skipMoveAway: true });
  } catch (e) {
    client.logWarn(tabId, `Requests click error: ${e?.message || e}`, [kTag]);
  }
  await humanPause(2e3, 3e3);
  const rvOk = await pollState(client, tabId, JS_REQUESTS_VIEW_STATE, "found");
  if (!rvOk) {
    client.logWarn(tabId, "rs-requests-view did not appear", [kTag]);
    await closeChatModule(client, tabId);
    return { messages, requestCount: 0 };
  }
  const res = await client.evaluateV2(tabId, JS_REQUEST_ITEMS);
  const items = parseEvalResult(res.result) || [];
  client.logInfo(tabId, `found ${items.length} request items`, [kTag]);
  const badges = await readUnreadBadges(client, tabId);
  const clickN = Math.min(items.length, Math.floor(Math.random() * 4));
  const shuffledItems = [...items];
  for (let i = shuffledItems.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffledItems[i], shuffledItems[j]] = [shuffledItems[j], shuffledItems[i]];
  }
  const toCheck = shuffledItems.slice(0, clickN);
  client.logInfo(tabId, `will read ${toCheck.length}/${items.length} request items`, [kTag]);
  for (const item of toCheck) {
    let viewReqBtn = null;
    let viewReqDump = null;
    try {
      const bres = await client.evaluateV2(tabId, JS_REQUEST_ITEM_BUTTONS(item.room));
      const b = parseEvalResult(bres.result);
      viewReqBtn = b?.viewReqBtn ?? null;
      viewReqDump = b?.btnDump ?? null;
    } catch (e) {
      client.logWarn(tabId, `fresh viewReqBtn read error for ${item.room}: ${e?.message || e}`, [kTag]);
    }
    if (!viewReqBtn) {
      messages.push({
        room: item.room,
        sender: item.sender,
        isMod: item.isMod,
        timestamp: "",
        preview: item.preview,
        fullText: ""
      });
      client.logWarn(tabId, `no viewReqBtn for ${item.room}, metadata only; buttons=${JSON.stringify(viewReqDump) ?? "n/a"}`, [kTag]);
      continue;
    }
    await humanMouseMove(client, tabId, viewReqBtn.x - 30, viewReqBtn.y);
    await humanPause(300, 600);
    try {
      await humanClickElement(client, tabId, viewReqBtn, { skipMoveAway: true });
    } catch (e) {
      client.logWarn(tabId, `View Request click error: ${e?.message || e}`, [kTag]);
      continue;
    }
    await humanPause(2500, 3500);
    const roomOk = await pollState(client, tabId, JS_ROOM_STATE, "found");
    if (!roomOk) {
      client.logWarn(tabId, `rs-room did not appear for ${item.room}`, [kTag]);
      continue;
    }
    const rres = await client.evaluateV2(tabId, JS_ROOM_MESSAGE);
    const msg = parseEvalResult(rres.result);
    messages.push({
      room: item.room,
      sender: msg?.sender || item.sender,
      isMod: item.isMod,
      timestamp: msg?.timestamp || "",
      preview: item.preview,
      fullText: msg?.fullText || ""
    });
    client.logInfo(tabId, `read full text for ${item.room}`, [kTag]);
    await humanScrollDown(client, tabId, 80 + Math.round(Math.random() * 120), { noReadingFollow: false });
    await humanPause(2e3, 4e3);
    const isLast = item === toCheck[toCheck.length - 1];
    if (!isLast) {
      const navOk = await clickRequestsNav(client, tabId);
      if (!navOk) {
        client.logWarn(tabId, `could not return to requests-view via nav; stopping at ${item.room}`, [kTag]);
        break;
      }
    }
  }
  if (badges.chat > 0) {
    await markAllRead(client, tabId);
  } else {
    client.logInfo(tabId, "no chat unread, skip mark-read", [kTag]);
  }
  await closeChatModule(client, tabId);
  return { messages, requestCount: items.length };
}
async function clickRequestsNav(client, tabId) {
  const loc = await locateByJS(client, tabId, JS_REQUESTS_BTN);
  if (!loc) return false;
  await humanMouseMove(client, tabId, loc.x, loc.y);
  await humanPause(300, 600);
  try {
    await humanClickElement(client, tabId, loc, { skipMoveAway: true });
    await humanPause(2e3, 3e3);
    return await pollState(client, tabId, JS_REQUESTS_VIEW_STATE, "found");
  } catch (e) {
    client.logWarn(tabId, `clickRequestsNav error: ${e?.message || e}`, [kTag]);
    return false;
  }
}
async function markAllRead(client, tabId) {
  const markBtn = await locateByJS(client, tabId, JS_MARKREAD_BTN);
  if (!markBtn) {
    client.logWarn(tabId, "mark-read btn not found", [kTag]);
    return;
  }
  await humanMouseMove(client, tabId, markBtn.x, markBtn.y);
  await humanPause(400, 800);
  try {
    await humanClickElement(client, tabId, markBtn, { skipMoveAway: true });
  } catch (e) {
    client.logWarn(tabId, `mark-read click error: ${e?.message || e}`, [kTag]);
    return;
  }
  client.logInfo(tabId, "clicked mark-read", [kTag]);
  const dlgOk = await pollState(client, tabId, JS_DIALOG_STATE, "found");
  if (!dlgOk) {
    client.logWarn(tabId, "confirm dialog did not appear after mark-read", [kTag]);
    return;
  }
  const confirmBtn = await locateByJS(client, tabId, JS_CONFIRM_BTN);
  if (!confirmBtn) {
    client.logWarn(tabId, "confirm btn (button-primary) not found", [kTag]);
    return;
  }
  await humanMouseMove(client, tabId, confirmBtn.x, confirmBtn.y);
  await humanPause(400, 800);
  try {
    await humanClickElement(client, tabId, confirmBtn, { skipMoveAway: true });
    client.logInfo(tabId, "confirmed mark all read", [kTag]);
  } catch (e) {
    client.logWarn(tabId, `confirm click error: ${e?.message || e}`, [kTag]);
  }
  await humanPause(1500, 2500);
}
async function pollState(client, tabId, jsExpr, _field) {
  for (let i = 0; i < 20; i++) {
    try {
      const res = await client.evaluateV2(tabId, jsExpr);
      const d = parseEvalResult(res.result);
      if (d?.found) return true;
    } catch {
    }
    await humanPause(250, 450);
  }
  return false;
}
async function closeChatModule(client, tabId) {
  const chatBtn = await locateByJS(client, tabId, JS_CHAT_BTN);
  if (!chatBtn) {
    client.logWarn(tabId, "closeChatModule: chat btn not found", [kTag]);
    return;
  }
  await humanMouseMove(client, tabId, chatBtn.x, chatBtn.y);
  await humanPause(400, 800);
  try {
    await humanClickElement(client, tabId, chatBtn, { skipMoveAway: true });
    await humanPause(1500, 2500);
    const chk = await client.evaluateV2(tabId, `(function(){var ch=document.querySelector('reddit-chat-header-button');return JSON.stringify({iv:ch?ch.getAttribute('initial-view'):null});})()`);
    const d = parseEvalResult(chk.result);
    if (d?.iv === "closed") {
      client.logInfo(tabId, "chat module closed", [kTag]);
    } else {
      client.logWarn(tabId, `chat module may not be closed (iv=${d?.iv})`, [kTag]);
    }
  } catch (e) {
    client.logWarn(tabId, `closeChatModule error: ${e?.message || e}`, [kTag]);
  }
}
async function readNotifications(client, tabId) {
  await ensureTabFocus(client, tabId);
  client.logInfo(tabId, "Starting notifications read", [kTag]);
  const bell = await locateByJS(client, tabId, JS_INBOX_BELL);
  if (!bell) {
    client.logWarn(tabId, "notification bell not found", [kTag]);
    return { count: 0, notifications: [], clickedCount: 0 };
  }
  await humanMouseMove(client, tabId, bell.x - 40, bell.y);
  await humanPause(400, 800);
  try {
    await humanClickElement(client, tabId, bell, { skipMoveAway: true });
    client.logInfo(tabId, "clicked bell", [kTag]);
  } catch (e) {
    if (e?.status !== 409) {
      client.logWarn(tabId, `bell click error: ${e?.message || e}`, [kTag]);
      return { count: 0, notifications: [], clickedCount: 0 };
    }
  }
  await humanPause(2500, 4e3);
  const urlChk = await client.pageUrl(tabId);
  if (!urlChk.url?.includes("/notifications")) {
    client.logWarn(tabId, "did not reach /notifications", [kTag]);
    return { count: 0, notifications: [], clickedCount: 0 };
  }
  await scrollToTopHuman(client, tabId);
  await humanPause(500, 1e3);
  await humanScrollDown(client, tabId, 80 + Math.round(Math.random() * 120), {});
  await humanPause(1500, 3e3);
  let data = null;
  try {
    const res = await client.evaluateV2(tabId, JS_NOTIFICATIONS_DATA);
    data = parseEvalResult(res.result);
  } catch {
    client.logWarn(tabId, "could not extract notifications", [kTag]);
  }
  const rows = data?.rows || [];
  const count = data?.totalCount || rows.length;
  const unreadRows = rows.filter((r) => r.unread);
  client.logInfo(tabId, `found ${rows.length} rows (${unreadRows.length} unread)`, [kTag]);
  const priorityTypes = ["achievements", "comments"];
  let pool = unreadRows.filter((r) => priorityTypes.includes(r.type));
  if (pool.length === 0) pool = unreadRows;
  if (pool.length === 0) pool = rows.filter((r) => priorityTypes.includes(r.type));
  if (pool.length === 0) pool = rows;
  if (pool.length === 0) {
    client.logInfo(tabId, "no notification rows to click", [kTag]);
    try {
      await goBack(client, tabId);
      await humanPause(1500, 2500);
    } catch (e) {
      client.logWarn(tabId, `goBack after notifications failed: ${e?.message || e}`, [kTag]);
    }
    return { count, notifications: [], clickedCount: 0 };
  }
  const n = Math.min(pool.length, Math.floor(Math.random() * 4));
  const shuffled = [...pool];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  const toClick = shuffled.slice(0, n);
  let clickedCount = 0;
  for (const row of toClick) {
    const ok = await clickNotificationByHref(client, tabId, row.href);
    if (ok) clickedCount++;
  }
  try {
    await goBack(client, tabId);
    await humanPause(1500, 2500);
  } catch (e) {
    client.logWarn(tabId, `goBack after notifications failed: ${e?.message || e}`, [kTag]);
  }
  return { count, notifications: rows.map((r) => ({ href: r.href, text: r.type })), clickedCount };
}
async function clickNotificationByHref(client, tabId, href) {
  const loc = await locateByJS(client, tabId, JS_NOTIF_ROW_BY_HREF(href));
  if (!loc) {
    client.logWarn(tabId, `notif row not found for ${href}`, [kTag]);
    return false;
  }
  try {
    await humanClickElement(client, tabId, loc, { skipMoveAway: true });
    await humanPause(2e3, 4e3);
    await humanScrollDown(client, tabId, 60 + Math.round(Math.random() * 100), {});
    await humanPause(1500, 3e3);
    await briefBrowseAfterAction(client, tabId);
    await goBack(client, tabId);
    await humanPause(2e3, 3e3);
    return true;
  } catch (e) {
    client.logWarn(tabId, `notif click error: ${e?.message || e}`, [kTag]);
    return false;
  }
}
async function runInboxChat(client, tabId, scope = "all", _options) {
  await ensureTabFocus(client, tabId);
  client.logInfo(tabId, `runInboxChat scope=${scope}`, [kTag]);
  const badges = await readUnreadBadges(client, tabId);
  if (scope === "check") {
    return {
      status: "success",
      message: "unread badges checked",
      data: { chatUnread: badges.chat, notifUnread: badges.notifications }
    };
  }
  const doChat = scope === "chat" || scope === "all";
  const doNotif = scope === "notifications" || scope === "all";
  const chatFirst = Math.random() < 0.5;
  let chatResult = null;
  let notifResult = null;
  if (chatFirst) {
    if (doChat) {
      try {
        chatResult = await readChatMessages(client, tabId);
      } catch (e) {
        client.logWarn(tabId, `readChatMessages failed: ${e?.message || e}`, [kTag]);
      }
    }
    if (doNotif) {
      try {
        notifResult = await readNotifications(client, tabId);
      } catch (e) {
        client.logWarn(tabId, `readNotifications failed: ${e?.message || e}`, [kTag]);
      }
    }
  } else {
    if (doNotif) {
      try {
        notifResult = await readNotifications(client, tabId);
      } catch (e) {
        client.logWarn(tabId, `readNotifications failed: ${e?.message || e}`, [kTag]);
      }
    }
    if (doChat) {
      try {
        chatResult = await readChatMessages(client, tabId);
      } catch (e) {
        client.logWarn(tabId, `readChatMessages failed: ${e?.message || e}`, [kTag]);
      }
    }
  }
  return {
    status: "success",
    message: "inbox checked",
    data: {
      chatUnread: badges.chat,
      notifUnread: badges.notifications,
      scope,
      chatMessages: chatResult?.messages ?? [],
      notifications: notifResult?.notifications ?? [],
      notifClickedCount: notifResult?.clickedCount ?? 0
    }
  };
}
async function main() {
  const cli = await getCliOptions();
  const tabId = requireTabId();
  const client = new PinchTabClient({ baseUrl: cli.baseUrl, token: cli.token });
  const scope = getCliArg("scope") ?? "all";
  if (!["check", "chat", "notifications", "all"].includes(scope)) {
    console.log(JSON.stringify({ status: "failed", message: `invalid --scope: ${scope}` }));
    process.exit(1);
  }
  const result = await runInboxChat(client, tabId, scope);
  outputResult(result);
}
runMain(main, "reddit-inbox-chat.ts");
export {
  readChatMessages,
  readNotifications,
  readUnreadBadges,
  runInboxChat
};
