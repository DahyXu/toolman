import { esc, faq } from '../layout.mjs';

// Fixed-offset zone abbreviations. Each abbreviation denotes one specific
// offset, so these conversions are exact — no daylight-saving ambiguity.
const Z = [
  { id: 'utc', ab: 'UTC', off: 0, name: 'Coordinated Universal Time', where: 'the global time standard, used by aviation, computing and science' },
  { id: 'gmt', ab: 'GMT', off: 0, name: 'Greenwich Mean Time', where: 'the UK and Ireland in winter, Portugal, Iceland and much of West Africa' },
  { id: 'est', ab: 'EST', off: -5, name: 'Eastern Standard Time', where: 'New York, Toronto, Miami and Atlanta in winter' },
  { id: 'edt', ab: 'EDT', off: -4, name: 'Eastern Daylight Time', where: 'New York, Toronto, Miami and Atlanta from March to November' },
  { id: 'cst', ab: 'CST', off: -6, name: 'Central Standard Time', where: 'Chicago, Dallas, Houston and Mexico City in winter' },
  { id: 'cdt', ab: 'CDT', off: -5, name: 'Central Daylight Time', where: 'Chicago, Dallas and Houston from March to November' },
  { id: 'mst', ab: 'MST', off: -7, name: 'Mountain Standard Time', where: 'Denver and Salt Lake City in winter, and Phoenix all year' },
  { id: 'mdt', ab: 'MDT', off: -6, name: 'Mountain Daylight Time', where: 'Denver and Salt Lake City from March to November' },
  { id: 'pst', ab: 'PST', off: -8, name: 'Pacific Standard Time', where: 'Los Angeles, San Francisco, Seattle and Vancouver in winter' },
  { id: 'pdt', ab: 'PDT', off: -7, name: 'Pacific Daylight Time', where: 'Los Angeles, San Francisco and Seattle from March to November' },
  { id: 'akst', ab: 'AKST', off: -9, name: 'Alaska Standard Time', where: 'Anchorage and the rest of Alaska in winter' },
  { id: 'hst', ab: 'HST', off: -10, name: 'Hawaii Standard Time', where: 'Hawaii, which does not observe daylight saving at all' },
  { id: 'brt', ab: 'BRT', off: -3, name: 'Brasília Time', where: 'São Paulo, Rio de Janeiro and most of populated Brazil' },
  { id: 'bst', ab: 'BST', off: 1, name: 'British Summer Time', where: 'the UK from late March to late October' },
  { id: 'cet', ab: 'CET', off: 1, name: 'Central European Time', where: 'Paris, Berlin, Madrid, Rome and Warsaw in winter' },
  { id: 'cest', ab: 'CEST', off: 2, name: 'Central European Summer Time', where: 'Paris, Berlin, Madrid and Rome from late March to late October' },
  { id: 'eet', ab: 'EET', off: 2, name: 'Eastern European Time', where: 'Athens, Helsinki, Kyiv and Cairo in winter' },
  { id: 'eest', ab: 'EEST', off: 3, name: 'Eastern European Summer Time', where: 'Athens, Helsinki and Kyiv in summer' },
  { id: 'msk', ab: 'MSK', off: 3, name: 'Moscow Time', where: 'Moscow and western Russia, with no daylight saving' },
  { id: 'gst', ab: 'GST', off: 4, name: 'Gulf Standard Time', where: 'Dubai, Abu Dhabi and Muscat' },
  { id: 'ist', ab: 'IST', off: 5.5, name: 'India Standard Time', where: 'all of India and Sri Lanka, on a half-hour offset' },
  { id: 'ict', ab: 'ICT', off: 7, name: 'Indochina Time', where: 'Bangkok, Hanoi, Ho Chi Minh City and Jakarta' },
  { id: 'sgt', ab: 'SGT', off: 8, name: 'Singapore Time', where: 'Singapore and Malaysia' },
  { id: 'hkt', ab: 'HKT', off: 8, name: 'Hong Kong Time', where: 'Hong Kong, and matching mainland China and Taiwan' },
  { id: 'awst', ab: 'AWST', off: 8, name: 'Australian Western Standard Time', where: 'Perth and Western Australia' },
  { id: 'jst', ab: 'JST', off: 9, name: 'Japan Standard Time', where: 'all of Japan, with no daylight saving' },
  { id: 'kst', ab: 'KST', off: 9, name: 'Korea Standard Time', where: 'South Korea, with no daylight saving' },
  { id: 'aest', ab: 'AEST', off: 10, name: 'Australian Eastern Standard Time', where: 'Sydney, Melbourne and Brisbane in the southern winter' },
  { id: 'aedt', ab: 'AEDT', off: 11, name: 'Australian Eastern Daylight Time', where: 'Sydney and Melbourne from October to April' },
  { id: 'nzst', ab: 'NZST', off: 12, name: 'New Zealand Standard Time', where: 'Auckland and Wellington in the southern winter' },
];

