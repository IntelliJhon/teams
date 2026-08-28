"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useOrderStore } from "@/store/order-store";
import { submitOrder, ApiError } from "@/lib/api";
import { ProgressBar } from "@/components/ProgressBar";
import { ErrorState } from "@/components/ErrorState";
import { productSchemas } from "@/config/product-schemas";
import { IceFashionsOrderForm } from "@/components/IceFashionsOrderForm";

import { downloadIceFashionsPdf } from "@/lib/downloadPdf";

export default function ReviewPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showOrderFormModal, setShowOrderFormModal] = useState(false);

  const {
    customerPhone,
    customerName,
    customerAddress,
    dispatchDate,
    remarks,
    items,
  } = useOrderStore();

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleDirectDownloadPdf = async () => {
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
  };

  const handleSubmit = async () => {
    setError(null);
    setLoading(true);
    try {
      const finalOrderId = `ORD-${Date.now()}`;
      const result = await submitOrder({
        orderId: finalOrderId,
        customerPhone,
        customerName,
        customerAddress,
        dispatchDate,
        remarks,
        items,
      });
      router.push(
        `/order/confirmation?orderId=${result.orderId || finalOrderId}&invoiceToken=${result.invoiceToken || ""}`
      );
    } catch (err) {
      const msg =
        err instanceof ApiError
          ? err.message
          : "Something went wrong. Please try again.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  if (!mounted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-8 h-8 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-36">
      <ProgressBar currentStep={4} totalSteps={4} label="Review & Submit" />

      <div className="pt-14 px-4 py-5">
        <h1 className="text-xl font-bold text-gray-900">Review Order</h1>
        <p className="text-sm text-gray-500 mt-1">
          Check everything before submitting or download your Ice Fashions form.
        </p>
      </div>

      {/* Download / View Order Form Button Card */}
      <div className="mx-4 mb-4 bg-emerald-50/80 border-2 border-emerald-600 rounded-2xl p-3.5 shadow-xs">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center flex-shrink-0 shadow-xs">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <div>
            <div className="text-sm font-bold text-emerald-950">Ice Fashions Order Form</div>
            <div className="text-xs text-emerald-700 font-medium">Download filled 1-page A4 PDF or preview on screen</div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={handleDirectDownloadPdf}
            className="py-2.5 px-3 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold text-xs rounded-xl shadow-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            <span>Download PDF</span>
          </button>

          <button
            type="button"
            onClick={() => setShowOrderFormModal(true)}
            className="py-2.5 px-3 bg-white hover:bg-emerald-50 active:bg-emerald-100 text-emerald-900 border border-emerald-300 font-semibold text-xs rounded-xl flex items-center justify-center gap-1 transition-all cursor-pointer"
          >
            <span>View Form</span>
            <span>→</span>
          </button>
        </div>
      </div>

      {/* Order header summary */}
      <div className="mx-4 bg-white rounded-2xl border border-gray-100 shadow-sm p-4 mb-4">
        <h2 className="text-sm font-bold text-gray-700 mb-3 uppercase tracking-wide">
          Order Details
        </h2>
        <div className="space-y-2">
          <Row label="Phone" value={customerPhone || "—"} />
          {customerName && <Row label="Name" value={customerName} />}
          {customerAddress && <Row label="Address" value={customerAddress} />}
          {dispatchDate && <Row label="Dispatch Date" value={dispatchDate} />}
          {remarks && <Row label="Remarks" value={remarks} />}
        </div>
      </div>

      {/* Line items */}
      <div className="px-4 space-y-4">
        <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wide">
          Products ({items.length})
        </h2>

        {items.map((item, idx) => {
          const schema = productSchemas[item.productType] ?? [];
          const totalQty = item.sizeQuantities.reduce((s, r) => s + r.quantity, 0);

          return (
            <div
              key={item.lineId}
              className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4"
            >
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xs font-semibold text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
                  #{idx + 1}
                </span>
                <span className="font-bold text-gray-900 text-base">
                  {item.productType}
                </span>
                <span className="text-xs text-gray-400 font-medium ml-auto">
                  {totalQty} pcs
                </span>
              </div>

              {/* Field values */}
              <div className="space-y-1.5 mb-3 text-xs">
                {schema.map((f) => {
                  const val = item.fields[f.id];
                  if (val === undefined || val === "" || val === false) return null;
                  const displayVal = typeof val === "boolean" ? (val ? "Yes" : "No") : String(val);
                  return (
                    <div key={f.id} className="flex gap-2">
                      <span className="text-gray-400 font-medium min-w-[130px] flex-shrink-0">
                        {f.label}
                      </span>
                      <span className="text-gray-800 font-semibold">{displayVal}</span>
                    </div>
                  );
                })}
              </div>

              {/* Sizes summary & jersey player details */}
              <div className="mt-3 pt-3 border-t border-gray-100">
                <p className="text-xs text-gray-400 font-medium mb-1.5">Sizes</p>
                <div className="space-y-2">
                  <div className="flex flex-wrap gap-1.5">
                    {item.sizeQuantities.map((sq) => (
                      <span
                        key={sq.size}
                        className="px-2.5 py-1 bg-gray-50 border border-gray-200 rounded-lg text-xs font-semibold text-gray-700"
                      >
                        {sq.size} × {sq.quantity}
                      </span>
                    ))}
                  </div>

                  {/* Player Names/Numbers summary for Jersey */}
                  {item.productType === "Jersey" &&
                    item.sizeQuantities.some((sq) => sq.players && sq.players.length > 0) && (
                      <div className="mt-2 bg-emerald-50/60 border border-emerald-100 rounded-xl p-2.5 text-xs">
                        <p className="font-bold text-emerald-900 mb-1">Jersey Player Details:</p>
                        <div className="space-y-1">
                          {item.sizeQuantities
                            .filter((sq) => sq.players && sq.players.length > 0)
                            .map((sq) => {
                              const validPlayers = (sq.players || []).filter((p) => p.number || p.name);
                              if (validPlayers.length === 0) return null;
                              return (
                                <div key={sq.size} className="text-gray-700">
                                  <span className="font-semibold text-emerald-800">Size {sq.size}: </span>
                                  {validPlayers.map((p, pIdx) => (
                                    <span key={pIdx} className="inline-block bg-white px-1.5 py-0.5 rounded border border-emerald-200 text-[11px] font-medium mr-1 mb-0.5">
                                      {p.number ? `#${p.number}` : ""} {p.name || ""}
                                    </span>
                                  ))}
                                </div>
                              );
                            })}
                        </div>
                      </div>
                    )}
                </div>
              </div>

              {/* Images */}
              {item.images.length > 0 && (
                <div className="mt-3 pt-3 border-t border-gray-100 flex gap-2">
                  {item.images.map((img, i) => (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      key={i}
                      src={img.url}
                      alt=""
                      className="w-12 h-12 rounded-xl object-cover border border-gray-200"
                    />
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Error */}
      {error && (
        <div className="px-4 mt-4">
          <ErrorState message={error} onRetry={handleSubmit} />
        </div>
      )}

      {/* Bottom Sticky Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/95 backdrop-blur-sm border-t border-gray-100 flex items-center gap-3">
        <button
          type="button"
          onClick={handleDirectDownloadPdf}
          className="py-3.5 px-4 rounded-full border-2 border-emerald-600 text-emerald-700 font-semibold text-sm hover:bg-emerald-50 active:bg-emerald-100 transition-colors flex items-center justify-center gap-1.5 flex-shrink-0 cursor-pointer"
          title="Direct Download PDF"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Direct PDF
        </button>

        <button
          type="button"
          onClick={handleSubmit}
          disabled={loading}
          className="flex-1 py-3.5 px-4 rounded-full bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-medium text-base transition-colors shadow-sm disabled:opacity-50 flex items-center justify-center cursor-pointer"
        >
          {loading ? "Submitting…" : "Submit Order"}
        </button>
      </div>

      {/* ICE FASHIONS Form Modal */}
      {showOrderFormModal && (
        <IceFashionsOrderForm onClose={() => setShowOrderFormModal(false)} />
      )}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-2 text-sm">
      <span className="text-gray-400 font-medium min-w-[100px] flex-shrink-0">{label}</span>
      <span className="text-gray-800 font-semibold flex-1">{value}</span>
    </div>
  );
}
