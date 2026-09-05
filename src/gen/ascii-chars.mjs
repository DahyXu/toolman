import { esc, faq, ring } from '../layout.mjs';
import { CONTROL, isCtrl, nameOf } from './ascii.mjs';

// The site's 129 ASCII pages are keyed by number, and the query is keyed by
// character: "ascii code for space", "ascii value of A", "what is the ascii
// code for newline". Same shape as the port section, where the one click this
// site has ever received came from a service name rather than a port number.
//
// The competitor ranking first for "ascii code for space" has the URL
// /character/space — the direction, spelled out.

// The formal Unicode name is not what anyone types. Nobody searches "reverse
// solidus" or "commercial at"; they search backslash and at sign. The formal
// name stays on the page, the search word becomes the URL.
const SEARCH_NAME = {
  33: 'exclamation mark', 34: 'double quote', 35: 'hash', 36: 'dollar sign',
  37: 'percent sign', 38: 'ampersand', 39: 'apostrophe', 40: 'left parenthesis',
  41: 'right parenthesis', 42: 'asterisk', 43: 'plus sign', 44: 'comma',
  45: 'hyphen', 46: 'period', 47: 'forward slash', 58: 'colon', 59: 'semicolon',
  60: 'less than sign', 61: 'equals sign', 62: 'greater than sign',
  63: 'question mark', 64: 'at sign', 91: 'left bracket', 92: 'backslash',
  93: 'right bracket', 94: 'caret', 95: 'underscore', 96: 'backtick',
  123: 'left brace', 124: 'pipe', 125: 'right brace', 126: 'tilde',
  32: 'space', 127: 'delete',
  // Control characters are searched by what they do, not by their
  // teleprinter names. Nobody types "line feed" or "horizontal tab".
  0: 'null character', 7: 'bell', 8: 'backspace', 9: 'tab', 10: 'newline',
  13: 'carriage return', 27: 'escape',
};

// Escape sequences a reader is likely to need, keyed by code point.
const ESCAPES = {
  0: '\\0', 7: '\\a', 8: '\\b', 9: '\\t', 10: '\\n', 11: '\\v', 12: '\\f', 13: '\\r',
  34: '\\"', 39: "\\'", 92: '\\\\',
};

const slugFor = (n) => {
  if (SEARCH_NAME[n]) return SEARCH_NAME[n].replace(/ /g, '-');
  if (n >= 48 && n <= 57) return `digit-${n - 48}`;
  if (n >= 65 && n <= 90) return `uppercase-${String.fromCharCode(n).toLowerCase()}`;
  if (n >= 97 && n <= 122) return `lowercase-${String.fromCharCode(n)}`;
  if (CONTROL[n]) return CONTROL[n][1].toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  return `code-${n}`;
};

const searchLabel = (n) => {
  if (SEARCH_NAME[n]) return SEARCH_NAME[n];
  if (n >= 48 && n <= 57) return `the digit ${n - 48}`;
  if (n >= 65 && n <= 90) return `uppercase ${String.fromCharCode(n)}`;
  if (n >= 97 && n <= 122) return `lowercase ${String.fromCharCode(n)}`;
  return (CONTROL[n] ? CONTROL[n][1] : `code ${n}`).toLowerCase();
};

const hex = (n) => n.toString(16).toUpperCase().padStart(2, '0');
const oct = (n) => n.toString(8).padStart(3, '0');
const bin = (n) => n.toString(2).padStart(8, '0');

