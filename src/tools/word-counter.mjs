export default {
  slug: 'word-counter',
  cat: 'text',
  weight: 9,
  title: 'Word & Character Counter',
  metaTitle: 'Word Counter — Count Words, Characters & Reading Time | Toolman',
  short: 'Live word, character, sentence and reading-time counts as you type.',
  desc:
    'Free online word counter. Count words, characters with and without spaces, sentences, paragraphs and reading time in real time, plus keyword density. Works offline in your browser.',
  intro:
    'Type or paste text to see live counts. Useful for essays, meta descriptions, tweets and anything with a length limit.',
  body: `<div class="tool">
  <label for="in">Your text</label>
  <textarea id="in" style="min-height:220px" placeholder="Start typing or paste your text here…"></textarea>
  <div class="row"><button data-act="clear">Clear</button><button data-act="copy">Copy text</button>
  <label style="margin:0"><input type="checkbox" id="nospace" style="width:auto"> exclude spaces from character count</label></div>
  <div class="grid2" style="margin-top:10px">
    <div><div class="muted">Words</div><div class="big" id="w">0</div></div>
    <div><div class="muted">Characters</div><div class="big" id="c">0</div></div>
    <div><div class="muted">Sentences</div><div class="big" id="s">0</div></div>
    <div><div class="muted">Paragraphs</div><div class="big" id="p">0</div></div>
  </div>
  <table style="margin-top:16px"><tbody id="more"></tbody></table>
  <h2>Length limits</h2>
  <table><tbody id="limits"></tbody></table>
  <h2>Top keywords</h2>
  <table><thead><tr><th>Word</th><th>Count</th><th>Density</th></tr></thead><tbody id="kw"></tbody></table>
</div>`,
  about: `<h2>How words are counted</h2>
<p>A word here is any run of characters separated by whitespace, which matches how word processors and most editors count. Hyphenated compounds such as <em>state-of-the-art</em> count as one word; an em dash between words does not join them. Numbers and standalone symbols count as words when they are surrounded by spaces.</p>
<h2>Reading and speaking time</h2>
<p>Reading time assumes 238 words per minute, the average for adult silent reading of general non-fiction. Speaking time uses 130 words per minute, a comfortable presentation pace. Both are estimates — technical material reads slower, and a rehearsed speaker may run faster.</p>
<h2>Common length limits</h2>
<table>
<tr><th>Where</th><th>Limit</th></tr>
<tr><td>Google title tag</td><td>~60 characters before truncation</td></tr>
<tr><td>Google meta description</td><td>~155 characters</td></tr>
<tr><td>X / Twitter post</td><td>280 characters</td></tr>
<tr><td>SMS (single message)</td><td>160 characters</td></tr>
<tr><td>Instagram caption</td><td>2,200 characters</td></tr>
<tr><td>LinkedIn post</td><td>3,000 characters</td></tr>
<tr><td>Common essay assignment</td><td>500–2,000 words</td></tr>
</table>
<h2>Keyword density</h2>
<p>Density is a keyword's share of total words. There is no magic number that ranks a page — modern search engines evaluate meaning, not repetition — but the table is a useful sanity check. If one term sits far above the rest, the text probably reads as repetitive to a human too.</p>`,
  faq: [
    { q: 'How many pages is 1,000 words?', a: 'About four pages double-spaced or two pages single-spaced in 12&nbsp;pt Times New Roman with one-inch margins.' },
    { q: 'How long does it take to read 1,000 words?', a: 'Roughly four minutes of silent reading, or about eight minutes read aloud at a presentation pace.' },
    { q: 'Are spaces counted as characters?', a: 'Both figures are shown. The "characters" tile includes spaces by default; tick the checkbox to exclude them, which is the number most social platforms and form limits use.' },
    { q: 'Does it count emoji correctly?', a: 'Yes. Counting iterates over Unicode code points rather than UTF-16 units, so an emoji or a Chinese character counts as one character instead of two.' },
    { q: 'Is my text sent anywhere?', a: 'No. Everything is counted by JavaScript in your browser, so drafts and confidential documents stay on your machine.' },
  ],
  related: ['case-converter', 'text-diff-checker', 'ai-token-counter'],
  script: `
const $=s=>document.querySelector(s),I=$('#in');
const STOP=new Set('the a an and or but of to in for on at by with is are was were be been it its this that as from not you your we they he she i do does can will would should have has had if then than so such about into over after before more most other some any all no'.split(' '));
function render(){
  const t=I.value;
  const chars=[...t].length, noSp=[...t.replace(/\\s/g,'')].length;
  const words=(t.match(/[^\\s]+/g)||[]).length;
  const sentences=(t.match(/[^.!?…]+[.!?…]+(\\s|$)/g)||[]).length || (t.trim()?1:0);
  const paras=t.trim()?t.trim().split(/\\n\\s*\\n/).length:0;
  const lines=t?t.split('\\n').length:0;
  const useNoSp=$('#nospace').checked;
  $('#w').textContent=words.toLocaleString();
  $('#c').textContent=(useNoSp?noSp:chars).toLocaleString();
  $('#s').textContent=sentences.toLocaleString();
  $('#p').textContent=paras.toLocaleString();
  const mins=w=>{const m=w/238;return m<1?Math.max(1,Math.round(m*60))+' sec':m.toFixed(1)+' min'};
  const spk=w=>{const m=w/130;return m<1?Math.max(1,Math.round(m*60))+' sec':m.toFixed(1)+' min'};
  const avgW=words?(noSp/words).toFixed(1):'0';
  $('#more').innerHTML=[
    ['Characters (with spaces)',chars.toLocaleString()],
    ['Characters (no spaces)',noSp.toLocaleString()],
    ['Lines',lines.toLocaleString()],
    ['Unique words',new Set((t.toLowerCase().match(/[a-z0-9']+/g)||[])).size.toLocaleString()],
    ['Average word length',avgW+' characters'],
    ['Reading time',mins(words)],
    ['Speaking time',spk(words)],
  ].map(r=>'<tr><td>'+r[0]+'</td><td><strong>'+r[1]+'</strong></td></tr>').join('');
  const LIM=[['Google title',60],['Google meta description',155],['X / Twitter post',280],['SMS',160],['Meta title (og:title)',95]];
  $('#limits').innerHTML=LIM.map(([n,l])=>{
    const left=l-chars;
    return '<tr><td>'+n+'</td><td class="'+(left<0?'err':'ok')+'">'+(left<0?Math.abs(left)+' over':left+' left')+' <span class="muted">/ '+l+'</span></td></tr>'}).join('');
  const ws=(t.toLowerCase().match(/[a-z][a-z']{2,}/g)||[]).filter(w=>!STOP.has(w));
  const m={};for(const w of ws)m[w]=(m[w]||0)+1;
  const top=Object.entries(m).sort((a,b)=>b[1]-a[1]).slice(0,10);
  $('#kw').innerHTML=top.length?top.map(([w,c])=>'<tr><td>'+w+'</td><td>'+c+'</td><td>'+(c/words*100).toFixed(1)+'%</td></tr>').join('')
    :'<tr><td colspan="3" class="muted">Enter some text to see keyword frequency.</td></tr>';
}
I.addEventListener('input',render);
$('#nospace').addEventListener('change',render);
document.addEventListener('click',e=>{const b=e.target.closest('[data-act]');if(!b)return;
  if(b.dataset.act==='clear'){I.value='';render()}else{I.select();document.execCommand('copy')}});
render();
`,
};
