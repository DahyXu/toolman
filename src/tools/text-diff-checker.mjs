export default {
  slug: 'text-diff-checker',
  cat: 'text',
  weight: 9,
  title: 'Text Diff Checker',
  metaTitle: 'Diff Checker — Compare Two Texts Online Free | Toolman',
  short: 'Compare two blocks of text and highlight every added and removed line.',
  desc:
    'Free online diff checker. Paste two texts to see a line-by-line comparison with additions and deletions highlighted, plus word-level differences and an ignore-whitespace option.',
  intro:
    'Paste the original on the left and the changed version on the right. Differences are computed in your browser — nothing is uploaded.',
  body: `<div class="tool">
  <div class="grid2">
    <div><label for="a">Original</label><textarea id="a" spellcheck="false" placeholder="Paste the first version…"></textarea></div>
    <div><label for="b">Changed</label><textarea id="b" spellcheck="false" placeholder="Paste the second version…"></textarea></div>
  </div>
  <div class="row">
    <button class="primary" data-act="diff">Compare</button>
    <label style="margin:0"><input type="checkbox" id="ws" style="width:auto"> ignore whitespace</label>
    <label style="margin:0"><input type="checkbox" id="ci" style="width:auto"> ignore case</label>
    <label style="margin:0"><input type="checkbox" id="words" style="width:auto"> word mode</label>
    <button data-act="swap">Swap</button>
    <button data-act="clear">Clear</button>
    <span id="stat" class="muted"></span>
  </div>
  <div id="out" style="margin-top:14px"></div>
</div>`,
  head: `<style>
.diff{font-family:var(--mono);font-size:.85rem;border:1px solid var(--line);border-radius:10px;overflow:auto;background:var(--bg)}
.diff div{padding:2px 10px;white-space:pre-wrap;word-break:break-word;display:flex;gap:10px}
.diff .n{color:var(--fg2);min-width:3.2em;text-align:right;user-select:none;flex:none;font-size:.78rem}
.diff .add{background:rgba(34,197,94,.14)}
.diff .del{background:rgba(239,68,68,.14)}
.diff .add .n{color:#16a34a}.diff .del .n{color:#dc2626}
.diff ins{background:rgba(34,197,94,.3);text-decoration:none;border-radius:3px}
.diff del{background:rgba(239,68,68,.3);text-decoration:line-through;border-radius:3px}
</style>`,
  about: `<h2>How a diff is computed</h2>
<p>The comparison uses the classic <strong>longest common subsequence</strong> algorithm — the same idea behind <code>git diff</code> and <code>diff -u</code>. It finds the longest sequence of lines that appears in both documents in the same order; everything outside that sequence is reported as an insertion or a deletion. That is why moving a paragraph shows up as a deletion in one place and an addition in another rather than as a "move".</p>
<h2>Line mode vs word mode</h2>
<p>Line mode is right for code, configuration files and structured data, where a line is a meaningful unit. Word mode is better for prose, where a single edited word would otherwise mark the whole paragraph as changed.</p>
<h2>Practical uses</h2>
<ul>
<li>Comparing two versions of a contract, article or email draft.</li>
<li>Checking what changed between two configuration files or API responses.</li>
<li>Reviewing a code snippet before pasting it into a pull request.</li>
<li>Spotting unexpected differences between two CSV exports or log files.</li>
</ul>
<h2>Tip: normalise before comparing</h2>
<p>If two files differ only by indentation, line endings or key ordering, the diff will be full of noise. Turn on "ignore whitespace", or run structured data through the <a href="/json-formatter/">JSON formatter</a> with "sort keys" first — the remaining differences are then the real ones.</p>`,
  faq: [
    { q: 'Is my text uploaded to compare it?', a: 'No. The diff algorithm runs in your browser, so you can safely compare contracts, credentials or proprietary code.' },
    { q: 'How large can the two texts be?', a: 'Comfortably a few thousand lines each. The algorithm is quadratic in the worst case, so very large files with few common lines can take a moment.' },
    { q: 'Why does moved text show as both removed and added?', a: 'A line-based diff preserves order. A block that moved is absent from its old position and present in a new one, so it is reported twice. Dedicated move detection is a separate, much more expensive analysis.' },
    { q: 'Can it compare Word documents or PDFs?', a: 'Not directly — paste the text content instead. Formatting, images and tracked changes are not part of the comparison.' },
    { q: 'What does "ignore whitespace" actually ignore?', a: 'Leading and trailing spaces and runs of internal whitespace are collapsed before comparison, so re-indentation and trailing spaces stop showing as changes.' },
  ],
  related: ['json-formatter', 'word-counter', 'case-converter'],
  script: `
const $=s=>document.querySelector(s);
function norm(l){let x=l;if($('#ws').checked)x=x.trim().replace(/\\s+/g,' ');if($('#ci').checked)x=x.toLowerCase();return x}
function lcs(a,b){
  const n=a.length,m=b.length;
  const M=Array.from({length:n+1},()=>new Uint32Array(m+1));
  for(let i=n-1;i>=0;i--)for(let j=m-1;j>=0;j--)
    M[i][j]=a[i]===b[j]?M[i+1][j+1]+1:Math.max(M[i+1][j],M[i][j+1]);
  const out=[];let i=0,j=0;
  while(i<n&&j<m){
    if(a[i]===b[j]){out.push(['=',i,j]);i++;j++}
    else if(M[i+1][j]>=M[i][j+1]){out.push(['-',i,j]);i++}
    else{out.push(['+',i,j]);j++}
  }
  while(i<n)out.push(['-',i++,j]);
  while(j<m)out.push(['+',i,j++]);
  return out;
}
const esc=s=>s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
function inline(x,y){
  const A=x.split(/(\\s+)/),B=y.split(/(\\s+)/);
  const ops=lcs(A,B);let o='';
  for(const [t,i,j] of ops){
    if(t==='=')o+=esc(A[i]);
    else if(t==='-')o+='<del>'+esc(A[i])+'</del>';
    else o+='<ins>'+esc(B[j])+'</ins>';
  }
  return o;
}
function run(){
  const wordMode=$('#words').checked;
  const A=$('#a').value, B=$('#b').value;
  if(!A&&!B){$('#out').innerHTML='';$('#stat').textContent='';return}
  const a=wordMode?A.split(/(?<=\\s)/):A.split('\\n');
  const b=wordMode?B.split(/(?<=\\s)/):B.split('\\n');
  if(a.length*b.length>4e6){$('#out').innerHTML='<p class="err">Input too large — try comparing smaller sections.</p>';return}
  const ops=lcs(a.map(norm),b.map(norm));
  let add=0,del=0,html='',la=0,lb=0;
  for(let k=0;k<ops.length;k++){
    const [t,i,j]=ops[k];
    if(t==='='){la++;lb++;html+='<div><span class="n">'+la+'</span><span>'+esc(a[i])+'</span></div>'}
    else if(t==='-'){
      const nx=ops[k+1];
      if(nx&&nx[0]==='+'&&!wordMode){
        la++;lb++;del++;add++;
        html+='<div class="del"><span class="n">-'+la+'</span><span>'+inline(a[i],b[nx[2]])+'</span></div>';
        k++;continue;
      }
      la++;del++;html+='<div class="del"><span class="n">-'+la+'</span><span>'+esc(a[i])+'</span></div>'}
    else{lb++;add++;html+='<div class="add"><span class="n">+'+lb+'</span><span>'+esc(b[j])+'</span></div>'}
  }
  $('#out').innerHTML='<div class="diff">'+html+'</div>';
  $('#stat').innerHTML=add||del?('<span class="ok">+'+add+'</span> <span class="err">−'+del+'</span> '+(wordMode?'segments':'lines')+' changed'):'<span class="ok">Identical</span>';
}
document.addEventListener('click',e=>{const b=e.target.closest('[data-act]');if(!b)return;const a=b.dataset.act;
 if(a==='diff')run();
 else if(a==='swap'){const t=$('#a').value;$('#a').value=$('#b').value;$('#b').value=t;run()}
 else{$('#a').value='';$('#b').value='';run()}});
['#ws','#ci','#words'].forEach(s=>$(s).addEventListener('change',run));
['#a','#b'].forEach(s=>$(s).addEventListener('input',()=>{clearTimeout(window._t);window._t=setTimeout(run,250)}));
`,
};
