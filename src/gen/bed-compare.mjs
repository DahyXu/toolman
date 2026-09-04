import { esc, faq } from '../layout.mjs';
import { BED_ROWS as ROWS, BED_SHORT as SHORT } from './bed-sizes.mjs';

// Two mattresses are worth comparing when someone might actually be choosing
// between them, which happens in two situations and no others:
//
//   1. They are sold in the same country. "Queen or King?" is the question
//      every mattress shop gets, and it has a real answer.
//   2. They share a name across countries, or are close enough in size to be
//      mistaken for each other. A UK King and a US King are 43 cm apart and
//      the name gives no warning — that collision is the reason this section
//      exists at all.
//
// Everything else — a US crib against an Emperor — is filler.
const CONFUSABLE = 0.08;

const IN = 25.4;
const cm1 = (mm) => Math.round(mm) / 10;
const inch1 = (mm) => Math.round((mm / IN) * 10) / 10;
const r1 = (n) => Math.round(n * 10) / 10;
// Square millimetres to square metres, rounded once. Dividing twice leaves
// 3.9200000000000004 on the page.
const m2 = (mm2) => Math.round(mm2 / 1e4) / 100;

// A fitted sheet has some give, but not much. Under 3 cm on both edges and the
// same bedding genuinely works; past 8 cm it does not, whatever the label says.
// "The UK equivalent of a US King" came out as Emperor, which is numerically
// nearest at 200 cm and useless as an answer: it is a specialist size most
// British retailers do not stock. An equivalent someone cannot walk in and buy
// is not an equivalent.
const NOT_STOCKED = new Set(['emperor-uk']);

const SNUG_MM = 30;
const LOOSE_MM = 80;

const beddingVerdict = (dw, dh) => {
  const worst = Math.max(Math.abs(dw), Math.abs(dh));
  if (worst <= SNUG_MM) return 'same';
  if (worst <= LOOSE_MM) return 'marginal';
  return 'no';
};

