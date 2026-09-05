import { esc, faq, ring } from '../layout.mjs';
import { PORT_ROWS as P } from './ports.mjs';

// The only click this site has ever received came from "ms sql ports" — a
// query that names the service and asks for the port, which is the direction
// the whole section did not serve. 49 pages keyed by number, none keyed by
// name, and the one query that converted was keyed by name.
//
// The multi-port services are the reason this is worth a page rather than a
// redirect. "What port does SMTP use" has three answers doing three different
// jobs — 25 between servers, 587 for submission, 465 for implicit TLS — and a
// single number gets it wrong. A page that says which and why is the answer
// somebody searching for it actually needs.

// Ports are grouped by hand because the service strings in the table are the
// port's own label — "SMTP", "SMTP submission", "SMTPS" — and no amount of
// string matching turns those into the one thing a reader calls email.
const SERVICES = [
  { id: 'smtp', name: 'SMTP', full: 'SMTP (sending email)', ports: [25, 465, 587],
    lead: 'Three ports, three jobs. Getting them mixed up is the usual cause of mail that will not send.' },
  { id: 'imap', name: 'IMAP', full: 'IMAP (reading email)', ports: [143, 993],
    lead: 'One plain and one encrypted. There is no good reason to use the plain one on a network you do not own.' },
  { id: 'pop3', name: 'POP3', full: 'POP3 (downloading email)', ports: [110, 995],
    lead: 'The older mail retrieval protocol, in plain and TLS forms.' },
  { id: 'ldap', name: 'LDAP', full: 'LDAP (directory services)', ports: [389, 636],
    lead: 'Directory lookups, plain and over TLS. The plain port carries bind credentials in clear text.' },
  { id: 'http', name: 'HTTP', full: 'HTTP (web traffic)', ports: [80, 8000, 8080],
    lead: 'One standard port and two conventions for everything that cannot have it.' },
  { id: 'https', name: 'HTTPS', full: 'HTTPS (encrypted web traffic)', ports: [443, 8443],
    lead: 'The standard port and the one a process without root privileges uses instead.' },
  { id: 'ftp', name: 'FTP', full: 'FTP (file transfer)', ports: [20, 21],
    lead: 'Two ports because the protocol separates commands from data — the design that makes FTP awkward through firewalls.' },
  { id: 'dhcp', name: 'DHCP', full: 'DHCP (address assignment)', ports: [67, 68],
    lead: 'Server and client each have their own port, and both are UDP.' },
  { id: 'docker', name: 'Docker', full: 'the Docker API', ports: [2375, 2376],
    lead: 'Plain and TLS. Exposing the plain one is equivalent to handing out root on the host.' },
  { id: 'mqtt', name: 'MQTT', full: 'MQTT (IoT messaging)', ports: [1883, 8883],
    lead: 'Plain and TLS, the same split as every other protocol that gained encryption later.' },
  // Single-port services, listed because people search the name rather than
  // the number. The page is short by design: the answer is one line.
  { id: 'ssh', name: 'SSH', full: 'SSH and SFTP', ports: [22], lead: '' },
  { id: 'rdp', name: 'RDP', full: 'Remote Desktop', ports: [3389], lead: '' },
  { id: 'mysql', name: 'MySQL', full: 'MySQL and MariaDB', ports: [3306], lead: '' },
  { id: 'postgresql', name: 'PostgreSQL', full: 'PostgreSQL', ports: [5432], lead: '' },
  { id: 'sql-server', name: 'SQL Server', full: 'Microsoft SQL Server', ports: [1433], lead: '' },
  { id: 'oracle', name: 'Oracle', full: 'Oracle Database', ports: [1521], lead: '' },
  { id: 'mongodb', name: 'MongoDB', full: 'MongoDB', ports: [27017], lead: '' },
  { id: 'redis', name: 'Redis', full: 'Redis', ports: [6379], lead: '' },
  { id: 'memcached', name: 'Memcached', full: 'Memcached', ports: [11211], lead: '' },
  { id: 'elasticsearch', name: 'Elasticsearch', full: 'Elasticsearch', ports: [9200], lead: '' },
  { id: 'dns', name: 'DNS', full: 'DNS', ports: [53], lead: '' },
  { id: 'ntp', name: 'NTP', full: 'NTP (time sync)', ports: [123], lead: '' },
  { id: 'smb', name: 'SMB', full: 'SMB (Windows file sharing)', ports: [445], lead: '' },
  { id: 'nfs', name: 'NFS', full: 'NFS', ports: [2049], lead: '' },
  { id: 'snmp', name: 'SNMP', full: 'SNMP', ports: [161], lead: '' },
  { id: 'syslog', name: 'Syslog', full: 'Syslog', ports: [514], lead: '' },
  { id: 'rabbitmq', name: 'RabbitMQ', full: 'RabbitMQ and AMQP', ports: [5672], lead: '' },
  { id: 'prometheus', name: 'Prometheus', full: 'Prometheus', ports: [9090], lead: '' },
];

