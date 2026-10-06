import { NextRequest, NextResponse } from "next/server";

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

    // 1. Primary: Upload to permanent public CDN (Catbox.moe)
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

        if (catboxResp.ok) {
          const publicUrl = (await catboxResp.text()).trim();
          if (publicUrl.startsWith("http")) {
            return NextResponse.json({ url: publicUrl });
          }
        }
      } catch (catboxErr) {
        console.warn(`[Upload] Catbox attempt ${attempt} error:`, catboxErr);
      }
    }

    // 2. Secondary: Upload to Uguu CDN
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

    // 3. Forward to n8n webhook if configured
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

    // 4. Safe fallback: Return Base64 data URL (prevents 404 broken images)
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
