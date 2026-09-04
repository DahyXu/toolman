import { esc, faq } from '../layout.mjs';

// The best fact in this whole section is that the number is the size. A CR2032
// is 20 mm across and 3.2 mm thick; a CR1620 is 16 mm by 2.0; an 18650 is 18 mm
// by 65.0. The IEC code encodes the dimensions and almost nobody knows it, which
// makes it exactly the kind of thing a reference page should say first.
//
// So the coin and cylindrical cells below carry no dimensions of their own —
// they are decoded from the designation, and a mismatch between the decoded
// value and a stated one is a bug rather than a typo. The cells whose names
// predate the scheme (AA, AAA, C, D, 9V) have to be given explicitly.

// Decode a code like "CR2032" or "18650" into millimetres.
// Coin: two digits diameter, two digits tenths of a millimetre thick.
// Cylindrical: two digits diameter, three digits tenths of a millimetre long.
// LR and SR are deliberately absent. The alkaline and silver-oxide button-cell
// codes are not built the same way — an LR1130 is 11.6 × 3.1 mm, not the 11 × 3.0
// the rule would give, because its digits are a rounded nominal rather than the
// measurement. Including them made the page assert a size that was wrong in both
// dimensions, which the conflict check below caught before it shipped.
function decode(code) {
  let m = /^(?:CR|BR)(\d{2})(\d{2})$/.exec(code);
  if (m) return { d: +m[1], h: +m[2] / 10, decoded: true };
  m = /^(\d{2})(\d{3})$/.exec(code);
  if (m) return { d: +m[1], h: +m[2] / 10, decoded: true };
  return null;
}

