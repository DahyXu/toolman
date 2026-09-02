export default {
  slug: 'cron-expression-generator',
  cat: 'dev',
  weight: 9,
  title: 'Cron Expression Generator',
  metaTitle: 'Cron Expression Generator & Explainer — Free Online | Toolman',
  short: 'Build, explain and preview cron schedules in plain English.',
  desc:
    'Build a cron expression from plain English or paste one to see what it means, when it next runs, and what each of the five fields is doing.',
  intro:
    'Type a cron expression to see what it means and when it runs next, or pick a preset. Supports standard 5-field crontab plus <code>*/n</code>, ranges and lists.',
  body: `<div class="tool">
  <label for="ex">Cron expression</label>
  <input type="text" id="ex" value="*/5 * * * *" spellcheck="false" style="font-family:var(--mono);font-size:1.1rem">
  <p id="desc" class="big" style="font-size:1.1rem"></p>
  <p id="err" class="err"></p>
  <div class="row">
    <select id="preset" aria-label="Common schedules" style="width:auto">
      <option value="">Common schedules…</option>
      <option value="* * * * *">Every minute</option>
      <option value="*/5 * * * *">Every 5 minutes</option>
      <option value="*/10 * * * *">Every 10 minutes</option>
      <option value="*/15 * * * *">Every 15 minutes</option>
      <option value="*/30 * * * *">Every 30 minutes</option>
      <option value="0 * * * *">Every hour</option>
      <option value="0 */2 * * *">Every 2 hours</option>
      <option value="0 */6 * * *">Every 6 hours</option>
      <option value="0 0 * * *">Every day at midnight</option>
      <option value="0 9 * * *">Every day at 9:00</option>
      <option value="30 3 * * *">Every day at 03:30</option>
      <option value="0 9 * * 1-5">Weekdays at 9:00</option>
      <option value="0 0 * * 0">Every Sunday at midnight</option>
      <option value="0 0 1 * *">First day of every month</option>
      <option value="0 0 1 1 *">Every 1 January</option>
      <option value="0 0 * * 6,0">Every weekend at midnight</option>
    </select>
    <button data-act="copy">Copy</button>
  </div>
  <table style="margin-top:6px"><thead><tr><th>Field</th><th>Value</th><th>Meaning</th></tr></thead><tbody id="fields"></tbody></table>
  <h2>Next 10 runs <span class="muted" style="font-weight:400;font-size:.85rem">(your local time zone)</span></h2>
  <ul id="next" class="linklist"></ul>
</div>`,
  about: `<h2>Cron field reference</h2>
<pre><code>┌───────── minute        (0 - 59)
│ ┌─────── hour          (0 - 23)
│ │ ┌───── day of month  (1 - 31)
│ │ │ ┌─── month         (1 - 12)
│ │ │ │ ┌─ day of week   (0 - 6, Sunday = 0)
│ │ │ │ │
* * * * *</code></pre>
<h2>Special characters</h2>
<table>
<tr><th>Symbol</th><th>Meaning</th><th>Example</th></tr>
<tr><td><code>*</code></td><td>Every value</td><td><code>* * * * *</code> — every minute</td></tr>
<tr><td><code>,</code></td><td>List of values</td><td><code>0 9,17 * * *</code> — at 09:00 and 17:00</td></tr>
<tr><td><code>-</code></td><td>Range</td><td><code>0 9-17 * * *</code> — hourly from 09:00 to 17:00</td></tr>
<tr><td><code>/</code></td><td>Step</td><td><code>*/15 * * * *</code> — every 15 minutes</td></tr>
</table>
<h2>The day-of-month / day-of-week trap</h2>
<p>When <em>both</em> the day-of-month and day-of-week fields are restricted, standard cron treats them as <strong>OR</strong>, not AND. <code>0 0 13 * 5</code> runs on the 13th of the month <em>and</em> on every Friday — not only on Friday the 13th. To get an AND, leave one field as <code>*</code> and check the other condition inside your script.</p>
<h2>Practical warnings</h2>
<ul>
<li><strong>Time zone.</strong> Cron uses the server's local time. A daily 02:30 job may run twice or not at all on daylight-saving transition days — schedule sensitive jobs outside 01:00–03:00 or run the server in UTC.</li>
<li><strong>Overlap.</strong> Cron starts a new run on schedule even if the previous one is still going. Use a lock file or <code>flock</code> for jobs that must not overlap.</li>
<li><strong>Environment.</strong> Cron runs with a minimal environment and a bare <code>PATH</code>. Use absolute paths and source your profile explicitly.</li>
<li><strong>Percent signs.</strong> In a crontab, <code>%</code> is special and must be escaped as <code>\\%</code> — a common cause of broken <code>date</code> formats.</li>
</ul>
<h2>Non-standard extensions</h2>
<p>Many systems add shortcuts such as <code>@hourly</code>, <code>@daily</code>, <code>@weekly</code>, <code>@monthly</code>, <code>@yearly</code> and <code>@reboot</code>. Quartz (Java) and AWS EventBridge use a six- or seven-field format that adds seconds and years, and support <code>L</code>, <code>W</code> and <code>#</code> for "last", "nearest weekday" and "nth weekday of the month".</p>`,
  faq: [
    { q: 'How do I run a cron job every 5 minutes?', a: 'Use <code>*/5 * * * *</code>. The <code>*/5</code> step applies to the minute field, so the job fires at :00, :05, :10 and so on.' },
    { q: 'How do I run a job only on weekdays?', a: 'Set the day-of-week field to <code>1-5</code> (Monday to Friday). For example <code>0 9 * * 1-5</code> runs at 09:00 Monday through Friday.' },
    { q: 'Is Sunday 0 or 7?', a: 'Both work in most implementations — <code>0</code> and <code>7</code> each mean Sunday. Prefer <code>0</code> for portability, or use the three-letter names <code>SUN</code>–<code>SAT</code> where supported.' },
    { q: 'Why did my cron job not run?', a: 'The three usual causes are a missing execute permission on the script, a command that relies on a <code>PATH</code> or environment variable cron does not have, and output going nowhere because no mail transport is configured. Redirect output to a log file to see what happened.' },
    { q: 'How do I schedule something every 90 minutes?', a: 'Cron cannot express intervals that do not divide evenly into an hour. Either list the times explicitly (<code>0 0,3,6,9,12,15,18,21 * * *</code> for every three hours) or run every 30 minutes and let the script decide whether to act.' },
  ],
  related: ['timestamp-converter', 'uuid-generator', 'json-formatter'],
  script: `
const $=s=>document.querySelector(s);
const DOW=['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
const MON=['January','February','March','April','May','June','July','August','September','October','November','December'];
const RANGE=[[0,59,'minute'],[0,23,'hour'],[1,31,'day of month'],[1,12,'month'],[0,6,'day of week']];
const NAMES={3:{jan:1,feb:2,mar:3,apr:4,may:5,jun:6,jul:7,aug:8,sep:9,oct:10,nov:11,dec:12},
             4:{sun:0,mon:1,tue:2,wed:3,thu:4,fri:5,sat:6}};
function parseField(f,idx){
  const [lo,hi]=RANGE[idx];
  const out=new Set();
  for(let part of f.split(',')){
    part=part.trim().toLowerCase();
    if(!part)throw new Error('empty value in field '+(idx+1));
    let step=1,m=part.split('/');
    if(m.length>2)throw new Error('bad step in "'+part+'"');
    if(m.length===2){step=parseInt(m[1],10);if(!(step>0))throw new Error('invalid step "/'+m[1]+'"')}
    let range=m[0],a,b;
    if(range==='*'){a=lo;b=hi}
    else{
      const r=range.split('-');
      const val=x=>{const n=NAMES[idx]&&NAMES[idx][x];if(n!==undefined)return n;
        const v=parseInt(x,10);if(isNaN(v))throw new Error('"'+x+'" is not a valid '+RANGE[idx][2]);return v};
      a=val(r[0]); b=r.length>1?val(r[1]):(m.length===2?hi:a);
      if(r.length>2)throw new Error('bad range "'+range+'"');
    }
    if(idx===4&&(a===7||b===7)){if(a===7)a=0;if(b===7)b=0}
    if(a<lo||b>hi||a>b)throw new Error(RANGE[idx][2]+' must be between '+lo+' and '+hi);
    for(let v=a;v<=b;v+=step)out.add(v);
  }
  return [...out].sort((x,y)=>x-y);
}
function human(f,idx,sets){
  const [lo,hi]=RANGE[idx],s=sets[idx];
  if(f==='*')return 'every '+RANGE[idx][2];
  const all=hi-lo+1;
  const st=/^\\*\\/(\\d+)$/.exec(f);
  if(st)return 'every '+st[1]+' '+RANGE[idx][2]+'s';
  const label=v=>idx===4?DOW[v]:idx===3?MON[v-1]:String(v);
  if(s.length===all)return 'every '+RANGE[idx][2];
  if(s.length<=6)return s.map(label).join(', ');
  return s.length+' selected values';
}
function hourPhrase(hr){
  const two=n=>String(n).padStart(2,'0');
  if(hr.length===1)return two(hr[0])+':00';
  const contiguous=hr.every((h,i)=>i===0||h===hr[i-1]+1);
  if(contiguous)return 'every hour from '+two(hr[0])+':00 through '+two(hr[hr.length-1])+':00';
  return 'hours '+hr.map(two).join(', ');
}
function describe(sets,parts){
  const [mi,hr,dom,mon,dow]=sets;
  let time;
  const two=n=>String(n).padStart(2,'0');
  const stepM=/^\\*\\/(\\d+)$/.exec(parts[0]);
  if(parts[0]==='*'&&parts[1]==='*')time='every minute';
  else if(stepM&&parts[1]==='*')time='every '+stepM[1]+' minutes';
  else if(stepM)time='every '+stepM[1]+' minutes during hours '+hr.join(', ');
  else if(parts[0]==='0'&&/^\\*\\/(\\d+)$/.test(parts[1]))time='every '+/^\\*\\/(\\d+)$/.exec(parts[1])[1]+' hours';
  else if(parts[1]==='*'&&mi.length===1)time='at minute '+mi[0]+' of every hour';
  else if(parts[1]==='*')time='at minutes '+mi.join(', ')+' of every hour';
  else if(mi.length===1&&hr.length<=4)time='at '+hr.map(h=>two(h)+':'+two(mi[0])).join(' and ');
  else if(/^\\*\\/(\\d+)$/.test(parts[0]))time='every '+/^\\*\\/(\\d+)$/.exec(parts[0])[1]+' minutes'+(parts[1]==='*'?'':' during hours '+hr.join(', '));
  else if(mi.length===1)time='at minute '+mi[0]+' past '+hourPhrase(hr);
  else time='at minutes '+mi.join(', ')+' past '+hourPhrase(hr);
  let day='';
  const domAll=parts[2]==='*',dowAll=parts[4]==='*';
  if(domAll&&dowAll)day='every day';
  else if(dowAll)day='on day '+dom.join(', ')+' of the month';
  else if(domAll)day='on '+dow.map(d=>DOW[d]).join(', ');
  else day='on day '+dom.join(', ')+' of the month, and on '+dow.map(d=>DOW[d]).join(', ');
  const m=parts[3]==='*'?'':' in '+mon.map(x=>MON[x-1]).join(', ');
  return (time.charAt(0).toUpperCase()+time.slice(1))+', '+day+m+'.';
}
function nextRuns(sets,n){
  const [mi,hr,dom,mon,dow]=sets;
  const S=[new Set(mi),new Set(hr),new Set(dom),new Set(mon),new Set(dow)];
  const domAll=dom.length===31,dowAll=dow.length===7;
  const out=[];const d=new Date();d.setSeconds(0,0);d.setMinutes(d.getMinutes()+1);
  for(let i=0;i<527040&&out.length<n;i++){
    if(S[0].has(d.getMinutes())&&S[1].has(d.getHours())&&S[3].has(d.getMonth()+1)){
      const okD=S[2].has(d.getDate()),okW=S[4].has(d.getDay());
      if((domAll&&dowAll)||(domAll?okW:dowAll?okD:(okD||okW)))out.push(new Date(d));
    }
    d.setMinutes(d.getMinutes()+1);
  }
  return out;
}
function run(){
  const raw=$('#ex').value.trim().replace(/\\s+/g,' ');
  $('#err').textContent='';
  const alias={'@yearly':'0 0 1 1 *','@annually':'0 0 1 1 *','@monthly':'0 0 1 * *','@weekly':'0 0 * * 0','@daily':'0 0 * * *','@midnight':'0 0 * * *','@hourly':'0 * * * *'};
  const ex=alias[raw.toLowerCase()]||raw;
  const parts=ex.split(' ');
  if(parts.length!==5){
    $('#desc').textContent='';$('#fields').innerHTML='';$('#next').innerHTML='';
    $('#err').textContent=raw?'A cron expression needs exactly 5 fields — got '+parts.length+'.':'';return}
  let sets;
  try{sets=parts.map(parseField)}
  catch(e){$('#desc').textContent='';$('#fields').innerHTML='';$('#next').innerHTML='';$('#err').textContent='✗ '+e.message;return}
  $('#desc').textContent=describe(sets,parts);
  $('#fields').innerHTML=parts.map((p,i)=>'<tr><td>'+RANGE[i][2]+'</td><td><code>'+p+'</code></td><td>'+human(p,i,sets)+'</td></tr>').join('');
  $('#next').innerHTML=nextRuns(sets,10).map(d=>'<li>'+d.toLocaleString(undefined,{weekday:'short',year:'numeric',month:'short',day:'numeric',hour:'2-digit',minute:'2-digit'})+'</li>').join('')||'<li class="muted">No matching times found in the next year.</li>';
}
$('#ex').addEventListener('input',run);
$('#preset').addEventListener('change',e=>{if(e.target.value){$('#ex').value=e.target.value;run()}});
document.addEventListener('click',e=>{if(e.target.closest('[data-act=copy]')){$('#ex').select();document.execCommand('copy')}});
run();
`,
};
