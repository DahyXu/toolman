import { CATS, TEMPS, toK, fromK, plural } from '../data/units.mjs';
import { esc, faq } from '../layout.mjs';

const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
const title = (s) => s.split(' ').map((w) => (w.length > 2 || w === 'to' ? cap(w) : w)).join(' ');

// Smart number formatting: keep meaningful precision, strip noise.
function fmt(n) {
  if (!isFinite(n)) return '—';
  if (n === 0) return '0';
  const a = Math.abs(n);
  if (a >= 1e15 || a < 1e-6) return n.toExponential(6).replace(/e([+-])(\d)$/, 'e$10$2');
  let s;
  if (a >= 1000) s = n.toFixed(Math.max(0, 6 - Math.floor(Math.log10(a))));
  else if (a >= 1) s = n.toFixed(6);
  else s = n.toPrecision(7);
  s = s.replace(/(\.\d*?)0+$/, '$1').replace(/\.$/, '');
  return s;
}
const group = (s) => {
  const [i, d] = String(s).split('.');
  return i.replace(/\B(?=(\d{3})+(?!\d))/g, ',') + (d ? '.' + d : '');
};
const fmtG = (n) => (String(n).includes('e') ? fmt(n) : group(fmt(n)));

const TABLE_VALUES = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 15, 20, 25, 30, 40, 50, 75, 100, 250, 500, 1000];

function converterWidget(fromLabel, toLabel, jsFwd, jsBack) {
  return `<div class="tool">
  <div class="grid2">
    <div><label for="a">${esc(fromLabel)}</label><input type="text" id="a" inputmode="decimal" value="1"></div>
    <div><label for="b">${esc(toLabel)}</label><input type="text" id="b" inputmode="decimal"></div>
  </div>
  <p class="row"><button data-swap>Swap units</button><button data-clr>Clear</button></p>
  <p class="big" id="eq"></p>
</div>
<script>
(function(){
  var A=document.getElementById('a'),B=document.getElementById('b'),E=document.getElementById('eq');
  var fwd=${jsFwd}, back=${jsBack};
  function f(n){if(!isFinite(n))return '';var a=Math.abs(n);if(a!==0&&(a>=1e15||a<1e-6))return n.toExponential(6);
    var s=a>=1000?n.toFixed(Math.max(0,6-Math.floor(Math.log10(a)))):a>=1?n.toFixed(6):n.toPrecision(7);
    s=s.replace(/(\\.\\d*?)0+$/,'$1').replace(/\\.$/,'');
    var p=s.split('.');return p[0].replace(/\\B(?=(\\d{3})+(?!\\d))/g,',')+(p[1]?'.'+p[1]:'');}
  function eq(){var v=parseFloat(A.value);E.textContent=isFinite(v)?f(v)+' ${esc(fromLabel)} = '+f(fwd(v))+' ${esc(toLabel)}':'';}
  A.addEventListener('input',function(){var v=parseFloat(A.value);B.value=isFinite(v)?f(fwd(v)):'';eq()});
  B.addEventListener('input',function(){var v=parseFloat(B.value);A.value=isFinite(v)?f(back(v)):'';eq()});
  document.querySelector('[data-swap]').addEventListener('click',function(){location.href='/convert/${'PAIR_REVERSE'}/'});
  document.querySelector('[data-clr]').addEventListener('click',function(){A.value='';B.value='';E.textContent=''});
  B.value=f(fwd(1));eq();
})();
</script>`;
}

