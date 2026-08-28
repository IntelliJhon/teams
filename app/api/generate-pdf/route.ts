import { NextRequest, NextResponse } from "next/server";
import { generateIceFashionsPdf } from "@/lib/generateIceFashionsPdf";

export async function POST(req: NextRequest) {
  try {
    let customer: any = {
      customerPhone: "",
      customerName: "",
      customerAddress: "",
      dispatchDate: new Date().toISOString().split("T")[0],
      remarks: "",
    };
    let items: any[] = [];

    const contentType = req.headers.get("content-type") || "";

    if (contentType.includes("application/json")) {
      const body = await req.json();
      customer = body.customer || customer;
      items = body.items || items;
    } else {
      const formData = await req.formData();
      const payloadStr = formData.get("payload") as string;
      if (payloadStr) {
        try {
          const parsed = JSON.parse(payloadStr);
          customer = parsed.customer || customer;
          items = parsed.items || items;
        } catch (e) {
          console.warn("[PDF POST Form] Parse error:", e);
        }
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
    console.error("[PDF] Server POST generation error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to generate PDF on server" },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const phone = searchParams.get("phone") || "";
    const name = searchParams.get("name") || "";

    // Always generate and stream a valid PDF file — never return JSON
    const doc = generateIceFashionsPdf({
      customer: {
        customerPhone: phone,
        customerName: name,
        dispatchDate: new Date().toISOString().split("T")[0],
      },
      items: [],
    });

    const arrayBuffer = doc.output("arraybuffer");
    const fileName = `ICE_FASHIONS_ORDER_${(name || "FORM").replace(/\s+/g, "_")}.pdf`;

    return new NextResponse(arrayBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${fileName}"`,
        "Cache-Control": "no-cache, no-store, must-revalidate",
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
