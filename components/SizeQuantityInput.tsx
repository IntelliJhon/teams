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
  /**
   * Back print master name list (number · name · size). When given, it is the single
   * source of player names: size rows can be filled from it and each row's
   * player names are that size's slice of the list.
   */
  nameList?: PlayerDetail[];
  onNameListChange?: (list: PlayerDetail[]) => void;
}

const isFilled = (p: PlayerDetail) => Boolean((p.number || "").trim() || (p.name || "").trim());

export function SizeQuantityInput({
  value,
  onChange,
  isJersey = false,
  error,
  nameList,
  onNameListChange,
}: SizeQuantityInputProps) {
  const rows = value.length > 0 ? value : [];
  const usesMasterList = Boolean(onNameListChange);
  const masterList = (nameList ?? []).filter(isFilled);

  // Names per size from the master list, in the order sizes first appear
  const sizeCounts = masterList.reduce<{ size: string; count: number }[]>((acc, p) => {
    if (!p.size) return acc;
    const hit = acc.find((c) => c.size === p.size);
    if (hit) hit.count += 1;
    else acc.push({ size: p.size, count: 1 });
    return acc;
  }, []);
  const unsizedCount = masterList.filter((p) => !p.size).length;
  const rowsMatchList = sizeCounts.every((c) =>
    rows.some((r) => r.size === c.size && (r.quantity || 0) >= c.count)
  );

  const namesForRow = (row: SizeQuantity) =>
    usesMasterList ? masterList.filter((p) => p.size === row.size) : (row.players || []).filter(isFilled);

  // Create / raise size rows so every size in the name list has room for its names
  const applyListSizes = () => {
    // The untouched default row (one size, quantity 1) is replaced if the list doesn't use that size
    const onlyDefaultRow =
      rows.length === 1 && (rows[0].quantity || 1) === 1 && !sizeCounts.some((c) => c.size === rows[0].size);
    const next = onlyDefaultRow ? [] : rows.map((r) => ({ ...r }));
    for (const { size, count } of sizeCounts) {
      const row = next.find((r) => r.size === size);
      if (row) row.quantity = Math.max(row.quantity || 1, count);
      else next.push({ size, quantity: count, players: [] });
    }
    onChange(next);
  };

  // State for active modal to edit player names & numbers
  const [modalIndex, setModalIndex] = useState<number | null>(null);

  // What the customer is typing in a quantity box; lets the box be empty mid-edit
  // while the saved quantity never drops below 1
  const [qtyDraft, setQtyDraft] = useState<{ idx: number; text: string } | null>(null);

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
    if (usesMasterList && onNameListChange) {
      // Replace this size's slice of the master list
      const size = rows[idx]?.size || "";
      const others = (nameList ?? []).filter((p) => isFilled(p) && p.size !== size);
      onNameListChange([...others, ...players.filter(isFilled).map((p) => ({ ...p, size }))]);
      return;
    }
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

      {/* Name list summary: fill sizes from the back print name list */}
      {usesMasterList && masterList.length > 0 && (
        <div className="mb-5 rounded-2xl border border-emerald-200 bg-emerald-50/60 p-3.5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-emerald-900">
                📝 Name List: {masterList.length} player{masterList.length === 1 ? "" : "s"}
              </p>
              {sizeCounts.length > 0 && (
                <p className="text-xs text-emerald-800 mt-0.5">
                  {sizeCounts.map((c) => `${c.size} × ${c.count}`).join("  ·  ")}
                </p>
              )}
            </div>
            {sizeCounts.length > 0 && !rowsMatchList && (
              <button
                type="button"
                onClick={applyListSizes}
                className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold cursor-pointer"
              >
                Use these sizes
              </button>
            )}
            {sizeCounts.length > 0 && rowsMatchList && (
              <span className="text-xs font-semibold text-emerald-700">✓ Sizes match the list</span>
            )}
          </div>
          {unsizedCount > 0 && (
            <p className="text-xs text-amber-700 mt-2">
              ⚠ {unsizedCount} name{unsizedCount === 1 ? " has" : "s have"} no size — go back to the Name List and pick a size.
            </p>
          )}
        </div>
      )}

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
          const filledPlayers = namesForRow(row);
          const qty = row.quantity || 0;

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
                    onClick={() => {
                      setQtyDraft(null);
                      updateQty(idx, Math.max(1, (row.quantity || 1) - 1));
                    }}
                    disabled={(row.quantity || 1) <= 1}
                    className="w-8 h-10 flex items-center justify-center text-gray-500 text-base font-bold active:bg-gray-100 cursor-pointer disabled:text-gray-300 disabled:cursor-not-allowed"
                  >
                    −
                  </button>
                  <input
                    type="number"
                    inputMode="numeric"
                    min={1}
                    value={qtyDraft?.idx === idx ? qtyDraft.text : row.quantity}
                    onFocus={(e) => e.target.select()}
                    onChange={(e) => {
                      // digits only, no leading zeros, so 0 can never be entered
                      const text = e.target.value.replace(/[^0-9]/g, "").replace(/^0+/, "");
                      setQtyDraft({ idx, text });
                      const n = parseInt(text, 10);
                      if (n >= 1) updateQty(idx, n);
                    }}
                    onBlur={() => setQtyDraft(null)}
                    className="flex-1 text-center text-sm font-semibold text-gray-900 focus:outline-none py-2 w-0"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setQtyDraft(null);
                      updateQty(idx, (row.quantity || 1) + 1);
                    }}
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

              {/* Player Names & Numbers (Jersey, or any product using the name list) */}
              {(isJersey || usesMasterList) && row.size && row.quantity > 0 && (
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

                    {filledPlayers.length === 0 ? (
                      <span className="text-[11px] text-gray-400 font-normal">(Optional)</span>
                    ) : filledPlayers.length === qty ? (
                      <span className="text-[11px] font-semibold text-emerald-700">✓ All {qty} names added</span>
                    ) : filledPlayers.length < qty ? (
                      <span className="text-[11px] font-semibold text-amber-700">
                        {filledPlayers.length} of {qty} names added
                      </span>
                    ) : (
                      <span className="text-[11px] font-semibold text-red-600">
                        {filledPlayers.length} names but quantity is {qty}
                      </span>
                    )}
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
          quantity={Math.max(activeRowForModal.quantity || 1, namesForRow(activeRowForModal).length)}
          players={namesForRow(activeRowForModal)}
          onSave={(players) => handleSavePlayers(modalIndex, players)}
          onClose={() => setModalIndex(null)}
        />
      )}
    </div>
  );
}
