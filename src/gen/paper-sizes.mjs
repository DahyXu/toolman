import { esc, faq } from '../layout.mjs';
import DETAIL from '../data/paper-detail.mjs';
import DATA from '../data/paper-sizes-data.mjs';

// Tuple form of the shared list, so the rest of this file reads as it always has.
const SIZES = DATA.map((d) => [d.name, d.id, d.w, d.h, d.series, d.note]);

const IN = (mm) => mm / 25.4;
const r2 = (n) => Math.round(n * 100) / 100;
const px = (mm, dpi) => Math.round(IN(mm) * dpi);

const SERIES = {
  A: ['ISO A series', 'The international standard, used for everyday paper almost everywhere outside North America. Each size is the previous one cut in half across its longer side, and every size keeps the same 1:√2 proportions.'],
  B: ['ISO B series', 'Sits geometrically between consecutive A sizes. Used where the A jump is too coarse — posters, books and envelopes.'],
  C: ['ISO C series', 'Envelope sizes. C(n) is designed to hold A(n) unfolded, which is the whole point of the series.'],
  US: ['North American', 'Letter, Legal and the ANSI drawing sizes. Defined in inches and not related to the ISO system, which is why A4 documents print badly on Letter and vice versa.'],
  Card: ['Cards', 'Business card standards, which differ between North America and Europe.'],
  Photo: ['Photo prints', 'Common print and frame sizes, defined in inches.'],
  ARCH: ['Architectural', 'The US architectural series, defined in inches and built on a 4:3 or 3:2 ratio rather than the ANSI doubling. Drawing offices use ARCH where engineering offices use ANSI.'],
  'JIS B': ['JIS B series (Japan)', 'The Japanese B series, which shares its names with ISO B and not its sizes. JIS defines B0 as 1.5 square metres against the A series’ 1, so every JIS B sheet is slightly larger than the ISO B of the same number — JIS B5 is 182 × 257 mm where ISO B5 is 176 × 250.'],
  'US Envelope': ['US envelope sizes', 'The American envelope standards: the commercial numbers, which carry folded Letter sheets, and the announcement A sizes, which carry cards. The announcement names collide with ISO A paper and have nothing to do with it — an A2 envelope is 111 × 146 mm where A2 paper is 420 × 594.'],
  Book: ['Book trim sizes', 'The finished page sizes commercial printers and print-on-demand services offer by name.'],
};


