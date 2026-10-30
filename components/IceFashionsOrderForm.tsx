"use client";

import React, { useState } from "react";
import { useOrderStore } from "@/store/order-store";
import { buildOrderSummary } from "@/lib/orderSummary";
import { OrderSheet } from "@/components/OrderSheet";
import { downloadIceFashionsPdf } from "@/lib/downloadPdf";
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

  const summary = buildOrderSummary(
    { customerPhone, customerName, customerAddress, dispatchDate, remarks },
    items
  );

  // Order number is only for the printed form; keep it stable while the form is open
  const [orderNumber] = useState(
    () => `IF-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`
  );

  const handleDownloadPdf = async () => {
    setDownloading(true);
    try {
      await downloadIceFashionsPdf({
        customer: {
          customerPhone,
          customerName,
          customerAddress,
          dispatchDate,
          remarks,
        },
        items,
      });
    } catch (err) {
      console.error("PDF download error:", err);
      toast.error("Could not download file. Please try again.");
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
            A4 · {summary.products.length} product{summary.products.length === 1 ? "" : "s"}
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
        <OrderSheet summary={summary} orderNumber={orderNumber} />
      </div>
    </div>
  );
}
