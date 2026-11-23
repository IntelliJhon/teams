import { NextRequest, NextResponse } from "next/server";
import { n8nAdmin, readSession } from "@/lib/adminAuth";

/**
 * Adds, removes or restores a branch / marketing name (Portal_Options sheet tab).
 * Removing keeps the row with active = "no", so old orders still show the name.
 */
export async function POST(req: NextRequest) {
  if (!readSession(req)) return NextResponse.json({ error: "Not logged in" }, { status: 401 });

  const b = await req.json().catch(() => ({}));
  const type = ["branch", "marketing", "notify"].includes(b?.type) ? String(b.type) : "";
  let name = String(b?.name || "").replace(/\s+/g, " ").trim().slice(0, 80);
  if (type === "notify") {
    // WhatsApp number for new-order alerts: stored with the 91 country code
    let digits = name.replace(/\D/g, "");
    if (digits.length === 11 && digits.startsWith("0")) digits = digits.slice(1);
    if (digits.length === 10) digits = `91${digits}`;
    if (!/^91[6-9]\d{9}$/.test(digits)) {
      return NextResponse.json({ error: "Enter a 10-digit mobile number" }, { status: 400 });
    }
    name = digits;
  }
  const id = String(b?.id || "");
  if (!type) return NextResponse.json({ error: "Bad list" }, { status: 400 });
  if (!name) return NextResponse.json({ error: "Type a name" }, { status: 400 });
  if (id && !/^OPT-[\w-]+$/.test(id)) return NextResponse.json({ error: "Bad entry" }, { status: 400 });

  const { base, key } = n8nAdmin();
  try {
    const resp = await fetch(`${base}/teams-admin-options`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-admin-key": key },
      body: JSON.stringify({ id, type, name, active: b?.active !== false }),
    });
    const data = await resp.json().catch(() => ({}));
    if (!resp.ok) return NextResponse.json({ error: data?.error || `Save failed (${resp.status})` }, { status: 502 });
    return NextResponse.json(data);
  } catch (err) {
    console.error("[Admin] option save failed:", err);
    return NextResponse.json({ error: "Could not reach the order server" }, { status: 502 });
  }
}
