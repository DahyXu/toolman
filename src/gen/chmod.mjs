import { esc, faq } from '../layout.mjs';

// The permission values people actually search for, plus enough neighbours that
// the section is a real reference rather than a handful of pages. Every value
// here either appears in ordinary use or is a well-known mistake worth
// explaining; the arithmetic for all of them is computed, not written by hand.
const VALUES = [
  '000', '400', '440', '444', '600', '640', '644', '660', '664', '666',
  '700', '710', '744', '750', '751', '754', '755', '764', '770', '774', '775', '776', '777',
  '1777', '2755', '2775', '4755', '4711', '6755',
];

// Where each value is genuinely the right answer, or why it is not.
const NOTES = {
  '000': 'No access for anyone, including the owner. The owner can still change the permissions back, because that right comes from ownership rather than from the permission bits — which is the detail that surprises people the first time they try it.',
  '400': 'Read-only for the owner and nothing for anyone else. This is what an SSH private key should be, and OpenSSH will refuse to use a key file that is more permissive.',
  '440': 'Read-only for the owner and the group. Useful for a credentials file that a service account needs to read through group membership but nothing should modify at runtime.',
  '444': 'Read-only for everyone. Occasionally used for files that must not be edited by accident, though it does not stop anyone with write access to the containing directory from deleting and replacing the file.',
  '600': 'Read and write for the owner only. The correct setting for private keys, token files, <code>.env</code> files and anything else holding a secret that the owning process needs to update.',
  '640': 'Owner reads and writes, group reads. A common pattern for configuration that a service reads under its own group while an administrator edits it.',
  '644': 'The default for ordinary files: the owner can edit, everyone else can read. Web servers expect static files to be readable, and this is the setting that makes them so without allowing anyone to modify them.',
  '660': 'Owner and group read and write, nothing for others. Used where two accounts in the same group both need to write, such as a shared upload directory’s files.',
  '664': 'Owner and group write, everyone reads. The default on systems that use per-user groups, where a file being group-writable is harmless because the group has only one member.',
  '666': 'Everyone can read and write. There is almost no legitimate use for this on a real file — if several accounts need write access, put them in a group and use 660.',
  '700': 'Full access for the owner, nothing for anyone else. The right setting for a private directory such as <code>~/.ssh</code>, and for scripts that should be runnable only by their owner.',
  '710': 'Owner has full access; the group may traverse the directory but not list it. This lets a group reach a known path inside without being able to discover what else is there.',
  '744': 'Owner can do everything, everyone else can read. Rarely what you want on a directory, because read without execute lets others see the names but reach none of the contents.',
  '750': 'Owner has full access, the group can read and traverse, others get nothing. The standard setting for a directory shared with one group but private from everyone else.',
  '751': 'Owner full, group read and traverse, others may traverse but not list. A deliberate choice when a path needs to be reachable without its contents being enumerable.',
  '754': 'Owner full, group read and execute, others read only. An unusual combination — on a directory the read-without-execute for others is close to useless.',
  '755': 'The default for directories and for executable scripts: the owner can change things, everyone else can read and traverse or run. If a script will not run, this is usually the value you are reaching for.',
  '764': 'Owner full, group read and write, others read. Sometimes seen on shared documents, though 664 is the more usual choice since the owner rarely needs the file to be executable.',
  '770': 'Owner and group have full access, others get nothing. The right setting for a directory that a group works in together and nobody outside should see.',
  '774': 'Owner and group full access, others read only. Used for a group working area whose contents should still be publicly readable.',
  '775': 'Owner and group full access, others read and traverse. The usual setting for a directory that a group maintains and a web server or other users need to read.',
  '776': 'Owner and group full, others read and write but not execute. On a directory this is a strange half-measure: others can create and delete entries but cannot traverse into subdirectories.',
  '777': 'Everyone can do everything. It resolves almost any permission error, which is why it gets suggested so often, and it does so by removing the protection rather than fixing the cause. The real fix is nearly always to change the owner or group so that the process needing access already has it.',
  '1777': 'World-writable with the sticky bit, which is exactly what <code>/tmp</code> uses. Anyone may create files, but only a file’s owner may delete it — without the sticky bit any user could remove another user’s temporary files.',
  '2755': 'Standard 755 plus setgid. On a directory, new entries inherit the directory’s group rather than the creating user’s, which keeps a shared tree consistently owned.',
  '2775': '775 plus setgid — the usual setting for a collaborative directory. Group members can write, and everything created inside stays in the shared group automatically.',
  '4755': '755 plus setuid: the program runs as its owner rather than as whoever executed it. This is how tools like <code>passwd</code> work, and it is a serious liability on anything not audited for it.',
  '4711': 'Setuid with execute-only access for group and others. Occasionally used to let a program be run without its contents being readable, though the binary can still be copied by its owner.',
  '6755': 'Both setuid and setgid on top of 755. Rare, and worth a second look wherever it appears, since it grants two separate privilege transitions at once.',
};

