import { CATS, TEMPS, toK, fromK, plural } from '../data/units.mjs';

const byId = new Map();
for (const [catKey, cat] of Object.entries(CATS))
  for (const u of cat.units) byId.set(u.id, { ...u, catKey, catName: cat.name });

const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
const title = (s) => s.split(' ').map(cap).join(' ');

function fmt(n) {
  if (!isFinite(n)) return '—';
  if (n === 0) return '0';
  const a = Math.abs(n);
  if (a >= 1e12 || a < 1e-5) return n.toExponential(5);
  let s = a >= 1000 ? n.toFixed(Math.max(0, 5 - Math.floor(Math.log10(a)))) : a >= 1 ? n.toFixed(5) : n.toPrecision(6);
  s = s.replace(/(\.\d*?)0+$/, '$1').replace(/\.$/, '');
  return s;
}
const group = (s) => {
  const [i, d] = String(s).split('.');
  return i.replace(/\B(?=(\d{3})+(?!\d))/g, ',') + (d ? '.' + d : '');
};
const fmtG = (n) => (String(fmt(n)).includes('e') ? fmt(n) : group(fmt(n)));

// Values people actually search for, per conversion family.
const SETS = {
  human: [1, 2, 3, 4, 4.5, 5, 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7, 5.8, 5.9, 5.11, 6, 6.1, 6.2, 6.3, 7, 8, 10, 12, 15, 20, 25, 30, 50, 100],
  small: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 14, 15, 16, 18, 20, 24, 25, 30, 36, 40, 48, 50, 60, 72, 75, 100, 120, 150, 200, 250, 500, 1000],
  weight: [1, 2, 3, 5, 8, 10, 12, 15, 20, 25, 30, 40, 45, 50, 55, 60, 65, 70, 75, 80, 85, 90, 95, 100, 110, 120, 130, 140, 150, 160, 170, 180, 190, 200, 250, 300],
  distance: [1, 2, 3, 5, 8, 10, 15, 20, 21, 25, 26, 30, 40, 42, 50, 60, 75, 80, 100, 120, 150, 200, 250, 300, 400, 500, 1000, 5000, 10000],
  temp: [-40, -20, -10, 0, 5, 10, 15, 18, 20, 21, 22, 25, 28, 30, 32, 35, 37, 37.5, 38, 39, 40, 45, 50, 60, 70, 80, 90, 100, 150, 180, 200, 220, 250, 350, 400, 425, 450],
  volume: [1, 2, 3, 4, 5, 6, 8, 10, 12, 16, 20, 24, 25, 30, 32, 40, 48, 50, 64, 75, 100, 128, 150, 200, 250, 500, 750, 1000],
  data: [1, 2, 4, 5, 8, 10, 16, 20, 25, 32, 50, 64, 100, 128, 200, 250, 256, 500, 512, 1000, 1024, 2000, 2048, 4000, 5000, 10000],
  speed: [1, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60, 65, 70, 75, 80, 90, 100, 110, 120, 130, 140, 150, 200, 250, 300],
  time: [1, 2, 3, 4, 5, 6, 8, 10, 12, 15, 20, 24, 30, 36, 40, 45, 48, 50, 60, 72, 90, 100, 120, 150, 180, 240, 300, 360, 480, 500, 600, 720, 1000, 1440],
  css: [1, 2, 4, 6, 8, 10, 11, 12, 13, 14, 15, 16, 17, 18, 20, 22, 24, 26, 28, 30, 32, 36, 40, 44, 48, 56, 60, 64, 72, 80, 96, 100, 120, 128, 150, 200],
};

