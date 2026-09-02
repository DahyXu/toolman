export default {
  slug: 'qr-code-generator',
  cat: 'image',
  weight: 9,
  title: 'QR Code Generator',
  metaTitle: 'QR Code Generator — Free, No Expiry, No Sign-up | Toolman',
  short: 'Create permanent QR codes for links, text, Wi-Fi and contact cards.',
  desc:
    'Generate a QR code for a URL, text, WiFi network or contact card and download it as PNG or SVG. Encoded in your browser, and the code never expires.',
  intro:
    'Generate a QR code that never expires. It is drawn in your browser, so no tracking redirect is inserted and nothing is stored — the code encodes exactly what you type.',
  body: `<div class="tool">
  <div class="row">
    <select id="type" aria-label="QR code content type" style="width:auto">
      <option value="text">URL or text</option>
      <option value="wifi">Wi-Fi network</option>
      <option value="mailto">Email</option>
      <option value="tel">Phone number</option>
      <option value="sms">SMS</option>
      <option value="vcard">Contact card</option>
    </select>
    <label style="margin:0">Error correction <select id="ec" style="width:auto">
      <option value="L">L — 7%</option><option value="M" selected>M — 15%</option>
      <option value="Q">Q — 25%</option><option value="H">H — 30%</option></select></label>
  </div>
  <div id="form"></div>
  <div class="row">
    <label style="margin:0">Foreground <input type="color" id="fg" value="#000000" style="width:52px;height:36px;padding:2px"></label>
    <label style="margin:0">Background <input type="color" id="bg" value="#ffffff" style="width:52px;height:36px;padding:2px"></label>
    <label style="margin:0">Size <select id="size" style="width:auto"><option>256</option><option selected>512</option><option>1024</option><option>2048</option></select> px</label>
    <label style="margin:0">Margin <input type="number" id="mg" value="4" min="0" max="16" style="width:70px"></label>
  </div>
  <div style="text-align:center;margin:18px 0">
    <canvas id="cv" style="max-width:300px;width:100%;height:auto;image-rendering:pixelated;border:1px solid var(--line);border-radius:10px"></canvas>
    <p id="info" class="muted"></p>
    <p id="err" class="err"></p>
  </div>
  <div class="row" style="justify-content:center">
    <button class="primary" data-act="png">Download PNG</button>
    <button data-act="svg">Download SVG</button>
  </div>
</div>`,
  about: `<h2>How a QR code stores data</h2>
<p>A QR code is a two-dimensional barcode. The three large squares in the corners let a scanner find and orient the code; the rest of the grid holds your data plus Reed–Solomon error-correction bytes. The more data you encode, the larger the grid (the "version") becomes — from 21×21 modules up to 177×177.</p>
<h2>Error correction levels</h2>
<table>
<tr><th>Level</th><th>Recoverable damage</th><th>Use when</th></tr>
<tr><td>L</td><td>~7%</td><td>Clean digital display, maximum data in the smallest grid</td></tr>
<tr><td>M</td><td>~15%</td><td>General purpose — the sensible default</td></tr>
<tr><td>Q</td><td>~25%</td><td>Printed material that may get scuffed, or a small logo overlay</td></tr>
<tr><td>H</td><td>~30%</td><td>Industrial labels, outdoor signage, larger logo overlays</td></tr>
</table>
<h2>Static vs dynamic QR codes</h2>
<p>The codes here are <strong>static</strong>: the destination is encoded directly in the pattern, so they work forever and no third party sits in the middle. Commercial "dynamic" QR services encode a short link to their own server instead, which lets them change the destination and count scans — but the code stops working if that service shuts down or your subscription lapses, and every scan is logged by them.</p>
<h2>Making a QR code that actually scans</h2>
<ul>
<li><strong>Size.</strong> A rough rule is that the printed code should be at least one tenth of the intended scanning distance — 10&nbsp;cm wide for a 1&nbsp;m scan.</li>
<li><strong>Quiet zone.</strong> Keep a clear margin of at least four modules around the code. Cropping it tight is the most common reason a code fails.</li>
<li><strong>Contrast.</strong> Dark pattern on a light background. Inverted codes fail on many scanners, and low-contrast colour pairs fail on most.</li>
<li><strong>Keep the URL short.</strong> Fewer characters means fewer modules, larger cells and a much more forgiving scan.</li>
<li><strong>Test before printing.</strong> Scan it with at least two different phones, at the real printed size.</li>
</ul>
<h2>Wi-Fi QR codes</h2>
<p>The Wi-Fi format is a plain string: <code>WIFI:T:WPA;S:NetworkName;P:password;;</code>. Both iOS and Android recognise it and offer to join the network. It is the easiest way to give guests access without reading a long password aloud — but remember the password is stored in the image in clear text, so do not post it publicly.</p>`,
  faq: [
    { q: 'Do these QR codes expire?', a: 'No. The data is encoded directly in the pattern, so the code works as long as the destination it points to exists. There is no account, no redirect and no subscription.' },
    { q: 'Do you track scans?', a: 'No, and we could not — the code contains your URL, not a link to our server. Nothing about the code you generate is transmitted or stored.' },
    { q: 'How much data can a QR code hold?', a: 'Up to about 4,296 alphanumeric characters at the largest version and lowest error correction. In practice keep it under a few hundred characters — beyond that the pattern gets too dense to scan reliably from a phone.' },
    { q: 'Can I put a logo in the middle?', a: 'Yes, if you use error correction level Q or H and keep the logo under roughly 20% of the code area. Never cover a corner locator square.' },
    { q: 'Which format should I download?', a: 'SVG for anything printed — it scales to any size without losing sharpness. PNG for screens, social media and documents that do not accept vectors.' },
    { q: 'Why does my code fail to scan?', a: 'Usually too little contrast, a missing quiet zone, or too much data crammed into a small printed size. Shorten the content, raise the contrast and reprint larger.' },
  ],
  related: ['image-compressor', 'favicon-generator', 'url-encode-decode'],
  script: `
const $=s=>document.querySelector(s);
/* ---- minimal QR encoder (byte mode, versions 1-20) ---- */
var EXP=new Uint8Array(512),LOG=new Uint8Array(256);
(function(){var x=1;for(var i=0;i<255;i++){EXP[i]=x;LOG[x]=i;x<<=1;if(x&256)x^=0x11d}
 for(var i=255;i<512;i++)EXP[i]=EXP[i-255]})();
function gmul(a,b){return (a&&b)?EXP[(LOG[a]+LOG[b])%255]:0}
function rsPoly(n){var p=[1];for(var i=0;i<n;i++){var q=[...p,0];for(var j=0;j<p.length;j++)q[j+1]^=gmul(p[j],EXP[i]);p=q}return p}
function rsEncode(data,n){var res=new Array(n).fill(0),g=rsPoly(n);
 for(var i=0;i<data.length;i++){var f=data[i]^res[0];res.shift();res.push(0);
  if(f)for(var j=0;j<n;j++)res[j]^=gmul(g[j+1],f)}return res}
// [version][ecLevelIdx] => [totalCodewords, ecPerBlock, group1Blocks, group1Size, group2Blocks, group2Size]
var RS={ // ecc per block, blocks (g1,g2) for L,M,Q,H  (versions 1..20)
 1:[[7,1,19,0,0],[10,1,16,0,0],[13,1,13,0,0],[17,1,9,0,0]],
 2:[[10,1,34,0,0],[16,1,28,0,0],[22,1,22,0,0],[28,1,16,0,0]],
 3:[[15,1,55,0,0],[26,1,44,0,0],[18,2,17,0,0],[22,2,13,0,0]],
 4:[[20,1,80,0,0],[18,2,32,0,0],[26,2,24,0,0],[16,4,9,0,0]],
 5:[[26,1,108,0,0],[24,2,43,0,0],[18,2,15,2,16],[22,2,11,2,12]],
 6:[[18,2,68,0,0],[16,4,27,0,0],[24,4,19,0,0],[28,4,15,0,0]],
 7:[[20,2,78,0,0],[18,4,31,0,0],[18,2,14,4,15],[26,4,13,1,14]],
 8:[[24,2,97,0,0],[22,2,38,2,39],[22,4,18,2,19],[26,4,14,2,15]],
 9:[[30,2,116,0,0],[22,3,36,2,37],[20,4,16,4,17],[24,4,12,4,13]],
 10:[[18,2,68,2,69],[26,4,43,1,44],[24,6,19,2,20],[28,6,15,2,16]],
 11:[[20,4,81,0,0],[30,1,50,4,51],[28,4,22,4,23],[24,3,12,8,13]],
 12:[[24,2,92,2,93],[22,6,36,2,37],[26,4,20,6,21],[28,7,14,4,15]],
 13:[[26,4,107,0,0],[22,8,37,1,38],[24,8,20,4,21],[22,12,11,4,12]],
 14:[[30,3,115,1,116],[24,4,40,5,41],[20,11,16,5,17],[24,11,12,5,13]],
 15:[[22,5,87,1,88],[24,5,41,5,42],[30,5,24,7,25],[24,11,12,7,13]],
 16:[[24,5,98,1,99],[28,7,45,3,46],[24,15,19,2,20],[30,3,15,13,16]],
 17:[[28,1,107,5,108],[28,10,46,1,47],[28,1,22,15,23],[28,2,14,17,15]],
 18:[[30,5,120,1,121],[26,9,43,4,44],[28,17,22,1,23],[28,2,14,19,15]],
 19:[[28,3,113,4,114],[26,3,44,11,45],[26,17,21,4,22],[26,9,13,16,14]],
 20:[[28,3,107,5,108],[26,3,41,13,42],[30,15,24,5,25],[28,15,15,10,16]],
};
var ALIGN={1:[],2:[6,18],3:[6,22],4:[6,26],5:[6,30],6:[6,34],7:[6,22,38],8:[6,24,42],9:[6,26,46],
 10:[6,28,50],11:[6,30,54],12:[6,32,58],13:[6,34,62],14:[6,26,46,66],15:[6,26,48,70],16:[6,26,50,74],
 17:[6,30,54,78],18:[6,30,56,82],19:[6,30,58,86],20:[6,34,62,90]};
var ECI={L:0,M:1,Q:2,H:3},ECBITS={L:1,M:0,Q:3,H:2};
function bchFormat(f){var d=f<<10,g=0x537;
 for(var i=4;i>=0;i--)if(d&(1<<(i+10)))d^=g<<i;
 return ((f<<10)|d)^0x5412}
function bchVersion(v){var d=v<<12;
 for(var i=5;i>=0;i--)if(d&(1<<(i+12)))d^=0x1f25<<i;
 return (v<<12)|d}
function encode(text,ec){
  var bytes=new TextEncoder().encode(text);
  var ei=ECI[ec],ver=0,info=null;
  for(var v=1;v<=20;v++){
    var r=RS[v][ei],dataCw=r[1]*r[2]+r[3]*r[4];
    var cci=v<10?8:16;
    var cap=dataCw*8-4-cci;
    if(bytes.length*8<=cap){ver=v;info=r;break}
  }
  if(!ver)throw new Error('Too much data — shorten the content or lower the error correction level.');
  var cci=ver<10?8:16;
  var bits=[];
  function put(val,len){for(var i=len-1;i>=0;i--)bits.push((val>>i)&1)}
  put(4,4);put(bytes.length,cci);
  for(var i=0;i<bytes.length;i++)put(bytes[i],8);
  var dataCw=info[1]*info[2]+info[3]*info[4];
  var total=dataCw*8;
  for(var i=0;i<4&&bits.length<total;i++)bits.push(0);
  while(bits.length%8)bits.push(0);
  var pad=[0xEC,0x11],p=0;
  while(bits.length<total){put(pad[p++%2],8)}
  var cw=[];for(var i=0;i<bits.length;i+=8){var b=0;for(var j=0;j<8;j++)b=(b<<1)|bits[i+j];cw.push(b)}
  // split into blocks
  var blocks=[],ecs=[],idx=0;
  var spec=[];
  for(var i=0;i<info[1];i++)spec.push(info[2]);
  for(var i=0;i<info[3];i++)spec.push(info[4]);
  for(var i=0;i<spec.length;i++){var d=cw.slice(idx,idx+spec[i]);idx+=spec[i];blocks.push(d);ecs.push(rsEncode(d,info[0]))}
  var out=[],max=Math.max.apply(null,spec);
  for(var i=0;i<max;i++)for(var b=0;b<blocks.length;b++)if(i<blocks[b].length)out.push(blocks[b][i]);
  for(var i=0;i<info[0];i++)for(var b=0;b<ecs.length;b++)out.push(ecs[b][i]);
  return {ver:ver,cw:out,ec:ec};
}
function buildMatrix(enc){
  var v=enc.ver,n=v*4+17;
  var m=[],res=[];
  for(var i=0;i<n;i++){m.push(new Array(n).fill(null));res.push(new Array(n).fill(false))}
  function finder(r,c){
    for(var i=-1;i<=7;i++)for(var j=-1;j<=7;j++){
      var y=r+i,x=c+j;if(y<0||y>=n||x<0||x>=n)continue;
      var on=(i>=0&&i<=6&&(j===0||j===6))||(j>=0&&j<=6&&(i===0||i===6))||(i>=2&&i<=4&&j>=2&&j<=4);
      m[y][x]=on?1:0;res[y][x]=true}}
  finder(0,0);finder(0,n-7);finder(n-7,0);
  for(var i=8;i<n-8;i++){var b=(i%2===0)?1:0;m[6][i]=b;res[6][i]=true;m[i][6]=b;res[i][6]=true}
  var al=ALIGN[v];
  for(var a=0;a<al.length;a++)for(var b=0;b<al.length;b++){
    var r=al[a],c=al[b];
    if((r<=7&&c<=7)||(r<=7&&c>=n-8)||(r>=n-8&&c<=7))continue;
    for(var i=-2;i<=2;i++)for(var j=-2;j<=2;j++){
      m[r+i][c+j]=(Math.max(Math.abs(i),Math.abs(j))!==1)?1:0;res[r+i][c+j]=true}}
  m[n-8][8]=1;res[n-8][8]=true;
  for(var i=0;i<9;i++){if(m[8][i]===null){m[8][i]=0;res[8][i]=true}if(m[i][8]===null){m[i][8]=0;res[i][8]=true}}
  for(var i=0;i<8;i++){if(m[8][n-1-i]===null){m[8][n-1-i]=0;res[8][n-1-i]=true}
   if(m[n-1-i][8]===null){m[n-1-i][8]=0;res[n-1-i][8]=true}}
  if(v>=7){var vb=bchVersion(v);
   for(var i=0;i<18;i++){var bit=(vb>>i)&1,r=Math.floor(i/3),c=i%3;
    m[n-11+c][r]=bit;res[n-11+c][r]=true;m[r][n-11+c]=bit;res[r][n-11+c]=true}}
  // place data
  var bits=[];for(var i=0;i<enc.cw.length;i++)for(var j=7;j>=0;j--)bits.push((enc.cw[i]>>j)&1);
  var bi=0,up=true;
  for(var col=n-1;col>0;col-=2){
    if(col===6)col--;
    for(var k=0;k<n;k++){
      var row=up?n-1-k:k;
      for(var c=0;c<2;c++){
        var cc=col-c;
        if(res[row][cc])continue;
        m[row][cc]=bi<bits.length?bits[bi++]:0;
      }
    }
    up=!up;
  }
  // choose mask
  var MASKS=[function(r,c){return (r+c)%2===0},function(r,c){return r%2===0},function(r,c){return c%3===0},
   function(r,c){return (r+c)%3===0},function(r,c){return (Math.floor(r/2)+Math.floor(c/3))%2===0},
   function(r,c){return (r*c)%2+(r*c)%3===0},function(r,c){return ((r*c)%2+(r*c)%3)%2===0},
   function(r,c){return ((r+c)%2+(r*c)%3)%2===0}];
  var best=null,bestScore=Infinity;
  for(var mi=0;mi<8;mi++){
    var g=[];for(var r=0;r<n;r++){g.push([]);for(var c=0;c<n;c++)g[r][c]=res[r][c]?m[r][c]:(m[r][c]^(MASKS[mi](r,c)?1:0))}
    var fmt=bchFormat((ECBITS[enc.ec]<<3)|mi);
    for(var i=0;i<15;i++){
      var bit=(fmt>>(14-i))&1;
      if(i<6)g[8][i]=bit;else if(i<8)g[8][i+1]=bit;else if(i===8)g[7][8]=bit;else g[14-i][8]=bit;
      if(i<7)g[n-1-i][8]=bit;else g[8][n-15+i]=bit;
    }
    g[n-8][8]=1;
    var s=score(g,n);
    if(s<bestScore){bestScore=s;best=g}
  }
  return best;
}
function score(g,n){
  var p=0;
  for(var r=0;r<n;r++){var run=1;for(var c=1;c<n;c++){if(g[r][c]===g[r][c-1])run++;else{if(run>=5)p+=run-2;run=1}}if(run>=5)p+=run-2}
  for(var c=0;c<n;c++){var run=1;for(var r=1;r<n;r++){if(g[r][c]===g[r-1][c])run++;else{if(run>=5)p+=run-2;run=1}}if(run>=5)p+=run-2}
  for(var r=0;r<n-1;r++)for(var c=0;c<n-1;c++)if(g[r][c]===g[r][c+1]&&g[r][c]===g[r+1][c]&&g[r][c]===g[r+1][c+1])p+=3;
  var dark=0;for(var r=0;r<n;r++)for(var c=0;c<n;c++)if(g[r][c])dark++;
  p+=Math.floor(Math.abs(dark*100/(n*n)-50)/5)*10;
  return p;
}
/* ---- forms ---- */
var FORMS={
 text:'<label for="v1">URL or text</label><input type="text" id="v1" value="https://toolman.top">',
 wifi:'<div class="grid2"><div><label for="v1">Network name (SSID)</label><input type="text" id="v1" placeholder="MyWiFi"></div><div><label for="v2">Password</label><input type="text" id="v2" placeholder="password"></div></div><label style="margin-top:8px">Security <select id="v3" style="width:auto"><option value="WPA">WPA/WPA2/WPA3</option><option value="WEP">WEP</option><option value="nopass">Open (no password)</option></select></label>',
 mailto:'<div class="grid2"><div><label for="v1">Email address</label><input type="text" id="v1" placeholder="you@example.com"></div><div><label for="v2">Subject (optional)</label><input type="text" id="v2"></div></div><label for="v3">Body (optional)</label><input type="text" id="v3">',
 tel:'<label for="v1">Phone number</label><input type="text" id="v1" placeholder="+1 555 0100">',
 sms:'<div class="grid2"><div><label for="v1">Phone number</label><input type="text" id="v1" placeholder="+1 555 0100"></div><div><label for="v2">Message</label><input type="text" id="v2"></div></div>',
 vcard:'<div class="grid2"><div><label for="v1">Full name</label><input type="text" id="v1"></div><div><label for="v2">Phone</label><input type="text" id="v2"></div><div><label for="v3">Email</label><input type="text" id="v3"></div><div><label for="v4">Organisation</label><input type="text" id="v4"></div></div>',
};
function val(id){var e=document.getElementById(id);return e?e.value:''}
function payload(){
  var t=$('#type').value;
  var esc=s=>s.replace(/([\\\\;,:"])/g,'\\\\$1');
  if(t==='text')return val('v1');
  if(t==='wifi'){var s=val('v3');return 'WIFI:T:'+s+';S:'+esc(val('v1'))+';'+(s==='nopass'?'':'P:'+esc(val('v2'))+';')+';'}
  if(t==='mailto'){var q=[];if(val('v2'))q.push('subject='+encodeURIComponent(val('v2')));if(val('v3'))q.push('body='+encodeURIComponent(val('v3')));
    return 'mailto:'+val('v1')+(q.length?'?'+q.join('&'):'')}
  if(t==='tel')return 'tel:'+val('v1').replace(/\\s/g,'');
  if(t==='sms')return 'SMSTO:'+val('v1').replace(/\\s/g,'')+':'+val('v2');
  if(t==='vcard')return 'BEGIN:VCARD\\nVERSION:3.0\\nFN:'+val('v1')+'\\nTEL:'+val('v2')+'\\nEMAIL:'+val('v3')+'\\nORG:'+val('v4')+'\\nEND:VCARD';
  return '';
}
var GRID=null;
function draw(){
  var data=payload();
  $('#err').textContent='';
  if(!data){$('#info').textContent='Enter some content above.';return}
  try{
    var enc=encode(data,$('#ec').value);
    GRID=buildMatrix(enc);
  }catch(e){$('#err').textContent='✗ '+e.message;return}
  var n=GRID.length,mg=+$('#mg').value||0,size=+$('#size').value;
  var cells=n+mg*2,scale=Math.max(1,Math.floor(size/cells));
  var cv=$('#cv');cv.width=cv.height=cells*scale;
  var ctx=cv.getContext('2d');
  ctx.fillStyle=$('#bg').value;ctx.fillRect(0,0,cv.width,cv.height);
  ctx.fillStyle=$('#fg').value;
  for(var r=0;r<n;r++)for(var c=0;c<n;c++)if(GRID[r][c])ctx.fillRect((c+mg)*scale,(r+mg)*scale,scale,scale);
  $('#info').textContent='Version '+enc.ver+' · '+n+'×'+n+' modules · '+data.length+' characters · error correction '+enc.ec;
}
function svg(){
  var n=GRID.length,mg=+$('#mg').value||0,cells=n+mg*2;
  var p='';
  for(var r=0;r<n;r++)for(var c=0;c<n;c++)if(GRID[r][c])p+='M'+(c+mg)+' '+(r+mg)+'h1v1h-1z';
  return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 '+cells+' '+cells+'" shape-rendering="crispEdges"><rect width="'+cells+'" height="'+cells+'" fill="'+$('#bg').value+'"/><path d="'+p+'" fill="'+$('#fg').value+'"/></svg>';
}
function setForm(){$('#form').innerHTML=FORMS[$('#type').value];draw()}
$('#type').addEventListener('change',setForm);
document.addEventListener('input',e=>{if(e.target.closest('#form')||['fg','bg','mg'].includes(e.target.id))draw()});
['#ec','#size','#mg','#fg','#bg'].forEach(s=>$(s).addEventListener('change',draw));
document.addEventListener('click',e=>{
  var b=e.target.closest('[data-act]');if(!b||!GRID)return;
  var a=document.createElement('a');
  if(b.dataset.act==='png'){a.href=$('#cv').toDataURL('image/png');a.download='qr-code.png'}
  else{a.href='data:image/svg+xml;charset=utf-8,'+encodeURIComponent(svg());a.download='qr-code.svg'}
  document.body.appendChild(a);a.click();a.remove();
});
setForm();
`,
};
