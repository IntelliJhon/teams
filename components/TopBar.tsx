"use client";

import { useState } from "react";
import Link from "next/link";
import { useOrderStore } from "@/store/order-store";

interface TopBarProps {
  title: string;
  onBack?: () => void;
  onClose?: () => void;
  showMenu?: boolean;
  showClose?: boolean;
  showCart?: boolean;
  progressStep?: {
    current: number;
    total: number;
  };
}

export function TopBar({
  title,
  onBack,
  onClose,
  showMenu = true,
  showClose = true,
  showCart = true,
  progressStep,
}: TopBarProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const items = useOrderStore((s) => s.items);
  const itemsCount = items.length;
  const totalQty = items.reduce(
    (sum, it) => sum + it.sizeQuantities.reduce((s, r) => s + r.quantity, 0),
    0
  );

  return (
    <header className="sticky top-0 z-40 bg-white">
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
        <div className="flex items-center gap-3 min-w-0">
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              className="p-1 -ml-1 text-gray-800 hover:text-gray-900 active:scale-95 transition-transform cursor-pointer"
              aria-label="Go back"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M10 19l-7-7m0 0l7-7m-7 7h18"
                />
              </svg>
            </button>
          )}
          <h1 className="text-base sm:text-lg font-semibold text-gray-900 truncate">
            {title}
          </h1>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0 relative">
          {/* Live Cart Icon Button */}
          {showCart && (
            <Link
              href="/order/new/cart"
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-full border text-xs font-bold transition-all active:scale-95 ${
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
              <span className="hidden sm:inline font-semibold text-emerald-900 ml-0.5">
                Cart
              </span>
              {totalQty > 0 && (
                <span className="text-[10px] text-emerald-700 font-normal">
                  ({totalQty} pcs)
                </span>
              )}
            </Link>
          )}

          {showMenu && (
            <div className="relative">
              <button
                type="button"
                onClick={() => setMenuOpen(!menuOpen)}
                className="p-1 text-gray-700 hover:text-gray-900 active:scale-95 cursor-pointer"
                aria-label="More options"
              >
                <svg
                  className="w-5 h-5"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                </svg>
              </button>

              {menuOpen && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setMenuOpen(false)}
                  />
                  <div className="absolute right-0 mt-2 w-44 bg-white rounded-2xl shadow-lg border border-gray-100 py-1.5 z-20 text-sm">
                    <button
                      type="button"
                      onClick={() => {
                        setMenuOpen(false);
                        window.location.reload();
                      }}
                      className="w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-50"
                    >
                      Refresh page
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setMenuOpen(false);
                        if (onClose) onClose();
                      }}
                      className="w-full text-left px-4 py-2 text-red-600 hover:bg-red-50"
                    >
                      Close / Reset
                    </button>
                  </div>
                </>
              )}
            </div>
          )}

          {showClose && (
            <button
              type="button"
              onClick={onClose}
              className="p-1 text-gray-700 hover:text-gray-900 active:scale-95 cursor-pointer"
              aria-label="Close"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Segmented Progress bar directly under header */}
      {progressStep && (
        <div className="flex w-full h-1 bg-gray-100">
          {Array.from({ length: progressStep.total }).map((_, idx) => {
            const isActive = idx < progressStep.current;
            return (
              <div
                key={idx}
                className={`h-full flex-1 transition-all duration-300 ${
                  isActive ? "bg-emerald-600" : "bg-gray-100"
                } ${idx > 0 ? "border-l border-white" : ""}`}
              />
            );
          })}
        </div>
      )}
    </header>
  );
}
