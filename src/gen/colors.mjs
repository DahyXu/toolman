import { esc, faq } from '../layout.mjs';

// 148 CSS named colors — the canonical list every browser ships.
const NAMED = {
  aliceblue: 'f0f8ff', antiquewhite: 'faebd7', aqua: '00ffff', aquamarine: '7fffd4', azure: 'f0ffff',
  beige: 'f5f5dc', bisque: 'ffe4c4', black: '000000', blanchedalmond: 'ffebcd', blue: '0000ff',
  blueviolet: '8a2be2', brown: 'a52a2a', burlywood: 'deb887', cadetblue: '5f9ea0', chartreuse: '7fff00',
  chocolate: 'd2691e', coral: 'ff7f50', cornflowerblue: '6495ed', cornsilk: 'fff8dc', crimson: 'dc143c',
  cyan: '00ffff', darkblue: '00008b', darkcyan: '008b8b', darkgoldenrod: 'b8860b', darkgray: 'a9a9a9',
  darkgreen: '006400', darkkhaki: 'bdb76b', darkmagenta: '8b008b', darkolivegreen: '556b2f',
  darkorange: 'ff8c00', darkorchid: '9932cc', darkred: '8b0000', darksalmon: 'e9967a',
  darkseagreen: '8fbc8f', darkslateblue: '483d8b', darkslategray: '2f4f4f', darkturquoise: '00ced1',
  darkviolet: '9400d3', deeppink: 'ff1493', deepskyblue: '00bfff', dimgray: '696969', dodgerblue: '1e90ff',
  firebrick: 'b22222', floralwhite: 'fffaf0', forestgreen: '228b22', fuchsia: 'ff00ff', gainsboro: 'dcdcdc',
  ghostwhite: 'f8f8ff', gold: 'ffd700', goldenrod: 'daa520', gray: '808080', green: '008000',
  greenyellow: 'adff2f', honeydew: 'f0fff0', hotpink: 'ff69b4', indianred: 'cd5c5c', indigo: '4b0082',
  ivory: 'fffff0', khaki: 'f0e68c', lavender: 'e6e6fa', lavenderblush: 'fff0f5', lawngreen: '7cfc00',
  lemonchiffon: 'fffacd', lightblue: 'add8e6', lightcoral: 'f08080', lightcyan: 'e0ffff',
  lightgoldenrodyellow: 'fafad2', lightgray: 'd3d3d3', lightgreen: '90ee90', lightpink: 'ffb6c1',
  lightsalmon: 'ffa07a', lightseagreen: '20b2aa', lightskyblue: '87cefa', lightslategray: '778899',
  lightsteelblue: 'b0c4de', lightyellow: 'ffffe0', lime: '00ff00', limegreen: '32cd32', linen: 'faf0e6',
  magenta: 'ff00ff', maroon: '800000', mediumaquamarine: '66cdaa', mediumblue: '0000cd',
  mediumorchid: 'ba55d3', mediumpurple: '9370db', mediumseagreen: '3cb371', mediumslateblue: '7b68ee',
  mediumspringgreen: '00fa9a', mediumturquoise: '48d1cc', mediumvioletred: 'c71585', midnightblue: '191970',
  mintcream: 'f5fffa', mistyrose: 'ffe4e1', moccasin: 'ffe4b5', navajowhite: 'ffdead', navy: '000080',
  oldlace: 'fdf5e6', olive: '808000', olivedrab: '6b8e23', orange: 'ffa500', orangered: 'ff4500',
  orchid: 'da70d6', palegoldenrod: 'eee8aa', palegreen: '98fb98', paleturquoise: 'afeeee',
  palevioletred: 'db7093', papayawhip: 'ffefd5', peachpuff: 'ffdab9', peru: 'cd853f', pink: 'ffc0cb',
  plum: 'dda0dd', powderblue: 'b0e0e6', purple: '800080', rebeccapurple: '663399', red: 'ff0000',
  rosybrown: 'bc8f8f', royalblue: '4169e1', saddlebrown: '8b4513', salmon: 'fa8072', sandybrown: 'f4a460',
  seagreen: '2e8b57', seashell: 'fff5ee', sienna: 'a0522d', silver: 'c0c0c0', skyblue: '87ceeb',
  slateblue: '6a5acd', slategray: '708090', snow: 'fffafa', springgreen: '00ff7f', steelblue: '4682b4',
  tan: 'd2b48c', teal: '008080', thistle: 'd8bfd8', tomato: 'ff6347', turquoise: '40e0d0',
  violet: 'ee82ee', wheat: 'f5deb3', white: 'ffffff', whitesmoke: 'f5f5f5', yellow: 'ffff00',
  yellowgreen: '9acd32',
};

