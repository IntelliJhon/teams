import { NextRequest, NextResponse } from "next/server";
import { createHash } from "crypto";

/**
 * Permanent storage: Cloudinary, configured with CLOUDINARY_URL
 * (cloudinary://<api_key>:<api_secret>@<cloud_name>). Returns null when not configured
 * or the upload fails, so the other hosts below are tried.
 */
async function uploadToCloudinary(buffer: Buffer, mimeType: string, fileName: string): Promise<string | null> {
  const raw = process.env.CLOUDINARY_URL;
  if (!raw) return null;
  try {
    const cfg = new URL(raw);
    const cloud = cfg.hostname;
    const apiKey = decodeURIComponent(cfg.username);
    const apiSecret = decodeURIComponent(cfg.password);
    const folder = process.env.CLOUDINARY_FOLDER || "teams-orders";
    const timestamp = Math.floor(Date.now() / 1000).toString();
    // Signature: sorted params (without file/api_key) + secret, SHA-1
    const signature = createHash("sha1")
      .update(`folder=${folder}&timestamp=${timestamp}${apiSecret}`)
      .digest("hex");

    const form = new FormData();
    form.append("file", new Blob([new Uint8Array(buffer)], { type: mimeType }), fileName);
    form.append("api_key", apiKey);
    form.append("timestamp", timestamp);
    form.append("folder", folder);
    form.append("signature", signature);

    // "auto" stores images as images and CSV / Excel / PDF as raw files
    const resp = await fetch(`https://api.cloudinary.com/v1_1/${cloud}/auto/upload`, {
      method: "POST",
      body: form,
    });
    const data = await resp.json().catch(() => ({}));
    if (resp.ok && typeof data?.secure_url === "string") return data.secure_url;
    console.warn("[Upload] Cloudinary rejected upload:", resp.status, data?.error?.message);
  } catch (err) {
    console.warn("[Upload] Cloudinary error:", err);
  }
  return null;
}

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

    // 1. Primary: Cloudinary (permanent, works from Vercel's servers)
    const cloudinaryUrl = await uploadToCloudinary(buffer, mimeType, file.name || imageId);
    if (cloudinaryUrl) {
      return NextResponse.json({ url: cloudinaryUrl });
    }

    // 2. Catbox.moe (permanent, but it rejects many server IPs)
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        const catboxForm = new FormData();
        catboxForm.append("reqtype", "fileupload");
        const blob = new Blob([buffer], { type: mimeType });
        catboxForm.append("fileToUpload", blob, file.name || imageId);

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 12000);

        const catboxResp = await fetch("https://catbox.moe/user/api.php", {
          method: "POST",
          body: catboxForm,
          signal: controller.signal,
          headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) TeamsWeb/1.0",
          },
        });
        clearTimeout(timeoutId);

        const catboxText = (await catboxResp.text()).trim();
        if (catboxResp.ok && catboxText.startsWith("http")) {
          return NextResponse.json({ url: catboxText });
        }
        console.warn(`[Upload] Catbox attempt ${attempt} rejected:`, catboxResp.status, catboxText.slice(0, 120));
      } catch (catboxErr) {
        console.warn(`[Upload] Catbox attempt ${attempt} error:`, catboxErr);
      }
    }

    // 3. Uguu CDN (temporary: files are deleted after about 3 hours)
    try {
      const uguuForm = new FormData();
      const blob = new Blob([buffer], { type: mimeType });
      uguuForm.append("files[]", blob, file.name || imageId);

      const uguuResp = await fetch("https://uguu.se/upload", {
        method: "POST",
        body: uguuForm,
      });

      if (uguuResp.ok) {
        const uguuData = await uguuResp.json();
        const publicUrl = uguuData?.files?.[0]?.url;
        if (publicUrl && publicUrl.startsWith("http")) {
          return NextResponse.json({ url: publicUrl });
        }
      }
    } catch (uguuErr) {
      console.warn("[Upload] Uguu error:", uguuErr);
    }

    // 4. Forward to n8n webhook if configured
    const n8nBase =
      process.env.N8N_WEBHOOK_URL ||
      process.env.NEXT_PUBLIC_N8N_BASE_URL ||
      "https://n8n.srv1691210.hstgr.cloud/webhook";

    if (n8nBase) {
      try {
        const uploadUrl = `${n8nBase.replace(/\/+$/, "")}/upload-image`;
        const n8nForm = new FormData();
        const blob = new Blob([buffer], { type: mimeType });
        n8nForm.append("file", blob, file.name);
        const resp = await fetch(uploadUrl, { method: "POST", body: n8nForm });
        if (resp.ok) {
          const n8nData = await resp.json().catch(() => ({}));
          if (n8nData?.url && !n8nData.url.startsWith("data:")) {
            return NextResponse.json({ url: n8nData.url });
          }
        }
      } catch {
        // ignore
      }
    }

    // 5. Safe fallback: Return Base64 data URL (prevents 404 broken images)
    const base64DataUrl = `data:${mimeType};base64,${buffer.toString("base64")}`;
    return NextResponse.json({ url: base64DataUrl });
  } catch (err: any) {
    console.error("[Upload] Error saving image:", err);
    return NextResponse.json(
      { error: err.message || "Failed to upload image" },
      { status: 500 }
    );
  }
}
