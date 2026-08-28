import { NextRequest, NextResponse } from "next/server";
import { getImage } from "@/lib/imageStore";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const imgData = getImage(id);

    if (!imgData) {
      return NextResponse.json({ error: "Image not found" }, { status: 404 });
    }

    return new NextResponse(imgData.buffer, {
      status: 200,
      headers: {
        "Content-Type": imgData.mimeType,
        "Cache-Control": "public, max-age=86400, immutable",
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Error retrieving image" },
      { status: 500 }
    );
  }
}
