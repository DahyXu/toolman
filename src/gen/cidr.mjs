import { faq } from '../layout.mjs';

// One page per IPv4 prefix length. All 33 exist because people search for the
// odd ones ("what is a /31") as often as the common ones, and the arithmetic is
// computed rather than transcribed, so there is nothing to get wrong by hand.

const maskInt = (p) => (p === 0 ? 0 : (0xffffffff << (32 - p)) >>> 0);
const dots = (n) => [n >>> 24, (n >>> 16) & 255, (n >>> 8) & 255, n & 255].join('.');
const total = (p) => Math.pow(2, 32 - p);
const usable = (p) => (p === 32 ? 1 : p === 31 ? 2 : total(p) - 2);

// Where each size actually turns up. Written per prefix because "a /27 has 30
// hosts" is the part a calculator gives you; what it is *for* is not.
const USE = {
  0: 'The default route. <code>0.0.0.0/0</code> matches every address, which is why it means "anywhere" in a firewall rule and "send it to the gateway" in a routing table.',
  1: 'Half the internet. Only ever seen in routing experiments and in the two-route trick for splitting default traffic between two paths without touching the default route itself.',
  2: 'A quarter of the address space. Not allocated as a unit; you meet it only as an aggregate in routing discussions.',
  3: 'An eighth of IPv4. Historical interest only.',
  4: 'A sixteenth of the space. The multicast block <code>224.0.0.0/4</code> is this size, which is the one place the prefix appears in ordinary configuration.',
  5: 'Too large to be allocated to anyone. Appears in route aggregation.',
  6: 'A routing aggregate rather than an assignment.',
  7: 'Occasionally used to summarise two adjacent /8s in a routing table.',
  8: 'A former class A network. <code>10.0.0.0/8</code> — the largest private range — and <code>127.0.0.0/8</code>, the whole of loopback, are both this size. Sixteen million addresses is more than any single broadcast domain can use, so a /8 is always subdivided.',
  9: 'Half a /8. Used when carving up a large private range into two regions.',
  10: 'The size of the carrier-grade NAT block <code>100.64.0.0/10</code>, which is what your address is in if a mobile network hands you something starting 100.64 to 100.127.',
  11: 'A large regional allocation inside a private /8.',
  12: 'The size of the middle private range, <code>172.16.0.0/12</code> — which covers 172.16 through 172.31 and stops there. Docker allocates its default bridge networks from inside it.',
  13: 'A large subdivision of a private range.',
  14: 'Occasionally an ISP allocation.',
  15: 'Two adjacent /16s summarised as one route.',
  16: 'A former class B, and the size of <code>192.168.0.0/16</code> and of <code>169.254.0.0/16</code>, the link-local range you land in when DHCP fails. 65,536 addresses is a common size for a whole cloud VPC, which is then divided into per-subnet /24s.',
  17: 'Half a /16 — a reasonable size for one availability zone inside a VPC.',
  18: 'A quarter of a /16. A typical cloud subnet where 16,000 addresses is the right order of magnitude.',
  19: 'A common ISP allocation to a business customer.',
  20: 'Just over 4,000 addresses. A frequent choice for a cloud subnet: large enough that you will not run out, small enough that several fit in one VPC.',
  21: 'About 2,000 hosts. Used where a /22 is too small and a /20 wasteful.',
  22: 'Four /24s worth — 1,022 hosts. A common allocation for a medium office and the smallest block an ISP will usually route to a customer.',
  23: 'Two /24s, 510 hosts. The usual answer when a /24 has run out and doubling is easier than renumbering.',
  24: 'The most common subnet size there is: a former class C, 256 addresses and 254 usable. It is the default on essentially every home router and the standard unit for a single VLAN, largely because the boundary falls on an octet and the arithmetic can be done in your head.',
  25: 'Half a /24 — 126 hosts. The first size where you have to think in binary, because the boundary no longer lands on a dot.',
  26: 'A quarter of a /24, 62 hosts. Common for a segment that will not grow: a DMZ, a management network, a set of printers.',
  27: '30 usable hosts. Frequently used for a small VLAN or a rack of servers, and the smallest subnet many people are comfortable with.',
  28: '14 usable hosts. A typical size for a public block assigned to a small business, or for a firewall DMZ with a handful of servers.',
  29: '6 usable hosts. The classic allocation for a customer needing a few static public addresses.',
  30: '2 usable hosts — the traditional size for a point-to-point link between two routers, where two of the four addresses are wasted on the network and broadcast.',
  31: 'Two addresses, both usable. Under the ordinary rule a /31 would have no assignable hosts at all; RFC 3021 makes an exception for point-to-point links, where a broadcast address serves no purpose. It halves the waste of using a /30.',
  32: 'A single address. Not really a subnet but a host route: a loopback interface, a firewall rule matching one machine, or a specific route pushed to override a broader one.',
};

