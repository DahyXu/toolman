import { esc, faq } from '../layout.mjs';

// NPS is the most extreme nominal-versus-actual case on this site. A "1/2 inch"
// pipe has an outside diameter of 21.3 mm — 0.839 inches, nearly double the
// name — and an inside diameter of about 15.8 mm in schedule 40. The number
// matches neither. It is a label inherited from wrought-iron pipe of the 1800s,
// whose much thicker walls gave roughly that bore, and it was kept when the
// pipe changed because the fittings could not.
//
// From NPS 14 upward the number finally does mean something: it is the outside
// diameter in inches, exactly. Below that it means nothing measurable, which is
// the fact worth putting at the top of every page.

const IN = 25.4;

// [NPS label, id, OD mm, DN, schedule 40 wall mm, use]
const PIPES = [
  ['1/8', '1-8', 10.3, 6, 1.73, 'Instrument lines, gauge tappings and pneumatic control. Too small for anything carrying a useful flow.'],
  ['1/4', '1-4', 13.7, 8, 2.24, 'Compressed air drops, small hydraulic lines and instrument connections.'],
  ['3/8', '3-8', 17.1, 10, 2.31, 'Rarely used in plumbing; found on appliance connections and compressed air.'],
  ['1/2', '1-2', 21.3, 15, 2.77, 'The smallest common plumbing size — final runs to a basin or a radiator. Its outside diameter is 0.84 inches, so the name misses by a factor of nearly two, which is the clearest illustration of what NPS is not.'],
  ['3/4', '3-4', 26.7, 20, 2.87, 'Branch lines feeding two or three fixtures, and the usual size for an outside tap. The most common domestic pipe size after 1/2.'],
  ['1', '1', 33.4, 25, 3.38, 'Domestic mains and the trunk of a small system. From here up the pipe is carrying rather than delivering.'],
  ['1-1/4', '1-1-4', 42.2, 32, 3.56, 'Larger branch mains and small commercial risers.'],
  ['1-1/2', '1-1-2', 48.3, 40, 3.68, 'Waste pipe for baths and sinks, and small heating mains.'],
  ['2', '2', 60.3, 50, 3.91, 'Soil and waste stacks in small buildings, and the workhorse size for commercial heating branches.'],
  ['2-1/2', '2-1-2', 73.0, 65, 5.16, 'An awkward size, stocked less widely than those either side of it; most designs step from 2 to 3.'],
  ['3', '3', 88.9, 80, 5.49, 'Soil stacks, larger heating mains and fire services in small buildings.'],
  ['4', '4', 114.3, 100, 6.02, 'Main soil stacks and building drains. The size most people picture when they think of a drain pipe.'],
  ['5', '5', 141.3, 125, 6.55, 'Uncommon in buildings; found in process plant and fire mains.'],
  ['6', '6', 168.3, 150, 7.11, 'Building mains, sprinkler risers and site drainage.'],
  ['8', '8', 219.1, 200, 8.18, 'Distribution mains and industrial process lines.'],
  ['10', '10', 273.0, 250, 9.27, 'Large distribution and process piping.'],
  ['12', '12', 323.8, 300, 10.31, 'The last size where the NPS number is still smaller than the outside diameter — 12 inch pipe is 12.75 inches across.'],
  ['14', '14', 355.6, 350, 11.13, 'The first size where NPS equals the outside diameter exactly. From here the label finally is a measurement.'],
  ['16', '16', 406.4, 400, 12.70, 'Large process and transmission piping, with the NPS number equal to the outside diameter in inches.'],
  ['18', '18', 457.2, 450, 14.27, 'Transmission and large industrial mains.'],
  ['20', '20', 508.0, 500, 15.09, 'Large-diameter transmission piping.'],
  ['24', '24', 610.0, 600, 17.48, 'The largest size in common schedule tables. NPS 24 is 24 inches across the outside, to within a fraction of a millimetre.'],
];

const npsNumber = (label) => {
  const parts = label.split('-');
  let v = 0;
  for (const p of parts) {
    if (p.includes('/')) { const [a, b] = p.split('/').map(Number); v += a / b; } else v += Number(p);
  }
  return v;
};

// Where NPS becomes the outside diameter, this must hold exactly. If a row is
// ever edited so it does not, that is a data error rather than a curiosity.
{
  const bad = [];
  for (const [label, , od] of PIPES) {
    const n = npsNumber(label);
    if (n >= 14 && Math.abs(od / IN - n) > 0.02) bad.push(`NPS ${label}: OD ${od} mm is ${(od / IN).toFixed(3)} in, but NPS ${n} and above must equal the OD`);
    if (n < 14 && Math.abs(od / IN - n) < 0.02) bad.push(`NPS ${label}: OD equals the NPS number, which should only happen from NPS 14 up`);
  }
  if (bad.length) {
    console.error('\n✗ pipe table breaks the NPS/OD rule:');
    for (const b of bad) console.error('    ' + b);
    process.exitCode = 1;
  }
}

const f1 = (v) => v.toFixed(1);
const f2 = (v) => v.toFixed(2);
const f3 = (v) => v.toFixed(3);

