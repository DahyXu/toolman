export default {
  slug: 'lorem-ipsum-generator',
  cat: 'text',
  weight: 6,
  title: 'Lorem Ipsum Generator',
  metaTitle: 'Lorem Ipsum Generator — Placeholder Text, Any Length | Toolman',
  short: 'Generate classic or modern placeholder text by paragraph, sentence or word.',
  desc:
    'Free lorem ipsum generator. Create placeholder text by paragraphs, sentences, words or characters, in classic Latin or several modern variants, with optional HTML markup.',
  intro: 'Pick how much filler text you need and copy it straight into your mockup.',
  body: `<div class="tool">
  <div class="row">
    <label style="margin:0">Generate <input type="number" id="n" value="4" min="1" max="200" style="width:80px"></label>
    <select id="unit" style="width:auto">
      <option value="p">paragraphs</option><option value="s">sentences</option>
      <option value="w">words</option><option value="l">list items</option>
    </select>
    <select id="style" style="width:auto">
      <option value="lorem">Classic Latin</option>
      <option value="hipster">Hipster</option>
      <option value="tech">Tech jargon</option>
      <option value="pirate">Pirate</option>
    </select>
    <label style="margin:0"><input type="checkbox" id="start" checked style="width:auto"> start with "Lorem ipsum"</label>
    <label style="margin:0"><input type="checkbox" id="html" style="width:auto"> wrap in HTML tags</label>
    <button class="primary" data-act="gen">Generate</button>
    <button data-act="copy">Copy</button>
  </div>
  <textarea id="out" style="min-height:320px" spellcheck="false"></textarea>
  <p id="stat" class="muted"></p>
</div>`,
  about: `<h2>Why placeholder text exists</h2>
<p>Real copy is distracting during layout review — people start editing the words instead of judging the design. Lorem ipsum solves this by looking like prose while carrying no meaning, so attention stays on typography, spacing and hierarchy.</p>
<h2>Where lorem ipsum comes from</h2>
<p>The text is scrambled Latin derived from Cicero's <em>De finibus bonorum et malorum</em>, written in 45 BC. The familiar opening — <em>Lorem ipsum dolor sit amet</em> — is a truncation of <em>dolorem ipsum</em>, "pain itself". It has been the printing industry's standard filler since the 1500s and spread to digital design through Letraset sheets and later desktop publishing software.</p>
<h2>Why Latin works well as filler</h2>
<p>Lorem ipsum has a word-length distribution and letter frequency close enough to English that a paragraph occupies roughly the right amount of space, while being unreadable enough that nobody tries to proofread it. Repeating a single English word would be visually uneven; real English copy would be read rather than looked at.</p>
<h2>When to avoid it</h2>
<ul>
<li><strong>Client presentations.</strong> Non-designers often read Latin as "unfinished" or, worse, ask what it means.</li>
<li><strong>Content-first design.</strong> If the interface must handle a 40-character product name and a 400-character one, filler text hides the problem instead of exposing it.</li>
<li><strong>Anything that might ship.</strong> Lorem ipsum has escaped into production on major sites more than once. Search for it before every release.</li>
<li><strong>Non-Latin scripts.</strong> A Japanese or Arabic interface needs filler in the same script; Latin gives no sense of the real line height or character width.</li>
</ul>`,
  faq: [
    { q: 'Is lorem ipsum real Latin?', a: 'It is derived from real Latin but deliberately scrambled, with words altered and syllables removed, so it does not form meaningful sentences.' },
    { q: 'How many words are in a paragraph?', a: 'This generator produces 40–70 words per paragraph, close to the typical length of a body paragraph in web copy.' },
    { q: 'Does using lorem ipsum hurt SEO?', a: 'Only if it reaches production. A live page full of placeholder text has no useful content to rank and looks broken to visitors, so remove it before publishing.' },
    { q: 'Can I use the generated text commercially?', a: 'Yes. The text is nonsense with no copyright attached, and it is meant to be thrown away before launch.' },
    { q: 'What are the alternatives?', a: 'Themed generators (hipster, pirate, corporate jargon) keep reviewers entertained; more usefully, realistic sample data from your own domain reveals layout problems that uniform filler hides.' },
  ],
  related: ['word-counter', 'case-converter', 'text-diff-checker'],
  script: `
const $=s=>document.querySelector(s);
const SETS={
 lorem:'lorem ipsum dolor sit amet consectetur adipiscing elit sed do eiusmod tempor incididunt ut labore et dolore magna aliqua enim ad minim veniam quis nostrud exercitation ullamco laboris nisi aliquip ex ea commodo consequat duis aute irure in reprehenderit voluptate velit esse cillum eu fugiat nulla pariatur excepteur sint occaecat cupidatat non proident sunt culpa qui officia deserunt mollit anim id est laborum at vero eos accusamus iusto odio dignissimos ducimus blanditiis praesentium voluptatum deleniti atque corrupti quos dolores quas molestias excepturi occaecati cupiditate similique mollitia animi'.split(' '),
 hipster:'artisan cold-pressed kombucha vinyl fixie brunch craft beer selvage denim mustache typewriter chartreuse sriracha kale chips pour-over aesthetic bespoke sustainable locavore banjo lomo pickled vice shoreditch bushwick echo park cardigan flannel tote bag succulent terrarium ethical small batch heirloom microdosing narwhal literally raw denim distillery gastropub food truck taxidermy letterpress'.split(' '),
 tech:'scalable microservice container orchestration kubernetes serverless latency throughput idempotent eventual consistency sharding replication observability telemetry pipeline artifact rollback canary deployment ingress egress middleware namespace cluster autoscaling checkpoint backpressure streaming partition consumer producer schema registry lineage cache invalidation quorum consensus leader election heartbeat circuit breaker retry budget'.split(' '),
 pirate:'ahoy matey avast ye scurvy dog plunder booty doubloon galleon parrot cutlass grog rum barnacle landlubber sail hoist anchor crow nest jolly roger treasure map compass mutiny keelhaul port starboard bilge swashbuckler buccaneer marooned yardarm scallywag hearties shiver timbers walk plank kraken deck cannon'.split(' '),
};
const rnd=n=>Math.floor(Math.random()*n);
function sentence(words,first){
  const len=6+rnd(14);
  let w=[];
  for(let i=0;i<len;i++)w.push(words[rnd(words.length)]);
  if(first)w=['lorem','ipsum','dolor','sit','amet'].concat(w.slice(5));
  let s=w.join(' ');
  // sprinkle commas
  if(len>9){const p=4+rnd(len-7);const a=s.split(' ');a[p]=a[p]+',';s=a.join(' ')}
  return s.charAt(0).toUpperCase()+s.slice(1)+'.';
}
function gen(){
  const n=Math.min(200,Math.max(1,+$('#n').value||1));
  const unit=$('#unit').value, words=SETS[$('#style').value], useHtml=$('#html').checked;
  let out=[],first=$('#start').checked&&$('#style').value==='lorem';
  if(unit==='w'){
    let w=[];for(let i=0;i<n;i++)w.push(words[rnd(words.length)]);
    if(first)w=['lorem','ipsum','dolor','sit','amet'].concat(w.slice(5)).slice(0,n);
    let s=w.join(' ');s=s.charAt(0).toUpperCase()+s.slice(1);
    out=[useHtml?'<p>'+s+'</p>':s];
  } else if(unit==='s'){
    for(let i=0;i<n;i++)out.push(sentence(words,first&&i===0));
    out=[useHtml?'<p>'+out.join(' ')+'</p>':out.join(' ')];
  } else if(unit==='l'){
    for(let i=0;i<n;i++){const s=sentence(words,first&&i===0);out.push(useHtml?'  <li>'+s+'</li>':'• '+s)}
    if(useHtml)out=['<ul>'].concat(out).concat(['</ul>']);
  } else {
    for(let i=0;i<n;i++){
      const k=3+rnd(4);let ss=[];
      for(let j=0;j<k;j++)ss.push(sentence(words,first&&i===0&&j===0));
      const p=ss.join(' ');
      out.push(useHtml?'<p>'+p+'</p>':p);
    }
  }
  const text=out.join(useHtml?'\\n':'\\n\\n');
  $('#out').value=text;
  const wc=(text.replace(/<[^>]+>/g,'').match(/[^\\s]+/g)||[]).length;
  $('#stat').textContent=wc.toLocaleString()+' words · '+text.length.toLocaleString()+' characters';
}
document.addEventListener('click',e=>{const b=e.target.closest('[data-act]');if(!b)return;
 if(b.dataset.act==='gen')gen();
 else{$('#out').select();document.execCommand('copy');b.textContent='Copied!';setTimeout(()=>b.textContent='Copy',1200)}});
['#n','#unit','#style','#start','#html'].forEach(s=>$(s).addEventListener('change',gen));
gen();
`,
};
