import { esc, faq, ring } from '../layout.mjs';

// `london to new york time difference` has no Google widget. Page one is
// 24 Time Zones, Savvy Time and World Time Buddy — the same mid-tier converters
// that hold the abbreviation pairs — plus lovemarche.com, a site with no
// standing in the subject at all. A field a random blog can rank in is a field
// this site can rank in.
//
// People search cities, not abbreviations. `bst to est` and `london to new york
// time difference` are the same question and only one of them is asked often.
// The abbreviation pages at /convert/ answer the first; this answers the second.
//
// The content the incumbents handle worst is the reason the pair pages are
// worth writing: **the gap is not constant**. London and New York are five
// hours apart for most of the year and four for about three weeks, because the
// EU and the US change their clocks on different dates. Every converter states
// one number. This states the number, the exception and when it applies.

// [id, city, country, base UTC offset, daylight-saving rule]
//
// Rules, by when the clocks go forward and back:
//   eu   last Sunday in March    → last Sunday in October
//   us   second Sunday in March  → first Sunday in November
//   au   first Sunday in October → first Sunday in April   (southern summer)
//   nz   last Sunday in September→ first Sunday in April   (southern summer)
//   none no daylight saving at all
const CITIES = [
  ['london', 'London', 'the United Kingdom', 0, 'eu'],
  ['dublin', 'Dublin', 'Ireland', 0, 'eu'],
  ['lisbon', 'Lisbon', 'Portugal', 0, 'eu'],
  ['paris', 'Paris', 'France', 1, 'eu'],
  ['berlin', 'Berlin', 'Germany', 1, 'eu'],
  ['madrid', 'Madrid', 'Spain', 1, 'eu'],
  ['rome', 'Rome', 'Italy', 1, 'eu'],
  ['amsterdam', 'Amsterdam', 'the Netherlands', 1, 'eu'],
  ['stockholm', 'Stockholm', 'Sweden', 1, 'eu'],
  ['warsaw', 'Warsaw', 'Poland', 1, 'eu'],
  ['athens', 'Athens', 'Greece', 2, 'eu'],
  ['helsinki', 'Helsinki', 'Finland', 2, 'eu'],
  ['istanbul', 'Istanbul', 'Türkiye', 3, 'none'],
  ['moscow', 'Moscow', 'Russia', 3, 'none'],
  ['dubai', 'Dubai', 'the United Arab Emirates', 4, 'none'],
  ['karachi', 'Karachi', 'Pakistan', 5, 'none'],
  ['delhi', 'Delhi', 'India', 5.5, 'none'],
  ['dhaka', 'Dhaka', 'Bangladesh', 6, 'none'],
  ['bangkok', 'Bangkok', 'Thailand', 7, 'none'],
  ['jakarta', 'Jakarta', 'Indonesia', 7, 'none'],
  ['singapore', 'Singapore', 'Singapore', 8, 'none'],
  ['hong-kong', 'Hong Kong', 'Hong Kong', 8, 'none'],
  ['beijing', 'Beijing', 'China', 8, 'none'],
  ['manila', 'Manila', 'the Philippines', 8, 'none'],
  ['perth', 'Perth', 'Australia', 8, 'none'],
  ['tokyo', 'Tokyo', 'Japan', 9, 'none'],
  ['seoul', 'Seoul', 'South Korea', 9, 'none'],
  ['brisbane', 'Brisbane', 'Australia', 10, 'none'],
  ['sydney', 'Sydney', 'Australia', 10, 'au'],
  ['melbourne', 'Melbourne', 'Australia', 10, 'au'],
  ['auckland', 'Auckland', 'New Zealand', 12, 'nz'],
  ['new-york', 'New York', 'the United States', -5, 'us'],
  ['toronto', 'Toronto', 'Canada', -5, 'us'],
  ['chicago', 'Chicago', 'the United States', -6, 'us'],
  ['mexico-city', 'Mexico City', 'Mexico', -6, 'none'],
  ['denver', 'Denver', 'the United States', -7, 'us'],
  ['los-angeles', 'Los Angeles', 'the United States', -8, 'us'],
  ['vancouver', 'Vancouver', 'Canada', -8, 'us'],
  ['anchorage', 'Anchorage', 'the United States', -9, 'us'],
  ['honolulu', 'Honolulu', 'the United States', -10, 'none'],
  ['sao-paulo', 'São Paulo', 'Brazil', -3, 'none'],
  ['buenos-aires', 'Buenos Aires', 'Argentina', -3, 'none'],
  ['lima', 'Lima', 'Peru', -5, 'none'],
  ['lagos', 'Lagos', 'Nigeria', 1, 'none'],
  ['johannesburg', 'Johannesburg', 'South Africa', 2, 'none'],
  ['nairobi', 'Nairobi', 'Kenya', 3, 'none'],
];

