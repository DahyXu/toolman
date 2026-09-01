#!/usr/bin/env node
// Group failing FAQ answers by question pattern so it is obvious which
// template in which generator is producing markup that does not match the page.
import fs from 'node:fs';
import path from 'node:path';

const dist = path.join(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1')), '..', 'dist');
const root = process.argv[2] ? path.join(dist, process.argv[2]) : dist;

function walk(dir, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, out);
    else if (e.name.endsWith('.html')) out.push(p);
  }
  return out;
}

const bad = new Map();
for (const f of walk(root)) {
  const html = fs.readFileSync(f, 'utf8');
  const url = '/' + path.relative(dist, f).replace(/\\/g, '/').replace(/index\.html$/, '');
  const visible = html.replace(/<script[\s\S]*?<\/script>/g, ' ').replace(/<[^>]+>/g, ' ')
    .replace(/&amp;/g, '&').replace(/&nbsp;/g, ' ').replace(/\s+/g, '').toLowerCase();

  for (const m of html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)) {
    let data;
    try { data = JSON.parse(m[1]); } catch { continue; }
    for (const node of Array.isArray(data) ? data : [data]) {
      if (node['@type'] !== 'FAQPage') continue;
      for (const q of node.mainEntity || []) {
        const ans = (q.acceptedAnswer && q.acceptedAnswer.text) || '';
        const probe = ans.replace(/<[^>]+>/g, '').replace(/\s+/g, '').toLowerCase().slice(0, 40);
        if (probe.length > 15 && !visible.includes(probe)) {
          // normalise numbers out of the question so templates group together
          const key = String(q.name).replace(/[\d,.]+/g, 'N').slice(0, 70);
          if (!bad.has(key)) bad.set(key, []);
          bad.get(key).push({ url, probe });
        }
      }
    }
  }
}

const entries = [...bad.entries()].sort((a, b) => b[1].length - a[1].length);
console.log(`\n${entries.length} distinct failing question templates\n`);
for (const [key, hits] of entries.slice(0, 12)) {
  console.log(`${String(hits.length).padStart(5)}  ${key}`);
  console.log(`       eg ${hits[0].url}`);
  console.log(`       schema says: "${hits[0].probe}"`);
}
