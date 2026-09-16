import { faq, ring } from '../layout.mjs';

// "2x4 actual size" is one of the most-searched dimension questions there is,
// and the answer is 1½ × 3½ inches — a board named for what it measured before
// it was dried and planed. The rule is fixed by the American Softwood Lumber
// Standard, so it is computed here rather than transcribed: a table of thirty
// fractions typed by hand is thirty chances to publish a wrong measurement on a
// page whose only job is to give the right one.
//
//   nominal 1 in        → ¾ in
//   nominal 2 to 6 in   → nominal − ½ in
//   nominal 8 in and up → nominal − ¾ in

function actual(nominal) {
  if (nominal === 1) return 0.75;
  return nominal >= 8 ? nominal - 0.75 : nominal - 0.5;
}

// Render 1.5 as 1½ and 9.25 as 9¼, which is how a lumberyard writes it.
const VULGAR = { 0.25: '¼', 0.5: '½', 0.75: '¾' };
function frac(v) {
  const whole = Math.floor(v);
  const rest = +(v - whole).toFixed(2);
  if (!rest) return String(whole);
  return (whole ? whole : '') + (VULGAR[rest] || `.${String(rest).slice(2)}`);
}
const mm = (inches) => Math.round(inches * 25.4);
const cm = (inches) => (inches * 2.54).toFixed(1);

// The sizes a yard actually stocks. Thickness × width, both nominal.
// The third argument is what the board is for. Without it every page carried the
// same explanation of why the names differ, which is one paragraph repeated
// eighteen times and took the section to 92% sibling overlap — the same mistake
// made with the ARCH sheets and the oven pages earlier today. Shared prose
// belongs on the hub; an item page needs what is true of that item alone.
const BOARDS = [
  [1, 2, 'Furring strips and battens — the strip nailed across studs to hold panelling off a wall. Too slight for anything structural.'],
  [1, 3, 'Lath, bracing and light frames. It is the size most garden trellis and lightweight crating is built from.'],
  [1, 4, 'Trim, fencing rails and the face of a shelf. A 1x4 laid flat is the standard picket width in North America.'],
  [1, 6, 'Fence boards, shiplap and shelving for light loads. Above about 30 inches of unsupported span a 1x6 shelf will sag under books.'],
  [1, 8, 'Shelving, rough-sawn siding and the wide boards in a plank table. Note the extra ¼ inch it loses — 8 inches nominal is where the rule changes.'],
  [1, 10, 'Wide shelving and stair risers. It is the widest board most people can buy without moving to a glued panel.'],
  [1, 12, 'The widest common board, used for stair treads, workbench tops and box sides. Wide boards cup as they dry, so they are usually fixed at the centre and allowed to move.'],
  [2, 2, 'Stakes, cleats and the internal bracing of a frame. It is square, so it has no strong axis and is used where nothing is being spanned.'],
  [2, 3, 'Non-load-bearing partition walls, where the thinner wall saves floor area. Common in older houses and in interior partitions that carry nothing.'],
  [2, 4, 'The default framing member: wall studs, plates and headers in ordinary construction. Studs at 16 inches on centre and a 2x4 wall is what most North American houses are.'],
  [2, 6, 'Exterior walls where the extra depth is wanted for insulation, and short-span floor joists. A 2x6 wall holds roughly twice the insulation of a 2x4 one.'],
  [2, 8, 'Floor joists and rafters at moderate spans, and the rim board around a deck. The first size where the ¾-inch reduction applies to the width.'],
  [2, 10, 'Floor joists, stair stringers and longer rafters. A stair stringer is the usual reason a builder buys one: cutting the notches leaves very little material, so the deeper board is needed.'],
  [2, 12, 'The deepest common joist, used for long floor spans and for deck framing. Depth is what carries a span — doubling the depth of a joist raises its stiffness roughly eightfold, while doubling its width only doubles it.'],
  [4, 4, 'Posts: deck supports, fence posts, pergola legs. It is the smallest section normally used to hold something up rather than to span between supports.'],
  [4, 6, 'Heavier posts and short beams, and the header over a garage opening. Often sold as a treated post for ground contact.'],
  [6, 6, 'Structural posts and timber-frame members, and the size retaining walls and heavy pergolas are built from. At this thickness the board is usually rough-sawn rather than planed.'],
];

