import { NextResponse } from "next/server";
import { createHash } from "crypto";

/**
 * Signs a direct browser → Cloudinary upload for files too big to pass through this
 * server (Vercel stops requests above 4.5 MB), e.g. large design PDFs.
 * Same folder and same openness as /api/upload-image, which customers already use.
 */
export async function POST() {
  const raw = process.env.CLOUDINARY_URL;
  if (!raw) return NextResponse.json({ error: "File storage is not set up" }, { status: 500 });
  const cfg = new URL(raw);
  const apiSecret = decodeURIComponent(cfg.password);
  const folder = process.env.CLOUDINARY_FOLDER || "teams-orders";
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const signature = createHash("sha1").update(`folder=${folder}&timestamp=${timestamp}${apiSecret}`).digest("hex");
  return NextResponse.json({
    // "auto" keeps PDFs as image-type files, so Cloudinary can show page 1 as a JPG preview
    uploadUrl: `https://api.cloudinary.com/v1_1/${cfg.hostname}/auto/upload`,
    fields: { api_key: decodeURIComponent(cfg.username), timestamp, folder, signature },
  });
}
