export default {
  slug: 'uuid-generator',
  cat: 'dev',
  weight: 8,
  title: 'UUID Generator',
  metaTitle: 'UUID Generator — v4, v7 and Nano ID Online | Toolman',
  short: 'Generate cryptographically random UUID v4, time-ordered v7 and Nano IDs.',
  desc:
    'Free online UUID generator. Create UUID v4, time-sortable UUID v7, ULIDs and Nano IDs in bulk, with uppercase, no-dash and quoted output options. Generated locally with a cryptographic random source.',
  intro:
    'Generate identifiers in bulk. Values come from your browser’s cryptographic random number generator and never touch a server.',
  body: `<div class="tool">
  <div class="row">
    <label style="margin:0">Type
      <select id="type" style="width:auto">
        <option value="v4">UUID v4 (random)</option>
        <option value="v7">UUID v7 (time-ordered)</option>
        <option value="nano">Nano ID (21 chars)</option>
        <option value="short">Short ID (8 chars)</option>
        <option value="hex">Random hex (32)</option>
      </select>
    </label>
    <label style="margin:0">Count <input type="number" id="count" value="10" min="1" max="1000" style="width:90px"></label>
    <button class="primary" data-act="gen">Generate</button>
    <button data-act="copy">Copy all</button>
  </div>
  <div class="row">
    <label style="margin:0"><input type="checkbox" id="upper" style="width:auto"> uppercase</label>
    <label style="margin:0"><input type="checkbox" id="nodash" style="width:auto"> remove dashes</label>
    <label style="margin:0"><input type="checkbox" id="quote" style="width:auto"> quote &amp; comma</label>
  </div>
  <textarea id="out" spellcheck="false" readonly style="min-height:260px"></textarea>
</div>`,
  about: `<h2>Which UUID version should you use?</h2>
<table>
<tr><th>Version</th><th>Based on</th><th>Use it when</th></tr>
<tr><td><strong>v4</strong></td><td>122 random bits</td><td>You just need a unique identifier and do not care about ordering. The safe default.</td></tr>
<tr><td><strong>v7</strong></td><td>48-bit millisecond timestamp + randomness</td><td>The ID becomes a database primary key. Values sort chronologically, which keeps B-tree indexes compact.</td></tr>
<tr><td><strong>v1</strong></td><td>Timestamp + MAC address</td><td>Legacy systems only — it can leak the generating machine's network address.</td></tr>
<tr><td><strong>v5</strong></td><td>SHA-1 of a name inside a namespace</td><td>You need the same input to deterministically produce the same UUID.</td></tr>
</table>
<h2>Why v7 matters for databases</h2>
<p>Random v4 values are inserted at scattered positions in an index, which fragments pages and hurts write throughput on large tables. UUID v7 puts the timestamp in the most significant bits, so new rows append at the right edge of the index — the same locality an auto-increment integer gives you, without a central sequence.</p>
<h2>Collision probability</h2>
<p>A v4 UUID carries 122 random bits, or about 5.3&nbsp;×&nbsp;10<sup>36</sup> possible values. Generating a billion UUIDs per second for a century leaves the chance of a single collision far below one in a billion — assuming a proper cryptographic random source, which is exactly what <code>crypto.getRandomValues()</code> provides.</p>
<h2>Nano ID and short IDs</h2>
<p>Nano ID packs similar collision resistance into 21 URL-friendly characters instead of 36, which is why it is popular for public-facing slugs. The 8-character short ID here is for throwaway keys and demo data only — with roughly 2.8&nbsp;×&nbsp;10<sup>14</sup> combinations, collisions become likely once you pass a few million values.</p>`,
  faq: [
    { q: 'Are these UUIDs really random?', a: 'Yes. They come from <code>crypto.getRandomValues()</code>, the browser’s cryptographically secure random number generator — the same source used for key material — not from <code>Math.random()</code>.' },
    { q: 'Could the server see the values I generate?', a: 'No. Generation happens entirely in your browser after the page loads, so the values are never transmitted and the tool works offline.' },
    { q: 'Is a UUID safe to expose in a URL?', a: 'A v4 UUID reveals nothing about its contents, so it is fine as an opaque identifier. It is not a substitute for authorisation, though — anyone who obtains the URL can use it.' },
    { q: 'How should I store a UUID in a database?', a: 'Use a native UUID column where one exists (PostgreSQL <code>uuid</code>, SQL Server <code>uniqueidentifier</code>) or a 16-byte binary column such as MySQL <code>BINARY(16)</code>. Storing it as a 36-character string more than doubles the space and slows comparisons.' },
    { q: 'What is the difference between UUID v7 and ULID?', a: 'Both prefix random bits with a millisecond timestamp so values sort by creation time. ULID uses a 26-character Crockford base32 encoding; UUID v7 keeps the standard 36-character UUID format, so existing UUID columns and libraries accept it unchanged.' },
  ],
  related: ['password-generator', 'hash-generator', 'timestamp-converter'],
  script: `
const $=s=>document.querySelector(s);
const hex=n=>{const a=new Uint8Array(n);crypto.getRandomValues(a);return [...a].map(b=>b.toString(16).padStart(2,'0')).join('')};
function v4(){ return crypto.randomUUID ? crypto.randomUUID() : (()=>{const a=new Uint8Array(16);crypto.getRandomValues(a);a[6]=(a[6]&15)|64;a[8]=(a[8]&63)|128;const h=[...a].map(b=>b.toString(16).padStart(2,'0')).join('');return h.slice(0,8)+'-'+h.slice(8,12)+'-'+h.slice(12,16)+'-'+h.slice(16,20)+'-'+h.slice(20)})() }
function v7(){
  const t=Date.now();
  const a=new Uint8Array(16);crypto.getRandomValues(a);
  a[0]=(t/2**40)&255;a[1]=(t/2**32)&255;a[2]=(t/2**24)&255;a[3]=(t/2**16)&255;a[4]=(t/256)&255;a[5]=t&255;
  a[6]=(a[6]&15)|112; a[8]=(a[8]&63)|128;
  const h=[...a].map(b=>b.toString(16).padStart(2,'0')).join('');
  return h.slice(0,8)+'-'+h.slice(8,12)+'-'+h.slice(12,16)+'-'+h.slice(16,20)+'-'+h.slice(20);
}
function nano(len){const A='useandom-26T198340PX75pxJACKVERYMINDBUSHWOLF_GQZbfghjklqvwyzrict';const a=new Uint8Array(len);crypto.getRandomValues(a);return [...a].map(b=>A[b&63]).join('')}
function gen(){
  const n=Math.min(1000,Math.max(1,+$('#count').value||1)),t=$('#type').value;
  let out=[];
  for(let i=0;i<n;i++){
    let v = t==='v4'?v4() : t==='v7'?v7() : t==='nano'?nano(21) : t==='short'?nano(8) : hex(16);
    if($('#nodash').checked)v=v.replace(/-/g,'');
    if($('#upper').checked)v=v.toUpperCase();
    if($('#quote').checked)v='"'+v+'",';
    out.push(v);
  }
  $('#out').value=out.join('\\n');
}
document.addEventListener('click',e=>{const b=e.target.closest('[data-act]');if(!b)return;
  if(b.dataset.act==='gen')gen();
  else{$('#out').select();document.execCommand('copy')}});
['#type','#count','#upper','#nodash','#quote'].forEach(s=>$(s).addEventListener('change',gen));
gen();
`,
};
