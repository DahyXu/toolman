import { esc, faq } from '../layout.mjs';

// Two grit scales are in use and they agree until they do not. Below about 180
// a P-grade and a CAMI number describe roughly the same paper; above it they
// separate, and by the fine end they are a whole step apart — **P400 is about
// CAMI 320**, so "400 grit" names two different papers depending on which side
// of the Atlantic the packet came from.
//
// The anchor here is the particle size, because that is what is standardised:
// FEPA fixes an average grain diameter in micrometres for every P number, and
// those are the figures below. The CAMI equivalents are approximate by nature —
// the two systems grade differently, not just differently numbered — so they are
// given as "about" and never as a conversion.

// [P grade, average grain µm, approximate CAMI, use]
const GRITS = [
  [40, 425, 36, 'Stripping paint and levelling rough timber. It removes material fast and leaves scratches that take three finer grits to remove, so it is a starting point rather than a choice.'],
  [60, 269, 60, 'Heavy shaping and taking off old finish. Still coarse enough to see the scratch pattern from across a room.'],
  [80, 201, 80, 'The usual first grit on bare timber. Flattens saw marks and planer ripple without cutting so deep that the next grit cannot catch up.'],
  [100, 162, 100, 'General sanding on softwood, and the point at which the surface starts to look intentional rather than attacked.'],
  [120, 125, 120, 'The workhorse grit for wood before finishing. Many projects go 80, 120, 180 and stop there.'],
  [150, 100, 150, 'Between the shaping grits and the finishing ones. Also the usual grit for smoothing filler.'],
  [180, 82, 180, 'The last grit where P and CAMI still mean nearly the same thing. Beyond here the two scales separate and the numbers stop being comparable.'],
  [220, 68, 220, 'The last grit most woodwork needs before paint or stain, and the point where the two scales still agree closely enough to substitute one for the other without noticing. Standard practice on softwood stops here.'],
  [240, 58.5, 220, 'The first grit of the finishing range rather than the preparation range, and the first where the two scales visibly part company: P240 falls between CAMI 220 and 240 and matches neither. On hardwood it is often the last grit before oil; on softwood it is already fine enough to close the grain and make stain patchy.'],
  [280, 52.2, 240, 'Fine finishing on hardwood, and between coats of varnish. P280 is about CAMI 240 — already most of a step apart.'],
  [320, 46.2, 280, 'De-nibbing between coats. A P320 packet and a 320 packet are not the same paper: P320 is nearer CAMI 280.'],
  [400, 35, 320, 'The clearest case of the mismatch. **P400 is about CAMI 320**, a full step coarser than the number suggests to an American reader, and this is the grit where people most often notice something is wrong.'],
  [500, 30.2, 360, 'Fine finishing and light wet sanding. Rarely stocked outside automotive work.'],
  [600, 25.8, 400, 'Wet sanding paint and polishing metal. P600 is about CAMI 400 — the gap is now a whole grade.'],
  [800, 21.8, 500, 'Between coats on a high-gloss finish, and the start of the polishing range rather than the sanding one.'],
  [1000, 18.3, 600, 'Wet sanding clear coat before compounding. Scratches are no longer visible individually, only as haze.'],
  [1200, 15.3, 800, 'Removing orange peel from paint. Beyond here the paper is polishing rather than removing.'],
  [1500, 12.6, 1000, 'Final wet sanding before machine polishing on automotive paint.'],
  [2000, 10.3, 1200, 'Refining a polished surface. At ten micrometres the abrasive is finer than most dust in the air, which is why cleanliness starts to matter more than technique.'],
  [2500, 8.4, 1500, 'The fine end of what is generally sold. Used on lacquer and plastics before a final polish.'],
];

const f1 = (v) => (Number.isInteger(v) ? String(v) : v.toFixed(1));