const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);

function split(v) {
  return { special: v.length > 3 ? +v[v.length - 4] : 0, d: v.slice(-3) };
}

function symbolic(v) {
  const { special, d } = split(v);
  const sp = [(special & 4) > 0, (special & 2) > 0, (special & 1) > 0];
  return [0, 1, 2]
    .map((i) => {
      const n = +d[i];
      const x = !!(n & 1);
      let third = x ? 'x' : '-';
      if (sp[i]) third = x ? (i === 2 ? 't' : 's') : i === 2 ? 'T' : 'S';
      return ((n & 4) ? 'r' : '-') + ((n & 2) ? 'w' : '-') + third;
    })
    .join('');
}

function words(n) {
  const list = [(n & 4) && 'read', (n & 2) && 'write', (n & 1) && 'execute'].filter(Boolean);
  return list.length ? list.join(', ') : 'no access';
}

function sum(n) {
  const parts = [(n & 4) && '4', (n & 2) && '2', (n & 1) && '1'].filter(Boolean);
  return parts.length ? parts.join(' + ') + ' = ' + n : '0';
}

export default async function () {
  const pages = [];

  for (const v of VALUES) {
    const { special, d } = split(v);
    const sym = symbolic(v);
    const who = ['owner', 'group', 'others'];
    const worldWritable = (+d[2] & 2) > 0;
    const dirExec = (+d[0] & 1) > 0;

    const FAQ = faq([
      { q: `What does chmod ${v} mean?`, a: `It sets ${who.map((w, i) => `<strong>${w}</strong> to ${words(+d[i])}`).join(', ')}${special ? `, with the ${[(special & 4) && 'setuid', (special & 2) && 'setgid', (special & 1) && 'sticky'].filter(Boolean).join(' and ')} bit set` : ''}. In symbolic notation that is <code>${sym}</code>.` },
      { q: `How do I apply ${v}?`, a: `Run <code>chmod ${v} filename</code>. Add <code>-R</code> to apply it to a directory and everything inside, though be careful: a recursive numeric chmod marks every file the same way, which is rarely correct for a mixed tree of files and directories.` },
      { q: `Is ${v} safe?`, a: worldWritable ? `It is world-writable, so any account on the system can modify the contents. That is only appropriate for a shared scratch area${v === '1777' ? ', which is why /tmp uses it together with the sticky bit' : ', and even then the sticky bit should normally be set as well'}. For anything else, grant access through a group instead.` : special & 4 ? `Setuid means the program runs with its owner’s privileges regardless of who starts it. That is a deliberate privilege escalation and should exist only on binaries that were written to be safe under it.` : `It grants no write access outside ${(+d[1] & 2) ? 'the owner and the group' : 'the owner'}, so it is a reasonable setting as long as the owner is the account you intend.` },
      { q: `What is ${v} in symbolic notation?`, a: `<code>${sym}</code>. Written as <code>ls -l</code> shows it, with a leading file-type character, an ordinary file would appear as <code>-${sym}</code> and a directory as <code>d${sym}</code>.` },
    ]);

    const related = VALUES.filter((x) => x !== v).slice(0, 14);

    pages.push({
      path: `/chmod/${v}/`,
      title: `chmod ${v} — What ${sym} Means and When to Use It | Toolman`,
      desc: `chmod ${v} is ${sym}: ${who.map((w, i) => `${w} ${words(+d[i])}`).join(', ')}. What the value grants, how it is calculated, and whether it is the right setting.`,
      h1: `chmod ${v}`,
      crumbs: [
        { name: 'Developer Tools', path: '/dev/' },
        { name: 'chmod', path: '/chmod/' },
        { name: v, path: `/chmod/${v}/` },
      ],
      jsonld: [FAQ.schema],
      body: `<p class="muted"><code>chmod ${v}</code> is <strong>${sym}</strong>${special ? ' (with special bits)' : ''}.</p>

<h2>What ${v} grants</h2>
<table><thead><tr><th>Who</th><th>Digit</th><th>Permissions</th><th>Adds up as</th></tr></thead><tbody>
${who.map((w, i) => `<tr><td>${cap(w)}</td><td class="out">${d[i]}</td><td>${words(+d[i])}</td><td class="out">${sum(+d[i])}</td></tr>`).join('')}
${special ? `<tr><td>Special</td><td class="out">${special}</td><td>${[(special & 4) && 'setuid', (special & 2) && 'setgid', (special & 1) && 'sticky'].filter(Boolean).join(', ')}</td><td class="out">${sum(special).replace('4', '4000').replace('2', '2000').replace('1', '1000')}</td></tr>` : ''}
</tbody></table>

<h2>When ${v} is the right answer</h2>
<p>${NOTES[v]}</p>

<h2>The command</h2>
<pre><code>chmod ${v} filename
chmod -R ${v} directory/</code></pre>
<p>${dirExec
  ? `Because the owner has the execute bit, this works on a directory as well as a file — on a directory, execute is what grants the right to enter it and reach the entries inside.`
  : `Note that nobody has the execute bit here, so this value cannot be used on a directory that anyone needs to enter. On a directory, execute grants traversal rather than the right to run something.`}</p>

<h2>How it is written elsewhere</h2>
<table><tbody>
<tr><td>Octal</td><td class="out">${v}</td></tr>
<tr><td>Symbolic</td><td class="out">${sym}</td></tr>
<tr><td>As a file in <code>ls -l</code></td><td class="out">-${sym}</td></tr>
<tr><td>As a directory in <code>ls -l</code></td><td class="out">d${sym}</td></tr>
<tr><td>Binary</td><td class="out">${[...d].map((c) => (+c).toString(2).padStart(3, '0')).join(' ')}</td></tr>
<tr><td>World-writable</td><td>${worldWritable ? '<strong>Yes</strong> — any user on the system can modify this' : 'No'}</td></tr>
</tbody></table>

${FAQ.html}

<h2>Other permission values</h2>
<ul class="linklist">${related.map((x) => `<li><a href="/chmod/${x}/">chmod ${x} — ${symbolic(x)}</a></li>`).join('')}</ul>
<p><a href="/chmod/">All permission values</a> · <a href="/chmod-calculator/">Chmod calculator</a></p>`,
    });
  }

  pages.push({
    path: '/chmod/',
    title: 'Chmod Permission Values — Octal to Symbolic Reference',
    desc: 'Every common chmod value with what it grants to the owner, the group and everyone else, its symbolic form, and whether it is the right setting for a file or a directory.',
    h1: 'Chmod permission values',
    crumbs: [
      { name: 'Developer Tools', path: '/dev/' },
      { name: 'chmod', path: '/chmod/' },
    ],
    body: `<p class="muted">What each permission value actually grants, and when it is the right one. Use the <a href="/chmod-calculator/">calculator</a> to build a value from checkboxes.</p>
<table><thead><tr><th style="width:6em">Octal</th><th style="width:9em">Symbolic</th><th>Owner</th><th>Group</th><th>Others</th></tr></thead><tbody>
${VALUES.map((v) => {
      const { d } = split(v);
      return `<tr><td><a href="/chmod/${v}/"><strong>${v}</strong></a></td><td class="out"><a href="/chmod/${v}/">${symbolic(v)}</a></td><td>${words(+d[0])}</td><td>${words(+d[1])}</td><td>${words(+d[2])}</td></tr>`;
    }).join('')}
</tbody></table>

<h2>Reading a permission value</h2>
<p>Each digit is the sum of the permissions granted to one class of user: <strong>4 for read, 2 for write, 1 for execute</strong>. The three digits are the file's owner, its group, and everyone else, in that order. Because each digit covers exactly three bits, octal maps onto the permission bits one-to-one — which is why permissions are written in base 8 and not in decimal.</p>

<h2>Files and directories are different</h2>
<p>The same digit means different things depending on what it is applied to, and this is the single most common source of confusion:</p>
<table>
<thead><tr><th>Bit</th><th>On a file</th><th>On a directory</th></tr></thead>
<tbody>
<tr><td><code>r</code></td><td>Read the contents</td><td>List the names inside</td></tr>
<tr><td><code>w</code></td><td>Modify the contents</td><td>Create, rename and delete entries</td></tr>
<tr><td><code>x</code></td><td>Run it as a program</td><td>Enter it and reach entries by name</td></tr>
</tbody>
</table>
<p>Two consequences follow. A directory with read but no execute lets you see the names of files you cannot open. And write permission on a directory is enough to delete a file inside it <em>even if you have no permission on the file itself</em> — deletion is a change to the directory, not to the file. That is precisely the hole the sticky bit exists to close.</p>

<h2>The defaults worth memorising</h2>
<table>
<thead><tr><th>Value</th><th>Use</th></tr></thead>
<tbody>
<tr><td><a href="/chmod/644/"><code>644</code></a></td><td>Ordinary files — the owner edits, everyone reads</td></tr>
<tr><td><a href="/chmod/755/"><code>755</code></a></td><td>Directories and executable scripts</td></tr>
<tr><td><a href="/chmod/600/"><code>600</code></a></td><td>Secrets: keys, tokens, <code>.env</code> files</td></tr>
<tr><td><a href="/chmod/700/"><code>700</code></a></td><td>Private directories such as <code>~/.ssh</code></td></tr>
<tr><td><a href="/chmod/775/"><code>775</code></a></td><td>A directory a group maintains and others read</td></tr>
<tr><td><a href="/chmod/1777/"><code>1777</code></a></td><td>A shared scratch directory, sticky so nobody deletes another's files</td></tr>
</tbody>
</table>

<h2>Why recursive chmod usually goes wrong</h2>
<p><code>chmod -R 755</code> on a project tree is a common instruction and an unhelpful one: it marks every source file executable, because a numeric mode makes no distinction between a file and a directory. The fix is the capital <code>X</code> in symbolic mode, which adds execute only to directories and to files that already had it somewhere:</p>
<pre><code>chmod -R u=rwX,go=rX .</code></pre>
<p>Read this as: give the owner read and write plus execute-where-appropriate, and give everyone else read plus execute-where-appropriate. Directories become 755 and ordinary files 644, in one pass.</p>

<h2>umask decides what you get by default</h2>
<p>New files are not created with the permissions you might expect, because the umask removes bits from a base value. The base is 666 for files and 777 for directories, and the umask is subtracted:</p>
<table>
<thead><tr><th>umask</th><th>New file</th><th>New directory</th></tr></thead>
<tbody>
<tr><td><code>022</code></td><td>644</td><td>755</td></tr>
<tr><td><code>002</code></td><td>664</td><td>775</td></tr>
<tr><td><code>077</code></td><td>600</td><td>700</td></tr>
</tbody>
</table>
<p>A umask of <code>022</code> is the common default, which is where 644 and 755 come from. Systems using per-user groups often default to <code>002</code>, making new files group-writable — harmless when the group has one member, and a surprise when it does not.</p>`,
  });

  return pages;
}
