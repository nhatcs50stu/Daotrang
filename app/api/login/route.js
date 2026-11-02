import { PASS, makeToken } from "@/lib/auth";
export async function POST(req) {
  const { role, password } = await req.json();
  if (!PASS[role] || PASS[role] !== password)
    return Response.json(
      { error: "Sai mật khẩu hoặc tài khoản" },
      { status: 401 },
    );
  const res = Response.json({ role });
  res.headers.append(
    "Set-Cookie",
    `role=${makeToken(role)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=2592000`,
  );
  return res;
}
export async function DELETE() {
  const res = Response.json({ role: "guest" });
  res.headers.append("Set-Cookie", "role=; Path=/; HttpOnly; Max-Age=0");
  return res;
}
