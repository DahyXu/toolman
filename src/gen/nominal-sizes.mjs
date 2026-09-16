import { faq } from '../layout.mjs';

// Every other section here answers one question for one trade. This page is the
// only one that reads across them, and it exists because the same discovery is
// waiting in six of them independently: the number a thing is sold under is not
// the number you get when you measure it, and each trade is wrong in its own
// way for its own historical reason.
//
// Separately those are footnotes. A joiner already knows a 2x4 is not two by
// four. Together they are the fact that the rule is general — that "nominal"
// across the whole hardware world means "a name that was once a measurement" —
// and that is the shape of thing people send to each other, which is what this
// site has never had. The section pages are answers; this one is an argument.
//
// The figures are not restated here loosely. Every measurement below is the one
// its own section page derives, and the ratios are computed rather than typed,
// so a number that drifts in one place fails the build rather than quietly
// disagreeing with the page it links to.

// Each case: what it is called, what it measures, and why the two parted. The
// `ratio` field is deliberately absent — it is computed from nominal and actual
// so that the headline "misses by 1.68×" can never disagree with the pair of
// numbers printed beside it.
const CASES = [
  {
    id: 'pipe',
    kind: 'drift',
    trade: 'Plumbing',
    sold: 'A 1/2 inch pipe',
    nominal: 0.5,
    actual: 0.839,
    unit: 'in',
    measured: 'outside diameter 21.3 mm (0.839 in)',
    // The pipe page derives this from the NPS table; the 21.3 mm is the value
    // that table carries, and 0.839 is that in inches.
    why: `NPS was a real measurement in the 1800s, when pipe was wrought iron with walls thick enough that a tube 21.3 mm across had roughly a half-inch bore. The pipe changed and the name did not, because the fittings could not change with it — a modern half-inch elbow still has to thread onto every half-inch pipe laid since. From NPS 14 upward the number finally means something exact: it is the outside diameter in inches.`,
    href: '/pipe/1-2/',
    anchor: 'What a 1/2 inch pipe actually measures',
  },
  {
    id: 'lumber',
    kind: 'drift',
    trade: 'Carpentry',
    sold: 'A 2x4',
    nominal: 2,
    actual: 1.5,
    unit: 'in',
    measured: '1.5 × 3.5 in',
    why: `The nominal size is the board before it was planed. Timber is sawn green and oversize, then dried and dressed on all four faces, and the half inch that disappears is sawdust. The rule is regular enough to do in your head: 1 inch nominal finishes at ¾, 2 to 6 inches lose ½, and 8 inches and up lose ¾ — which is why a 1x8 is 7¼ and not 7½.`,
    href: '/lumber/2x4/',
    anchor: 'The finished size of every nominal board',
  },
  {
    id: 'awg',
    kind: 'scale',
    trade: 'Electrical',
    sold: 'Wire gauge 36 against gauge 4/0',
    nominal: 36,
    actual: 0.005,
    unit: null,
    measured: '0.005 in against 0.46 in — the bigger number is 92× thinner',
    why: `The gauge is not a thickness at all, it is a count. Wire is drawn by pulling it through progressively smaller dies, and the gauge records how many passes it took, so a higher number means more passes and thinner wire. That single fact explains the two things that look arbitrary: why the numbers run backwards, and why the steps are uneven — each pass is a fixed ratio, not a fixed amount.`,
    href: '/awg/36/',
    anchor: 'Why wire gauge runs backwards',
  },
  {
    id: 'paper',
    kind: 'ambiguous',
    trade: 'Printing',
    sold: '80 lb paper',
    // Not nominal and actual: both are actual, of two different papers. Naming
    // them that way let them look like a measurement and its error, and the
    // page printed "1.83× larger" as though one were wrong.
    nominal: null,
    actual: null,
    gsmText: 118,
    gsmCover: 216,
    unit: 'gsm',
    measured: '118 gsm as text, 216 gsm as cover — 83% apart at the same number',
    why: `American basis weight is the weight of 500 sheets, but at that grade's own basis size, and the basis sizes are different: text is 25 × 38 inches, cover is 20 × 26. So the same 80 lb describes two papers you would never confuse by hand — one is a magazine page, the other is a business card. The number is real; it is the sheet it was weighed on that is unstated.`,
    href: '/paper-weight/80-lb-cover/',
    anchor: 'What 80 lb means in each grade',
  },
  {
    id: 'screen',
    kind: 'drift',
    trade: 'Displays',
    sold: 'A 21:9 ultrawide',
    nominal: 21 / 9,
    actual: 43 / 18,
    unit: null,
    measured: 'actually 43:18 — 2560 × 1080 and 3440 × 1440 are both wider than 21:9',
    why: `21:9 is a marketing round number for a shape that is not quite that. The panels sold under it are 43:18, which is 2.389 against 2.333 — close enough to letterbox a film without visible bars, far enough that a window sized by the ratio on the box comes out wrong. The diagonal has its own version of the problem: it is the panel, not the picture, and it says nothing about shape.`,
    href: '/screen-size/34-inch/',
    anchor: 'The real dimensions behind a screen size',
  },
  {
    id: 'shoe',
    kind: 'never-was',
    trade: 'Shoes',
    sold: 'Your size',
    nominal: null,
    actual: null,
    unit: null,
    measured: 'varies by a full size between two brands at the same number',
    why: `A shoe size is a length in principle and a brand's last in practice. Two makers can differ by a full size at the same nominal number, and the same maker differs between a running shoe and a boot, because the number describes the last the shoe was built on rather than the foot it was built for. Width is a separate scale that most brands do not print at all.`,
    href: '/shoe-size/',
    anchor: 'Shoe size conversions, and what they cannot tell you',
  },
];

