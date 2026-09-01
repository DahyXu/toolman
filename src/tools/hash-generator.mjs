export default {
  slug: 'hash-generator',
  cat: 'dev',
  weight: 7,
  title: 'Hash Generator',
  metaTitle: 'SHA-256 / SHA-1 / MD5 Hash Generator Online | Toolman',
  short: 'Generate SHA-256, SHA-384, SHA-512, SHA-1 and MD5 hashes of text or files.',
  desc:
    'Free online hash generator. Compute SHA-256, SHA-384, SHA-512, SHA-1, MD5 and CRC32 checksums for text or files directly in your browser, with hex and Base64 output.',
  intro:
    'Hash text or a file locally in your browser. Nothing is uploaded, so you can safely check confidential documents.',
  body: `<div class="tool">
  <label for="in">Text to hash</label>
  <textarea id="in" spellcheck="false" placeholder="hello world"></textarea>
  <div class="row"><label style="margin:0"><input type="checkbox" id="b64" style="width:auto"> Base64 output</label>
  <label style="margin:0"><input type="checkbox" id="upper" style="width:auto"> uppercase hex</label></div>
  <table><thead><tr><th>Algorithm</th><th>Digest</th></tr></thead><tbody id="out"></tbody></table>
  <hr style="margin:20px 0">
  <h2>File checksum</h2>
  <div class="row"><input type="file" id="file" aria-label="Choose a file to hash" style="width:auto"><span id="finfo" class="muted"></span></div>
  <table><tbody id="fout"></tbody></table>
  <div class="row"><label style="margin:0;flex:1">Compare with a published checksum
    <input type="text" id="expect" placeholder="Paste the expected hash here" spellcheck="false"></label></div>
  <p id="verdict"></p>
</div>`,
  about: `<h2>What a hash function does</h2>
<p>A cryptographic hash turns any input, of any size, into a fixed-length fingerprint. The same input always produces the same digest; changing a single bit produces a completely different one; and there is no practical way to run the process backwards. That combination makes hashes useful for verifying integrity, deduplicating data and storing password verifiers.</p>
<h2>Which algorithm to use</h2>
<table>
<tr><th>Algorithm</th><th>Digest size</th><th>Status</th></tr>
<tr><td>MD5</td><td>128 bits</td><td><strong>Broken.</strong> Collisions can be produced in seconds. Non-security checksums only.</td></tr>
<tr><td>SHA-1</td><td>160 bits</td><td><strong>Broken.</strong> A practical collision was demonstrated in 2017; browsers and certificate authorities rejected it years ago.</td></tr>
<tr><td>SHA-256</td><td>256 bits</td><td><strong>Recommended.</strong> The current default for signatures, certificates and file integrity.</td></tr>
<tr><td>SHA-384 / SHA-512</td><td>384 / 512 bits</td><td>Also fine, and often faster than SHA-256 on 64-bit hardware.</td></tr>
<tr><td>CRC32</td><td>32 bits</td><td>Not cryptographic at all — an error-detection checksum for archives and network frames.</td></tr>
</table>
<h2>Never hash passwords with these</h2>
<p>SHA-256 is designed to be fast, which is exactly wrong for passwords: a modern GPU computes billions of SHA-256 hashes per second. Password storage needs a deliberately slow, salted, memory-hard function — <strong>Argon2id</strong>, <strong>scrypt</strong> or <strong>bcrypt</strong>. Use a maintained library and never write your own scheme.</p>
<h2>Verifying a download</h2>
<p>Projects publish a SHA-256 digest next to their release files. After downloading, hash the file and compare. A mismatch means the file is corrupt or has been tampered with. Note that a checksum hosted on the same page as the download only protects against corruption — for tamper protection you need a signature from a key you already trust.</p>
<h2>Collisions and preimages</h2>
<p>A <em>collision</em> is two different inputs with the same digest; a <em>preimage</em> is finding an input that produces a given digest. Collision resistance is the weaker property and is what falls first — MD5 and SHA-1 are collision-broken but not preimage-broken, which is why old <code>md5sum</code> checks still catch accidental corruption even though they cannot stop a determined attacker.</p>`,
  faq: [
    { q: 'Is my file uploaded to compute the hash?', a: 'No. The Web Crypto API hashes the file in your browser. You can disconnect from the network and the tool still works.' },
    { q: 'Can a hash be reversed?', a: 'Not by computation. Short or common inputs can be found by brute force or in a rainbow table, which is why password hashing needs a unique salt and a deliberately slow algorithm.' },
    { q: 'Why is MD5 still everywhere if it is broken?', a: 'It is fast and short, and for detecting accidental corruption it works fine. The break matters when an attacker can choose the input — then two different files can be crafted with the same MD5.' },
    { q: 'Why does the same file give a different hash on another site?', a: 'Almost always a different algorithm, or a text input with different line endings. A file that ends <code>\\r\\n</code> on Windows hashes differently from the same file with Unix line endings.' },
    { q: 'What is the difference between hex and Base64 output?', a: 'Both encode the same bytes. Hex is twice the digest length and easy to read; Base64 is about a third shorter and is what HTTP headers such as <code>Content-Digest</code> and subresource integrity attributes use.' },
  ],
  related: ['base64-encode-decode', 'password-generator', 'uuid-generator'],
  script: `
const $=s=>document.querySelector(s);
const ALGS=['SHA-256','SHA-384','SHA-512','SHA-1'];
function hex(buf){return [...new Uint8Array(buf)].map(b=>b.toString(16).padStart(2,'0')).join('')}
function b64(buf){let s='';for(const b of new Uint8Array(buf))s+=String.fromCharCode(b);return btoa(s)}
function out(buf){let s=$('#b64').checked?b64(buf):hex(buf);if(!$('#b64').checked&&$('#upper').checked)s=s.toUpperCase();return s}
// Compact MD5 (RFC 1321) — legacy checksums only.
function md5(bytes){
  const S=[7,12,17,22,7,12,17,22,7,12,17,22,7,12,17,22,5,9,14,20,5,9,14,20,5,9,14,20,5,9,14,20,
           4,11,16,23,4,11,16,23,4,11,16,23,4,11,16,23,6,10,15,21,6,10,15,21,6,10,15,21,6,10,15,21];
  const K=[];for(let i=0;i<64;i++)K[i]=Math.floor(Math.abs(Math.sin(i+1))*4294967296);
  const len=bytes.length,bits=len*8;
  const pad=new Uint8Array(((len+8)>>6<<6)+64);
  pad.set(bytes);pad[len]=0x80;
  new DataView(pad.buffer).setUint32(pad.length-8,bits>>>0,true);
  new DataView(pad.buffer).setUint32(pad.length-4,Math.floor(bits/4294967296),true);
  let a0=0x67452301,b0=0xefcdab89,c0=0x98badcfe,d0=0x10325476;
  const dv=new DataView(pad.buffer);
  const rl=(x,c)=>(x<<c)|(x>>>(32-c));
  for(let off=0;off<pad.length;off+=64){
    const M=[];for(let i=0;i<16;i++)M[i]=dv.getUint32(off+i*4,true);
    let A=a0,B=b0,C=c0,D=d0;
    for(let i=0;i<64;i++){
      let F,g;
      if(i<16){F=(B&C)|(~B&D);g=i}
      else if(i<32){F=(D&B)|(~D&C);g=(5*i+1)%16}
      else if(i<48){F=B^C^D;g=(3*i+5)%16}
      else{F=C^(B|~D);g=(7*i)%16}
      F=(F+A+K[i]+M[g])>>>0;A=D;D=C;C=B;B=(B+rl(F,S[i]))>>>0;
    }
    a0=(a0+A)>>>0;b0=(b0+B)>>>0;c0=(c0+C)>>>0;d0=(d0+D)>>>0;
  }
  const buf=new ArrayBuffer(16),v=new DataView(buf);
  [a0,b0,c0,d0].forEach((x,i)=>v.setUint32(i*4,x,true));
  return buf;
}
let CRC;function crc32(bytes){
  if(!CRC){CRC=new Uint32Array(256);for(let n=0;n<256;n++){let c=n;for(let k=0;k<8;k++)c=c&1?0xEDB88320^(c>>>1):c>>>1;CRC[n]=c>>>0}}
  let c=0xFFFFFFFF;for(const b of bytes)c=CRC[(c^b)&0xFF]^(c>>>8);
  return ((c^0xFFFFFFFF)>>>0).toString(16).padStart(8,'0');
}
async function hashAll(bytes,target){
  const rows=[];
  for(const a of ALGS){
    const d=await crypto.subtle.digest(a,bytes);
    rows.push([a,out(d)]);
  }
  rows.push(['MD5 <span class="pill">legacy</span>',out(md5(bytes))]);
  rows.push(['CRC32 <span class="pill">not cryptographic</span>',crc32(bytes)]);
  target.innerHTML=rows.map(r=>'<tr><td>'+r[0]+'</td><td class="out" style="word-break:break-all">'+r[1]+'</td></tr>').join('');
  check();
}
const te=new TextEncoder();
let timer;
function textRun(){clearTimeout(timer);timer=setTimeout(()=>{
  const t=$('#in').value;
  if(!t){$('#out').innerHTML='<tr><td colspan="2" class="muted">Enter text above to see its hashes.</td></tr>';return}
  hashAll(te.encode(t),$('#out'));},120)}
$('#in').addEventListener('input',textRun);
['#b64','#upper'].forEach(s=>$(s).addEventListener('change',()=>{textRun();if(window._fb)hashAll(window._fb,$('#fout'))}));
$('#file').addEventListener('change',e=>{
  const f=e.target.files[0];if(!f)return;
  $('#finfo').textContent='Hashing '+f.name+' ('+(f.size/1048576).toFixed(2)+' MB)…';
  f.arrayBuffer().then(b=>{window._fb=new Uint8Array(b);$('#finfo').textContent=f.name+' — '+(f.size/1048576).toFixed(2)+' MB';hashAll(window._fb,$('#fout'))});
});
function check(){
  const e=$('#expect').value.trim().toLowerCase();
  if(!e){$('#verdict').textContent='';return}
  const all=[...document.querySelectorAll('#out td:last-child, #fout td:last-child')].map(td=>td.textContent.trim().toLowerCase());
  if(all.includes(e)){$('#verdict').innerHTML='<span class="ok">✓ Match — the checksum is identical.</span>'}
  else{$('#verdict').innerHTML='<span class="err">✗ No match against any digest above.</span>'}
}
$('#expect').addEventListener('input',check);
textRun();
`,
};
