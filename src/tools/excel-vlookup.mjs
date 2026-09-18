export default {
  slug: 'excel-vlookup',
  cat: 'convert',
  weight: 9,
  title: 'Merge Two Excel Files',
  metaTitle: 'Merge Two Excel Files by a Matching Column | Toolman',
  short: 'Fill missing columns in one spreadsheet from another, matched on a shared key.',
  desc:
    'One spreadsheet is missing a column that another one has, and both share an ID. Match them on that column and copy the missing fields across, in your browser. Nothing is uploaded.',
  intro:
    'The VLOOKUP job, without the formula. Load the sheet that is missing something, load the sheet that has it, say which column the two have in common, and tick the columns to copy over. Both files are read in this tab and never leave it.',
  body: `<div class="tool">
  <p class="muted" style="margin:0 0 14px">Two spreadsheets, one column they both carry. Pick them below and the missing fields are copied across. <button data-act="sample" style="margin-left:6px">Show me with example data</button></p>
  <div class="grid2">
    <div>
      <label for="fa">1. The sheet missing a column</label>
      <input type="file" id="fa" accept=".xlsx,.xlsm,.csv,.txt">
      <select id="wa" hidden style="margin-top:8px" aria-label="Which sheet in file 1"></select>
      <div id="pa" hidden class="row" style="margin-top:8px"><input type="password" id="pwa" aria-label="Password for file 1" placeholder="Password for this workbook" style="flex:1;min-width:180px"><button data-act="unlocka">Unlock</button></div>
      <p class="muted" id="sa" style="font-size:.85rem;margin:.4em 0 0">No file yet.</p>
    </div>
    <div>
      <label for="fb">2. The sheet that has it</label>
      <input type="file" id="fb" accept=".xlsx,.xlsm,.csv,.txt">
      <select id="wb" hidden style="margin-top:8px" aria-label="Which sheet in file 2"></select>
      <div id="pb" hidden class="row" style="margin-top:8px"><input type="password" id="pwb" aria-label="Password for file 2" placeholder="Password for this workbook" style="flex:1;min-width:180px"><button data-act="unlockb">Unlock</button></div>
      <p class="muted" id="sb" style="font-size:.85rem;margin:.4em 0 0">No file yet.</p>
    </div>
  </div>

  <div id="setup" hidden>
    <hr>
    <div class="grid2">
      <div>
        <label for="ka">3. Column they have in common, in file 1</label>
        <select id="ka"></select>
      </div>
      <div>
        <label for="kb">The same thing, in file 2</label>
        <select id="kb"></select>
      </div>
    </div>
    <label style="margin-top:14px">4. Columns to copy from file 2</label>
    <div id="cols" class="row" style="gap:14px"></div>
    <label for="pos" style="margin-top:14px">5. Where they go in file 1</label>
    <select id="pos"></select>
    <div class="row">
      <label style="margin:0"><input type="checkbox" id="loose" checked style="width:auto"> ignore case and surrounding spaces when matching</label>
    </div>
    <div class="row">
      <button class="primary" data-act="merge">Merge</button>
      <button data-act="xlsx" id="dx" disabled>Download .xlsx</button>
      <button data-act="csv" id="dc" disabled>Download .csv</button>
    </div>
  </div>

  <div id="report"></div>
  <div id="preview" class="tw" style="max-height:420px;overflow:auto"></div>
</div>`,
  about: `<h2>What it does</h2>
<p>You have a list of orders with a customer ID but no customer name, and a second sheet that has both. This walks down the first sheet, looks each ID up in the second, and writes the name into a new column. It is what <code>VLOOKUP</code> or <code>XLOOKUP</code> does, without writing the formula, getting the range wrong, or ending up with a column of <code>#N/A</code> you then have to hunt through.</p>

<h2>The three things that go wrong</h2>
<p><strong>Keys that look identical and are not.</strong> A trailing space, or <code>ACME</code> against <code>Acme</code>, is the most common reason a lookup returns nothing for rows you can see are there. Matching ignores case and surrounding whitespace unless you turn that off.</p>
<p><strong>Duplicate keys in the second file.</strong> If an ID appears twice there, only the first row can win. That is the same thing VLOOKUP does silently; here the count is reported, because two rows for one ID usually means the file is not what you thought it was.</p>
<p><strong>Rows that match nothing.</strong> Those keep their new columns empty and are counted, so you know whether you filled 998 rows out of 1,000 or 40 out of 1,000 before you send the file on.</p>

<h2>Your formatting stays</h2>
<p>The .xlsx you download is the first file itself, not a new workbook with its values copied in. The new columns are inserted into that sheet where you choose — after any column, or before the first — the way Excel's own Insert Column works. Everything else in the file is carried over untouched: other sheets, fonts, fills, borders, column widths, frozen panes, charts and pictures. Anything that points at a cell by its column is moved along with it, so formulas, merged cells, filters, tables, data validation, conditional formatting and comments still point at the same data afterwards.</p>
<p>Each new cell takes the style of the cell to its left, so a bold header stays bold and a bordered table stays bordered. Numbers and dates keep that look but get their own number format, so a column of prices placed next to a date column does not turn into dates.</p>

<h2>Dates</h2>
<p>A date in a spreadsheet is stored as a number counting days from 1900, and which of those numbers is a date is decided by the cell's format rather than the value. The number formats are read so dates come out as dates rather than as five-digit numbers. The 1904 date system that older Mac files use is handled too.</p>

<h2>Password-protected workbooks</h2>
<p>A workbook with a password is not a zip at all: it is a container holding the real file under AES, with the key stretched from your password by tens of thousands of hash rounds. Type the password and that happens here, in the tab, which takes a second or two and is the whole point — a file somebody bothered to lock is the last file worth handing to a website. Both the Office 2007 scheme and the one used since 2010 are read. Neither the password nor the file is sent anywhere.</p>

<h2>Nothing is uploaded</h2>
<p>Both files are read with the browser's own file reader and unzipped in the tab. There is no request carrying your data anywhere, which for a sheet of customers, salaries or phone numbers is the only arrangement worth having.</p>`,
  faq: [
    {
      q: 'Does this replace VLOOKUP?',
      a: 'For the common case of copying columns from one sheet into another on a shared key, yes. VLOOKUP is still the tool when the lookup has to stay live and update as the source changes — this produces a finished file.',
    },
    {
      q: 'What happens if the same ID appears twice in the second file?',
      a: 'The first row wins and the number of duplicate keys is reported. VLOOKUP behaves the same way without telling you, which is why the count is shown: two rows for one ID usually means the second file has a different granularity than you expected.',
    },
    {
      q: 'Why are my dates showing as numbers like 45678?',
      a: 'A five-digit number where a date should be is the raw serial a spreadsheet stores dates as, counting days from 1900. This tool reads the cell number formats to tell dates from ordinary numbers, so it should not happen here. If it does, the cell was formatted as a plain number in the source file.',
    },
    {
      q: 'Does the result keep my formatting?',
      a: 'Yes. The download is your first workbook with the new columns inserted after the column you pick, not a rebuilt copy. Styles, widths, other sheets, charts, formulas, merged cells and filters are all kept, and references that pointed past the insert are moved so they still point at the same cells. If the first file is a CSV there is no formatting to keep, and a plain workbook is written instead.',
    },
    {
      q: 'Is my data uploaded anywhere?',
      a: 'No. The files are read and unzipped in your browser, the merge runs there, and the download is generated there. Nothing is sent to a server, so a sheet of customer names or salaries never leaves the machine.',
    },
    {
      q: 'Which files can it read?',
      a: 'xlsx and xlsm from Excel, Google Sheets, LibreOffice and Numbers, plus CSV. Password-protected workbooks are opened in the browser once you type the password, covering both the Office 2007 scheme and the newer one. The old binary .xls format is not readable — open it in Excel once and save it as .xlsx.',
    },
  ],
  related: ['json-to-csv', 'case-converter', 'text-diff-checker'],
  script: `
const $ = (s) => document.querySelector(s);
const books = { a: null, b: null };

// ---------- zip ----------
// An xlsx is a zip of XML. Rather than carry a zip library, walk the central
// directory ourselves and hand the deflated bytes to the browser, which has had
// an inflater behind DecompressionStream since 2022.
async function unzip(buf) {
  const dv = new DataView(buf), u8 = new Uint8Array(buf);
  let eocd = -1;
  for (let i = u8.length - 22; i >= 0 && i > u8.length - 66000; i--) {
    if (dv.getUint32(i, true) === 0x06054b50) { eocd = i; break; }
  }
  if (eocd < 0) throw new Error('not a zip file');
  const count = dv.getUint16(eocd + 10, true);
  let p = dv.getUint32(eocd + 16, true);
  const out = {};
  for (let i = 0; i < count; i++) {
    if (dv.getUint32(p, true) !== 0x02014b50) break;
    const method = dv.getUint16(p + 10, true);
    const crc = dv.getUint32(p + 16, true);
    const csize = dv.getUint32(p + 20, true);
    const usize = dv.getUint32(p + 24, true);
    const nlen = dv.getUint16(p + 28, true);
    const elen = dv.getUint16(p + 30, true);
    const clen = dv.getUint16(p + 32, true);
    const lho = dv.getUint32(p + 42, true);
    const name = new TextDecoder().decode(u8.subarray(p + 46, p + 46 + nlen));
    const lnlen = dv.getUint16(lho + 26, true);
    const lelen = dv.getUint16(lho + 28, true);
    const start = lho + 30 + lnlen + lelen;
    const raw = u8.subarray(start, start + csize);
    // The compressed bytes and their CRC are kept as read, so a part that is
    // not edited — an image, a chart, the styles — goes back into the workbook
    // byte for byte rather than through a decode and re-encode.
    out[name] = { method, raw, crc, usize };
    p += 46 + nlen + elen + clen;
  }
  for (const k of Object.keys(out)) {
    const e = out[k];
    if (!/\\.(xml|rels|vml)$/i.test(k)) continue;
    if (e.method === 0) { e.text = new TextDecoder().decode(e.raw); continue; }
    const ds = new DecompressionStream('deflate-raw');
    const blob = await new Response(new Blob([e.raw]).stream().pipeThrough(ds)).arrayBuffer();
    e.text = new TextDecoder().decode(new Uint8Array(blob));
  }
  return out;
}

// CRC32 for writing a zip back out. Rewritten parts are deflated with the
// browser's own CompressionStream; untouched parts reuse their original bytes.
const CRC = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; }
  return t;
})();
const crc32 = (u8) => { let c = 0xffffffff; for (let i = 0; i < u8.length; i++) c = CRC[(c ^ u8[i]) & 0xff] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; };

// Entries are { name, text } for parts written here, or { name, raw, method,
// crc, usize } for parts copied from the original file untouched.
async function zip(files) {
  const enc = new TextEncoder();
  const parts = [], central = [];
  let off = 0;
  for (const f of files) {
    if (f.text !== undefined) {
      const data = enc.encode(f.text);
      f.crc = crc32(data); f.usize = data.length; f.method = 8;
      f.raw = new Uint8Array(await new Response(new Blob([data]).stream().pipeThrough(new CompressionStream('deflate-raw'))).arrayBuffer());
    }
    const nb = enc.encode(f.name);
    const lh = new DataView(new ArrayBuffer(30));
    lh.setUint32(0, 0x04034b50, true); lh.setUint16(4, 20, true); lh.setUint16(6, 0x0800, true);
    lh.setUint16(8, f.method, true); lh.setUint16(12, 33, true);
    lh.setUint32(14, f.crc, true); lh.setUint32(18, f.raw.length, true);
    lh.setUint32(22, f.usize, true); lh.setUint16(26, nb.length, true);
    parts.push(new Uint8Array(lh.buffer), nb, f.raw);
    const ch = new DataView(new ArrayBuffer(46));
    ch.setUint32(0, 0x02014b50, true); ch.setUint16(4, 20, true); ch.setUint16(6, 20, true);
    ch.setUint16(8, 0x0800, true); ch.setUint16(10, f.method, true); ch.setUint16(14, 33, true);
    ch.setUint32(16, f.crc, true); ch.setUint32(20, f.raw.length, true);
    ch.setUint32(24, f.usize, true); ch.setUint16(28, nb.length, true);
    ch.setUint32(42, off, true);
    central.push(new Uint8Array(ch.buffer), nb);
    off += 30 + nb.length + f.raw.length;
  }
  const cstart = off;
  let clen = 0;
  for (const p of central) clen += p.length;
  const eo = new DataView(new ArrayBuffer(22));
  eo.setUint32(0, 0x06054b50, true);
  eo.setUint16(8, files.length, true); eo.setUint16(10, files.length, true);
  eo.setUint32(12, clen, true); eo.setUint32(16, cstart, true);
  return new Blob([...parts, ...central, new Uint8Array(eo.buffer)],
    { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
}

// ---------- sheet ----------
const colNum = (ref) => { let n = 0; for (const ch of ref) { const c = ch.charCodeAt(0); if (c < 65 || c > 90) break; n = n * 26 + (c - 64); } return n - 1; };
const colName = (n) => { let s = ''; n++; while (n > 0) { const r = (n - 1) % 26; s = String.fromCharCode(65 + r) + s; n = (n - r - 1) / 26; } return s; };

// Whether a cell holds a date is a property of its format, not its value: the
// value is a day count and 45678 is a perfectly good number as well as a
// perfectly good date. These are the built-in date formats, plus any custom one
// whose code contains a y, d, or an h — m alone is ambiguous with minutes.
const DATE_FMT = new Set([14, 15, 16, 17, 18, 19, 20, 21, 22, 27, 30, 36, 45, 46, 47, 50, 57]);
function dateStyles(styles, numFmts) {
  const set = new Set();
  styles.forEach((id, i) => {
    if (DATE_FMT.has(id)) { set.add(i); return; }
    const code = numFmts[id];
    if (code && /[ydh]/i.test(code.replace(/\\\\[\\s\\S]|"[^"]*"|\\[[^\\]]*\\]/g, ''))) set.add(i);
  });
  return set;
}
const serialToISO = (n, base1904) => {
  // Excel's calendar contains 29 February 1900, which never happened, so serials
  // above 59 are one day ahead of reality and the epoch is shifted to match.
  const epoch = base1904 ? Date.UTC(1904, 0, 1) : Date.UTC(1899, 11, 30);
  const ms = epoch + Math.round(n * 86400000);
  const d = new Date(ms);
  const iso = d.toISOString();
  return n % 1 === 0 ? iso.slice(0, 10) : iso.slice(0, 19).replace('T', ' ');
};

// Element lookup by local name, ignoring any namespace prefix.
//
// getElementsByTagName matches the qualified name in an XML document, so a
// workbook written as <x:row><x:c> — which WPS, several export libraries and
// some Excel versions produce — returned nothing at all, and the file came back
// as "no sheet has a header row". The bytes were fine; the query was.
const els = (node, name) => node.getElementsByTagNameNS('*', name);
const parsed = (xml, what) => {
  const doc = new DOMParser().parseFromString(xml, 'application/xml');
  if (doc.getElementsByTagName('parsererror').length) throw new Error('the ' + what + ' inside this file is not valid XML');
  return doc;
};

function parseSheet(xml, shared, dateSet, base1904) {
  const doc = parsed(xml, 'sheet');
  const rows = [];
  let prevRn = 0;
  for (const row of els(doc, 'row')) {
    const cells = [];
    // The real row number rides along on the array, because empty rows are
    // dropped later and writing back into the sheet needs to know where each
    // surviving row actually lives.
    cells.rn = +row.getAttribute('r') || prevRn + 1;
    prevRn = cells.rn;
    let next = 0;
    for (const c of els(row, 'c')) {
      const ref = c.getAttribute('r') || '';
      // A cell without an r attribute sits in the next column along, which is
      // what writers that omit it mean. Using cells.length instead put every
      // cell after a gap in the wrong column.
      const idx = ref ? colNum(ref) : next;
      next = idx + 1;
      const t = c.getAttribute('t');
      let v = '';
      if (t === 'inlineStr') {
        const is = els(c, 't');
        for (const n of is) v += n.textContent;
      } else {
        const vn = els(c, 'v')[0];
        const raw = vn ? vn.textContent : '';
        if (t === 's') v = shared[+raw] ?? '';
        else if (t === 'b') v = raw === '1' ? 'TRUE' : 'FALSE';
        else if (raw !== '') {
          const s = c.getAttribute('s');
          v = s !== null && dateSet.has(+s) && raw !== '' && !isNaN(+raw)
            ? serialToISO(+raw, base1904) : raw;
        }
      }
      cells[idx] = v;
    }
    for (let i = 0; i < cells.length; i++) if (cells[i] === undefined) cells[i] = '';
    rows.push(cells);
  }
  return rows;
}

// A workbook that is not a zip is either password protected or the old binary
// .xls, and both are the same OLE compound file on the outside. Telling them
// apart matters because the fix is different: one needs the password removed,
// the other needs a Save As. Guessing "corrupt file" for either is the least
// useful thing to say.
const CFB = [0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1];
function containerKind(buf) {
  const u = new Uint8Array(buf);
  if (u[0] === 0x50 && u[1] === 0x4b) return 'zip';
  if (CFB.every((b, i) => u[i] === b)) {
    // Directory names in a compound file are UTF-16LE, so the marker for an
    // encrypted package is its name with a zero byte after every character.
    const needle = 'EncryptedPackage';
    outer: for (let i = 0; i + needle.length * 2 < u.length; i += 2) {
      for (let j = 0; j < needle.length; j++) {
        if (u[i + j * 2] !== needle.charCodeAt(j) || u[i + j * 2 + 1] !== 0) continue outer;
      }
      return 'encrypted';
    }
    return 'xls';
  }
  return 'unknown';
}

// ---------- password-protected workbooks ----------
//
// An encrypted xlsx is not a zip at all. It is an OLE compound file holding two
// streams: EncryptionInfo, which describes how the key was made, and
// EncryptedPackage, which is the ordinary zip with AES over it. Decrypt that
// and everything downstream is unchanged.
//
// This is worth carrying because a workbook somebody bothered to put a password
// on is exactly the workbook they should not be uploading to a website. Doing it
// here means the password and the file both stay in the tab.

// Compound files are a filesystem: a header, a sector allocation table, a
// directory, and a second smaller allocation table for streams under 4 KB.
function readCFB(buf) {
  const dv = new DataView(buf), u8 = new Uint8Array(buf);
  const ssz = 1 << dv.getUint16(30, true);
  const msz = 1 << dv.getUint16(32, true);
  const nFat = dv.getUint32(44, true);
  const dirStart = dv.getUint32(48, true);
  const cutoff = dv.getUint32(56, true);
  const miniFatStart = dv.getUint32(60, true);
  const difatStart = dv.getUint32(68, true);
  const nDifat = dv.getUint32(72, true);
  const sec = (n) => (n + 1) * ssz;

  const difat = [];
  for (let i = 0; i < 109; i++) {
    const v = dv.getUint32(76 + i * 4, true);
    if (v === 0xffffffff) break;
    difat.push(v);
  }
  let d = difatStart;
  for (let k = 0; k < nDifat && d !== 0xffffffff && d !== 0xfffffffe; k++) {
    const base = sec(d);
    for (let i = 0; i < ssz / 4 - 1; i++) {
      const v = dv.getUint32(base + i * 4, true);
      if (v !== 0xffffffff) difat.push(v);
    }
    d = dv.getUint32(base + ssz - 4, true);
  }

  const fat = [];
  for (const f of difat.slice(0, nFat)) {
    const base = sec(f);
    for (let i = 0; i < ssz / 4; i++) fat.push(dv.getUint32(base + i * 4, true));
  }
  const chain = (start, table) => {
    const out = [];
    let s = start, guard = 0;
    while (s !== 0xfffffffe && s !== 0xffffffff && guard++ < 1e6) { out.push(s); s = table[s]; }
    return out;
  };
  const readChain = (start, size) => {
    const parts = chain(start, fat).map((s) => u8.subarray(sec(s), sec(s) + ssz));
    const all = new Uint8Array(parts.reduce((n, p) => n + p.length, 0));
    let o = 0;
    for (const p of parts) { all.set(p, o); o += p.length; }
    return all.subarray(0, size);
  };

  const dirs = [];
  for (const s of chain(dirStart, fat)) {
    for (let i = 0; i < ssz; i += 128) {
      const off = sec(s) + i;
      if (off + 128 > u8.length) break;
      // The name field is 64 bytes and the length is read from the file, so it
      // is not trusted: a padded or damaged entry claimed 65535 and sent the
      // loop off the end of the buffer. A directory name cannot exceed its own
      // field.
      const nameLen = Math.min(dv.getUint16(off + 64, true), 64);
      const type = u8[off + 66];
      if (!nameLen || (type !== 2 && type !== 5)) continue;
      let name = '';
      for (let j = 0; j + 1 < nameLen - 2; j += 2) name += String.fromCharCode(dv.getUint16(off + j, true));
      dirs.push({ name, type, start: dv.getUint32(off + 116, true), size: dv.getUint32(off + 120, true) });
    }
  }
  const root = dirs.find((e) => e.type === 5);
  const miniStream = root ? readChain(root.start, root.size) : new Uint8Array(0);
  const miniFat = [];
  for (const s of chain(miniFatStart, fat)) {
    for (let i = 0; i < ssz / 4; i++) miniFat.push(dv.getUint32(sec(s) + i * 4, true));
  }
  const readMini = (start, size) => {
    const parts = chain(start, miniFat).map((s) => miniStream.subarray(s * msz, s * msz + msz));
    const all = new Uint8Array(parts.reduce((n, p) => n + p.length, 0));
    let o = 0;
    for (const p of parts) { all.set(p, o); o += p.length; }
    return all.subarray(0, size);
  };

  const out = {};
  for (const e of dirs) {
    if (e.type !== 2) continue;
    out[e.name] = e.size < cutoff ? readMini(e.start, e.size) : readChain(e.start, e.size);
  }
  return out;
}

const HASHES = { SHA512: 'SHA-512', SHA384: 'SHA-384', SHA256: 'SHA-256', SHA1: 'SHA-1' };
const b64 = (s) => { const b = atob(s); const u = new Uint8Array(b.length); for (let i = 0; i < b.length; i++) u[i] = b.charCodeAt(i); return u; };
const cat = (...a) => { const n = a.reduce((x, y) => x + y.length, 0); const o = new Uint8Array(n); let p = 0; for (const x of a) { o.set(x, p); p += x.length; } return o; };
const le32 = (n) => { const u = new Uint8Array(4); new DataView(u.buffer).setUint32(0, n, true); return u; };

// AES-CBC without padding. WebCrypto always expects PKCS#7 on the way out, so
// one extra block is appended that decrypts to a full pad and is then stripped
// by the API itself, leaving exactly the plaintext.
async function aesCbcRaw(keyBytes, iv, ct) {
  const key = await crypto.subtle.importKey('raw', keyBytes, 'AES-CBC', false, ['encrypt', 'decrypt']);
  const last = ct.slice(ct.length - 16);
  const pad = new Uint8Array(16).fill(16);
  const tail = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-CBC', iv: last }, key, pad)).slice(0, 16);
  return new Uint8Array(await crypto.subtle.decrypt({ name: 'AES-CBC', iv }, key, cat(ct, tail)));
}

// AES-ECB, which WebCrypto does not offer. CBC with a zero IV differs from ECB
// only by the chaining XOR, so running CBC and undoing that recovers ECB:
//   CBC gives Q[i] = D(C[i]) XOR C[i-1], and ECB wants D(C[i]).
// Checked against the NIST SP 800-38A AES-128-ECB vector rather than against
// itself.
async function aesEcbRaw(keyBytes, ct) {
  const zero = new Uint8Array(16);
  const q = await aesCbcRaw(keyBytes, zero, ct);
  const out = new Uint8Array(q.length);
  for (let i = 0; i < q.length; i += 16) {
    for (let j = 0; j < 16; j++) out[i + j] = i === 0 ? q[j] : q[i + j] ^ ct[i - 16 + j];
  }
  return out;
}

// ECMA-376 standard encryption, the scheme Office 2007 wrote and plenty of
// exporters still write. Simpler than agile: SHA-1, a fixed 50,000 iterations,
// one key for the whole package, and no per-segment IVs.
async function decryptStandard(info, pkg, password, onProgress) {
  const dv = new DataView(info.buffer, info.byteOffset, info.byteLength);
  const headerSize = dv.getUint32(8, true);
  const h0 = 12;                      // EncryptionHeader begins after its size
  const keyBits = dv.getUint32(h0 + 16, true);
  const v0 = h0 + headerSize;         // EncryptionVerifier follows the header
  const saltSize = dv.getUint32(v0, true);
  const salt = info.subarray(v0 + 4, v0 + 4 + saltSize);
  const encVerifier = info.subarray(v0 + 4 + saltSize, v0 + 20 + saltSize);
  const verifierHashSize = dv.getUint32(v0 + 20 + saltSize, true);
  const encVerifierHash = info.subarray(v0 + 24 + saltSize, v0 + 24 + saltSize + 32);

  const S1 = async (b) => new Uint8Array(await crypto.subtle.digest('SHA-1', b));
  const pwBytes = new Uint8Array(password.length * 2);
  for (let i = 0; i < password.length; i++) new DataView(pwBytes.buffer).setUint16(i * 2, password.charCodeAt(i), true);

  let h = await S1(cat(salt, pwBytes));
  for (let i = 0; i < 50000; i++) {
    h = await S1(cat(le32(i), h));
    if (onProgress && i % 2500 === 0) onProgress(i / 50000);
  }
  const hFinal = await S1(cat(h, le32(0)));

  // The key comes out of two HMAC-shaped passes over the final hash rather than
  // from the hash directly.
  const pad = (v) => { const b = new Uint8Array(64).fill(v); for (let i = 0; i < hFinal.length; i++) b[i] ^= hFinal[i]; return b; };
  const key = cat(await S1(pad(0x36)), await S1(pad(0x5c))).subarray(0, keyBits / 8);

  const verifier = await aesEcbRaw(key, encVerifier);
  const wantHash = await S1(verifier.subarray(0, 16));
  const gotHash = (await aesEcbRaw(key, encVerifierHash)).subarray(0, verifierHashSize);
  for (let i = 0; i < Math.min(wantHash.length, gotHash.length); i++) {
    if (wantHash[i] !== gotHash[i]) throw new Error('wrong password');
  }

  const total = new DataView(pkg.buffer, pkg.byteOffset).getUint32(0, true);
  const body = pkg.subarray(8, 8 + Math.floor((pkg.length - 8) / 16) * 16);
  const dec = await aesEcbRaw(key, body);
  // slice, not subarray: .buffer on a view hands back the whole underlying
  // buffer, so the AES padding rode along and the file came out 5 bytes longer
  // than the length its own header declares.
  return dec.slice(0, total).buffer;
}

async function decryptAgile(info, pkg, password, onProgress) {
  // EncryptionInfo opens with a version pair, and only 4.4 — agile, Office 2010
  // and later — carries an XML descriptor. The 2007 scheme puts a binary
  // structure here instead, so hunting for a "<" byte and handing whatever
  // followed to an XML parser produced "not valid XML" for a file that was
  // never XML to begin with. Read the version and say which scheme it is.
  const iv2 = new DataView(info.buffer, info.byteOffset, info.byteLength);
  const vMajor = iv2.getUint16(0, true), vMinor = iv2.getUint16(2, true);
  if (vMinor === 2) return decryptStandard(info, pkg, password, onProgress);
  if (vMajor !== 4 || vMinor !== 4) throw new Error('this workbook uses encryption version ' + vMajor + '.' + vMinor + ', which this tool does not read');
  const xmlStart = info.indexOf(60, 8);
  if (xmlStart < 0) throw new Error('the encryption descriptor is missing from this file');
  const doc = parsed(new TextDecoder().decode(info.subarray(xmlStart)), 'encryption header');
  const kd = els(doc, 'keyData')[0];
  const pw = [...els(doc, 'encryptedKey')].find((n) => n.getAttribute('spinCount'));
  if (!kd || !pw) throw new Error('this file uses an encryption scheme this tool does not read');
  const hashName = HASHES[kd.getAttribute('hashAlgorithm').toUpperCase().replace('-', '')];
  if (!hashName) throw new Error('unsupported hash ' + kd.getAttribute('hashAlgorithm'));
  const blockSize = +kd.getAttribute('blockSize');
  const keyBytes = +pw.getAttribute('keyBits') / 8;
  const spin = +pw.getAttribute('spinCount');
  const pwSalt = b64(pw.getAttribute('saltValue'));
  const dataSalt = b64(kd.getAttribute('saltValue'));

  const H = async (b) => new Uint8Array(await crypto.subtle.digest(hashName, b));
  const pwBytes = new Uint8Array(password.length * 2);
  for (let i = 0; i < password.length; i++) new DataView(pwBytes.buffer).setUint16(i * 2, password.charCodeAt(i), true);

  let h = await H(cat(pwSalt, pwBytes));
  for (let i = 0; i < spin; i++) {
    h = await H(cat(le32(i), h));
    if (onProgress && i % 5000 === 0) onProgress(i / spin);
  }
  const blockKey = async (bk) => {
    const x = await H(cat(h, bk));
    const k = new Uint8Array(keyBytes);
    k.set(x.subarray(0, Math.min(keyBytes, x.length)));
    return k;
  };

  // Verify the password before spending time on the payload, using the pair the
  // format carries for exactly that purpose.
  const vIn = await aesCbcRaw(await blockKey(new Uint8Array([0xfe, 0xa7, 0xd2, 0x76, 0x3b, 0x4b, 0x9e, 0x79])), pwSalt, b64(pw.getAttribute('encryptedVerifierHashInput')));
  const vHash = await aesCbcRaw(await blockKey(new Uint8Array([0xd7, 0xaa, 0x0f, 0x6d, 0x30, 0x61, 0x34, 0x4e])), pwSalt, b64(pw.getAttribute('encryptedVerifierHashValue')));
  const want = await H(vIn.subarray(0, blockSize));
  for (let i = 0; i < want.length; i++) if (want[i] !== vHash[i]) throw new Error('wrong password');

  const secret = (await aesCbcRaw(await blockKey(new Uint8Array([0x14, 0x6e, 0x0b, 0xe7, 0xab, 0xac, 0xd0, 0xd6])), pwSalt, b64(pw.getAttribute('encryptedKeyValue')))).subarray(0, keyBytes);

  const total = Number(new DataView(pkg.buffer, pkg.byteOffset).getUint32(0, true));
  const body = pkg.subarray(8);
  const out = new Uint8Array(total);
  let written = 0;
  for (let seg = 0; seg * 4096 < body.length; seg++) {
    const iv = (await H(cat(dataSalt, le32(seg)))).subarray(0, blockSize);
    const part = body.subarray(seg * 4096, Math.min(body.length, (seg + 1) * 4096));
    if (!part.length) break;
    const dec = await aesCbcRaw(secret, iv, part);
    const take = Math.min(dec.length, total - written);
    out.set(dec.subarray(0, take), written);
    written += take;
    if (written >= total) break;
  }
  return out.buffer;
}

async function readXlsx(buf) {
  const z = await unzip(buf);
  const get = (n) => (z[n] ? z[n].text : '');
  const P = (x) => parsed(x, 'workbook part');

  const shared = [];
  if (z['xl/sharedStrings.xml']) {
    for (const si of els(P(get('xl/sharedStrings.xml')), 'si')) {
      let s = '';
      for (const t of els(si, 't')) {
        if (t.parentNode.nodeName === 'rPh') continue;
        s += t.textContent;
      }
      shared.push(s);
    }
  }

  const numFmts = {};
  const cellStyles = [];
  if (z['xl/styles.xml']) {
    const sd = P(get('xl/styles.xml'));
    for (const nf of els(sd, 'numFmt')) numFmts[+nf.getAttribute('numFmtId')] = nf.getAttribute('formatCode');
    const xfs = els(sd, 'cellXfs')[0];
    if (xfs) for (const xf of els(xfs, 'xf')) cellStyles.push(+(xf.getAttribute('numFmtId') || 0));
  }
  const dateSet = dateStyles(cellStyles, numFmts);

  const wb = P(get('xl/workbook.xml'));
  const pr = els(wb, 'workbookPr')[0];
  const base1904 = !!pr && (pr.getAttribute('date1904') === '1' || pr.getAttribute('date1904') === 'true');

  // Which file holds which sheet is decided by workbook.xml.rels, not by the
  // number in the filename. Taking the lowest-numbered sheetN.xml looked right
  // and was wrong for any workbook whose sheets have ever been reordered or
  // deleted: a file whose first tab lives in sheet3.xml would come back as
  // whatever sheet1.xml happens to hold, which is often an empty leftover.
  const rels = {};
  if (z['xl/_rels/workbook.xml.rels']) {
    for (const r of els(P(get('xl/_rels/workbook.xml.rels')), 'Relationship')) {
      rels[r.getAttribute('Id')] = r.getAttribute('Target').replace(/^\\/?(xl\\/)?/, '');
    }
  }
  const out = [];
  // Structure kept alongside the sheets so a file that parses to nothing can
  // say why. Part names, byte counts and element names only, never a cell
  // value: an error message is not a place to put somebody's customer list.
  const diag = { parts: Object.keys(z).length, sheets: [] };
  let index = -1;
  for (const s of els(wb, 'sheet')) {
    index++;
    const rid = s.getAttribute('r:id') || s.getAttributeNS('http://schemas.openxmlformats.org/officeDocument/2006/relationships', 'id');
    const target = rels[rid];
    const path = target ? 'xl/' + target : null;
    if (!path || !z[path]) { diag.sheets.push({ target: target || '(no rel)', missing: true }); continue; }
    const xml = get(path);
    const tags = [...new Set((xml.match(/<[a-zA-Z_][w.:-]*/g) || []).slice(0, 400).map((t) => t.slice(1)))].slice(0, 8);
    diag.sheets.push({ target, bytes: xml.length, tags });
    out.push({ name: s.getAttribute('name') || 'Sheet ' + (out.length + 1), path, index, rows: parseSheet(xml, shared, dateSet, base1904) });
  }
  // A workbook with no usable rels still has its sheets on disk; fall back to
  // filename order rather than refusing the file.
  if (!out.length) {
    const files = Object.keys(z).filter((k) => /^xl\\/worksheets\\/sheet\\d+\\.xml$/.test(k))
      .sort((a, b) => (+a.match(/(\\d+)/)[1]) - (+b.match(/(\\d+)/)[1]));
    files.forEach((f, i) => out.push({ name: 'Sheet ' + (i + 1), path: f, index: i, rows: parseSheet(get(f), shared, dateSet, base1904) }));
  }
  if (!out.length) throw new Error('no worksheet found');
  out.diag = diag;
  // Kept so the merge can be written back into this same workbook.
  out.zip = z;
  out.paths = out.map((s) => s.path);
  out.base1904 = base1904;
  return out;
}

function parseCsv(text) {
  const t = text.replace(/^\\uFEFF/, '');
  const guess = [',', ';', '\\t', '|'].map((d) => [d, (t.split('\\n')[0].match(new RegExp('\\\\' + d, 'g')) || []).length]);
  guess.sort((a, b) => b[1] - a[1]);
  const D = guess[0][1] ? guess[0][0] : ',';
  const rows = [];
  let row = [], cur = '', q = false;
  for (let i = 0; i < t.length; i++) {
    const ch = t[i];
    if (q) {
      if (ch === '"') { if (t[i + 1] === '"') { cur += '"'; i++; } else q = false; }
      else cur += ch;
    } else if (ch === '"') q = true;
    else if (ch === D) { row.push(cur); cur = ''; }
    else if (ch === '\\n') { row.push(cur); rows.push(row); row = []; cur = ''; }
    else if (ch !== '\\r') cur += ch;
  }
  if (cur !== '' || row.length) { row.push(cur); rows.push(row); }
  return rows;
}

// ---------- ui ----------
const sheetsOf = { a: [], b: [] };
const lastDiag = { a: null, b: null };
const locked = { a: null, b: null };

async function load(file, which, password) {
  const label = which === 'a' ? $('#sa') : $('#sb');
  const picker = which === 'a' ? $('#wa') : $('#wb');
  label.textContent = 'Reading…';
  label.className = 'muted';
  picker.hidden = true;
  try {
    let sheets, encrypted = false;
    if (/\\.(csv|txt)$/i.test(file.name)) {
      sheets = [{ name: file.name, rows: parseCsv(await file.text()) }];
    } else {
      const buf = await file.arrayBuffer();
      const kind = containerKind(buf);
      if (kind === 'xls') throw new Error('this is the old binary .xls format. Open it in Excel and save it as .xlsx');
      let plain = buf;
      if (kind === 'encrypted') {
        // Without a password there is nothing to do but ask for one, so the
        // file is kept and the box is shown rather than the load simply failing.
        locked[which] = { buf, name: file.name };
        (which === 'a' ? $('#pa') : $('#pb')).hidden = false;
        if (!password) throw new Error('this workbook is password protected. Type its password below and press Unlock.');
        const streams = readCFB(buf);
        if (!streams.EncryptionInfo || !streams.EncryptedPackage) throw new Error('this looks encrypted but does not carry the streams this tool reads');
        label.textContent = 'Deriving the key… this takes a few seconds';
        plain = await decryptAgile(streams.EncryptionInfo, streams.EncryptedPackage, password,
          (f) => { label.textContent = 'Deriving the key… ' + Math.round(f * 100) + '%'; });
        (which === 'a' ? $('#pa') : $('#pb')).hidden = true;
        encrypted = true;
      } else if (kind !== 'zip') {
        throw new Error('this does not look like a spreadsheet');
      }
      sheets = await readXlsx(plain);
      lastDiag[which] = sheets.diag || null;
    }
    sheetsOf[which] = sheets.map((s) => ({
      name: s.name,
      path: s.path,
      index: s.index,
      rows: s.rows.filter((r) => r.some((c) => String(c).trim() !== '')),
    }));
    const usable = sheetsOf[which].filter((s) => s.rows.length >= 2);
    // When this fails there is nothing on screen to debug with, and "no data"
    // covers a wrong sheet, an unreadable one and a genuinely empty one alike.
    // Say what was actually found instead.
    if (!usable.length) {
      const seen = sheetsOf[which].map((s) => '“' + s.name + '” ' + s.rows.length + ' rows').join(', ');
      const d = lastDiag[which];
      const detail = d ? ' | zip has ' + d.parts + ' parts; ' + d.sheets.map((x) =>
        x.missing ? x.target + ' MISSING' : x.target + ' ' + x.bytes + ' bytes, tags: ' + (x.tags.join(' ') || 'none')).join(' ;; ') : '';
      throw new Error('found ' + sheetsOf[which].length + ' sheet' + (sheetsOf[which].length === 1 ? '' : 's') +
        ' but none had a header row and a row of data — ' + (seen || 'nothing readable') + detail +
        ' — paste this whole line back and it will say where the parser stopped.');
    }
    picker.innerHTML = sheetsOf[which].map((s, i) =>
      '<option value="' + i + '"' + (s.rows.length < 2 ? ' disabled' : '') + (s === usable[0] ? ' selected' : '') + '>' +
      s.name.replace(/</g, '&lt;') + (s.rows.length < 2 ? ' (empty)' : ' — ' + (s.rows.length - 1) + ' rows') + '</option>').join('');
    picker.hidden = sheetsOf[which].length < 2;
    picker.onchange = () => { pick(which); ready(); };
    books[which] = { file: file.name, zip: sheets.zip || null, paths: sheets.paths, base1904: !!sheets.base1904, encrypted };
    pick(which);
  } catch (e) {
    books[which] = null;
    sheetsOf[which] = [];
    label.textContent = 'Could not read this file: ' + e.message;
    label.className = 'err';
  }
  ready();
}

function pick(which) {
  const picker = which === 'a' ? $('#wa') : $('#wb');
  const label = which === 'a' ? $('#sa') : $('#sb');
  const s = sheetsOf[which][+picker.value];
  if (!s) return;
  // How wide the sheet is cannot be read off row 1. A workbook whose first row
  // holds a title in A1 and whose real header starts on row 2 reported one
  // column and offered a single entry in the dropdown. Take the widest of the
  // first rows instead, and treat the first row that reaches that width as the
  // header — which skips a title row without being told about it.
  const SCAN = 10;
  const width = Math.max(...s.rows.slice(0, SCAN).map((r) => r.length), 1);
  let hi = s.rows.slice(0, SCAN).findIndex((r) => r.length >= width);
  if (hi < 0) hi = 0;
  const headRow = s.rows[hi] || [];
  // Two names per column: what the file calls it, and what the dropdowns show.
  // The letter is always there because a header cell can be empty, merged, or
  // something nobody would recognise out of context.
  const head = Array.from({ length: width }, (_, i) => String(headRow[i] ?? '').trim() || colName(i));
  const labels = Array.from({ length: width }, (_, i) => {
    const t = String(headRow[i] ?? '').trim();
    return t ? colName(i) + ' — ' + t : colName(i);
  });
  const prev = books[which] || {};
  const headerRn = headRow.rn || hi + 1;
  books[which] = {
    ...prev,
    name: prev.file || s.name,
    sheet: s.name,
    path: s.path,
    index: s.index,
    head,
    labels,
    headerRn,
    rows: s.rows.slice(hi + 1),
  };
  label.textContent = '“' + s.name + '” — ' + books[which].rows.length.toLocaleString() + ' rows, ' + width + ' columns' +
    (headerRn > 1 ? ', header taken from row ' + headerRn : '');
  label.className = 'muted';
}

function ready() {
  const ok = books.a && books.b;
  $('#setup').hidden = !ok;
  if (!ok) return;
  const fill = (sel, labels) => { sel.innerHTML = labels.map((h, i) => '<option value="' + i + '">' + h.replace(/</g, '&lt;') + '</option>').join(''); };
  fill($('#ka'), books.a.labels);
  fill($('#kb'), books.b.labels);
  // A column that appears in both files by the same name is almost always the
  // key, so preselect it rather than making the reader find it twice.
  const la = books.a.head.map((h) => h.toLowerCase());
  const lb = books.b.head.map((h) => h.toLowerCase());
  for (let i = 0; i < la.length; i++) { const j = lb.indexOf(la[i]); if (j >= 0) { $('#ka').value = i; $('#kb').value = j; break; } }
  drawCols();
  $('#kb').onchange = drawCols;
  // Where the copied columns go. The default is the end, which is what the
  // tool always did; any other spot is one pick away.
  $('#pos').innerHTML = '<option value="-1">At the very start, before column A</option>' +
    books.a.labels.map((h, i) => '<option value="' + i + '">After ' + h.replace(/</g, '&lt;') + '</option>').join('');
  $('#pos').value = books.a.labels.length - 1;
  $('#pos').onchange = () => { if (merged) merge(); };
  $('#dx').textContent = books.a.zip ? 'Download file 1 with the columns inserted' : 'Download .xlsx';
}

function drawCols() {
  const kb = +$('#kb').value;
  $('#cols').innerHTML = books.b.labels.map((h, i) => i === kb ? '' :
    '<label style="margin:0"><input type="checkbox" class="pick" value="' + i + '" checked style="width:auto"> ' + h.replace(/</g, '&lt;') + '</label>').join('');
}

let merged = null, plan = null;

function merge() {
  const ka = +$('#ka').value, kb = +$('#kb').value;
  const picks = [...document.querySelectorAll('.pick:checked')].map((c) => +c.value);
  if (!picks.length) { $('#report').innerHTML = '<p class="err">Tick at least one column to copy.</p>'; return; }
  const loose = $('#loose').checked;
  const norm = (v) => loose ? String(v ?? '').trim().toLowerCase() : String(v ?? '');

  const map = new Map();
  let dupes = 0, blankKeys = 0;
  for (const r of books.b.rows) {
    const k = norm(r[kb]);
    if (k === '') { blankKeys++; continue; }
    if (map.has(k)) { dupes++; continue; }
    map.set(k, r);
  }

  // A column name that already exists in the first file would produce two
  // columns with one name, and every later step — a pivot, a re-import, another
  // lookup — would then pick whichever it found first.
  const taken = new Set(books.a.head.map((h) => h.toLowerCase()));
  const newHead = picks.map((i) => {
    let h = books.b.head[i];
    while (taken.has(h.toLowerCase())) h += ' (from ' + books.b.name.replace(/\\.[^.]+$/, '') + ')';
    taken.add(h.toLowerCase());
    return h;
  });

  // p is the column the new ones go after; -1 puts them in front of A.
  const p = Math.min(+$('#pos').value, books.a.head.length - 1);
  const put = (row, add) => row.slice(0, p + 1).concat(add, row.slice(p + 1));
  // extra maps a real row number in file 1 to the values going into that row,
  // which is what writing back into the original workbook needs.
  const extra = new Map([[books.a.headerRn, newHead]]);
  let hit = 0, miss = 0;
  const out = [put(books.a.head, newHead)];
  for (const r of books.a.rows) {
    const m = map.get(norm(r[ka]));
    if (m) hit++; else miss++;
    const vals = picks.map((i) => (m ? m[i] ?? '' : ''));
    out.push(put(books.a.head.map((_, i) => r[i] ?? ''), vals));
    if (r.rn) extra.set(r.rn, vals);
  }
  merged = out;
  plan = { p, heads: newHead, extra, headerRn: books.a.headerRn };

  const pct = ((hit / (hit + miss)) * 100).toFixed(1);
  let msg = '<p><strong>' + hit.toLocaleString() + ' of ' + (hit + miss).toLocaleString() +
    ' rows filled (' + pct + '%).</strong></p>';
  if (miss) msg += '<p class="muted">' + miss.toLocaleString() + ' row' + (miss === 1 ? '' : 's') +
    ' matched nothing and kept the new columns empty.' + (loose ? '' : ' Matching is case and space sensitive right now, which is the usual reason for this.') + '</p>';
  if (dupes) msg += '<p class="muted">' + dupes.toLocaleString() + ' duplicate key' + (dupes === 1 ? '' : 's') +
    ' in the second file. The first row won each time, which is what VLOOKUP would have done without saying so.</p>';
  if (blankKeys) msg += '<p class="muted">' + blankKeys.toLocaleString() + ' row' + (blankKeys === 1 ? '' : 's') +
    ' in the second file had an empty key and were skipped.</p>';
  if (books.a.zip) msg += '<p class="muted">The .xlsx download is file 1 itself — every sheet, style, column width, merged cell, filter and formula kept — with ' +
    (newHead.length === 1 ? 'the new column' : 'the ' + newHead.length + ' new columns') + ' inserted ' +
    (p < 0 ? 'before column A' : 'after column ' + colName(p)) + ' of “' + books.a.sheet.replace(/</g, '&lt;') + '”.' +
    (books.a.encrypted ? ' It is saved without the password.' : '') + '</p>';
  $('#report').innerHTML = msg;

  const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');
  const isNew = (i) => i > p && i <= p + newHead.length;
  const head = '<tr>' + out[0].map((h, i) => '<th' + (isNew(i) ? ' style="color:var(--acc)"' : '') + '>' + esc(h) + '</th>').join('') + '</tr>';
  const body = out.slice(1, 51).map((r) => '<tr>' + r.map((c) => '<td>' + esc(c) + '</td>').join('') + '</tr>').join('');
  $('#preview').innerHTML = '<table><thead>' + head + '</thead><tbody>' + body + '</tbody></table>' +
    (out.length > 51 ? '<p class="muted">First 50 rows shown. The download has all ' + (out.length - 1).toLocaleString() + '.</p>' : '');
  $('#dx').disabled = false;
  $('#dc').disabled = false;
}

const X = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
async function toXlsx(rows) {
  const sheet = rows.map((r, ri) => '<row r="' + (ri + 1) + '">' + r.map((c, ci) => {
    const v = String(c ?? '');
    const num = v !== '' && !isNaN(Number(v)) && /^-?[\\d.]+(e-?\\d+)?$/i.test(v.trim());
    return '<c r="' + colName(ci) + (ri + 1) + '"' + (num ? '' : ' t="inlineStr"') + '>' +
      (num ? '<v>' + v.trim() + '</v>' : '<is><t xml:space="preserve">' + X(v) + '</t></is>') + '</c>';
  }).join('') + '</row>').join('');
  return zip([
    { name: '[Content_Types].xml', text: '<?xml version="1.0" encoding="UTF-8"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/></Types>' },
    { name: '_rels/.rels', text: '<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>' },
    { name: 'xl/_rels/workbook.xml.rels', text: '<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/></Relationships>' },
    { name: 'xl/workbook.xml', text: '<?xml version="1.0" encoding="UTF-8"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="Merged" sheetId="1" r:id="rId1"/></sheets></workbook>' },
    { name: 'xl/worksheets/sheet1.xml', text: '<?xml version="1.0" encoding="UTF-8"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetData>' + sheet + '</sheetData></worksheet>' },
  ]);
}

// ---------- writing back into file 1 ----------
//
// Rather than build a fresh workbook from the merged values — which keeps the
// numbers and loses everything else — the new columns are inserted into the
// original sheet XML, the way Excel's own Insert Column does it. Every part the
// insert does not touch is copied back byte for byte, so fonts, fills, borders,
// widths, freeze panes, other sheets, charts and images all survive. What does
// have to move is anything that names a cell by its column: cell addresses,
// formulas, merged ranges, filters, validation, conditional formats, tables,
// comments, drawing anchors, chart series, defined names.

const MAXC = 16383;
const shiftCol = (c, p, n) => (c > p ? Math.min(c + n, MAXC) : c);
// A range that starts after the insert moves; one that straddles it grows.
const shiftSpan = (a, b, p, n) => (a > p ? [shiftCol(a, p, n), shiftCol(b, p, n)] : [a, shiftCol(b, p, n)]);
const CELLREF = /(\\$?)([A-Z]{1,3})(\\$?)(\\d+)(?::(\\$?)([A-Z]{1,3})(\\$?)(\\d+))?|(\\$?)([A-Z]{1,3}):(\\$?)([A-Z]{1,3})/y;
const idch = (ch) => ch !== undefined && /[\\w.$-￿]/.test(ch);

function shiftMatch(m, p, n) {
  if (m[2] === undefined) {
    const [x, y] = shiftSpan(colNum(m[10]), colNum(m[12]), p, n);
    return m[9] + colName(x) + ':' + m[11] + colName(y);
  }
  const a = colNum(m[2]);
  if (m[6] === undefined) return m[1] + colName(shiftCol(a, p, n)) + m[3] + m[4];
  const b = colNum(m[6]);
  const [x, y] = a <= b ? shiftSpan(a, b, p, n) : [shiftCol(a, p, n), shiftCol(b, p, n)];
  return m[1] + colName(x) + m[3] + m[4] + ':' + m[5] + colName(y) + m[7] + m[8];
}
const validRef = (m) => [m[2], m[6], m[10], m[12]].every((c) => c === undefined || colNum(c) <= MAXC) &&
  [m[4], m[8]].every((r) => r === undefined || (+r >= 1 && +r <= 1048576));

// Moves the column part of every cell reference in a formula (or a ref/sqref
// attribute, which is the same grammar without the operators). home says
// whether an unqualified reference means the sheet being changed; qualified
// ones move only when they name it. Strings, structured references and
// external workbook references are left alone.
function shiftFormula(f, home, target, p, n) {
  let out = '', i = 0, afterBracket = false;
  while (i < f.length) {
    const ch = f[i];
    if (ch === '"') {
      let j = i + 1;
      while (j < f.length) { if (f[j] === '"') { if (f[j + 1] === '"') { j += 2; continue; } break; } j++; }
      out += f.slice(i, j + 1); i = j + 1; afterBracket = false; continue;
    }
    if (ch === '[') {
      let d = 0, j = i;
      for (; j < f.length; j++) { if (f[j] === '[') d++; else if (f[j] === ']' && --d === 0) break; }
      out += f.slice(i, j + 1); i = j + 1; afterBracket = true; continue;
    }
    let sheet = null, j = i;
    if (ch === "'") {
      let k = i + 1;
      while (k < f.length) { if (f[k] === "'") { if (f[k + 1] === "'") { k += 2; continue; } break; } k++; }
      if (f[k + 1] !== '!') { out += f.slice(i, k + 1); i = k + 1; afterBracket = false; continue; }
      sheet = f.slice(i + 1, k).replace(/''/g, "'"); j = k + 2;
    } else if (idch(ch)) {
      let k = i;
      while (k < f.length && idch(f[k])) k++;
      if (f[k] === '!') { sheet = f.slice(i, k); j = k + 1; }
    } else { out += ch; i++; afterBracket = false; continue; }
    CELLREF.lastIndex = j;
    const m = CELLREF.exec(f);
    const end = m ? j + m[0].length : -1;
    if (m && !/[\\w.(\\[!]/.test(f[end] || ' ') && validRef(m)) {
      const apply = !afterBracket && (sheet === null ? home : sheet.toLowerCase() === target);
      out += f.slice(i, j) + (apply ? shiftMatch(m, p, n) : m[0]);
      i = end;
    } else {
      let k = j;
      if (sheet === null) while (k < f.length && idch(f[k])) k++;
      out += f.slice(i, k); i = k;
    }
    afterBracket = false;
  }
  return out;
}

const RANGE = /^\\$?([A-Z]+)\\$?(\\d+)(?::\\$?([A-Z]+)\\$?(\\d+))?$/;
const rng = (ref) => {
  const m = RANGE.exec(ref || '');
  return m && { c1: colNum(m[1]), r1: +m[2], c2: colNum(m[3] || m[1]), r2: +(m[4] || m[2]) };
};
const refOf = (c1, r1, c2, r2) => colName(c1) + r1 + (c1 === c2 && r1 === r2 ? '' : ':' + colName(c2) + r2);
const quoteSheet = (s) => "'" + s.replace(/'/g, "''") + "'";
const dispLen = (s) => { let w = 0; for (const ch of String(s)) w += ch.codePointAt(0) > 0x2e80 ? 2 : 1; return w; };

// Which parts hang off a part, from its .rels file, with targets resolved to
// zip paths.
function relsOf(z, part) {
  const dir = part.slice(0, part.lastIndexOf('/') + 1);
  const rp = dir + '_rels/' + part.slice(dir.length) + '.rels';
  if (!z[rp]) return [];
  const resolve = (t) => {
    if (t[0] === '/') return t.slice(1);
    const o = [];
    for (const seg of (dir + t).split('/')) { if (seg === '..') o.pop(); else if (seg !== '.') o.push(seg); }
    return o.join('/');
  };
  return [...els(parsed(z[rp].text, 'relationships'), 'Relationship')]
    .filter((r) => r.getAttribute('TargetMode') !== 'External')
    .map((r) => ({ type: (r.getAttribute('Type') || '').split('/').pop(), path: resolve(r.getAttribute('Target') || '') }));
}

async function intoWorkbook(book, plan) {
  const z = book.zip, { p, heads, extra, headerRn } = plan, n = heads.length;
  const target = book.sheet.toLowerCase();
  const docs = new Map(), dirty = new Set(), texts = new Map(), drop = new Set();
  const doc = (name) => { if (!docs.has(name)) docs.set(name, parsed(z[name].text, 'workbook part')); return docs.get(name); };
  const mk = (d, name) => { const r = d.documentElement; return d.createElementNS(r.namespaceURI, (r.prefix ? r.prefix + ':' : '') + name); };
  const sh = (s, home) => shiftFormula(s, home, target, p, n);
  const shiftAttrs = (d, names, home) => {
    let ch = false;
    for (const el of d.getElementsByTagName('*')) for (const a of names) {
      const v = el.getAttribute(a);
      if (!v) continue;
      const s = sh(v, home);
      if (s !== v) { el.setAttribute(a, s); ch = true; }
    }
    return ch;
  };
  const shiftTexts = (d, names, home) => {
    let ch = false;
    for (const name of names) for (const el of els(d, name)) {
      const v = el.textContent;
      if (!v) continue;
      const s = sh(v, home);
      if (s !== v) { el.textContent = s; ch = true; }
    }
    return ch;
  };
  const FTEXT = ['f', 'formula', 'formula1', 'formula2', 'sqref', 'calculatedColumnFormula'];
  const child = (el, name) => [...el.children].find((x) => x.localName === name);
  // Filter columns are numbered from the filter's own first column.
  const moveFilterCols = (af, c1) => {
    for (const fc of els(af, 'filterColumn')) {
      const id = +fc.getAttribute('colId');
      if (c1 + id > p) fc.setAttribute('colId', id + n);
    }
  };

  // ---- the sheet ----
  const sd = doc(book.path);
  dirty.add(book.path);
  const root = sd.documentElement;
  const sdata = els(sd, 'sheetData')[0];
  if (!sdata) throw new Error('the sheet has no data section');
  const hadFormulas = els(sd, 'f').length > 0;
  shiftAttrs(sd, ['ref', 'sqref', 'activeCell', 'topLeftCell'], true);
  shiftTexts(sd, FTEXT, true);

  // ---- parts hanging off the sheet ----
  // Tables first: a table the new columns land inside, or that they extend
  // at its right edge, needs a tableColumn per new column, and Excel insists
  // the header cell above each one carries that column's name.
  const forced = new Map();
  for (const r of relsOf(z, book.path)) {
    if (!z[r.path] || z[r.path].text === undefined) continue;
    if (r.type === 'table') {
      const d = doc(r.path), t = d.documentElement;
      const g = rng(t.getAttribute('ref'));
      shiftAttrs(d, ['ref'], true);
      dirty.add(r.path);
      if (!g) continue;
      let at = -1;
      if (g.c1 <= p && p < g.c2) at = p - g.c1 + 1;
      else if (g.c2 === p && g.r1 === headerRn) at = g.c2 - g.c1 + 1;
      if (at < 0) continue;
      t.setAttribute('ref', refOf(g.c1, g.r1, g.c2 + n, g.r2));
      const taf = child(t, 'autoFilter');
      if (taf) {
        const fg = rng(taf.getAttribute('ref'));
        if (fg) taf.setAttribute('ref', refOf(g.c1, fg.r1, g.c2 + n, fg.r2));
        moveFilterCols(taf, g.c1);
      }
      const tcs = child(t, 'tableColumns');
      const list = [...els(tcs, 'tableColumn')];
      let id = Math.max(0, ...list.map((x) => +x.getAttribute('id') || 0));
      const have = new Set(list.map((x) => (x.getAttribute('name') || '').toLowerCase()));
      const uniq = (base) => { let nm = base, k = 2; while (have.has(nm.toLowerCase())) nm = base + ' ' + k++; have.add(nm.toLowerCase()); return nm; };
      const names = heads.map((h, k) => uniq(g.r1 === headerRn ? h : 'Column' + (k + 1)));
      for (const nm of names) {
        const tc = mk(d, 'tableColumn');
        tc.setAttribute('id', ++id);
        tc.setAttribute('name', nm);
        tcs.insertBefore(tc, list[at] || null);
      }
      tcs.setAttribute('count', list.length + n);
      if ((t.getAttribute('headerRowCount') ?? '1') !== '0') forced.set(g.r1, names);
    } else if (r.type === 'comments' || r.type === 'threadedComment') {
      if (shiftAttrs(doc(r.path), ['ref'], true)) dirty.add(r.path);
    } else if (r.type === 'pivotTable') {
      const loc = els(doc(r.path), 'location')[0];
      const was = loc && loc.getAttribute('ref');
      if (was && sh(was, true) !== was) { loc.setAttribute('ref', sh(was, true)); dirty.add(r.path); }
    } else if (r.type === 'drawing') {
      // Pictures and charts sit on cell anchors. One entirely right of the
      // insert moves over; one that straddles it stretches, as in Excel.
      const d = doc(r.path);
      for (const a of d.getElementsByTagName('*')) {
        if (a.localName !== 'twoCellAnchor' && a.localName !== 'oneCellAnchor') continue;
        if (a.getAttribute('editAs') === 'absolute') continue;
        const from = child(a, 'from'), to = child(a, 'to');
        const fc = from && child(from, 'col'), tc = to && child(to, 'col');
        if (fc && +fc.textContent > p) { fc.textContent = +fc.textContent + n; if (tc) tc.textContent = +tc.textContent + n; dirty.add(r.path); }
        else if (tc && +tc.textContent > p) { tc.textContent = +tc.textContent + n; dirty.add(r.path); }
      }
    } else if (r.type === 'vmlDrawing') {
      // Legacy comment boxes. VML is not reliably well-formed XML, so it is
      // edited as text.
      const src = z[r.path].text;
      const v = src.replace(/<x:Column>\\s*(\\d+)\\s*<\\/x:Column>/g, (m, c) => '<x:Column>' + shiftCol(+c, p, n) + '</x:Column>')
        .replace(/<x:Anchor>([^<]*)<\\/x:Anchor>/g, (m, a) => {
          const q = a.split(',').map((x) => x.trim());
          if (q.length !== 8) return m;
          if (+q[0] > p) { q[0] = +q[0] + n; q[4] = +q[4] + n; } else if (+q[4] > p) q[4] = +q[4] + n;
          return '<x:Anchor>' + q.join(', ') + '</x:Anchor>';
        });
      if (v !== src) texts.set(r.path, v);
    }
  }

  // ---- styles ----
  // A new cell takes the style of the cell to its left in the same row, which
  // is what Excel's Insert Column does ("format same as left"): the header
  // stays bold, the banding and borders carry on. Numbers and dates get a
  // copy of that style with the number format swapped, so a new column of
  // prices next to a date column does not come out as dates.
  const stp = z['xl/styles.xml'] ? 'xl/styles.xml' : null;
  const xfs = stp ? els(doc(stp), 'cellXfs')[0] : null;
  const styleCache = new Map();
  const styleFor = (s, fmt) => {
    if (!xfs) return null;
    const base = +s || 0;
    const key = base + '|' + fmt;
    if (styleCache.has(key)) return styleCache.get(key);
    const list = els(xfs, 'xf'), src = list[base];
    let id = null;
    if (src && +(src.getAttribute('numFmtId') || 0) === fmt) id = String(base);
    else if (src) {
      const clone = src.cloneNode(true);
      clone.setAttribute('numFmtId', fmt);
      clone.setAttribute('applyNumberFormat', '1');
      id = String(list.length);
      xfs.appendChild(clone);
      xfs.setAttribute('count', list.length);
      dirty.add(stp);
    }
    styleCache.set(key, id);
    return id;
  };
  const toSerial = (v) => {
    const [d, t = '00:00:00'] = v.split(' ');
    const [y, mo, da] = d.split('-').map(Number), [hh, mi, ss = 0] = t.split(':').map(Number);
    const epoch = book.base1904 ? Date.UTC(1904, 0, 1) : Date.UTC(1899, 11, 30);
    return (Date.UTC(y, mo - 1, da, hh, mi, ss) - epoch) / 86400000;
  };
  const XMLNS = 'http://www.w3.org/XML/1998/namespace';
  const cellFor = (rn, col, raw, s, asText) => {
    const v = String(raw ?? '');
    const c = mk(sd, 'c');
    c.setAttribute('r', colName(col) + rn);
    const setS = (id) => { if (id && id !== '0') c.setAttribute('s', id); };
    const isNum = !asText && /^-?(0|[1-9]\\d{0,14})(\\.\\d+)?(e[-+]?\\d+)?$/i.test(v);
    const isDate = !asText && !!xfs && /^\\d{4}-\\d{2}-\\d{2}( \\d{2}:\\d{2}(:\\d{2})?)?$/.test(v);
    if (isNum || isDate) {
      setS(styleFor(s, isNum ? 0 : v.length > 10 ? 22 : 14));
      const e = mk(sd, 'v');
      e.textContent = isNum ? v : String(toSerial(v));
      c.appendChild(e);
      return c;
    }
    setS(s);
    if (v === '') return c.hasAttribute('s') ? c : null;
    c.setAttribute('t', 'inlineStr');
    const is = mk(sd, 'is'), t = mk(sd, 't');
    if (v !== v.trim()) t.setAttributeNS(XMLNS, 'xml:space', 'preserve');
    t.textContent = v;
    is.appendChild(t);
    c.appendChild(is);
    return c;
  };

  // ---- columns: widths and default styles ----
  const nearCol = Math.max(p, 0);
  let cols = els(sd, 'cols')[0];
  const specs = cols ? [...els(cols, 'col')].map((c) => ({ a: +c.getAttribute('min') - 1, b: +c.getAttribute('max') - 1, node: c })) : [];
  const nearSpec = specs.find((s) => s.a <= nearCol && nearCol <= s.b);
  const colStyle = nearSpec ? nearSpec.node.getAttribute('style') : null;
  const moved = [];
  for (const s of specs) {
    if (s.a > p) moved.push({ a: s.a + n, b: Math.min(s.b + n, MAXC), node: s.node });
    else if (s.b > p) { moved.push({ a: s.a, b: p, node: s.node }); moved.push({ a: p + 1 + n, b: Math.min(s.b + n, MAXC), node: s.node.cloneNode(true) }); }
    else moved.push(s);
  }
  // New columns are sized to what goes in them rather than inheriting the
  // width of whatever was to the left, which is often a narrow ID column.
  heads.forEach((h, k) => {
    let w = dispLen(h) + 2;
    for (const vals of extra.values()) w = Math.max(w, dispLen(vals[k] ?? '') + 1);
    const node = mk(sd, 'col');
    node.setAttribute('width', Math.min(Math.max(w, 8), 60));
    node.setAttribute('customWidth', '1');
    if (colStyle) node.setAttribute('style', colStyle);
    moved.push({ a: p + 1 + k, b: p + 1 + k, node });
  });
  moved.sort((x, y) => x.a - y.a);
  if (!cols) { cols = mk(sd, 'cols'); sdata.parentNode.insertBefore(cols, sdata); }
  while (cols.firstChild) cols.removeChild(cols.firstChild);
  for (const s of moved) {
    if (s.a > MAXC) continue;
    s.node.setAttribute('min', s.a + 1);
    s.node.setAttribute('max', s.b + 1);
    cols.appendChild(s.node);
  }

  // ---- cells ----
  let minC = Infinity, maxC = -1, minR = Infinity, maxR = 0, prevRn = 0;
  for (const row of [...els(sdata, 'row')]) {
    const rn = +row.getAttribute('r') || prevRn + 1;
    prevRn = rn;
    row.setAttribute('r', rn);
    // spans is an optional hint of the row's column range; stale is worse
    // than absent.
    row.removeAttribute('spans');
    let next = 0, before = null, near = null, any = false;
    for (const c of [...els(row, 'c')]) {
      const ref = c.getAttribute('r');
      const idx = ref ? colNum(ref) : next;
      next = idx + 1;
      if (idx === nearCol) near = c;
      if (idx > p && !before) before = c;
      const ni = shiftCol(idx, p, n);
      c.setAttribute('r', colName(ni) + rn);
      minC = Math.min(minC, ni); maxC = Math.max(maxC, ni); any = true;
    }
    const vals = forced.get(rn) || extra.get(rn);
    if (vals) {
      const s = near ? near.getAttribute('s') : row.getAttribute('customFormat') === '1' ? row.getAttribute('s') : colStyle;
      const asText = forced.has(rn) || rn === headerRn;
      vals.forEach((v, k) => {
        const c = cellFor(rn, p + 1 + k, v, s, asText);
        if (!c) return;
        row.insertBefore(c, before);
        minC = Math.min(minC, p + 1 + k); maxC = Math.max(maxC, p + 1 + k); any = true;
      });
    }
    if (any) { minR = Math.min(minR, rn); maxR = Math.max(maxR, rn); }
  }
  const dim = els(sd, 'dimension')[0];
  if (dim && maxC >= 0) dim.setAttribute('ref', refOf(minC, minR, maxC, maxR));

  // ---- the sheet's own filter ----
  // Excel does not grow a filter when a column is inserted just past its right
  // edge, but a column added to a filtered list plainly belongs in it.
  const wbp = 'xl/workbook.xml', wd = doc(wbp);
  // Defined names are moved first, so the filter's own name set below is not
  // moved a second time.
  let formulasMoved = hadFormulas;
  if (shiftTexts(wd, ['definedName'], false)) { dirty.add(wbp); formulasMoved = true; }
  const af = child(root, 'autoFilter');
  if (af) {
    const g = rng(af.getAttribute('ref'));
    if (g && g.c1 <= p) {
      moveFilterCols(af, g.c1);
      if (g.c2 === p && g.r1 === headerRn) g.c2 = p + n;
      af.setAttribute('ref', refOf(g.c1, g.r1, g.c2, g.r2));
      for (const dn of els(wd, 'definedName')) {
        if (dn.getAttribute('name') === '_xlnm._FilterDatabase' && +dn.getAttribute('localSheetId') === book.index) {
          dn.textContent = quoteSheet(book.sheet) + '!$' + colName(g.c1) + '$' + g.r1 + ':$' + colName(g.c2) + '$' + g.r2;
          dirty.add(wbp);
        }
      }
    }
  }

  // ---- everything else that can point at this sheet ----
  const mentions = (k) => z[k] && z[k].text !== undefined && z[k].text.toLowerCase().includes(target);
  for (const k of book.paths || []) {
    if (k === book.path || !mentions(k)) continue;
    if (shiftTexts(doc(k), FTEXT, false)) { dirty.add(k); formulasMoved = true; }
  }
  for (const k of Object.keys(z)) {
    if (/^xl\\/charts\\/chart[^/]*\\.xml$/i.test(k) && mentions(k)) {
      if (shiftTexts(doc(k), ['f'], false)) dirty.add(k);
    } else if (/^xl\\/pivotCache\\/pivotCacheDefinition[^/]*\\.xml$/i.test(k) && mentions(k)) {
      const ws = els(doc(k), 'worksheetSource')[0];
      if (ws && (ws.getAttribute('sheet') || '').toLowerCase() === target && ws.getAttribute('ref')) {
        ws.setAttribute('ref', sh(ws.getAttribute('ref'), true));
        dirty.add(k);
      }
    }
  }

  // Cached results and the calculation chain both describe the old layout.
  // The chain is dropped (Excel rebuilds it) and a recalculation on open is
  // requested, rather than trusting cached values nothing here recomputed.
  if (formulasMoved) {
    let calc = els(wd, 'calcPr')[0];
    if (!calc) {
      calc = mk(wd, 'calcPr');
      const after = ['definedNames', 'externalReferences', 'functionGroups', 'sheets'].map((x) => els(wd, x)[0]).find(Boolean);
      after.parentNode.insertBefore(calc, after.nextSibling);
    }
    calc.setAttribute('fullCalcOnLoad', '1');
    dirty.add(wbp);
  }
  const chain = Object.keys(z).find((k) => /^xl\\/calcChain\\.xml$/i.test(k));
  if (chain) {
    drop.add(chain);
    const ct = '[Content_Types].xml', wr = 'xl/_rels/workbook.xml.rels';
    if (z[ct]) texts.set(ct, z[ct].text.replace(/<Override[^>]*calcChain[^>]*\\/>/gi, ''));
    if (z[wr]) texts.set(wr, z[wr].text.replace(/<Relationship[^>]*calcChain[^>]*\\/>/gi, ''));
  }

  const ser = new XMLSerializer();
  for (const k of dirty) texts.set(k, '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\\n' + ser.serializeToString(docs.get(k)));
  return zip(Object.keys(z).filter((k) => !drop.has(k)).map((k) => texts.has(k)
    ? { name: k, text: texts.get(k) }
    : { name: k, raw: z[k].raw, method: z[k].method, crc: z[k].crc, usize: z[k].usize }));
}

const toCsv = (rows) => '\\uFEFF' + rows.map((r) => r.map((c) => {
  const v = String(c ?? '');
  return /[",\\n\\r]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v;
}).join(',')).join('\\r\\n');

function save(blob, name) {
  const u = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = u; a.download = name; a.click();
  setTimeout(() => URL.revokeObjectURL(u), 4000);
}

$('#fa').addEventListener('change', (e) => e.target.files[0] && load(e.target.files[0], 'a'));
$('#fb').addEventListener('change', (e) => e.target.files[0] && load(e.target.files[0], 'b'));
document.addEventListener('click', (e) => {
  const act = e.target.dataset && e.target.dataset.act;
  if (!act) return;
  if (act === 'unlocka' || act === 'unlockb') {
    const w = act.endsWith('a') ? 'a' : 'b';
    const pwv = (w === 'a' ? $('#pwa') : $('#pwb')).value;
    if (locked[w] && pwv) load(new File([locked[w].buf], locked[w].name), w, pwv);
    return;
  }
  if (act === 'sample') {
    // A worked example beats any amount of explaining what a key column is.
    // The data is deliberately imperfect in the three ways real files are: a
    // key that differs only by case and a space, an ID that appears twice on
    // the right, and one that appears nowhere.
    const A = [['OrderID', 'CustomerID', 'Amount'], ['1001', 'C-100', '250'], ['1002', 'c-200 ', '80'], ['1003', 'C-999', '15'], ['1004', 'C-100', '400']];
    const B = [['CustomerID', 'Customer Name', 'City'], ['C-100', 'Acme Ltd', 'Singapore'], ['C-200', 'Beta Co', 'Dublin'], ['C-200', 'Beta Co (old record)', 'Cork'], ['C-300', 'Gamma GmbH', 'Berlin']];
    sheetsOf.a = [{ name: 'orders', rows: A }];
    sheetsOf.b = [{ name: 'customers', rows: B }];
    for (const w of ['a', 'b']) {
      const picker = w === 'a' ? $('#wa') : $('#wb');
      picker.innerHTML = '<option value="0">' + sheetsOf[w][0].name + '</option>';
      picker.hidden = true;
      books[w] = { file: sheetsOf[w][0].name + '.xlsx (example)' };
      pick(w);
    }
    ready();
    merge();
    return;
  }
  if (act === 'merge') merge();
  if (act === 'xlsx' && merged) {
    const job = books.a.zip ? intoWorkbook(books.a, plan).then((b) => save(b, books.a.file))
      : toXlsx(merged).then((b) => save(b, 'merged.xlsx'));
    job.catch((err) => { $('#report').insertAdjacentHTML('beforeend', '<p class="err">Could not write the workbook: ' + String(err.message).replace(/</g, '&lt;') + '</p>'); });
  }
  if (act === 'csv' && merged) save(new Blob([toCsv(merged)], { type: 'text/csv;charset=utf-8' }), 'merged.csv');
});
`,
};
