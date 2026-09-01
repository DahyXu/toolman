export default {
  slug: 'json-formatter',
  cat: 'dev',
  weight: 10,
  title: 'JSON Formatter & Validator',
  metaTitle: 'JSON Formatter & Validator — Free Online JSON Beautifier | Toolman',
  short: 'Beautify, minify and validate JSON with precise error positions.',
  desc:
    'Free online JSON formatter, validator and beautifier. Paste JSON to pretty-print it with 2 or 4 space indentation, minify it, or find the exact line of a syntax error. Runs entirely in your browser.',
  intro:
    'Paste JSON below to instantly beautify, minify or validate it. Everything is parsed locally in your browser — your data is never uploaded.',
  body: `<div class="tool">
  <div class="row">
    <button class="primary" data-act="format">Format</button>
    <button data-act="minify">Minify</button>
    <button data-act="sort">Sort keys</button>
    <button data-act="escape">Escape</button>
    <button data-act="unescape">Unescape</button>
    <select id="ind" aria-label="Indentation" style="width:auto"><option value="2">2 spaces</option><option value="4">4 spaces</option><option value="\t">Tab</option></select>
    <button data-act="copy">Copy</button>
    <button data-act="sample">Sample</button>
    <button data-act="clear">Clear</button>
  </div>
  <label for="in">JSON input</label>
  <textarea id="in" spellcheck="false" placeholder='{"hello":"world","items":[1,2,3]}'></textarea>
  <p id="msg" class="muted" role="status" aria-live="polite">Waiting for input…</p>
  <label for="out">Result</label>
  <textarea id="out" spellcheck="false" readonly></textarea>
</div>`,
  about: `<h2>What this JSON formatter does</h2>
<p>JSON is easy for machines to read and hard for humans to read once it has been minified into a single line. This tool re-indents it, highlights where a syntax error is, and can strip whitespace again when you need the compact version.</p>
<ul>
<li><strong>Format</strong> — pretty-print with 2 spaces, 4 spaces or tab indentation.</li>
<li><strong>Minify</strong> — remove every unnecessary byte of whitespace.</li>
<li><strong>Sort keys</strong> — recursively order object keys alphabetically, which makes two JSON documents much easier to diff.</li>
<li><strong>Escape / Unescape</strong> — turn JSON into a quoted string that can be embedded in source code, and back again.</li>
<li><strong>Validate</strong> — get the character offset, line and column of the first syntax error.</li>
</ul>
<h2>Common JSON syntax errors</h2>
<table>
<tr><th>Error</th><th>Cause</th></tr>
<tr><td>Unexpected token <code>}</code></td><td>A trailing comma after the last property. JSON does not allow them.</td></tr>
<tr><td>Unexpected token <code>'</code></td><td>Single quotes. JSON strings must use double quotes.</td></tr>
<tr><td>Unexpected token <code>N</code></td><td>A bare <code>NaN</code> or <code>Infinity</code> value, which JSON has no representation for.</td></tr>
<tr><td>Unexpected end of JSON input</td><td>A missing closing brace or bracket, often from a truncated response.</td></tr>
<tr><td>Unexpected token <code>/</code></td><td>Comments. Standard JSON has no comment syntax (JSONC and JSON5 do).</td></tr>
</table>`,
  faq: [
    { q: 'Is my JSON uploaded to a server?', a: 'No. The page contains a small script that calls the browser’s built-in <code>JSON.parse</code> and <code>JSON.stringify</code>. Nothing is transmitted anywhere, so you can safely format configuration files or API responses that contain secrets.' },
    { q: 'What is the maximum size I can format?', a: 'The limit is your browser’s memory, not ours. Documents of a few megabytes format almost instantly; files above roughly 50&nbsp;MB may make the tab unresponsive for a moment.' },
    { q: 'Why does sorting keys matter?', a: 'Object key order is not meaningful in JSON, but text diff tools compare line by line. Sorting both documents first removes noise and leaves only the real differences.' },
    { q: 'Does it support JSON with comments?', a: 'Standard JSON does not allow comments, so <code>// like this</code> will be reported as a syntax error. Remove comments first, or use a JSONC-aware parser.' },
    { q: 'What is the difference between formatting and minifying?', a: 'Formatting adds indentation and newlines for humans. Minifying removes them to make the payload smaller for transmission. Both produce exactly the same data.' },
  ],
  related: ['json-to-csv', 'base64-encode-decode', 'diff-checker', 'url-encode-decode'],
  script: `
const $=s=>document.querySelector(s),I=$('#in'),O=$('#out'),M=$('#msg');
const sortKeys=v=>Array.isArray(v)?v.map(sortKeys):(v&&typeof v==='object'?Object.keys(v).sort().reduce((a,k)=>(a[k]=sortKeys(v[k]),a),{}):v);
function lineCol(t,p){const s=t.slice(0,p).split('\\n');return s.length+':'+(s[s.length-1].length+1)}
function parse(){
  const t=I.value.trim();
  if(!t){M.textContent='Waiting for input…';M.className='muted';return null}
  try{const v=JSON.parse(t);M.textContent='✓ Valid JSON — '+t.length.toLocaleString()+' characters';M.className='ok';return {v,t}}
  catch(e){
    const m=/position (\\d+)/.exec(e.message);
    M.textContent='✗ '+e.message+(m?' (line:col '+lineCol(t,+m[1])+')':'');M.className='err';return null}
}
function run(act){
  const ind=$('#ind').value==='\\t'?'\\t':+$('#ind').value;
  if(act==='clear'){I.value='';O.value='';parse();return}
  if(act==='sample'){I.value='{"name":"Toolman","tags":["json","free"],"nested":{"b":2,"a":1},"ok":true,"count":42}';act='format'}
  if(act==='copy'){O.select();document.execCommand('copy');M.textContent='Copied to clipboard';M.className='ok';return}
  if(act==='unescape'){try{O.value=JSON.parse(I.value.trim().startsWith('"')?I.value.trim():JSON.stringify(I.value));M.textContent='Unescaped';M.className='ok'}catch(e){M.textContent='✗ '+e.message;M.className='err'}return}
  const r=parse(); if(!r)return;
  if(act==='format')O.value=JSON.stringify(r.v,null,ind);
  else if(act==='minify')O.value=JSON.stringify(r.v);
  else if(act==='sort')O.value=JSON.stringify(sortKeys(r.v),null,ind);
  else if(act==='escape')O.value=JSON.stringify(JSON.stringify(r.v));
}
document.addEventListener('click',e=>{const b=e.target.closest('[data-act]');if(b)run(b.dataset.act)});
I.addEventListener('input',()=>parse());
$('#ind').addEventListener('change',()=>run('format'));
`,
};
