import { NextRequest, NextResponse } from "next/server";

/**
 * Short design link used by the WhatsApp template button, whose URL can only end in one
 * variable: /d/<orderId>.<token> → /order/design/<orderId>?token=<token>
 */
export async function GET(req: NextRequest, { params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const dot = code.lastIndexOf(".");
  const orderId = dot > 0 ? code.slice(0, dot) : "";
  const token = dot > 0 ? code.slice(dot + 1) : "";
  if (!/^ORD-[\w-]+$/.test(orderId) || !/^\w+$/.test(token)) {
    return NextResponse.redirect(new URL("/order/new", req.url));
  }
  return NextResponse.redirect(
    new URL(`/order/design/${encodeURIComponent(orderId)}?token=${encodeURIComponent(token)}`, req.url)
  );
}
