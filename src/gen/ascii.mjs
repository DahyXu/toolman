import { esc, faq } from '../layout.mjs';

// One page per ASCII code point. The control characters get searched as much as
// the letters do — "what is ascii 13", "null character", "what does 0x1b do" —
// and they are the half that most tables render as an empty cell.

// [name, short label, what it actually does]
const CONTROL = {
  0: ['NUL', 'Null', 'Represents nothing at all. C uses it to mark the end of a string, which is why a C string cannot contain one and why "null-terminated" is a phrase at all. Writing a NUL into text that later reaches C code is a classic source of silent truncation.'],
  1: ['SOH', 'Start of Heading', 'Marked the beginning of a message header in teleprinter protocols. Survives in a few industrial and financial protocols — FIX messages use it as a field separator.'],
  2: ['STX', 'Start of Text', 'Marked where the header ended and the message began. Still used as a frame delimiter in serial protocols for point-of-sale and industrial equipment.'],
  3: ['ETX', 'End of Text', 'Marked the end of a message. Better known today as what Ctrl+C sends — which is why interrupting a program and copying text share a keystroke on different platforms.'],
  4: ['EOT', 'End of Transmission', 'Ended a transmission entirely. On a Unix terminal this is what Ctrl+D sends, which is why Ctrl+D at an empty prompt closes the shell: it signals end-of-file on the input.'],
  5: ['ENQ', 'Enquiry', 'Asked the receiving station to identify itself. Obsolete outside legacy serial links.'],
  6: ['ACK', 'Acknowledge', 'A positive reply — the message arrived intact. The name lives on in networking, where a TCP ACK does the same job with a different encoding.'],
  7: ['BEL', 'Bell', 'Rang the physical bell on a teletype. Terminals still beep or flash on receiving it, which is why <code>printf "\\\\a"</code> makes a noise and why a stray byte in a binary file can make your terminal chirp.'],
  8: ['BS', 'Backspace', 'Moved the print head back one position. On paper terminals this was how you overstruck characters to make bold or accented letters. Modern terminals mostly send DEL (127) for the Backspace key instead.'],
  9: ['HT', 'Horizontal Tab', 'Advances to the next tab stop. The width of a tab is a display convention rather than a property of the character, which is the entire reason tabs-versus-spaces is an argument.'],
  10: ['LF', 'Line Feed', 'Moved the paper up one line without moving the carriage. Unix and macOS use it alone to end a line; Windows uses CR+LF. This single difference is behind most "the whole file shows as changed" diffs.'],
  11: ['VT', 'Vertical Tab', 'Advanced to the next vertical tab stop. Almost never used; it survives mainly as a character that breaks naive parsers.'],
  12: ['FF', 'Form Feed', 'Ejected the page on a printer. Still used as a page break in some plain-text documents and as a section separator in Lisp and Emacs source files.'],
  13: ['CR', 'Carriage Return', 'Returned the print head to the start of the line without advancing the paper. Windows line endings are CR followed by LF because a teletype needed both movements. A lone CR is what lets a progress bar overwrite itself.'],
  14: ['SO', 'Shift Out', 'Switched to an alternate character set. A precursor to the encoding negotiation that character encodings handle today.'],
  15: ['SI', 'Shift In', 'Switched back to the standard character set.'],
  16: ['DLE', 'Data Link Escape', 'Marked the following characters as protocol control rather than data — an escaping mechanism for binary-unsafe links.'],
  17: ['DC1', 'Device Control 1 (XON)', 'Also called XON. Resumes a paused transmission. This is what Ctrl+Q sends, and why a terminal that has mysteriously frozen often unfreezes when you press it.'],
  18: ['DC2', 'Device Control 2', 'A general device control signal with no fixed modern meaning.'],
  19: ['DC3', 'Device Control 3 (XOFF)', 'Also called XOFF. Pauses transmission so a slow device can catch up. Ctrl+S sends it, which is the usual explanation for a terminal that suddenly stops responding to keystrokes.'],
  20: ['DC4', 'Device Control 4', 'A general device control signal, historically used to stop a device.'],
  21: ['NAK', 'Negative Acknowledge', 'A negative reply — the message did not arrive intact, please resend.'],
  22: ['SYN', 'Synchronous Idle', 'Sent to keep a synchronous link in step when there was no data to send. The name survives in the TCP SYN packet.'],
  23: ['ETB', 'End of Transmission Block', 'Ended one block of a message that was split across several transmissions.'],
  24: ['CAN', 'Cancel', 'Told the receiver to discard the data that came before it.'],
  25: ['EM', 'End of Medium', 'Marked the physical end of a tape or other medium.'],
  26: ['SUB', 'Substitute', 'Replaced a character that arrived corrupted. On DOS and Windows it doubled as an end-of-file marker in text mode, which is why Ctrl+Z ends console input on Windows.'],
  27: ['ESC', 'Escape', 'Introduces an escape sequence. Nearly all terminal colour, cursor movement and formatting is ESC followed by <code>[</code> and parameters — the ANSI escape codes. It is also the byte your Esc key sends.'],
  28: ['FS', 'File Separator', 'The coarsest of four data separators, intended to divide files within a stream.'],
  29: ['GS', 'Group Separator', 'Divides groups within a file. Still used in GS1 barcode data.'],
  30: ['RS', 'Record Separator', 'Divides records within a group. Occasionally used in place of a newline for data that may itself contain newlines.'],
  31: ['US', 'Unit Separator', 'The finest separator, dividing fields within a record — an unambiguous alternative to the comma in CSV, if anything supported it.'],
  127: ['DEL', 'Delete', 'On paper tape, punching all seven holes deleted a character, so DEL is 1111111 in binary and sits at the end of the table rather than the start with the other controls. Most terminals send it for the Backspace key.'],
};

