import { NextRequest, NextResponse } from "next/server";
import { generateIceFashionsPdf } from "@/lib/generateIceFashionsPdf";

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
    console.error("[PDF] Server generation error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to generate PDF on server" },
      { status: 500 }
    );
  }
}
