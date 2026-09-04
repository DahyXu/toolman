import { esc, faq } from '../layout.mjs';

// A finite reference namespace, which is the kind that earns its keep: the paper
// section produces roughly seventy times more search queries per page than the
// parametrised converters do, because there are only so many paper sizes and
// only so many display resolutions, and people look both up constantly.
//
// Every number on a generated page below is computed from the width and height —
// aspect ratio, pixel count, pixel density at a given diagonal, the multiple of
// 1080p. The prose note is the only thing written by hand, and it is the only
// thing that cannot be derived.
const R = [
  [640, 480, 'VGA', 'legacy', 'The IBM VGA standard of 1987 and the resolution every fallback mode still assumes. It survives as the size of a webcam stream and the smallest layout anyone tests.'],
  [800, 600, 'SVGA', 'legacy', 'The step past VGA, and for most of the 1990s the resolution a web page was designed for. Projectors still list it as a native mode.'],
  [1024, 768, 'XGA', 'legacy', 'The last resolution that could be assumed. A generation of sites were built to fit 1024 wide, which is why 960 and 970 pixel grid widths persist in CSS frameworks long after the screens went away.'],
  [1280, 720, 'HD (720p)', 'tv', 'The lower of the two original HDTV formats and the floor for anything described as high definition. It is still a common upload resolution because it encodes cheaply: a ninth of the pixels of 4K, and 44% of a 1080p frame.'],
  [1280, 800, 'WXGA', 'laptop', 'A 16:10 laptop panel, common before 16:9 took over and now returning on machines that market vertical space for code and documents.'],
  [1280, 1024, 'SXGA', 'legacy', 'The odd one out: 5:4 rather than 4:3, so a circle drawn on a 1280×1024 panel set to 4:3 output comes out an ellipse. It was the standard 17-inch and 19-inch office monitor for a decade.'],
  [1366, 768, 'HD (laptop)', 'laptop', 'For years the most common laptop panel in the world, and still one of the most common resolutions in web analytics. It is not quite 16:9 — 1366/768 is 1.779, not 1.778 — because 1365.33 is not a whole number of pixels.'],
  [1440, 900, 'WXGA+', 'laptop', 'A 16:10 panel from the era when that ratio was standard on laptops and mid-range monitors.'],
  [1600, 900, 'HD+', 'laptop', 'Exactly half the linear size of 3200×1800. Against 1920×1080 it is 83% of the width and 83% of the height, so a budget laptop at this resolution shows about a third fewer pixels than a Full HD one of the same size.'],
  [1600, 1200, 'UXGA', 'legacy', 'The 4:3 high end before widescreen: four times the area of 800×600 and the resolution most CRT monitors topped out at.'],
  [1680, 1050, 'WSXGA+', 'legacy', 'A 16:10 monitor size, typically 22 inches, from the period when 16:10 and 16:9 were still competing.'],
  [1920, 1080, 'Full HD (1080p)', 'tv', 'The most common display resolution in the world and the reference every other one is described against. It is the broadcast HD standard, the default for video, and the resolution most web design is checked at first.'],
  [1920, 1200, 'WUXGA', 'laptop', 'Full HD with 120 more rows — the 16:10 version, which returns 11% more vertical space for the same width. On a laptop that is roughly four extra lines of code.'],
  [2048, 1080, 'DCI 2K', 'cinema', 'The Digital Cinema Initiatives 2K container. Note it is wider and shorter in ratio than 1080p: cinema formats are specified by container width, which is why a DCI master does not match a consumer 1080p frame.'],
  [2560, 1080, 'UW-FHD', 'ultrawide', 'The entry ultrawide: 1080p with 640 extra columns, a 21:9 panel. It shows the same vertical extent as Full HD, so it adds width rather than height — useful for timelines and side-by-side editors, useless for long documents.'],
  [2560, 1440, 'QHD (1440p)', 'monitor', 'Four times the pixels of 720p and the resolution that has become the desktop default, because at 27 inches it lands near 109 PPI — sharp enough without needing display scaling, which 4K at that size does.'],
  [2560, 1600, 'WQXGA', 'laptop', 'The 16:10 counterpart to 1440p, common on larger laptops and on monitors aimed at design work.'],
  [2880, 1800, 'Retina 15-inch', 'laptop', 'Exactly twice 1440×900 in each direction, which is the whole idea: four physical pixels per logical one, so an interface drawn for the older size renders identically and four times as finely.'],
  [3200, 1800, 'QHD+', 'laptop', 'Twice 1600×900 in each direction. A high-density laptop panel that runs scaled rather than at native size.'],
  [3440, 1440, 'UWQHD', 'ultrawide', 'The common 34-inch ultrawide: 1440p with 880 extra columns. The ratio is 43:18, close to but not exactly 21:9, which is why 21:9 video letterboxes very slightly on it.'],
  [3840, 1080, 'DFHD', 'ultrawide', 'Two 1080p displays side by side in one panel, a 32:9 super-ultrawide. Window management matters more than pixel count at this shape — almost nothing is designed to be read across 3840 unbroken columns.'],
  [3840, 1600, 'UWQHD+', 'ultrawide', 'A 24:10 ultrawide, taller than 3440×1440 and the same width as 4K. It is the ultrawide that does not lose vertical space against a 1440p monitor.'],
  [3840, 2160, '4K UHD (2160p)', 'tv', 'Exactly four 1080p frames in a two-by-two grid, which is why 1080p content upscales to it without interpolation artefacts at integer scaling. It is the consumer 4K, distinct from the cinema one.'],
  [4096, 2160, 'DCI 4K', 'cinema', 'The cinema 4K container, 256 columns wider than UHD. Almost every "4K" consumer device means 3840×2160; almost every cinema deliverable means this.'],
  [5120, 1440, 'DQHD', 'ultrawide', 'Two 1440p displays in one 32:9 panel, the super-ultrawide equivalent of DFHD a generation on.'],
  [5120, 2880, '5K', 'monitor', 'Exactly twice 2560×1440 in each direction, which makes it the density that renders a 1440p interface at perfect 2× scaling. That is the reason it exists at 27 inches rather than as a marketing step past 4K.'],
  [6016, 3384, '6K', 'monitor', 'A reference-monitor resolution, 16:9, aimed at video work where a 4K timeline needs to sit inside a frame with the interface around it.'],
  [7680, 4320, '8K UHD', 'tv', 'Sixteen 1080p frames, four 4K frames. At normal viewing distances the resolution exceeds what the eye resolves on any television that fits in a house, which is why the format has stalled at the display end and never arrived at the content end.'],
  [1080, 2400, 'FHD+ phone', 'phone', 'A tall 20:9 phone panel. Phone resolutions are quoted portrait, and their ratios have grown steadily taller — 16:9 gave way to 18:9, then 19.5:9 and 20:9 — which is why an older video leaves black bars down both sides.'],
  [1170, 2532, 'Phone 19.5:9', 'phone', 'A 19.5:9 phone panel at roughly 460 PPI. At that density the individual pixel is well below what the eye resolves at reading distance, so the number stopped being a selling point and the panel technology took over.'],
  [1284, 2778, 'Phone large 19.5:9', 'phone', 'The larger 19.5:9 phone panel, the same shape as 1170×2532 with about 20% more pixels.'],
  [1440, 3200, 'QHD+ phone', 'phone', 'A high-end 20:9 phone panel. Most ship configured to render at a lower resolution by default, because the battery cost of driving every pixel outweighs a difference few people can see.'],
  [2048, 1536, 'Tablet 4:3', 'tablet', 'Twice 1024×768 in each direction, which is why an interface drawn for the older tablet renders on it unchanged at 2× scaling. Tablets kept 4:3 while phones and laptops went wide, because a page of text and a photograph both fit it better than 16:9 does.'],
  [2360, 1640, 'Tablet 10.9-inch', 'tablet', 'A modern tablet panel at roughly 3:2, between the old 4:3 and a laptop 16:10.'],
  [2732, 2048, 'Tablet 12.9-inch', 'tablet', 'The large 4:3 tablet panel, and one of the highest-density displays sold at that size. Its 5.6 megapixels are more than a 1440p monitor carries, on a screen a fifth the area.'],
  [3024, 1964, 'Laptop 14-inch HiDPI', 'laptop', 'A modern high-density laptop panel. The unusual height comes from the rows behind the camera housing being addressable, so the usable 16:10 area is shorter than the full framebuffer.'],
];