// The headline claim of the pipe case is a ratio, and a ratio is the kind of
// thing that is retyped wrong. Compute it, and check the cases that have two
// comparable numbers against the figure the page is about to print.
const ratioOf = (c) => (c.nominal && c.actual ? c.actual / c.nominal : null);

{
  const bad = [];

  // Anchored to the section pages these link to, not to each other: a figure
  // copied wrong twice is still consistent with itself.
  const PUBLISHED = [
    ['pipe', 'actual', 0.839, 0.002],     // 21.3 mm in inches
    ['lumber', 'actual', 1.5, 0.001],     // 2 in nominal, dressed
    ['paper', 'gsmText', 118, 1],         // 80 lb text in gsm
    ['paper', 'gsmCover', 216, 1],        // 80 lb cover in gsm
  ];
  for (const [id, field, want, tol] of PUBLISHED) {
    const c = CASES.find((x) => x.id === id);
    if (!c) { bad.push(`${id} is missing from CASES`); continue; }
    if (typeof c[field] !== 'number') { bad.push(`${id} has no numeric ${field} to check`); continue; }
    if (Math.abs(c[field] - want) > tol) {
      bad.push(`${id}.${field}: this page says ${c[field]}, its section page says ${want}`);
    }
  }

  // The pipe case is the one the page opens on, and it is only worth opening on
  // if it really is the largest miss. If some other trade overtakes it, the
  // prose is wrong and should be rewritten rather than left to age.
  //
  // Only `drift` cases are comparable. Paper's two numbers are not a name
  // against a measurement, they are two different papers wearing one name, so
  // its 1.83 is a spread rather than an error and putting it in the same
  // ranking would make the page claim something it has not shown. The first
  // version of this check did exactly that and failed the build, which is the
  // check working: the mistake was in the prose, not in the figures.
  const withRatio = CASES.filter((c) => c.kind === 'drift' && ratioOf(c) !== null && c.unit !== null);
  const worst = withRatio.reduce((a, b) => (Math.abs(Math.log(ratioOf(a))) > Math.abs(Math.log(ratioOf(b))) ? a : b));
  if (worst.id !== 'pipe') {
    bad.push(`the page claims plumbing is the worst offender, but ${worst.id} now misses by more`);
  }

  // A case with an unrecognised kind would drop out of the ranking above
  // without failing anything, which is how a page ends up claiming a
  // superlative it no longer checks.
  const KINDS = new Set(['drift', 'scale', 'ambiguous', 'never-was']);
  for (const c of CASES) {
    if (!KINDS.has(c.kind)) bad.push(`${c.id} has kind "${c.kind}", which nothing knows how to compare`);
    // A drift case is the only one whose two numbers are the same quantity, so
    // it is the only one that may carry a ratio. Anything else with both fields
    // filled in is one edit away from printing a meaningless multiple again.
    if (c.kind !== 'drift' && c.unit !== null && ratioOf(c) !== null) {
      bad.push(`${c.id} is "${c.kind}" but has two comparable-looking numbers — its ratio would not mean anything`);
    }
  }

  // Every case has to point somewhere real and say what is there. An anchor
  // that shares no word with the thing it points at was the defect that left
  // /paper/a4/pixels/ taking no impressions while its queries landed elsewhere.
  for (const c of CASES) {
    if (!c.href || !c.href.startsWith('/') || !c.href.endsWith('/')) bad.push(`${c.id} has a malformed link`);
    if (!c.anchor || c.anchor.length < 12) bad.push(`${c.id} has no usable anchor text`);
    if (!c.why || c.why.length < 120) bad.push(`${c.id} states the discrepancy without explaining it`);
  }

  if (bad.length) {
    console.error(`\n✗ nominal-sizes: ${bad.length} problem(s):`);
    for (const b of bad.slice(0, 8)) console.error('    ' + b);
    process.exitCode = 1;
  }
}

