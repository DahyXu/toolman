import { esc, faq } from '../layout.mjs';

// All factors expressed in CSS pixels, at the CSS reference of 96 dpi
// and the browser default root font size of 16 px.
const U = [
  { id: 'px', name: 'pixel', plural: 'pixels', sym: 'px', px: 1, rel: false,
    d: 'The CSS pixel is the reference unit of the web. It is not a physical device pixel — it is an angular measure standardised at 1/96th of an inch, which the browser scales for device pixel ratio and zoom.' },
  { id: 'rem', name: 'rem', plural: 'rem', sym: 'rem', px: 16, rel: true,
    d: 'One rem equals the font size of the root <code>&lt;html&gt;</code> element — 16 px unless you or the user changes it. Because it ignores nesting, rem is the unit of choice for a consistent type and spacing scale.' },
  { id: 'em', name: 'em', plural: 'em', sym: 'em', px: 16, rel: true,
    d: 'One em equals the font size of the current element. It compounds through nesting, which makes it powerful for component-local spacing and dangerous for global scales.' },
  { id: 'pt', name: 'point', plural: 'points', sym: 'pt', px: 96 / 72, rel: false,
    d: 'A point is 1/72nd of an inch, inherited from print typography. CSS defines it as exactly 4/3 of a pixel, so 12 pt equals 16 px.' },
  { id: 'pc', name: 'pica', plural: 'picas', sym: 'pc', px: 16, rel: false,
    d: 'A pica is 12 points, or 1/6th of an inch — 16 CSS pixels. It survives mainly in print layout and legacy stylesheets.' },
  { id: 'in', name: 'inch', plural: 'inches', sym: 'in', px: 96, rel: false,
    d: 'CSS defines one inch as exactly 96 pixels. On screen this is a nominal measure, not a guarantee of physical size; in print stylesheets it maps to a real inch.' },
  { id: 'cm', name: 'centimeter', plural: 'centimeters', sym: 'cm', px: 96 / 2.54, rel: false,
    d: 'One centimetre is 96/2.54 ≈ 37.795 CSS pixels. Useful in print stylesheets, misleading on screen.' },
  { id: 'mm', name: 'millimeter', plural: 'millimeters', sym: 'mm', px: 96 / 25.4, rel: false,
    d: 'One millimetre is about 3.78 CSS pixels. Like centimetres it is a print unit that CSS accepts everywhere.' },
  { id: 'percent', name: 'percent', plural: 'percent', sym: '%', px: 0.16, rel: true,
    d: 'For font size, a percentage is relative to the parent element’s font size, so 100% equals 16 px at the default. Like em, percentages compound through nesting.' },
];

const COMMON = [8, 10, 12, 14, 16, 18, 20, 24, 28, 32, 36, 40, 48, 56, 64, 72, 80, 96, 128];

function fmt(n) {
  if (!isFinite(n)) return '—';
  if (n === 0) return '0';
  const a = Math.abs(n);
  let s = a >= 100 ? n.toFixed(2) : a >= 1 ? n.toFixed(4) : n.toFixed(6);
  return s.replace(/(\.\d*?)0+$/, '$1').replace(/\.$/, '');
}