// [code, kind, volts, chemistry, aliases, note, explicit dimensions if the name
// does not encode them]
const CELLS = [
  ['AAA', 'cylindrical', 1.5, 'Alkaline', ['LR03', 'R03', 'MN2400', 'Micro'],
    'The small cylindrical cell in remotes, torches and computer mice. Its IEC name is LR03 for alkaline and R03 for zinc-carbon, and a rechargeable NiMH AAA is HR03 — same size, 1.2 volts rather than 1.5, which is why some devices dim on rechargeables and others do not care.',
    { d: 10.5, h: 44.5 }],
  ['AA', 'cylindrical', 1.5, 'Alkaline', ['LR6', 'R6', 'MN1500', 'Mignon'],
    'The most-sold battery size in the world. LR6 is the alkaline designation, R6 the zinc-carbon one and HR6 the rechargeable NiMH. An alkaline AA holds roughly 2,000–3,000 mAh and a NiMH one about 2,000, but the NiMH delivers it at a flatter voltage, which is why rechargeables often outlast alkalines in high-drain devices while doing worse in a clock.',
    { d: 14.5, h: 50.5 }],
  ['C', 'cylindrical', 1.5, 'Alkaline', ['LR14', 'R14', 'MN1400', 'Baby'],
    'The middle cylindrical size, found in larger torches and portable radios. It is nearly twice the diameter of an AA and holds roughly four times the energy — the spacers sold to run AAs in a C compartment work electrically and give you a quarter of the runtime.',
    { d: 26.2, h: 50 }],
  ['D', 'cylindrical', 1.5, 'Alkaline', ['LR20', 'R20', 'MN1300', 'Mono'],
    'The large cylindrical cell, still used in lanterns, big radios and some medical equipment. A D cell holds around 12,000 mAh against an AA’s 2,500 — the size is the capacity, since the chemistry is identical.',
    { d: 34.2, h: 61.5 }],
  ['AAAA', 'cylindrical', 1.5, 'Alkaline', ['LR61', 'MN2500', 'Mini'],
    'Thinner and shorter than an AAA, used in stylus pens, laser pointers and some glucose meters. It is also what is inside a 9V battery: cut one open and you find six of these in series, which is exactly where the nine volts comes from.',
    { d: 8.3, h: 42.5 }],
  ['N', 'cylindrical', 1.5, 'Alkaline', ['LR1', 'E90', 'Lady'],
    'A short 1.5 V cell about two thirds the length of an AA, used in some door sensors, medical devices and older camera accessories.',
    { d: 12, h: 30.2 }],
  ['9V', 'rectangular', 9, 'Alkaline', ['6LR61', 'PP3', 'MN1604', 'E-Block'],
    'The rectangular block in smoke alarms and guitar pedals. The "6" in 6LR61 is the giveaway: it is six 1.5 V cells stacked in series, and in most brands those cells are AAAA size. Capacity is low — around 500 mAh — so it suits alarms that draw almost nothing and struggles with anything that does.',
    { d: 26.5, h: 48.5, w: 17.5 }],
  ['A23', 'cylindrical', 12, 'Alkaline', ['8LR932', 'MN21', 'V23GA'],
    'The narrow 12 V cell in car key fobs and garage remotes. Like the 9V it is a stack — eight small alkaline cells in series — which is why a 12 V battery this small exists at all and why its capacity is tiny.',
    { d: 10.3, h: 28.5 }],
  ['CR2032', 'coin', 3, 'Lithium', ['DL2032', 'BR2032', 'ECR2032'],
    'The most common lithium coin cell: motherboards, car keys, bathroom scales, LED tea lights. It is the one to check first when a computer forgets the date. Around 225 mAh, and it holds its charge for a decade on the shelf.'],
  ['CR2025', 'coin', 3, 'Lithium', ['DL2025', 'BR2025'],
    'The same 20 mm diameter as a CR2032 and 0.7 mm thinner, which is the whole difference. It usually fits a CR2032 holder and rattles; a CR2032 in a CR2025 holder often will not close. Capacity is about 160 mAh against 225, so it is a downgrade rather than an equal.'],
  ['CR2016', 'coin', 3, 'Lithium', ['DL2016', 'BR2016'],
    'Half the thickness of a CR2032 at the same diameter, and about 90 mAh. Two CR2016 stacked are the same height as one CR2032 — some devices are designed for exactly that, which is why a battery compartment sometimes takes either one thick cell or two thin ones.'],
  ['CR2450', 'coin', 3, 'Lithium', ['DL2450', 'BR2450'],
    'A larger coin cell at 24.5 mm across, used in alarm sensors, some car keys and medical monitors. Around 600 mAh, nearly three times a CR2032, which is why it turns up where a coin cell has to last years.'],
  ['CR1220', 'coin', 3, 'Lithium', ['DL1220', 'BR1220'],
    'A small coin cell in watches, small remotes and some fitness trackers. About 40 mAh — a fifth of a CR2032 — so it is chosen for space rather than for life.'],
  ['CR1620', 'coin', 3, 'Lithium', ['DL1620', 'BR1620'],
    'A 16 mm coin cell used in car key fobs, tyre pressure sensors and small remotes. Around 75 mAh.'],
  ['CR1632', 'coin', 3, 'Lithium', ['DL1632', 'BR1632'],
    'The same 16 mm diameter as a CR1620 and 1.2 mm thicker, holding roughly twice as much. As with the 2016 and 2032 pair, the last two digits are the only difference and they are the thickness.'],
  ['CR123A', 'cylindrical', 3, 'Lithium', ['CR17345', '16340 (rechargeable)'],
    'A 3 V lithium cylinder used in film cameras, tactical torches and some security sensors. Its rechargeable lookalike, the 16340, is 3.7 V — putting one in a device designed for CR123A is the usual cause of a torch that runs bright and then dies.',
    { d: 17, h: 34.5 }],
  ['LR44', 'coin', 1.5, 'Alkaline', ['AG13', 'A76', '357 (silver)', 'SR44', 'LR1154'],
    'The alkaline button cell in calculators, small toys and laser pointers, and the worst-named battery in common use: LR44, AG13, A76, 1166A and L1154 are all the same cell. The silver-oxide equivalent is the SR44 or 357, which is the same size at a steadier 1.55 V and roughly twice the capacity — worth the extra in a light meter, irrelevant in a toy.',
    { d: 11.6, h: 5.4 }],
  ['LR41', 'coin', 1.5, 'Alkaline', ['AG3', '392', 'SR41', 'L736'],
    'A small alkaline button cell in thermometers, small torches and hearing-aid-sized devices. Also sold as AG3, 192 and 392 depending on the chemistry and the vendor.',
    { d: 7.9, h: 3.6 }],
  ['LR1130', 'coin', 1.5, 'Alkaline', ['AG10', '389', 'SR1130', 'L1131'],
    'The 11.6 mm button cell, the same diameter as an LR44 and thinner. That similarity causes real trouble — an LR44 will not sit in an LR1130 holder and an LR1130 in an LR44 holder makes intermittent contact.',
    { d: 11.6, h: 3.1 }],
  ['18650', 'cylindrical', 3.7, 'Lithium-ion', ['NCR18650', 'INR18650'],
    'The rechargeable lithium cell inside laptop batteries, e-bikes, torches and, in thousands, an electric car. Its name is its size: 18 mm across, 65.0 mm long. Protected versions add a small circuit at one end and are a couple of millimetres longer, which is why some torches take one and not the other.'],
  ['21700', 'cylindrical', 3.7, 'Lithium-ion', ['INR21700'],
    'The larger rechargeable lithium cell that has largely replaced the 18650 in new designs: 21 mm by 70.0 mm, about 50% more volume and correspondingly more capacity. The naming rule is the same one, which is the easiest way to remember either.'],
];

