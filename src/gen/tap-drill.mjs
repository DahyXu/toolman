import { esc, faq, ring } from '../layout.mjs';

// `tap drill size for 1/4-20` has no answer widget. The results are two
// retailers, a tool maker, a machine shop's chart page, Reddit and Quora — and
// every one of them serves a single table of every size. Nobody has a page per
// size, while Google's own "people also search for" row lists the per-size
// direction: "5/16-18 tap drill size", "1/4 tap drill size in mm", "metric tap
// drill size for 1 4 20".
//
// The metric half of this is already here at /thread/m6/. This is the unified
// half, which is the one the query volume is on.
//
// The number is computed, not transcribed:
//
//     tap drill = major diameter − 0.974 / threads per inch
//
// That is the 75%-thread-engagement formula, 0.974 being 0.75 × 1.299 where
// 1.299 is the full thread height for a 60° unified thread. The published
// charts then round to a drill that exists, so the page names the nearest
// standard drill and shows the theoretical figure beside it. Checked against
// 39 published values below; if the rule ever stops reproducing them, the
// build fails rather than the pages going out wrong.

// Number drills, #1 to #60. The sizes below #60 are not used for tapping
// anything in this table.
export const NUMBER_DRILLS = [
  [1, 0.2280], [2, 0.2210], [3, 0.2130], [4, 0.2090], [5, 0.2055], [6, 0.2040],
  [7, 0.2010], [8, 0.1990], [9, 0.1960], [10, 0.1935], [11, 0.1910], [12, 0.1890],
  [13, 0.1850], [14, 0.1820], [15, 0.1800], [16, 0.1770], [17, 0.1730], [18, 0.1695],
  [19, 0.1660], [20, 0.1610], [21, 0.1590], [22, 0.1570], [23, 0.1540], [24, 0.1520],
  [25, 0.1495], [26, 0.1470], [27, 0.1440], [28, 0.1405], [29, 0.1360], [30, 0.1285],
  [31, 0.1200], [32, 0.1160], [33, 0.1130], [34, 0.1110], [35, 0.1100], [36, 0.1065],
  [37, 0.1040], [38, 0.1015], [39, 0.0995], [40, 0.0980], [41, 0.0960], [42, 0.0935],
  [43, 0.0890], [44, 0.0860], [45, 0.0820], [46, 0.0810], [47, 0.0785], [48, 0.0760],
  [49, 0.0730], [50, 0.0700], [51, 0.0670], [52, 0.0635], [53, 0.0595], [54, 0.0550],
  [55, 0.0520], [56, 0.0465], [57, 0.0430], [58, 0.0420], [59, 0.0410], [60, 0.0400],
];

export const LETTER_DRILLS = [
  ['A', 0.234], ['B', 0.238], ['C', 0.242], ['D', 0.246], ['E', 0.250], ['F', 0.257],
  ['G', 0.261], ['H', 0.266], ['I', 0.272], ['J', 0.277], ['K', 0.281], ['L', 0.290],
  ['M', 0.295], ['N', 0.302], ['O', 0.316], ['P', 0.323], ['Q', 0.332], ['R', 0.339],
  ['S', 0.348], ['T', 0.358], ['U', 0.368], ['V', 0.377], ['W', 0.386], ['X', 0.397],
  ['Y', 0.404], ['Z', 0.413],
];

// Fractional drills in 64ths, 1/64 to 1 inch.
export const FRACTION_DRILLS = [];
for (let i = 1; i <= 64; i++) {
  let num = i, den = 64;
  while (num % 2 === 0 && den % 2 === 0) { num /= 2; den /= 2; }
  FRACTION_DRILLS.push([`${num}/${den}`, i / 64]);
}

export const DRILLS = [
  ...NUMBER_DRILLS.map(([n, d]) => ({ label: `#${n}`, sort: `no. ${n}`, d })),
  ...LETTER_DRILLS.map(([l, d]) => ({ label: l, sort: `letter ${l}`, d })),
  ...FRACTION_DRILLS.map(([f, d]) => ({ label: `${f}"`, sort: `fractional ${f}`, d })),
];

// The nearest drill that exists. Not the nearest *smaller* drill: an 8-32 works
// out at 0.1336 and the published chart says #29 at 0.1360, which is above it.
export function nearestDrill(target) {
  let best = DRILLS[0];
  for (const drill of DRILLS) {
    if (Math.abs(drill.d - target) < Math.abs(best.d - target)) best = drill;
  }
  return best;
}

