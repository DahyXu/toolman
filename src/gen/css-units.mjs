import { esc } from '../layout.mjs';

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

  return {
    path,
    title: `${titleA} to ${titleB} Converter — CSS Unit Calculator | Toolman`,
    desc: `Convert ${A} to ${B} for CSS. 1${A} = ${fmt(k)}${B} at the default 16 px root font size${anyRel ? ', adjustable below' : ''}. Includes the formula and a full conversion table.`,
    h1: `Convert ${A} to ${B}`,
    crumbs: [
      { name: 'Converters', path: '/convert/' },
      { name: 'CSS units', path: '/convert/css-units/' },
      { name: `${titleA} to ${titleB}`, path },
    ],
    jsonld: [{
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: [{
        '@type': 'Question',
        name: `How do you convert ${A} to ${B} in CSS?`,
        acceptedAnswer: { '@type': 'Answer', text: `Divide or multiply by the ratio between the two units. At the default 16 px root font size, 1${A} = ${fmt(k)}${B}.` },
      }],
    }],
    body: `<p class="muted">At the browser default root font size of 16&nbsp;px, <strong>1${A} = ${fmt(k)}${B}</strong>. Change the base below if your project uses a different root size.</p>
<div class="tool">
  <div class="grid2">
    <div><label for="a">${A}</label><input type="text" id="a" inputmode="decimal" value="16"></div>
    <div><label for="b">${B}</label><input type="text" id="b" inputmode="decimal"></div>
  </div>
  <div class="row"><label style="margin:0">Root font size <input type="number" id="base" value="16" min="1" max="64" step="0.5" style="width:90px"> px</label>
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

<h2>Frequently asked questions</h2>
<div class="faq">
<h3>What is 16${A} in ${B}?</h3>
<p>16${A} equals <strong>${fmt(16 * k)}${B}</strong> at a 16&nbsp;px root font size.</p>
<h3>How do I convert ${A} to ${B}?</h3>
<p>Multiply the ${A} value by ${fmt(k)}. Going the other way, multiply the ${B} value by ${fmt(1 / k)}.</p>
${anyRel ? `<h3>Does the root font size change the result?</h3>
<p>Yes. ${a.rel && b.rel ? 'Both units are relative, so the ratio between them is stable, but their pixel values move together with the root size.' : 'One of these units is relative to the root font size, so changing it changes the conversion. Use the base control above to match your project.'}</p>` : `<h3>Does browser zoom change the result?</h3>
<p>No. Both units are absolute in CSS and keep the same ratio at any zoom level, though the rendered size on screen changes.</p>`}
<h3>Why does CSS use 96 pixels per inch?</h3>
<p>It is a historical convention from early desktop displays that became the fixed CSS reference. It has nothing to do with your monitor's real pixel density — the browser scales CSS pixels to physical ones for you.</p>
</div>

<h2>Related CSS unit conversions</h2>
<ul class="linklist">${siblings}</ul>
<p><a href="/convert/css-units/">All CSS unit converters</a> · <a href="/convert/">All converters</a></p>`,
  };
}

export default async function () {
  const pages = [];
  const pairs = [];
  for (const a of U) for (const b of U) if (a !== b) pairs.push([a, b]);
  for (const [a, b] of pairs) pages.push(pairPage(a, b, U));

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
