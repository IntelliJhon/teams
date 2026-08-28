"use client";

import { useState, useMemo } from "react";
import { TopBar } from "./TopBar";

export interface OptionItem {
  label: string;
  value: string;
  description?: string;
  meta?: string;
  imageUrl?: string;
  icon?: string;
  showThumbnail?: boolean;
}

interface OptionPickerModalProps {
  title: string;
  options: (string | OptionItem)[];
  selectedValue?: string;
  showThumbnail?: boolean;
  allowCustom?: boolean;
  onSelect: (value: string) => void;
  onClose: () => void;
}

export function OptionPickerModal({
  title,
  options,
  selectedValue,
  showThumbnail = false,
  allowCustom = true,
  onSelect,
  onClose,
}: OptionPickerModalProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddingCustom, setIsAddingCustom] = useState(false);
  const [customInputValue, setCustomInputValue] = useState("");

  const normalizedOptions: OptionItem[] = useMemo(() => {
    return options.map((opt) => {
      if (typeof opt === "string") {
        return {
          label: opt,
          value: opt,
          description: "Description",
          meta: "Meta Data",
          showThumbnail,
        };
      }
      return {
        ...opt,
        description: opt.description ?? "Description",
        meta: opt.meta ?? "Meta Data",
        imageUrl: opt.imageUrl,
        showThumbnail: opt.showThumbnail ?? showThumbnail,
      };
    });
  }, [options, showThumbnail]);

  const filteredOptions = useMemo(() => {
    if (!searchQuery.trim()) return normalizedOptions;
    const q = searchQuery.toLowerCase();
    return normalizedOptions.filter((opt) =>
      opt.label.toLowerCase().includes(q)
    );
  }, [normalizedOptions, searchQuery]);

  const handleCustomSubmit = (val: string) => {
    const trimmed = val.trim();
    if (!trimmed) return;
    onSelect(trimmed);
    onClose();
  };

  const exactMatchExists = useMemo(() => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.trim().toLowerCase();
    return normalizedOptions.some((opt) => opt.value.toLowerCase() === q);
  }, [normalizedOptions, searchQuery]);

  return (
    <div className="fixed inset-0 z-50 bg-white flex flex-col animate-in fade-in duration-150">
      {/* Top Header */}
      <TopBar
        title={title}
        onBack={onClose}
        onClose={onClose}
        showMenu={true}
        showClose={true}
      />

      {/* Search Bar */}
      <div className="px-4 py-2.5 border-b border-gray-100 bg-gray-50/70">
        <div className="relative">
          <svg
            className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={`Search ${title.toLowerCase()} or type custom…`}
            className="w-full bg-white border border-gray-200 rounded-xl pl-9 pr-4 py-2.5 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:border-gray-400"
          />
        </div>
      </div>

      {/* Quick Add Search Value as Custom if not in list */}
      {allowCustom && searchQuery.trim() && !exactMatchExists && (
        <div className="px-4 py-2 bg-emerald-50 border-b border-emerald-100 flex items-center justify-between">
          <span className="text-xs text-emerald-800 font-medium truncate mr-2">
            Add custom: &ldquo;<span className="font-bold">{searchQuery.trim()}</span>&rdquo;
          </span>
          <button
            type="button"
            onClick={() => handleCustomSubmit(searchQuery)}
            className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-xs font-semibold rounded-lg flex-shrink-0"
          >
            + Use This
          </button>
        </div>
      )}

      {/* Options List */}
      <div className="flex-1 overflow-y-auto divide-y divide-gray-100">
        {/* + Add Custom Row at top */}
        {allowCustom && (
          <div>
            {!isAddingCustom ? (
              <button
                type="button"
                onClick={() => {
                  setIsAddingCustom(true);
                  setCustomInputValue("");
                }}
                className="w-full flex items-center gap-3.5 px-4 py-3.5 text-left text-emerald-700 bg-emerald-50/40 hover:bg-emerald-50/80 active:bg-emerald-100/70 transition-colors"
              >
                <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold text-lg flex-shrink-0">
                  +
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-semibold text-emerald-800">
                    + Add Custom {title}
                  </div>
                  <div className="text-xs text-emerald-600 font-normal">
                    Type your own custom text if not in list
                  </div>
                </div>
              </button>
            ) : (
              <div className="p-4 bg-emerald-50/70 border-b border-emerald-200 animate-in fade-in duration-100">
                <label className="block text-xs font-semibold text-emerald-900 mb-1.5">
                  Enter Custom Value:
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={customInputValue}
                    onChange={(e) => setCustomInputValue(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleCustomSubmit(customInputValue);
                    }}
                    placeholder={`e.g. Custom ${title}`}
                    className="flex-1 bg-white border border-emerald-300 rounded-xl px-3.5 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => handleCustomSubmit(customInputValue)}
                    className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-xs font-semibold rounded-xl transition-colors shadow-sm"
                  >
                    Add
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsAddingCustom(false)}
                    className="px-3 py-2.5 bg-gray-200 hover:bg-gray-300 text-gray-700 text-xs font-medium rounded-xl transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {filteredOptions.length === 0 ? (
          <div className="py-12 text-center text-sm text-gray-400 font-medium">
            No matching options in standard list
          </div>
        ) : (
          filteredOptions.map((opt) => {
            const isSelected = selectedValue === opt.value;
            const hasThumbnail = opt.showThumbnail ?? showThumbnail;

            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => {
                  onSelect(opt.value);
                  onClose();
                }}
                className={`w-full flex items-center justify-between px-4 py-3.5 text-left transition-colors active:bg-gray-100 hover:bg-gray-50/80 ${
                  isSelected ? "bg-emerald-50/50" : ""
                }`}
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  {/* Thumbnail: image from URL if available, else placeholder icon */}
                  {hasThumbnail && (
                    opt.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={opt.imageUrl}
                        alt={opt.label}
                        className="w-12 h-12 rounded-xl object-cover border border-gray-200 flex-shrink-0 bg-gray-50 shadow-2xs"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center text-gray-400 flex-shrink-0">
                        <svg
                          className="w-6 h-6"
                          fill="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V5h14v14zm-5.04-6.71l-2.75 3.54-1.96-2.36L6.5 17h11l-3.54-4.71z" />
                        </svg>
                      </div>
                    )
                  )}

                  <div className="min-w-0">
                    <div className="text-base font-normal text-gray-900 truncate">
                      {opt.label}
                    </div>
                    <div className="text-xs text-gray-500 font-normal">
                      {opt.description ?? "Description"}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0 ml-3">
                  <span className="text-xs text-gray-500 font-normal">
                    {opt.meta ?? "Meta Data"}
                  </span>
                  {isSelected && (
                    <svg
                      className="w-4 h-4 text-emerald-600"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2.5}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  )}
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}
