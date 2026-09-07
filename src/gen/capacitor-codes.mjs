import { esc, faq, ring } from '../layout.mjs';

// `104 capacitor value` returns Budgetronics, SPECAP, Reddit, Facebook and a
// couple of blog posts; `smd resistor code 103 value` returns DigiKey's
// calculator and three YouTube shorts. Same shape as the resistor section and
// the ports section before it: everyone serves the chart, nobody serves the
// entry.
//
// Same space too — weak incumbents and an answer that is a rule rather than a
// paid table. The three-digit code is two significant digits and a power of ten
// in picofarads, and that is the whole of it.
//
// The resistor section shipped at 86% overlap and had to be rescued afterwards,
// because 15 Ω and 15 kΩ differ in one band and nothing else. The fix there was
// per-value facts that actually differ — the power it can take, whether it is
// an E12 value. This section starts with the equivalent rather than retrofitting
// it: reactance at the frequencies a capacitor is actually chosen for changes by
// six orders of magnitude across this range, and it is the number somebody
// picking a capacitor needs.

// E12 significands. Ceramic capacitors are made in this series; generating all
// 100 two-digit combinations would be pages for parts that are not manufactured.
const E12 = [10, 12, 15, 18, 22, 27, 33, 39, 47, 56, 68, 82];

// Third digit is the power of ten, in picofarads. 8 and 9 are the exceptions:
// they divide rather than multiply, which is how sub-10 pF values are marked.
const MULTIPLIER = {
  0: 1, 1: 10, 2: 100, 3: 1e3, 4: 1e4, 5: 1e5, 6: 1e6, 8: 0.01, 9: 0.1,
};

const TOLERANCE = [
  ['B', '±0.1 pF'], ['C', '±0.25 pF'], ['D', '±0.5 pF'], ['F', '±1%'],
  ['G', '±2%'], ['J', '±5%'], ['K', '±10%'], ['M', '±20%'], ['Z', '+80% / −20%'],
];

const DECADE_USE = {
  9: 'Values of a few picofarads are trimming and compensation parts — tuning a crystal oscillator onto frequency, flattening the response of a probe, neutralising stray capacitance in an RF stage. At this size the capacitance of the board traces either side of the part is a serious fraction of the part itself.',
  0: 'Tens of picofarads is the crystal load range: the two capacitors either side of a quartz crystal that set it oscillating at its marked frequency. Also RF tuning and the compensation capacitor round a fast op-amp.',
  1: 'Hundreds of picofarads is filtering at radio frequencies and the timing element in fast oscillators. Below a nanofarad, a ceramic capacitor is close to ideal — very little loss, very little drift — which is why this range is used where accuracy matters.',
  2: 'Single-figure nanofarads is audio filtering and snubbing across switch contacts. It is also the range where a capacitor stops being a precision component and starts being a bypass, depending on the dielectric it is made from.',
  3: 'Tens of nanofarads is coupling between audio stages and the smaller decoupling capacitors on a logic board. A 10 nF part alongside a 100 nF one is a common pairing, the smaller of the two handling the frequencies the larger one is too slow for.',
  4: 'A hundred nanofarads is the decoupling capacitor — the one that sits beside every integrated circuit on every board, holding the supply steady through the current spike each time the chip switches. If a board has one value on it more than any other, it is this one.',
  5: 'Hundreds of nanofarads up to a microfarad is bulk decoupling and audio coupling where the low end has to survive. Ceramics this large have moved to multilayer construction, and the capacitance falls off sharply with applied voltage — a part marked 1 µF can measure half that with its rated voltage across it.',
  6: 'Microfarads and up is bulk energy storage: holding a rail up between switching cycles, smoothing a supply, or coupling a signal that goes down to a few hertz. Above about 10 µF ceramics give way to electrolytics and tantalums, which is why the code runs out here.',
};

