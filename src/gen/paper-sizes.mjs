import { esc, faq } from '../layout.mjs';

// name, id, width mm, height mm, series, note
const SIZES = [
  ['A0', 'a0', 841, 1189, 'A', 'The base of the A series, defined as one square metre of area with sides in a 1:√2 ratio. Every smaller A size is this one halved repeatedly.'],
  ['A1', 'a1', 594, 841, 'A', 'Half of A0. Common for posters, technical drawings and exhibition boards.'],
  ['A2', 'a2', 420, 594, 'A', 'Half of A1. Used for medium posters, art prints and larger calendars.'],
  ['A3', 'a3', 297, 420, 'A', 'Exactly two A4 sheets side by side. The largest size most office printers handle, and the standard for spreadsheets, drawings and small posters.'],
  ['A4', 'a4', 210, 297, 'A', 'The default sheet of paper almost everywhere except North America. If you have ever printed anything outside the US or Canada, it was almost certainly A4.'],
  ['A5', 'a5', 148, 210, 'A', 'Half of A4 — the size of a typical notebook, flyer or small booklet page.'],
  ['A6', 'a6', 105, 148, 'A', 'Postcard size. Also the standard for small flyers and index cards outside North America.'],
  ['A7', 'a7', 74, 105, 'A', 'Pocket size, used for small notepads and tickets.'],
  ['A8', 'a8', 52, 74, 'A', 'About the size of a playing card. Used for labels and small tickets.'],
  ['A9', 'a9', 37, 52, 'A', 'Rarely used outside of very small labels.'],
  ['A10', 'a10', 26, 37, 'A', 'The smallest standard A size — roughly a postage stamp.'],
  ['B0', 'b0', 1000, 1414, 'B', 'The B series sits geometrically between consecutive A sizes, giving a size range for posters and books where A is too coarse.'],
  ['B1', 'b1', 707, 1000, 'B', 'Common for large advertising posters in Europe.'],
  ['B2', 'b2', 500, 707, 'B', 'Used for posters and point-of-sale displays.'],
  ['B3', 'b3', 353, 500, 'B', 'Between A3 and A2 — used for posters and larger brochures.'],
  ['B4', 'b4', 250, 353, 'B', 'Slightly larger than A4. Common for books and magazines in Japan.'],
  ['B5', 'b5', 176, 250, 'B', 'A very common book and academic journal size, and standard for notebooks in Japan and China.'],
  ['B6', 'b6', 125, 176, 'B', 'Used for paperback books and small notebooks.'],
  ['B7', 'b7', 88, 125, 'B', 'Passport-sized. Actual passports are close to this.'],
  ['B8', 'b8', 62, 88, 'B', 'About the size of a playing card or a bank card sleeve.'],
  ['C4', 'c4', 229, 324, 'C', 'The envelope that takes an unfolded A4 sheet. The C series exists precisely so that C(n) holds A(n).'],
  ['C5', 'c5', 162, 229, 'C', 'Takes an A4 sheet folded once, or an unfolded A5.'],
  ['C6', 'c6', 114, 162, 'C', 'Takes an A4 sheet folded twice, or an unfolded A6 postcard.'],
  ['DL', 'dl', 110, 220, 'C', 'The standard business envelope in Europe — takes an A4 sheet folded into thirds. Technically not part of the C series but used alongside it.'],
  ['Letter', 'letter', 215.9, 279.4, 'US', 'The North American default: 8.5 × 11 inches. Slightly wider and shorter than A4, which is why documents laid out for one never quite fit the other.'],
  ['Legal', 'legal', 215.9, 355.6, 'US', 'Letter width, three inches taller: 8.5 × 14 inches. Used for contracts and legal filings in the US and Canada.'],
  ['Tabloid', 'tabloid', 279.4, 431.8, 'US', '11 × 17 inches — two Letter sheets side by side. Called Ledger when oriented landscape.'],
  ['Executive', 'executive', 184.15, 266.7, 'US', '7.25 × 10.5 inches. A slightly smaller, more formal sheet once common for letterheads.'],
  ['Half Letter', 'half-letter', 139.7, 215.9, 'US', '5.5 × 8.5 inches — Letter folded once. Used for booklets, planners and small notepads.'],
  ['Junior Legal', 'junior-legal', 127, 203.2, 'US', '5 × 8 inches, the size of a standard US legal notepad.'],
  ['ANSI C', 'ansi-c', 431.8, 558.8, 'US', '17 × 22 inches — four Letter sheets. Used for engineering drawings.'],
  ['ANSI D', 'ansi-d', 558.8, 863.6, 'US', '22 × 34 inches, for larger technical drawings.'],
  ['ANSI E', 'ansi-e', 863.6, 1117.6, 'US', '34 × 44 inches — the largest standard ANSI drawing sheet.'],
  ['Business Card (US)', 'business-card-us', 88.9, 50.8, 'Card', '3.5 × 2 inches, the North American standard. Fits a wallet card slot.'],
  ['Business Card (EU)', 'business-card-eu', 85, 55, 'Card', 'The European standard, and the same footprint as a credit card — which is why it fits every wallet.'],
  ['Photo 4×6', 'photo-4x6', 101.6, 152.4, 'Photo', 'The standard photo print, matching the 2:3 aspect ratio most DSLR and mirrorless sensors produce.'],
  ['Photo 5×7', 'photo-5x7', 127, 177.8, 'Photo', 'A common frame size. Note it is 5:7, not 2:3, so a full-frame photo needs cropping.'],
  ['Photo 8×10', 'photo-8x10', 203.2, 254, 'Photo', 'A portrait and framing standard at 4:5. Cropping is always required from a 2:3 original.'],
];

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
};

