export default {
  slug: 'color-converter',
  cat: 'convert',
  weight: 8,
  title: 'Color Converter',
  metaTitle: 'Color Converter — HEX to RGB, HSL, HSV & CMYK | Toolman',
  short: 'Convert between HEX, RGB, HSL, HSV, CMYK and CSS named colors.',
  desc:
    'Convert a colour between HEX, RGB, HSL, HSV and CMYK, and see its tints, shades and WCAG contrast ratios against black and white text.',
  intro: 'Enter a color in any format — HEX, RGB, HSL or a CSS name — and get every other representation, plus shades and contrast ratios.',
  body: `<div class="tool">
  <div class="row">
    <input type="color" id="pick" aria-label="Pick a color" value="#2563eb" style="width:64px;height:44px;padding:2px">
    <input type="text" id="in" aria-label="Color value in any format" value="#2563eb" spellcheck="false" style="flex:1;min-width:160px;font-family:var(--mono)">
    <span id="bad" class="err"></span>
  </div>
  <div id="swatch" style="height:90px;border-radius:12px;border:1px solid var(--line);margin:12px 0"></div>
  <table><tbody id="out"></tbody></table>
  <h2>Tints and shades</h2>
  <div id="scale" style="display:flex;flex-wrap:wrap;gap:6px"></div>
  <h2>Contrast check (WCAG)</h2>
  <table><tbody id="contrast"></tbody></table>
</div>`,
  about: `<h2>The color models</h2>
<table>
<tr><th>Model</th><th>Looks like</th><th>Use it for</th></tr>
<tr><td><strong>HEX</strong></td><td><code>#2563EB</code></td><td>CSS and design tools — a compact way of writing RGB in hexadecimal.</td></tr>
<tr><td><strong>RGB</strong></td><td><code>rgb(37 99 235)</code></td><td>Screens. Three additive channels, 0–255 each, plus optional alpha.</td></tr>
<tr><td><strong>HSL</strong></td><td><code>hsl(221 83% 53%)</code></td><td>Reasoning about color. Hue is an angle on the wheel; changing lightness alone gives a tint or shade.</td></tr>
<tr><td><strong>HSV/HSB</strong></td><td><code>hsv(221 84% 92%)</code></td><td>Color pickers in Photoshop, Figma and most design software.</td></tr>
<tr><td><strong>CMYK</strong></td><td><code>cmyk(84% 58% 0% 8%)</code></td><td>Print. Subtractive inks — the conversion here is a nominal one, since real print needs a color profile.</td></tr>
</table>
<h2>How hex actually works</h2>
<p><code>#2563EB</code> is three bytes: <code>25</code> red, <code>63</code> green, <code>EB</code> blue, each a hexadecimal number from <code>00</code> (0) to <code>FF</code> (255). The three-digit shorthand <code>#2CE</code> expands by doubling each digit to <code>#22CCEE</code>, so it can only express 4,096 of the 16.7 million possible colors. An eight-digit hex adds an alpha byte at the end.</p>
<h2>Contrast and accessibility</h2>
<p>WCAG 2.1 defines contrast as a ratio between 1:1 and 21:1. Normal body text needs at least <strong>4.5:1</strong> to meet level AA, large text (18&nbsp;pt, or 14&nbsp;pt bold) needs <strong>3:1</strong>, and level AAA raises those to 7:1 and 4.5:1. UI components and graphical objects need 3:1. The table above checks your color against both black and white so you can see which text color it can carry.</p>
<h2>Tints, shades and tones</h2>
<p>A <em>tint</em> mixes a color with white, a <em>shade</em> mixes it with black, and a <em>tone</em> mixes it with grey. Generating a scale by varying HSL lightness — as this tool does — is the quickest way to build a usable palette from one brand color, though hand-tuned scales usually shift hue slightly at the extremes to avoid muddy mid-tones.</p>`,
  faq: [
    { q: 'How do I convert HEX to RGB by hand?', a: 'Split the six digits into three pairs and read each as a hexadecimal number. <code>#2563EB</code> → <code>0x25</code>=37, <code>0x63</code>=99, <code>0xEB</code>=235, so <code>rgb(37, 99, 235)</code>.' },
    { q: 'What does the fourth CMYK number mean?', a: 'K is the black (key) channel. Printing black from cyan, magenta and yellow together wastes ink and produces a muddy brown, so a dedicated black ink is used instead.' },
    { q: 'Why does my CMYK color look different when printed?', a: 'CMYK has a smaller gamut than RGB, so vivid screen colors — especially bright blues and greens — have no printable equivalent. Accurate conversion needs an ICC profile for the specific press and paper; the values here are a generic approximation.' },
    { q: 'Which contrast ratio do I actually need?', a: '4.5:1 for normal text and 3:1 for large text to meet WCAG AA, which is the level most accessibility regulations reference.' },
    { q: 'What are the modern CSS color functions?', a: 'CSS now supports <code>oklch()</code>, <code>oklab()</code>, <code>lab()</code> and <code>color()</code>. OKLCH in particular keeps perceived lightness consistent across hues, which makes it much better than HSL for generating palettes.' },
  ],
  related: ['image-compressor', 'favicon-generator', 'json-formatter'],
  script: `
const $=s=>document.querySelector(s);
const NAMED={black:'#000000',white:'#ffffff',red:'#ff0000',lime:'#00ff00',blue:'#0000ff',yellow:'#ffff00',cyan:'#00ffff',magenta:'#ff00ff',silver:'#c0c0c0',gray:'#808080',grey:'#808080',maroon:'#800000',olive:'#808000',green:'#008000',purple:'#800080',teal:'#008080',navy:'#000080',orange:'#ffa500',pink:'#ffc0cb',brown:'#a52a2a',gold:'#ffd700',indigo:'#4b0082',violet:'#ee82ee',turquoise:'#40e0d0',salmon:'#fa8072',crimson:'#dc143c',coral:'#ff7f50',khaki:'#f0e68c',lavender:'#e6e6fa',beige:'#f5f5dc',ivory:'#fffff0',plum:'#dda0dd',orchid:'#da70d6',tan:'#d2b48c',aqua:'#00ffff',fuchsia:'#ff00ff'};
function parse(s){
  s=s.trim().toLowerCase();
  if(NAMED[s])s=NAMED[s];
  let m=/^#?([0-9a-f]{3,8})$/.exec(s);
  if(m){let h=m[1];
    if(h.length===3||h.length===4)h=[...h].map(c=>c+c).join('');
    if(h.length===6||h.length===8)return{r:parseInt(h.slice(0,2),16),g:parseInt(h.slice(2,4),16),b:parseInt(h.slice(4,6),16),a:h.length===8?parseInt(h.slice(6,8),16)/255:1};
    return null}
  m=/^rgba?\\(([^)]+)\\)$/.exec(s);
  if(m){const p=m[1].split(/[,\\s/]+/).filter(Boolean).map(parseFloat);
    if(p.length>=3)return{r:p[0],g:p[1],b:p[2],a:p.length>3?p[3]:1}}
  m=/^hsla?\\(([^)]+)\\)$/.exec(s);
  if(m){const p=m[1].split(/[,\\s/%]+/).filter(Boolean).map(parseFloat);
    if(p.length>=3){const c=hsl2rgb(p[0],p[1],p[2]);c.a=p.length>3?p[3]:1;return c}}
  return null;
}
function hsl2rgb(h,s,l){h=((h%360)+360)%360;s/=100;l/=100;
  const c=(1-Math.abs(2*l-1))*s,x=c*(1-Math.abs((h/60)%2-1)),m=l-c/2;
  let r,g,b;
  if(h<60)[r,g,b]=[c,x,0];else if(h<120)[r,g,b]=[x,c,0];else if(h<180)[r,g,b]=[0,c,x];
  else if(h<240)[r,g,b]=[0,x,c];else if(h<300)[r,g,b]=[x,0,c];else[r,g,b]=[c,0,x];
  return{r:Math.round((r+m)*255),g:Math.round((g+m)*255),b:Math.round((b+m)*255),a:1}}
function rgb2hsl(r,g,b){r/=255;g/=255;b/=255;
  const mx=Math.max(r,g,b),mn=Math.min(r,g,b),d=mx-mn,l=(mx+mn)/2;
  let h=0,s=0;
  if(d){s=d/(1-Math.abs(2*l-1));
    h=mx===r?60*(((g-b)/d)%6):mx===g?60*((b-r)/d+2):60*((r-g)/d+4)}
  return{h:Math.round(((h%360)+360)%360),s:+(s*100).toFixed(1),l:+(l*100).toFixed(1)}}
function rgb2hsv(r,g,b){r/=255;g/=255;b/=255;
  const mx=Math.max(r,g,b),mn=Math.min(r,g,b),d=mx-mn;
  let h=0;if(d)h=mx===r?60*(((g-b)/d)%6):mx===g?60*((b-r)/d+2):60*((r-g)/d+4);
  return{h:Math.round(((h%360)+360)%360),s:+(mx?d/mx*100:0).toFixed(1),v:+(mx*100).toFixed(1)}}
function rgb2cmyk(r,g,b){r/=255;g/=255;b/=255;const k=1-Math.max(r,g,b);
  if(k===1)return{c:0,m:0,y:0,k:100};
  return{c:+(((1-r-k)/(1-k))*100).toFixed(1),m:+(((1-g-k)/(1-k))*100).toFixed(1),y:+(((1-b-k)/(1-k))*100).toFixed(1),k:+(k*100).toFixed(1)}}
const hx=n=>Math.max(0,Math.min(255,Math.round(n))).toString(16).padStart(2,'0');
const toHex=c=>'#'+hx(c.r)+hx(c.g)+hx(c.b)+(c.a<1?hx(c.a*255):'');
function lum(c){const f=v=>{v/=255;return v<=0.03928?v/12.92:Math.pow((v+0.055)/1.055,2.4)};
  return 0.2126*f(c.r)+0.7152*f(c.g)+0.0722*f(c.b)}
function ratio(a,b){const l1=lum(a),l2=lum(b);return ((Math.max(l1,l2)+0.05)/(Math.min(l1,l2)+0.05))}
function render(v){
  const c=parse(v);
  if(!c){$('#bad').textContent='✗ unrecognised color';return}
  $('#bad').textContent='';
  const hsl=rgb2hsl(c.r,c.g,c.b),hsv=rgb2hsv(c.r,c.g,c.b),cmyk=rgb2cmyk(c.r,c.g,c.b);
  const hex=toHex({...c,a:1});
  $('#swatch').style.background=hex;
  $('#pick').value=hex;
  const rows=[
    ['HEX',hex.toUpperCase()],
    ['HEX (short)',hex[1]===hex[2]&&hex[3]===hex[4]&&hex[5]===hex[6]?('#'+hex[1]+hex[3]+hex[5]).toUpperCase():'—'],
    ['RGB','rgb('+c.r+', '+c.g+', '+c.b+')'],
    ['RGB (CSS4)','rgb('+c.r+' '+c.g+' '+c.b+')'],
    ['HSL','hsl('+hsl.h+', '+hsl.s+'%, '+hsl.l+'%)'],
    ['HSV / HSB','hsv('+hsv.h+', '+hsv.s+'%, '+hsv.v+'%)'],
    ['CMYK','cmyk('+cmyk.c+'%, '+cmyk.m+'%, '+cmyk.y+'%, '+cmyk.k+'%)'],
    ['Integer',(c.r<<16|c.g<<8|c.b)],
    ['Android','0xFF'+hex.slice(1).toUpperCase()],
  ];
  $('#out').innerHTML=rows.map(r=>'<tr><td>'+r[0]+'</td><td class="out">'+r[1]+'</td></tr>').join('');
  $('#scale').innerHTML=[95,90,80,70,60,50,40,30,20,10,5].map(l=>{
    const s=hsl2rgb(hsl.h,hsl.s,l),h=toHex(s);
    return '<div style="flex:1;min-width:62px;text-align:center"><div style="height:44px;border-radius:8px;border:1px solid var(--line);background:'+h+'"></div><small class="muted" style="font-family:var(--mono);font-size:.7rem">'+h.toUpperCase()+'</small></div>'}).join('');
  const W={r:255,g:255,b:255},B={r:0,g:0,b:0};
  const rw=ratio(c,W),rb=ratio(c,B);
  const badge=(r,need)=>r>=need?'<span class="ok">pass</span>':'<span class="err">fail</span>';
  $('#contrast').innerHTML=
    '<tr><td>vs white text</td><td><strong>'+rw.toFixed(2)+':1</strong> — AA normal '+badge(rw,4.5)+' · AA large '+badge(rw,3)+' · AAA '+badge(rw,7)+'</td></tr>'+
    '<tr><td>vs black text</td><td><strong>'+rb.toFixed(2)+':1</strong> — AA normal '+badge(rb,4.5)+' · AA large '+badge(rb,3)+' · AAA '+badge(rb,7)+'</td></tr>'+
    '<tr><td>Best text color</td><td><strong>'+(rw>rb?'white':'black')+'</strong> on this background</td></tr>';
}
$('#in').addEventListener('input',e=>render(e.target.value));
$('#pick').addEventListener('input',e=>{$('#in').value=e.target.value;render(e.target.value)});
render($('#in').value);
`,
};