const offStr = (o) => (o === 0 ? 'UTC+0' : 'UTC' + (o < 0 ? '−' : '+') + (Number.isInteger(o) ? o < 0 ? -o : o : (Math.abs(o) | 0) + ':' + String(Math.round((Math.abs(o) % 1) * 60)).padStart(2, '0')));

function clock(h, m = 0) {
  const hh = ((h % 24) + 24) % 24;
  const ap = hh < 12 ? 'AM' : 'PM';
  const h12 = hh % 12 === 0 ? 12 : hh % 12;
  return `${h12}:${String(m).padStart(2, '0')} ${ap}`;
}
function shift(h, m, d) {
  let total = h * 60 + m + Math.round(d * 60);
  let day = 0;
  while (total < 0) { total += 1440; day--; }
  while (total >= 1440) { total -= 1440; day++; }
  return { h: Math.floor(total / 60), m: total % 60, day };
}
const dayNote = (d) => (d === 0 ? '' : d > 0 ? ' <span class="muted">(next day)</span>' : ' <span class="muted">(previous day)</span>');
const dayNoteT = (d) => (d === 0 ? '' : d > 0 ? ' (next day)' : ' (previous day)');

function pairPage(a, b, all) {
  const d = b.off - a.off;
  const path = `/convert/${a.id}-to-${b.id}/`;
  const dirWord = d === 0 ? 'the same time as' : d > 0 ? `${Math.abs(d)} hour${Math.abs(d) === 1 ? '' : 's'} ahead of` : `${Math.abs(d)} hour${Math.abs(d) === 1 ? '' : 's'} behind`;

  const rows = Array.from({ length: 24 }, (_, h) => {
    const t = shift(h, 0, d);
    return `<tr><td>${clock(h)}</td><td>${clock(t.h, t.m)}${dayNote(t.day)}</td></tr>`;
  }).join('');

  const business = [9, 10, 11, 12, 13, 14, 15, 16, 17].map((h) => {
    const t = shift(h, 0, d);
    const inHours = t.h >= 9 && t.h < 17 && t.day === 0;
    return `<tr><td>${clock(h)}</td><td>${clock(t.h, t.m)}${dayNote(t.day)}</td><td>${inHours ? '<span class="ok">working hours</span>' : '<span class="muted">outside 9–5</span>'}</td></tr>`;
  }).join('');

  const overlap = [];
  for (let h = 9; h < 17; h++) {
    const t = shift(h, 0, d);
    if (t.day === 0 && t.h >= 9 && t.h < 17) overlap.push(h);
  }
  const overlapText = overlap.length
    ? `Standard 9–5 working hours overlap for <strong>${overlap.length} hour${overlap.length === 1 ? '' : 's'}</strong>: ${clock(overlap[0])}–${clock(overlap[overlap.length - 1] + 1)} ${a.ab} (${clock(shift(overlap[0], 0, d).h)}–${clock(shift(overlap[overlap.length - 1] + 1, 0, d).h)} ${b.ab}). Schedule meetings inside that window.`
    : `Standard 9–5 working hours do <strong>not overlap</strong> at all between ${a.ab} and ${b.ab}. Someone has to take an early or late call — or use asynchronous communication instead.`;

  // Pairs that share an offset have no page — skip them or the link 404s.
  const siblings = all.filter((z) => z !== a && z !== b && z.off !== a.off).slice(0, 16)
    .map((z) => `<li><a href="/convert/${a.id}-to-${z.id}/">${a.ab} to ${z.ab}</a></li>`).join('');

  const t9 = shift(9, 0, d);
  const FAQ = faq([
    { q: `What time is ${clock(9)} ${a.ab} in ${b.ab}?`,
      a: `${clock(9)} ${a.ab} is <strong>${clock(t9.h, t9.m)} ${b.ab}</strong>${dayNoteT(t9.day)}.` },
    { q: `Is ${b.ab} ahead of ${a.ab}?`, a: `${b.ab} is ${dirWord} ${a.ab}.` },
    { q: 'Which time zone does this use?',
      a: `${a.ab} is ${offStr(a.off)} and ${b.ab} is ${offStr(b.off)}. Both abbreviations denote a single fixed offset, so this conversion never shifts with daylight saving — what changes is which abbreviation a place is using at the time.` },
  ]);

  return {
    path,
    title: `${a.ab} to ${b.ab} Converter — Time Zone Conversion | Toolman`,
    desc: `Convert ${a.ab} to ${b.ab}. ${b.ab} is ${dirWord} ${a.ab}. Includes a live converter, a full 24-hour conversion table and the best meeting times between the two zones.`,
    h1: `Convert ${a.ab} to ${b.ab}`,
    crumbs: [
      { name: 'Converters', path: '/convert/' },
      { name: 'Time zones', path: '/convert/time-zones/' },
      { name: `${a.ab} to ${b.ab}`, path },
    ],
    jsonld: [FAQ.schema],
    body: `<p class="muted"><strong>${b.ab} is ${dirWord} ${a.ab}.</strong> ${a.ab} is ${offStr(a.off)} and ${b.ab} is ${offStr(b.off)}.</p>

<div class="tool">
  <div class="grid2">
    <div><label for="a">Time in ${a.ab}</label><input type="time" id="a" step="60"></div>
    <div><label for="b">Time in ${b.ab}</label><input type="time" id="b" step="60"></div>
  </div>
  <p class="big" id="eq"></p>
  <p class="row"><button data-now>Use current time</button></p>
  <p class="muted">Right now: <strong id="nowA"></strong> ${a.ab} · <strong id="nowB"></strong> ${b.ab}</p>
</div>
<script>
(function(){
 var A=document.getElementById('a'),B=document.getElementById('b'),E=document.getElementById('eq');
 var offA=${a.off}, offB=${b.off}, d=${d};
 function pad(n){return String(n).padStart(2,'0')}
 function fmt(h,m){var ap=h<12?'AM':'PM',h12=h%12===0?12:h%12;return h12+':'+pad(m)+' '+ap}
 function sh(h,m,delta){var t=h*60+m+Math.round(delta*60),day=0;
   while(t<0){t+=1440;day--}while(t>=1440){t-=1440;day++}
   return {h:Math.floor(t/60),m:t%60,day:day}}
 function note(day){return day===0?'':day>0?' (next day)':' (previous day)'}
 function sync(from){
   var v=(from==='a'?A:B).value; if(!v)return;
   var p=v.split(':'),h=+p[0],m=+p[1];
   var t=sh(h,m,from==='a'?d:-d);
   (from==='a'?B:A).value=pad(t.h)+':'+pad(t.m);
   var av=A.value.split(':'),bv=B.value.split(':');
   E.textContent=fmt(+av[0],+av[1])+' ${a.ab} = '+fmt(+bv[0],+bv[1])+' ${b.ab}'+note(from==='a'?t.day:-t.day);
 }
 A.addEventListener('input',function(){sync('a')});
 B.addEventListener('input',function(){sync('b')});
 function zoneNow(off){var u=Date.now()+new Date().getTimezoneOffset()*60000;
   var t=new Date(u+off*3600000);return t}
 function tick(){
   var ta=zoneNow(offA),tb=zoneNow(offB);
   document.getElementById('nowA').textContent=fmt(ta.getHours(),ta.getMinutes());
   document.getElementById('nowB').textContent=fmt(tb.getHours(),tb.getMinutes());
 }
 document.querySelector('[data-now]').addEventListener('click',function(){
   var ta=zoneNow(offA);A.value=pad(ta.getHours())+':'+pad(ta.getMinutes());sync('a')});
 setInterval(tick,1000);tick();
 var ta=zoneNow(offA);A.value=pad(ta.getHours())+':'+pad(ta.getMinutes());sync('a');
})();
</script>

<h2>Best time to schedule a meeting</h2>
<p>${overlapText}</p>
<table><thead><tr><th>${a.ab}</th><th>${b.ab}</th><th>Suitable?</th></tr></thead><tbody>${business}</tbody></table>

<h2>${a.ab} to ${b.ab} conversion table</h2>
<table><thead><tr><th>${a.ab}</th><th>${b.ab}</th></tr></thead><tbody>${rows}</tbody></table>

<h2>About ${a.ab}</h2>
<p><strong>${a.name}</strong> (${a.ab}) is ${offStr(a.off)}. It is used in ${a.where}.</p>
<h2>About ${b.ab}</h2>
<p><strong>${b.name}</strong> (${b.ab}) is ${offStr(b.off)}. It is used in ${b.where}.</p>

<h2>A warning about daylight saving</h2>
<p>The abbreviations on this page each denote a single fixed offset, so every figure here is exact. What changes is <em>which</em> abbreviation a place uses. New York is on ${'EST'} in January and EDT in July, so "New York time" moves by an hour twice a year while EST and EDT themselves never move. When you schedule across zones, name the city rather than the abbreviation, or use UTC — that is what calendar software does internally.</p>

${FAQ.html}

<h2>Other ${a.ab} conversions</h2>
<ul class="linklist">${siblings}</ul>
<p><a href="/convert/time-zones/">All time zone converters</a> · <a href="/timestamp-converter/">Unix timestamp converter</a></p>`,
  };
}

