// The wish wall's back end: the one place on the site that stores anything a
// visitor sends. Everything else is static and runs in the browser.
//
//   GET  /api/wishes                         -> { wishes: [...], hearts }
//   POST /api/wishes { op:'add', text, color, website }  -> { wish }
//   POST /api/wishes { op:'vote', id }                   -> { id, votes }
//
// Storage is the D1 database bound as DB. The tables create themselves on the
// first request, so a fresh database needs no migration step.
//
// A visitor is identified only by a salted SHA-256 of their IP address, used
// for rate limits and for one heart per wish per visitor. The salt comes from
// the WISH_SALT secret; without it the hash could be reversed by trying every
// IPv4 address against the public constant below.

const MAX_LEN = 80;
const MIN_LEN = 3;
const COLORS = 6;
const LIMITS = { add: [5, 600], vote: [40, 600] }; // [count, seconds]

let ready = false;
async function init(db) {
  if (ready) return;
  await db.batch([
    db.prepare(`CREATE TABLE IF NOT EXISTS wishes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      text TEXT NOT NULL,
      norm TEXT NOT NULL,
      votes INTEGER NOT NULL DEFAULT 1,
      color INTEGER NOT NULL DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'open',
      hidden INTEGER NOT NULL DEFAULT 0,
      created INTEGER NOT NULL)`),
    db.prepare('CREATE INDEX IF NOT EXISTS wishes_norm ON wishes(norm)'),
    db.prepare('CREATE TABLE IF NOT EXISTS hearts (wish INTEGER NOT NULL, who TEXT NOT NULL, PRIMARY KEY (wish, who))'),
    db.prepare('CREATE TABLE IF NOT EXISTS hits (who TEXT NOT NULL, op TEXT NOT NULL, t INTEGER NOT NULL)'),
    db.prepare('CREATE INDEX IF NOT EXISTS hits_who ON hits(who, op, t)'),
  ]);
  ready = true;
}

const json = (body, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' },
  });

async function visitor(request, env) {
  const ip = request.headers.get('cf-connecting-ip') || '0.0.0.0';
  const data = new TextEncoder().encode(`${env.WISH_SALT || 'toolman-wish-wall'}|${ip}`);
  const buf = await crypto.subtle.digest('SHA-256', data);
  return [...new Uint8Array(buf)].slice(0, 12).map((b) => b.toString(16).padStart(2, '0')).join('');
}

async function limited(db, who, op) {
  const [max, win] = LIMITS[op];
  const now = Math.floor(Date.now() / 1000);
  const row = await db.prepare('SELECT COUNT(*) AS n FROM hits WHERE who = ? AND op = ? AND t > ?')
    .bind(who, op, now - win).first();
  if (row.n >= max) return true;
  await db.batch([
    db.prepare('INSERT INTO hits (who, op, t) VALUES (?, ?, ?)').bind(who, op, now),
    // Nothing older than a day is needed for any limit.
    db.prepare('DELETE FROM hits WHERE t < ?').bind(now - 86400),
  ]);
  return false;
}

// Collapse whitespace and strip control characters; the text is rendered with
// textContent on the page, so markup needs no escaping here.
const clean = (s) => String(s || '').replace(/\p{Cc}/gu, ' ').replace(/\s+/g, ' ').trim();
const normal = (s) => s.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, '');
const looksLikeSpam = (s) =>
  /https?:|www\.|\.(com|net|org|io|ru|cn|xyz|top|info|biz)\b|@\w+\.\w+/i.test(s) ||
  /(.)\1{7,}/.test(s);

function sameOrigin(request) {
  const origin = request.headers.get('origin');
  if (!origin) return true;
  try {
    return new URL(origin).host === new URL(request.url).host;
  } catch {
    return false;
  }
}

export async function onRequestGet({ env }) {
  if (!env.DB) return json({ error: 'unavailable' }, 503);
  await init(env.DB);
  const { results } = await env.DB.prepare(
    `SELECT id, text, votes, color, status, created FROM wishes
     WHERE hidden = 0 ORDER BY (status = 'done') DESC, votes DESC, id DESC LIMIT 300`
  ).all();
  const hearts = results.reduce((n, w) => n + w.votes, 0);
  return json({ wishes: results, hearts });
}

export async function onRequestPost({ request, env }) {
  if (!env.DB) return json({ error: 'unavailable' }, 503);
  if (!sameOrigin(request)) return json({ error: 'origin' }, 403);
  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: 'bad-json' }, 400);
  }
  await init(env.DB);
  const db = env.DB;
  const who = await visitor(request, env);

  if (body.op === 'vote') {
    const id = Number(body.id);
    if (!Number.isInteger(id) || id < 1) return json({ error: 'bad-id' }, 400);
    if (await limited(db, who, 'vote')) return json({ error: 'slow-down' }, 429);
    const wish = await db.prepare('SELECT id FROM wishes WHERE id = ? AND hidden = 0').bind(id).first();
    if (!wish) return json({ error: 'not-found' }, 404);
    const ins = await db.prepare('INSERT OR IGNORE INTO hearts (wish, who) VALUES (?, ?)').bind(id, who).run();
    if (ins.meta.changes) await db.prepare('UPDATE wishes SET votes = votes + 1 WHERE id = ?').bind(id).run();
    const row = await db.prepare('SELECT votes FROM wishes WHERE id = ?').bind(id).first();
    return json({ id, votes: row.votes, counted: !!ins.meta.changes });
  }

  if (body.op === 'add') {
    // A form field no person can see; anything that fills it in is a bot.
    if (body.website) return json({ error: 'bot' }, 400);
    const text = clean(body.text);
    if ([...text].length < MIN_LEN) return json({ error: 'too-short' }, 400);
    if ([...text].length > MAX_LEN) return json({ error: 'too-long' }, 400);
    if (looksLikeSpam(text)) return json({ error: 'no-links' }, 400);
    const norm = normal(text);
    if (!norm) return json({ error: 'too-short' }, 400);
    // The same wish twice is one wish with two hearts, and costs what a heart does.
    const dup = await db.prepare('SELECT id, text, votes, color, status, created FROM wishes WHERE norm = ? AND hidden = 0').bind(norm).first();
    if (await limited(db, who, dup ? 'vote' : 'add')) return json({ error: 'slow-down' }, 429);
    if (dup) {
      const ins = await db.prepare('INSERT OR IGNORE INTO hearts (wish, who) VALUES (?, ?)').bind(dup.id, who).run();
      if (ins.meta.changes) {
        await db.prepare('UPDATE wishes SET votes = votes + 1 WHERE id = ?').bind(dup.id).run();
        dup.votes += 1;
      }
      return json({ wish: dup, merged: true });
    }

    const color = Math.abs(Math.floor(Number(body.color) || 0)) % COLORS;
    const created = Math.floor(Date.now() / 1000);
    const res = await db.prepare('INSERT INTO wishes (text, norm, votes, color, created) VALUES (?, ?, 1, ?, ?)')
      .bind(text, norm, color, created).run();
    const id = res.meta.last_row_id;
    await db.prepare('INSERT OR IGNORE INTO hearts (wish, who) VALUES (?, ?)').bind(id, who).run();
    return json({ wish: { id, text, votes: 1, color, status: 'open', created } }, 201);
  }

  return json({ error: 'bad-op' }, 400);
}