const gcd = (a, b) => (b ? gcd(b, a % b) : a);
const DIAGS = [13.3, 15.6, 24, 27, 32];

function ratio(w, h) {
  // Always reduce the long side against the short one. Phone resolutions are
  // quoted portrait and their ratios are named the same way — a 1080×2400 panel
  // is "20:9", not "9:20" — so dividing width by height compared a portrait
  // panel's 0.45 against a landscape 16:9's 1.78 and matched nothing sensible.
  const long = Math.max(w, h), short = Math.min(w, h);
  const g = gcd(long, short);
  const a = long / g, b = short / g;
  // 43:18 is a real reduction and 3440×1440 really is that shape. 683:384 is a
  // true reduction too and tells nobody anything, so only the unreadable ones
  // fall back to the nearest standard shape.
  if (a <= 100 && b <= 100) return { text: `${a}:${b}`, exact: true };
  const COMMON = [[16, 9], [16, 10], [4, 3], [5, 4], [3, 2], [21, 9], [32, 9], [20, 9], [19.5, 9], [24, 10], [256, 135]];
  let best = COMMON[0], bestErr = Infinity;
  for (const [x, y] of COMMON) {
    const err = Math.abs(x / y - long / short);
    if (err < bestErr) { bestErr = err; best = [x, y]; }
  }
  return { text: `${best[0]}:${best[1]}`, exact: false };
}

