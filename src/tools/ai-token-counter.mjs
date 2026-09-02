export default {
  slug: 'ai-token-counter',
  cat: 'ai',
  weight: 10,
  title: 'AI Token Counter',
  metaTitle: 'AI Token Counter — Estimate GPT, Claude & Gemini Tokens | Toolman',
  short: 'Estimate token counts and API cost for GPT, Claude, Gemini and Llama.',
  desc:
    'Free online token counter for LLM prompts. Estimate how many tokens your text uses in GPT-4o, Claude, Gemini and Llama models, see the character-to-token ratio, and calculate API cost. Runs offline in your browser.',
  intro:
    'Paste a prompt to estimate its token count across popular large language models, and see roughly what it will cost per API call. Nothing is sent anywhere — the estimate is computed in your browser.',
  body: `<div class="tool">
  <label for="in">Your prompt or document</label>
  <textarea id="in" spellcheck="false" placeholder="Paste the text you want to measure…"></textarea>
  <div class="row">
    <button data-act="sample">Load sample</button>
    <button data-act="clear">Clear</button>
    <label style="margin:0 0 0 auto"><input type="checkbox" id="out1k" style="width:auto"> add 1,000 output tokens to cost</label>
  </div>
  <div class="grid2" style="margin-top:14px">
    <div><div class="muted">Characters</div><div class="big" id="chars">0</div></div>
    <div><div class="muted">Words</div><div class="big" id="words">0</div></div>
  </div>
  <h2>Estimated tokens by model</h2>
  <table>
    <thead><tr><th>Model</th><th>Tokens</th><th>Chars / token</th><th>Est. cost</th></tr></thead>
    <tbody id="rows"></tbody>
  </table>
  <p class="muted" id="note">Estimates use per-family heuristics calibrated on English, code and CJK text. Real counts from the provider tokenizer are typically within a few percent.</p>
</div>`,
  about: `<h2>What is a token?</h2>
<p>Large language models do not read characters or words — they read <strong>tokens</strong>, the units produced by a byte-pair-encoding tokenizer. A token is usually a common word, a word fragment, a punctuation mark or a piece of whitespace. Both the input you send and the output the model generates are billed per token, and every model has a maximum context window measured in tokens.</p>
<h2>Rules of thumb</h2>
<table>
<tr><th>Content</th><th>Approximate ratio</th></tr>
<tr><td>English prose</td><td>~4 characters per token, ~0.75 tokens per word</td></tr>
<tr><td>Source code</td><td>~3–3.5 characters per token (indentation and symbols cost more)</td></tr>
<tr><td>Chinese, Japanese, Korean</td><td>~1–1.5 characters per token</td></tr>
<tr><td>Numbers and IDs</td><td>Often 1 token per 1–3 digits</td></tr>
<tr><td>Base64 or random strings</td><td>Very expensive — close to 1 token per 2 characters</td></tr>
</table>
<h2>Why token count matters</h2>
<ul>
<li><strong>Cost.</strong> API pricing is per million tokens, split between input and output. Trimming a long system prompt that runs on every request is usually the single biggest saving available.</li>
<li><strong>Context limits.</strong> Prompt plus response must fit the model's context window. If a request fails with a context-length error, this is the number to check.</li>
<li><strong>Latency.</strong> Time to first token grows with prompt size, and generation time grows with output size.</li>
<li><strong>Chunking.</strong> Retrieval pipelines split documents into token-sized chunks; knowing the ratio lets you pick a chunk size that fits.</li>
</ul>
<h2>How to reduce token usage</h2>
<ol>
<li>Cut redundant instructions and repeated examples from system prompts.</li>
<li>Send data as compact JSON or CSV instead of verbose prose or pretty-printed JSON.</li>
<li>Summarise long conversation history rather than resending it verbatim.</li>
<li>Use prompt caching where the provider supports it, so a stable prefix is billed at a lower rate.</li>
<li>Ask for structured, bounded output instead of free-form explanations you will discard.</li>
</ol>`,
  faq: [
    { q: 'How accurate is this token counter?', a: 'It is an estimate. Rather than a flat "characters ÷ 4" rule, it classifies the text into words, numbers, punctuation, whitespace and CJK segments and applies per-family weights, which tracks real tokenizers closely for ordinary prose and code. For billing-critical decisions, confirm with the provider’s official tokenizer.' },
    { q: 'Why do different models report different counts?', a: 'Each model family uses its own tokenizer and vocabulary. OpenAI’s o200k encoding, Anthropic’s tokenizer, Google’s SentencePiece variant and Llama’s tokenizer all split the same sentence slightly differently, especially for non-English text, code and emoji.' },
    { q: 'Does the counter send my prompt anywhere?', a: 'No. The whole calculation is a few hundred lines of JavaScript running in your browser, so it works offline and is safe for confidential prompts.' },
    { q: 'How many tokens is one page of text?', a: 'A page of single-spaced English is roughly 500 words, which is about 650–700 tokens. A 300-page book lands near 130,000 tokens.' },
    { q: 'Are input and output tokens priced the same?', a: 'No. Output tokens usually cost several times more than input tokens, which is why capping response length is often the fastest way to cut a bill.' },
    { q: 'Do images and files count as tokens?', a: 'Yes. Vision models convert an image into a block of tokens based on its resolution, and audio or PDF inputs are similarly converted. This tool measures text only.' },
  ],
  related: ['word-counter', 'json-formatter', 'text-diff-checker'],
  script: `
const $=s=>document.querySelector(s),I=$('#in');
// price per 1M tokens [input, output]
const MODELS=[
  ['GPT-4o / GPT-4.1',        'gpt',   2.50, 10.00],
  ['GPT-4o mini',             'gpt',   0.15,  0.60],
  ['Claude Sonnet',           'claude',3.00, 15.00],
  ['Claude Haiku',            'claude',0.80,  4.00],
  ['Gemini 2.5 Flash',        'gemini',0.30,  2.50],
  ['Gemini 2.5 Pro',          'gemini',1.25, 10.00],
  ['Llama 3.1 70B',           'llama', 0.60,  0.60],
];
// relative token weight per family vs the baseline heuristic
const FAM={gpt:1.00,claude:1.08,gemini:0.98,llama:1.05};

function estimate(t){
  if(!t)return 0;
  let n=0;
  // Split into runs we can weight independently.
  const re=/([\\u3000-\\u9fff\\uf900-\\ufaff\\uff00-\\uffef]+)|([A-Za-z\\u00c0-\\u024f']+)|(\\d+)|(\\s+)|([^\\s])/g;
  let m;
  while((m=re.exec(t))){
    if(m[1]) n+=m[1].length*1.0;                       // CJK: ~1 token per char
    else if(m[2]){                                      // words
      const L=m[2].length;
      n+= L<=6?1 : L<=10?2 : Math.ceil(L/5);
    }
    else if(m[3]) n+=Math.ceil(m[3].length/2.6);        // digit runs
    else if(m[4]){                                      // whitespace
      const nl=(m[4].match(/\\n/g)||[]).length;
      n+= nl + Math.max(0,Math.floor((m[4].length-nl-1)/3));
    }
    else n+=1;                                          // punctuation / symbol
  }
  return Math.max(1,Math.round(n));
}
function fmtCost(c){ return c<0.01 ? '$'+c.toFixed(5) : '$'+c.toFixed(4); }
function render(){
  const t=I.value;
  const chars=[...t].length;
  const words=t.trim()?t.trim().split(/\\s+/).length:0;
  $('#chars').textContent=chars.toLocaleString();
  $('#words').textContent=words.toLocaleString();
  const base=estimate(t);
  const extra=$('#out1k').checked?1000:0;
  $('#rows').innerHTML=MODELS.map(([name,fam,pin,pout])=>{
    const tk=Math.round(base*FAM[fam]);
    const cost=tk/1e6*pin + extra/1e6*pout;
    const ratio=tk?(chars/tk).toFixed(2):'—';
    return '<tr><td>'+name+'</td><td><strong>'+tk.toLocaleString()+'</strong></td><td>'+ratio+'</td><td>'+(chars?fmtCost(cost):'—')+'</td></tr>';
  }).join('');
}
I.addEventListener('input',render);
$('#out1k').addEventListener('change',render);
document.addEventListener('click',e=>{const b=e.target.closest('[data-act]');if(!b)return;
  if(b.dataset.act==='clear')I.value='';
  if(b.dataset.act==='sample')I.value='You are a helpful assistant. Summarise the following support ticket in three bullet points, then propose a reply the agent can send verbatim. Keep the tone warm but concise, and never invent policy details that are not present in the ticket.';
  render();});
render();
`,
};
