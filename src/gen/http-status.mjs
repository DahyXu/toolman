import { esc, faq } from '../layout.mjs';

// code, name, category, when it happens, how to fix / what to do
const CODES = [
  [100, 'Continue', '1xx', 'The client sent an <code>Expect: 100-continue</code> header and the server is telling it to go ahead and send the request body.', 'Nothing to fix — this is a normal handshake used to avoid uploading a large body that would be rejected anyway.'],
  [101, 'Switching Protocols', '1xx', 'The server is switching to the protocol the client asked for in the <code>Upgrade</code> header — almost always a WebSocket handshake.', 'Nothing to fix. If you expected a WebSocket connection and do not see a 101, check that a proxy in front of the app forwards the <code>Upgrade</code> and <code>Connection</code> headers.'],
  [103, 'Early Hints', '1xx', 'The server is sending <code>Link</code> headers so the browser can start preloading critical resources before the real response is ready.', 'Nothing to fix. Used well, it can measurably improve Largest Contentful Paint on slow backends.'],
  [200, 'OK', '2xx', 'The request succeeded. For GET the body contains the resource; for POST it contains the result of the action.', 'Nothing to fix — this is the normal success response.'],
  [201, 'Created', '2xx', 'The request succeeded and a new resource was created, usually by a POST or PUT.', 'Include a <code>Location</code> header pointing at the new resource. Many APIs return 200 where 201 would be more accurate.'],
  [202, 'Accepted', '2xx', 'The request was accepted for processing, but the work has not finished. Typical for jobs that run asynchronously.', 'Return something the client can poll — a job ID and a status URL — otherwise the caller has no way to learn the outcome.'],
  [204, 'No Content', '2xx', 'The request succeeded and there is deliberately no body to return. Common for DELETE and for PUT that returns nothing.', 'Do not send a body with a 204 — some clients will error. If you want to return the updated resource, use 200 instead.'],
  [206, 'Partial Content', '2xx', 'The server is returning only part of the resource because the client sent a <code>Range</code> header. Used by video players and download managers.', 'Nothing to fix. If range requests are failing, check that a proxy or CDN is not stripping <code>Range</code> and <code>Accept-Ranges</code>.'],
  [301, 'Moved Permanently', '3xx', 'The resource has a new permanent URL. Search engines transfer ranking signals to the target and update their index.', 'Use 301 for permanent moves — HTTP to HTTPS, www consolidation, changed URL structure. Browsers cache it aggressively, so a wrong 301 is painful to undo.'],
  [302, 'Found', '3xx', 'A temporary redirect. The original URL should still be used for future requests.', 'If the move is permanent, use 301 instead — a 302 tells search engines to keep indexing the old URL. For a temporary move where the method must not change, prefer 307.'],
  [303, 'See Other', '3xx', 'Redirects the client to fetch the result with GET, regardless of the original method. The classic POST-redirect-GET pattern.', 'Use it after a successful form POST so that a page refresh does not resubmit the form.'],
  [304, 'Not Modified', '3xx', 'The cached copy the client already has is still current, so no body is sent.', 'Nothing to fix — this is caching working correctly. If you never see 304s, check that you are sending <code>ETag</code> or <code>Last-Modified</code>.'],
  [307, 'Temporary Redirect', '3xx', 'Like 302, but guarantees the method and body are preserved. A POST stays a POST.', 'Prefer 307 over 302 for anything that is not a plain GET.'],
  [308, 'Permanent Redirect', '3xx', 'Like 301, but the method and body are preserved.', 'Use for permanent redirects of non-GET endpoints — an API that moved, for example.'],
  [400, 'Bad Request', '4xx', 'The server could not understand the request: malformed JSON, an invalid query parameter, a header that does not parse.', 'Check the request body actually parses, that required fields are present, and that <code>Content-Type</code> matches what you are sending. Return a body explaining which field was wrong — a bare 400 wastes everyone\'s time.'],
  [401, 'Unauthorized', '4xx', 'Authentication is required and either missing or invalid. Despite the name, this is about <em>authentication</em>, not permission.', 'Check the <code>Authorization</code> header is present and correctly formatted, and that the token has not expired. The server should reply with a <code>WWW-Authenticate</code> header saying which scheme it expects.'],
  [403, 'Forbidden', '4xx', 'The server understood the request and knows who you are, but you are not allowed to do this. Authentication will not help.', 'Check the account\'s roles or scopes. On static hosting, a 403 on a directory usually means directory listing is disabled or file permissions are wrong.'],
  [404, 'Not Found', '4xx', 'The server has no resource at this URL. It does not say whether the resource ever existed or ever will.', 'Check for a typo, a missing trailing slash, a case-sensitivity mismatch, or a route that was never registered. If the page moved, return a 301 to the new location instead of a 404 — that preserves search rankings and does not strand inbound links.'],
  [405, 'Method Not Allowed', '4xx', 'The URL exists but does not accept this HTTP method — a POST to a GET-only endpoint, for example.', 'Check the method. The response must include an <code>Allow</code> header listing what is accepted.'],
  [406, 'Not Acceptable', '4xx', 'The server cannot produce a response matching the client\'s <code>Accept</code> header.', 'Relax the <code>Accept</code> header, or add the requested representation on the server. Rare in practice — most servers ignore the header and return their default.'],
  [408, 'Request Timeout', '4xx', 'The client took too long to send the complete request and the server gave up waiting.', 'Usually a slow or dropped connection. Check for a large upload over a poor network, or a client that opened a connection and never sent anything.'],
  [409, 'Conflict', '4xx', 'The request conflicts with the current state — a duplicate unique key, or an edit based on a stale version.', 'Fetch the current state and retry, or implement optimistic concurrency with <code>ETag</code> and <code>If-Match</code>.'],
  [410, 'Gone', '4xx', 'The resource existed but has been deliberately and permanently removed.', 'Use 410 instead of 404 when you know content is gone for good — Google drops 410 URLs from the index faster than 404s.'],
  [413, 'Payload Too Large', '4xx', 'The request body exceeds a limit the server imposes.', 'Raise the limit (<code>client_max_body_size</code> in nginx, <code>upload_max_filesize</code> in PHP), or have the client upload directly to object storage with a pre-signed URL.'],
  [415, 'Unsupported Media Type', '4xx', 'The server does not accept the <code>Content-Type</code> the client sent.', 'The usual cause is a JSON body sent without <code>Content-Type: application/json</code>, or a form posted as JSON to an endpoint expecting <code>multipart/form-data</code>.'],
  [418, "I'm a Teapot", '4xx', 'Defined in a 1998 April Fools\' RFC for the Hyper Text Coffee Pot Control Protocol. It is a joke that several frameworks implement anyway.', 'Nothing to fix. Attempts to remove it from libraries have been resisted with unusual vigour.'],
  [422, 'Unprocessable Content', '4xx', 'The request is syntactically valid but semantically wrong — well-formed JSON where a field fails validation.', 'Return a body listing which fields failed and why. Many APIs use 400 for this; 422 is more precise when the syntax itself was fine.'],
  [429, 'Too Many Requests', '4xx', 'The client has been rate limited.', 'Back off and retry, honouring the <code>Retry-After</code> header. If you control the client, add exponential backoff with jitter — synchronised retries make the problem worse.'],
  [431, 'Request Header Fields Too Large', '4xx', 'The headers exceed the server\'s limit, usually because of oversized cookies.', 'Clear cookies for the domain, or stop storing large blobs in them. A JWT in a cookie is a common cause.'],
  [451, 'Unavailable For Legal Reasons', '4xx', 'The content is blocked for legal reasons — a court order, a takedown, a regional restriction.', 'Nothing technical to fix. The number is a deliberate reference to Ray Bradbury\'s <em>Fahrenheit 451</em>.'],
  [500, 'Internal Server Error', '5xx', 'The server hit an unhandled error. It is the catch-all for "something broke and we did not anticipate it".', 'Read the server logs — the status code itself tells you nothing. Common causes are an unhandled exception, a failed database connection, or a null dereference in a code path that was never tested.'],
  [501, 'Not Implemented', '5xx', 'The server does not support the functionality required to fulfil the request.', 'Usually means an HTTP method the server does not recognise at all. Check for a proxy sending an unusual method.'],
  [502, 'Bad Gateway', '5xx', 'A server acting as a proxy got an invalid response from the upstream server.', 'The application behind the proxy is down, crashed, or returned garbage. Check that the app is running and listening on the port nginx or the load balancer expects.'],
  [503, 'Service Unavailable', '5xx', 'The server is temporarily unable to handle the request — overloaded, or down for maintenance.', 'Send a <code>Retry-After</code> header so clients and crawlers know when to come back. Google treats a short 503 as temporary and will not drop the page from its index.'],
  [504, 'Gateway Timeout', '5xx', 'A proxy did not get a response from the upstream server in time.', 'The backend is too slow. Profile the slow endpoint, add a database index, or raise the proxy timeout — but a timeout is a symptom, and raising it usually just moves the problem.'],
  [505, 'HTTP Version Not Supported', '5xx', 'The server does not support the HTTP protocol version the client used.', 'Rare. Usually a misconfigured client or an old proxy speaking HTTP/0.9.'],
  [507, 'Insufficient Storage', '5xx', 'The server cannot store the representation needed to complete the request.', 'Check disk space. A full disk also causes surprising 500s elsewhere, since logs and temp files stop writing.'],
  [511, 'Network Authentication Required', '5xx', 'The client must authenticate to get network access — a captive portal on hotel or airport Wi-Fi.', 'Open a browser and sign in to the network. Nothing to fix on the server.'],
];