function pairPage({ catKey, catName, from, to, factorText, formula, inverseFormula, convert, invert, aDesc, bDesc, siblings }) {
  const fromP = plural(from), toP = plural(to);
  const path = `/convert/${from.id}-to-${to.id}/`;
  const one = convert(1);
  const h1 = `Convert ${title(fromP)} to ${title(toP)}`;
  const jsFwd = `function(v){return ${formula.js}}`;
  const jsBack = `function(v){return ${inverseFormula.js}}`;

  const rows = TABLE_VALUES.map(
    (v) => `<tr><td>${group(v)} ${esc(from.sym)}</td><td>${fmtG(convert(v))} ${esc(to.sym)}</td></tr>`
  ).join('');
  const revRows = TABLE_VALUES.slice(0, 10).map(
    (v) => `<tr><td>${group(v)} ${esc(to.sym)}</td><td>${fmtG(invert(v))} ${esc(from.sym)}</td></tr>`
  ).join('');

  const sib = siblings
    .map((s) => `<li><a href="/convert/${s.id}/">${esc(s.label)}</a></li>`)
    .join('');

  const widget = converterWidget(fromP, toP, jsFwd, jsBack).replace('PAIR_REVERSE', `${to.id}-to-${from.id}`);

  const FAQ = faq([
    { q: `How many ${toP} are in a ${from.name}?`,
      a: `There are <strong>${fmtG(one)} ${toP}</strong> in one ${from.name}.` },
    { q: `How many ${fromP} are in a ${to.name}?`,
      a: `There are <strong>${fmtG(invert(1))} ${fromP}</strong> in one ${to.name}.` },
    { q: 'Is this conversion exact?', a: factorText },
    { q: `What is 10 ${fromP} in ${toP}?`,
      a: `10 ${fromP} equals ${fmtG(convert(10))} ${toP}.` },
  ]);

  return {
    path,
    title: `${title(fromP)} to ${title(toP)} Converter (${from.sym} to ${to.sym}) | Toolman`,
    desc: `Convert ${fromP} to ${toP} instantly. 1 ${from.name} = ${fmt(one)} ${one === 1 ? to.name : toP}. Free ${catName.toLowerCase()} converter with the formula, a full conversion table and worked examples.`,
    h1,
    crumbs: [
      { name: 'Converters', path: '/convert/' },
      { name: catName, path: `/convert/${catKey}/` },
      { name: `${title(fromP)} to ${title(toP)}`, path },
    ],
    jsonld: [FAQ.schema],
    body: `<p class="muted">1 ${from.name} = <strong>${fmtG(one)} ${one === 1 ? to.name : toP}</strong>. Type any value below to convert in either direction — the calculation happens in your browser.</p>
${widget}

<h2>${title(fromP)} to ${title(toP)} formula</h2>
<p>${formula.text}</p>
<pre><code>${esc(formula.code)}</code></pre>
<p>To go the other way: ${inverseFormula.text}</p>
<pre><code>${esc(inverseFormula.code)}</code></pre>

<h2>${title(fromP)} to ${title(toP)} conversion table</h2>
<table><thead><tr><th>${title(fromP)}</th><th>${title(toP)}</th></tr></thead><tbody>${rows}</tbody></table>

<h2>${title(toP)} to ${title(fromP)} conversion table</h2>
<table><thead><tr><th>${title(toP)}</th><th>${title(fromP)}</th></tr></thead><tbody>${revRows}</tbody></table>

<h2>About the ${from.name}</h2>
<p>${aDesc}</p>
<h2>About the ${to.name}</h2>
<p>${bDesc}</p>

${FAQ.html}

<h2>Related ${catName.toLowerCase()} conversions</h2>
<ul class="linklist">${sib}</ul>
<p><a href="/convert/${catKey}/">All ${catName.toLowerCase()} converters</a> · <a href="/convert/">All converters</a></p>`,
  };
}

