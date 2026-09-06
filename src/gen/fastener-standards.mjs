import { esc, faq, ring } from '../layout.mjs';
import { THREADS } from './metric-threads.mjs';

// `din 933 dimensions` and `iso 4762 dimensions` were checked with the test the
// earlier sections should have used — not "is there an answer widget" but "how
// strong is whoever is already there". Page one is eight fastener suppliers and
// a Scribd scan for the first, and for the second a PDF sample, McMaster's
// product picker and a body selling the standard for $110. The strongest name
// across both is Engineers Edge, and several of the snippets are visibly
// mangled table OCR. Set that beside `chartreuse hex code` — Figma, Canva,
// Adobe in the first four — and the difference is the point.
//
// The constraint this section is built under: **no dimension is transcribed.**
// The paid standards cost money and the free copies are supplier catalogues
// with OCR'd tables, which is exactly the source that produces a confident
// wrong number. Every millimetre here comes from THREADS in metric-threads.mjs,
// which is already in the repository and already carries the DIN/ISO
// across-flats split, or is computed from it and asserted.
//
// Where the data does not stretch — nut and washer dimensions — the page says
// what the standard is and what it is equivalent to, and links to the size
// pages for the rest. It does not invent a table.

const rows = THREADS.map(([d, coarse, fine, clear, hex, spanDin, spanIso, use]) => ({
  d, coarse, fine, clear, hex, spanDin, spanIso, use,
  label: `M${d}`,
  id: `m${d}`.replace('.', '-'),
}));

// Across corners of a hexagon is the across-flats divided by cos 30°. The
// standards quote a slightly smaller minimum because the corners are allowed to
// be rounded off; the geometric figure is what a socket has to clear.
const ACROSS_CORNERS = 1 / Math.cos(Math.PI / 6);
const corners = (s) => Math.round(s * ACROSS_CORNERS * 100) / 100;

// [id, name, counterpart id or null, what it covers, whether we hold dimensions]
const STANDARDS = [
  {
    id: 'din-933', name: 'DIN 933', pair: 'iso-4017', family: 'hex', shank: 'full', sibling: 'din-931',
    what: 'Hexagon head bolts threaded all the way to the head — DIN’s own title calls these “set screws”, which today reads as a grub screw and is not what this is.',
    detail: 'DIN 933 is the fully threaded hex bolt: the thread runs the whole length, right up under the head. It is the bolt most people picture when they say "bolt", and it is the one to use when the joint is clamping through its full depth rather than bearing on a plain shank.',
  },
  {
    id: 'iso-4017', name: 'ISO 4017', pair: 'din-933', family: 'hex', shank: 'full', sibling: 'iso-4014',
    what: 'Hexagon head screws, fully threaded — the ISO standard that replaced DIN 933.',
    detail: 'ISO 4017 covers the same fastener as DIN 933 and supersedes it. The threads are identical and the two are interchangeable in the hole. The heads are not identical at every size, which is the source of the missing-socket problem below.',
  },
  {
    id: 'din-931', name: 'DIN 931', pair: 'iso-4014', family: 'hex', shank: 'partial', sibling: 'din-933',
    what: 'Hexagon head bolts, partially threaded — a plain shank under the head.',
    detail: 'DIN 931 is the partially threaded hex bolt. The unthreaded shank under the head is the point of it: it takes shear across the joint on solid metal rather than on the root of a thread, and it locates the parts more precisely than a thread can.',
  },
  {
    id: 'iso-4014', name: 'ISO 4014', pair: 'din-931', family: 'hex', shank: 'partial', sibling: 'iso-4017',
    what: 'Hexagon head bolts, partially threaded — the ISO standard that replaced DIN 931.',
    detail: 'ISO 4014 covers the same partially threaded hex bolt as DIN 931 and supersedes it. As with the fully threaded pair, the thread is the same and the head is not always.',
  },
  {
    id: 'din-912', name: 'DIN 912', pair: 'iso-4762', family: 'socket',
    what: 'Hexagon socket head cap screws — the cylindrical head driven by a hex key.',
    detail: 'DIN 912 is the socket head cap screw: a cylindrical head with a hexagon socket sunk into it, driven by a hex key rather than a spanner. It is the fastener of choice where there is no room to swing a spanner and where the head can sit in a counterbore.',
  },
  {
    id: 'iso-4762', name: 'ISO 4762', pair: 'din-912', family: 'socket',
    what: 'Hexagon socket head cap screws — the ISO standard matching DIN 912.',
    detail: 'ISO 4762 covers the same socket head cap screw as DIN 912. Unlike the hex head pair, these two agree: the socket sizes and head dimensions match, and suppliers list them together as "DIN 912 / ISO 4762".',
  },
  {
    id: 'din-934', name: 'DIN 934', pair: 'iso-4032', family: 'nut',
    what: 'Hexagon nuts — the plain hex nut.',
    detail: 'DIN 934 is the ordinary hexagon nut, the counterpart to a DIN 931 or DIN 933 bolt. It is the most-used nut standard in Europe and the one a supplier means by "hex nut" unless they say otherwise.',
  },
  {
    id: 'iso-4032', name: 'ISO 4032', pair: 'din-934', family: 'nut',
    what: 'Hexagon regular nuts, style 1 — the ISO standard that replaced DIN 934.',
    detail: 'ISO 4032 supersedes DIN 934. The thread is the same and the nuts thread onto the same bolts. Whether the across-flats also differs between the two nut standards is not something this site holds checked data for, so it is not stated here — check the figure against whichever standard the part was actually made to.',
  },
];