const LENGTHS = [6, 8, 10, 12, 14, 16, 20];

export default async function () {
  // The hub describes the step in the surfacing rule and a stiffness loss. Both
  // are read off actual() rather than typed, and both are checked, because a
  // page whose only job is the right measurement cannot be approximately right.
  if (actual(6) !== 5.5 || actual(8) !== 7.25 || actual(1) !== 0.75) {
    console.error(`\n\u2717 lumber hub: the surfacing rule gives ${actual(1)}, ${actual(6)}, ${actual(8)} where the standard says 0.75, 5.5, 7.25`);
    process.exitCode = 1;
  }
  if (!(actual(8) - actual(6) > 1 && actual(8) - actual(6) < 2)) {
    console.error(`\n\u2717 lumber hub: says the 6-to-8 step is less than the 2 inches the names suggest, and it computes ${actual(8) - actual(6)}`);
    process.exitCode = 1;
  }

  const pages = [];
  const rows = BOARDS.map(([t, w, use]) => ({
    t, w, use, id: `${t}x${w}`,
    at: actual(t), aw: actual(w),
  }));

  for (const r of rows) {
    const id = r.id;
    const areaLoss = (1 - (r.at * r.aw) / (r.t * r.w)) * 100;
    const others = rows.filter((x) => x.id !== id);
    // Scoping a sibling list by an attribute starves the singletons of that
    // attribute: 6x6 is the only 6-inch nominal board, so it appeared in
    // nobody's list and was reachable from the hub alone. Same shape as the
    // 9V cell, which is the only rectangular battery.
    const byThickness = others.filter((x) => x.t === r.t);
    const sameThickness = byThickness.length ? byThickness : others.slice(0, 8);

    const FAQ = faq([
      { q: `What is the actual size of a ${id}?`,
        a: `<strong>${frac(r.at)} × ${frac(r.aw)} inches</strong> — ${cm(r.at)} × ${cm(r.aw)} cm, or ${mm(r.at)} × ${mm(r.aw)} mm.` },
      { q: `Why is a ${id} not ${r.t} by ${r.w} inches?`,
        a: `Because it was, once. The board is sawn at roughly its nominal size while green, then dried and planed smooth on all four faces, and both processes take material off. The name records the rough-sawn size and the label never caught up. This is standardised, not accidental — every mill in North America surfaces to the same finished dimensions.` },
      { q: `How much smaller is a ${id} than its name?`,
        a: `${frac(r.t - r.at)} inch off the thickness and ${frac(r.w - r.aw)} off the width, which is <strong>${areaLoss.toFixed(0)}% less cross-section</strong> than the name implies. That matters for spans and for anything where you are counting boards to fill a width.` },
      { q: `What lengths does a ${id} come in?`,
        a: `Typically ${LENGTHS.join(', ')} feet. Unlike the cross-section, <strong>length is not reduced</strong> — an 8-foot board is 8 feet, or a little over, because it is cut to length after planing.` },
    ]);

    pages.push({
      path: `/lumber/${id}/`,
      title: `${id} Actual Size — ${frac(r.at)} × ${frac(r.aw)} Inches | Toolman`,
      desc: `A ${id} actually measures ${frac(r.at)} × ${frac(r.aw)} inches (${mm(r.at)} × ${mm(r.aw)} mm), not ${r.t} × ${r.w}. Why the names differ, the full nominal-to-actual chart, and available lengths.`,
      h1: `${id} actual size`,
      crumbs: [{ name: 'Lumber sizes', path: '/lumber/' }, { name: id, path: `/lumber/${id}/` }],
      jsonld: [FAQ.schema],
      body: `<p class="big" style="font-size:1.6rem;margin:.3em 0"><strong>${frac(r.at)} × ${frac(r.aw)} inches</strong></p>
<p class="muted">${cm(r.at)} × ${cm(r.aw)} cm · ${mm(r.at)} × ${mm(r.aw)} mm · sold as a ${id}</p>

<h2>Nominal against actual</h2>
<table><thead><tr><th></th><th>Nominal</th><th>Actual</th><th>Difference</th></tr></thead><tbody>
<tr><td>Thickness</td><td>${r.t} in</td><td>${frac(r.at)} in <span class="muted">(${mm(r.at)} mm)</span></td><td>−${frac(r.t - r.at)} in</td></tr>
<tr><td>Width</td><td>${r.w} in</td><td>${frac(r.aw)} in <span class="muted">(${mm(r.aw)} mm)</span></td><td>−${frac(r.w - r.aw)} in</td></tr>
<tr><td>Cross-section</td><td>${r.t * r.w} in²</td><td>${(r.at * r.aw).toFixed(2)} in²</td><td>−${areaLoss.toFixed(0)}%</td></tr>
</tbody></table>

<h2>What a ${id} is for</h2>
<p>${r.use}</p>
<p class="muted">The name is the rough-sawn size before drying and planing. <a href="/lumber/">Why every board is smaller than its name →</a></p>

<h2>What this costs you in practice</h2>
<p>The error compounds wherever boards sit side by side. Three ${id}s are ${frac(r.aw * 3)} inches across, not ${r.w * 3}; eight of them are ${frac(r.aw * 8)} inches rather than ${r.w * 8}, which is <strong>${frac((r.w - r.aw) * 8)} inches short</strong> over a run you might have measured on paper. That is why framing is dimensioned centre to centre and not edge to edge: 16 inches on centre is a real 16 inches whatever the boards themselves measure, so a sheet of plywood still lands on a stud.</p>

${sameThickness.length ? `<h2>Other ${r.t}-inch nominal boards</h2>
<table><thead><tr><th>Nominal</th><th>Actual</th><th>In mm</th></tr></thead><tbody>
${sameThickness.map((x) => `<tr><td><a href="/lumber/${x.id}/">${x.id}</a></td><td>${frac(x.at)} × ${frac(x.aw)} in</td><td>${mm(x.at)} × ${mm(x.aw)} mm</td></tr>`).join('')}
</tbody></table>` : ''}

${FAQ.html}

<h2>More lumber sizes</h2>
<ul class="linklist">${ring(rows, r, 10).map((o) => `<li><a href="/lumber/${o.id}/">${o.id}</a></li>`).join('')}</ul>

<p><a href="/lumber/">The full nominal-to-actual chart</a> · <a href="/convert/">Unit converters</a></p>`,
    });
  }

  pages.push({
    path: '/lumber/',
    title: 'Lumber Size Chart — Nominal vs Actual Dimensions | Toolman',
    desc: 'A 2x4 is actually 1½ × 3½ inches. The full nominal-to-actual chart for every common board, in inches and millimetres, and the rule that produces it.',
    h1: 'Lumber sizes',
    crumbs: [{ name: 'Lumber sizes', path: '/lumber/' }],
    body: `<p class="muted">Every common North American board size, nominal against actual, in inches and millimetres.</p>

<h2>A 2x4 is not 2 by 4</h2>
<p>It is <strong>1½ × 3½ inches</strong>, and the same gap applies to every board on this page. The name records what the timber measured when it came off the saw, green and rough. Drying shrinks it, planing all four faces takes more off, and the label was never updated — so a board is sold under the size it used to be.</p>
<p>The rule is short enough to memorise:</p>
<table><thead><tr><th>Nominal</th><th>Finishes at</th><th>Loses</th></tr></thead><tbody>
<tr><td>1 in</td><td>¾ in</td><td>¼ in</td></tr>
<tr><td>2 to 6 in</td><td>nominal − ½ in</td><td>½ in</td></tr>
<tr><td>8 in and above</td><td>nominal − ¾ in</td><td>¾ in</td></tr>
</tbody></table>
<p><strong>Length is the exception.</strong> An 8-foot board really is 8 feet, often a fraction over, because it is cut to length after planing rather than before.</p>

<h2>The full chart</h2>
<table><thead><tr><th>Sold as</th><th>Actual inches</th><th>Actual mm</th><th>Cross-section lost</th></tr></thead><tbody>
${rows.map((r) => {
      const loss = (1 - (r.at * r.aw) / (r.t * r.w)) * 100;
      return `<tr><td><a href="/lumber/${r.id}/">${r.id}</a></td><td>${frac(r.at)} × ${frac(r.aw)}</td><td>${mm(r.at)} × ${mm(r.aw)}</td><td>${loss.toFixed(0)}%</td></tr>`;
    }).join('')}
</tbody></table>

<h2>Standard lengths</h2>
<p>Boards are stocked in even-numbered feet: ${LENGTHS.join(', ')}. Longer lengths exist to order and cost disproportionately more, because the tree has to have been long enough.</p>

<h2>Why it is worth checking before you cut</h2>
<p>The error compounds where boards sit side by side. Three 2x6s are 16½ inches across, not 18 — an inch and a half short over three boards, and six inches short over a dozen. This is why framing is dimensioned centre to centre rather than edge to edge: 16 inches on centre stays 16 inches whatever the boards actually measure.</p>

<h2>Where the missing half inch went</h2>
<p>A 2x4 really was two inches by four, at the sawmill, while it was still green. It is then dried, which shrinks it, and planed smooth on all four faces, which takes more off. What comes out is what the American Softwood Lumber Standard fixes as the finished size, and the name it is sold under is the size it started at.</p>
<p>The rule has a step in it. Up to 6 inches nominal a board loses half an inch; from 8 inches up it loses three quarters. A 2x6 is ${frac(actual(6))} inches wide and a 2x8 is ${frac(actual(8))}, so the jump from 6 to 8 in the name is a jump of ${frac(actual(8) - actual(6))} inches in the wood — not the 2 inches the numbers suggest. Nominal 1-inch stock is the other exception, finishing at ${frac(actual(1))}.</p>

<h2>Length is not shortened, only the cross-section</h2>
<p>An 8-foot 2x4 is 96 inches long. The shrinkage applies to thickness and width and not to length, which is why you can buy studs cut to 92⅝ inches for a standard wall and get exactly that. It also means the only surprises are in the two dimensions you were not thinking about while measuring the run.</p>

<h2>Span tables never use the nominal name</h2>
<p>A joist's strength goes with the cube of its depth, so the difference between a nominal 10 and its actual ${frac(actual(10))} inches is not cosmetic — it is about ${Math.round((1 - Math.pow(actual(10) / 10, 3)) * 100)}% of the bending stiffness. Published span tables are written in actual dimensions for that reason, and a calculation done with the number on the label overstates what the timber will carry.</p>
<p>Plywood and sheet goods follow a different convention again: a sheet sold as ¾ inch is commonly 23/32, and one sold as ½ inch is 15/32. The shortfall is small and it is not covered by the rule above, so a ¾ sheet in a ¾ dado is a loose fit rather than a tight one.</p>

<p><a href="/nominal/">Why nominal sizes are never the real size</a> — lumber is one of six trades that do this. <a href="/convert/">Unit converters</a> · <a href="/paper/">Paper sizes</a> · <a href="/bed-size/">Bed sizes</a></p>`,
  });

  return pages;
}