const ppi = (w, h, diag) => Math.round(Math.sqrt(w * w + h * h) / diag);
const nf = (n) => n.toLocaleString('en-US');

export default async function () {
  // The visual-acuity arithmetic the hub prints, computed rather than typed.
  // One arcminute is the standard limit for normal vision; it is the same
  // calculation behind every "how far should I sit" chart.
  const ARCMIN_RAD = (1 / 60) * (Math.PI / 180);
  const tvDiagIn = 55;
  const tvDistM = 3;
  // 16:9 diagonal to height: h = diag * 9 / sqrt(16^2 + 9^2)
  const tvHeightMm = (tvDiagIn * 25.4 * 9) / Math.sqrt(16 * 16 + 9 * 9);
  const tvHeightCm = Math.round(tvHeightMm / 10);
  const arcMm = Math.round(tvDistM * 1000 * Math.tan(ARCMIN_RAD) * 1000) / 1000;
  const resolvable = Math.round(tvHeightMm / (tvDistM * 1000 * Math.tan(ARCMIN_RAD)));
  // The distance at which 2160 lines are exactly resolvable.
  const fourKDistM = Math.round((tvHeightMm / 2160 / Math.tan(ARCMIN_RAD)) / 1000 * 10) / 10;

  if (resolvable >= 1080) {
    console.error(`\n\u2717 resolution hub: says 4K is invisible at ${tvDistM} m but computes ${resolvable} resolvable lines, which is not below 1080`);
    process.exitCode = 1;
  }
  if (!(fourKDistM > 0 && fourKDistM < tvDistM)) {
    console.error(`\n\u2717 resolution hub: 2160 lines resolve at ${fourKDistM} m, which is not closer than the ${tvDistM} m it is compared with`);
    process.exitCode = 1;
  }
  if (Math.abs(tvHeightMm - 685) > 5) {
    console.error(`\n\u2717 resolution hub: a 55-inch 16:9 screen computes ${Math.round(tvHeightMm)} mm tall, which is not the published 685`);
    process.exitCode = 1;
  }

  const pages = [];
  const CATS = {
    tv: 'Broadcast and TV', monitor: 'Desktop monitor', laptop: 'Laptop', ultrawide: 'Ultrawide',
    phone: 'Phone', tablet: 'Tablet', cinema: 'Digital cinema', legacy: 'Legacy',
  };

  for (const [w, h, name, cat, note] of R) {
    const id = `${w}x${h}`;
    const r = ratio(w, h);
    const px = w * h;
    const mp = px / 1e6;
    const vs1080 = px / (1920 * 1080);
    const portrait = h > w;

    const siblings = R.filter((x) => x[3] === cat && `${x[0]}x${x[1]}` !== id);
    const nearest = R.filter((x) => `${x[0]}x${x[1]}` !== id)
      .map((x) => ({ x, d: Math.abs(x[0] * x[1] - px) }))
      .sort((a, b) => a.d - b.d).slice(0, 8).map((o) => o.x);

    const FAQ = faq([
      { q: `What is the aspect ratio of ${id}?`,
        a: `<strong>${r.text}</strong>${r.exact ? '' : ' — approximately. ' + w + '×' + h + ' does not reduce to a tidy ratio, so it is very slightly off the standard shape'}.` },
      { q: `How many pixels is ${id}?`,
        a: `${nf(px)} pixels, or <strong>${mp.toFixed(2)} megapixels</strong>.` },
      { q: `Is ${id} higher resolution than 1080p?`,
        a: px === 1920 * 1080
          ? `${id} <em>is</em> 1080p — 1920×1080, the Full HD standard.`
          : `${id} has ${vs1080 >= 1 ? `<strong>${vs1080.toFixed(2)}×</strong> as many pixels as` : `<strong>${(vs1080 * 100).toFixed(0)}%</strong> of the pixels of`} a 1920×1080 frame.` },
      { q: `What size screen suits ${id}?`,
        a: `Pixel density is what decides that. ${DIAGS.map((d) => `${ppi(w, h, d)} PPI at ${d}&nbsp;in`).join(', ')}. Below roughly 110&nbsp;PPI text starts to look coarse; above about 200 the operating system will usually scale the interface rather than render it at native size.` },
    ]);

    pages.push({
      path: `/resolution/${id}/`,
      title: `${id} — ${name}, ${r.text} aspect ratio | Toolman`,
      desc: `${id} (${name}) is a ${r.text}${r.exact ? '' : ' approximately'} display resolution with ${nf(px)} pixels. Aspect ratio, megapixels, pixel density at common screen sizes and how it compares with 1080p and 4K.`,
      h1: `${id} resolution`,
      crumbs: [{ name: 'Screen resolutions', path: '/resolution/' }, { name: id, path: `/resolution/${id}/` }],
      jsonld: [FAQ.schema],
      body: `<p class="big" style="font-size:1.6rem;margin:.3em 0"><strong>${w} × ${h}</strong></p>
<p class="muted">${esc(name)} · ${r.text}${r.exact ? '' : ' (approximately)'} · ${nf(px)} pixels · ${mp.toFixed(2)} megapixels · ${CATS[cat]}${portrait ? ' · quoted portrait' : ''}</p>

<h2>What ${id} is</h2>
<p>${note}</p>

<h2>The numbers</h2>
<table><tbody>
<tr><td>Width</td><td>${nf(w)} px</td></tr>
<tr><td>Height</td><td>${nf(h)} px</td></tr>
<tr><td>Aspect ratio</td><td>${r.text}${r.exact ? '' : ' <span class="muted">(nearest — the exact reduction is not a standard shape)</span>'}</td></tr>
<tr><td>Total pixels</td><td>${nf(px)}</td></tr>
<tr><td>Megapixels</td><td>${mp.toFixed(2)} MP</td></tr>
<tr><td>Compared with 1080p</td><td>${px === 1920 * 1080 ? 'this is 1080p' : `${vs1080.toFixed(2)}× the pixels`}</td></tr>
<tr><td>Compared with 4K UHD</td><td>${px === 3840 * 2160 ? 'this is 4K UHD' : `${(px / (3840 * 2160)).toFixed(2)}× the pixels`}</td></tr>
</tbody></table>

<h2>Pixel density at common screen sizes</h2>
<p>A resolution on its own says nothing about sharpness — the same ${id} panel is dense on a laptop and coarse on a television. Density is the diagonal in pixels divided by the diagonal in inches.</p>
<table><thead><tr><th>Diagonal</th><th>Pixel density</th><th></th></tr></thead><tbody>
${DIAGS.map((d) => {
        const p = ppi(w, h, d);
        const verdict = p >= 200 ? 'High density — the OS will scale the interface' : p >= 140 ? 'Sharp' : p >= 105 ? 'Comfortable at native size' : 'Coarse — individual pixels are visible at desk distance';
        return `<tr><td>${d} in</td><td>${p} PPI</td><td class="muted">${verdict}</td></tr>`;
      }).join('')}
</tbody></table>

${siblings.length ? `<h2>Other ${CATS[cat].toLowerCase()} resolutions</h2>
<table><thead><tr><th>Resolution</th><th>Name</th><th>Ratio</th><th>Megapixels</th></tr></thead><tbody>
${siblings.map(([x, y, n2]) => `<tr><td><a href="/resolution/${x}x${y}/">${x}×${y}</a></td><td>${esc(n2)}</td><td>${ratio(x, y).text}</td><td>${((x * y) / 1e6).toFixed(2)} MP</td></tr>`).join('')}
</tbody></table>` : ''}

<h2>Closest in total pixels</h2>
<ul class="linklist">${nearest.map(([x, y, n2]) => `<li><a href="/resolution/${x}x${y}/">${x}×${y}</a> — ${esc(n2)}</li>`).join('')}</ul>

${FAQ.html}

<p><a href="/resolution/">All screen resolutions</a> · <a href="/paper/">Paper sizes in pixels</a></p>`,
    });
  }

  const byCat = {};
  for (const row of R) (byCat[row[3]] ||= []).push(row);

  pages.push({
    path: '/resolution/',
    title: 'Screen Resolutions — Aspect Ratios, Pixel Counts and Density | Toolman',
    desc: `Every common display resolution from VGA to 8K: aspect ratio, total pixels, megapixels and pixel density at ${DIAGS.length} screen sizes, with how each compares to 1080p and 4K.`,
    h1: 'Screen resolutions',
    crumbs: [{ name: 'Screen resolutions', path: '/resolution/' }],
    body: `<p class="muted">${R.length} display resolutions, each with its aspect ratio, pixel count and the density it produces on screens from 13 to 32 inches.</p>
<h2>How to read a resolution</h2>
<p>A resolution is a pixel count, not a measure of sharpness. <strong>1920×1080 is dense on a 13-inch laptop and coarse on a 32-inch monitor</strong>, because sharpness is pixels per inch and the inches are not in the number. The other thing the number hides is shape: 1366×768 and 1920×1080 are both sold as 16:9 and only one of them is, which is why a full-screen video on the first is very slightly letterboxed.</p>
<h2>4K is two different numbers, and 2K is worse</h2>
<p>DCI 4K, the cinema standard, is <strong>4096×2160</strong>. Every television and monitor sold as 4K is <strong>3840×2160</strong> — twice 1920×1080 on each axis — which has its own name, UHD, that almost nobody uses. The two differ by 256 pixels of width, which is why cinema masters get cropped or pillarboxed on the way to a home screen.</p>
<p>"2K" is used more loosely still. In cinema it means 2048×1080, the half of DCI 4K. In monitor marketing it usually means 2560×1440, which is not half of anything 4K and is properly called QHD or 1440p. If a specification says 2K without a pixel count, it has not told you the resolution.</p>
<p>The pattern is that the cinema names count horizontal pixels in thousands and the consumer names count vertical lines — 1080p, 1440p, 2160p. Mixing the two conventions in one sentence is where most of the confusion comes from.</p>

<h2>When more pixels stop being visible</h2>
<p>Sharpness has a ceiling set by the eye rather than the panel. Normal vision resolves about one arcminute, so at a viewing distance <em>d</em> the smallest detail that can be told apart is <em>d</em> × tan(1/60°), and dividing the screen height by that gives the most lines anyone can actually distinguish.</p>
<p>For a 55-inch 16:9 television, which is ${tvHeightCm} cm tall, at a normal living-room ${tvDistM} m:</p>
<pre><code>one arcminute at ${tvDistM} m   = ${arcMm} mm
screen height             = ${Math.round(tvHeightMm)} mm
resolvable lines          = ${resolvable}</code></pre>
<p>That is fewer than the 1080 lines of a 1080p picture, and a long way short of 2160. <strong>On a 55-inch screen at ${tvDistM} m, 4K is invisible</strong> — not subtle, not marginal, below the resolution of the eye. It becomes visible by sitting closer or buying a larger screen, and the distance at which 2160 lines start to pay is about ${fourKDistM} m for this size.</p>
<p>None of which makes 4K panels a waste: they are what is manufactured, they come with better contrast and colour, and a monitor at desk distance is a completely different calculation. But the pixel count is the wrong thing to shop on from a sofa.</p>

${Object.entries(byCat).map(([cat, rows]) => `<h2>${CATS[cat]}</h2>
<table><thead><tr><th>Resolution</th><th>Name</th><th>Ratio</th><th>Megapixels</th><th>vs 1080p</th></tr></thead><tbody>
${rows.map(([w, h, n]) => `<tr><td><a href="/resolution/${w}x${h}/">${w}×${h}</a></td><td>${esc(n)}</td><td>${ratio(w, h).text}</td><td>${((w * h) / 1e6).toFixed(2)} MP</td><td>${((w * h) / (1920 * 1080)).toFixed(2)}×</td></tr>`).join('')}
</tbody></table>`).join('')}
<p><a href="/paper/">Paper sizes</a> — the same reference for print, including pixel dimensions at print resolutions.</p>`,
  });

  return pages;
}
