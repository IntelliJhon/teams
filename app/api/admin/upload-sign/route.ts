import { NextRequest, NextResponse } from "next/server";
import { createHash } from "crypto";
import { readSession } from "@/lib/adminAuth";

/**
 * Signs a direct browser → Cloudinary upload of an order form PDF.
 * The PDF goes straight to Cloudinary (not through this server), so large forms with
 * many photos aren't stopped by Vercel's 4.5 MB request limit.
 */
export async function POST(req: NextRequest) {
  const session = readSession(req);
  if (!session) return NextResponse.json({ error: "Not logged in" }, { status: 401 });

  const b = await req.json().catch(() => ({}));
  const orderId = String(b?.orderId || "").trim();
  if (!/^ORD-[\w-]+$/.test(orderId)) return NextResponse.json({ error: "Bad order id" }, { status: 400 });

  const raw = process.env.CLOUDINARY_URL;
  if (!raw) return NextResponse.json({ error: "File storage is not set up" }, { status: 500 });
  const cfg = new URL(raw);
  const cloud = cfg.hostname;
  const apiKey = decodeURIComponent(cfg.username);
  const apiSecret = decodeURIComponent(cfg.password);

  const folder = `${process.env.CLOUDINARY_FOLDER || "teams-orders"}/order-forms`;
  const timestamp = Math.floor(Date.now() / 1000).toString();
  // Raw files keep the extension that's in the public id
  const publicId = `${orderId}_${timestamp}.pdf`;
  const signature = createHash("sha1")
    .update(`folder=${folder}&public_id=${publicId}&timestamp=${timestamp}${apiSecret}`)
    .digest("hex");

  return NextResponse.json({
    uploadUrl: `https://api.cloudinary.com/v1_1/${cloud}/raw/upload`,
    fields: { api_key: apiKey, timestamp, folder, public_id: publicId, signature },
  });
}
