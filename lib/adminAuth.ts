import { createHmac, timingSafeEqual } from "crypto";
import { NextRequest } from "next/server";

/**
 * Admin panel login: one shared password (ADMIN_PASSWORD) plus the staff member's name,
 * kept in a signed, httpOnly cookie so every logged action records who did it.
 */

export const ADMIN_COOKIE = "teams_admin";
const MAX_AGE_SECONDS = 60 * 60 * 24 * 14; // 14 days

function secret(): string {
  return process.env.ADMIN_SESSION_SECRET || process.env.ADMIN_N8N_KEY || "";
}

function sign(payload: string): string {
  return createHmac("sha256", secret()).update(payload).digest("base64url");
}

export function createSessionCookie(name: string): { value: string; maxAge: number } {
  const payload = Buffer.from(
    JSON.stringify({ name, exp: Date.now() + MAX_AGE_SECONDS * 1000 })
  ).toString("base64url");
  return { value: `${payload}.${sign(payload)}`, maxAge: MAX_AGE_SECONDS };
}

export function readSession(req: NextRequest): { name: string } | null {
  const raw = req.cookies.get(ADMIN_COOKIE)?.value;
  if (!raw || !secret()) return null;
  const [payload, sig] = raw.split(".");
  if (!payload || !sig) return null;
  const expected = sign(payload);
  if (expected.length !== sig.length || !timingSafeEqual(Buffer.from(expected), Buffer.from(sig))) {
    return null;
  }
  try {
    const data = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    if (typeof data?.name !== "string" || typeof data?.exp !== "number" || data.exp < Date.now()) return null;
    return { name: data.name };
  } catch {
    return null;
  }
}

export function passwordMatches(input: string): boolean {
  const expected = process.env.ADMIN_PASSWORD || "";
  if (!expected) return false;
  const a = Buffer.from(input);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

/** n8n webhook base + the shared key the admin workflow checks */
export function n8nAdmin() {
  const base = (
    process.env.N8N_WEBHOOK_URL ||
    process.env.NEXT_PUBLIC_N8N_BASE_URL ||
    "https://n8n.srv1691210.hstgr.cloud/webhook"
  ).replace(/\/+$/, "");
  return { base, key: process.env.ADMIN_N8N_KEY || "" };
}
