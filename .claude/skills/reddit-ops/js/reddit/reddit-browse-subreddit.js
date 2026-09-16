import { PinchTabClient } from "../api.js";
import {
  humanPause,
  humanClickElement,
  humanMouseMove,
  humanScrollDown,
  hoverWithHesitation,
  humanType,
  locateByJS,
  locateAndScrollByJS,
  pollLocate,
  ensureTabFocus,
  briefBrowseAfterAction,
  middleClickAt,
  waitForNewTab,
  findInstanceIdForTab
} from "./reddit-human.js";
import { ev } from "./reddit-edit-avatar.js";
import { goBack } from "./reddit-back.js";
import {
  getCliArg,
  getCliOptions,
  requireTabId,
  outputResult,
  runMain
} from "./cli.js";
const kTag = "browse-sub";
const JS_SUBREDDIT_NAME = `(function(){
  var m = location.pathname.match(/^\\/r\\/([^/]+)/i);
  return JSON.stringify(m ? m[1] : "");
})()`;
const JS_ACTIVITY_STATS = `(function(){
  var el = null;
  (function hunt(root){
    root.querySelectorAll('[data-testid="activity-indicators"]').forEach(function(n){
      if(!el){var r=n.getBoundingClientRect();if(r.width>50)el=n;}
    });
    var all=root.querySelectorAll("*");
    for(var j=0;j<all.length;j++)if(all[j].shadowRoot)hunt(all[j].shadowRoot);
  })(document);
  if(!el)return JSON.stringify(null);
  return JSON.stringify({raw:(el.textContent||"").replace(/\\s+/g," ").trim().slice(0,160)});
})()`;
const JS_RULES = `(function(){
  var out=[];
  var sels=document.querySelectorAll("faceplate-expandable-section-helper");
  sels.forEach(function(sec){
    var tr=sec.querySelector('faceplate-tracker[noun="rules"]');
    var sum=sec.querySelector("summary");
    if(!tr||!sum)return;
    var h2=tr.querySelector("h2,h3,h4");
    var short=(h2?h2.textContent:tr.textContent||"").replace(/\\s+/g," ").trim().slice(0,80);
    var cid=sum.getAttribute("aria-controls")||"";
    var fullEl=cid?document.getElementById(cid):null;
    var full=fullEl?(fullEl.textContent||"").replace(/\\s+/g," ").trim().slice(0,400):"";
    var r=sum.getBoundingClientRect();
    if(r.width===0)return;
    out.push({short:short,uuid:cid.replace(/^rule-/,""),full:full,
      x:Math.round(r.x+r.width/2),y:Math.round(r.y+r.height/2),w:Math.round(r.width),h:Math.round(r.height),
      expanded:sum.getAttribute("aria-expanded")==="true"});
  });
  return JSON.stringify(out);
})()`;
const JS_RULE_SUMMARY = (uuid) => `(function(){
  var sum=document.querySelector('faceplate-expandable-section-helper summary[aria-controls="rule-${uuid}"]');
  if(!sum)return JSON.stringify(null);
  var r=sum.getBoundingClientRect();
  if(r.width===0)return JSON.stringify(null);
  return JSON.stringify({x:Math.round(r.x+r.width/2),y:Math.round(r.y+r.height/2),w:Math.round(r.width),h:Math.round(r.height),expanded:sum.getAttribute("aria-expanded")==="true"});
})()`;
const JS_MODERATORS = `(function(){
  // \u951A\u5B9A #right-sidebar-container\uFF08confirmed \u7A33\u5B9A\uFF09\u2014\u2014\u4E0D\u518D\u7528 r.x>900 \u731C\u53F3\u680F\uFF0C\u7A84\u5C4F\u4E0B\u4FA7\u680F
  // x<900 \u4F1A\u5BFC\u81F4 moderators \u5168\u4E22\uFF08\u6613\u9519\u9879 C\uFF09\u3002\u5BB9\u5668\u4E0D\u5B58\u5728\u65F6\u9000\u5316\u4E3A innerWidth*0.55 \u515C\u5E95\u3002
  var rs=document.querySelector('#right-sidebar-container');var scoped=!!rs;
  function vis(r){return r.width>5&&r.height>5&&(scoped||r.x>innerWidth*0.55);}
  var mods=[],viewAll=null;
  (function hunt(root){
    root.querySelectorAll("a").forEach(function(a){
      var href=a.getAttribute("href")||"";
      var r=a.getBoundingClientRect();
      if(href.indexOf("/user/")>=0&&vis(r)){
        var name=(a.textContent||"").replace(/\\s+/g," ").trim().slice(0,40);
        if(name)mods.push({name:name,href:href.slice(0,48)});
      }
      if(href.indexOf("/moderators")>=0&&href.indexOf("/mod/")>=0&&vis(r)){
        viewAll={text:(a.textContent||"").trim().slice(0,40),href:href.slice(0,60)};
      }
    });
    var all=root.querySelectorAll("*");
    for(var j=0;j<all.length;j++)if(all[j].shadowRoot)hunt(all[j].shadowRoot);
  })(rs||document);
  // \u53BB\u91CD + \u53BB\u6389\u5F53\u524D flair host \u91CC\u7684\u7528\u6237\u540D
  var seen={},ret=[];
  for(var i=0;i<mods.length;i++){var m=mods[i];if(!seen[m.name]){seen[m.name]=1;ret.push(m);}}
  return JSON.stringify({moderators:ret.slice(0,30),viewAll:viewAll});
})()`;
const JS_ABOUT = `(function(){
  // \u951A\u5B9A #right-sidebar-container\uFF08\u540C JS_MODERATORS\uFF0C\u6613\u9519\u9879 C\uFF09\uFF1B\u7F3A\u5BB9\u5668\u65F6 innerWidth*0.55 \u515C\u5E95\u3002
  var rs=document.querySelector('#right-sidebar-container');var scoped=!!rs;
  function vis(r){return r.width>5&&r.height>5&&(scoped||r.x>innerWidth*0.55);}
  // \u627E\u53F3\u680F\u63CF\u8FF0/\u5173\u4E8E\u6587\u672C\uFF1Acommunity-highlight \u6216 description \u533A
  var desc="";
  (function hunt(root){
    if(desc)return;
    root.querySelectorAll('[data-testid="community-description"],.description,[slot="description"]').forEach(function(d){
      if(!desc){var t=(d.textContent||"").replace(/\\s+/g," ").trim();if(t.length>10)desc=t.slice(0,300);}
    });
    var all=root.querySelectorAll("*");
    for(var j=0;j<all.length;j++)if(all[j].shadowRoot)hunt(all[j].shadowRoot);
  })(rs||document);
  // bookmarks\uFF1Afaceplate-tracker[noun=wiki] \u6240\u5728\u7684\u5217\u8868\u533A + \u5468\u8FB9 a[href]
  var bms=[];
  (function hunt(root){
    root.querySelectorAll("a").forEach(function(a){
      var r=a.getBoundingClientRect();if(!vis(r))return;
      var href=a.getAttribute("href")||"";
      var txt=(a.textContent||"").replace(/\\s+/g," ").trim().slice(0,40);
      // \u53F3\u680F widget \u533A\u7684\u94FE\u63A5\uFF1Awiki / about / search / \u5916\u94FE / comments
      if(href&&(href.indexOf("/wiki/")>=0||href.indexOf("/about/")>=0||href.indexOf("/comments")>=0||href.indexOf("/search?")>=0||href.indexOf("http")===0)&&txt.length>1){
        bms.push({text:txt,href:href.slice(0,80)});
      }
    });
    var all=root.querySelectorAll("*");
    for(var j=0;j<all.length;j++)if(all[j].shadowRoot)hunt(all[j].shadowRoot);
  })(rs||document);
  // \u53BB\u91CD
  var seen={},ret=[];
  for(var i=0;i<bms.length;i++){var b=bms[i];var k=b.href+b.text;if(!seen[k]){seen[k]=1;ret.push(b);}}
  return JSON.stringify({description:desc,bookmarks:ret.slice(0,20)});
})()`;
const JS_WIKI_LINK = `(function(){
  // \u951A\u5B9A #right-sidebar-container\uFF08wiki widget \u5728\u53F3\u680F\uFF0C\u6613\u9519\u9879 C\uFF09\uFF1B\u7F3A\u5BB9\u5668\u5219\u5168\u6587\u6863\u515C\u5E95\u3002
  var rs=document.querySelector('#right-sidebar-container')||document;var a=null;
  (function hunt(root){
    root.querySelectorAll('faceplate-tracker[noun="wiki"]').forEach(function(tr){
      if(a)return;
      var link=tr.querySelector('a[href*="/wiki/"]')||(tr.tagName.toLowerCase()==="a"?tr:null);
      if(link){var r=link.getBoundingClientRect();if(r.width>0)a=link;}
    });
    if(a)return;
    root.querySelectorAll('a[href*="/wiki/index"]').forEach(function(link){
      if(a)return;var r=link.getBoundingClientRect();if(r.width>0)a=link;
    });
    var all=root.querySelectorAll("*");
    for(var j=0;j<all.length;j++)if(all[j].shadowRoot)hunt(all[j].shadowRoot);
  })(rs);
  if(!a)return JSON.stringify(null);
  var r=a.getBoundingClientRect();
  return JSON.stringify({x:Math.round(r.x+r.width/2),y:Math.round(r.y+r.height/2),w:Math.round(r.width),h:Math.round(r.height),href:a.getAttribute("href")});
})()`;
const JS_WIKI_INDEX = `(function(){
  var md=document.querySelector(".md.wiki, main#main-content");
  var chars=md?(md.textContent||"").length:0;
  var pages=[];
  document.querySelectorAll('a[href*="/wiki/"]').forEach(function(a){
    var href=a.getAttribute("href")||"";
    if(href.indexOf("/wiki/index")>=0||href.indexOf("/wiki/revisions")>=0||href.indexOf("show_source")>=0)return;
    var txt=(a.textContent||"").replace(/\\s+/g," ").trim().slice(0,40);
    if(txt&&txt.length>1)pages.push({text:txt,href:href.slice(0,80)});
  });
  var seen={},ret=[];
  for(var i=0;i<pages.length;i++){var p=pages[i];var k=p.href;if(!seen[k]){seen[k]=1;ret.push(p);}}
  return JSON.stringify({indexChars:chars,pages:ret.slice(0,40)});
})()`;
const JS_FLAIR_HOST = `(function(){
  var h=document.querySelector("community-author-flair");
  if(!h)return JSON.stringify({exists:false});
  var r=h.getBoundingClientRect();
  var flairDiv=h.querySelector(".flair");
  var flairText=flairDiv?(flairDiv.textContent||"").replace(/\\s+/g," ").trim().slice(0,40):"";
  var fr=flairDiv?flairDiv.getBoundingClientRect():{height:0};
  return JSON.stringify({exists:true,subredditName:h.getAttribute("subreddit-name")||"",
    x:Math.round(r.x),y:Math.round(r.y),w:Math.round(r.width),h:Math.round(r.height),
    currentFlair:flairText,flairHasSize:fr.height>1});
})()`;
const JS_FLAIR_HOST_CENTER = `(function(){
  var h=document.querySelector("community-author-flair");
  if(!h||!h.shadowRoot)return JSON.stringify(null);
  var sd=h.shadowRoot.querySelector('[role="button"][aria-haspopup]');
  if(!sd)return JSON.stringify(null);
  var r=sd.getBoundingClientRect();
  if(r.width===0)return JSON.stringify(null);
  return JSON.stringify({x:Math.round(r.x+r.width/2),y:Math.round(r.y+r.height/2),w:Math.round(r.width),h:Math.round(r.height)});
})()`;
const JS_FLAIR_EDIT_BTN = `(function(){
  var h=document.querySelector("community-author-flair");
  if(!h)return JSON.stringify(null);
  var tb=h.querySelector('[slot="toggle"] button,[slot="toggle"] [role="button"]');
  if(!tb)return JSON.stringify(null);
  var r=tb.getBoundingClientRect();
  if(r.width===0)return JSON.stringify(null);
  return JSON.stringify({x:Math.round(r.x+r.width/2),y:Math.round(r.y+r.height/2),w:Math.round(r.width),h:Math.round(r.height)});
})()`;
const JS_FLAIR_RADIOS = `(function(){
  var h=document.querySelector("community-author-flair");if(!h)return JSON.stringify({radios:[]});
  var out=[];
  h.querySelectorAll("faceplate-radio-input").forEach(function(r){
    var rect=r.getBoundingClientRect();if(rect.width===0)return;
    var v=r.getAttribute("value")||"";
    var hasEdit=!!r.querySelector('svg[icon-name="edit"]');
    var imgs=r.querySelectorAll("img,faceplate-img").length;
    var inp=r.querySelector("input.faceplate-internal-input, input");
    var txt=r.textContent.replace(/\\s+/g," ").trim().slice(0,40);
    out.push({value:v,hasEdit:hasEdit,imgs:imgs,checked:inp?!!inp.checked:false,text:txt,
      x:Math.round(rect.x+rect.width/2),y:Math.round(rect.y+rect.height/2),w:Math.round(rect.width),h:Math.round(rect.height)});
  });
  return JSON.stringify({radios:out});
})()`;
const JS_FLAIR_RADIO = (uuid) => `(function(){
  var h=document.querySelector("community-author-flair");if(!h)return JSON.stringify(null);
  var r=null;h.querySelectorAll("faceplate-radio-input").forEach(function(x){
    if(!r&&x.getAttribute("value")==="${uuid}"){var rr=x.getBoundingClientRect();if(rr.width>0)r=rr;}
  });
  if(!r)return JSON.stringify(null);
  return JSON.stringify({x:Math.round(r.x+r.width/2),y:Math.round(r.y+r.height/2),w:Math.round(r.width),h:Math.round(r.height)});
})()`;
const JS_FLAIR_CHECKED = `(function(){
  var h=document.querySelector("community-author-flair");if(!h)return JSON.stringify(null);
  var found=null;
  h.querySelectorAll("faceplate-radio-input").forEach(function(r){
    if(!found){var inp=r.querySelector("input");if(inp&&inp.checked)found=r.getAttribute("value");}
  });
  return JSON.stringify({value:found});
})()`;
const JS_FLAIR_TEXTBOX = `(function(){
  var h=document.querySelector("community-author-flair");if(!h)return JSON.stringify(null);
  var fe=h.querySelector("flair-editor");if(!fe)return JSON.stringify(null);
  var tb=fe.querySelector('[role="textbox"]');
  if(!tb)return JSON.stringify(null);
  var r=tb.getBoundingClientRect();if(r.width===0)return JSON.stringify(null);
  return JSON.stringify({x:Math.round(r.x+r.width/2),y:Math.round(r.y+r.height/2),w:Math.round(r.width),h:Math.round(r.height)});
})()`;
const JS_FLAIR_EMOJI_BTN = `(function(){
  var h=document.querySelector("community-author-flair");if(!h)return JSON.stringify({found:false});
  var fe=h.querySelector("flair-editor");if(!fe||!fe.shadowRoot)return JSON.stringify({found:false});
  var b=fe.shadowRoot.querySelector(".emoji-picker-button");
  if(!b)return JSON.stringify({found:false});
  var r=b.getBoundingClientRect();
  return JSON.stringify({found:true,hidden:b.classList.contains("hidden"),vis:r.width>0,
    x:Math.round(r.x+r.width/2),y:Math.round(r.y+r.height/2),w:Math.round(r.width),h:Math.round(r.height)});
})()`;
const JS_FLAIR_EMOJIS = `(function(){
  var out=[];
  var modal=null;
  (function hunt(root){root.querySelectorAll('faceplate-modal').forEach(function(m){if(!modal&&m.hasAttribute&&m.hasAttribute('open')){var r=m.getBoundingClientRect();if(r.width>100)modal=m;}});var all=root.querySelectorAll('*');for(var j=0;j<all.length;j++)if(all[j].shadowRoot)hunt(all[j].shadowRoot);})(document);
  if(!modal)return JSON.stringify({emojis:out});
  var mr=modal.getBoundingClientRect();
  function inModal(r){return r.width>5&&r.height>5&&r.top>=mr.top-8&&r.bottom<=mr.bottom+8;}
  modal.querySelectorAll("faceplate-img").forEach(function(host){
    var alt=host.getAttribute("alt")||"";
    if(alt.indexOf(":")<0)return;                 // \u53EA\u6536 emoji\uFF08alt \u5F62\u5982 :GAer:\uFF09
    var innerImg=host.shadowRoot?host.shadowRoot.querySelector("img"):null;
    var el=innerImg||host;
    var r=el.getBoundingClientRect();
    if(!inModal(r))return;
    out.push({name:alt,x:Math.round(r.x+r.width/2),y:Math.round(r.y+r.height/2),w:Math.round(r.width),h:Math.round(r.height)});
  });
  return JSON.stringify({emojis:out});
})()`;
const JS_FLAIR_EMOJI_ALL_ALTS = `(function(){
  var modal=null;
  (function hunt(root){root.querySelectorAll('faceplate-modal').forEach(function(m){if(!modal&&m.hasAttribute&&m.hasAttribute('open')){var r=m.getBoundingClientRect();if(r.width>100)modal=m;}});var all=root.querySelectorAll('*');for(var j=0;j<all.length;j++)if(all[j].shadowRoot)hunt(all[j].shadowRoot);})(document);
  if(!modal)return JSON.stringify({count:0,alts:[]});
  var alts=[];
  modal.querySelectorAll("faceplate-img").forEach(function(h){var alt=h.getAttribute("alt")||"";if(alt.indexOf(":")>=0)alts.push(alt);});
  return JSON.stringify({count:alts.length,alts:alts});
})()`;
const JS_FLAIR_EMOJI_GAP = `(function(){
  var modal=null;
  (function hunt(root){root.querySelectorAll('faceplate-modal').forEach(function(m){if(!modal&&m.hasAttribute&&m.hasAttribute('open')){var r=m.getBoundingClientRect();if(r.width>100)modal=m;}});var all=root.querySelectorAll('*');for(var j=0;j<all.length;j++)if(all[j].shadowRoot)hunt(all[j].shadowRoot);})(document);
  if(!modal)return JSON.stringify(null);
  var ul=modal.querySelector('ul');
  if(!ul)return JSON.stringify(null);
  var ur=ul.getBoundingClientRect();
  if(ur.width===0)return JSON.stringify(null);
  // \u6EDA\u52A8\u6761\u5728 ul \u53F3\u8FB9\u7F18\uFF08x \u6296\u52A8 5px\uFF09\uFF0Cy \u5728 ul \u7EB5\u5411\u8303\u56F4\u5185\u968F\u673A
  var x=ur.right-6+Math.random()*5;
  var y=ur.top+10+Math.random()*(ur.height-20);
  return JSON.stringify({x:Math.round(x),y:Math.round(y),w:6,h:6});
})()`;
const JS_FLAIR_APPLY = `(function(){
  var h=document.querySelector("community-author-flair");if(!h)return JSON.stringify(null);
  var acts=h.querySelector('[slot="actions"]');if(!acts)return JSON.stringify(null);
  var btn=null;
  acts.querySelectorAll("button").forEach(function(b){
    if(btn)return;
    if(!b.classList.contains("clear-flair")){var r=b.getBoundingClientRect();if(r.width>0)btn=b;}
  });
  if(!btn)return JSON.stringify(null);
  var r=btn.getBoundingClientRect();
  return JSON.stringify({x:Math.round(r.x+r.width/2),y:Math.round(r.y+r.height/2),w:Math.round(r.width),h:Math.round(r.height),disabled:btn.disabled});
})()`;
function interestToWikiDepth(interest) {
  const base = interest < 0.3 ? 0 : interest < 0.7 ? 1 : 2;
  const jitter = Math.random() < 0.3 ? Math.random() < 0.5 ? -1 : 1 : 0;
  return Math.max(0, base + jitter);
}
function interestToRuleExpand(interest) {
  return interest < 0.3 ? 0 : interest < 0.7 ? 1 : 2;
}
function rollInterest(cli) {
  if (cli !== void 0) {
    const n = parseFloat(cli);
    if (!isNaN(n)) return Math.max(0.05, Math.min(0.95, n));
  }
  const u1 = Math.max(1e-6, Math.random()), u2 = Math.random();
  const g = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
  return Math.max(0.05, Math.min(0.95, 0.5 + 0.2 * g));
}
async function browseStats(client, tabId, data, options) {
  client.logInfo(tabId, "\u626B\u63CF\u793E\u533A\u7EDF\u8BA1", [kTag]);
  const stats = await ev(client, tabId, JS_ACTIVITY_STATS);
  if (stats && stats.raw) {
    data.stats = { raw: stats.raw };
    console.log(`[browse-sub] stats: ${stats.raw.slice(0, 60)}`);
    await humanPause(800, 1600);
  } else {
    client.logWarn(tabId, "stats widget \u672A\u627E\u5230", [kTag]);
  }
}
async function browseRules(client, tabId, data, interest, options) {
  client.logInfo(tabId, "\u770B\u89C4\u5219\uFF08\u70B9\u5F00\u51E0\u6761\uFF09", [kTag]);
  const rules = await ev(client, tabId, JS_RULES);
  if (!rules || !Array.isArray(rules) || rules.length === 0) {
    client.logWarn(tabId, "rules widget \u672A\u627E\u5230", [kTag]);
    return;
  }
  data.rules = rules.map((r, i) => ({ index: i + 1, short: r.short, full: r.full }));
  console.log(`[browse-sub] \u5171 ${rules.length} \u6761\u89C4\u5219`);
  const expandN = Math.min(interestToRuleExpand(interest), rules.length);
  if (expandN === 0) {
    await humanPause(600, 1200);
    return;
  }
  const idxs = [];
  while (idxs.length < expandN && idxs.length < rules.length) {
    const cand = Math.floor(Math.random() * rules.length);
    if (!idxs.includes(cand)) idxs.push(cand);
  }
  for (const i of idxs) {
    const rule = rules[i];
    const loc = await locateAndScrollByJS(client, tabId, JS_RULE_SUMMARY(rule.uuid)).catch(() => null);
    if (!loc) {
      client.logWarn(tabId, `\u89C4\u5219 ${i + 1} \u672A\u5B9A\u4F4D\u5230`, [kTag]);
      continue;
    }
    console.log(`[browse-sub] \u70B9\u5F00\u89C4\u5219 ${i + 1}: ${rule.short.slice(0, 30)}`);
    try {
      await hoverWithHesitation(client, tabId, loc, { ...options, skipMoveAway: true });
    } catch {
    }
    await humanPause(900, 1800);
    const after = await ev(client, tabId, JS_RULE_SUMMARY(rule.uuid));
    const opened = after && after.expanded === true;
    if (data.rules[i]) data.rules[i].expandedRead = !!opened;
    if (!opened) client.logWarn(tabId, `\u89C4\u5219 ${i + 1} \u672A\u5C55\u5F00\uFF08\u4E0D\u7EA0\u7ED3\uFF09`, [kTag]);
    await briefBrowseAfterAction(client, tabId, options);
  }
}
async function browseMods(client, tabId, data, options) {
  client.logInfo(tabId, "\u7785\u7248\u4E3B", [kTag]);
  const mods = await ev(client, tabId, JS_MODERATORS);
  if (!mods || !mods.moderators || mods.moderators.length === 0) {
    client.logWarn(tabId, "moderators widget \u672A\u627E\u5230", [kTag]);
    return;
  }
  data.moderators = mods.moderators;
  console.log(`[browse-sub] ${mods.moderators.length} \u4F4D\u7248\u4E3B\uFF0C\u9996\u4E2A ${mods.moderators[0]?.name}`);
  await humanPause(700, 1400);
}
async function browseAbout(client, tabId, data, options) {
  client.logInfo(tabId, "\u7FFB\u5173\u4E8E/\u4E66\u7B7E", [kTag]);
  const about = await ev(client, tabId, JS_ABOUT);
  if (about) {
    data.about = { description: about.description || "", bookmarks: about.bookmarks || [] };
    console.log(`[browse-sub] \u63CF\u8FF0 ${about.description?.length || 0} \u5B57\uFF0C\u4E66\u7B7E ${about.bookmarks?.length || 0} \u4E2A`);
  }
  await humanPause(700, 1400);
}
async function browseWiki(client, tabId, data, interest, options) {
  client.logInfo(tabId, "\u8FDB wiki \u770B\u4E00\u770B", [kTag]);
  const linkInfo = await ev(client, tabId, JS_WIKI_LINK);
  if (!linkInfo) {
    client.logWarn(tabId, "wiki \u94FE\u63A5\u672A\u627E\u5230", [kTag]);
    return;
  }
  const linkLoc = await locateAndScrollByJS(client, tabId, JS_WIKI_LINK).catch(() => null);
  const instanceId = await findInstanceIdForTab(client, tabId);
  let beforeIds = /* @__PURE__ */ new Set();
  if (instanceId) {
    try {
      const tl = await client.instanceTabsList(instanceId);
      const arr = Array.isArray(tl) ? tl : tl.tabs || [];
      beforeIds = new Set(arr.map((t) => t.tabId || t.id));
    } catch {
    }
  }
  let wikiTabId = null;
  if (linkLoc) {
    console.log("[browse-sub] \u4E2D\u952E\u70B9 wiki \u94FE\u63A5\u5F00\u65B0 tab");
    try {
      await middleClickAt(client, tabId, linkLoc);
    } catch {
    }
    const nt = await waitForNewTab(client, instanceId || "", beforeIds, 8e3).catch(() => null);
    if (nt) wikiTabId = nt.id || nt.tabId;
  }
  if (!wikiTabId && instanceId) {
    const wikiUrl = linkInfo.href.startsWith("http") ? linkInfo.href : `https://www.reddit.com${linkInfo.href}`;
    console.log("[browse-sub] \u4E2D\u952E\u672A\u5F00\u6210\uFF0CinstanceTabsOpen \u515C\u5E95");
    try {
      const nt = await client.instanceTabsOpen(instanceId, wikiUrl);
      wikiTabId = nt?.tabId || nt?.id;
      await humanPause(3e3, 5e3);
    } catch (e) {
      client.logWarn(tabId, `\u5F00 wiki tab \u5931\u8D25: ${e?.message}`, [kTag]);
    }
  }
  if (!wikiTabId) {
    client.logWarn(tabId, "\u672A\u80FD\u6253\u5F00 wiki tab", [kTag]);
    return;
  }
  console.log(`[browse-sub] wiki tab: ${wikiTabId}`);
  try {
    await client.tabFocus(wikiTabId);
  } catch {
  }
  await humanPause(2500, 4e3);
  try {
    let idx = null;
    for (let i = 0; i < 15; i++) {
      idx = await ev(client, wikiTabId, JS_WIKI_INDEX);
      if (idx && (idx.pages?.length || 0) > 0 && (idx.indexChars || 0) > 300) break;
      await humanPause(500, 900);
    }
    const indexChars = idx?.indexChars || 0;
    const pages = idx?.pages || [];
    const visited = [];
    console.log(`[browse-sub] wiki index ${indexChars} \u5B57\uFF0C\u5B50\u9875 ${pages.length} \u4E2A`);
    if (indexChars > 0) {
      try {
        await humanScrollDown(client, wikiTabId, 600, options);
      } catch {
      }
      await humanPause(1e3, 2200);
    }
    const depth = interestToWikiDepth(interest);
    if (depth > 0 && pages.length > 0) {
      const chosen = [];
      const pool = [...pages];
      while (chosen.length < Math.min(depth, pool.length)) {
        const k = Math.floor(Math.random() * pool.length);
        chosen.push(pool.splice(k, 1)[0]);
      }
      for (const p of chosen) {
        console.log(`[browse-sub] \u70B9\u8FDB wiki \u5B50\u9875: ${p.text.slice(0, 24)}`);
        const subJS = `(function(){
          var hit=null;
          (function hunt(root){
            root.querySelectorAll('a[href*="/wiki/"]').forEach(function(a){
              if(hit)return;
              var href=a.getAttribute("href")||"";
              var tail=href.replace(/^https?:\\/\\/[^/]+/,"").slice(-30);
              if(tail.indexOf("${p.href.slice(-24)}")>=0||href===${JSON.stringify(p.href)}){
                var r=a.getBoundingClientRect();if(r.width>0)hit=r;
              }
            });
            var all=root.querySelectorAll("*");
            for(var j=0;j<all.length;j++)if(all[j].shadowRoot)hunt(all[j].shadowRoot);
          })(document);
          if(!hit)return JSON.stringify(null);
          return JSON.stringify({x:Math.round(hit.x+hit.width/2),y:Math.round(hit.y+hit.height/2),w:Math.round(hit.width),h:Math.round(hit.height)});
        })()`;
        const subLoc = await locateAndScrollByJS(client, wikiTabId, subJS).catch(() => null);
        if (subLoc) {
          const beforeSub = (await client.pageUrl(wikiTabId)).url;
          try {
            await humanClickElement(client, wikiTabId, subLoc, { ...options, skipMoveAway: true });
          } catch {
          }
          for (let w = 0; w < 12; w++) {
            const u = (await client.pageUrl(wikiTabId)).url;
            if (u !== beforeSub) break;
            await humanPause(400, 700);
          }
          await humanPause(1200, 2200);
          try {
            await humanScrollDown(client, wikiTabId, 700, options);
          } catch {
          }
          await humanPause(1200, 2400);
          visited.push(p.text);
          console.log("[browse-sub] \u56DE wiki index");
          try {
            await goBack(client, wikiTabId, options);
          } catch {
          }
          await humanPause(1200, 2200);
        } else {
          client.logWarn(tabId, `wiki \u5B50\u9875 ${p.text} \u672A\u5B9A\u4F4D\u5230`, [kTag]);
        }
      }
    }
    data.wiki = { indexChars, pagesVisited: visited, pageCount: pages.length };
  } catch (e) {
    client.logWarn(tabId, `\u8BFB wiki \u5F02\u5E38: ${e?.message || e}`, [kTag]);
  } finally {
    console.log("[browse-sub] \u5173 wiki tab\uFF0C\u56DE\u5B50\u793E\u533A tab");
    try {
      await client.tabClose(wikiTabId);
    } catch {
    }
    try {
      await client.tabFocus(tabId);
    } catch {
    }
    await humanPause(800, 1500);
  }
}
async function browseFlair(client, tabId, data, mode, prob, options) {
  if (mode === "none") {
    data.flair = { status: "none" };
    return;
  }
  client.logInfo(tabId, `\u901B flair\uFF08mode=${mode}\uFF09`, [kTag]);
  const host = await ev(client, tabId, JS_FLAIR_HOST);
  if (!host || !host.exists) {
    data.flair = { status: "not_available" };
    client.logWarn(tabId, "\u65E0 flair widget", [kTag]);
    return;
  }
  let expState = await ev(client, tabId, `(function(){var h=document.querySelector("community-author-flair");if(!h||!h.shadowRoot)return JSON.stringify(false);var s=h.shadowRoot.querySelector('[role="button"][aria-haspopup]');return JSON.stringify(s?s.getAttribute("aria-expanded")==="true":false)})()`) === true;
  if (!expState) {
    await locateAndScrollByJS(client, tabId, JS_FLAIR_HOST_CENTER).catch(() => null);
    const hoverTarget = await locateByJS(client, tabId, JS_FLAIR_HOST_CENTER);
    if (!hoverTarget) {
      client.logWarn(tabId, "flair host \u672A\u5B9A\u4F4D\u5230", [kTag]);
      data.flair = { status: "not_available" };
      return;
    }
    console.log(`[browse-sub] hover flair host @(${hoverTarget.x},${hoverTarget.y}) \u4EE5\u663E\u73B0 edit \u6309\u94AE`);
    try {
      await humanMouseMove(client, tabId, hoverTarget.x, hoverTarget.y);
    } catch {
    }
    await humanPause(400, 800);
    let editBtn = null;
    for (let i = 0; i < 12; i++) {
      editBtn = await ev(client, tabId, JS_FLAIR_EDIT_BTN);
      if (editBtn) break;
      try {
        await humanMouseMove(client, tabId, hoverTarget.x, hoverTarget.y);
      } catch {
      }
      await humanPause(300, 500);
    }
    if (!editBtn) {
      client.logWarn(tabId, "hover \u540E edit \u6309\u94AE\u672A\u51FA\u73B0", [kTag]);
      data.flair = { status: "not_available" };
      return;
    }
    console.log(`[browse-sub] \u70B9 edit \u6309\u94AE @(${editBtn.x},${editBtn.y})`);
    try {
      await humanClickElement(client, tabId, editBtn, { ...options, skipMoveAway: true });
    } catch (e) {
      client.logWarn(tabId, `\u5C55\u5F00 picker \u70B9\u51FB\u5F02\u5E38: ${e?.message}`, [kTag]);
    }
  } else {
    console.log("[browse-sub] picker \u5DF2\u5C55\u5F00\uFF08\u7F16\u8F91\u6001\uFF09\uFF0C\u8DF3\u8FC7 hover\u2192edit");
  }
  let radios = [];
  for (let i = 0; i < 15; i++) {
    const r = await ev(client, tabId, JS_FLAIR_RADIOS);
    if (r && Array.isArray(r.radios) && r.radios.length > 0) {
      radios = r.radios;
      break;
    }
    await humanPause(350, 600);
  }
  if (radios.length === 0) {
    client.logWarn(tabId, "flair \u9009\u9879\u672A\u51FA\u73B0", [kTag]);
    data.flair = { status: "not_available" };
    return;
  }
  console.log(`[browse-sub] flair \u9009\u9879 ${radios.length} \u4E2A`);
  if (mode === "auto") {
    if (Math.random() >= prob) {
      client.logInfo(tabId, `\u672A\u547D\u4E2D flair \u6982\u7387(${prob})\uFF0C\u4E0D\u8BBE`, [kTag]);
      data.flair = { status: "not_triggered", available: radios.length };
      return;
    }
  }
  let pick = radios[Math.floor(Math.random() * radios.length)];
  console.log(`[browse-sub] \u968F\u673A\u9009 flair: value=${pick.value.slice(0, 16)} hasEdit=${pick.hasEdit} imgs=${pick.imgs}`);
  const radioLoc = await locateByJS(client, tabId, JS_FLAIR_RADIO(pick.value)).catch(() => null);
  if (radioLoc) {
    try {
      await humanClickElement(client, tabId, radioLoc, { ...options, skipMoveAway: true });
    } catch {
    }
    await humanPause(700, 1300);
  } else {
    client.logWarn(tabId, "\u9009\u4E2D radio \u672A\u5B9A\u4F4D\u5230", [kTag]);
  }
  let pickedEmoji = "";
  let hasEmojiAlready = false;
  if (pick.hasEdit) {
    const tb = await pollLocate(client, tabId, JS_FLAIR_TEXTBOX, 8);
    if (tb) {
      try {
        await humanClickElement(client, tabId, tb, { ...options, skipMoveAway: true });
      } catch {
      }
      await humanPause(700, 1200);
      const emoteNow = await ev(client, tabId, `(function(){var h=document.querySelector("community-author-flair");var fe=h&&h.querySelector("flair-editor");var tb=fe&&fe.querySelector('[role="textbox"]');if(!tb)return JSON.stringify(0);return JSON.stringify(tb.querySelectorAll('.emote,[class~=emote]').length);})()`);
      const hasEmote = typeof emoteNow === "number" && emoteNow > 0;
      if (hasEmote) {
        hasEmojiAlready = true;
        console.log(`[browse-sub] \u6587\u672C\u6846\u5DF2\u6709 ${emoteNow} \u4E2A emoji\uFF0C\u4FDD\u7559\u4E0D\u53E6\u9009\uFF0C\u76F4\u63A5 Apply`);
      } else {
        try {
          await client.humanKeyboardCombo(tabId, { modifiers: ["ctrl"], key: "a" });
          await humanPause(150, 300);
          await client.humanKeyboardPress(tabId, { key: "Backspace" });
          await humanPause(400, 700);
          console.log("[browse-sub] \u5DF2\u6E05\u7A7A flair \u6587\u6848");
        } catch {
        }
      }
      if (!hasEmojiAlready) {
        let emojiPanelOpened = false;
        for (let i = 0; i < 10; i++) {
          const eb = await ev(client, tabId, JS_FLAIR_EMOJI_BTN);
          if (eb && eb.found && !eb.hidden && eb.vis) {
            console.log("[browse-sub] \u70B9 emoji picker\uFF08\u5F00\u6D6E\u5C42\uFF0C\u9009 1 \u4E2A\uFF09");
            try {
              await humanClickElement(client, tabId, { x: eb.x, y: eb.y, w: eb.w, h: eb.h }, { ...options, skipMoveAway: true });
            } catch (e) {
              client.logWarn(tabId, `emoji \u6309\u94AE\u70B9\u51FB\u5F02\u5E38: ${e?.message}`, [kTag]);
            }
            await humanPause(1800, 2800);
            emojiPanelOpened = true;
            break;
          }
          await humanPause(300, 600);
        }
        if (emojiPanelOpened) {
          const all = await ev(client, tabId, JS_FLAIR_EMOJI_ALL_ALTS);
          const alts = all && Array.isArray(all.alts) ? all.alts : [];
          console.log(`[browse-sub] emoji \u603B\u6570 ${alts.length}`);
          if (alts.length > 0) {
            const target = alts[Math.floor(Math.random() * alts.length)];
            console.log(`[browse-sub] \u968F\u673A\u76EE\u6807 emoji: ${target}\uFF08\u7D22\u5F15 ${alts.indexOf(target)}/${alts.length}\uFF09`);
            const tbEmojiCount = async () => {
              const r = await ev(client, tabId, `(function(){var h=document.querySelector("community-author-flair");var fe=h&&h.querySelector("flair-editor");var tb=fe&&fe.querySelector('[role="textbox"]');if(!tb)return JSON.stringify(0);return JSON.stringify(tb.querySelectorAll('.emote,[class~=emote]').length);})()`);
              return typeof r === "number" ? r : 0;
            };
            const findVisible = async (name) => {
              const ek = await ev(client, tabId, JS_FLAIR_EMOJIS);
              const found = (ek && ek.emojis ? ek.emojis : []).find((e) => e.name === name);
              return found ? { x: found.x, y: found.y, w: found.w, h: found.h } : null;
            };
            const clickEmoji = async (loc) => {
              const before = await tbEmojiCount();
              try {
                await humanClickElement(client, tabId, { x: loc.x, y: loc.y, w: loc.w, h: loc.h }, { ...options, skipMoveAway: true });
              } catch {
              }
              await humanPause(900, 1500);
              const after = await tbEmojiCount();
              return after > before;
            };
            let targetLoc = await findVisible(target);
            const targetInFirstScreen = !!targetLoc;
            if (targetInFirstScreen) {
              console.log(`[browse-sub] \u76EE\u6807\u5728\u9996\u5C4F\uFF0C\u76F4\u63A5\u70B9: ${target}`);
              if (await clickEmoji(targetLoc)) pickedEmoji = target;
            } else {
              const firstEk = await ev(client, tabId, JS_FLAIR_EMOJIS);
              const anchor = firstEk && firstEk.emojis && firstEk.emojis[0];
              if (anchor) {
                console.log(`[browse-sub] \u70B9\u9996\u5C4F\u951A\u70B9 emoji: ${anchor.name}\uFF08\u79FB\u7126\u70B9\uFF09`);
                await clickEmoji(anchor);
                let scrolledToBottom = false;
                for (let s = 0; s < 40 && !targetLoc && !scrolledToBottom; s++) {
                  const beforeFirst = await ev(client, tabId, JS_FLAIR_EMOJIS);
                  const beforeFirstAlt = beforeFirst && beforeFirst.emojis && beforeFirst.emojis[0] ? beforeFirst.emojis[0].name : "";
                  for (let k = 0; k < 4; k++) {
                    try {
                      await client.humanKeyboardPress(tabId, { key: "ArrowDown" });
                    } catch {
                    }
                    await humanPause(120, 240);
                  }
                  await humanPause(400, 700);
                  targetLoc = await findVisible(target);
                  const afterFirst = await ev(client, tabId, JS_FLAIR_EMOJIS);
                  const afterFirstAlt = afterFirst && afterFirst.emojis && afterFirst.emojis[0] ? afterFirst.emojis[0].name : "";
                  if (afterFirstAlt === beforeFirstAlt) scrolledToBottom = true;
                }
                let toClick = targetLoc;
                if (!toClick) {
                  const ek = await ev(client, tabId, JS_FLAIR_EMOJIS);
                  if (ek && ek.emojis && ek.emojis[0]) toClick = ek.emojis[0];
                }
                if (toClick) {
                  console.log(`[browse-sub] \u70B9\u76EE\u6807 emoji: ${target}`);
                  const ok = await clickEmoji(toClick);
                  if (ok) pickedEmoji = target;
                }
              }
            }
            await client.humanKeyboardPress(tabId, { key: "Escape" }).catch(() => {
            });
            await humanPause(600, 1e3);
            const finalCount = await tbEmojiCount();
            if (finalCount >= 2) {
              console.log(`[browse-sub] \u6587\u672C\u6846\u6709 ${finalCount} \u4E2A emoji\uFF0C\u5220\u524D\u9762\u951A\u70B9\u53EA\u7559\u6700\u540E\u4E00\u4E2A`);
              const tb2 = await pollLocate(client, tabId, JS_FLAIR_TEXTBOX, 6);
              if (tb2) {
                try {
                  await humanClickElement(client, tabId, tb2, { ...options, skipMoveAway: true });
                } catch {
                }
                await humanPause(500, 900);
                try {
                  await client.humanKeyboardCombo(tabId, { modifiers: ["ctrl"], key: "End" });
                } catch {
                }
                await humanPause(200, 400);
                try {
                  await client.humanKeyboardPress(tabId, { key: "ArrowLeft" });
                } catch {
                }
                await humanPause(200, 400);
                for (let d = 0; d < finalCount - 1; d++) {
                  try {
                    await client.humanKeyboardPress(tabId, { key: "Backspace" });
                  } catch {
                  }
                  await humanPause(300, 600);
                }
                const afterDel = await tbEmojiCount();
                console.log(`[browse-sub] \u5220\u9664\u540E\u5269 ${afterDel} \u4E2A emoji`);
                if (afterDel === 1) pickedEmoji = target;
                else if (afterDel === 0) {
                  client.logWarn(tabId, "\u5220\u951A\u70B9\u628A\u76EE\u6807\u4E5F\u5220\u4E86", [kTag]);
                  pickedEmoji = "";
                }
              }
            }
          } else {
            client.logWarn(tabId, "emoji \u5217\u8868\u4E3A\u7A7A", [kTag]);
          }
        } else {
          client.logWarn(tabId, "emoji \u6D6E\u5C42\u672A\u6253\u5F00", [kTag]);
        }
      }
      if (!hasEmojiAlready && Math.random() < 0.3) {
        const frags = ["hi", "farmer", "casual", "lurker", "o/", ":)", "new here"];
        const t = frags[Math.floor(Math.random() * frags.length)];
        console.log(`[browse-sub] \u8F93\u5165\u81EA\u5B9A\u4E49 flair \u6587\u672C: ${t}`);
        try {
          await humanType(client, tabId, t);
        } catch {
        }
        await humanPause(500, 1e3);
      }
    } else {
      client.logWarn(tabId, "flair \u6587\u672C\u6846\u672A\u5B9A\u4F4D\u5230\uFF08\u8DF3\u8FC7 emoji/\u6587\u672C\uFF09", [kTag]);
    }
  }
  if (pick.hasEdit) {
    const tbContent = await ev(client, tabId, `(function(){var h=document.querySelector("community-author-flair");var fe=h&&h.querySelector("flair-editor");var tb=fe&&fe.querySelector('[role="textbox"]');if(!tb)return JSON.stringify({empty:true});var emote=tb.querySelectorAll('.emote,[class~=emote]').length;var text=(tb.textContent||"").trim();return JSON.stringify({empty:emote===0&&text.length===0,emote:emote,text:text.slice(0,20)});})()`);
    if (tbContent && tbContent.empty) {
      client.logWarn(tabId, "\u81EA\u5B9A\u4E49\u578B flair \u6587\u672C\u6846\u4E3A\u7A7A\uFF08\u65E0 emoji \u65E0\u6587\u672C\uFF09\uFF0C\u5C1D\u8BD5\u6539\u9009\u56FE\u7247\u578B", [kTag]);
      const imgRadio = radios.find((r) => !r.hasEdit);
      if (imgRadio) {
        const imgLoc = await locateByJS(client, tabId, JS_FLAIR_RADIO(imgRadio.value)).catch(() => null);
        if (imgLoc) {
          try {
            await humanClickElement(client, tabId, imgLoc, { ...options, skipMoveAway: true });
          } catch {
          }
          await humanPause(800, 1300);
          pick = imgRadio;
          pickedEmoji = "";
          console.log(`[browse-sub] \u6539\u9009\u56FE\u7247\u578B radio: ${pick.value.slice(0, 16)}`);
        }
      } else {
        client.logWarn(tabId, "\u5168\u90E8\u4E3A\u81EA\u5B9A\u4E49\u578B\u4E14\u5185\u5BB9\u4E3A\u7A7A\uFF0C\u8DF3\u8FC7 Apply\uFF08\u4E0D\u8BBE\u7A7A flair\uFF09", [kTag]);
        data.flair = { status: "failed_no_content", available: radios.length, selected: pick.value, hasEdit: true };
        return;
      }
    }
  }
  let applyLoc = null;
  for (let i = 0; i < 8; i++) {
    applyLoc = await locateByJS(client, tabId, JS_FLAIR_APPLY).catch(() => null);
    if (applyLoc) break;
    await humanPause(300, 500);
  }
  if (applyLoc) {
    console.log("[browse-sub] \u70B9 Apply \u6301\u4E45\u5316");
    try {
      await humanClickElement(client, tabId, applyLoc, { ...options, skipMoveAway: true });
    } catch (e) {
      client.logWarn(tabId, `Apply \u70B9\u51FB\u5F02\u5E38: ${e?.message}`, [kTag]);
    }
    await humanPause(1500, 2500);
    const hostAfter = await ev(client, tabId, JS_FLAIR_HOST);
    const ok = !!hostAfter && (hostAfter.flairHasSize || (hostAfter.currentFlair || "").length > 0);
    if (!ok) client.logWarn(tabId, "flair \u5E94\u7528\u540E host \u672A\u663E\u793A\uFF08\u5C3D\u529B\uFF09", [kTag]);
    data.flair = {
      status: ok ? "applied" : "applied_unverified",
      available: radios.length,
      selected: pick.value,
      emoji: pickedEmoji,
      hasEdit: pick.hasEdit
    };
  } else {
    client.logWarn(tabId, "Apply \u6309\u94AE\u672A\u5B9A\u4F4D\u5230", [kTag]);
    data.flair = { status: "failed_apply", available: radios.length, selected: pick.value };
  }
}
const VALID_SECTIONS = ["stats", "rules", "mods", "about", "wiki", "flair"];
async function browseSubreddit(client, tabId, cfg, options) {
  await ensureTabFocus(client, tabId);
  client.logInfo(tabId, "\u5F00\u59CB\u901B\u5B50\u793E\u533A\u53F3\u8FB9\u680F", [kTag]);
  const subName = await ev(client, tabId, JS_SUBREDDIT_NAME) || "";
  if (!subName) {
    return { status: "invalid_page", message: "\u5F53\u524D\u9875\u4E0D\u662F\u5B50\u793E\u533A\u9996\u9875\uFF08/r/<sub>/\uFF09" };
  }
  if (cfg?.subreddit && cfg.subreddit.toLowerCase() !== subName.toLowerCase()) {
    return { status: "invalid_page", message: `\u5F53\u524D\u793E\u533A ${subName} \u4E0E\u671F\u671B ${cfg.subreddit} \u4E0D\u7B26` };
  }
  console.log(`[browse-sub] \u5B50\u793E\u533A: r/${subName}`);
  const sections = cfg?.sections && cfg.sections.length > 0 ? cfg.sections : [...VALID_SECTIONS];
  const flairMode = cfg?.flairMode ?? "auto";
  const flairProb = cfg?.flairProb ?? 0.2;
  const interest = cfg?.interest ?? rollInterest();
  console.log(`[browse-sub] sections=[${sections.join(",")}] flair=${flairMode} prob=${flairProb} interest=${interest.toFixed(2)}`);
  const data = { subreddit: subName, browsed: [] };
  for (const sec of sections) {
    if (!VALID_SECTIONS.includes(sec)) continue;
    try {
      switch (sec) {
        case "stats":
          await browseStats(client, tabId, data, options);
          break;
        case "rules":
          await browseRules(client, tabId, data, interest, options);
          break;
        case "mods":
          await browseMods(client, tabId, data, options);
          break;
        case "about":
          await browseAbout(client, tabId, data, options);
          break;
        case "wiki":
          await browseWiki(client, tabId, data, interest, options);
          break;
        case "flair":
          await browseFlair(client, tabId, data, flairMode, flairProb, options);
          break;
      }
      data.browsed.push(sec);
    } catch (e) {
      client.logWarn(tabId, `section ${sec} \u5F02\u5E38: ${e?.message || e}`, [kTag]);
    }
    await humanPause(500, 1100);
  }
  await briefBrowseAfterAction(client, tabId, options);
  return { status: "success", message: `browsed r/${subName}: ${data.browsed.join(",")}`, data };
}
async function main() {
  const cli = await getCliOptions();
  const tabId = requireTabId();
  const client = new PinchTabClient({ baseUrl: cli.baseUrl, token: cli.token });
  const sectionsRaw = getCliArg("sections");
  let sections = [...VALID_SECTIONS];
  if (sectionsRaw) {
    const parts = sectionsRaw.split(",").map((s) => s.trim().toLowerCase()).filter(Boolean);
    const bad = parts.filter((p) => !VALID_SECTIONS.includes(p));
    if (bad.length) {
      console.log(JSON.stringify({ status: "invalid_page", message: `unknown --sections: ${bad.join(",")}; valid: ${VALID_SECTIONS.join(",")}` }));
      process.exit(1);
    }
    sections = parts;
  }
  const flairRaw = (getCliArg("flair") || "auto").toLowerCase();
  if (!["auto", "random", "none"].includes(flairRaw)) {
    console.log(JSON.stringify({ status: "invalid_page", message: `--flair must be auto|random|none` }));
    process.exit(1);
  }
  const flairProbRaw = parseFloat(getCliArg("flair-prob") || "0.2");
  if (isNaN(flairProbRaw) || flairProbRaw < 0 || flairProbRaw > 1) {
    console.log(JSON.stringify({ status: "invalid_page", message: `--flair-prob must be 0..1` }));
    process.exit(1);
  }
  const interestRaw = getCliArg("interest");
  const subreddit = getCliArg("subreddit");
  const result = await browseSubreddit(client, tabId, {
    sections,
    flairMode: flairRaw,
    flairProb: flairProbRaw,
    interest: interestRaw !== void 0 ? parseFloat(interestRaw) : void 0,
    subreddit
  });
  outputResult(result);
}
runMain(main, "reddit-browse-subreddit.ts");
export {
  browseSubreddit
};
