import { esc, faq } from '../layout.mjs';

const DOW = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MON = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const h12 = (h) => `${h % 12 === 0 ? 12 : h % 12}:00 ${h < 12 ? 'AM' : 'PM'}`;
const hh = (h) => String(h).padStart(2, '0') + ':00';

// { slug, expr, title, desc, notes }
function build() {
  const out = [];
  const add = (slug, expr, title, blurb, notes = '') => out.push({ slug, expr, title, blurb, notes });

  add('every-minute', '* * * * *', 'every minute',
    'Runs 1,440 times a day — once for every minute on the clock.',
    'This is the finest granularity standard cron offers. If the job takes longer than a minute, runs will overlap; guard it with a lock file or <code>flock</code>. For anything sub-minute you need a long-running process with its own timer, a systemd timer with <code>OnUnitActiveSec</code>, or a job queue.');

  for (const n of [2, 3, 4, 5, 6, 10, 12, 15, 20, 30]) {
    add(`every-${n}-minutes`, `*/${n} * * * *`, `every ${n} minutes`,
      `Runs ${Math.floor(60 / n)} times an hour, at minute ${Array.from({ length: Math.min(6, Math.floor(60 / n)) }, (_, i) => i * n).join(', ')}${60 / n > 6 ? ' and so on' : ''} past every hour.`,
      60 % n === 0
        ? `Because ${n} divides evenly into 60, the schedule is regular across every hour boundary.`
        : `Note that ${n} does not divide evenly into 60, so the gap across the hour boundary is shorter than ${n} minutes — the step restarts at minute 0 of each hour. If you need a strictly even interval, use a job queue with a delay instead of cron.`);
  }

  add('every-hour', '0 * * * *', 'every hour',
    'Runs 24 times a day, on the hour.',
    'Spread hourly jobs across the hour rather than putting every one at minute 0 — a thundering herd of jobs at :00 is a common cause of hourly latency spikes. <code>17 * * * *</code> is just as hourly and much kinder to your database.');

  for (const n of [2, 3, 4, 6, 8, 12]) {
    add(`every-${n}-hours`, `0 */${n} * * *`, `every ${n} hours`,
      `Runs ${24 / n} times a day, at ${Array.from({ length: 24 / n }, (_, i) => hh(i * n)).join(', ')}.`,
      `The step restarts at midnight each day, so the interval is even as long as ${n} divides into 24 — which it does here.`);
  }

  for (let h = 0; h < 24; h++) {
    add(`every-day-at-${h}`, `0 ${h} * * *`, `every day at ${hh(h)}`,
      `Runs once a day at ${hh(h)} (${h12(h)}) server time.`,
      h >= 1 && h <= 3
        ? 'Careful: this hour is where daylight-saving transitions happen in most regions. On the spring-forward day the job may not run at all, and on the autumn day it may run twice. Run the server in UTC, or move the job outside 01:00–03:00.'
        : 'Remember this is the server\'s local time zone, not the user\'s. Run the server in UTC and convert for display if the exact wall-clock time matters to people.');
  }

  add('every-weekday', '0 9 * * 1-5', 'every weekday at 09:00',
    'Runs Monday to Friday at 09:00, skipping Saturday and Sunday.',
    'Day-of-week uses 0–6 with Sunday as 0, so Monday to Friday is <code>1-5</code>. Most implementations also accept <code>MON-FRI</code>.');
  add('every-weekend', '0 9 * * 6,0', 'every weekend at 09:00',
    'Runs on Saturday and Sunday at 09:00.',
    'Both <code>0</code> and <code>7</code> mean Sunday in most cron implementations. <code>6,0</code> is the portable way to write "weekend".');

  for (let d = 0; d < 7; d++) {
    add(`every-${DOW[d].toLowerCase()}`, `0 0 * * ${d}`, `every ${DOW[d]} at midnight`,
      `Runs once a week, on ${DOW[d]} at 00:00.`,
      'Weekly jobs at midnight on a single day are a good fit for reports and cleanups. Add a few minutes of offset if several weekly jobs would otherwise start simultaneously.');
  }

  add('first-day-of-month', '0 0 1 * *', 'on the first day of every month',
    'Runs at midnight on the 1st of each month — 12 times a year.',
    'Cron has no "last day of the month" in the standard syntax, because month lengths vary. The usual workaround is to run daily and exit unless tomorrow is the 1st: <code>0 0 * * * [ "$(date -d tomorrow +%d)" = "01" ] &amp;&amp; /path/to/job</code>.');
  add('every-month', '0 0 1 * *', 'every month',
    'Runs monthly, at midnight on the 1st.',
    'Identical to the first-day-of-month schedule. Some systems also accept the shorthand <code>@monthly</code>.');
  add('every-quarter', '0 0 1 1,4,7,10 *', 'every quarter',
    'Runs at midnight on 1 January, 1 April, 1 July and 1 October.',
    'Quarter boundaries are just four specific months, so list them explicitly in the month field.');
  add('every-year', '0 0 1 1 *', 'every year',
    'Runs once a year, at midnight on 1 January.',
    'Also written as <code>@yearly</code> or <code>@annually</code> where those shortcuts are supported.');
  add('every-15th', '0 0 15 * *', 'on the 15th of every month',
    'Runs at midnight on the 15th of each month.',
    'Useful for mid-month billing runs and reports. Unlike day 29–31, the 15th exists in every month, so there is no edge case.');
  add('twice-a-day', '0 0,12 * * *', 'twice a day',
    'Runs at 00:00 and 12:00 every day.',
    'A comma-separated list in the hour field is clearer than a step here, and it makes the intent obvious to whoever reads the crontab next.');
  add('business-hours', '0 9-17 * * 1-5', 'every hour during business hours',
    'Runs on the hour from 09:00 to 17:00, Monday to Friday — nine times a working day.',
    'Ranges combine across fields: <code>9-17</code> in hours and <code>1-5</code> in day-of-week. Note this includes 17:00 itself.');

  return out;
}

