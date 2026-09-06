import { esc, faq, ring } from '../layout.mjs';

// `brown black red gold resistor value` returns Calculator.net, DigiKey,
// Newark, Circuit Digest, YouTube and Facebook — and every one of them serves a
// *calculator* or a chart of the whole code. Nobody serves the entry. That is
// the same shape as the ports section, where the one click this site has ever
// had came from a named service rather than a port number.
//
// It also sits in the only space that is actually buildable here: the overlap
// of weak incumbents with an answer that follows a rule. The colour code is
// public knowledge and entirely computable, unlike the circlip and woodruff
// dimensions that live in paid standards.
//
// One page per resistor, not per colour permutation. Generating all 10×10×9×6
// band combinations would be thousands of pages for resistors that do not
// exist, which is doorway content by another name. The E24 series is the set of
// values actually manufactured at ±5%, so that is the set that gets pages —
// and each page answers both directions, the colours and the value, so the two
// queries land on one page rather than two thin ones.

const DIGIT = [
  ['black', 0, '#000000', '#ffffff'], ['brown', 1, '#7b3f00', '#ffffff'],
  ['red', 2, '#d0021b', '#ffffff'], ['orange', 3, '#f5a623', '#000000'],
  ['yellow', 4, '#f8e71c', '#000000'], ['green', 5, '#0a7d2b', '#ffffff'],
  ['blue', 6, '#1b5fd0', '#ffffff'], ['violet', 7, '#7a1fa2', '#ffffff'],
  ['grey', 8, '#8b8b8b', '#000000'], ['white', 9, '#ffffff', '#000000'],
];

// Multiplier band. Gold and silver divide, which is how values below 10 ohms
// are written.
const MULTIPLIER = [
  ['silver', 0.01], ['gold', 0.1], ['black', 1], ['brown', 10], ['red', 100],
  ['orange', 1e3], ['yellow', 1e4], ['green', 1e5], ['blue', 1e6],
];

const TOLERANCE = { gold: 5, silver: 10, brown: 1, red: 2, green: 0.5, blue: 0.25, violet: 0.1 };

const digitOf = Object.fromEntries(DIGIT.map(([n, v]) => [n, v]));
const colourForDigit = Object.fromEntries(DIGIT.map(([n, v]) => [v, n]));
const swatch = Object.fromEntries(DIGIT.map(([n, , bg, fg]) => [n, [bg, fg]]));
swatch.gold = ['#c9a227', '#000000'];
swatch.silver = ['#c0c0c0', '#000000'];
const multFor = Object.fromEntries(MULTIPLIER.map(([n, v]) => [n, v]));

// E24: the 24 values per decade made to ±5%. These are the resistors that exist.
const E24 = [10, 11, 12, 13, 15, 16, 18, 20, 22, 24, 27, 30, 33, 36, 39, 43, 47, 51, 56, 62, 68, 75, 82, 91];
const DECADES = [
  ['gold', '1 Ω to 9.1 Ω'],
  ['black', '10 Ω to 91 Ω'],
  ['brown', '100 Ω to 910 Ω'],
  ['red', '1 kΩ to 9.1 kΩ'],
  ['orange', '10 kΩ to 91 kΩ'],
  ['yellow', '100 kΩ to 910 kΩ'],
  ['green', '1 MΩ to 9.1 MΩ'],
].map(([mult, label]) => [multFor[mult], mult, label]);


// E12 is the twelve-value ±10% series, and it is a subset of E24. Which of the
// two a value belongs to decides whether it is in a beginner's assortment box,
// which is a real and per-value difference between otherwise identical pages.
const E12 = [10, 12, 15, 18, 22, 27, 33, 39, 47, 56, 68, 82];
for (const v of E12) {
  if (!E24.includes(v)) {
    console.error(`
✗ resistor: E12 lists ${v} and E24 does not, so one of the two series here is wrong`);
    process.exitCode = 1;
  }
}

