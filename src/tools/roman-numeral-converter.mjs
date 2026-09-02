export default {
  slug: 'roman-numeral-converter',
  cat: 'convert',
  weight: 7,
  title: 'Roman Numeral Converter',
  metaTitle: 'Roman Numeral Converter — Numbers to Roman and Back | Toolman',
  short: 'Convert numbers to Roman numerals and Roman numerals to numbers.',
  desc:
    'Convert numbers to Roman numerals and back, with a symbol-by-symbol breakdown showing how each value is built and why subtractive pairs work.',
  intro: 'Type a number or a Roman numeral — the other side updates as you type.',
  body: `<div class="tool">
  <div class="grid2">
    <div><label for="num">Number</label><input type="text" id="num" inputmode="numeric" value="2026"></div>
    <div><label for="rom">Roman numeral</label><input type="text" id="rom" spellcheck="false" style="font-family:var(--mono);text-transform:uppercase"></div>
  </div>
  <p id="err" class="err"></p>
  <div class="row"><label style="margin:0"><input type="checkbox" id="vinculum" style="width:auto"> use overline notation for 4,000+</label></div>
  <h2>How it breaks down</h2>
  <table><tbody id="work"></tbody></table>
</div>`,
  about: `<h2>The seven symbols</h2>
<table>
<thead><tr><th>Symbol</th><th>Value</th><th>Origin</th></tr></thead>
<tbody>
<tr><td><strong>I</strong></td><td>1</td><td>A single tally mark</td></tr>
<tr><td><strong>V</strong></td><td>5</td><td>Thought to represent an open hand — five fingers</td></tr>
<tr><td><strong>X</strong></td><td>10</td><td>Two hands, or a tally crossed at every tenth mark</td></tr>
<tr><td><strong>L</strong></td><td>50</td><td>From an older symbol that gradually became the letter L</td></tr>
<tr><td><strong>C</strong></td><td>100</td><td><em>Centum</em>, Latin for hundred</td></tr>
<tr><td><strong>D</strong></td><td>500</td><td>Half of the archaic symbol for 1,000</td></tr>
<tr><td><strong>M</strong></td><td>1,000</td><td><em>Mille</em>, Latin for thousand</td></tr>
</tbody>
</table>
<h2>The subtractive rule</h2>
<p>When a smaller symbol appears before a larger one, it is subtracted: <code>IV</code> is 4, not 6. Only six subtractive pairs are valid in standard notation:</p>
<p><code>IV</code> (4) · <code>IX</code> (9) · <code>XL</code> (40) · <code>XC</code> (90) · <code>CD</code> (400) · <code>CM</code> (900)</p>
<p>The rule is that only powers of ten (I, X, C) can be subtracted, and only from the next two higher symbols. <code>IL</code> for 49 is invalid — it is written <code>XLIX</code>. Clock faces are the famous exception, where 4 is traditionally <code>IIII</code> rather than <code>IV</code>, for visual balance against the <code>VIII</code> opposite.</p>
<h2>What Roman numerals cannot do</h2>
<ul>
<li><strong>Zero.</strong> There is no symbol for it. The concept arrived in Europe with Hindu-Arabic numerals centuries later, and its absence is the single biggest reason Roman numerals lost.</li>
<li><strong>Negative numbers and fractions.</strong> The Romans handled fractions with a separate duodecimal system of dots and symbols, not with numerals.</li>
<li><strong>Arithmetic.</strong> Try long division with <code>MCMXCIV</code>. Positional notation makes calculation mechanical; Roman numerals make it an exercise in memory.</li>
<li><strong>Large numbers.</strong> Standard notation stops at 3,999. Beyond that you need the <em>vinculum</em> — an overline multiplying a symbol by 1,000, so <span style="text-decoration:overline">V</span> is 5,000.</li>
</ul>
<h2>Where they survive</h2>
<p>Clock faces, book chapters and page prefaces, film copyright dates, monarch and pope regnal numbers (Elizabeth II, Benedict XVI), Super Bowl numbering, and the outline levels of formal documents. In each case the appeal is decorative or hierarchical rather than mathematical.</p>`,
  faq: [
    { q: 'What is 2026 in Roman numerals?', a: '<strong>MMXXVI</strong> — MM (2000) + XX (20) + VI (6).' },
    { q: 'Why is 4 sometimes written IIII on clocks?', a: 'Tradition and visual symmetry. <code>IIII</code> balances the <code>VIII</code> directly opposite it on the dial, and it keeps the first four hours as pure I-groups. Big Ben is a notable exception that uses <code>IV</code>.' },
    { q: 'Is there a Roman numeral for zero?', a: 'No. The Romans had no symbol for zero at all — medieval scholars writing in Latin used the word <em>nulla</em> when they needed it.' },
    { q: 'What is the largest number in Roman numerals?', a: '3,999 (<code>MMMCMXCIX</code>) in standard notation, because there is no symbol above M and no more than three may repeat. With the vinculum — an overline meaning ×1,000 — you can reach 3,999,999.' },
    { q: 'How do I know if a numeral is valid?', a: 'Symbols must run largest to smallest apart from the six legal subtractive pairs, I/X/C/M may repeat at most three times, and V/L/D may not repeat at all. This converter flags any numeral that breaks those rules.' },
  ],
  related: ['number-base-converter', 'percentage-calculator', 'timestamp-converter'],
  script: `
const $=s=>document.querySelector(s);
const MAP=[[1000,'M'],[900,'CM'],[500,'D'],[400,'CD'],[100,'C'],[90,'XC'],[50,'L'],[40,'XL'],[10,'X'],[9,'IX'],[5,'V'],[4,'IV'],[1,'I']];
const VAL={I:1,V:5,X:10,L:50,C:100,D:500,M:1000};
function toRoman(n){
  if(!(n>=1))return '';
  let out='',parts=[];
  if(n>3999&&$('#vinculum').checked){
    const thousands=Math.floor(n/1000);
    const rest=n%1000;
    let t='';for(const [v,s] of MAP){while(thousands>=v){t+=s;/*noop*/break}}
    // build the thousands part properly
    let x=thousands,tp='';
    for(const [v,s] of MAP){while(x>=v){tp+=s;x-=v}}
    out=[...tp].map(c=>'<span style="text-decoration:overline">'+c+'</span>').join('');
    let r=rest,rp='';
    for(const [v,s] of MAP){while(r>=v){rp+=s;r-=v}}
    return out+rp;
  }
  let x=n;
  for(const [v,s] of MAP){while(x>=v){out+=s;x-=v;parts.push([s,v])}}
  return out;
}
function fromRoman(str){
  const s=str.toUpperCase().replace(/[^IVXLCDM]/g,'');
  if(!s)return null;
  if(!/^M{0,3}(CM|CD|D?C{0,3})(XC|XL|L?X{0,3})(IX|IV|V?I{0,3})$/.test(s))
    throw new Error('"'+s+'" is not a valid Roman numeral — check the subtractive pairs and repetition limits.');
  let total=0;
  for(let i=0;i<s.length;i++){
    const v=VAL[s[i]],nx=VAL[s[i+1]];
    total += (nx&&v<nx) ? -v : v;
  }
  return total;
}
function breakdown(n){
  let x=n,rows=[];
  for(const [v,s] of MAP){
    let c=0;
    while(x>=v){x-=v;c++}
    if(c)rows.push('<tr><td><code>'+s.repeat(c)+'</code></td><td>'+(c>1?c+' × ':'')+v.toLocaleString()+(c>1?' = '+(c*v).toLocaleString():'')+'</td></tr>');
  }
  return rows.join('')||'<tr><td colspan="2" class="muted">Enter a number.</td></tr>';
}
function fromNum(){
  const raw=$('#num').value.replace(/[,\\s]/g,'');
  $('#err').textContent='';
  if(!raw){$('#rom').value='';$('#work').innerHTML='';return}
  const n=parseInt(raw,10);
  if(!isFinite(n)||n<1){$('#err').textContent='✗ Enter a whole number of 1 or more — Roman numerals have no zero or negatives.';return}
  const max=$('#vinculum').checked?3999999:3999;
  if(n>max){$('#err').textContent='✗ Maximum is '+max.toLocaleString()+($('#vinculum').checked?'.':' in standard notation. Tick the overline option for larger numbers.');return}
  $('#rom').innerHTML='';
  $('#rom').value=toRoman(n).replace(/<[^>]+>/g,'');
  $('#work').innerHTML=n<=3999?breakdown(n):'<tr><td colspan="2" class="muted">Overline notation — each overlined symbol is multiplied by 1,000.</td></tr>';
}
function fromRom(){
  $('#err').textContent='';
  const v=$('#rom').value.trim();
  if(!v){$('#num').value='';$('#work').innerHTML='';return}
  try{
    const n=fromRoman(v);
    $('#num').value=n;
    $('#work').innerHTML=breakdown(n);
  }catch(e){$('#err').textContent='✗ '+e.message}
}
$('#num').addEventListener('input',fromNum);
$('#rom').addEventListener('input',fromRom);
$('#vinculum').addEventListener('change',fromNum);
fromNum();
`,
};
