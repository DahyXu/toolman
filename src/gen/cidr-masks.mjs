import { faq, ring } from '../layout.mjs';

// Fourth application of the same finding: the section has 33 pages keyed by
// prefix length and the query is often keyed by mask. "255.255.255.0 cidr",
// "what is 255.255.254.0", "subnet mask 255.255.240.0".
//
// Checked the SERP first, as with the other three. No answer widget, and the
// result ranking first is a PDF from RIPE — a chart, not a page. When a PDF is
// winning, Google has nothing better to show.

const maskInt = (p) => (p === 0 ? 0 : (0xffffffff << (32 - p)) >>> 0);
const dots = (n) => [n >>> 24, (n >>> 16) & 255, (n >>> 8) & 255, n & 255].join('.');
const total = (p) => Math.pow(2, 32 - p);
const usable = (p) => (p === 32 ? 1 : p === 31 ? 2 : total(p) - 2);
const wildcard = (p) => dots(~maskInt(p) >>> 0);
const bin = (p) => [0, 1, 2, 3].map((i) => ((maskInt(p) >>> (24 - i * 8)) & 255).toString(2).padStart(8, '0')).join('.');
const n0 = (v) => v.toLocaleString('en-US');

// A mask is a slug of digits and dots; dots are legal in a path segment but
// make an ugly one, so they become hyphens.
const slugOf = (p) => dots(maskInt(p)).replace(/\./g, '-');

