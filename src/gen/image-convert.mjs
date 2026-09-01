import { esc, faq } from '../layout.mjs';

const F = {
  png: { name: 'PNG', full: 'Portable Network Graphics', mime: 'image/png', lossy: false, alpha: true,
    d: 'PNG is a lossless raster format with full alpha transparency. It is the right choice for screenshots, logos, icons and line art, and a poor one for photographs, where it produces files several times larger than JPEG.' },
  jpg: { name: 'JPG', full: 'JPEG', mime: 'image/jpeg', lossy: true, alpha: false,
    d: 'JPEG is a lossy format tuned for photographs. It discards detail the eye is least sensitive to, achieving very small files, but it has no transparency and degrades a little every time it is re-saved.' },
  jpeg: { name: 'JPEG', full: 'JPEG', mime: 'image/jpeg', lossy: true, alpha: false, alias: 'jpg',
    d: 'JPEG and JPG are the same format — the three-letter extension is a leftover from MS-DOS filename limits. Either extension opens identically everywhere.' },
  webp: { name: 'WebP', full: 'WebP', mime: 'image/webp', lossy: true, alpha: true,
    d: 'WebP is Google’s modern format supporting both lossy and lossless modes plus transparency and animation. It is typically 25–35% smaller than JPEG at matching quality and is supported by every current browser.' },
  gif: { name: 'GIF', full: 'Graphics Interchange Format', mime: 'image/gif', lossy: false, alpha: true, inputOnly: true,
    d: 'GIF is a 1987 format limited to 256 colours per frame, with support for simple animation and one fully transparent colour. Its animation niche has largely moved to video and animated WebP.' },
  bmp: { name: 'BMP', full: 'Bitmap', mime: 'image/bmp', lossy: false, alpha: false, inputOnly: true,
    d: 'BMP stores pixels with essentially no compression, which makes files enormous. It survives mainly in legacy Windows software and as an intermediate format.' },
  svg: { name: 'SVG', full: 'Scalable Vector Graphics', mime: 'image/svg+xml', vector: true, alpha: true, inputOnly: true,
    d: 'SVG is a vector format — an XML description of shapes rather than a grid of pixels — so it stays sharp at any size. Converting it to a raster format fixes it at one resolution.' },
  avif: { name: 'AVIF', full: 'AV1 Image File Format', mime: 'image/avif', lossy: true, alpha: true, inputOnly: true,
    d: 'AVIF is derived from the AV1 video codec and compresses better than both JPEG and WebP, especially at low bitrates. Browser support is now broad, though older software may not open it.' },
  ico: { name: 'ICO', full: 'Windows Icon', mime: 'image/x-icon', lossy: false, alpha: true, inputOnly: true,
    d: 'ICO is a container holding several icon sizes in one file. It exists almost entirely for Windows applications and legacy favicons.' },
};

const OUT = ['png', 'jpg', 'webp'];

