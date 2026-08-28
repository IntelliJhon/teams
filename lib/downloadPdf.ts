import { generateIceFashionsPdf } from "@/lib/generateIceFashionsPdf";
import { toast } from "sonner";

interface DownloadPdfOptions {
  customer: {
    customerPhone: string;
    customerName?: string;
    customerAddress?: string;
    dispatchDate: string;
    remarks?: string;
  };
  items: any[];
}

export async function downloadIceFashionsPdf({ customer, items }: DownloadPdfOptions) {
  const safeName = (customer.customerName || "FORM").replace(/[^a-zA-Z0-9_-]/g, "_");
  const fileName = `ICE_FASHIONS_ORDER_${safeName}.pdf`;

  // 1. Try Native Web Share API first (Fastest on supported mobile devices)
  if (typeof navigator !== "undefined" && navigator.canShare) {
    try {
      const doc = generateIceFashionsPdf({ customer, items });
      const blob = doc.output("blob");
      const file = new File([blob], fileName, { type: "application/pdf" });

      if (navigator.canShare({ files: [file] })) {
        await navigator.share({
          title: "ICE FASHIONS Order Form",
          text: `ICE FASHIONS Order Form for ${customer.customerName || "Customer"}`,
          files: [file],
        });
        toast.success("Order Form PDF saved / shared!");
        return;
      }
    } catch (err: any) {
      if (err?.name === "AbortError") {
        return; // User dismissed
      }
      console.warn("Native share fallback to server download:", err);
    }
  }

  // 2. Direct Server PDF Download by Short ID (Works in WhatsApp & Chrome browser)
  try {
    const orderId = `ord_${Date.now()}`;
    const resp = await fetch("/api/pdf", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderId, customer, items }),
    });

    const data = await resp.json().catch(() => ({}));
    const downloadUrl = data?.downloadUrl || `/api/pdf/${orderId}`;

    // Direct browser navigation to server download URL
    window.location.href = downloadUrl;
    toast.success("Downloading A4 Order Form PDF…");
  } catch (err) {
    console.error("Server PDF download error, trying blob fallback:", err);

    // Fallback: client-side blob anchor
    try {
      const doc = generateIceFashionsPdf({ customer, items });
      const blob = doc.output("blob");
      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      setTimeout(() => {
        try {
          document.body.removeChild(link);
          URL.revokeObjectURL(blobUrl);
        } catch {}
      }, 2000);
      toast.success("A4 Order Form PDF downloaded!");
    } catch (blobErr) {
      console.error("Blob download failed:", blobErr);
      toast.error("Download failed. Please try again.");
    }
  }
}