// A ratio only means something when both numbers measure the same quantity in
// the same unit, which is true of the `drift` cases and of nothing else here.
// Printing one for wire gauge produced "7200× smaller" from a die count divided
// by an inch — a number with no referent, sitting in a column headed "Miss" as
// though it were an error size. The other three say what is wrong with them in
// words instead, in the column beside it.
const pct = (c) => {
  if (c.kind !== 'drift') return '—';
  const r = ratioOf(c);
  if (r === null) return '—';
  return r > 1 ? `${r.toFixed(2)}× larger` : `${(1 / r).toFixed(2)}× smaller`;
};

// The page's whole claim is a gap between two lengths, and a table states that
// gap rather than showing it. Drawn to one shared scale, the pipe and the board
// make the argument in the time it takes to look at them — and a picture is the
// part of a page that gets screenshotted, which is the part that travels.
//
// Both bars come from the same numbers the table prints, so the drawing cannot
// flatter the argument: if a figure changes, the picture changes with it, and if
// a figure is wrong the assertions above fail before this runs.
//
// Colour comes from the page's own custom properties rather than fixed hex, so
// the drawing follows the reader into dark mode.
//
// Drawn with HTML boxes on percentage widths rather than inline SVG. The first
// version was SVG and it failed on a phone for a reason worth recording: text
// inside a viewBox scales with the drawing, so 13px in a 680-wide box renders
// near 7px on a 360-wide screen, and a left-hand label gutter wide enough for
// "A 1/2 inch pipe" ate the space the bars needed to show anything. Percentage
// widths keep the one shared scale — which is the whole point of the picture —
// while the labels stay real text that wraps and stays the size the reader set.
function scaleDrawing() {
  const rows = CASES.filter((c) => c.kind === 'drift' && c.unit === 'in');
  const max = Math.max(...rows.flatMap((c) => [c.nominal, c.actual]));
  // The longest bar stops at 78% so the figure beside it has somewhere to sit.
  // At 100% the widest bar filled the row and pushed its own label out of the
  // container — the label is part of the drawing, so the drawing has to leave
  // room for it rather than treat it as an overflow.
  const FULL = 78;
  const w = (v) => ((v / max) * FULL).toFixed(1);

  const band = (c) => `<div class="nsrow">
  <p class="nslab"><strong>${c.sold}</strong> <span class="muted">${ratioOf(c) > 1 ? 'bigger' : 'smaller'} than its name by ${pct(c).replace(/× (larger|smaller)/, '×')}</span></p>
  <div class="nsbar"><i class="nsn" style="width:${w(c.nominal)}%"></i><b>called ${c.nominal}&thinsp;${c.unit}</b></div>
  <div class="nsbar"><i class="nsa" style="width:${w(c.actual)}%"></i><b>measures ${c.actual}&thinsp;${c.unit}</b></div>
</div>`;

  return `<figure class="nsfig">
<style>
.nsfig{margin:1.6em 0;padding:0}
.nsfig .nsrow{margin:0 0 1.35em}
.nsfig .nslab{margin:0 0 .4em;font-size:.95rem}
.nsfig .nsbar{display:flex;align-items:center;gap:8px;margin:4px 0;min-width:0}
.nsfig .nsbar i{height:22px;border-radius:3px;flex:none}
.nsfig .nsbar b{font-weight:400;font-size:.85rem;color:var(--fg2);white-space:nowrap}
.nsfig .nsn{border:1px dashed var(--fg2)}
.nsfig .nsa{background:var(--acc);opacity:.85}
@media (max-width:520px){.nsfig .nsbar b{font-size:.78rem}}
</style>
${rows.map(band).join('\n')}
<figcaption class="muted">Every bar on one scale. Dashed is the name it is sold under, solid is what it measures.</figcaption>
</figure>`;
}

