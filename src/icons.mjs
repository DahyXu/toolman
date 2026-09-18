// A glyph for each tool, drawn rather than named.
//
// The home page and every hub were six stacks of text cards: a bold line, a grey
// line, repeated twenty-eight times. Nothing on them was wrong and nothing was
// scannable either, because the only thing distinguishing one card from the next
// was the words, and a reader looking for the JSON formatter had to read to find
// it. A glyph is the part of a card the eye reaches before the text.
//
// Every icon is one 20×20 stroke drawing on `currentColor`, so it inherits the
// card's colour and follows the reader into dark mode without a second palette.
// They are line drawings rather than filled shapes because filled glyphs at this
// size go muddy against a tinted card, and they carry no `aria-label`: the title
// is right beside them and a screen reader announcing "braces icon, JSON
// Formatter" is worse than announcing the name once.
//
// Icons are deliberately reused across related tools. Twenty-eight distinct
// drawings at this size would mean drawing distinctions nobody can see — the
// JSON formatter and the JSON-to-CSV converter are both about braces, and
// pretending otherwise produces two glyphs the eye reads as noise.

const P = (d, extra = '') =>
  `<svg class="ico" viewBox="0 0 20 20" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}${extra}</svg>`;

const ICONS = {
  // braces — anything that formats or converts structured data
  braces: P('<path d="M7.5 3C5.8 3 5.5 4 5.5 5.5v1C6.5 8 4 8 4 8v4s2.5 0 1.5 1.5v1C5.5 16 5.8 17 7.5 17"/><path d="M12.5 3c1.7 0 2 1 2 2.5v1C13.5 8 16 8 16 8v4s-2.5 0-1.5 1.5v1c0 1.5-.3 2.5-2 2.5"/>'),
  // a key — hashing, tokens, passwords
  key: P('<circle cx="7" cy="12" r="3.2"/><path d="M9.4 9.8 16 3.5M13.6 5.9l1.6 1.6M11.9 7.6l1.6 1.6"/>'),
  // binary / base conversion
  binary: P('<path d="M3.5 6h2v8M3.5 14h4"/><rect x="11" y="4" width="5.5" height="5" rx="2.5"/><rect x="11" y="11" width="5.5" height="5" rx="2.5"/>'),
  // clock — time, dates, schedules
  clock: P('<circle cx="10" cy="10" r="7"/><path d="M10 6v4.3l2.8 1.7"/>'),
  // calendar grid — cron, age
  calendar: P('<rect x="3" y="4.5" width="14" height="12.5" rx="2"/><path d="M3 8.5h14M7 3v3M13 3v3"/><path d="M6.5 11.5h1.5M11.5 11.5H13M6.5 14h1.5M11.5 14H13"/>'),
  // link — URLs and encoding
  link: P('<path d="M8.5 11.5a3.5 3.5 0 0 0 5 0l2.5-2.5a3.5 3.5 0 0 0-5-5L9.6 5.4"/><path d="M11.5 8.5a3.5 3.5 0 0 0-5 0L4 11a3.5 3.5 0 0 0 5 5l1.4-1.4"/>'),
  // network — subnet, addressing
  network: P('<rect x="7.5" y="2.5" width="5" height="4" rx="1"/><rect x="2" y="13.5" width="5" height="4" rx="1"/><rect x="13" y="13.5" width="5" height="4" rx="1"/><path d="M10 6.5v3.5M4.5 13.5V10h11v3.5"/>'),
  // shield with a tick — permissions, chmod
  shield: P('<path d="M10 2.6 16 5v5c0 3.4-2.5 6-6 7.4C6.5 16 4 13.4 4 10V5Z"/><path d="M7.6 9.8 9.4 11.6 12.8 8"/>'),
  // percent
  percent: P('<circle cx="6.5" cy="6.5" r="2.3"/><circle cx="13.5" cy="13.5" r="2.3"/><path d="M15.5 4.5 4.5 15.5"/>'),
  // palette — colour
  palette: P('<path d="M10 3a7 7 0 0 0 0 14c1 0 1.6-.7 1.6-1.5 0-.9-.8-1.3-.8-2.2 0-.7.6-1.3 1.4-1.3H14a3 3 0 0 0 3-3c0-3.3-3.1-6-7-6Z"/><circle cx="6.6" cy="9" r=".9" fill="currentColor" stroke="none"/><circle cx="9" cy="6.2" r=".9" fill="currentColor" stroke="none"/><circle cx="12.6" cy="6.8" r=".9" fill="currentColor" stroke="none"/>'),
  // an ancient column — Roman numerals
  column: P('<path d="M4 6.5h12M5.5 6.5v8M14.5 6.5v8M10 6.5v8M3 17h14M4.5 6.5 10 3l5.5 3.5"/>'),
  // letter case
  case: P('<path d="M2.5 15 6 5l3.5 10M3.7 11.8h4.6"/><path d="M17.5 9.8c0-1.4-1-2.3-2.4-2.3-1.2 0-2.1.5-2.6 1.3M17.5 9.8V15M17.5 11.8c-3.3 0-5 .6-5 1.9 0 .9.8 1.5 2 1.5 1.5 0 3-.9 3-2.3"/>'),
  // paragraph lines — text generation and counting
  lines: P('<path d="M3.5 5h13M3.5 8.5h13M3.5 12h9M3.5 15.5h6"/>'),
  // markdown arrow in a frame
  markdown: P('<rect x="2.5" y="5" width="15" height="10" rx="2"/><path d="M5.5 12.5v-5l2 2.4 2-2.4v5"/><path d="M13 7.5v4M11.3 9.8 13 11.8l1.7-2"/>'),
  // two panes — diff
  diff: P('<rect x="2.5" y="3.5" width="6" height="13" rx="1.5"/><rect x="11.5" y="3.5" width="6" height="13" rx="1.5"/><path d="M4.2 7h2.6M4.2 10h2.6M13.2 7h2.6M13.2 13h2.6"/>'),
  // magnifier over a pattern — regex
  regex: P('<circle cx="8.8" cy="8.8" r="5.3"/><path d="M12.7 12.7 17 17"/><path d="M6.6 8.8h4.4M8.8 6.6v4.4"/>'),
  // image frame
  image: P('<rect x="2.5" y="4" width="15" height="12" rx="2"/><circle cx="7" cy="8.2" r="1.4"/><path d="M3.2 14.2 7.6 10l3 2.8 2.6-2.2 3.6 3.2"/>'),
  // compress — arrows meeting
  compress: P('<rect x="2.5" y="4" width="15" height="12" rx="2"/><path d="M8.2 7.2 6 10l2.2 2.8M11.8 7.2 14 10l-2.2 2.8M6 10h8"/>'),
  // qr — four blocks
  qr: P('<rect x="3" y="3" width="5.5" height="5.5" rx="1"/><rect x="11.5" y="3" width="5.5" height="5.5" rx="1"/><rect x="3" y="11.5" width="5.5" height="5.5" rx="1"/><path d="M11.5 11.5h2.2v2.2h-2.2zM15 15h2v2h-2zM11.5 16.5h1.5"/>'),
  // spark — AI
  spark: P('<path d="M10 2.5 11.7 7 16 8.7 11.7 10.4 10 15 8.3 10.4 4 8.7 8.3 7Z"/><path d="M15.4 13.4 16 15l1.6.6-1.6.6-.6 1.6-.6-1.6L13.2 15.6l1.6-.6Z"/>'),
  // fingerprint-ish id — uuid
  id: P('<rect x="2.5" y="4.5" width="15" height="11" rx="2"/><circle cx="7.2" cy="9.4" r="1.9"/><path d="M4.4 13.6c.5-1.3 1.6-2 2.8-2s2.3.7 2.8 2"/><path d="M12.4 8.6h3.2M12.4 11.4h3.2"/>'),
  // two sheets becoming one — merging spreadsheets on a shared column
  merge: P('<rect x="2" y="3" width="7.5" height="9" rx="1.5"/><path d="M2 6h7.5M5.2 3v9"/><rect x="10.5" y="3" width="7.5" height="9" rx="1.5"/><path d="M10.5 6h7.5M14.2 3v9"/><path d="M10 15.5h4.6M12.8 13.7l1.8 1.8-1.8 1.8"/>'),
};