// How this sheet relates to the others in its series. Every number here is
// exact rather than approximate, because the series is defined by halving.
function seriesMaths(name, series, w, h) {
  const m = /^([ABC])(\d+)$/.exec(name);
  if (series === 'US') {
    // Everything in the US series is a multiple of Letter, so the honest thing
    // to give each sheet is its own size in Letters and its own aspect ratio —
    // the ratio genuinely alternates here, unlike the A series.
    const LW = 215.9, LH = 279.4;
    const letters = Math.round((w * h) / (LW * LH));
    const ratio = (Math.max(w, h) / Math.min(w, h)).toFixed(3);
    const out = [];
    out.push(letters >= 2
      ? `At ${w} &times; ${h}&nbsp;mm this is <strong>about ${letters} Letter sheets</strong> of area. The ANSI drawing sizes are built by doubling Letter repeatedly, in the same spirit as the A series but starting from a different sheet.`
      : `This sheet is <strong>${letters === 1 ? 'about the area of a single Letter sheet' : 'smaller than a Letter sheet'}</strong>, at ${w} &times; ${h}&nbsp;mm.`);
    out.push(`Its aspect ratio is <strong>1:${ratio}</strong>. This is where the US system differs from A sizes in a way that matters: the A series keeps a constant 1:1.414 through every fold, while doubling a Letter-based sheet alternates between roughly 1:1.29 and 1:1.55. A drawing scaled from one ANSI size to the next therefore does not fill the sheet the way an A-series drawing does, and something always has to be cropped or padded.`);
    out.push('That single difference is why documents laid out for one system never move cleanly to the other, and why a "fit to page" print from Letter to A4 leaves uneven margins rather than simply shrinking.');
    return out.map((x) => `<p>${x}</p>`).join('');
  }
  // A size outside a halving series still has a relationship worth stating —
  // what fits inside it, or which standard sheet it sits closest to. Returning
  // '' here printed the heading above nothing on 44 pages, including the eleven
  // JIS B sizes added a day earlier, and no assertion noticed because an empty
  // section is well-formed HTML.
  if (!m) {
    const parts = [];
    const ratio = (Math.max(w, h) / Math.min(w, h)).toFixed(3);
    const find = (id) => SIZES.find((s) => s[1] === id);
    const jis = /^JIS B(\d+)$/.exec(name);

    if (jis) {
      const n = +jis[1];
      const halvings = Math.pow(2, n);
      const isoB = find(`b${n}`);
      const isoA = find(`a${n}`);
      parts.push(`JIS B0 is defined as <strong>1.5 square metres</strong>, where ISO A0 is one. ${name} is that sheet halved <strong>${n === 0 ? 'no times — it is the base of the series' : n === 1 ? 'once' : n + ' times'}</strong>, so ${n === 0 ? 'its area is the full 1.5&nbsp;m&sup2;' : `its area is ${(1.5 / halvings).toFixed(n > 5 ? 5 : 4).replace(/0+$/, '').replace(/\.$/, '')}&nbsp;m&sup2; and ${halvings.toLocaleString()} of them tile one JIS B0`}.`);
      if (isoA) {
        parts.push(`That 1.5 against 1 is why the series exists: at ${w} &times; ${h}&nbsp;mm, ${name} is about <strong>22% longer on each edge than A${n}</strong> (${isoA[2]} &times; ${isoA[3]}&nbsp;mm), filling the gap the A series leaves between one size and the next.`);
      }
      if (isoB) {
        parts.push(`It is <strong>not the same sheet as ISO B${n}</strong>, which is ${isoB[2]} &times; ${isoB[3]}&nbsp;mm. The two standards share every name in the series and agree on none of the sizes, so a tray, binder or sleeve cut for one will not take the other. Ask a printer for "B${n}" outside Japan and you will get the ISO sheet.`);
      }
      parts.push(`Scaling between neighbouring JIS B sizes is the same &radic;2 as the A series &mdash; <strong>141%</strong> up, <strong>71%</strong> down &mdash; because JIS B is built by halving too. Only the starting area differs.`);
      return parts.map((x) => `<p>${x}</p>`).join('');
    }

    if (series === 'US Envelope') {
      // What actually goes in it. Computed against the sheets in this table
      // rather than asserted, so a wrong dimension shows up as a wrong claim.
      // The pool excludes the B series in both standards: naming a JIS B7 as
      // the sheet that fits a US invitation envelope is arithmetically true and
      // useless to anybody holding one.
      const CLEAR = 3; // envelopes are cut a few millimetres over their contents
      const NOT_HERE = new Set(['B', 'JIS B', 'C', 'US Envelope', 'Book']);
      const fits = SIZES
        .filter((s) => !NOT_HERE.has(s[4]))
        .filter((s) => s[2] + CLEAR <= w && s[3] + CLEAR <= h)
        .sort((a, b) => b[2] * b[3] - a[2] * a[3])[0];
      // A No. 6¾ carries a Letter sheet quartered, which the first version of
      // this list did not contain — so the page said "too small for a folded
      // Letter" three paragraphs under a description calling it the small
      // business envelope. Reporting the largest fold that fits says one thing
      // per envelope and cannot contradict the paragraph above it.
      const FOLDS = [
        ['a Letter sheet folded in half', 215.9, 139.7],
        ['an A4 sheet folded in half', 210, 148.5],
        ['a Letter sheet folded in three', 215.9, 93.13],
        ['an A4 sheet folded in three', 210, 99],
        ['a Letter sheet folded in half and then in three', 71.97, 139.7],
        ['an A4 sheet folded in half and then in three', 70, 148.5],
      ];
      const goesIn = ([, fw, fh]) =>
        (fw + CLEAR <= w && fh + CLEAR <= h) || (fh + CLEAR <= w && fw + CLEAR <= h);
      // Sorting purely by area named an A4 fold on a No. 10 — the envelope
      // the Letter fold was invented for — because A4 in three is 20,790 mm²
      // against Letter's 20,107. On an American envelope the American sheet
      // is the one to name; A4 only appears when no Letter fold fits.
      const byArea = (a, b) => b[1] * b[2] - a[1] * a[2];
      const possible = FOLDS.filter(goesIn);
      const letterFolds = possible.filter(([label]) => label.includes('Letter'));
      const folded = (letterFolds.length ? letterFolds : possible).sort(byArea)[0];

      parts.push(`At ${w} &times; ${h}&nbsp;mm (${r2(IN(w))} &times; ${r2(IN(h))} inches) the aspect ratio is <strong>1:${ratio}</strong>. US envelopes are not a halving series: each size is cut to hold a particular sheet or card, so the numbers step irregularly and nothing scales cleanly to anything else.`);


      parts.push(fits
        ? `Of the standard sheets on this site, the largest that goes in flat is <strong>${fits[0]}</strong> at ${fits[2]} &times; ${fits[3]}&nbsp;mm, with a few millimetres to spare on each edge.`
        : `No standard sheet on this site goes in flat &mdash; this envelope is cut for a card or a folded sheet rather than for a full sheet size.`);
      parts.push(folded
        ? `Folded, the largest standard sheet it takes is <strong>${folded[0]}</strong>.`
        : `No standard sheet folds down small enough to go in, which puts it in the card and reply-slip range rather than the business range.`);
      return parts.map((x) => `<p>${x}</p>`).join('');
    }

    const nearest = SIZES
      .filter((s) => s[4] === 'A')
      .sort((a, b) => Math.abs(a[2] * a[3] - w * h) - Math.abs(b[2] * b[3] - w * h))[0];
    parts.push(`At ${w} &times; ${h}&nbsp;mm (${r2(IN(w))} &times; ${r2(IN(h))} inches) the aspect ratio is <strong>1:${ratio}</strong>. This size is not part of a halving series, so there is no fixed scaling factor to the next size up or down &mdash; each one is defined on its own terms.`);
    if (nearest) {
      const pct = Math.round(((w * h) / (nearest[2] * nearest[3]) - 1) * 100);
      parts.push(`The closest ISO sheet by area is <strong>${nearest[0]}</strong> at ${nearest[2]} &times; ${nearest[3]}&nbsp;mm &mdash; ${pct === 0 ? 'near enough the same area' : `this size is ${Math.abs(pct)}% ${pct > 0 ? 'larger' : 'smaller'}`}. The proportions differ, though: ${nearest[0]} is 1:1.414 like every A size, and this one is 1:${ratio}, so content laid out for one does not fill the other without cropping or white space.`);
    }
    return parts.map((x) => `<p>${x}</p>`).join('');
  }
  const letter = m[1], n = +m[2];
  const inA0 = Math.pow(2, n);
  const parts = [];

  parts.push(`${name} is ${letter}0 halved <strong>${n === 0 ? 'no times — it is the base of the series' : n === 1 ? 'once' : n + ' times'}</strong>. Halving a sheet across its longer side is what generates the next size down, and because the sides are in a 1:&radic;2 ratio the proportions survive every fold — which is the entire reason the series exists.`);

  if (n > 0) {
    parts.push(`That makes <strong>${inA0.toLocaleString()} sheet${inA0 === 1 ? '' : 's'} of ${name}</strong> exactly one sheet of ${letter}0, with nothing left over. The area works out at ${(1 / inA0).toFixed(n > 6 ? 6 : 4).replace(/0+$/, '').replace(/\.$/, '')} m&sup2;, since ${letter}0 is defined as one square metre.`);
  } else {
    parts.push(`${letter}0 is defined as one square metre of area with sides in a 1:&radic;2 ratio. Every other size in the series is derived from it by halving, which is why none of the dimensions are round numbers.`);
  }

  if (letter === 'A' && n !== 4) {
    const rel = n > 4 ? Math.pow(2, n - 4) : Math.pow(2, 4 - n);
    parts.push(n > 4
      ? `Against the sheet most people picture: <strong>${rel} of these fit on one A4</strong>.`
      : `Against the sheet most people picture: <strong>one of these holds ${rel} A4 sheet${rel === 1 ? '' : 's'}</strong>.`);
  }

  parts.push(`Scaling to the next size up or down is a factor of &radic;2 &asymp; 1.414 on each edge, so enlarging ${name} to the next size is <strong>141%</strong> on a photocopier and reducing it is <strong>71%</strong>. Those two numbers are on the preset buttons of most copiers for exactly this reason, and they are the same for every size in the series.`);

  return parts.map((x) => `<p>${x}</p>`).join('');
}