const CITY_NOTE = {
  'london': `London is the reference the rest of the system is measured from: Greenwich sits inside the city, and UTC±0 is its winter time. It does not stay there — Britain moves to UTC+1 for seven months of the year, which is why "London is GMT" is wrong more often than it is right.`,
  'dublin': `Ireland is the only country whose summer time is legally the standard and whose winter time is the deviation — Irish Standard Time is UTC+1 and the clocks go *back* to UTC in October. The result is identical to Britain's and the legal description is inverted, which occasionally matters in contracts.`,
  'lisbon': `Portugal keeps UTC, an hour behind neighbouring Spain despite sitting further west than most of it. The country tried Central European Time from 1992 to 1996 and abandoned it after schoolchildren were leaving home in the dark, which is the clearest natural experiment anyone has run on the question.`,
  'paris': `France is on Central European Time and geographically should not be — Paris sits almost on the Greenwich meridian. It has been an hour ahead of the sun since the occupation in 1940 and never went back, which is why sunset in Paris is so much later than in London for the same latitude.`,
  'berlin': `Berlin runs Central European Time, the offset shared by most of the continent from Spain to Poland. That single zone spans nearly 40 degrees of longitude, so noon by the clock and noon by the sun are three hours apart between its ends.`,
  'madrid': `Spain is on Central European Time and sits west of Britain — Madrid is at the same longitude as Cardiff and keeps clocks an hour ahead of it. Franco moved the country onto German time in 1940 and it stayed, which is the reason Spanish dinner is at ten.`,
  'rome': `Italy keeps Central European Time and is one of the few large European countries whose geography actually suits it, sitting near the 15th meridian the zone is defined on. Noon by the clock in Rome is close to noon by the sun.`,
  'amsterdam': `The Netherlands kept its own offset of UTC+00:19:32 until 1937 — nineteen and a half minutes, set on Amsterdam itself. It moved to a round twenty minutes, then to Central European Time under occupation, and stayed there.`,
  'stockholm': `Sweden is on Central European Time and far enough north that the offset is the least of the scheduling problem: midsummer daylight runs past midnight in the north of the country and December sun barely clears the horizon.`,
  'warsaw': `Poland sits at the eastern edge of Central European Time, so its clocks run further from the sun than any other country in the zone — sunrise in Warsaw in December is after 7:40 while Madrid, three time-zone-widths west, is on the same clock.`,
  'athens': `Greece keeps Eastern European Time, an hour ahead of most of the continent, and changes clocks on the same weekend as the rest of the EU. The gap to Central Europe is therefore fixed all year, which is unusual for a cross-border pair.`,
  'helsinki': `Finland is on Eastern European Time and has campaigned harder than any other member state to end clock changes across the EU — the 2018 petition that put the question to the Commission was largely Finnish.`,
  'istanbul': `Türkiye abandoned daylight saving in 2016 and fixed the clocks at UTC+3 permanently, so it is on what used to be its summer time all year. Winter mornings in Istanbul are correspondingly dark, and the gap to Europe changes twice a year from Europe's side alone.`,
  'moscow': `Russia stopped changing its clocks in 2014 after two years on permanent summer time, settling Moscow at UTC+3. It is the only capital in this list whose country spans eleven time zones, and "Moscow time" is used for railway timetables across all of them.`,
  'dubai': `The UAE keeps UTC+4 all year with no daylight saving, and the working week runs Monday to Friday only since 2022 — before that it was Sunday to Thursday, which made the overlap with Europe a different problem entirely.`,
  'karachi': `Pakistan is UTC+5 and fixed. Daylight saving was introduced in 2002 and again in 2008, abandoned both times within a year, and the country has not tried since.`,
  'delhi': `India runs a single zone at UTC+5:30 across nearly 30 degrees of longitude, so sunrise in the far northeast can be before five in the morning by the clock. Proposals to split the country in two have been made repeatedly and rejected each time.`,
  'dhaka': `Bangladesh is UTC+6 with no daylight saving, and its abbreviation BST collides with British Summer Time — a five-hour error that catches converter sites as often as it catches people.`,
  'bangkok': `Thailand is UTC+7 and fixed, and it counts years by the Buddhist Era, 543 ahead of the Gregorian one. A date in a Thai document may be 2569 for a year written 2026 elsewhere.`,
  'jakarta': `Indonesia spans three zones and Jakarta is on the westernmost at UTC+7. The country is wide enough that a domestic flight can cross two of them, and the eastern islands are two hours ahead of the capital.`,
  'singapore': `Singapore is UTC+8 despite sitting almost on the equator at a longitude that suggests UTC+7. It moved forward in 1982 to align with Malaysia and never moved back, so solar noon falls at about 1 PM.`,
  'hong-kong': `Hong Kong is UTC+8 all year and has been since 1979, when it dropped a summer-time arrangement that had run intermittently since the 1940s. It shares the offset with mainland China, which simplifies a great deal.`,
  'beijing': `China runs one time zone for the whole country at UTC+8, which is about five hours of sun from end to end. In Kashgar, in the far west, the sun is overhead at around 3 PM by the official clock, and local life runs on an unofficial parallel schedule.`,
  'manila': `The Philippines is UTC+8 and fixed. Its abbreviation PHT is often written PST, which collides with US Pacific Standard Time sixteen hours away — one of the more expensive collisions in this list.`,
  'perth': `Perth is UTC+8, the same as Singapore and Beijing, and is the only Australian capital that does not change its clocks. Western Australia has rejected daylight saving in four referendums, most recently in 2009.`,
  'tokyo': `Japan is UTC+9 with no daylight saving anywhere, and has not had it since the occupation ended in 1952. The whole country runs one zone and the business day starts early, so the useful overlap with Europe is Japan's late afternoon.`,
  'seoul': `South Korea is UTC+9, the same as Japan, and briefly used UTC+8:30 in 1954 and again in 1961. North Korea moved to UTC+8:30 in 2015 and back to UTC+9 in 2018 to match the South.`,
  'brisbane': `Brisbane is UTC+10 and does not change its clocks, while Sydney and Melbourne — the same offset in winter — go an hour ahead in October. For half the year Queensland is an hour behind its southern neighbours, which is a standing annoyance for anyone scheduling across the east coast.`,
  'sydney': `Sydney is UTC+10 in winter and UTC+11 from October to April. Its summer is the northern hemisphere's winter, so the gap to Europe and North America swings by two hours over the year rather than staying put.`,
  'melbourne': `Melbourne keeps the same clock as Sydney, UTC+10 in winter and UTC+11 in summer, and changes on the same dates. The pair are the reason "Australian Eastern Time" needs the Standard or Daylight qualifier to mean anything between October and April.`,
  'auckland': `New Zealand is UTC+12 in winter and UTC+13 in summer, which puts it among the first places to see each new day. Its summer time runs from late September to early April, the opposite half of the year to the northern hemisphere's.`,
  'new-york': `New York is UTC−5 in winter and UTC−4 from March to November, and it changes clocks on different weekends from Europe — a fortnight in March and a week in autumn when the transatlantic gap is an hour off what everyone expects.`,
  'toronto': `Toronto keeps the same clock as New York and changes on the same dates, so the two cities are never apart. Canada follows the US daylight-saving schedule rather than the European one, which is why Toronto and London drift for the same weeks New York and London do.`,
  'chicago': `Chicago is UTC−6 in winter, the US Central zone, and the one people most often mean by an unqualified "CST" — a reading that collides with China Standard Time fourteen hours the other way.`,
  'mexico-city': `Mexico abolished daylight saving in October 2022, so Mexico City sits at UTC−6 all year. It used to move with the US and no longer does, which means every gap to a US city now changes twice a year from the US side alone.`,
  'denver': `Denver is UTC−7 in winter, the US Mountain zone, and the smallest of the four continental US zones by population. Arizona, in the same zone, does not change its clocks, so for half the year Denver and Phoenix are an hour apart.`,
  'los-angeles': `Los Angeles is UTC−8 in winter and UTC−7 from March to November. California voted in 2018 to move to permanent daylight saving and has not been able to: the change needs an act of Congress, which has not come.`,
  'vancouver': `Vancouver keeps the same clock as Los Angeles and Seattle and changes on the same dates. British Columbia legislated for permanent daylight saving in 2019, conditional on the US west coast doing the same, and is still waiting.`,
  'anchorage': `Alaska is UTC−9 in winter, one hour behind the US Pacific coast, and covers a longitude range that would justify four zones. The state consolidated into one in 1983 so that Anchorage business hours would overlap with the rest of the country.`,
  'honolulu': `Hawaii is UTC−10 and does not change its clocks, so it drifts an hour further from the mainland every March. It is the furthest behind of any populated US zone, and the overlap with a European working day is essentially nil.`,
  'sao-paulo': `Brazil ended daylight saving in 2019, so São Paulo is UTC−3 all year. Before that the gap to Europe changed four times a year rather than twice, because the two hemispheres moved in opposite directions.`,
  'buenos-aires': `Argentina is UTC−3 and fixed, and sits at a longitude that would suggest UTC−4 — the country is effectively on permanent summer time and has been since 1969, with brief exceptions.`,
  'lima': `Peru is UTC−5 all year with no daylight saving, so it matches New York in winter and falls an hour behind it in summer. It shares the offset with Colombia and Ecuador, giving a large stretch of South America one fixed clock.`,
  'lagos': `Nigeria is UTC+1 with no daylight saving. It matches Central European Time in winter and falls an hour behind in summer, so a standing Lagos–Berlin meeting moves twice a year entirely at the European end.`,
  'johannesburg': `South Africa is UTC+2 and has not changed its clocks since two wartime years in the 1940s. The whole country keeps one zone, and the gap to the UK is two hours in winter and one in summer.`,
  'nairobi': `Kenya is UTC+3 and fixed, sitting on the equator where day length barely varies — sunrise and sunset are near six o'clock all year, which is the practical reason daylight saving has no purpose here.`,
};

