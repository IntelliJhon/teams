import { NextRequest, NextResponse } from "next/server";
import { n8nAdmin, readSession } from "@/lib/adminAuth";
import { buildAdminOrders } from "@/lib/adminOrders";

/** All orders with their items and activity, for the admin panel */
export async function GET(req: NextRequest) {
  if (!readSession(req)) return NextResponse.json({ error: "Not logged in" }, { status: 401 });

  const { base, key } = n8nAdmin();
  try {
    const resp = await fetch(`${base}/teams-admin-data`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-admin-key": key },
      body: "{}",
      cache: "no-store",
    });
    const data = await resp.json().catch(() => null);
    if (!resp.ok || !data) {
      return NextResponse.json({ error: `Could not load orders (${resp.status})` }, { status: 502 });
    }
    return NextResponse.json({ orders: buildAdminOrders(data) });
  } catch (err) {
    console.error("[Admin] orders fetch failed:", err);
    return NextResponse.json({ error: "Could not reach the order server" }, { status: 502 });
  }
}
