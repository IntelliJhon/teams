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
 * Downloads the Ice Fashions PDF using safe HTTP POST form submission
 * or Native Share API, eliminating any URI_TOO_LONG errors.
 */
export async function downloadIceFashionsPdf({ customer, items }: DownloadPdfOptions) {
  const fileName = `ICE_FASHIONS_ORDER_${(customer.customerName || "FORM").replace(/\s+/g, "_")}.pdf`;

  // 1. Try Native Web Share API first (Best for WhatsApp & Mobile devices)
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
        return; // User canceled
      }
      console.warn("Native share fallback to POST form download:", err);
    }
  }

  // 2. Safe HTTP POST Form submission (Never hits URI_TOO_LONG limit)
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
  } catch (err) {
    console.error("Form POST download error:", err);
    toast.error("Download failed. Please try again.");
  }
}