function pairPage(a, b, all) {
  const k = a.px / b.px;
  const path = `/convert/${a.id}-to-${b.id}/`;
  const anyRel = a.rel || b.rel;
  const A = a.sym, B = b.sym;
  const titleA = a.id === 'px' ? 'PX' : a.id === 'percent' ? 'Percent' : a.id.toUpperCase();
  const titleB = b.id === 'px' ? 'PX' : b.id === 'percent' ? 'Percent' : b.id.toUpperCase();

  const rows = COMMON.map(
    (v) => `<tr><td>${v}${A}</td><td>${fmt(v * k)}${B}</td></tr>`
  ).join('');

  const siblings = all
    .filter((u) => u !== a && u !== b)
    .map((u) => `<li><a href="/convert/${a.id}-to-${u.id}/">${titleA} to ${u.id === 'px' ? 'PX' : u.id.toUpperCase()}</a></li>`)
    .join('') +
    all.filter((u) => u !== a && u !== b)
      .map((u) => `<li><a href="/convert/${u.id}-to-${b.id}/">${u.id === 'px' ? 'PX' : u.id.toUpperCase()} to ${titleB}</a></li>`)
      .join('');

  const FAQ = faq([
    { q: `What is 16${A} in ${B}?`, a: `16${A} equals <strong>${fmt(16 * k)}${B}</strong>${anyRel ? ' at a 16&nbsp;px root font size' : ', and that does not change with the font size because both units are absolute'}.` },
    { q: `How do I convert ${A} to ${B}?`,
      a: `Multiply the ${A} value by ${fmt(k)}. Going the other way, multiply the ${B} value by ${fmt(1 / k)}.` },
    anyRel
      ? { q: 'Does the root font size change the result?',
          a: a.rel && b.rel
            ? 'Yes. Both units are relative, so the ratio between them is stable, but their pixel values move together with the root size.'
            : 'Yes. One of these units is relative to the root font size, so changing it changes the conversion. Use the base control above to match your project.' }
      : { q: 'Does browser zoom change the result?',
          a: 'No. Both units are absolute in CSS and keep the same ratio at any zoom level, though the rendered size on screen changes.' },
    { q: 'Why does CSS use 96 pixels per inch?',
      a: "It is a historical convention from early desktop displays that became the fixed CSS reference. It has nothing to do with your monitor's real pixel density — the browser scales CSS pixels to physical ones for you." },
  ]);

  return {
    path,
    title: `${titleA} to ${titleB} Converter — CSS Unit Calculator | Toolman`,
    desc: `Convert ${A} to ${B} for CSS. 1${A} = ${fmt(k)}${B}${anyRel ? ' at the default 16 px root font size, adjustable below' : ', a fixed ratio'}. Includes the formula and a full conversion table.`,
    h1: `Convert ${A} to ${B}`,
    crumbs: [
      { name: 'Converters', path: '/convert/' },
      { name: 'CSS units', path: '/convert/css-units/' },
      { name: `${titleA} to ${titleB}`, path },
    ],
    jsonld: [FAQ.schema],
    body: `<p class="muted">${anyRel ? `At the browser default root font size of 16&nbsp;px, <strong>1${A} = ${fmt(k)}${B}</strong>. Change the base below if your project uses a different root size.` : `<strong>1${A} = ${fmt(k)}${B}</strong>. Both are absolute CSS units, so this ratio is fixed — the root font size does not affect it.`}</p>
<div class="tool">
  <div class="grid2">
    <div><label for="a">${A}</label><input type="text" id="a" inputmode="decimal" value="16"></div>
    <div><label for="b">${B}</label><input type="text" id="b" inputmode="decimal"></div>
  </div>
  <div class="row">${anyRel ? `<label style="margin:0">Root font size <input type="number" id="base" value="16" min="1" max="64" step="0.5" style="width:90px"> px</label>` : `<input type="hidden" id="base" value="16">`}
  <span class="muted" id="note"></span></div>
  <p class="big" id="eq"></p>
</div>
<script>
(function(){
 var A=document.getElementById('a'),B=document.getElementById('b'),E=document.getElementById('eq'),BS=document.getElementById('base');
 var aPx=${a.px}, bPx=${b.px}, aRel=${a.rel}, bRel=${b.rel};
 function k(){var base=parseFloat(BS.value)||16;
   var ap=aRel?aPx*base/16:aPx, bp=bRel?bPx*base/16:bPx; return ap/bp}
 function f(n){if(!isFinite(n))return '';var a=Math.abs(n);
   var s=a>=100?n.toFixed(2):a>=1?n.toFixed(4):n.toFixed(6);
   return s.replace(/(\\.\\d*?)0+$/,'$1').replace(/\\.$/,'')}
 function eq(){var v=parseFloat(A.value);E.textContent=isFinite(v)?f(v)+'${A} = '+f(v*k())+'${B}':''}
 A.addEventListener('input',function(){var v=parseFloat(A.value);B.value=isFinite(v)?f(v*k()):'';eq()});
 B.addEventListener('input',function(){var v=parseFloat(B.value);A.value=isFinite(v)?f(v/k()):'';eq()});
 BS.addEventListener('input',function(){var v=parseFloat(A.value);B.value=isFinite(v)?f(v*k()):'';eq();
   document.getElementById('note').textContent='1${A} = '+f(k())+'${B}'});
 B.value=f(parseFloat(A.value)*k());eq();
 document.getElementById('note').textContent='1${A} = '+f(k())+'${B}';
})();
</script>

<h2>Formula</h2>
<pre><code>${B} = ${A} × ${fmt(k)}
${A} = ${B} × ${fmt(1 / k)}</code></pre>
${anyRel ? `<p>Because ${a.rel && b.rel ? 'both units are' : (a.rel ? a.sym : b.sym) + ' is'} relative, this ratio holds only at a 16&nbsp;px base. If your project sets <code>html { font-size: 62.5% }</code> — a common trick that makes 1rem equal 10&nbsp;px — set the base above to 10 instead.</p>` : `<p>Both units are absolute in CSS, so this ratio never changes regardless of font size or user settings.</p>`}

<h2>${titleA} to ${titleB} conversion table</h2>
<table><thead><tr><th>${A}</th><th>${B}</th></tr></thead><tbody>${rows}</tbody></table>

<h2>About ${A}</h2><p>${a.d}</p>
<h2>About ${B}</h2><p>${b.d}</p>

<h2>Which unit should you use?</h2>
<table>
<tr><th>Property</th><th>Recommended unit</th><th>Why</th></tr>
<tr><td>Font size</td><td><code>rem</code></td><td>Scales with the user's browser font-size preference, which <code>px</code> ignores — an accessibility requirement.</td></tr>
<tr><td>Padding and margin</td><td><code>rem</code> or <code>em</code></td><td>rem for a consistent global rhythm; em when the spacing should track the component's own text size.</td></tr>
<tr><td>Borders and hairlines</td><td><code>px</code></td><td>You almost always want exactly one crisp pixel, not a value that scales.</td></tr>
<tr><td>Media query breakpoints</td><td><code>em</code></td><td>Historically the most reliable across browsers when the user zooms.</td></tr>
<tr><td>Print stylesheets</td><td><code>pt</code>, <code>cm</code>, <code>mm</code></td><td>These map to real physical measurements on paper.</td></tr>
</table>

${FAQ.html}

${VALUE_PAIRS.some(([x, y]) => x === a.id && y === b.id) ? `
<h2>Common ${A} values in ${B}</h2>
<p>Each of these has its own page with the working, the value at other font sizes and the neighbouring conversions.</p>
<ul class="linklist">${COMMON.map((v) => `<li><a href="/convert/${v}-${a.id}-to-${b.id}/">${v}${A} to ${B}</a></li>`).join('')}</ul>
` : ''}
<h2>Related CSS unit conversions</h2>
<ul class="linklist">${siblings}</ul>
<p><a href="/convert/css-units/">All CSS unit converters</a> · <a href="/convert/">All converters</a></p>`,
  };
}