export default async function () {
  const pages = [];

  const rows = PIPES.map(([label, id, od, dn, wall, use]) => ({
    label, id, od, dn, wall, use,
    nps: npsNumber(label),
    // Rounded here rather than at each use: every other reader of this puts
    // it through f1(), and the one that did not printed 9.219999999999999.
    idmm: Math.round((od - 2 * wall) * 100) / 100,
    isMeasurement: npsNumber(label) >= 14,
  }));

  for (const r of rows) {
    const near = rows.filter((x) => x.id !== r.id && Math.abs(Math.log(x.od / r.od)) < 0.8).slice(0, 8);
    const ratio = r.od / IN / r.nps;

    const FAQ = faq([
      { q: `What is the outside diameter of ${r.label} inch pipe?`,
        a: `<strong>${r.od} mm</strong>, or ${f3(r.od / IN)} inches. ${r.isMeasurement ? 'At this size the NPS number is the outside diameter, exactly.' : `Note that this is <strong>not</strong> ${r.nps} inches — NPS ${r.label} is a label, not a measurement, and the pipe is ${((ratio - 1) * 100).toFixed(0)}% larger across than its name.`}` },
      { q: `What is the DN equivalent of NPS ${r.label}?`,
        a: `<strong>DN ${r.dn}</strong>. DN is the metric designation and is just as nominal — DN ${r.dn} pipe is also ${r.od} mm across, not ${r.dn}. The two systems label the same pipe.` },
      { q: `What is the inside diameter of ${r.label} inch schedule 40 pipe?`,
        a: `About <strong>${f1(r.idmm)} mm</strong> (${f3(r.idmm / IN)} in), from an outside diameter of ${r.od} mm and a ${r.wall} mm wall. Inside diameter changes with the schedule; <strong>outside diameter does not</strong>, which is why fittings are sized on it.` },
      { q: `Why is NPS ${r.label} not ${r.nps} inches?`,
        a: r.isMeasurement
          ? `The name matches the size from NPS 14 upward the number is the outside diameter in inches — the scale becomes a measurement at exactly this point.`
          : `Because the name is inherited. NPS came from wrought-iron pipe whose much thicker walls gave roughly this bore, and the label was kept when the pipe changed, because the threads and fittings could not change with it. Below NPS 14 the number matches neither the outside nor the inside diameter of modern pipe.` },
    ]);

    pages.push({
      path: `/pipe/${r.id}/`,
      title: (() => {
        const base = `${r.label}″ Pipe Size — ${r.od} mm OD, ${Math.round((r.od / 25.4) * 100) / 100}″, DN${r.dn}`;
        // The inside diameter is the number people are usually after, and it
        // is the one the nominal size does not give them.
        const full = r.idmm ? `${base}, ${r.idmm} mm ID` : base;
        return full.length <= 65 ? full : base;
      })(),
      desc: `NPS ${r.label} pipe has an outside diameter of ${r.od} mm (${f3(r.od / IN)} in) and is DN${r.dn}. Schedule 40 bore is ${f1(r.idmm)} mm. Why the name is not the size.`,
      h1: `${r.label} inch pipe size`,
      crumbs: [{ name: 'Pipe sizes', path: '/pipe/' }, { name: `NPS ${r.label}`, path: `/pipe/${r.id}/` }],
      jsonld: [FAQ.schema],
      body: `<p class="big" style="font-size:1.6rem;margin:.3em 0"><strong>${r.od} mm outside diameter</strong></p>
<p class="muted">NPS ${r.label} · DN${r.dn} · ${f3(r.od / IN)} in OD · ${f1(r.idmm)} mm bore in schedule 40</p>

<h2>What this pipe is for</h2>
<p>${r.use}</p>

<h2>${r.isMeasurement ? 'Here the number is the size' : 'The name is not the size'}</h2>
${r.isMeasurement
        ? `<p>NPS ${r.label} pipe is <strong>${f3(r.od / IN)} inches across the outside</strong> — the NPS number exactly. From NPS 14 upward the designation finally becomes a measurement, which it is not at any smaller size.</p>`
        : `<p>NPS ${r.label} pipe is <strong>${f3(r.od / IN)} inches across the outside</strong>, not ${r.nps}. The name is ${((ratio - 1) * 100).toFixed(0)}% under the actual outside diameter, and it does not match the bore either — the schedule 40 inside diameter is ${f3(r.idmm / IN)} inches.</p>
<p>The label is inherited from wrought-iron pipe, whose much heavier walls gave roughly this bore at this outside diameter. When pipe walls got thinner the outside diameter had to stay put, because the threads and fittings were already standardised on it — so the name froze while the thing it described moved.</p>`}

<h2>The numbers</h2>
<table><tbody>
<tr><td>NPS</td><td><strong>${r.label}</strong></td></tr>
<tr><td>DN (metric designation)</td><td>${r.dn}</td></tr>
<tr><td>Outside diameter</td><td><strong>${r.od} mm</strong> · ${f3(r.od / IN)} in</td></tr>
<tr><td>Wall, schedule 40</td><td>${r.wall} mm</td></tr>
<tr><td>Bore, schedule 40</td><td>${f1(r.idmm)} mm · ${f3(r.idmm / IN)} in</td></tr>
<tr><td>Name against reality</td><td>${r.isMeasurement ? 'the NPS number is the OD' : `OD is ${f2(ratio)}× the NPS number`}</td></tr>
</tbody></table>
<p><strong>Outside diameter is the number that matters.</strong> It is fixed for a given NPS regardless of wall thickness, which is what lets a fitting made for schedule 10 thread onto schedule 80. The bore changes with the schedule; the outside never does.</p>

<h2>Nearby sizes</h2>
<table><thead><tr><th>NPS</th><th>DN</th><th>OD</th><th>Sch 40 bore</th></tr></thead><tbody>
${[...near, r].sort((a, b) => a.od - b.od).map((x) => `<tr${x.id === r.id ? ' style="font-weight:600"' : ''}><td>${x.id === r.id ? x.label : `<a href="/pipe/${x.id}/">${esc(x.label)}</a>`}</td><td>${x.dn}</td><td>${x.od} mm</td><td>${f1(x.idmm)} mm</td></tr>`).join('')}
</tbody></table>

${FAQ.html}

<p><a href="/pipe/">All pipe sizes</a> · <a href="/thread/">Metric threads</a> · <a href="/convert/">Unit converters</a></p>`,
    });
  }

  const half = rows.find((r) => r.id === '1-2');
  const twelve = rows.find((r) => r.id === '12');
  const fourteen = rows.find((r) => r.id === '14');

  pages.push({
    path: '/pipe/',
    title: 'Pipe Size Chart — NPS, DN and Actual Outside Diameter | Toolman',
    desc: `A "1/2 inch" pipe is ${half.od} mm across — ${f3(half.od / IN)} inches, nearly double its name. Every NPS size with its DN equivalent, real outside diameter and schedule 40 bore.`,
    h1: 'Pipe sizes',
    crumbs: [{ name: 'Pipe sizes', path: '/pipe/' }],
    body: `<p class="muted">${rows.length} pipe sizes with the NPS label, the DN equivalent, and the diameter the pipe actually is.</p>

<h2>A half-inch pipe is 0.84 inches across</h2>
<p>NPS is a label, not a measurement. <strong>NPS ${half.label} pipe has an outside diameter of ${half.od} mm — ${f3(half.od / IN)} inches</strong>, nearly double the name, and a bore of ${f1(half.idmm)} mm in schedule 40. The number matches neither.</p>
<p>The reason is historical and the same shape as a 2×4. NPS came from wrought-iron pipe whose much thicker walls gave roughly a half-inch bore at that outside diameter. When walls got thinner the outside diameter had to stay fixed, because threads and fittings were already standardised on it — so the label froze while the pipe behind it changed.</p>

<h2>Above NPS 14 the number becomes real</h2>
<p>This is the part almost nobody knows. <strong>From NPS ${fourteen.label} upward, the NPS number is the outside diameter in inches, exactly.</strong> NPS ${fourteen.label} pipe is ${f3(fourteen.od / IN)} inches across; NPS ${twelve.label}, one size down, is ${f3(twelve.od / IN)}. The scale changes from a name to a measurement between those two sizes and nothing on a chart marks the transition.</p>

<h2>DN is just as nominal</h2>
<p>The metric designation is <strong>DN</strong>, and it is a translation of the same labels rather than a fix for them. DN ${half.dn} is NPS ${half.label} and is still ${half.od} mm across, not ${half.dn}. Where a drawing gives DN, it is naming the same pipe by a different convention — not measuring it.</p>

<h2>The full chart</h2>
<table><thead><tr><th>NPS</th><th>DN</th><th>OD (mm)</th><th>OD (in)</th><th>Sch 40 wall</th><th>Sch 40 bore</th></tr></thead><tbody>
${rows.map((r) => `<tr${r.isMeasurement ? ' style="font-weight:600"' : ''}><td><a href="/pipe/${r.id}/">${esc(r.label)}</a></td><td>${r.dn}</td><td>${r.od}</td><td>${f3(r.od / IN)}</td><td>${r.wall} mm</td><td>${f1(r.idmm)} mm</td></tr>`).join('')}
</tbody></table>
<p class="muted">Bold rows are the sizes where NPS equals the outside diameter.</p>

<h2>Outside diameter is what fittings are made for</h2>
<p>A schedule number sets the wall thickness, and therefore the bore, for a given NPS. <strong>The outside diameter does not change with it.</strong> That is the whole point of the system: a fitting cut for NPS 2 threads onto schedule 10, 40 or 80 pipe alike, because they are all ${rows.find((r) => r.id === '2').od} mm on the outside and differ only inside.</p>
<p>So when a size is being checked against a fitting, measure the outside. When it is being checked against a flow rate, the bore is the number, and the schedule has to be known before it can be looked up.</p>

<p><a href="/thread/">Metric threads</a> · <a href="/lumber/">Lumber sizes</a> — the same nominal-versus-actual problem in timber. <a href="/nominal/">Nominal sizes in six trades</a> — pipe is the worst of them. <a href="/convert/">Unit converters</a></p>`,
  });

  return pages;
}
