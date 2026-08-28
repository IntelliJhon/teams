"use client";

import React, { useState } from "react";
import { useOrderStore } from "@/store/order-store";
import { generateIceFashionsPdf } from "@/lib/generateIceFashionsPdf";
import { toast } from "sonner";

interface IceFashionsOrderFormProps {
  onClose?: () => void;
}

export function IceFashionsOrderForm({ onClose }: IceFashionsOrderFormProps) {
  const [downloading, setDownloading] = useState(false);

  const {
    customerPhone,
    customerName,
    customerAddress,
    dispatchDate,
    remarks,
    items,
  } = useOrderStore();

  const primaryItem = items[0] || null;
  const primaryFields = (primaryItem?.fields || {}) as Record<string, string>;

  const shortsOrLowerItems = items.filter(
    (it) => it.productType === "Shorts" || it.productType === "Lower"
  );

  const modelName = primaryItem ? primaryItem.productType : "—";
  const cloth = primaryFields.fabric || primaryFields.cloth || "—";
  const collar = primaryFields.collarType || primaryFields.collarPadi || "—";

  const sleeveType = (primaryFields.sleeveType || "").toUpperCase();
  const isHS = sleeveType.includes("HALF") || sleeveType === "H/S" || sleeveType.includes("MEGA");
  const isFS = sleeveType.includes("FULL") || sleeveType === "F/S";

  const frontPrintYes = primaryFields.frontPrint === "YES" || primaryFields.frontPrint === "Yes";
  const frontPrintType = primaryFields.printType || "—";

  const backPrintYes = primaryFields.backPrint === "YES" || primaryFields.backPrint === "Yes";
  const backPrintType = primaryFields.backPrintType || "—";

  const jerseySizeRows = primaryItem ? primaryItem.sizeQuantities : [];

  const orderNumber = `IF-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
  const currentDate = new Date().toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

  const totalJerseyQty = jerseySizeRows.reduce((sum, r) => sum + r.quantity, 0);

  const formatPlayer = (p: { number?: string; name?: string }) => {
    const num = (p.number || "").trim();
    const name = (p.name || "").trim();
    if (num && name) return `#${num} ${name}`;
    if (num) return `#${num}`;
    if (name) return name;
    return "";
  };

  // Build 5 rows of right-hand cell data so that NO player numbers/names are ever truncated
  const rightCellRows: { qty: string; text: string }[] = [
    { qty: "", text: "" },
    { qty: "", text: "" },
    { qty: "", text: "" },
    { qty: "", text: "" },
    { qty: "", text: "" },
  ];

  if (jerseySizeRows.length === 1) {
    const sz = jerseySizeRows[0];
    const playerTags = (sz.players || [])
      .map(formatPlayer)
      .filter((t) => t.length > 0);

    rightCellRows[0].qty = String(sz.quantity);
    if (playerTags.length === 0) {
      rightCellRows[0].text = `Size: ${sz.size}  —  Quantity: ${sz.quantity} pcs`;
    } else {
      const chunkSize = 3;
      rightCellRows[0].text = `Size: ${sz.size} (${sz.quantity} pcs):  ${playerTags.slice(0, chunkSize).join(", ")}`;
      for (let r = 1; r < 5; r++) {
        const slice = playerTags.slice(r * chunkSize, (r + 1) * chunkSize);
        if (slice.length > 0) {
          rightCellRows[r].text = `   ${slice.join(", ")}`;
        }
      }
    }
  } else if (jerseySizeRows.length > 1) {
    jerseySizeRows.slice(0, 5).forEach((sz, idx) => {
      rightCellRows[idx].qty = String(sz.quantity);
      const playerTags = (sz.players || [])
        .map(formatPlayer)
        .filter((t) => t.length > 0);
      let line = `Size: ${sz.size} — Qty: ${sz.quantity} pcs`;
      if (playerTags.length > 0) {
        line += ` (${playerTags.join(", ")})`;
      }
      rightCellRows[idx].text = line;
    });
  }

  const jerseySpecs = [
    { label: "Production", val: primaryFields.productionType || "—" },
    { label: "Colour", val: primaryFields.colour || "—" },
    { label: "Collar Padi", val: primaryFields.collarPadi || "—" },
    { label: "Buttons", val: primaryFields.button || "—" },
    { label: "Pocket", val: primaryFields.pocket || "—" },
    { label: "Hand Cuff", val: primaryFields.handCuff || "—" },
  ];

  // Helper to build real HTTP download URL for WhatsApp and external browser compatibility
  const getHttpDownloadUrl = () => {
    const payload = {
      customer: {
        customerPhone,
        customerName,
        customerAddress,
        dispatchDate,
        remarks,
      },
      items,
    };
    const jsonStr = encodeURIComponent(JSON.stringify(payload));
    const base64Data = btoa(jsonStr);
    return `/api/generate-pdf?data=${base64Data}`;
  };

  const handleDownloadPdf = async () => {
    setDownloading(true);
    try {
      const doc = generateIceFashionsPdf({
        customer: {
          customerPhone,
          customerName,
          customerAddress,
          dispatchDate,
          remarks,
        },
        items,
      });

      const fileName = `ICE_FASHIONS_ORDER_${(customerName || "FORM").replace(/\s+/g, "_")}.pdf`;
      const blob = doc.output("blob");

      // 1. Try Native Web Share API first (Best for WhatsApp / Instagram on iOS & Android)
      if (typeof navigator !== "undefined" && navigator.canShare) {
        try {
          const file = new File([blob], fileName, { type: "application/pdf" });
          if (navigator.canShare({ files: [file] })) {
            await navigator.share({
              title: "ICE FASHIONS Order Form",
              text: `ICE FASHIONS Order Form for ${customerName || "Customer"}`,
              files: [file],
            });
            toast.success("Order form shared / saved successfully!");
            return;
          }
        } catch (shareErr: any) {
          if (shareErr?.name === "AbortError") {
            return;
          }
          console.warn("Share API fallback:", shareErr);
        }
      }

      // 2. Real HTTP Server URL Download (Works seamlessly in WhatsApp & Chrome)
      const downloadUrl = getHttpDownloadUrl();
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      setTimeout(() => {
        try {
          document.body.removeChild(link);
        } catch {}
      }, 2000);

      toast.success("A4 Order Form PDF download started!");
    } catch (err) {
      console.error("PDF download error:", err);
      // Fallback: direct window location to real HTTP server URL
      const downloadUrl = getHttpDownloadUrl();
      window.location.href = downloadUrl;
    } finally {
      setDownloading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div
      id="ice-fashions-modal-container"
      className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-xs flex flex-col items-center justify-start p-2 sm:p-4 print:p-0 print:static print:bg-white print:overflow-visible"
    >
      {/* Top Action Bar (hidden in print) */}
      <div className="print-hide w-full max-w-[760px] bg-white px-3 sm:px-4 py-2.5 sm:py-3 rounded-2xl shadow-xl mb-3 sticky top-2 z-10 border border-gray-200 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="font-bold text-gray-900 text-sm sm:text-base">
            Ice Fashions Form
          </span>
          <span className="text-[11px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full hidden sm:inline-block">
            1-Page A4
          </span>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2">
          <button
            type="button"
            onClick={handleDownloadPdf}
            disabled={downloading}
            className="flex items-center gap-1.5 px-3.5 sm:px-4 py-1.5 sm:py-2 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-xs font-bold rounded-xl shadow-sm transition-all disabled:opacity-50 cursor-pointer"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            <span>{downloading ? "Saving…" : "Download PDF"}</span>
          </button>

          <button
            type="button"
            onClick={handlePrint}
            className="flex items-center gap-1 px-3 py-1.5 sm:py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-semibold rounded-xl transition-all cursor-pointer"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
            <span>Print</span>
          </button>

          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-gray-400 hover:text-gray-600 active:scale-95 rounded-xl hover:bg-gray-100 transition-colors cursor-pointer"
              aria-label="Close"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Fully Responsive On-Screen Form Preview (100% visible on Mobile & Desktop) */}
      <div
        id="ice-fashions-form-wrapper"
        className="w-full max-w-[760px] bg-white text-black font-sans shadow-2xl p-3 sm:p-6 border-[2px] border-black rounded-lg sm:rounded-none mb-12 print:border-none print:shadow-none print:p-0 print:m-0 print:w-full"
      >
        <div id="ice-fashions-form" className="w-full border-2 border-black p-2.5 sm:p-4 box-border">
          {/* 1. Header Section */}
          <div className="flex items-center justify-between gap-2 mb-2 sm:mb-3">
            <div className="text-[11px] sm:text-xs font-bold whitespace-nowrap">
              NO. <span className="font-normal border-b border-dotted border-black px-1">{orderNumber}</span>
            </div>

            <div className="border-2 border-black rounded-lg px-2 sm:px-6 py-0.5 text-center">
              <span className="text-sm sm:text-lg font-black tracking-wider uppercase font-sans">
                ICE FASHIONS
              </span>
            </div>

            <div className="bg-[#222222] text-white px-2 sm:px-3 py-1 text-[9px] sm:text-[11px] font-black tracking-wider uppercase whitespace-nowrap">
              ORDER FORM
            </div>
          </div>

          {/* 2. FROM & DATE Row */}
          <div className="flex items-baseline justify-between gap-2 text-[10px] sm:text-xs font-bold mb-2 sm:mb-3">
            <div className="flex-1 flex items-baseline gap-1 min-w-0">
              <span className="flex-shrink-0">FROM</span>
              <span className="border-b border-dotted border-black flex-1 px-1 font-semibold text-gray-900 truncate">
                {customerName || "—"} {customerPhone ? `(${customerPhone})` : ""} {customerAddress ? `- ${customerAddress}` : ""}
              </span>
            </div>

            <div className="flex items-baseline gap-1 flex-shrink-0">
              <span>DATE</span>
              <span className="border-b border-dotted border-black px-1 text-center font-semibold text-gray-900">
                {currentDate}
              </span>
            </div>
          </div>

          {/* 3. Table 1: Specifications (MODEL | CLOTH | COLLAR | H/S | F/S) */}
          <div className="border border-black mb-2 sm:mb-3">
            <div className="grid grid-cols-12 text-center font-bold text-[9px] sm:text-[11px] uppercase bg-[#e5e7eb] border-b border-black">
              <div className="col-span-3 py-1 border-r border-black">MODEL</div>
              <div className="col-span-3 py-1 border-r border-black">CLOTH</div>
              <div className="col-span-3 py-1 border-r border-black">COLLAR</div>
              <div className="col-span-1.5 col-span-2 py-1 border-r border-black">H/S</div>
              <div className="col-span-1.5 col-span-1 py-1">F/S</div>
            </div>

            <div className="grid grid-cols-12 text-center text-[9px] sm:text-[11px] font-semibold min-h-[26px] items-center">
              <div className="col-span-3 py-1 px-0.5 border-r border-black truncate">{modelName}</div>
              <div className="col-span-3 py-1 px-0.5 border-r border-black truncate">{cloth}</div>
              <div className="col-span-3 py-1 px-0.5 border-r border-black truncate">{collar}</div>
              <div className="col-span-2 py-1 border-r border-black font-bold">
                {isHS ? "✓ (YES)" : "—"}
              </div>
              <div className="col-span-1 py-1 font-bold">
                {isFS ? "✓ (YES)" : "—"}
              </div>
            </div>
          </div>

          {/* 4. Table 2: JERSEY DETAILS & SIZE & NUMBER */}
          <div className="border border-black mb-2 sm:mb-3">
            <div className="grid grid-cols-12 text-center font-bold text-[9px] sm:text-[11px] uppercase bg-[#e5e7eb] border-b border-black">
              <div className="col-span-4 py-1 border-r border-black">JERSEY DETAILS</div>
              <div className="col-span-8 py-1">SIZE &amp; NUMBER</div>
            </div>

            <div className="text-[9px] sm:text-[11px] divide-y divide-black">
              {/* Rows 0 to 4 */}
              {Array.from({ length: 5 }).map((_, idx) => (
                <div key={idx} className="grid grid-cols-12 min-h-[24px] items-center">
                  <div className="col-span-4 px-1.5 py-0.5 border-r border-black font-medium text-gray-700 truncate">
                    {jerseySpecs[idx].label}: <span className="font-bold text-black">{jerseySpecs[idx].val}</span>
                  </div>
                  <div className="col-span-8 px-1.5 py-0.5 font-semibold break-words whitespace-normal">
                    {rightCellRows[idx].text || "—"}
                  </div>
                </div>
              ))}

              {/* Row 5 (Hand Cuff & Total Qty) */}
              <div className="grid grid-cols-12 min-h-[24px] items-center">
                <div className="col-span-4 px-1.5 py-0.5 border-r border-black font-medium text-gray-700 truncate">
                  Hand Cuff: <span className="font-bold text-black">{primaryFields.handCuff || "—"}</span>
                </div>
                <div className="col-span-8 px-1.5 py-0.5 font-bold text-gray-900">
                  TOTAL JERSEY QUANTITY: {totalJerseyQty} PCS
                </div>
              </div>
            </div>
          </div>

          {/* 5. Table 3: SHORTS / LOWER & GK / LIBRO */}
          <div className="border border-black mb-2 sm:mb-3">
            <div className="grid grid-cols-12 text-center font-bold text-[9px] sm:text-[11px] uppercase bg-[#e5e7eb] border-b border-black">
              <div className="col-span-8 py-1 border-r border-black">SHORTS / LOWER</div>
              <div className="col-span-4 py-1">GK / LIBRO</div>
            </div>

            <div className="grid grid-cols-12 text-[9px] sm:text-[11px]">
              {/* Left 4 columns */}
              <div className="col-span-8 border-r border-black">
                <div className="grid grid-cols-4 text-center font-bold text-[8px] sm:text-[10px] uppercase bg-white border-b border-black py-0.5">
                  <div className="border-r border-black">SIZE</div>
                  <div className="border-r border-black">MODEL</div>
                  <div className="border-r border-black">CLOTH</div>
                  <div>COLOUR</div>
                </div>

                {Array.from({ length: 4 }).map((_, idx) => {
                  const item = shortsOrLowerItems[idx];
                  const itemFields = (item?.fields || {}) as Record<string, string>;
                  const itemSizeStr = item?.sizeQuantities?.map((s) => `${s.size}:${s.quantity}`).join(",") || "";

                  return (
                    <div
                      key={idx}
                      className="grid grid-cols-4 text-center min-h-[20px] sm:min-h-[22px] items-center border-b border-black last:border-b-0 text-[8px] sm:text-[10px]"
                    >
                      <div className="border-r border-black py-0.5 px-1 truncate font-semibold">
                        {item ? itemSizeStr : "—"}
                      </div>
                      <div className="border-r border-black py-0.5 px-0.5 truncate">
                        {item ? item.productType : "—"}
                      </div>
                      <div className="border-r border-black py-0.5 px-0.5 truncate">
                        {item ? itemFields.fabric || "—" : "—"}
                      </div>
                      <div className="py-0.5 px-0.5 truncate">
                        {item ? itemFields.colour || "—" : "—"}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Right notes box */}
              <div className="col-span-4 p-1.5 flex flex-col justify-between text-[8px] sm:text-[10px]">
                <div>
                  <p className="font-bold text-gray-800">Special Notes:</p>
                  <p className="text-gray-600 mt-0.5">
                    {primaryFields.collarTipping ? `Collar: ${primaryFields.collarTipping}` : ""}
                  </p>
                  <p className="text-gray-600">
                    {remarks ? `Remarks: ${remarks}` : ""}
                  </p>
                </div>
                <div className="text-[7px] sm:text-[9px] text-gray-400 italic text-right">
                  ICE FASHIONS
                </div>
              </div>
            </div>
          </div>

          {/* 6. Table 4: JERSEY PRINTING DETAILS (FRONT & BACK) */}
          <div className="border border-black mb-2 sm:mb-3">
            <div className="grid grid-cols-12 text-center font-bold text-[9px] sm:text-[11px] uppercase bg-[#e5e7eb] border-b border-black">
              <div className="col-span-3 py-1 border-r border-black">FRONT</div>
              <div className="col-span-6 py-1 border-r border-black">JERSEY PRINTING DETAILS</div>
              <div className="col-span-3 py-1">BACK</div>
            </div>

            <div className="grid grid-cols-2 divide-x border-black text-[9px] sm:text-[11px] min-h-[50px] sm:min-h-[70px]">
              {/* Front Print Box */}
              <div className="p-2">
                <p className="font-bold uppercase text-[9px] sm:text-[10px] text-gray-900">
                  Front Print: <span className={frontPrintYes ? "text-emerald-700" : "text-gray-600"}>{frontPrintYes ? "YES" : "NO"}</span>
                </p>
                {frontPrintYes && (
                  <p className="mt-0.5 text-gray-800">
                    Type: <span className="font-bold">{frontPrintType}</span>
                  </p>
                )}
              </div>

              {/* Back Print Box */}
              <div className="p-2">
                <p className="font-bold uppercase text-[9px] sm:text-[10px] text-gray-900">
                  Back Print: <span className={backPrintYes ? "text-emerald-700" : "text-gray-600"}>{backPrintYes ? "YES" : "NO"}</span>
                </p>
                {backPrintYes && (
                  <p className="mt-0.5 text-gray-800">
                    Type: <span className="font-bold">{backPrintType}</span>
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* 7. Footer: Delivery Date & Name/Sign */}
          <div className="flex items-baseline justify-between text-[10px] sm:text-xs font-bold pt-1">
            <div className="flex items-baseline gap-1">
              <span>Delivery Date:</span>
              <span className="border-b border-dotted border-black min-w-[80px] sm:min-w-[140px] px-1 font-semibold text-gray-900">
                {dispatchDate || "—"}
              </span>
            </div>

            <div className="flex items-baseline gap-1">
              <span>NAME/SIGN:</span>
              <span className="border-b border-dotted border-black min-w-[80px] sm:min-w-[140px] px-1 font-semibold text-gray-900 text-center">
                {customerName || "—"}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
