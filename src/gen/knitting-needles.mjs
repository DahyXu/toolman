import { esc, faq, ring } from '../layout.mjs';

// The strongest version on this site of a name that means two things: the
// American and British knitting needle scales **run in opposite directions**.
// A US number goes up as the needle gets thicker; a UK number goes down. So
// "size 8" is a 5 mm needle in America and a 4 mm needle in Britain, and a
// pattern that says 8 without saying which produces a garment a size out.
//
// There is exactly one point of agreement, which the generator asserts rather
// than asserts in prose: size 7 is 4.5 mm in both systems.

// [metric mm, US, UK, yarn weight, note]
const NEEDLES = [
  [2.0, '0', '14', 'Lace, 2-ply', 'The finest needle in general use. Lace shawls and fine socks, worked at around 32 stitches to 10 cm — slow, and unforgiving of a dropped stitch.'],
  [2.25, '1', '13', 'Lace to fingering', 'Sock weight. Most commercial sock patterns assume this or 2.5 mm, and a half-millimetre here changes the fit noticeably over a 60-stitch round.'],
  [2.75, '2', '12', 'Fingering, 4-ply', 'The other common sock size. Between this and 2.25 mm is where most sock knitters adjust for their own tension rather than following the pattern.'],
  [3.0, '2/3', '11', 'Fingering', 'Sits between the two American sizes, which is why it carries a slash — the US scale has no single number for it.'],
  [3.25, '3', '10', 'Fingering to sport', 'Baby garments and fine sweaters. The smallest size most people would knit a whole adult garment on.'],
  [3.5, '4', '—', 'Sport', 'Present in the American scale and absent from the British one, which steps from 3.25 to 3.75.'],
  [3.75, '5', '9', 'Sport to DK', 'A common substitute when a DK pattern comes out loose on 4 mm.'],
  [4.0, '6', '8', 'DK', 'The most-used needle size in British knitting, because DK is the most-used yarn. If a pattern says nothing, this is the assumption.'],
  [4.5, '7', '7', 'DK to worsted', 'The one size where the two scales agree — 7 means 4.5 mm on both sides of the Atlantic, and nowhere else do the numbers coincide.'],
  [5.0, '8', '6', 'Worsted, aran', 'The American default in the way 4 mm is the British one, because worsted is the standard American yarn weight and DK is the British.'],
  [5.5, '9', '5', 'Aran', 'Aran sweaters and heavier accessories. Fast enough to finish a garment and fine enough to hold a cable pattern.'],
  [6.0, '10', '4', 'Aran to chunky', 'The top of the everyday range. Beyond here the fabric starts to be defined by the gaps rather than the stitches.'],
  [6.5, '10.5', '3', 'Chunky', 'Chunky yarn and loose-gauge accessories. The American half-size exists because the scale ran out of integers.'],
  [7.0, '—', '2', 'Chunky', 'A British size with no American equivalent; US knitters step from 10.5 to 11, which is 6.5 to 8.'],
  [8.0, '11', '0', 'Chunky to bulky', 'Bulky yarn, quick scarves and blankets. At this size gauge swatches genuinely matter, because a stitch is nearly a centimetre.'],
  [9.0, '13', '00', 'Bulky', 'Super bulky yarn. A jumper takes an evening and weighs a great deal.'],
  [10.0, '15', '000', 'Super bulky', 'Blankets and heavy outerwear. The largest size sold as an ordinary needle rather than a specialist one.'],
  [12.0, '17', '—', 'Super bulky', 'Beyond the British lettering entirely. Roving and multiple strands held together.'],
  [15.0, '19', '—', 'Jumbo', 'Arm-knitting territory. The needle is a dowel and the fabric is mostly hole.'],
  [19.0, '35', '—', 'Jumbo', 'Chunky blankets from unspun roving.'],
  [25.0, '50', '—', 'Jumbo', 'The largest size made. Two or three stitches to ten centimetres.'],
];

{
  const bad = [];
  const rows = NEEDLES.map(([mm, us, uk]) => ({ mm, us, uk }));
  const usNum = rows.filter((r) => /^\d+(\.\d+)?$/.test(r.us));
  // The British scale runs 14 down to 1, then runs out of numbers and starts
  // adding zeros: 0, 00, 000, each thicker than the last. Parsing those as the
  // number zero makes the sequence look flat, which is what the first version of
  // this check reported. Model them as continuing below zero.
  const ukValue = (u) => (/^0+$/.test(u) ? -(u.length - 1) : +u);
  const ukNum = rows.filter((r) => /^0+$|^\d+$/.test(r.uk));
  // US numbers must rise with diameter; UK numbers must fall.
  for (let i = 1; i < usNum.length; i++) {
    if (+usNum[i].us <= +usNum[i - 1].us) bad.push(`US ${usNum[i - 1].us} → ${usNum[i].us} does not increase with diameter`);
  }
  for (let i = 1; i < ukNum.length; i++) {
    if (ukValue(ukNum[i].uk) >= ukValue(ukNum[i - 1].uk)) bad.push(`UK ${ukNum[i - 1].uk} → ${ukNum[i].uk} does not decrease with diameter`);
  }
  // Exactly one size where the numbers agree.
  const agree = rows.filter((r) => r.us === r.uk);
  if (agree.length !== 1) bad.push(`${agree.length} sizes where US and UK numbers agree — the pages say there is exactly one`);
  else if (agree[0].mm !== 4.5) bad.push(`the scales agree at ${agree[0].mm} mm, not 4.5`);
  if (bad.length) {
    console.error('\n✗ knitting needle scales no longer behave as the pages describe:');
    for (const b of bad) console.error('    ' + b);
    process.exitCode = 1;
  }
}

