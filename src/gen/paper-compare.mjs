import { esc, faq } from '../layout.mjs';

// Every pair of paper sizes close enough in area that someone might actually
// substitute one for the other. Comparing ARCH E1 with B10 would be noise, so
// the pair only exists when the larger area is at most this much bigger.
const MAX_AREA_RATIO = 1.5;

// "a A2" reads wrong: A2 is said "ay-two" and starts with a vowel sound, while
// B4 is "bee-four" and C5 is "see-five" and do not. The rule is about how the
// name is pronounced, not how it is spelled.
const an = (name) => `${/^[AEFHILMNORSX]/.test(name) ? 'an' : 'a'} ${name}`;

const MM_PER_IN = 25.4;
const IN = (mm) => mm / MM_PER_IN;
const r1 = (n) => Math.round(n * 10) / 10;
const r2 = (n) => Math.round(n * 100) / 100;

// name, id, width mm, height mm — kept in step with paper-sizes.mjs by the
// consistency check in scripts/paper-consistency.mjs.
import SIZES from '../data/paper-sizes-data.mjs';

// Compare sheets portrait-on-portrait: short edge against short edge. Nobody
// asks whether A4 fits in Letter with one of them turned sideways.
const portrait = (s) => ({
  ...s,
  w: Math.min(s.w, s.h),
  h: Math.max(s.w, s.h),
});