function nextRuns(expr, n = 5) {
  const [mi, hr, dom, mon, dow] = expr.split(' ');
  const parse = (f, lo, hi) => {
    const out = new Set();
    for (let part of f.split(',')) {
      let step = 1;
      const sp = part.split('/');
      if (sp.length === 2) step = parseInt(sp[1], 10);
      let a, b;
      if (sp[0] === '*') { a = lo; b = hi; }
      else {
        const r = sp[0].split('-');
        a = parseInt(r[0], 10);
        b = r.length > 1 ? parseInt(r[1], 10) : (sp.length === 2 ? hi : a);
      }
      for (let v = a; v <= b; v += step) out.add(v);
    }
    return out;
  };
  const S = [parse(mi, 0, 59), parse(hr, 0, 23), parse(dom, 1, 31), parse(mon, 1, 12), parse(dow, 0, 6)];
  const domAll = dom === '*', dowAll = dow === '*';
  const out = [];
  // Deterministic reference point so the build is reproducible.
  const d = new Date(Date.UTC(2026, 0, 1, 0, 0, 0));
  for (let i = 0; i < 600000 && out.length < n; i++) {
    if (S[0].has(d.getUTCMinutes()) && S[1].has(d.getUTCHours()) && S[3].has(d.getUTCMonth() + 1)) {
      const okD = S[2].has(d.getUTCDate()), okW = S[4].has(d.getUTCDay());
      if ((domAll && dowAll) || (domAll ? okW : dowAll ? okD : okD || okW)) out.push(new Date(d));
    }
    d.setUTCMinutes(d.getUTCMinutes() + 1);
  }
  return out;
}

const fmtRun = (d) =>
  `${DOW[d.getUTCDay()]} ${d.getUTCDate()} ${MON[d.getUTCMonth()].slice(0, 3)} ${String(d.getUTCHours()).padStart(2, '0')}:${String(d.getUTCMinutes()).padStart(2, '0')}`;


