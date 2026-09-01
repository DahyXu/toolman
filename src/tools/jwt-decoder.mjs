export default {
  slug: 'jwt-decoder',
  cat: 'dev',
  weight: 8,
  title: 'JWT Decoder',
  metaTitle: 'JWT Decoder — Decode JSON Web Tokens Online | Toolman',
  short: 'Decode a JWT header and payload, and check its expiry — offline.',
  desc:
    'Free online JWT decoder. Paste a JSON Web Token to read its header and payload, see the algorithm, and check the issued-at and expiry timestamps. Decoding happens in your browser — the token is never transmitted.',
  intro:
    'Paste a JWT to inspect it. Tokens are decoded locally in your browser, so you can safely paste a real access token.',
  body: `<div class="tool">
  <label for="in">JSON Web Token</label>
  <textarea id="in" spellcheck="false" style="min-height:110px" placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.signature"></textarea>
  <div class="row"><button data-act="sample">Load sample</button><button data-act="clear">Clear</button><span id="err" class="err"></span></div>
  <div id="parts"></div>
  <div class="grid2">
    <div><h2>Header</h2><pre><code id="head" class="out">—</code></pre></div>
    <div><h2>Payload</h2><pre><code id="body" class="out">—</code></pre></div>
  </div>
  <h2>Claims</h2>
  <table><tbody id="claims"><tr><td colspan="2" class="muted">Paste a token above.</td></tr></tbody></table>
  <h2>Signature</h2>
  <p class="out" id="sig" style="word-break:break-all">—</p>
  <p class="muted">This tool decodes only. Verifying a signature requires the secret or public key, which should never be pasted into a web page.</p>
</div>`,
  about: `<h2>What a JWT actually is</h2>
<p>A JSON Web Token is three Base64url-encoded parts joined by dots: <code>header.payload.signature</code>. The header names the signing algorithm, the payload carries the claims, and the signature proves the first two parts have not been altered by anyone without the key.</p>
<p><strong>The payload is not encrypted.</strong> Anyone holding the token can read every claim in it — exactly what this page does. Never put a password, a card number or anything else sensitive in a JWT.</p>
<h2>Standard claims</h2>
<table>
<tr><th>Claim</th><th>Meaning</th></tr>
<tr><td><code>iss</code></td><td>Issuer — who created the token</td></tr>
<tr><td><code>sub</code></td><td>Subject — usually the user ID</td></tr>
<tr><td><code>aud</code></td><td>Audience — who the token is intended for</td></tr>
<tr><td><code>exp</code></td><td>Expiry time, as a Unix timestamp in seconds</td></tr>
<tr><td><code>nbf</code></td><td>Not valid before this time</td></tr>
<tr><td><code>iat</code></td><td>Issued at</td></tr>
<tr><td><code>jti</code></td><td>Unique token ID, used for revocation lists</td></tr>
</table>
<h2>Algorithms</h2>
<table>
<tr><th>Family</th><th>Example</th><th>Key model</th></tr>
<tr><td>HMAC</td><td>HS256</td><td>One shared secret signs and verifies. Simple, but every verifier can also mint tokens.</td></tr>
<tr><td>RSA</td><td>RS256</td><td>Private key signs, public key verifies. The right choice when third parties must verify.</td></tr>
<tr><td>ECDSA</td><td>ES256</td><td>Same asymmetric model as RSA with much smaller keys and signatures.</td></tr>
<tr><td>EdDSA</td><td>Ed25519</td><td>Modern, fast, and hard to implement incorrectly.</td></tr>
</table>
<h2>Security pitfalls</h2>
<ul>
<li><strong>The <code>alg: none</code> attack.</strong> Some old libraries accepted a token with the algorithm set to <code>none</code> and no signature. Always pin the expected algorithm on the verification side rather than trusting the header.</li>
<li><strong>Algorithm confusion.</strong> If a verifier accepts both HS256 and RS256, an attacker can sign a token with the public key as an HMAC secret. Again: pin the algorithm.</li>
<li><strong>No revocation.</strong> A signed token stays valid until it expires. Keep access tokens short-lived (minutes) and use refresh tokens you can revoke server-side.</li>
<li><strong>Storage.</strong> A JWT in <code>localStorage</code> is readable by any injected script. An <code>HttpOnly</code>, <code>Secure</code>, <code>SameSite</code> cookie is safer for browser sessions.</li>
<li><strong>Clock skew.</strong> Allow a small tolerance (30–60 seconds) when checking <code>exp</code> and <code>nbf</code>, or tokens will fail intermittently across machines.</li>
</ul>`,
  faq: [
    { q: 'Is it safe to paste a real token here?', a: 'On this page, yes — decoding is done by JavaScript in your browser and there is no backend to receive it. Still treat any token you paste anywhere as potentially compromised, and prefer expired ones for debugging.' },
    { q: 'Can this tool verify the signature?', a: 'No, deliberately. Verification needs the signing secret or public key, and asking you to paste a secret into a web page would be bad practice regardless of how the page behaves.' },
    { q: 'Why is my token rejected as malformed?', a: 'A JWT must have exactly two dots. Common causes are a truncated copy, a leading <code>Bearer&nbsp;</code> prefix left in, or whitespace inserted by line wrapping.' },
    { q: 'Is a JWT encrypted?', a: 'No. A standard JWT (JWS) is signed, not encrypted, so the payload is readable by anyone. Encrypted tokens exist as a separate standard, JWE, and look different — five parts instead of three.' },
    { q: 'How long should a token last?', a: 'Access tokens: 5–15 minutes. Refresh tokens: days or weeks, stored securely and revocable. Long-lived access tokens are the most common JWT mistake because there is no way to cancel them.' },
  ],
  related: ['base64-encode-decode', 'json-formatter', 'timestamp-converter'],
  script: `
const $=s=>document.querySelector(s);
function b64url(s){
  s=s.replace(/-/g,'+').replace(/_/g,'/');
  while(s.length%4)s+='=';
  const bin=atob(s);
  const bytes=new Uint8Array(bin.length);
  for(let i=0;i<bin.length;i++)bytes[i]=bin.charCodeAt(i);
  return new TextDecoder().decode(bytes);
}
const NAMES={iss:'Issuer',sub:'Subject',aud:'Audience',exp:'Expires at',nbf:'Not valid before',iat:'Issued at',jti:'Token ID',
 scope:'Scope',scp:'Scope',azp:'Authorised party',email:'Email',name:'Name',role:'Role',roles:'Roles'};
function when(sec){
  const d=new Date(sec*1000);
  if(isNaN(d))return '';
  const diff=(d-Date.now())/1000;
  const abs=Math.abs(diff);
  const u=[[86400,'day'],[3600,'hour'],[60,'minute'],[1,'second']];
  let rel='just now';
  for(const [s,n] of u){if(abs>=s){const v=Math.round(abs/s);rel=v+' '+n+(v>1?'s':'')+(diff<0?' ago':' from now');break}}
  return d.toLocaleString()+' <span class="muted">('+rel+')</span>';
}
function run(){
  const raw=$('#in').value.trim().replace(/^Bearer\\s+/i,'').replace(/\\s+/g,'');
  $('#err').textContent='';
  if(!raw){$('#head').textContent='—';$('#body').textContent='—';$('#sig').textContent='—';
    $('#parts').innerHTML='';$('#claims').innerHTML='<tr><td colspan="2" class="muted">Paste a token above.</td></tr>';return}
  const p=raw.split('.');
  if(p.length!==3){$('#err').textContent='✗ A JWT must have exactly three dot-separated parts — found '+p.length+'.';return}
  let head,body;
  try{head=JSON.parse(b64url(p[0]))}catch(e){$('#err').textContent='✗ Header is not valid Base64url JSON.';return}
  try{body=JSON.parse(b64url(p[1]))}catch(e){$('#err').textContent='✗ Payload is not valid Base64url JSON.';return}
  $('#head').textContent=JSON.stringify(head,null,2);
  $('#body').textContent=JSON.stringify(body,null,2);
  $('#sig').textContent=p[2];
  const alg=head.alg||'unknown';
  let status='';
  if(body.exp){
    const expired=body.exp*1000<Date.now();
    status=expired?'<span class="err">✗ Expired</span>':'<span class="ok">✓ Not expired</span>';
  } else status='<span class="muted">No expiry claim</span>';
  const warn=alg.toLowerCase()==='none'?' <span class="err">— "none" means the token is unsigned and must never be trusted.</span>':'';
  $('#parts').innerHTML='<p>Algorithm <span class="pill">'+alg+'</span> · Type <span class="pill">'+(head.typ||'—')+'</span> · '+status+warn+'</p>';
  const rows=Object.entries(body).map(([k,v])=>{
    const label=NAMES[k]?k+' <span class="muted">('+NAMES[k]+')</span>':k;
    let val;
    if(['exp','iat','nbf','auth_time','updated_at'].includes(k)&&typeof v==='number')val=when(v);
    else val=typeof v==='object'?'<code>'+JSON.stringify(v)+'</code>':String(v).replace(/</g,'&lt;');
    return '<tr><td>'+label+'</td><td class="out">'+val+'</td></tr>';
  });
  $('#claims').innerHTML=rows.join('')||'<tr><td colspan="2" class="muted">No claims.</td></tr>';
}
$('#in').addEventListener('input',run);
document.addEventListener('click',e=>{const b=e.target.closest('[data-act]');if(!b)return;
 if(b.dataset.act==='clear')$('#in').value='';
 else{
   const enc=o=>btoa(JSON.stringify(o)).replace(/\\+/g,'-').replace(/\\//g,'_').replace(/=+$/,'');
   const now=Math.floor(Date.now()/1000);
   $('#in').value=enc({alg:'HS256',typ:'JWT'})+'.'+enc({sub:'1234567890',name:'Ada Lovelace',email:'ada@example.com',
     role:'admin',iss:'https://auth.example.com',aud:'toolman-demo',iat:now-600,exp:now+3000,jti:'a1b2c3'})+'.demo-signature-not-verified';
 }
 run()});
run();
`,
};