const RULE = {
  eu: { forward: 'the last Sunday in March', back: 'the last Sunday in October', hemisphere: 'north' },
  us: { forward: 'the second Sunday in March', back: 'the first Sunday in November', hemisphere: 'north' },
  au: { forward: 'the first Sunday in October', back: 'the first Sunday in April', hemisphere: 'south' },
  nz: { forward: 'the last Sunday in September', back: 'the first Sunday in April', hemisphere: 'south' },
  none: null,
};

const rows = CITIES.map(([id, city, country, off, rule]) => ({ id, city, country, off, rule }));

// Every rule named on a city has to exist, or the page describes a clock change
// that never happens.
for (const r of rows) {
  if (!(r.rule in RULE)) {
    console.error(`\n✗ time-difference: ${r.city} uses the rule "${r.rule}", which is not defined`);
    process.exitCode = 1;
  }
}

// Two cities must not share a slug, and no city may pair with itself.
{
  const seen = new Map();
  for (const r of rows) {
    if (seen.has(r.id)) {
      console.error(`\n✗ time-difference: ${seen.get(r.id)} and ${r.city} both want the slug "${r.id}"`);
      process.exitCode = 1;
    }
    seen.set(r.id, r.city);
  }
}

const offStr = (off) => {
  if (off === 0) return 'UTC';
  const sign = off > 0 ? '+' : '−';
  const size = Math.abs(off);
  const whole = Math.floor(size);
  const mins = Math.round((size - whole) * 60);
  return `UTC${sign}${whole}${mins ? ':' + String(mins).padStart(2, '0') : ''}`;
};

