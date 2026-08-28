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

/**
 * Downloads the Ice Fashions PDF using:
 * 1. Web Share API (Primary for WhatsApp on Android/iOS)
 * 2. Client Blob download
 * 3. Fallback to POST form streaming
 */
export async function downloadIceFashionsPdf({ customer, items }: DownloadPdfOptions) {
  const fileName = `ICE_FASHIONS_ORDER_${(customer.customerName || "FORM").replace(/\s+/g, "_")}.pdf`;

  try {
    const doc = generateIceFashionsPdf({ customer, items });
    const blob = doc.output("blob");

    // 1. Try Native Web Share API first (Best for WhatsApp & Mobile devices)
    if (typeof navigator !== "undefined" && navigator.canShare) {
      try {
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
          return; // User canceled
        }
        console.warn("Share API fallback:", err);
      }
    }

    // 2. Direct client-side blob download
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
  } catch (err) {
    console.warn("Client generation fallback to POST form:", err);

    // 3. Fallback: Safe HTTP POST Form submission
    try {
      const payload = { customer, items };
      const form = document.createElement("form");
      form.method = "POST";
      form.action = "/api/generate-pdf";
      form.style.display = "none";

      const input = document.createElement("input");
      input.type = "hidden";
      input.name = "payload";
      input.value = JSON.stringify(payload);
      form.appendChild(input);

      document.body.appendChild(form);
      form.submit();

      setTimeout(() => {
        try {
          document.body.removeChild(form);
        } catch {}
      }, 2000);

      toast.success("Downloading A4 Order Form PDF…");
    } catch (formErr) {
      console.error("PDF download failed:", formErr);
      toast.error("Download failed. Please try again.");
    }
  }
}
