import { NextRequest, NextResponse } from "next/server";
import { getCachedOrder } from "@/lib/orderCache";
import { generateIceFashionsPdf } from "@/lib/generateIceFashionsPdf";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(req.url);

    const cached = getCachedOrder(id);

    const customer = cached?.customer || {
      customerPhone: searchParams.get("phone") || "",
      customerName: searchParams.get("name") || "",
      customerAddress: searchParams.get("address") || "",
      dispatchDate: searchParams.get("date") || new Date().toISOString().split("T")[0],
      remarks: searchParams.get("remarks") || "",
    };

    const items = cached?.items || [];

    const doc = generateIceFashionsPdf({ customer, items });
    const arrayBuffer = doc.output("arraybuffer");
    const safeName = (customer.customerName || "FORM").replace(/[^a-zA-Z0-9_-]/g, "_");
    const fileName = `ICE_FASHIONS_ORDER_${safeName}.pdf`;

    return new NextResponse(new Uint8Array(arrayBuffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${fileName}"`,
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch (err: any) {
    console.error("[PDF Route] Error generating PDF:", err);
    return NextResponse.json(
      { error: err.message || "Failed to generate PDF" },
      { status: 500 }
    );
  }
}