export default function cidrMasks() {
  const prefixes = Array.from({ length: 33 }, (_, p) => p);
  const pages = [];

  // A mask is a run of ones followed by a run of zeros and nothing else. If the
  // arithmetic ever produced something else, every page here would be wrong in
  // a way that reads as plausible.
  for (const p of prefixes) {
    const m = maskInt(p);
    const ones = m.toString(2).padStart(32, '0');
    if (!/^1*0*$/.test(ones)) {
      console.error(`\n✗ cidr-masks /${p}: ${dots(m)} is not a contiguous mask`);
      process.exitCode = 1;
    }
    if ((ones.match(/1/g) || []).length !== p) {
      console.error(`\n✗ cidr-masks /${p}: ${dots(m)} has ${(ones.match(/1/g) || []).length} set bits, not ${p}`);
      process.exitCode = 1;
    }
    // The wildcard is the mask inverted; the two must cover every bit exactly once.
    if (((maskInt(p) | (~maskInt(p) >>> 0)) >>> 0) !== 0xffffffff) {
      console.error(`\n✗ cidr-masks /${p}: mask and wildcard do not cover the address between them`);
      process.exitCode = 1;
    }
  }

  const slugs = new Set(prefixes.map(slugOf));
  if (slugs.size !== 33) {
    console.error(`\n✗ cidr-masks: ${slugs.size} distinct masks for 33 prefix lengths`);
    process.exitCode = 1;
  }

  for (const p of prefixes) {
    const mask = dots(maskInt(p));
    const slug = slugOf(p);
    const hosts = total(p);
    const use = usable(p);

    const hostLine = p === 32
      ? 'A single address. Not a network so much as one host written in network notation, which is how a firewall rule names one machine.'
      : p === 31
        ? 'Two addresses and both usable. RFC 3021 removed the network and broadcast addresses for point-to-point links, which is the one case where the usual minus-two does not apply.'
        : `${n0(hosts)} addresses, of which <strong>${n0(use)}</strong> can be assigned to hosts — the first is the network address and the last is the broadcast, and neither goes on an interface.`;

    const FAQ = faq([
      {
        q: `What CIDR prefix is ${mask}?`,
        a: `${mask} is <strong>/${p}</strong>. The mask has ${p} bits set, and the prefix length is that count.`,
      },
      {
        q: `How many hosts does ${mask} allow?`,
        a: p >= 31
          ? hostLine
          : `${n0(hosts)} addresses in total and <strong>${n0(use)}</strong> usable, after the network and broadcast addresses are taken out.`,
      },
      {
        q: `What is the wildcard mask for ${mask}?`,
        a: `<strong>${wildcard(p)}</strong> — the mask with every bit flipped. Cisco access lists and OSPF network statements take the wildcard rather than the mask, which is the usual reason to want it.`,
      },
    ]);

    pages.push({
      path: `/cidr/mask/${slug}/`,
      title: `${mask} is /${p} — ${n0(use)} Usable Hosts`.length <= 65
        ? `${mask} is /${p} — ${n0(use)} Usable Hosts`
        : `Subnet Mask ${mask} — /${p}`,
      desc: `Subnet mask ${mask} is CIDR /${p}: ${n0(hosts)} addresses, ${n0(use)} usable for hosts, wildcard ${wildcard(p)}. What a network this size is used for.`,
      h1: `Subnet mask ${mask}`,
      crumbs: [
        { name: 'CIDR', path: '/cidr/' },
        { name: mask, path: `/cidr/mask/${slug}/` },
      ],
      jsonld: [FAQ.schema],
      body: `<p class="big" style="font-size:1.8rem;margin:.3em 0"><strong>/${p}</strong></p>
<p class="muted">${mask} · ${n0(use)} usable host${use === 1 ? '' : 's'}</p>

<table><tbody>
<tr><td>CIDR prefix</td><td class="out"><a href="/cidr/${p}/">/${p}</a></td></tr>
<tr><td>Subnet mask</td><td class="out">${mask}</td></tr>
<tr><td>Wildcard mask</td><td class="out">${wildcard(p)}</td></tr>
<tr><td>Binary</td><td class="out">${bin(p)}</td></tr>
<tr><td>Total addresses</td><td class="out">${n0(hosts)}</td></tr>
<tr><td>Usable hosts</td><td class="out">${n0(use)}</td></tr>
</tbody></table>

<h2>How many hosts it holds</h2>
<p>${hostLine}</p>

<h2>Reading the mask</h2>
<p>A subnet mask is ${p} one-bits followed by ${32 - p} zero-bits, written as four decimal octets. The ones mark the part of the address that identifies the network and the zeros mark the part that identifies the host, which is why the mask is always a solid run of ones — a mask with a gap in it would split the host part in two and is not valid.</p>
<pre><code>${bin(p)}
${mask}</code></pre>
<p>The prefix length is simply the count of those ones, so <strong>${mask} is /${p}</strong> and nothing has to be calculated to convert between them.</p>

<h2>The wildcard, and where it turns up</h2>
<p>Cisco access lists and OSPF network statements take a <em>wildcard</em> mask rather than a subnet mask — the same value with every bit inverted, <code>${wildcard(p)}</code> here. It trips people up because the two look alike and mean opposite things: in a subnet mask a one means "this bit is the network", and in a wildcard a one means "ignore this bit".</p>

${FAQ.html}

<h2>Other masks</h2>
<ul class="linklist">${ring(prefixes, p, 12).map((o) => `<li><a href="/cidr/mask/${slugOf(o)}/">${dots(maskInt(o))}</a> — /${o}</li>`).join('')}</ul>

<p><a href="/cidr/${p}/">/${p} in full</a> · <a href="/cidr/mask/">Every subnet mask</a> · <a href="/cidr/">CIDR reference</a></p>`,
    });
  }

  const rows = prefixes.map((p) => `<tr><td><a href="/cidr/mask/${slugOf(p)}/">${dots(maskInt(p))}</a></td><td><a href="/cidr/${p}/">/${p}</a></td><td>${n0(total(p))}</td><td>${n0(usable(p))}</td><td>${wildcard(p)}</td></tr>`).join('');

  pages.push({
    path: '/cidr/mask/',
    title: 'Subnet Mask to CIDR — Every Mask and What It Means',
    desc: 'Every IPv4 subnet mask with its CIDR prefix, host count and wildcard mask. 255.255.255.0 is /24 with 254 usable hosts; 255.255.254.0 is /23 with 510.',
    h1: 'Subnet mask to CIDR',
    crumbs: [
      { name: 'CIDR', path: '/cidr/' },
      { name: 'By mask', path: '/cidr/mask/' },
    ],
    body: `<p>The CIDR reference on this site is keyed by prefix length, which is the wrong way round when what you have in front of you is a mask. This is the same 33 networks, keyed by the mask.</p>
<p>Converting between the two needs no arithmetic: the prefix is the number of one-bits in the mask. ${dots(maskInt(24))} is twenty-four ones and eight zeros, so it is /24.</p>
<table><thead><tr><th>Subnet mask</th><th>CIDR</th><th>Addresses</th><th>Usable</th><th>Wildcard</th></tr></thead><tbody>
${rows}
</tbody></table>
<p><a href="/cidr/">CIDR reference by prefix</a> · <a href="/port/">Port numbers</a></p>`,
  });

  return pages;
}
