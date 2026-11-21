import { readFileSync } from 'node:fs';
import { beforeAll, describe, expect, it } from 'vitest';

// Run against Cloud with a separately minted session; never keep credentials in the project.
const sessionFile = process.env['LOVABLE_PERMISSION_TEST_SESSION_FILE'];
describe.skipIf(!sessionFile)('Cloud sponsor column permissions', () => {
  let token = '';
  beforeAll(() => {
    if (!sessionFile) throw new Error('A minted test session is required');
    const saved = JSON.parse(readFileSync(sessionFile, 'utf8')) as { session: { access_token: string } };
    token = saved.session.access_token;
  });

  async function readColumns(columns: string) {
    return fetch(`${import.meta.env.VITE_SUPABASE_URL}/rest/v1/patrocinadores?select=${columns}&limit=1`, {
      headers: {
        apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
        Authorization: `Bearer ${token}`,
      },
    });
  }

  for (const column of ['telefono', 'horario', 'web']) {
    it(`allows authenticated reading of ${column}`, async () => {
      const response = await readColumns(`id,${column}`);
      expect(response.status).toBe(200);
      const rows = await response.json() as Record<string, unknown>[];
      expect(rows.length).toBeGreaterThan(0);
      expect(rows[0]).toHaveProperty(column);
    });
  }

  it('still denies reading the legacy PIN hash', async () => {
    const response = await readColumns('id,pin_hash');
    expect(response.status).toBe(403);
    const body = await response.json() as { code: string };
    expect(body.code).toBe('42501');
  });
});