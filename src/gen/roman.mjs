import { esc, faq } from '../layout.mjs';

const MAP = [[1000, 'M'], [900, 'CM'], [500, 'D'], [400, 'CD'], [100, 'C'], [90, 'XC'],
  [50, 'L'], [40, 'XL'], [10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I']];

function toRoman(n) {
  let x = n, out = '';
  for (const [v, s] of MAP) while (x >= v) { out += s; x -= v; }
  return out;
}


// Spell out the number, which is what "how do you say MCMXCIV" is really asking.
const ONES = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine',
  'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen'];
const TENS = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];
function spell(n) {
  if (n < 20) return ONES[n];
  if (n < 100) return TENS[Math.floor(n / 10)] + (n % 10 ? '-' + ONES[n % 10] : '');
  if (n < 1000) return ONES[Math.floor(n / 100)] + ' hundred' + (n % 100 ? ' and ' + spell(n % 100) : '');
  return spell(Math.floor(n / 1000)) + ' thousand' + (n % 1000 ? (n % 1000 < 100 ? ' and ' : ' ') + spell(n % 1000) : '');
}

// The greedy algorithm, written out as the steps a person would follow.
function steps(n) {
  let x = n;
  const out = [];
  for (const [v, sym] of MAP) {
    let c = 0;
    while (x >= v) { x -= v; c++; }
    if (c) {
      const taken = (c > 1 ? `${c} × ${sym}` : sym).padEnd(8);
      out.push(`${taken} = ${String(c * v).padStart(5)}    remaining: ${x}`);
    }
  }
  return out;
}

function breakdown(n) {
  let x = n; const rows = [];
  for (const [v, s] of MAP) {
    let c = 0;
    while (x >= v) { x -= v; c++; }
    if (c) rows.push([s.repeat(c), c > 1 ? `${c} × ${v.toLocaleString()} = ${(c * v).toLocaleString()}` : v.toLocaleString()]);
  }
  return rows;
}

// Numbers people actually look up: 1–100, every 10 to 500, every 50 to 2000,
// and the years that show up in copyright lines and dates.
function targets() {
  const s = new Set();
  for (let i = 1; i <= 100; i++) s.add(i);
  for (let i = 110; i <= 500; i += 10) s.add(i);
  for (let i = 550; i <= 2000; i += 50) s.add(i);
  for (let y = 1900; y <= 2050; y++) s.add(y);
  for (const n of [2500, 3000, 3500, 3999, 1066, 1492, 1776, 1812, 1865]) s.add(n);
  return [...s].sort((a, b) => a - b);
}

