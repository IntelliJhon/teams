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

    const targetUrl = `${n8nBase.replace(/\/+$/, "")}/invoice/${orderId}?token=${encodeURIComponent(token)}`;

    const response = await fetch(targetUrl, {
      method: "GET",
    });

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      return NextResponse.json(
        { error: data?.error || `Failed to fetch invoice (${response.status})` },
        { status: response.status }
      );
    }

    const contentType = response.headers.get("content-type") || "application/pdf";
    const arrayBuffer = await response.arrayBuffer();

    return new NextResponse(new Uint8Array(arrayBuffer), {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `attachment; filename="invoice-${orderId}.pdf"`,
      },
    });
  } catch (err: any) {
    console.error("[Proxy] Invoice download error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to retrieve invoice from server" },
      { status: 500 }
    );
  }
}