const spanWords = (n) => {
  if (n === 0) return 'no difference';
  const size = Math.abs(n);
  const whole = Math.floor(size);
  const mins = Math.round((size - whole) * 60);
  const h = `${whole} hour${whole === 1 ? '' : 's'}`;
  if (!mins) return h;
  if (!whole) return `${mins} minutes`;
  return `${h} ${mins} minutes`;
};

// A title has no room for "4 hours 30 minutes or 5 hours 30 minutes". Half and
// three-quarter hours are written as fractions and the unit is said once.
const FRACTION = { 0.25: String.fromCharCode(188), 0.5: String.fromCharCode(189), 0.75: String.fromCharCode(190) };
const shortSpan = (n) => {
  const size = Math.abs(n);
  const whole = Math.floor(size);
  const rest = Math.round((size - whole) * 100) / 100;
  return `${whole}${FRACTION[rest] || (rest ? `.${String(rest).slice(2)}` : '')}`;
};
const gapWords = (n, from, to) =>
  n === 0 ? `${to} is the same time as ${from}` : `${to} is ${spanWords(n)} ${n > 0 ? 'ahead of' : 'behind'} ${from}`;

// A city with no note leaves its pages identical to any other city on the same
// offset, which is exactly the 95% overlap this was added to fix.
for (const r of rows) {
  if (!CITY_NOTE[r.id]) {
    console.error(`\n✗ time-difference: ${r.city} has no note, so its pages are interchangeable with any other city on ${offStr(r.off)}`);
    process.exitCode = 1;
  }
}