export default function portServices() {
  const byPort = new Map(P.map((row) => [row[0], row]));
  const pages = [];

  // Every port a service page names has to exist in the table the number pages
  // are built from, or the page links somewhere that is not there.
  for (const s of SERVICES) {
    const missing = s.ports.filter((n) => !byPort.has(n));
    if (missing.length) {
      console.error(`\n✗ port-services ${s.id}: port ${missing.join(', ')} is not in the port table`);
      process.exitCode = 1;
    }
  }

  for (const s of SERVICES) {
    const rows = s.ports.map((n) => byPort.get(n)).filter(Boolean);
    if (!rows.length) continue;

    const primary = rows[0];
    const multi = rows.length > 1;
    const numbers = rows.map((r) => r[0]);

    // The claim "SMTP uses three ports" is a claim about this list.
    if (multi !== (numbers.length > 1)) {
      console.error(`\n✗ port-services ${s.id}: describes ${numbers.length} port(s) as ${multi ? 'several' : 'one'}`);
      process.exitCode = 1;
    }

    const table = rows.map((r) => `<tr><td><a href="/port/${r[0]}/"><strong>${r[0]}</strong></a></td><td>${esc(r[2])}</td><td>${esc(r[1])}</td><td>${r[3]}</td></tr>`).join('\n');

    const answer = multi
      ? `${s.name} uses <strong>${numbers.slice(0, -1).join(', ')} and ${numbers[numbers.length - 1]}</strong>, and which one depends on what you are doing.`
      : `${s.name} uses <strong>port ${numbers[0]}</strong> over ${primary[2]}.`;

    const FAQ = faq([
      {
        q: `What port does ${s.name} use?`,
        a: multi
          // The label repeated back - "25 is smtp; 465 is smtps" - is not an
          // answer. What each port is for is the reason the page exists.
          ? `${s.name} uses ports ${numbers.join(', ')}, and they do different jobs. ${rows.map((r) => `<strong>${r[0]}</strong>: ${r[3]}`).join(' ')}`
          : `${s.name} uses <strong>port ${numbers[0]}</strong> over ${primary[2]}. ${primary[3]}`,
      },
      {
        q: `Is port ${numbers[0]} safe to expose to the internet?`,
        a: primary[4],
      },
      {
        q: `How do I check whether ${s.name} is listening?`,
        a: `<code>sudo lsof -i :${numbers[0]}</code> on macOS or Linux, <code>netstat -ano | findstr :${numbers[0]}</code> on Windows. From another machine, <code>nc -zv host ${numbers[0]}</code> says whether anything answers.`,
      },
    ]);

    pages.push({
      path: `/port/service/${s.id}/`,
      title: `What Port Does ${s.name} Use? ${numbers.join(', ')}`.length <= 65
        ? `What Port Does ${s.name} Use? ${numbers.join(', ')}`
        : `What Port Does ${s.name} Use?`,
      desc: `${s.name} uses port${multi ? 's' : ''} ${numbers.join(', ')}${multi ? ` — ${rows.map((r) => `${r[0]} for ${r[1].toLowerCase()}`).join(', ')}` : ` over ${primary[2]}`}. What each is for, whether to expose it, and how to check it is listening.`,
      h1: `What port does ${s.name} use?`,
      crumbs: [
        { name: 'Ports', path: '/port/' },
        { name: s.name, path: `/port/service/${s.id}/` },
      ],
      jsonld: [FAQ.schema],
      body: `<p class="big" style="font-size:1.4rem;margin:.3em 0">${answer}</p>
${s.lead ? `<p>${s.lead}</p>` : ''}

<table><thead><tr><th>Port</th><th>Protocol</th><th>Name</th><th>What it is for</th></tr></thead><tbody>
${table}
</tbody></table>

<h2>Exposing it</h2>
<p>${primary[4]}</p>

<h2>Checking it is listening</h2>
<pre><code>sudo lsof -i :${numbers[0]}          # macOS, Linux
netstat -ano | findstr :${numbers[0]}   # Windows
nc -zv host ${numbers[0]}               # from elsewhere</code></pre>
<p>An "address already in use" error on a port nothing appears to be holding usually means the socket is in <code>TIME_WAIT</code> rather than that a process has it — <a href="/port/">the ports reference</a> covers that and the ephemeral range.</p>

${FAQ.html}

<h2>Other services</h2>
<ul class="linklist">${ring(SERVICES, s, 12).map((o) => `<li><a href="/port/service/${o.id}/">What port does ${esc(o.name)} use?</a></li>`).join('')}</ul>

<p>${rows.map((r) => `<a href="/port/${r[0]}/">Port ${r[0]} in full</a>`).join(' · ')} · <a href="/port/service/">Every service</a> · <a href="/port/">All port numbers</a></p>`,
    });
  }

  const links = SERVICES.map((s) => `<li><a href="/port/service/${s.id}/">${esc(s.name)}</a> — ${s.ports.join(', ')}</li>`).join('');

  pages.push({
    path: '/port/service/',
    title: 'What Port Does It Use? Ports by Service Name',
    desc: `The port numbers for ${SERVICES.length} common services, looked up by name rather than by number — SMTP, SSH, RDP, MySQL, SQL Server and the rest, with what each port is for.`,
    h1: 'Ports by service',
    crumbs: [
      { name: 'Ports', path: '/port/' },
      { name: 'By service', path: '/port/service/' },
    ],
    body: `<p>The port reference on this site is keyed by number, which is the wrong way round for the question people usually have: you know the service and you want the port. This is the same data, keyed by name.</p>
<p>Several of them have more than one answer. SMTP uses 25 between servers, 587 for a mail client submitting a message, and 465 for implicit TLS — a single number is wrong for two of those three jobs.</p>
<ul class="cols">
${links}
</ul>
<p><a href="/port/">All port numbers</a> · <a href="/http/">HTTP status codes</a></p>`,
  });

  return pages;
}
