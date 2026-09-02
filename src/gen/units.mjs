import { valueIndex, tempIndex } from './common-values.mjs';
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

  const values = valueIndex.get(`${from.id}-to-${to.id}`) || [];

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
    desc: `Convert ${fromP} to ${toP}. 1 ${from.name} = ${fmt(one)} ${one === 1 ? to.name : toP}. Free converter with the exact formula and a full conversion table.`,
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

${values.length ? `<h2>Common ${fromP} to ${toP} values</h2>
<p class="muted">Worked answers for the values people look up most.</p>
<ul class="linklist">${values.map((v) => `<li><a href="${v.path}">${esc(v.short)}</a></li>`).join('')}</ul>` : ''}

<h2>Related ${catName.toLowerCase()} conversions</h2>
<ul class="linklist">${sib}</ul>
<p><a href="/convert/${catKey}/">All ${catName.toLowerCase()} converters</a> · <a href="/convert/">All converters</a></p>`,
  };
}

// Each category hub was a table and a link list. The four smallest ran
// 124-139 words, the same shape as /convert/ when Google fetched it and
// declined to index it. A hub that gates pages needs to be worth landing on.
const CAT_NOTES = {
  length: `<h2>Where length conversions go wrong</h2>
<p>The inch has been defined as exactly 25.4&nbsp;mm since the international yard and pound agreement of 1959, so every imperial length conversion on this site is exact rather than measured. Before 1959 the US and the UK used slightly different inches, and the old US definition survives as the <em>survey foot</em>, which is larger by two parts per million. That is invisible on a tape measure and very visible across a county boundary, which is why US land surveys were still using it until it was officially retired.</p>
<p>The other recurring trap is writing feet and inches as a decimal. <code>5.2</code> does not mean 5&nbsp;ft 2&nbsp;in — as a decimal it is 5&nbsp;ft 2.4&nbsp;in, because a tenth of a foot is 1.2&nbsp;inches. Height pages here treat the part after the point as a literal inch count, which is what people mean when they type it.</p>`,
  weight: `<h2>Mass, not weight</h2>
<p>Everything in this category is really mass. Weight is a force — mass times local gravity — and it changes with altitude and latitude, while mass does not. Everyday usage merges the two and no harm is done, because scales are calibrated for Earth's surface, but the distinction is why the SI unit of force is the newton rather than the kilogram.</p>
<h2>The tons</h2>
<p>Three different tons are in common use and they are close enough to be mistaken for one another: the <strong>metric ton</strong> is 1,000&nbsp;kg, the <strong>US short ton</strong> is 2,000&nbsp;lb (907.18&nbsp;kg), and the <strong>UK long ton</strong> is 2,240&nbsp;lb (1,016&nbsp;kg). A shipping quote in "tons" is ambiguous by about 12% unless it says which. The pound itself is exact: 0.45359237&nbsp;kg by definition.</p>`,
  data: `<h2>Why a 1&nbsp;TB drive shows as 931&nbsp;GB</h2>
<p>Two different definitions of the prefixes are in use. Storage manufacturers use the decimal SI meaning, where a terabyte is 10<sup>12</sup> bytes. Operating systems have traditionally used binary multiples, where the same quantity is 2<sup>40</sup> bytes. The drive is not smaller than advertised; the two systems are counting in different bases, and the gap widens with each prefix — 2.4% at kilo, 7.4% at giga, 10% at tera.</p>
<p>The IEC introduced <strong>kibibyte, mebibyte and gibibyte</strong> (KiB, MiB, GiB) for the binary meanings so that the SI prefixes could keep their decimal ones. Adoption is partial: Linux tools and macOS report decimal, Windows reports binary while labelling it "GB", and RAM is always sold in binary multiples regardless. Both conventions are available here so you can convert between them explicitly rather than guessing which one a number came from.</p>`,
  area: `<h2>Squared units square the factor</h2>
<p>The most common error in area conversion is reusing the length factor. There are 3.28 feet in a metre, but there are 3.28<sup>2</sup> = 10.76 square feet in a square metre. The same applies throughout: a square kilometre is a million square metres, not a thousand, because the factor 1,000 is squared.</p>
<h2>Acres and hectares</h2>
<p>An acre was originally the area a yoke of oxen could plough in a day, which is why it is an awkward 4,046.86&nbsp;m². A hectare is a clean 10,000&nbsp;m², or a square 100&nbsp;m on a side. The useful approximation is that a hectare is about two and a half acres — precisely, 2.471. A football pitch is close to one hectare, which makes it a workable mental yardstick for either unit.</p>`,
  volume: `<h2>US and imperial measures are not the same</h2>