// [designation, major diameter, threads per inch, series, what it is for]
export const THREADS = [
  ['0-80', 0.060, 80, 'UNF', 'Instrument and optical work; the smallest unified thread in general use.'],
  ['1-64', 0.073, 64, 'UNC', 'Small electronics and hinge screws.'],
  ['1-72', 0.073, 72, 'UNF', 'The fine version of the same screw, used where the material is thin.'],
  ['2-56', 0.086, 56, 'UNC', 'Model work, small enclosures and control panels.'],
  ['2-64', 0.086, 64, 'UNF', 'Fine-pitch version for thin sheet and soft materials.'],
  ['3-48', 0.099, 48, 'UNC', 'Small assemblies and instrument mounts.'],
  ['3-56', 0.099, 56, 'UNF', 'Fine-pitch version of the #3 screw.'],
  ['4-40', 0.112, 40, 'UNC', 'The smallest size most workshops keep taps for — connectors, brackets, model engineering.'],
  ['4-48', 0.112, 48, 'UNF', 'Fine-pitch #4, common in aerospace and instrument work.'],
  ['5-40', 0.125, 40, 'UNC', 'Light assembly work; less common than #4 or #6 either side of it.'],
  ['5-44', 0.125, 44, 'UNF', 'Fine-pitch #5.'],
  ['6-32', 0.138, 32, 'UNC', 'Computer cases, electrical boxes and light sheet metal — one of the most-used small threads in North America.'],
  ['6-40', 0.138, 40, 'UNF', 'Fine-pitch #6, used where the thread has to hold in thin material.'],
  ['8-32', 0.164, 32, 'UNC', 'Machine screws in electrical work, appliances and light machinery.'],
  ['8-36', 0.164, 36, 'UNF', 'Fine-pitch #8.'],
  ['10-24', 0.190, 24, 'UNC', 'The general-purpose small machine screw: brackets, panels, light structural work.'],
  ['10-32', 0.190, 32, 'UNF', 'Rack-mount equipment, aerospace fittings and anywhere a #10 has to bite into thin material. More common than 10-24 in some trades.'],
  ['12-24', 0.216, 24, 'UNC', 'Rack rails and sheet-metal assemblies.'],
  ['12-28', 0.216, 28, 'UNF', 'Fine-pitch #12; uncommon outside specific equipment.'],
  ['1/4-20', 0.250, 20, 'UNC', 'The workshop default. Camera tripods, jigs, furniture, brackets, machine guards.'],
  ['1/4-28', 0.250, 28, 'UNF', 'Automotive and aerospace fittings, hydraulic fittings, and anywhere vibration would work a coarse thread loose.'],
  ['5/16-18', 0.3125, 18, 'UNC', 'Structural brackets, engine mounts and heavy furniture.'],
  ['5/16-24', 0.3125, 24, 'UNF', 'Automotive fasteners and fittings.'],
  ['3/8-16', 0.375, 16, 'UNC', 'Machine mounts, hoisting eyes, heavy brackets and threaded rod.'],
  ['3/8-24', 0.375, 24, 'UNF', 'Automotive suspension and brake fittings.'],
  ['7/16-14', 0.4375, 14, 'UNC', 'Structural bolting and heavy machinery.'],
  ['7/16-20', 0.4375, 20, 'UNF', 'Fine-pitch structural and automotive work.'],
  ['1/2-13', 0.500, 13, 'UNC', 'Structural steel, anchor bolts, machine bases and threaded rod.'],
  ['1/2-20', 0.500, 20, 'UNF', 'Automotive and hydraulic fittings.'],
  ['9/16-12', 0.5625, 12, 'UNC', 'Heavy structural connections.'],
  ['9/16-18', 0.5625, 18, 'UNF', 'Fine-pitch heavy fittings.'],
  ['5/8-11', 0.625, 11, 'UNC', 'Structural anchorage, tow points and heavy plant.'],
  ['5/8-18', 0.625, 18, 'UNF', 'Fine-pitch heavy automotive and machine work.'],
  ['3/4-10', 0.750, 10, 'UNC', 'Structural steelwork, foundation bolts and large threaded rod.'],
  ['3/4-16', 0.750, 16, 'UNF', 'Fine-pitch heavy fittings and axle work.'],
  ['7/8-9', 0.875, 9, 'UNC', 'Large structural and civil fixings.'],
  ['7/8-14', 0.875, 14, 'UNF', 'Fine-pitch large fittings.'],
  ['1-8', 1.000, 8, 'UNC', 'Foundation bolts, large machine anchorage and heavy threaded rod.'],
  ['1-12', 1.000, 12, 'UNF', 'Fine-pitch one-inch fittings.'],
];

