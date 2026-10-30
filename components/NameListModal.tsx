"use client";

import React, { useState } from "react";
import { PlayerDetail, ProductImage } from "@/types";
import { ReferenceFilePanel } from "./ReferenceFilePanel";
import { SIZE_OPTIONS, NUMERIC_SIZE_OPTIONS } from "@/config/product-schemas";

interface NameListModalProps {
  isOpen: boolean;
  players: PlayerDetail[];
  onSave: (players: PlayerDetail[]) => void;
  onClose: () => void;
  /** Customer's own list (photo / PDF / CSV / Excel) shown large next to the rows */
  referenceFiles: ProductImage[];
  onReferenceChange: (files: ProductImage[]) => void;
}

const MIN_ROWS = 5;

/**
 * Back print name list typed in by hand (number + name per jersey).
 * Same look as JerseyPlayerModal, but rows can be added and removed freely.
 */
export function NameListModal(props: NameListModalProps) {
  // Mount the body only while open so its rows start fresh from `players` each time
  if (!props.isOpen) return null;
  return <NameListModalBody {...props} />;
}

function NameListModalBody({
  players,
  onSave,
  onClose,
  referenceFiles,
  onReferenceChange,
}: NameListModalProps) {
  const [list, setList] = useState<PlayerDetail[]>(() => {
    const initial = players.map((p) => ({ number: p.number || "", name: p.name || "", size: p.size || "" }));
    while (initial.length < MIN_ROWS) initial.push({ number: "", name: "", size: "" });
    return initial;
  });

  const handleChange = (index: number, field: "number" | "name" | "size", value: string) => {
    setList((prev) => prev.map((item, idx) => (idx === index ? { ...item, [field]: value } : item)));
  };

  // New rows start with the size used in the row above, since lists usually go size by size
  const addRow = () =>
    setList((prev) => [...prev, { number: "", name: "", size: prev[prev.length - 1]?.size || "" }]);

  const removeRow = (index: number) => setList((prev) => prev.filter((_, idx) => idx !== index));

  const handleSave = () => {
    // Keep only rows where something was typed
    onSave(list.filter((p) => (p.number || "").trim() || (p.name || "").trim()));
    onClose();
  };

  const filledCount = list.filter((p) => (p.number || "").trim() || (p.name || "").trim()).length;

  // Players read from an uploaded CSV / Excel list
  const [pendingImport, setPendingImport] = useState<{ players: PlayerDetail[]; fileName: string } | null>(null);
  const [importNote, setImportNote] = useState("");

  const applyImport = (players: PlayerDetail[], fileName: string, mode: "replace" | "add") => {
    const kept = mode === "add" ? list.filter((p) => (p.number || "").trim() || (p.name || "").trim()) : [];
    setList([...kept, ...players.map((p) => ({ number: p.number || "", name: p.name || "", size: p.size || "" }))]);
    setPendingImport(null);
    const noSize = players.filter((p) => !p.size).length;
    setImportNote(
      `Filled ${players.length} player${players.length === 1 ? "" : "s"} from ${fileName}.` +
        (noSize ? ` ${noSize} without a size — pick it in the Size column.` : " Check them, then Save.")
    );
  };

  const handleImport = (players: PlayerDetail[], fileName: string) => {
    // Empty list: fill straight away; otherwise ask whether to replace or add
    if (filledCount === 0) applyImport(players, fileName, "replace");
    else setPendingImport({ players, fileName });
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/65 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl max-w-5xl w-full shadow-2xl overflow-hidden flex flex-col h-[92vh] md:h-[86vh] border border-gray-100">
        {/* Modal Header */}
        <div className="px-5 py-4 bg-emerald-50/70 border-b border-emerald-100 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl">📝</span>
              <h3 className="font-bold text-gray-900 text-base">Back Print Name List</h3>
              <span className="text-xs bg-emerald-600 text-white font-bold px-2 py-0.5 rounded-full">
                {filledCount} added
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Enter the number, name and size of each jersey — the Sizes step is filled from this list.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex-1 min-h-0 flex flex-col-reverse md:flex-row">
        {/* Player input rows list */}
        <div className="p-4 sm:p-5 overflow-y-auto flex-1 min-h-0 space-y-3 md:w-1/2 md:flex-none">
          {pendingImport && (
            <div className="rounded-2xl border border-amber-300 bg-amber-50 p-3">
              <p className="text-sm font-semibold text-amber-900">
                Found {pendingImport.players.length} players in {pendingImport.fileName}
              </p>
              <p className="text-xs text-amber-800 mt-0.5">You already typed {filledCount}. What should we do?</p>
              <div className="flex flex-wrap gap-2 mt-2">
                <button
                  type="button"
                  onClick={() => applyImport(pendingImport.players, pendingImport.fileName, "replace")}
                  className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold cursor-pointer"
                >
                  Replace with file
                </button>
                <button
                  type="button"
                  onClick={() => applyImport(pendingImport.players, pendingImport.fileName, "add")}
                  className="px-3 py-1.5 rounded-lg border border-emerald-600 bg-white text-emerald-700 text-xs font-bold cursor-pointer"
                >
                  Add below mine
                </button>
                <button
                  type="button"
                  onClick={() => setPendingImport(null)}
                  className="px-3 py-1.5 rounded-lg text-gray-600 hover:bg-amber-100 text-xs font-semibold cursor-pointer"
                >
                  Keep mine
                </button>
              </div>
            </div>
          )}
          {importNote && !pendingImport && (
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-800 flex items-start justify-between gap-2">
              <span>✓ {importNote}</span>
              <button type="button" onClick={() => setImportNote("")} className="text-emerald-600 cursor-pointer" aria-label="Dismiss">
                ×
              </button>
            </div>
          )}
          <div className="grid grid-cols-[28px_64px_1fr_78px_24px] gap-1.5 sm:gap-2 px-1 text-xs font-semibold text-gray-400">
            <span>#</span>
            <span>Number</span>
            <span>Player Name</span>
            <span>Size</span>
            <span />
          </div>

          {list.map((item, idx) => (
            <div
              key={idx}
              className="grid grid-cols-[28px_64px_1fr_78px_24px] gap-1.5 sm:gap-2 items-center bg-gray-50/80 p-2 rounded-2xl border border-gray-200/80 focus-within:border-emerald-500 focus-within:bg-emerald-50/20 transition-colors"
            >
              <div className="w-7 h-7 rounded-lg bg-white border border-gray-200 flex items-center justify-center text-xs font-bold text-gray-500 shadow-2xs">
                {idx + 1}
              </div>

              <input
                type="text"
                value={item.number}
                onChange={(e) => handleChange(idx, "number", e.target.value)}
                placeholder="No."
                className="w-full min-w-0 bg-white border border-gray-200 rounded-xl px-2.5 py-1.5 text-sm font-bold text-gray-900 placeholder-gray-400 focus:outline-none focus:border-emerald-600 text-center"
              />

              <input
                type="text"
                value={item.name}
                onChange={(e) => handleChange(idx, "name", e.target.value)}
                placeholder="Name (e.g. RONALDO)"
                className="w-full min-w-0 bg-white border border-gray-200 rounded-xl px-3 py-1.5 text-sm font-semibold text-gray-900 placeholder-gray-400 focus:outline-none focus:border-emerald-600 uppercase"
              />

              <select
                value={item.size || ""}
                onChange={(e) => handleChange(idx, "size", e.target.value)}
                aria-label={`Size for row ${idx + 1}`}
                className={`w-full bg-white border rounded-xl px-1.5 py-1.5 text-sm font-semibold focus:outline-none focus:border-emerald-600 cursor-pointer ${
                  item.size ? "border-emerald-400 text-gray-900" : "border-gray-200 text-gray-400"
                }`}
              >
                <option value="">Size</option>
                {item.size && !SIZE_OPTIONS.includes(item.size) && !NUMERIC_SIZE_OPTIONS.includes(item.size) && (
                  <option value={item.size}>{item.size}</option>
                )}
                <optgroup label="Standard">
                  {SIZE_OPTIONS.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </optgroup>
                <optgroup label="Numeric">
                  {NUMERIC_SIZE_OPTIONS.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </optgroup>
              </select>

              <button
                type="button"
                onClick={() => removeRow(idx)}
                className="w-7 h-7 rounded-full flex items-center justify-center text-gray-400 hover:text-red-600 hover:bg-red-50 cursor-pointer"
                aria-label={`Remove row ${idx + 1}`}
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          ))}

          <button
            type="button"
            onClick={addRow}
            className="w-full py-2.5 rounded-2xl border border-dashed border-emerald-500 bg-emerald-50/40 text-emerald-700 text-sm font-semibold hover:bg-emerald-50 cursor-pointer"
          >
            + Add player
          </button>
        </div>

        {/* Reference list on the right (on top on phones) */}
        <div className="h-[38vh] md:h-auto md:w-1/2 flex-none md:flex-1 min-h-0 p-3 sm:p-4 bg-gray-50/70 border-b md:border-b-0 md:border-l border-gray-100 flex flex-col">
          <ReferenceFilePanel files={referenceFiles} onChange={onReferenceChange} onImport={handleImport} />
        </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 text-sm font-semibold text-gray-600 hover:text-gray-800 hover:bg-gray-200/60 rounded-xl transition-colors"
          >
            Skip / Close
          </button>

          <button
            type="button"
            onClick={handleSave}
            className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-sm font-bold rounded-xl shadow-sm transition-all cursor-pointer"
          >
            Save Name List
          </button>
        </div>
      </div>
    </div>
  );
}
