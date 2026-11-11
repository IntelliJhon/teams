import { NextRequest, NextResponse } from "next/server";
import { n8nAdmin, readSession } from "@/lib/adminAuth";
import { ORDER_STATUSES } from "@/lib/orderStatus";
import { ProductImage } from "@/types";

const TYPES = new Set(["design", "design_team", "feedback", "status", "note", "strike", "unstrike"]);

/** Design team WhatsApp numbers (DESIGN_TEAM_PHONES, comma separated); 10-digit numbers get 91 */
function designTeamPhones(): string[] {
  return (process.env.DESIGN_TEAM_PHONES || "")
    .split(/[,\s]+/)
    .map((p) => p.replace(/\D/g, ""))
    .filter((p) => p.length >= 10)
    .map((p) => (p.length === 10 ? `91${p}` : p));
}

const fmtDate = (iso: string) => {
  const d = /^\d{4}-\d{2}-\d{2}$/.test(iso) ? new Date(`${iso}T00:00:00`) : null;
  return d && !isNaN(d.getTime())
    ? d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })
    : iso || "Not set";
};
const CHANNELS = new Set(["", "Phone call", "Walk-in", "WhatsApp chat", "Email", "Other"]);

/**
 * Logs an admin action on an order (design version, customer feedback, status change, note)
 * and, for a design sent to the customer, has n8n send the WhatsApp message with the approval link.
 */
export async function POST(req: NextRequest) {
  const session = readSession(req);
  if (!session) return NextResponse.json({ error: "Not logged in" }, { status: 401 });

  const b = await req.json().catch(() => ({}));
  const orderId = String(b?.orderId || "").trim();
  const type = String(b?.type || "");
  const status = String(b?.status || "");
  const channel = String(b?.channel || "");
  if (!/^ORD-[\w-]+$/.test(orderId)) return NextResponse.json({ error: "Bad order id" }, { status: 400 });
  if (!TYPES.has(type)) return NextResponse.json({ error: "Bad action" }, { status: 400 });
  if (status && !(ORDER_STATUSES as readonly string[]).includes(status)) {
    return NextResponse.json({ error: "Bad status" }, { status: 400 });
  }
  if (!CHANNELS.has(channel)) return NextResponse.json({ error: "Bad channel" }, { status: 400 });
  // Cross out / restore a history entry: the note carries that entry's id
  if ((type === "strike" || type === "unstrike") && !/^ACT-[\w-]+$/.test(String(b?.note || ""))) {
    return NextResponse.json({ error: "Bad history entry" }, { status: 400 });
  }
  if ((type === "strike" || type === "unstrike") && status) {
    return NextResponse.json({ error: "Bad status" }, { status: 400 });
  }

  const files: ProductImage[] = (Array.isArray(b?.files) ? b.files : [])
    .filter((f: ProductImage) => f && typeof f.url === "string" && /^https:\/\//.test(f.url))
    .slice(0, 20)
    .map((f: ProductImage) => ({ url: f.url, ...(f.name ? { name: String(f.name) } : {}) }));

  const version = b?.version != null ? String(b.version) : "";
  const notify = type === "design" && b?.notify === true;

  // Customer link + message for a design sent on WhatsApp
  let link = "";
  let message = "";
  let imageUrl = "";
  if (notify) {
    const token = String(b?.editToken || "");
    if (!token) return NextResponse.json({ error: "This order has no customer link token" }, { status: 400 });
    const origin = (process.env.PUBLIC_BASE_URL || new URL(req.url).origin).replace(/\/+$/, "");
    // Short form so the WhatsApp template button can carry it as its one URL variable
    link = `${origin}/d/${orderId}.${token}`;
    const name = String(b?.customerName || "").trim();
    message =
      `Hi${name ? ` ${name}` : ""}, the design for your order ${orderId}` +
      (version ? ` (version ${version})` : "") +
      ` is ready.\n\nPlease check it and tap the button below to approve it or tell us what to change.`;
    // The template header needs an image: use the first design image, or page 1 of a
    // Cloudinary PDF rendered as JPG
    imageUrl =
      files.find((f) => /\.(png|jpe?g|webp)(\?|$)/i.test(f.url))?.url ||
      files
        .map((f) => f.url)
        .find((u) => /res\.cloudinary\.com\/.+\/image\/upload\/.+\.pdf$/i.test(u))
        ?.replace(/\.pdf$/i, ".jpg") ||
      "";
    if (!imageUrl) {
      return NextResponse.json(
        { error: "Add at least one design image (or a PDF) to send it on WhatsApp" },
        { status: 400 }
      );
    }
  }

  // Order form PDF to the design team: one approved template message per number
  let whatsapp: { to: string; template: Record<string, unknown> }[] = [];
  const from = String(b?.from || "").replace(/\s+/g, " ").trim().slice(0, 80);
  if (type === "design_team") {
    const pdf = files.find((f) => /^https:\/\/res\.cloudinary\.com\/.+\.pdf$/i.test(f.url));
    if (!pdf) return NextResponse.json({ error: "The order form PDF is missing" }, { status: 400 });
    const phones = designTeamPhones();
    if (phones.length === 0) {
      return NextResponse.json({ error: "No design team WhatsApp number is set up yet" }, { status: 400 });
    }
    if (!from) return NextResponse.json({ error: "Fill in who it's from" }, { status: 400 });
    // WhatsApp won't send an empty variable, so blanks become a dash / "None"
    const text = (v: string, fallback: string) => (v.replace(/\s+/g, " ").trim() || fallback).slice(0, 500);
    // design_team_order body: {{1}} order, {{2}} from, {{3}} customer, {{4}} delivery date, {{5}} note
    const template = {
      name: process.env.DESIGN_TEAM_TEMPLATE || "design_team_order",
      language: { code: process.env.DESIGN_TEAM_TEMPLATE_LANG || "en" },
      components: [
        { type: "header", parameters: [{ type: "document", document: { link: pdf.url, filename: `${orderId}.pdf` } }] },
        {
          type: "body",
          parameters: [
            { type: "text", text: orderId },
            { type: "text", text: from },
            { type: "text", text: text(String(b?.customerName || ""), "-") },
            { type: "text", text: fmtDate(String(b?.dispatchDate || "")) },
            { type: "text", text: text(String(b?.note || ""), "None") },
          ],
        },
      ],
    };
    whatsapp = phones.map((to) => ({ to, template }));
  }

  const { base, key } = n8nAdmin();
  try {
    const resp = await fetch(`${base}/teams-admin-action`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-admin-key": key },
      body: JSON.stringify({
        orderId,
        type,
        status,
        version,
        files,
        // The order history shows who the order form came from above the note
        note: [type === "design_team" ? `From: ${from}` : "", String(b?.note || "").trim()]
          .filter(Boolean)
          .join("\n")
          .slice(0, 2000),
        channel,
        by: session.name,
        notify,
        customerPhone: String(b?.customerPhone || ""),
        customerName: String(b?.customerName || "").trim(),
        message,
        link,
        imageUrl,
        ...(whatsapp.length ? { whatsapp } : {}),
      }),
    });
    const data = await resp.json().catch(() => ({}));
    if (!resp.ok) return NextResponse.json({ error: data?.error || `Save failed (${resp.status})` }, { status: 502 });
    return NextResponse.json({ ...data, link, recipients: whatsapp.length });
  } catch (err) {
    console.error("[Admin] action failed:", err);
    return NextResponse.json({ error: "Could not reach the order server" }, { status: 502 });
  }
}
