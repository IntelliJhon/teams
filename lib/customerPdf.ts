import { createHash } from "crypto";
import { generateIceFashionsPdf } from "@/lib/generateIceFashionsPdf";
import { n8nAdmin } from "@/lib/adminAuth";
import { fmtDate } from "@/lib/orderSummary";
import { OrderHeader, ProductLineItem } from "@/types";

/** Stores a PDF on Cloudinary (raw file) and returns its link */
async function uploadPdf(buffer: Buffer, publicId: string): Promise<string> {
  const raw = process.env.CLOUDINARY_URL;
  if (!raw) throw new Error("CLOUDINARY_URL is not set");
  const cfg = new URL(raw);
  const secret = decodeURIComponent(cfg.password);
  const folder = `${process.env.CLOUDINARY_FOLDER || "teams-orders"}/order-forms`;
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const signature = createHash("sha1")
    .update(`folder=${folder}&public_id=${publicId}&timestamp=${timestamp}${secret}`)
    .digest("hex");
  const form = new FormData();
  form.append("file", new Blob([new Uint8Array(buffer)], { type: "application/pdf" }), `${publicId}`);
  form.append("api_key", decodeURIComponent(cfg.username));
  form.append("timestamp", timestamp);
  form.append("folder", folder);
  form.append("public_id", publicId);
  form.append("signature", signature);
  const resp = await fetch(`https://api.cloudinary.com/v1_1/${cfg.hostname}/raw/upload`, { method: "POST", body: form });
  const data = await resp.json().catch(() => ({}));
  if (!resp.ok || typeof data?.secure_url !== "string") throw new Error(data?.error?.message || "PDF upload failed");
  return data.secure_url;
}

/**
 * After an order is saved: makes the order form PDF and sends it to the customer on WhatsApp
 * (approved template with a document header). n8n sends it and logs it in the order history.
 */
export async function sendOrderPdfToCustomer(
  order: OrderHeader & { orderId: string; items: ProductLineItem[] },
  baseUrl: string
): Promise<void> {
  let digits = String(order.customerPhone || "").replace(/\D/g, "");
  if (digits.length === 10) digits = `91${digits}`;
  if (!/^91[6-9]\d{9}$/.test(digits)) return; // no valid Indian mobile number

  const doc = await generateIceFashionsPdf({ customer: order, items: order.items, baseUrl });
  const url = await uploadPdf(Buffer.from(doc.output("arraybuffer")), `${order.orderId}_customer.pdf`);

  // WhatsApp won't send an empty variable
  const text = (v: string, fallback: string) => (String(v || "").replace(/\s+/g, " ").trim() || fallback).slice(0, 200);
  const template = {
    name: process.env.CUSTOMER_PDF_TEMPLATE || "order_form_customer",
    language: { code: "en" },
    components: [
      { type: "header", parameters: [{ type: "document", document: { link: url, filename: `${order.orderId}.pdf` } }] },
      {
        type: "body",
        parameters: [
          { type: "text", text: text(order.customerName || "", "there") },
          { type: "text", text: order.orderId },
          { type: "text", text: order.dispatchDate ? fmtDate(order.dispatchDate) : "Not set" },
        ],
      },
    ],
  };

  const { base, key } = n8nAdmin();
  const resp = await fetch(`${base}/teams-admin-action`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-admin-key": key },
    body: JSON.stringify({
      orderId: order.orderId,
      type: "customer_pdf",
      files: [{ url, name: `${order.orderId} order form.pdf` }],
      note: "Order form PDF sent to the customer on WhatsApp",
      by: "System",
      whatsapp: [{ to: digits, template }],
    }),
  });
  const data = await resp.json().catch(() => ({}));
  if (!resp.ok || data?.whatsapp === "failed") {
    console.error("[Customer PDF] WhatsApp send failed:", resp.status, data?.whatsappError || data?.error);
  }
}