export default async function () {
  const pipe = CASES.find((c) => c.id === 'pipe');
  const pipeRatio = ratioOf(pipe).toFixed(2);

  return [{
    path: '/nominal/',
    title: 'Nominal Sizes — Why Nothing Measures What It Says | Toolman',
    desc: `A 1/2 inch pipe is 0.84 inches across. A 2x4 is 1.5 by 3.5. 80 lb paper is either 118 or 216 gsm. Six trades, six different reasons the number on the label stopped being a measurement.`,
    h1: 'Nothing is the size it says it is',
    crumbs: [{ name: 'Nominal sizes', path: '/nominal/' }],
    body: `<p class="muted">A half-inch pipe measures 0.84 inches. A 2x4 is 1.5 by 3.5. The same 80 lb paper is 118 gsm or 216 gsm depending on nothing printed on the ream. Six trades, six separate reasons, one pattern.</p>

<h2>The pattern</h2>
<p>In every case below the name was a measurement once. Then the thing changed — it got planed, or drawn thinner, or made of different metal — and the name stayed, because the name was already attached to everything else that had to fit it. <strong>A nominal size is a measurement that has been overtaken by its own compatibility.</strong></p>
<p>That is why these are not mistakes and why nobody is going to fix them. A modern half-inch elbow has to thread onto half-inch pipe laid a century ago. Renaming the pipe would strand the fittings.</p>

<h2>The worst offender is plumbing</h2>
<p>Nominal Pipe Size misses by ${pipeRatio}×, which is the largest gap on this page and probably the largest in ordinary hardware. A pipe sold as <strong>1/2 inch</strong> has an outside diameter of <strong>21.3 mm — 0.839 inches</strong> — and an inside diameter around 15.8 mm in schedule 40. The name matches neither end of it.</p>
<p>${pipe.why}</p>

${scaleDrawing()}

<h2>All six</h2>
<table><thead><tr><th>Trade</th><th>Sold as</th><th>Actually</th><th>Miss</th></tr></thead><tbody>
${CASES.map((c) => `<tr><td>${c.trade}</td><td><strong>${c.sold}</strong></td><td>${c.measured}</td><td>${pct(c)}</td></tr>`).join('')}
</tbody></table>

${CASES.filter((c) => c.id !== 'pipe').map((c) => `<h2>${c.sold}</h2>
<p>${c.why}</p>
<p><a href="${c.href}">${c.anchor}</a>.</p>`).join('\n')}

<h2>They are not all the same failure</h2>
<p>Calling all six "nominal" hides three different things, and the difference decides what you can do about each.</p>
<p><strong>Drift.</strong> Pipe, lumber and screen ratios are fossils: a number that was true and stopped being true while the name stayed attached. These are the convertible ones. The relationship is fixed, tabulated and will not move again, so a chart solves them permanently.</p>
<p><strong>A different quantity.</strong> Wire gauge was never a thickness — it is a count of drawing passes that happens to correlate with one. Nothing drifted. The scale is measuring something else and always was, which is why it runs backwards and why no amount of care makes 36 feel like a big wire.</p>
<p><strong>Ambiguity.</strong> 80 lb paper is not wrong in either direction; it is two answers with the unit left off. The fix is not a conversion but a question — text or cover — and once you ask it, both numbers are exact.</p>
<p><strong>And one that never was.</strong> Shoe sizing does not fit any of the three. It never measured your foot: it measures the last the shoe was built around, and every maker has its own. There is no historical moment where it drifted and no missing unit to supply. You cannot convert a shoe size between brands because there is no relationship to tabulate — only the specific pair in front of you.</p>

<h2>How to not be caught by it</h2>
<p><strong>Measure the thing, not the label.</strong> Every page linked above gives the real dimension for the whole range, so the label becomes an index rather than a claim.</p>
<p><strong>Watch for the point where the rule changes.</strong> These scales are rarely wrong in one consistent direction. Lumber loses ½ inch up to 6 and ¾ from 8 up. Pipe means nothing below NPS 14 and means exactly the outside diameter above it. The exception is where the mistakes happen.</p>
<p><strong>When two numbers disagree, find the basis.</strong> The 80 lb paper case is the clearest: neither number is wrong, they are weights of different sheets. Most contradictions in this area are a missing unit rather than a bad figure.</p>

${faq([
  ['Why is a 2x4 not 2 inches by 4 inches?', 'Because the nominal size is the rough-sawn board before it was dried and planed. A 2x4 finishes at 1.5 × 3.5 inches, and the half inch that went missing is sawdust. The rule runs ¾ inch for 1 inch nominal, minus ½ for 2 to 6, and minus ¾ for 8 and up.'],
  ['Why is a 1/2 inch pipe not half an inch?', 'Nominal Pipe Size was a real bore measurement in the 1800s, when pipe was thick-walled wrought iron. A modern 1/2 inch pipe is 21.3 mm on the outside — 0.839 inches — and about 15.8 mm inside. The name was kept so that fittings made since would still thread on.'],
  ['Why do wire gauge numbers run backwards?', 'Because the gauge counts drawing passes rather than measuring thickness. Wire is pulled through progressively smaller dies and the gauge records how many passes it took, so a higher number is a thinner wire. It also explains the uneven steps: each pass is a fixed ratio, not a fixed amount.'],
  ['Is 80 lb paper thick or thin?', 'Both, depending on grade. 80 lb text is 118 gsm, a magazine page. 80 lb cover is 216 gsm, a business card. American basis weight is the weight of 500 sheets at that grade’s basis size, and text is measured on 25 × 38 inch sheets while cover is measured on 20 × 26.'],
  ['Is a 21:9 monitor really 21:9?', 'No. Ultrawide panels sold as 21:9 are 43:18, or 2.389 against 2.333. Both 2560 × 1080 and 3440 × 1440 are wider than the ratio on the box. It is close enough to letterbox a film cleanly and far enough to get a window size wrong.'],
])}

<p><a href="/pipe/">Pipe sizes</a> · <a href="/lumber/">Lumber sizes</a> · <a href="/awg/">Wire gauge</a> · <a href="/paper-weight/">Paper weight</a> · <a href="/screen-size/">Screen sizes</a> · <a href="/shoe-size/">Shoe sizes</a></p>`,
  }];
}