const KIND = { coin: 'Coin cell', cylindrical: 'Cylindrical', rectangular: 'Rectangular' };

// Decode where the name allows it, and fall back to the stated size otherwise.
// If both exist and disagree, that is a defect worth surfacing rather than
// silently preferring one.
export const CONFLICTS = [];

const rows = CELLS.map(([code, kind, volts, chem, aliases, note, explicit]) => {
  const dec = decode(code);
  if (dec && explicit && (Math.abs(dec.d - explicit.d) > 0.3 || Math.abs(dec.h - explicit.h) > 0.3)) {
    CONFLICTS.push(`${code}: name decodes to ${dec.d}×${dec.h} mm, table says ${explicit.d}×${explicit.h}`);
  }
  const dim = dec || explicit;
  return { code, kind, volts, chem, aliases, note, ...dim, decoded: !!dec, width: explicit && explicit.w };
});

if (CONFLICTS.length) {
  console.error('\n✗ battery designation does not match its stated size:');
  for (const c of CONFLICTS) console.error('    ' + c);
  process.exitCode = 1;
}

const one = (n) => (Number.isInteger(n) ? String(n) : n.toFixed(1));
const inch = (mm) => (mm / 25.4).toFixed(2);

export default async function () {
  const pages = [];

  for (const r of rows) {
    const sameDia = rows.filter((x) => x.code !== r.code && x.kind === r.kind && Math.abs(x.d - r.d) < 0.5);
    const sameKind = rows.filter((x) => x.code !== r.code && x.kind === r.kind).slice(0, 10);

    const FAQ = faq([
      { q: `What size is a ${r.code} battery?`,
        a: r.kind === 'rectangular'
          ? `<strong>${one(r.d)} × ${one(r.width)} × ${one(r.h)} mm</strong>.`
          : `<strong>${one(r.d)} mm across and ${one(r.h)} mm ${r.kind === 'coin' ? 'thick' : 'long'}</strong> — ${inch(r.d)} × ${inch(r.h)} inches.` },
      { q: `What voltage is a ${r.code}?`, a: `<strong>${r.volts} V</strong> (${r.chem}).` },
      r.decoded
        ? { q: `What do the numbers in ${r.code} mean?`,
            a: `They are the size. <strong>${String(r.code).replace(/^[A-Z]+/, '').slice(0, 2)} is the diameter in millimetres and ${String(r.code).replace(/^[A-Z]+/, '').slice(2)} is the ${r.kind === 'coin' ? 'thickness' : 'length'} in tenths of a millimetre</strong> — so ${r.code} is ${one(r.d)} mm by ${one(r.h)} mm. The rule holds for every coin cell and every lithium-ion cylinder named this way.` }
        : { q: `What is another name for a ${r.code}?`,
            a: `${r.aliases.map((a) => `<strong>${esc(a)}</strong>`).join(', ')} — all the same cell.` },
      sameDia.length
        ? { q: `Can I use a ${sameDia[0].code} instead of a ${r.code}?`,
            a: `They are the same diameter, ${one(r.d)} mm, and different ${r.kind === 'coin' ? 'thicknesses' : 'lengths'}: ${one(r.h)} mm against ${one(sameDia[0].h)}. ${sameDia[0].h < r.h ? `A ${sameDia[0].code} is thinner, so it may rattle or lose contact, and it holds less.` : `A ${sameDia[0].code} is thicker and often will not let the compartment close.`} Same voltage, so nothing is damaged by trying.` }
        : { q: `Is the ${r.code} rechargeable?`,
            a: r.chem === 'Lithium-ion' ? 'Yes — this is a rechargeable cell and must be charged in a charger designed for lithium-ion.' : `Not in this chemistry. ${r.chem} cells of this size are single-use; recharging one is a fire risk rather than a saving.` },
    ]);

    pages.push({
      path: `/battery/${r.code.toLowerCase()}/`,
      title: (() => {
        const base = `${r.code} Battery — ${one(r.d)} × ${one(r.h)} mm, ${r.volts}V`;
        // People search the IEC code as often as the common name: LR14, not C.
        const alias = (r.aliases || [])[0];
        const two = (r.aliases || []).slice(0, 2).join(', ');
        const full = two ? `${base}, ${two}` : base;
        const one_ = alias ? `${base}, ${alias}` : base;
        return full.length <= 65 ? full : one_.length <= 65 ? one_ : base;
      })(),
      desc: `A ${r.code} battery is ${one(r.d)} mm ${r.kind === 'coin' ? 'across and ' + one(r.h) + ' mm thick' : 'by ' + one(r.h) + ' mm'}, ${r.volts} V ${r.chem}. Equivalents, what fits instead, and what the code actually means.`,
      h1: `${r.code} battery size`,
      crumbs: [{ name: 'Battery sizes', path: '/battery/' }, { name: r.code, path: `/battery/${r.code.toLowerCase()}/` }],
      jsonld: [FAQ.schema],
      body: `<p class="big" style="font-size:1.6rem;margin:.3em 0"><strong>${r.kind === 'rectangular' ? `${one(r.d)} × ${one(r.width)} × ${one(r.h)} mm` : `${one(r.d)} × ${one(r.h)} mm`}</strong></p>
<p class="muted">${r.volts} V · ${r.chem} · ${KIND[r.kind]}${r.aliases.length ? ` · also sold as ${r.aliases.map(esc).join(', ')}` : ''}</p>

<h2>About the ${r.code}</h2>
<p>${r.note}</p>

<h2>The numbers</h2>
<table><tbody>
<tr><td>${r.kind === 'rectangular' ? 'Length' : 'Diameter'}</td><td>${one(r.d)} mm · ${inch(r.d)} in</td></tr>
${r.width ? `<tr><td>Width</td><td>${one(r.width)} mm · ${inch(r.width)} in</td></tr>` : ''}
<tr><td>${r.kind === 'coin' ? 'Thickness' : 'Height'}</td><td>${one(r.h)} mm · ${inch(r.h)} in</td></tr>
<tr><td>Nominal voltage</td><td>${r.volts} V</td></tr>
<tr><td>Chemistry</td><td>${r.chem}</td></tr>
<tr><td>Other names</td><td>${r.aliases.length ? r.aliases.map(esc).join(', ') : '—'}</td></tr>
</tbody></table>

${sameDia.length ? `<h2>Same diameter, different ${r.kind === 'coin' ? 'thickness' : 'length'}</h2>
<p>These are the cells most often confused with a ${r.code}, because they are exactly as wide and only differ in one dimension.</p>
<table><thead><tr><th>Cell</th><th>Diameter</th><th>${r.kind === 'coin' ? 'Thickness' : 'Length'}</th><th>vs ${r.code}</th></tr></thead><tbody>
${sameDia.map((x) => `<tr><td><a href="/battery/${x.code.toLowerCase()}/">${x.code}</a></td><td>${one(x.d)} mm</td><td>${one(x.h)} mm</td><td>${(x.h - r.h > 0 ? '+' : '') + (x.h - r.h).toFixed(1)} mm</td></tr>`).join('')}
</tbody></table>` : ''}

<h2>Other ${KIND[r.kind].toLowerCase()} sizes</h2>
<table><thead><tr><th>Cell</th><th>Size</th><th>Voltage</th></tr></thead><tbody>
${sameKind.map((x) => `<tr><td><a href="/battery/${x.code.toLowerCase()}/">${x.code}</a></td><td>${one(x.d)} × ${one(x.h)} mm</td><td>${x.volts} V</td></tr>`).join('')}
</tbody></table>

${FAQ.html}

<p><a href="/battery/">All battery sizes</a> · <a href="/convert/">Unit converters</a></p>`,
    });
  }

  const byKind = {};
  for (const r of rows) (byKind[r.kind] ||= []).push(r);

  pages.push({
    path: '/battery/',
    title: 'Battery Size Chart — Dimensions, Voltage and Equivalents | Toolman',
    desc: 'Every common battery size in millimetres, with voltage, chemistry and the names each one is also sold under. A CR2032 is 20 mm across and 3.2 mm thick — the code is the size.',
    h1: 'Battery sizes',
    crumbs: [{ name: 'Battery sizes', path: '/battery/' }],
    body: `<p class="muted">${rows.length} common battery sizes with their real dimensions, voltage and the other names each is sold under.</p>

<h2>The code is the size</h2>
<p>This is the thing worth knowing and almost nobody does. For coin cells and lithium-ion cylinders, <strong>the number is the measurement</strong>: the first two digits are the diameter in millimetres, and the rest is the thickness or length in tenths of a millimetre.</p>
<table><thead><tr><th>Name</th><th>Reads as</th><th>Which is</th></tr></thead><tbody>
<tr><td>CR<strong>20</strong><strong>32</strong></td><td>20 mm across, 3.2 mm thick</td><td>${one(rows.find((r) => r.code === 'CR2032').d)} × ${one(rows.find((r) => r.code === 'CR2032').h)} mm</td></tr>
<tr><td>CR<strong>16</strong><strong>20</strong></td><td>16 mm across, 2.0 mm thick</td><td>${one(rows.find((r) => r.code === 'CR1620').d)} × ${one(rows.find((r) => r.code === 'CR1620').h)} mm</td></tr>
<tr><td><strong>18</strong><strong>650</strong></td><td>18 mm across, 65.0 mm long</td><td>${one(rows.find((r) => r.code === '18650').d)} × ${one(rows.find((r) => r.code === '18650').h)} mm</td></tr>
<tr><td><strong>21</strong><strong>700</strong></td><td>21 mm across, 70.0 mm long</td><td>${one(rows.find((r) => r.code === '21700').d)} × ${one(rows.find((r) => r.code === '21700').h)} mm</td></tr>
</tbody></table>
<p>Once you know it, a CR2032 and a CR2025 stop being two mysterious codes and become the same 20 mm cell in two thicknesses — which is exactly the question people are asking when they wonder whether one will do instead of the other. The AA, AAA, C, D and 9V names predate the scheme and encode nothing.</p>

${Object.entries(byKind).map(([kind, list]) => `<h2>${KIND[kind]}</h2>
<table><thead><tr><th>Cell</th><th>Size (mm)</th><th>Voltage</th><th>Chemistry</th><th>Also sold as</th></tr></thead><tbody>
${list.map((r) => `<tr><td><a href="/battery/${r.code.toLowerCase()}/">${r.code}</a></td><td>${r.kind === 'rectangular' ? `${one(r.d)} × ${one(r.width)} × ${one(r.h)}` : `${one(r.d)} × ${one(r.h)}`}</td><td>${r.volts} V</td><td>${r.chem}</td><td class="muted">${r.aliases.slice(0, 3).map(esc).join(', ')}</td></tr>`).join('')}
</tbody></table>`).join('')}

<h2>Why the same battery has five names</h2>
<p>An LR44 is also an AG13, an A76, a 1166A and an L1154, and the silver-oxide version of the same cell is an SR44 or a 357. The IEC code (LR44) describes chemistry and size; the AG number is a retail shorthand; the three-digit numbers come from watch-battery cross-reference tables. None of them is wrong and none of them is universal, which is why a cell is often easier to identify by measuring it than by reading the packet.</p>

<p><a href="/convert/">Unit converters</a> · <a href="/lumber/">Lumber sizes</a> · <a href="/bed-size/">Bed sizes</a></p>`,
  });

  return pages;
}
