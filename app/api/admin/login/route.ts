import { NextRequest, NextResponse } from "next/server";
import { ADMIN_COOKIE, createSessionCookie, passwordMatches, readSession } from "@/lib/adminAuth";

/** Who is logged in (or 401) */
export async function GET(req: NextRequest) {
  const session = readSession(req);
  if (!session) return NextResponse.json({ error: "Not logged in" }, { status: 401 });
  return NextResponse.json(session);
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const name = String(body?.name || "").trim().slice(0, 60);
  const password = String(body?.password || "");
  if (!name) return NextResponse.json({ error: "Enter your name" }, { status: 400 });
  if (!passwordMatches(password)) {
    return NextResponse.json({ error: "Wrong password" }, { status: 401 });
  }
  const cookie = createSessionCookie(name);
  const res = NextResponse.json({ name });
  res.cookies.set(ADMIN_COOKIE, cookie.value, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: cookie.maxAge,
  });
  return res;
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(ADMIN_COOKIE, "", { path: "/", maxAge: 0 });
  return res;
}
