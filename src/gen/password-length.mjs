import { faq } from '../layout.mjs';

// Search Console shows four separate queries for password length — 8, 10 and 15
// characters, plus "8 character password generator" — landing on the single
// generator page. They are worth their own pages because the answer genuinely
// differs: entropy is linear in length and crack time is exponential in it, so
// adding four characters is not "a bit stronger", it is a factor of 1.7 million.
//
// The arithmetic that ties it together, and the fact worth remembering:
//
//   log2(87) = 6.443 bits per keyboard character
//   log2(7776) = 12.925 bits per diceware word
//
// so **two random characters carry the same entropy as one diceware word**, to
// within half a per cent. That is the honest way to compare the two approaches.

const CHARSETS = [
  ['lowercase only', 26],
  ['letters and digits', 62],
  ['full keyboard', 87],
];
// The generator's alphabet and the entropy arithmetic have to be the same set.
// The first version of the generator carried 89 characters while every figure
// on the page was computed from 87 — a discrepancy nothing would have surfaced,
// because both numbers look right on their own.
const CHARSET = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()-_=+[]{};:,.?/~';
if (CHARSET.length !== 87) {
  console.error(`
✗ password charset is ${CHARSET.length} characters but the entropy figures assume 87`);
  process.exitCode = 1;
}
if (new Set(CHARSET).size !== CHARSET.length) {
  console.error('\n✗ password charset contains a duplicate character, which lowers the real entropy');
  process.exitCode = 1;
}
const BITS_PER_CHAR = Math.log2(CHARSET.length);
const BITS_PER_WORD = Math.log2(7776);

// Attack rates worth distinguishing. The spread between them is the reason a
// single "time to crack" figure is meaningless without saying what is doing the
// cracking.
const ATTACKS = [
  ['Online, rate limited', 100, 'Guessing against a live login that allows a hundred attempts a second — generous for a real service.'],
  ['Offline, slow hash', 1e4, 'A stolen database hashed with bcrypt or Argon2 at sensible parameters.'],
  ['Offline, fast hash', 1e12, 'A stolen database hashed with unsalted SHA-256 or MD5, attacked on GPUs. This is the case worth designing for.'],
];

const VERDICT = {
  6: ['Not usable.', 'Six characters is 39 bits. Against fast hardware it falls in well under a minute, and it is short enough that a targeted attack will simply enumerate it. There is no context in which this is a reasonable choice today.'],
  8: ['The old minimum, and no longer enough.', 'Eight characters was the standard requirement for two decades and is now the length most password policies still ask for, which is the problem. At 52 bits it survives an online attack indefinitely and a fast offline attack for under an hour.'],
  10: ['Borderline.', 'Ten characters clears the trivial cases and is still inside reach of a determined offline attack on a fast hash. It is a reasonable floor for something low-value and not for anything you would mind losing.'],
  12: ['The practical minimum for anything that matters.', 'Twelve characters is 77 bits, which puts a fast offline attack into the thousands of years. This is the shortest length that is defensible for an account you care about, and it is what most modern guidance settles on.'],
  14: ['Comfortable.', 'Fourteen characters buys two more orders of magnitude over twelve for the cost of two keystrokes you will never type — this is a password manager\\u2019s job, not yours.'],
  16: ['The sensible default.', 'Sixteen characters is 103 bits, past the point where brute force is the attack anyone would choose. Beyond here the weak link is never the password: it is reuse, phishing, or the site storing it badly.'],
  18: ['Beyond the useful range.', 'Eighteen characters is stronger than sixteen in the same way that a bank vault is stronger with two doors. The number goes up and nothing that actually happens to passwords gets harder.'],
  20: ['Symbolic.', 'Twenty characters is 129 bits, which exceeds the key length of AES-128. If an attacker is getting in, brute force was not how.'],
  24: ['Well past any threat.', 'At this length the entropy exceeds anything an attacker could search with the entire energy budget of the planet. It is chosen for policy compliance rather than for security.'],
  32: ['Arbitrary.', 'Thirty-two characters is used where a system generates and stores the value itself — API keys, service credentials — and nobody has to type it. As a human password it is theatre.'],
};

