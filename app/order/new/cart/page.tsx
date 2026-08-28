"use client";

import { useRouter } from "next/navigation";
import { useOrderStore } from "@/store/order-store";
import { CartItem } from "@/components/CartItem";
import { ProgressBar } from "@/components/ProgressBar";
import { BottomButton } from "@/components/BottomButton";
import { useEffect, useState } from "react";

export default function CartPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const { items, removeItem, dispatchDate } = useOrderStore();

  useEffect(() => {
    setMounted(true);
  }, []);

  // Guard: if no header info, send back to start
  useEffect(() => {
    if (mounted && !dispatchDate) {
      router.replace("/order/new");
    }
  }, [dispatchDate, router, mounted]);

  const handleEdit = (lineId: string) => {
    router.push(`/order/new/add-product?edit=${lineId}`);
  };

  const handleDelete = (lineId: string) => {
    removeItem(lineId);
  };

  if (!mounted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-8 h-8 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const isEmpty = items.length === 0;

  return (
    <div className="min-h-screen bg-gray-50 pb-32">
      <ProgressBar currentStep={3} totalSteps={4} label="Your Cart" />

      <div className="pt-14 px-4 py-5">
        <h1 className="text-xl font-bold text-gray-900">Your Cart</h1>
        <p className="text-sm text-gray-500 mt-1">
          {items.length === 0
            ? "No products added yet."
            : `${items.length} product${items.length !== 1 ? "s" : ""} added`}
        </p>
      </div>

      <div className="px-4 space-y-4">
        {isEmpty ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4 text-3xl">
              🛒
            </div>
            <p className="text-gray-500 text-sm font-medium">
              Add your first product to get started
            </p>
          </div>
        ) : (
          items.map((item, idx) => (
            <CartItem
              key={item.lineId}
              item={item}
              index={idx}
              onEdit={() => handleEdit(item.lineId)}
              onDelete={() => handleDelete(item.lineId)}
            />
          ))
        )}
      </div>

      {/* Add another product */}
      <div className="px-4 mt-4">
        <button
          onClick={() => router.push("/order/new/add-product")}
          className="w-full py-3.5 border-2 border-dashed border-emerald-300 rounded-2xl text-emerald-600 font-semibold text-sm flex items-center justify-center gap-2 active:bg-emerald-50 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Add Another Product
        </button>
      </div>

      {!isEmpty && (
        <BottomButton onClick={() => router.push("/order/review")}>
          Review Order →
        </BottomButton>
      )}
    </div>
  );
}
