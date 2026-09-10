import { esc, faq, ring } from '../layout.mjs';

// The useful content here is not the conversion — it is which pairs are close
// enough to swap and which are close enough to do damage. 3/4 inch is 19.05 mm
// and a 19 mm spanner is 0.05 mm away, so they are interchangeable in practice.
// 1/2 inch is 12.70 mm and the nearest metric is 13, which is 0.30 mm of slack:
// enough that a 13 mm socket on a 1/2 inch bolt bears on the corners rather than
// the flats and rounds them off. That is the single most common way a fastener
// is destroyed in a home garage, and it is entirely computable.
//
// Direction matters and the pages say which way round: a metric spanner larger
// than an imperial head rounds it; an imperial spanner smaller than a metric
// head simply will not go on.

const IN = 25.4;

const METRIC = [5.5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 21, 22, 24, 27, 30, 32, 36];

// Mutation testing moved 5.5 to 6.05 and the list kept building — out of
// order, next to a 6, with nothing to say so. A spanner list is a series: it
// ascends, and no two entries are the same size.
{
  const bad = [];
  for (let i = 1; i < METRIC.length; i++) {
    if (!(METRIC[i] > METRIC[i - 1])) bad.push(`${METRIC[i - 1]} mm is followed by ${METRIC[i]} mm`);
  }
  if (new Set(METRIC).size !== METRIC.length) bad.push(`${METRIC.length - new Set(METRIC).size} size(s) appear twice`);
  if (bad.length) {
    console.error(`
✗ spanner: the metric list is not a rising series:`);
    for (const b of bad.slice(0, 5)) console.error('    ' + b);
    process.exitCode = 1;
  }
}
const IMPERIAL = [[1, 4], [5, 16], [3, 8], [7, 16], [1, 2], [9, 16], [5, 8], [11, 16], [3, 4], [13, 16], [7, 8], [15, 16], [1, 1], [17, 16], [9, 8]];

// Which bolt each spanner turns, from the metric thread section. Two figures
// where DIN and ISO disagree on the head.
const FITS = {
  5.5: 'M3', 7: 'M4', 8: 'M5', 10: 'M6', 13: 'M8', 16: 'M10 (ISO 4017)', 17: 'M10 (DIN 933)',
  18: 'M12 (ISO)', 19: 'M12 (DIN)', 21: 'M14 (ISO)', 22: 'M14 (DIN)', 24: 'M16', 30: 'M20', 36: 'M24',
};

const impMm = (n, d) => (n / d) * IN;
const impLabel = (n, d) => (d === 1 ? `${n}″` : n > d ? `${Math.floor(n / d)}-${n % d}/${d}″` : `${n}/${d}″`);
const impSlug = (n, d) => (d === 1 ? `${n}in` : `${n}-${d}in`);

const f2 = (v) => v.toFixed(2);