// Conversion pairs worth building value pages for, with the value set to use.
const PAIRS = [
  ['feet', 'centimeters', 'human'], ['centimeters', 'feet', 'small'],
  ['feet', 'meters', 'human'], ['meters', 'feet', 'small'],
  ['inches', 'centimeters', 'small'], ['centimeters', 'inches', 'small'],
  ['inches', 'millimeters', 'small'], ['millimeters', 'inches', 'small'],
  ['pounds', 'kilograms', 'weight'], ['kilograms', 'pounds', 'weight'],
  ['ounces', 'grams', 'small'], ['grams', 'ounces', 'small'],
  ['stones', 'kilograms', 'small'], ['kilograms', 'stones', 'weight'],
  ['miles', 'kilometers', 'distance'], ['kilometers', 'miles', 'distance'],
  ['yards', 'meters', 'small'], ['meters', 'yards', 'small'],
  ['liters', 'gallons', 'volume'], ['gallons', 'liters', 'volume'],
  ['milliliters', 'cups', 'volume'], ['cups', 'milliliters', 'volume'],
  ['fluid-ounces', 'milliliters', 'volume'], ['milliliters', 'fluid-ounces', 'volume'],
  ['kilometers-per-hour', 'miles-per-hour', 'speed'], ['miles-per-hour', 'kilometers-per-hour', 'speed'],
  ['megabytes', 'gigabytes', 'data'], ['gigabytes', 'megabytes', 'data'],
  ['kilobytes', 'megabytes', 'data'], ['gigabytes', 'terabytes', 'data'],
  ['minutes', 'hours', 'time'], ['hours', 'days', 'time'],
  ['seconds', 'minutes', 'time'], ['days', 'hours', 'time'],
  ['square-feet', 'square-meters', 'small'], ['square-meters', 'square-feet', 'small'],
  ['acres', 'hectares', 'small'], ['hectares', 'acres', 'small'],
];

// Feet-and-inches values are written as ft.in — 5.11 means 5 ft 11 in, and
// 5.2 means 5 ft 2 in. Parse the decimal part as a literal inch count from the
// string rather than as a fraction, which would turn 5.2 into 20 inches.
function feetValue(v, fromId) {
  if (fromId !== 'feet') return { num: v, label: null };
  if (Number.isInteger(v)) return { num: v, label: v + (v === 1 ? ' foot' : ' feet') };
  const [ftS, inS = '0'] = String(v).split('.');
  const ft = parseInt(ftS, 10);
  const inch = parseInt(inS, 10);
  if (!(inch >= 0 && inch < 12)) return { num: v, label: v + ' feet' };
  return {
    num: ft + inch / 12,
    label: `${ft} feet ${inch} inch${inch === 1 ? '' : 'es'}`,
    slugLabel: `${ft}-feet-${inch}-inches`,
  };
}

