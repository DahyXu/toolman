import { esc, faq } from '../layout.mjs';

// Two things make this worth a section rather than a table.
//
// First, the door is not the hole. A door leaf, its frame and the rough opening
// in the wall are three different measurements, and ordering against the wrong
// one is the standard way to end up with a door that does not fit — the same
// shape of mistake as drilling a clearance hole and then trying to tap it.
//
// Second, British "metric" door sizes are not metric. 762 mm is exactly 30
// inches, 1981 mm is exactly 78 inches — the numbers are imperial sizes
// converted after the fact, which is why they look so arbitrary. The genuinely
// metric British range (626, 726, 826, 926 × 2040) is a separate, later
// standard, and the two do not interchange.

const IN = 25.4;

// [name, id, region, leaf width mm, leaf height mm, note]
const DOORS = [
  ['457 × 1981 mm', 'uk-457x1981', 'UK', 457, 1981, 'The narrowest standard British door, 1 ft 6 in wide. Used for cupboards, airing cupboards and meter boxes rather than rooms — it is too narrow for a person carrying anything.'],
  ['533 × 1981 mm', 'uk-533x1981', 'UK', 533, 1981, 'A 1 ft 9 in cupboard and store door. Still below the width anyone would fit to a room.'],
  ['610 × 1981 mm', 'uk-610x1981', 'UK', 610, 1981, 'Two feet exactly. The smallest width used on an actual room — a small cloakroom or an en-suite where nothing else fits.'],
  ['686 × 1981 mm', 'uk-686x1981', 'UK', 686, 1981, '2 ft 3 in, the common size for bathrooms and smaller bedrooms in British houses built before the 1980s.'],
  ['762 × 1981 mm', 'uk-762x1981', 'UK', 762, 1981, 'The British standard internal door: 2 ft 6 in by 6 ft 6 in. If a UK door is described without a size, this is it, and it is what most replacement doors and off-the-shelf frames assume.'],
  ['838 × 1981 mm', 'uk-838x1981', 'UK', 838, 1981, '2 ft 9 in, used for main rooms in larger houses and as the minimum for wheelchair access in British guidance, which asks for 750 mm of clear opening — a 762 mm leaf does not quite give it once the frame and the open door are accounted for.'],
  ['914 × 1981 mm', 'uk-914x1981', 'UK', 914, 1981, 'Three feet. Front doors and wide internal openings; also the usual width where a door has to take furniture through.'],
  ['626 × 2040 mm', 'uk-626x2040', 'UK', 626, 2040, 'From the genuinely metric British range, which is taller than the imperial one at 2040 mm rather than 1981. It does not interchange with the old sizes — the frame is different.'],
  ['726 × 2040 mm', 'uk-726x2040', 'UK', 726, 2040, 'The metric range middle size. Common in houses built since the 1990s, and the reason a replacement door bought by eye often turns out 59 mm too short.'],
  ['826 × 2040 mm', 'uk-826x2040', 'UK', 826, 2040, 'The metric equivalent of the 838 imperial door, and the usual accessible width in newer British construction.'],
  ['926 × 2040 mm', 'uk-926x2040', 'UK', 926, 2040, 'The widest of the standard metric range, used where a door has to take a wheelchair with room to manoeuvre.'],
  ['24 × 80 in', 'us-24x80', 'US', 24 * IN, 80 * IN, 'The narrowest standard American interior door, 610 mm. Closets, pantries and linen cupboards — narrow enough that a person turns sideways.'],
  ['28 × 80 in', 'us-28x80', 'US', 28 * IN, 80 * IN, 'A closet and small-bathroom width at 711 mm. Below the accessible minimum and not used on main rooms in new construction.'],
  ['30 × 80 in', 'us-30x80', 'US', 30 * IN, 80 * IN, 'The common American interior door at 762 mm — the same leaf width as the British standard, on a taller frame. Bedrooms and bathrooms in most existing housing.'],
  ['32 × 80 in', 'us-32x80', 'US', 32 * IN, 80 * IN, 'The width most often specified in new American construction, 813 mm. It is a size chosen for accessibility, and it is the smallest that gets close: ADA asks for 32 inches of *clear* opening, which a 32-inch door does not quite deliver once the open leaf and stop are subtracted.'],
  ['36 × 80 in', 'us-36x80', 'US', 36 * IN, 80 * IN, 'Three feet, 914 mm. The American entry door standard, and the interior width that genuinely provides 32 inches of clear opening — which is why accessible design specifies it rather than a 32-inch door.'],
];

