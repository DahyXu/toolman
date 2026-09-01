export default {
  slug: 'password-generator',
  cat: 'dev',
  weight: 9,
  title: 'Password Generator',
  metaTitle: 'Strong Password Generator — 8 to 64 Characters | Toolman',
  short: 'Generate strong random passwords and passphrases with an entropy readout.',
  desc:
    'Free online strong password generator. Create random passwords of any length with symbols, numbers and unambiguous characters, or memorable passphrases — with a live entropy and crack-time estimate. Generated in your browser.',
  intro:
    'Generate strong passwords locally in your browser. Nothing is transmitted, logged or stored, so the password you see is yours alone.',
  body: `<div class="tool">
  <div class="big copy" id="pw" style="padding:16px;background:var(--bg);border:1px solid var(--line);border-radius:10px;min-height:60px">…</div>
  <div class="row">
    <button class="primary" data-act="gen">Regenerate</button>
    <button data-act="copy">Copy</button>
    <span id="strength" class="muted"></span>
  </div>
  <div class="row">
    <label style="margin:0;flex:1">Length: <output id="lenOut">16</output>
      <input type="range" id="len" min="4" max="64" value="16" style="width:100%">
    </label>
  </div>
  <div class="row">
    <label style="margin:0"><input type="checkbox" id="lower" checked style="width:auto"> a-z</label>
    <label style="margin:0"><input type="checkbox" id="upper" checked style="width:auto"> A-Z</label>
    <label style="margin:0"><input type="checkbox" id="num" checked style="width:auto"> 0-9</label>
    <label style="margin:0"><input type="checkbox" id="sym" checked style="width:auto"> !@#$%</label>
    <label style="margin:0"><input type="checkbox" id="amb" style="width:auto"> exclude look-alikes (0O1lI)</label>
  </div>
  <hr style="margin:20px 0">
  <h2>Passphrase</h2>
  <div class="row">
    <label style="margin:0">Words <input type="number" id="words" value="5" min="3" max="12" style="width:80px"></label>
    <label style="margin:0">Separator <input type="text" id="sep" value="-" maxlength="3" style="width:70px"></label>
    <label style="margin:0"><input type="checkbox" id="cap" checked style="width:auto"> Capitalise</label>
    <label style="margin:0"><input type="checkbox" id="pnum" checked style="width:auto"> Add number</label>
    <button data-act="phrase">Generate passphrase</button>
  </div>
  <div class="big" id="phrase" style="margin-top:10px"></div>
  <p class="muted" id="pstrength"></p>
</div>`,
  about: `<h2>What actually makes a password strong</h2>
<p>Strength is measured in <strong>entropy</strong> — the number of equally likely possibilities an attacker must search. It is <code>length × log₂(alphabet size)</code>. Length dominates: adding one character to a 62-symbol alphabet multiplies the search space by 62, while adding symbols to a fixed-length password barely moves the needle.</p>
<table>
<tr><th>Entropy</th><th>Verdict</th></tr>
<tr><td>&lt; 40 bits</td><td>Weak — crackable in minutes by a modern GPU rig</td></tr>
<tr><td>40–60 bits</td><td>Fair — acceptable only with rate limiting behind it</td></tr>
<tr><td>60–80 bits</td><td>Strong — suitable for most online accounts</td></tr>
<tr><td>80+ bits</td><td>Very strong — appropriate for password managers, encryption keys and admin accounts</td></tr>
</table>
<h2>Passwords vs passphrases</h2>
<p>A random 16-character password from a 94-symbol alphabet carries about 104 bits of entropy but is impossible to remember. A five-word passphrase drawn from a 2,000-word list carries about 55 bits and you can memorise it in a minute. Use a passphrase for the handful of secrets you must type from memory — your device login and your password manager's master password — and let the manager generate long random strings for everything else.</p>
<h2>Rules that no longer apply</h2>
<p>Current NIST guidance drops the old advice to force mixed character classes and rotate passwords every 90 days. Both push people toward predictable patterns such as <code>Summer2024!</code>. What matters instead: reasonable length, no reuse across sites, screening against known breached passwords, and multi-factor authentication.</p>
<h2>Practical checklist</h2>
<ul>
<li>Use a unique password for every account — reuse is what turns one breach into ten.</li>
<li>Store them in a password manager rather than a notes app or spreadsheet.</li>
<li>Turn on multi-factor authentication wherever it is offered; it defeats most credential-stuffing attacks outright.</li>
<li>Never send a password over email or chat. If you must share one, use a one-time secret link.</li>
</ul>`,
  faq: [
    { q: 'Is it safe to generate a password on a website?', a: 'On this one, yes — the generator runs entirely in your browser using <code>crypto.getRandomValues()</code>, and the page has no backend to send anything to. You can verify by loading the page, disconnecting from the network, and generating passwords offline.' },
    { q: 'How long should a password be?', a: 'Sixteen random characters is a good default for online accounts. Go to 20 or more for password-manager master passwords, encryption keys and anything protecting other credentials.' },
    { q: 'Should I include symbols?', a: 'They help, but far less than length. A 20-character letters-and-digits password is stronger than a 12-character one with symbols, and it avoids sites that quietly reject certain punctuation.' },
    { q: 'What does "exclude look-alikes" do?', a: 'It removes characters that are easy to confuse when read aloud or transcribed — <code>0</code>/<code>O</code> and <code>1</code>/<code>l</code>/<code>I</code>. Useful for passwords you will type by hand or dictate; it slightly reduces entropy per character.' },
    { q: 'Do I still need to change passwords regularly?', a: 'Only when there is a reason — a breach notification, a shared password, or a suspicion of compromise. Scheduled rotation without cause mostly produces weaker, more predictable passwords.' },
  ],
  related: ['uuid-generator', 'hash-generator', 'base64-encode-decode'],
  script: `
const $=s=>document.querySelector(s);
const WORDS='able acid also arch bank beam bell bird blue boat bold bone book born bulk calm card cave city clay clip cold cord corn crop cube dawn deep desk dice dish dome door dove draw drum dusk earn edge exit face fair farm fern find fire fish flag flow foam fold fork fuel gate gear gift glow goat gold grid grow gulf hall hawk heat herb hill hold hope horn hunt iron jade jump keen kind king lace lake lamp land lark leaf leap lens lift lime line lion loop luck lung mail mark mask maze mesh mild mint mist moon moss myth nest node norm oath oval palm park path peak pear pine plum pond pool port pure quiz raft rail rain reed reef rice ride ring road rock root rose ruby rush sail salt sand seed ship silk snow soil song star stem step stone surf swan tale tide tile time tone tree tribe tune vase veil vine void wave wing wolf wood wool yard yarn zinc zone'.split(' ');
const rnd=n=>{const a=new Uint32Array(1);let x;do{crypto.getRandomValues(a);x=a[0]}while(x>=Math.floor(4294967296/n)*n);return x%n};
function crackTime(bits){
  const guesses=Math.pow(2,bits-1)/1e11; // 100B guesses/sec offline
  const U=[[3.15e9,'billion years'],[3.15e6,'million years'],[31536000,'years'],[86400,'days'],[3600,'hours'],[60,'minutes'],[1,'seconds']];
  if(guesses>3.15e12)return 'longer than the age of the universe';
  for(const [s,n] of U){ if(guesses>=s){const v=guesses/s;return (v>=100?Math.round(v):v.toFixed(1))+' '+n} }
  return 'instantly';
}
function gen(){
  let set='';
  if($('#lower').checked)set+='abcdefghijklmnopqrstuvwxyz';
  if($('#upper').checked)set+='ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  if($('#num').checked)set+='0123456789';
  if($('#sym').checked)set+='!@#$%^&*()-_=+[]{};:,.?/';
  if($('#amb').checked)set=set.replace(/[0O1lI]/g,'');
  if(!set){$('#pw').textContent='Select at least one character set';$('#strength').textContent='';return}
  const len=+$('#len').value;
  let p='';for(let i=0;i<len;i++)p+=set[rnd(set.length)];
  $('#pw').textContent=p;
  const bits=Math.round(len*Math.log2(set.length));
  const label=bits<40?'Weak':bits<60?'Fair':bits<80?'Strong':'Very strong';
  $('#strength').innerHTML='<strong>'+label+'</strong> · '+bits+' bits of entropy · offline crack time ≈ '+crackTime(bits);
  $('#strength').className=bits<40?'err':bits<60?'muted':'ok';
}
function phrase(){
  const n=Math.min(12,Math.max(3,+$('#words').value||5)),sep=$('#sep').value;
  let w=[];for(let i=0;i<n;i++){let x=WORDS[rnd(WORDS.length)];if($('#cap').checked)x=x[0].toUpperCase()+x.slice(1);w.push(x)}
  let p=w.join(sep);
  if($('#pnum').checked)p+=sep+rnd(100);
  $('#phrase').textContent=p;
  const bits=Math.round(n*Math.log2(WORDS.length)+($('#pnum').checked?6.6:0));
  $('#pstrength').textContent=bits+' bits of entropy · offline crack time ≈ '+crackTime(bits);
}
$('#len').addEventListener('input',()=>{$('#lenOut').textContent=$('#len').value;gen()});
['#lower','#upper','#num','#sym','#amb'].forEach(s=>$(s).addEventListener('change',gen));
document.addEventListener('click',e=>{const b=e.target.closest('[data-act]');if(!b)return;
  const a=b.dataset.act;
  if(a==='gen')gen(); else if(a==='phrase')phrase();
  else if(a==='copy'){navigator.clipboard&&navigator.clipboard.writeText($('#pw').textContent);b.textContent='Copied!';setTimeout(()=>b.textContent='Copy',1200)}});
gen();phrase();
`,
};