<p>This is the category where an unmarked unit does the most damage. A <strong>US gallon is 3.785&nbsp;L; an imperial gallon is 4.546&nbsp;L</strong> — a difference of 20%. Everything derived from them differs too: US pints, quarts and fluid ounces are all smaller than their imperial namesakes, except that the US fluid ounce is very slightly <em>larger</em> (29.57&nbsp;mL against 28.41&nbsp;mL), because the two systems divide their gallons differently. A fuel-economy figure in miles per gallon means two noticeably different things either side of the Atlantic.</p>
<h2>Cups are a special case</h2>
<p>A cup is a unit of volume, but recipes use it to measure ingredients by weight, and the conversion depends entirely on what is in the cup. A cup of water is 236&nbsp;g, a cup of flour about 125&nbsp;g, a cup of honey about 340&nbsp;g. That is a property of the ingredient rather than of the unit, so those live on the <a href="/cooking/">cooking pages</a> instead of here.</p>`,
  speed: `<h2>The units and where each is used</h2>
<p>Road speeds are kilometres or miles per hour, air and sea speeds are knots, and physics is metres per second. A <strong>knot</strong> is one nautical mile per hour, and a nautical mile is exactly 1,852&nbsp;m — chosen because it is one minute of latitude, which makes navigation arithmetic on a chart trivial. That is why aviation and shipping kept it while everything else moved on.</p>
<h2>Mach is not a fixed speed</h2>
<p>Mach 1 is the local speed of sound, which depends on air temperature and therefore on altitude. It is about 1,225&nbsp;km/h at sea level on a standard day and around 1,062&nbsp;km/h in the stratosphere, where airliners cruise. The figure used here is the sea-level standard, so treat a Mach conversion as an approximation unless you know the conditions.</p>`,
  time: `<h2>Months and years are not fixed</h2>
<p>Seconds through weeks are exact multiples of one another. Months and years are not: a month is anywhere from 28 to 31 days, and a year is 365 or 366. Conversions involving them have to pick an average, and this site uses the Gregorian mean — 365.2425 days per year and one twelfth of that, 30.436875 days, per month.</p>
<p>That is the right choice for a rate ("how many seconds in a year") and the wrong one for a date ("what is 18 months from today"), where you want calendar arithmetic that lands on a real date. The <a href="/age-calculator/">age calculator</a> does the second kind, counting actual calendar months rather than multiplying by an average.</p>
<h2>Leap seconds</h2>
<p>Unix time deliberately ignores leap seconds, so a Unix day is always exactly 86,400 seconds even when the day it represents was not. This keeps the arithmetic simple at the cost of drifting slightly from astronomical time — a trade nearly every system makes.</p>`,
  pressure: `<h2>The unit depends on the industry</h2>
<p>Pressure has more units in active use than almost any other quantity, because several fields standardised independently. The SI unit is the <strong>pascal</strong>, one newton per square metre, which is so small that meteorology works in hectopascals and engineering in kilopascals. A <strong>bar</strong> is 100,000&nbsp;Pa, chosen to be roughly one atmosphere, and it survives in European engineering. <strong>psi</strong> dominates in the US, including tyre pressures everywhere they are sold.</p>
<h2>Millimetres of mercury</h2>
<p>Blood pressure is still quoted in millimetres of mercury, and so is vacuum work. The unit is literally the height of a mercury column that the pressure will support, which is why the original barometers were about 760&nbsp;mm tall — one atmosphere. Aviation uses inches of mercury for altimeter settings in the US and hectopascals almost everywhere else, which is a genuine source of confusion in the cockpit.</p>
<h2>Gauge and absolute</h2>
<p>A tyre gauge reading zero does not mean the tyre is a vacuum; it means the pressure inside matches the atmosphere outside. Readings that measure against the surrounding air are <em>gauge</em> pressure, often written psig, and readings that measure against a vacuum are <em>absolute</em>, psia. They differ by one atmosphere, about 14.7&nbsp;psi. The conversions here are between units and leave that reference point alone.</p>`,
  energy: `<h2>Which calorie</h2>