const CODES = [];
for (const [digit, mult] of Object.entries(MULTIPLIER).map(([k, v]) => [+k, v])) {
  for (const sig of E12) {
    const pf = sig * mult;
    // The marked code is the two digits and the multiplier digit.
    CODES.push({ code: `${sig}${digit}`, sig, digit, mult, pf });
  }
}

// Read the code the way a person reads the part, and check it against the value
// the page is about to print.
const decode = (code) => {
  const sig = +code.slice(0, 2);
  const digit = +code.slice(2);
  return sig * MULTIPLIER[digit];
};

// Fixed decimal places cannot render a value whose magnitude is unknown in
// advance: 0.39 pF in microfarads is 0.00000039, and toFixed(6) makes that a
// zero. Significant figures hold across the whole range, and anything that
// still rounds away gets exponential notation rather than a false zero.
const sigFig = (v, digits = 4) => {
  if (v === 0) return '0';
  if (Math.abs(v) >= 1000) return (+v.toPrecision(digits)).toLocaleString('en-US');
  const fixed = +v.toPrecision(digits);
  if (Math.abs(fixed) < 1e-4) return fixed.toExponential(2);
  return String(fixed);
};
const pfStr = (pf) => (+pf.toFixed(2)).toLocaleString('en-US');
const fmt = (pf) => {
  if (pf >= 1e6) return `${+(pf / 1e6).toFixed(3)} µF`;
  if (pf >= 1e3) return `${+(pf / 1e3).toFixed(3)} nF`;
  return `${pfStr(pf)} pF`;
};
const allUnits = (pf) => `${pfStr(pf)} pF · ${sigFig(pf / 1e3)} nF · ${sigFig(pf / 1e6)} µF`;

const reactance = (pf, hz) => 1 / (2 * Math.PI * hz * (pf * 1e-12));
const ohms = (x) => {
  if (x >= 1e9) return `${+(x / 1e9).toFixed(2)} GΩ`;
  if (x >= 1e6) return `${+(x / 1e6).toFixed(2)} MΩ`;
  if (x >= 1e3) return `${+(x / 1e3).toFixed(2)} kΩ`;
  if (x >= 1) return `${+x.toFixed(2)} Ω`;
  return `${+(x * 1e3).toFixed(1)} mΩ`;
};

