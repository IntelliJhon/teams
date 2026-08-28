import { NextRequest, NextResponse } from "next/server";
import { generateIceFashionsPdf } from "@/lib/generateIceFashionsPdf";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const dataParam = searchParams.get("data");

    let customer: any = {
      customerPhone: "",
      customerName: "",
      customerAddress: "",
      dispatchDate: new Date().toISOString().split("T")[0],
      remarks: "",
    };
    let items: any[] = [];

    if (dataParam) {
      try {
        const decodedStr = Buffer.from(dataParam, "base64").toString("utf-8");
        const parsed = JSON.parse(decodeURIComponent(decodedStr));
        customer = parsed.customer || customer;
        items = parsed.items || items;
      } catch (e) {
        console.warn("[PDF GET] Could not parse base64 data parameter:", e);
      }
    }

    const doc = generateIceFashionsPdf({ customer, items });
    const arrayBuffer = doc.output("arraybuffer");
    const fileName = `ICE_FASHIONS_ORDER_${(customer?.customerName || "FORM").replace(/\s+/g, "_")}.pdf`;

    return new NextResponse(arrayBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${fileName}"`,
        "Cache-Control": "no-cache, no-store, must-revalidate",
      },
    });
  } catch (err: any) {
    console.error("[PDF] Server GET generation error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to generate PDF on server" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const doc = generateIceFashionsPdf({
      customer: body.customer || {
        customerPhone: "",
        dispatchDate: new Date().toISOString().split("T")[0],
      },
      items: body.items || [],
    });

    const arrayBuffer = doc.output("arraybuffer");
    const fileName = `ICE_FASHIONS_ORDER_${(body.customer?.customerName || "FORM").replace(/\s+/g, "_")}.pdf`;

    return new NextResponse(arrayBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${fileName}"`,
        "Cache-Control": "no-cache, no-store, must-revalidate",
      },
    });
  } catch (err: any) {
    console.error("[PDF] Server POST generation error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to generate PDF on server" },
      { status: 500 }
    );
  }
}
