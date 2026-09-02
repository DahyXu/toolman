export default {
  slug: 'chmod-calculator',
  cat: 'dev',
  weight: 8,
  title: 'Chmod Calculator',
  metaTitle: 'Chmod Calculator — Octal, Symbolic & Permission Bits | Toolman',
  short: 'Tick permission boxes to get the octal chmod value, or type a value to see what it grants.',
  desc:
    'Convert between octal permission values, symbolic notation like rwxr-xr-x and the individual read, write and execute bits, including setuid and sticky.',
  intro:
    'Tick the boxes to build a permission value, or type an octal number or a symbolic string to see exactly what it grants. Everything runs in your browser.',
  body: `<div class="tool">
  <table>
    <thead><tr><th>Who</th><th>Read (4)</th><th>Write (2)</th><th>Execute (1)</th></tr></thead>
    <tbody>
      <tr><td>Owner</td>
        <td><input type="checkbox" id="ur" aria-label="Owner read" style="width:auto"></td>
        <td><input type="checkbox" id="uw" aria-label="Owner write" style="width:auto"></td>
        <td><input type="checkbox" id="ux" aria-label="Owner execute" style="width:auto"></td></tr>
      <tr><td>Group</td>
        <td><input type="checkbox" id="gr" aria-label="Group read" style="width:auto"></td>
        <td><input type="checkbox" id="gw" aria-label="Group write" style="width:auto"></td>
        <td><input type="checkbox" id="gx" aria-label="Group execute" style="width:auto"></td></tr>
      <tr><td>Others</td>
        <td><input type="checkbox" id="or" aria-label="Others read" style="width:auto"></td>
        <td><input type="checkbox" id="ow" aria-label="Others write" style="width:auto"></td>
        <td><input type="checkbox" id="ox" aria-label="Others execute" style="width:auto"></td></tr>
    </tbody>
  </table>
  <div class="row">
    <label style="margin:0"><input type="checkbox" id="suid" style="width:auto"> setuid (4000)</label>
    <label style="margin:0"><input type="checkbox" id="sgid" style="width:auto"> setgid (2000)</label>
    <label style="margin:0"><input type="checkbox" id="sticky" style="width:auto"> sticky (1000)</label>
  </div>
  <div class="grid2">
    <div><label for="oct">Octal</label><input type="text" id="oct" value="644" spellcheck="false" style="font-family:var(--mono)"></div>
    <div><label for="sym">Symbolic</label><input type="text" id="sym" value="rw-r--r--" spellcheck="false" style="font-family:var(--mono)"></div>
  </div>
  <p id="err" class="err"></p>
  <h2>Command</h2>
  <pre><code id="cmd"></code></pre>
  <table><tbody id="info"></tbody></table>
  <p class="muted">Common values: <a href="/chmod/400/">400</a> · <a href="/chmod/600/">600</a> · <a href="/chmod/644/">644</a> · <a href="/chmod/664/">664</a> · <a href="/chmod/666/">666</a> · <a href="/chmod/700/">700</a> · <a href="/chmod/750/">750</a> · <a href="/chmod/755/">755</a> · <a href="/chmod/775/">775</a> · <a href="/chmod/777/">777</a> · <a href="/chmod/1777/">1777</a> · <a href="/chmod/2775/">2775</a> · <a href="/chmod/4755/">4755</a> · <a href="/chmod/">all values</a></p>
</div>`,
  about: `<h2>How the numbers work</h2>
<p>Each of the three permissions has a value: <strong>read is 4</strong>, <strong>write is 2</strong> and <strong>execute is 1</strong>. Add together the ones you want and you get a single digit from 0 to 7. Do that three times — once for the file's owner, once for its group, and once for everyone else — and you have the familiar three-digit octal value.</p>
<p>So <code>644</code> is 4+2 for the owner (read and write), 4 for the group (read only) and 4 for everyone else (read only). <code>755</code> is 4+2+1 for the owner and 4+1 for the other two. Because each digit is three bits, octal maps onto the permission bits exactly, which is why permissions are written in base 8 rather than base 10.</p>

<h2>What execute means on a directory</h2>
<p>This is the part that catches people out. On a file, <code>x</code> means the file can be run as a program. On a <em>directory</em> it means something quite different: it grants the right to traverse into the directory and access things inside it by name.</p>
<p>The practical consequence is that a directory with <code>r</code> but no <code>x</code> lets you list the names in it but not read any of the files, while a directory with <code>x</code> but no <code>r</code> lets you open a file whose name you already know but not discover what is there. This is why directories are almost always <code>755</code> and files <code>644</code> — the same permission digit means different things depending on what it is applied to.</p>

<h2>The two you should be careful with</h2>
<p><code>777</code> grants write access to every user on the system. It is a common piece of bad advice for fixing a permissions problem, and it usually works, in the same sense that removing the lock fixes a stuck door. If a web server cannot write to a directory, the fix is to change the directory's owner or group to the server's user, not to open it to everyone.</p>
<p><code>666</code> on a file has the same problem without even the excuse of being executable. If you find yourself reaching for either, the question to ask is which user actually needs the access, and then grant it to that user.</p>

<h2>The fourth digit</h2>
<p>Permissions can carry a fourth leading digit that most people never set deliberately:</p>
<table>
<thead><tr><th>Bit</th><th>Value</th><th>What it does</th></tr></thead>
<tbody>
<tr><td>setuid</td><td>4000</td><td>An executable runs as its owner rather than as the user who ran it. This is how <code>passwd</code> can edit a file only root may write.</td></tr>
<tr><td>setgid</td><td>2000</td><td>On an executable, it runs with the file's group. On a directory, new files inside inherit that directory's group — genuinely useful for shared project folders.</td></tr>
<tr><td>sticky</td><td>1000</td><td>In a world-writable directory, only a file's owner may delete it. This is what stops one user removing another's files from <code>/tmp</code>.</td></tr>
</tbody>
</table>
<p>In symbolic output these replace the execute character: an uppercase <code>S</code> or <code>T</code> means the special bit is set but execute is not, which is almost always a mistake.</p>

<h2>Symbolic mode</h2>
<p><code>chmod</code> also accepts changes rather than absolute values, which is safer when you only want to adjust one thing:</p>
<table>
<thead><tr><th>Command</th><th>Effect</th></tr></thead>
<tbody>
<tr><td><code>chmod +x script.sh</code></td><td>Add execute for everyone, subject to the umask</td></tr>
<tr><td><code>chmod u+x script.sh</code></td><td>Add execute for the owner only</td></tr>
<tr><td><code>chmod go-w file</code></td><td>Remove write from group and others, leaving everything else alone</td></tr>
<tr><td><code>chmod a=r file</code></td><td>Set everyone to read only, clearing write and execute</td></tr>
<tr><td><code>chmod -R u+rwX dir</code></td><td>Recursive; capital <code>X</code> adds execute only to directories and files that already have it somewhere</td></tr>
</tbody>
</table>
<p>That capital <code>X</code> is worth remembering. <code>chmod -R 755</code> on a source tree marks every file executable, which is wrong for almost all of them; <code>chmod -R u+rwX</code> does the sensible thing instead.</p>`,
  faq: [
    { q: 'What is chmod 755?', a: 'Read, write and execute for the owner, and read and execute for the group and everyone else — written <code>rwxr-xr-x</code>. It is the normal setting for directories and for scripts that need to be runnable.' },
    { q: 'What is chmod 644?', a: 'Read and write for the owner, read only for the group and everyone else — <code>rw-r--r--</code>. This is the usual setting for ordinary files that are not meant to be executed.' },
    { q: 'Is chmod 777 safe?', a: 'No. It lets any user on the system modify the file or directory. It often makes a permissions error go away, which is why it gets recommended, but the correct fix is almost always to change the owner or group so the process that needs access has it.' },
    { q: 'What does the x bit do on a directory?', a: 'It grants the right to traverse the directory and reach the entries inside it by name. Without it, the directory cannot be entered even if you can list its contents, which is why directories need execute and ordinary files do not.' },
    { q: 'Why are permissions written in octal?', a: 'Each permission set is exactly three bits — read, write and execute — and one octal digit is exactly three bits. The mapping is one-to-one, which decimal would not give you.' },
    { q: 'What is the difference between chmod and chown?', a: '<code>chmod</code> changes what the owner, the group and everyone else may do. <code>chown</code> changes who the owner and the group actually are. A permissions problem is often a <code>chown</code> problem.' },
  ],
  related: ['hash-generator', 'cron-expression-generator', 'number-base-converter'],
  script: `
const $=s=>document.querySelector(s);
const WHO=['u','g','o'], PERM=['r','w','x'];
const box=(w,p)=>$('#'+({u:'u',g:'g',o:'o'}[w])+p);
// Read the nine checkboxes into a three-digit octal number.
function fromBoxes(){
  let d='';
  for(const w of WHO){ let n=0; PERM.forEach((p,i)=>{ if(box(w,p).checked)n+=[4,2,1][i] }); d+=n }
  let s=0;
  if($('#suid').checked)s+=4; if($('#sgid').checked)s+=2; if($('#sticky').checked)s+=1;
  return (s?String(s):'')+d;
}
function setBoxes(v){
  const s=v.length>3?+v[v.length-4]:0, d=v.slice(-3);
  WHO.forEach((w,i)=>{ const n=+d[i]; PERM.forEach((p,j)=>{ box(w,p).checked=!!(n&[4,2,1][j]) }) });
  $('#suid').checked=!!(s&4); $('#sgid').checked=!!(s&2); $('#sticky').checked=!!(s&1);
}
// Symbolic notation puts the special bits in place of the execute character,
// upper case when execute itself is not set — that is the standard ls display.
function toSym(v){
  const s=v.length>3?+v[v.length-4]:0, d=v.slice(-3);
  const special=[(s&4)>0,(s&2)>0,(s&1)>0];
  return WHO.map((w,i)=>{
    const n=+d[i], x=!!(n&1);
    let third = x?'x':'-';
    if(special[i]) third = x ? (i===2?'t':'s') : (i===2?'T':'S');
    return ((n&4)?'r':'-')+((n&2)?'w':'-')+third;
  }).join('');
}
function fromSym(str){
  const t=str.trim().replace(/^[dlbcps-]/,'');
  if(!/^[rwxsStT-]{9}$/.test(t)) throw new Error('Expected nine characters like rwxr-xr-x');
  let d='', s=0;
  for(let i=0;i<3;i++){
    const c=t.slice(i*3,i*3+3);
    let n=0;
    if(c[0]==='r')n+=4; if(c[1]==='w')n+=2;
    if(c[2]==='x'||c[2]==='s'||c[2]==='t')n+=1;
    if(c[2]==='s'||c[2]==='S')s+= i===0?4:2;
    if(c[2]==='t'||c[2]==='T')s+=1;
    d+=n;
  }
  return (s?String(s):'')+d;
}
const NAMES={r:'read',w:'write',x:'execute'};
function describe(v){
  const d=v.slice(-3);
  return ['owner','group','others'].map((w,i)=>{
    const n=+d[i];
    const list=[(n&4)&&'read',(n&2)&&'write',(n&1)&&'execute'].filter(Boolean);
    return w+': '+(list.length?list.join(', '):'no access');
  });
}
function render(v){
  const sym=toSym(v);
  $('#oct').value=v; $('#sym').value=sym;
  setBoxes(v);
  $('#cmd').textContent='chmod '+v+' filename';
  const d=v.slice(-3);
  const rows=[
    ['Octal',v],
    ['Symbolic',sym],
    ['ls -l style','-'+sym],
    ['Owner',describe(v)[0].replace('owner: ','')],
    ['Group',describe(v)[1].replace('group: ','')],
    ['Others',describe(v)[2].replace('others: ','')],
    ['Binary',[...d].map(c=>(+c).toString(2).padStart(3,'0')).join(' ')],
    ['World-writable?',(+d[2]&2)?'Yes — anyone on the system can modify this':'No'],
  ];
  $('#info').innerHTML=rows.map(r=>'<tr><td>'+r[0]+'</td><td class="out">'+r[1]+'</td></tr>').join('');
}
function norm(x){
  const t=x.trim();
  if(!/^[0-7]{3,4}$/.test(t)) throw new Error('Expected three or four octal digits, each 0-7');
  return t;
}
$('#oct').addEventListener('input',()=>{ try{ $('#err').textContent=''; render(norm($('#oct').value)) }catch(e){ $('#err').textContent='✗ '+e.message } });
$('#sym').addEventListener('input',()=>{ try{ $('#err').textContent=''; render(fromSym($('#sym').value)) }catch(e){ $('#err').textContent='✗ '+e.message } });
document.querySelectorAll('input[type=checkbox]').forEach(c=>c.addEventListener('change',()=>{ $('#err').textContent=''; render(fromBoxes()) }));
render('644');
`,
};
