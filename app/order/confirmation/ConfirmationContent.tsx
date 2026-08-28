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
  const [doneClicked, setDoneClicked] = useState(false);

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

  const handleDone = () => {
    setDoneClicked(true);

    // 1. Try closing the in-app browser window
    try {
      window.close();
    } catch {}

    // 2. Try unwinding history back to WhatsApp
    try {
      if (window.history.length > 1) {
        window.history.go(-(window.history.length - 1));
      }
    } catch {}

    // 3. Attempt WhatsApp deep link
    setTimeout(() => {
      try {
        window.location.href = "whatsapp://";
      } catch {}
    }, 100);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-6 py-12 text-center">
      {/* Success icon */}
      <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center mb-6 shadow-sm">
        <svg
          className="w-10 h-10 text-emerald-600"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2.5}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      </div>

      <h1 className="text-2xl font-bold text-gray-900 mb-2">Order Submitted!</h1>
      <p className="text-sm text-gray-500 mb-6 leading-relaxed max-w-xs">
        Your order has been received. Our team will begin production and keep you updated.
      </p>

      {/* Order ID */}
      {orderId && (
        <div className="bg-white border border-gray-100 rounded-2xl px-6 py-4 mb-5 shadow-sm w-full max-w-xs">
          <p className="text-xs text-gray-400 font-medium mb-1">Order ID</p>
          <p className="text-lg font-bold text-gray-900 tracking-wide">{orderId}</p>
          <p className="text-xs text-gray-400 mt-1">Keep this for your records</p>
        </div>
      )}

      {/* Invoice download if available */}
      {invoiceToken && (
        <button
          onClick={handleDownloadInvoice}
          disabled={invoiceLoading}
          className="w-full max-w-xs py-3.5 bg-white border border-emerald-600 text-emerald-700 rounded-2xl font-semibold text-sm shadow-xs active:scale-95 transition-all disabled:opacity-60 flex items-center justify-center gap-2 mb-3 cursor-pointer"
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

      {/* Prominent Done Button */}
      <button
        type="button"
        onClick={handleDone}
        className="w-full max-w-xs py-4 px-6 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white rounded-full font-bold text-base shadow-lg shadow-emerald-600/20 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
        <span>Done</span>
      </button>

      {doneClicked && (
        <div className="mt-3 p-3 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs text-emerald-800 font-medium max-w-xs animate-fade-in">
          ✓ Order saved! You can also tap the <b>✕</b> at the top left to return to your WhatsApp chat.
        </div>
      )}

      <p className="mt-5 text-xs text-gray-400">
        You can close this page. A copy has been sent to your number.
      </p>
    </div>
  );
}
