import { readDb, writeKey } from '@/lib/db';
import { getRole, WRITABLE } from '@/lib/auth';
export const dynamic = 'force-dynamic';
export async function GET() {
  return Response.json({ role: await getRole(), db: await readDb() });
}
export async function PUT(req) {
  const role = await getRole();
  const { key, value } = await req.json();
  if (!WRITABLE[role].includes(key)) return Response.json({ error: 'Không đủ quyền' }, { status: 403 });
  await writeKey(key, value);
  return Response.json({ ok: true });
}