<p>The word covers two units differing by a factor of a thousand. The <strong>small calorie</strong> is the energy to heat one gram of water by one degree Celsius, about 4.184&nbsp;J. The <strong>large calorie</strong>, or kilocalorie, is a thousand of those. Food labelling uses the large one but almost always writes it with a small c, so a 200-calorie snack is really 200&nbsp;kcal, or about 837&nbsp;kJ. Labels outside the US usually give both.</p>
<h2>Energy and power are different quantities</h2>
<p>A watt is a rate; a joule is an amount. Multiplying a rate by a time gives an amount, which is where the <strong>kilowatt-hour</strong> comes from: a kilowatt sustained for an hour, or 3.6&nbsp;million joules. Electricity is billed in kilowatt-hours because the meaningful question is how much energy was delivered, not how fast. If a figure is quoted in watts, it belongs in <a href="/convert/power/">power</a> rather than here.</p>`,
  power: `<h2>Power is a rate, energy is an amount</h2>
<p>A watt is one joule per second — a rate of delivery, not a quantity. The distinction matters when reading a specification: a kettle rated at 3&nbsp;kW draws that much while it is on, and how much energy it uses depends entirely on how long you run it. Multiply the rate by the time and you get energy, which is why your electricity bill is in <a href="/convert/energy/">kilowatt-hours</a> rather than kilowatts.</p>
<h2>Three different horsepower</h2>
<p>The unit is not standardised. <strong>Mechanical horsepower</strong>, the one meant in English-speaking car specifications, is 745.7&nbsp;W. <strong>Metric horsepower</strong> — PS in German, CV in French and Italian — is 735.5&nbsp;W, about 1.4% smaller, and is what European manufacturers quote at home. A car advertised as 300&nbsp;PS is 296&nbsp;hp, which is where small discrepancies between a manufacturer's figures in different markets usually come from. This site uses mechanical horsepower.</p>
<p>James Watt derived the unit by measuring how much a working horse could lift, specifically to sell steam engines against the animals they replaced. A real horse can exceed one horsepower briefly and sustains rather less.</p>
<h2>BTU per hour</h2>
<p>Heating and air conditioning in the US are rated in BTU per hour, which is a power despite looking like an energy unit — the "per hour" is doing the work. One watt is about 3.41&nbsp;BTU/h, so a 12,000&nbsp;BTU/h air conditioner is roughly 3.5&nbsp;kW of cooling. Confusingly, that same machine is often called a "one ton" unit, from the rate of cooling one ton of ice melting over a day.</p>`,
  angle: `<h2>Why 360 degrees</h2>
<p>The division is Babylonian and survives because 360 has an unusual number of divisors — 24 of them — so halves, thirds, quarters, fifths, sixths, eighths, ninths, tenths and twelfths of a circle are all whole numbers of degrees. Nothing about the choice is natural; it is simply convenient, and no proposed replacement has ever displaced it.</p>
<h2>Radians are the natural unit</h2>
<p>A radian is the angle subtended by an arc equal in length to the radius, which makes a full turn 2π radians. It looks awkward and is in fact the unit that makes the mathematics simple: the derivative of sin&nbsp;x is cos&nbsp;x only when x is in radians, and arc length is just radius times angle. Every trigonometric function in a programming language expects radians, which is the single most common source of wrong answers in graphics and geometry code — <code>Math.sin(90)</code> is not 1.</p>
<h2>Minutes, seconds and gradians</h2>
<p>A degree divides into 60 <strong>arcminutes</strong> and each of those into 60 <strong>arcseconds</strong>, the same sexagesimal scheme as clock time and from the same source. Latitude and longitude are still written this way, and one arcminute of latitude is one nautical mile by definition. The <strong>gradian</strong> divides the circle into 400 instead, so a right angle is a round 100 — a metric-era proposal that survives in some European surveying and on scientific calculators, and almost nowhere else.</p>`,
  frequency: `<h2>Hertz is just "per second"</h2>