// Pairs that get a page per value. Nobody searches "pc to percent" with a number
// in front of it, but "16px to rem" is one of the most-typed conversions in
// front-end work, and Search Console has already shown "16pt to mm" arriving
// here and landing on the pair page — which answers it inside a nineteen-row
// table rather than in its title.
const VALUE_PAIRS = [['px', 'rem'], ['rem', 'px'], ['px', 'pt'], ['pt', 'px'],
  ['px', 'em'], ['em', 'px'], ['pt', 'mm'], ['mm', 'pt']];

// Root font sizes worth showing. 16 is the browser default; 14 and 18 are the
// two most common overrides in design systems; 20 and 24 are what a visitor who
// has raised their browser's default font size is actually running.
const ROOTS = [14, 16, 18, 20, 24];

function valuePage(a, b, v, all) {
  const k = a.px / b.px;
  // Which font size the relative side of this pair is actually measured against.
  // rem looks at the root element; em looks at the element it is written on, and
  // inherits the root only when nothing above it has changed the size. Calling
  // both of them "the root font size" is wrong for em, and wrong in the way that
  // matters, since compounding through nesting is the whole difference.
  const relUnit = a.rel ? a : b.rel ? b : null;
  const basis = !relUnit ? '' : relUnit.id === 'rem' ? 'the root element' : relUnit.id === 'em' ? "the element's own font size, inherited from its parent unless it sets one" : "the parent element's font size";
  const basisShort = !relUnit ? '' : relUnit.id === 'rem' ? 'root font size' : 'font size';
  const out = v * k;
  const A = a.sym, B = b.sym;
  const anyRel = a.rel || b.rel;
  const path = `/convert/${v}-${a.id}-to-${b.id}/`;

  // For a relative pair the answer is only true at one root size, and saying so
  // in a table is the whole reason this page is worth more than the ratio.
  const rootRows = anyRel
    ? ROOTS.map((r) => {
      const pa = a.rel ? (a.id === 'percent' ? r / 100 : r) : a.px;
      const pb = b.rel ? (b.id === 'percent' ? r / 100 : r) : b.px;
      return `<tr${r === 16 ? ' style="font-weight:600"' : ''}><td>${r} px${r === 16 ? ' (default)' : ''}</td><td>${fmt(v * (pa / pb))}${B}</td></tr>`;
    }).join('')
    : '';

  const near = COMMON.filter((x) => x !== v).map((x) => Math.abs(x - v) <= Math.max(8, v * 0.5) ? x : null).filter(Boolean).slice(0, 8);
  const nearRows = [...near, v].sort((x, y) => x - y)
    .map((x) => `<tr${x === v ? ' style="font-weight:600"' : ''}><td>${x === v ? `${x}${A}` : `<a href="/convert/${x}-${a.id}-to-${b.id}/">${x}${A}</a>`}</td><td>${fmt(x * k)}${B}</td></tr>`).join('');

  const FAQ = faq([
    { q: `What is ${v}${A} in ${B}?`, a: `<strong>${fmt(out)}${B}</strong>${anyRel ? ` at the default 16 px ${basisShort}` : ''}.` },
    { q: `How is ${v}${A} converted to ${B}?`, a: `Multiply by ${fmt(k)}: ${v} × ${fmt(k)} = ${fmt(out)}. To go back, multiply ${fmt(out)} by ${fmt(1 / k)}.` },
    anyRel
      ? { q: `Is ${fmt(out)}${B} always the answer?`,
          a: `No. ${relUnit.sym} is relative to ${basis}, so ${v}${A} is ${fmt(out)}${B} only while that is 16 px. The table above gives the value at the sizes you are most likely to meet.` }
      : { q: `Does zoom or font size change ${v}${A}?`,
          a: `No. ${A} and ${B} are both absolute CSS units, so the ratio is fixed and ${v}${A} is ${fmt(out)}${B} in every context.` },
  ]);

  const titleA = a.id === 'px' ? 'PX' : a.id.toUpperCase();
  const titleB = b.id === 'px' ? 'PX' : b.id.toUpperCase();

  return {
    path,
    title: `${v}${A} to ${B} — ${fmt(out)}${B} | Toolman`,
    desc: `${v}${A} equals ${fmt(out)}${B}${anyRel ? ` at a 16 px ${basisShort}` : ''}. Shows the formula, the value at other ${anyRel ? `${basisShort}s` : 'common values'} and a table of nearby conversions.`,
    h1: `${v}${A} to ${B}`,
    crumbs: [
      { name: 'Converters', path: '/convert/' },
      { name: 'CSS units', path: '/convert/css-units/' },
      { name: `${titleA} to ${titleB}`, path: `/convert/${a.id}-to-${b.id}/` },
      { name: `${v}${A}`, path },
    ],
    jsonld: [FAQ.schema],
    body: `<p class="big" style="font-size:1.6rem;margin:.3em 0"><strong>${v}${A} = ${fmt(out)}${B}</strong></p>
<p class="muted">${anyRel ? `At the browser default ${basisShort} of 16&nbsp;px. Change it and this number changes — see below.` : `${A} and ${B} are both absolute CSS units, so this ratio never changes.`}</p>

<h2>How it is calculated</h2>
<p>One ${A} is ${fmt(k)}${B}, so:</p>
<pre><code>${v}${A} × ${fmt(k)} = ${fmt(out)}${B}</code></pre>
<p>Reversing it, ${fmt(out)}${B} × ${fmt(1 / k)} returns ${v}${A}.</p>
${anyRel ? `
<h2>${v}${A} at other ${basisShort}s</h2>
<p>${relUnit ? relUnit.sym : ''} is measured against ${basis}, so the answer above holds only while that is 16&nbsp;px.${relUnit && relUnit.id === 'rem' ? " A visitor who has raised their browser's default — the accessibility setting rem exists to respect — is reading your page at one of the larger rows." : " Nested elements each compound on their parent, so this is the value for one level, not for the whole tree."}</p>
<table><thead><tr><th>${basisShort.charAt(0).toUpperCase() + basisShort.slice(1)}</th><th>${v}${A} equals</th></tr></thead><tbody>${rootRows}</tbody></table>
` : ''}
<h2>Nearby values</h2>
<table><thead><tr><th>${A}</th><th>${B}</th></tr></thead><tbody>${nearRows}</tbody></table>

${FAQ.html}

<p><a href="/convert/${a.id}-to-${b.id}/">The full ${titleA} to ${titleB} converter →</a> · <a href="/convert/css-units/">All CSS unit converters</a></p>`,
  };
}

