#!/usr/bin/env node
/**
 * Find form controls with no accessible name, and headings that skip a level.
 *
 * A control with no name is announced by a screen reader as just "combo box"
 * or "edit text", which makes the tool unusable without sight. Lighthouse
 * flags both of these, and they are cheap to fix.
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

const unnamed = [];
const skipped = [];
const noAlt = [];

for (const f of walk(dist)) {
  const html = fs.readFileSync(f, 'utf8');
  const url = '/' + path.relative(dist, f).replace(/\\/g, '/').replace(/index\.html$/, '');

  // Only look at the page body, and ignore script bodies.
  const body = (html.split('</head>')[1] || '').replace(/<script[\s\S]*?<\/script>/g, '');

  // ids that a <label for="..."> points at
  const labelled = new Set([...body.matchAll(/<label[^>]*\bfor="([^"]+)"/g)].map((m) => m[1]));
  // controls wrapped directly inside a <label> get their name from it
  const wrapped = new Set();
  for (const m of body.matchAll(/<label\b[^>]*>([\s\S]*?)<\/label>/g)) {
    for (const c of m[1].matchAll(/\bid="([^"]+)"/g)) wrapped.add(c[1]);
  }

  for (const m of body.matchAll(/<(input|select|textarea)\b([^>]*)>/g)) {
    const [, tag, attrs] = m;
    if (/\btype="(hidden|submit|button)"/.test(attrs)) continue;
    const id = (attrs.match(/\bid="([^"]+)"/) || [])[1];
    const hasAria = /\baria-label(?:ledby)?=/.test(attrs);
    const hasTitle = /\btitle="/.test(attrs);
    // a placeholder is not an accessible name, but flag separately-named ones
    if (hasAria || hasTitle) continue;
    if (id && (labelled.has(id) || wrapped.has(id))) continue;
    if (!id && wrapped.size) continue; // unlabelled but wrapped anonymously
    unnamed.push(`${url} — <${tag}${id ? ' id="' + id + '"' : ''}>`);
  }

  // buttons need text content or an aria-label
  for (const m of body.matchAll(/<button\b([^>]*)>([\s\S]*?)<\/button>/g)) {
    const [, attrs, inner] = m;
    if (/\baria-label=/.test(attrs)) continue;
    if (inner.replace(/<[^>]+>/g, '').trim()) continue;
    unnamed.push(`${url} — <button> with no text or aria-label`);
  }

  // images need alt (decorative ones need alt="")
  for (const m of body.matchAll(/<img\b([^>]*)>/g)) {
    if (!/\balt=/.test(m[1])) noAlt.push(`${url} — <img> without alt`);
  }

  // heading order
  const levels = [...body.matchAll(/<h([1-6])\b/g)].map((m) => +m[1]);
  for (let i = 1; i < levels.length; i++) {
    if (levels[i] > levels[i - 1] + 1) {
      skipped.push(`${url} — h${levels[i - 1]} followed by h${levels[i]}`);
      break;
    }
  }
}

// Group by the page's first path segment: the generators repeat the same
// markup thousands of times, so one line per distinct problem is what matters.
const report = (label, arr) => {
  console.log(`${arr.length ? '✗' : '✓'} ${label.padEnd(34)} ${arr.length}`);
  const seen = new Map();
  for (const x of arr) {
    const [url, detail] = x.split(' — ');
    const section = url.split('/').filter(Boolean)[0] || '(home)';
    const key = `${section} ${detail}`;
    seen.set(key, (seen.get(key) || 0) + 1);
  }
  for (const [key, n] of [...seen.entries()].sort((a, b) => b[1] - a[1])) {
    console.log(`    ${String(n).padStart(5)} × ${key}`);
  }
};

console.log('');
report('controls with no accessible name', unnamed);
report('images without alt', noAlt);
report('skipped heading levels', skipped);
console.log(`\n${unnamed.length + noAlt.length + skipped.length === 0 ? '✓ no accessibility problems found' : ''}\n`);
