import crypto from 'crypto';
import { cookies } from 'next/headers';
const SECRET = process.env.SECRET || 'dev-secret';
const sign = (r) => crypto.createHmac('sha256', SECRET).update(r).digest('hex');
export const PASS = { admin: process.env.ADMIN_PASSWORD || 'admin123', member: process.env.MEMBER_PASSWORD || 'thanhvien123' };
export const makeToken = (role) => role + '.' + sign(role);
// Quyền: admin sửa tất cả; member chỉ sửa Phần 2; guest chỉ xem
export const WRITABLE = {
  admin: ['journey', 'members', 'attendance', 'reports', 'history', 'elders', 'places', 'sutras', 'contact', 'quote', 'goals'],
  member: ['members', 'attendance', 'reports', 'history', 'elders', 'places', 'sutras'],
  guest: [],
};
export async function getRole() {
  const c = (await cookies()).get('role')?.value || '';
  const [r, s] = c.split('.');
  return s && PASS[r] && sign(r) === s ? r : 'guest';
}