const REGION = { UK: 'United Kingdom', US: 'North America' };
// A rough opening is the hole in the wall. It has to take the leaf, the frame
// on both sides, and enough slack to plumb the frame square.
const ROUGH_W = 50; // mm each side for frame plus shimming
const ROUGH_H = 60; // mm above, plus the frame head
const f0 = (v) => Math.round(v);
const inch = (mm) => {
  const v = mm / IN;
  return Math.abs(v - Math.round(v)) < 0.05 ? String(Math.round(v)) : v.toFixed(1);
};
const feetIn = (mm) => {
  const total = Math.round(mm / IN);
  return `${Math.floor(total / 12)}′ ${total % 12}″`;
};

export default async function () {
  const pages = [];

  const rows = DOORS.map(([name, id, region, w, h, note]) => ({
    name, id, region, w, h, note,
    roughW: w + 2 * ROUGH_W,
    roughH: h + ROUGH_H,
    // Clear opening: the leaf swings back but the stop and the leaf thickness
    // eat into the gap. About 45 mm is the usual loss on a standard hinge.
    clear: w - 45,
  }));

  for (const r of rows) {
    const sameW = rows.filter((x) => x.id !== r.id && Math.abs(x.w - r.w) < 6);
    const near = rows.filter((x) => x.id !== r.id && x.region === r.region && Math.abs(x.w - r.w) <= 130).slice(0, 6);
    const exactInches = Math.abs(r.w / IN - Math.round(r.w / IN)) < 0.02;

    const FAQ = faq([
      { q: `What is the rough opening for a ${r.name} door?`,
        a: `About <strong>${f0(r.roughW)} × ${f0(r.roughH)} mm</strong> (${inch(r.roughW)} × ${inch(r.roughH)} in). The opening has to take the leaf, the frame on both sides and enough slack to plumb it — roughly ${ROUGH_W} mm each side and ${ROUGH_H} mm above. <strong>Never order a door against the size of the hole.</strong>` },
      { q: `How wide is the actual opening once the door is open?`,
        a: `About <strong>${f0(r.clear)} mm</strong> of clear width. The leaf swings back but its thickness and the door stop stay in the way, so roughly 45 mm is lost. This is the figure accessibility rules are written against, not the door width.` },
      sameW.length
        ? { q: `Is a ${r.name} the same as ${sameW.map((x) => x.name).join(' or ')}?`,
            a: `The leaf is the same width. ${sameW.map((x) => `A ${REGION[x.region]} ${x.name} is ${f0(x.h)} mm tall against ${f0(r.h)} here — ${f0(Math.abs(x.h - r.h))} mm ${x.h > r.h ? 'taller' : 'shorter'}`).join('; ')}. The frames are not interchangeable even though the widths match.` }
        : { q: `What is a ${r.name} door used for?`, a: r.note },
      exactInches
        ? { q: `Why is ${f0(r.w)} mm such an odd number?`,
            a: `Because it is not a metric size. ${f0(r.w)} mm is exactly <strong>${inch(r.w)} inches</strong>, or ${feetIn(r.w)} — a British door size from before metrication, converted rather than redesigned. The same goes for the 1981 mm height, which is exactly 78 inches.` }
        : { q: `What height is a ${r.name} door?`,
            a: `<strong>${f0(r.h)} mm</strong> (${inch(r.h)} in). ${r.h === 2040 ? 'This is the taller genuinely metric British range, 59 mm above the old 1981 mm imperial standard — the two do not interchange.' : ''}` },
    ]);

    pages.push({
      path: `/door-size/${r.id}/`,
      title: `${r.name} Door — ${f0(r.roughW)} × ${f0(r.roughH)} mm Rough Opening | Toolman`,
      desc: `A ${r.name} door leaf needs a rough opening of about ${f0(r.roughW)} × ${f0(r.roughH)} mm and gives ${f0(r.clear)} mm of clear width when open. ${REGION[r.region]} standard.`,
      h1: `${r.name} door`,
      crumbs: [{ name: 'Door sizes', path: '/door-size/' }, { name: r.name, path: `/door-size/${r.id}/` }],
      jsonld: [FAQ.schema],
      body: `<p class="big" style="font-size:1.6rem;margin:.3em 0"><strong>${f0(r.w)} × ${f0(r.h)} mm</strong></p>
<p class="muted">${inch(r.w)} × ${inch(r.h)} in · ${feetIn(r.w)} × ${feetIn(r.h)} · ${REGION[r.region]}${exactInches ? ' · an exact inch size in millimetres' : ''}</p>

<h2>What this door is for</h2>
<p>${r.note}</p>

<h2>Three measurements, not one</h2>
<p>A door has a leaf size, a rough opening and a clear width, and they are all different. Ordering against the wrong one is the usual way a door arrives that does not fit.</p>
<table><thead><tr><th></th><th>Millimetres</th><th>Inches</th><th>What it is</th></tr></thead><tbody>
<tr><td><strong>Leaf</strong></td><td>${f0(r.w)} × ${f0(r.h)}</td><td>${inch(r.w)} × ${inch(r.h)}</td><td class="muted">The door itself — what you order</td></tr>
<tr><td><strong>Rough opening</strong></td><td>${f0(r.roughW)} × ${f0(r.roughH)}</td><td>${inch(r.roughW)} × ${inch(r.roughH)}</td><td class="muted">The hole in the wall, allowing for frame and shimming</td></tr>
<tr><td><strong>Clear width</strong></td><td>${f0(r.clear)}</td><td>${inch(r.clear)}</td><td class="muted">What you can actually walk through with the door open</td></tr>
</tbody></table>
<p>The clear width is the one that matters for getting furniture through and the one accessibility rules are written against — <strong>a ${inch(r.w)}-inch door does not give a ${inch(r.w)}-inch opening</strong>, because the leaf thickness and the stop remain in the way.</p>

${sameW.length ? `<h2>Same width, different door</h2>
<p>${sameW.map((x) => `A ${REGION[x.region]} <a href="/door-size/${x.id}/">${x.name}</a> has the same ${f0(r.w)} mm leaf width and is ${f0(Math.abs(x.h - r.h))} mm ${x.h > r.h ? 'taller' : 'shorter'}.`).join(' ')} Matching widths do not make frames interchangeable.</p>` : ''}

${near.length ? `<h2>Other ${REGION[r.region]} sizes</h2>
<table><thead><tr><th>Door</th><th>Leaf</th><th>Rough opening</th><th>Clear width</th></tr></thead><tbody>
${near.sort((a, b) => a.w - b.w).map((x) => `<tr><td><a href="/door-size/${x.id}/">${esc(x.name)}</a></td><td>${f0(x.w)} × ${f0(x.h)} mm</td><td>${f0(x.roughW)} × ${f0(x.roughH)} mm</td><td>${f0(x.clear)} mm</td></tr>`).join('')}
</tbody></table>` : ''}

${FAQ.html}

<p><a href="/door-size/">All door sizes</a> · <a href="/convert/">Unit converters</a></p>`,
    });
  }

  const uk = rows.filter((r) => r.region === 'UK');
  const us = rows.filter((r) => r.region === 'US');
  const uk762 = rows.find((r) => r.id === 'uk-762x1981');
  const us30 = rows.find((r) => r.id === 'us-30x80');

  pages.push({
    path: '/door-size/',
    title: 'Door Sizes — Leaf, Rough Opening and Clear Width | Toolman',
    desc: 'Every standard door size with its leaf dimensions, the rough opening it needs and the clear width it gives. British "metric" doors are exact inch sizes — 762 mm is 30 inches.',
    h1: 'Door sizes',
    crumbs: [{ name: 'Door sizes', path: '/door-size/' }],
    body: `<p class="muted">${rows.length} standard door sizes with the three measurements that matter: the leaf, the hole it needs, and the gap you can walk through.</p>

<h2>The door is not the hole</h2>
<p>Three numbers describe every doorway and only one of them is the door.</p>
<ul>
<li><strong>Leaf</strong> — the door itself. This is what you order.</li>
<li><strong>Rough opening</strong> — the hole framed in the wall, about ${ROUGH_W} mm wider on each side to take the frame and enough slack to plumb it square.</li>
<li><strong>Clear width</strong> — what is actually left when the door is open, roughly 45 mm less than the leaf, because the stop and the leaf thickness stay in the way.</li>
</ul>
<p>Ordering a door against the rough opening gets one about 100 mm too wide; specifying accessibility against the leaf width overstates the opening by about 45 mm. Both are common and both are expensive.</p>

<h2>British "metric" doors are inches</h2>
<p>The standard British internal door is <strong>${f0(uk762.w)} × ${f0(uk762.h)} mm</strong>, which looks like an arbitrary metric figure and is not one: ${f0(uk762.w)} mm is exactly <strong>${inch(uk762.w)} inches</strong> and ${f0(uk762.h)} mm is exactly ${inch(uk762.h)} — ${feetIn(uk762.w)} by ${feetIn(uk762.h)}. The whole imperial range was converted after metrication rather than redesigned, which is why every number in it is odd.</p>
<p>The genuinely metric British range is separate and taller — 626, 726, 826 and 926 mm wide at <strong>2040 mm</strong> rather than 1981. That is 59 mm of difference, and it is the reason a replacement door bought on width alone so often turns out to be the wrong height.</p>

<h2>British sizes</h2>
<table><thead><tr><th>Door</th><th>Leaf</th><th>Imperial</th><th>Rough opening</th><th>Clear width</th></tr></thead><tbody>
${uk.map((r) => `<tr><td><a href="/door-size/${r.id}/">${esc(r.name)}</a></td><td>${f0(r.w)} × ${f0(r.h)} mm</td><td>${feetIn(r.w)} × ${feetIn(r.h)}</td><td>${f0(r.roughW)} × ${f0(r.roughH)} mm</td><td>${f0(r.clear)} mm</td></tr>`).join('')}
</tbody></table>

<h2>American sizes</h2>
<p>American interior doors are ${inch(us30.h)} inches tall — ${f0(us30.h)} mm, which is ${f0(us30.h - uk762.h)} mm taller than the British imperial standard. Widths run in even inches.</p>
<table><thead><tr><th>Door</th><th>Leaf</th><th>Millimetres</th><th>Rough opening</th><th>Clear width</th></tr></thead><tbody>
${us.map((r) => `<tr><td><a href="/door-size/${r.id}/">${esc(r.name)}</a></td><td>${inch(r.w)} × ${inch(r.h)} in</td><td>${f0(r.w)} × ${f0(r.h)} mm</td><td>${inch(r.roughW)} × ${inch(r.roughH)} in</td><td>${inch(r.clear)} in</td></tr>`).join('')}
</tbody></table>

<h2>Accessibility asks for clear width, not door width</h2>
<p>American guidance asks for <strong>32 inches of clear opening</strong>, and a 32-inch door does not give it — about 45 mm goes to the leaf and stop, leaving roughly ${inch(rows.find((r) => r.id === 'us-32x80').clear)} inches. A 36-inch door is what actually delivers 32 inches of clear width, which is why accessible design specifies it. British guidance asks for 750 mm clear, which a ${f0(uk762.w)} mm leaf also fails to provide — the 838 mm door is the one that does.</p>
<p>This is the practical reason the rule is worth knowing: the number in the regulation and the number on the door are measuring different things.</p>

<h2>Which way the door swings, and why it is named twice</h2>
<p>Handing is described from the side the door opens <em>towards</em> you, which is the convention almost everyone gets backwards on the first try. Stand where the door swings to meet you: hinges on the left is a left-hand door, hinges on the right is a right-hand door.</p>
<p>The complication is that American and British suppliers describe the same door differently — a British "left-hand" is frequently an American "right-hand", because the two traditions disagree about which side you stand on. Ordering across the two markets, give the hinge side and the direction of swing in words rather than trusting the label: "hinges on the left, opens away from the hallway" cannot be misread.</p>
<p>Getting it wrong is not fatal for an internal door — most leaves are reversible and the frame is not — but a fire door with intumescent strips, a rebated pair, or anything with a lock morticed to one side is handed for good and cannot be turned round.</p>

<h2>Height is standardised harder than width</h2>
<p>Door widths vary by room and by country; heights barely move. Britain settled on 1981 mm — 6 feet 6 inches — for internal doors and holds it across nearly every width, and North America uses 80 inches, 2032 mm, just as consistently. A door that is not one of those two heights is either a made-to-order piece or from before the standard.</p>
<p>That consistency is what makes the rough opening arithmetic simple: add the frame and the clearance to a known height rather than measuring it. It is also why a door bought in the wrong country fits the width of an opening and misses the height by 51 mm, which is exactly the two inches between the two standards and far too much to trim off a hollow-core leaf.</p>

<p><a href="/convert/">Unit converters</a> · <a href="/lumber/">Lumber sizes</a> · <a href="/thread/">Metric threads</a></p>`,
  });

  return pages;
}