export default async function ({ categorySection = {} } = {}) {
  const pages = [];
  const catIndex = [];

  for (const [catKey, cat] of Object.entries(CATS)) {
    const us = cat.units;
    const pairs = [];
    for (const a of us) for (const b of us) if (a !== b) pairs.push([a, b]);

    for (const [a, b] of pairs) {
      const k = a.f / b.f; // multiply a-value by k to get b-value
      const siblings = pairs
        .filter(([x, y]) => (x === a || y === b) && !(x === a && y === b))
        .slice(0, 14)
        .map(([x, y]) => ({ id: `${x.id}-to-${y.id}`, label: `${title(plural(x))} to ${title(plural(y))}` }));

      const kStr = fmt(k), invStr = fmt(1 / k);
      const exact = Number.isInteger(k) || Number.isInteger(1 / k) || /^[\d.]+$/.test(kStr);

      pages.push(pairPage({
        catKey, catName: cat.name, from: a, to: b,
        convert: (v) => v * k,
        invert: (v) => v / k,
        formula: {
          text: `Multiply the number of ${plural(a)} by ${kStr} to get ${plural(b)}.`,
          code: `${plural(b)} = ${plural(a)} × ${kStr}`,
          js: `v*${k}`,
        },
        inverseFormula: {
          text: `divide the number of ${plural(b)} by ${kStr}, or multiply by ${invStr}.`,
          code: `${plural(a)} = ${plural(b)} ÷ ${kStr}`,
          js: `v/${k}`,
        },
        factorText: exact
          ? `The ratio between the ${a.name} and the ${b.name} is fixed by definition, so the conversion is exact — the figures shown here are rounded for readability only.`
          : `The conversion factor is fixed, but its decimal expansion is infinite, so values are rounded to seven significant figures for display.`,
        aDesc: a.d, bDesc: b.d,
        siblings,
      }));
    }

    catIndex.push({ key: catKey, name: cat.name, count: pairs.length, units: us });

    // category hub
    pages.push({
      path: `/convert/${catKey}/`,
      title: `${cat.name} Converter — Free Online ${cat.name} Conversion | Toolman`,
      desc: `Convert between ${us.map((u) => plural(u)).slice(0, 6).join(', ')} and more. ${pairs.length} free ${cat.name.toLowerCase()} converters with formulas and conversion tables.`,
      h1: `${cat.name} converters`,
      crumbs: [{ name: 'Converters', path: '/convert/' }, { name: cat.name, path: `/convert/${catKey}/` }],
      body: `<p class="muted">${pairs.length} direct conversions between ${us.length} ${cat.name.toLowerCase()} units. Every page includes a live converter, the formula and a full conversion table.</p>
<h2>Units covered</h2>
<table><thead><tr><th>Unit</th><th>Symbol</th><th>In ${cat.base}s</th></tr></thead><tbody>
${us.map((u) => `<tr><td>${esc(cap(u.name))}</td><td>${esc(u.sym)}</td><td>${fmtG(u.f)}</td></tr>`).join('')}
</tbody></table>
<h2>All ${cat.name.toLowerCase()} conversions</h2>
<ul class="linklist">${pairs
        .map(([x, y]) => `<li><a href="/convert/${x.id}-to-${y.id}/">${esc(title(plural(x)))} to ${esc(title(plural(y)))}</a></li>`)
        .join('')}</ul>`,
    });
  }

  // ---- temperature (affine) ----
  const tPairs = [];
  for (const a of TEMPS) for (const b of TEMPS) if (a !== b) tPairs.push([a, b]);
  const TJS = {
    celsius: { toK: 'v+273.15', fromK: 'v-273.15' },
    fahrenheit: { toK: '(v+459.67)*5/9', fromK: 'v*9/5-459.67' },
    kelvin: { toK: 'v', fromK: 'v' },
    rankine: { toK: 'v*5/9', fromK: 'v*9/5' },
  };
  for (const [a, b] of tPairs) {
    const conv = (v) => fromK[b.id](toK[a.id](v));
    const inv = (v) => fromK[a.id](toK[b.id](v));
    const jsF = TJS[b.id].fromK.replace(/v/g, `(${TJS[a.id].toK})`);
    const jsB = TJS[a.id].fromK.replace(/v/g, `(${TJS[b.id].toK})`);
    const samples = [-40, -20, 0, 10, 20, 25, 30, 37, 50, 75, 100, 200];
    pages.push({
      path: `/convert/${a.id}-to-${b.id}/`,
      title: `${a.name} to ${b.name} Converter (${a.sym} to ${b.sym}) | Toolman`,
      desc: `Convert ${a.name} to ${b.name} instantly. 0${a.sym} = ${fmt(conv(0))}${b.sym}. Free temperature converter with the formula, a conversion table and worked examples.`,
      h1: `Convert ${a.name} to ${b.name}`,
      crumbs: [{ name: 'Converters', path: '/convert/' }, { name: 'Temperature', path: '/convert/temperature/' }, { name: `${a.name} to ${b.name}`, path: `/convert/${a.id}-to-${b.id}/` }],
      body: `<p class="muted">Enter a temperature in ${a.name} to see it in ${b.name}. Conversion runs in your browser.</p>
${converterWidget(a.name + ' (' + a.sym + ')', b.name + ' (' + b.sym + ')', `function(v){return ${jsF}}`, `function(v){return ${jsB}}`).replace('PAIR_REVERSE', `${b.id}-to-${a.id}`)}
<h2>${a.name} to ${b.name} formula</h2>
<pre><code>${esc(b.sym)} = ${esc(jsF.replace(/v/g, a.sym))}</code></pre>
<p>Temperature scales differ in both their zero point and their degree size, so a conversion needs a multiplication <em>and</em> an offset — unlike length or weight, where a single factor is enough.</p>
<h2>Conversion table</h2>
<table><thead><tr><th>${a.name} (${esc(a.sym)})</th><th>${b.name} (${esc(b.sym)})</th></tr></thead><tbody>
${samples.map((v) => `<tr><td>${v}${esc(a.sym)}</td><td>${fmt(conv(v))}${esc(b.sym)}</td></tr>`).join('')}
</tbody></table>
<h2>About ${a.name}</h2><p>${a.d}</p>
<h2>About ${b.name}</h2><p>${b.d}</p>
${faq([
      { q: `What is 0${a.sym} in ${b.name}?`, a: `0${a.sym} equals ${fmt(conv(0))}${b.sym}.` },
      { q: 'What is normal body temperature?', a: `37°C — about ${fmt(fromK[b.id](toK.celsius(37)))}${b.sym}.` },
      { q: 'At what temperature do the two scales meet?',
        a: a.id === 'celsius' && b.id === 'fahrenheit'
          ? 'Celsius and Fahrenheit read the same at −40°: −40°C = −40°F.'
          : 'Only Celsius and Fahrenheit cross, at −40°. Kelvin and Rankine both start at absolute zero and never go negative.' },
    ]).html}
<h2>Other temperature conversions</h2>
<ul class="linklist">${tPairs.filter(([x, y]) => !(x === a && y === b)).map(([x, y]) => `<li><a href="/convert/${x.id}-to-${y.id}/">${x.name} to ${y.name}</a></li>`).join('')}</ul>`,
    });
  }
  pages.push({
    path: '/convert/temperature/',
    title: 'Temperature Converter — Celsius, Fahrenheit, Kelvin, Rankine | Toolman',
    desc: 'Free temperature converter between Celsius, Fahrenheit, Kelvin and Rankine, with formulas and conversion tables.',
    h1: 'Temperature converters',
    crumbs: [{ name: 'Converters', path: '/convert/' }, { name: 'Temperature', path: '/convert/temperature/' }],
    body: `<p class="muted">Convert between the four temperature scales still in use.</p>
<ul class="linklist">${tPairs.map(([x, y]) => `<li><a href="/convert/${x.id}-to-${y.id}/">${x.name} to ${y.name}</a></li>`).join('')}</ul>
<h2>The scales</h2>${TEMPS.map((t) => `<h3>${t.name} (${esc(t.sym)})</h3><p>${t.d}</p>`).join('')}`,
  });
  catIndex.push({ key: 'temperature', name: 'Temperature', count: tPairs.length });
  catIndex.push({ key: 'css-units', name: 'CSS Units', count: 72 });
  catIndex.push({ key: 'time-zones', name: 'Time Zones', count: 848 });

  // ---- master hub ----
  const total = pages.filter((p) => /-to-/.test(p.path)).length;
  pages.push({
    path: '/convert/',
    title: `Unit Converter — ${total}+ Free Online Conversions | Toolman`,
    desc: `Free unit converter covering length, weight, temperature, volume, area, speed, data, time, pressure, energy and more — ${total} direct conversions with formulas and tables.`,
    h1: 'Converters',
    crumbs: [{ name: 'Converters', path: '/convert/' }],
    // This URL is both the Converters category and the unit-conversion hub.
    // build.mjs hands over the category half so neither overwrites the other.
    body: `${categorySection.convert || ''}
<h2>Unit converters</h2>
<p class="muted">${total} conversions across ${catIndex.length} categories. Each page has a live two-way converter, the exact formula and a printable conversion table.</p>
<ul class="cards">${catIndex
      .map((c) => `<li><a href="/convert/${c.key}/"><b>${esc(c.name)}</b><span>${c.count} conversions</span></a></li>`)
      .join('')}</ul>
<h2>Popular conversions</h2>
<ul class="linklist">${[
      'meters-to-feet', 'feet-to-meters', 'kilometers-to-miles', 'miles-to-kilometers',
      'celsius-to-fahrenheit', 'fahrenheit-to-celsius', 'kilograms-to-pounds', 'pounds-to-kilograms',
      'inches-to-centimeters', 'centimeters-to-inches', 'liters-to-gallons', 'gallons-to-liters',
      'megabytes-to-gigabytes', 'kilobytes-to-megabytes', 'grams-to-ounces', 'ounces-to-grams',
      'square-feet-to-square-meters', 'acres-to-hectares', 'kilometers-per-hour-to-miles-per-hour',
      'minutes-to-hours', 'hours-to-days', 'psi-to-bars', 'kilocalories-to-kilojoules', 'radians-to-degrees',
    ]
      .map((s) => `<li><a href="/convert/${s}/">${s.replace(/-to-/, ' to ').replace(/-/g, ' ').replace(/\b\w/g, (m) => m.toUpperCase())}</a></li>`)
      .join('')}</ul>`,
  });

  return pages;
}