// What genuinely differs between one hour of the day and another. Without this
// the hourly pages differed only by a digit, which is the definition of a
// duplicate as far as a search engine is concerned.
function hourNotes(h) {
  const HOUR = {
    0: 'Midnight is the most contended slot on the internet. Log rotation, backups, billing rollovers and a large share of every crontab fire at 00:00, so a job here competes for disk and database with everything else on the machine. It is also the instant the date changes: a job that stamps "today" at 00:00 can disagree with one that started at 23:59, and anything computing "yesterday" is one time-zone conversion away from the wrong day. Unless the job genuinely belongs on the date boundary, a few minutes later is strictly better.',
    1: 'One in the morning is the start of the maintenance window on most systems, and the start of the daylight saving danger zone. Traffic has bottomed out and a long job has hours of headroom, which is the appeal. The catch is that in any zone observing DST this hour is adjacent to the transition, so verify what your cron implementation does before assuming a job scheduled here runs exactly once a day, every day.',
    2: 'Two in the morning is the single worst hour to schedule anything that must not repeat. This is the hour the clock jumps over in spring and repeats in autumn, so in a zone observing DST a job here <em>does not run at all</em> on one day of the year and <em>runs twice</em> on another. Vixie cron attempts to compensate for the spring gap, other implementations do not, and the behaviour is not consistent between them. If the job is not idempotent, the duplicate autumn run will do real damage. Run the server in UTC and this disappears, because UTC has no transitions.',
    3: 'Three in the morning is the tail of the maintenance window and just past the DST transition, which makes it a common compromise: quiet enough for heavy work, and far enough from 02:00 that the clock change is less likely to land on it. It is still inside the risky band in some zones, so UTC remains the safe answer.',
    4: 'Four in the morning is the classic backup hour. It is the deepest part of the trough almost everywhere, far enough past the DST window to be safe in practice, and still leaves several hours before anyone in Europe starts work. If a job is heavy and nobody needs to watch it, this is the default worth reaching for.',
    5: 'Five in the morning is where jobs go that must be finished before Europe wakes up. There is roughly two hours of margin before the earliest arrivals, which is enough for a retry if the first attempt fails but not enough for a human to intervene. Suitable for a pipeline whose output the working day depends on, provided it can recover on its own.',
    6: 'Six in the morning is the last comfortably quiet hour in European time zones. Anything scheduled here should be finished rather than starting when people arrive, because from this point the machine stops being idle. It is a reasonable slot for the final step of an overnight chain — the one that publishes the result rather than computes it.',
    7: 'Seven in the morning catches the very start of the European working day. The system is no longer idle but not yet loaded, which makes this a workable slot for something moderately heavy that must run before business hours rather than during them.',
    8: 'Eight in the morning is inside working hours in continental Europe and still the middle of the night across the Americas. That asymmetry is the useful property: a job here has European staff available to react while imposing nothing on US traffic.',
    9: 'Nine in the morning is the start of the working day in London and the middle of the morning in Berlin, and the most common time to deliver something a person is meant to read. The trade-off is that the machine is now genuinely busy, so this hour suits a light job with a human audience rather than a heavy one.',
    10: 'Ten in the morning is mid-morning across Europe and evening in East Asia. Load is at a European daytime plateau. Fine for a light recurring task; poor for anything holding a long database lock, since it will be felt.',
    11: 'Eleven is late morning in Europe and the end of the evening in Asia. It is one of the last hours before the European lunch dip, which some teams use deliberately as the moment to publish something they want seen before the afternoon.',
    12: 'Midday attracts jobs mostly because it is memorable, which also makes it busier than it looks. The genuine hazard here is notation rather than load: 12:00 is noon and 00:00 is midnight, and writing "12 AM" for either is the most common way to schedule a job exactly twelve hours from where it was meant to go. Cron itself is unambiguous — it only knows 0 to 23 — so the mistake happens when translating from a human description.',
    13: 'One in the afternoon is the European afternoon and the very start of the North American morning. It is the first hour of the day when staff on both sides of the Atlantic might be awake at once, which matters more for who can respond to a failure than for load.',
    14: 'Two in the afternoon is mid-afternoon in Europe and the start of the working morning on the US East Coast. This is the first hour with genuine overlap between European and American teams, which makes it a practical slot for anything that might need a decision from either.',
    15: 'Three in the afternoon is late in the European day and mid-morning in New York. The overlap window is at its widest here — Europe has not left and America has arrived — so a job that occasionally needs a human has the largest pool of them available at this hour.',
    16: 'Four in the afternoon is the last hour of the European working day and late morning in the eastern United States. A European failure here has very little time left to be noticed before people leave, which makes it a worse slot than it looks for anything needing attention on that side.',
    17: 'Five in the afternoon closes the European day. From this hour on, a failure is effectively an American-hours problem, because nobody in Europe is looking. Worth knowing if your on-call rota is concentrated on one continent.',
    18: 'Six in the evening is after hours in Europe and the middle of the American working afternoon. For a consumer-facing system this is also where traffic starts climbing towards its evening peak, so "after work" and "quiet" are not the same thing here.',
    19: 'Seven in the evening is late afternoon in New York and evening in Europe. On a system serving consumers rather than staff, this is approaching peak load — the opposite of what the clock suggests to someone thinking in office hours.',
    20: 'Eight in the evening is close to peak consumer traffic in Europe and the American working afternoon. Almost the worst hour of the day for a heavy job on a user-facing system, and unremarkable on an internal one, so which it is depends entirely on who your users are.',
    21: 'Nine in the evening is past the European peak and still the American afternoon. Load is falling in one hemisphere and steady in the other, which makes it a reasonable compromise for a system with users on both.',
    22: 'Ten at night is quiet in Europe and morning in East Asia and Australia. If your team spans those regions, this is one of the few hours with staff available that is also genuinely low-traffic in the West.',
    23: 'Eleven at night is the last hour before the date changes, which is exactly why it deserves care. A job that starts at 23:00 and runs for more than an hour finishes on the following calendar day, so anything that stamps its own completion time will disagree with anything that stamps its start. If the job is long and the date matters, either move it earlier or record the start rather than the finish.',
  };
  const parts = [HOUR[h]];
  if (h >= 1 && h <= 3) {
    parts.push('Running the server in UTC removes the daylight saving problem entirely, and is the reason most infrastructure does exactly that. If the server must run in a local zone, move the job outside 01:00 to 03:00.');
  }
  return parts.map((x) => `<p>${x}</p>`).join('');
}

