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
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-6 py-12 text-center">
      {/* Success icon */}
      <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mb-6">
        <svg
          className="w-10 h-10 text-green-500"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2.5}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      </div>

      <h1 className="text-2xl font-bold text-gray-900 mb-2">Order Submitted!</h1>
      <p className="text-sm text-gray-500 mb-8 leading-relaxed max-w-xs">
        Your order has been received. Our team will begin production and keep you updated.
      </p>

      {/* Order ID */}
      {orderId && (
        <div className="bg-white border border-gray-100 rounded-2xl px-6 py-4 mb-6 shadow-sm w-full max-w-xs">
          <p className="text-xs text-gray-400 font-medium mb-1">Order ID</p>
          <p className="text-lg font-bold text-gray-900 tracking-wide">{orderId}</p>
          <p className="text-xs text-gray-400 mt-1">Keep this for your records</p>
        </div>
      )}

      {/* Invoice download */}
      {invoiceToken && (
        <button
          onClick={handleDownloadInvoice}
          disabled={invoiceLoading}
          className="w-full max-w-xs py-4 bg-green-500 text-white rounded-2xl font-semibold text-base shadow-lg shadow-green-500/20 active:scale-95 transition-all disabled:opacity-60 flex items-center justify-center gap-2"
        >
          {invoiceLoading ? (
            <>
              <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
              Downloading…
            </>
          ) : (
            <>
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Download Invoice
            </>
          )}
        </button>
      )}

      {invoiceError && (
        <p className="mt-3 text-xs text-red-500 font-medium">{invoiceError}</p>
      )}

      <p className="mt-8 text-xs text-gray-400">
        You can close this page. A copy has been sent to your number.
      </p>
    </div>
  );
}
