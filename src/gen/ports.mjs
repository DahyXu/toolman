import { esc, faq } from '../layout.mjs';

// port, service, protocol, what it is, security note
const P = [
  [20, 'FTP data', 'TCP', 'The data channel of the classic File Transfer Protocol. The control channel is port 21.', 'Unencrypted. Use SFTP (port 22) or FTPS instead — plain FTP sends credentials in clear text.'],
  [21, 'FTP control', 'TCP', 'The command channel for FTP: login, directory listings and transfer commands.', 'Credentials travel in clear text. Anything exposed to the internet on port 21 will be found by scanners within hours.'],
  [22, 'SSH / SFTP', 'TCP', 'Secure Shell — remote terminal access, and the transport for SFTP and SCP. Also what Git uses over SSH.', 'The single most brute-forced port on the internet. Disable password authentication, use keys only, and consider fail2ban. Moving to a non-standard port reduces log noise but is not security.'],
  [23, 'Telnet', 'TCP', 'Unencrypted remote terminal access, superseded by SSH decades ago.', 'Everything including the password is plain text on the wire. There is no safe way to expose this. If something still needs it, tunnel it.'],
  [25, 'SMTP', 'TCP', 'Server-to-server mail transfer.', 'Most residential ISPs and cloud providers block outbound 25 to limit spam. For sending mail from an application use port 587 with authentication.'],
  [53, 'DNS', 'TCP/UDP', 'Domain name resolution. UDP for normal queries, TCP for responses over 512 bytes and for zone transfers.', 'An open recursive resolver will be abused for DNS amplification attacks. Restrict recursion to your own networks.'],
  [67, 'DHCP server', 'UDP', 'Hands out IP addresses to clients on a local network.', 'Two DHCP servers on one network cause address conflicts — a classic cause of "the internet is down" in small offices.'],
  [68, 'DHCP client', 'UDP', 'The client side of DHCP address assignment.', 'Local network only; nothing to expose.'],
  [69, 'TFTP', 'UDP', 'Trivial FTP, used for network boot and switch firmware.', 'No authentication at all by design. Confine it to an isolated provisioning network.'],
  [80, 'HTTP', 'TCP', 'Unencrypted web traffic. Still the default port a browser tries when no scheme is given.', 'Serve nothing here but a 301 redirect to HTTPS. Add HSTS so browsers stop trying port 80 at all.'],
  [110, 'POP3', 'TCP', 'Mail retrieval that downloads and usually deletes messages from the server.', 'Unencrypted. Use port 995 (POP3S), or better, IMAP over TLS on 993.'],
  [123, 'NTP', 'UDP', 'Network Time Protocol — clock synchronisation.', 'Another amplification vector. Disable the monlist command and do not run an open NTP server.'],
  [143, 'IMAP', 'TCP', 'Mail access that keeps messages on the server and syncs state across devices.', 'Unencrypted. Use port 993 for IMAP over TLS.'],
  [161, 'SNMP', 'UDP', 'Network device monitoring and management.', 'SNMP v1 and v2c authenticate with a community string sent in clear text, and "public" is still a common default. Use v3, or firewall it to the monitoring host.'],
  [389, 'LDAP', 'TCP', 'Directory services — user and group lookups, including Active Directory.', 'Unencrypted. Use LDAPS on 636 or StartTLS, otherwise credentials are readable on the wire.'],
  [443, 'HTTPS', 'TCP', 'Encrypted web traffic. The default for essentially all modern web services, and the transport for HTTP/2 and HTTP/3.', 'HTTP/3 runs over QUIC on UDP 443 — if you firewall only TCP, HTTP/3 silently fails and clients fall back.'],
  [445, 'SMB', 'TCP', 'Windows file and printer sharing.', 'Should never be reachable from the internet. This is the port WannaCry and NotPetya spread over.'],
  [465, 'SMTPS', 'TCP', 'Mail submission over implicit TLS.', 'Deprecated, then un-deprecated. Port 587 with STARTTLS is the more widely supported choice.'],
  [514, 'Syslog', 'UDP', 'Remote logging.', 'UDP syslog has no authentication and no delivery guarantee. Use TLS syslog on 6514 for anything that matters.'],
  [587, 'SMTP submission', 'TCP', 'The port applications and mail clients use to send outbound mail, with authentication and STARTTLS.', 'This is the correct port for application email. Port 25 is for server-to-server relay and is widely blocked.'],
  [636, 'LDAPS', 'TCP', 'LDAP over TLS.', 'Preferred over plain LDAP on 389 whenever credentials are involved.'],
  [993, 'IMAPS', 'TCP', 'IMAP over TLS — the standard for mail clients.', 'Use this rather than 143.'],
  [995, 'POP3S', 'TCP', 'POP3 over TLS.', 'Use this rather than 110, though IMAP is a better protocol for most people.'],
  [1080, 'SOCKS proxy', 'TCP', 'SOCKS4/5 proxy protocol, also what `ssh -D` opens.', 'An open SOCKS proxy will be found and abused. Bind it to localhost.'],
  [1433, 'Microsoft SQL Server', 'TCP', 'The default port for MS SQL Server.', 'Never expose a database directly to the internet. Put it behind a VPN or a private network.'],
  [1521, 'Oracle Database', 'TCP', 'Oracle listener port.', 'Same rule — databases belong on a private network.'],
  [1883, 'MQTT', 'TCP', 'Lightweight publish/subscribe messaging for IoT devices.', 'Unencrypted and often unauthenticated by default. Use port 8883 for MQTT over TLS.'],
  [2049, 'NFS', 'TCP/UDP', 'Network File System — Unix file sharing.', 'Traditional NFS trusts client-supplied user IDs. Use NFSv4 with Kerberos, or keep it on a trusted network.'],
  [2375, 'Docker API (plain)', 'TCP', 'The Docker daemon REST API without TLS.', 'Exposing this is equivalent to handing out root on the host. It is one of the most scanned ports on the internet for exactly that reason. Use the Unix socket, or 2376 with client certificates.'],
  [2376, 'Docker API (TLS)', 'TCP', 'The Docker daemon API with TLS client certificate authentication.', 'Still grants full host control to whoever holds a certificate. Treat those certificates like root passwords.'],
  [3000, 'Node.js / dev server', 'TCP', 'The conventional development port for Node.js, Next.js, Rails and Grafana.', 'A development default, not a production one. Behind a reverse proxy in production.'],
  [3306, 'MySQL / MariaDB', 'TCP', 'The default MySQL and MariaDB port.', 'Bind to 127.0.0.1 unless a remote application genuinely needs it, and then restrict by source address. Internet-exposed MySQL is scanned constantly.'],
  [3389, 'RDP', 'TCP', 'Windows Remote Desktop.', 'A primary ransomware entry vector. Put it behind a VPN, require network level authentication, and never expose it directly.'],
  [4200, 'Angular dev server', 'TCP', 'The default port for `ng serve`.', 'Development only.'],
  [5000, 'Flask / dev server', 'TCP', 'Default for Flask, and for the .NET development server. Also AirPlay Receiver on macOS, which is why Flask often fails to bind there.', 'On macOS, disable AirPlay Receiver in System Settings or pick another port.'],
  [5173, 'Vite', 'TCP', 'The default Vite development server port.', 'Development only. Vite binds to localhost by default; `--host` exposes it to the network.'],
  [5432, 'PostgreSQL', 'TCP', 'The default PostgreSQL port.', 'Keep it on a private network. Configure `pg_hba.conf` deliberately — a permissive `host all all 0.0.0.0/0 md5` line is a common and serious mistake.'],
  [5672, 'AMQP / RabbitMQ', 'TCP', 'Message broker protocol.', 'The default guest/guest account only works from localhost, but people disable that. Do not.'],
  [6379, 'Redis', 'TCP', 'The default Redis port.', 'Redis historically had no authentication and binds to all interfaces if misconfigured. Exposed instances are routinely used to plant SSH keys and cryptominers. Bind to localhost and set a password.'],
  [8000, 'HTTP alternate', 'TCP', 'A common development port — Django, Python `http.server`, many others.', 'Development convention only.'],
  [8080, 'HTTP alternate', 'TCP', 'The most common alternative HTTP port: Tomcat, Jenkins, proxies, and anything that cannot bind to 80 without root.', 'Frequently left open by accident. Anything on 8080 is scanned as thoroughly as anything on 80.'],
  [8443, 'HTTPS alternate', 'TCP', 'The unprivileged counterpart to 443, used by Tomcat and many appliances.', 'Same exposure as 443 — treat it identically.'],
  [8883, 'MQTT over TLS', 'TCP', 'Encrypted MQTT.', 'Use this rather than 1883 for anything crossing a network you do not control.'],
  [9000, 'PHP-FPM / SonarQube / Portainer', 'TCP', 'Shared by several services — most commonly PHP-FPM, but also SonarQube and Portainer.', 'PHP-FPM on 9000 must never be internet-reachable; it executes arbitrary scripts by design.'],
  [9090, 'Prometheus', 'TCP', 'The Prometheus metrics server and web UI.', 'Prometheus has no authentication of its own. Put it behind a reverse proxy that does.'],
  [9200, 'Elasticsearch', 'TCP', 'The Elasticsearch HTTP API.', 'Unauthenticated Elasticsearch clusters have caused some of the largest data leaks on record. Enable security and bind privately.'],
  [11211, 'Memcached', 'TCP/UDP', 'Distributed memory cache.', 'The UDP interface was used for record-breaking amplification attacks in 2018. Disable UDP and bind to localhost.'],
  [27017, 'MongoDB', 'TCP', 'The default MongoDB port.', 'Older versions bound to all interfaces with no authentication, which led to mass ransoming of exposed databases. Enable auth and bind privately.'],
];