// 0.75 × 1.299, where 1.299/TPI is the full thread height of a 60° unified
// thread. Everything on these pages comes out of this one constant.
const ENGAGEMENT_75 = 0.974;
export const theoretical = (major, tpi, pct) => major - (1.299 * (pct / 100)) / tpi;

// The published 75% tap drill for every designation above, from the standard
// charts. The point of listing them is to prove the formula rather than to be
// the source: if the arithmetic and the chart ever disagree the build stops.
const PUBLISHED = {
  '0-80': '3/64"', '1-64': '#53', '1-72': '#53', '2-56': '#50', '2-64': '#50',
  '3-48': '#47', '3-56': '#45', '4-40': '#43', '4-48': '#42', '5-40': '#38',
  '5-44': '#37', '6-32': '#36', '6-40': '#33', '8-32': '#29', '8-36': '#29',
  '10-24': '#25', '10-32': '#21', '12-24': '#16', '12-28': '#14', '1/4-20': '#7',
  '1/4-28': '#3', '5/16-18': 'F', '5/16-24': 'I', '3/8-16': '5/16"', '3/8-24': 'Q',
  '7/16-14': 'U', '7/16-20': '25/64"', '1/2-13': '27/64"', '1/2-20': '29/64"',
  '9/16-12': '31/64"', '9/16-18': '33/64"', '5/8-11': '17/32"', '5/8-18': '37/64"',
  '3/4-10': '21/32"', '3/4-16': '11/16"', '7/8-9': '49/64"', '7/8-14': '13/16"',
  '1-8': '7/8"', '1-12': '59/64"',
};

// "a 8-32" reads as nobody says it. Among these designations only a leading
// 8 is spoken with a vowel, and every metric label starts with M — "em".
const an = (label) => (/^[8]/.test(label) || /^M/.test(label) ? 'an ' : 'a ') + label;
const An = (label) => an(label).charAt(0).toUpperCase() + an(label).slice(1);