export default async function () {
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
      title: `${name} Paper Size — ${w} × ${h} mm`,
      desc: `${name} measures ${w} × ${h} mm (${r2(IN(w))} × ${r2(IN(h))} in). Dimensions in millimetres, centimetres, inches and pixels at 72, 150 and 300 DPI, plus what it is used for.`,
      h1: `${name} paper size`,
      crumbs: [{ name: 'Paper sizes', path: '/paper/' }, { name, path: `/paper/${id}/` }],
      jsonld: [FAQ.schema],
      body: `<p class="big" style="font-size:1.6rem;margin:.3em 0"><strong>${w} × ${h} mm</strong></p>
<p class="muted">${r2(IN(w))} × ${r2(IN(h))} inches · ${r2(w / 10)} × ${r2(h / 10)} cm · aspect ratio 1:${ratio}</p>

<h2>${name} in every unit</h2>
<table><thead><tr><th>Unit</th><th>Width</th><th>Height</th></tr></thead><tbody>
<tr><td>Millimetres</td><td>${w} mm</td><td>${h} mm</td></tr>
<tr><td>Centimetres</td><td>${r2(w / 10)} cm</td><td>${r2(h / 10)} cm</td></tr>
<tr><td>Inches</td><td>${r2(IN(w))} in</td><td>${r2(IN(h))} in</td></tr>
<tr><td>Points (PostScript)</td><td>${Math.round(IN(w) * 72)} pt</td><td>${Math.round(IN(h) * 72)} pt</td></tr>
</tbody></table>

<h2>${name} in pixels</h2>
<p>Pixel dimensions depend entirely on the resolution you are working at — there is no single "pixel size" for a sheet of paper.</p>
<table><thead><tr><th>Resolution</th><th>Pixels</th><th>Use</th></tr></thead><tbody>
<tr><td>72 DPI</td><td>${px(w, 72)} × ${px(h, 72)}</td><td>Screen preview only — far too coarse to print</td></tr>
<tr><td>150 DPI</td><td>${px(w, 150)} × ${px(h, 150)}</td><td>Draft printing, internal documents</td></tr>
<tr><td>300 DPI</td><td>${px(w, 300)} × ${px(h, 300)}</td><td>The standard for commercial print</td></tr>
<tr><td>600 DPI</td><td>${px(w, 600)} × ${px(h, 600)}</td><td>Fine detail, line art, archival scanning</td></tr>
</tbody></table>
<p class="muted">Setting up a print document? Use 300 DPI and add 3&nbsp;mm of bleed on every edge unless your printer specifies otherwise.</p>

<h2>About ${name}</h2>
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

  pages.push({
    path: '/paper/',
    title: 'Paper Sizes — A4, Letter, Legal and Every Standard Format',
    desc: `Every standard paper size in millimetres, inches and pixels: the full ISO A, B and C series plus North American Letter, Legal, Tabloid and ANSI formats.`,
    h1: 'Paper sizes',
    crumbs: [{ name: 'Paper sizes', path: '/paper/' }],
    body: `<p class="muted">Dimensions in millimetres, inches and pixels for every standard format, plus what each one is actually used for.</p>
${Object.entries(SERIES).map(([key, [label, desc]]) => {
      const list = SIZES.filter((s) => s[4] === key);
      if (!list.length) return '';
      return `<h2>${esc(label)}</h2><p class="muted">${desc}</p>
<table><thead><tr><th>Size</th><th>Millimetres</th><th>Inches</th><th>Pixels @300 DPI</th></tr></thead><tbody>
${list.map(([n, i, w, h]) => `<tr><td><a href="/paper/${i}/"><strong>${esc(n)}</strong></a></td><td>${w} × ${h} mm</td><td>${r2(IN(w))} × ${r2(IN(h))} in</td><td>${px(w, 300)} × ${px(h, 300)}</td></tr>`).join('')}
</tbody></table>`;
    }).join('')}

<h2>The two systems, and why they do not mix</h2>
<p>Most of the world uses ISO 216 — the A, B and C series — which is built on a 1:√2 ratio so that halving a sheet preserves its proportions. North America uses Letter and Legal, defined in inches with no such property. A4 is 210 × 297&nbsp;mm; Letter is 216 × 279&nbsp;mm. Neither scaling nor rotating turns one into the other, which is why cross-Atlantic PDFs so often print with clipped edges.</p>

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

  return pages;
}