// What a decade of resistance is for. Written per decade rather than per value
// because that is the granularity at which it is actually true.
const DECADE_USE = {
  gold: 'Values in single-figure ohms are current-sense and snubber territory. A resistor this small is not there to limit anything much — it is there to be measured across, to damp a ringing edge, or to sit in series with a supply as a crude fuse. At these values the resistance of the leads and the solder joints is a measurable fraction of the part, which is why current-sense designs use four-terminal parts rather than a colour-coded one.',
  black: 'Tens of ohms is where LED series resistors live on low-voltage rails, along with base and gate stoppers on transistors and the damping resistors on fast logic outputs. It is also the range where a resistor gets warm in normal use, so the wattage matters more here than it does higher up.',
  brown: 'Hundreds of ohms is the classic LED resistor range on a 5 V rail, and the usual value for series protection on an input pin. It is the most-reached-for decade in hobby electronics after the kilohms.',
  red: 'Single-figure kilohms is the pull-up and pull-down decade. It is strong enough to hold a line firmly against leakage and weak enough not to fight whatever drives the line low, which is why 1 kΩ to 10 kΩ covers almost every pull-up ever specified.',
  orange: 'Tens of kilohms is the range for biasing, for the feedback around an op-amp, and for pull-ups where current draw matters more than noise immunity — a battery-powered design pulls up with 47 kΩ where a mains-powered one uses 4.7 kΩ.',
  yellow: 'Hundreds of kilohms is high-impedance territory: op-amp bias, timing networks with small capacitors, and the top half of a voltage divider reading a high voltage. At these values board leakage and finger grease start to matter, and a dirty board can measurably shift a circuit.',
  green: 'Megohm values are for very slow timing, for bleeding charge off a capacitor after power-down, and for keeping a high-impedance input from floating. Currents here are in microamps, so the resistor dissipates almost nothing and the limiting factor is the voltage across it rather than the heat in it.',
};


// A surface-mount part has no room for bands and carries printed digits: two
// significant figures and a zero count for ±5%, three and a zero count for ±1%.
// Below ten ohms there is no room for the zero count either, so an R stands in
// for the decimal point. `smd resistor code 103 value` returns DigiKey's
// calculator and three YouTube shorts — the chart again, never the entry — and
// this belongs on the page for the value rather than in a section of its own,
// where /smd-resistor/103/ and /resistor/10k/ would be the same page twice.
function smdThree(ohms) {
  if (ohms < 10) {
    const t = +ohms.toFixed(2);
    return String(t).includes('.') ? String(t).replace('.', 'R') : `${t}R0`;
  }
  const zeros = Math.floor(Math.log10(ohms) + 1e-9) - 1;
  const sig = Math.round(ohms / Math.pow(10, zeros));
  return `${sig}${zeros}`;
}
function smdFour(ohms) {
  if (ohms < 100) {
    const t = +ohms.toFixed(2);
    return String(t).includes('.') ? String(t).replace('.', 'R').padEnd(4, '0') : `${t}R0`;
  }
  const zeros = Math.floor(Math.log10(ohms) + 1e-9) - 2;
  const sig = Math.round(ohms / Math.pow(10, zeros));
  return `${sig}${zeros}`;
}
// Read the marking back the way somebody with the part in front of them would.
function readSmd(code) {
  if (code.includes('R')) return +code.replace('R', '.');
  const zeros = +code.slice(-1);
  return +code.slice(0, -1) * Math.pow(10, zeros);
}

// Read the bands the way a person reads the resistor, so the page's own claim
// is checked rather than assumed.
function decode(b1, b2, mult) {
  return (digitOf[b1] * 10 + digitOf[b2]) * multFor[mult];
}

const fmt = (ohms) => {
  if (ohms >= 1e6) return `${+(ohms / 1e6).toFixed(2)} MΩ`;
  if (ohms >= 1e3) return `${+(ohms / 1e3).toFixed(2)} kΩ`;
  return `${+ohms.toFixed(2)} Ω`;
};
const slugValue = (ohms) => {
  if (ohms >= 1e6) return `${String(+(ohms / 1e6).toFixed(2)).replace('.', '-')}m`;
  if (ohms >= 1e3) return `${String(+(ohms / 1e3).toFixed(2)).replace('.', '-')}k`;
  return `${String(+ohms.toFixed(2)).replace('.', '-')}r`;
};