function widget(fromKey, toKey) {
  const to = F[toKey];
  return `<div class="tool">
  <div id="drop" style="border:2px dashed var(--line);border-radius:12px;padding:34px;text-align:center;cursor:pointer">
    <p style="margin:0"><strong>Drop ${esc(F[fromKey].name)} files here</strong> or click to choose</p>
    <p class="muted" style="margin:6px 0 0;font-size:.88rem">Multiple files supported · nothing is uploaded</p>
    <input type="file" id="file" accept="${F[fromKey].mime},image/*" aria-label="Choose ${esc(F[fromKey].name)} files to convert" multiple hidden>
  </div>
  <div class="row">
    ${to.lossy ? `<label style="margin:0;flex:1">Quality: <output id="qOut">85</output>%<input type="range" id="q" min="30" max="100" value="85" style="width:100%"></label>` : '<span class="muted">PNG is lossless — no quality setting needed.</span>'}
    <label style="margin:0">Max width <input type="number" id="mw" placeholder="original" style="width:120px" min="16"> px</label>
    <button data-act="all">Download all</button>
    <button data-act="clear">Clear</button>
  </div>
  <div id="list"></div>
</div>
<script>
(function(){
  var items=[], TO='${to.mime}', EXT='${toKey === 'jpeg' ? 'jpg' : toKey}';
  var $=function(s){return document.querySelector(s)};
  function kb(n){return n<1024?n+' B':n<1048576?(n/1024).toFixed(1)+' KB':(n/1048576).toFixed(2)+' MB'}
  function paint(){
    $('#list').innerHTML=items.map(function(it,i){
      var pct=it.out?Math.round((1-it.out.size/it.size)*100):0;
      return '<div class="tool" style="display:flex;gap:14px;align-items:center;flex-wrap:wrap">'+
      '<img src="'+it.url+'" alt="" style="width:78px;height:78px;object-fit:cover;border-radius:8px;flex:none">'+
      '<div style="flex:1;min-width:170px"><strong>'+it.name.replace(/</g,'&lt;')+'</strong><br>'+
      '<span class="muted">'+it.w+'×'+it.h+' · '+kb(it.size)+'</span>'+
      (it.out?' → <strong>'+kb(it.out.size)+'</strong> <span class="'+(pct>0?'ok':'err')+'">'+(pct>0?'−'+pct+'%':'+'+Math.abs(pct)+'%')+'</span>':' <span class="muted">converting…</span>')+
      '</div>'+(it.out?'<button data-dl="'+i+'" class="primary">Download</button>':'')+'</div>';
    }).join('');
  }
  function convert(it){
    var q=$('#q')?(+$('#q').value/100):0.92, mw=+$('#mw').value||0;
    var run=function(bmp,w0,h0){
      var w=w0,h=h0;
      if(mw&&w>mw){h=Math.round(h*mw/w);w=mw}
      it.w=w0;it.h=h0;
      var c=document.createElement('canvas');c.width=w;c.height=h;
      var ctx=c.getContext('2d');ctx.imageSmoothingQuality='high';
      if(TO==='image/jpeg'){ctx.fillStyle='#fff';ctx.fillRect(0,0,w,h)}
      ctx.drawImage(bmp,0,0,w,h);
      c.toBlob(function(b){it.out=b;paint()},TO,q);
    };
    if(it.file.type==='image/svg+xml'){
      var im=new Image();
      im.onload=function(){run(im,im.naturalWidth||512,im.naturalHeight||512)};
      im.src=it.url;
    } else {
      createImageBitmap(it.file).then(function(bmp){run(bmp,bmp.width,bmp.height)})
        .catch(function(){var im=new Image();im.onload=function(){run(im,im.naturalWidth,im.naturalHeight)};im.src=it.url});
    }
  }
  function add(files){
    for(var i=0;i<files.length;i++){
      var f=files[i];
      if(!f.type.indexOf&&!f.type)continue;
      if(f.type&&f.type.indexOf('image/')!==0)continue;
      var it={file:f,name:f.name,size:f.size,url:URL.createObjectURL(f),w:0,h:0,out:null};
      items.push(it);convert(it);
    }
    paint();
  }
  function download(it){
    var a=document.createElement('a');
    a.href=URL.createObjectURL(it.out);
    a.download=it.name.replace(/\\.[^.]+$/,'')+'.'+EXT;
    document.body.appendChild(a);a.click();a.remove();
    setTimeout(function(){URL.revokeObjectURL(a.href)},4000);
  }
  $('#drop').addEventListener('click',function(){$('#file').click()});
  $('#file').addEventListener('change',function(e){add(e.target.files)});
  ['dragenter','dragover'].forEach(function(t){$('#drop').addEventListener(t,function(e){e.preventDefault();$('#drop').style.borderColor='var(--acc)'})});
  ['dragleave','drop'].forEach(function(t){$('#drop').addEventListener(t,function(e){e.preventDefault();$('#drop').style.borderColor='var(--line)'})});
  $('#drop').addEventListener('drop',function(e){add(e.dataTransfer.files)});
  if($('#q')){$('#q').addEventListener('input',function(){$('#qOut').textContent=$('#q').value});
    $('#q').addEventListener('change',function(){items.forEach(function(it){it.out=null;convert(it)});paint()})}
  $('#mw').addEventListener('change',function(){items.forEach(function(it){it.out=null;convert(it)});paint()});
  document.addEventListener('click',function(e){
    var d=e.target.closest('[data-dl]');if(d){download(items[+d.dataset.dl]);return}
    var b=e.target.closest('[data-act]');if(!b)return;
    if(b.dataset.act==='clear'){items.forEach(function(i){URL.revokeObjectURL(i.url)});items=[];paint()}
    else items.filter(function(i){return i.out}).forEach(function(it,n){setTimeout(function(){download(it)},n*250)});
  });
})();
</script>`;
}

