import { faq } from '../layout.mjs';

// The number people actually need is computed, not looked up:
//
//     tapping drill = major diameter − pitch
//
// M6 coarse is 1.0 mm pitch, so it is drilled 5.0 mm. That rule reproduces every
// published tapping-drill chart from M2 to M24 to within the rounding those
// charts apply to reach a drill size that exists — M8 works out at 6.75 and is
// sold as 6.8. Checked against thirteen published values below.
//
// Clearance holes, hex key sizes and spanner sizes are standards rather than
// arithmetic, so those are given explicitly. Where two standards disagree — and
// for spanner sizes they do, which is why an M10 bolt sometimes takes a 16 and
// sometimes a 17 — both numbers are stated rather than one being picked.

// [major Ø, coarse pitch, common fine pitch or null, clearance (ISO 273 medium),
//  hex socket key, spanner across flats (DIN), spanner (ISO) if different, use]
export const THREADS = [
  [2, 0.4, null, 2.4, 1.5, 4, null, 'Electronics, small hinges and instrument work.'],
  [2.5, 0.45, null, 2.9, 2, 5, null, 'Laptop and small appliance assembly.'],
  [3, 0.5, null, 3.4, 2.5, 5.5, null, 'The smallest size in general workshop use — enclosures, brackets, 3D-printed parts.'],
  [4, 0.7, null, 4.5, 3, 7, null, 'Light brackets, panel fixings and small machine assemblies.'],
  [5, 0.8, null, 5.5, 4, 8, null, 'General light assembly; the smallest size most people keep in a bolt tin.'],
  [6, 1.0, 0.75, 6.6, 5, 10, null, 'The workshop default. Bicycle bottle cages, brackets, jigs and most light machinery.'],
  [8, 1.25, 1.0, 9, 6, 13, null, 'Machine mounts, furniture legs, engine ancillaries. Strong enough for real loads and still driven by a common socket.'],
  [10, 1.5, 1.25, 11, 8, 17, 16, 'Structural brackets, suspension components, heavy furniture.'],
  [12, 1.75, 1.5, 13.5, 10, 19, 18, 'Heavy machinery mounts and structural steelwork.'],
  [14, 2.0, 1.5, 15.5, 12, 22, 21, 'Uncommon in general work; found in vehicle and machine assemblies.'],
  [16, 2.0, 1.5, 17.5, 14, 24, null, 'Structural bolting, heavy plant, tow points.'],
  [20, 2.5, 1.5, 22, 17, 30, null, 'Structural steel connections and heavy anchorage.'],
  [24, 3.0, 2.0, 26, 19, 36, null, 'Large structural and civil fixings.'],
];

// Published tapping drills, to prove the subtraction rule rather than assume it.
const PUBLISHED_TAP = { 2: 1.6, 2.5: 2.05, 3: 2.5, 4: 3.3, 5: 4.2, 6: 5.0, 8: 6.8, 10: 8.5, 12: 10.2, 14: 12.0, 16: 14.0, 20: 17.5, 24: 21.0 };
{
  const bad = [];
  for (const [d, p] of THREADS.map((t) => [t[0], t[1]])) {
    const want = PUBLISHED_TAP[d];
    // A missing published value used to skip the size. Mutation testing moved
    // M2 to M2.2, the lookup came back undefined, and the check turned itself
    // off rather than failing — which is how a table gains a size nobody has
    // ever verified.
    if (want == null) { bad.push(`M${d} has no published tapping drill to check against`); continue; }
    if (Math.abs(d - p - want) > 0.06) bad.push(`M${d}: ${d} − ${p} = ${(d - p).toFixed(2)}, published drill ${want}`);
  }
  if (bad.length) {
    console.error('\n✗ tapping drill rule no longer matches the published charts:');
    for (const b of bad) console.error('    ' + b);
    process.exitCode = 1;
  }
}

const n = (v) => (Number.isInteger(v) ? String(v) : String(v));