export default async function () {
  const pages = [];
  const pairs = [];
  for (const a of U) for (const b of U) if (a !== b) pairs.push([a, b]);
  for (const [a, b] of pairs) pages.push(pairPage(a, b, U));

  const byId = new Map(U.map((u) => [u.id, u]));
  for (const [aId, bId] of VALUE_PAIRS) {
    const a = byId.get(aId), b = byId.get(bId);
    if (!a || !b) { console.warn('unknown css unit pair', aId, bId); continue; }
    for (const v of COMMON) pages.push(valuePage(a, b, v, U));
  }

  pages.push({
    path: '/convert/css-units/',
    title: 'CSS Unit Converter — PX, REM, EM, PT and More | Toolman',
    desc: `Convert between every CSS length unit — px, rem, em, pt, pc, in, cm, mm and percent — with an adjustable root font size, formulas and conversion tables.`,
    h1: 'CSS unit converters',
    crumbs: [{ name: 'Converters', path: '/convert/' }, { name: 'CSS units', path: '/convert/css-units/' }],
    body: `<p class="muted">${pairs.length} conversions between the CSS length units, each with a live converter that respects your project's root font size.</p>
<h2>The units</h2>
<table><thead><tr><th>Unit</th><th>Type</th><th>In pixels (16 px base)</th></tr></thead><tbody>
${U.map((u) => `<tr><td><code>${esc(u.sym)}</code></td><td>${u.rel ? 'Relative' : 'Absolute'}</td><td>${fmt(u.px)} px</td></tr>`).join('')}
</tbody></table>
<h2>Absolute vs relative</h2>
<p><strong>Absolute</strong> units (px, pt, pc, in, cm, mm) always render at the same size regardless of context. <strong>Relative</strong> units (rem, em, %) are computed from a font size — the root element for rem, the current element for em and percent — which is what makes them respond to user preferences and to a responsive type scale.</p>
<h2>The accessibility argument for rem</h2>
<p>When a visitor raises their browser's default font size, text sized in <code>px</code> does not move. Text sized in <code>rem</code> does. That single difference is why almost every modern design system expresses type and spacing in rem and reserves px for borders and one-pixel details.</p>
<h2>All conversions</h2>
<ul class="linklist">${pairs
      .map(([a, b]) => `<li><a href="/convert/${a.id}-to-${b.id}/">${esc(a.sym)} to ${esc(b.sym)}</a></li>`)
      .join('')}</ul>`,
  });

  return pages;
}
