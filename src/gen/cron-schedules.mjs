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
      desc: `The cron expression to run a job ${s.title} is ${s.expr}. See what each field means, the next scheduled runs and equivalents for GitHub Actions, Kubernetes and AWS EventBridge.`,
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
    desc: `Ready-made cron expressions for every common schedule: every 5 minutes, hourly, daily at a given time, weekdays, weekly, monthly and more — each with field-by-field explanation and next run times.`,
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