function valuePage(from, to, raw, all) {
  const fv = feetValue(raw, from.id);
  const v = fv.num;
  const k = from.f / to.f;
  const result = v * k;
  const slug = fv.slugLabel
    ? `/convert/${fv.slugLabel}-to-${to.id}/`
    : `/convert/${String(raw).replace('.', '-')}-${from.id}-to-${to.id}/`;

  const fromP = plural(from), toP = plural(to);
  const valLabel = fv.label || `${group(raw)} ${raw === 1 ? from.name : fromP}`;
  const near = [];
  const step = raw >= 100 ? 10 : raw >= 10 ? 1 : raw >= 1 ? 0.5 : 0.1;
  for (let i = -4; i <= 4; i++) {
    const x = +(v + i * step).toFixed(4);
    if (x <= 0) continue;
    near.push(`<tr${i === 0 ? ' style="font-weight:600"' : ''}><td>${fmtG(x)} ${from.sym}</td><td>${fmtG(x * k)} ${to.sym}</td></tr>`);
  }

  const h1 = `${valLabel} to ${toP}`;

  return {
    path: slug,
    title: `${valLabel} to ${title(toP)} — ${fmt(result)} ${to.sym} | Toolman`,
    desc: `${valLabel} equals ${fmt(result)} ${result === 1 ? to.name : toP}. See the calculation, a nearby-value table and a converter for any other ${from.catName.toLowerCase()} value.`,
    h1,
    crumbs: [
      { name: 'Converters', path: '/convert/' },
      { name: from.catName, path: `/convert/${from.catKey}/` },
      { name: `${title(fromP)} to ${title(toP)}`, path: `/convert/${from.id}-to-${to.id}/` },
      { name: valLabel, path: slug },
    ],
    jsonld: [{
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: [{
        '@type': 'Question',
        name: `How many ${toP} is ${valLabel}?`,
        acceptedAnswer: { '@type': 'Answer', text: `${valLabel} is ${fmt(result)} ${toP}.` },
      }],
    }],
    body: `<p class="big" style="font-size:1.5rem;margin:.4em 0">${valLabel} = <strong>${fmtG(result)} ${result === 1 ? to.name : toP}</strong></p>
<p class="muted">Rounded to a practical precision: <strong>${fmtG(+result.toFixed(result < 10 ? 2 : result < 1000 ? 1 : 0))} ${to.sym}</strong>.</p>

<div class="tool">
  <div class="grid2">
    <div><label for="a">${fromP}</label><input type="text" id="a" inputmode="decimal" value="${v}"></div>
    <div><label for="b">${toP}</label><input type="text" id="b" inputmode="decimal"></div>
  </div>
  <p class="big" id="eq"></p>
</div>
<script>
(function(){
 var A=document.getElementById('a'),B=document.getElementById('b'),E=document.getElementById('eq'),k=${k};
 function f(n){if(!isFinite(n))return '';var a=Math.abs(n);
  if(a!==0&&(a>=1e12||a<1e-5))return n.toExponential(5);
  var s=a>=1000?n.toFixed(Math.max(0,5-Math.floor(Math.log10(a)))):a>=1?n.toFixed(5):n.toPrecision(6);
  s=s.replace(/(\\.\\d*?)0+$/,'$1').replace(/\\.$/,'');
  var p=s.split('.');return p[0].replace(/\\B(?=(\\d{3})+(?!\\d))/g,',')+(p[1]?'.'+p[1]:'')}
 function eq(){var x=parseFloat(A.value);E.textContent=isFinite(x)?f(x)+' ${fromP} = '+f(x*k)+' ${toP}':''}
 A.addEventListener('input',function(){var x=parseFloat(A.value);B.value=isFinite(x)?f(x*k):'';eq()});
 B.addEventListener('input',function(){var x=parseFloat(B.value);A.value=isFinite(x)?f(x/k):'';eq()});
 B.value=f(${v}*k);eq();
})();
</script>

<h2>How the calculation works</h2>
<p>One ${from.name} is ${fmt(k)} ${k === 1 ? to.name : toP}, so:</p>
<pre><code>${fmt(v)} ${from.sym} × ${fmt(k)} = ${fmt(result)} ${to.sym}</code></pre>
<p>Reversing it, ${fmtG(result)} ${toP} ÷ ${fmt(k)} returns ${fmt(v)} ${fromP}.</p>

<h2>Nearby values</h2>
<table><thead><tr><th>${title(fromP)}</th><th>${title(toP)}</th></tr></thead><tbody>${near.join('')}</tbody></table>

<h2>About these units</h2>
<p><strong>${cap(from.name)} (${from.sym})</strong> — ${from.d}</p>
<p><strong>${cap(to.name)} (${to.sym})</strong> — ${to.d}</p>

<h2>Frequently asked questions</h2>
<div class="faq">
<h3>How many ${toP} is ${valLabel}?</h3>
<p>${valLabel} is <strong>${fmtG(result)} ${toP}</strong>.</p>
<h3>How do I convert ${fromP} to ${toP} myself?</h3>
<p>Multiply by ${fmt(k)}. To go back, divide by ${fmt(k)} — or multiply by ${fmt(1 / k)}.</p>
<h3>Is this figure exact?</h3>
<p>The conversion factor between the ${from.name} and the ${to.name} is fixed by definition. The figure above is rounded for readability; the converter carries full precision.</p>
</div>

<h2>Convert other values</h2>
<ul class="linklist">${all.map((p) => `<li><a href="${p.path}">${p.label}</a></li>`).join('')}</ul>
<p><a href="/convert/${from.id}-to-${to.id}/">Full ${fromP} to ${toP} converter</a> · <a href="/convert/${from.catKey}/">All ${from.catName.toLowerCase()} converters</a></p>`,
  };
}