const HUE_NAMES = [
  [15, 'red'], [45, 'orange'], [70, 'yellow'], [100, 'yellow-green'], [160, 'green'],
  [190, 'cyan'], [250, 'blue'], [290, 'violet'], [330, 'magenta'], [360, 'red'],
];

const hex2rgb = (h) => ({ r: parseInt(h.slice(0, 2), 16), g: parseInt(h.slice(2, 4), 16), b: parseInt(h.slice(4, 6), 16) });
const rgb2hex = (r, g, b) =>
  [r, g, b].map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('');

function rgb2hsl(r, g, b) {
  r /= 255; g /= 255; b /= 255;
  const mx = Math.max(r, g, b), mn = Math.min(r, g, b), d = mx - mn, l = (mx + mn) / 2;
  let h = 0, s = 0;
  if (d) {
    s = d / (1 - Math.abs(2 * l - 1));
    h = mx === r ? 60 * (((g - b) / d) % 6) : mx === g ? 60 * ((b - r) / d + 2) : 60 * ((r - g) / d + 4);
  }
  return { h: Math.round(((h % 360) + 360) % 360), s: Math.round(s * 100), l: Math.round(l * 100) };
}
function hsl2rgb(h, s, l) {
  h = ((h % 360) + 360) % 360; s /= 100; l /= 100;
  const c = (1 - Math.abs(2 * l - 1)) * s, x = c * (1 - Math.abs((h / 60) % 2 - 1)), m = l - c / 2;
  let r, g, b;
  if (h < 60) [r, g, b] = [c, x, 0]; else if (h < 120) [r, g, b] = [x, c, 0];
  else if (h < 180) [r, g, b] = [0, c, x]; else if (h < 240) [r, g, b] = [0, x, c];
  else if (h < 300) [r, g, b] = [x, 0, c]; else [r, g, b] = [c, 0, x];
  return { r: (r + m) * 255, g: (g + m) * 255, b: (b + m) * 255 };
}
function rgb2cmyk(r, g, b) {
  r /= 255; g /= 255; b /= 255;
  const k = 1 - Math.max(r, g, b);
  if (k === 1) return { c: 0, m: 0, y: 0, k: 100 };
  return {
    c: Math.round(((1 - r - k) / (1 - k)) * 100), m: Math.round(((1 - g - k) / (1 - k)) * 100),
    y: Math.round(((1 - b - k) / (1 - k)) * 100), k: Math.round(k * 100),
  };
}
function lum({ r, g, b }) {
  const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); };
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
}
const contrast = (a, b) => {
  const l1 = lum(a), l2 = lum(b);
  return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
};
function hueName(h, s, l) {
  if (s < 8) {
    if (l >= 100) return 'pure white';
    if (l <= 0) return 'pure black';
    return l > 90 ? 'near-white grey' : l < 10 ? 'near-black grey' : 'grey';
  }
  for (const [max, name] of HUE_NAMES) if (h <= max) return name;
  return 'red';
}
const lightName = (l) => (l < 20 ? 'very dark' : l < 40 ? 'dark' : l < 60 ? 'medium' : l < 80 ? 'light' : 'very light');
const satName = (s) => (s < 10 ? 'desaturated' : s < 35 ? 'muted' : s < 65 ? 'moderately saturated' : 'vivid');

function nearestNamed(hex) {
  const c = hex2rgb(hex);
  let best = null, bd = Infinity;
  for (const [n, h] of Object.entries(NAMED)) {
    const o = hex2rgb(h);
    const d = (c.r - o.r) ** 2 * 0.3 + (c.g - o.g) ** 2 * 0.59 + (c.b - o.b) ** 2 * 0.11;
    if (d < bd) { bd = d; best = { name: n, hex: h, exact: d === 0 }; }
  }
  return best;
}