export default async function () {
  const pages = [];
  const ALL = [...Array(33).keys()];

  for (const p of ALL) {
    const m = maskInt(p);
    const t = total(p);
    const u = usable(p);
    const wildcard = dots(~m >>> 0);
    const nHosts = p >= 31 ? `${u}` : u.toLocaleString();

    const FAQ = faq([
      { q: `How many hosts are in a /${p}?`, a: `${t.toLocaleString()} ${t === 1 ? 'address' : 'addresses'} in total, of which <strong>${nHosts}</strong> ${u === 1 ? 'is' : 'are'} usable.${p <= 30 ? ' The first is the network address and the last is the broadcast address, so two are always lost.' : p === 31 ? ' Both are usable because RFC 3021 removes the broadcast address on point-to-point links.' : ' A /32 is a single host route rather than a subnet.'}` },
      { q: `What is the subnet mask for /${p}?`, a: `<code>${dots(m)}</code>. The prefix length is the count of leading 1 bits in the mask, so /${p} is ${p} one${p === 1 ? '' : 's'} followed by ${32 - p} zero${32 - p === 1 ? '' : 's'}.` },
      { q: `What is the wildcard mask for /${p}?`, a: `<code>${wildcard}</code> — the bitwise inverse of the subnet mask. Cisco access lists and OSPF network statements take the wildcard rather than the mask; a zero bit must match and a one bit is ignored.` },
      { q: `How does a /${p} compare to a /24?`, a: p === 24 ? 'A /24 <em>is</em> the reference point: 256 addresses, 254 usable, and the size of a typical home or office network.' : p < 24 ? `A /${p} is ${(total(p) / 256).toLocaleString()} times larger than a /24 — it contains ${(total(p) / 256).toLocaleString()} of them.` : `A /${p} is smaller: ${(256 / t).toLocaleString()} of them fit inside one /24.` },
    ]);

    const near = ALL.filter((x) => x !== p && Math.abs(x - p) <= 8).slice(0, 14);

    pages.push({
      path: `/cidr/${p}/`,
      title: `/${p} Subnet — ${dots(m)}, ${nHosts} Usable Hosts | Toolman`,
      desc: `A /${p} subnet has a mask of ${dots(m)}, ${t.toLocaleString()} total addresses and ${nHosts} usable hosts. Wildcard mask, binary layout, and what this size is used for.`,
      h1: `/${p} subnet`,
      crumbs: [
        { name: 'Developer Tools', path: '/dev/' },
        { name: 'CIDR', path: '/cidr/' },
        { name: `/${p}`, path: `/cidr/${p}/` },
      ],
      jsonld: [FAQ.schema],
      body: `<p class="muted">A <strong>/${p}</strong> has a subnet mask of <strong>${dots(m)}</strong> and <strong>${nHosts}</strong> usable host${u === 1 ? '' : 's'}.</p>

<h2>The numbers</h2>
<table><tbody>
<tr><td>Prefix length</td><td class="out">/${p}</td></tr>
<tr><td>Subnet mask</td><td class="out">${dots(m)}</td></tr>
<tr><td>Wildcard mask</td><td class="out">${wildcard}</td></tr>
<tr><td>Network bits</td><td class="out">${p}</td></tr>
<tr><td>Host bits</td><td class="out">${32 - p}</td></tr>
<tr><td>Total addresses</td><td class="out">${t.toLocaleString()}</td></tr>
<tr><td>Usable hosts</td><td class="out">${nHosts}</td></tr>
<tr><td>/24 networks contained</td><td class="out">${p <= 24 ? (t / 256).toLocaleString() : '—'}</td></tr>
</tbody></table>

<h2>Where a /${p} is used</h2>
<p>${USE[p]}</p>

<h2>Why the usable count is what it is</h2>
<p>${p <= 30
        ? `A /${p} leaves ${32 - p} bits for hosts, giving 2<sup>${32 - p}</sup> = ${t.toLocaleString()} addresses. Two of those cannot be assigned to a machine: the one with all host bits set to zero is the network address, which names the subnet itself, and the one with all host bits set to one is the broadcast address. That leaves ${u.toLocaleString()}.`
        : p === 31
          ? 'Following the ordinary rule, a /31 would have two addresses and lose both to the network and broadcast, leaving nothing. RFC 3021 recognises that a point-to-point link has exactly two endpoints and no need to broadcast, so on such a link both addresses are assignable. This is why modern router configurations use /31 where older ones used /30.'
          : 'A /32 has no host bits at all, so it identifies exactly one address. It is used as a host route rather than as a network: a loopback address, a firewall rule matching a single machine, or a specific route that overrides a broader one.'}</p>

<h2>Binary layout</h2>
<pre><code>mask   ${[...Array(32)].map((_, i) => (i < p ? '1' : '0')).join('').replace(/(.{8})(?=.)/g, '$1.')}
       ${'^'.repeat(p) + ' '.repeat(Math.max(0, 32 - p))}
       ${p} network bits, ${32 - p} host bits</code></pre>

<h2>Splitting and combining</h2>
<table><thead><tr><th></th><th>Prefix</th><th>Usable hosts</th><th>Relationship</th></tr></thead><tbody>
${p > 0 ? `<tr><td>Twice the size</td><td><a href="/cidr/${p - 1}/">/${p - 1}</a></td><td>${usable(p - 1).toLocaleString()}</td><td>Two /${p} networks combine into one /${p - 1}</td></tr>` : ''}
<tr><td><strong>This network</strong></td><td class="out">/${p}</td><td>${nHosts}</td><td>—</td></tr>
${p < 32 ? `<tr><td>Half the size</td><td><a href="/cidr/${p + 1}/">/${p + 1}</a></td><td>${usable(p + 1).toLocaleString()}</td><td>One /${p} splits into two /${p + 1} networks</td></tr>` : ''}
${p < 31 ? `<tr><td>A quarter</td><td><a href="/cidr/${p + 2}/">/${p + 2}</a></td><td>${usable(p + 2).toLocaleString()}</td><td>Four /${p + 2} networks fit in a /${p}</td></tr>` : ''}
</tbody></table>

${FAQ.html}

<h2>Other prefix lengths</h2>
<ul class="linklist">${near.map((x) => `<li><a href="/cidr/${x}/">/${x} — ${dots(maskInt(x))}</a></li>`).join('')}</ul>
<p><a href="/cidr/">All prefix lengths</a> · <a href="/subnet-calculator/">Subnet calculator</a></p>`,
    });
  }

  pages.push({
    path: '/cidr/',
    title: 'CIDR Prefix Reference — Masks, Host Counts and Sizes',
    desc: 'Every IPv4 prefix length from /0 to /32 with its subnet mask, wildcard mask, total and usable host count, and what each size is actually used for.',
    h1: 'CIDR prefix lengths',
    crumbs: [
      { name: 'Developer Tools', path: '/dev/' },
      { name: 'CIDR', path: '/cidr/' },
    ],
    body: `<p class="muted">Every IPv4 prefix length, its mask and how many hosts it holds. Use the <a href="/subnet-calculator/">subnet calculator</a> to work out a specific network's range.</p>
<table><thead><tr><th style="width:5em">Prefix</th><th>Subnet mask</th><th>Wildcard</th><th style="text-align:right">Addresses</th><th style="text-align:right">Usable</th></tr></thead><tbody>
${ALL.map((p) => {
      const m = maskInt(p);
      return `<tr><td><a href="/cidr/${p}/"><strong>/${p}</strong></a></td><td class="out"><a href="/cidr/${p}/">${dots(m)}</a></td><td class="out">${dots(~m >>> 0)}</td><td style="text-align:right">${total(p).toLocaleString()}</td><td style="text-align:right">${usable(p).toLocaleString()}</td></tr>`;
    }).join('')}
</tbody></table>

<h2>Reading a prefix length</h2>
<p>An IPv4 address is 32 bits. The prefix says how many of the leading bits identify the network; whatever is left identifies a host inside it. The counter-intuitive part is that a <em>smaller</em> number means a <em>larger</em> network, because fewer network bits leaves more host bits. A /16 is 256 times the size of a /24.</p>
<p>Every step of one bit doubles or halves the network, which is why subnet sizes are always powers of two. There is no way to allocate a network of exactly 300 addresses: you take a /23, which holds 512, and leave the remainder unused.</p>

<h2>The two lost addresses</h2>
<p>In any subnet of /30 or larger, two addresses cannot be assigned to a machine. The lowest — all host bits zero — is the network address and names the subnet itself. The highest — all host bits one — is the broadcast address. A /24 therefore holds 256 addresses but only 254 hosts.</p>
<p>The waste is negligible at /16 and severe at /30, where half the block is lost. That is exactly why <a href="/cidr/31/">/31</a> exists: RFC 3021 removes the broadcast address on point-to-point links, making both addresses usable and halving the waste on router-to-router connections.</p>

<h2>The sizes you will actually meet</h2>
<table>
<thead><tr><th>Prefix</th><th>Usable</th><th>Typical use</th></tr></thead>
<tbody>
<tr><td><a href="/cidr/8/"><code>/8</code></a></td><td>16,777,214</td><td><code>10.0.0.0/8</code>, the largest private range, and the whole of loopback</td></tr>
<tr><td><a href="/cidr/12/"><code>/12</code></a></td><td>1,048,574</td><td><code>172.16.0.0/12</code> — note it ends at 172.31</td></tr>
<tr><td><a href="/cidr/16/"><code>/16</code></a></td><td>65,534</td><td><code>192.168.0.0/16</code>, and a common size for a whole cloud VPC</td></tr>
<tr><td><a href="/cidr/20/"><code>/20</code></a></td><td>4,094</td><td>A generous cloud subnet</td></tr>
<tr><td><a href="/cidr/24/"><code>/24</code></a></td><td>254</td><td>One VLAN, one office, one home network — the default almost everywhere</td></tr>
<tr><td><a href="/cidr/28/"><code>/28</code></a></td><td>14</td><td>A small public block or a DMZ</td></tr>
<tr><td><a href="/cidr/30/"><code>/30</code></a></td><td>2</td><td>The traditional point-to-point link</td></tr>
<tr><td><a href="/cidr/31/"><code>/31</code></a></td><td>2</td><td>The modern point-to-point link, with nothing wasted</td></tr>
<tr><td><a href="/cidr/32/"><code>/32</code></a></td><td>1</td><td>A host route or a single-address firewall rule</td></tr>
</tbody>
</table>

<h2>Working out a mask without a calculator</h2>
<p>Only nine values can appear in an octet of a subnet mask, because each is a run of leading ones:</p>
<table>
<thead><tr><th>Bits</th><th>Octet</th><th>Bits</th><th>Octet</th></tr></thead>
<tbody>
<tr><td>0</td><td><code>0</code></td><td>5</td><td><code>248</code></td></tr>
<tr><td>1</td><td><code>128</code></td><td>6</td><td><code>252</code></td></tr>
<tr><td>2</td><td><code>192</code></td><td>7</td><td><code>254</code></td></tr>
<tr><td>3</td><td><code>224</code></td><td>8</td><td><code>255</code></td></tr>
<tr><td>4</td><td><code>240</code></td><td></td><td></td></tr>
</tbody>
</table>
<p>Divide the prefix by 8 to get the number of complete 255 octets, and the remainder picks the next octet from this table. A /26 is three complete octets and a remainder of 2, giving <code>255.255.255.192</code>. If a mask contains any other number, it is wrong.</p>`,
  });

  return pages;
}