export default async function () {
  const nums = targets();
  const pages = [];
  const known = new Set(nums);

  for (const n of nums) {
    const r = toRoman(n);
    const rows = breakdown(n);
    const near = [];
    for (let d = -5; d <= 5; d++) {
      const x = n + d;
      if (x < 1 || x > 3999) continue;
      near.push(`<tr${d === 0 ? ' style="font-weight:600"' : ''}><td>${x.toLocaleString()}</td><td><code>${toRoman(x)}</code></td></tr>`);
    }
    const others = nums.filter((x) => x !== n && Math.abs(x - n) <= 60).slice(0, 24);

    const isYear = n >= 1900 && n <= 2050;

    const FAQ = faq([
      { q: `What is ${n.toLocaleString()} in Roman numerals?`, a: `<strong>${r}</strong>` },
      { q: `How do you read ${r}?`,
        a: `Work left to right, adding each symbol — except where a smaller symbol precedes a larger one, in which case it is subtracted. ${rows.map(([sym, val]) => `<code>${sym}</code> is ${val.split(' = ').pop()}`).join(', ')}${rows.length > 1 ? `, giving ${n.toLocaleString()} in total` : ''}.` },
      { q: `How do you write ${n.toLocaleString()} in words?`, a: `${spell(n)}.` },
      { q: 'Why is there no zero?',
        a: 'Roman numerals have no symbol for zero. The concept reached Europe only with Hindu-Arabic numerals, centuries after the system was in use — which is a large part of why it was eventually replaced for arithmetic.' },
    ]);

    pages.push({
      path: `/roman/${n}/`,
      title: `${n.toLocaleString()} in Roman Numerals — ${r}`,
      desc: `The number ${n.toLocaleString()} is written ${r} in Roman numerals. See how it breaks down symbol by symbol, plus a table of nearby numbers and a converter for any value.`,
      h1: `${n.toLocaleString()} in Roman numerals`,
      crumbs: [
        { name: 'Roman numerals', path: '/roman/' },
        { name: String(n), path: `/roman/${n}/` },
      ],
      jsonld: [FAQ.schema],
      body: `<p class="big" style="font-size:2.2rem;font-family:var(--mono);margin:.3em 0"><strong>${r}</strong></p>
<p class="muted">The number <strong>${n.toLocaleString()}</strong> is written <strong>${r}</strong> in Roman numerals.${isYear ? ` As a year it appears in copyright lines and cornerstones written this way.` : ''}</p>

<h2>How ${r} breaks down</h2>
<table><thead><tr><th>Symbols</th><th>Value</th></tr></thead><tbody>
${rows.map(([sym, val]) => `<tr><td><code>${sym}</code></td><td>${val}</td></tr>`).join('')}
<tr style="font-weight:600"><td><code>${r}</code></td><td>${n.toLocaleString()}</td></tr>
</tbody></table>
${rows.some(([s]) => /^(IV|IX|XL|XC|CD|CM)$/.test(s))
  ? `<p>This numeral uses the <strong>subtractive rule</strong>: a smaller symbol placed before a larger one is subtracted from it. Only six such pairs are legal — <code>IV</code> (4), <code>IX</code> (9), <code>XL</code> (40), <code>XC</code> (90), <code>CD</code> (400) and <code>CM</code> (900).</p>`
  : `<p>Every symbol here is written in descending order and simply added together — no subtractive pairs are involved.</p>`}

<h2>Nearby numbers</h2>
<table><thead><tr><th>Number</th><th>Roman numeral</th></tr></thead><tbody>${near.join('')}</tbody></table>

<h2>The seven symbols</h2>
<table><tbody>
<tr><td><code>I</code></td><td>1</td><td><code>C</code></td><td>100</td></tr>
<tr><td><code>V</code></td><td>5</td><td><code>D</code></td><td>500</td></tr>
<tr><td><code>X</code></td><td>10</td><td><code>M</code></td><td>1,000</td></tr>
<tr><td><code>L</code></td><td>50</td><td></td><td></td></tr>
</tbody></table>

<h2>${n.toLocaleString()} in other notations</h2>
<table><tbody>
<tr><td>Roman</td><td class="out">${r}</td></tr>
<tr><td>Binary</td><td class="out">${n.toString(2)}</td></tr>
<tr><td>Hexadecimal</td><td class="out">${n.toString(16).toUpperCase()}</td></tr>
<tr><td>Octal</td><td class="out">${n.toString(8)}</td></tr>
<tr><td>Written out</td><td>${spell(n)}</td></tr>
</tbody></table>

<h2>Writing it by hand</h2>
<p>Work down through the symbol values, taking as many of each as will fit before moving to the next. For ${n.toLocaleString()}:</p>
<pre><code>${steps(n).join('\n')}</code></pre>
<p>The result reads <strong>${r}</strong> — ${r.length} character${r.length === 1 ? '' : 's'}, against ${String(n).length} digit${String(n).length === 1 ? '' : 's'} in Arabic numerals.${r.length > String(n).length * 2 ? ' The verbosity at numbers like this is precisely why positional notation replaced the system for arithmetic.' : ''}</p>

${FAQ.html}

<p><a href="/roman-numeral-converter/">Convert any number →</a> · <a href="/roman/">Browse Roman numerals</a></p>`,
    });
  }

  pages.push({
    path: '/roman/',
    title: 'Roman Numerals — Complete Chart and Converter',
    desc: `Roman numerals for ${nums.length} numbers, each with a symbol-by-symbol breakdown. Includes the seven symbols, the subtractive rule, and a converter for any value from 1 to 3,999.`,
    h1: 'Roman numerals',
    crumbs: [{ name: 'Roman numerals', path: '/roman/' }],
    body: `<p class="muted">Every number below links to a page showing how the numeral is built. Need something not listed? <a href="/roman-numeral-converter/">Use the converter</a>.</p>
<h2>The seven symbols</h2>
<table><thead><tr><th>Symbol</th><th>Value</th></tr></thead><tbody>
${[['I', 1], ['V', 5], ['X', 10], ['L', 50], ['C', 100], ['D', 500], ['M', 1000]]
  .map(([s, v]) => `<tr><td><code>${s}</code></td><td>${v.toLocaleString()}</td></tr>`).join('')}
</tbody></table>
<h2>The subtractive pairs</h2>
<p>Only six are legal. Anything else — <code>IL</code> for 49, <code>IC</code> for 99 — is invalid, however logical it looks.</p>
<table><tbody>
${[['IV', 4], ['IX', 9], ['XL', 40], ['XC', 90], ['CD', 400], ['CM', 900]]
  .map(([s, v]) => `<tr><td><code>${s}</code></td><td>${v}</td></tr>`).join('')}
</tbody></table>
<h2>1 to 100</h2>
<ul class="linklist">${nums.filter((n) => n <= 100).map((n) => `<li><a href="/roman/${n}/">${n} = <code>${toRoman(n)}</code></a></li>`).join('')}</ul>
<h2>Years</h2>
<ul class="linklist">${nums.filter((n) => n >= 1900 && n <= 2050).map((n) => `<li><a href="/roman/${n}/">${n} = <code>${toRoman(n)}</code></a></li>`).join('')}</ul>
<h2>Other numbers</h2>
<ul class="linklist">${nums.filter((n) => n > 100 && !(n >= 1900 && n <= 2050)).map((n) => `<li><a href="/roman/${n}/">${n.toLocaleString()} = <code>${toRoman(n)}</code></a></li>`).join('')}</ul>`,
  });

  return pages;
}