// Pages exist only for the seed colors. A swatch links out only when the
// target page actually exists; everything else renders as a plain swatch, so
// crawlers never meet a dead link.
let EXISTS = new Set();

function swatchRow(list) {
  return `<div style="display:flex;flex-wrap:wrap;gap:8px;margin:14px 0">${list
    .map((c) => {
      const inner = `<div style="height:56px;border-radius:9px;border:1px solid var(--line);background:#${c.hex}"></div><small class="muted" style="font-family:var(--mono);font-size:.72rem">${c.label || '#' + c.hex.toUpperCase()}</small>`;
      return EXISTS.has(c.hex)
        ? `<a href="/color/${c.hex}/" style="flex:1;min-width:88px;text-decoration:none">${inner}</a>`
        : `<div style="flex:1;min-width:88px">${inner}</div>`;
    })
    .join('')}</div>`;
}

function colorPage(hex, name) {
  const rgb = hex2rgb(hex);
  const hsl = rgb2hsl(rgb.r, rgb.g, rgb.b);
  const cmyk = rgb2cmyk(rgb.r, rgb.g, rgb.b);
  const near = nearestNamed(hex);
  const H = '#' + hex.toUpperCase();
  const cw = contrast(rgb, { r: 255, g: 255, b: 255 });
  const cb = contrast(rgb, { r: 0, g: 0, b: 0 });
  const family = hueName(hsl.h, hsl.s, hsl.l);
  const article = (d) => (d.startsWith('pure ') ? '' : 'a ');
  const desc = family === 'pure white' || family === 'pure black'
    ? family
    : `${lightName(hsl.l)}, ${satName(hsl.s)} ${family}`;

  const shades = [95, 85, 75, 65, 55, 45, 35, 25, 15].map((l) => {
    const c = hsl2rgb(hsl.h, hsl.s, l);
    return { hex: rgb2hex(c.r, c.g, c.b), label: l + '%' };
  });
  const harmony = [
    ['Complementary', (hsl.h + 180) % 360],
    ['Triadic +120°', (hsl.h + 120) % 360],
    ['Triadic +240°', (hsl.h + 240) % 360],
    ['Analogous −30°', (hsl.h + 330) % 360],
    ['Analogous +30°', (hsl.h + 30) % 360],
    ['Split −150°', (hsl.h + 210) % 360],
    ['Split +150°', (hsl.h + 150) % 360],
  ].map(([label, h]) => {
    const c = hsl2rgb(h, hsl.s, hsl.l);
    return { hex: rgb2hex(c.r, c.g, c.b), label };
  });

  const title = name
    ? `${name.charAt(0).toUpperCase() + name.slice(1)} Color — ${H} Hex, RGB & HSL | Toolman`
    : `${H} Hex Color — RGB, HSL, CMYK & Shades | Toolman`;

  const FAQ = faq([
    { q: `What color is ${H}?`,
      a: `${H} is ${article(desc)}${desc}${near.exact ? `, which CSS calls <code>${near.name}</code>` : ''}. Its hue sits at ${hsl.h}° on the color wheel, with ${hsl.s}% saturation and ${hsl.l}% lightness.` },
    { q: `What is ${H} in RGB?`,
      a: `${H} converts to <strong>rgb(${rgb.r}, ${rgb.g}, ${rgb.b})</strong> — ${rgb.r} red, ${rgb.g} green and ${rgb.b} blue.` },
    { q: `What is ${H} in CMYK?`,
      a: `Approximately <strong>cmyk(${cmyk.c}%, ${cmyk.m}%, ${cmyk.y}%, ${cmyk.k}%)</strong>. Print output depends on the ICC profile of the press and paper, so treat this as a starting point rather than an exact match.` },
    { q: `Should text on ${H} be white or black?`,
      a: `<strong>${cw > cb ? 'White' : 'Black'}</strong> gives the better contrast ratio (${Math.max(cw, cb).toFixed(2)}:1 versus ${Math.min(cw, cb).toFixed(2)}:1).` },
    { q: `What is the complementary color of ${H}?`,
      a: `${EXISTS.has(harmony[0].hex) ? `<a href="/color/${harmony[0].hex}/">#${harmony[0].hex.toUpperCase()}</a>` : `<strong>#${harmony[0].hex.toUpperCase()}</strong>`} — the hue directly opposite ${H} on the color wheel.` },
  ]);

  const badge = (r, need) => (r >= need ? '<span class="ok">pass</span>' : '<span class="err">fail</span>');

  return {
    path: `/color/${hex}/`,
    title,
    desc: `${H} is ${article(desc)}${desc}. Its RGB is (${rgb.r}, ${rgb.g}, ${rgb.b}). See HSL, CMYK, WCAG contrast, tints, shades and a matching palette.`,
    h1: name ? `${name.charAt(0).toUpperCase() + name.slice(1)} — ${H}` : `${H} color`,
    crumbs: [{ name: 'Colors', path: '/color/' }, { name: H, path: `/color/${hex}/` }],
    jsonld: [FAQ.schema],
    body: `<div style="height:150px;border-radius:14px;border:1px solid var(--line);background:${H};display:flex;align-items:center;justify-content:center;gap:20px">
  <span style="color:#fff;font:600 20px var(--mono)">${H}</span><span style="color:#000;font:600 20px var(--mono)">${H}</span>
</div>
<p class="muted">${H} is a <strong>${desc}</strong>${near.exact ? `. It is the CSS named color <strong>${near.name}</strong>` : `, closest to the CSS named color <a href="/color/${near.hex}/">${near.name}</a> (#${near.hex.toUpperCase()})`}.</p>

<h2>Color values</h2>
<table><tbody>
<tr><td>HEX</td><td class="out">${H}</td></tr>
<tr><td>RGB</td><td class="out">rgb(${rgb.r}, ${rgb.g}, ${rgb.b})</td></tr>
<tr><td>HSL</td><td class="out">hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)</td></tr>
<tr><td>CMYK</td><td class="out">cmyk(${cmyk.c}%, ${cmyk.m}%, ${cmyk.y}%, ${cmyk.k}%)</td></tr>
<tr><td>Decimal</td><td class="out">${(rgb.r << 16) | (rgb.g << 8) | rgb.b}</td></tr>
<tr><td>CSS</td><td class="out">color: ${H};</td></tr>
<tr><td>Android</td><td class="out">0xFF${hex.toUpperCase()}</td></tr>
<tr><td>Swift</td><td class="out">UIColor(red: ${(rgb.r / 255).toFixed(3)}, green: ${(rgb.g / 255).toFixed(3)}, blue: ${(rgb.b / 255).toFixed(3)}, alpha: 1)</td></tr>
</tbody></table>

<h2>Accessibility and contrast</h2>
<table><tbody>
<tr><td>White text on ${H}</td><td><strong>${cw.toFixed(2)}:1</strong> — AA ${badge(cw, 4.5)} · AA large ${badge(cw, 3)} · AAA ${badge(cw, 7)}</td></tr>
<tr><td>Black text on ${H}</td><td><strong>${cb.toFixed(2)}:1</strong> — AA ${badge(cb, 4.5)} · AA large ${badge(cb, 3)} · AAA ${badge(cb, 7)}</td></tr>
<tr><td>Recommended text color</td><td><strong>${cw > cb ? 'white' : 'black'}</strong></td></tr>
</tbody></table>
<p class="muted">WCAG 2.1 asks for at least 4.5:1 for body text and 3:1 for large text (18&nbsp;pt, or 14&nbsp;pt bold).</p>

<h2>Tints and shades of ${H}</h2>
<p>Each swatch keeps the hue and saturation of ${H} and varies only lightness — the quickest way to build a usable scale from a single brand color.</p>
${swatchRow(shades)}

<h2>Colors that go with ${H}</h2>
<p>Harmonies generated by rotating the hue on the color wheel while holding saturation and lightness constant.</p>
${swatchRow(harmony)}

<h2>Using ${H} in code</h2>
<pre><code>/* CSS */
.element { color: ${H}; background-color: ${H}; }
.element { color: rgb(${rgb.r} ${rgb.g} ${rgb.b}); }
.element { color: hsl(${hsl.h} ${hsl.s}% ${hsl.l}%); }

/* Tailwind arbitrary value */
&lt;div class="bg-[${H}] text-${cw > cb ? 'white' : 'black'}"&gt;

/* SCSS variable */
$brand: ${H};</code></pre>

${FAQ.html}

<p><a href="/color-converter/">Convert any color →</a> · <a href="/color/">Browse all colors</a></p>`,
  };
}

export default async function () {
  const pages = [];
  const done = new Set();

  // Work out the full seed set first so swatch links can be resolved against
  // pages that will actually exist.
  const seeds = [];
  const namedList = [];
  for (const [name, hex] of Object.entries(NAMED)) {
    if (done.has(hex)) continue;
    done.add(hex);
    seeds.push([hex, name]);
    namedList.push({ hex, label: name });
  }

  // 2) colors people actually search for — brand palettes, UI defaults, design-system steps
  const POPULAR = ['1da1f2','1877f2','ff0000','25d366','0a66c2','ff4500','e60023','1db954','5865f2',
    '000000','ffffff','2563eb','3b82f6','60a5fa','1e40af','ef4444','dc2626','f97316','f59e0b','eab308',
    '22c55e','16a34a','10b981','14b8a6','06b6d4','0ea5e9','6366f1','8b5cf6','a855f7','d946ef','ec4899',
    'f43f5e','64748b','475569','334155','1e293b','0f172a','f8fafc','e2e8f0','cbd5e1','94a3b8',
    'fafafa','f5f5f5','e5e5e5','737373','404040','171717','36393f','2c2f33','7289da','ff6900',
    'fcb900','00d084','8ed1fc','0693e3','abb8c3','eb144c','f78da7','9900ef','003366','006400',
    '4b0082','800020','36454f','708090','fffdd0','f5f5dc','fa8072','40e0d0','e6e6fa','ffd700'];
  for (const hex of POPULAR) {
    if (done.has(hex)) continue;
    done.add(hex);
    seeds.push([hex, null]);
  }

  // 3) a systematic grid across the hue/saturation/lightness space
  for (let h = 0; h < 360; h += 15) {
    for (const s of [25, 50, 75, 100]) {
      for (const l of [20, 35, 50, 65, 80]) {
        const c = hsl2rgb(h, s, l);
        const hex = rgb2hex(c.r, c.g, c.b);
        if (done.has(hex)) continue;
        done.add(hex);
        seeds.push([hex, null]);
      }
    }
  }
  // 4) the grey ramp
  for (let v = 0; v <= 255; v += 17) {
    const hex = rgb2hex(v, v, v);
    if (done.has(hex)) continue;
    done.add(hex);
    seeds.push([hex, null]);
  }

  EXISTS = done;
  for (const [hex, name] of seeds) pages.push(colorPage(hex, name));

  const all = [...done];
  pages.push({
    path: '/color/',
    title: `Color Codes — ${all.length} HEX Colors with RGB, HSL & Contrast | Toolman`,
    desc: `Browse ${all.length} color pages with HEX, RGB, HSL and CMYK values, WCAG contrast ratios, tints, shades and matching palettes.`,
    h1: 'Color codes',
    crumbs: [{ name: 'Colors', path: '/color/' }],
    body: `<p class="muted">${all.length} color reference pages. Each one lists HEX, RGB, HSL and CMYK values, contrast ratios against black and white, a lightness scale and a set of harmonies. Need a specific color? Use the <a href="/color-converter/">color converter</a>.</p>
<h2>CSS named colors</h2>
${swatchRow(namedList.slice(0, 60))}
<ul class="linklist">${namedList
      .map((c) => `<li><a href="/color/${c.hex}/">${esc(c.label)} <span class="muted">#${c.hex.toUpperCase()}</span></a></li>`)
      .join('')}</ul>
<h2>All color pages</h2>
<ul class="linklist">${all
      .map((h) => `<li><a href="/color/${h}/">#${h.toUpperCase()}</a></li>`)
      .join('')}</ul>`,
  });

  return pages;
}