// Notes for printable characters that carry more meaning than "the letter A".
const NOTE = {
  32: 'The space. Encoded like any other character, which is why a URL has to escape it as <code>%20</code> and why trailing spaces are invisible bugs.',
  33: 'Exclamation mark. In shell history expansion it re-runs a previous command, which is why <code>!</code> inside double quotes can surprise you.',
  34: 'Double quote. Must be escaped inside a JSON string as <code>\\\\"</code>, and inside an HTML attribute as <code>&amp;quot;</code>.',
  35: 'Number sign, hash or pound. Starts a comment in shell, Python, Ruby and YAML, a fragment in a URL, and a tag on social platforms.',
  36: 'Dollar sign. Introduces a variable in shell, PHP and template literals, and means end-of-string in a regular expression.',
  37: 'Percent sign. Introduces a percent-encoded byte in a URL and a format specifier in printf.',
  38: 'Ampersand. Starts an HTML entity, separates query parameters in a URL, and backgrounds a job in shell.',
  39: "Apostrophe or single quote. The most common cause of SQL injection when string concatenation is used instead of parameters.",
  42: 'Asterisk. The wildcard in shell globs and the multiplication operator nearly everywhere.',
  44: 'Comma. The separator in CSV, which is why any field containing one must be quoted.',
  46: 'Full stop or period. Matches any character in a regular expression, and separates a file name from its extension.',
  47: 'Forward slash. The path separator on Unix and in URLs, and the division operator.',
  58: 'Colon. Separates key from value in JSON and YAML, and host from port in a URL.',
  60: 'Less-than sign. Opens an HTML tag, which is why it must be escaped as <code>&amp;lt;</code> in text — failing to do so is how most cross-site scripting starts.',
  62: 'Greater-than sign. Closes an HTML tag; escaped as <code>&amp;gt;</code>.',
  63: 'Question mark. Begins the query string in a URL, and means "zero or one" in a regular expression.',
  64: 'At sign. Separates the local part from the domain in an email address.',
  92: 'Backslash. The escape character in most languages, and the path separator on Windows — which is why Windows paths in source code need doubling.',
  94: 'Caret. Means start-of-string in a regular expression, and negation inside a character class.',
  96: 'Backtick. Opens a template literal in JavaScript and command substitution in older shell scripts.',
  123: 'Left brace. Opens an object in JSON and a block in C-family languages.',
  124: 'Vertical bar. The pipe in shell, and alternation in a regular expression.',
  125: 'Right brace.',
  126: 'Tilde. Expands to the home directory in shell, and appears in URLs for user directories.',
};

const ENTITY = { 34: 'quot', 38: 'amp', 60: 'lt', 62: 'gt', 39: 'apos' };
const ESCAPE = { 0: '\\\\0', 7: '\\\\a', 8: '\\\\b', 9: '\\\\t', 10: '\\\\n', 11: '\\\\v', 12: '\\\\f', 13: '\\\\r', 27: '\\\\e', 34: '\\\\"', 39: "\\\\'", 92: '\\\\\\\\' };