const CATS = {
  '1xx': ['Informational', 'The request was received and the process is continuing. These are rarely seen by application code.'],
  '2xx': ['Success', 'The request was received, understood and accepted.'],
  '3xx': ['Redirection', 'Further action is needed to complete the request — usually following a redirect.'],
  '4xx': ['Client Error', 'The request contains something the server will not or cannot process. The fix is normally on the client side.'],
  '5xx': ['Server Error', 'The server failed to fulfil an apparently valid request. The fix is on the server side.'],
};

export default async function () {
  const pages = [];

  for (const [code, name, cat, when, fix] of CODES) {
    const related = CODES.filter((c) => c[2] === cat && c[0] !== code).slice(0, 12);

    const FAQ = faq([
      { q: `What does HTTP ${code} mean?`, a: when },
      { q: code >= 400
          ? `How do I fix a ${code} error?`
          : code >= 300
            ? `When should I use ${code}?`
            : `What should I do about a ${code}?`, a: fix },
      { q: cat === '4xx' || cat === '5xx'
          ? `Is ${code} a client or server problem?`
          : `Does ${code} mean something went wrong?`,
        a: cat === '4xx' ? 'A client problem by definition — the request needs to change. That said, a 4xx can still be the server\u2019s fault if it is misconfigured and rejecting valid requests.'
          : cat === '5xx' ? 'A server problem. The request was valid; the server failed to fulfil it. Nothing the client changes will help.'
          : cat === '3xx' ? 'Neither — it is an instruction to look somewhere else, and clients normally follow it automatically.'
          : 'Neither — it indicates success or progress.' },
    ]);
    const [catName, catDesc] = CATS[cat];
    pages.push({
      path: `/http/${code}/`,
      title: `HTTP ${code} ${name} — What It Means and How to Fix It | Toolman`,
      desc: `HTTP ${code} ${name}: what the status code means, when a server returns it, and how to fix it. Part of the ${cat} ${catName.toLowerCase()} family.`,
      h1: `HTTP ${code} — ${name}`,
      crumbs: [
        { name: 'HTTP status codes', path: '/http/' },
        { name: `${code} ${name}`, path: `/http/${code}/` },
      ],
      jsonld: [FAQ.schema],
      body: `<p class="big" style="font-size:1.15rem"><span class="pill">${cat} ${catName}</span></p>
<h2>What it means</h2>
<p>${when}</p>
<h2>What to do about it</h2>
<p>${fix}</p>
<h2>Where it sits</h2>
<p>${code} belongs to the <strong>${cat}</strong> family: ${catDesc}</p>
<pre><code>HTTP/1.1 ${code} ${name}</code></pre>
<h2>Checking it yourself</h2>
<pre><code># see the status code and headers only
curl -sI https://example.com/path

# follow redirects and print each hop
curl -sIL -o /dev/null -w "%{http_code} %{url_effective}\\n" https://example.com/path

# JavaScript
const r = await fetch(url);
console.log(r.status, r.statusText);</code></pre>
<h2>How this code behaves</h2>
<table><tbody>
<tr><td>Cacheable by default</td><td>${[200, 203, 204, 206, 300, 301, 308, 404, 405, 410, 414, 501].includes(code) ? 'Yes — per RFC 9110, this status is cacheable unless headers say otherwise.' : 'No — caches must not store this response unless explicit cache headers permit it.'}</td></tr>
<tr><td>Safe to retry</td><td>${cat === '5xx' || code === 429 || code === 408 ? 'Yes, with backoff. This is a transient condition; retrying the same request is reasonable.' : cat === '4xx' ? 'No. Retrying an identical request will produce the same result — the request itself must change.' : 'Not applicable.'}</td></tr>
<tr><td>Effect on search indexing</td><td>${code === 404 ? 'Google drops the URL from its index after repeated 404s, but slowly — weeks rather than days.'
  : code === 410 ? 'Google removes the URL faster than for a 404, because 410 asserts the removal is deliberate.'
  : code === 301 ? 'Ranking signals transfer to the target URL. This is the correct status for a permanent move.'
  : code === 302 ? 'Google keeps indexing the original URL and does not transfer ranking signals. Use 301 for permanent moves.'
  : code === 503 ? 'Treated as temporary. A short 503 with a Retry-After header will not cost you your ranking; a long one will.'
  : code === 200 ? 'Normal — the page is eligible for indexing.'
  : cat === '5xx' ? 'Repeated server errors reduce crawl rate and eventually drop pages from the index.'
  : 'No direct effect.'}</td></tr>
</tbody></table>

<h2>Returning ${code} correctly</h2>
<pre><code># nginx
return ${code};

# Express
res.status(${code})${[204, 304].includes(code) ? '.end()' : ".json({ error: '" + name + "' })"};

# Go
w.WriteHeader(${code})

# Python (Flask)
return ${[204, 304].includes(code) ? "'', " + code : "jsonify(error='" + name + "'), " + code};</code></pre>

${FAQ.html}

<h2>Other ${cat} codes</h2>
<ul class="linklist">${related.map((c) => `<li><a href="/http/${c[0]}/">${c[0]} ${esc(c[1])}</a></li>`).join('')}</ul>
<p><a href="/http/">All HTTP status codes</a></p>`,
    });
  }

  // hub
  const byCat = {};
  for (const c of CODES) (byCat[c[2]] ||= []).push(c);

  pages.push({
    path: '/http/',
    title: `HTTP Status Codes — Complete Reference with Fixes | Toolman`,
    desc: `Every HTTP status code explained: what it means, when a server returns it and how to fix it. Covers ${CODES.length} codes across the 1xx to 5xx families.`,
    h1: 'HTTP status codes',
    crumbs: [{ name: 'HTTP status codes', path: '/http/' }],
    body: `<p class="muted">Every status code, what triggers it, and what to actually do about it — not just the one-line definition from the spec.</p>
${Object.entries(byCat).map(([cat, list]) => {
      const [catName, catDesc] = CATS[cat];
      return `<h2>${cat} — ${catName}</h2><p class="muted">${catDesc}</p>
<table><thead><tr><th style="width:5em">Code</th><th>Name</th><th>Meaning</th></tr></thead><tbody>
${list.map(([code, name, , when]) => `<tr><td><a href="/http/${code}/"><strong>${code}</strong></a></td><td><a href="/http/${code}/">${esc(name)}</a></td><td>${when.replace(/<[^>]+>/g, '').split('.')[0]}.</td></tr>`).join('')}
</tbody></table>`;
    }).join('')}
<h2>The three you will actually debug</h2>
<ul>
<li><strong>404 vs 410.</strong> 404 means "not here"; 410 means "gone deliberately". Search engines drop 410s from the index much faster.</li>
<li><strong>401 vs 403.</strong> 401 is "I do not know who you are"; 403 is "I know who you are and the answer is no". Sending 401 when you mean 403 sends clients into a pointless re-authentication loop.</li>
<li><strong>502 vs 504.</strong> 502 means the upstream answered with garbage or refused the connection; 504 means it never answered at all. The first points at a crashed process, the second at a slow one.</li>
</ul>`,
  });

  return pages;
}
