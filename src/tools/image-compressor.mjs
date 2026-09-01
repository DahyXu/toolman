export default {
  slug: 'image-compressor',
  cat: 'image',
  weight: 9,
  title: 'Image Compressor',
  metaTitle: 'Compress Images Online Free — JPG, PNG & WebP | Toolman',
  short: 'Shrink JPG, PNG and WebP images in your browser without uploading them.',
  desc:
    'Free online image compressor. Reduce JPG, PNG and WebP file size with an adjustable quality slider and optional resizing, then download the result. Images are never uploaded — compression happens in your browser.',
  intro:
    'Drop in one or more images, adjust quality, and download the smaller versions. Nothing is uploaded: your photos are processed by your own browser.',
  body: `<div class="tool">
  <div id="drop" style="border:2px dashed var(--line);border-radius:12px;padding:36px;text-align:center;cursor:pointer">
    <p style="margin:0"><strong>Drop images here</strong> or click to choose files</p>
    <p class="muted" style="margin:6px 0 0;font-size:.9rem">JPG, PNG, WebP, GIF (first frame) · multiple files supported</p>
    <input type="file" id="file" accept="image/*" multiple hidden>
  </div>
  <div class="row">
    <label style="margin:0;flex:1">Quality: <output id="qOut">80</output>%
      <input type="range" id="q" min="10" max="100" value="80" style="width:100%"></label>
  </div>
  <div class="row">
    <label style="margin:0">Format <select id="fmt" style="width:auto">
      <option value="image/webp">WebP (smallest)</option>
      <option value="image/jpeg" selected>JPEG</option>
      <option value="image/png">PNG (lossless)</option>
    </select></label>
    <label style="margin:0">Max width <input type="number" id="mw" placeholder="original" style="width:120px" min="16"> px</label>
    <button data-act="all">Download all</button>
    <button data-act="clear">Clear</button>
  </div>
  <div id="list"></div>
</div>`,
  about: `<h2>Choosing a format</h2>
<table>
<tr><th>Format</th><th>Best for</th><th>Notes</th></tr>
<tr><td><strong>WebP</strong></td><td>Almost everything on the web</td><td>Typically 25–35% smaller than JPEG at the same visual quality; supports transparency and is supported by every current browser.</td></tr>
<tr><td><strong>JPEG</strong></td><td>Photographs, maximum compatibility</td><td>Lossy, no transparency. Still the safest choice for email attachments and older software.</td></tr>
<tr><td><strong>PNG</strong></td><td>Screenshots, logos, line art, transparency</td><td>Lossless — re-encoding will not shrink a photo much, but it is ideal for flat graphics.</td></tr>
</table>
<h2>What the quality slider does</h2>
<p>For JPEG and WebP, quality controls how aggressively fine detail is discarded. In practice:</p>
<ul>
<li><strong>90–100</strong> — visually lossless, but files stay large. Only worth it for print or further editing.</li>
<li><strong>75–85</strong> — the sweet spot for web images. Differences are invisible at normal viewing size.</li>
<li><strong>50–70</strong> — noticeable softening in flat areas and around sharp edges; acceptable for thumbnails.</li>
<li><strong>Below 50</strong> — visible blocking artefacts. Useful only when size matters far more than fidelity.</li>
</ul>
<h2>Resizing beats compressing</h2>
<p>The single biggest win is usually dimensional, not quality-based. A 4,000-pixel-wide photo displayed in a 800-pixel column carries 25× more pixels than it needs. Set a max width close to the largest size the image will actually be displayed at, then compress — the combination routinely cuts a 5&nbsp;MB photo to under 150&nbsp;KB.</p>
<h2>Why smaller images matter</h2>
<p>Images are typically the heaviest part of a web page, and Largest Contentful Paint — one of Google's Core Web Vitals — is usually determined by the main image. Faster images mean better rankings, lower bounce rates and less mobile data burned by your visitors.</p>
<h2>What compression cannot undo</h2>
<p>Lossy compression is one-way. Re-saving an already-compressed JPEG at high quality does not restore the lost detail; it just adds a second generation of artefacts. Always compress from the original whenever you can.</p>`,
  faq: [
    { q: 'Are my images uploaded to a server?', a: 'No. The file is read with the FileReader API, drawn to a canvas and re-encoded by your browser. There is no upload, no queue and no stored copy — you can verify by going offline after the page loads.' },
    { q: 'How much smaller will my image get?', a: 'Photographs typically drop 60–90% at quality 80, especially when converted to WebP. Screenshots and flat graphics compress less with lossy formats — PNG is often better for those.' },
    { q: 'Does compressing remove EXIF data?', a: 'Yes. Re-encoding through a canvas discards all metadata, including GPS coordinates, camera model and timestamps. That is a useful privacy side effect before sharing photos.' },
    { q: 'Is there a file size or count limit?', a: 'Only your device’s memory. Very large images (above roughly 50 megapixels) may fail on mobile browsers, which cap canvas dimensions.' },
    { q: 'Why did my PNG get bigger?', a: 'PNG is lossless, so re-encoding an already-optimised PNG can add bytes. For photographs choose WebP or JPEG; keep PNG only when you need transparency or crisp flat colour.' },
    { q: 'Does it work on my phone?', a: 'Yes. The tool is a single page with no dependencies and works in any modern mobile browser, including offline once loaded.' },
  ],
  related: ['favicon-generator', 'base64-encode-decode', 'color-converter'],
  script: `
const $=s=>document.querySelector(s);
let items=[];
const kb=n=>n<1024?n+' B':n<1048576?(n/1024).toFixed(1)+' KB':(n/1048576).toFixed(2)+' MB';
function card(it,i){
  const saved=it.out?Math.round((1-it.out.size/it.size)*100):0;
  return '<div class="tool" style="display:flex;gap:14px;align-items:center;flex-wrap:wrap">'+
   '<img src="'+it.url+'" alt="" style="width:84px;height:84px;object-fit:cover;border-radius:8px;flex:none">'+
   '<div style="flex:1;min-width:180px"><strong>'+it.name.replace(/</g,'&lt;')+'</strong><br>'+
   '<span class="muted">'+it.w+'×'+it.h+' · '+kb(it.size)+'</span>'+
   (it.out?' → <strong>'+kb(it.out.size)+'</strong> <span class="'+(saved>0?'ok':'err')+'">'+(saved>0?'−'+saved+'%':'+'+Math.abs(saved)+'%')+'</span>':' <span class="muted">compressing…</span>')+
   '</div>'+
   (it.out?'<button data-dl="'+i+'" class="primary">Download</button>':'')+'</div>';
}
function paint(){$('#list').innerHTML=items.map(card).join('')}
async function compress(it){
  const q=+$('#q').value/100, fmt=$('#fmt').value, mw=+$('#mw').value||0;
  const bmp=await createImageBitmap(it.file);
  let w=bmp.width,h=bmp.height;
  if(mw&&w>mw){h=Math.round(h*mw/w);w=mw}
  it.w=bmp.width;it.h=bmp.height;
  const c=document.createElement('canvas');c.width=w;c.height=h;
  const ctx=c.getContext('2d');
  ctx.imageSmoothingQuality='high';
  if(fmt==='image/jpeg'){ctx.fillStyle='#fff';ctx.fillRect(0,0,w,h)}
  ctx.drawImage(bmp,0,0,w,h);
  bmp.close&&bmp.close();
  it.out=await new Promise(r=>c.toBlob(r,fmt,q));
  it.ext=fmt==='image/webp'?'webp':fmt==='image/png'?'png':'jpg';
  paint();
}
function add(files){
  for(const f of files){
    if(!f.type.startsWith('image/'))continue;
    const it={file:f,name:f.name,size:f.size,url:URL.createObjectURL(f),w:0,h:0};
    items.push(it);compress(it);
  }
  paint();
}
function recompress(){items.forEach(it=>{it.out=null;compress(it)});paint()}
$('#drop').addEventListener('click',()=>$('#file').click());
$('#file').addEventListener('change',e=>add(e.target.files));
['dragenter','dragover'].forEach(t=>$('#drop').addEventListener(t,e=>{e.preventDefault();$('#drop').style.borderColor='var(--acc)'}));
['dragleave','drop'].forEach(t=>$('#drop').addEventListener(t,e=>{e.preventDefault();$('#drop').style.borderColor='var(--line)'}));
$('#drop').addEventListener('drop',e=>add(e.dataTransfer.files));
$('#q').addEventListener('input',()=>{$('#qOut').textContent=$('#q').value});
$('#q').addEventListener('change',recompress);
$('#fmt').addEventListener('change',recompress);
$('#mw').addEventListener('change',recompress);
function download(it){
  const a=document.createElement('a');
  a.href=URL.createObjectURL(it.out);
  a.download=it.name.replace(/\\.[^.]+$/,'')+'-compressed.'+it.ext;
  document.body.appendChild(a);a.click();a.remove();
  setTimeout(()=>URL.revokeObjectURL(a.href),4000);
}
document.addEventListener('click',e=>{
  const d=e.target.closest('[data-dl]');if(d){download(items[+d.dataset.dl]);return}
  const b=e.target.closest('[data-act]');if(!b)return;
  if(b.dataset.act==='clear'){items.forEach(i=>URL.revokeObjectURL(i.url));items=[];paint()}
  else items.filter(i=>i.out).forEach((it,n)=>setTimeout(()=>download(it),n*250));
});
`,
};
