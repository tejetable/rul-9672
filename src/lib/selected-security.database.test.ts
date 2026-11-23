import { readFileSync } from 'node:fs';
import { beforeAll, afterAll, describe, it, expect } from 'vitest';

// Opt-in integration checks; session files stay outside the project.
const dir = process.env['SELECTED_SECURITY_SESSION_DIR'];
describe.skipIf(!dir)('selected league and lineup read protections', () => {
  const tokens: Record<string, string> = {};
  const url = import.meta.env['VITE_SUPABASE_URL'];
  const key = import.meta.env['VITE_SUPABASE_PUBLISHABLE_KEY'];
  let matchId = '';
  let publishedPath = '';
  let draftPath = '';
  const headers = (account: string) => ({
    apikey: key,
    ...(tokens[account] ? { Authorization: `Bearer ${tokens[account]}` } : {}),
  });
  async function request(account: string, path: string, body?: unknown, method = body === undefined ? 'GET' : 'POST') {
    const response = await fetch(`${url}${path}`, {
      method,
      headers: { ...headers(account), 'Content-Type': 'application/json', Prefer: 'return=representation' },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });
    const text = await response.text();
    return { ok: response.ok, data: text ? JSON.parse(text) : null };
  }
  const rest = (account: string, path: string, body?: unknown, method?: string) =>
    request(account, `/rest/v1/${path}`, body, method);
  const sign = (account: string, path: string) =>
    request(account, `/storage/v1/object/sign/piezas-convocatoria/${path}`, { expiresIn: 60 });

  beforeAll(async () => {
    if (!dir) throw new Error('Missing authorized verification sessions');
    for (const account of ['admin', 'member', 'business', 'directiva', 'unrelated']) {
      tokens[account] = JSON.parse(readFileSync(`${dir}/${account}-session.json`, 'utf8')).session.access_token;
      expect((await request(account, '/auth/v1/user')).ok).toBe(true);
    }
    expect((await rest('admin', 'rpc/is_super_admin', {})).data).toBe(true);
    expect((await rest('unrelated', 'usuario_roles?select=id&activo=eq.true')).data).toEqual([]);

    // Never modify an existing match or lineup: fixtures are removed below.
    const match = await rest('admin', 'partidos', {
      rival: 'Temporary security verification', lugar: 'Verification', es_local: true,
    });
    expect(match.ok).toBe(true);
    const row = match.data?.[0];
    if (!row?.id) throw new Error('Fixture match was not created');
    matchId = row.id;
    publishedPath = `${matchId}/published.png`;
    draftPath = `${matchId}/draft.png`;
    for (const path of [publishedPath, draftPath]) {
      const uploaded = await fetch(`${url}/storage/v1/object/piezas-convocatoria/${path}`, {
        method: 'POST', headers: { ...headers('admin'), 'Content-Type': 'image/png' },
        body: Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jBz8AAAAASUVORK5CYII=', 'base64'),
      });
      expect(uploaded.ok).toBe(true);
    }
    expect((await rest('admin', 'convocatorias', {
      partido_id: matchId, jugadores: [], imagen_url: publishedPath, publicada: true,
    })).ok).toBe(true);
  }, 30000);

  afterAll(async () => {
    if (!matchId) return;
    expect((await request('admin', '/storage/v1/object/piezas-convocatoria', {
      prefixes: [publishedPath, draftPath],
    }, 'DELETE')).ok).toBe(true);
    expect((await rest('admin', `convocatorias?partido_id=eq.${matchId}`, undefined, 'DELETE')).ok).toBe(true);
    expect((await rest('admin', `partidos?id=eq.${matchId}`, undefined, 'DELETE')).ok).toBe(true);
  }, 30000);

  it.each(['member', 'business', 'directiva', 'admin'])('retains player and sanction reads for active %s', async (account) => {
    for (const table of ['jugadores', 'liga_sanciones']) {
      const result = await rest(account, `${table}?select=id&limit=1`);
      expect(result.ok).toBe(true);
      expect(result.data).toHaveLength(1);
    }
  });

  it.each(['unrelated', 'anon'])('denies player and sanction records to %s', async (account) => {
    for (const table of ['jugadores', 'liga_sanciones']) {
      const result = await rest(account, `${table}?select=id`);
      expect(!result.ok || (Array.isArray(result.data) && result.data.length === 0)).toBe(true);
    }
  });

  it.each(['member', 'business'])('lets %s download published lineups but not drafts', async (account) => {
    const result = await sign(account, publishedPath);
    expect(result.ok).toBe(true);
    const signed = result.data?.signedURL;
    if (typeof signed !== 'string') throw new Error('No signed download URL');
    const downloaded = await fetch(`${url}/storage/v1${signed}`);
    expect(downloaded.ok).toBe(true);
    expect((await downloaded.arrayBuffer()).byteLength).toBeGreaterThan(0);
    expect((await sign(account, draftPath)).ok).toBe(false);
  });

  it.each(['admin', 'directiva'])('retains board draft review for %s', async (account) => {
    expect((await sign(account, draftPath)).ok).toBe(true);
  });

  it.each(['unrelated', 'anon'])('denies both lineup downloads to %s', async (account) => {
    expect((await sign(account, publishedPath)).ok).toBe(false);
    expect((await sign(account, draftPath)).ok).toBe(false);
  });
});