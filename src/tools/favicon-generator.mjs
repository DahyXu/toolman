export default {
  slug: 'favicon-generator',
  cat: 'image',
  weight: 8,
  title: 'Favicon Generator',
  metaTitle: 'Favicon Generator — From Image, Text or Emoji | Toolman',
  short: 'Turn an image, letter or emoji into a full favicon set plus the HTML.',
  desc:
    'Free online favicon generator. Create favicons from an image, a letter or an emoji, preview every size, download the PNG set and copy the HTML you need. Runs entirely in your browser.',
  intro:
    'Upload an image or type a letter or emoji. Everything is rendered in your browser — no upload, no waiting queue.',
  body: `<div class="tool">
  <div class="row">
    <button data-mode="image" class="primary">From image</button>
    <button data-mode="text">From text or emoji</button>
  </div>
  <div id="pane-image">
    <div id="drop" style="border:2px dashed var(--line);border-radius:12px;padding:30px;text-align:center;cursor:pointer">
      <p style="margin:0"><strong>Drop an image here</strong> or click to choose</p>
      <p class="muted" style="margin:6px 0 0;font-size:.88rem">Square PNG or SVG works best — at least 512×512</p>
      <input type="file" id="file" accept="image/*" aria-label="Choose a source image" hidden>
    </div>
  </div>
  <div id="pane-text" style="display:none">
    <div class="row">
      <label style="margin:0;flex:1;min-width:120px">Text or emoji <input type="text" id="txt" value="T" maxlength="3"></label>
      <label style="margin:0">Text <input type="color" id="fg" value="#ffffff" style="width:52px;height:36px;padding:2px"></label>
      <label style="margin:0">Background <input type="color" id="bg" value="#2563eb" style="width:52px;height:36px;padding:2px"></label>
    </div>
    <div class="row">
      <label style="margin:0;flex:1">Corner radius: <output id="rOut">22</output>%
        <input type="range" id="radius" min="0" max="50" value="22" style="width:100%"></label>
      <label style="margin:0;flex:1">Font size: <output id="sOut">62</output>%
        <input type="range" id="fs" min="30" max="95" value="62" style="width:100%"></label>
    </div>
    <div class="row">
      <label style="margin:0">Font <select id="font" style="width:auto">
        <option value="system-ui,-apple-system,Segoe UI,Roboto,sans-serif">Sans-serif</option>
        <option value="Georgia,Times New Roman,serif">Serif</option>
        <option value="ui-monospace,Menlo,Consolas,monospace">Monospace</option>
      </select></label>
      <label style="margin:0"><input type="checkbox" id="bold" checked style="width:auto"> bold</label>
    </div>
  </div>
  <h2>Preview</h2>
  <div id="prev" style="display:flex;gap:18px;align-items:flex-end;flex-wrap:wrap;margin:12px 0"></div>
  <div class="row"><button class="primary" data-act="dl">Download all sizes</button><button data-act="ico">Download 32×32 PNG</button></div>
  <h2>HTML to add to your &lt;head&gt;</h2>
  <pre><code id="code"></code></pre>
  <div class="row"><button data-act="copy">Copy HTML</button></div>
</div>`,
  about: `<h2>Which favicon files do you actually need?</h2>
<p>The classic advice was to generate 20 files for every device ever made. Modern browsers made most of that unnecessary. A practical, complete set in 2026 is four files:</p>
<table>
<tr><th>File</th><th>Size</th><th>Used by</th></tr>
<tr><td><code>favicon.ico</code></td><td>32×32</td><td>Legacy browsers and some feed readers that request the root path directly</td></tr>
<tr><td><code>favicon.svg</code></td><td>vector</td><td>Every current browser — scales perfectly and can adapt to dark mode</td></tr>
<tr><td><code>apple-touch-icon.png</code></td><td>180×180</td><td>iOS home-screen bookmarks</td></tr>
<tr><td><code>icon-512.png</code></td><td>512×512</td><td>Android home screen and PWA install prompts, via the web manifest</td></tr>
</table>
<h2>The HTML</h2>
<pre><code>&lt;link rel="icon" href="/favicon.ico" sizes="32x32"&gt;
&lt;link rel="icon" href="/favicon.svg" type="image/svg+xml"&gt;
&lt;link rel="apple-touch-icon" href="/apple-touch-icon.png"&gt;
&lt;link rel="manifest" href="/site.webmanifest"&gt;</code></pre>
<h2>Design rules for something 16 pixels wide</h2>
<ul>
<li><strong>One idea only.</strong> A favicon is smaller than a word. A single letter, a simple mark or a bold silhouette — never a full logo with text.</li>
<li><strong>High contrast.</strong> It sits on both light and dark browser chrome. Test against both.</li>
<li><strong>No thin lines.</strong> Anything under about 1/16th of the width disappears at 16&nbsp;px.</li>
<li><strong>Fill the canvas.</strong> Browsers add their own padding; built-in margin makes the icon look small and timid.</li>
<li><strong>Check it at 16&nbsp;px.</strong> Not at 512. The preview row above shows the real sizes.</li>
</ul>
<h2>Dark mode favicons</h2>
<p>An SVG favicon can carry a media query inside it, so the icon recolours with the user's theme:</p>
<pre><code>&lt;svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"&gt;
  &lt;style&gt;
    path { fill: #111 }
    @media (prefers-color-scheme: dark) { path { fill: #fff } }
  &lt;/style&gt;
  &lt;path d="…"/&gt;
&lt;/svg&gt;</code></pre>
<h2>Why the browser ignores your new favicon</h2>
<p>Favicons are cached aggressively — often beyond a normal hard refresh. To check a change, open the icon URL directly and reload it there, or append a query string such as <code>/favicon.svg?v=2</code> in your link tag.</p>`,
  faq: [
    { q: 'Do I still need favicon.ico?', a: 'Only for the long tail. Some crawlers, feed readers and older browsers request <code>/favicon.ico</code> from the site root regardless of your HTML, so a 32×32 file there is cheap insurance.' },
    { q: 'What size should a favicon be?', a: 'Design at 512×512 and let it scale down. Ship an SVG for modern browsers, a 180×180 PNG for iOS and a 32×32 ICO for legacy clients.' },
    { q: 'Are my images uploaded?', a: 'No. Rendering and resizing happen on a canvas in your browser, so brand assets never leave your machine.' },
    { q: 'Why does my favicon look blurry?', a: 'Usually a small source image scaled up, or fine detail that cannot survive 16 pixels. Start from a vector or a 512&nbsp;px original and simplify the artwork.' },
    { q: 'Can I use an emoji as a favicon?', a: 'Yes — switch to text mode and paste one. Note that the emoji renders with your operating system’s font, so it will look slightly different on other platforms.' },
    { q: 'Does a favicon affect SEO?', a: 'Indirectly. Google shows favicons next to mobile search results, so a clear, recognisable icon can improve click-through even though it is not a ranking factor.' },
  ],
  related: ['image-compressor', 'qr-code-generator', 'color-converter'],
  script: `
const $=s=>document.querySelector(s);
const SIZES=[16,32,48,64,96,128,180,192,512];
let source=null; // {type:'img',img} | {type:'text'}
function draw(size){
  const c=document.createElement('canvas');c.width=c.height=size;
  const x=c.getContext('2d');
  if(source&&source.type==='img'){
    const im=source.img;
    const s=Math.min(im.width,im.height);
    x.imageSmoothingQuality='high';
    x.drawImage(im,(im.width-s)/2,(im.height-s)/2,s,s,0,0,size,size);
  } else {
    const r=size*(+$('#radius').value)/100;
    x.fillStyle=$('#bg').value;
    x.beginPath();x.roundRect(0,0,size,size,r);x.fill();
    x.fillStyle=$('#fg').value;
    x.font=($('#bold').checked?'700 ':'400 ')+Math.round(size*(+$('#fs').value)/100)+'px '+$('#font').value;
    x.textAlign='center';x.textBaseline='middle';
    x.fillText($('#txt').value||'T',size/2,size/2+size*0.04);
  }
  return c;
}
function render(){
  $('#prev').innerHTML='';
  for(const s of [16,32,48,64,128,180]){
    const c=draw(s);
    const w=document.createElement('div');
    w.style.textAlign='center';
    c.style.cssText='border:1px solid var(--line);border-radius:4px;display:block;margin:0 auto';
    w.appendChild(c);
    const l=document.createElement('small');l.className='muted';l.textContent=s+'px';
    l.style.cssText='display:block;font-size:.7rem;margin-top:4px';
    w.appendChild(l);
    $('#prev').appendChild(w);
  }
  $('#code').textContent=
    '<link rel="icon" href="/favicon.ico" sizes="32x32">\\n'+
    '<link rel="icon" href="/favicon-192.png" type="image/png" sizes="192x192">\\n'+
    '<link rel="apple-touch-icon" href="/apple-touch-icon.png">\\n'+
    '<link rel="manifest" href="/site.webmanifest">';
}
function dl(canvas,name){
  const a=document.createElement('a');a.href=canvas.toDataURL('image/png');a.download=name;
  document.body.appendChild(a);a.click();a.remove();
}
document.addEventListener('click',e=>{
  const m=e.target.closest('[data-mode]');
  if(m){
    document.querySelectorAll('[data-mode]').forEach(b=>b.className='');
    m.className='primary';
    const img=m.dataset.mode==='image';
    $('#pane-image').style.display=img?'block':'none';
    $('#pane-text').style.display=img?'none':'block';
    if(!img)source=null;
    render();return;
  }
  const b=e.target.closest('[data-act]');if(!b)return;
  const a=b.dataset.act;
  if(a==='dl'){
    const names={16:'favicon-16.png',32:'favicon-32.png',48:'favicon-48.png',64:'favicon-64.png',
      96:'favicon-96.png',128:'favicon-128.png',180:'apple-touch-icon.png',192:'favicon-192.png',512:'icon-512.png'};
    SIZES.forEach((s,i)=>setTimeout(()=>dl(draw(s),names[s]),i*220));
  }
  else if(a==='ico')dl(draw(32),'favicon-32.png');
  else{const r=document.createRange();r.selectNode($('#code'));getSelection().removeAllRanges();
    getSelection().addRange(r);document.execCommand('copy');getSelection().removeAllRanges();
    b.textContent='Copied!';setTimeout(()=>b.textContent='Copy HTML',1200)}
});
$('#drop').addEventListener('click',()=>$('#file').click());
function loadFile(f){
  if(!f||!f.type.startsWith('image/'))return;
  const url=URL.createObjectURL(f);
  const im=new Image();
  im.onload=()=>{source={type:'img',img:im};render();URL.revokeObjectURL(url)};
  im.src=url;
}
$('#file').addEventListener('change',e=>loadFile(e.target.files[0]));
['dragenter','dragover'].forEach(t=>$('#drop').addEventListener(t,e=>{e.preventDefault();$('#drop').style.borderColor='var(--acc)'}));
['dragleave','drop'].forEach(t=>$('#drop').addEventListener(t,e=>{e.preventDefault();$('#drop').style.borderColor='var(--line)'}));
$('#drop').addEventListener('drop',e=>loadFile(e.dataTransfer.files[0]));
['#txt','#fg','#bg','#radius','#fs','#font','#bold'].forEach(s=>$(s).addEventListener('input',()=>{
  $('#rOut').textContent=$('#radius').value;$('#sOut').textContent=$('#fs').value;render()}));
$('#font').addEventListener('change',render);
document.querySelector('[data-mode=text]').click();
`,
};