const byId = Object.fromEntries(STANDARDS.map((s) => [s.id, s]));

// The pairing has to be symmetric, or a page will point at a standard that does
// not point back and the "equivalent to" claim is only half true.
for (const s of STANDARDS) {
  const p = byId[s.pair];
  if (!p) {
    console.error(`\n✗ fastener: ${s.name} names ${s.pair} as its counterpart and there is no such standard`);
    process.exitCode = 1;
  } else if (p.pair !== s.id) {
    console.error(`\n✗ fastener: ${s.name} points at ${p.name}, which points at ${p.pair} instead of back`);
    process.exitCode = 1;
  } else if (p.family !== s.family) {
    console.error(`\n✗ fastener: ${s.name} (${s.family}) is paired with ${p.name} (${p.family})`);
    process.exitCode = 1;
  }
}

// din 931 vs din 933 is the question people actually type, and the two pages
// were 90% identical because both said "supersedes the other one". The shank is
// the difference and it is the whole reason to pick one, so each page argues its
// own case. The sibling link has to be symmetric and has to cross the shank
// types, or a page argues against itself.
for (const s of STANDARDS.filter((x) => x.family === 'hex')) {
  const sib = byId[s.sibling];
  if (!sib || sib.sibling !== s.id) {
    console.error(`
✗ fastener: ${s.name} names ${s.sibling} as its opposite number and that is not mutual`);
    process.exitCode = 1;
  } else if (sib.shank === s.shank) {
    console.error(`
✗ fastener: ${s.name} and ${sib.name} are both ${s.shank}-thread, so the comparison between them says nothing`);
    process.exitCode = 1;
  }
}

// Across corners must exceed across flats, and by the fixed ratio. A socket
// bored to the across-flats figure does not go over the head.
for (const r of rows) {
  for (const s of [r.spanDin, r.spanIso]) {
    if (!s) continue;
    if (!(corners(s) > s) || Math.abs(corners(s) - s * ACROSS_CORNERS) > 0.005) {
      console.error(`\n✗ fastener ${r.label}: ${s} mm across flats gives ${corners(s)} mm across corners, which is not s ÷ cos 30°`);
      process.exitCode = 1;
    }
  }
}

// The split is the reason this section is worth writing. If it ever disappears
// from the data the pages built around it are talking about nothing.
const SPLIT = rows.filter((r) => r.spanIso);
if (SPLIT.length === 0) {
  console.error('\n✗ fastener: no size in THREADS records a DIN/ISO across-flats difference, and several pages are about that difference');
  process.exitCode = 1;
}

// Which across-flats a given standard specifies for a given size.
const flats = (std, r) => (std.id.startsWith('iso') && r.spanIso ? r.spanIso : r.spanDin);