// Enumerating all four on/off combinations lists states that never happen. US
// summer time runs from the second Sunday in March to the first Sunday in
// November and the EU's from the last Sunday in March to the last Sunday in
// October, so the US window contains the European one and "EU on, US off" does
// not occur. A page offering it as a possibility is inventing a clock change.
//
// Approximate day-of-year for each transition, which is enough to say which
// combinations occur and roughly how long each lasts.
const TRANSITION = {
  eu: { on: 89, off: 300 },   // last Sunday in March → last Sunday in October
  us: { on: 69, off: 307 },   // second Sunday in March → first Sunday in November
  au: { on: 279, off: 96 },   // first Sunday in October → first Sunday in April
  nz: { on: 272, off: 96 },   // last Sunday in September → first Sunday in April
};

const onDst = (rule, day) => {
  if (rule === 'none') return false;
  const t = TRANSITION[rule];
  return t.on < t.off ? day >= t.on && day < t.off : day >= t.on || day < t.off;
};

// Walk the year and keep only the combinations that actually occur, with the
// number of days each one lasts.
function states(a, b) {
  const seen = new Map();
  for (let day = 0; day < 365; day++) {
    const aDst = onDst(a.rule, day);
    const bDst = onDst(b.rule, day);
    const key = `${aDst}|${bDst}`;
    const gap = (b.off + (bDst ? 1 : 0)) - (a.off + (aDst ? 1 : 0));
    const rec = seen.get(key) || { aDst, bDst, gap, days: 0 };
    rec.days++;
    seen.set(key, rec);
  }
  return [...seen.values()].sort((x, y) => y.days - x.days);
}

const clockLine = (r) => r.rule === 'none'
  ? `${r.city} does not change its clocks`
  : `${r.city} goes forward on ${RULE[r.rule].forward} and back on ${RULE[r.rule].back}`;

const hhmm = (mins) => {
  let m = ((mins % 1440) + 1440) % 1440;
  const h24 = Math.floor(m / 60), mm = m % 60;
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
  return `${h12}:${String(mm).padStart(2, '0')} ${h24 < 12 ? 'AM' : 'PM'}`;
};
const dayNote = (mins) => (mins < 0 ? ' (previous day)' : mins >= 1440 ? ' (next day)' : '');

