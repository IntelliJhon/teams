"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useOrderStore } from "@/store/order-store";
import { getInvoice, ApiError } from "@/lib/api";

export default function ConfirmationContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get("orderId") ?? "";
  const invoiceToken = searchParams.get("invoiceToken") ?? "";

  const clearOrder = useOrderStore((s) => s.clearOrder);

  const [invoiceLoading, setInvoiceLoading] = useState(false);
  const [invoiceError, setInvoiceError] = useState<string | null>(null);

  // Clear the cart on mount — order is submitted
  useEffect(() => {
    clearOrder();
  }, [clearOrder]);

  const handleDownloadInvoice = async () => {
    setInvoiceError(null);
    setInvoiceLoading(true);
    try {
      await getInvoice(orderId, invoiceToken);
    } catch (err) {
      const msg =
        err instanceof ApiError ? err.message : "Could not download invoice.";
      setInvoiceError(msg);
    } finally {
      setInvoiceLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-5 py-10 text-center">
      {/* Main card */}
      <div className="w-full max-w-sm bg-white rounded-3xl border border-gray-100 shadow-md p-6 flex flex-col items-center">
        {/* Success Icon */}
        <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mb-4 shadow-xs">
          <svg
            className="w-8 h-8 text-emerald-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2.5}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>

        <h1 className="text-2xl font-black text-gray-900 mb-1.5">Order Submitted!</h1>
        <p className="text-xs text-gray-500 mb-5 leading-relaxed max-w-xs">
          Your order has been recorded successfully.
        </p>

        {/* Order ID */}
        {orderId && (
          <div className="bg-gray-50 border border-gray-200/70 rounded-2xl px-5 py-3 mb-5 w-full">
            <p className="text-[11px] text-gray-400 font-semibold mb-0.5 uppercase tracking-wide">
              Order ID
            </p>
            <p className="text-base font-bold text-gray-900 tracking-wider font-mono">
              {orderId}
            </p>
          </div>
        )}

        {/* Invoice download if available */}
        {invoiceToken && (
          <button
            onClick={handleDownloadInvoice}
            disabled={invoiceLoading}
            className="w-full py-3 bg-white border border-emerald-600 text-emerald-700 rounded-2xl font-bold text-xs shadow-xs active:scale-95 transition-all disabled:opacity-60 flex items-center justify-center gap-2 mb-3 cursor-pointer"
          >
            {invoiceLoading ? (
              <>
                <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth={4} />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                <span>Downloading…</span>
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                <span>Download Invoice</span>
              </>
            )}
          </button>
        )}

        {invoiceError && (
          <p className="mb-3 text-xs text-red-500 font-medium">{invoiceError}</p>
        )}

        {/* Done Button — Direct link to WhatsApp chat */}
        <a
          href="https://wa.me/918086863111"
          className="w-full py-4 px-6 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white rounded-2xl font-black text-sm shadow-md shadow-emerald-600/20 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer no-underline"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
          <span>Done</span>
        </a>

        <p className="mt-4 text-[11px] text-gray-400 font-medium">
          Tap <b>Done</b> to return to WhatsApp.
        </p>
      </div>
    </div>
  );
}
