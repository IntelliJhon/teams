"use client";

import React, { useState, useEffect } from "react";
import { PlayerDetail } from "@/types";

interface JerseyPlayerModalProps {
  isOpen: boolean;
  size: string;
  quantity: number;
  players: PlayerDetail[];
  onSave: (players: PlayerDetail[]) => void;
  onClose: () => void;
}

export function JerseyPlayerModal({
  isOpen,
  size,
  quantity,
  players,
  onSave,
  onClose,
}: JerseyPlayerModalProps) {
  const [list, setList] = useState<PlayerDetail[]>([]);

  // Initialize or synchronize list of players matching current quantity
  useEffect(() => {
    if (!isOpen) return;
    const initial: PlayerDetail[] = [];
    for (let i = 0; i < quantity; i++) {
      initial.push({
        number: players[i]?.number || "",
        name: players[i]?.name || "",
      });
    }
    setList(initial);
  }, [isOpen, quantity, players]);

  if (!isOpen) return null;

  const handleChange = (index: number, field: "number" | "name", value: string) => {
    setList((prev) =>
      prev.map((item, idx) =>
        idx === index ? { ...item, [field]: value } : item
      )
    );
  };

  const handleSave = () => {
    // Return all entries (even if empty, or filter if desired)
    onSave(list);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/65 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl overflow-hidden flex flex-col max-h-[90vh] border border-gray-100">
        {/* Modal Header */}
        <div className="px-5 py-4 bg-emerald-50/70 border-b border-emerald-100 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl">🎽</span>
              <h3 className="font-bold text-gray-900 text-base">
                Jersey Names &amp; Numbers
              </h3>
              <span className="text-xs bg-emerald-600 text-white font-bold px-2 py-0.5 rounded-full">
                Size {size}
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Enter number and name for each of the {quantity} jerseys (Optional).
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

        {/* Player input rows list */}
        <div className="p-4 sm:p-5 overflow-y-auto flex-1 space-y-3">
          <div className="grid grid-cols-[36px_80px_1fr] gap-2 px-1 text-xs font-semibold text-gray-400">
            <span>#</span>
            <span>Number</span>
            <span>Player Name</span>
          </div>

          {list.map((item, idx) => (
            <div
              key={idx}
              className="grid grid-cols-[36px_80px_1fr] gap-2 items-center bg-gray-50/80 p-2 rounded-2xl border border-gray-200/80 focus-within:border-emerald-500 focus-within:bg-emerald-50/20 transition-colors"
            >
              {/* Row index */}
              <div className="w-8 h-8 rounded-xl bg-white border border-gray-200 flex items-center justify-center text-xs font-bold text-gray-500 shadow-2xs">
                {idx + 1}
              </div>

              {/* Jersey Number */}
              <input
                type="text"
                value={item.number}
                onChange={(e) => handleChange(idx, "number", e.target.value)}
                placeholder="No. (e.g. 7)"
                className="w-full bg-white border border-gray-200 rounded-xl px-2.5 py-1.5 text-sm font-bold text-gray-900 placeholder-gray-400 focus:outline-none focus:border-emerald-600 text-center"
              />

              {/* Player Name */}
              <input
                type="text"
                value={item.name}
                onChange={(e) => handleChange(idx, "name", e.target.value)}
                placeholder="Name (e.g. RONALDO)"
                className="w-full bg-white border border-gray-200 rounded-xl px-3 py-1.5 text-sm font-semibold text-gray-900 placeholder-gray-400 focus:outline-none focus:border-emerald-600 uppercase"
              />
            </div>
          ))}
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
            Save Player Details
          </button>
        </div>
      </div>
    </div>
  );
}
