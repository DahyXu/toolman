#!/usr/bin/env node
/**
 * The A2 page was titled "A2 Paper Size — 420 × 594 mm" while the queries
 * arriving were "a2 size", "a2 dimensions", "a2 in inches" and "a2 size in cm".
 * Three of those five ask for a unit the title did not contain, and the site
 * ranking above us leads with "A2 Size in Inches, mm, cm".
 *
 * A title has roughly 60 characters of usable width in a result. Spending 30 of
 * them is not neutral: the unused half cannot match anything. This reports the
 * sections whose titles are leaving the most room unused, so the next rewrite
 * goes where it is worth doing.
 */
import fs from 'node:fs';
import path from 'node:path';

const here = path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1'));
const dist = path.join(here, '..', 'dist');

// Google truncates around here on desktop. Past it, characters are not shown.
const USABLE = 60;

const bySection = new Map();
const dupes = new Map();

(function walk(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) { walk(p); continue; }
    if (e.name !== 'index.html') continue;
    const html = fs.readFileSync(p, 'utf8');
    const m = html.match(/<title>([^<]*)<\/title>/);
    if (!m) continue;
    const title = m[1].replace(/&amp;/g, '&').replace(/&#\d+;/g, '·');
    const rel = p.slice(dist.length).split(path.sep).join('/').replace(/index\.html$/, '');
    const section = rel.split('/')[1] || '(root)';
    if (!bySection.has(section)) bySection.set(section, []);
    bySection.get(section).push({ rel, title, len: title.length });
    dupes.set(title, (dupes.get(title) || 0) + 1);
  }
})(dist);

const rows = [...bySection]
  .map(([section, list]) => {
    const avg = list.reduce((a, b) => a + b.len, 0) / list.length;
    const short = list.filter((x) => x.len < 40).length;
    return {
      section,
      n: list.length,
      avg: Math.round(avg),
      unused: Math.max(0, Math.round(USABLE - avg)),
      short,
      sample: [...list].sort((a, b) => a.len - b.len)[0],
    };
  })
  .filter((r) => r.n >= 8)
  .sort((a, b) => b.unused * Math.log(b.n) - a.unused * Math.log(a.n));

console.log(`\nTitle width by section — ${USABLE} characters is what a result shows\n`);
console.log('  section'.padEnd(20), 'pages'.padStart(6), 'avg'.padStart(5), 'unused'.padStart(7), 'under 40'.padStart(9));
for (const r of rows) {
  const flag = r.unused >= 20 ? '✗' : r.unused >= 12 ? '~' : '✓';
  console.log(`  ${flag} ${r.section.padEnd(17)} ${String(r.n).padStart(6)} ${String(r.avg).padStart(5)} ${String(r.unused).padStart(7)} ${String(r.short).padStart(9)}`);
  if (r.unused >= 12) console.log(`      shortest: ${r.sample.title}  (${r.sample.len})  ${r.sample.rel}`);
}

const repeated = [...dupes].filter(([, n]) => n > 1);
console.log(`\n  ${repeated.length ? '✗' : '✓'} titles used by more than one page          ${repeated.length}`);
for (const [t, n] of repeated.slice(0, 6)) console.log(`      ${n}× ${t}`);

console.log('\n  ✗ 20+ characters unused — the title cannot match what it does not say');
console.log('  ~ 12–19 unused');
console.log('  ✓ using the width');
