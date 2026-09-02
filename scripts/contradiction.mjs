#!/usr/bin/env node
/**
 * Look for a page disagreeing with itself.
 *
 * Written because self-contradiction turned out to be the characteristic
 * failure of generated prose here, and nothing else checks for it. Four real
 * examples this project has shipped:
 *
 *   - #000000 under an H1 reading "Black", described in the next line as a
 *     "near-black grey".
 *   - /roman/1990/ calling the number a year and writing it "1,990".
 *   - /convert/pt-to-mm/ opening "at the browser default root font size" and
 *     saying three sections later that the ratio never changes.
 *   - Category titles reading "Developer Tools — Free Online Developer Tools".
 *
 * Only some of that is mechanically detectable. This checks the two forms that
 * are, and says nothing about the rest rather than pretending to cover it.
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

const visible = (html) =>
  (html.split('</head>')[1] || '')
    .replace(/<script[\s\S]*?<\/script>/g, ' ')
    .replace(/<style[\s\S]*?<\/style>/g, ' ')
    .replace(/<pre[\s\S]*?<\/pre>/g, ' ')
    .replace(/<code[\s\S]*?<\/code>/g, ' ')
    .replace(/<table[\s\S]*?<\/table>/g, ' ')
    .replace(/<nav[\s\S]*?<\/nav>/g, ' ')
    .replace(/<footer[\s\S]*?<\/footer>/g, ' ')
    .replace(/<header[\s\S]*?<\/header>/g, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ');

const mixedFormat = [];
const titleRepeats = [];

for (const f of walk(dist)) {
  const html = fs.readFileSync(f, 'utf8');
  const url = '/' + path.relative(dist, f).split(path.sep).join('/').replace(/index\.html$/, '');
  const text = visible(html);

  // 1. The same integer written both with and without a thousands separator on
  //    one page. "1,990" beside "1990" is one of them being wrong for context.
  const grouped = new Set([...text.matchAll(/\b(\d{1,3}(?:,\d{3})+)\b/g)].map((m) => m[1]));
  for (const g of grouped) {
    const plain = g.replace(/,/g, '');
    // Require it as a standalone token, not as part of a longer number or a hex
    // string, and not inside a URL-like path segment.
    if (new RegExp('(?<![\\d,.\\-/])' + plain + '(?![\\d,.\\-/])').test(text)) {
      mixedFormat.push(`${url} — "${g}" and "${plain}" both appear`);
      break;
    }
  }

  // 2. A <title> that says the same phrase twice, which is what "Developer
  //    Tools — Free Online Developer Tools" was.
  const title = (html.match(/<title>([^<]*)<\/title>/) || [])[1] || '';
  const bare = title.replace(/\s*\|.*$/, '').toLowerCase();
  const words = bare.split(/[\s—–-]+/).filter((w) => w.length > 3);
  for (let n = 2; n <= 4; n++) {
    const seen = new Set();
    let dup = null;
    for (let i = 0; i + n <= words.length; i++) {
      const phrase = words.slice(i, i + n).join(' ');
      if (seen.has(phrase)) { dup = phrase; break; }
      seen.add(phrase);
    }
    if (dup) { titleRepeats.push(`${url} — title repeats "${dup}"`); break; }
  }
}

const line = (label, list) => {
  const mark = list.length ? '✗' : '✓';
  console.log(`  ${mark} ${label.padEnd(44)} ${list.length}`);
  for (const x of list.slice(0, 8)) console.log(`      ${x}`);
  if (list.length > 8) console.log(`      … and ${list.length - 8} more`);
};

console.log('');
line('the same number in two formats on one page', mixedFormat);
line('a title that repeats itself', titleRepeats);

const total = mixedFormat.length + titleRepeats.length;
console.log(total ? `\n✗ ${total} page(s) disagreeing with themselves\n` : '\n✓ no page contradicts itself in a way this can see\n');
process.exitCode = total ? 1 : 0;
