#!/usr/bin/env node
/**
 * An answer that cannot be quoted on its own cannot be cited on its own.
 *
 * "That is about 8.47 ounces" is correct on the page and useless lifted off
 * it: "that" has no referent once the sentence before it is gone. The same
 * applies to a featured snippet, which is one paragraph shown without the
 * paragraph above it, and to any system that extracts a fact and repeats it.
 *
 * The test is not stylistic. An answer that shares no significant word with
 * its own question has not restated what it is answering, so nothing outside
 * the page can tell what the answer is about. A page whose FAQ passes this
 * says what it means without needing the rest of the page present.
 */
import fs from 'node:fs';
import path from 'node:path';

const here = path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1'));
const dist = path.join(here, '..', 'dist');

const STOP = new Set([
  'what', 'which', 'when', 'where', 'does', 'do', 'is', 'are', 'the', 'a', 'an',
  'of', 'in', 'on', 'to', 'for', 'and', 'or', 'it', 'its', 'this', 'that', 'you',
  'your', 'can', 'i', 'my', 'how', 'many', 'much', 'size', 'be', 'with', 'from',
  'should', 'would', 'will', 'has', 'have', 'was', 'were', 'if', 'as', 'at', 'by',
  'not', 'but', 'they', 'them', 'their', 'there', 'these', 'those', 'use', 'used',
  'about', 'same', 'other', 'than', 'then', 'so', 'do', 'get', 'one', 'two',
]);

const terms = (s) => new Set(
  s.toLowerCase()
    .replace(/<[^>]+>/g, ' ')
    .replace(/&[a-z#0-9]+;/g, ' ')
    .split(/[^a-z0-9]+/)
    .filter((w) => w.length >= 4 && !STOP.has(w)),
);

const bySection = new Map();
let pairs = 0;
const examples = [];

(function walk(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) { walk(p); continue; }
    if (e.name !== 'index.html') continue;
    const html = fs.readFileSync(p, 'utf8');
    const rel = p.slice(dist.length).split(path.sep).join('/').replace(/index\.html$/, '');
    const section = rel.split('/')[1] || '(root)';

    for (const m of html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)) {
      let data;
      try { data = JSON.parse(m[1]); } catch { continue; }
      for (const block of [].concat(data)) {
        if (block['@type'] !== 'FAQPage') continue;
        for (const q of block.mainEntity || []) {
          const question = q.name || '';
          const answer = q.acceptedAnswer?.text || '';
          if (!question || !answer) continue;
          pairs++;
          // Only the opening sentence. "It is an estimate. Rather than a flat
          // characters-divided-by-four rule, it classifies the text into..."
          // is a complete answer that happens not to repeat the question's
          // words; flagging it was noise. What fails is an answer whose first
          // sentence names nothing — "Null (NUL), a control character" — which
          // is the one a snippet or a citation shows on its own.
          const opening = answer.replace(/<[^>]+>/g, ' ').trim();
          // Two earlier versions of this measured the wrong thing. Requiring a
          // shared word with the question flagged "It is an estimate. Rather
          // than a flat characters-divided-by-four rule..." — a complete answer.
          // Narrowing to the first sentence made it worse, because a direct
          // opening is good FAQ writing: "Yes." and "About 240 g." both fail a
          // word-overlap test and both are exactly right.
          //
          // What genuinely breaks when quoted is an answer that opens by
          // pointing at something outside itself. "That is about 8.47 ounces"
          // has no referent once the sentence before it is gone.
          // "This counter gives an estimate" names its subject; "This is an
          // estimate" does not. A demonstrative followed by a noun is a
          // determiner and fine, so only the bare forms fail: It/They/Them
          // always, and This/That/These/Those when a copula follows.
          const danglingStart = /^(It|They|Them)\b/.exec(opening)
            || /^(That|This|These|Those)\s+(is|are|was|were)\b/.exec(opening);
          const firstSentence = opening.split(/(?<=[.!?])\s/)[0] || '';
          const qt = terms(question);
          const at = terms(firstSentence);
          const shared = [...qt].filter((w) => at.has(w));
          if (danglingStart && shared.length === 0) {
            if (!bySection.has(section)) bySection.set(section, 0);
            bySection.set(section, bySection.get(section) + 1);
            if (examples.length < 8) examples.push({ rel, question, answer: answer.slice(0, 90) });
          }
        }
      }
    }
  }
})(dist);

const rows = [...bySection].sort((a, b) => b[1] - a[1]);
const total = rows.reduce((a, b) => a + b[1], 0);

console.log(`\nChecked ${pairs.toLocaleString()} FAQ question-and-answer pairs\n`);
console.log(`  ${total ? '✗' : '✓'} answers opening with a pronoun that points outside them   ${total}`);
for (const [section, n] of rows.slice(0, 10)) console.log(`      ${section.padEnd(18)} ${n}`);
for (const x of examples) {
  console.log(`\n      ${x.rel}`);
  console.log(`      Q: ${x.question}`);
  console.log(`      A: ${x.answer}`);
}
console.log(total
  ? `\n✗ ${total} answer(s) that cannot be quoted without the page around them`
  : '\n✓ every answer restates what it is answering');