export default async function () {
  const pages = [];
  const rows = THREADS.map(([d, coarse, fine, clear, hex, spanDin, spanIso, use]) => ({
    d, coarse, fine, clear, hex, spanDin, spanIso, use,
    id: `m${d}`.replace('.', '-'),
    label: `M${d}`,
    tap: +(d - coarse).toFixed(2),
    tapFine: fine ? +(d - fine).toFixed(2) : null,
  }));

  for (const r of rows) {
    const others = rows.filter((x) => x.id !== r.id);
    const near = others.filter((x) => Math.abs(x.d - r.d) <= (r.d < 8 ? 3 : 8)).slice(0, 6);
    const drill = PUBLISHED_TAP[r.d];

    const FAQ = faq([
      { q: `What drill size for ${r.label}?`,
        a: `<strong>${drill ?? r.tap} mm</strong> for a coarse thread. The rule is major diameter minus pitch: ${r.d} − ${r.coarse} = ${r.tap}${drill && drill !== r.tap ? `, and ${drill} mm is the nearest drill actually sold` : ''}.` },
      { q: `What is the clearance hole for ${r.label}?`,
        a: `<strong>${r.clear} mm</strong> for a normal fit under ISO 273. A close fit is about ${(r.clear - (r.d < 6 ? 0.2 : 0.4)).toFixed(1)} mm and a loose fit around ${(r.clear + (r.d < 6 ? 0.4 : 1)).toFixed(1)} mm — the clearance hole is the one in the part the bolt passes <em>through</em>, not the one being tapped.` },
      { q: `What size spanner for an ${r.label} bolt?`,
        a: r.spanIso
          ? `<strong>${r.spanDin} mm or ${r.spanIso} mm</strong> — the standards disagree at this size. DIN 933 specifies ${r.spanDin} mm across the flats and ISO 4017 specifies ${r.spanIso}. Both bolts are ${r.label}; only the head differs, which is why a socket set can seem to be missing a size.`
          : `<strong>${r.spanDin} mm</strong> across the flats for a standard hex head. A socket head cap screw of the same size takes a ${r.hex} mm hex key instead.` },
      { q: `What is the pitch of ${r.label}?`,
        a: `<strong>${r.coarse} mm</strong> coarse${r.fine ? `, or ${r.fine} mm in the fine series (${r.label}×${r.fine})` : ''}. Pitch is the distance between adjacent thread crests, so one full turn advances the bolt ${r.coarse} mm.` },
    ]);

    pages.push({
      path: `/thread/${r.id}/`,
      title: `${r.label} Thread — ${drill ?? r.tap} mm Tapping Drill, ${r.clear} mm Clearance | Toolman`,
      desc: `${r.label} coarse thread: ${r.coarse} mm pitch, ${drill ?? r.tap} mm tapping drill, ${r.clear} mm clearance hole, ${r.hex} mm hex key, ${r.spanDin}${r.spanIso ? ` or ${r.spanIso}` : ''} mm spanner. Where the numbers come from.`,
      h1: `${r.label} thread sizes`,
      crumbs: [{ name: 'Metric threads', path: '/thread/' }, { name: r.label, path: `/thread/${r.id}/` }],
      jsonld: [FAQ.schema],
      body: `<p class="big" style="font-size:1.6rem;margin:.3em 0"><strong>${drill ?? r.tap} mm tapping drill · ${r.clear} mm clearance</strong></p>
<p class="muted">${r.coarse} mm coarse pitch${r.fine ? ` · ${r.fine} mm fine` : ''} · ${r.hex} mm hex key · ${r.spanDin}${r.spanIso ? `/${r.spanIso}` : ''} mm spanner</p>

<h2>What ${r.label} is used for</h2>
<p>${r.use}</p>

<h2>Every number for ${r.label}</h2>
<table><tbody>
<tr><td>Major diameter</td><td>${r.d} mm</td></tr>
<tr><td>Coarse pitch</td><td>${r.coarse} mm</td></tr>
${r.fine ? `<tr><td>Fine pitch</td><td>${r.fine} mm <span class="muted">(${r.label}×${r.fine})</span></td></tr>` : ''}
<tr><td>Tapping drill, coarse</td><td><strong>${drill ?? r.tap} mm</strong> <span class="muted">(${r.d} − ${r.coarse} = ${r.tap})</span></td></tr>
${r.tapFine ? `<tr><td>Tapping drill, fine</td><td>${r.tapFine} mm</td></tr>` : ''}
<tr><td>Clearance hole, normal</td><td>${r.clear} mm</td></tr>
<tr><td>Hex key (socket head)</td><td>${r.hex} mm</td></tr>
<tr><td>Spanner (hex head)</td><td>${r.spanDin} mm${r.spanIso ? ` <span class="muted">— or ${r.spanIso} mm under ISO 4017</span>` : ''}</td></tr>
<tr><td>Tapped depth, steel</td><td>${(r.d * 1.5).toFixed(1)} mm <span class="muted">(1.5 × diameter)</span></td></tr>
<tr><td>Tapped depth, aluminium</td><td>${(r.d * 2).toFixed(1)} mm <span class="muted">(2 × diameter)</span></td></tr>
</tbody></table>

<h2>Where the drill size comes from</h2>
<p>A tapping drill leaves enough material for the tap to cut a thread, and the amount it has to leave is one pitch: <strong>drill = major diameter − pitch</strong>. For ${r.label} coarse that is ${r.d} − ${r.coarse} = <strong>${r.tap} mm</strong>${drill && drill !== r.tap ? `, and since ${r.tap} mm is not a drill anyone sells, the charts round to ${drill}` : ''}. The rule holds for the fine series too — ${r.fine ? `${r.label}×${r.fine} is drilled ${r.tapFine} mm` : 'subtract whichever pitch you are cutting'}.</p>
<p>Going slightly larger gives a shallower thread that is easier to tap and weaker; going smaller risks breaking the tap. The standard drill aims at about 75% thread engagement, which is where the strength stops improving enough to be worth the extra effort.</p>

<h2>Nearby sizes</h2>
<table><thead><tr><th>Thread</th><th>Pitch</th><th>Tapping drill</th><th>Clearance</th><th>Hex key</th></tr></thead><tbody>
${near.map((x) => `<tr><td><a href="/thread/${x.id}/">${x.label}</a></td><td>${x.coarse} mm</td><td>${PUBLISHED_TAP[x.d] ?? x.tap} mm</td><td>${x.clear} mm</td><td>${x.hex} mm</td></tr>`).join('')}
</tbody></table>

${FAQ.html}

<p><a href="/thread/">The full metric thread chart</a> · <a href="/convert/">Unit converters</a></p>`,
    });
  }

  const m10 = rows.find((r) => r.d === 10);

  pages.push({
    path: '/thread/',
    title: 'Metric Thread Chart — Tapping Drill, Clearance and Spanner Sizes | Toolman',
    desc: 'M2 to M24: pitch, tapping drill, clearance hole, hex key and spanner size. The tapping drill is major diameter minus pitch — M6 is drilled 5.0 mm, and here is every other size.',
    h1: 'Metric thread sizes',
    crumbs: [{ name: 'Metric threads', path: '/thread/' }],
    body: `<p class="muted">${rows.length} metric thread sizes with every number needed to drill, tap, clear and tighten them.</p>

<h2>The one rule worth memorising</h2>
<p><strong>Tapping drill = major diameter − pitch.</strong> M6 coarse has a 1.0 mm pitch, so it is drilled 5.0 mm. M8 coarse is 1.25, so 6.75 — sold as a 6.8 mm drill, because 6.75 is not a size anyone stocks. That subtraction reproduces every published tapping-drill chart, which is worth knowing precisely because it means you never need the chart.</p>
<p>The clearance hole is the other number, and it is the one people get the wrong way round: <strong>the tapping drill is for the part being threaded, the clearance hole is for the part the bolt passes through.</strong> Drilling a clearance hole and then trying to tap it produces a hole with no thread left in it.</p>

<h2>The full chart</h2>
<table><thead><tr><th>Thread</th><th>Pitch</th><th>Tapping drill</th><th>Clearance</th><th>Hex key</th><th>Spanner</th></tr></thead><tbody>
${rows.map((r) => `<tr><td><a href="/thread/${r.id}/">${r.label}</a></td><td>${r.coarse} mm${r.fine ? ` <span class="muted">/ ${r.fine}</span>` : ''}</td><td>${PUBLISHED_TAP[r.d] ?? r.tap} mm</td><td>${r.clear} mm</td><td>${r.hex} mm</td><td>${r.spanDin}${r.spanIso ? ` / ${r.spanIso}` : ''} mm</td></tr>`).join('')}
</tbody></table>

<h2>Why an M10 bolt needs two different spanners</h2>
<p>It does not — but your socket set behaves as though it does. <strong>DIN 933 specifies ${m10.spanDin} mm across the flats for an M10 hex head and ISO 4017 specifies ${m10.spanIso}.</strong> Both are M10 bolts with identical threads; only the head size differs. The same split applies at M12 and M14. This is why a set that covers 8, 10, 13, 17 and 19 will occasionally meet a bolt it cannot grip, and why metric sets sold today usually include both 16 and 17.</p>

<h2>Coarse and fine</h2>
<p>Every size here has a coarse pitch, which is the default and what "M6" means without further qualification. The fine series has a smaller pitch — M8×1.0 against the coarse M8×1.25 — which gives more threads per unit length, a shallower thread, and better resistance to vibrating loose. It is also more easily cross-threaded and strips more readily in soft material. Fine threads belong in steel and in adjustments; coarse threads belong everywhere else.</p>

<h2>How deep to tap</h2>
<p>The usual rule is <strong>1.5 times the diameter in steel and 2 times in aluminium</strong> — deeper in softer material because the load is spread over more threads. Beyond about 2.5 diameters the extra threads carry almost nothing: the first few take most of the load, which is why a longer bolt in a deeper hole is not stronger past a point.</p>

<p><a href="/awg/">Wire gauge</a> · <a href="/lumber/">Lumber sizes</a> · <a href="/convert/">Unit converters</a></p>`,
  });

  return pages;
}
