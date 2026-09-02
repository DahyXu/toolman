export default {
  slug: 'text-to-binary',
  cat: 'dev',
  weight: 7,
  title: 'Text to Binary',
  metaTitle: 'Text to Binary, Hex, Decimal & ASCII Converter | Toolman',
  short: 'See any text as binary, hexadecimal, decimal, octal and UTF-8 bytes at once.',
  desc:
    'See any text as binary, hexadecimal, decimal, octal and UTF-8 bytes at once, with a per-character breakdown, and convert it back again.',
  intro:
    'Type or paste text to see it in every representation at once, with a breakdown of each character. Conversion happens in your browser.',
  body: `<div class="tool">
  <label for="in">Text</label>
  <textarea id="in" rows="3" spellcheck="false">Hello</textarea>
  <div class="row">
    <label style="margin:0"><input type="checkbox" id="sep" checked style="width:auto"> separate bytes with spaces</label>
    <label style="margin:0"><input type="checkbox" id="upper" style="width:auto"> uppercase hex</label>
    <span id="err" class="err"></span>
  </div>
  <table><tbody id="out"></tbody></table>

  <h2>Decode back to text</h2>
  <p class="muted">Paste binary, hex, decimal or octal. The format is detected automatically and named below the box — some inputs are genuinely ambiguous, so pick one from the list if the guess is wrong.</p>
  <textarea id="dec" rows="2" spellcheck="false" aria-label="Encoded input to decode"></textarea>
  <div class="row">
    <label style="margin:0">Format
      <select id="fmt" aria-label="Input format">
        <option value="auto">Detect automatically</option>
        <option value="2">Binary</option>
        <option value="8">Octal</option>
        <option value="10">Decimal</option>
        <option value="16">Hexadecimal</option>
      </select>
    </label>
    <button class="primary" id="go">Decode</button>
    <span id="detected" class="muted"></span>
    <span id="derr" class="err"></span>
  </div>
  <p id="dout" class="out" style="font-family:var(--mono);white-space:pre-wrap"></p>

  <h2>Character breakdown</h2>
  <table><thead><tr><th>Char</th><th>Dec</th><th>Hex</th><th>Binary</th><th>UTF-8 bytes</th></tr></thead><tbody id="chars"></tbody></table>
  <p class="muted" id="note"></p>
</div>`,
  about: `<h2>Text is numbers all the way down</h2>
<p>A computer stores no letters, only numbers. An encoding is the agreement about which number means which character, and every representation on this page — binary, hexadecimal, decimal, octal — is the same numbers written in a different base. Converting "text to binary" is really two steps: look up each character's number, then write that number in base 2.</p>

<h2>Which encoding</h2>
<p>For English text the answer is usually <a href="/ascii/">ASCII</a>, where each character is one number from 0 to 127 and therefore one byte. <code>H</code> is 72, which is <code>01001000</code>. That is why "text to binary" tools traditionally show eight bits per character.</p>
<p>It stops being that simple the moment a character falls outside ASCII. Modern text is UTF-8, where characters above 127 take two, three or four bytes. An accented <code>é</code> is one character but two bytes; an emoji is usually four. This page shows the real UTF-8 bytes rather than pretending every character is one byte, which is why the byte count and the character count can differ.</p>

<h2>Reading the bases</h2>
<table>
<thead><tr><th>Base</th><th>Digits</th><th>"Hi" becomes</th><th>Where you see it</th></tr></thead>
<tbody>
<tr><td>Binary</td><td>0–1</td><td><code>01001000 01101001</code></td><td>Bit manipulation, protocol specs, teaching</td></tr>
<tr><td>Octal</td><td>0–7</td><td><code>110 151</code></td><td>Unix file permissions, older escape sequences</td></tr>
<tr><td>Decimal</td><td>0–9</td><td><code>72 105</code></td><td>HTML numeric entities, character tables</td></tr>
<tr><td>Hexadecimal</td><td>0–9, A–F</td><td><code>48 69</code></td><td>Hex dumps, colour codes, memory addresses, almost everything</td></tr>
</tbody>
</table>
<p>Hexadecimal dominates because one hex digit is exactly four bits and two are exactly one byte. Decimal has no such alignment: the byte 255 is <code>FF</code> in hex and <code>11111111</code> in binary, both of which show the byte boundary, while 255 hides it.</p>

<h2>Why this is not encryption</h2>
<p>Text written in binary is still the same text, exactly as legible to anything that can read binary. The same applies to hex, to <a href="/base64-encode-decode/">Base64</a> and to <a href="/url-encode-decode/">percent encoding</a>: all of them are ways to represent bytes, not ways to hide them, and every one is reversed by a single function call. If something needs to be secret it needs encryption, which requires a key. If you have a password or token in front of you in binary, treat it as if it were in plain text — because it is.</p>

<h2>Useful things to notice</h2>
<ul>
<li><strong>Capitals and lowercase differ by one bit.</strong> <code>A</code> is 65, <code>a</code> is 97, and 32 is a single bit — so <code>01000001</code> and <code>01100001</code> differ only in position 3. This is why case conversion is a bitwise operation rather than a lookup.</li>
<li><strong>Digits carry their own value.</strong> The character <code>7</code> is 55, and 55 &minus; 48 = 7. The last four bits of any digit character are the digit itself.</li>
<li><strong>A space is a character.</strong> 32, <code>00100000</code>. Trailing spaces are invisible on screen and perfectly visible here, which makes this a quick way to find them.</li>
<li><strong>Line endings show up too.</strong> A newline is 10 and a carriage return is 13. Text that came from Windows will show both, which is often the explanation for a file that "looks identical" but does not compare equal.</li>
</ul>`,
  faq: [
    { q: 'How do I convert text to binary?', a: 'Look up each character\'s numeric code, then write that number in base 2. <code>H</code> is 72 in ASCII, and 72 in binary is <code>01001000</code>. This page does it for a whole string at once and shows the per-character working.' },
    { q: 'Why is each character eight bits?', a: 'ASCII needs only seven bits, but computers address memory in bytes of eight, so each character is padded with a leading zero. Characters outside ASCII use more than one byte under UTF-8 — this page shows the real byte count rather than assuming one.' },
    { q: 'Is binary text encrypted?', a: 'No. It is the same text in a different notation, and anything that can read binary can read it. Base64 and percent encoding are the same: representations, not protection. Hiding something requires encryption and a key.' },
    { q: 'What happens to emoji and accented characters?', a: 'They are encoded as UTF-8, which uses two to four bytes for anything above ASCII. An emoji is normally four bytes, and one that combines several code points can be more. The breakdown shows each byte, so a character count and a byte count will legitimately differ.' },
    { q: 'Can I convert binary back to text?', a: 'Yes — paste it into the decode box, with or without spaces between the groups. Binary, hexadecimal, decimal and octal are detected automatically, and the detected format is named so you can see what was assumed.' },
    { q: 'Why does my decoded text come out wrong?', a: 'Usually because the input is ambiguous. <code>72 105</code> is valid decimal and valid octal, and it means different characters in each — decimal <code>Hi</code>, octal <code>:E</code>. The decoder shows which format it read, and you can override it with the format list.' },
    { q: 'Why does hexadecimal appear more often than decimal?', a: 'One hex digit is exactly four bits and two digits are exactly one byte, so hex shows byte boundaries directly. Decimal does not line up with any power of two, which is why hex dumps, colour codes and memory addresses all use it.' },
  ],
  related: ['number-base-converter', 'base64-encode-decode', 'hash-generator'],
  script: `
const $=s=>document.querySelector(s);
const enc=new TextEncoder();
const dec=new TextDecoder();
const pad=(s,n)=>s.length>=n?s:'0'.repeat(n-s.length)+s;
function render(){
  const t=$('#in').value;
  const sep=$('#sep').checked?' ':'';
  const up=$('#upper').checked;
  const bytes=[...enc.encode(t)];
  const hx=(b)=>{const h=pad(b.toString(16),2);return up?h.toUpperCase():h};
  const rows=[
    ['Binary', bytes.map(b=>pad(b.toString(2),8)).join(sep||'')],
    ['Hexadecimal', bytes.map(hx).join(sep)],
    ['Decimal', bytes.map(b=>String(b)).join(sep||' ')],
    ['Octal', bytes.map(b=>pad(b.toString(8),3)).join(sep||' ')],
    ['HTML entities', [...t].map(c=>'&#'+c.codePointAt(0)+';').join('')],
    ['Characters', [...t].length+' characters, '+bytes.length+' bytes'],
  ];
  $('#out').innerHTML=rows.map(r=>'<tr><td>'+r[0]+'</td><td class="out" style="font-family:var(--mono);word-break:break-all">'+
    r[1].replace(/&/g,'&amp;').replace(/</g,'&lt;')+'</td></tr>').join('');
  // Per-character breakdown. Iterating the string with spread gives whole code
  // points rather than UTF-16 halves, so an emoji stays one row.
  const cells=[...t].slice(0,64).map(ch=>{
    const cp=ch.codePointAt(0);
    const bs=[...enc.encode(ch)];
    const label=cp===32?'space':cp===10?'LF':cp===13?'CR':cp===9?'tab':ch;
    const link=cp<128?'<a href="/ascii/'+cp+'/">'+String(cp)+'</a>':String(cp);
    return '<tr><td class="out">'+label.replace(/&/g,'&amp;').replace(/</g,'&lt;')+'</td><td>'+link+
      '</td><td class="out">'+(up?hx(cp).toUpperCase():'0x'+pad(cp.toString(16),2))+
      '</td><td class="out">'+pad(cp.toString(2),8)+
      '</td><td class="out">'+bs.map(hx).join(' ')+'</td></tr>';
  }).join('');
  $('#chars').innerHTML=cells||'<tr><td colspan="5" class="muted">Nothing to show.</td></tr>';
  const n=[...t].length;
  $('#note').textContent = n>64 ? 'Showing the first 64 of '+n+' characters.' :
    (bytes.length!==n ? 'This text contains characters outside ASCII, so the byte count exceeds the character count.' : '');
}
function decode(){
  const raw=$('#dec').value.trim();
  $('#derr').textContent=''; $('#detected').textContent='';
  if(!raw){ $('#dout').textContent=''; return }
  const forced=$('#fmt').value;
  try{
    const compact=raw.replace(/[\\s,]+/g,'');
    const parts=raw.split(/[\\s,]+/).filter(Boolean).map(p=>p.replace(/^0[xX]/,''));
    let base=null, nums=null;
    const inRange=(a)=>a && a.every(n=>n>=0&&n<256);
    const parseAs=(b,digits)=>{
      const re=new RegExp('^['+digits+']+$');
      const byGroup = parts.every(p=>re.test(p)) ? parts.map(p=>parseInt(p,b)) : null;
      // One long run with no separators is a stream of fixed-width groups:
      // "4869" is two hex bytes, not the single number 18537. Try that whenever
      // reading the groups as written gives something that is not a byte.
      const w = b===2?8 : b===16?2 : 0;
      const byWidth = (w && re.test(compact) && compact.length%w===0)
        ? compact.match(new RegExp('.{'+w+'}','g')).map(x=>parseInt(x,b)) : null;
      if(inRange(byGroup)) return byGroup;
      if(inRange(byWidth)) return byWidth;
      return byGroup || byWidth;
    };
    if(forced!=='auto'){
      base=+forced;
      nums=parseAs(base, base===2?'01':base===8?'0-7':base===10?'0-9':'0-9a-fA-F');
      if(!nums) throw new Error('That does not look like valid '+({2:'binary',8:'octal',10:'decimal',16:'hexadecimal'}[base]));
    } else {
      // Bare digit groups are ambiguous — "72 105" is valid octal and valid
      // decimal and means different things. Decimal is overwhelmingly what
      // people paste, so it wins, and the detected format is shown so a wrong
      // guess is visible rather than silent.
      const tries=[[2,'01'],[10,'0-9'],[16,'0-9a-fA-F'],[8,'0-7']];
      for(const [b,d] of tries){
        const got=parseAs(b,d);
        if(got && got.every(n=>n>=0&&n<256)){ base=b; nums=got; break }
      }
      if(!nums) throw new Error('Could not tell what format this is — pick one from the list');
    }
    if(nums.some(n=>!(n>=0&&n<256))) throw new Error('A value is outside the range 0-255');
    $('#dout').textContent=dec.decode(new Uint8Array(nums));
    $('#detected').textContent='read as '+({2:'binary',8:'octal',10:'decimal',16:'hexadecimal'}[base]);
  }catch(e){ $('#derr').textContent='✗ '+e.message; $('#dout').textContent='' }
}
$('#fmt').addEventListener('change',decode);
$('#in').addEventListener('input',render);
$('#sep').addEventListener('change',render);
$('#upper').addEventListener('change',render);
$('#go').addEventListener('click',decode);
$('#dec').addEventListener('input',decode);
render();
`,
};
