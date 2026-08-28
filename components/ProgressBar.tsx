"use client";

import Link from "next/link";
import { useOrderStore } from "@/store/order-store";

interface ProgressBarProps {
  currentStep: number;
  totalSteps: number;
  label?: string;
  showCart?: boolean;
}

export function ProgressBar({
  currentStep,
  totalSteps,
  label,
  showCart = true,
}: ProgressBarProps) {
  const pct = Math.round((currentStep / totalSteps) * 100);
  const items = useOrderStore((s) => s.items);
  const itemsCount = items.length;
  const totalQty = items.reduce(
    (sum, it) => sum + it.sizeQuantities.reduce((s, r) => s + r.quantity, 0),
    0
  );

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-100 px-4 pt-safe">
      <div className="flex items-center justify-between py-2 text-xs text-gray-500 font-medium">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-gray-800">
            {label ?? `Step ${currentStep} of ${totalSteps}`}
          </span>
          <span className="text-[11px] text-gray-400 font-normal">({pct}%)</span>
        </div>

        {showCart && (
          <Link
            href="/order/new/cart"
            className={`flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-bold transition-all active:scale-95 ${
              itemsCount > 0
                ? "bg-emerald-50 border-emerald-300 text-emerald-800 shadow-2xs hover:bg-emerald-100"
                : "bg-gray-50 border-gray-200 text-gray-400 hover:bg-gray-100"
            }`}
            title="View Cart"
          >
            <div className="relative flex items-center justify-center">
              <svg
                className="w-4 h-4 text-emerald-700"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                />
              </svg>
              {itemsCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 w-3.5 h-3.5 bg-emerald-600 text-white rounded-full text-[9px] font-black flex items-center justify-center">
                  {itemsCount}
                </span>
              )}
            </div>
            <span className="font-semibold text-emerald-900 ml-0.5">Cart</span>
            {totalQty > 0 && (
              <span className="text-[10px] text-emerald-700 font-normal">
                ({totalQty} pcs)
              </span>
            )}
          </Link>
        )}
      </div>

      <div className="h-1 w-full bg-gray-100 rounded-full overflow-hidden mb-1">
        <div
          className="h-full bg-emerald-600 rounded-full transition-all duration-300"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
