import { esc, faq } from '../layout.mjs';

// Wood screw gauge is a straight line, which most charts do not say:
//
//     diameter in inches = 0.060 + 0.013 × gauge
//
// so a #8 is 0.164 in, 4.17 mm. That reproduces every published table to within
// the rounding those tables apply — checked against seven of them below.
//
// The fact worth the section, though, is not the diameter. It is that a screw
// joining two boards needs **two different holes**: a clearance hole in the top
// piece that the thread passes through without biting, and a pilot hole in the
// bottom piece for it to bite into. Drill a pilot hole in both and the thread
// grips the top board as well, which jacks the two apart instead of pulling
// them together — and the gap that appears is blamed on the clamp.

const IN = 25.4;
const diaIn = (gauge) => 0.06 + 0.013 * gauge;

// Published shank diameters, in millimetres. Sources round differently at the
// large end — #14 appears as both 6.2 and 6.3 — so the tolerance allows 0.2 mm.
const PUBLISHED = { 2: 2.2, 4: 2.8, 6: 3.5, 8: 4.2, 10: 4.8, 12: 5.5, 14: 6.3 };
{
  const bad = [];
  for (const [g, want] of Object.entries(PUBLISHED)) {
    const got = diaIn(+g) * IN;
    if (Math.abs(got - want) > 0.2) bad.push(`#${g}: formula ${got.toFixed(2)} mm, published ${want}`);
  }
  if (bad.length) {
    console.error('\n✗ screw gauge formula no longer matches the published tables:');
    for (const b of bad) console.error('    ' + b);
    process.exitCode = 1;
  }
}

// Drills a workshop actually has, in millimetres. Pilot and clearance figures
// are rounded to these rather than quoted to two decimals, because a hole is
// only ever the size of a bit you own.
// A 0.5 mm ladder rounded the softwood and hardwood pilots for #6 and #8 onto
// the same drill, so both pages said "2.5 mm softwood, 2.5 mm hardwood" while
// the prose explained that hardwood needs a larger hole. Real bit sets are
// finer than that in the sizes that matter, and the published pilot tables use
// 2.4, 2.8, 3.2 and 3.6 — which are 3/32, 7/64, 1/8 and 9/64 inch.
const DRILLS = [1.5, 1.6, 1.8, 2, 2.2, 2.4, 2.5, 2.8, 3, 3.2, 3.5, 3.6, 4, 4.2, 4.5, 5, 5.5, 6, 6.5, 7, 8];
const nearestDrill = (mm) => DRILLS.reduce((a, b) => (Math.abs(b - mm) < Math.abs(a - mm) ? b : a));

const USE = {
  2: 'Small hinges, catches and electrical faceplates. Snaps under any real load, so it is a fixing rather than a fastening.',
  4: 'Light hardware — cabinet hinges, drawer runners, small brackets.',
  6: 'The smallest size used structurally in cabinetwork. Common for hinges, handles and thin panel fixings.',
  8: 'The general-purpose woodworking screw. If a project does not specify a gauge, this is what it means — strong enough for carcass joints and small enough not to split a 20 mm board.',
  10: 'Heavier joinery, door hardware and anything taking a shear load. The step up from #8 when a joint is doing real work.',
  12: 'Structural fixings, gate hardware and heavy brackets. At 5.5 mm it needs a pilot hole in anything harder than pine.',
  14: 'Heavy structural work and timber framing, usually with a hex or square drive because a slot at this size strips before the screw is tight.',
};

const GAUGES = [2, 4, 6, 8, 10, 12, 14];
const LENGTHS_MM = [12, 16, 20, 25, 30, 40, 50, 60, 75, 100];

// Softwood needs about two thirds of the shank; hardwood about three quarters,
// because the fibres will not compress and the screw splits it otherwise.
const PILOT_SOFT = 0.67;
const PILOT_HARD = 0.77;

// The claim every page makes is that a hardwood pilot is larger than a softwood
// one. Rounding to available drills can collapse the two, which makes the page
// contradict its own prose — so assert it rather than hope.
{
  const bad = [];
  for (const g of GAUGES) {
    const mm = diaIn(g) * IN;
    const soft = nearestDrill(mm * PILOT_SOFT), hard = nearestDrill(mm * PILOT_HARD);
    if (!(hard > soft)) bad.push(`#${g}: softwood pilot ${soft} mm and hardwood ${hard} mm — the pages claim hardwood is larger`);
    if (!(nearestDrill(mm + 0.2) > hard)) bad.push(`#${g}: clearance ${nearestDrill(mm + 0.2)} mm is not larger than the hardwood pilot ${hard} mm`);
  }
  if (bad.length) {
    console.error('\n✗ screw pilot holes contradict the text:');
    for (const b of bad) console.error('    ' + b);
    process.exitCode = 1;
  }
}

