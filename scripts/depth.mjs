#!/usr/bin/env node
/**
 * Report how much real prose each generated page carries.
 *
 * Thin, near-duplicate pages are the main reason Google indexes only a
 * fraction of a large programmatic site — they consume crawl budget and drag
 * the whole domain's perceived quality down. This finds them.
 */
import fs from 'node:fs';
import path from 'node:path';

const dist = path.join(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1')), '..', 'dist');

function walk(dir, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, out);
    else if (e.name.endsWith('.html')) out.push(p);
  }
  return out;
}

const rows = [];
for (const f of walk(dist)) {
  const html = fs.readFileSync(f, 'utf8');
  const body = (html.split('</head>')[1] || '')
    .replace(/<script[\s\S]*?<\/script>/g, '')
    .replace(/<style[\s\S]*?<\/style>/g, '');
  const text = body.replace(/<[^>]+>/g, ' ').replace(/&[a-z]+;/g, ' ').replace(/\s+/g, ' ').trim();
  const words = text ? text.split(' ').length : 0;
  const url = '/' + path.relative(dist, f).replace(/\\/g, '/').replace(/index\.html$/, '');
  // section = first path segment, so we can see which generator is weakest
  const section = url === '/' ? '(home)' : url.split('/').filter(Boolean)[0];
  rows.push({ url, words, section });
}

rows.sort((a, b) => a.words - b.words);

const buckets = [[0, 200], [200, 350], [350, 500], [500, 800], [800, Infinity]];
console.log(`\n${rows.length} pages\n`);
console.log('word count distribution');
for (const [lo, hi] of buckets) {
  const n = rows.filter((r) => r.words >= lo && r.words < hi).length;
  const label = hi === Infinity ? `${lo}+` : `${lo}–${hi}`;
  const bar = '█'.repeat(Math.round((n / rows.length) * 50));
  console.log(`  ${label.padEnd(9)} ${String(n).padStart(5)}  ${bar}`);
}
console.log(`\nmedian ${rows[Math.floor(rows.length / 2)].words} words`);

// per-section summary
const bySection = {};
for (const r of rows) {
  (bySection[r.section] ||= []).push(r.words);
}
console.log('\nby section (count / median / min)');
for (const [sec, ws] of Object.entries(bySection).sort((a, b) => a[1].length - b[1].length)) {
  ws.sort((a, b) => a - b);
  console.log(`  ${sec.padEnd(14)} ${String(ws.length).padStart(5)}  ${String(ws[Math.floor(ws.length / 2)]).padStart(5)}  ${String(ws[0]).padStart(5)}`);
}

console.log('\nthinnest 12 pages');
for (const r of rows.slice(0, 12)) console.log(`  ${String(r.words).padStart(4)}  ${r.url}`);
