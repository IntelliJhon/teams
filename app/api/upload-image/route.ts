import { NextRequest, NextResponse } from "next/server";
import { saveImage } from "@/lib/imageStore";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const ext = file.name.split(".").pop() || "jpg";
    const imageId = `img_${Date.now()}_${Math.random().toString(36).slice(2, 7)}.${ext}`;
    const mimeType = file.type || "image/jpeg";

    // Save image in image store
    saveImage(imageId, buffer, mimeType);

    // Determine host
    const origin =
      req.headers.get("origin") ||
      req.headers.get("x-forwarded-host")
        ? `https://${req.headers.get("x-forwarded-host")}`
        : "https://teams-pi-nine.vercel.app";

    const shortUrl = `${origin}/api/images/${imageId}`;

    // Optionally forward to n8n if configured
    const n8nBase =
      process.env.N8N_WEBHOOK_URL ||
      process.env.NEXT_PUBLIC_N8N_BASE_URL ||
      "https://n8n.srv1691210.hstgr.cloud/webhook";

    if (n8nBase) {
      try {
        const uploadUrl = `${n8nBase.replace(/\/+$/, "")}/upload-image`;
        const n8nForm = new FormData();
        n8nForm.append("file", file);
        const resp = await fetch(uploadUrl, { method: "POST", body: n8nForm });
        if (resp.ok) {
          const n8nData = await resp.json().catch(() => ({}));
          if (n8nData?.url && !n8nData.url.startsWith("data:")) {
            return NextResponse.json({ url: n8nData.url });
          }
        }
      } catch {
        // Fallback to internal shortUrl
      }
    }

    return NextResponse.json({ url: shortUrl });
  } catch (err: any) {
    console.error("[Upload] Error saving image:", err);
    return NextResponse.json(
      { error: err.message || "Failed to upload image" },
      { status: 500 }
    );
  }
}
