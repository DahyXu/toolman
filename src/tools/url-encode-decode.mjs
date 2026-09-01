export default {
  slug: 'url-encode-decode',
  cat: 'dev',
  weight: 7,
  title: 'URL Encoder & Decoder',
  metaTitle: 'URL Encoder / Decoder Online — Percent Encoding | Toolman',
  short: 'Percent-encode or decode URLs and query strings, with a parameter breakdown.',
  desc:
    'Free online URL encoder and decoder. Percent-encode text for use in a URL, decode escaped URLs, and split any URL into its scheme, host, path and query parameters.',
  intro: 'Encode text for safe use in a URL, decode a percent-escaped string, or paste a full URL to see its parts.',
  body: `<div class="tool">
  <div class="row">
    <button class="primary" data-act="encode">Encode →</button>
    <button data-act="decode">← Decode</button>
    <label style="margin:0"><input type="checkbox" id="comp" checked style="width:auto"> encode reserved characters (<code>encodeURIComponent</code>)</label>
    <button data-act="swap">Swap</button><button data-act="clear">Clear</button>
  </div>
  <div class="grid2">
    <div><label for="in">Plain text</label><textarea id="in" spellcheck="false" placeholder="hello world & more"></textarea></div>
    <div><label for="out">Encoded</label><textarea id="out" spellcheck="false" placeholder="hello%20world%20%26%20more"></textarea></div>
  </div>
  <p id="msg" class="muted"></p>
  <hr style="margin:20px 0">
  <h3>URL parser</h3>
  <input type="text" id="url" placeholder="https://example.com/path?utm_source=news&q=hello+world#top">
  <div id="parts" style="margin-top:12px"></div>
</div>`,
  about: `<h2>What percent encoding is for</h2>
<p>A URL may only contain a limited set of ASCII characters. Anything else — spaces, non-Latin letters, emoji — and any character that has structural meaning in a URL must be written as <code>%</code> followed by its two-digit hexadecimal byte value in UTF-8. A space becomes <code>%20</code>, an ampersand becomes <code>%26</code>, and <code>é</code> becomes <code>%C3%A9</code> because it is two bytes in UTF-8.</p>
<h2>encodeURI vs encodeURIComponent</h2>
<p>These two JavaScript functions are the source of endless bugs:</p>
<table>
<tr><th></th><th>encodeURI</th><th>encodeURIComponent</th></tr>
<tr><td>Intended for</td><td>A complete URL</td><td>A single value inside a URL</td></tr>
<tr><td>Leaves untouched</td><td><code>: / ? # [ ] @ ! $ &amp; ' ( ) * + , ; =</code></td><td>Only <code>- _ . ! ~ * ' ( )</code></td></tr>
<tr><td>Use it when</td><td>You already have a valid URL and just want to escape spaces and non-ASCII</td><td>You are inserting a query parameter, path segment or form value</td></tr>
</table>
<p>The rule of thumb: if you are building a URL from parts, use <code>encodeURIComponent</code> on every part. Using <code>encodeURI</code> on a parameter value leaves <code>&amp;</code> and <code>=</code> intact, which lets a value inject extra parameters.</p>
<h2>Reserved characters worth remembering</h2>
<table>
<tr><th>Character</th><th>Encoded</th><th>Why it matters</th></tr>
<tr><td>space</td><td><code>%20</code> (or <code>+</code> in form data)</td><td>Breaks the URL at the first space in many parsers</td></tr>
<tr><td><code>&amp;</code></td><td><code>%26</code></td><td>Separates query parameters</td></tr>
<tr><td><code>=</code></td><td><code>%3D</code></td><td>Separates a parameter name from its value</td></tr>
<tr><td><code>#</code></td><td><code>%23</code></td><td>Starts the fragment; everything after it is never sent to the server</td></tr>
<tr><td><code>?</code></td><td><code>%3F</code></td><td>Starts the query string</td></tr>
<tr><td><code>/</code></td><td><code>%2F</code></td><td>Separates path segments</td></tr>
<tr><td><code>+</code></td><td><code>%2B</code></td><td>Means "space" in form encoding, so a literal plus must be escaped</td></tr>
<tr><td><code>%</code></td><td><code>%25</code></td><td>Starts an escape sequence — double-encoding bugs start here</td></tr>
</table>
<h2>Double encoding</h2>
<p>Encoding an already-encoded string turns <code>%20</code> into <code>%2520</code>. If your URLs contain <code>%25</code> where you expected a space, some layer is encoding twice — usually a framework helper applied on top of manual encoding.</p>`,
  faq: [
    { q: 'Why is a space sometimes %20 and sometimes +?', a: 'In the path and in modern query strings a space is <code>%20</code>. In <code>application/x-www-form-urlencoded</code> data — what an HTML form submits — it is <code>+</code>. Both decode back to a space, but only in the right context.' },
    { q: 'Should I encode the whole URL?', a: 'No. Encode each piece before assembling. Encoding a finished URL escapes the <code>://</code> and <code>?</code> that give it structure, or leaves parameter separators unescaped inside values.' },
    { q: 'Does URL encoding provide any security?', a: 'It prevents structural injection into a URL, which matters. It is not a defence against XSS or SQL injection — those need output escaping and parameterised queries at their own layer.' },
    { q: 'How are non-English characters handled?', a: 'They are converted to UTF-8 bytes first, then each byte is percent-escaped. That is why one Chinese character usually becomes three <code>%</code> sequences.' },
  ],
  related: ['base64-encode-decode', 'json-formatter', 'hash-generator'],
  script: `
const $=s=>document.querySelector(s),I=$('#in'),O=$('#out'),M=$('#msg');
const enc=()=>{try{O.value=$('#comp').checked?encodeURIComponent(I.value):encodeURI(I.value);M.textContent=''}catch(e){M.textContent='✗ '+e.message;M.className='err'}};
const dec=()=>{try{I.value=decodeURIComponent(O.value.replace(/\\+/g,' '));M.textContent='';M.className='muted'}catch(e){M.textContent='✗ Malformed escape sequence — check for a stray % sign.';M.className='err'}};
I.addEventListener('input',enc);
O.addEventListener('input',()=>{if(document.activeElement===O)dec()});
$('#comp').addEventListener('change',enc);
document.addEventListener('click',e=>{const b=e.target.closest('[data-act]');if(!b)return;const a=b.dataset.act;
 if(a==='encode')enc();else if(a==='decode')dec();
 else if(a==='swap'){const t=I.value;I.value=O.value;O.value=t}
 else{I.value='';O.value='';M.textContent=''}});
function parse(){
  const v=$('#url').value.trim();
  if(!v){$('#parts').innerHTML='';return}
  let u;try{u=new URL(v)}catch(_){try{u=new URL('https://'+v)}catch(e){$('#parts').innerHTML='<p class="err">Not a valid URL.</p>';return}}
  const rows=[['Scheme',u.protocol.replace(':','')],['Host',u.hostname],['Port',u.port||'(default)'],['Path',u.pathname],['Query',u.search||'(none)'],['Fragment',u.hash||'(none)']]
    .map(r=>'<tr><td>'+r[0]+'</td><td class="out">'+r[1].replace(/&/g,'&amp;').replace(/</g,'&lt;')+'</td></tr>').join('');
  const ps=[...u.searchParams].map(([k,val])=>'<tr><td><code>'+k.replace(/</g,'&lt;')+'</code></td><td class="out">'+val.replace(/&/g,'&amp;').replace(/</g,'&lt;')+'</td></tr>').join('');
  $('#parts').innerHTML='<table>'+rows+'</table>'+(ps?'<h4>Query parameters</h4><table><thead><tr><th>Name</th><th>Decoded value</th></tr></thead><tbody>'+ps+'</tbody></table>':'');
}
$('#url').addEventListener('input',parse);
`,
};