// The nine sizes named by their inches — Photo 4×6, Index Card 3×5, US Trade
// 6×9 — are searched as they are typed: "8x10 inches paper size" with a letter
// x, or "8 by 10 paper size" with the word. The page rendered the typographic
// sign twelve times and neither spelling once. This is not keyword stuffing;
// it is the size written the way the trade and the customer write it.
const pairOf = (name) => {
  const at = name.indexOf('×');
  if (at < 0) return null;
  const a = name.slice(0, at).trim().split(' ').pop();
  const b = name.slice(at + 1).trim().split(' ')[0];
  const isNum = (x) => x !== '' && String(Number(x)) === x;
  return isNum(a) && isNum(b) ? { a, b } : null;
};

export default async function () {
  // The first version of pairOf used a regex that lost its backslashes on the
  // way into this file and became /(d+)s*×s*(d+)/, which matches nothing. The
  // build passed, the nine sentences rendered as empty strings, and the only
  // way anyone would have found out is by reading a page. Count them.
  {
    const named = SIZES.filter(([name]) => name.includes('×'));
    const paired = named.filter(([name]) => pairOf(name));
    if (paired.length !== named.length || named.length === 0) {
      console.error(`
✗ paper: ${named.length} size(s) are named with a × and pairOf reads ${paired.length} of them`);
      process.exitCode = 1;
    }
  }
  const pages = [];

  for (const [name, id, w, h, series, note] of SIZES) {
    const siblings = SIZES.filter((s) => s[4] === series && s[1] !== id);
    const others = SIZES.filter((s) => s[4] !== series).slice(0, 14);
    const ratio = r2(h / w);

    const FAQ = faq([
      { q: `What size is ${name} in mm?`, a: `<strong>${w} × ${h} mm</strong>.` },
      { q: `What size is ${name} in inches?`, a: `<strong>${r2(IN(w))} × ${r2(IN(h))} inches</strong>.` },
      { q: `What size is ${name} in pixels?`,
        a: `There is no single answer — it depends on resolution. At the print standard of 300 DPI it is <strong>${px(w, 300)} × ${px(h, 300)} pixels</strong>; at 72 DPI it is only ${px(w, 72)} × ${px(h, 72)}.` },
    ]);

    pages.push({
      path: `/paper/${id}/`,
      title: (() => {
        // papersizes.io outranks us with "A8 Size in Inches, mm, cm", and the
        // queries arriving include "a5 size in cm". Three units cost fewer
        // characters than the brand suffix they replace.
        const mm = `${name} Size — ${w} × ${h} mm`;
        const withCm = `${mm}, ${r2(w / 10)} × ${r2(h / 10)} cm`;
        const all = `${withCm}, ${r2(IN(w))} × ${r2(IN(h))} in`;
        return all.length <= 65 ? all : withCm.length <= 65 ? withCm : mm;
      })(),
      desc: `${name} size is ${w} × ${h} mm — ${r2(w / 10)} × ${r2(h / 10)} cm, ${r2(IN(w))} × ${r2(IN(h))} in, ${px(w, 300)} × ${px(h, 300)} px at 300 DPI. Full ${name} dimensions and what the sheet is for.`,
      h1: `${name} paper size`,
      crumbs: [{ name: 'Paper sizes', path: '/paper/' }, { name, path: `/paper/${id}/` }],
      jsonld: [FAQ.schema],
      body: `<p class="big" style="font-size:1.6rem;margin:.3em 0"><strong>${w} × ${h} mm</strong></p>
<p class="muted">${r2(IN(w))} × ${r2(IN(h))} inches · ${r2(w / 10)} × ${r2(h / 10)} cm · aspect ratio 1:${ratio}</p>
<p>${name} size is <strong>${w} × ${h} mm</strong>. Those are the ${name} dimensions a printer works to; the same sheet in centimetres, inches, points and pixels is below.</p>
${(() => { const q = pairOf(name); return q ? `<p>It is written <strong>${q.a}x${q.b}</strong> and <strong>${q.a} by ${q.b}</strong> as often as ${q.a}×${q.b} — the same sheet however it is typed. Sizes named by their inches like this one get asked for by the numbers rather than by a letter code, which is why the spelling varies and the sheet does not.</p>` : ''; })()}

<h2>What ${name} is for</h2>
<p>${DETAIL[id] || note}</p>

<h2>${name} dimensions in every unit</h2>
<table><thead><tr><th>Unit</th><th>Width</th><th>Height</th></tr></thead><tbody>
<tr><td>Millimetres</td><td>${w} mm</td><td>${h} mm</td></tr>
<tr><td>Centimetres</td><td>${r2(w / 10)} cm</td><td>${r2(h / 10)} cm</td></tr>
<tr><td>Inches</td><td>${r2(IN(w))} in</td><td>${r2(IN(h))} in</td></tr>
<tr><td>Points (PostScript)</td><td>${Math.round(IN(w) * 72)} pt</td><td>${Math.round(IN(h) * 72)} pt</td></tr>
</tbody></table>

<h2>${name} in pixels</h2>
<p>Pixel dimensions depend entirely on the resolution you are working at — there is no single "pixel size" for a sheet of paper. <a href="/paper/${id}/pixels/">Every resolution, with file sizes and canvas setup →</a></p>
<table><thead><tr><th>Resolution</th><th>Pixels</th><th>Use</th></tr></thead><tbody>
<tr><td>72 DPI</td><td>${px(w, 72)} × ${px(h, 72)}</td><td>Screen preview only — far too coarse to print</td></tr>
<tr><td>150 DPI</td><td>${px(w, 150)} × ${px(h, 150)}</td><td>Draft printing, internal documents</td></tr>
<tr><td>300 DPI</td><td>${px(w, 300)} × ${px(h, 300)}</td><td>The standard for commercial print</td></tr>
<tr><td>600 DPI</td><td>${px(w, 600)} × ${px(h, 600)}</td><td>Fine detail, line art, archival scanning</td></tr>
</tbody></table>
<p class="muted">Setting up a print document? Use 300 DPI and add 3&nbsp;mm of bleed on every edge unless your printer specifies otherwise.</p>

<h2>How ${name} relates to the rest of the series</h2>\n${seriesMaths(name, series, w, h)}\n\n<h2>About ${name}</h2>
<p>${note}</p>
${series === 'A' ? `<h2>Why A sizes halve so neatly</h2>
<p>The A series is built on a 1:√2 ratio — approximately 1:1.414. That proportion has a unique property: cut the sheet in half across its long side and the two halves keep exactly the same proportions. This is why two A4 sheets make an A3, why scaling A4 artwork to A3 needs no cropping, and why photocopiers have a single "A4 → A3" button that just works.</p>` : ''}
${series === 'US' ? `<h2>Letter vs A4</h2>
<p>Letter is 6&nbsp;mm wider and 18&nbsp;mm shorter than A4. That small difference is why a PDF laid out for A4 prints with clipped edges or unexpected margins on US paper, and why "Fit to page" exists in every print dialog. There is no scaling factor that makes them match — the aspect ratios genuinely differ (1:1.294 for Letter, 1:1.414 for A4).</p>` : ''}

<h2>Other ${esc(SERIES[series][0])} sizes</h2>
<table><thead><tr><th>Size</th><th>Millimetres</th><th>Inches</th></tr></thead><tbody>
${siblings.map(([n2, i2, w2, h2]) => `<tr><td><a href="/paper/${i2}/">${esc(n2)}</a></td><td>${w2} × ${h2} mm</td><td>${r2(IN(w2))} × ${r2(IN(h2))} in</td></tr>`).join('')}
</tbody></table>

${FAQ.html}

<h2>Other paper sizes</h2>
<ul class="linklist">${others.map(([n2, i2]) => `<li><a href="/paper/${i2}/">${esc(n2)}</a></li>`).join('')}</ul>
<p><a href="/paper/">All paper sizes</a> · <a href="/convert/millimeters-to-inches/">Convert mm to inches</a></p>`,
    });
  }

    // The hub explains the series from its definition rather than from the table,
  // so the figures it quotes are derived and checked against the table. A page
  // that teaches the rule has to agree with its own data.
  const bySize = (id) => SIZES.find((x) => x[1] === id);
  const a0 = bySize('a0');
  const a4 = bySize('a4');
  const c4 = bySize('c4');
  const aDemo = 5;
  const aDemoArea = `1/${Math.pow(2, aDemo)} m\u00b2`;
  const scaleUp = Math.round(Math.SQRT2 * 100);
  const scaleDown = Math.round((1 / Math.SQRT2) * 100);
  const a4w = a4 ? a4[2] : 0;
  const a4h = a4 ? a4[3] : 0;
  {
    // A0 is one square metre by definition; the table has to reproduce it.
    const a0m2 = a0 ? (a0[2] * a0[3]) / 1e6 : 0;
    if (Math.abs(a0m2 - 1) > 0.01) {
      console.error(`\n\u2717 paper hub: says A0 is one square metre and the table gives ${a0m2.toFixed(4)}`);
      process.exitCode = 1;
    }
    // A4 sixteen times over is A0, because four halvings.
    const a4m2 = (a4w * a4h * 16) / 1e6;
    if (Math.abs(a4m2 - 1) > 0.02) {
      console.error(`\n\u2717 paper hub: says sixteen A4 sheets make a square metre and they make ${a4m2.toFixed(4)}`);
      process.exitCode = 1;
    }
    // C4 has to be larger than A4 or the envelope claim is wrong.
    if (!c4 || !(c4[2] > a4w && c4[3] > a4h)) {
      console.error(`\n\u2717 paper hub: says a C4 envelope takes an unfolded A4 and C4 is not larger on both edges`);
      process.exitCode = 1;
    }
  }

  pages.push({
    path: '/paper/',
    title: 'Paper Sizes — A4, Letter, Legal and Every Standard Format',
    desc: `Every standard paper size in millimetres, inches and pixels: the full ISO A, B and C series plus North American Letter, Legal, Tabloid and ANSI formats.`,
    h1: 'Paper sizes',
    crumbs: [{ name: 'Paper sizes', path: '/paper/' }],
    body: `<p class="muted">Dimensions in millimetres, inches and pixels for every standard format, plus what each one is actually used for.</p>
<p><a href="/paper/compare/">Comparing two sizes?</a> Every pair close enough to be a real alternative, with the print scale that puts one on the other.</p>
${Object.entries(SERIES).map(([key, [label, desc]]) => {
      const list = SIZES.filter((s) => s[4] === key);
      if (!list.length) return '';
      return `<h2>${esc(label)}</h2><p class="muted">${desc}</p>
<table><thead><tr><th>Size</th><th>Millimetres</th><th>Centimetres</th><th>Inches</th><th>Pixels @300 DPI</th></tr></thead><tbody>
${list.map(([n, i, w, h]) => `<tr><td><a href="/paper/${i}/"><strong>${esc(n)}</strong></a></td><td>${w} × ${h} mm</td><td>${r2(w / 10)} × ${r2(h / 10)} cm</td><td>${r2(IN(w))} × ${r2(IN(h))} in</td><td><a href="/paper/${i}/pixels/">${px(w, 300)} × ${px(h, 300)}</a></td></tr>`).join('')}
</tbody></table>`;
    }).join('')}

<h2>The two systems, and why they do not mix</h2>
<p>Most of the world uses ISO 216 — the A, B and C series — which is built on a 1:√2 ratio so that halving a sheet preserves its proportions. North America uses Letter and Legal, defined in inches with no such property. A4 is 210 × 297&nbsp;mm; Letter is 216 × 279&nbsp;mm. Neither scaling nor rotating turns one into the other, which is why cross-Atlantic PDFs so often print with clipped edges.</p>

<h2>Working out any A size without a table</h2>
<p>The whole series comes from one definition: <strong>A0 is one square metre</strong>, in the 1:√2 proportion, and every size after it is the one before cut in half. So A${aDemo} has an area of 1/2<sup>${aDemo}</sup> of a square metre, which is ${aDemoArea} — and knowing that, the dimensions follow without looking anything up.</p>
<p>Two consequences are worth carrying around. The first is that <strong>A(n) is exactly half of A(n−1)</strong>, so an A5 is half an A4 and a quarter of an A3, and an A${aDemo} is 1/${Math.pow(2, aDemo)} of an A0 — which is how you get to A9 or A10 in your head from a number you already know. The second is the scaling factor: because the proportions never change, enlarging one step is always ×√2 and reducing one step is always ÷√2. Those are the <strong>${scaleUp}%</strong> and <strong>${scaleDown}%</strong> buttons on every photocopier ever made, and they are not approximations rounded for convenience — they are the ratio itself.</p>
<p>A quick check on any of it: an A4 sheet is ${a4w} × ${a4h} mm, and ${a4w} × ${a4h} × 16 is within a whisker of one square metre, because A4 is A0 halved four times.</p>

<h2>What the B and C series are for</h2>
<p>The A series jumps by a factor of two in area, which is a large step when a poster needs to be "a bit bigger than A2". B fills those gaps: each B size is the geometric mean of the A size with the same number and the one above it, so B4 sits between A4 and A3 rather than being a size of its own invention.</p>
<p>C is the envelope series, and it is built the same way one level in: <strong>C(n) is the geometric mean of A(n) and B(n)</strong>, which makes it just larger than A(n). That is the entire point — a C4 envelope takes an unfolded A4 sheet, a C5 takes an A4 folded once, a C6 takes it folded twice. The relationship is why the numbers match rather than being a coincidence worth memorising.</p>
<p>DL, the long business envelope, is the exception: it is not part of the C series at all, and it exists because an A4 sheet folded in three is a shape the geometric series does not produce.</p>

<h2>Choosing a resolution</h2>
<table><thead><tr><th>DPI</th><th>When</th></tr></thead><tbody>
<tr><td>72</td><td>Screen mock-ups only. Printing at 72 DPI produces visibly soft, pixelated output.</td></tr>
<tr><td>150</td><td>Draft prints and internal documents where quality is secondary to speed.</td></tr>
<tr><td>300</td><td>The commercial print standard. Use this unless told otherwise.</td></tr>
<tr><td>600+</td><td>Line art, fine text and archival scanning, where edges must stay crisp.</td></tr>
</tbody></table>

<h2>Related</h2>
<ul class="cards">
<li><a href="/convert/millimeters-to-inches/"><b>mm to inches</b><span>Convert any measurement between metric and imperial.</span></a></li>
<li><a href="/convert/length/"><b>Length converters</b><span>Every length unit, with formulas and tables.</span></a></li>
<li><a href="/image-compressor/"><b>Image compressor</b><span>Resize and compress images before placing them in a layout.</span></a></li>
</ul>`,
  });


  // Nine of the site's live queries ask for a paper size in pixels — "a4 in px",
  // "a2 pixels size", "a4 resolution", "a2 print dimensions" — and they were all
  // landing on the parent page, whose title says millimetres. A page that
  // answers the question in its title should do better, and the numbers are
  // entirely its own: the pixel count and the file size both scale with the
  // square of the DPI, so an A0 at 300 DPI is 418 MB where an A4 is 26.
  const DPIS = [72, 96, 150, 200, 300, 400, 600, 1200];
  for (const [name, id, w, h, series, note] of SIZES) {
    const at = (dpi) => ({ w: px(w, dpi), h: px(h, dpi) });
    const mb = (dpi) => { const p = at(dpi); return (p.w * p.h * 3) / 1048576; };
    const fmb = (v) => (v >= 1024 ? `${(v / 1024).toFixed(2)} GB` : v >= 10 ? `${Math.round(v)} MB` : `${v.toFixed(1)} MB`);
    const p300 = at(300), p72 = at(72);

    const PXFAQ = faq([
      { q: `What is ${name} in pixels?`,
        a: `There is no single answer — it depends on the resolution. At the print standard of 300 DPI, ${name} is <strong>${p300.w} × ${p300.h} pixels</strong>. On screen at 72 DPI it is only ${p72.w} × ${p72.h}.` },
      { q: `What resolution should an ${name} document be?`,
        a: `<strong>300 DPI</strong> for anything going to a commercial printer, which makes the canvas ${p300.w} × ${p300.h} pixels. 150 DPI (${at(150).w} × ${at(150).h}) is acceptable for a draft or an internal document. Large formats read from a distance can go lower — a poster viewed from two metres looks sharp at 150 DPI, and dropping to it here saves ${fmb(mb(300) - mb(150))} of file.` },
      { q: `How big is an ${name} file at 300 DPI?`,
        a: `About <strong>${fmb(mb(300))}</strong> uncompressed at 24-bit colour — ${p300.w} × ${p300.h} × 3 bytes. Compression brings that down a great deal for flat artwork and very little for a photograph, which is why a print-ready ${name} PDF is usually tens of megabytes.` },
      { q: `How many megapixels is ${name} at 300 DPI?`,
        a: `${((p300.w * p300.h) / 1e6).toFixed(1)} megapixels. For comparison, ${name} at 600 DPI is ${((at(600).w * at(600).h) / 1e6).toFixed(1)} MP — quadruple, because doubling the resolution doubles both dimensions.` },
    ]);

    pages.push({
      path: `/paper/${id}/pixels/`,
      title: (() => {
        // Seven of the ten queries reaching /paper/a4/ are about pixels, and
        // four of those say "size" - "a4 pixel size", "a4 size in pixels",
        // "a4 size in px", "size of an a4 paper in pixels". The old title said
        // "A4 in Pixels" and spent ten characters on the brand instead.
        const base = `${name} Size in Pixels — ${p300.w} × ${p300.h} at 300 DPI`;
        const both = `${base}, ${px(w, 72)} × ${px(h, 72)} at 72`;
        return both.length <= 65 ? both : base.length <= 65 ? base : `${name} Size in Pixels`;
      })(),
      desc: `${name} is ${p300.w} × ${p300.h} pixels at 300 DPI, ${at(150).w} × ${at(150).h} at 150 and ${p72.w} × ${p72.h} at 72. Pixel dimensions at every common resolution, with file sizes.`,
      h1: `${name} in pixels`,
      crumbs: [{ name: 'Paper sizes', path: '/paper/' }, { name, path: `/paper/${id}/` }, { name: 'In pixels', path: `/paper/${id}/pixels/` }],
      jsonld: [PXFAQ.schema],
      body: `<p class="big" style="font-size:1.6rem;margin:.3em 0"><strong>${p300.w} × ${p300.h} px</strong></p>
<p class="muted">at 300 DPI, the print standard · ${name} is ${w} × ${h} mm · ${((p300.w * p300.h) / 1e6).toFixed(1)} megapixels</p>
<p>${name} size in pixels has no single answer, because a pixel is a length only once a resolution decides how many fit in an inch. The ${name} pixel size is <strong>${p300.w} × ${p300.h} px</strong> at the 300 DPI print standard and ${px(w, 72)} × ${px(h, 72)} px at the 72 DPI screen convention — every resolution in between is in the table below.</p>

<h2>${name} at every resolution</h2>
<p>A sheet of paper has no pixel size of its own. It has a physical size — ${w} × ${h} mm, or ${r2(IN(w))} × ${r2(IN(h))} inches — and a pixel count only appears once you choose how many pixels go in each inch.</p>
<table><thead><tr><th>Resolution</th><th>Pixels</th><th>Megapixels</th><th>Uncompressed 24-bit</th><th>Use</th></tr></thead><tbody>
${DPIS.map((d) => {
        const q = at(d);
        const use = d <= 96 ? 'Screen only — visibly soft in print'
          : d === 150 ? 'Drafts, internal documents, large-format viewed from a distance'
          : d === 200 ? 'Acceptable for office printing'
          : d === 300 ? 'The commercial print standard'
          : d === 400 ? 'Fine detail and small type'
          : d === 600 ? 'Line art, technical drawings, archival scanning'
          : 'Archival and reproduction work';
        return `<tr${d === 300 ? ' style="font-weight:600"' : ''}><td>${d} DPI</td><td>${q.w} × ${q.h}</td><td>${((q.w * q.h) / 1e6).toFixed(1)} MP</td><td>${fmb(mb(d))}</td><td class="muted">${use}</td></tr>`;
      }).join('')}
</tbody></table>

<h2>What the file size means for ${name}</h2>
<p>At 300 DPI an uncompressed ${name} is <strong>${fmb(mb(300))}</strong>, and at 600 DPI it is ${fmb(mb(600))} — four times as much, because doubling the resolution doubles both dimensions. That squaring is the reason large formats become unwieldy so quickly: the same 300 DPI that produces a manageable file at small sizes produces ${fmb(mb(300))} here.</p>
<p>If a file is going to a printer, ask what they want before choosing. 300 DPI is the safe default and 150 is often enough for anything read from more than arm's length.</p>

<h2>Setting up the canvas</h2>
<pre><code>Width:      ${p300.w} px
Height:     ${p300.h} px
Resolution: 300 pixels/inch
Colour:     CMYK for print, RGB for screen
Bleed:      3 mm on every edge → ${px(w + 6, 300)} × ${px(h + 6, 300)} px</code></pre>
<p>The bleed figure is the one people forget: artwork that runs to the edge must extend 3 mm past it on all four sides, so the working canvas is larger than the finished sheet.</p>

${PXFAQ.html}

<h2>Other sizes in pixels</h2>
<ul class="linklist">
${SIZES.filter((x) => x[1] !== id).slice(0, 24).map(([n2, i2, w2, h2]) => `<li><a href="/paper/${i2}/pixels/">${esc(n2)} in pixels</a> — ${px(w2, 300)} × ${px(h2, 300)}</li>`).join('')}
</ul>

<p><a href="/paper/${id}/">${name} in millimetres, inches and points</a> · <a href="/paper/">All paper sizes</a> · <a href="/resolution/">Screen resolutions</a></p>`,
    });
  }

  return pages;
}
