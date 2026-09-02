export default {
  slug: 'age-calculator',
  cat: 'convert',
  weight: 8,
  title: 'Age Calculator',
  metaTitle: 'Age Calculator — Exact Age in Years, Months and Days | Toolman',
  short: 'Work out an exact age, or the gap between any two dates.',
  desc:
    'Calculate exact age in years, months and days between any two dates, plus totals in weeks, hours and seconds, the weekday you were born and your next birthday.',
  intro: 'Enter a date of birth — or any two dates — to get the exact difference between them.',
  body: `<div class="tool">
  <div class="grid2">
    <div><label for="dob">Date of birth (or start date)</label><input type="date" id="dob"></div>
    <div><label for="asof">Age at this date</label><input type="date" id="asof"></div>
  </div>
  <div class="row"><button data-act="today">Reset to today</button><span id="err" class="err"></span></div>
  <p class="big" id="main"></p>
  <table><tbody id="rows"></tbody></table>
  <h2>Next birthday</h2>
  <p id="next" class="muted"></p>
  <h2>Milestones</h2>
  <table><tbody id="miles"></tbody></table>
</div>`,
  about: `<h2>How age is actually calculated</h2>
<p>Age in years is not days divided by 365.25. The standard method — the one used by legal systems, medical records and this calculator — counts completed calendar years since the birth date, then completed months, then remaining days. Someone born on 31 March is 0 years old until 31 March the following year, regardless of how many days that year contained.</p>
<h2>The awkward cases</h2>
<ul>
<li><strong>29 February.</strong> A person born on a leap day has a legal birthday of either 28 February or 1 March depending on the jurisdiction. Most software, including this page, treats the anniversary as 1 March in non-leap years for date arithmetic, while calendars often show 28 February.</li>
<li><strong>Month-end overflow.</strong> One month after 31 January is not a real date. Conventions differ: some systems clamp to 28 or 29 February, others roll into March. Clamping is the common choice and is what this calculator does.</li>
<li><strong>East Asian age reckoning.</strong> Traditional Korean age counted a newborn as one year old and added a year every Lunar New Year, so a baby born in December could be "two" a month later. South Korea standardised on international age in June 2023.</li>
<li><strong>Time zones.</strong> A birth at 23:30 in Tokyo is on the previous day in London. For legal purposes the date recorded at the place of birth is the one that counts.</li>
</ul>
<h2>Age of majority around the world</h2>
<table>
<tr><th>Milestone</th><th>Typical age</th></tr>
<tr><td>Legal adulthood</td><td>18 in most countries; 21 in a few, 16 in Scotland for some purposes</td></tr>
<tr><td>Driving licence</td><td>16–18 depending on the country and vehicle class</td></tr>
<tr><td>Alcohol purchase</td><td>18 in most of Europe, 21 in the United States</td></tr>
<tr><td>State pension age</td><td>62–68, rising in most developed economies</td></tr>
</table>
<h2>Useful reference points</h2>
<p>10,000 days is about 27 years and 4 months. 1 billion seconds is about 31 years and 8 months — a birthday worth marking if you like round numbers in the wrong base.</p>`,
  faq: [
    { q: 'How do I calculate age from a date of birth?', a: 'Count the completed years since the birth date, then the completed months since the last birthday, then the remaining days. This calculator does that automatically and also shows the total in days, weeks and hours.' },
    { q: 'How does it handle leap years?', a: 'Calendar arithmetic is used throughout, so leap days are counted where they actually fall rather than approximated. Ages are exact rather than rounded through a 365.25-day year.' },
    { q: 'What about a 29 February birthday?', a: 'In non-leap years the anniversary is treated as 1 March for the purposes of "completed years", which matches how most legal systems and software handle it.' },
    { q: 'Can I calculate the gap between two arbitrary dates?', a: 'Yes. The second field defaults to today, but you can set it to any date — past or future — to measure any interval.' },
    { q: 'Is my date of birth sent anywhere?', a: 'No. The calculation runs in your browser using the built-in Date object, and nothing is stored or transmitted.' },
  ],
  related: ['timestamp-converter', 'percentage-calculator', 'cron-expression-generator'],
  script: `
const $=s=>document.querySelector(s);
const pad=n=>String(n).padStart(2,'0');
const iso=d=>d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate());
const nf=n=>Math.floor(n).toLocaleString();
function diff(a,b){
  let y=b.getFullYear()-a.getFullYear();
  let m=b.getMonth()-a.getMonth();
  let d=b.getDate()-a.getDate();
  if(d<0){m--;const prev=new Date(b.getFullYear(),b.getMonth(),0).getDate();d+=prev}
  if(m<0){m+=12;y--}
  return {y,m,d};
}
function run(){
  const dobV=$('#dob').value,asV=$('#asof').value;
  $('#err').textContent='';
  if(!dobV||!asV){$('#main').textContent='';$('#rows').innerHTML='';$('#next').textContent='';$('#miles').innerHTML='';return}
  const a=new Date(dobV+'T00:00:00'),b=new Date(asV+'T00:00:00');
  if(isNaN(a)||isNaN(b)){$('#err').textContent='✗ Invalid date.';return}
  if(b<a){$('#err').textContent='✗ The second date is before the first.';$('#main').textContent='';return}
  const {y,m,d}=diff(a,b);
  const ms=b-a, days=ms/86400000;
  $('#main').textContent=y+' year'+(y===1?'':'s')+', '+m+' month'+(m===1?'':'s')+', '+d+' day'+(d===1?'':'s');
  const months=y*12+m;
  $('#rows').innerHTML=[
    ['In months',nf(months)+' months and '+d+' days'],
    ['In weeks',nf(days/7)+' weeks and '+Math.floor(days%7)+' days'],
    ['In days',nf(days)],
    ['In hours',nf(days*24)],
    ['In minutes',nf(days*1440)],
    ['In seconds',nf(days*86400)],
    ['Day of the week born',a.toLocaleDateString(undefined,{weekday:'long'})],
  ].map(r=>'<tr><td>'+r[0]+'</td><td class="out"><strong>'+r[1]+'</strong></td></tr>').join('');
  // next birthday
  let nb=new Date(b.getFullYear(),a.getMonth(),a.getDate());
  if(nb<b)nb=new Date(b.getFullYear()+1,a.getMonth(),a.getDate());
  const untilD=Math.round((nb-b)/86400000);
  $('#next').innerHTML=untilD===0
    ? '<strong class="ok">Today is the birthday.</strong>'
    : '<strong>'+untilD+' day'+(untilD===1?'':'s')+'</strong> until '+nb.toLocaleDateString(undefined,{weekday:'long',year:'numeric',month:'long',day:'numeric'})+', turning '+(y+1)+'.';
  // milestones
  const targets=[[1000,'1,000 days'],[5000,'5,000 days'],[10000,'10,000 days'],[15000,'15,000 days'],[20000,'20,000 days'],[25000,'25,000 days']];
  const rows=[];
  for(const [n,label] of targets){
    const dt=new Date(a.getTime()+n*86400000);
    rows.push('<tr><td>'+label+'</td><td class="out">'+iso(dt)+' <span class="muted">('+(dt<b?'passed':'upcoming')+')</span></td></tr>');
  }
  const gigasec=new Date(a.getTime()+1e12);
  rows.push('<tr><td>1 billion seconds</td><td class="out">'+iso(gigasec)+' <span class="muted">('+(gigasec<b?'passed':'upcoming')+')</span></td></tr>');
  $('#miles').innerHTML=rows.join('');
}
document.addEventListener('input',run);
document.addEventListener('click',e=>{if(e.target.closest('[data-act=today]')){$('#asof').value=iso(new Date());run()}});
$('#asof').value=iso(new Date());
$('#dob').value='1990-01-15';
run();
`,
};
