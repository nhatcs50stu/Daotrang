import fs from 'fs/promises';
import path from 'path';
import { getRole } from '@/lib/auth';
// Có Supabase -> ảnh lưu ở Storage (bucket "uploads"). Không có -> lưu thư mục data/uploads như cũ.
const DIR = path.join(process.cwd(), 'data', 'uploads');
const URL_ = process.env.SUPABASE_URL, KEY = process.env.SUPABASE_SERVICE_KEY;
export async function POST(req) {
  if (!['admin', 'member'].includes(await getRole())) return Response.json({ error: 'Cần đăng nhập' }, { status: 403 });
  const f = (await req.formData()).get('file');
  const name = Date.now() + '-' + f.name.replace(/[^\w.-]/g, '_');
  const buf = Buffer.from(await f.arrayBuffer());
  if (URL_ && KEY) {
    const r = await fetch(`${URL_}/storage/v1/object/uploads/${name}`, {
      method: 'POST', headers: { apikey: KEY, Authorization: 'Bearer ' + KEY, 'Content-Type': f.type || 'application/octet-stream' }, body: buf,
    });
    if (!r.ok) return Response.json({ error: await r.text() }, { status: 500 });
    return Response.json({ url: `${URL_}/storage/v1/object/public/uploads/${name}` });
  }
  await fs.mkdir(DIR, { recursive: true });
  await fs.writeFile(path.join(DIR, name), buf);
  return Response.json({ url: '/api/upload?f=' + name });
}
export async function GET(req) {
  const f = path.basename(new URL(req.url).searchParams.get('f') || '');
  try { return new Response(await fs.readFile(path.join(DIR, f))); } catch { return new Response('', { status: 404 }); }
}
