import { CATS, TEMPS, toK, fromK, plural } from '../data/units.mjs';
import { faq } from '../layout.mjs';

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
  // within-system conversions people still look up constantly
  ['inches', 'feet', 'small'], ['feet', 'inches', 'small'],
  ['meters', 'centimeters', 'small'], ['centimeters', 'meters', 'small'],
  ['kilometers', 'meters', 'distance'], ['meters', 'kilometers', 'distance'],
  ['millimeters', 'centimeters', 'small'], ['centimeters', 'millimeters', 'small'],
  ['kilograms', 'grams', 'weight'], ['grams', 'kilograms', 'small'],
  ['pounds', 'ounces', 'weight'], ['ounces', 'pounds', 'small'],
  ['liters', 'milliliters', 'volume'], ['milliliters', 'liters', 'volume'],
  ['gallons', 'quarts', 'volume'], ['quarts', 'cups', 'volume'],
  ['tablespoons', 'teaspoons', 'volume'], ['cups', 'tablespoons', 'volume'],
  ['weeks', 'days', 'time'], ['days', 'weeks', 'time'],
  ['years', 'days', 'time'], ['months', 'days', 'time'],
  ['hours', 'minutes', 'time'], ['minutes', 'seconds', 'time'],
  ['megabytes', 'kilobytes', 'data'], ['terabytes', 'gigabytes', 'data'],
  ['gigabytes', 'gibibytes', 'data'], ['megabits', 'megabytes', 'data'],
  ['miles-per-hour', 'knots', 'speed'], ['knots', 'miles-per-hour', 'speed'],
  ['kilometers-per-hour', 'meters-per-second', 'speed'],
  ['nautical-miles', 'kilometers', 'distance'],
];

// Feet-and-inches values are written as ft.in — 5.11 means 5 ft 11 in, and
// 5.2 means 5 ft 2 in. Parse the decimal part as a literal inch count from the
// string rather than as a fraction, which would turn 5.2 into 20 inches.
function feetValue(v, fromId) {
  if (fromId !== 'feet') return { num: v, label: null };
  if (Number.isInteger(v)) return { num: v, label: group(String(v)) + (v === 1 ? ' foot' : ' feet') };
  const [ftS, inS = '0'] = String(v).split('.');
  const ft = parseInt(ftS, 10);
  const inch = parseInt(inS, 10);
  if (!(inch >= 0 && inch < 12)) return { num: v, label: group(String(v)) + ' feet' };
  return {
    num: ft + inch / 12,
    label: `${ft} feet ${inch} inch${inch === 1 ? '' : 'es'}`,
    slugLabel: `${ft}-feet-${inch}-inches`,
  };
}