const NAMES = {
  32: 'Space', 33: 'Exclamation mark', 34: 'Double quote', 35: 'Number sign', 36: 'Dollar sign',
  37: 'Percent sign', 38: 'Ampersand', 39: 'Apostrophe', 40: 'Left parenthesis', 41: 'Right parenthesis',
  42: 'Asterisk', 43: 'Plus sign', 44: 'Comma', 45: 'Hyphen-minus', 46: 'Full stop', 47: 'Solidus',
  58: 'Colon', 59: 'Semicolon', 60: 'Less-than sign', 61: 'Equals sign', 62: 'Greater-than sign',
  63: 'Question mark', 64: 'Commercial at', 91: 'Left square bracket', 92: 'Reverse solidus',
  93: 'Right square bracket', 94: 'Circumflex accent', 95: 'Low line', 96: 'Grave accent',
  123: 'Left curly bracket', 124: 'Vertical line', 125: 'Right curly bracket', 126: 'Tilde',
};

const isCtrl = (n) => n < 32 || n === 127;
const glyph = (n) => (n === 32 ? 'space' : String.fromCharCode(n));

function nameOf(n) {
  if (CONTROL[n]) return CONTROL[n][1];
  if (NAMES[n]) return NAMES[n];
  if (n >= 48 && n <= 57) return `Digit ${n - 48}`;
  if (n >= 65 && n <= 90) return `Capital letter ${String.fromCharCode(n)}`;
  if (n >= 97 && n <= 122) return `Small letter ${String.fromCharCode(n)}`;
  return 'Character';
}

function groupOf(n) {
  if (isCtrl(n)) return 'Control character';
  if (n === 32) return 'Whitespace';
  if (n >= 48 && n <= 57) return 'Digit';
  if ((n >= 65 && n <= 90) || (n >= 97 && n <= 122)) return 'Letter';
  return 'Punctuation or symbol';
}

const bin = (n) => n.toString(2).padStart(8, '0');
const hex = (n) => n.toString(16).toUpperCase().padStart(2, '0');
const oct = (n) => n.toString(8).padStart(3, '0');

