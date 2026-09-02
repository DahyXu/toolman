export default {
  slug: 'markdown-to-html',
  cat: 'text',
  weight: 7,
  title: 'Markdown to HTML Converter',
  metaTitle: 'Markdown to HTML Converter & Live Preview | Toolman',
  short: 'Convert Markdown to clean HTML with a live side-by-side preview.',
  desc:
    'Free online Markdown to HTML converter with live preview. Supports headings, lists, tables, code blocks, links, images, blockquotes and task lists. Runs entirely in your browser.',
  intro: 'Write or paste Markdown on the left to get clean HTML and a rendered preview.',
  body: `<div class="tool">
  <div class="row">
    <button data-tab="preview" class="primary">Preview</button>
    <button data-tab="html">HTML source</button>
    <button data-act="copy">Copy HTML</button>
    <button data-act="sample">Sample</button>
    <button data-act="clear">Clear</button>
  </div>
  <div class="grid2">
    <div><label for="in">Markdown</label><textarea id="in" spellcheck="false" style="min-height:420px"></textarea></div>
    <div><label>Output</label>
      <div id="preview" class="md" style="border:1px solid var(--line);border-radius:10px;padding:14px;min-height:420px;overflow:auto;background:var(--bg)"></div>
      <textarea id="html" aria-label="Generated HTML" spellcheck="false" readonly style="min-height:420px;display:none"></textarea>
    </div>
  </div>
</div>`,
  head: `<style>.md h1{font-size:1.5rem;margin:.6em 0 .3em}.md h2{font-size:1.25rem;margin:1em 0 .3em}
.md h3{font-size:1.05rem}.md p{margin:.6em 0}.md ul,.md ol{padding-left:1.4em}
.md blockquote{border-left:3px solid var(--acc);margin:.8em 0;padding:.1em 0 .1em 1em;color:var(--fg2)}
.md img{max-width:100%;border-radius:8px}.md table{font-size:.9rem}
.md hr{margin:1.4em 0}.md pre{margin:.8em 0}</style>`,
  about: `<h2>Markdown syntax reference</h2>
<table>
<tr><th>Markdown</th><th>Result</th></tr>
<tr><td><code># Heading</code></td><td>Level 1 heading (up to <code>######</code> for level 6)</td></tr>
<tr><td><code>**bold**</code> <code>*italic*</code></td><td><strong>bold</strong>, <em>italic</em></td></tr>
<tr><td><code>~~strike~~</code></td><td>Strikethrough</td></tr>
<tr><td><code>[text](url)</code></td><td>A link</td></tr>
<tr><td><code>![alt](url)</code></td><td>An image</td></tr>
<tr><td><code>- item</code> / <code>1. item</code></td><td>Unordered and ordered lists</td></tr>
<tr><td><code>- [ ] task</code></td><td>A task-list checkbox</td></tr>
<tr><td><code>&gt; quote</code></td><td>Blockquote</td></tr>
<tr><td><code>\`code\`</code></td><td>Inline code</td></tr>
<tr><td>Three backticks</td><td>A fenced code block</td></tr>
<tr><td><code>---</code></td><td>Horizontal rule</td></tr>
<tr><td><code>| a | b |</code></td><td>A table, with <code>|---|---|</code> on the second line</td></tr>
</table>
<h2>Why Markdown won</h2>
<p>Markdown is readable as plain text, diffs cleanly in version control, and takes minutes to learn. That combination made it the default for READMEs, documentation sites, static blogs, issue trackers and chat apps. Unlike a word processor format, a Markdown file is still perfectly usable if every tool that reads it disappears.</p>
<h2>Flavours</h2>
<table>
<tr><th>Flavour</th><th>Adds</th></tr>
<tr><td>CommonMark</td><td>A precise specification that resolved years of ambiguity in the original 2004 syntax</td></tr>
<tr><td>GitHub Flavored Markdown</td><td>Tables, task lists, strikethrough, autolinks, fenced code with language hints</td></tr>
<tr><td>MDX</td><td>JSX components embedded inside Markdown, used by many documentation frameworks</td></tr>
<tr><td>Obsidian / wiki style</td><td><code>[[wikilinks]]</code>, callouts, embedded notes</td></tr>
</table>
<p>This converter targets the common core plus the most-used GitHub extensions: tables, task lists and strikethrough.</p>
<h2>Security note</h2>
<p>Markdown allows raw HTML by design. If you render user-submitted Markdown on a live site, sanitise the output — a converter alone is not an XSS defence. This page escapes raw HTML rather than passing it through, which is the safe default for a preview tool.</p>`,
  faq: [
    { q: 'Does it support tables and task lists?', a: 'Yes — GitHub-style pipe tables, <code>- [ ]</code> task lists and <code>~~strikethrough~~</code> are all supported, along with the CommonMark core.' },
    { q: 'Is my document uploaded?', a: 'No. The parser is a few hundred lines of JavaScript running in your browser, so drafts and internal documentation stay on your machine.' },
    { q: 'Can I convert HTML back to Markdown?', a: 'Not with this tool. The reverse direction is lossy because HTML can express structures Markdown has no syntax for; dedicated libraries such as Turndown handle the common cases.' },
    { q: 'Why is my raw HTML showing as text?', a: 'Raw HTML is escaped rather than rendered, deliberately, so that pasting untrusted Markdown cannot execute scripts in your browser.' },
    { q: 'How do I get a PDF from Markdown?', a: 'Convert to HTML here, open the preview and use your browser’s print dialog with "Save as PDF". The rendered output uses this page’s typography.' },
  ],
  related: ['word-counter', 'case-converter', 'text-diff-checker'],
  script: `
const $=s=>document.querySelector(s);
const esc=s=>s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
function inline(s){
  s=esc(s);
  s=s.replace(/\`([^\`]+)\`/g,(m,c)=>'<code>'+c+'</code>');
  // A URL may contain one level of balanced parentheses — Wikipedia titles do
  // this constantly — so stopping at the first ")" truncates real links.
  var URLPAT=/((?:[^()\\s]|\\([^()\\s]*\\))+)/.source;
  // The generated tags are parked here so the emphasis rules below cannot reach
  // inside an href and turn its underscores into <em>.
  var held=[];
  var hold=function(html){held.push(html);return '\\u0000'+(held.length-1)+'\\u0000'};
  // Only schemes that cannot execute. Anything else keeps the text and drops
  // the link, which is safer than emitting an href nobody should paste.
  var safeUrl=function(u){
    var t=u.trim().replace(/&amp;/g,'&');
    return /^(https?:|mailto:|tel:|ftp:|#|\\/|\\.)/i.test(t) ? t : null;
  };
  s=s.replace(new RegExp('!\\\\[([^\\\\]]*)\\\\]\\\\('+URLPAT+'(?:\\\\s+"[^"]*")?\\\\)','g'),function(m,alt,u){
    var safe=safeUrl(u); return safe? hold('<img src="'+safe+'" alt="'+alt+'">') : alt;
  });
  s=s.replace(new RegExp('\\\\[([^\\\\]]+)\\\\]\\\\('+URLPAT+'(?:\\\\s+"[^"]*")?\\\\)','g'),function(m,text,u){
    var safe=safeUrl(u); return safe? hold('<a href="'+safe+'" rel="nofollow noopener">'+text+'</a>') : text;
  });
  s=s.replace(/(^|[^*])\\*\\*([^*]+)\\*\\*/g,'$1<strong>$2</strong>');
  s=s.replace(/(^|[^_])__([^_]+)__/g,'$1<strong>$2</strong>');
  s=s.replace(/(^|[^*])\\*([^*\\n]+)\\*/g,'$1<em>$2</em>');
  s=s.replace(/(^|[^_])_([^_\\n]+)_/g,'$1<em>$2</em>');
  s=s.replace(/~~([^~]+)~~/g,'<del>$1</del>');
  s=s.replace(/  $/,'<br>');
  s=s.replace(/\\u0000(\\d+)\\u0000/g,function(m,i){return held[+i]});
  return s;
}
function md(src){
  const lines=src.replace(/\\r\\n/g,'\\n').split('\\n');
  let out=[],i=0;
  const closeList=st=>{while(st.length)out.push('</'+st.pop()+'>')};
  let stack=[];
  while(i<lines.length){
    let l=lines[i];
    // fenced code
    const fence=/^\`\`\`\\s*([\\w-]*)/.exec(l);
    if(fence){
      closeList(stack);
      let code=[];i++;
      while(i<lines.length&&!/^\`\`\`/.test(lines[i]))code.push(lines[i++]);
      i++;
      out.push('<pre><code'+(fence[1]?' class="language-'+esc(fence[1])+'"':'')+'>'+esc(code.join('\\n'))+'</code></pre>');
      continue;
    }
    // table
    if(/^\\s*\\|.*\\|\\s*$/.test(l)&&i+1<lines.length&&/^\\s*\\|[\\s:|-]+\\|\\s*$/.test(lines[i+1])){
      closeList(stack);
      const cells=r=>r.trim().replace(/^\\||\\|$/g,'').split('|').map(c=>c.trim());
      const head=cells(l);i+=2;
      let body=[];
      while(i<lines.length&&/^\\s*\\|.*\\|\\s*$/.test(lines[i]))body.push(cells(lines[i++]));
      out.push('<table><thead><tr>'+head.map(h=>'<th>'+inline(h)+'</th>').join('')+'</tr></thead><tbody>'+
        body.map(r=>'<tr>'+r.map(c=>'<td>'+inline(c)+'</td>').join('')+'</tr>').join('')+'</tbody></table>');
      continue;
    }
    // heading
    let m=/^(#{1,6})\\s+(.*)$/.exec(l);
    if(m){closeList(stack);out.push('<h'+m[1].length+'>'+inline(m[2].replace(/\\s+#+\\s*$/,''))+'</h'+m[1].length+'>');i++;continue}
    // hr
    if(/^\\s*([-*_])(\\s*\\1){2,}\\s*$/.test(l)){closeList(stack);out.push('<hr>');i++;continue}
    // blockquote
    if(/^\\s*>/.test(l)){
      closeList(stack);
      let q=[];
      while(i<lines.length&&/^\\s*>/.test(lines[i]))q.push(lines[i++].replace(/^\\s*>\\s?/,''));
      out.push('<blockquote>'+md(q.join('\\n'))+'</blockquote>');
      continue;
    }
    // list
    m=/^(\\s*)([-*+]|\\d+[.)])\\s+(.*)$/.exec(l);
    if(m){
      const ordered=/\\d/.test(m[2]);
      const tag=ordered?'ol':'ul';
      if(!stack.length||stack[stack.length-1]!==tag){closeList(stack);out.push('<'+tag+'>');stack.push(tag)}
      let item=m[3];
      const task=/^\\[([ xX])\\]\\s+(.*)$/.exec(item);
      if(task)out.push('<li><input type="checkbox" disabled'+(task[1]!==' '?' checked':'')+' style="width:auto"> '+inline(task[2])+'</li>');
      else out.push('<li>'+inline(item)+'</li>');
      i++;continue;
    }
    // blank
    if(!l.trim()){closeList(stack);i++;continue}
    // paragraph
    closeList(stack);
    let p=[l];i++;
    while(i<lines.length&&lines[i].trim()&&!/^(\\s*[-*+]\\s|\\s*\\d+[.)]\\s|#{1,6}\\s|\\s*>|\`\`\`|\\s*\\|)/.test(lines[i]))p.push(lines[i++]);
    out.push('<p>'+inline(p.join('\\n'))+'</p>');
  }
  closeList(stack);
  return out.join('\\n');
}
function run(){
  const html=md($('#in').value);
  $('#html').value=html;
  $('#preview').innerHTML=html||'<span class="muted">Preview appears here.</span>';
}
$('#in').addEventListener('input',run);
document.addEventListener('click',e=>{
  const t=e.target.closest('[data-tab]');
  if(t){
    document.querySelectorAll('[data-tab]').forEach(b=>b.className='');
    t.className='primary';
    const html=t.dataset.tab==='html';
    $('#html').style.display=html?'block':'none';
    $('#preview').style.display=html?'none':'block';
    return;
  }
  const b=e.target.closest('[data-act]');if(!b)return;
  const a=b.dataset.act;
  if(a==='copy'){$('#html').style.display='block';$('#html').select();document.execCommand('copy');
    if(document.querySelector('[data-tab=preview]').className==='primary')$('#html').style.display='none';
    b.textContent='Copied!';setTimeout(()=>b.textContent='Copy HTML',1200)}
  else if(a==='clear'){$('#in').value='';run()}
  else{$('#in').value=\`# Toolman

A **fast**, *private* set of tools that run entirely in your browser.

## Why it exists

> Your data should not need to travel to a server to be reformatted.

- No uploads
- No sign-up
- No tracking
- [x] Works offline
- [ ] World domination

## Supported formats

| Input | Output | Lossless |
|-------|--------|----------|
| JSON  | CSV    | Yes      |
| PNG   | WebP   | No       |

## Example

\\\`\\\`\\\`js
const tokens = estimate(prompt);
console.log(\\\`about \\\${tokens} tokens\\\`);
\\\`\\\`\\\`

See the [tool list](/tools/) for everything else.

---

*Built in public.*\`;run()}
});
run();
`,
};