// Something concrete about the quantity itself. Pages for the same value in
// different target units otherwise differ only by a unit name and some digits,
// which is the weakest kind of programmatic page. This depends on the physical
// amount, so it gives each starting value its own paragraph.
function senseOf(catKey, baseValue, fromLabel) {
  const R = {
    length: [
      [0.005, 'thinner than a pencil'],
      [0.02, 'about the width of a thumb'],
      [0.1, 'roughly the width of a hand'],
      [0.3, 'about the long edge of a sheet of A4 paper'],
      [1, 'a little under the height of a kitchen counter'],
      [1.8, 'around the height of an adult'],
      [2.5, 'about the height of a room'],
      [10, 'roughly the width of a tennis court'],
      [30, 'about the length of a swimming pool'],
      [110, 'a little over the length of a football pitch'],
      [1000, 'a ten-minute walk'],
      [5000, 'a comfortable hour on foot'],
      [42195, 'the distance of a marathon'],
      [Infinity, 'a distance better measured on a map than on foot'],
    ],
    weight: [
      [0.005, 'about the mass of a sheet of paper'],
      [0.1, 'roughly a bar of chocolate'],
      [1, 'about a bag of sugar'],
      [5, 'roughly a house cat'],
      [15, 'about a full airline carry-on'],
      [23, 'the usual airline checked-baggage limit'],
      [50, 'a sack of cement'],
      [100, 'within the range of an adult human'],
      [300, 'about an upright piano'],
      [800, 'roughly a small car'],
      [Infinity, 'a load for machinery rather than a person'],
    ],
    volume: [
      [0.005, 'about a teaspoon'],
      [0.25, 'roughly a mug'],
      [1, 'a standard bottle of water'],
      [5, 'about a large kitchen bucket'],
      [50, 'roughly a car fuel tank'],
      [Infinity, 'a tank rather than a container'],
    ],
    time: [
      [60, 'about a minute'],
      [3600, 'an hour'],
      [86400, 'a day'],
      [604800, 'a week'],
      [2629746, 'about a month'],
      [Infinity, 'a span measured in years'],
    ],
    data: [
      [1e4, 'about a page of plain text'],
      [1e6, 'roughly a high-quality photograph'],
      [1e8, 'about a short video'],
      [1e10, 'a few hours of streaming'],
      [Infinity, 'more than most laptops hold'],
    ],
    area: [
      [1, 'about the footprint of a desk'],
      [50, 'roughly a small flat'],
      [1000, 'about a large garden'],
      [10000, 'roughly two football pitches'],
      [Infinity, 'a parcel of land rather than a room'],
    ],
    speed: [
      [1.5, 'walking pace'],
      [5, 'a steady run'],
      [15, 'cycling'],
      [30, 'urban traffic'],
      [70, 'motorway speed'],
      [Infinity, 'faster than road traffic'],
    ],
  };
  const table = R[catKey];
  if (!table) return '';
  const v = Math.abs(baseValue);
  for (const [max, phrase] of table) {
    if (v <= max) return `In everyday terms, ${fromLabel} is ${phrase}.`;
  }
  return '';
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
  const sense = senseOf(from.catKey, v * from.f, valLabel);

  const FAQ = faq([
    { q: `How many ${toP} is ${valLabel}?`,
      a: `${valLabel} is <strong>${fmtG(result)} ${toP}</strong>.` },
    { q: `How do I convert ${fromP} to ${toP} myself?`,
      a: `Multiply by ${fmtG(k)}. To go back, divide by ${fmtG(k)} — or multiply by ${fmtG(1 / k)}.` },
    { q: 'Is this figure exact?',
      a: `The conversion factor between the ${from.name} and the ${to.name} is fixed by definition. The figure above is rounded for readability; the converter carries full precision.` },
  ]);

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
    jsonld: [FAQ.schema],
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
<p>One ${from.name} is ${fmtG(k)} ${k === 1 ? to.name : toP}, so:</p>
<pre><code>${fmt(v)} ${from.sym} × ${fmt(k)} = ${fmt(result)} ${to.sym}</code></pre>
<p>Reversing it, ${fmtG(result)} ${toP} ÷ ${fmtG(k)} returns ${fmtG(v)} ${v === 1 ? from.name : fromP}.</p>

<h2>Nearby values</h2>
<table><thead><tr><th>${title(fromP)}</th><th>${title(toP)}</th></tr></thead><tbody>${near.join('')}</tbody></table>
${sense ? `<p class="muted">${sense}</p>` : ''}

<h2>About these units</h2>
<p><strong>${cap(from.name)} (${from.sym})</strong> — ${from.d}</p>
<p><strong>${cap(to.name)} (${to.sym})</strong> — ${to.d}</p>

${FAQ.html}

<h2>Convert other values</h2>
<ul class="linklist">${all.map((p) => `<li><a href="${p.path}">${p.label}</a></li>`).join('')}</ul>
<p><a href="/convert/${from.id}-to-${to.id}/">Full ${fromP} to ${toP} converter</a> · <a href="/convert/${from.catKey}/">All ${from.catName.toLowerCase()} converters</a></p>`,
  };
}

// ---- temperature values ----
function tempPage(a, b, raw, all) {
  const conv = (x) => fromK[b.id](toK[a.id](x));
  const result = conv(raw);
  const path = `/convert/${tempSlug(raw)}-${a.id}-to-${b.id}/`;
  const label = `${raw}${a.sym}`;
  const near = [];
  for (let i = -4; i <= 4; i++) {
    const x = +(raw + i).toFixed(2);
    near.push(`<tr${i === 0 ? ' style="font-weight:600"' : ''}><td>${x}${a.sym}</td><td>${fmt(conv(x))}${b.sym}</td></tr>`);
  }
  const celsius = fromK.celsius(toK[a.id](raw));
  const TFAQ = faq([
    { q: `What is ${label} in ${b.name}?`, a: `${label} is <strong>${fmt(result)}${b.sym}</strong>.` },
    { q: `Is ${label} hot or cold?`,
      a: celsius < -10 ? 'Very cold — well below freezing.' : celsius < 5 ? 'Cold — around or below freezing.'
        : celsius < 16 ? 'Cool — jacket weather.' : celsius < 24 ? 'Mild and comfortable for most people.'
        : celsius < 30 ? 'Warm.' : celsius < 40 ? 'Hot.' : celsius < 100 ? 'Very hot — above safe ambient temperature.'
        : 'Far above the boiling point of water — an oven or industrial temperature.' },
  ]);

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
    jsonld: [TFAQ.schema],
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
${TFAQ.html}
<h2>Convert other temperatures</h2>
<ul class="linklist">${all.map((p) => `<li><a href="${p.path}">${p.label}</a></li>`).join('')}</ul>
<p><a href="/convert/${a.id}-to-${b.id}/">Full ${a.name} to ${b.name} converter</a></p>`,
  };
}


