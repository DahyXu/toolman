import { esc, faq } from '../layout.mjs';
import DETAIL from '../data/paper-detail.mjs';

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
  ['ARCH A', 'arch-a', 228.6, 304.8, 'ARCH', 'The smallest architectural sheet at 9 × 12 inches.'],
  ['ARCH B', 'arch-b', 304.8, 457.2, 'ARCH', '12 × 18 inches, two ARCH A sheets.'],
  ['ARCH C', 'arch-c', 457.2, 609.6, 'ARCH', '18 × 24 inches, the common size for a single-sheet plan.'],
  ['ARCH D', 'arch-d', 609.6, 914.4, 'ARCH', '24 × 36 inches, the standard architectural drawing sheet.'],
  ['ARCH E', 'arch-e', 914.4, 1219.2, 'ARCH', '36 × 48 inches, the largest of the series.'],
  ['ARCH E1', 'arch-e1', 762, 1066.8, 'ARCH', '30 × 42 inches, a narrower E that fits more plan rooms.'],
  ['B9', 'b9', 44, 62, 'B', 'Half of B8, used for very small labels and tickets.'],
  ['B10', 'b10', 31, 44, 'B', 'The smallest standard B size.'],
  ['C3', 'c3', 324, 458, 'C', 'Takes an unfolded A3 sheet, or a C4 envelope inside it.'],
  ['C7', 'c7', 81, 114, 'C', 'Takes an A7 sheet unfolded — the size of a small card envelope.'],
  ['Envelope No. 10', 'envelope-10', 104.775, 241.3, 'C', '4.125 × 9.5 inches, the standard US business envelope.'],
  ['A7 Envelope (US)', 'envelope-a7-us', 133.35, 184.15, 'C', '5.25 × 7.25 inches, the US invitation envelope. Unrelated to ISO A7.'],
  ['Photo 6×8', 'photo-6x8', 152.4, 203.2, 'Photo', '6 × 8 inches, a 3:4 print size.'],
  ['Photo 8×12', 'photo-8x12', 203.2, 304.8, 'Photo', '8 × 12 inches — the 2:3 enlargement that needs no cropping.'],
  ['Photo 11×14', 'photo-11x14', 279.4, 355.6, 'Photo', '11 × 14 inches, a common gallery frame size.'],
  ['Photo 16×20', 'photo-16x20', 406.4, 508, 'Photo', '16 × 20 inches, a 4:5 wall print.'],
  ['US Trade 6×9', 'us-trade-6x9', 152.4, 228.6, 'Book', '6 × 9 inches, the default trim for a US trade paperback.'],
  ['Mass Market', 'mass-market', 107.95, 174.5, 'Book', 'The rack-sized paperback, 4.25 × 6.87 inches.'],
  ['Index Card 3×5', 'index-card-3x5', 76.2, 127, 'Card', '3 × 5 inches, the standard US index card.'],
  ['Super A3', 'super-a3', 329, 483, 'A', '329 × 483 mm, the oversized A3 that desktop inkjets use for bleed.'],
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
  ARCH: ['Architectural', 'The US architectural series, defined in inches and built on a 4:3 or 3:2 ratio rather than the ANSI doubling. Drawing offices use ARCH where engineering offices use ANSI.'],
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
  if (!m) return '';
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

<h2>What ${name} is for</h2>
<p>${DETAIL[id] || note}</p>

<h2>${name} in every unit</h2>
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
      title: `${name} in Pixels — ${p300.w} × ${p300.h} at 300 DPI | Toolman`,
      desc: `${name} is ${p300.w} × ${p300.h} pixels at 300 DPI, ${at(150).w} × ${at(150).h} at 150 and ${p72.w} × ${p72.h} at 72. Pixel dimensions at every common resolution, with file sizes.`,
      h1: `${name} in pixels`,
      crumbs: [{ name: 'Paper sizes', path: '/paper/' }, { name, path: `/paper/${id}/` }, { name: 'In pixels', path: `/paper/${id}/pixels/` }],
      jsonld: [PXFAQ.schema],
      body: `<p class="big" style="font-size:1.6rem;margin:.3em 0"><strong>${p300.w} × ${p300.h} px</strong></p>
<p class="muted">at 300 DPI, the print standard · ${name} is ${w} × ${h} mm · ${((p300.w * p300.h) / 1e6).toFixed(1)} megapixels</p>

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

<p><a href="/paper/${id}/">${name} in millimetres, inches and points</a> · <a href="/paper/">All paper sizes</a> · <a href="/resolution/">Screen resolutions</a></p>`,
    });
  }

  return pages;
}