const RANGES = [
  ['0–1023', 'Well-known ports', 'Assigned by IANA to standard services. On Unix, binding to these requires root or the <code>CAP_NET_BIND_SERVICE</code> capability — which is why development servers use 3000 or 8080 instead.'],
  ['1024–49151', 'Registered ports', 'Registered with IANA for specific applications, but usable by ordinary user processes. Most database and application servers live here.'],
  ['49152–65535', 'Dynamic / ephemeral ports', 'Allocated automatically for the client side of outbound connections. Running out of them is a real failure mode on busy proxies.'],
];

export default async function () {
  const pages = [];

  for (const [port, service, proto, what, security] of P) {
    const related = P.filter((x) => x[0] !== port).slice(0, 18);

    const FAQ = faq([
      { q: `What is port ${port} used for?`, a: what },
      { q: `Is it safe to open port ${port}?`, a: security },
      { q: `How do I check if port ${port} is open?`,
        a: `Locally, <code>sudo lsof -i :${port}</code> on macOS or Linux, or <code>netstat -ano | findstr :${port}</code> on Windows. From outside, <code>nc -zv host ${port}</code> tells you whether anything answers.` },
      { q: `Why do I get "address already in use" on port ${port}?`,
        a: `Another process is bound to it — often a previous run of your own program that did not exit cleanly. Find it with <code>lsof -ti :${port}</code> and stop it, or configure your application to use a different port.` },
      { q: 'Can I change the port this service uses?',
        a: "Almost always yes, in the service's configuration. Moving off a default port reduces automated scan noise, but it is obfuscation rather than security — a real attacker scans all 65,535." },
    ]);
    pages.push({
      path: `/port/${port}/`,
      title: `Port ${port} — ${service} (${proto})`,
      desc: `Port ${port} is used by ${service} over ${proto}. What runs on it, what it is for, the security considerations, and how to check whether something is listening.`,
      h1: `Port ${port} — ${service}`,
      crumbs: [
        { name: 'Port numbers', path: '/port/' },
        { name: `Port ${port}`, path: `/port/${port}/` },
      ],
      jsonld: [FAQ.schema],
      body: `<p><span class="pill">${proto}</span> <span class="pill">${port < 1024 ? 'well-known' : port < 49152 ? 'registered' : 'dynamic'}</span></p>
<h2>What runs on port ${port}</h2>
<p>${what}</p>
<h2>Security considerations</h2>
<p>${security}</p>
<h2>Checking whether something is listening</h2>
<pre><code># Linux / macOS — what is bound to the port
sudo lsof -i :${port}
sudo ss -lntp | grep :${port}

# Windows
netstat -ano | findstr :${port}
Get-NetTCPConnection -LocalPort ${port}

# is it reachable from outside?
nc -zv example.com ${port}
curl -v telnet://example.com:${port}</code></pre>
<h2>Freeing the port</h2>
<pre><code># find the process, then stop it
sudo lsof -ti :${port} | xargs kill        # Linux / macOS
netstat -ano | findstr :${port}            # note the PID, then:
taskkill /PID &lt;pid&gt; /F                    # Windows</code></pre>
<h2>Should this port be open to the internet?</h2>
<p>${[23, 445, 2375, 3306, 3389, 5432, 6379, 9200, 27017, 11211, 1433, 1521, 2049, 9000].includes(port)
  ? `<strong>No.</strong> Port ${port} should never be reachable from a public address. Bind it to localhost or a private network, and reach it through a VPN or bastion host if remote access is genuinely needed. Internet-wide scanners find newly exposed instances of this service within minutes.`
  : [80, 443, 8080, 8443].includes(port)
  ? `<strong>Yes</strong> — that is what it is for. Make sure whatever is listening is something you intend to expose, and that ${port === 80 ? 'it does nothing but redirect to HTTPS' : 'TLS is configured properly'}.`
  : [22].includes(port)
  ? `<strong>Only with care.</strong> SSH is designed to be exposed, but it is also the most brute-forced port on the internet. Keys only, no password authentication, and rate limiting.`
  : [25, 587, 465, 993, 995, 143, 110].includes(port)
  ? `<strong>Only on a mail server.</strong> If this port is open on something that is not intentionally handling mail, you may be running an open relay — which will get the IP blacklisted quickly.`
  : `<strong>Usually not.</strong> Expose it only if a specific external client needs it, and restrict by source address where you can.`}</p>

<h2>Quick reference</h2>
<table><tbody>
<tr><td>Port</td><td class="out">${port}</td></tr>
<tr><td>Protocol</td><td>${proto}</td></tr>
<tr><td>Service</td><td>${esc(service)}</td></tr>
<tr><td>Range</td><td>${port < 1024 ? 'Well-known (0–1023) — binding requires root on Unix' : port < 49152 ? 'Registered (1024–49151) — any user process may bind' : 'Dynamic (49152–65535) — normally assigned automatically'}</td></tr>
</tbody></table>

${FAQ.html}

<h2>Other common ports</h2>
<ul class="linklist">${related.map((x) => `<li><a href="/port/${x[0]}/">Port ${x[0]} — ${esc(x[1])}</a></li>`).join('')}</ul>
<p><a href="/port/">All port numbers</a></p>`,
    });
  }

  pages.push({
    path: '/port/',
    title: `Common Port Numbers — Reference with Security Notes`,
    desc: `A reference of the network ports you actually meet: what service uses each one, what it is for, the security considerations, and how to check what is listening.`,
    h1: 'Common port numbers',
    crumbs: [{ name: 'Port numbers', path: '/port/' }],
    body: `<p class="muted">The ports you actually run into, with what each is for and why it matters if one is exposed.</p>
<table><thead><tr><th style="width:6em">Port</th><th>Service</th><th>Protocol</th></tr></thead><tbody>
${P.map(([port, service, proto]) => `<tr><td><a href="/port/${port}/"><strong>${port}</strong></a></td><td><a href="/port/${port}/">${esc(service)}</a></td><td>${proto}</td></tr>`).join('')}
</tbody></table>
<h2>The three port ranges</h2>
<table><thead><tr><th>Range</th><th>Name</th><th>What it means</th></tr></thead><tbody>
${RANGES.map(([r, n, d]) => `<tr><td><code>${r}</code></td><td>${n}</td><td>${d}</td></tr>`).join('')}
</tbody></table>
<h2>The ports that should never face the internet</h2>
<p>If a scan finds any of these open on a public address, treat it as an incident rather than a configuration preference: <a href="/port/23/">23 (Telnet)</a>, <a href="/port/445/">445 (SMB)</a>, <a href="/port/2375/">2375 (Docker API)</a>, <a href="/port/3306/">3306 (MySQL)</a>, <a href="/port/3389/">3389 (RDP)</a>, <a href="/port/5432/">5432 (PostgreSQL)</a>, <a href="/port/6379/">6379 (Redis)</a>, <a href="/port/9200/">9200 (Elasticsearch)</a> and <a href="/port/27017/">27017 (MongoDB)</a>. Each of these has been the root cause of large, well-documented breaches.</p>
<h2>Why development servers use 3000 and 8080</h2>
<p>On Unix-like systems, binding to a port below 1024 requires root. Rather than run a development server as root, the convention settled on high ports — 3000, 4200, 5173, 8000, 8080 — which any user process can bind. In production a reverse proxy holds 80 and 443 and forwards to the application on its high port.</p>`,
  });

  return pages;
}