function hourElsewhere(h) {
  const zones = [['New York', -5], ['London', 0], ['Berlin', 1], ['Mumbai', 5.5], ['Singapore', 8], ['Tokyo', 9], ['Sydney', 11]];
  const local = (off) => (((h + off) % 24) + 24) % 24;
  const rows = zones.map(([city, off]) => {
    const raw = h + off;
    const day = raw < 0 ? ' (previous day)' : raw >= 24 ? ' (next day)' : '';
    const m = Number.isInteger(off) ? '00' : '30';
    return `<tr><td>${city}</td><td class="out">${String(Math.floor(local(off))).padStart(2, '0')}:${m}${day}</td></tr>`;
  }).join('');

  // This differs for every hour of the day, which is the point: it is the one
  // fact about "04:00 UTC" that is not also true of "05:00 UTC".
  const state = (l) => (l >= 9 && l < 17 ? 'working' : l >= 7 && l < 22 ? 'awake' : 'asleep');
  const g = { working: [], awake: [], asleep: [] };
  for (const [city, off] of zones) g[state(local(off))].push(city);
  const phrase = [];
  if (g.working.length) phrase.push(`the middle of the working day in ${g.working.join(', ')}`);
  if (g.awake.length) phrase.push(`outside working hours but waking or winding down in ${g.awake.join(', ')}`);
  if (g.asleep.length) phrase.push(`the middle of the night in ${g.asleep.join(', ')}`);

  return `<p>Assuming the server runs UTC, a job firing at this hour lands on ${phrase.join('; ')}. That matters less for the machine than for the people: whoever is on call when this breaks is determined by this row, not by the schedule.</p>
<table><thead><tr><th>If the server runs UTC, this is</th><th></th></tr></thead><tbody>${rows}</tbody></table>`;
}


