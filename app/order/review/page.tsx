"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useOrderStore } from "@/store/order-store";
import { submitOrder } from "@/lib/api";
import { ApiError } from "@/lib/api";
import { ProgressBar } from "@/components/ProgressBar";
import { BottomButton } from "@/components/BottomButton";
import { ErrorState } from "@/components/ErrorState";
import { productSchemas } from "@/config/product-schemas";
import { IceFashionsOrderForm } from "@/components/IceFashionsOrderForm";

export default function ReviewPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [showOrderFormModal, setShowOrderFormModal] = useState(false);

  const {
    customerPhone,
    customerName,
    customerAddress,
    dispatchDate,
    remarks,
    items,
  } = useOrderStore();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

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
      <div className="mx-4 mb-4">
        <button
          type="button"
          onClick={() => setShowOrderFormModal(true)}
          className="w-full py-3.5 px-4 bg-emerald-50 hover:bg-emerald-100/80 active:bg-emerald-200/70 border-2 border-emerald-600 text-emerald-900 font-bold text-sm rounded-2xl flex items-center justify-between shadow-xs transition-all cursor-pointer"
        >
          <div className="flex items-center gap-3 text-left">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center flex-shrink-0 shadow-xs">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div>
              <div className="text-sm font-bold text-emerald-950">Download Ice Fashions Form</div>
              <div className="text-xs text-emerald-700 font-medium">View &amp; Save filled PDF order form</div>
            </div>
          </div>

          <div className="text-xs font-semibold px-3 py-1.5 bg-emerald-600 text-white rounded-xl flex items-center gap-1">
            <span>View PDF</span>
            <span>→</span>
          </div>
        </button>
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
                <h3 className="font-bold text-gray-800 text-sm">{item.productType}</h3>
                <span className="ml-auto text-xs text-gray-400">
                  {totalQty} pcs
                </span>
              </div>

              {/* All fields */}
              <div className="space-y-1.5 mb-3">
                {schema.map((def) => {
                  // Respect conditional visibility
                  if (def.conditionalOn) {
                    const watchVal = item.fields[def.conditionalOn.field];
                    if (watchVal !== def.conditionalOn.value) return null;
                  }
                  const val = item.fields[def.id];
                  if (!val) return null;
                  return (
                    <Row
                      key={def.id}
                      label={def.label.replace("Select Your ", "").replace("Select ", "")}
                      value={String(val)}
                    />
                  );
                })}
              </div>

              {/* Sizes */}
              {item.sizeQuantities.length > 0 && (
                <div className="pt-2 border-t border-gray-100">
                  <p className="text-xs font-semibold text-gray-500 mb-1.5">Sizes</p>
                  <div className="flex flex-wrap gap-1.5">
                    {item.sizeQuantities.map((s, i) => {
                      const filled = (s.players || []).filter((p) => p.number || p.name);
                      return (
                        <span
                          key={i}
                          className="text-xs font-medium text-gray-700 bg-gray-100 px-2.5 py-1 rounded-lg"
                        >
                          {s.size} × {s.quantity}
                          {filled.length > 0 && (
                            <span className="ml-1.5 text-[11px] font-bold text-emerald-700">
                              ({filled.map((p) => `${p.number ? '#' + p.number : ''} ${p.name || ''}`.trim()).join(", ")})
                            </span>
                          )}
                        </span>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Images */}
              {item.images.length > 0 && (
                <div className="mt-2 flex gap-2">
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
          onClick={() => setShowOrderFormModal(true)}
          className="py-3.5 px-4 rounded-full border-2 border-emerald-600 text-emerald-700 font-semibold text-sm hover:bg-emerald-50 active:bg-emerald-100 transition-colors flex items-center justify-center gap-1.5 flex-shrink-0 cursor-pointer"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          PDF Form
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
