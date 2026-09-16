import { faq } from '../layout.mjs';

// The other half of the display reference. /resolution/ answers "how many
// pixels"; this answers "how big is the box", which is the question people
// actually ask before buying a television or measuring a wall — and unlike a
// resolution, a screen size on its own is ambiguous, because a diagonal says
// nothing about width until you know the shape.
//
// Every figure here is derived. width = diagonal × r / √(r² + 1) where r is the
// aspect ratio, height = width / r. Nothing is looked up, so nothing can be
// misremembered.

const RATIOS = [
  { id: '16-9', label: '16:9', r: 16 / 9, name: 'widescreen', note: 'the standard for televisions and most monitors' },
  { id: '16-10', label: '16:10', r: 16 / 10, name: '16:10', note: 'taller than widescreen, common on laptops and design monitors' },
  { id: '21-9', label: '21:9', r: 43 / 18, name: 'ultrawide', note: 'the 34-inch class ultrawide, actually 43:18' },
  { id: '4-3', label: '4:3', r: 4 / 3, name: 'classic', note: 'the pre-widescreen shape, still used by projectors and older panels' },
  { id: '32-9', label: '32:9', r: 32 / 9, name: 'super ultrawide', note: 'two 16:9 panels side by side in one screen' },
];

// Diagonals people actually shop for. Monitors below, televisions above.
const SIZES = [
  { d: 13.3, kind: 'laptop' }, { d: 14, kind: 'laptop' }, { d: 15.6, kind: 'laptop' },
  { d: 16, kind: 'laptop' }, { d: 17, kind: 'laptop' },
  { d: 19, kind: 'monitor' }, { d: 21.5, kind: 'monitor' }, { d: 22, kind: 'monitor' },
  { d: 24, kind: 'monitor' }, { d: 25, kind: 'monitor' }, { d: 27, kind: 'monitor' },
  { d: 29, kind: 'monitor' }, { d: 32, kind: 'monitor' }, { d: 34, kind: 'monitor' },
  { d: 38, kind: 'monitor' }, { d: 40, kind: 'tv' }, { d: 43, kind: 'tv' },
  { d: 49, kind: 'monitor' }, { d: 50, kind: 'tv' }, { d: 55, kind: 'tv' },
  { d: 60, kind: 'tv' }, { d: 65, kind: 'tv' }, { d: 70, kind: 'tv' },
  { d: 75, kind: 'tv' }, { d: 77, kind: 'tv' }, { d: 83, kind: 'tv' },
  { d: 85, kind: 'tv' }, { d: 98, kind: 'tv' },
];

const KIND = { laptop: 'Laptop', monitor: 'Monitor', tv: 'Television' };

// A diagonal d at ratio r gives width d·r/√(r²+1) and height width/r.
function dims(d, r) {
  const w = (d * r) / Math.sqrt(r * r + 1);
  const h = w / r;
  return { w, h, area: w * h };
}
const n1 = (x) => x.toFixed(1);
const mm = (inches) => Math.round(inches * 25.4);
const cm = (inches) => (inches * 2.54).toFixed(1);

// The resolutions from the sibling section, so a size page can say what density
// each common resolution produces on it.
const COMMON_RES = [[1920, 1080, 'Full HD'], [2560, 1440, 'QHD'], [3840, 2160, '4K UHD'], [7680, 4320, '8K UHD']];
const ppi = (w, h, diag) => Math.round(Math.sqrt(w * w + h * h) / diag);

