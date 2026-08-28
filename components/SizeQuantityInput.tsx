"use client";

import React, { useState } from "react";
import { SizeQuantity, PlayerDetail } from "@/types";
import { SIZE_OPTIONS, NUMERIC_SIZE_OPTIONS } from "@/config/product-schemas";
import { JerseyPlayerModal } from "./JerseyPlayerModal";

interface SizeQuantityInputProps {
  value: SizeQuantity[];
  onChange: (rows: SizeQuantity[]) => void;
  isJersey?: boolean;
  error?: string;
}

export function SizeQuantityInput({
  value,
  onChange,
  isJersey = false,
  error,
}: SizeQuantityInputProps) {
  const rows = value.length > 0 ? value : [];

  // State for active modal to edit player names & numbers
  const [modalIndex, setModalIndex] = useState<number | null>(null);

  const addRow = (size = "") => {
    const newRow: SizeQuantity = { size, quantity: 1, players: [] };
    const updated = [...rows, newRow];
    onChange(updated);

    // If it's a Jersey and a size is tapped from reference grid, offer player details popup
    if (isJersey && size) {
      setModalIndex(updated.length - 1);
    }
  };

  const removeRow = (idx: number) => {
    onChange(rows.filter((_, i) => i !== idx));
  };

  const updateSize = (idx: number, size: string) => {
    onChange(rows.map((r, i) => (i === idx ? { ...r, size } : r)));
  };

  const updateQty = (idx: number, quantity: number) => {
    onChange(
      rows.map((r, i) => {
        if (i !== idx) return r;
        const currentPlayers = r.players || [];
        return {
          ...r,
          quantity,
          players: currentPlayers.slice(0, quantity),
        };
      })
    );
  };

  const handleSavePlayers = (idx: number, players: PlayerDetail[]) => {
    onChange(
      rows.map((r, i) => (i === idx ? { ...r, players } : r))
    );
  };

  const totalQty = rows.reduce((sum, r) => sum + (r.quantity || 0), 0);

  const activeRowForModal = modalIndex !== null ? rows[modalIndex] : null;

  return (
    <div className="mb-6">
      {/* Reference Numeric Size Grid */}
      <div className="bg-gray-50 border border-gray-100 rounded-2xl p-4 mb-5 text-center">
        <p className="text-xs text-gray-400 font-medium mb-2.5">
          Available Size References (Tap to add)
        </p>
        <div className="grid grid-cols-5 gap-2 max-w-xs mx-auto text-sm font-semibold text-gray-800">
          {NUMERIC_SIZE_OPTIONS.map((sz) => {
            const isAdded = rows.some((r) => r.size === sz);
            return (
              <button
                key={sz}
                type="button"
                onClick={() => {
                  if (!isAdded) addRow(sz);
                }}
                className={`py-1.5 px-1 rounded-lg border text-xs transition-colors cursor-pointer ${
                  isAdded
                    ? "bg-emerald-50 border-emerald-500 text-emerald-700 font-bold"
                    : "bg-white border-gray-200 text-gray-700 hover:border-gray-300 active:bg-gray-100"
                }`}
              >
                {sz}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex items-center justify-between mb-3">
        <label className="text-sm font-semibold text-gray-700">
          Sizes &amp; Quantities <span className="text-red-500">*</span>
        </label>
        {totalQty > 0 && (
          <span className="text-xs text-emerald-700 font-semibold bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
            Total: {totalQty} pcs
          </span>
        )}
      </div>

      {/* Column headers */}
      {rows.length > 0 && (
        <div className="grid grid-cols-[1fr_auto_auto] gap-2 mb-1.5 px-1">
          <span className="text-xs text-gray-400 font-medium">Size</span>
          <span className="text-xs text-gray-400 font-medium w-24 text-center">
            Quantity
          </span>
          <span className="w-8" />
        </div>
      )}

      <div className="space-y-3">
        {rows.map((row, idx) => {
          const filledPlayers = (row.players || []).filter(
            (p) => (p.number && p.number.trim()) || (p.name && p.name.trim())
          );

          return (
            <div key={idx} className="bg-white border border-gray-200 rounded-2xl p-3 shadow-2xs">
              <div className="grid grid-cols-[1fr_auto_auto] gap-2 items-center">
                {/* Size dropdown */}
                <div className="relative">
                  <select
                    value={row.size}
                    onChange={(e) => updateSize(idx, e.target.value)}
                    className={`w-full appearance-none bg-white border rounded-xl px-3 py-2.5 text-sm text-gray-800 font-medium pr-8 focus:outline-none transition-colors ${
                      row.size ? "border-emerald-500" : "border-gray-300"
                    }`}
                  >
                    <option value="">Select size…</option>
                    <optgroup label="Standard Sizes">
                      {SIZE_OPTIONS.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </optgroup>
                    <optgroup label="Numeric Sizes">
                      {NUMERIC_SIZE_OPTIONS.map((s) => (
                        <option key={s} value={s}>
                          Size {s}
                        </option>
                      ))}
                    </optgroup>
                  </select>
                  <svg
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </div>

                {/* Qty stepper */}
                <div className="flex items-center border border-gray-300 rounded-xl overflow-hidden w-24 bg-white">
                  <button
                    type="button"
                    onClick={() =>
                      updateQty(idx, Math.max(1, (row.quantity || 1) - 1))
                    }
                    className="w-8 h-10 flex items-center justify-center text-gray-500 text-base font-bold active:bg-gray-100 cursor-pointer"
                  >
                    −
                  </button>
                  <input
                    type="number"
                    min={1}
                    value={row.quantity}
                    onChange={(e) =>
                      updateQty(
                        idx,
                        Math.max(1, parseInt(e.target.value) || 1)
                      )
                    }
                    className="flex-1 text-center text-sm font-semibold text-gray-900 focus:outline-none py-2 w-0"
                  />
                  <button
                    type="button"
                    onClick={() => updateQty(idx, (row.quantity || 1) + 1)}
                    className="w-8 h-10 flex items-center justify-center text-gray-500 text-base font-bold active:bg-gray-100 cursor-pointer"
                  >
                    +
                  </button>
                </div>

                {/* Remove row */}
                <button
                  type="button"
                  onClick={() => removeRow(idx)}
                  className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 text-gray-400 active:bg-red-50 active:text-red-500 transition-colors cursor-pointer"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2.5}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>

              {/* Jersey Names & Numbers Section (Only for Jersey) */}
              {isJersey && row.size && row.quantity > 0 && (
                <div className="mt-2.5 pt-2.5 border-t border-gray-100">
                  <div className="flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => setModalIndex(idx)}
                      className="text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <span>🎽</span>
                      <span>
                        {filledPlayers.length > 0
                          ? `Edit Player Names & Numbers (${filledPlayers.length}/${row.quantity})`
                          : `+ Enter Player Names & Numbers (${row.quantity} jerseys)`}
                      </span>
                    </button>

                    <span className="text-[11px] text-gray-400 font-normal">
                      (Optional)
                    </span>
                  </div>

                  {/* Preview of entered player details */}
                  {filledPlayers.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {filledPlayers.map((p, pIdx) => (
                        <span
                          key={pIdx}
                          className="text-[11px] font-semibold bg-gray-100 text-gray-800 px-2 py-0.5 rounded-lg border border-gray-200"
                        >
                          {p.number ? `#${p.number}` : ""} {p.name || ""}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Add size button */}
      <button
        type="button"
        onClick={() => addRow()}
        className="mt-3.5 flex items-center gap-2 text-emerald-700 text-sm font-semibold active:opacity-70 cursor-pointer"
      >
        <span className="w-6 h-6 rounded-full bg-emerald-50 flex items-center justify-center border border-emerald-200">
          <svg
            className="w-3.5 h-3.5 text-emerald-700"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 4v16m8-8H4"
            />
          </svg>
        </span>
        Add Size Row
      </button>

      {error && (
        <p className="mt-2 text-xs text-red-500 font-medium">{error}</p>
      )}

      {/* Jersey Player Modal */}
      {modalIndex !== null && activeRowForModal && (
        <JerseyPlayerModal
          isOpen={true}
          size={activeRowForModal.size || "Selected"}
          quantity={activeRowForModal.quantity || 1}
          players={activeRowForModal.players || []}
          onSave={(players) => handleSavePlayers(modalIndex, players)}
          onClose={() => setModalIndex(null)}
        />
      )}
    </div>
  );
}