// ---- temperature values ----
function tempPage(a, b, raw, all) {
  const conv = (x) => fromK[b.id](toK[a.id](x));
  const result = conv(raw);
  const path = `/convert/${String(raw).replace('.', '-').replace('-', 'minus-').replace('minus--', 'minus-')}-${a.id}-to-${b.id}/`;
  const label = `${raw}${a.sym}`;
  const near = [];
  for (let i = -4; i <= 4; i++) {
    const x = +(raw + i).toFixed(2);
    near.push(`<tr${i === 0 ? ' style="font-weight:600"' : ''}><td>${x}${a.sym}</td><td>${fmt(conv(x))}${b.sym}</td></tr>`);
  }
  return {
    path,
    title: `${label} to ${b.name} — ${fmt(result)}${b.sym} | Toolman`,
    desc: `${label} equals ${fmt(result)}${b.sym}. See the formula, a nearby-temperature table and a converter for any other value.`,
    h1: `${label} to ${b.name}`,
    crumbs: [
      { name: 'Converters', path: '/convert/' },
      { name: 'Temperature', path: '/convert/temperature/' },
      { name: `${a.name} to ${b.name}`, path: `/convert/${a.id}-to-${b.id}/` },
      { name: label, path },
    ],
    jsonld: [{
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: [{ '@type': 'Question', name: `What is ${label} in ${b.name}?`,
        acceptedAnswer: { '@type': 'Answer', text: `${label} is ${fmt(result)}${b.sym}.` } }],
    }],
    body: `<p class="big" style="font-size:1.5rem;margin:.4em 0">${label} = <strong>${fmt(result)}${b.sym}</strong></p>
<h2>Nearby temperatures</h2>
<table><thead><tr><th>${a.name}</th><th>${b.name}</th></tr></thead><tbody>${near.join('')}</tbody></table>
<h2>The formula</h2>
<pre><code>${a.id === 'celsius' && b.id === 'fahrenheit' ? '°F = °C × 9/5 + 32' :
      a.id === 'fahrenheit' && b.id === 'celsius' ? '°C = (°F − 32) × 5/9' :
      a.id === 'celsius' && b.id === 'kelvin' ? 'K = °C + 273.15' :
      a.id === 'kelvin' && b.id === 'celsius' ? '°C = K − 273.15' : `${b.sym} = convert(${a.sym})`}</code></pre>
<h2>About the scales</h2>
<p><strong>${a.name}</strong> — ${a.d}</p>
<p><strong>${b.name}</strong> — ${b.d}</p>
<h2>Frequently asked questions</h2>
<div class="faq">
<h3>What is ${label} in ${b.name}?</h3><p>${label} is <strong>${fmt(result)}${b.sym}</strong>.</p>
<h3>Is ${label} hot or cold?</h3>
<p>${(() => {
      const c = fromK.celsius(toK[a.id](raw));
      return c < -10 ? 'Very cold — well below freezing.' : c < 5 ? 'Cold — around or below freezing.'
        : c < 16 ? 'Cool — jacket weather.' : c < 24 ? 'Mild and comfortable for most people.'
        : c < 30 ? 'Warm.' : c < 40 ? 'Hot.' : c < 100 ? 'Very hot — above safe ambient temperature.'
        : 'Far above the boiling point of water — an oven or industrial temperature.';
    })()}</p>
</div>
<h2>Convert other temperatures</h2>
<ul class="linklist">${all.map((p) => `<li><a href="${p.path}">${p.label}</a></li>`).join('')}</ul>
<p><a href="/convert/${a.id}-to-${b.id}/">Full ${a.name} to ${b.name} converter</a></p>`,
  };
}

export default async function () {
  const pages = [];
  const seen = new Set();

  for (const [fromId, toId, setName] of PAIRS) {
    const from = byId.get(fromId), to = byId.get(toId);
    if (!from || !to) { console.warn('unknown unit pair', fromId, toId); continue; }
    const values = SETS[setName];
    const index = values.map((raw) => {
      const fv = feetValue(raw, fromId);
      const path = fv.slugLabel
        ? `/convert/${fv.slugLabel}-to-${toId}/`
        : `/convert/${String(raw).replace('.', '-')}-${fromId}-to-${toId}/`;
      return { path, label: `${fv.label || group(raw) + ' ' + plural(from)} to ${plural(to)}` };
    });
    for (const raw of values) {
      const p = valuePage(from, to, raw, index);
      if (seen.has(p.path)) continue;
      seen.add(p.path);
      pages.push(p);
    }
  }

  // temperature
  const tPairs = [['celsius', 'fahrenheit'], ['fahrenheit', 'celsius'], ['celsius', 'kelvin'], ['kelvin', 'celsius']];
  for (const [aId, bId] of tPairs) {
    const a = TEMPS.find((t) => t.id === aId), b = TEMPS.find((t) => t.id === bId);
    const values = SETS.temp.filter((v) => (aId === 'kelvin' ? v > 0 : true));
    const index = values.map((raw) => ({
      path: `/convert/${String(raw).replace('.', '-').replace('-', 'minus-').replace('minus--', 'minus-')}-${aId}-to-${bId}/`,
      label: `${raw}${a.sym} to ${b.name}`,
    }));
    for (const raw of values) {
      const p = tempPage(a, b, raw, index);
      if (seen.has(p.path)) continue;
      seen.add(p.path);
      pages.push(p);
    }
  }

  return pages;
}
