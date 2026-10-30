import { NextRequest, NextResponse } from "next/server";
import { n8nAdmin } from "@/lib/adminAuth";
import { activityFromRow } from "@/lib/adminOrders";

/**
 * Customer design page API. The order's edit token (the same one in the WhatsApp links)
 * proves it's the customer; n8n checks it against the Order sheet.
 */
export async function GET(req: NextRequest, { params }: { params: Promise<{ orderId: string }> }) {
  const { orderId } = await params;
  const token = new URL(req.url).searchParams.get("token") || "";
  if (!token) return NextResponse.json({ error: "Missing link token" }, { status: 400 });

  const { base } = n8nAdmin();
  try {
    const resp = await fetch(
      `${base}/teams-design?orderId=${encodeURIComponent(orderId)}&token=${encodeURIComponent(token)}`,
      { cache: "no-store" }
    );
    const data = await resp.json().catch(() => null);
    if (!resp.ok || !data?.orderId) {
      return NextResponse.json({ error: "This link is not valid" }, { status: 404 });
    }
    const activity = (Array.isArray(data.activity) ? data.activity : [])
      .map(activityFromRow)
      // The customer sees the designs and their own replies; staff notes stay internal
      .filter((a: { type: string }) => ["design", "customer_response"].includes(a.type))
      .sort((a: { createdAt: string }, b: { createdAt: string }) => b.createdAt.localeCompare(a.createdAt));
    return NextResponse.json({
      orderId: data.orderId,
      customerName: data.customerName,
      status: data.status,
      activity,
    });
  } catch (err) {
    console.error("[Design] view failed:", err);
    return NextResponse.json({ error: "Could not load the design" }, { status: 502 });
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ orderId: string }> }) {
  const { orderId } = await params;
  const b = await req.json().catch(() => ({}));
  const decision = b?.decision === "approved" ? "approved" : b?.decision === "changes" ? "changes" : "";
  const comment = String(b?.comment || "").trim().slice(0, 2000);
  if (!decision) return NextResponse.json({ error: "Choose approve or request changes" }, { status: 400 });
  if (decision === "changes" && !comment) {
    return NextResponse.json({ error: "Tell us what to change" }, { status: 400 });
  }

  const { base } = n8nAdmin();
  try {
    const resp = await fetch(`${base}/teams-design-respond`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        orderId,
        token: String(b?.token || ""),
        decision,
        comment,
        version: b?.version != null ? String(b.version) : "",
      }),
    });
    const data = await resp.json().catch(() => ({}));
    if (!resp.ok) return NextResponse.json({ error: "This link is not valid" }, { status: 404 });
    return NextResponse.json(data);
  } catch (err) {
    console.error("[Design] respond failed:", err);
    return NextResponse.json({ error: "Could not send your reply" }, { status: 502 });
  }
}