// Which glyph each tool gets. A tool with no entry falls back to its category's,
// so a new tool is never iconless — it just starts generic.
const BY_SLUG = {
  'json-formatter': 'braces',
  'json-to-csv': 'braces',
  'jwt-decoder': 'braces',
  'base64-encode-decode': 'binary',
  'text-to-binary': 'binary',
  'number-base-converter': 'binary',
  'hash-generator': 'key',
  'password-generator': 'key',
  'uuid-generator': 'id',
  'timestamp-converter': 'clock',
  'age-calculator': 'calendar',
  'cron-expression-generator': 'calendar',
  'url-encode-decode': 'link',
  'subnet-calculator': 'network',
  'chmod-calculator': 'shield',
  'percentage-calculator': 'percent',
  'color-converter': 'palette',
  'roman-numeral-converter': 'column',
  'case-converter': 'case',
  'word-counter': 'lines',
  'lorem-ipsum-generator': 'lines',
  'markdown-to-html': 'markdown',
  'text-diff-checker': 'diff',
  'regex-tester': 'regex',
  'favicon-generator': 'image',
  'image-compressor': 'compress',
  'qr-code-generator': 'qr',
  'ai-token-counter': 'spark',
  'excel-vlookup': 'merge',
};

const BY_CAT = { dev: 'braces', text: 'lines', convert: 'percent', image: 'image', ai: 'spark' };

export function toolIcon(slug, cat) {
  const name = BY_SLUG[slug] || BY_CAT[cat] || 'lines';
  return ICONS[name] || ICONS.lines;
}

// Fail the build rather than ship a card with a hole in it, or an entry that
// points at a glyph that no longer exists.
export function checkIcons(tools) {
  const bad = [];
  for (const t of tools) {
    if (!BY_SLUG[t.slug]) bad.push(`${t.slug} has no icon and would fall back to its category's`);
    else if (!ICONS[BY_SLUG[t.slug]]) bad.push(`${t.slug} points at "${BY_SLUG[t.slug]}", which is not a drawing`);
  }
  for (const [slug, name] of Object.entries(BY_SLUG)) {
    if (!tools.some((t) => t.slug === slug)) bad.push(`the icon map still lists ${slug}, which is not a tool any more`);
    if (!ICONS[name]) bad.push(`${slug} points at missing glyph "${name}"`);
  }
  for (const name of Object.keys(ICONS)) {
    if (!Object.values(BY_SLUG).includes(name) && !Object.values(BY_CAT).includes(name)) {
      bad.push(`the glyph "${name}" is drawn but nothing uses it`);
    }
  }
  if (bad.length) {
    console.error(`\n✗ icons: ${bad.length} problem(s):`);
    for (const b of bad.slice(0, 8)) console.error('    ' + b);
    process.exitCode = 1;
  }
}