export default async function () {
  const pages = [];
  const pairs = [];
  for (const a of rows) for (const b of rows) {
    if (a === b) continue;
    // Not "do the standard offsets differ" — Brisbane and Sydney share UTC+10
    // and are an hour apart for half the year. The test is whether the gap is
    // ever non-zero.
    if (states(a, b).every((x) => x.gap === 0)) continue;
    pairs.push([a, b]);
  }

  // A pair with no difference on any day of the year has nothing to convert.
  // Sharing a base offset is not that test.
  for (const [a, b] of pairs) {
    if (states(a, b).every((x) => x.gap === 0)) {
      console.error(`\n✗ time-difference: ${a.city} and ${b.city} are the same time on every day of the year`);
      process.exitCode = 1;
    }
  }

  // A day count of 365 does not catch a rule that never turns on — every day is
  // still counted, they simply all land in the same state, and planting that
  // passed. What has to hold is that a city with a summer-time rule spends part
  // of the year on it and part off, and that the two dates are months apart
  // rather than adjacent.
  for (const r of rows) {
    if (r.rule === 'none') continue;
    let on = 0;
    for (let day = 0; day < 365; day++) if (onDst(r.rule, day)) on++;
    if (on < 120 || on > 245) {
      console.error(`
✗ time-difference: ${r.city} is on summer time for ${on} days of the year under the "${r.rule}" rule`);
      process.exitCode = 1;
    }
  }
  for (const [a, b] of pairs) {
    const total = states(a, b).reduce((n, x) => n + x.days, 0);
    if (total !== 365) {
      console.error(`
✗ time-difference: ${a.city} to ${b.city} accounts for ${total} days of the year, not 365`);
      process.exitCode = 1;
    }
  }

  const ids = pairs.map(([a, b]) => `${a.id}-${b.id}`);

  for (const [a, b] of pairs) {
    const id = `${a.id}-${b.id}`;
    const st = states(a, b);
    // Two different on/off states can give the same gap — London and New York
    // are five hours apart both when neither is on summer time and when both
    // are — so the table has to be keyed by the gap, not by the state, or it
    // marks two rows as "the usual one".
    const byGap = new Map();
    for (const x of st) {
      const rec = byGap.get(x.gap) || { gap: x.gap, days: 0, states: [] };
      rec.days += x.days;
      rec.states.push(x);
      byGap.set(x.gap, rec);
    }
    const spans = [...byGap.values()].sort((x, y) => y.days - x.days);
    const gaps = spans.map((x) => x.gap);
    const usual = spans[0].gap;
    const varies = spans.length > 1;
    // When the largest span holds barely more of the year than the next, calling
    // it "the usual" gap is a stretch. London and Sydney sit at nine hours for
    // 26 weeks and eleven for 22.
    const dominant = spans[0].days / 365 >= 0.6;
    const weeks = (d) => d >= 14 ? `about ${Math.round(d / 7)} weeks` : d >= 7 ? 'about a week' : `about ${d} days`;
    const sameHemisphere = a.rule !== 'none' && b.rule !== 'none'
      && RULE[a.rule].hemisphere === RULE[b.rule].hemisphere;

    // Working-hours overlap, computed on the usual gap.
    const shift = usual * 60;
    const startA = Math.max(9 * 60, 9 * 60 - shift);
    const endA = Math.min(17 * 60, 17 * 60 - shift);
    const overlap = Math.max(0, endA - startA) / 60;

    const FAQ = faq([
      {
        q: `What is the time difference between ${a.city} and ${b.city}?`,
        a: `<strong>${gapWords(usual, a.city, b.city)}</strong> for most of the year.${varies ? ` It is not the same all year — ${gaps.length === 2 ? 'there is one other gap' : `there are ${gaps.length - 1} others`}, because ${clockLine(a)} and ${clockLine(b)}.` : ` The gap never changes: ${clockLine(a)} and ${clockLine(b)}.`}`,
      },
      {
        q: `Is ${b.city} ahead of ${a.city}?`,
        a: usual === 0
          ? `${a.city} and ${b.city} are on the same clock for most of the year — ${a.city} is ${offStr(a.off)} and ${b.city} is ${offStr(b.off)} on standard time, and the summer-time dates bring them together.`
          : `${usual > 0 ? `Yes — ${b.city} is ${spanWords(usual)} ahead.` : `No — ${b.city} is ${spanWords(usual)} behind.`} ${a.city} is ${offStr(a.off)} and ${b.city} is ${offStr(b.off)} on standard time.`,
      },
      {
        q: `What time is 9 AM in ${a.city} in ${b.city}?`,
        a: `<strong>${hhmm(9 * 60 + shift)}${dayNote(9 * 60 + shift)}</strong>, on the usual gap.`,
      },
      {
        q: `When can ${a.city} and ${b.city} meet?`,
        a: overlap > 0
          ? `Standard nine-to-five hours overlap for <strong>${overlap} hour${overlap === 1 ? '' : 's'}</strong>: ${hhmm(startA)}–${hhmm(endA)} in ${a.city}, which is ${hhmm(startA + shift)}–${hhmm(endA + shift)} in ${b.city}.`
          : `<strong>Nine-to-five in ${a.city} and nine-to-five in ${b.city} do not overlap at all.</strong> One side has to take the call outside working hours, and with ${spanWords(usual)} between them it is worth deciding in advance which side that is.`,
      },
    ]);

    const biggest = gaps.reduce((m, g) => Math.abs(g) > Math.abs(m) ? g : m, 0);
    const smallest = gaps.reduce((m, g) => Math.abs(g) < Math.abs(m) ? g : m, biggest);
    const oneStep = Math.abs(Math.abs(biggest) - Math.abs(smallest)) <= 1;
    const headline = smallest === 0 && biggest !== 0
      ? `Same Time or ${spanWords(biggest)}`
      : !dominant && gaps.length > 1
        ? (oneStep
            ? `${shortSpan(smallest)} or ${shortSpan(biggest)} hours`
            : `${spanWords(smallest)} to ${spanWords(biggest)}`)
        : spanWords(usual);
    const title = `${a.city} to ${b.city} Time Difference — ${headline}`;

    pages.push({
      path: `/time-difference/${id}/`,
      title: title.length <= 65 ? title : `${a.city} to ${b.city} Time Difference`,
      desc: `${gapWords(usual, a.city, b.city)} for most of the year. ${varies ? 'The gap changes when the clocks do — here is when, and by how much.' : 'Neither city changes its clocks, so the gap holds all year.'} With a conversion table and the working-hours overlap.`,
      h1: `Time difference between ${a.city} and ${b.city}`,
      crumbs: [
        { name: 'Time differences', path: '/time-difference/' },
        { name: `${a.city} to ${b.city}`, path: `/time-difference/${id}/` },
      ],
      jsonld: [FAQ.schema],
      body: `<p class="big" style="font-size:1.6rem;margin:.3em 0"><strong>${gapWords(usual, a.city, b.city)}</strong></p>
<p class="muted">${a.city}, ${a.country} is ${offStr(a.off)} · ${b.city}, ${b.country} is ${offStr(b.off)} — on standard time</p>

${varies ? `<h2>The gap is not the same all year</h2>
<p>Every converter gives one number for this pair. That number is right for most of the year and wrong for part of it, because <strong>${clockLine(a)}</strong> and <strong>${clockLine(b)}</strong>.</p>
<table><thead><tr><th>${a.city} / ${b.city} clocks</th><th>Difference</th><th>How long</th></tr></thead><tbody>
${spans.map((x) => `<tr><td>${x.states.map((y) => `${y.aDst ? 'summer' : 'standard'} / ${y.bDst ? 'summer' : 'standard'}`).join(', ')}</td><td>${x.gap === usual ? `<strong>${spanWords(x.gap)}</strong>` : spanWords(x.gap)}${x.gap === 0 ? '' : x.gap > 0 ? ' ahead' : ' behind'}</td><td>${weeks(x.days)}${x.gap === usual && dominant ? ' <span class="muted">— most of the year</span>' : ''}</td></tr>`).join('')}
</tbody></table>
<p>${a.rule !== 'none' && b.rule !== 'none' && !sameHemisphere
  ? `These two are in opposite hemispheres, so their summers do not overlap: ${a.city} is on summer time roughly when ${b.city} is not. The gap does not wobble by an hour around a settled figure — it <strong>swings between ${spanWords(gaps.reduce((m, g) => Math.abs(g) < Math.abs(m) ? g : m))} and ${spanWords(gaps.reduce((m, g) => Math.abs(g) > Math.abs(m) ? g : m))}</strong> and spends a good part of the year at each. There is no single right answer to give a calendar, which is why a recurring meeting between them is worth setting in one city's local time and letting the other side see it move.`
  : a.rule !== 'none' && b.rule !== 'none'
    ? `Both change their clocks and both are in the ${RULE[a.rule].hemisphere}ern hemisphere, but not on the same weekend — ${a.city} goes forward on ${RULE[a.rule].forward} and ${b.city} on ${RULE[b.rule].forward}. For the days in between, the gap is neither party's expected figure, and a standing meeting silently moves by an hour. That mismatch is a common cause of a missed international call.`
    : a.rule === 'none'
      ? `${a.city} stays put all year while ${b.city} moves, so the gap changes twice a year from ${b.city}'s side alone. A recurring meeting set in ${a.city}'s calendar will drift by an hour without anyone touching it.`
      : `${b.city} stays put all year while ${a.city} moves, so a meeting fixed in ${b.city}'s calendar shifts by an hour twice a year at ${a.city}'s end.`}</p>` : `<h2>The gap holds all year</h2>
<p>Neither city changes its clocks — ${clockLine(a)} and ${clockLine(b)} — so ${spanWords(usual)} is the difference in January and in July alike. That is worth knowing about this pair specifically, because most international pairs do move and a recurring meeting between them does not need checking twice a year.</p>`}

<h2>About ${a.city} and ${b.city}</h2>
<p>${CITY_NOTE[a.id]}</p>
<p>${CITY_NOTE[b.id]}</p>

<h2>When they can both be at their desks</h2>
${overlap > 0 ? `<p>Nine-to-five in both cities overlaps for <strong>${overlap} hour${overlap === 1 ? '' : 's'}</strong> — ${hhmm(startA)} to ${hhmm(endA)} in ${a.city}, the same moment as ${hhmm(startA + shift)} to ${hhmm(endA + shift)} in ${b.city}.</p>` : `<p><strong>Nine-to-five in ${a.city} and nine-to-five in ${b.city} do not overlap at all.</strong> With ${spanWords(usual)} between them, one side is always outside working hours, and the practical question is which side takes the early start or the late finish rather than when to meet.</p>`}

<h2>${a.city} to ${b.city}, hour by hour</h2>
<table><thead><tr><th>${a.city}</th><th>${b.city}</th></tr></thead><tbody>
${Array.from({ length: 24 }, (_, h) => {
  const t = h * 60 + shift;
  return `<tr><td>${hhmm(h * 60)}</td><td>${hhmm(t)}${dayNote(t)}</td></tr>`;
}).join('')}
</tbody></table>
<p class="muted">On the usual gap of ${spanWords(usual)}.</p>

${FAQ.html}

<h2>Other pairs</h2>
<ul class="linklist">${ring(ids, id, 10).map((o) => {
  const [x, y] = pairs[ids.indexOf(o)];
  return `<li><a href="/time-difference/${o}/">${esc(x.city)} to ${esc(y.city)}</a></li>`;
}).join('')}</ul>

<p><a href="/time-difference/${a.id}/">Every ${a.city} pair</a> · <a href="/time-difference/${b.id}/">Every ${b.city} pair</a> · <a href="/time-difference/">All city pairs</a> · <a href="/convert/time-zones/">Time zones by abbreviation</a></p>`,
    });
  }

  // The hub listed city names as plain text, so 1,954 pair pages had no path
  // into them from anywhere above. A page per city gives hub → city → pair and
  // keeps every pair two clicks from the section root.
  for (const c of rows) {
    const mine = pairs.filter(([a, b]) => a === c || b === c);
    const outbound = mine.filter(([a]) => a === c);
    pages.push({
      path: `/time-difference/${c.id}/`,
      title: `Time Difference Between ${c.city} and Anywhere — ${outbound.length} Cities`,
      desc: `The time difference between ${c.city} and ${outbound.length} other major cities, with the clock-change dates that move each gap. ${c.city} is ${offStr(c.off)} on standard time.`,
      h1: `${c.city} time differences`,
      crumbs: [
        { name: 'Time differences', path: '/time-difference/' },
        { name: c.city, path: `/time-difference/${c.id}/` },
      ],
      body: `<p>${c.city}, ${c.country} is <strong>${offStr(c.off)}</strong> on standard time, and ${clockLine(c).replace(`${c.city} `, '')}.</p>
<table><thead><tr><th>City</th><th>Difference from ${c.city}</th><th>Changes through the year</th></tr></thead><tbody>
${outbound.map(([a, b]) => {
  const sp = states(a, b);
  const by = new Map();
  for (const x of sp) by.set(x.gap, (by.get(x.gap) || 0) + x.days);
  const top = [...by.entries()].sort((p, q) => q[1] - p[1])[0][0];
  return `<tr><td><a href="/time-difference/${a.id}-${b.id}/">${esc(b.city)}</a></td><td>${gapWords(top, a.city, b.city).replace(`${b.city} is `, '').replace(` ${a.city}`, '')}</td><td>${by.size > 1 ? `yes — ${by.size} different gaps` : 'no'}</td></tr>`;
}).join('')}
</tbody></table>
<p><a href="/time-difference/">Every city pair</a> · <a href="/convert/time-zones/">Time zones by abbreviation</a></p>`,
    });
  }

  const byRegion = (pred, heading) => `<h3>${heading}</h3>
<ul class="cols">${rows.filter(pred).map((r) => `<li><a href="/time-difference/${r.id}/">${esc(r.city)}</a> <span class="muted">${offStr(r.off)}</span></li>`).join('')}</ul>`;

  pages.push({
    path: '/time-difference/',
    title: 'Time Difference Between Cities — Every Pair, With the Clock Changes',
    desc: `The time difference between ${rows.length} major cities, both ways. Each pair gives the usual gap, the weeks when it is different because the two places change their clocks on different dates, and the working-hours overlap.`,
    h1: 'Time differences between cities',
    crumbs: [{ name: 'Time differences', path: '/time-difference/' }],
    body: `<p>${pairs.length.toLocaleString()} city pairs, each with the usual difference, an hour-by-hour table and the overlap between nine-to-five in both places.</p>

<h2>The number every converter leaves out</h2>
<p>The difference between two cities is usually quoted as one number, and for most pairs it is one number for most of the year. It is not one number all year. <strong>The European Union changes its clocks on the last Sunday in March and the United States on the second Sunday</strong>, so for the fortnight between them London and New York are four hours apart rather than five — and a standing call moves by an hour with nobody touching it. Each pair page says which gaps apply and why.</p>

${byRegion((r) => r.off >= -10 && r.off <= -3, 'The Americas and the Pacific')}
${byRegion((r) => r.off >= 0 && r.off <= 3, 'Europe and Africa')}
${byRegion((r) => r.off > 3 && r.off <= 6, 'The Middle East and South Asia')}
${byRegion((r) => r.off > 6, 'East Asia and Oceania')}

<p><a href="/convert/time-zones/">Time zones by abbreviation</a> · <a href="/cron/">Cron schedules</a></p>`,
  });

  return pages;
}
