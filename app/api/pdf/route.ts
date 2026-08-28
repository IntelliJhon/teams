import { NextRequest, NextResponse } from "next/server";
import { cacheOrder } from "@/lib/orderCache";
import { generateIceFashionsPdf } from "@/lib/generateIceFashionsPdf";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const id = body.orderId || `ord_${Date.now()}`;
    const customer = body.customer || {
      customerPhone: "",
      dispatchDate: new Date().toISOString().split("T")[0],
    };
    const items = body.items || [];

    cacheOrder(id, customer, items);

    return NextResponse.json({
      id,
      downloadUrl: `/api/pdf/${id}`,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (id) {
      const url = new URL(`/api/pdf/${id}`, req.url);
      return NextResponse.redirect(url);
    }

    const doc = generateIceFashionsPdf({
      customer: {
        customerPhone: "",
        dispatchDate: new Date().toISOString().split("T")[0],
      },
      items: [],
    });

    const arrayBuffer = doc.output("arraybuffer");
    return new NextResponse(new Uint8Array(arrayBuffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": 'attachment; filename="ICE_FASHIONS_ORDER.pdf"',
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
