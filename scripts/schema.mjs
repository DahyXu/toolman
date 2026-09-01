#!/usr/bin/env node
/**
 * Validate every page's JSON-LD.
 *
 * Malformed or subtly wrong structured data does not break the page, so it
 * fails silently — you simply never get the rich result. This checks that
 * every block parses, that required properties are present, and that the
 * FAQ answers actually match visible page text (Google penalises FAQ markup
 * whose content is not on the page).
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

const problems = { parse: [], missingType: [], faqNoAnswer: [], faqNotOnPage: [], breadcrumbBad: [], emptyName: [] };
const typeCount = {};
let blocks = 0;

for (const f of walk(dist)) {
  const html = fs.readFileSync(f, 'utf8');
  const url = '/' + path.relative(dist, f).replace(/\\/g, '/').replace(/index\.html$/, '');
  // Whitespace is removed on both sides of the comparison: stripping inline
  // tags such as <strong> leaves stray spaces around punctuation, which is a
  // rendering artefact rather than a difference in wording.
  const visible = html.replace(/<script[\s\S]*?<\/script>/g, ' ').replace(/<[^>]+>/g, ' ')
    .replace(/&amp;/g, '&').replace(/&nbsp;/g, ' ').replace(/&#\d+;/g, ' ')
    .replace(/\s+/g, '').toLowerCase();

  for (const m of html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)) {
    blocks++;
    let data;
    try { data = JSON.parse(m[1]); }
    catch (e) { problems.parse.push(`${url} — ${e.message}`); continue; }

    for (const node of Array.isArray(data) ? data : [data]) {
      const t = node['@type'];
      if (!t) { problems.missingType.push(url); continue; }
      typeCount[t] = (typeCount[t] || 0) + 1;

      if (t === 'FAQPage') {
        const qs = node.mainEntity || [];
        if (!qs.length) problems.faqNoAnswer.push(`${url} — FAQPage with no questions`);
        for (const q of qs) {
          if (!q.name) problems.emptyName.push(`${url} — question with no name`);
          const ans = q.acceptedAnswer && q.acceptedAnswer.text;
          if (!ans) { problems.faqNoAnswer.push(`${url} — "${(q.name || '').slice(0, 40)}" has no answer`); continue; }
          // The answer must appear on the page. Compare a distinctive slice.
          // Compare with whitespace removed on both sides: stripping inline
          // tags such as <strong> leaves spaces around punctuation that are a
          // rendering artefact, not a difference in wording.
          const probe = ans.replace(/<[^>]+>/g, '').replace(/&[a-z]+;/g, ' ')
            .replace(/\s+/g, '').toLowerCase().slice(0, 40);
          if (probe.length > 15 && !visible.includes(probe)) {
            problems.faqNotOnPage.push(`${url} — answer not in page text: "${probe}"`);
          }
        }
      }

      if (t === 'BreadcrumbList') {
        const items = node.itemListElement || [];
        if (!items.length) problems.breadcrumbBad.push(`${url} — empty breadcrumb`);
        items.forEach((it, i) => {
          if (it.position !== i + 1) problems.breadcrumbBad.push(`${url} — position ${it.position} at index ${i}`);
          if (!it.name || !it.item) problems.breadcrumbBad.push(`${url} — breadcrumb item missing name or item`);
        });
      }
    }
  }
}

console.log(`\n${blocks.toLocaleString()} JSON-LD blocks\n`);
console.log('types found');
for (const [t, n] of Object.entries(typeCount).sort((a, b) => b[1] - a[1])) {
  console.log(`  ${t.padEnd(20)} ${n.toLocaleString()}`);
}
// Group the FAQ mismatches by section so it is obvious which generator is at
// fault rather than staring at a truncated list of individual URLs.
if (problems.faqNotOnPage.length) {
  const bySection = {};
  for (const line of problems.faqNotOnPage) {
    const url = line.split(' — ')[0];
    const sec = url === '/' ? '(home)' : url.split('/').filter(Boolean)[0];
    bySection[sec] = (bySection[sec] || 0) + 1;
  }
  console.log('\nFAQ answers not found in page text, by section');
  for (const [sec, n] of Object.entries(bySection).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${sec.padEnd(16)} ${String(n).padStart(5)}`);
  }
}

console.log('');
let total = 0;
for (const [k, v] of Object.entries(problems)) {
  const mark = v.length === 0 ? '✓' : '✗';
  console.log(`${mark} ${k.padEnd(16)} ${v.length}`);
  total += v.length;
  for (const x of v.slice(0, 4)) console.log(`    ${x}`);
  if (v.length > 4) console.log(`    … and ${v.length - 4} more`);
}
console.log(`\n${total === 0 ? '✓ structured data is clean' : '✗ ' + total + ' structured-data problems'}\n`);