export default async function () {
  const pages = [];

  // Every page prints a code and a value. Reading the code back has to give the
  // value, or the page disagrees with itself — the failure that hit all 168
  // resistor pages before the round-trip check caught it.
  {
    const bad = [];
    for (const c of CODES) {
      const back = decode(c.code);
      if (Math.abs(back - c.pf) > c.pf * 1e-9) bad.push(`${c.code}: decodes to ${fmt(back)}, page says ${fmt(c.pf)}`);
    }
    if (bad.length) {
      console.error(`\n✗ capacitor: ${bad.length} code(s) that do not decode to their own value:`);
      for (const b of bad.slice(0, 6)) console.error('    ' + b);
      process.exitCode = 1;
    }
  }

  // Two codes must not share a URL, and the code must be three characters — a
  // significand outside 10–99 would silently produce a four-character code that
  // decodes as something else entirely.
  {
    const seen = new Map();
    for (const c of CODES) {
      if (c.code.length !== 3) {
        console.error(`\n✗ capacitor: "${c.code}" is not a three-digit code`);
        process.exitCode = 1;
      }
      if (seen.has(c.code)) {
        console.error(`\n✗ capacitor: ${fmt(seen.get(c.code))} and ${fmt(c.pf)} both want /capacitor/${c.code}/`);
        process.exitCode = 1;
      }
      seen.set(c.code, c.pf);
    }
  }

  // pF, nF and µF are the same number three ways. A page that prints all three
  // has three chances to print one that does not match.
  for (const c of CODES) {
    if (Math.abs(c.pf / 1e3 - c.pf * 1e-3) > 1e-12 || Math.abs(c.pf / 1e6 - c.pf * 1e-6) > 1e-15) {
      console.error(`\n✗ capacitor ${c.code}: the pF, nF and µF figures are not the same quantity`);
      process.exitCode = 1;
    }
  }

  // Reactance falls as frequency rises, always. A sign or a reciprocal the wrong
  // way up would still print plausible-looking ohms.
  for (const c of CODES) {
    if (!(reactance(c.pf, 10e3) < reactance(c.pf, 1e3))) {
      console.error(`\n✗ capacitor ${c.code}: reactance does not fall as frequency rises`);
      process.exitCode = 1;
    }
    if (Math.abs(reactance(c.pf, 1e3) / reactance(c.pf, 10e3) - 10) > 1e-6) {
      console.error(`\n✗ capacitor ${c.code}: a tenfold frequency change does not give a tenfold reactance change`);
      process.exitCode = 1;
    }
  }

  // The rendered figures, not the numbers behind them. pF, nF and µF were
  // already checked as quantities and agreed; what went out was "0 µF" for a
  // 0.39 pF part, because the renderer lost what the arithmetic had right.
  for (const c of CODES) {
    for (const [unit, shown] of [['nF', sigFig(c.pf / 1e3)], ['µF', sigFig(c.pf / 1e6)]]) {
      if (Number(shown) === 0) {
        console.error(`\n✗ capacitor ${c.code}: ${c.pf} pF renders as 0 ${unit}, which is not a capacitance`);
        process.exitCode = 1;
      }
    }
  }

  const codes = CODES.map((c) => c.code);
  const FREQ = [[50, '50 Hz — mains'], [1e3, '1 kHz — audio'], [1e5, '100 kHz — switching'], [1e7, '10 MHz — RF']];

  for (const c of CODES) {
    const { code, sig, digit, mult, pf } = c;
    const use = DECADE_USE[digit];
    const nf = pf / 1e3;
    const uf = pf / 1e6;

    const FAQ = faq([
      {
        q: `What is the value of a ${code} capacitor?`,
        a: `<strong>${fmt(pf)}</strong> — ${allUnits(pf)}. The first two digits are the value in picofarads and the third is how many zeros follow, so ${code} is ${sig} followed by ${digit === 8 || digit === 9 ? `a divide rather than a multiply: ${sig} × ${mult}` : `${digit} zero${digit === 1 ? '' : 's'}`} = ${pfStr(pf)} pF.`,
      },
      {
        q: `What is a ${code} capacitor in µF?`,
        a: `<strong>${sigFig(uf)} µF.</strong> Going from picofarads to microfarads is six decimal places, which is where most of the confusion with these codes comes from — ${pfStr(pf)} pF, ${sigFig(nf)} nF and ${sigFig(uf)} µF are the same capacitor written three ways.`,
      },
      {
        q: `What does the letter after ${code} mean?`,
        a: `Tolerance. <code>${code}K</code> is ±10%, <code>${code}J</code> is ±5% and <code>${code}M</code> is ±20% — so a ${code}K is anywhere from ${fmt(pf * 0.9)} to ${fmt(pf * 1.1)} and still in specification. A <code>Z</code> means +80%/−20%, which is not a mistake: some ceramic dielectrics really are that loose.`,
      },
      {
        q: `What is the impedance of a ${code} capacitor at 1 kHz?`,
        a: `<strong>${ohms(reactance(pf, 1e3))}.</strong> Reactance is <code>1 ÷ (2πfC)</code>, so it falls as the frequency rises: the same part is ${ohms(reactance(pf, 1e5))} at 100 kHz and ${ohms(reactance(pf, 1e7))} at 10 MHz.`,
      },
    ]);

    // fmt() picks whichever unit reads best, so pinning the second one to µF
    // made 105 read "1 µF, 1 µF". The second unit is chosen against the first.
    const second = pf >= 1e6 ? `${(+nf.toFixed(0)).toLocaleString('en-US')} nF`
      : pf >= 1e3 ? `${pfStr(pf)} pF`
      : null;
    const titleFull = second ? `${code} Capacitor Code — ${fmt(pf)}, ${second}` : `${code} Capacitor Code — ${fmt(pf)}`;
    pages.push({
      path: `/capacitor/${code}/`,
      title: titleFull.length <= 65 ? titleFull : `${code} Capacitor Code — ${fmt(pf)}`,
      desc: `A ${code} capacitor is ${fmt(pf)} — ${allUnits(pf)}. How the three-digit code decodes, what the tolerance letter after it means, and the reactance at 50 Hz, 1 kHz, 100 kHz and 10 MHz.`,
      h1: `${code} capacitor value`,
      crumbs: [
        { name: 'Capacitor codes', path: '/capacitor/' },
        { name: code, path: `/capacitor/${code}/` },
      ],
      jsonld: [FAQ.schema],
      body: `<p class="big" style="font-size:1.8rem;margin:.3em 0"><strong>${fmt(pf)}</strong></p>
<p class="muted">${allUnits(pf)}</p>

<table><tbody>
<tr><td>Marked code</td><td class="out">${code}</td></tr>
<tr><td>Picofarads</td><td class="out">${pfStr(pf)} pF</td></tr>
<tr><td>Nanofarads</td><td class="out">${sigFig(nf)} nF</td></tr>
<tr><td>Microfarads</td><td class="out">${sigFig(uf)} µF</td></tr>
<tr><td>Farads</td><td class="out">${(pf * 1e-12).toExponential(2)} F</td></tr>
</tbody></table>

<h2>Reading the code</h2>
<p>The three digits are not a part number. The first two are the value in <strong>picofarads</strong> and the third says what to do with them:</p>
<p><code>${sig} ${digit === 8 || digit === 9 ? `× ${mult}` : `× 10<sup>${digit}</sup>`} = ${pfStr(pf)} pF</code></p>
<p>${digit === 8 || digit === 9
  ? `The last digit here is ${digit}, which is one of the two exceptions. Eight and nine do not mean 10⁸ and 10⁹ — they mean × 0.01 and × 0.1, and they exist so that values below ten picofarads can be written in the same three characters. Read literally, ${code} would be ${sig} × 10<sup>${digit}</sup> = ${(sig * Math.pow(10, digit) / 1e6).toLocaleString()} µF, which is not a ceramic capacitor and not what is in your hand.`
  : `So ${code} is ${sig} followed by ${digit} zero${digit === 1 ? '' : 's'}: ${pfStr(pf)} pF. The code is always in picofarads even when the part is sold in microfarads, which is the whole difficulty with it — a capacitor marked ${code} is stocked as ${+uf.toFixed(6)} µF and the two numbers look nothing alike.`}</p>

<h2>What ${fmt(pf)} does at frequency</h2>
<p>A capacitor's opposition to a signal is its reactance, <code>1 ÷ (2πfC)</code>, and it falls as the frequency rises. Over the range of frequencies a circuit can put across it, a ${fmt(pf)} part covers several orders of magnitude:</p>
<table><thead><tr><th>Frequency</th><th>Reactance</th></tr></thead><tbody>
${FREQ.map(([hz, label]) => `<tr><td>${label}</td><td>${ohms(reactance(pf, hz))}</td></tr>`).join('')}
</tbody></table>
<p>Ten times the frequency is a tenth of the reactance, every time — which is why choosing a decoupling capacitor is really choosing the frequency band you want it to be low-impedance across, and why boards carry several sizes in parallel rather than one large one.</p>

<h2>The letter after the number</h2>
<p>A code like <code>${code}K</code> carries a tolerance letter. It is not part of the value:</p>
<table><thead><tr><th>Letter</th><th>Tolerance</th><th>${fmt(pf)} means</th></tr></thead><tbody>
${TOLERANCE.filter(([l]) => ['J', 'K', 'M', 'Z'].includes(l)).map(([l, t]) => {
  const lo = l === 'Z' ? pf * 0.8 : pf * (1 - parseFloat(t.replace(/[^\d.]/g, '')) / 100);
  const hi = l === 'Z' ? pf * 1.8 : pf * (1 + parseFloat(t.replace(/[^\d.]/g, '')) / 100);
  return `<tr><td><code>${code}${l}</code></td><td>${t}</td><td>${fmt(lo)} to ${fmt(hi)}</td></tr>`;
}).join('')}
</tbody></table>
<p>A <code>Z</code> is worth knowing about. <strong>+80%/−20%</strong> is a real tolerance on cheap high-permittivity ceramics, and it means a part marked ${code}Z can legitimately be anything from ${fmt(pf * 0.8)} to ${fmt(pf * 1.8)}. Those go in decoupling positions where only the rough size matters, never in a timing or filter position.</p>

<h2>Where ${fmt(pf)} turns up</h2>
<p>${use}</p>

${FAQ.html}

<h2>Nearby codes</h2>
<ul class="linklist">${ring(codes, code, 10).map((o) => {
  const x = CODES.find((y) => y.code === o);
  return `<li><a href="/capacitor/${x.code}/">${x.code} capacitor</a> — ${fmt(x.pf)}</li>`;
}).join('')}</ul>

<p><a href="/capacitor/">Every capacitor code</a> · <a href="/resistor/">Resistor colour codes</a> · <a href="/awg/">Wire gauge</a></p>`,
    });
  }

  const decadeTable = (digit) => {
    const list = CODES.filter((c) => c.digit === digit);
    return `<h3>Third digit ${digit} — ${digit === 8 || digit === 9 ? `× ${MULTIPLIER[digit]}` : `× 10<sup>${digit}</sup>`}</h3>
<table><thead><tr><th>Code</th><th>Picofarads</th><th>Nanofarads</th><th>Microfarads</th></tr></thead><tbody>
${list.map((c) => `<tr><td><a href="/capacitor/${c.code}/">${c.code}</a></td><td>${pfStr(c.pf)} pF</td><td>${sigFig(c.pf / 1e3)} nF</td><td>${sigFig(c.pf / 1e6)} µF</td></tr>`).join('')}
</tbody></table>`;
  };

  pages.push({
    path: '/capacitor/',
    title: 'Capacitor Code Chart — Every 3-Digit Code in pF, nF and µF',
    desc: 'The three-digit code on a ceramic capacitor decoded: 104 is 100 nF, 103 is 10 nF, 224 is 220 nF. Every E12 code from 1 pF to 82 µF in picofarads, nanofarads and microfarads, with the tolerance letters.',
    h1: 'Capacitor codes',
    crumbs: [{ name: 'Capacitor codes', path: '/capacitor/' }],
    body: `<p>The three digits printed on a ceramic capacitor are the value in picofarads: <strong>the first two are the number and the third is how many zeros follow</strong>. So 104 is 10 followed by four zeros — 100,000 pF, which is 100 nF, which is 0.1 µF. The same capacitor, three ways of writing it, and that is where most of the confusion with these parts comes from.</p>

<h2>The two exceptions</h2>
<p>A third digit of <strong>8 or 9 divides rather than multiplies</strong> — × 0.01 and × 0.1. They exist so values under ten picofarads fit the same three characters. A code ending in 9 is a few picofarads, not gigafarads.</p>

<h2>Tolerance letters</h2>
<table><thead><tr><th>Letter</th><th>Tolerance</th></tr></thead><tbody>
${TOLERANCE.map(([l, t]) => `<tr><td><code>${l}</code></td><td>${t}</td></tr>`).join('')}
</tbody></table>
<p><code>Z</code> is not a typo. <strong>+80%/−20%</strong> is a genuine tolerance on cheap high-permittivity ceramics, and a part carrying it can be nearly twice its marked value. Those belong in decoupling positions and nowhere near a filter.</p>

${[9, 0, 1, 2, 3, 4, 5, 6].map(decadeTable).join('')}

<p><a href="/resistor/">Resistor colour codes</a> · <a href="/awg/">Wire gauge</a> · <a href="/battery/">Battery sizes</a></p>`,
  });

  return pages;
}