export default async function () {
  const pages = [];
  const rows = [];

  for (const [scale, mult] of DECADES) {
    for (const e of E24) {
      const b1 = colourForDigit[Math.floor(e / 10)];
      const b2 = colourForDigit[e % 10];
      const ohms = e * scale;
      rows.push({ e, scale, mult, b1, b2, ohms, id: slugValue(ohms) });
    }
  }

  // Every page states a value and states the bands that give it. Reading the
  // bands back has to return the value, or the page contradicts itself.
  {
    const bad = [];
    for (const r of rows) {
      const back = decode(r.b1, r.b2, r.mult);
      if (Math.abs(back - r.ohms) > r.ohms * 1e-9) {
        bad.push(`${fmt(r.ohms)}: ${r.b1}-${r.b2}-${r.mult} reads back as ${fmt(back)}`);
      }
    }
    if (bad.length) {
      console.error(`\n✗ resistor: ${bad.length} page(s) whose bands do not decode to their own value:`);
      for (const b of bad.slice(0, 6)) console.error('    ' + b);
      process.exitCode = 1;
    }
  }

  // Two resistors must not land on the same URL. 1 kΩ and 1.0 kΩ are the kind of
  // pair a formatting rule silently merges.
  {
    const seen = new Map();
    for (const r of rows) {
      if (seen.has(r.id)) {
        console.error(`\n✗ resistor: ${fmt(seen.get(r.id))} and ${fmt(r.ohms)} both want /resistor/${r.id}/`);
        process.exitCode = 1;
      }
      seen.set(r.id, r.ohms);
    }
    if (seen.size !== E24.length * DECADES.length) {
      console.error(`\n✗ resistor: ${seen.size} distinct pages for ${E24.length * DECADES.length} E24 values`);
      process.exitCode = 1;
    }
  }

  // The power table gives a maximum current and a maximum voltage at each
  // rating, computed as sqrt(P/R) and sqrt(P·R). Dividing one by the other has
  // to give back the resistance — a check the two formulas cannot both pass if
  // either is inverted, which re-deriving them from the same expression would
  // not have caught.
  for (const r of rows) {
    for (const w of [0.125, 0.25, 0.5, 1]) {
      const amps = Math.sqrt(w / r.ohms);
      const volts = Math.sqrt(w * r.ohms);
      if (Math.abs(volts / amps - r.ohms) > r.ohms * 1e-9) {
        console.error(`
✗ resistor ${fmt(r.ohms)}: at ${w} W the table gives ${volts} V and ${amps} A, which is ${volts / amps} ohms`);
        process.exitCode = 1;
      }
      if (Math.abs(volts * amps - w) > w * 1e-9) {
        console.error(`
✗ resistor ${fmt(r.ohms)}: ${volts} V at ${amps} A is ${volts * amps} W, not ${w}`);
        process.exitCode = 1;
      }
    }
  }

  // Both markings have to decode to the value the page states, the same way the
  // colour bands do. Three-digit and four-digit are two encodings of one number,
  // so a rounding slip in either shows up here rather than on the page.
  for (const r of rows) {
    for (const code of [smdThree(r.ohms), smdFour(r.ohms)]) {
      const back = readSmd(code);
      if (Math.abs(back - r.ohms) > Math.max(r.ohms * 1e-9, 1e-9)) {
        console.error(`
✗ resistor ${fmt(r.ohms)}: the SMD marking ${code} reads back as ${fmt(back)}`);
        process.exitCode = 1;
      }
    }
  }

  // The first band is never black: a resistor whose first significant digit is
  // zero is not a value, and a table that produced one would be generating
  // resistors that do not exist.
  for (const r of rows) {
    if (r.b1 === 'black') {
      console.error(`\n✗ resistor ${fmt(r.ohms)}: first band is black, which is not a real marking`);
      process.exitCode = 1;
    }
  }

  const band = (colour, label) => {
    const [bg, fg] = swatch[colour];
    return `<span style="display:inline-block;padding:.15em .6em;margin-right:.3em;border:1px solid #8888;border-radius:3px;background:${bg};color:${fg}">${esc(colour)}</span>${label ? ` <span class="muted">${label}</span>` : ''}`;
  };

  const ids = rows.map((r) => r.id);

  for (const r of rows) {
    const { e, mult, b1, b2, ohms, id } = r;
    const bands4 = [b1, b2, mult, 'gold'];
    const words = bands4.join(' ');
    const tol = TOLERANCE.gold;
    const inE12 = E12.includes(e);
    const nearestE12 = E12.reduce((best, v) => Math.abs(v - e) < Math.abs(best - e) ? v : best) * r.scale;
    const decadeUse = DECADE_USE[mult];
    const smd3 = smdThree(ohms);
    const smd4 = smdFour(ohms);
    const smd3Read = smd3.includes('R') ? `${smd3.replace('R', '.')} Ω — the R is the decimal point` : `${smd3.slice(0, -1)}${smd3.slice(-1) === '0' ? ' with no zeros after it' : smd3.slice(-1) === '1' ? ' followed by one zero' : ` followed by ${smd3.slice(-1)} zeros`}`;
    const smd4Read = smd4.includes('R') ? `${smd4.replace('R', '.')} Ω — the R is the decimal point` : `${smd4.slice(0, -1)}${smd4.slice(-1) === '0' ? ' with no zeros after it' : smd4.slice(-1) === '1' ? ' followed by one zero' : ` followed by ${smd4.slice(-1)} zeros`}`;
    const low = ohms * (1 - tol / 100);
    const high = ohms * (1 + tol / 100);

    // The 5-band marking of the same resistor: three digits and one less
    // multiplier decade. E24 values have two significant figures, so the third
    // digit is a zero and the multiplier drops one step.
    const fiveMultValue = multFor[mult] / 10;
    const fiveMult = MULTIPLIER.find(([, v]) => Math.abs(v - fiveMultValue) < v * 1e-9);
    const bands5 = fiveMult ? [b1, b2, 'black', fiveMult[0], 'brown'] : null;
    if (bands5 && Math.abs((digitOf[b1] * 100 + digitOf[b2] * 10 + 0) * fiveMult[1] - ohms) > ohms * 1e-9) {
      console.error(`\n✗ resistor ${fmt(ohms)}: the five-band marking ${bands5.join('-')} does not decode to the same value`);
      process.exitCode = 1;
    }

    const FAQ = faq([
      {
        q: `What is the colour code for a ${fmt(ohms)} resistor?`,
        a: `<strong>${esc(words)}</strong> on a four-band resistor: ${esc(b1)} for ${digitOf[b1]}, ${esc(b2)} for ${digitOf[b2]}, ${esc(mult)} for a multiplier of ${multFor[mult] >= 1 ? `×${multFor[mult].toLocaleString()}` : `÷${Math.round(1 / multFor[mult])}`}, and gold for ±5%.`,
      },
      {
        q: `What resistor is ${esc(words)}?`,
        a: `<strong>${fmt(ohms)}, ±5%.</strong> The first two bands are the digits ${digitOf[b1]} and ${digitOf[b2]}, the third multiplies by ${multFor[mult] >= 1 ? multFor[mult].toLocaleString() : `0.${String(multFor[mult]).split('.')[1]}`}, and the gold band is the tolerance.`,
      },
      {
        q: `What is the tolerance range of a ${fmt(ohms)} ±5% resistor?`,
        a: `<strong>${fmt(low)} to ${fmt(high)}.</strong> A resistor measuring anywhere in that range is within specification, which is why a meter reading of ${fmt(low)} on a ${fmt(ohms)} part is not a fault.`,
      },
      bands5
        ? {
            q: `What is the five-band code for ${fmt(ohms)}?`,
            a: `<strong>${esc(bands5.join(' '))}</strong> — three digit bands (${digitOf[b1]}, ${digitOf[b2]}, 0), then ${esc(fiveMult[0])} as the multiplier and brown for ±1%. Five-band resistors carry an extra significant figure, so the third digit is the zero that a four-band code leaves to the multiplier.`,
          }
        : {
            q: `Is there a five-band code for ${fmt(ohms)}?`,
            a: `Not with a standard multiplier. The five-band code adds a third digit and drops the multiplier one decade, and at this value that would need a multiplier below the silver band, which does not exist. Four-band is the marking for this one.`,
          },
    ]);

    const title = `${fmt(ohms)} Resistor Colour Code — ${words.replace(/\b\w/g, (c) => c.toUpperCase())}`;

    pages.push({
      path: `/resistor/${id}/`,
      title: title.length <= 65 ? title : `${fmt(ohms)} Resistor Colour Code`,
      desc: `A ${fmt(ohms)} resistor is ${words} on four bands. The digits, the multiplier, the ±5% range of ${fmt(low)} to ${fmt(high)}, the five-band equivalent, and how to read the code either way.`,
      h1: `${fmt(ohms)} resistor colour code`,
      crumbs: [
        { name: 'Resistor colour codes', path: '/resistor/' },
        { name: fmt(ohms), path: `/resistor/${id}/` },
      ],
      jsonld: [FAQ.schema],
      body: `<p style="font-size:1.3rem;margin:.4em 0">${bands4.map((c) => band(c, '')).join('')}</p>
<p class="big" style="font-size:1.8rem;margin:.2em 0"><strong>${fmt(ohms)}</strong> <span class="muted">±${tol}%</span></p>
<p class="muted">${esc(words)} — four bands, read from the end with the bands closest to it.</p>

<table><tbody>
<tr><td>Band 1 — first digit</td><td class="out">${band(b1, `= ${digitOf[b1]}`)}</td></tr>
<tr><td>Band 2 — second digit</td><td class="out">${band(b2, `= ${digitOf[b2]}`)}</td></tr>
<tr><td>Band 3 — multiplier</td><td class="out">${band(mult, multFor[mult] >= 1 ? `× ${multFor[mult].toLocaleString()}` : `÷ ${Math.round(1 / multFor[mult])}`)}</td></tr>
<tr><td>Band 4 — tolerance</td><td class="out">${band('gold', `± ${tol}%`)}</td></tr>
<tr><td>Value</td><td class="out">${fmt(ohms)}</td></tr>
<tr><td>Acceptable range</td><td class="out">${fmt(low)} to ${fmt(high)}</td></tr>
</tbody></table>

<h2>Reading it</h2>
<p>The two digit bands give <strong>${digitOf[b1]}${digitOf[b2]}</strong> and the multiplier band ${multFor[mult] >= 1 ? `multiplies it by ${multFor[mult].toLocaleString()}` : `divides it by ${Math.round(1 / multFor[mult])}`}:</p>
<p><code>${digitOf[b1]}${digitOf[b2]} ${multFor[mult] >= 1 ? `× ${multFor[mult].toLocaleString()}` : `÷ ${Math.round(1 / multFor[mult])}`} = ${fmt(ohms)}</code></p>
<p>Which end to start from is the part that catches people. <strong>The tolerance band is the one set slightly apart from the other three</strong>, and it is gold or silver far more often than not — neither of which is a digit colour, so a gold or silver band tells you which end you are at. Read from the opposite end.</p>

<h2>What ±${tol}% actually means</h2>
<p>A ${fmt(ohms)} ±${tol}% resistor is in specification anywhere from <strong>${fmt(low)} to ${fmt(high)}</strong>. A meter reading of ${fmt(low)} on this part is not a fault and not a reason to replace it.</p>
<p>${fmt(ohms)} is one of the <strong>E24 values</strong> — the 24 steps per decade that ±5% resistors are made in. The steps are spaced so that the tolerance bands of neighbouring values just about touch: there is no gap between one value's range and the next, and no point making anything in between. It is the same reasoning that gives ±10% parts only 12 values per decade.</p>

${bands5 ? `<h2>The same resistor with five bands</h2>
<p>Precision resistors carry five bands: three digits, a multiplier and a tighter tolerance. The same ${fmt(ohms)} reads</p>
<p style="font-size:1.2rem">${bands5.map((c) => band(c, '')).join('')}</p>
<p>— <strong>${esc(bands5.join(' '))}</strong>. The digits become ${digitOf[b1]}, ${digitOf[b2]} and 0, and the multiplier drops one decade to ${esc(fiveMult[0])} to compensate. The brown final band is ±1% rather than ±5%, which narrows the range to ${fmt(ohms * 0.99)}–${fmt(ohms * 1.01)}.</p>` : ''}

<h2>How much this one can take</h2>
<p>A resistor's limit is heat, not voltage or current on their own: the power it turns into heat is <code>V² ÷ R</code>, so the same wattage allows very different numbers at ${fmt(ohms)} than it does at a value ten times away. This is the part of a colour code lookup people actually came for and charts leave out.</p>
<table><thead><tr><th>Rating</th><th>Maximum current</th><th>Maximum voltage</th></tr></thead><tbody>
${[0.125, 0.25, 0.5, 1].map((w) => {
  const i = Math.sqrt(w / ohms), v = Math.sqrt(w * ohms);
  const amps = i >= 1 ? `${+i.toFixed(2)} A` : i >= 1e-3 ? `${+(i * 1e3).toFixed(1)} mA` : `${+(i * 1e6).toFixed(0)} µA`;
  return `<tr><td>${w === 0.125 ? '⅛ W' : w === 0.25 ? '¼ W' : w === 0.5 ? '½ W' : '1 W'}</td><td>${amps}</td><td>${+v.toFixed(1)} V</td></tr>`;
}).join('')}
</tbody></table>
<p>The quarter-watt part is the one in everybody's drawer: at ${fmt(ohms)} it will carry <strong>${(() => { const i = Math.sqrt(0.25 / ohms); return i >= 1 ? `${+i.toFixed(2)} A` : i >= 1e-3 ? `${+(i * 1e3).toFixed(1)} mA` : `${+(i * 1e6).toFixed(0)} µA`; })()}</strong> or stand <strong>${+Math.sqrt(0.25 * ohms).toFixed(1)} V</strong> across it, and not both at once — those are the same limit expressed two ways.</p>

<h2>${inE12 ? `${fmt(ohms)} is a ±10% value too` : `${fmt(ohms)} exists only at ±5%`}</h2>
<p>${inE12
  ? `${fmt(ohms)} is one of the twelve E12 values as well as one of the twenty-four E24 ones, which means it is made at ±10% and ±5% both. In practice that makes it easier to find and cheaper: E12 values are what a beginner's assortment box contains, and a shop that stocks one range stocks this value.`
  : `${fmt(ohms)} is an E24 value that is <strong>not</strong> in the E12 series, so it is made at ±5% and tighter but not at ±10%. That is why it is missing from cheap assortment boxes, which are usually E12 only — and why a design that calls for ${fmt(ohms)} is harder to service from a beginner's drawer than one that calls for ${fmt(nearestE12)}.`}</p>
<p>The nearest E12 value is <strong>${fmt(nearestE12)}</strong>${inE12 ? ' — this one' : `, ${Math.abs(Math.round((nearestE12 / ohms - 1) * 1000) / 10)}% away, which is inside the ±5% band of neither part but close enough to substitute in most non-critical positions`}.</p>

<h2>The same resistor as a surface-mount marking</h2>
<p>Surface-mount resistors have no room for bands, so they carry printed digits instead — and <code>${smd3}</code> is what ${fmt(ohms)} looks like on one. <strong>The scheme is the colour code with the colours replaced by the digits they stood for</strong>: two significant figures and a count of zeros.</p>
<table><thead><tr><th>Marking</th><th>Used on</th><th>Reads as</th></tr></thead><tbody>
<tr><td><code>${smd3}</code></td><td>Three-digit, ±5% parts</td><td>${smd3Read}</td></tr>
<tr><td><code>${smd4}</code></td><td>Four-digit, ±1% parts</td><td>${smd4Read}</td></tr>
</tbody></table>
<p>${smd3.includes('R')
  ? `Below ten ohms there are not two digits to work with before the decimal point, so an <strong>R marks the decimal place</strong>: ${fmt(ohms)} is printed <code>${smd3}</code>. The R is doing the job the multiplier band does on a through-hole part, and a marking with an R in it is always a low value — never a large one.`
  : smd4.includes('R')
    ? `The three-digit marking works the usual way here — <code>${smd3}</code> is ${smd3.slice(0, -1)} with ${smd3.slice(-1) === '0' ? 'nothing' : smd3.slice(-1) === '1' ? 'one zero' : `${smd3.slice(-1)} zeros`} after it. The four-digit one cannot, because <strong>there are not three figures before the decimal point</strong> at ${fmt(ohms)}, so it falls back to the R: <code>${smd4}</code>. That is why this decade is the one where the two schemes look least alike.`
    : `A four-digit marking is not a different system, only a more precise one: it carries three significant figures instead of two and takes one off the zero count, which is why <code>${smd3}</code> and <code>${smd4}</code> are the same ${fmt(ohms)}. If a board has both on it, the four-digit parts are the ±1% ones.`}</p>
<p>Very small ±1% parts use a third scheme, EIA-96, where two digits index a table of values and a letter gives the multiplier — <code>01C</code> rather than <code>1002</code>. It only covers the E96 series, so it has no marking for most of the E24 values on this site, and a marking with a letter in the middle is never one of these codes.</p>

<h2>Where ${fmt(ohms)} turns up</h2>
<p>${decadeUse}</p>

${FAQ.html}

<h2>Nearby values</h2>
<ul class="linklist">${ring(ids, id, 10).map((o) => {
  const x = rows.find((y) => y.id === o);
  return `<li><a href="/resistor/${x.id}/">${fmt(x.ohms)} resistor colour code</a> — ${esc([x.b1, x.b2, x.mult, 'gold'].join(' '))}</li>`;
}).join('')}</ul>

<p><a href="/resistor/">Every E24 resistor colour code</a> · <a href="/awg/">Wire gauge</a> · <a href="/battery/">Battery sizes</a></p>`,
    });
  }

  const decadeTable = ([scale, mult, label]) => `<h3>${label}</h3>
<table><thead><tr><th>Value</th><th>Bands</th></tr></thead><tbody>
${E24.map((e) => {
  const x = rows.find((y) => y.e === e && y.scale === scale);
  return `<tr><td><a href="/resistor/${x.id}/">${fmt(x.ohms)}</a></td><td>${esc([x.b1, x.b2, mult, 'gold'].join(' '))}</td></tr>`;
}).join('')}
</tbody></table>`;

  pages.push({
    path: '/resistor/',
    title: 'Resistor Colour Code Chart — Every E24 Value and Its Bands',
    desc: 'The four-band colour code for every E24 resistor from 1 Ω to 9.1 MΩ, both directions: look up a value to get its bands, or read a set of bands to get the value. With the digit, multiplier and tolerance tables.',
    h1: 'Resistor colour codes',
    crumbs: [{ name: 'Resistor colour codes', path: '/resistor/' }],
    body: `<p>The bands on a resistor are two digits, a multiplier and a tolerance. This gives the code for every value that is actually manufactured at ±5% — the E24 series — and each value has its own page answering the question from either end: the bands you need for a value, or the value a set of bands means.</p>

<h2>The tables the code is built from</h2>
<table><thead><tr><th>Colour</th><th>Digit</th><th>Multiplier</th><th>Tolerance</th></tr></thead><tbody>
${DIGIT.map(([n, v]) => {
  const m = MULTIPLIER.find(([mn]) => mn === n);
  return `<tr><td>${band(n, '')}</td><td>${v}</td><td>${m ? (m[1] >= 1 ? `× ${m[1].toLocaleString()}` : `÷ ${Math.round(1 / m[1])}`) : '—'}</td><td>${TOLERANCE[n] != null ? `± ${TOLERANCE[n]}%` : '—'}</td></tr>`;
}).join('')}
<tr><td>${band('gold', '')}</td><td>—</td><td>÷ 10</td><td>± 5%</td></tr>
<tr><td>${band('silver', '')}</td><td>—</td><td>÷ 100</td><td>± 10%</td></tr>
</tbody></table>

<h2>Which end to read from</h2>
<p>The tolerance band sits slightly further from the other three, and it is gold or silver on most resistors. Neither gold nor silver is a digit colour, so <strong>a gold or silver band is telling you which end is the last one</strong> — start reading from the other. On a resistor with no gold or silver at all, the wider gap before the last band is the only clue, and it is worth measuring rather than guessing.</p>

<h2>Why these values and not round ones</h2>
<p>E24 is 24 values per decade, spaced so that the ±5% ranges of neighbouring values very nearly meet. There is no gap left between one value and the next, so there is nothing to be gained by making anything in between — which is why a shop sells 4.7 kΩ and 5.1 kΩ but not 5 kΩ. The ±10% series, E12, uses half as many values for the same reason.</p>

${DECADES.map(decadeTable).join('')}

<p><a href="/awg/">Wire gauge</a> · <a href="/battery/">Battery sizes</a> · <a href="/number-base-converter/">Number base converter</a></p>`,
  });

  return pages;
}
