import fs from 'fs/promises';
import path from 'path';
// Có SUPABASE_URL + SUPABASE_SERVICE_KEY -> lưu trên Supabase (bảng "kv"). Không có -> lưu file data/db.json như cũ.
const FILE = path.join(process.cwd(), 'data', 'db.json');
const URL_ = process.env.SUPABASE_URL, KEY = process.env.SUPABASE_SERVICE_KEY;
const EMPTY = { journey: [], members: [], attendance: {}, reports: [], history: '', elders: '', places: '', sutras: '', contact: '', quote: '', goals: '' };
const H = { apikey: KEY, Authorization: 'Bearer ' + KEY, 'Content-Type': 'application/json' };

export async function readDb() {
  if (URL_ && KEY) {
    const r = await fetch(`${URL_}/rest/v1/kv?select=key,value`, { headers: H, cache: 'no-store' });
    if (!r.ok) throw new Error('Supabase: ' + (await r.text()));
    const out = { ...EMPTY };
    for (const row of await r.json()) out[row.key] = row.value;
    return out;
  }
  try { return { ...EMPTY, ...JSON.parse(await fs.readFile(FILE, 'utf8')) }; } catch { return EMPTY; }
}

export async function writeKey(key, value) {
  if (URL_ && KEY) {
    const r = await fetch(`${URL_}/rest/v1/kv?on_conflict=key`, {
      method: 'POST', headers: { ...H, Prefer: 'resolution=merge-duplicates' }, body: JSON.stringify({ key, value }),
    });
    if (!r.ok) throw new Error('Supabase: ' + (await r.text()));
    return;
  }
  const db = await readDb(); db[key] = value;
  await fs.mkdir(path.dirname(FILE), { recursive: true });
  await fs.writeFile(FILE, JSON.stringify(db, null, 2));
}
