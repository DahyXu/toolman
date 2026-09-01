#!/usr/bin/env node
/**
 * Cloudflare helper: create the Pages project, attach custom domains,
 * manage DNS records and read zone info.
 *
 * Requires CLOUDFLARE_API_TOKEN and CLOUDFLARE_ACCOUNT_ID in the environment.
 *
 *   node scripts/cf.mjs whoami
 *   node scripts/cf.mjs setup            # project + domains + DNS
 *   node scripts/cf.mjs dns-list
 *   node scripts/cf.mjs dns-txt <name> <value>
 *   node scripts/cf.mjs purge
 */
const TOKEN = process.env.CLOUDFLARE_API_TOKEN;
const ACCOUNT = process.env.CLOUDFLARE_ACCOUNT_ID;
const DOMAIN = process.env.TOOLMAN_DOMAIN || 'toolman.top';
const PROJECT = process.env.TOOLMAN_PROJECT || 'toolman';

if (!TOKEN) {
  console.error('CLOUDFLARE_API_TOKEN is not set.');
  process.exit(1);
}

const API = 'https://api.cloudflare.com/client/v4';

async function cf(path, init = {}) {
  const r = await fetch(API + path, {
    ...init,
    headers: {
      Authorization: `Bearer ${TOKEN}`,
      'Content-Type': 'application/json',
      ...(init.headers || {}),
    },
  });
  const j = await r.json().catch(() => ({}));
  return { ok: r.ok && j.success !== false, status: r.status, json: j };
}

const errs = (j) => (j.errors || []).map((e) => `${e.code}: ${e.message}`).join('; ') || JSON.stringify(j).slice(0, 300);

async function zoneId() {
  const r = await cf(`/zones?name=${DOMAIN}`);
  if (!r.ok || !r.json.result?.length) throw new Error(`Zone ${DOMAIN} not found — ${errs(r.json)}`);
  return r.json.result[0].id;
}

const cmds = {
  async whoami() {
    const t = await cf('/user/tokens/verify');
    console.log('token:', t.ok ? '✓ valid' : '✗ ' + errs(t.json));
    if (ACCOUNT) {
      const a = await cf(`/accounts/${ACCOUNT}`);
      console.log('account:', a.ok ? `✓ ${a.json.result.name}` : '✗ ' + errs(a.json));
    } else {
      const a = await cf('/accounts');
      console.log('accounts visible:', a.ok ? a.json.result.map((x) => `${x.name} (${x.id})`).join(', ') : '✗ ' + errs(a.json));
    }
    try {
      const z = await zoneId();
      console.log(`zone ${DOMAIN}:`, '✓', z);
    } catch (e) {
      console.log(`zone ${DOMAIN}:`, '✗', e.message);
    }
  },

  async createProject() {
    const exists = await cf(`/accounts/${ACCOUNT}/pages/projects/${PROJECT}`);
    if (exists.ok) { console.log(`project ${PROJECT}: already exists`); return; }
    const r = await cf(`/accounts/${ACCOUNT}/pages/projects`, {
      method: 'POST',
      body: JSON.stringify({ name: PROJECT, production_branch: 'main' }),
    });
    console.log(`project ${PROJECT}:`, r.ok ? '✓ created' : '✗ ' + errs(r.json));
  },

  async addDomain(host = DOMAIN) {
    const r = await cf(`/accounts/${ACCOUNT}/pages/projects/${PROJECT}/domains`, {
      method: 'POST',
      body: JSON.stringify({ name: host }),
    });
    const already = (r.json.errors || []).some((e) => /already/i.test(e.message || ''));
    console.log(`domain ${host}:`, r.ok ? '✓ attached' : already ? '· already attached' : '✗ ' + errs(r.json));
  },

  async dnsList() {
    const z = await zoneId();
    const r = await cf(`/zones/${z}/dns_records?per_page=100`);
    if (!r.ok) return console.error('✗ ' + errs(r.json));
    for (const d of r.json.result) {
      console.log(`${d.type.padEnd(6)} ${d.name.padEnd(28)} ${String(d.content).slice(0, 60)} ${d.proxied ? '(proxied)' : ''}`);
    }
  },

  async dnsUpsert(type, name, content, proxied = false) {
    const z = await zoneId();
    const full = name === '@' ? DOMAIN : name.endsWith(DOMAIN) ? name : `${name}.${DOMAIN}`;
    const list = await cf(`/zones/${z}/dns_records?type=${type}&name=${full}`);
    const existing = list.json.result?.[0];
    const body = JSON.stringify({ type, name: full, content, ttl: 1, proxied });
    const r = existing
      ? await cf(`/zones/${z}/dns_records/${existing.id}`, { method: 'PUT', body })
      : await cf(`/zones/${z}/dns_records`, { method: 'POST', body });
    console.log(`${type} ${full}:`, r.ok ? (existing ? '✓ updated' : '✓ created') : '✗ ' + errs(r.json));
    return r.ok;
  },

  async dnsTxt(name, value) {
    if (!name || !value) { console.error('usage: dns-txt <name|@> <value>'); process.exit(1); }
    await cmds.dnsUpsert('TXT', name, value);
  },

  async setup() {
    await cmds.whoami();
    console.log('---');
    await cmds.createProject();
    await cmds.addDomain(DOMAIN);
    await cmds.addDomain(`www.${DOMAIN}`);
    console.log('---');
    // Pages custom domains resolve through CNAMEs to the pages.dev host.
    await cmds.dnsUpsert('CNAME', '@', `${PROJECT}.pages.dev`, true);
    await cmds.dnsUpsert('CNAME', 'www', `${PROJECT}.pages.dev`, true);
    console.log('---');
    await cmds.dnsList();
  },

  async purge() {
    const z = await zoneId();
    const r = await cf(`/zones/${z}/purge_cache`, { method: 'POST', body: JSON.stringify({ purge_everything: true }) });
    console.log('purge:', r.ok ? '✓' : '✗ ' + errs(r.json));
  },
};

const [, , cmd, ...args] = process.argv;
const map = {
  whoami: cmds.whoami, setup: cmds.setup, 'create-project': cmds.createProject,
  'add-domain': () => cmds.addDomain(args[0]), 'dns-list': cmds.dnsList,
  'dns-txt': () => cmds.dnsTxt(args[0], args[1]), purge: cmds.purge,
};
const fn = map[cmd];
if (!fn) {
  console.log('commands: whoami | setup | create-project | add-domain <host> | dns-list | dns-txt <name> <value> | purge');
  process.exit(1);
}
fn().catch((e) => { console.error('✗', e.message); process.exit(1); });
