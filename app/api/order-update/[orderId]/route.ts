import { NextRequest, NextResponse } from "next/server";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const { orderId } = await params;
    const { searchParams } = new URL(req.url);
    const token = searchParams.get("token") || "";
    const body = await req.json();

    const n8nBase =
      process.env.N8N_WEBHOOK_URL ||
      process.env.NEXT_PUBLIC_N8N_BASE_URL ||
      "https://n8n.srv1691210.hstgr.cloud/webhook";

    const targetUrl = `${n8nBase.replace(/\/+$/, "")}/order-update/${orderId}?token=${encodeURIComponent(token)}`;

    const response = await fetch(targetUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        orderId,
        token,
        ...body,
      }),
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      return NextResponse.json(
        { error: data?.error || `Failed to update order (${response.status})` },
        { status: response.status }
      );
    }

    return NextResponse.json(data || { success: true });
  } catch (err: any) {
    console.error("[Proxy] Update order error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to submit order update to server" },
      { status: 500 }
    );
  }
}