export default function bedCompare() {
  const pages = [];

  // "King" belongs to two countries. Where a name is not unique, say whose.
  const nameCount = {};
  for (const r of ROWS) {
    const base = r.name.replace(/ \/ .*/, '').toLowerCase();
    nameCount[base] = (nameCount[base] || 0) + 1;
  }
  const label = (r) => {
    const base = r.name.replace(/ \/ .*/, '');
    return nameCount[base.toLowerCase()] > 1 ? `${SHORT[r.region]} ${base}` : base;
  };

  const words = (r) => new Set(r.name.toLowerCase().split(/[^a-z]+/).filter((w) => w.length > 3));

  for (let i = 0; i < ROWS.length; i++) {
    for (let j = i + 1; j < ROWS.length; j++) {
      const A = ROWS[i];
      const B = ROWS[j];

      const sameRegion = A.region === B.region;
      const sharedWord = [...words(A)].some((w) => words(B).has(w));
      const closeW = Math.abs(A.wmm - B.wmm) / Math.max(A.wmm, B.wmm) <= CONFUSABLE;
      const closeH = Math.abs(A.hmm - B.hmm) / Math.max(A.hmm, B.hmm) <= CONFUSABLE;
      // Within a country, "which of these two" is only a real question between
      // beds of comparable size. A crib against a California King is a pair the
      // arithmetic can produce and nobody would search for, and pages like that
      // are what push a section's siblings together.
      const areaRatio = Math.max(A.wmm * A.hmm, B.wmm * B.hmm) / Math.min(A.wmm * A.hmm, B.wmm * B.hmm);
      if (sameRegion && areaRatio > 1.9) continue;
      if (!sameRegion && !sharedWord && !(closeW && closeH)) continue;

      const LA = label(A);
      const LB = label(B);
      const slug = `${A.id}-vs-${B.id}`;

      const dw = A.wmm - B.wmm;
      const dh = A.hmm - B.hmm;
      const wider = A.wmm > B.wmm ? A : B;
      const longer = A.hmm > B.hmm ? A : B;
      const areaA = A.wmm * A.hmm;
      const areaB = B.wmm * B.hmm;
      const bigger = areaA > areaB ? A : B;
      const smaller = areaA > areaB ? B : A;
      const areaPct = r1((Math.max(areaA, areaB) / Math.min(areaA, areaB) - 1) * 100);
      const verdict = beddingVerdict(dw, dh);

      // Half the width each is the number that decides whether two adults sleep
      // well, and the one no retailer prints. Whole centimetres: at one decimal
      // the halves stop doubling back to the
      // printed width - 71.1 cm wide, 35.6 cm each - and a reader can see it.
      // Half a centimetre of shoulder room is not a real distinction anyway.
      const perA = Math.round(A.wmm / 20);
      const perB = Math.round(B.wmm / 20);

      // Assert what the page claims.
      if (wider.wmm < Math.max(A.wmm, B.wmm) || longer.hmm < Math.max(A.hmm, B.hmm)) {
        console.error(`\n✗ bed ${slug}: names ${label(wider)} as wider and ${label(longer)} as longer, against the dimensions`);
        process.exitCode = 1;
      }
      if (verdict === 'same' && (Math.abs(dw) > SNUG_MM || Math.abs(dh) > SNUG_MM)) {
        console.error(`\n✗ bed ${slug}: says bedding is interchangeable across a ${r1(Math.abs(dw) / 10)} × ${r1(Math.abs(dh) / 10)} cm gap`);
        process.exitCode = 1;
      }
      if (verdict === 'no' && Math.abs(dw) <= LOOSE_MM && Math.abs(dh) <= LOOSE_MM) {
        console.error(`\n✗ bed ${slug}: rules out shared bedding for beds within ${LOOSE_MM / 10} cm on both edges`);
        process.exitCode = 1;
      }
      if (Math.abs(perA * 2 - cm1(A.wmm)) > 1) {
        console.error(`\n✗ bed ${slug}: per-person width ${perA} cm does not double back to ${cm1(A.wmm)} cm`);
        process.exitCode = 1;
      }
      if (areaA === areaB && bigger !== smaller && areaPct !== 0) {
        console.error(`\n✗ bed ${slug}: equal areas reported as a ${areaPct}% difference`);
        process.exitCode = 1;
      }

      const sizeLine = dw === 0 && dh === 0
        ? `${LA} and ${LB} are the same mattress under two names: ${cm1(A.wmm)} × ${cm1(A.hmm)} cm both.`
        : `${label(bigger)} is the larger by ${areaPct}% in area. ${
            dw === 0
              ? `Both are ${cm1(A.wmm)} cm wide`
              : `${label(wider)} is ${r1(Math.abs(dw) / 10)} cm wider`
          }, and ${
            dh === 0
              ? `both are ${cm1(A.hmm)} cm long`
              : `${label(longer)} is ${r1(Math.abs(dh) / 10)} cm longer`
          }.`;

      const beddingLine = {
        same: `<strong>Yes.</strong> The two differ by at most ${r1(Math.max(Math.abs(dw), Math.abs(dh)) / 10)} cm on any edge, which is inside the give of a fitted sheet. Bedding sold for one will sit correctly on the other.`,
        marginal: `<strong>The bedding will go on, but not well.</strong> The gap is ${r1(Math.abs(dw) / 10)} cm in width and ${r1(Math.abs(dh) / 10)} cm in length. A fitted sheet will strain on ${label(bigger)} and wrinkle on ${label(smaller)}; flat sheets and duvet covers are more forgiving.`,
        no: `<strong>No.</strong> ${
          Math.abs(dw) > LOOSE_MM && Math.abs(dh) > LOOSE_MM
            ? `${r1(Math.abs(dw) / 10)} cm of width and ${r1(Math.abs(dh) / 10)} cm of length are`
            : Math.abs(dw) > LOOSE_MM
              ? `${r1(Math.abs(dw) / 10)} cm of width is`
              : `${r1(Math.abs(dh) / 10)} cm of length is`
        } far outside what a fitted sheet absorbs. Buy for the size you own and read the centimetres, not the label.`,
      }[verdict];

      // One clause, not a paragraph. The long version of this was the same on
      // every cross-market page and pushed the section over the duplicate
      // threshold on its own.
      // Two pages comparing a US King against two different British beds were
      // the closest pair in the section — same numbers on one side, same
      // reasoning on the other. What actually separates them is the answer to
      // the question the reader arrived with: what *is* the equivalent here.
      // Naming the nearest bed in the other market differs per page and is the
      // sentence they came for.
      const nearestIn = (region, target) => {
        const found = ROWS.filter((r) => r.region === region && !NOT_STOCKED.has(r.id))
          .sort((x, y) => Math.abs(x.wmm - target.wmm) - Math.abs(y.wmm - target.wmm))[0];
        if (!found || NOT_STOCKED.has(found.id)) {
          console.error(`
✗ bed ${slug}: no stocked ${region} size to offer as the equivalent of ${LA}`);
          process.exitCode = 1;
        }
        return found;
      };
      const regionLine = A.region !== B.region
        ? (() => {
            const near = nearestIn(B.region, A);
            const gap = r1(Math.abs(near.wmm - A.wmm) / 10);
            return `<p>Different markets, so this is a translation rather than a choice. The ${SHORT[B.region]} bed closest in width to ${LA} is <a href="/bed-size/${near.id}/">${label(near)}</a> at ${cm1(near.wmm)} cm${
              near.id === B.id
                ? ` — this comparison is the nearest equivalent there is, and it is still ${gap} cm out.`
                : `, not ${LB}. If a guide written for ${SHORT[A.region] === 'US' ? 'North America' : SHORT[A.region] === 'UK' ? 'Britain' : 'Europe'} recommends ${LA}, ${label(near)} is the size it means.`
            }</p>`;
          })()
        : '';

      const twoPerson = A.wmm >= 1300 && B.wmm >= 1300
        ? `<h2>Space per person</h2>
<p>Shared between two adults, ${LA} gives each sleeper <strong>${perA} cm</strong> and ${LB} gives <strong>${perB} cm</strong>. For comparison, a single bed is ${cm1(ROWS.find((r) => r.id === 'single-uk').wmm)} cm wide, so anything under that is less room each than a single bed gives one person.</p>`
        : '';

      // Which to buy depends on how the two differ, not on how much. A bed that
      // is only longer answers a different question from one that is only wider.
      const sameW = dw === 0;
      const sameH = dh === 0;
      const choose = sameW && sameH
        ? `There is nothing to choose: these are one mattress under two names. Buy whichever is cheaper or easier to find bedding for.`
        : sameW
          ? `Same width, ${r1(Math.abs(dh) / 10)} cm apart in length. This is a question about height, not about sharing: ${label(longer)} is the one to buy if anyone sleeping in it is over about 180 cm, and it buys no extra shoulder room at all.`
          : sameH
            ? `Same length, ${r1(Math.abs(dw) / 10)} cm apart in width — ${Math.abs(perA - perB)} cm per sleeper. Nobody gets to stretch out further; the whole difference is elbow room, which matters if two people share it and not at all if one does.`
            : wider === longer
              ? `${label(wider)} is bigger on both edges, ${r1(Math.abs(dw) / 10)} cm wider and ${r1(Math.abs(dh) / 10)} cm longer. It is the straightforward upgrade, and the ${r1(Math.abs(dw) / 10)} cm of width is also ${r1(Math.abs(dw) / 10)} cm of floor you no longer have.`
              : `A trade rather than an upgrade: ${label(wider)} is ${r1(Math.abs(dw) / 10)} cm wider, ${label(longer)} is ${r1(Math.abs(dh) / 10)} cm longer. Width if two people share it, length if one of them is tall — you cannot have both without leaving this pair.`;

      const FAQ = faq([
        {
          q: `What is the difference between ${LA} and ${LB}?`,
          a: `${LA} is ${cm1(A.wmm)} × ${cm1(A.hmm)} cm (${inch1(A.wmm)} × ${inch1(A.hmm)} in) and ${LB} is ${cm1(B.wmm)} × ${cm1(B.hmm)} cm (${inch1(B.wmm)} × ${inch1(B.hmm)} in). ${sizeLine}`,
        },
        {
          q: `Will ${LA} bedding fit ${LB}?`,
          a: beddingLine,
        },
        A.region !== B.region
          ? {
              q: `What is the ${SHORT[B.region]} equivalent of ${LA}?`,
              a: (() => {
                const near = nearestIn(B.region, A);
                return near.id === B.id
                  ? `<a href="/bed-size/${near.id}/">${label(near)}</a> is the closest ${SHORT[B.region]} size, and it is still ${r1(Math.abs(near.wmm - A.wmm) / 10)} cm out in width. There is no exact match.`
                  : `<a href="/bed-size/${near.id}/">${label(near)}</a> at ${cm1(near.wmm)} cm, not ${LB}. The names line up; the mattresses do not.`;
              })(),
            }
          : {
              q: `Which is bigger, ${LA} or ${LB}?`,
              a: dw === 0 && dh === 0
                ? `Neither — they are the same size.`
                : `<strong>${label(bigger)}</strong>, by ${areaPct}% in area.`,
            },
      ]);

      const base = `${LA} vs ${LB}`;
      const title = (() => {
        const full = `${base} — Size Difference and Which Bedding Fits`;
        const mid = `${base} — Mattress Size Difference`;
        return full.length <= 65 ? full : mid.length <= 65 ? mid : base;
      })();

      pages.push({
        path: `/bed-size/compare/${slug}/`,
        pairOf: [A.id, B.id],
        title,
        desc: `${LA} is ${cm1(A.wmm)} × ${cm1(A.hmm)} cm and ${LB} is ${cm1(B.wmm)} × ${cm1(B.hmm)} cm. ${label(bigger)} is ${areaPct}% larger. Whether the same bedding fits both, space per person, and the room each needs.`,
        h1: base,
        crumbs: [
          { name: 'Bed sizes', path: '/bed-size/' },
          { name: base, path: `/bed-size/compare/${slug}/` },
        ],
        jsonld: [FAQ.schema],
        body: `<table><thead><tr><th></th><th>${esc(LA)}</th><th>${esc(LB)}</th></tr></thead><tbody>
<tr><td>Centimetres</td><td>${cm1(A.wmm)} × ${cm1(A.hmm)}</td><td>${cm1(B.wmm)} × ${cm1(B.hmm)}</td></tr>
<tr><td>Inches</td><td>${inch1(A.wmm)} × ${inch1(A.hmm)}</td><td>${inch1(B.wmm)} × ${inch1(B.hmm)}</td></tr>
<tr><td>Area</td><td>${m2(areaA)} m²</td><td>${m2(areaB)} m²</td></tr>
<tr><td>Sold in</td><td>${esc(SHORT[A.region])}</td><td>${esc(SHORT[B.region])}</td></tr>
</tbody></table>

<h2>Which is bigger</h2>
<p>${sizeLine}</p>
${regionLine}

<h2>Which one to buy</h2>
<p>${choose}</p>

<h2>Does the same bedding fit both?</h2>
<p>${beddingLine}</p>
${twoPerson}

<h2>Room each one needs</h2>
<p>With 60 cm to walk down each side and 60 cm at the foot: <strong>${cm1(A.wmm + 1200)} × ${cm1(A.hmm + 600)} cm</strong> for ${LA}, <strong>${cm1(B.wmm + 1200)} × ${cm1(B.hmm + 600)} cm</strong> for ${LB} — a difference of ${r1(Math.abs(dw) / 10)} cm in the room, not just the bed. Against a wall on one side, take 60 cm off.</p>

${FAQ.html}

%RELATED%<p><a href="/bed-size/${A.id}/">${esc(LA)} in full</a> · <a href="/bed-size/${B.id}/">${esc(LB)} in full</a> · <a href="/bed-size/compare/">All mattress comparisons</a> · <a href="/bed-size/">All bed sizes</a></p>`,
      });
    }
  }


  // Each page links the other pairs that share one of its two items. Done here
  // rather than inside the loop because a page built early cannot know about
  // pairs the loop has not reached. Without this every comparison had exactly
  // one inbound link, from its own hub, which puts it last in the crawl queue.
  const index = pages.filter((p) => p.pairOf);
  for (const p of index) {
    const [x, y] = p.pairOf;
    // Taking the first twenty every time gave two pages that share a side
    // almost the same list, which pushed the bakeware comparisons to 92%
    // vocabulary overlap. Rotating the start by this page's own position keeps
    // the links relevant and stops neighbours reading as copies.
    const pool = index.filter((q) => q !== p && (q.pairOf.includes(x) || q.pairOf.includes(y)));
    const off = index.indexOf(p) % Math.max(1, pool.length);
    const near = pool.length <= 12
      ? pool
      : Array.from({ length: 12 }, (_, k) => pool[(off + k) % pool.length]);
    const block = near.length
      ? `<h2>Related comparisons</h2>\n<ul class="linklist">\n${near.map((q) => `<li><a href="${q.path}">${esc(q.h1)}</a></li>`).join('')}\n</ul>\n\n`
      : '';
    p.body = p.body.replace('%RELATED%', block);
  }
  for (const p of pages) p.body = p.body.replace('%RELATED%', '');

  const links = pages.map((p) => `<li><a href="${p.path}">${esc(p.h1)}</a></li>`).join('\n');

  pages.push({
    path: '/bed-size/compare/',
    title: 'Mattress Size Comparisons — Queen vs King and Every Other Pair',
    desc: `Side-by-side comparisons of ${pages.length} pairs of mattress sizes: the difference in centimetres and inches, space per person, the room each needs, and whether the same bedding fits both.`,
    h1: 'Mattress size comparisons',
    crumbs: [
      { name: 'Bed sizes', path: '/bed-size/' },
      { name: 'Comparisons', path: '/bed-size/compare/' },
    ],
    body: `<p>Two mattresses get a comparison here when someone might genuinely be choosing between them: they are sold in the same country, or they share a name across countries and are not the same size. That second case is the expensive one — a UK King and a US King are 43 cm apart and nothing in the name says so.</p>
<p>Each page gives the difference on both edges, the width each sleeper gets, the room the bed needs, and whether bedding bought for one will fit the other.</p>
<h2>All ${pages.length} comparisons</h2>
<ul class="cols">
${links}
</ul>
<p><a href="/bed-size/">All bed sizes</a></p>`,
  });

  return pages;
}