// Which weekday a job runs on changes one thing that matters more than the
// schedule itself: whether anyone is there when it breaks.
function dayNotes(d) {
  const DAY = {
    0: 'Sunday is the deepest part of the weekly trough on most systems, which is why it is the traditional slot for a full backup or a complete reindex — the work that is too disruptive to run any other day. Two cautions. Nobody is watching, so a Sunday failure is discovered on Monday at the earliest, which means the job needs alerting that actually reaches a person rather than an email into an unread inbox. And cron numbers Sunday as 0, but most implementations also accept 7, so the same schedule can legitimately appear written either way.',
    1: 'Monday is the natural home for anything summarising the week just finished: a report generated now covers a complete week and lands when there are people to read it. It is also the day the weekend surfaces. If something failed quietly on Saturday, Monday is when it is found, so a Monday job that consumes weekend data should verify the data arrived rather than assume it did — the failure mode is a report that looks fine and is silently missing two days.',
    2: 'Tuesday is the conventional release day in a lot of engineering organisations, for a reason that applies to scheduled jobs too: Monday is absorbed by whatever the weekend produced, so Tuesday is the first day the team is actually available to respond, and there are still three working days behind it. If a job needs a human ready when it runs, this is usually the earliest day that is genuinely true.',
    3: 'Wednesday is the furthest point from both weekends, which makes it the lowest-risk day in the week. Whatever happens, there are two working days on either side — enough margin to notice a failure, fix it, and still see the fix confirmed before the week ends. For a job with no reason to prefer any particular day, this is the default worth choosing.',
    4: 'Thursday is the last day of the week that still has a full working day behind it. That makes it the final safe slot for anything that might need attention: a Thursday failure gets Friday, while the same failure on Friday gets the weekend. If you are moving a job away from Friday and want to keep it as late in the week as possible, this is where it goes.',
    5: 'Friday is the worst day for anything that can fail expensively. A job that breaks on Friday evening has the whole weekend to compound — a stuck queue grows for two days, a partial migration stays partial, and an alert nobody reads on Friday night is an alert nobody reads until Monday. The cost of moving it earlier in the week is usually nothing, and it buys a working day of margin.',
    6: 'Saturday carries most of the benefit of a weekend slot with slightly less of the risk than Sunday: traffic is low enough for heavy work, and a failure still has Sunday before the week restarts. It is the better of the two weekend days for anything whose output Monday depends on, because there is a whole day left to retry.',
  };
  return [DAY[d],
    'Whichever day you pick, check the field itself: cron numbers the week from 0 for Sunday, and both 0 and 7 are usually accepted for it. A job firing a day early or a day late is almost always an off-by-one here — writing 1 for Sunday out of habit gives you Monday.',
  ].map((x) => `<p>${x}</p>`).join('');
}


// Runs per day, and the overlap headroom, both fall out of the interval. Cron
// will happily start a second copy of a job while the first is still running,
// and the shorter the interval the more likely that is.
function intervalNotes(mins) {
  const perDay = Math.round((24 * 60) / mins);
  const label = mins < 60 ? `${mins} minutes` : mins === 60 ? 'hour' : `${mins / 60} hours`;
  const parts = [];

  parts.push(`This fires <strong>${perDay.toLocaleString()} times a day</strong>, once every ${label}. That number is worth looking at before anything else: whatever the job costs — a database query, an API call, a container start — multiply it by ${perDay.toLocaleString()} and check the result is one you are willing to pay every day.`);

  if (mins <= 5) {
    parts.push(`At this frequency <strong>overlap is the main hazard</strong>. Cron starts a new run on schedule whether or not the previous one has finished, so if the job ever takes longer than ${mins} minute${mins === 1 ? '' : 's'} you get two copies running at once, then three. The usual symptom is a job that works fine until the data grows, then quietly begins corrupting or double-processing. Guard it with a lock — <code>flock</code> is one line in the crontab — rather than hoping the runtime stays short.`);
  } else if (mins <= 20) {
    parts.push(`Overlap is still worth guarding against here. A job that normally takes seconds can take minutes when something upstream is slow, and cron will start the next run regardless. <code>flock</code> costs nothing and turns a pile-up into a skipped run, which is almost always the better failure.`);
  } else if (mins < 60) {
    parts.push(`${mins} minutes is a comfortable polling cadence: frequent enough that nothing waits long, and slow enough that overlap only matters if the job is genuinely slow. It is the interval most status checks and queue drains end up at.`);
  } else if (mins <= 240) {
    parts.push(`At this spacing a run has a wide margin before the next one, so overlap is rarely the concern. The thing to check instead is what happens when one run is missed entirely — a machine reboot at the wrong moment means the gap is doubled, and if each run assumes it is processing exactly ${label} of data, that assumption is now wrong.`);
  } else {
    parts.push(`With ${label} between runs, missing one is far more consequential than overlapping. Have the job derive its own window from the last successful run rather than assuming a fixed ${label}, so a skipped execution catches up instead of leaving a hole.`);
  }

  if (mins < 60 && 60 % mins !== 0) {
    parts.push(`<strong>This interval does not divide evenly into an hour.</strong> <code>*/${mins}</code> counts from zero within each hour and then restarts, so the last gap before the top of the hour is shorter than the rest — the runs are not actually evenly spaced. If even spacing matters, pick a divisor of 60: 2, 3, 4, 5, 6, 10, 12, 15, 20 or 30.`);
  }

  return parts.map((x) => `<p>${x}</p>`).join('');
}

