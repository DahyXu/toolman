export default {
  slug: 'base64-encode-decode',
  cat: 'dev',
  weight: 9,
  title: 'Base64 Encoder & Decoder',
  metaTitle: 'Base64 Encode / Decode Online — Text, Files & Images | Toolman',
  short: 'Encode or decode Base64 text, files and data URLs, with UTF-8 support.',
  desc:
    'Free online Base64 encoder and decoder. Convert text, files and images to Base64 or data URLs and back again, with full UTF-8 and URL-safe support. Everything runs in your browser.',
  intro:
    'Convert text or files to Base64 and back. UTF-8 is handled correctly, URL-safe output is one click away, and files never leave your device.',
  body: `<div class="tool">
  <div class="row">
    <button class="primary" data-act="encode">Encode →</button>
    <button data-act="decode">← Decode</button>
    <label style="margin:0"><input type="checkbox" id="urlsafe" style="width:auto"> URL-safe</label>
    <label style="margin:0"><input type="checkbox" id="nopad" style="width:auto"> no padding</label>
    <button data-act="swap">Swap</button>
    <button data-act="copy">Copy output</button>
    <button data-act="clear">Clear</button>
  </div>
  <div class="grid2">
    <div><label for="in">Plain text</label><textarea id="in" spellcheck="false" placeholder="Hello, world!"></textarea></div>
    <div><label for="out">Base64</label><textarea id="out" spellcheck="false" placeholder="SGVsbG8sIHdvcmxkIQ=="></textarea></div>
  </div>
  <p id="msg" class="muted" role="status" aria-live="polite"></p>
  <hr style="margin:20px 0">
  <h2>File to Base64 / data URL</h2>
  <div class="row"><input type="file" id="file" aria-label="Choose a file to encode" style="width:auto"></div>
  <p class="muted" id="finfo"></p>
  <textarea id="fout" aria-label="File as a data URL" spellcheck="false" readonly placeholder="data:image/png;base64,…"></textarea>
  <div class="row"><button data-act="fcopy">Copy data URL</button><button data-act="fraw">Copy Base64 only</button></div>
  <div id="prev"></div>
</div>`,
  about: `<h2>What Base64 actually does</h2>
<p>Base64 maps arbitrary binary data onto 64 printable ASCII characters (<code>A–Z</code>, <code>a–z</code>, <code>0–9</code>, <code>+</code>, <code>/</code>) so it can travel through channels that only accept text — email bodies, JSON fields, HTTP headers, XML documents or source code. Every 3 bytes of input become 4 characters of output, so encoded data is about <strong>33% larger</strong> than the original.</p>
<h2>Standard vs URL-safe</h2>
<p>The standard alphabet uses <code>+</code> and <code>/</code>, both of which have special meaning inside URLs. The URL-safe variant (RFC&nbsp;4648 §5) replaces them with <code>-</code> and <code>_</code>, and usually drops the trailing <code>=</code> padding. JSON Web Tokens use this variant, which is why a JWT contains no <code>+</code>, <code>/</code> or <code>=</code>.</p>
<h2>Data URLs</h2>
<p>A data URL embeds a file directly inside a document: <code>data:image/png;base64,iVBORw0KGgo…</code>. It removes an HTTP request, which is useful for tiny icons in CSS or single-file HTML exports. Because of the 33% size penalty it is a poor choice for anything larger than a few kilobytes.</p>
<h2>Base64 is not encryption</h2>
<p>Anyone can decode Base64 instantly — there is no key and no secret. It is an <em>encoding</em>, meant to preserve data across text-only transports, not a way to protect it. Never use it to hide passwords, tokens or personal data.</p>`,
  faq: [
    { q: 'Does this tool handle emoji and non-Latin text?', a: 'Yes. Text is converted to UTF-8 bytes before encoding using <code>TextEncoder</code>, so Chinese, Arabic, accented characters and emoji all round-trip correctly. Naive implementations that call <code>btoa()</code> directly throw an error on these inputs.' },
    { q: 'Why does my Base64 string end in one or two equals signs?', a: 'Base64 works on groups of three bytes. When the input length is not a multiple of three, <code>=</code> characters pad the final group so decoders know how many real bytes it held.' },
    { q: 'Are my files uploaded?', a: 'No. Files are read with the browser’s FileReader API and encoded locally. Nothing is transmitted, so the tool works offline and is safe for private documents.' },
    { q: 'How large a file can I convert?', a: 'Files up to a few tens of megabytes work fine. Beyond that the resulting string may exhaust the tab’s memory, since the encoded text is a third larger than the file itself.' },
    { q: 'Why does decoding fail with "invalid character"?', a: 'The input contains characters outside the Base64 alphabet — often a stray space, a line break from copy-paste, or URL-safe <code>-</code>/<code>_</code> while standard mode is selected. Tick "URL-safe" or clean the whitespace and try again.' },
  ],
  related: ['url-encode-decode', 'hash-generator', 'json-formatter'],
  script: `
const $=s=>document.querySelector(s),I=$('#in'),O=$('#out'),M=$('#msg');
const enc=new TextEncoder(),dec=new TextDecoder();
function b64(bytes){let s='';for(const b of bytes)s+=String.fromCharCode(b);return btoa(s)}
function unb64(str){const s=atob(str);const a=new Uint8Array(s.length);for(let i=0;i<s.length;i++)a[i]=s.charCodeAt(i);return a}
function post(s){if($('#urlsafe').checked)s=s.replace(/\\+/g,'-').replace(/\\//g,'_');if($('#nopad').checked)s=s.replace(/=+$/,'');return s}
function pre(s){s=s.trim().replace(/\\s+/g,'').replace(/-/g,'+').replace(/_/g,'/');while(s.length%4)s+='=';return s}
function encode(){try{O.value=post(b64(enc.encode(I.value)));M.textContent='Encoded '+I.value.length+' chars → '+O.value.length+' chars';M.className='ok'}catch(e){M.textContent='✗ '+e.message;M.className='err'}}
function decode(){try{I.value=dec.decode(unb64(pre(O.value)));M.textContent='Decoded successfully';M.className='ok'}catch(e){M.textContent='✗ Not valid Base64: '+e.message;M.className='err'}}
document.addEventListener('click',e=>{const b=e.target.closest('[data-act]');if(!b)return;const a=b.dataset.act;
 if(a==='encode')encode();
 else if(a==='decode')decode();
 else if(a==='swap'){const t=I.value;I.value=O.value;O.value=t}
 else if(a==='copy'){O.select();document.execCommand('copy');M.textContent='Copied';M.className='ok'}
 else if(a==='clear'){I.value='';O.value='';M.textContent=''}
 else if(a==='fcopy'||a==='fraw'){const F=$('#fout');const full=F.value;if(a==='fraw'){F.value=full.split(',')[1]||full}F.select();document.execCommand('copy');F.value=full;M.textContent='Copied';M.className='ok'}
});
I.addEventListener('input',encode);
O.addEventListener('input',()=>{if(document.activeElement===O)decode()});
$('#urlsafe').addEventListener('change',encode);$('#nopad').addEventListener('change',encode);
$('#file').addEventListener('change',e=>{const f=e.target.files[0];if(!f)return;
 const r=new FileReader();
 r.onload=()=>{$('#fout').value=r.result;
  $('#finfo').textContent=f.name+' — '+(f.size/1024).toFixed(1)+' KB → '+(r.result.length/1024).toFixed(1)+' KB encoded';
  $('#prev').innerHTML=f.type.startsWith('image/')?'<img src="'+r.result+'" alt="preview" style="max-width:200px;margin-top:10px;border-radius:8px">':'';};
 r.readAsDataURL(f)});
`,
};
