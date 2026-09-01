export default {
  slug: 'case-converter',
  cat: 'text',
  weight: 8,
  title: 'Case Converter',
  metaTitle: 'Case Converter — UPPERCASE, lowercase, Title Case & camelCase | Toolman',
  short: 'Convert text between upper, lower, title, sentence, camel, snake and kebab case.',
  desc:
    'Free online case converter. Change text to UPPERCASE, lowercase, Title Case, Sentence case, camelCase, PascalCase, snake_case, kebab-case or CONSTANT_CASE in one click.',
  intro:
    'Paste text and pick a case. Programming cases handle word boundaries properly, so <code>myVariableName</code> and <code>my variable name</code> both convert cleanly.',
  body: `<div class="tool">
  <label for="in">Input</label>
  <textarea id="in" placeholder="The quick brown fox jumps over the lazy dog"></textarea>
  <div class="row">
    <button class="primary" data-c="upper">UPPERCASE</button>
    <button data-c="lower">lowercase</button>
    <button data-c="title">Title Case</button>
    <button data-c="sentence">Sentence case</button>
    <button data-c="camel">camelCase</button>
    <button data-c="pascal">PascalCase</button>
    <button data-c="snake">snake_case</button>
    <button data-c="constant">CONSTANT_CASE</button>
    <button data-c="kebab">kebab-case</button>
    <button data-c="dot">dot.case</button>
    <button data-c="alternate">aLtErNaTiNg</button>
    <button data-c="inverse">iNVERSE</button>
    <button data-c="reverse">esreveR</button>
  </div>
  <label for="out">Output</label>
  <textarea id="out" readonly></textarea>
  <div class="row"><button data-act="copy">Copy</button><button data-act="use">Use as input</button><button data-act="clear">Clear</button><span id="msg" class="muted"></span></div>
</div>`,
  about: `<h2>Naming conventions in code</h2>
<table>
<tr><th>Case</th><th>Example</th><th>Where it is used</th></tr>
<tr><td>camelCase</td><td><code>userAccountId</code></td><td>Variables and functions in JavaScript, Java, Swift, Kotlin</td></tr>
<tr><td>PascalCase</td><td><code>UserAccountId</code></td><td>Classes, types and React components</td></tr>
<tr><td>snake_case</td><td><code>user_account_id</code></td><td>Python, Ruby, Rust, SQL column names</td></tr>
<tr><td>CONSTANT_CASE</td><td><code>USER_ACCOUNT_ID</code></td><td>Constants and environment variables</td></tr>
<tr><td>kebab-case</td><td><code>user-account-id</code></td><td>URLs, CSS classes, HTML attributes, npm package names</td></tr>
<tr><td>dot.case</td><td><code>user.account.id</code></td><td>Config keys, i18n message paths, package namespaces</td></tr>
</table>
<h2>Title case is not just capitalising everything</h2>
<p>In English title case, short words — articles (<em>a</em>, <em>an</em>, <em>the</em>), coordinating conjunctions (<em>and</em>, <em>but</em>, <em>or</em>) and short prepositions (<em>in</em>, <em>on</em>, <em>of</em>, <em>to</em>) — stay lowercase unless they are the first or last word. This tool applies that rule, so "the lord of the rings" becomes "The Lord of the Rings" rather than "The Lord Of The Rings".</p>
<h2>Why case conversion is trickier than it looks</h2>
<p>Uppercasing is language-dependent. In Turkish, the uppercase of <code>i</code> is <code>İ</code>, not <code>I</code>. German <code>ß</code> uppercases to <code>SS</code>, which changes the string length. This tool uses the browser's Unicode-aware case mapping, which handles accented characters and non-Latin scripts correctly.</p>`,
  faq: [
    { q: 'How do I convert a whole document without retyping it?', a: 'Paste it here, click the case you want and copy the result. There is no length limit beyond your browser’s memory, and the text is never uploaded.' },
    { q: 'Does it handle accented and non-Latin characters?', a: 'Yes. Conversion uses the browser’s built-in Unicode case mapping, so <code>café</code> becomes <code>CAFÉ</code> and Cyrillic, Greek and Turkish text convert correctly.' },
    { q: 'What is the difference between title case and sentence case?', a: 'Title case capitalises every significant word ("The Quick Brown Fox"). Sentence case capitalises only the first word of each sentence and proper nouns ("The quick brown fox").' },
    { q: 'Can it convert camelCase to snake_case?', a: 'Yes. Word boundaries are detected from case changes as well as spaces, underscores and hyphens, so <code>userAccountId</code> converts to <code>user_account_id</code> in one step.' },
    { q: 'Why would I need alternating or inverse case?', a: 'Mostly for memes and stylised social posts. Inverse case is also occasionally handy for fixing text typed with caps lock on by mistake.' },
  ],
  related: ['word-counter', 'text-diff-checker', 'lorem-ipsum-generator'],
  script: `
const $=s=>document.querySelector(s),I=$('#in'),O=$('#out');
const SMALL=new Set(['a','an','the','and','but','or','nor','for','so','yet','at','by','in','of','on','to','up','as','if','per','via','off','out','from','into','over','with']);
function words(t){return t.replace(/([a-z0-9])([A-Z])/g,'$1 $2').replace(/([A-Z]+)([A-Z][a-z])/g,'$1 $2').split(/[\\s_\\-.]+/).filter(Boolean)}
const C={
  upper:t=>t.toUpperCase(),
  lower:t=>t.toLowerCase(),
  title:t=>t.toLowerCase().replace(/[^\\s]+/g,(w,i,s)=>{
    const first=i===0, last=i+w.length>=s.trimEnd().length;
    return (!first&&!last&&SMALL.has(w.replace(/[^a-z]/g,'')))?w:w.charAt(0).toUpperCase()+w.slice(1)}),
  sentence:t=>t.toLowerCase().replace(/(^\\s*|[.!?]\\s+|\\n\\s*)([a-z])/g,(m,p,c)=>p+c.toUpperCase()).replace(/\\bi\\b/g,'I'),
  camel:t=>words(t).map((w,i)=>i?w.charAt(0).toUpperCase()+w.slice(1).toLowerCase():w.toLowerCase()).join(''),
  pascal:t=>words(t).map(w=>w.charAt(0).toUpperCase()+w.slice(1).toLowerCase()).join(''),
  snake:t=>words(t).map(w=>w.toLowerCase()).join('_'),
  constant:t=>words(t).map(w=>w.toUpperCase()).join('_'),
  kebab:t=>words(t).map(w=>w.toLowerCase()).join('-'),
  dot:t=>words(t).map(w=>w.toLowerCase()).join('.'),
  alternate:t=>[...t].map((c,i)=>i%2?c.toUpperCase():c.toLowerCase()).join(''),
  inverse:t=>[...t].map(c=>c===c.toUpperCase()?c.toLowerCase():c.toUpperCase()).join(''),
  reverse:t=>[...t].reverse().join(''),
};
let last='upper';
function run(k){last=k;O.value=I.value?C[k](I.value):'';$('#msg').textContent=''}
document.addEventListener('click',e=>{
  const c=e.target.closest('[data-c]');if(c){run(c.dataset.c);return}
  const b=e.target.closest('[data-act]');if(!b)return;
  const a=b.dataset.act;
  if(a==='copy'){O.select();document.execCommand('copy');$('#msg').textContent='Copied';$('#msg').className='ok'}
  else if(a==='use'){I.value=O.value;run(last)}
  else{I.value='';O.value=''}});
I.addEventListener('input',()=>run(last));
`,
};