export default async function () {
  const all = build();
  const pages = [];

  for (const s of all) {
    const runs = nextRuns(s.expr, 6);

    const FAQ = faq([
      { q: `What is the cron expression to run a job ${s.title}?`, a: `<code>${s.expr}</code> — ${s.blurb}` },
      { q: 'Which time zone does cron use?',
        a: "The server's local time zone, unless the scheduler says otherwise. GitHub Actions always uses UTC. Kubernetes CronJobs use UTC unless you set <code>spec.timeZone</code>. Running servers in UTC and converting only for display avoids an entire class of daylight-saving bugs." },
      { q: 'What happens if the previous run is still going?',
        a: 'Standard cron starts a new one regardless, so long-running jobs can pile up. Wrap the command in <code>flock -n /var/lock/my-job.lock</code>, or set <code>concurrencyPolicy: Forbid</code> on a Kubernetes CronJob.' },
      { q: 'Why did my cron job not run at all?',
        a: 'The three usual causes: the script is not executable, the command relies on a <code>PATH</code> or environment variable that cron does not set, or output went nowhere because no mail transport is configured. Redirect stdout and stderr to a log file and the reason usually becomes obvious.' },
    ]);
    const others = all.filter((x) => x.slug !== s.slug).slice(0, 20);
    pages.push({
      path: `/cron/${s.slug}/`,
      title: `Cron Expression for ${s.title.replace(/^every/, 'Every')} — ${s.expr} | Toolman`,
      desc: `The cron expression for ${s.title} is ${s.expr}. What each field means, when it runs next, and the same schedule in GitHub Actions.`,
      h1: `Cron expression: ${s.title}`,
      crumbs: [
        { name: 'Cron schedules', path: '/cron/' },
        { name: s.title, path: `/cron/${s.slug}/` },
      ],
      jsonld: [FAQ.schema],
      body: `<pre style="font-size:1.35rem;text-align:center;padding:22px"><code>${s.expr}</code></pre>
<p class="muted">${s.blurb}</p>

<h2>What each field means</h2>
<table><thead><tr><th>Field</th><th>Value</th><th>Meaning</th></tr></thead><tbody>
${['minute', 'hour', 'day of month', 'month', 'day of week'].map((f, i) => {
        const v = s.expr.split(' ')[i];
        const meaning = v === '*' ? `every ${f}` :
          /^\*\/\d+$/.test(v) ? `every ${v.slice(2)} ${f}s` :
          v.includes('-') ? `${f} ${v.replace('-', ' through ')}` :
          v.includes(',') ? `${f} ${v.replace(/,/g, ', ')}` : `${f} ${v}`;
        return `<tr><td>${f}</td><td><code>${esc(v)}</code></td><td>${meaning}</td></tr>`;
      }).join('')}
</tbody></table>

<h2>Next runs</h2>
<p class="muted">Starting from 1 January 2026, 00:00 UTC:</p>
<ul class="linklist">${runs.map((r) => `<li>${fmtRun(r)}</li>`).join('')}</ul>

<h2>Things to watch</h2>
<p>${s.notes}</p>
${/^0 \d{1,2} \* \* \*$/.test(s.expr) ? hourNotes(+s.expr.split(' ')[1]) + hourElsewhere(+s.expr.split(' ')[1]) : ''}
${/^\S+ \S+ \* \* [0-6]$/.test(s.expr) ? dayNotes(+s.expr.split(' ')[4]) : ''}
${/^\*\/(\d+) \* \* \* \*$/.test(s.expr) ? intervalNotes(+/^\*\/(\d+)/.exec(s.expr)[1]) : ''}
${/^0 \*\/(\d+) \* \* \*$/.test(s.expr) ? intervalNotes(60 * +/^0 \*\/(\d+)/.exec(s.expr)[1]) : ''}

<h2>The same schedule elsewhere</h2>
<pre><code># crontab
${s.expr} /usr/local/bin/my-job >> /var/log/my-job.log 2>&amp;1

# GitHub Actions (.github/workflows/job.yml) — always UTC
on:
  schedule:
    - cron: '${s.expr}'

# Kubernetes CronJob
spec:
  schedule: "${s.expr}"

# AWS EventBridge — six fields, and ? in one of the day fields
cron(${(() => {
        const p = s.expr.split(' ');
        return `${p[0]} ${p[1]} ${p[4] === '*' ? p[2] : '?'} ${p[3]} ${p[4] === '*' ? '?' : p[4] === '1-5' ? 'MON-FRI' : p[4]} *`;
      })()})</code></pre>

${FAQ.html}

<h2>Other schedules</h2>
<ul class="linklist">${others.map((o) => `<li><a href="/cron/${o.slug}/">${esc(o.title)}</a></li>`).join('')}</ul>
<p><a href="/cron-expression-generator/">Build a custom cron expression →</a></p>`,
    });
  }

  pages.push({
    path: '/cron/',
    title: `Cron Expression Examples — ${all.length} Common Schedules | Toolman`,
    desc: `Ready-made cron expressions for every common schedule: every 5 minutes, hourly, daily, weekdays, weekly and monthly, each explained field by field with its next run times.`,
    h1: 'Cron schedule examples',
    crumbs: [{ name: 'Cron schedules', path: '/cron/' }],
    body: `<p class="muted">${all.length} ready-made cron expressions, each with a field breakdown, the next scheduled runs and equivalents for GitHub Actions, Kubernetes and AWS EventBridge. Need something else? <a href="/cron-expression-generator/">Build a custom expression</a>.</p>
<table><thead><tr><th>Schedule</th><th>Expression</th></tr></thead><tbody>
${all.map((s) => `<tr><td><a href="/cron/${s.slug}/">${esc(s.title.charAt(0).toUpperCase() + s.title.slice(1))}</a></td><td><code>${esc(s.expr)}</code></td></tr>`).join('')}
</tbody></table>
<h2>The field layout</h2>
<pre><code>┌───────── minute        (0 - 59)
│ ┌─────── hour          (0 - 23)
│ │ ┌───── day of month  (1 - 31)
│ │ │ ┌─── month         (1 - 12)
│ │ │ │ ┌─ day of week   (0 - 6, Sunday = 0)
│ │ │ │ │
* * * * *</code></pre>
<h2>Shorthand aliases</h2>
<table><tbody>
<tr><td><code>@yearly</code> / <code>@annually</code></td><td><code>0 0 1 1 *</code></td></tr>
<tr><td><code>@monthly</code></td><td><code>0 0 1 * *</code></td></tr>
<tr><td><code>@weekly</code></td><td><code>0 0 * * 0</code></td></tr>
<tr><td><code>@daily</code> / <code>@midnight</code></td><td><code>0 0 * * *</code></td></tr>
<tr><td><code>@hourly</code></td><td><code>0 * * * *</code></td></tr>
<tr><td><code>@reboot</code></td><td>once at startup</td></tr>
</tbody></table>`,
  });

  return pages;
}