const f1 = (v) => v.toFixed(1);
const f2 = (v) => v.toFixed(2);

export default async function () {
  const pages = [];

  const rows = GAUGES.map((g) => {
    const mm = diaIn(g) * IN;
    return {
      g, mm, in: diaIn(g),
      id: `${g}`,
      soft: nearestDrill(mm * PILOT_SOFT),
      hard: nearestDrill(mm * PILOT_HARD),
      clear: nearestDrill(mm + 0.2),
      use: USE[g],
    };
  });

  for (const r of rows) {
    const near = rows.filter((x) => x.g !== r.g && Math.abs(x.g - r.g) <= 4);
    const metricNear = [3, 3.5, 4, 4.5, 5, 5.5, 6, 6.5].reduce((a, b) => (Math.abs(b - r.mm) < Math.abs(a - r.mm) ? a = b : a), 3);

    const FAQ = faq([
      { q: `What diameter is a #${r.g} wood screw?`,
        a: `<strong>${f1(r.mm)} mm</strong> across the shank (${f2(r.in)} inches). Gauge is a straight line — diameter in inches is 0.060 + 0.013 × gauge — so #${r.g} works out at ${f2(r.in)}.` },
      { q: `What pilot hole for a #${r.g} screw?`,
        a: `<strong>${r.soft} mm in softwood, ${r.hard} mm in hardwood.</strong> The pilot is roughly two thirds of the shank in pine and three quarters in oak, because hardwood fibres will not compress and the board splits instead.` },
      { q: `What clearance hole for a #${r.g}?`,
        a: `<strong>${r.clear} mm</strong> — just over the shank, so the thread passes through without biting. This hole goes in the <em>top</em> board only. Drilling a pilot hole in both pieces is what makes a joint spring apart rather than pull together.` },
      { q: `What is a #${r.g} screw in metric?`,
        a: `Closest to a <strong>${metricNear} mm</strong> screw at ${f1(r.mm)} mm actual. Metric screws are sold by their real shank diameter, so the number means something — which gauge numbers do not.` },
    ]);

    pages.push({
      path: `/screw/${r.id}/`,
      title: `#${r.g} Wood Screw — ${f1(r.mm)} mm, ${r.soft} mm Pilot Hole | Toolman`,
      desc: `A #${r.g} wood screw is ${f1(r.mm)} mm across the shank. Pilot hole ${r.soft} mm in softwood and ${r.hard} mm in hardwood, clearance hole ${r.clear} mm.`,
      h1: `#${r.g} wood screw`,
      crumbs: [{ name: 'Screw sizes', path: '/screw/' }, { name: `#${r.g}`, path: `/screw/${r.id}/` }],
      jsonld: [FAQ.schema],
      body: `<p class="big" style="font-size:1.6rem;margin:.3em 0"><strong>${f1(r.mm)} mm shank</strong></p>
<p class="muted">#${r.g} gauge · ${f2(r.in)} in · pilot ${r.soft} mm softwood / ${r.hard} mm hardwood · clearance ${r.clear} mm</p>

<h2>What a #${r.g} is for</h2>
<p>${r.use}</p>

<h2>Two holes, not one</h2>
<p>A screw joining two boards needs different holes in each. The <strong>clearance hole goes in the top piece</strong> at ${r.clear} mm, wide enough that the thread passes straight through without gripping. The <strong>pilot hole goes in the bottom piece</strong> at ${r.soft} mm for softwood or ${r.hard} mm for hardwood, so the thread has something to bite.</p>
<p>Get this wrong and the failure is specific: drill a pilot-sized hole in both boards and the thread grips the top one too, so instead of pulling the pieces together the screw jacks them apart. The gap that opens is usually blamed on the clamping, and no amount of extra torque closes it.</p>
<table><thead><tr><th>Hole</th><th>Where</th><th>Size</th><th>Why</th></tr></thead><tbody>
<tr><td>Clearance</td><td>Top board</td><td><strong>${r.clear} mm</strong></td><td class="muted">Thread passes through freely</td></tr>
<tr><td>Pilot, softwood</td><td>Bottom board</td><td>${r.soft} mm</td><td class="muted">About two thirds of the shank</td></tr>
<tr><td>Pilot, hardwood</td><td>Bottom board</td><td>${r.hard} mm</td><td class="muted">About three quarters — hardwood splits</td></tr>
</tbody></table>

<h2>The numbers</h2>
<table><tbody>
<tr><td>Gauge</td><td><strong>#${r.g}</strong></td></tr>
<tr><td>Shank diameter</td><td>${f1(r.mm)} mm · ${f2(r.in)} in</td></tr>
<tr><td>Nearest metric screw</td><td>${metricNear} mm</td></tr>
<tr><td>Common lengths</td><td>${LENGTHS_MM.filter((l) => l >= r.mm * 4 && l <= r.mm * 18).join(', ')} mm</td></tr>
</tbody></table>
<p class="muted">A screw wants at least two thirds of its length in the receiving board. Longer than that adds nothing; shorter and the joint relies on the top board's threads, which are not meant to be carrying it.</p>

<h2>Nearby gauges</h2>
<table><thead><tr><th>Gauge</th><th>Shank</th><th>Pilot, soft</th><th>Pilot, hard</th><th>Clearance</th></tr></thead><tbody>
${[...near, r].sort((a, b) => a.g - b.g).map((x) => `<tr${x.g === r.g ? ' style="font-weight:600"' : ''}><td>${x.g === r.g ? `#${x.g}` : `<a href="/screw/${x.id}/">#${x.g}</a>`}</td><td>${f1(x.mm)} mm</td><td>${x.soft} mm</td><td>${x.hard} mm</td><td>${x.clear} mm</td></tr>`).join('')}
</tbody></table>

${FAQ.html}

<p><a href="/screw/">All screw gauges</a> · <a href="/thread/">Metric threads</a> · <a href="/lumber/">Lumber sizes</a></p>`,
    });
  }

  const g8 = rows.find((r) => r.g === 8);

  pages.push({
    path: '/screw/',
    title: 'Wood Screw Sizes — Gauge to mm, Pilot and Clearance Holes | Toolman',
    desc: `A #8 wood screw is ${f1(g8.mm)} mm across. Every gauge with its diameter, the pilot hole for softwood and hardwood, and the clearance hole — which goes in the other board.`,
    h1: 'Wood screw sizes',
    crumbs: [{ name: 'Screw sizes', path: '/screw/' }],
    body: `<p class="muted">${rows.length} screw gauges with their real diameter and the two different holes each one needs.</p>

<h2>Gauge is a straight line</h2>
<p>Screw gauge looks arbitrary and is not. The shank diameter in inches is <strong>0.060 + 0.013 × gauge</strong>, so a #8 is ${f2(g8.in)} inches — ${f1(g8.mm)} mm. Every gauge on this page comes from that one expression, and it reproduces the published tables to within the rounding they apply.</p>
<p>Metric screws are sold by their actual diameter instead, which is why a 4 mm screw is 4 mm and a #8 is not 8 of anything.</p>

<h2>A joint needs two different holes</h2>
<p>This is the part that decides whether two boards pull together. The screw passes through the first board and bites into the second, so:</p>
<ul>
<li>The <strong>top board gets a clearance hole</strong> — slightly wider than the shank, so the thread slides through without gripping.</li>
<li>The <strong>bottom board gets a pilot hole</strong> — about two thirds of the shank in softwood, three quarters in hardwood, so the thread has material to cut into.</li>
</ul>
<p><strong>Drill a pilot hole in both and the screw jacks the boards apart.</strong> The thread grips the top piece as it turns, so instead of drawing the joint closed it pushes it open, and the gap gets blamed on the clamps. It is the most common reason a screwed joint will not close.</p>

<h2>The full chart</h2>
<table><thead><tr><th>Gauge</th><th>Shank</th><th>Inches</th><th>Pilot, softwood</th><th>Pilot, hardwood</th><th>Clearance</th></tr></thead><tbody>
${rows.map((r) => `<tr><td><a href="/screw/${r.id}/">#${r.g}</a></td><td>${f1(r.mm)} mm</td><td>${f2(r.in)}</td><td>${r.soft} mm</td><td>${r.hard} mm</td><td>${r.clear} mm</td></tr>`).join('')}
</tbody></table>

<h2>Why hardwood needs a bigger pilot</h2>
<p>Softwood fibres compress around a screw, so a pilot hole at two thirds of the shank leaves enough material for the thread to bite while letting the wood give. Hardwood does not give — it splits. So the pilot goes up to about three quarters of the shank, which sounds like it should weaken the joint and does not: the thread is still cutting into solid material, and a split board holds nothing at all.</p>
<p>Near an end or an edge, go a size larger again. That is where splitting starts, and where a pilot hole matters most.</p>

<p><a href="/thread/">Metric threads</a> — the machine-screw equivalent, with tapping drills. <a href="/lumber/">Lumber sizes</a> · <a href="/spanner/">Spanner sizes</a></p>`,
  });

  return pages;
}
