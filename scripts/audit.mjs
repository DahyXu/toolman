#!/usr/bin/env node
/**
 * Static SEO audit of dist/. Catches the failure modes that stop
 * programmatic pages from being indexed: duplicate titles and descriptions,
 * missing metadata, internal links that 404, and orphan pages.
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

const files = walk(dist);
const urlOf = (f) => '/' + path.relative(dist, f).replace(/\\/g, '/').replace(/index\.html$/, '');

const titles = new Map(), descs = new Map(), h1s = new Map();
const pages = new Map();
const linkedTo = new Set();
const problems = { noTitle: [], noDesc: [], noH1: [], noCanonical: [], longTitle: [], shortDesc: [], longDesc: [], multiH1: [] };
let totalLinks = 0;
const brokenLinks = [];

for (const f of files) {
  const html = fs.readFileSync(f, 'utf8');
  const url = urlOf(f);
  const title = (html.match(/<title>([^<]*)<\/title>/) || [])[1];
  const desc = (html.match(/<meta name="description" content="([^"]*)"/) || [])[1];
  const canon = (html.match(/<link rel="canonical" href="([^"]*)"/) || [])[1];
  const h1all = [...html.matchAll(/<h1[^>]*>([\s\S]*?)<\/h1>/g)].map((m) => m[1].replace(/<[^>]+>/g, '').trim());

  // A noindex page will never appear in a search result, so its title and
  // description length are not defects. It still counts for link checking.
  const noindex = /<meta name="robots" content="[^"]*noindex/.test(html);
  if (!noindex) {
  pages.set(url, { title, desc, canon });

  if (!title) problems.noTitle.push(url);
  else {
    if (title.length > 65) problems.longTitle.push(`${url} (${title.length})`);
    (titles.get(title) || titles.set(title, []).get(title)).push(url);
  }
  if (!desc) problems.noDesc.push(url);
  else {
    if (desc.length < 70) problems.shortDesc.push(`${url} (${desc.length})`);
    if (desc.length > 175) problems.longDesc.push(`${url} (${desc.length})`);
    (descs.get(desc) || descs.set(desc, []).get(desc)).push(url);
  }
  if (!canon) problems.noCanonical.push(url);
  if (!h1all.length) problems.noH1.push(url);
  if (h1all.length > 1) problems.multiH1.push(`${url} (${h1all.length})`);
  if (h1all[0]) (h1s.get(h1all[0]) || h1s.set(h1all[0], []).get(h1all[0])).push(url);
  }

  // internal links — strip code samples first, hrefs inside <pre>/<code> are
  // documentation, not navigation.
  const nav = html.replace(/<script[\s\S]*?<\/script>/g, '').replace(/<pre[\s\S]*?<\/pre>/g, '').replace(/<code[\s\S]*?<\/code>/g, '');
  for (const m of nav.matchAll(/href="(\/[^"#?]*)"/g)) {
    const href = m[1];
    totalLinks++;
    linkedTo.add(href);
  }
}

// resolve internal links against what actually exists
const exists = (u) => {
  if (pages.has(u)) return true;
  const asFile = path.join(dist, u.replace(/^\//, ''));
  return fs.existsSync(asFile);
};
for (const href of linkedTo) if (!exists(href)) brokenLinks.push(href);

const dupTitles = [...titles.entries()].filter(([, v]) => v.length > 1);
const dupDescs = [...descs.entries()].filter(([, v]) => v.length > 1);
const dupH1 = [...h1s.entries()].filter(([, v]) => v.length > 1);

// orphans: indexable pages nothing links to
const orphans = [...pages.keys()].filter((u) => u !== '/' && !linkedTo.has(u) && !u.includes('404'));

// Having an inbound link is not the same as being reachable. A group of pages
// can link only to each other and form an island Googlebot never walks into
// from the home page — this check reported zero orphans while 2,192 pages were
// unreachable that way. Walk the graph from '/' instead.
const outLinks = new Map();
for (const f of files) {
  const nav = fs.readFileSync(f, 'utf8')
    .replace(/<script[\s\S]*?<\/script>/g, '')
    .replace(/<pre[\s\S]*?<\/pre>/g, '')
    .replace(/<code[\s\S]*?<\/code>/g, '');
  outLinks.set(urlOf(f), [...nav.matchAll(/href="(\/[^"#?]*)"/g)].map((m) => m[1]));
}
const reached = new Set(['/']);
let frontier = ['/'];
while (frontier.length) {
  const next = [];
  for (const u of frontier)
    for (const v of outLinks.get(u) || [])
      if (!reached.has(v) && outLinks.has(v)) { reached.add(v); next.push(v); }
  frontier = next;
}
const unreachable = [...pages.keys()].filter((u) => !reached.has(u));

const line = (label, arr, sample = 5) => {
  const n = Array.isArray(arr) ? arr.length : arr;
  const mark = n === 0 ? '✓' : '✗';
  console.log(`${mark} ${label.padEnd(38)} ${n}`);
  if (n && Array.isArray(arr)) {
    for (const x of arr.slice(0, sample)) console.log(`    ${typeof x === 'string' ? x : JSON.stringify(x).slice(0, 110)}`);
    if (n > sample) console.log(`    … and ${n - sample} more`);
  }
};

console.log(`\nAudited ${files.length} pages, ${totalLinks.toLocaleString()} internal links\n`);
line('pages without <title>', problems.noTitle);
line('pages without meta description', problems.noDesc);
line('pages without canonical', problems.noCanonical);
line('pages without <h1>', problems.noH1);
line('pages with multiple <h1>', problems.multiH1);
line('duplicate titles', dupTitles.map(([t, v]) => `"${t.slice(0, 60)}" ×${v.length} → ${v[0]}`));
line('duplicate descriptions', dupDescs.map(([t, v]) => `"${t.slice(0, 60)}" ×${v.length} → ${v[0]}`));
line('duplicate H1s', dupH1.map(([t, v]) => `"${t.slice(0, 50)}" ×${v.length} → ${v[0]}`));
line('broken internal links', brokenLinks);
line('orphan pages (nothing links to them)', orphans);
line('pages unreachable from the home page', unreachable);
line('titles over 65 chars', problems.longTitle, 3);
line('descriptions under 70 chars', problems.shortDesc, 3);
line('descriptions over 175 chars', problems.longDesc, 3);

const fatal = problems.noTitle.length + problems.noDesc.length + problems.noCanonical.length +
  problems.noH1.length + dupTitles.length + dupDescs.length + brokenLinks.length + orphans.length + unreachable.length;
console.log(`\n${fatal === 0 ? '✓ no indexing blockers' : '✗ ' + fatal + ' issues that can block indexing'}\n`);
process.exit(0);