const LENGTHS = [6, 8, 10, 12, 14, 16, 18, 20, 24, 32];

function crackTime(bits, rate) {
  // Half the keyspace on average.
  const seconds = Math.pow(2, bits - 1) / rate;
  const units = [
    [1, 'second'], [60, 'minute'], [3600, 'hour'], [86400, 'day'],
    [31557600, 'year'], [31557600e3, 'thousand years'], [31557600e6, 'million years'],
    [31557600e9, 'billion years'],
  ];
  if (seconds < 1) return 'instantly';
  if (seconds > 31557600e12) return 'longer than the universe has existed, by a wide margin';
  let best = units[0];
  for (const u of units) if (seconds >= u[0]) best = u;
  const n = seconds / best[0];
  const label = best[1].includes('years') ? best[1] : best[1] + (n >= 2 ? 's' : '');
  return `${n >= 100 ? Math.round(n).toLocaleString('en-US') : n.toFixed(n < 10 ? 1 : 0)} ${label}`;
}

const f1 = (v) => v.toFixed(1);

export default async function () {
  // The hub claims one extra character beats adding symbols to all twelve
  // positions. That is a claim about this charset, so it is computed from it
  // and checked rather than asserted from memory.
  {
    const alnumBits = Math.log2(62);
    const symbolGain = 12 * (Math.log2(CHARSET.length) - alnumBits);
    // The heading's claim is the one-character one. Checking the two-character
    // version instead would pass by a margin wide enough to prove nothing.
    if (!(alnumBits > symbolGain)) {
      console.error(`\n\u2717 password hub: says one more character beats adding symbols, and the sums are ${alnumBits.toFixed(2)} against ${symbolGain.toFixed(2)} bits`);
      process.exitCode = 1;
    }
    if (CHARSET.length <= 62) {
      console.error(`\n\u2717 password hub: compares a ${CHARSET.length}-character set against the 62 of letters and digits, which is not larger`);
      process.exitCode = 1;
    }
  }

  const pages = [];

  const rows = LENGTHS.map((len) => ({
    len,
    bits: len * BITS_PER_CHAR,
    words: (len * BITS_PER_CHAR) / BITS_PER_WORD,
    verdict: VERDICT[len],
  }));

  for (const r of rows) {
    // By value, 32's nearest neighbour is 24 - eight away - so the ±4 window
    // returned nothing and the page was reachable only from the hub. By
    // position, the ends of the scale get neighbours like everything else.
    const at = rows.indexOf(r);
    const near = rows.filter((x, i) => i !== at && Math.abs(i - at) <= 2);
    const plusFour = rows.find((x) => x.len === r.len + 4);

    const FAQ = faq([
      { q: `Is a ${r.len} character password strong enough?`,
        a: `<strong>${r.verdict[0]}</strong> ${r.verdict[1]}` },
      { q: `How long does it take to crack a ${r.len} character password?`,
        a: `How long a password survives depends entirely on how it is stored. Against a fast unsalted hash on GPUs, <strong>${crackTime(r.bits, 1e12)}</strong>. Against bcrypt, ${crackTime(r.bits, 1e4)}. Against a rate-limited login, ${crackTime(r.bits, 100)}. A single "time to crack" figure without that context is meaningless.` },
      { q: `How many bits of entropy is a ${r.len} character password?`,
        a: `<strong>${f1(r.bits)} bits</strong> if every character is chosen at random from the full keyboard — 26 lowercase, 26 uppercase, 10 digits and 25 symbols, which is ${BITS_PER_CHAR.toFixed(3)} bits each. A password you invented yourself carries far less, because people do not choose randomly.` },
      { q: `Is a ${r.len} character password the same as a passphrase?`,
        a: `A ${r.len}-character random password is worth about <strong>${Math.round(r.words)} diceware words</strong>. Two random characters carry the same entropy as one word from a 7,776-word list — ${(2 * BITS_PER_CHAR).toFixed(2)} bits against ${BITS_PER_WORD.toFixed(2)} — so the two approaches are interchangeable at equal strength, and the passphrase is easier to type.` },
    ]);

    pages.push({
      path: `/password-length/${r.len}/`,
      title: `${r.len} Character Password Generator — ${f1(r.bits)} Bits | Toolman`,
      desc: `Generate a random ${r.len} character password in your browser. It carries ${f1(r.bits)} bits of entropy and survives a fast offline attack for ${crackTime(r.bits, 1e12)}. ${r.verdict[0]}`,
      h1: `${r.len} character password`,
      crumbs: [{ name: 'Password length', path: '/password-length/' }, { name: `${r.len} characters`, path: `/password-length/${r.len}/` }],
      jsonld: [FAQ.schema],
      script: `
(function(){
 var SET=${JSON.stringify(CHARSET)};
 var out=document.getElementById('pw'), btn=document.getElementById('gen'), cp=document.getElementById('cp');
 if(!out) return;
 function pick(n){var a=new Uint32Array(1),lim=Math.floor(4294967296/n)*n,x;
   do{crypto.getRandomValues(a);x=a[0]}while(x>=lim);return x%n}
 function make(){var s='';for(var i=0;i<${r.len};i++)s+=SET.charAt(pick(SET.length));out.value=s}
 btn.addEventListener('click',make);
 cp.addEventListener('click',function(){out.select();
   navigator.clipboard.writeText(out.value).then(function(){cp.textContent='Copied';
     setTimeout(function(){cp.textContent='Copy'},1200)})});
 make();
})();`,
      body: `<p class="big" style="font-size:1.6rem;margin:.3em 0"><strong>${f1(r.bits)} bits</strong></p>
<p class="muted">${r.len} characters from the full keyboard · about ${Math.round(r.words)} diceware words · ${r.verdict[0]}</p>

<div class="tool">
  <label for="pw">A random ${r.len}-character password</label>
  <input type="text" id="pw" class="out" readonly value="generating…">
  <div class="row">
    <button id="gen" class="primary" type="button">Generate another</button>
    <button id="cp" type="button">Copy</button>
    <span class="muted">${f1(r.bits)} bits · generated in your browser with <code>crypto.getRandomValues()</code>, never sent anywhere</span>
  </div>
</div>

<h2>${r.verdict[0]}</h2>
<p>${r.verdict[1]}</p>

<h2>How long it survives</h2>
<p>There is no single answer, and the spread is the point: the same password falls in ${crackTime(r.bits, 1e12)} or holds for ${crackTime(r.bits, 100)} depending entirely on how the site stored it — which is not something you control.</p>
<table><thead><tr><th>Attack</th><th>Guesses per second</th><th>Time</th></tr></thead><tbody>
${ATTACKS.map(([name, rate, note]) => `<tr><td>${name}<br><span class="muted">${note}</span></td><td>${rate.toExponential(0).replace('e+', '×10^')}</td><td><strong>${crackTime(r.bits, rate)}</strong></td></tr>`).join('')}
</tbody></table>
<p class="muted">Assuming half the keyspace on average, and that every character was chosen at random. A password you thought of yourself is worth a fraction of this.</p>

<h2>Entropy by character set</h2>
<p>Length is only half of it. What matters is length × the bits each character carries, and that depends on how many characters were possible.</p>
<table><thead><tr><th>Character set</th><th>Bits each</th><th>${r.len} characters</th><th>Fast offline attack</th></tr></thead><tbody>
${CHARSETS.map(([name, n]) => {
        const b = r.len * Math.log2(n);
        return `<tr${n === 87 ? ' style="font-weight:600"' : ''}><td>${name} (${n})</td><td>${Math.log2(n).toFixed(2)}</td><td>${f1(b)} bits</td><td>${crackTime(b, 1e12)}</td></tr>`;
      }).join('')}
</tbody></table>

${plusFour ? `<h2>What four more characters buy</h2>
<p>Entropy is linear in length and the search space is exponential in entropy, so the step is not gentle. Going from ${r.len} to <a href="/password-length/${plusFour.len}/">${plusFour.len}</a> adds ${f1(plusFour.bits - r.bits)} bits — which multiplies the work by <strong>${Math.round(Math.pow(2, plusFour.bits - r.bits)).toLocaleString('en-US')}</strong>. Four keystrokes you will never type, because a password manager types them.</p>` : ''}

<h2>Or use words instead</h2>
<p>This password is worth about <strong>${Math.round(r.words)} words</strong> from a diceware list. The equivalence is close enough to be worth memorising: <strong>two random characters ≈ one random word</strong> (${(2 * BITS_PER_CHAR).toFixed(2)} bits against ${BITS_PER_WORD.toFixed(2)}). A passphrase of the same strength is longer to write and far easier to type on a phone, which is the trade.</p>

<h2>Nearby lengths</h2>
<table><thead><tr><th>Length</th><th>Entropy</th><th>Fast offline attack</th><th>Verdict</th></tr></thead><tbody>
${[...near, r].sort((a, b) => a.len - b.len).map((x) => `<tr${x.len === r.len ? ' style="font-weight:600"' : ''}><td>${x.len === r.len ? x.len : `<a href="/password-length/${x.len}/">${x.len}</a>`}</td><td>${f1(x.bits)} bits</td><td>${crackTime(x.bits, 1e12)}</td><td class="muted">${x.verdict[0]}</td></tr>`).join('')}
</tbody></table>

${FAQ.html}

<p><a href="/password-generator/">Generate a ${r.len} character password</a> · <a href="/password-length/">All lengths compared</a></p>`,
    });
  }

  const r8 = rows.find((r) => r.len === 8);
  const r16 = rows.find((r) => r.len === 16);

  pages.push({
    path: '/password-length/',
    title: 'How Long Should a Password Be? Entropy and Crack Time by Length | Toolman',
    desc: `An 8 character password is ${f1(r8.bits)} bits and falls to a fast offline attack in ${crackTime(r8.bits, 1e12)}. Sixteen is ${f1(r16.bits)} bits. Every length compared, with the arithmetic.`,
    h1: 'Password length',
    crumbs: [{ name: 'Password length', path: '/password-length/' }],
    body: `<p class="muted">What each password length is actually worth, in bits and in time, and where the useful range ends.</p>

<h2>Eight characters is the answer to a 1990s question</h2>
<p>It is still what most password policies ask for, and it has not been adequate for a long time. A random eight-character password is <strong>${f1(r8.bits)} bits</strong> and falls to a fast offline attack in <strong>${crackTime(r8.bits, 1e12)}</strong>. Sixteen characters is ${f1(r16.bits)} bits and the same attack takes ${crackTime(r16.bits, 1e12)}.</p>
<p>The gap is not a slope, it is a cliff, because entropy grows linearly with length and the search space grows exponentially with entropy. <strong>Four more characters multiplies the work by ${Math.round(Math.pow(2, 4 * BITS_PER_CHAR)).toLocaleString('en-US')}.</strong></p>

<h2>Every length</h2>
<table><thead><tr><th>Length</th><th>Entropy</th><th>Fast offline</th><th>Bcrypt</th><th>Rate limited</th><th>Verdict</th></tr></thead><tbody>
${rows.map((r) => `<tr><td><a href="/password-length/${r.len}/">${r.len}</a></td><td>${f1(r.bits)} bits</td><td>${crackTime(r.bits, 1e12)}</td><td>${crackTime(r.bits, 1e4)}</td><td>${crackTime(r.bits, 100)}</td><td class="muted">${r.verdict[0]}</td></tr>`).join('')}
</tbody></table>

<h2>Two characters equal one word</h2>
<p>A keyboard character chosen at random from 87 possibilities carries ${BITS_PER_CHAR.toFixed(3)} bits. A word chosen at random from a 7,776-word diceware list carries ${BITS_PER_WORD.toFixed(3)}. <strong>Two characters is ${(2 * BITS_PER_CHAR).toFixed(2)} bits and one word is ${BITS_PER_WORD.toFixed(2)}</strong> — within half a per cent.</p>
<p>So a 12-character password and a 6-word passphrase are the same strength, and the passphrase is enormously easier to type on a phone. Neither is better; they are the same thing measured differently.</p>

<h2>The number that is not on this page</h2>
<p>Every figure here assumes <strong>every character was chosen at random</strong>. A password a person invented carries a small fraction of the entropy its length implies, because people substitute predictably — a 3 for an E, an exclamation mark at the end, a year that is either this one or a birthday. Attackers model that, and the models are good.</p>
<p>Which makes the practical advice short: let a generator choose, and let a manager remember. The length only means what this page says it means if you did not pick the characters yourself.</p>

<h2>One more character beats adding symbols</h2>
<p>The perennial argument has an arithmetic answer. A 12-character password drawn from letters and digits alone — 62 possibilities per position — carries ${f1(12 * Math.log2(62))} bits. Adding the full symbol set here takes each position from 62 to ${CHARSET.length} choices, which buys <strong>${f1(12 * (Math.log2(CHARSET.length) - Math.log2(62)))} bits</strong> across the whole password.</p>
<p>Making it thirteen characters instead, and keeping it letters and digits, buys <strong>${f1(Math.log2(62))} bits</strong> — more, from one keystroke rather than twelve harder-to-type ones. It is close — ${f1(Math.log2(62))} against ${f1(12 * (Math.log2(CHARSET.length) - Math.log2(62)))} — and a second extra character puts it beyond argument.</p>
<p>Symbols are not useless; they are simply the smaller lever, and they cost the most where passwords are typed on a phone or read aloud. If a policy forces them, add them. If it does not, add length.</p>

<h2>"Cracked in" depends entirely on how it is stored</h2>
<p>A crack time is a guess rate multiplied by a search space, and the guess rate is not a property of the password. The same ${LENGTHS.includes(12) ? 12 : LENGTHS[0]}-character password faces three completely different numbers:</p>
<table><thead><tr><th>Attack</th><th>Guesses per second</th><th>${LENGTHS.includes(12) ? 12 : LENGTHS[0]} characters lasts</th></tr></thead><tbody>
<tr><td>Fast unsalted hash on GPUs — MD5, SHA-1, unsalted SHA-256</td><td>10¹²</td><td>${crackTime(12 * BITS_PER_CHAR, 1e12)}</td></tr>
<tr><td>bcrypt or Argon2, correctly configured</td><td>10⁴</td><td>${crackTime(12 * BITS_PER_CHAR, 1e4)}</td></tr>
<tr><td>A rate-limited login form</td><td>100</td><td>${crackTime(12 * BITS_PER_CHAR, 100)}</td></tr>
</tbody></table>
<p>The gap between the first and second rows is eight orders of magnitude, and it is entirely the service's choice rather than yours. Which is the uncomfortable part: the length you pick matters most precisely when the site storing it has done the wrong thing, and you have no way to find out which sites those are.</p>
<p>It also means "how long should my password be" has no single answer, and any page giving one — including the numbers above — is quietly assuming the worst case. That is the right assumption to make, and it is worth knowing it is being made.</p>

<p><a href="/password-generator/">Password generator</a> · <a href="/hash-generator/">Hash generator</a></p>`,
  });

  return pages;
}
