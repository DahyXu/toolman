#!/usr/bin/env node
/**
 * How many clicks from the home page each page is.
 *
 * Crawl budget is spent breadth-first from the entry points a search engine
 * knows about, and a page four or five levels deep competes with everything
 * shallower for it. With 7,000+ pages and roughly a seventh indexed, the depth
 * distribution says whether the internal linking is helping or getting in the
 * way — and which sections are stranded at the bottom.
 */
import fs from 'node:fs';
import path from 'node:path';

const dist = path.join(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1')), '..', 'dist');

function walk(dir, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, out);
    else if (e.name === 'index.html') out.push(p);
  }
  return out;
}

const urlOf = (f) => '/' + path.relative(dist, f).replace(/\\/g, '/').replace(/index\.html$/, '');
const files = walk(dist);
const links = new Map();

for (const f of files) {
  const html = fs.readFileSync(f, 'utf8');
  const out = new Set();
  for (const m of html.matchAll(/<a\b[^>]*href="([^"#?]+)/g)) {
    let h = m[1];
    if (!h.startsWith('/')) continue;
    if (!h.endsWith('/')) h += '/';
    out.add(h);
  }
  links.set(urlOf(f), out);
}

const known = new Set(links.keys());
const depth = new Map([['/', 0]]);
let frontier = ['/'];
while (frontier.length) {
  const next = [];
  for (const u of frontier) {
    for (const v of links.get(u) || []) {
      if (!known.has(v) || depth.has(v)) continue;
      depth.set(v, depth.get(u) + 1);
      next.push(v);
    }
  }
  frontier = next;
}

const buckets = new Map();
for (const u of known) {
  const d = depth.has(u) ? depth.get(u) : Infinity;
  buckets.set(d, (buckets.get(d) || 0) + 1);
}

console.log(`\n${known.size.toLocaleString()} pages, measured as clicks from the home page\n`);
const keys = [...buckets.keys()].sort((a, b) => a - b);
let cum = 0;
for (const d of keys) {
  const n = buckets.get(d);
  cum += n;
  const bar = '█'.repeat(Math.max(1, Math.round((n / known.size) * 50)));
  const lbl = d === Infinity ? 'unreachable' : `${d} click${d === 1 ? '' : 's'}`;
  console.log(`  ${lbl.padEnd(12)} ${String(n).padStart(6)}  ${((n / known.size) * 100).toFixed(1).padStart(5)}%  ${((cum / known.size) * 100).toFixed(0).padStart(4)}% cumulative  ${bar}`);
}

// Which sections sit deepest — the ones a crawler reaches last.
const bySection = new Map();
for (const u of known) {
  const s = u === '/' ? '(home)' : u.split('/').filter(Boolean)[0];
  const d = depth.has(u) ? depth.get(u) : Infinity;
  if (!bySection.has(s)) bySection.set(s, { n: 0, sum: 0, max: 0, unreachable: 0 });
  const b = bySection.get(s);
  b.n++;
  if (d === Infinity) b.unreachable++;
  else { b.sum += d; b.max = Math.max(b.max, d); }
}

console.log('\ndeepest sections (average clicks from home)\n');
const list = [...bySection.entries()]
  .map(([s, b]) => ({ s, n: b.n, avg: b.n - b.unreachable ? b.sum / (b.n - b.unreachable) : Infinity, max: b.max, unreachable: b.unreachable }))
  .sort((a, b) => b.avg - a.avg || b.n - a.n);
for (const r of list.slice(0, 14)) {
  console.log(`  ${r.s.padEnd(14)} ${String(r.n).padStart(5)} pages   avg ${r.avg.toFixed(2)}   deepest ${r.max}${r.unreachable ? `   ${r.unreachable} unreachable` : ''}`);
}
console.log();