export default async function () {
  // The hub compares areas at a fixed diagonal, which is the counterintuitive
  // part, so the figures come from dims() rather than from arithmetic done once
  // in my head and typed.
  const a43 = dims(32, 4 / 3).area;
  const a169 = dims(32, 16 / 9).area;
  const a219 = dims(32, 21 / 9).area;
  const sq43 = Math.round(a43);
  const sq169 = Math.round(a169);
  const sq219 = Math.round(a219);
  const pct43 = Math.round((1 - a169 / a43) * 100);
  const tv55 = dims(55, 16 / 9);
  const w55 = n1(tv55.w);
  const h55 = n1(tv55.h);
  if (!(a43 > a169 && a169 > a219)) {
    console.error(`\n\u2717 screen-size hub: says area falls as the shape widens, and at 32 inches it computes ${sq43}, ${sq169}, ${sq219}`);
    process.exitCode = 1;
  }
  if (!(pct43 > 0 && pct43 < 50)) {
    console.error(`\n\u2717 screen-size hub: a ${pct43}% area difference between two 32-inch screens is not a possible one`);
    process.exitCode = 1;
  }

  const pages = [];
  const main = RATIOS[0];

  // Viewing distance at a fixed angle is proportional to width, so a bigger
  // screen has to sit further away. A distance that shrank with size would
  // mean the half-angle had been applied to the wrong side of the triangle,
  // which is an error that still prints plausible-looking feet.
  {
    const at = (diag, deg) => (dims(diag, main.r).w / 2) / Math.tan((deg / 2) * Math.PI / 180);
    const bad = [];
    for (const { d } of SIZES) {
      for (const deg of [40, 30, 20]) {
        const m = at(d, deg) * 2.54 / 100;
        if (!(m > 0.2 && m < 12)) bad.push(`${d}-inch at ${deg}°: ${m.toFixed(2)} m`);
      }
      const bigger = SIZES.filter((s) => s.d > d)[0];
      if (bigger && !(at(bigger.d, 30) > at(d, 30))) bad.push(`${bigger.d}-inch is not further away than ${d}-inch at the same angle`);
    }
    if (bad.length) {
      console.error(`
✗ screen-size: ${bad.length} viewing distance(s) that cannot be right:`);
      for (const b of bad.slice(0, 5)) console.error('    ' + b);
      process.exitCode = 1;
    }
  }

  for (const { d, kind } of SIZES) {
    const id = `${String(d).replace('.', '-')}-inch`;
    const base = dims(d, main.r);
    const label = `${d}-inch`;

    const others = SIZES.filter((s) => s.d !== d)
      .map((s) => ({ s, gap: Math.abs(s.d - d) }))
      .sort((a, b) => a.gap - b.gap).slice(0, 8).map((o) => o.s);

    // The comparison that actually answers "should I size up": area, not
    // diagonal. A diagonal is a length and screens are sold by it, which makes
    // every step sound smaller than it is.
    const vs = SIZES.filter((s) => s.d !== d).map((s) => ({
      s, ratio: dims(s.d, main.r).area / base.area,
    }));
    const next = vs.filter((x) => x.s.d > d).sort((a, b) => a.s.d - b.s.d)[0];
    const prev = vs.filter((x) => x.s.d < d).sort((a, b) => b.s.d - a.s.d)[0];

    const FAQ = faq([
      { q: `How wide is a ${label} screen?`,
        a: `A ${label} 16:9 screen is <strong>${n1(base.w)} inches</strong> (${cm(base.w)} cm) wide and ${n1(base.h)} inches (${cm(base.h)} cm) tall. The diagonal alone does not fix the width — a ${label} 4:3 screen is ${n1(dims(d, 4 / 3).w)} inches wide instead.` },
      { q: `What are the dimensions of a ${label} TV in cm?`,
        a: `<strong>${cm(base.w)} × ${cm(base.h)} cm</strong> for the screen itself at 16:9. The cabinet is larger — usually 1 to 3 cm on each side for a modern set, more if it has a bezel — so measure the product rather than the panel when checking whether it fits a space.` },
      { q: `Is a ${label} screen much bigger than a ${prev ? prev.s.d : ''}-inch one?`,
        a: prev
          ? `By area, <strong>${((base.area / dims(prev.s.d, main.r).area - 1) * 100).toFixed(0)}% bigger</strong>. Screens are sold by diagonal, which understates every step: going up ${n1(d - prev.s.d)} inches of diagonal here adds ${((base.area / dims(prev.s.d, main.r).area - 1) * 100).toFixed(0)}% of picture.`
          : `This diagonal is the smallest listed here.` },
      { q: `What resolution should a ${label} screen be?`,
        a: `Pixel density decides that: ${COMMON_RES.map(([w, h, n]) => `${n} gives ${ppi(w, h, d)} PPI`).join(', ')}. Below about 80 PPI a screen looks coarse at desk distance but is fine across a room, which is why televisions and monitors of the same size are sold at different resolutions.` },
    ]);

    pages.push({
      path: `/screen-size/${id}/`,
      title: `${label} Screen Dimensions — ${n1(base.w)} × ${n1(base.h)} inches | Toolman`,
      desc: `A ${label} 16:9 screen measures ${n1(base.w)} × ${n1(base.h)} inches (${cm(base.w)} × ${cm(base.h)} cm). Width and height at every aspect ratio, viewing distance, and pixel density at 1080p, 1440p, 4K and 8K.`,
      h1: `${label} screen dimensions`,
      crumbs: [{ name: 'Screen sizes', path: '/screen-size/' }, { name: label, path: `/screen-size/${id}/` }],
      jsonld: [FAQ.schema],
      body: `<p class="big" style="font-size:1.6rem;margin:.3em 0"><strong>${n1(base.w)} × ${n1(base.h)} inches</strong></p>
<p class="muted">${cm(base.w)} × ${cm(base.h)} cm · ${mm(base.w)} × ${mm(base.h)} mm · 16:9 · ${KIND[kind]} size</p>

<h2>Why the diagonal is not enough</h2>
<p>Screens are advertised by their diagonal, and a diagonal does not determine width until you also know the shape. The same ${label} measurement produces a screen ${n1(dims(d, RATIOS[4].r).w - dims(d, 4 / 3).w)} inches wider at 32:9 than at 4:3. If you are measuring a space, the width is the number that matters.</p>
<table><thead><tr><th>Aspect ratio</th><th>Width</th><th>Height</th><th>Screen area</th></tr></thead><tbody>
${RATIOS.map((rt) => {
        const x = dims(d, rt.r);
        return `<tr${rt.id === '16-9' ? ' style="font-weight:600"' : ''}><td>${rt.label} <span class="muted">— ${rt.note}</span></td><td>${n1(x.w)} in / ${cm(x.w)} cm</td><td>${n1(x.h)} in / ${cm(x.h)} cm</td><td>${Math.round(x.area)} in²</td></tr>`;
      }).join('')}
</tbody></table>

<h2>How it compares by area</h2>
<p>A diagonal is a length, so a step up sounds smaller than it is: ${prev ? `moving from ${prev.s.d}&nbsp;inches to ${d} adds ${n1(d - prev.s.d)}&nbsp;inches of diagonal and <strong>${((base.area / dims(prev.s.d, main.r).area - 1) * 100).toFixed(0)}% more picture</strong>` : `this is the smallest size here`}${next ? `, and the next size up, ${next.s.d}&nbsp;inches, is another ${((dims(next.s.d, main.r).area / base.area - 1) * 100).toFixed(0)}% again` : ''}.</p>
<table><thead><tr><th>Size</th><th>Width</th><th>Screen area</th><th>vs ${label}</th></tr></thead><tbody>
${others.sort((a, b) => a.d - b.d).map((s) => {
        const x = dims(s.d, main.r);
        const pct = (x.area / base.area - 1) * 100;
        return `<tr><td><a href="/screen-size/${String(s.d).replace('.', '-')}-inch/">${s.d} in</a></td><td>${n1(x.w)} in</td><td>${Math.round(x.area)} in²</td><td>${pct >= 0 ? '+' : ''}${pct.toFixed(0)}%</td></tr>`;
      }).join('')}
</tbody></table>

<h2>How far to sit from a ${label} screen</h2>
<p>There are two questions hiding in "how far away", and they have different answers. The <a href="/resolution/">resolution pages</a> answer one — the distance beyond which the pixels merge and a sharper panel stops being visible. This is the other: the distance at which a ${label} screen fills the part of your vision that film and broadcast are mastered for.</p>
<p>The standards state it as a horizontal viewing angle, and the angle comes straight out of the screen's width. At 16:9 a ${label} screen is ${n1(base.w)} inches across:</p>
<table><thead><tr><th>Field of view</th><th>Distance</th><th>What it is</th></tr></thead><tbody>
${[[40, 'THX cinema — filling your vision, the front third of a theatre'], [30, 'SMPTE reference — the broadcast standard, comfortable for a long session'], [20, kind === 'tv' ? 'a large room — at this distance a smaller screen would look the same' : 'a desk distance, the whole screen in focus without moving your head']].map(([deg, why]) => {
  const dist = (base.w / 2) / Math.tan((deg / 2) * Math.PI / 180);
  return `<tr><td>${deg}°</td><td>${+(dist / 12).toFixed(1)} ft <span class="muted">(${+(dist * 2.54 / 100).toFixed(2)} m)</span></td><td>${why}</td></tr>`;
}).join('')}
</tbody></table>
<p>${kind === 'tv'
  ? `The SMPTE figure of ${+(((base.w / 2) / Math.tan(15 * Math.PI / 180)) * 2.54 / 100).toFixed(2)}&nbsp;m is roughly where a sofa sits in an ordinary room, which is the coincidence that makes this size sell. Sitting further back is not wrong — it just means a smaller screen would have looked the same.`
  : `A ${label} panel usually sits on a desk, where the distance is set by your arms rather than by a standard. At arm's length — about 60&nbsp;cm — it subtends roughly <strong>${Math.round(2 * Math.atan((base.w / 2) / (60 / 2.54)) * 180 / Math.PI)} degrees</strong>, which is ${2 * Math.atan((base.w / 2) / (60 / 2.54)) * 180 / Math.PI > 34 ? 'past the broadcast reference and into the range where you turn your head to read the corners' : 'inside the comfortable range, with the whole screen in focus at once'}.`}</p>

<h2>Pixel density at ${label}</h2>
<p>The same resolution is sharp on a small screen and coarse on a large one, because sharpness is pixels per inch and the inches are not in the resolution.</p>
<table><thead><tr><th>Resolution</th><th>Density at ${label}</th><th></th></tr></thead><tbody>
${COMMON_RES.map(([w, h, name]) => {
        const p = ppi(w, h, d);
        const verdict = p >= 200 ? 'Very high — the interface will be scaled' : p >= 130 ? 'Sharp at desk distance' : p >= 90 ? 'Comfortable at desk distance' : p >= 55 ? 'Fine across a room, coarse up close' : 'Television distance only';
        return `<tr><td><a href="/resolution/${w}x${h}/">${name} (${w}×${h})</a></td><td>${p} PPI</td><td class="muted">${verdict}</td></tr>`;
      }).join('')}
</tbody></table>

${FAQ.html}

<p><a href="/screen-size/">All screen sizes</a> · <a href="/resolution/">Screen resolutions</a> · <a href="/paper/">Paper sizes</a></p>`,
    });
  }

  const byKind = {};
  for (const s of SIZES) (byKind[s.kind] ||= []).push(s);

  pages.push({
    path: '/screen-size/',
    title: 'Screen Size Chart — TV and Monitor Dimensions in Inches and cm | Toolman',
    desc: `The width and height of every common screen size from 13 to 98 inches, at 16:9 and four other aspect ratios, with screen area, pixel density and how much bigger each step really is.`,
    h1: 'Screen sizes',
    crumbs: [{ name: 'Screen sizes', path: '/screen-size/' }],
    body: `<p class="muted">${SIZES.length} screen sizes with their real width and height. A diagonal on its own does not tell you how wide a screen is — the shape does the rest.</p>

<h2>The one thing worth knowing</h2>
<p><strong>Screens are sold by diagonal, and area grows with the square of it.</strong> A 65-inch television is not 18% larger than a 55-inch one because 65 is 18% more than 55; it is <strong>${((dims(65, 16 / 9).area / dims(55, 16 / 9).area - 1) * 100).toFixed(0)}% larger</strong> by picture area. That is why every step up feels bigger than the number suggests, and why measuring the width against the space is worth doing before ordering.</p>

${Object.entries(byKind).map(([kind, list]) => `<h2>${KIND[kind]} sizes</h2>
<table><thead><tr><th>Diagonal</th><th>Width (16:9)</th><th>Height</th><th>Width in cm</th><th>Area</th></tr></thead><tbody>
${list.map((s) => {
      const x = dims(s.d, 16 / 9);
      return `<tr><td><a href="/screen-size/${String(s.d).replace('.', '-')}-inch/">${s.d} in</a></td><td>${n1(x.w)} in</td><td>${n1(x.h)} in</td><td>${cm(x.w)} cm</td><td>${Math.round(x.area)} in²</td></tr>`;
    }).join('')}
</tbody></table>`).join('')}

<h2>Working it out yourself</h2>
<p>For a screen of diagonal <code>d</code> and aspect ratio <code>r</code> (16:9 is r&nbsp;=&nbsp;1.778):</p>
<pre><code>width  = d × r / √(r² + 1)
height = width / r</code></pre>
<p>For 16:9 that simplifies to width ≈ 0.8716 × d and height ≈ 0.4903 × d, which is worth remembering: <strong>a 16:9 screen is about seven eighths of its diagonal wide and about half of it tall.</strong></p>

<h2>The diagonal hides how much screen you get</h2>
<p>Two screens of the same diagonal in different shapes are not the same size. A 32-inch 4:3 monitor has <strong>${sq43} square inches</strong> of picture; a 32-inch 16:9 has <strong>${sq169}</strong>, which is ${pct43}% less. A 32-inch 21:9 ultrawide has ${sq219}, less again.</p>
<p>The reason is geometric: for a fixed diagonal, area is largest when the shape is closest to square, and every step towards widescreen trades area away. This is why a 24-inch monitor replacing an old 19-inch 4:3 feels like less of an upgrade than the numbers promise, and why the switch to 16:9 was a saving for manufacturers before it was a feature for anyone.</p>

<h2>What the inches are measured across</h2>
<p>The number is the diagonal of the <em>panel</em>, corner to corner, and it does not include the bezel or the frame. A 55-inch television is ${w55} inches wide as a picture and typically an inch or two wider as an object, which matters for a recess or a cabinet and not for anything else.</p>
<p>Mounting needs more than the width. Allow for the bracket's depth, for cables leaving the back, and for the screen being roughly ${h55} inches tall before any stand. Manufacturers publish the "with stand" and "without stand" dimensions separately because the two differ by more than people expect.</p>

<p><a href="/resolution/">Screen resolutions</a> — the pixel side of the same question. <a href="/nominal/">Nominal sizes in six trades</a> — why a 21:9 panel is not 21:9. <a href="/paper/">Paper sizes</a> — the same reference for print.</p>`,
  });

  return pages;
}
