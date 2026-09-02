export default {
  slug: 'timestamp-converter',
  cat: 'dev',
  weight: 9,
  title: 'Unix Timestamp Converter',
  metaTitle: 'Unix Timestamp Converter — Epoch to Date & Back | Toolman',
  short: 'Convert Unix epoch seconds or milliseconds to a human date, and back.',
  desc:
    'Convert a Unix timestamp to a readable date and back. Seconds, milliseconds, microseconds and nanoseconds are detected automatically.',
  intro:
    'Convert between Unix time and human-readable dates. Seconds, milliseconds, microseconds and nanoseconds are detected automatically.',
  body: `<div class="tool">
  <p class="muted">Current Unix time <span class="pill" id="live">…</span> <button data-act="now" style="padding:4px 10px">Use now</button></p>
  <label for="ts">Timestamp</label>
  <input type="text" id="ts" placeholder="1700000000" inputmode="numeric">
  <div id="tsout" style="margin-top:14px"></div>
  <hr style="margin:22px 0">
  <label for="dt">Date and time (your local time zone)</label>
  <input type="datetime-local" id="dt" step="1">
  <div id="dtout" style="margin-top:14px"></div>
</div>`,
  about: `<h2>What is a Unix timestamp?</h2>
<p>Unix time (also called epoch time or POSIX time) counts the number of seconds that have elapsed since <strong>00:00:00 UTC on 1 January 1970</strong>, ignoring leap seconds. Because it is a single integer in a single time zone, it is the standard way to store and compare instants in databases, log files and APIs.</p>
<h2>Seconds, milliseconds and beyond</h2>
<table>
<tr><th>Unit</th><th>Digits today</th><th>Typical source</th></tr>
<tr><td>Seconds</td><td>10</td><td>Unix tools, PHP <code>time()</code>, Python <code>time.time()</code>, most REST APIs</td></tr>
<tr><td>Milliseconds</td><td>13</td><td>JavaScript <code>Date.now()</code>, Java <code>System.currentTimeMillis()</code></td></tr>
<tr><td>Microseconds</td><td>16</td><td>PostgreSQL internals, some tracing systems</td></tr>
<tr><td>Nanoseconds</td><td>19</td><td>Go <code>time.UnixNano()</code>, Prometheus and OpenTelemetry</td></tr>
</table>
<p>A common bug is mixing the two most popular units: passing milliseconds where seconds are expected puts the date around the year 56,000, and passing seconds where milliseconds are expected lands you in January 1970.</p>
<h2>The year 2038 problem</h2>
<p>Systems that store Unix time in a signed 32-bit integer overflow at <strong>03:14:07 UTC on 19 January 2038</strong>, wrapping around to 1901. Modern platforms use 64-bit time, but the issue still appears in old embedded firmware, legacy database columns and file formats.</p>
<h2>Converting in code</h2>
<pre><code>JavaScript  new Date(ts * 1000).toISOString()
            Math.floor(Date.now() / 1000)
Python      datetime.fromtimestamp(ts, timezone.utc)
            int(datetime.now(timezone.utc).timestamp())
SQL         to_timestamp(ts)              -- PostgreSQL
            FROM_UNIXTIME(ts)             -- MySQL
Go          time.Unix(ts, 0).UTC()
Bash        date -u -d @$ts</code></pre>`,
  faq: [
    { q: 'How do I know if a number is seconds or milliseconds?', a: 'Count the digits. A current timestamp in seconds has 10 digits; in milliseconds it has 13. This tool detects the unit automatically and shows which one it used.' },
    { q: 'Why is epoch time based on 1 January 1970?', a: 'It was chosen when Unix was developed in the early 1970s as a convenient recent reference point that fit comfortably in the integer sizes of the day.' },
    { q: 'Does Unix time include leap seconds?', a: 'No. Unix time deliberately pretends every day has exactly 86,400 seconds, which keeps arithmetic simple but means it drifts from true astronomical time by the number of leap seconds inserted so far.' },
    { q: 'Can a timestamp be negative?', a: 'Yes. Negative values represent instants before 1970 — for example <code>-86400</code> is 31 December 1969.' },
    { q: 'What time zone is a Unix timestamp in?', a: 'None, and that is the point. It always denotes an instant in UTC; time zones only matter when you format it for a human.' },
  ],
  related: ['uuid-generator', 'json-formatter', 'cron-expression-generator'],
  script: `
const $=s=>document.querySelector(s);
const pad=n=>String(n).padStart(2,'0');
function detect(v){
  const n=Number(v);
  if(!isFinite(n))return null;
  const a=Math.abs(n),d=String(Math.trunc(a)).length;
  if(d>=18)return{ms:n/1e6,unit:'nanoseconds'};
  if(d>=15)return{ms:n/1e3,unit:'microseconds'};
  if(d>=12)return{ms:n,unit:'milliseconds'};
  return{ms:n*1000,unit:'seconds'};
}
function rel(ms){
  const d=(ms-Date.now())/1000,a=Math.abs(d);
  const U=[[31536000,'year'],[2592000,'month'],[86400,'day'],[3600,'hour'],[60,'minute'],[1,'second']];
  for(const [s,n] of U){ if(a>=s){const v=Math.round(a/s);return v+' '+n+(v>1?'s':'')+(d<0?' ago':' from now')} }
  return 'just now';
}
function row(k,v){return '<tr><td>'+k+'</td><td class="out"><strong>'+v+'</strong></td></tr>'}
function showTs(){
  const raw=$('#ts').value.trim();
  if(!raw){$('#tsout').innerHTML='';return}
  const d=detect(raw);
  if(!d||!isFinite(d.ms)){$('#tsout').innerHTML='<p class="err">Not a valid number.</p>';return}
  const dt=new Date(d.ms);
  if(isNaN(dt)){$('#tsout').innerHTML='<p class="err">Out of range.</p>';return}
  const tz=Intl.DateTimeFormat().resolvedOptions().timeZone;
  $('#tsout').innerHTML='<p class="muted">Interpreted as <strong>'+d.unit+'</strong>.</p><table>'+
    row('UTC (ISO 8601)',dt.toISOString())+
    row('UTC (readable)',dt.toUTCString())+
    row('Local ('+tz+')',dt.toLocaleString(undefined,{dateStyle:'full',timeStyle:'medium'}))+
    row('Relative',rel(d.ms))+
    row('Seconds',Math.floor(d.ms/1000))+
    row('Milliseconds',Math.round(d.ms))+
    '</table>';
}
function showDt(){
  const v=$('#dt').value;
  if(!v){$('#dtout').innerHTML='';return}
  const dt=new Date(v);
  if(isNaN(dt)){$('#dtout').innerHTML='<p class="err">Invalid date.</p>';return}
  $('#dtout').innerHTML='<table>'+
    row('Unix seconds',Math.floor(dt.getTime()/1000))+
    row('Unix milliseconds',dt.getTime())+
    row('ISO 8601 (UTC)',dt.toISOString())+
    '</table>';
}
function nowLocal(d){return d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate())+'T'+pad(d.getHours())+':'+pad(d.getMinutes())+':'+pad(d.getSeconds())}
$('#ts').addEventListener('input',showTs);
$('#dt').addEventListener('input',showDt);
document.addEventListener('click',e=>{if(e.target.closest('[data-act=now]')){
  $('#ts').value=Math.floor(Date.now()/1000);showTs();
  $('#dt').value=nowLocal(new Date());showDt();}});
setInterval(()=>{$('#live').textContent=Math.floor(Date.now()/1000)},1000);
$('#live').textContent=Math.floor(Date.now()/1000);
$('#dt').value=nowLocal(new Date());showDt();
`,
};
