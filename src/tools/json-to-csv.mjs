export default {
  slug: 'json-to-csv',
  cat: 'dev',
  weight: 8,
  title: 'JSON to CSV Converter',
  metaTitle: 'JSON to CSV Converter — Free Online, Both Directions | Toolman',
  short: 'Convert JSON arrays to CSV and CSV back to JSON, with nested key flattening.',
  desc:
    'Free online JSON to CSV converter. Turn a JSON array into a spreadsheet-ready CSV with automatic column detection and nested object flattening — or convert CSV back to JSON. Runs in your browser.',
  intro:
    'Paste a JSON array to get CSV, or paste CSV to get JSON. Nested objects are flattened into dotted column names such as <code>address.city</code>.',
  body: `<div class="tool">
  <div class="row">
    <button class="primary" data-act="tocsv">JSON → CSV</button>
    <button data-act="tojson">CSV → JSON</button>
    <label style="margin:0">Delimiter <select id="d" style="width:auto"><option value=",">Comma</option><option value=";">Semicolon</option><option value="\t">Tab</option><option value="|">Pipe</option></select></label>
    <label style="margin:0"><input type="checkbox" id="flat" checked style="width:auto"> flatten nested objects</label>
    <button data-act="copy">Copy output</button>
    <button data-act="dl">Download</button>
    <button data-act="sample">Sample</button>
  </div>
  <div class="grid2">
    <div><label for="in">Input</label><textarea id="in" spellcheck="false" placeholder='[{"id":1,"name":"Ada"},{"id":2,"name":"Linus"}]'></textarea></div>
    <div><label for="out">Output</label><textarea id="out" spellcheck="false" readonly></textarea></div>
  </div>
  <p id="msg" class="muted"></p>
  <div id="preview"></div>
</div>`,
  about: `<h2>How the conversion works</h2>
<p>A CSV file is a flat grid; JSON is a tree. Converting between them means deciding how nesting maps onto columns.</p>
<ul>
<li><strong>Columns</strong> are collected from every object in the array, so records with different keys still line up — missing values become empty cells.</li>
<li><strong>Nested objects</strong> are flattened with dotted paths: <code>{"user":{"name":"Ada"}}</code> becomes a column called <code>user.name</code>.</li>
<li><strong>Arrays</strong> inside a record are serialised back to JSON inside the cell, since a single cell cannot hold multiple values.</li>
<li><strong>Escaping</strong> follows RFC 4180 — any value containing the delimiter, a quote or a newline is wrapped in double quotes, and internal quotes are doubled.</li>
</ul>
<h2>Things that break CSV files</h2>
<table>
<tr><th>Problem</th><th>What happens</th><th>Fix</th></tr>
<tr><td>Commas inside values</td><td>Columns shift right from that row on</td><td>Quote the field — this tool does it automatically</td></tr>
<tr><td>Leading zeros (<code>007</code>)</td><td>Excel strips them and shows <code>7</code></td><td>Import as text rather than double-clicking the file</td></tr>
<tr><td>Long numbers (IDs, phone numbers)</td><td>Converted to scientific notation</td><td>Same — set the column type to text on import</td></tr>
<tr><td>Non-ASCII characters</td><td>Mojibake in Excel on Windows</td><td>Save as UTF-8 with a byte-order mark, or use the import wizard</td></tr>
<tr><td>Semicolon locales</td><td>Everything lands in one column</td><td>Switch the delimiter above to semicolon</td></tr>
</table>
<h2>When not to use CSV</h2>
<p>CSV has no types, no schema and no standard for nesting. If the consumer is another program rather than a spreadsheet, JSON, NDJSON or Parquet will save everyone time. CSV earns its place when a human needs to open the file in Excel, Numbers or Google Sheets.</p>`,
  faq: [
    { q: 'What JSON shape does this expect?', a: 'An array of objects — <code>[{...}, {...}]</code>. A single object is treated as a one-row array, and an object whose only value is an array is unwrapped automatically.' },
    { q: 'How are nested objects handled?', a: 'They are flattened into dotted column names by default. Turn the checkbox off to keep the nested structure serialised as JSON inside a single cell instead.' },
    { q: 'Is my data uploaded?', a: 'No. Parsing and conversion happen in your browser, so customer exports and internal data stay on your machine.' },
    { q: 'Why does Excel show my CSV in a single column?', a: 'Excel follows your regional list separator. In many European locales that is a semicolon, not a comma. Switch the delimiter above to semicolon and re-export.' },
    { q: 'Can it handle large files?', a: 'Files up to a few tens of megabytes convert fine. Beyond that, a streaming command-line tool such as <code>jq</code> or <code>miller</code> is a better fit.' },
  ],
  related: ['json-formatter', 'base64-encode-decode', 'text-diff-checker'],
  script: `
const $=s=>document.querySelector(s),I=$('#in'),O=$('#out'),M=$('#msg');
const del=()=>$('#d').value==='\\t'?'\\t':$('#d').value;
function flatten(o,p,out){
  for(const k in o){
    const v=o[k],key=p?p+'.'+k:k;
    if(v&&typeof v==='object'&&!Array.isArray(v)&&$('#flat').checked)flatten(v,key,out);
    else out[key]=v&&typeof v==='object'?JSON.stringify(v):v;
  }
  return out;
}
function esc(v,d){
  if(v===null||v===undefined)return '';
  const s=String(v);
  return /["\\n\\r]/.test(s)||s.includes(d)?'"'+s.replace(/"/g,'""')+'"':s;
}
function toCsv(){
  let data;
  try{data=JSON.parse(I.value)}catch(e){M.textContent='✗ '+e.message;M.className='err';return}
  if(!Array.isArray(data)){
    const arrs=data&&typeof data==='object'?Object.values(data).filter(Array.isArray):[];
    data=arrs.length===1?arrs[0]:[data];
  }
  if(!data.length){M.textContent='✗ Empty array — nothing to convert.';M.className='err';return}
  const rows=data.map(r=>(r&&typeof r==='object'&&!Array.isArray(r))?flatten(r,'',{}):{value:r});
  const cols=[];const seen=new Set();
  for(const r of rows)for(const k in r)if(!seen.has(k)){seen.add(k);cols.push(k)}
  const d=del();
  const lines=[cols.map(c=>esc(c,d)).join(d)];
  for(const r of rows)lines.push(cols.map(c=>esc(r[c],d)).join(d));
  O.value=lines.join('\\n');
  M.textContent='✓ '+rows.length.toLocaleString()+' rows × '+cols.length+' columns';M.className='ok';
  preview(lines.slice(0,11),d);
}
function parseCsv(text,d){
  const rows=[];let row=[],cur='',q=false;
  for(let i=0;i<text.length;i++){
    const c=text[i];
    if(q){ if(c==='"'){ if(text[i+1]==='"'){cur+='"';i++} else q=false } else cur+=c }
    else if(c==='"')q=true;
    else if(c===d){row.push(cur);cur=''}
    else if(c==='\\n'){row.push(cur);rows.push(row);row=[];cur=''}
    else if(c!=='\\r')cur+=c;
  }
  if(cur||row.length){row.push(cur);rows.push(row)}
  return rows.filter(r=>r.length>1||r[0]!=='');
}
function toJson(){
  const d=del();
  const rows=parseCsv(I.value,d);
  if(rows.length<2){M.textContent='✗ Need a header row and at least one data row.';M.className='err';return}
  const head=rows[0];
  const out=rows.slice(1).map(r=>{
    const o={};
    head.forEach((h,i)=>{
      let v=r[i]===undefined?'':r[i];
      if(v!==''&&!isNaN(v)&&/^-?\\d*\\.?\\d+(e[-+]?\\d+)?$/i.test(v))v=Number(v);
      else if(v==='true')v=true;else if(v==='false')v=false;else if(v==='null')v=null;
      o[h]=v;
    });
    return o;
  });
  O.value=JSON.stringify(out,null,2);
  M.textContent='✓ '+out.length.toLocaleString()+' records';M.className='ok';
  preview(rows.slice(0,11).map(r=>r.join(d)),d);
}
function preview(lines,d){
  const cells=lines.map(l=>parseCsv(l,d)[0]||[]);
  if(!cells.length){$('#preview').innerHTML='';return}
  $('#preview').innerHTML='<h3>Preview</h3><div style="overflow-x:auto"><table><thead><tr>'+
    cells[0].map(h=>'<th>'+String(h).replace(/</g,'&lt;')+'</th>').join('')+'</tr></thead><tbody>'+
    cells.slice(1).map(r=>'<tr>'+r.map(c=>'<td>'+String(c).replace(/</g,'&lt;')+'</td>').join('')+'</tr>').join('')+
    '</tbody></table></div>';
}
document.addEventListener('click',e=>{const b=e.target.closest('[data-act]');if(!b)return;const a=b.dataset.act;
 if(a==='tocsv')toCsv();
 else if(a==='tojson')toJson();
 else if(a==='copy'){O.select();document.execCommand('copy');M.textContent='Copied';M.className='ok'}
 else if(a==='sample'){I.value=JSON.stringify([
   {id:1,name:'Ada Lovelace',role:'Engineer',address:{city:'London',country:'UK'},active:true},
   {id:2,name:'Linus Torvalds',role:'Maintainer',address:{city:'Portland',country:'US'},active:true},
   {id:3,name:'Grace Hopper',role:'Rear Admiral',address:{city:'Arlington',country:'US'},active:false}],null,2);toCsv()}
 else if(a==='dl'){
   const isJson=O.value.trim().startsWith('[');
   const blob=new Blob([O.value],{type:isJson?'application/json':'text/csv;charset=utf-8'});
   const el=document.createElement('a');el.href=URL.createObjectURL(blob);el.download=isJson?'data.json':'data.csv';
   document.body.appendChild(el);el.click();el.remove()}
});
$('#d').addEventListener('change',()=>{if(O.value)I.value.trim().startsWith('[')||I.value.trim().startsWith('{')?toCsv():toJson()});
$('#flat').addEventListener('change',()=>{if(O.value)toCsv()});
`,
};