export default function asciiChars() {
  const codes = Array.from({ length: 128 }, (_, n) => n);
  const slugs = codes.map(slugFor);

  // A collision would silently overwrite one character's page with another's.
  const seen = new Map();
  for (let i = 0; i < codes.length; i++) {
    if (seen.has(slugs[i])) {
      console.error(`\n✗ ascii-chars: codes ${seen.get(slugs[i])} and ${codes[i]} both want the slug "${slugs[i]}"`);
      process.exitCode = 1;
    }
    seen.set(slugs[i], codes[i]);
  }
  if (seen.size !== 128) {
    console.error(`\n✗ ascii-chars: ${seen.size} distinct slugs for 128 code points`);
    process.exitCode = 1;
  }

  const pages = [];

  for (const n of codes) {
    const slug = slugFor(n);
    const formal = nameOf(n);
    const label = searchLabel(n);
    const ctrl = CONTROL[n];
    const printable = !isCtrl(n);
    const esc9 = ESCAPES[n];

    // The page says this code is this character. It has to round-trip.
    if (printable && String.fromCharCode(n).charCodeAt(0) !== n) {
      console.error(`\n✗ ascii-chars ${slug}: code ${n} does not round-trip through the character it claims`);
      process.exitCode = 1;
    }
    if (parseInt(hex(n), 16) !== n || parseInt(oct(n), 8) !== n || parseInt(bin(n), 2) !== n) {
      console.error(`\n✗ ascii-chars ${slug}: 0x${hex(n)}, 0${oct(n)} and ${bin(n)} do not all read back as ${n}`);
      process.exitCode = 1;
    }

    const FAQ = faq([
      {
        q: `What is the ASCII code for ${label}?`,
        a: `The ASCII code for ${label} is <strong>${n}</strong> in decimal, <code>0x${hex(n)}</code> in hexadecimal and <code>0${oct(n)}</code> in octal.`,
      },
      {
        q: `What is ${label} in binary?`,
        a: `<code>${bin(n)}</code> — eight bits, though ASCII only defines seven, so the top bit is always zero.`,
      },
      esc9
        ? { q: `How do I write ${label} in a string?`, a: `Most languages accept the escape <code>${esc9}</code>. Writing the raw character instead works in some contexts and breaks in others, which is what the escape exists to avoid.` }
        : { q: `Is ${label} a printable character?`, a: printable
            ? `Yes. ${formal} is in the printable range, codes 32 to 126, which is everything ASCII can put on a screen.`
            : `No. ${formal} is a control character — an instruction to a teleprinter rather than a mark on paper, which is why most tables show an empty cell for it.` },
    ]);

    const titleBase = `ASCII Code for ${label.charAt(0).toUpperCase() + label.slice(1)}`;
    const title = `${titleBase} — ${n}, 0x${hex(n)}`.length <= 65
      ? `${titleBase} — ${n}, 0x${hex(n)}`
      : titleBase;

    pages.push({
      path: `/ascii/char/${slug}/`,
      title,
      desc: `The ASCII code for ${label} is ${n} — 0x${hex(n)} in hexadecimal, 0${oct(n)} in octal, ${bin(n)} in binary. ${ctrl ? ctrl[2].replace(/<[^>]+>/g, '').slice(0, 90) : `${formal} sits in the printable range.`}`,
      h1: `ASCII code for ${label}`,
      crumbs: [
        { name: 'ASCII', path: '/ascii/' },
        { name: label, path: `/ascii/char/${slug}/` },
      ],
      jsonld: [FAQ.schema],
      body: `<p class="big" style="font-size:1.8rem;margin:.3em 0"><strong>${n}</strong></p>
<p class="muted">${formal}${printable ? ` — <code>${esc(String.fromCharCode(n))}</code>` : ' — a control character, not printable'}</p>

<table><tbody>
<tr><td>Decimal</td><td class="out">${n}</td></tr>
<tr><td>Hexadecimal</td><td class="out">0x${hex(n)}</td></tr>
<tr><td>Octal</td><td class="out">0${oct(n)}</td></tr>
<tr><td>Binary</td><td class="out">${bin(n)}</td></tr>
<tr><td>HTML entity</td><td class="out">&amp;#${n};</td></tr>
${esc9 ? `<tr><td>String escape</td><td class="out">${esc9}</td></tr>` : ''}
</tbody></table>

<h2>What it is</h2>
<p>${ctrl ? ctrl[2] : `${formal} is one of the 95 printable ASCII characters, the set every text encoding in common use still agrees on. UTF-8 encodes it as the single byte ${n}, which is why ASCII text is also valid UTF-8.`}</p>

<h2>The full entry</h2>
<p><a href="/ascii/${n}/">ASCII ${n} in full</a> — the code point page, with what sits either side of it and how the character is encoded elsewhere.</p>

${FAQ.html}

<h2>Other characters</h2>
<ul class="linklist">${ring(codes, n, 12).map((o) => `<li><a href="/ascii/char/${slugFor(o)}/">ASCII code for ${esc(searchLabel(o))}</a> — ${o}</li>`).join('')}</ul>

<p><a href="/ascii/char/">Every character by name</a> · <a href="/ascii/">The ASCII table</a> · <a href="/text-to-binary/">Text to binary converter</a></p>`,
    });
  }

  const group = (from, to, heading) => `<h2>${heading}</h2>\n<ul class="cols">${codes.slice(from, to + 1).map((n) => `<li><a href="/ascii/char/${slugFor(n)}/">${esc(searchLabel(n))}</a> — ${n}</li>`).join('')}</ul>`;

  pages.push({
    path: '/ascii/char/',
    title: 'ASCII Codes by Character Name — Space, Newline, Tab and the Rest',
    desc: 'The ASCII code for every character, looked up by name rather than by number: space is 32, newline is 10, backslash is 92. Decimal, hex, octal and binary for all 128.',
    h1: 'ASCII codes by character',
    crumbs: [
      { name: 'ASCII', path: '/ascii/' },
      { name: 'By character', path: '/ascii/char/' },
    ],
    body: `<p>The ASCII table on this site is keyed by number, which is the wrong way round for the question people usually have: you know the character and you want the code. This is the same 128 code points, keyed by name.</p>
<p>The names here are the ones people type. Code 92 is filed under <a href="/ascii/char/backslash/">backslash</a> rather than its formal name of reverse solidus, and 64 under <a href="/ascii/char/at-sign/">at sign</a> rather than commercial at — the formal name is on the page, not in the URL.</p>
${group(0, 31, 'Control characters')}
${group(32, 47, 'Punctuation and symbols')}
${group(48, 57, 'Digits')}
${group(58, 64, 'More punctuation')}
${group(65, 90, 'Uppercase letters')}
${group(91, 96, 'Brackets and marks')}
${group(97, 122, 'Lowercase letters')}
${group(123, 127, 'The last few')}
<p><a href="/ascii/">The ASCII table by number</a> · <a href="/text-to-binary/">Text to binary</a></p>`,
  });

  return pages;
}