export default async function () {
  const pages = [];
  const ALL = [...Array(128).keys()];

  for (const n of ALL) {
    const ctrl = CONTROL[n];
    const display = ctrl ? ctrl[0] : glyph(n);
    const name = nameOf(n);
    const ent = ENTITY[n];
    const escSeq = ESCAPE[n];
    const ctrlKey = n < 32 ? `Ctrl+${String.fromCharCode(64 + n)}` : n === 127 ? 'Delete' : null;

    const what = ctrl
      ? ctrl[2]
      : NOTE[n] ||
        (n >= 48 && n <= 57
          ? `The digit ${n - 48}. The digits occupy 48 to 57, so subtracting 48 from a digit's code gives its numeric value — the oldest trick in character handling.`
          : n >= 65 && n <= 90
            ? `The capital letter ${String.fromCharCode(n)}. Capitals run from 65 to 90 and their lowercase counterparts from 97 to 122, exactly 32 apart, so changing case is a single bit flip.`
            : n >= 97 && n <= 122
              ? `The small letter ${String.fromCharCode(n)}. Its capital is ${String.fromCharCode(n - 32)} at ${n - 32}, exactly 32 lower — the difference is bit 5, which is why case conversion is a bitwise operation.`
              : `The character ${glyph(n)}.`);

    const FAQ = faq([
      { q: `What is ASCII ${n}?`, a: `${esc(name)}${ctrl ? ` (<code>${ctrl[0]}</code>), a control character` : n === 32 ? ', the space character' : `, the character <code>${esc(glyph(n))}</code>`}. In hexadecimal it is <code>0x${hex(n)}</code>, in octal <code>0${oct(n)}</code>, and in binary <code>${bin(n)}</code>.` },
      { q: `How do I type ASCII ${n}?`, a: ctrlKey ? `Press <strong>${ctrlKey}</strong> in a terminal. In a string literal you can write it as ${escSeq ? `<code>${escSeq}</code> or ` : ''}<code>\\\\x${hex(n)}</code> in most languages.` : `Type <code>${esc(glyph(n))}</code> directly. In a string literal it can also be written <code>\\\\x${hex(n)}</code>, and in HTML as <code>&amp;#${n};</code>${ent ? ` or <code>&amp;${ent};</code>` : ''}.` },
      { q: `Is ASCII ${n} printable?`, a: isCtrl(n) ? 'No. Codes 0 to 31 and 127 are control characters — they were instructions to a teleprinter rather than marks on paper, and most terminals show nothing for them.' : 'Yes. Codes 32 to 126 are the printable range, which is every character ASCII can actually display.' },
    ]);

    const near = ALL.filter((x) => x !== n && Math.abs(x - n) <= 7);

    pages.push({
      path: `/ascii/${n}/`,
      title: `ASCII ${n} — ${name} (0x${hex(n)}, ${bin(n)}) | Toolman`,
      desc: `ASCII code ${n} is ${name}${ctrl ? ` (${ctrl[0]})` : `, the character "${glyph(n)}"`}. Hex 0x${hex(n)}, octal 0${oct(n)}, binary ${bin(n)}. What it is, how to type it, and where it is used.`,
      h1: `ASCII ${n}`,
      crumbs: [
        { name: 'Developer Tools', path: '/dev/' },
        { name: 'ASCII', path: '/ascii/' },
        { name: String(n), path: `/ascii/${n}/` },
      ],
      jsonld: [FAQ.schema],
      body: `<p class="muted">ASCII <strong>${n}</strong> is <strong>${esc(name)}</strong>${ctrl ? ` — the control character <code>${ctrl[0]}</code>` : `, written <code>${esc(display)}</code>`}.</p>

<h2>Every representation</h2>
<table><tbody>
<tr><td>Character</td><td class="out">${ctrl ? `<em>${ctrl[0]}</em> (not printable)` : esc(display)}</td></tr>
<tr><td>Name</td><td>${esc(name)}</td></tr>
<tr><td>Decimal</td><td class="out">${n}</td></tr>
<tr><td>Hexadecimal</td><td class="out">0x${hex(n)}</td></tr>
<tr><td>Octal</td><td class="out">0${oct(n)}</td></tr>
<tr><td>Binary</td><td class="out">${bin(n)}</td></tr>
<tr><td>HTML entity</td><td class="out">&amp;#${n};${ent ? ` or &amp;${ent};` : ''}</td></tr>
<tr><td>Escape sequence</td><td class="out">${escSeq || `\\x${hex(n)}`}</td></tr>
<tr><td>Unicode</td><td class="out">U+${hex(n).padStart(4, '0')}</td></tr>
${ctrlKey ? `<tr><td>Keyboard</td><td class="out">${ctrlKey}</td></tr>` : ''}
<tr><td>Group</td><td>${groupOf(n)}</td></tr>
</tbody></table>

<h2>What it is for</h2>
<p>${what}</p>

<h2>Where the number comes from</h2>
<p>${isCtrl(n)
        ? n === 127
          ? 'DEL is the odd one out. The other control characters sit at the start of the table, but DEL is at the very end because on punched paper tape it was all seven holes punched — and a punched hole cannot be un-punched, so the all-ones pattern was the only way to void a character already written.'
          : `Codes 0 to 31 were reserved for control: instructions to a teleprinter rather than characters to print. Code ${n} is <code>Ctrl+${String.fromCharCode(64 + n)}</code> because the Ctrl key was originally wired to clear the top two bits of whatever you typed, mapping the letter ${String.fromCharCode(64 + n)} at ${64 + n} down to ${n}.`
        : n >= 48 && n <= 57
          ? `The digits were placed at 48 to 57 so that <code>0</code> through <code>9</code> are contiguous and the low four bits of each code are the digit's own value: ${n} in binary is <code>${bin(n)}</code>, and the last four bits are <code>${bin(n).slice(4)}</code>, which is ${n - 48}.`
          : n >= 65 && n <= 122 && ((n >= 65 && n <= 90) || (n >= 97 && n <= 122))
            ? `The alphabet was placed so that capitals start at 65 and lowercase at 97 — exactly 32 apart, a single bit. Changing case is therefore <code>c ^ 32</code>, and this was a deliberate design decision rather than a coincidence.`
            : `Codes 32 to 126 hold the printable characters. The punctuation was distributed around the letters and digits so that the most common characters fell into positions that were convenient for the teleprinter keyboards of the time.`}</p>

${FAQ.html}

<h2>Nearby codes</h2>
<ul class="linklist">${near.map((x) => `<li><a href="/ascii/${x}/">ASCII ${x} — ${esc(CONTROL[x] ? CONTROL[x][0] : glyph(x))}</a></li>`).join('')}</ul>
<p><a href="/ascii/">Full ASCII table</a> · <a href="/text-to-binary/">Text to binary converter</a> · <a href="/number-base-converter/">Number base converter</a></p>`,
    });
  }

  const row = (n) => `<tr><td><a href="/ascii/${n}/"><strong>${n}</strong></a></td><td class="out">0x${hex(n)}</td><td class="out">${bin(n)}</td><td class="out">${CONTROL[n] ? CONTROL[n][0] : esc(glyph(n))}</td><td><a href="/ascii/${n}/">${esc(nameOf(n))}</a></td></tr>`;

  pages.push({
    path: '/ascii/',
    title: 'ASCII Table — All 128 Codes in Decimal, Hex and Binary',
    desc: 'The complete ASCII table: all 128 codes with decimal, hexadecimal, octal and binary values, HTML entities, escape sequences and what each control character actually did.',
    h1: 'ASCII table',
    crumbs: [
      { name: 'Developer Tools', path: '/dev/' },
      { name: 'ASCII', path: '/ascii/' },
    ],
    body: `<p class="muted">All 128 codes, with the control characters explained rather than left as blank cells.</p>
<p class="muted">To see a whole string in binary, hex and UTF-8 bytes at once, use the <a href="/text-to-binary/">text to binary converter</a>.</p>

<h2>Control characters (0–31)</h2>
<table><thead><tr><th style="width:4em">Dec</th><th style="width:4em">Hex</th><th style="width:6em">Binary</th><th style="width:4em">Abbr</th><th>Name</th></tr></thead><tbody>
${[...Array(32).keys()].map(row).join('')}
</tbody></table>

<h2>Printable characters (32–126)</h2>
<table><thead><tr><th style="width:4em">Dec</th><th style="width:4em">Hex</th><th style="width:6em">Binary</th><th style="width:4em">Char</th><th>Name</th></tr></thead><tbody>
${[...Array(95).keys()].map((i) => row(i + 32)).join('')}
</tbody></table>

<h2>Delete (127)</h2>
<table><tbody>${row(127)}</tbody></table>

<h2>Why the table is laid out this way</h2>
<p>ASCII is seven bits, giving 128 codes, and almost none of the arrangement is arbitrary. Three decisions are worth knowing because they are still exploited in code today.</p>
<p><strong>Digits start at 48.</strong> The low four bits of each digit code are the digit's own value, so <code>c - '0'</code> converts a character to a number, and <code>c &amp; 0x0F</code> does the same with a mask. Every parser ever written relies on this.</p>
<p><strong>Capitals and lowercase are 32 apart.</strong> A is 65 and a is 97; Z is 90 and z is 122. Thirty-two is a single bit, so <code>c ^ 32</code> flips case and <code>c | 32</code> forces lowercase. This is why case-insensitive comparison used to be free.</p>
<p><strong>Control characters map to Ctrl plus a letter.</strong> The Ctrl key originally cleared the top two bits of the keyboard code. C is 67, so Ctrl+C sends 3, which is ETX, end-of-text. That is the entire reason Ctrl+C interrupts a program, Ctrl+D signals end-of-file, and Ctrl+G makes the terminal beep.</p>

<h2>The control characters that still matter</h2>
<table>
<thead><tr><th>Code</th><th>Name</th><th>Why you still meet it</th></tr></thead>
<tbody>
<tr><td><a href="/ascii/0/">0</a></td><td>NUL</td><td>Ends a C string. A NUL in your data truncates it silently.</td></tr>
<tr><td><a href="/ascii/9/">9</a></td><td>Tab</td><td>Its width is a display convention, not a property of the character.</td></tr>
<tr><td><a href="/ascii/10/">10</a></td><td>LF</td><td>The Unix line ending, and half of the Windows one.</td></tr>
<tr><td><a href="/ascii/13/">13</a></td><td>CR</td><td>The other half. CR alone lets a progress bar overwrite its own line.</td></tr>
<tr><td><a href="/ascii/27/">27</a></td><td>ESC</td><td>Starts every ANSI escape sequence — all terminal colour and cursor movement.</td></tr>
<tr><td><a href="/ascii/127/">127</a></td><td>DEL</td><td>What most terminals actually send for the Backspace key.</td></tr>
</tbody>
</table>

<h2>ASCII, Latin-1 and UTF-8</h2>
<p>ASCII defines only 0–127. Everything above that — accented letters, currency symbols, anything non-English — belongs to some other encoding, and the confusion between them is where mojibake comes from.</p>
<p>UTF-8 was designed so that its first 128 code points are byte-for-byte identical to ASCII. Any ASCII file is already valid UTF-8, which is the single reason UTF-8 won: existing files and existing C code kept working unchanged. Characters above 127 become two to four bytes, each with its high bit set, so they can never be mistaken for an ASCII character.</p>
<p>That is why a UTF-8 file read as Latin-1 shows <code>Ã©</code> where <code>é</code> should be: the two bytes of the UTF-8 encoding are being displayed as two separate Latin-1 characters. The bytes are correct; the interpretation is not.</p>`,
  });

  return pages;
}