<p>One hertz is one cycle per second, so the unit is dimensionally the inverse of time. That is why frequency and period are reciprocals: a 50&nbsp;Hz mains supply has a period of 20&nbsp;milliseconds, and a 2.4&nbsp;GHz radio has a period of about 0.42&nbsp;nanoseconds. If you know one, dividing 1 by it gives the other.</p>
<h2>Where each scale turns up</h2>
<p>Mains electricity is 50&nbsp;Hz in most of the world and 60&nbsp;Hz in the Americas. Audio spans roughly 20&nbsp;Hz to 20&nbsp;kHz, the range of human hearing, and CD audio samples at 44.1&nbsp;kHz — a little over twice the top of that range, because the Nyquist limit requires sampling at more than double the highest frequency you intend to reproduce. Wi-Fi and processor clocks are in the gigahertz, where a single cycle is short enough that the distance light travels in it becomes a design constraint: at 3&nbsp;GHz, light moves about 10&nbsp;cm per cycle.</p>
<h2>RPM is a frequency</h2>
<p>Revolutions per minute measures the same quantity in different units — one RPM is 1/60&nbsp;Hz. Engines, hard drives and motors are specified this way by convention. A 7,200&nbsp;RPM drive spins at 120&nbsp;Hz, which is also why drive vibration tends to show up as a hum near that frequency.</p>`,
};

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

      const kStr = fmtG(k), invStr = fmtG(1 / k);
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
        .join('')}</ul>
${CAT_NOTES[catKey] || ''}`,
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
${(tempIndex.get(`${a.id}-to-${b.id}`) || []).length ? `<h2>Common ${a.name} to ${b.name} values</h2>
<p class="muted">Worked answers for the temperatures people look up most.</p>
<ul class="linklist">${tempIndex.get(`${a.id}-to-${b.id}`).map((v) => `<li><a href="${v.path}">${esc(v.short)}</a></li>`).join('')}</ul>` : ''}

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
<h2>The scales</h2>${TEMPS.map((t) => `<h3>${t.name} (${esc(t.sym)})</h3><p>${t.d}</p>`).join('')}

<h2>Why temperature is not like other conversions</h2>
<p>Every other unit conversion is a single multiplication, because the scales share a zero point: zero metres and zero feet are the same length, so one factor covers it. Temperature scales disagree about where zero is <em>and</em> how big a degree is, so a conversion needs a multiplication and an offset. That is why you cannot convert a temperature <em>difference</em> the same way as a temperature: a rise of 10&nbsp;°C is a rise of 18&nbsp;°F, not 50&nbsp;°F, because the offset applies to the reading and not to the interval.</p>

<h2>The one point where two scales agree</h2>
<p>Celsius and Fahrenheit cross at <strong>&minus;40&deg;</strong>, where both scales give the same number. It falls out of the arithmetic rather than being designed in, and it makes a convenient sanity check: any conversion that does not map &minus;40 to &minus;40 has the offset wrong. Kelvin and Rankine both start at absolute zero, so they never go negative and never cross the other two.</p>

<h2>Absolute zero and why Kelvin has no degree sign</h2>
<p>Kelvin measures from absolute zero, the point at which a system holds no thermal energy that can be removed. It is written <strong>295&nbsp;K</strong> rather than 295&nbsp;°K, because a kelvin is a unit in its own right rather than a position on a graduated scale. A kelvin is the same size as a degree Celsius, so converting between them is pure addition: subtract 273.15 to get Celsius. Rankine does the same job for Fahrenheit-sized degrees and appears mainly in US thermodynamics.</p>

<h2>Reference points worth knowing</h2>
<table>
<thead><tr><th></th><th>Celsius</th><th>Fahrenheit</th><th>Kelvin</th></tr></thead>
<tbody>
<tr><td>Absolute zero</td><td>&minus;273.15</td><td>&minus;459.67</td><td>0</td></tr>
<tr><td>Water freezes</td><td>0</td><td>32</td><td>273.15</td></tr>
<tr><td>Room temperature</td><td>21</td><td>69.8</td><td>294.15</td></tr>
<tr><td>Body temperature</td><td>37</td><td>98.6</td><td>310.15</td></tr>
<tr><td>Water boils at sea level</td><td>100</td><td>212</td><td>373.15</td></tr>
</tbody>
</table>
<p>Body temperature is the one people misremember. 98.6&nbsp;°F looks like a precise measurement but is simply 37&nbsp;°C converted, and the original nineteenth-century figure was never that exact. Modern studies put the average slightly lower, nearer 36.6&nbsp;°C.</p>

<h2>Doing it in your head</h2>
<p>To go from Celsius to Fahrenheit, <strong>double it and add 30</strong>. That is exact at 10&nbsp;°C and within 4 degrees anywhere between &minus;10&nbsp;°C and 30&nbsp;°C, which covers ordinary weather. It drifts badly at the extremes — at 100&nbsp;°C it is out by 18 degrees — so use the real formula for anything that matters. Going the other way, subtract 30 and halve.</p>`,
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
    h1: 'Unit converters',
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