const sizeTable = (std) => `<table><thead><tr><th>Size</th><th>Pitch</th><th>Across flats</th><th>Across corners</th><th>Clearance hole</th></tr></thead><tbody>
${rows.map((r) => {
  const s = flats(std, r);
  const differs = r.spanIso && r.spanIso !== r.spanDin;
  return `<tr><td><a href="/thread/${r.id}/">${r.label}</a></td><td>${r.coarse} mm</td><td>${s} mm${differs ? ` <span class="muted">(${std.id.startsWith('iso') ? `DIN ${r.spanDin}` : `ISO ${r.spanIso}`})</span>` : ''}</td><td>${corners(s)} mm</td><td>${r.clear} mm</td></tr>`;
}).join('')}
</tbody></table>
<p class="muted">Across corners is the across-flats divided by cos&nbsp;30°, which is what a socket has to clear. The standards quote a slightly smaller minimum because the corners may be rounded.</p>`;

const socketTable = () => `<table><thead><tr><th>Size</th><th>Pitch</th><th>Hex key</th><th>Clearance hole</th><th>Tapping drill</th></tr></thead><tbody>
${rows.map((r) => `<tr><td><a href="/thread/${r.id}/">${r.label}</a></td><td>${r.coarse} mm</td><td>${r.hex} mm</td><td>${r.clear} mm</td><td>${Math.round((r.d - r.coarse) * 100) / 100} mm</td></tr>`).join('')}
</tbody></table>`;

const splitSentence = `<strong>${SPLIT.map((r) => r.label).join(', ')}</strong> — DIN specifies ${SPLIT.map((r) => `${r.spanDin} mm`).join(', ')} across the flats where ISO specifies ${SPLIT.map((r) => `${r.spanIso}`).join(', ')} mm`;