function page(fromKey, toKey, all) {
  const a = F[fromKey], b = F[toKey];
  const slug = `${fromKey}-to-${toKey}`;
  const path = `/${slug}/`;
  const losesAlpha = a.alpha && !b.alpha;
  const losesVector = a.vector;

  const siblings = all.filter(([x, y]) => !(x === fromKey && y === toKey))
    .slice(0, 18)
    .map(([x, y]) => `<li><a href="/${x}-to-${y}/">${F[x].name} to ${F[y].name}</a></li>`).join('');

  const FAQ = faq([
    { q: `How do I convert ${a.name} to ${b.name}?`,
      a: 'Drop the file on the converter above, adjust the quality or size if you want, and download the result. No account, no email, no upload.' },
    { q: 'Are my files uploaded to a server?',
      a: "No. The file is read with the browser's FileReader API, drawn to a canvas and re-encoded locally. You can disconnect from the network after the page loads and the converter still works." },
    { q: 'Is there a file size limit?',
      a: "Only your device's memory. There is no server-side cap, no queue and no daily limit. Very large images — beyond roughly 50 megapixels — may fail on mobile browsers, which limit canvas dimensions." },
    { q: 'Will the quality drop?',
      a: b.lossy
        ? `${b.name} is lossy, so some detail is discarded. At quality 85 the difference is invisible at normal viewing size; below about 60 it becomes noticeable in flat areas and around sharp edges.`
        : `${b.name} is lossless, so nothing is lost in this step — although detail already discarded by ${a.name} cannot be recovered.` },
    { q: 'Can I convert several files at once?',
      a: 'Yes. Drop as many as you like and use "Download all". Each file is converted independently in your browser.' },
    { q: 'Is there a watermark?',
      a: 'No. The output is exactly the converted image, nothing added.' },
  ]);

  return {
    path,
    title: `${a.name} to ${b.name} Converter — Free, No Upload | Toolman`,
    desc: `Convert ${a.name} to ${b.name} online for free. Files are converted in your browser — nothing is uploaded, there is no file-size limit and no watermark. Batch conversion and optional resizing included.`,
    h1: `Convert ${a.name} to ${b.name}`,
    crumbs: [
      { name: 'Image Tools', path: '/image/' },
      { name: `${a.name} to ${b.name}`, path },
    ],
    jsonld: [
      {
        '@context': 'https://schema.org',
        '@type': 'SoftwareApplication',
        name: `${a.name} to ${b.name} Converter`,
        applicationCategory: 'MultimediaApplication',
        operatingSystem: 'Any (web browser)',
        offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
        url: `https://toolman.top${path}`,
      },
      FAQ.schema,
    ],
    body: `<p class="muted">Drop one or more ${a.name} files below to get ${b.name} back. Conversion happens inside your browser using a canvas — the files never leave your device, so there is no upload wait, no queue and no privacy question.</p>
${widget(fromKey, toKey)}

<h2>${a.name} vs ${b.name}</h2>
<table>
<thead><tr><th></th><th>${a.name}</th><th>${b.name}</th></tr></thead>
<tbody>
<tr><td>Full name</td><td>${a.full}</td><td>${b.full}</td></tr>
<tr><td>Compression</td><td>${a.vector ? 'Vector (not applicable)' : a.lossy ? 'Lossy' : 'Lossless'}</td><td>${b.lossy ? 'Lossy' : 'Lossless'}</td></tr>
<tr><td>Transparency</td><td>${a.alpha ? 'Yes' : 'No'}</td><td>${b.alpha ? 'Yes' : 'No'}</td></tr>
<tr><td>Best for</td><td>${a.vector ? 'Logos and icons at any size' : a.lossy ? 'Photographs' : 'Graphics with flat colour and sharp edges'}</td><td>${b.lossy ? 'Photographs and web delivery' : 'Screenshots, logos and anything needing transparency'}</td></tr>
</tbody>
</table>

<h2>What changes in this conversion</h2>
<ul>
${losesVector ? `<li><strong>Vector becomes pixels.</strong> ${a.name} is resolution-independent; ${b.name} is a fixed grid. Set a max width above that is at least as large as the biggest size the image will be displayed at, because you cannot enlarge it later without blurring.</li>` : ''}
${losesAlpha ? `<li><strong>Transparency is lost.</strong> ${b.name} has no alpha channel, so transparent areas are filled with white. If you need to keep transparency, convert to PNG or WebP instead.</li>` : ''}
${!a.lossy && b.lossy && !a.vector ? `<li><strong>Compression becomes lossy.</strong> Some detail is discarded permanently in exchange for a much smaller file. For photographs this is almost always the right trade; for screenshots and text it produces visible fringing.</li>` : ''}
${a.lossy && !b.lossy ? `<li><strong>File size will grow.</strong> ${b.name} is lossless, but it cannot recover detail ${a.name} already discarded — you get a larger file of the same visual quality. Convert this direction only when you need transparency or lossless editing.</li>` : ''}
${a.lossy && b.lossy ? `<li><strong>Two generations of lossy compression.</strong> Re-encoding compounds artefacts. Convert from the original whenever you have it.</li>` : ''}
<li><strong>Metadata is dropped.</strong> EXIF data — including GPS coordinates, camera model and timestamps — does not survive the canvas. That is a useful privacy side effect before sharing photos.</li>
</ul>

<h2>About ${a.name}</h2><p>${a.d}</p>
<h2>About ${b.name}</h2><p>${b.d}</p>

${FAQ.html}

<h2>Other image conversions</h2>
<ul class="linklist">${siblings}</ul>
<p><a href="/image-compressor/">Compress images</a> · <a href="/image/">All image tools</a></p>`,
  };
}

export default async function () {
  const pairs = [];
  for (const from of Object.keys(F)) {
    for (const to of OUT) {
      if (from === to) continue;
      if (from === 'jpeg' && to === 'jpg') continue;
      if (from === 'jpg' && to === 'jpeg') continue;
      pairs.push([from, to]);
    }
  }
  return pairs.map(([a, b]) => page(a, b, pairs));
}
