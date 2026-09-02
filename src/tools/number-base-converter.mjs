export default {
  slug: 'number-base-converter',
  cat: 'convert',
  weight: 7,
  title: 'Number Base Converter',
  metaTitle: 'Binary, Hex & Decimal Converter — Any Base 2 to 36 | Toolman',
  short: 'Convert numbers between binary, octal, decimal, hexadecimal and any base.',
  desc:
    'Convert numbers between binary, octal, decimal, hexadecimal and any base from 2 to 36, with a bit breakdown and a two’s-complement view.',
  intro: 'Type a number in any row — the others update instantly.',
  body: `<div class="tool">
  <div class="grid2">
    <div><label for="b2">Binary (base 2)</label><input type="text" id="b2" data-base="2" spellcheck="false" style="font-family:var(--mono)"></div>
    <div><label for="b8">Octal (base 8)</label><input type="text" id="b8" data-base="8" spellcheck="false" style="font-family:var(--mono)"></div>
    <div><label for="b10">Decimal (base 10)</label><input type="text" id="b10" data-base="10" value="255" spellcheck="false" style="font-family:var(--mono)"></div>
    <div><label for="b16">Hexadecimal (base 16)</label><input type="text" id="b16" data-base="16" spellcheck="false" style="font-family:var(--mono)"></div>
  </div>
  <div class="row">
    <label style="margin:0">Custom base <input type="number" id="cb" value="36" min="2" max="36" style="width:80px"></label>
    <input type="text" id="bx" data-base="36" aria-label="Value in the custom base" spellcheck="false" style="flex:1;min-width:140px;font-family:var(--mono)">
    <span id="err" class="err"></span>
  </div>
  <h2>Bit breakdown</h2>
  <div id="bits" class="out" style="line-height:2.2"></div>
  <table><tbody id="info"></tbody></table>
</div>`,
  about: `<h2>Why computers use binary and hex</h2>
<p>Digital circuits have two stable states, so all data is ultimately binary. Binary is unreadable at any length, and decimal does not line up with byte boundaries — but hexadecimal does: one hex digit is exactly four bits, and two hex digits are exactly one byte. That is why memory dumps, colour codes, MAC addresses and hashes are all written in hex.</p>
<h2>Common bases</h2>
<table>
<tr><th>Base</th><th>Digits</th><th>Where you meet it</th></tr>
<tr><td>2 (binary)</td><td>0–1</td><td>Bit flags, permissions masks, low-level protocols</td></tr>
<tr><td>8 (octal)</td><td>0–7</td><td>Unix file permissions — <code>chmod 755</code></td></tr>
<tr><td>10 (decimal)</td><td>0–9</td><td>Everything humans count</td></tr>
<tr><td>16 (hexadecimal)</td><td>0–9, A–F</td><td>Colours, memory addresses, hashes, byte dumps</td></tr>
<tr><td>36</td><td>0–9, A–Z</td><td>Short IDs and URL slugs — the densest base using only alphanumerics</td></tr>
</table>
<h2>Converting by hand</h2>
<p>To convert decimal to another base, divide repeatedly by the base and read the remainders from last to first. 255 ÷ 16 = 15 remainder 15, and 15 ÷ 16 = 0 remainder 15, so 255 is <code>FF</code>. Going the other way, multiply each digit by the base raised to its position: <code>FF</code> = 15×16 + 15 = 255.</p>
<h2>Binary and hex prefixes in code</h2>
<pre><code>0b11111111   binary      (JavaScript, Python, Rust, C++14)
0o377        octal       (JavaScript, Python 3)
0377         octal       (C, older JavaScript — a classic bug source)
0xFF         hexadecimal (almost every language)
255          decimal</code></pre>
<h2>Two's complement</h2>
<p>Signed integers store negative numbers as the two's complement: invert every bit and add one. In 8 bits, <code>11111111</code> is 255 unsigned but −1 signed. This is why a byte holds either 0–255 or −128–127 depending on how you interpret it, and why an unsigned subtraction that goes below zero wraps to a very large number.</p>`,
  faq: [
    { q: 'What is 255 in binary?', a: '<code>11111111</code> — eight ones, the largest value that fits in a single byte. In hex it is <code>FF</code>.' },
    { q: 'What is 0xFF in decimal?', a: '255. Each hex digit is worth four bits, so <code>FF</code> is 15×16 + 15.' },
    { q: 'Why does chmod use octal?', a: 'Unix permissions come in groups of three bits — read, write, execute — for owner, group and others. One octal digit encodes exactly three bits, so <code>755</code> is <code>111 101 101</code>.' },
    { q: 'What is the largest base supported?', a: 'Base 36, which uses 0–9 followed by A–Z. Beyond that there is no agreed alphabet, though Base58 and Base62 exist with their own custom character sets.' },
    { q: 'How large a number can it handle?', a: 'Arbitrarily large — conversion uses JavaScript BigInt, so integers well beyond 64 bits convert exactly with no precision loss.' },
  ],
  related: ['hash-generator', 'color-converter', 'base64-encode-decode'],
  script: `
const $=s=>document.querySelector(s);
const DIG='0123456789abcdefghijklmnopqrstuvwxyz';
function parseIn(str,base){
  str=str.trim().toLowerCase().replace(/[\\s_,]/g,'');
  if(!str)return null;
  let neg=false;
  if(str[0]==='-'){neg=true;str=str.slice(1)}
  if(base===16&&str.startsWith('0x'))str=str.slice(2);
  if(base===2&&str.startsWith('0b'))str=str.slice(2);
  if(base===8&&str.startsWith('0o'))str=str.slice(2);
  if(!str)return null;
  let v=0n;const B=BigInt(base);
  for(const ch of str){
    const d=DIG.indexOf(ch);
    if(d<0||d>=base)throw new Error('"'+ch+'" is not a valid digit in base '+base);
    v=v*B+BigInt(d);
  }
  return neg?-v:v;
}
function toBase(v,base){
  if(v===null)return '';
  const neg=v<0n;let x=neg?-v:v;
  if(x===0n)return '0';
  const B=BigInt(base);let s='';
  while(x>0n){s=DIG[Number(x%B)]+s;x/=B}
  return (neg?'-':'')+s;
}
function render(v,skip){
  document.querySelectorAll('[data-base]').forEach(el=>{
    if(el===skip)return;
    const b=el.id==='bx'?(+$('#cb').value||36):+el.dataset.base;
    el.value=v===null?'':(b===16?toBase(v,b).toUpperCase():toBase(v,b));
  });
  if(v===null){$('#bits').innerHTML='';$('#info').innerHTML='';return}
  const bin=toBase(v<0n?-v:v,2);
  const width=bin.length<=8?8:bin.length<=16?16:bin.length<=32?32:bin.length<=64?64:Math.ceil(bin.length/8)*8;
  const padded=bin.padStart(width,'0');
  let out='';
  for(let i=0;i<padded.length;i+=4){
    const nib=padded.slice(i,i+4);
    out+='<span style="display:inline-block;margin-right:8px"><code>'+nib+'</code><br><small class="muted" style="font-size:.7rem">'+parseInt(nib,2).toString(16).toUpperCase()+'</small></span>';
  }
  $('#bits').innerHTML=(v<0n?'<span class="muted">magnitude of </span>':'')+out;
  const abs=v<0n?-v:v;
  const rows=[
    ['Bits required',bin.length],
    ['Fits in',bin.length<=8?'8-bit byte':bin.length<=16?'16-bit word':bin.length<=32?'32-bit int':bin.length<=64?'64-bit long':'more than 64 bits'],
    ['Base 36',toBase(v,36).toUpperCase()],
    ['Two\\'s complement (8-bit)',abs<256n?toBase(v<0n?(256n+v):v,2).padStart(8,'0'):'—'],
    ['As bytes',abs<(1n<<64n)?(toBase(abs,16).padStart(Math.ceil(toBase(abs,16).length/2)*2,'0').toUpperCase().match(/../g)||[]).join(' '):'—'],
  ];
  $('#info').innerHTML=rows.map(r=>'<tr><td>'+r[0]+'</td><td class="out">'+r[1]+'</td></tr>').join('');
}
function onInput(e){
  const el=e.target.closest('[data-base]');if(!el)return;
  const b=el.id==='bx'?(+$('#cb').value||36):+el.dataset.base;
  $('#err').textContent='';
  try{render(parseIn(el.value,b),el)}
  catch(err){$('#err').textContent='✗ '+err.message}
}
document.addEventListener('input',onInput);
$('#cb').addEventListener('input',()=>{
  const b=Math.min(36,Math.max(2,+$('#cb').value||36));
  $('#bx').dataset.base=b;
  try{render(parseIn($('#b10').value,10),null)}catch(e){}
});
render(255n,null);
`,
};
