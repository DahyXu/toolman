export default {
  slug: 'subnet-calculator',
  cat: 'dev',
  weight: 8,
  title: 'Subnet Calculator',
  metaTitle: 'CIDR Subnet Calculator — IPv4 Ranges, Masks & Hosts | Toolman',
  short: 'Enter an address and prefix to get the network, broadcast, usable range and host count.',
  desc:
    'Enter an IPv4 address and prefix to get the network and broadcast addresses, subnet mask, wildcard mask, usable host range and total host count.',
  intro:
    'Enter an address in CIDR notation to see the network, the broadcast address, the usable range and how many hosts fit. Everything is computed in your browser.',
  body: `<div class="tool">
  <div class="row">
    <input type="text" id="cidr" value="192.168.1.100/24" spellcheck="false" aria-label="Address in CIDR notation" style="flex:1;min-width:220px;font-family:var(--mono)">
    <button class="primary" id="go">Calculate</button>
  </div>
  <p id="err" class="err"></p>
  <table><tbody id="info"></tbody></table>
  <h2>Binary view</h2>
  <div id="bits" class="out" style="font-family:var(--mono);line-height:2"></div>
  <h2>Split this network</h2>
  <p class="muted">Dividing it into equal subnets:</p>
  <table><thead><tr><th>Prefix</th><th>Subnets</th><th>Hosts each</th><th>First subnet</th></tr></thead><tbody id="split"></tbody></table>
  <p class="muted">Common prefixes: <a href="/cidr/8/">/8</a> · <a href="/cidr/16/">/16</a> · <a href="/cidr/20/">/20</a> · <a href="/cidr/22/">/22</a> · <a href="/cidr/23/">/23</a> · <a href="/cidr/24/">/24</a> · <a href="/cidr/25/">/25</a> · <a href="/cidr/26/">/26</a> · <a href="/cidr/27/">/27</a> · <a href="/cidr/28/">/28</a> · <a href="/cidr/29/">/29</a> · <a href="/cidr/30/">/30</a> · <a href="/cidr/31/">/31</a> · <a href="/cidr/32/">/32</a> · <a href="/cidr/">all prefixes</a></p>
</div>`,
  about: `<h2>What the prefix length means</h2>
<p>An IPv4 address is 32 bits. The number after the slash says how many of those bits identify the <em>network</em>; the rest identify a host within it. In <code>192.168.1.0/24</code> the first 24 bits are the network, leaving 8 bits — 256 addresses — for hosts.</p>
<p>Each bit you take away from the prefix doubles the size of the network. A <code>/23</code> is twice a <code>/24</code>; a <code>/25</code> is half. That doubling is why subnet sizes are always powers of two and why you cannot have a network of exactly 100 addresses — you take a <code>/25</code> and leave 28 addresses unused.</p>

<h2>Why two addresses are unusable</h2>
<p>In every subnet larger than a <code>/31</code>, the first and last addresses are reserved. The first, with all host bits zero, <em>is</em> the network — it names the subnet rather than a machine in it. The last, with all host bits one, is the broadcast address, which reaches every host at once.</p>
<p>So a <code>/24</code> holds 256 addresses but only 254 usable ones. This is the arithmetic behind the constant off-by-two in capacity planning, and it gets painful at the small end: a <code>/30</code> has four addresses and only two you can assign, which is why point-to-point links traditionally waste half their space.</p>
<p>Two prefixes are special. A <code>/31</code> would have no usable addresses under that rule, so RFC 3021 redefines it for point-to-point links: both addresses are usable, and there is no broadcast. A <code>/32</code> is a single address — a host route, a loopback, or a firewall rule matching exactly one machine.</p>

<h2>The mask and the wildcard</h2>
<p>The same information is written three ways depending on which tool you are talking to. A prefix length of 24 is the subnet mask <code>255.255.255.0</code>, and its inverse — the wildcard mask <code>0.0.0.255</code> — is what Cisco access lists and OSPF statements expect. A wildcard is simply the mask with every bit flipped, so a bit that is 0 in the wildcard must match and a bit that is 1 is ignored.</p>

<h2>Private ranges</h2>
<p>Three blocks are reserved for private use and are never routed on the public internet:</p>
<table>
<thead><tr><th>Range</th><th>CIDR</th><th>Addresses</th><th>Where you see it</th></tr></thead>
<tbody>
<tr><td>10.0.0.0 – 10.255.255.255</td><td><code>10.0.0.0/8</code></td><td>16,777,216</td><td>Large corporate networks and cloud VPCs</td></tr>
<tr><td>172.16.0.0 – 172.31.255.255</td><td><code>172.16.0.0/12</code></td><td>1,048,576</td><td>Docker's default bridge, mid-size networks</td></tr>
<tr><td>192.168.0.0 – 192.168.255.255</td><td><code>192.168.0.0/16</code></td><td>65,536</td><td>Home routers, almost universally</td></tr>
</tbody>
</table>
<p>The 172 range trips people up because it is not the whole of 172.x: it stops at 172.31, so <code>172.32.0.0</code> is public address space belonging to someone else.</p>

<h2>Ranges worth recognising</h2>
<table>
<thead><tr><th>Block</th><th>What it is</th></tr></thead>
<tbody>
<tr><td><code>127.0.0.0/8</code></td><td>Loopback — the whole /8, not just 127.0.0.1</td></tr>
<tr><td><code>169.254.0.0/16</code></td><td>Link-local. An address here usually means DHCP failed</td></tr>
<tr><td><code>100.64.0.0/10</code></td><td>Carrier-grade NAT. Appears in mobile networks and some ISPs</td></tr>
<tr><td><code>224.0.0.0/4</code></td><td>Multicast</td></tr>
<tr><td><code>0.0.0.0/0</code></td><td>The default route — every address, which is why it means "anywhere" in a firewall rule</td></tr>
</tbody>
</table>`,
  faq: [
    { q: 'How many hosts are in a /24?', a: '256 addresses, of which <strong>254</strong> are usable. The first is the network address and the last is the broadcast address, and neither can be assigned to a machine.' },
    { q: 'What is the subnet mask for /24?', a: '<code>255.255.255.0</code>. The prefix length counts the leading 1 bits in the mask, so 24 ones followed by 8 zeros gives three full octets of 255 and one of 0.' },
    { q: 'Is a smaller prefix number a bigger network?', a: 'Yes, and this is the usual source of confusion. The number counts network bits, so fewer bits leaves more for hosts. A /16 is 256 times larger than a /24.' },
    { q: 'Why can a /31 be used when it has no usable hosts?', a: 'Under the normal rule a /31 would be entirely network and broadcast. RFC 3021 makes an exception for point-to-point links, where there is no need for a broadcast address, so both addresses are assignable.' },
    { q: 'What is a wildcard mask?', a: 'The bitwise inverse of the subnet mask, used by Cisco access lists and OSPF. For a /24 the mask is <code>255.255.255.0</code> and the wildcard is <code>0.0.0.255</code>. A zero bit must match; a one bit is ignored.' },
    { q: 'How do I split a /24 into smaller subnets?', a: 'Each extra prefix bit halves the network. A /24 splits into two /25s, four /26s, eight /27s and so on. The calculator above shows the first subnet at each size.' },
  ],
  related: ['chmod-calculator', 'number-base-converter', 'hash-generator'],
  script: `
const $=s=>document.querySelector(s);
const toInt=(a)=>a.reduce((n,o)=>n*256+o,0);
const toDots=(n)=>[n>>>24,(n>>>16)&255,(n>>>8)&255,n&255].join('.');
function parse(str){
  const m=/^\\s*(\\d{1,3})\\.(\\d{1,3})\\.(\\d{1,3})\\.(\\d{1,3})(?:\\s*\\/\\s*(\\d{1,2}))?\\s*$/.exec(str);
  if(!m) throw new Error('Expected something like 192.168.1.0/24');
  const o=[+m[1],+m[2],+m[3],+m[4]];
  if(o.some(x=>x>255)) throw new Error('Each octet must be 0-255');
  const p=m[5]===undefined?32:+m[5];
  if(p>32) throw new Error('Prefix length must be 0-32');
  return {ip:toInt(o),prefix:p};
}
// Shifting by 32 is undefined in JS (it shifts by 0), so the /0 case is explicit.
const maskOf=(p)=>p===0?0:(0xffffffff<<(32-p))>>>0;
function calc(ip,p){
  const mask=maskOf(p), net=(ip&mask)>>>0, bcast=(net|(~mask>>>0))>>>0;
  const total=Math.pow(2,32-p);
  const usable=p>=31?(p===32?1:2):total-2;
  const first=p>=31?net:(net+1)>>>0;
  const last=p>=31?bcast:(bcast-1)>>>0;
  return {mask,net,bcast,total,usable,first,last};
}
const PRIVATE=[['0.0.0.0',8,'Reserved — "this network"'],[ '10.0.0.0',8,'Private (RFC 1918)'],['172.16.0.0',12,'Private (RFC 1918)'],['192.168.0.0',16,'Private (RFC 1918)'],['127.0.0.0',8,'Loopback'],['169.254.0.0',16,'Link-local — usually a failed DHCP'],['100.64.0.0',10,'Carrier-grade NAT'],['224.0.0.0',4,'Multicast']];
function classify(ip){
  for(const [base,p,label] of PRIVATE){
    const b=toInt(base.split('.').map(Number));
    if(((ip&maskOf(p))>>>0)===b) return label;
  }
  return 'Public';
}
function render(){
  let v;
  try{ v=parse($('#cidr').value); $('#err').textContent='' }
  catch(e){ $('#err').textContent='✗ '+e.message; return }
  const {ip,prefix}=v, r=calc(ip,prefix);
  const rows=[
    ['CIDR',toDots(r.net)+'/'+prefix],
    ['Network address',toDots(r.net)],
    ['Broadcast address',prefix>=31?'—':toDots(r.bcast)],
    ['Subnet mask',toDots(r.mask)],
    ['Wildcard mask',toDots(~r.mask>>>0)],
    ['Usable host range',r.usable?toDots(r.first)+' – '+toDots(r.last):'none'],
    ['Total addresses',r.total.toLocaleString()],
    ['Usable hosts',r.usable.toLocaleString()],
    ['Address type',classify(ip)],
    ['Prefix length','/'+prefix+' — '+prefix+' network bits, '+(32-prefix)+' host bits'],
  ];
  $('#info').innerHTML=rows.map(x=>'<tr><td>'+x[0]+'</td><td class="out">'+x[1]+'</td></tr>').join('');
  const bits=(n)=>[...Array(32)].map((_,i)=>(n>>>(31-i))&1).join('');
  const ipb=bits(ip);
  $('#bits').innerHTML=
    '<div>address&nbsp; <strong>'+ipb.slice(0,prefix)+'</strong><span class="muted">'+ipb.slice(prefix)+'</span></div>'+
    '<div>mask&nbsp;&nbsp;&nbsp;&nbsp; '+bits(r.mask)+'</div>'+
    '<div class="muted">bold is the network portion</div>';
  const out=[];
  for(let np=prefix+1;np<=Math.min(32,prefix+6);np++){
    const rr=calc(r.net,np);
    out.push('<tr><td><a href="/cidr/'+np+'/">/'+np+'</a></td><td>'+Math.pow(2,np-prefix).toLocaleString()+'</td><td>'+rr.usable.toLocaleString()+'</td><td class="out">'+toDots(rr.net)+'/'+np+'</td></tr>');
  }
  $('#split').innerHTML=out.join('')||'<tr><td colspan="4" class="muted">A /32 cannot be divided further.</td></tr>';
}
$('#go').addEventListener('click',render);
$('#cidr').addEventListener('input',render);
render();
`,
};
