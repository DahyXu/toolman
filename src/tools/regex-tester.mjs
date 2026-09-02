export default {
  slug: 'regex-tester',
  cat: 'dev',
  weight: 9,
  title: 'Regex Tester',
  metaTitle: 'Regex Tester & Debugger — Test Regular Expressions Online | Toolman',
  short: 'Test regular expressions live with match highlighting and capture groups.',
  desc:
    'Test a regular expression against sample text with live match highlighting, every capture group broken out, and a replacement preview.',
  intro:
    'Type a pattern and some test text. Matches highlight as you type, and every capture group is broken out below.',
  body: `<div class="tool">
  <label for="re">Regular expression</label>
  <div class="row" style="gap:6px;flex-wrap:nowrap">
    <span class="muted" style="font-family:var(--mono);font-size:1.1rem">/</span>
    <input type="text" id="re" value="(\\w+)@(\\w+)\\.(\\w+)" spellcheck="false" style="font-family:var(--mono)">
    <span class="muted" style="font-family:var(--mono);font-size:1.1rem">/</span>
    <input type="text" id="flags" aria-label="Regex flags" value="g" spellcheck="false" style="width:70px;font-family:var(--mono)">
  </div>
  <div class="row">
    ${['g', 'i', 'm', 's', 'u', 'y'].map((f) => `<label style="margin:0"><input type="checkbox" data-flag="${f}" aria-label="Flag ${f}" style="width:auto"> ${f}</label>`).join('')}
    <span id="err" class="err"></span>
  </div>
  <label for="text">Test string</label>
  <textarea id="text" spellcheck="false">Contact ada@example.com or linus@kernel.org for details.
Invalid: not-an-email, @nope, test@localhost</textarea>
  <div id="hl" class="out" style="border:1px solid var(--line);border-radius:10px;padding:12px;margin:10px 0;background:var(--bg);min-height:60px"></div>
  <p id="stat" class="muted"></p>
  <label for="rep">Replace with <span class="muted">(use $1, $2 or $&lt;name&gt; for groups)</span></label>
  <input type="text" id="rep" placeholder="$1 at $2 dot $3">
  <div id="repout" class="out" style="border:1px solid var(--line);border-radius:10px;padding:12px;margin:10px 0;background:var(--bg);min-height:44px"></div>
  <h2>Matches</h2>
  <div style="overflow-x:auto"><table><thead><tr><th>#</th><th>Match</th><th>Index</th><th>Groups</th></tr></thead><tbody id="rows"></tbody></table></div>
</div>`,
  head: `<style>#hl mark{background:rgba(96,165,250,.35);color:inherit;border-radius:3px;padding:1px 0}
#hl mark:nth-of-type(even){background:rgba(34,197,94,.3)}</style>`,
  about: `<h2>Quick reference</h2>
<table>
<tr><th>Pattern</th><th>Matches</th></tr>
<tr><td><code>.</code></td><td>Any character except newline (any character with the <code>s</code> flag)</td></tr>
<tr><td><code>\\d</code> <code>\\w</code> <code>\\s</code></td><td>Digit, word character (<code>[A-Za-z0-9_]</code>), whitespace</td></tr>
<tr><td><code>\\D</code> <code>\\W</code> <code>\\S</code></td><td>The negation of each of the above</td></tr>
<tr><td><code>[abc]</code> <code>[^abc]</code></td><td>Any one of a, b, c — or anything except them</td></tr>
<tr><td><code>[a-z]</code></td><td>A character range</td></tr>
<tr><td><code>^</code> <code>$</code></td><td>Start and end of the string (or of each line with the <code>m</code> flag)</td></tr>
<tr><td><code>\\b</code></td><td>A word boundary</td></tr>
<tr><td><code>*</code> <code>+</code> <code>?</code></td><td>Zero or more, one or more, zero or one</td></tr>
<tr><td><code>{2}</code> <code>{2,}</code> <code>{2,5}</code></td><td>Exactly 2, at least 2, between 2 and 5</td></tr>
<tr><td><code>*?</code> <code>+?</code></td><td>Lazy versions — match as few characters as possible</td></tr>
<tr><td><code>(abc)</code></td><td>Capture group</td></tr>
<tr><td><code>(?:abc)</code></td><td>Group without capturing</td></tr>
<tr><td><code>(?&lt;name&gt;abc)</code></td><td>Named capture group</td></tr>
<tr><td><code>a|b</code></td><td>Either a or b</td></tr>
<tr><td><code>(?=abc)</code> <code>(?!abc)</code></td><td>Lookahead: followed by / not followed by</td></tr>
<tr><td><code>(?&lt;=abc)</code> <code>(?&lt;!abc)</code></td><td>Lookbehind: preceded by / not preceded by</td></tr>
</table>
<h2>Flags</h2>
<table>
<tr><td><code>g</code></td><td>Global — find every match, not just the first</td></tr>
<tr><td><code>i</code></td><td>Case-insensitive</td></tr>
<tr><td><code>m</code></td><td>Multiline — <code>^</code> and <code>$</code> match at line breaks</td></tr>
<tr><td><code>s</code></td><td>Dot-all — <code>.</code> also matches newlines</td></tr>
<tr><td><code>u</code></td><td>Unicode — enables <code>\\p{...}</code> property escapes and correct surrogate handling</td></tr>
<tr><td><code>y</code></td><td>Sticky — match only at <code>lastIndex</code></td></tr>
</table>
<h2>Greedy vs lazy</h2>
<p>Against <code>&lt;a&gt;&lt;b&gt;</code>, the pattern <code>&lt;.*&gt;</code> matches the whole string because <code>*</code> is greedy — it takes as much as it can and then backtracks. <code>&lt;.*?&gt;</code> matches just <code>&lt;a&gt;</code>. Getting this wrong is the single most common regex bug.</p>
<h2>Catastrophic backtracking</h2>
<p>Patterns with nested quantifiers such as <code>(a+)+$</code> can take exponential time on input that <em>almost</em> matches. On a server this is a denial-of-service vector known as ReDoS. Avoid nesting quantifiers, anchor patterns where possible, and prefer possessive or atomic constructs in engines that support them.</p>
<h2>Where not to use regex</h2>
<p>HTML, JSON, CSV and email addresses all have grammars that regular expressions cannot fully describe. Use a real parser for those. The official email regex from RFC 5322 is over 6,000 characters long — in practice, check for an <code>@</code> with something either side, then send a confirmation message.</p>`,
  faq: [
    { q: 'Which regex flavour does this use?', a: 'JavaScript (ECMAScript), because it runs in your browser. Most syntax is shared with PCRE, Python and Go, but there are differences — JavaScript has no atomic groups or recursion, and its lookbehind support is newer than most.' },
    { q: 'Is my test data sent anywhere?', a: 'No. Matching happens with the browser’s own regex engine, so log excerpts and production data stay on your machine.' },
    { q: 'Why does my pattern hang the page?', a: 'Almost certainly catastrophic backtracking from nested quantifiers such as <code>(\\w+)+</code>. Simplify the pattern or add anchors; the same pattern would hang your server too.' },
    { q: 'How do I match across multiple lines?', a: 'Add the <code>s</code> flag so <code>.</code> matches newlines, or the <code>m</code> flag so <code>^</code> and <code>$</code> anchor to each line rather than the whole string. They solve different problems and can be combined.' },
    { q: 'What is the difference between $1 and $&lt;name&gt; in a replacement?', a: '<code>$1</code> refers to the first capture group by position; <code>$&lt;name&gt;</code> refers to a named group defined with <code>(?&lt;name&gt;...)</code>. Named groups survive reordering of the pattern, which makes them far easier to maintain.' },
  ],
  related: ['text-diff-checker', 'json-formatter', 'case-converter'],
  script: `
const $=s=>document.querySelector(s);
const esc=s=>s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
function syncFlags(){document.querySelectorAll('[data-flag]').forEach(b=>b.checked=$('#flags').value.includes(b.dataset.flag))}
function run(){
  const src=$('#re').value, flags=$('#flags').value, text=$('#text').value;
  $('#err').textContent='';
  let re;
  try{re=new RegExp(src,flags)}
  catch(e){$('#err').textContent='✗ '+e.message;$('#hl').textContent=text;$('#rows').innerHTML='';$('#stat').textContent='';return}
  const global=flags.includes('g');
  let out='',last=0,n=0,rows='';
  const seen=new Set();
  try{
    let m;
    const rx=new RegExp(src,global?flags:flags+'g');
    while((m=rx.exec(text))!==null){
      if(m.index===rx.lastIndex)rx.lastIndex++;
      if(n>=2000)break;
      out+=esc(text.slice(last,m.index))+'<mark>'+esc(m[0]||'')+'</mark>';
      last=m.index+(m[0]||'').length;
      const groups=[];
      for(let i=1;i<m.length;i++)groups.push('<code>'+i+'</code> '+(m[i]===undefined?'<span class="muted">undefined</span>':esc(m[i])));
      if(m.groups)for(const k in m.groups)groups.push('<code>'+esc(k)+'</code> '+(m.groups[k]===undefined?'<span class="muted">undefined</span>':esc(m.groups[k])));
      rows+='<tr><td>'+(n+1)+'</td><td class="out">'+esc(m[0])+'</td><td>'+m.index+'</td><td>'+(groups.join('<br>')||'<span class="muted">—</span>')+'</td></tr>';
      n++;
      if(!global)break;
    }
  }catch(e){$('#err').textContent='✗ '+e.message;return}
  out+=esc(text.slice(last));
  $('#hl').innerHTML=out||'<span class="muted">No text</span>';
  $('#rows').innerHTML=rows||'<tr><td colspan="4" class="muted">No matches.</td></tr>';
  $('#stat').innerHTML=n?('<span class="ok">'+n+' match'+(n===1?'':'es')+'</span>'):'<span class="muted">No matches</span>';
  const rep=$('#rep').value;
  if(rep){try{$('#repout').textContent=text.replace(re,rep)}catch(e){$('#repout').textContent=''}}
  else $('#repout').innerHTML='<span class="muted">Enter a replacement above to preview the result.</span>';
}
['#re','#flags','#text','#rep'].forEach(s=>$(s).addEventListener('input',()=>{if(s==='#flags')syncFlags();run()}));
document.addEventListener('change',e=>{
  const b=e.target.closest('[data-flag]');if(!b)return;
  const f=b.dataset.flag;let v=$('#flags').value.replace(f,'');
  if(b.checked)v+=f;
  $('#flags').value=[...new Set(v)].join('');run();
});
syncFlags();run();
`,
};
