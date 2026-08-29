import { NextRequest, NextResponse } from "next/server";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const { orderId } = await params;
    const { searchParams } = new URL(req.url);
    const token = searchParams.get("token") || "";

    const n8nBase =
      process.env.N8N_WEBHOOK_URL ||
      process.env.NEXT_PUBLIC_N8N_BASE_URL ||
      "https://n8n.srv1691210.hstgr.cloud/webhook";

    const targetUrl = `${n8nBase.replace(/\/+$/, "")}/order/${orderId}?token=${encodeURIComponent(token)}`;

    const response = await fetch(targetUrl, {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      return NextResponse.json(
        { error: data?.error || `Failed to fetch order (${response.status})` },
        { status: response.status }
      );
    }

    return NextResponse.json(data);
  } catch (err: any) {
    console.error("[Proxy] Get order error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to retrieve order from server" },
      { status: 500 }
    );
  }
}
