#!/usr/bin/env node
/**
 * The ASCII bell page rendered `printf "\\a"` where it meant `printf "\a"`.
 * The source held four backslashes, a template literal turned them into two,
 * and two is a literal backslash followed by an "a" — a command that prints
 * a backslash rather than ringing anything.
 *
 * This is the same escape trap that has bitten this project five times, showing
 * up on the published page rather than in a build script. A doubled backslash
 * before a letter is almost never what a reader is meant to type: `\n`, `\t`,
 * `\a` and `\0` are the escapes people copy, and `\\n` is the one that does not
 * work when they do.
 *
 * Genuine doubled backslashes exist — a Windows path, an escaped backslash in a
 * regex — so they are named rather than assumed away.
 */
import fs from 'node:fs';
import path from 'node:path';

const here = path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1'));
const dist = path.join(here, '..', 'dist');

// A doubled backslash immediately before one of the characters that forms a
// common escape sequence.
const DOUBLED = /\\\\[abfnrtv0]/g;

// Where a doubled backslash is the correct thing to show.
const INTENTIONAL = [
  /\\\\\\\\/,          // an escaped backslash being demonstrated as itself
];

const files = [];
(function walk(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p);
    else if (e.name === 'index.html') files.push(p);
  }
})(dist);

const hits = [];
for (const f of files) {
  const html = fs.readFileSync(f, 'utf8');
  // Scripts legitimately contain escaped sequences; only prose and code
  // samples a reader is meant to copy are in scope.
  const body = (html.split('</head>')[1] || '').replace(/<script[\s\S]*?<\/script>/g, ' ');
  for (const m of body.matchAll(DOUBLED)) {
    if (INTENTIONAL.some((re) => re.test(m[0]))) continue;
    hits.push({
      page: f.slice(dist.length).split(path.sep).join('/').replace(/index\.html$/, ''),
      value: m[0],
    });
  }
}

console.log(`\nChecked ${files.length} pages for escape sequences with one backslash too many\n`);

if (hits.length) {
  const seen = new Map();
  for (const h of hits) if (!seen.has(h.value + h.page)) seen.set(h.value + h.page, h);
  for (const h of [...seen.values()].slice(0, 12)) {
    console.log(`  ✗ ${h.value.padEnd(8)} ${h.page}`);
  }
  if (seen.size > 12) console.log(`  … and ${seen.size - 12} more`);
  console.log(`\n✗ ${hits.length} doubled escape(s) — a reader copying one gets a backslash, not the character`);
  process.exit(1);
}

console.log('✓ no escape sequence carries a spare backslash');
