"use client";

import { useEffect, useState } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import { useOrderStore } from "@/store/order-store";
import { getOrder, updateOrder, ApiError } from "@/lib/api";
import { CartItem } from "@/components/CartItem";
import { ErrorState } from "@/components/ErrorState";
import { BottomButton } from "@/components/BottomButton";
import { Order, ProductLineItem } from "@/types";

type PageState = "loading" | "locked" | "error" | "ready" | "saving";

export default function EditOrderContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();

  const orderId = params.orderId as string;
  const token = searchParams.get("token") ?? "";

  const {
    hydrateFromOrder,
    items,
    customerPhone,
    customerName,
    customerAddress,
    dispatchDate,
    remarks,
    removeItem,
  } = useOrderStore();

  const [pageState, setPageState] = useState<PageState>("loading");
  const [errorMsg, setErrorMsg] = useState("");
  const [order, setOrder] = useState<Order | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  const loadOrder = () => {
    if (!orderId || !token) {
      setErrorMsg("Invalid link — missing order ID or token.");
      setPageState("error");
      return;
    }
    setPageState("loading");
    getOrder(orderId, token)
      .then((fetched: any) => {
        setOrder(fetched);
        if (fetched.status && fetched.status !== "Submitted") {
          setPageState("locked");
          return;
        }

        // Resiliently parse items from raw JSON or sheet columns
        let rawItems = fetched.items || [];
        if (typeof rawItems === "string") {
          try {
            rawItems = JSON.parse(rawItems);
          } catch {
            rawItems = [];
          }
        }

        const cleanItems: ProductLineItem[] = Array.isArray(rawItems)
          ? rawItems.map((it: any, i: number) => {
              let fields = it.fields || {};
              if (typeof fields === "string") {
                try {
                  fields = JSON.parse(fields);
                } catch {}
              }

              let sizeQuantities = it.sizeQuantities || [];
              if (typeof sizeQuantities === "string") {
                try {
                  sizeQuantities = JSON.parse(sizeQuantities);
                } catch {}
              }

              let images = it.images || [];
              if (typeof images === "string") {
                try {
                  images = JSON.parse(images);
                } catch {}
              }

              return {
                lineId: it.lineId || it.id || `item_${i + 1}`,
                productType: it.productType || "Jersey",
                fields,
                sizeQuantities,
                images,
              };
            })
          : [];

        hydrateFromOrder(
          {
            customerPhone: fetched.customerPhone || "",
            customerName: fetched.customerName || "",
            customerAddress: fetched.customerAddress || "",
            dispatchDate: fetched.dispatchDate || new Date().toISOString().split("T")[0],
            remarks: fetched.remarks || "",
          },
          cleanItems,
          orderId,
          token
        );
        setPageState("ready");
      })
      .catch((err) => {
        setErrorMsg(err instanceof ApiError ? err.message : "Could not load this order.");
        setPageState("error");
      });
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { loadOrder(); }, [orderId, token]);

  const handleSave = async () => {
    setSaveError(null);
    setPageState("saving");
    try {
      await updateOrder(orderId, token, {
        customerPhone,
        customerName,
        customerAddress,
        dispatchDate,
        remarks,
        items,
      });
      router.push(`/order/confirmation?orderId=${orderId}&invoiceToken=${token}`);
    } catch (err) {
      setSaveError(err instanceof ApiError ? err.message : "Failed to save changes.");
      setPageState("ready");
    }
  };

  if (pageState === "loading") {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <svg className="animate-spin w-8 h-8 text-green-500" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
        </svg>
        <p className="text-sm text-gray-400 font-medium">Loading order…</p>
      </div>
    );
  }

  if (pageState === "error") {
    return <ErrorState message={errorMsg} fullPage onRetry={loadOrder} />;
  }

  if (pageState === "locked") {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen px-6 text-center">
        <div className="w-16 h-16 rounded-full bg-orange-50 flex items-center justify-center mb-4">
          <svg className="w-8 h-8 text-orange-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>
        <h2 className="text-lg font-bold text-gray-900 mb-2">Order Locked</h2>
        <p className="text-sm text-gray-500 max-w-xs leading-relaxed">
          This order is <strong>{order?.status}</strong> and can no longer be edited.
          Please contact us if you need to make changes.
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-32">
      <div className="bg-white border-b border-gray-100 px-4 py-4 pt-safe">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-orange-500 bg-orange-50 px-2 py-0.5 rounded-full">Editing</span>
          <h1 className="text-base font-bold text-gray-800">Order #{orderId}</h1>
        </div>
        <p className="text-xs text-gray-400 mt-0.5">
          Dispatch: {dispatchDate ? new Date(dispatchDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "—"}
        </p>
      </div>

      <div className="px-4 py-5 space-y-4">
        <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wide">
          Products ({items.length})
        </h2>

        {items.map((item, idx) => (
          <CartItem
            key={item.lineId}
            item={item}
            index={idx}
            onEdit={() => router.push(`/order/new/add-product?edit=${item.lineId}`)}
            onDelete={() => removeItem(item.lineId)}
          />
        ))}

        <button
          onClick={() => router.push("/order/new/add-product")}
          className="w-full py-3.5 border-2 border-dashed border-green-300 rounded-2xl text-green-600 font-semibold text-sm flex items-center justify-center gap-2 active:bg-green-50 cursor-pointer"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Add Product
        </button>
      </div>

      {saveError && (
        <div className="px-4 mb-2">
          <ErrorState message={saveError} onRetry={handleSave} />
        </div>
      )}

      <BottomButton onClick={handleSave} loading={pageState === "saving"} disabled={items.length === 0}>
        Save Changes
      </BottomButton>
    </div>
  );
}
