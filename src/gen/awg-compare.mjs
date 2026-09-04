import { esc, faq } from '../layout.mjs';
import { AWG_ROWS as ROWS } from './wire-gauge.mjs';

// "12 gauge vs 14 gauge wire" has no Google answer widget and the result
// ranking first is a four-year-old Reddit thread — the same shape as the tin
// and the grams-to-cups questions. What people are weighing has an arithmetic
// answer: over a long run the thinner wire drops more voltage, and that is the
// reason to upsize when the ampacity table already says either would do.
//
// Ampacity is where this stops being arithmetic. The current a circuit may
// carry is set by code, insulation, ambient temperature and how many
// conductors share a raceway, so the NEC figures here are quoted as what they
// are and the pages say plainly that the breaker is not this site's call.

const SYSTEM_V = 120;
const DROP_LIMIT = 0.03; // the 3% branch-circuit figure in NEC 210.19(A) note 4
const RUNS_M = [10, 20, 30, 50];

const f = (v, d = 2) => Number(v.toFixed(d)).toString();

// Round trip: the current goes out along the conductor and back along the
// neutral, so the resistance in the loop is twice the one-way length.
const dropVolts = (ohmPerKm, metres, amps) => 2 * (metres / 1000) * ohmPerKm * amps;

export default function awgCompare() {
  const pages = [];
  const idx = new Map(ROWS.map((r, i) => [r.n, i]));

  for (let i = 0; i < ROWS.length; i++) {
    for (let j = i + 1; j < ROWS.length; j++) {
      const A = ROWS[i];
      const B = ROWS[j];
      // Only neighbours on the scale. Nobody chooses between 4/0 and 30 AWG.
      if (Math.abs(idx.get(A.n) - idx.get(B.n)) > 2) continue;
      // Both must be building-wire gauges. "12 or 14" is a question about a
      // circuit and voltage drop answers it; "30 or 32" is a question about
      // handling and soldering, and framing it as voltage drop produced a
      // maximum run of zero metres at a current that would melt the wire.
      if (!A.amps || !B.amps) continue;

      // AWG runs backwards: the smaller number is the thicker wire.
      const thick = A.n < B.n ? A : B;
      const thin = A.n < B.n ? B : A;
      const areaRatio = thick.areaMm2 / thin.areaMm2;
      const slug = `${A.slug}-vs-${B.slug}`;

      // The current both are rated for, where both have a rating — the case in
      // which the choice is about voltage drop rather than about the breaker.
      const shared = thick.amps && thin.amps ? Math.min(thick.amps, thin.amps) : null;
      const testAmps = shared || 10;

      // Assert what the page claims.
      if (thick.areaMm2 <= thin.areaMm2) {
        console.error(`\n✗ awg ${slug}: calls ${thick.label} the thicker wire but its area is not larger`);
        process.exitCode = 1;
      }
      if (thick.ohmKmCu >= thin.ohmKmCu) {
        console.error(`\n✗ awg ${slug}: thicker wire ${thick.label} has the higher resistance`);
        process.exitCode = 1;
      }
      {
        // Resistance must follow from the area and the resistivity, not from a
        // table someone typed in.
        const expected = 1.724e-8 / (thick.areaMm2 / 1e6) * 1000;
        if (Math.abs(expected - thick.ohmKmCu) > 1e-6) {
          console.error(`\n✗ awg ${slug}: ${thick.label} resistance ${f(thick.ohmKmCu, 4)} does not follow from its area`);
          process.exitCode = 1;
        }
      }
      {
        // The drop over a run has to be the loop resistance times the current.
        const v = dropVolts(thin.ohmKmCu, 30, testAmps);
        const byOhmsLaw = testAmps * (2 * 30 / 1000 * thin.ohmKmCu);
        if (Math.abs(v - byOhmsLaw) > 1e-9) {
          console.error(`\n✗ awg ${slug}: voltage drop ${f(v)} V is not I×R over the loop`);
          process.exitCode = 1;
        }
      }
      if (Math.abs(idx.get(thin.n) - idx.get(thick.n)) === 0) {
        console.error(`\n✗ awg ${slug}: a gauge paired with itself`);
        process.exitCode = 1;
      }

      // The longest run each gauge carries inside the 3% figure.
      const maxRun = (r) => Math.floor((DROP_LIMIT * SYSTEM_V * 1000) / (2 * r.ohmKmCu * testAmps));
      const runThick = maxRun(thick);
      const runThin = maxRun(thin);
      if (runThick <= runThin) {
        console.error(`\n✗ awg ${slug}: the thicker wire reaches no further inside the 3% limit`);
        process.exitCode = 1;
      }

      const dropRows = RUNS_M.map((m) => {
        const vt = dropVolts(thick.ohmKmCu, m, testAmps);
        const vn = dropVolts(thin.ohmKmCu, m, testAmps);
        const over = (v) => (v / SYSTEM_V > DROP_LIMIT ? ' <span class="err">over 3%</span>' : '');
        return `<tr><td>${m} m (${Math.round(m * 3.281)} ft)</td><td>${f(vt)} V (${f((vt / SYSTEM_V) * 100, 1)}%)${over(vt)}</td><td>${f(vn)} V (${f((vn / SYSTEM_V) * 100, 1)}%)${over(vn)}</td></tr>`;
      }).join('\n');

      const ampLine = thick.amps && thin.amps
        ? `On the NEC 310.16 60 °C column, ${thick.label} AWG copper is rated ${thick.amps} A and ${thin.label} AWG is rated ${thin.amps} A. Those figures set the breaker, and they are not the whole story: insulation type, ambient temperature, how many conductors share a conduit and your local code all move them. Circuit design is an electrician's call, not a table's.`
        : thick.amps
          ? `${thick.label} AWG copper is rated ${thick.amps} A on the NEC 310.16 60 °C column. ${thin.label} AWG is not a building-wire gauge and has no single ampacity — what it carries depends entirely on insulation, bundling and how much temperature rise the application tolerates.`
          : `Neither of these is a building-wire gauge, so neither has a single ampacity figure. What they carry depends on insulation, bundling, ambient temperature and how warm the application lets them get.`;

      // The thicker wire's resistance as a reduction from the thinner one's.
      // Written the other way round it came out as "-59% less resistance",
      // which is not a quantity anything can have.
      const lessResistance = (1 - thick.ohmKmCu / thin.ohmKmCu) * 100;
      if (!(lessResistance > 0 && lessResistance < 100)) {
        console.error(`
✗ awg ${slug}: "${f(lessResistance, 0)}% less resistance" is not a possible reduction`);
        process.exitCode = 1;
      }

      const gaugeGap = Math.abs(A.n - B.n);
      const doublingLine = gaugeGap === 3
        ? `These two are three gauges apart, which is exactly the interval that doubles the cross-sectional area: ${f(areaRatio, 2)}×, and it comes out of the AWG exponent rather than being a coincidence.`
        : gaugeGap === 6
          ? `Six gauges apart is the interval that doubles the <em>diameter</em>, so the area is four times over: ${f(areaRatio, 2)}×.`
          : `${thick.label} AWG has ${f(areaRatio, 2)}× the copper of ${thin.label} AWG in cross-section, and carries current with ${f(lessResistance, 0)}% less resistance per metre.`;

      const FAQ = faq([
        {
          q: `What is the difference between ${A.label} AWG and ${B.label} AWG?`,
          a: `${thick.label} AWG is the thicker wire: ${f(thick.dmm, 3)} mm across against ${f(thin.dmm, 3)} mm, with ${f(areaRatio, 2)}× the cross-section. Thicker copper means lower resistance — ${f(thick.ohmKmCu, 2)} Ω/km against ${f(thin.ohmKmCu, 2)} Ω/km — so less voltage is lost along a run.`,
        },
        {
          q: `Can I use ${thick.label} AWG instead of ${thin.label} AWG?`,
          a: `Going thicker is electrically safe — ${thick.label} AWG has less resistance and runs cooler than ${thin.label} AWG at the same current. The practical limits are cost, stiffness and whether it fits the terminals. Going the other way, to thinner wire, is the direction that needs the ampacity table and an electrician.`,
        },
        {
          q: `How far can ${thin.label} AWG run at ${testAmps} A?`,
          a: `About <strong>${runThin} m (${Math.round(runThin * 3.281)} ft)</strong> before the drop reaches 3% of a ${SYSTEM_V} V supply. ${thick.label} AWG reaches ${runThick} m (${Math.round(runThick * 3.281)} ft) at the same current. The 3% figure is the informational note in NEC 210.19, not a hard rule, but it is the number most designs work to.`,
        },
      ]);

      const base = `${A.label} AWG vs ${B.label} AWG`;
      const title = (() => {
        const full = `${base} — Diameter, Resistance and Voltage Drop`;
        const mid = `${base} — Diameter and Voltage Drop`;
        return full.length <= 65 ? full : mid.length <= 65 ? mid : base;
      })();

      pages.push({
        path: `/awg/compare/${slug}/`,
        pairOf: [A.slug, B.slug],
        title,
        desc: `${thick.label} AWG is ${f(thick.dmm, 3)} mm and ${thin.label} AWG is ${f(thin.dmm, 3)} mm — ${f(areaRatio, 2)}× the copper. Resistance, the voltage lost over a run at ${testAmps} A, and how far each reaches inside the 3% limit.`,
        h1: base,
        crumbs: [
          { name: 'Wire gauge', path: '/awg/' },
          { name: base, path: `/awg/compare/${slug}/` },
        ],
        jsonld: [FAQ.schema],
        body: `<table><thead><tr><th></th><th>${esc(A.label)} AWG</th><th>${esc(B.label)} AWG</th></tr></thead><tbody>
<tr><td>Diameter</td><td>${f(A.dmm, 3)} mm</td><td>${f(B.dmm, 3)} mm</td></tr>
<tr><td>Cross-section</td><td>${f(A.areaMm2, 2)} mm²</td><td>${f(B.areaMm2, 2)} mm²</td></tr>
<tr><td>Resistance (copper)</td><td>${f(A.ohmKmCu, 2)} Ω/km</td><td>${f(B.ohmKmCu, 2)} Ω/km</td></tr>
<tr><td>NEC 60 °C ampacity</td><td>${A.amps ? A.amps + ' A' : '—'}</td><td>${B.amps ? B.amps + ' A' : '—'}</td></tr>
</tbody></table>

<h2>Which is thicker</h2>
<p>${doublingLine} AWG numbers run backwards because the scale counts drawing passes: more passes, thinner wire, higher number.</p>

<h2>Voltage lost over a run at ${testAmps} A</h2>
<table><thead><tr><th>One-way run</th><th>${esc(thick.label)} AWG</th><th>${esc(thin.label)} AWG</th></tr></thead><tbody>
${dropRows}
</tbody></table>
<p>Figures are for a ${SYSTEM_V} V supply and count both conductors, because the current returns along the neutral. <strong>${thin.label} AWG stays inside 3% out to about ${runThin} m; ${thick.label} AWG reaches ${runThick} m.</strong> That gap is the usual reason to upsize a wire the ampacity table already allows.</p>

<h2>What each is rated to carry</h2>
<p>${ampLine}</p>

${FAQ.html}

%RELATED%<p><a href="/awg/${A.slug}/">${esc(A.label)} AWG in full</a> · <a href="/awg/${B.slug}/">${esc(B.label)} AWG in full</a> · <a href="/awg/compare/">All gauge comparisons</a> · <a href="/awg/">Wire gauge chart</a></p>`,
      });
    }
  }


  // Each page links the other pairs that share one of its two items. Done here
  // rather than inside the loop because a page built early cannot know about
  // pairs the loop has not reached. Without this every comparison had exactly
  // one inbound link, from its own hub, which puts it last in the crawl queue.
  const index = pages.filter((p) => p.pairOf);
  for (const p of index) {
    const [x, y] = p.pairOf;
    // Taking the first twenty every time gave two pages that share a side
    // almost the same list, which pushed the bakeware comparisons to 92%
    // vocabulary overlap. Rotating the start by this page's own position keeps
    // the links relevant and stops neighbours reading as copies.
    const pool = index.filter((q) => q !== p && (q.pairOf.includes(x) || q.pairOf.includes(y)));
    const off = index.indexOf(p) % Math.max(1, pool.length);
    const near = pool.length <= 12
      ? pool
      : Array.from({ length: 12 }, (_, k) => pool[(off + k) % pool.length]);
    const block = near.length
      ? `<h2>Related comparisons</h2>\n<ul class="linklist">\n${near.map((q) => `<li><a href="${q.path}">${esc(q.h1)}</a></li>`).join('')}\n</ul>\n\n`
      : '';
    p.body = p.body.replace('%RELATED%', block);
  }
  for (const p of pages) p.body = p.body.replace('%RELATED%', '');

  const links = pages.map((p) => `<li><a href="${p.path}">${esc(p.h1)}</a></li>`).join('\n');

  pages.push({
    path: '/awg/compare/',
    title: 'AWG Gauge Comparisons — Resistance and Voltage Drop by Pair',
    desc: `${pages.length} pairs of neighbouring wire gauges compared: diameter, cross-section, resistance per kilometre, and how much voltage each loses over a run before the 3% limit.`,
    h1: 'Wire gauge comparisons',
    crumbs: [
      { name: 'Wire gauge', path: '/awg/' },
      { name: 'Comparisons', path: '/awg/compare/' },
    ],
    body: `<p>Between two neighbouring gauges the ampacity table often allows either, and the thing that actually decides is how long the run is. Resistance rises as the wire thins, and the voltage lost along the way rises with it — which is why the answer to "12 or 14?" depends on a distance nobody mentions.</p>
<p>Each page gives the drop at four run lengths and the distance each gauge reaches before losing 3% of a ${SYSTEM_V} V supply.</p>
<h2>Where these numbers come from</h2>
<p>Diameter comes from the AWG definition, <code>d = 0.005 × 92^((36 − n)/39)</code> inches, checked against fifteen published figures on every build. Resistance uses the IACS annealed-copper value of 1.724×10⁻⁸ Ω·m, which is what wire tables in print reproduce. Ampacities are the NEC 310.16 60 °C copper column.</p>
<p><strong>Sizing a circuit is not arithmetic.</strong> Insulation type, ambient temperature, conductor count, breaker rating and local code all bear on what a wire may carry, and none of that is on these pages. They give the physics; the circuit is an electrician's decision.</p>
<h2>All ${pages.length} comparisons</h2>
<ul class="cols">
${links}
</ul>
<p><a href="/awg/">Full wire gauge chart</a></p>`,
  });

  return pages;
}