export default async function () {
  const pages = [];
  const ids = STANDARDS.map((s) => s.id);

  for (const std of STANDARDS) {
    const other = byId[std.pair];
    const isIso = std.id.startsWith('iso');
    const hasTable = std.family === 'hex' || std.family === 'socket';
    const shank = std.shank;
    const partner = std.sibling ? byId[std.sibling] : null;
    const shankHeading = shank === 'full' ? 'Threaded all the way to the head' : 'Why the shank is left plain';
    const r10 = rows.find((r) => r.d === 10);

    const FAQ = faq([
      {
        q: `What is ${std.name}?`,
        a: `${esc(std.what)} ${isIso ? `It is the ISO standard covering the same fastener as ${other.name}.` : `Its ISO equivalent is <a href="/fastener/${other.id}/">${other.name}</a>.`}`,
      },
      {
        q: `Is ${std.name} the same as ${other.name}?`,
        a: std.family === 'socket'
          ? `Yes, for practical purposes. ${std.name} and ${other.name} describe the same socket head cap screw and suppliers list them together. A part sold as one will fit where the other is specified.`
          : `The threads are the same and the two are interchangeable in the hole, but <strong>the heads differ at ${SPLIT.map((r) => r.label).join(', ')}</strong>. ${splitSentence}. Everywhere else the two agree.`,
      },
      hasTable && std.family === 'hex'
        ? {
            q: `What spanner does an M10 ${std.name} take?`,
            a: `<strong>${flats(std, rows.find((r) => r.d === 10))} mm.</strong> ${isIso ? 'ISO' : 'DIN'} specifies that size across the flats; the other standard specifies ${isIso ? rows.find((r) => r.d === 10).spanDin : rows.find((r) => r.d === 10).spanIso} mm for the same M10 thread. This is why a socket set that covers 8, 10, 13, 17 and 19 occasionally meets a bolt it cannot grip.`,
          }
        : {
            q: `What size hex key does an M10 ${std.name} take?`,
            a: std.family === 'socket'
              ? `<strong>${rows.find((r) => r.d === 10).hex} mm.</strong> Socket head cap screws are driven by a hex key rather than a spanner, and the socket size follows the thread rather than the head.`
              : `A nut is turned by a spanner, not a key. The across-flats depends on which standard the nut was made to, and the <a href="/thread/m10/">M10 thread page</a> gives both figures.`,
          },
      {
        q: `Is ${std.name} still current?`,
        a: isIso
          ? `Yes. ${std.name} is the current international standard; ${other.name} is the withdrawn German one that preceded it. Suppliers still sell and label parts by the DIN number because that is what customers ask for.`
          : `Not formally — ${std.name} has been superseded by <a href="/fastener/${other.id}/">${other.name}</a>. It remains the number everyone uses: catalogues, drawings and purchase orders are still written in DIN numbers, and a supplier asked for ${std.name} will ship a part made to ${other.name}.`,
      },
    ]);

    pages.push({
      path: `/fastener/${std.id}/`,
      title: `${std.name} Dimensions — ${std.family === 'hex' ? 'Hex Head Bolt Sizes' : std.family === 'socket' ? 'Socket Cap Screw Sizes' : 'Hex Nut Standard'}, M2 to M24`,
      desc: `${std.name}: ${std.what} ${std.family === 'nut' ? `Equivalent to ${other.name}, and where the two differ.` : `Across flats, across corners, pitch and clearance hole for M2 to M24, with the sizes where ${std.name} and ${other.name} disagree.`}`,
      h1: `${std.name} dimensions`,
      crumbs: [
        { name: 'Fastener standards', path: '/fastener/' },
        { name: std.name, path: `/fastener/${std.id}/` },
      ],
      jsonld: [FAQ.schema],
      body: `<p class="big"><strong>${esc(std.what)}</strong></p>
<p class="muted">${isIso ? `The ISO standard. ${other.name} is the DIN number for the same part.` : `The DIN number. Superseded by ${other.name}, and still what everyone orders by.`}</p>

<h2>What ${std.name} is</h2>
<p>${std.detail}</p>

${std.family === 'hex' ? `<h2>${shankHeading}</h2>
${shank === 'full'
  ? `<p>The thread on a ${std.name} runs the entire length, right up under the head. That is the whole distinction between this standard and <a href="/fastener/${partner.id}/">${partner.name}</a>, which leaves a plain unthreaded shank under the head, and it decides which one a joint wants.</p>
<p>Full thread is the right choice when the bolt is <strong>clamping</strong> — pulling two faces together and holding them by friction. Thread engagement is available at any grip length, so one length covers a range of stack-ups, and a ${std.name} bolt that is slightly too long still works because the nut simply runs further down. That flexibility is why a workshop stocks these and reaches for them first.</p>
<p>It is the wrong choice when the joint is <strong>loaded across</strong> the bolt rather than along it. A thread in shear is being cut at the root, where the section is smallest and the notch is sharpest: an M10 ${std.name} presents roughly ${r10.d - r10.coarse} mm of metal to a shear load — the thread root sits near the diameter the hole was drilled to — where the plain shank of a ${partner.name} presents the full ${r10.d} mm. That is on the order of ${Math.round(((r10.d ** 2) / ((r10.d - r10.coarse) ** 2) - 1) * 100)}% more area, in the place where it matters.</p>`
  : `<p>A ${std.name} bolt has a plain, unthreaded shank under the head, and the thread starts partway down. That is the whole distinction between this standard and <a href="/fastener/${partner.id}/">${partner.name}</a>, which is threaded to the head.</p>
<p>The shank is not a saving of thread-cutting; it is the load-bearing part. Where a joint is loaded <strong>across</strong> the bolt rather than along it, the shear passes through solid metal instead of through a thread root. An M10 ${std.name} puts the full ${r10.d} mm diameter in the shear plane where a fully threaded bolt puts roughly ${r10.d - r10.coarse} mm — the thread root sits near the diameter the hole was drilled to before tapping. That is on the order of ${Math.round(((r10.d ** 2) / ((r10.d - r10.coarse) ** 2) - 1) * 100)}% more area, and without the stress raiser that a thread root is.</p>
<p>The shank also locates. A plain cylinder in a reamed hole positions two parts to a fraction of a millimetre; a thread rattling in a clearance hole does not. That is why machine builders specify ${std.name} for anything that has to go back together in the same place.</p>
<p>The cost is that the grip length matters. The shank has to pass through the joint and the thread has to start beyond it, so a ${std.name} bolt of the wrong length bottoms the shank against the nut and never clamps — the failure that leaves a joint feeling tight while carrying nothing.</p>`}` : ''}

${hasTable ? `<h2>${std.name} dimensions, M2 to M24</h2>
${std.family === 'hex' ? sizeTable(std) : socketTable()}` : `<h2>${std.name} sizes</h2>
<p>This section does not publish a nut dimension table. The figures are in a standard that costs money to read, and the free copies of it are supplier catalogues with scanned tables — which is exactly the kind of source that produces a confident wrong number. What is here instead is what can be checked: the thread, the pitch and the clearance hole, all of which a ${std.name} nut shares with the bolt it goes on.</p>
<p><a href="/thread/">The metric thread pages</a> carry the pitch, tapping drill, clearance hole, hex key and spanner size for every size from M2 to M24, and the spanner figures there give both the DIN and the ISO across-flats where they differ.</p>`}

<h2>${std.name} against ${other.name}</h2>
${std.family === 'socket'
  ? `<p>These two agree. ${std.name} and ${other.name} describe the same socket head cap screw, take the same hex key, and suppliers list them on one line as "${std.name} / ${other.name}". Ordering by either number gets the same part.</p>`
  : `<p>The threads are identical and the two are fully interchangeable in the hole. <strong>The heads are not identical.</strong> At ${splitSentence}. Everywhere else in this range the two agree exactly.</p>
<p>That difference is small and extremely annoying. An M10 bolt made to ${isIso ? std.name : other.name} takes a ${rows.find((r) => r.d === 10).spanIso} mm spanner and one made to ${isIso ? other.name : std.name} takes ${rows.find((r) => r.d === 10).spanDin} mm. Both are M10, both thread into the same hole, and a socket set built for one will skip a size on the other. It is why metric sets sold today usually carry both 16 and 17.</p>`}

${FAQ.html}

<h2>Other fastener standards</h2>
<ul class="linklist">${ring(ids, std.id, 5).map((o) => `<li><a href="/fastener/${o}/">${esc(byId[o].name)}</a> — ${esc(byId[o].what.replace(/\.$/, ''))}</li>`).join('')}</ul>

<p><a href="/fastener/">Every fastener standard here</a> · <a href="/thread/">Metric thread sizes</a> · <a href="/tap-drill/">Tap drill sizes</a> · <a href="/spanner/">Spanner sizes</a></p>`,
    });
  }

  const group = (family, heading, note) => `<h2>${heading}</h2>
<p>${note}</p>
<table><thead><tr><th>DIN</th><th>ISO</th><th>What it is</th></tr></thead><tbody>
${STANDARDS.filter((s) => s.family === family && !s.id.startsWith('iso')).map((s) => `<tr><td><a href="/fastener/${s.id}/">${esc(s.name)}</a></td><td><a href="/fastener/${s.pair}/">${esc(byId[s.pair].name)}</a></td><td>${esc(s.what.replace(/\.$/, ''))}</td></tr>`).join('')}
</tbody></table>`;

  pages.push({
    path: '/fastener/',
    title: 'Fastener Standards — DIN and ISO Numbers, and What Each One Is',
    desc: 'DIN 933, DIN 931, DIN 912, DIN 934 and their ISO equivalents: what each standard covers, which DIN number maps to which ISO number, and the sizes where the two specify different head sizes for the same thread.',
    h1: 'Fastener standards',
    crumbs: [{ name: 'Fastener standards', path: '/fastener/' }],
    body: `<p>Fasteners are ordered by standard number, and there are two systems in use for the same parts: the German DIN numbers, which are mostly withdrawn but still what everyone writes on a drawing, and the ISO numbers that replaced them. This maps one to the other and says where they disagree.</p>

<h2>The disagreement worth knowing about</h2>
<p>At ${splitSentence}. Both bolts are the same thread and go in the same hole; only the head differs. <strong>A socket set built around the DIN sizes will meet bolts it cannot grip</strong>, which is why metric sets sold today usually include both 16 and 17 rather than one of them.</p>

${group('hex', 'Hex head bolts', 'The two DIN numbers here differ only in whether the thread runs all the way to the head. Both map to ISO numbers that changed the head size at three of the thirteen sizes.')}
${group('socket', 'Socket head cap screws', 'Driven by a hex key rather than a spanner. Here the DIN and ISO standards agree, and suppliers list them on one line.')}
${group('nut', 'Hex nuts', 'The counterpart to the bolts above. These pages carry the standard and its equivalent, not a dimension table — see below for why.')}

<h2>Where the numbers on these pages come from</h2>
<p>None of the dimensions here are transcribed from a catalogue. The standards themselves are paid documents and the free copies circulating are scans of supplier tables, which is the kind of source that produces a confident wrong figure. Every millimetre on these pages comes from the thread data this site already carries and checks, or is computed from it — across corners, for instance, is the across-flats divided by cos&nbsp;30°, which the build verifies for every size.</p>
<p>Where that data does not reach, the pages say so rather than filling the gap. There is no nut dimension table here for that reason.</p>

<p><a href="/thread/">Metric thread sizes</a> · <a href="/tap-drill/">Tap drill sizes</a> · <a href="/spanner/">Spanner sizes</a> · <a href="/screw/">Screw sizes</a></p>`,
  });

  return pages;
}