export default async function () {
  const pages = [];
  const rows = GRITS.map(([p, um, cami, use]) => ({ p, um, cami, use, id: `p${p}` }));

  for (const r of rows) {
    const near = rows.filter((x) => x.p !== r.p && Math.abs(Math.log(x.p / r.p)) < 0.75);
    const coarser = rows.filter((x) => x.p < r.p).slice(-1)[0];
    const finer = rows.filter((x) => x.p > r.p)[0];
    const gap = r.p / r.cami;

    const FAQ = faq([
      { q: `Is P${r.p} the same as ${r.p} grit?`,
        a: gap > 1.12
          ? `<strong>No.</strong> P${r.p} is roughly <strong>CAMI ${r.cami}</strong> — the American ${r.p} grit is finer than the European P${r.p}. The two scales agree up to about 180 and separate above it, so at this end a packet marked ${r.p} and a packet marked P${r.p} are genuinely different papers.`
          : `Close enough to treat as the same. Below about P180 the European and American scales agree; the divergence starts above it.` },
      { q: `What grain size is P${r.p}?`,
        a: `An average grain of <strong>${f1(r.um)} µm</strong> — ${(r.um / 1000).toFixed(3)} mm. That figure is what the P number is defined by, which is why it is the reliable way to compare across scales.` },
      { q: `What is P${r.p} used for?`, a: r.use.replace(/\*\*/g, '') },
      coarser && finer
        ? { q: `What comes before and after P${r.p}?`,
            a: `Coming up from coarse, <strong>P${coarser.p}</strong> (${f1(coarser.um)} µm) and then this; the next step finer is <strong>P${finer.p}</strong> at ${f1(finer.um)} µm. Skipping more than one step leaves scratches the finer paper cannot remove — the usual cause of a surface that looks fine dry and terrible once finish goes on.` }
        : { q: `Is P${r.p} at the end of the range?`,
            a: coarser ? 'This grade is the finest generally stocked.' : 'This grade is the coarsest in common use.' },
    ]);

    pages.push({
      path: `/sandpaper/${r.id}/`,
      title: `P${r.p} Sandpaper — ${f1(r.um)} µm Grain, About ${r.cami} Grit CAMI | Toolman`,
      desc: `P${r.p} sandpaper has an average grain of ${f1(r.um)} µm and corresponds to roughly ${r.cami} grit on the American CAMI scale. What it is for, and why the two numbers differ.`,
      h1: `P${r.p} sandpaper`,
      crumbs: [{ name: 'Sandpaper grit', path: '/sandpaper/' }, { name: `P${r.p}`, path: `/sandpaper/${r.id}/` }],
      jsonld: [FAQ.schema],
      body: `<p class="big" style="font-size:1.6rem;margin:.3em 0"><strong>${f1(r.um)} µm grain</strong></p>
<p class="muted">P${r.p} (FEPA) · about ${r.cami} grit (CAMI) · ${(r.um / 1000).toFixed(3)} mm average particle</p>

<h2>What P${r.p} is for</h2>
<p>${r.use.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')}</p>

<h2>The two scales</h2>
<table><tbody>
<tr><td>FEPA (European)</td><td><strong>P${r.p}</strong></td></tr>
<tr><td>CAMI (American)</td><td>about ${r.cami}</td></tr>
<tr><td>Average grain</td><td>${f1(r.um)} µm</td></tr>
<tr><td>Scales agree here?</td><td>${gap > 1.12 ? `<strong>No</strong> — P${r.p} is about ${((gap - 1) * 100).toFixed(0)}% coarser than a CAMI ${r.p}` : 'Yes, near enough to substitute'}</td></tr>
</tbody></table>
${gap > 1.12 ? `<p>A packet marked <strong>${r.p}</strong> in the United States is finer than one marked <strong>P${r.p}</strong> in Europe. The P prefix is the tell, and it is easy to miss on a label — which is why a finishing schedule copied from an American source and followed with European paper comes out coarser than intended at every step.</p>` : ''}

<h2>Nearby grits</h2>
<table><thead><tr><th>FEPA</th><th>CAMI</th><th>Grain</th><th>Typically</th></tr></thead><tbody>
${[...near, r].sort((a, b) => a.p - b.p).map((x) => `<tr${x.p === r.p ? ' style="font-weight:600"' : ''}><td>${x.p === r.p ? `P${x.p}` : `<a href="/sandpaper/${x.id}/">P${x.p}</a>`}</td><td>${x.cami}</td><td>${f1(x.um)} µm</td><td class="muted">${esc(x.use.replace(/\*\*/g, '').split('.')[0])}</td></tr>`).join('')}
</tbody></table>

${FAQ.html}

<p><a href="/sandpaper/">The full grit chart</a> · <a href="/convert/">Unit converters</a></p>`,
    });
  }

  const p400 = rows.find((r) => r.p === 400);
  const p180 = rows.find((r) => r.p === 180);

  pages.push({
    path: '/sandpaper/',
    title: 'Sandpaper Grit Chart — FEPA P Grades, CAMI Grit and Grain Size | Toolman',
    desc: `P400 sandpaper is about 320 grit on the American scale. The two systems agree to P180 and separate above it — full chart with the grain size in micrometres, which is the figure that does not lie.`,
    h1: 'Sandpaper grit',
    crumbs: [{ name: 'Sandpaper grit', path: '/sandpaper/' }],
    body: `<p class="muted">${rows.length} grits with the European P grade, the approximate American equivalent, and the grain size that defines both.</p>

<h2>"400 grit" is two different papers</h2>
<p>Two scales are in use. <strong>FEPA</strong> numbers carry a P prefix and are the European standard; <strong>CAMI</strong> numbers have no prefix and are American. Up to about ${p180.p} they agree closely enough to ignore. Above that they separate, and by the fine end they are a full step apart: <strong>P${p400.p} is roughly CAMI ${p400.cami}</strong>.</p>
<p>The consequence is practical. A finishing schedule written in an American book — 220, 320, 400 — followed with European paper gives a coarser result at every step than the author intended, and the surface shows it under finish. The P is the only thing on the packet that distinguishes them, and it is easy to miss.</p>

<h2>The grain size is the honest number</h2>
<p>Both scales are defined by an average particle diameter, and that figure is comparable across everything. P${p400.p} is ${f1(p400.um)} µm whoever made it. Where a chart and a packet disagree, the micrometre figure is the one to trust.</p>

<h2>The full chart</h2>
<table><thead><tr><th>FEPA</th><th>CAMI</th><th>Average grain</th><th>Agree?</th><th>Typically used for</th></tr></thead><tbody>
${rows.map((r) => {
      const gap = r.p / r.cami;
      return `<tr><td><a href="/sandpaper/${r.id}/">P${r.p}</a></td><td>${r.cami}</td><td>${f1(r.um)} µm</td><td>${gap > 1.12 ? '<span class="muted">no</span>' : 'yes'}</td><td class="muted">${esc(r.use.replace(/\*\*/g, '').split('.')[0])}</td></tr>`;
    }).join('')}
</tbody></table>

<h2>Do not skip more than one step</h2>
<p>Each grit exists to remove the scratches left by the one before it. Jump from 80 straight to 220 and the finer paper polishes the coarse scratches rather than removing them — the surface feels smooth, looks acceptable dry, and shows every mark once finish goes on and the grain darkens. The usual sequence doubles roughly each time: 80, 120, 180, 220, and stop unless the finish needs more.</p>
<p>Going too fine has its own failure. Above about P220 on softwood the grain closes and stain stops penetrating evenly, which produces a blotchy result that no amount of further sanding fixes.</p>

<p><a href="/lumber/">Lumber sizes</a> · <a href="/convert/">Unit converters</a></p>`,
  });

  return pages;
}
