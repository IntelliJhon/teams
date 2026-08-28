import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Ensure orderId is always present in the submitted JSON body for n8n
    if (!body.orderId) {
      body.orderId = `ORD-${Date.now()}`;
    }

    const n8nBase =
      process.env.N8N_WEBHOOK_URL ||
      process.env.NEXT_PUBLIC_N8N_BASE_URL ||
      "https://n8n.srv1691210.hstgr.cloud/webhook";

    // Primary webhook URL (Production: https://n8n.srv1691210.hstgr.cloud/webhook/order-submit)
    const primaryUrl = n8nBase.endsWith("/order-submit")
      ? n8nBase
      : `${n8nBase.replace(/\/+$/, "")}/order-submit`;

    console.log(`[Proxy] Forwarding order (${body.orderId}) to production n8n webhook: ${primaryUrl}`);

    const response = await fetch(primaryUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const responseText = await response.text();
    let data;
    try {
      data = JSON.parse(responseText);
    } catch {
      data = { message: responseText };
    }

    if (!response.ok) {
      console.error(`[Proxy] n8n error status ${response.status}:`, data);
      return NextResponse.json(
        {
          error:
            data?.error ||
            data?.message ||
            `n8n webhook error (${response.status}). Please make sure your n8n production workflow is Active.`,
        },
        { status: response.status >= 400 ? response.status : 500 }
      );
    }

    const raw = Array.isArray(data) ? data[0] : data;
    return NextResponse.json({
      orderId: raw?.orderId || raw?.id || body.orderId,
      editToken: raw?.editToken || raw?.token || "",
      invoiceToken: raw?.invoiceToken || raw?.token || "",
      ...raw,
    });
  } catch (err: any) {
    console.error("[Proxy] Order submission error:", err);
    return NextResponse.json(
      {
        error:
          err.message ||
          "Could not reach n8n server. Please verify your connection and workflow status.",
      },
      { status: 500 }
    );
  }
}