export default async function () {
  const pages = [];
  const pairs = [];
  for (const a of Z) for (const b of Z) if (a !== b && a.off !== b.off) pairs.push([a, b]);
  for (const [a, b] of pairs) pages.push(pairPage(a, b, Z));

  pages.push({
    path: '/convert/time-zones/',
    title: `Time Zone Converter — ${pairs.length} Conversions | Toolman`,
    desc: 'Convert between EST, PST, CST, GMT, UTC, CET, IST, JST, AEST and more, with 24-hour conversion tables and meeting-time overlap for each pair.',
    h1: 'Time zone converters',
    crumbs: [{ name: 'Converters', path: '/convert/' }, { name: 'Time zones', path: '/convert/time-zones/' }],
    body: `<p class="muted">${pairs.length} time zone conversions. Each page has a live converter, a full 24-hour table and the working-hours overlap between the two zones.</p>
<h2>Zones covered</h2>
<table><thead><tr><th>Abbreviation</th><th>Offset</th><th>Name</th></tr></thead><tbody>
${Z.map((z) => `<tr><td><strong>${z.ab}</strong></td><td>${offStr(z.off)}</td><td>${esc(z.name)}</td></tr>`).join('')}
</tbody></table>
<h2>Why offsets are not time zones</h2>
<p>An offset such as UTC−5 is a number. A time zone is a place plus a set of rules about when that number changes. New York is UTC−5 in winter and UTC−4 in summer; Phoenix is UTC−7 all year even though it shares a "Mountain" label with Denver. Store instants in UTC, store user preferences as an IANA zone name such as <code>America/New_York</code>, and let the library do the arithmetic.</p>
<h2>Popular conversions</h2>
<ul class="linklist">${['pst-to-est', 'est-to-pst', 'utc-to-est', 'est-to-utc', 'pst-to-cst', 'gmt-to-est', 'utc-to-ist', 'ist-to-est', 'jst-to-pst', 'cet-to-est', 'aest-to-pst', 'utc-to-jst']
      .map((s) => `<li><a href="/convert/${s}/">${s.replace('-to-', ' to ').toUpperCase()}</a></li>`).join('')}</ul>
<h2>All conversions</h2>
<ul class="linklist">${pairs.map(([a, b]) => `<li><a href="/convert/${a.id}-to-${b.id}/">${a.ab} to ${b.ab}</a></li>`).join('')}</ul>`,
  });

  return pages;
}