const slug = (mm) => String(mm).replace('.', '-') + 'mm';
const f1 = (v) => (Number.isInteger(v) ? String(v) : v.toFixed(2).replace(/0$/, ''));

export default async function () {
  const pages = [];
  const rows = NEEDLES.map(([mm, us, uk, yarn, note]) => ({ mm, us, uk, yarn, note, id: slug(mm) }));

  for (const r of rows) {
    const near = rows.filter((x) => x.id !== r.id && Math.abs(x.mm - r.mm) <= Math.max(1, r.mm * 0.3));
    const clash = r.us !== '—' && r.uk !== '—' && r.us !== r.uk
      ? rows.find((x) => x.uk === r.us) : null;

    const FAQ = faq([
      { q: `What is a ${f1(r.mm)} mm knitting needle in US and UK sizes?`,
        a: `<strong>US ${r.us}</strong> and <strong>UK ${r.uk}</strong>. The millimetre figure is the actual diameter and the only one that means the same thing everywhere.` },
      clash
        ? { q: `Is a US ${r.us} the same as a UK ${r.us}?`,
            a: `<strong>No.</strong> A US ${r.us} is ${f1(r.mm)} mm; a UK ${r.us} is <a href="/knitting-needle/${clash.id}/">${f1(clash.mm)} mm</a>. The scales run in opposite directions — American numbers grow with the needle and British ones shrink — so the same number is two different needles.` }
        : { q: `Does this size exist in both scales?`,
            a: r.us === '—' ? `Not in the American scale, which steps around it. The British number is ${r.uk}.` : r.uk === '—' ? `Not in the British scale, which does not extend this far. The American number is ${r.us}.` : `Yes, and unusually the numbers agree: ${r.us} in both. This is the only size where that happens.` },
      { q: `What yarn suits a ${f1(r.mm)} mm needle?`, a: `<strong>${r.yarn}.</strong> ${r.note}` },
      { q: `Why do the two scales run in opposite directions?`,
        a: `The British scale counts <em>down</em> from the thickest wire in a gauge, in the same way a wire gauge does — more drawing operations, higher number, thinner. The American scale simply counts up from the finest needle. Neither is wrong; they were never designed to be compared, and the only size where the numbers coincide is 4.5 mm, which is size 7 in both.` },
    ]);

    pages.push({
      path: `/knitting-needle/${r.id}/`,
      title: `${f1(r.mm)} mm Knitting Needle — US ${r.us}, UK ${r.uk} | Toolman`,
      desc: `A ${f1(r.mm)} mm knitting needle is US ${r.us} and UK ${r.uk}. Suits ${r.yarn.toLowerCase()}. Why the two numbering systems run in opposite directions.`,
      h1: `${f1(r.mm)} mm knitting needle`,
      crumbs: [{ name: 'Knitting needles', path: '/knitting-needle/' }, { name: `${f1(r.mm)} mm`, path: `/knitting-needle/${r.id}/` }],
      jsonld: [FAQ.schema],
      body: `<p class="big" style="font-size:1.6rem;margin:.3em 0"><strong>${f1(r.mm)} mm</strong></p>
<p class="muted">US ${r.us} · UK ${r.uk} · ${r.yarn}</p>

<h2>What this size is for</h2>
<p>${r.note}</p>

<h2>In each scale</h2>
<table><tbody>
<tr><td>Diameter</td><td><strong>${f1(r.mm)} mm</strong></td></tr>
<tr><td>US size</td><td>${r.us}</td></tr>
<tr><td>UK / Canadian size</td><td>${r.uk}</td></tr>
<tr><td>Yarn weight</td><td>${r.yarn}</td></tr>
</tbody></table>
${clash ? `<p><strong>A US ${r.us} and a UK ${r.us} are not the same needle.</strong> This one is ${f1(r.mm)} mm; the British ${r.us} is <a href="/knitting-needle/${clash.id}/">${f1(clash.mm)} mm</a>. Buy by millimetre wherever the pattern allows it.</p>` : ''}

<h2>Nearby sizes</h2>
<table><thead><tr><th>mm</th><th>US</th><th>UK</th><th>Yarn</th></tr></thead><tbody>
${[...near, r].sort((a, b) => a.mm - b.mm).map((x) => `<tr${x.id === r.id ? ' style="font-weight:600"' : ''}><td>${x.id === r.id ? f1(x.mm) : `<a href="/knitting-needle/${x.id}/">${f1(x.mm)}</a>`}</td><td>${x.us}</td><td>${x.uk}</td><td class="muted">${esc(x.yarn)}</td></tr>`).join('')}
</tbody></table>

${FAQ.html}

<h2>More needle sizes</h2>
<ul class="linklist">${ring(rows, r, 10).map((o) => `<li><a href="/knitting-needle/${o.id}/">${esc(o.name || o.id)}</a></li>`).join('')}</ul>

<p><a href="/knitting-needle/">The full needle chart</a> · <a href="/convert/">Unit converters</a></p>`,
    });
  }

  const agree = rows.find((r) => r.us === r.uk);
  const us8 = rows.find((r) => r.us === '8');
  const uk8 = rows.find((r) => r.uk === '8');

  pages.push({
    path: '/knitting-needle/',
    title: 'Knitting Needle Sizes — US, UK and mm, and Why They Disagree | Toolman',
    desc: `A US 8 is ${f1(us8.mm)} mm and a UK 8 is ${f1(uk8.mm)} mm. The two scales run in opposite directions and meet at exactly one size. Full chart with yarn weights.`,
    h1: 'Knitting needle sizes',
    crumbs: [{ name: 'Knitting needles', path: '/knitting-needle/' }],
    body: `<p class="muted">${rows.length} needle sizes in millimetres, US and UK numbers, with the yarn each suits.</p>

<h2>The two scales run in opposite directions</h2>
<p>This is the thing to know before reading any pattern. <strong>American numbers get bigger as the needle gets thicker. British numbers get smaller.</strong> So:</p>
<table><thead><tr><th>Written</th><th>Means, in America</th><th>Means, in Britain</th></tr></thead><tbody>
<tr><td>size 8</td><td><a href="/knitting-needle/${us8.id}/">${f1(us8.mm)} mm</a></td><td><a href="/knitting-needle/${uk8.id}/">${f1(uk8.mm)} mm</a></td></tr>
</tbody></table>
<p>A whole millimetre on a 4 mm needle is about 25% of the diameter, which over a 100-stitch row is the difference between a garment that fits and one that does not. A pattern that says "size 8" without saying whose is not enough information.</p>

<h2>They meet at exactly one size</h2>
<p><strong>Size 7 is ${f1(agree.mm)} mm in both systems</strong> — the single point where the two scales cross, and the only number you can read from either country without checking. Everywhere else they diverge, and the gap widens in both directions.</p>

<h2>The full chart</h2>
<table><thead><tr><th>Millimetres</th><th>US</th><th>UK</th><th>Yarn weight</th></tr></thead><tbody>
${rows.map((r) => `<tr${r.us === r.uk ? ' style="font-weight:600"' : ''}><td><a href="/knitting-needle/${r.id}/">${f1(r.mm)}</a></td><td>${r.us}</td><td>${r.uk}</td><td class="muted">${esc(r.yarn)}</td></tr>`).join('')}
</tbody></table>
<p class="muted">The bold row is the one size where the two numbers agree. A dash means that scale has no number for that diameter.</p>

<h2>Why the British scale counts backwards</h2>
<p>It is a wire gauge. Needles were drawn from wire, and a gauge number counts the drawing operations it took — more passes, thinner wire, higher number. <a href="/awg/">AWG counts the same way</a> and for the same reason, which is why 12 gauge wire is thicker than 20.</p>
<p>The scale then runs out of numbers. Below 1 there is nothing left to count down to, so it starts adding zeros: <strong>0, then 00, then 000</strong>, each thicker than the last — the same escape the wire gauges use when they reach 1/0, 2/0 and beyond. It is the clearest sign that these numbers were never a measurement.</p>
<p>The American scale has no such history. It simply numbers the needles from finest to thickest, and the two systems were never designed to be read against each other.</p>

<h2>Buy by millimetre</h2>
<p>The millimetre figure is the actual diameter and the only one that survives crossing a border, a brand or a decade. Most needles are marked with it, most modern patterns give it alongside the numbers, and where a pattern gives only a number the sensible move is to find out which country wrote it before casting on.</p>
<p>And whichever size a pattern names, the gauge swatch decides. Two knitters with the same needle and the same yarn routinely differ by half a needle size in tension, which is why every pattern that matters specifies stitches per 10 cm rather than trusting the number on the needle.</p>

<p><a href="/awg/">Wire gauge</a> — the same backwards-counting logic. <a href="/convert/">Unit converters</a></p>`,
  });

  return pages;
}
