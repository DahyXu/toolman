import { esc, faq, ring } from '../layout.mjs';
import { DRILLS, THREADS, theoretical, nearestDrill } from './tap-drill.mjs';

// `number 7 drill bit size` returns a 2011 forum thread from The Garage
// Journal at the top, then a retailer, a blog, Bolt Depot's chart and an Amazon
// listing. No answer widget. That is the weakest field checked this week — the
// incumbent test that rejected SKF on bearings and Adobe on paper sizes lets
// this one through easily.
//
// The data is already here and already checked: the same drill table reproduced
// all 39 published tap-drill values on its first run. This turns it round, so
// that somebody holding a bit marked "7" or "F" can find out what it is —
// which is the direction the query arrives from, and the one the chart pages
// answer only incidentally.

const IN = 25.4;
const r4 = (n) => Math.round(n * 10000) / 10000;
const r3 = (n) => Math.round(n * 1000) / 1000;
const r2 = (n) => Math.round(n * 100) / 100;

const slug = (label) => label
  .replace('#', 'no-')
  .replace(/"/g, '')
  .replace(/\//g, '-')
  .toLowerCase()
  .replace(/[^a-z0-9-]+/g, '-')
  .replace(/^-|-$/g, '');

const kind = (label) => label.startsWith('#') ? 'number' : label.includes('/') ? 'fractional' : 'letter';

// Metric drill sets step in tenths of a millimetre through this range, which is
// the resolution a metric index can actually offer against an imperial size.
const nearestMetric = (inches) => Math.round(inches * IN * 10) / 10;


// What a hole of this size is for. Written per band because that is the
// granularity at which it is actually true — a thousandth of an inch does not
// change what you are drilling.
const BANDS = [
  [0, 0.05, 'Under fifty thousandths of an inch, a drill is watchmaker and model-maker territory: pinning small parts, clearing wire in an instrument, opening a jet. Bits this fine snap if the work moves at all, which is why they are used in a press or a pin vice rather than a hand drill.'],
  [0.05, 0.1, 'This is circuit-board and small-pin range — component leads, header pins, the holes a hobbyist drills in perfboard. It is also where the smallest machine-screw taps live, so a drill here is as likely to be preparing a thread as clearing a wire.'],
  [0.1, 0.2, 'The busiest part of the number series. Tapping drills for machine screws from #4 to #12 sit in here, along with pilot holes for wood screws and clearance for small pins. If a number drill in a workshop is worn out, it is usually one of these.'],
  [0.2, 0.3, 'Where the quarter-inch and five-sixteenths taps are drilled, and where clearance holes for small bolts begin. The three drill systems overlap most densely across this band, which is why a bit here is the one most often picked up and misidentified.'],
  [0.3, 0.5, 'Clearance holes for bolts up to about half an inch, and tapping drills for the larger unified threads. Above a quarter inch a hand drill starts to want two hands and a slower speed, and the bit wants a pilot hole.'],
  [0.5, 10, 'Half an inch and up is where twist drills stop being the obvious tool. A bit this size in mild steel needs a pilot, a slow speed and something to hold the work; past three-quarters of an inch most people reach for a hole saw or a step drill instead.'],
];
const bandOf = (inches) => BANDS.find(([lo, hi]) => inches >= lo && inches < hi)[2];

// Every drill has to fall in a band, or its page loses the one paragraph that
// separates it from the drill a thousandth away.
export default async function () {
  const pages = [];

  // Sorted by diameter, which is the order a drill index is laid out in and the
  // order "the next size up" means anything in.
  const sorted = [...DRILLS].sort((a, b) => a.d - b.d);

  // Two drills must not collide on a URL.
  {
    const seen = new Map();
    for (const dr of sorted) {
      const id = slug(dr.label);
      if (seen.has(id)) {
        console.error(`\n✗ drill-size: ${seen.get(id)} and ${dr.label} both want /drill-size/${id}/`);
        process.exitCode = 1;
      }
      seen.set(id, dr.label);
    }
    if (seen.size !== DRILLS.length) {
      console.error(`\n✗ drill-size: ${seen.size} distinct slugs for ${DRILLS.length} drills`);
      process.exitCode = 1;
    }
  }

  // Sorted order must not go backwards. It may repeat: E and 1/4" are both
  // exactly 0.250 inches, the one place a letter drill and a fractional drill
  // are the same bit. A strictly-increasing check fails on that true fact, and
  // it did on the first run.
  for (let i = 1; i < sorted.length; i++) {
    if (sorted[i].d < sorted[i - 1].d) {
      console.error(`\n✗ drill-size: ${sorted[i - 1].label} at ${sorted[i - 1].d} in sorts before ${sorted[i].label} at ${sorted[i].d} in`);
      process.exitCode = 1;
    }
  }

  for (const dr of sorted) {
    if (!BANDS.some(([lo, hi]) => dr.d >= lo && dr.d < hi)) {
      console.error(`\n✗ drill-size: ${dr.label} at ${dr.d} in falls in no size band`);
      process.exitCode = 1;
    }
  }

  // Which taps this drill is the 75% figure for, computed from the same formula
  // the tap pages use so the two sections cannot disagree.
  const tapsFor = new Map();
  for (const t of THREADS) {
    const want = nearestDrill(theoretical(t[1], t[2], 75));
    const list = tapsFor.get(want.label) || [];
    list.push(t[0]);
    tapsFor.set(want.label, list);
  }
  for (const [label] of tapsFor) {
    if (!DRILLS.some((d) => d.label === label)) {
      console.error(`\n✗ drill-size: a tap resolves to drill "${label}", which is not in the drill table`);
      process.exitCode = 1;
    }
  }

  const ids = sorted.map((d) => slug(d.label));

  for (let i = 0; i < sorted.length; i++) {
    const dr = sorted[i];
    const id = slug(dr.label);
    const mm = dr.d * IN;
    // Not simply the neighbour in the sorted list: E and 1/4" are the same
    // diameter, so the next size up from E is not 1/4" — it is the next one
    // that is actually bigger.
    const below = [...sorted.slice(0, i)].reverse().find((x) => x.d < dr.d);
    const above = sorted.slice(i + 1).find((x) => x.d > dr.d);
    const twin = sorted.find((x) => x !== dr && x.d === dr.d);
    const taps = tapsFor.get(dr.label) || [];
    const type = kind(dr.label);
    const metric = nearestMetric(dr.d);
    const metricGap = Math.abs(metric - mm);

    // The closest drill of each other kind, which is what somebody without the
    // right index actually needs.
    const closestOfKind = (want) => sorted
      .filter((x) => kind(x.label) === want && x.label !== dr.label)
      .reduce((best, x) => Math.abs(x.d - dr.d) < Math.abs(best.d - dr.d) ? x : best);
    const alternatives = ['number', 'letter', 'fractional'].filter((k) => k !== type).map(closestOfKind);
    const closestGap = Math.min(...alternatives.map((a) => Math.abs(a.d - dr.d)));

    const tapLink = (t) => `<a href="/tap-drill/${t.replace(/\//g, '-').toLowerCase()}/">${esc(t)}</a>`;

    const FAQ = faq([
      {
        q: `What size is a ${dr.label} drill bit?`,
        a: `<strong>${r4(dr.d)} inches</strong>, which is <strong>${r2(mm)} mm</strong>. ${type === 'number' ? 'Number drills run from #1 at 0.228 inches down to #60 at 0.04, getting smaller as the number rises — the opposite of what most people expect the first time.' : type === 'letter' ? 'Letter drills run A to Z and get larger as the letter advances, filling the gap between the largest number drill and the fractional sizes.' : 'Fractional drills step in 64ths of an inch, which is the coarsest of the three systems and the one most home sets contain.'}`,
      },
      {
        q: `What is a ${dr.label} drill bit in mm?`,
        a: `<strong>${r2(mm)} mm</strong>. A metric index will offer <strong>${metric} mm</strong> as the nearest stocked size, ${metricGap < 0.02 ? 'which is near enough identical' : `which is ${r3(metricGap)} mm ${metric > mm ? 'larger' : 'smaller'} — enough to matter when tapping and not enough to matter for a clearance hole`}.`,
      },
      taps.length
        ? {
            q: `What tap does a ${dr.label} drill bit go with?`,
            a: `<strong>${esc(taps.join(', '))}</strong> at the standard 75% thread. ${taps.length > 1 ? 'Both of those come' : 'That thread comes'} out at a theoretical diameter this drill is the nearest stocked size to.`,
          }
        : {
            q: `Is ${dr.label} a tapping drill size?`,
            a: `Not for any of the unified threads on this site. ${above && (tapsFor.get(above.label) || []).length ? `The next size up, ${esc(above.label)}, is the tapping drill for ${esc((tapsFor.get(above.label) || []).join(' and '))}.` : 'It sits between the sizes the standard taps call for, so it is a clearance or pilot drill rather than a tapping one.'}`,
          },
      {
        q: `What is the next size up from ${dr.label}?`,
        a: above
          ? `<strong>${esc(above.label)}</strong> at ${r4(above.d)} inches — ${r4(above.d - dr.d)} inches larger. ${below ? `Below it is ${esc(below.label)} at ${r4(below.d)}.` : 'There is nothing smaller in these three systems.'}`
          : `Nothing — ${dr.label} is the largest size in these three systems at ${r4(dr.d)} inches.`,
      },
    ]);

    const titleFull = `${dr.label} Drill Bit Size — ${r4(dr.d)} in, ${r2(mm)} mm`;

    pages.push({
      path: `/drill-size/${id}/`,
      title: titleFull.length <= 65 ? titleFull : `${dr.label} Drill Bit Size — ${r2(mm)} mm`,
      desc: `A ${dr.label} drill bit is ${r4(dr.d)} inches, or ${r2(mm)} mm. The nearest metric size, the nearest bit in the other two systems, the sizes either side of it${taps.length ? `, and the tap it goes with (${taps.join(', ')})` : ''}.`,
      h1: `${dr.label} drill bit size`,
      crumbs: [
        { name: 'Drill sizes', path: '/drill-size/' },
        { name: dr.label, path: `/drill-size/${id}/` },
      ],
      jsonld: [FAQ.schema],
      body: `<p class="big" style="font-size:1.8rem;margin:.3em 0"><strong>${r4(dr.d)} in</strong></p>
<p class="muted">${r2(mm)} mm · ${type} drill${taps.length ? ` · tapping drill for ${esc(taps.join(', '))}` : ''}</p>

<table><tbody>
<tr><td>Inches</td><td class="out">${r4(dr.d)} in</td></tr>
<tr><td>Millimetres</td><td class="out">${r2(mm)} mm</td></tr>
<tr><td>Nearest metric drill</td><td class="out">${metric} mm</td></tr>
<tr><td>System</td><td class="out">${type === 'number' ? 'Number (#1 to #60)' : type === 'letter' ? 'Letter (A to Z)' : 'Fractional (64ths)'}</td></tr>
${taps.length ? `<tr><td>Taps</td><td class="out">${taps.map(tapLink).join(', ')}</td></tr>` : ''}
</tbody></table>

<h2>What ${dr.label} means</h2>
<p>${type === 'number'
  ? `A bit marked <strong>${dr.label}</strong> is a number drill, and the number is an index rather than a measurement — <strong>the higher the number, the smaller the bit</strong>. #1 is 0.228 inches and #60 is 0.04. That is the opposite of the fractional sizes stamped on a home set, which is why a number drill and a fraction of similar appearance can be very different holes.`
  : type === 'letter'
    ? `A bit marked <strong>${dr.label}</strong> is a letter drill. Letters run A to Z and get <strong>larger</strong> as they advance, covering 0.234 to 0.413 inches — the gap between the largest number drill and the point where fractional sizes become fine enough to be useful.`
    : `<strong>${dr.label}</strong> is a fractional drill, stepping in 64ths of an inch. Fractional sizes are the coarsest of the three systems, which is why a fractional set alone cannot hit most tapping sizes and why number and letter drills exist at all.`}</p>

${twin ? `<h2>${dr.label} and ${twin.label} are the same bit</h2>
<p><strong>${esc(dr.label)} and ${esc(twin.label)} are both exactly ${r4(dr.d)} inches.</strong> This is the one place in the three imperial systems where a letter drill and a fractional drill land on the same diameter, so a bit marked either way cuts the same hole. If you have both in a drawer, you have two of the same drill.</p>` : ''}

<h2>The same hole in the other systems</h2>
<p>Three drill systems overlap across this range and a workshop rarely has all three. The nearest bit of each other kind to ${dr.label}:</p>
<table><thead><tr><th>System</th><th>Nearest size</th><th>Difference</th></tr></thead><tbody>
${alternatives.map((alt) => `<tr><td>${kind(alt.label)}</td><td><a href="/drill-size/${slug(alt.label)}/">${esc(alt.label)}</a> — ${r4(alt.d)} in</td><td>${alt.d === dr.d ? 'identical' : `${r4(Math.abs(alt.d - dr.d))} in ${alt.d > dr.d ? 'larger' : 'smaller'}`}</td></tr>`).join('')}
<tr><td>metric</td><td>${metric} mm</td><td>${metricGap < 0.005 ? 'identical' : `${r3(metricGap)} mm ${metric > mm ? 'larger' : 'smaller'}`}</td></tr>
</tbody></table>
<p>${closestGap < 0.003
  ? 'One of those is within three thousandths of an inch, which is inside the tolerance of most hand-held work — substitute it and nobody will know.'
  : `The closest substitute is ${r4(closestGap)} inches away. For a clearance hole that is nothing; for a tapping hole it moves the thread engagement by several per cent, which is the difference between an easy tap and a broken one.`}</p>

${taps.length ? `<h2>What ${dr.label} is for</h2>
<p>${dr.label} is the standard tapping drill for <strong>${taps.map(tapLink).join(' and ')}</strong> at 75% thread engagement. That is not a coincidence of the tables: the theoretical figure for ${esc(taps[0])} works out at ${r4(theoretical(THREADS.find((t) => t[0] === taps[0])[1], THREADS.find((t) => t[0] === taps[0])[2], 75))} inches, and ${dr.label} at ${r4(dr.d)} is the nearest drill that exists.</p>` : ''}

<h2>What gets drilled at ${r4(dr.d)} inches</h2>
<p>${bandOf(dr.d)}</p>

<h2>Either side of it</h2>
<table><thead><tr><th>Drill</th><th>Inches</th><th>Millimetres</th></tr></thead><tbody>
${sorted.slice(Math.max(0, i - 3), i + 4).map((x) => `<tr${x === dr ? ' style="font-weight:600"' : ''}><td>${x === dr ? esc(x.label) : `<a href="/drill-size/${slug(x.label)}/">${esc(x.label)}</a>`}</td><td>${r4(x.d)} in</td><td>${r2(x.d * IN)} mm</td></tr>`).join('')}
</tbody></table>

${FAQ.html}

<h2>Other sizes</h2>
<ul class="linklist">${ring(ids, id, 8).map((o) => {
  const x = sorted[ids.indexOf(o)];
  return `<li><a href="/drill-size/${o}/">${esc(x.label)} drill bit</a> — ${r4(x.d)} in, ${r2(x.d * IN)} mm</li>`;
}).join('')}</ul>

<p><a href="/drill-size/">Every drill size</a> · <a href="/tap-drill/">Tap drill sizes</a> · <a href="/thread/">Metric threads</a></p>`,
    });
  }

  const group = (want, heading, note) => `<h2>${heading}</h2>
<p>${note}</p>
<table><thead><tr><th>Drill</th><th>Inches</th><th>Millimetres</th><th>Tap</th></tr></thead><tbody>
${sorted.filter((x) => kind(x.label) === want).map((x) => `<tr><td><a href="/drill-size/${slug(x.label)}/">${esc(x.label)}</a></td><td>${r4(x.d)} in</td><td>${r2(x.d * IN)} mm</td><td>${esc((tapsFor.get(x.label) || []).join(', ')) || '—'}</td></tr>`).join('')}
</tbody></table>`;

  pages.push({
    path: '/drill-size/',
    title: 'Drill Bit Size Chart — Number, Letter and Fractional, in mm',
    desc: `All ${DRILLS.length} drill sizes in the three imperial systems — number, letter and fractional — in inches and millimetres, with the nearest metric size and the tap each one goes with.`,
    h1: 'Drill bit sizes',
    crumbs: [{ name: 'Drill sizes', path: '/drill-size/' }],
    body: `<p>Three systems of drill size overlap across the same range of holes, and a bit marked <code>7</code> or <code>F</code> or <code>21/64</code> gives no clue which one it belongs to. All ${DRILLS.length} of them are here, each with its own page giving the size in inches and millimetres, the nearest bit in the other two systems, and the tap it is cut for.</p>

<h2>The trap in the number system</h2>
<p><strong>Number drills get smaller as the number gets larger.</strong> #1 is 0.228 inches and #60 is 0.04 — an index, not a measurement. Letter drills do the opposite and grow from A to Z. Fractional drills are the only ones where the marking is the size, and they are also the coarsest, which is why the other two exist.</p>

<h2>The one overlap</h2>
<p><strong>E and 1/4 inch are the same drill</strong>, both exactly 0.250 inches. It is the only place in the three systems where a letter and a fraction land on the same diameter.</p>

${group('number', 'Number drills, #1 to #60', 'The fine end of the imperial range, and where most tapping drills live. Remember that the numbers run backwards.')}
${group('letter', 'Letter drills, A to Z', 'From 0.234 to 0.413 inches, bridging the largest number drill and the useful fractional sizes.')}
${group('fractional', 'Fractional drills, 64ths', 'The set in most homes. Coarse enough that it misses nearly every tapping size, which is the whole reason for the other two systems.')}

<p><a href="/tap-drill/">Tap drill sizes</a> · <a href="/thread/">Metric threads</a> · <a href="/screw/">Screw sizes</a></p>`,
  });

  return pages;
}