export default function paperCompare() {
  const pages = [];
  const all = SIZES.map(portrait);

  for (let i = 0; i < all.length; i++) {
    for (let j = i + 1; j < all.length; j++) {
      const A = all[i];
      const B = all[j];
      const areaA = A.w * A.h;
      const areaB = B.w * B.h;
      // Consecutive sizes in a series are exactly twice each other by
      // definition, so the area rule excluded every one of them — a2-vs-a3,
      // a3-vs-a4, a4-vs-a5. Those are the comparisons people actually make:
      // Google's own "people also ask" for "a2 size" leads with "Is A2 or A3
      // bigger?". The halving is the point of the series, not a reason to skip
      // the pair.
      const step = (t) => {
        const m = /^([ABC])(\d+)$/.exec(t.name);
        return m ? { series: m[1], n: Number(m[2]) } : null;
      };
      const sa = step(A);
      const sb = step(B);
      const consecutive = sa && sb && sa.series === sb.series && Math.abs(sa.n - sb.n) === 1;
      if (!consecutive && Math.max(areaA, areaB) / Math.min(areaA, areaB) > MAX_AREA_RATIO) continue;

      const slug = `${A.id}-vs-${B.id}`;
      const dw = r1(A.w - B.w); // positive when A is wider
      const dh = r1(A.h - B.h); // positive when A is taller
      const wider = A.w > B.w ? A : B;
      const taller = A.h > B.h ? A : B;
      const bigger = areaA > areaB ? A : B;
      const smaller = areaA > areaB ? B : A;
      const areaPct = r1((Math.max(areaA, areaB) / Math.min(areaA, areaB) - 1) * 100);

      // Does the smaller sheet's artwork drop onto the bigger one untouched?
      // Both edges have to fit — a sheet can be smaller in area yet wider.
      const aFitsB = A.w <= B.w && A.h <= B.h;
      const bFitsA = B.w <= A.w && B.h <= A.h;

      // Scaling A to fill B without distortion is limited by the tighter edge.
      const scaleAtoB = Math.min(B.w / A.w, B.h / A.h);
      const scaleBtoA = Math.min(A.w / B.w, A.h / B.h);
      // After scaling A into B, the leftover on the other edge is the margin.
      const marginW = r1(B.w - A.w * scaleAtoB);
      const marginH = r1(B.h - A.h * scaleAtoB);

      const ratioA = r2(A.h / A.w);
      const ratioB = r2(B.h / B.w);
      const sameShape = Math.abs(ratioA - ratioB) < 0.01;

      // Assert what the page claims. Each of these statements is generated
      // from arithmetic above and then printed as fact, so check the fact.
      if (aFitsB && !(A.w <= B.w && A.h <= B.h)) {
        console.error(`\n✗ ${slug}: claims ${A.name} fits inside ${B.name} but an edge overruns`);
        process.exitCode = 1;
      }
      if (aFitsB && bFitsA && !(A.w === B.w && A.h === B.h)) {
        console.error(`\n✗ ${slug}: claims each fits inside the other but they are not identical`);
        process.exitCode = 1;
      }
      {
        const recomputed = r1((Math.max(areaA, areaB) / Math.min(areaA, areaB) - 1) * 100);
        if (recomputed !== areaPct) {
          console.error(`\n✗ ${slug}: area difference ${areaPct}% does not survive recomputation (${recomputed}%)`);
          process.exitCode = 1;
        }
      }
      {
        // The scaled sheet must genuinely land inside the target, to within
        // floating-point slack — this is the number readers set in a print
        // dialog, so a wrong one wastes their paper.
        const sw = A.w * scaleAtoB;
        const sh = A.h * scaleAtoB;
        if (sw > B.w + 1e-9 || sh > B.h + 1e-9) {
          console.error(`\n✗ ${slug}: scaling ${A.name} by ${scaleAtoB} does not fit it inside ${B.name}`);
          process.exitCode = 1;
        }
        if (marginW < -1e-9 || marginH < -1e-9) {
          console.error(`\n✗ ${slug}: negative margin after scaling (${marginW} × ${marginH})`);
          process.exitCode = 1;
        }
      }
      if (wider.w < Math.max(A.w, B.w) || taller.h < Math.max(A.h, B.h)) {
        console.error(`
✗ ${slug}: names ${wider.name} as wider and ${taller.name} as taller, but the dimensions say otherwise`);
        process.exitCode = 1;
      }
      if (bigger === smaller) {
        console.error(`\n✗ ${slug}: the larger and smaller sheet resolved to the same size`);
        process.exitCode = 1;
      }

      const pctA = Math.round(scaleAtoB * 1000) / 10;
      const pctB = Math.round(scaleBtoA * 1000) / 10;

      const widerLine = dw === 0
        ? `Both sheets are exactly ${A.w} mm wide.`
        : dw > 0
          ? `${A.name} is <strong>${Math.abs(dw)} mm wider</strong> than ${B.name}.`
          : `${B.name} is <strong>${Math.abs(dw)} mm wider</strong> than ${A.name}.`;
      const tallerLine = dh === 0
        ? `Both are exactly ${A.h} mm tall.`
        : dh > 0
          ? `${A.name} is <strong>${Math.abs(dh)} mm taller</strong>.`
          : `${B.name} is <strong>${Math.abs(dh)} mm taller</strong>.`;

      const fitLine = aFitsB && bFitsA
        ? `The two are the same size, so either sheet drops onto the other untouched.`
        : aFitsB
          ? `A ${A.name} page fits inside ${B.name} whole — print it at 100% and you get a ${r1((B.w - A.w) / 2)} mm border down each side and ${r1((B.h - A.h) / 2)} mm top and bottom.`
          : bFitsA
            ? `A ${B.name} page fits inside ${A.name} whole — print it at 100% and you get a ${r1((A.w - B.w) / 2)} mm border down each side and ${r1((A.h - B.h) / 2)} mm top and bottom.`
            : `Neither sheet fits inside the other at full size: ${wider.name} is the wider of the two while ${taller.name} is the taller, so each overruns the other on one edge. Whichever way you go, something has to scale or crop.`;

      const shapeLine = sameShape
        ? `Both sheets have the same 1:${ratioA} proportions, so artwork scales between them without any cropping or extra margin — only the size changes.`
        : `The proportions differ: ${A.name} is 1:${ratioA} and ${B.name} is 1:${ratioB}. That difference is why a layout moved between them never quite lines up — scale it to fit one edge and the other is left with ${marginW > marginH ? `${marginW} mm` : `${marginH} mm`} of unwanted margin.`;

      const FAQ = faq([
        {
          q: `What is the difference between ${A.name} and ${B.name}?`,
          a: `${A.name} is ${A.w} × ${A.h} mm and ${B.name} is ${B.w} × ${B.h} mm. ${bigger.name} is the larger of the two by <strong>${areaPct}% in area</strong>.`,
        },
        {
          q: `Can I print ${A.name} on ${B.name}?`,
          a: aFitsB
            ? `Yes, at 100% — ${A.name} is smaller on both edges, so it lands inside ${B.name} with a border all round.`
            : `Not at full size. Scale it to <strong>${pctA}%</strong> and it fits inside ${B.name} with ${marginW} × ${marginH} mm to spare.`,
        },
        {
          q: `Which is bigger, ${A.name} or ${B.name}?`,
          a: `<strong>${bigger.name}</strong> — ${bigger.w} × ${bigger.h} mm against ${smaller.w} × ${smaller.h} mm, which is ${areaPct}% more area.`,
        },
      ]);

      // "Business Card (US) vs Business Card (EU)" says "business card" twice.
      // When both names open with the same words, state them once.
      const wa = A.name.split(' ');
      const wb = B.name.split(' ');
      let shared = 0;
      while (shared < wa.length - 1 && shared < wb.length - 1 && wa[shared] === wb[shared]) shared++;
      const strip = (w) => w.join(' ').replace(/^\((.*)\)$/, '$1');
      const pairLabel = shared > 0
        ? `${wa.slice(0, shared).join(' ')}: ${strip(wa.slice(shared))} vs ${strip(wb.slice(shared))}`
        : `${A.name} vs ${B.name}`;

      const title = (() => {
        const base = pairLabel;
        const full = `${base} — Size Difference in mm and Inches`;
        const mid = `${base} — Size Difference`;
        return full.length <= 65 ? full : mid.length <= 65 ? mid : base;
      })();

      pages.push({
        path: `/paper/compare/${slug}/`,
        pairOf: [A.id, B.id],
        title,
        desc: `${A.name} is ${A.w} × ${A.h} mm (${r2(IN(A.w))} × ${r2(IN(A.h))} in) and ${B.name} is ${B.w} × ${B.h} mm (${r2(IN(B.w))} × ${r2(IN(B.h))} in). ${bigger.name} is ${areaPct}% larger by area. Print scale, margins and which fits inside which.`,
        h1: `${A.name} vs ${B.name}`,
        crumbs: [
          { name: 'Paper sizes', path: '/paper/' },
          { name: `${A.name} vs ${B.name}`, path: `/paper/compare/${slug}/` },
        ],
        jsonld: [FAQ.schema],
        body: `<table><thead><tr><th></th><th>${esc(A.name)}</th><th>${esc(B.name)}</th></tr></thead><tbody>
<tr><td>Millimetres</td><td>${A.w} × ${A.h}</td><td>${B.w} × ${B.h}</td></tr>
<tr><td>Inches</td><td>${r2(IN(A.w))} × ${r2(IN(A.h))}</td><td>${r2(IN(B.w))} × ${r2(IN(B.h))}</td></tr>
<tr><td>Centimetres</td><td>${r1(A.w / 10)} × ${r1(A.h / 10)}</td><td>${r1(B.w / 10)} × ${r1(B.h / 10)}</td></tr>
<tr><td>Aspect ratio</td><td>1:${ratioA}</td><td>1:${ratioB}</td></tr>
<tr><td>Area</td><td>${r1(areaA / 100)} cm²</td><td>${r1(areaB / 100)} cm²</td></tr>
</tbody></table>

<h2>Which is bigger</h2>
${consecutive ? `<p><strong>${A.name} and ${B.name} are one step apart in the ${sa.series} series, so one is exactly twice the other.</strong> Two ${smaller.name} sheets side by side make ${an(bigger.name)}, and folding ${an(bigger.name)} in half across its long edge gives two ${smaller.name}. That is what the series is for, and it is why the scale factors below come out at 70.7% and 141.4% — one over the square root of two, and the square root of two.</p>` : ''}
<p><strong>${bigger.name}</strong>, by ${areaPct}% in area. ${widerLine} ${tallerLine}</p>

<h2>Printing one on the other</h2>
<p>${fitLine}</p>
<table><thead><tr><th>You want</th><th>Set the print scale to</th><th>Leaves</th></tr></thead><tbody>
<tr><td>${esc(A.name)} artwork on ${esc(B.name)} paper</td><td>${pctA}%</td><td>${marginW} × ${marginH} mm margin</td></tr>
<tr><td>${esc(B.name)} artwork on ${esc(A.name)} paper</td><td>${pctB}%</td><td>${r1(A.w - B.w * scaleBtoA)} × ${r1(A.h - B.h * scaleBtoA)} mm margin</td></tr>
</tbody></table>
<p class="muted">These are the numbers for the "custom scale" box in a print dialog. "Fit to page" computes the same thing, but knowing the figure tells you in advance whether the result will look deliberate or accidental.</p>

<h2>Why the shapes matter</h2>
<p>${shapeLine}</p>

${FAQ.html}

%RELATED%<p><a href="/paper/${A.id}/">${esc(A.name)} in full</a> · <a href="/paper/${B.id}/">${esc(B.name)} in full</a> · <a href="/paper/compare/">All size comparisons</a> · <a href="/paper/">All paper sizes</a></p>`,
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

  const links = pages
    .map((p) => `<li><a href="${p.path}">${esc(p.h1)}</a></li>`)
    .join('\n');

  pages.push({
    path: '/paper/compare/',
    title: 'Paper Size Comparisons — A4 vs Letter and Every Other Pair',
    desc: `Side-by-side comparisons of ${pages.length} pairs of paper sizes: the difference in millimetres and inches, which is larger by area, and the print scale that fits one on the other.`,
    h1: 'Paper size comparisons',
    crumbs: [
      { name: 'Paper sizes', path: '/paper/' },
      { name: 'Comparisons', path: '/paper/compare/' },
    ],
    body: `<p>Two sheets only get a comparison here when they are close enough in area to be genuine alternatives — within ${Math.round((MAX_AREA_RATIO - 1) * 100)}% of each other. Comparing a wall poster with a postage stamp tells you nothing you did not already know.</p>
<p>Each page gives the difference on both edges, the area gap as a percentage, and the print scale that puts one sheet's artwork onto the other.</p>
<h2>All ${pages.length} comparisons</h2>
<ul class="cols">
${links}
</ul>
<p><a href="/paper/">All paper sizes</a></p>`,
  });

  return pages;
}