export const MM = (inch) => inch * 25.4;
const r2 = (n) => Math.round(n * 100) / 100;
const r4 = (n) => Math.round(n * 10000) / 10000;
const slug = (designation) => designation.replace(/\//g, '-').replace(/-/g, '-').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

export default async function () {
  const pages = [];

  const rows = THREADS.map(([designation, major, tpi, series, use]) => {
    const target = theoretical(major, tpi, 75);
    const drill = nearestDrill(target);
    return { designation, major, tpi, series, use, target, drill, id: slug(designation) };
  });

  // Two sizes must not land on the same URL, and 1/4-20 and 1-4-20 are the kind
  // of pair a slug rule quietly merges.
  {
    const seen = new Map();
    for (const r of rows) {
      if (seen.has(r.id)) {
        console.error(`\n✗ tap-drill: ${seen.get(r.id)} and ${r.designation} both want /tap-drill/${r.id}/`);
        process.exitCode = 1;
      }
      seen.set(r.id, r.designation);
    }
  }

  // The formula against the published chart, all 39 of them.
  {
    const bad = [];
    for (const r of rows) {
      const want = PUBLISHED[r.designation];
      if (!want) { bad.push(`${r.designation}: no published value to check against`); continue; }
      if (r.drill.label !== want) {
        bad.push(`${r.designation}: ${r.major} − ${r4(1.299 * 0.75)}/${r.tpi} = ${r4(r.target)}, nearest drill ${r.drill.label} (${r.drill.d}), published ${want}`);
      }
    }
    if (bad.length) {
      console.error(`\n✗ tap-drill: the 75% formula no longer reproduces ${bad.length} published drill size(s):`);
      for (const b of bad) console.error('    ' + b);
      process.exitCode = 1;
    }
  }

  // A tap drill has to be smaller than the thread it is cutting and bigger than
  // the 100% thread drill, or the page is telling someone to snap a tap.
  for (const r of rows) {
    const fullThread = r.major - 1.299 / r.tpi;
    if (!(r.drill.d < r.major && r.drill.d > fullThread)) {
      console.error(`\n✗ tap-drill ${r.designation}: drill ${r.drill.label} at ${r.drill.d}" is not between the 100% thread drill ${r4(fullThread)}" and the major ${r.major}"`);
      process.exitCode = 1;
    }
  }

  const designations = rows.map((r) => r.designation);

  for (const r of rows) {
    const { designation, major, tpi, series, use, target, drill, id } = r;
    const pitch = 1 / tpi;
    const fullThread = major - 1.299 / tpi;
    const other = rows.find((o) => o !== r && o.major === major);

    // The same hole at other engagements. 75% is the chart value; 65% is what a
    // machinist drops to in tough material so the tap survives.
    const at = (pct) => {
      const t = theoretical(major, tpi, pct);
      return { pct, t, drill: nearestDrill(t) };
    };
    const engagements = [50, 65, 75, 85].map(at);

    // Metric taps sit near some of these. Naming the closest is the answer to
    // "metric tap drill size for 1/4-20", which Google lists as a related search
    // and which no chart page answers.
    const METRIC = [
      ['M2', 2, 0.4], ['M2.5', 2.5, 0.45], ['M3', 3, 0.5], ['M4', 4, 0.7], ['M5', 5, 0.8],
      ['M6', 6, 1.0], ['M8', 8, 1.25], ['M10', 10, 1.5], ['M12', 12, 1.75], ['M14', 14, 2.0],
      ['M16', 16, 2.0], ['M20', 20, 2.5], ['M24', 24, 3.0],
    ];
    const majorMm = MM(major);
    const nearestMetric = METRIC.reduce((best, m) =>
      Math.abs(m[1] - majorMm) < Math.abs(best[1] - majorMm) ? m : best);
    // Taking the absolute difference threw away the direction and the page then
    // asserted one: "an M6 bolt is 0.35 mm larger" when M6 is 6 mm and a 1/4-20
    // is 6.35. The two directions are also different failures — a bigger bolt
    // jams, a smaller one goes in loose and strips — so the sign has to survive.
    const pitchMm = MM(pitch);
    const dDiff = r2(nearestMetric[1] - majorMm);
    const pGap = r2(Math.abs(nearestMetric[2] - pitchMm));
    const closeEnoughToStart = Math.abs(dDiff) <= 0.35;
    const metricPara = closeEnoughToStart
      ? `<p>${designation} has a major diameter of ${r2(majorMm)}&nbsp;mm and a pitch of ${r2(pitchMm)}&nbsp;mm. The closest metric tap is <strong>${nearestMetric[0]}</strong>, and it is close: ${nearestMetric[1]}&nbsp;mm across against ${r2(majorMm)}, ${nearestMetric[2]}&nbsp;mm of pitch against ${r2(pitchMm)}. Close is the problem. ${dDiff > 0
          ? `<strong>${An(nearestMetric[0])} bolt will start in ${an(designation)} hole and then jam</strong>, because it is ${Math.abs(dDiff)}&nbsp;mm fatter than the hole was cut for.`
          : `<strong>${An(nearestMetric[0])} bolt will go into ${an(designation)} hole and feel loose</strong>, because it is ${Math.abs(dDiff)}&nbsp;mm thinner than the thread it is trying to catch, and it will strip rather than tighten.`} ${pGap < 0.05 ? `The pitches are near enough identical — ${nearestMetric[2]}&nbsp;mm against ${r2(pitchMm)} — which is precisely why it goes far enough in to feel right.` : `The pitches are ${pGap}&nbsp;mm apart as well, so the threads walk out of step within a few turns.`} That is the failure people mistake for a damaged thread when it is simply the wrong standard.</p>`
      : `<p>${designation} has a major diameter of ${r2(majorMm)}&nbsp;mm and a pitch of ${r2(pitchMm)}&nbsp;mm. The nearest metric tap is <strong>${nearestMetric[0]}</strong> at ${nearestMetric[1]}&nbsp;mm, which is ${Math.abs(dDiff)}&nbsp;mm ${dDiff > 0 ? 'larger' : 'smaller'} — far enough apart that <strong>there is no confusing the two</strong>. ${dDiff > 0 ? `${An(nearestMetric[0])} bolt will not enter ${an(designation)} hole at all` : `${An(nearestMetric[0])} bolt will drop straight through ${an(designation)} hole without catching`}, so if a fastener nearly fits, neither of these is the standard you are looking for.</p>`;

    const FAQ = faq([
      {
        q: `What size drill bit do I need for a ${designation} tap?`,
        a: `A <strong>${esc(drill.label)}</strong> drill, which is <strong>${r4(drill.d)} inches</strong> or <strong>${r2(MM(drill.d))} mm</strong>. That is the standard 75% thread engagement figure, and it is what every published tap chart gives for ${designation}.`,
      },
      {
        q: `What size hole do I need for a ${designation} thread?`,
        a: `The same ${esc(drill.label)} hole — ${r4(drill.d)} inches. The number comes from subtracting the thread height from the major diameter: ${major} − 0.974&nbsp;÷&nbsp;${tpi} = ${r4(target)} inches, and ${esc(drill.label)} is the nearest drill that exists.`,
      },
      {
        q: `What is the ${designation} tap drill size in mm?`,
        a: `<strong>${r2(MM(drill.d))} mm</strong>. There is no metric drill of exactly that size, so a metric drill index gives you ${r2(Math.round(MM(drill.d) * 10) / 10)} mm as the nearest — close enough for ${designation} in most materials, though it changes the thread engagement slightly.`,
      },
      {
        q: `Can I use a ${esc(nearestDrill(theoretical(major, tpi, 65)).label)} instead?`,
        a: `Yes, and in hard material you should. ${esc(nearestDrill(theoretical(major, tpi, 65)).label)} gives about <strong>65% thread engagement</strong> instead of 75%. That costs very little strength — a 65% thread holds roughly 95% of what a 75% thread does — and it makes the tap markedly easier to turn, which is the trade every machinist makes in stainless or tough alloy.`,
      },
    ]);

    const titleBase = `${designation} Tap Drill Size`;
    const withDrill = `${titleBase} — ${drill.label} (${r4(drill.d)}", ${r2(MM(drill.d))} mm)`;
    const title = withDrill.length <= 65 ? withDrill : `${titleBase} — ${drill.label}`;

    pages.push({
      path: `/tap-drill/${id}/`,
      title,
      desc: `The tap drill size for ${designation} is a ${drill.label} drill — ${r4(drill.d)} inches, ${r2(MM(drill.d))} mm — for the standard 75% thread. The arithmetic behind it, the drill for 50%, 65% and 85% engagement, and the nearest metric tap.`,
      h1: `Tap drill size for ${designation}`,
      crumbs: [
        { name: 'Tap drill sizes', path: '/tap-drill/' },
        { name: designation, path: `/tap-drill/${id}/` },
      ],
      jsonld: [FAQ.schema],
      body: `<p class="big" style="font-size:1.8rem;margin:.3em 0"><strong>${esc(drill.label)}</strong></p>
<p class="muted">${r4(drill.d)} inches · ${r2(MM(drill.d))} mm · 75% thread engagement</p>

<table><tbody>
<tr><td>Tap drill (75% thread)</td><td class="out">${esc(drill.label)} — ${r4(drill.d)}" / ${r2(MM(drill.d))} mm</td></tr>
<tr><td>Major diameter</td><td class="out">${major}" / ${r2(majorMm)} mm</td></tr>
<tr><td>Drill for a 100% thread</td><td class="out">${r4(fullThread)}" / ${r2(MM(fullThread))} mm</td></tr>
<tr><td>Threads per inch</td><td class="out">${tpi}</td></tr>
<tr><td>Pitch</td><td class="out">${r4(pitch)}" / ${r2(MM(pitch))} mm</td></tr>
<tr><td>Series</td><td class="out">${series}${series === 'UNC' ? ' (coarse)' : ' (fine)'}</td></tr>
</tbody></table>

<h2>Where the number comes from</h2>
<p>A tap cuts the thread; the drill leaves the hole it cuts into. Cutting the full thread form would mean drilling the major diameter less the whole height of the thread:</p>
<p><code>${major} − 1.299 ÷ ${tpi} = ${r4(fullThread)} inches</code></p>
<p>That is the 100% thread, which nobody drills — the tap has to remove every scrap of metal and usually breaks trying. Charts give <strong>75%</strong>, so three quarters of the thread height is cut away and the rest is left as clearance:</p>
<p><code>${major} − ${ENGAGEMENT_75} ÷ ${tpi} = ${r4(target)} inches</code></p>
<p>The nearest drill that actually exists is <strong>${esc(drill.label)}</strong> at ${r4(drill.d)}&nbsp;inches, which is ${r4(Math.abs(drill.d - target))}&nbsp;inches ${drill.d > target ? 'over' : 'under'} the theoretical figure. That is the number printed on every ${designation} tap chart, and this is where it comes from.</p>

<h2>The same hole at other engagements</h2>
<p>Thread engagement is a choice, not a constant. Less engagement means an easier cut and a longer tap life for very little loss of strength, which is why a machinist working stainless will not drill the chart size.</p>
<table><thead><tr><th>Engagement</th><th>Theoretical</th><th>Drill</th><th>Millimetres</th></tr></thead><tbody>
${engagements.map((e) => `<tr><td>${e.pct}%${e.pct === 75 ? ' <span class="muted">— the chart value</span>' : ''}</td><td>${r4(e.t)}"</td><td>${esc(e.drill.label)} (${r4(e.drill.d)}")</td><td>${r2(MM(e.drill.d))} mm</td></tr>`).join('')}
</tbody></table>
<p>A 75% thread is close to the practical ceiling: going from 75% to 100% adds only a few per cent of strength and roughly doubles the torque needed to turn the tap. Going the other way, <strong>a 65% thread still holds about 95% of the load a 75% thread does</strong>, which is why 65% is the usual choice in anything harder than mild steel.</p>

<h2>${designation} in metric</h2>
${metricPara}
<p>For the drill itself the conversion is straightforward: ${esc(drill.label)} is ${r2(MM(drill.d))}&nbsp;mm, and a metric drill index will offer ${r2(Math.round(MM(drill.d) * 10) / 10)}&nbsp;mm as the nearest size.</p>

<h2>What ${designation} is used for</h2>
<p>${use}</p>
${other ? `<p>The same ${major}" screw is also made as <a href="/tap-drill/${other.id}/">${other.designation}</a>, the ${other.series === 'UNC' ? 'coarse' : 'fine'} version, which takes a ${esc(other.drill.label)} drill instead. ${series === 'UNC' ? 'Coarse threads' : 'Fine threads'} ${series === 'UNC' ? 'tap faster, tolerate damage better and hold better in soft material.' : 'hold better in thin material, resist vibration loosening and give finer adjustment.'}</p>` : ''}

${FAQ.html}

<h2>Other tap sizes</h2>
<ul class="linklist">${ring(designations, designation, 10).map((d) => {
  const o = rows.find((x) => x.designation === d);
  return `<li><a href="/tap-drill/${o.id}/">${esc(o.designation)} tap drill size</a> — ${esc(o.drill.label)}</li>`;
}).join('')}</ul>

<p><a href="/tap-drill/">Every unified tap drill size</a> · <a href="/thread/">Metric thread sizes</a></p>`,
    });
  }

  const group = (pred, heading, note) => `<h2>${heading}</h2>
<p>${note}</p>
<table><thead><tr><th>Tap</th><th>Drill</th><th>Inches</th><th>Millimetres</th></tr></thead><tbody>
${rows.filter(pred).map((r) => `<tr><td><a href="/tap-drill/${r.id}/">${esc(r.designation)}</a></td><td>${esc(r.drill.label)}</td><td>${r4(r.drill.d)}"</td><td>${r2(MM(r.drill.d))} mm</td></tr>`).join('')}
</tbody></table>`;

  pages.push({
    path: '/tap-drill/',
    title: 'Tap Drill Size Chart — Every UNC and UNF Size, Inches and mm',
    desc: 'The tap drill size for every unified thread from 0-80 to 1-12, in inches and millimetres, with the arithmetic behind each one and the drill for 50%, 65% and 85% thread engagement.',
    h1: 'Tap drill sizes',
    crumbs: [{ name: 'Tap drill sizes', path: '/tap-drill/' }],
    body: `<p>The drill to use before tapping a unified thread, for every size from 0-80 to 1-12. Each size has its own page with the arithmetic, the drill at other engagements, and the nearest metric equivalent.</p>
<p>Every figure here is <strong>computed rather than transcribed</strong>: the tap drill is the major diameter less 0.974 divided by the threads per inch, which is 75% of the thread height for a 60° form. The build checks that rule against all 39 published chart values and fails if any of them disagree.</p>
${group((r) => r.series === 'UNC', 'UNC — coarse threads', 'The default in general work. Coarse threads tap faster, tolerate a knock better and hold better in aluminium, plastic and other soft material.')}
${group((r) => r.series === 'UNF', 'UNF — fine threads', 'Used where the material is thin, where vibration would work a coarse thread loose, or where a finer adjustment is wanted. Automotive and aerospace work is largely fine.')}
<h2>Choosing an engagement</h2>
<p>75% is the chart figure and the right default in mild steel, aluminium and plastic. Drop to 65% in stainless, tool steel or anything else that fights the tap: the thread still holds about 95% of the load and the tap is much less likely to snap. Going above 75% buys almost no strength and a great deal of torque.</p>
<p><a href="/thread/">Metric thread sizes</a> · <a href="/screw/">Screw sizes</a></p>`,
  });

  return pages;
}