// The value pages for each unit pair, keyed by "<from>-to-<to>". Exported so
// the pair page can link to its own children — without that link the value
// pages are only reachable from other value pages, which makes them an island
// Googlebot cannot walk into from the home page.
export const valueIndex = new Map();
for (const [fromId, toId, setName] of PAIRS) {
  const from = byId.get(fromId), to = byId.get(toId);
  if (!from || !to) continue;
  valueIndex.set(`${fromId}-to-${toId}`, SETS[setName].map((raw) => {
    const fv = feetValue(raw, fromId);
    return {
      path: fv.slugLabel
        ? `/convert/${fv.slugLabel}-to-${toId}/`
        : `/convert/${String(raw).replace('.', '-')}-${fromId}-to-${toId}/`,
      label: `${fv.label || group(raw) + ' ' + plural(from)} to ${plural(to)}`,
      short: fv.label || `${group(raw)} ${plural(from)}`,
    };
  }));
}


// Temperature slugs render negatives as "minus-", so these pairs need their own
// index rather than sharing the unit one. Exported for the same reason: without
// it the temperature value pages are only reachable from each other.

// 37.5 became "37minus-5" under the old chained replaces, because after the
// decimal point became a dash the sign substitution matched that dash instead
// of a leading minus. Take the sign off first, then the decimal point is the
// only dash there is.
const tempSlug = (v) => (v < 0 ? 'minus-' : '') + String(Math.abs(v)).replace('.', '-');

export const TEMP_PAIRS = [['celsius', 'fahrenheit'], ['fahrenheit', 'celsius'], ['celsius', 'kelvin'], ['kelvin', 'celsius']];
const tempValues = (aId) => SETS.temp.filter((v) => (aId === 'kelvin' ? v > 0 : true));
export const tempIndex = new Map();
for (const [aId, bId] of TEMP_PAIRS) {
  const a = TEMPS.find((t) => t.id === aId), b = TEMPS.find((t) => t.id === bId);
  tempIndex.set(`${aId}-to-${bId}`, tempValues(aId).map((raw) => ({
    path: `/convert/${tempSlug(raw)}-${aId}-to-${bId}/`,
    label: `${raw}${a.sym} to ${b.name}`,
    short: `${raw}${a.sym}`,
  })));
}

export default async function () {
  const pages = [];
  const seen = new Set();

  for (const [fromId, toId, setName] of PAIRS) {
    const from = byId.get(fromId), to = byId.get(toId);
    if (!from || !to) { console.warn('unknown unit pair', fromId, toId); continue; }
    const values = SETS[setName];
    const index = valueIndex.get(`${fromId}-to-${toId}`);
    for (const raw of values) {
      const p = valuePage(from, to, raw, index);
      if (seen.has(p.path)) continue;
      seen.add(p.path);
      pages.push(p);
    }
  }

  // temperature
  for (const [aId, bId] of TEMP_PAIRS) {
    const a = TEMPS.find((t) => t.id === aId), b = TEMPS.find((t) => t.id === bId);
    const values = tempValues(aId);
    const index = tempIndex.get(`${aId}-to-${bId}`);
    for (const raw of values) {
      const p = tempPage(a, b, raw, index);
      if (seen.has(p.path)) continue;
      seen.add(p.path);
      pages.push(p);
    }
  }

  return pages;
}