export default async function () {
  const pages = [];

  const metric = METRIC.map((mm) => ({ kind: 'metric', mm, label: `${mm} mm`, id: `${String(mm).replace('.', '-')}mm`, fits: FITS[mm] || null }));
  const imperial = IMPERIAL.map(([n, d]) => ({ kind: 'imperial', mm: impMm(n, d), label: impLabel(n, d), id: impSlug(n, d), n, d, fits: null }));
  const rows = [...metric, ...imperial];

  const closest = (r, list) => list.reduce((a, b) => (Math.abs(b.mm - r.mm) < Math.abs(a.mm - r.mm) ? b : a));

  for (const r of rows) {
    const other = closest(r, r.kind === 'metric' ? imperial : metric);
    const gap = Math.abs(other.mm - r.mm);
    const swap = gap < 0.15;
    const risky = gap >= 0.25;
    const sameKind = rows.filter((x) => x.kind === r.kind && x.id !== r.id && Math.abs(x.mm - r.mm) <= 3.2);

    // Which way the damage runs. A tool larger than the head is what rounds it.
    const toolBigger = other.mm > r.mm;

    const FAQ = faq([
      { q: `What is ${r.label} in ${r.kind === 'metric' ? 'inches' : 'millimetres'}?`,
        a: r.kind === 'metric'
          ? `<strong>${f2(r.mm / IN)} inches</strong>. The nearest imperial spanner is ${other.label} at ${f2(other.mm)} mm, ${f2(gap)} mm ${other.mm > r.mm ? 'larger' : 'smaller'}.`
          : `<strong>${f2(r.mm)} mm</strong>. The nearest metric spanner is ${other.label} — ${f2(gap)} mm ${other.mm > r.mm ? 'larger' : 'smaller'}.` },
      { q: `Can I use ${other.label} instead of ${r.label}?`,
        a: swap
          ? `Yes. They are <strong>${f2(gap)} mm apart</strong>, which is inside the tolerance of the fastener itself — these two are interchangeable in practice and most mechanics never notice they own both.`
          : risky
            ? `<strong>Not safely.</strong> The gap is ${f2(gap)} mm. ${toolBigger ? `${other.label} is larger than ${r.label}, so it sits on the corners of the head instead of the flats and rounds them off — this is how fasteners are destroyed.` : `${other.label} is smaller than ${r.label} and simply will not go on.`}`
            : `Marginally. ${f2(gap)} mm is enough to feel loose on a tight fastener and enough to round a soft one. It will work on something that is not seized; it is not what you want on something that is.` },
      r.fits
        ? { q: `What bolt does a ${r.label} spanner fit?`,
            a: `A <strong>${r.fits}</strong> hex head. <a href="/thread/">The full metric thread chart</a> gives the tapping drill and clearance hole for it too.` }
        : { q: `Where is ${r.label} used?`,
            a: r.kind === 'metric'
              ? `This size sits between the standard hex head sizes rather than on one, so it turns up on proprietary fasteners, plumbing fittings and older machinery rather than on ordinary bolts.`
              : `Imperial spanner sizes are "across flats" measurements and are still standard on American vehicles, plumbing and older machinery everywhere.` },
    ]);

    pages.push({
      path: `/spanner/${r.id}/`,
      title: `${r.label} Spanner — ${r.kind === 'metric' ? `${f2(r.mm / IN)} in` : `${f2(r.mm)} mm`}, Nearest ${other.label} | Toolman`,
      desc: `A ${r.label} spanner is ${r.kind === 'metric' ? `${f2(r.mm / IN)} inches` : `${f2(r.mm)} mm`} across the flats. The nearest ${r.kind === 'metric' ? 'imperial' : 'metric'} size is ${other.label}, ${f2(gap)} mm away — ${swap ? 'close enough to substitute' : 'not close enough to be safe'}.`,
      h1: `${r.label} spanner`,
      crumbs: [{ name: 'Spanner sizes', path: '/spanner/' }, { name: r.label, path: `/spanner/${r.id}/` }],
      jsonld: [FAQ.schema],
      body: `<p class="big" style="font-size:1.6rem;margin:.3em 0"><strong>${f2(r.mm)} mm · ${f2(r.mm / IN)} in</strong></p>
<p class="muted">${r.label} across the flats${r.fits ? ` · fits a ${r.fits} hex head` : ''}</p>

<h2>The nearest ${r.kind === 'metric' ? 'imperial' : 'metric'} size</h2>
<p><strong>${other.label}</strong> is ${f2(other.mm)} mm — ${f2(gap)} mm ${other.mm > r.mm ? 'larger' : 'smaller'} than ${r.label}.</p>
${swap
        ? `<p>That is close enough to be interchangeable. ${f2(gap)} mm is well inside the manufacturing tolerance of the fastener, and the two will feel identical in use.</p>`
        : risky
          ? `<p><strong>That is not close enough.</strong> ${toolBigger
              ? `Putting ${other.label} on a ${r.label} head leaves ${f2(gap)} mm of slack, so the tool bears on the corners rather than the flats. On anything tight the corners round off, and once they do the fastener needs cutting out. This is the most common way a bolt is destroyed in a home garage.`
              : `${other.label} is smaller than the ${r.label} head, so it will not go on at all — which is the harmless failure of the two.`}</p>`
          : `<p>${f2(gap)} mm is a marginal fit: usable on a fastener that turns freely, and a poor idea on one that is seized or soft.</p>`}

<h2>The numbers</h2>
<table><tbody>
<tr><td>Across flats</td><td><strong>${f2(r.mm)} mm</strong> · ${f2(r.mm / IN)} in</td></tr>
<tr><td>Nearest ${r.kind === 'metric' ? 'imperial' : 'metric'}</td><td>${other.label} — ${f2(other.mm)} mm</td></tr>
<tr><td>Difference</td><td>${f2(gap)} mm${swap ? ' — interchangeable' : risky ? ' — not safe to substitute' : ' — marginal'}</td></tr>
${r.fits ? `<tr><td>Fits</td><td><a href="/thread/${r.fits.split(' ')[0].toLowerCase()}/">${r.fits}</a> hex head</td></tr>` : ''}
</tbody></table>

${sameKind.length ? `<h2>Nearby ${r.kind} sizes</h2>
<table><thead><tr><th>Size</th><th>mm</th><th>Nearest ${r.kind === 'metric' ? 'imperial' : 'metric'}</th><th>Gap</th></tr></thead><tbody>
${[...sameKind, r].sort((a, b) => a.mm - b.mm).map((x) => {
        const o = closest(x, x.kind === 'metric' ? imperial : metric);
        const g = Math.abs(o.mm - x.mm);
        return `<tr${x.id === r.id ? ' style="font-weight:600"' : ''}><td>${x.id === r.id ? x.label : `<a href="/spanner/${x.id}/">${x.label}</a>`}</td><td>${f2(x.mm)}</td><td>${o.label}</td><td>${f2(g)} mm${g < 0.15 ? ' <span class="muted">— swap</span>' : g >= 0.25 ? ' <span class="muted">— do not</span>' : ''}</td></tr>`;
      }).join('')}
</tbody></table>` : ''}

${FAQ.html}

<h2>More spanner sizes</h2>
<ul class="linklist">${ring(rows, r, 10).map((o) => `<li><a href="/spanner/${o.id}/">${esc(o.label || o.id)}</a></li>`).join('')}</ul>

<p><a href="/spanner/">All spanner sizes</a> · <a href="/thread/">Metric threads</a></p>`,
    });
  }

  const pairs = imperial.map((i) => {
    const m = closest(i, metric);
    return { i, m, gap: Math.abs(m.mm - i.mm) };
  }).sort((a, b) => a.gap - b.gap);
  const swappable = pairs.filter((p) => p.gap < 0.15);
  const dangerous = pairs.filter((p) => p.gap >= 0.25);

  pages.push({
    path: '/spanner/',
    title: 'Spanner Size Chart — Metric and Imperial, and Which Swap | Toolman',
    desc: '3/4 inch and 19 mm are 0.05 mm apart and interchangeable. 1/2 inch and 13 mm are 0.30 mm apart and will round a bolt head. Every size with its nearest counterpart.',
    h1: 'Spanner and socket sizes',
    crumbs: [{ name: 'Spanner sizes', path: '/spanner/' }],
    body: `<p class="muted">Metric and imperial spanner sizes across the flats, with the nearest size in the other system and whether it can safely be used.</p>

<h2>Four pairs are interchangeable. Several will destroy a bolt.</h2>
<p>Spanner sizes are measured across the flats, so comparing systems is just arithmetic — and the arithmetic decides whether reaching for the wrong drawer is fine or expensive.</p>
<p><strong>These are close enough to swap:</strong></p>
<table><thead><tr><th>Imperial</th><th>Metric</th><th>Difference</th></tr></thead><tbody>
${swappable.map((p) => `<tr><td><a href="/spanner/${p.i.id}/">${p.i.label}</a> (${f2(p.i.mm)} mm)</td><td><a href="/spanner/${p.m.id}/">${p.m.label}</a></td><td>${f2(p.gap)} mm</td></tr>`).join('')}
</tbody></table>
<p><strong>These are not:</strong></p>
<table><thead><tr><th>Imperial</th><th>Nearest metric</th><th>Difference</th><th>What happens</th></tr></thead><tbody>
${dangerous.map((p) => `<tr><td><a href="/spanner/${p.i.id}/">${p.i.label}</a> (${f2(p.i.mm)} mm)</td><td><a href="/spanner/${p.m.id}/">${p.m.label}</a></td><td>${f2(p.gap)} mm</td><td class="muted">${p.m.mm > p.i.mm ? 'Metric socket rounds the imperial head' : 'Imperial socket will not fit the metric head'}</td></tr>`).join('')}
</tbody></table>

<h2>Which way the damage runs</h2>
<p>The failure is asymmetric and worth getting straight. <strong>A spanner larger than the head is the dangerous one</strong>: it sits on the corners rather than the flats, and under load the corners deform. Once a head is rounded it needs an extractor or a cutting disc.</p>
<p>A spanner smaller than the head simply does not go on. That is the harmless failure — annoying, and it tells you immediately that you have the wrong tool, which the dangerous one does not.</p>
<p>The classic case is <strong>13 mm on a 1/2 inch bolt</strong>. The head is 12.70 mm and the socket is 13, so it goes on, feels almost right, and rounds the fastener on the first hard pull.</p>

<h2>Metric sizes</h2>
<table><thead><tr><th>Size</th><th>Inches</th><th>Nearest imperial</th><th>Gap</th><th>Fits</th></tr></thead><tbody>
${metric.map((m) => {
      const o = closest(m, imperial);
      const g = Math.abs(o.mm - m.mm);
      return `<tr><td><a href="/spanner/${m.id}/">${m.label}</a></td><td>${f2(m.mm / IN)}</td><td>${o.label}</td><td>${f2(g)} mm</td><td class="muted">${m.fits || '—'}</td></tr>`;
    }).join('')}
</tbody></table>

<h2>Imperial sizes</h2>
<table><thead><tr><th>Size</th><th>Millimetres</th><th>Nearest metric</th><th>Gap</th></tr></thead><tbody>
${imperial.map((i) => {
      const o = closest(i, metric);
      const g = Math.abs(o.mm - i.mm);
      return `<tr><td><a href="/spanner/${i.id}/">${esc(i.label)}</a></td><td>${f2(i.mm)}</td><td>${o.label}</td><td>${f2(g)} mm</td></tr>`;
    }).join('')}
</tbody></table>

<h2>Six points grip the flats. Twelve points sit on the corners.</h2>
<p>The same nominal size behaves differently depending on the tool. A six-point socket contacts the six flat faces of the head; a twelve-point contacts near the corners, which is where a hex head is weakest. Twelve points exist because they engage at every 30° instead of every 60°, which matters in a tight space and costs grip everywhere else.</p>
<p>That interacts directly with the gaps in the tables above. A near-miss pairing that a six-point tolerates will round the fastener in a twelve-point, because the small amount of slop lands on the corners rather than being spread across the faces. If a bolt is tight, rusted or has already been rounded once, six points is not a preference.</p>

<h2>Whitworth is not measured the way the others are</h2>
<p>Metric and AF sizes both name the distance across the flats: a 13 mm spanner fits a head measuring 13 mm across. <strong>Whitworth names the diameter of the bolt's shank instead</strong>, so a "¼ Whitworth" spanner fits a bolt with a quarter-inch shank, and the head it fits is about 0.45 inches across — nearly twice the number on the tool.</p>
<p>This is why a Whitworth set looks wrong next to an AF one and why a British motorcycle or tractor from before the 1970s defeats a modern socket set. British Standard Fine uses the same across-flats sizes as Whitworth for a given shank but a finer thread, and later Whitworth heads were reduced by one size, so two spanners marked the same fit different bolts depending on when they were made. Measure the head rather than trusting the marking.</p>

<h2>When you only have the wrong system</h2>
<p>Use the table above and take the pair with the smallest gap, then reach for a six-point ring spanner or socket rather than an open-ended one — an open jaw spreads under load and turns a small gap into a rounded head. Failing that, an adjustable wrench tightened hard onto the flats is safer than a loose socket, which is the opposite of most people's instinct.</p>
<p>If the fastener matters and the gap is above about a tenth of a millimetre, it is worth stopping. The cost of the right spanner is always less than the cost of extracting a rounded bolt.</p>

<p><a href="/thread/">Metric threads</a> — the tapping drill and clearance hole for the bolts these turn. <a href="/convert/">Unit converters</a></p>`,
  });

  return pages;
}
