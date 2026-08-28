"use client";

import { FieldDef } from "@/types";

interface DynamicFieldProps {
  field: FieldDef;
  value: string;
  onChange: (value: string) => void;
  allValues: Record<string, string | boolean>;
  error?: string;
}

/**
 * Renders a single field definition.
 * - Respects `conditionalOn` — hides if condition not met
 * - `type: "select"` with ≤4 options renders as button chips
 * - `type: "select"` with >4 options renders as a native <select>
 * - `type: "text" | "textarea"` renders the appropriate input
 */
export function DynamicField({
  field,
  value,
  onChange,
  allValues,
  error,
}: DynamicFieldProps) {
  // ── Conditional visibility ────────────────
  if (field.conditionalOn) {
    const watchedVal = allValues[field.conditionalOn.field];
    if (watchedVal !== field.conditionalOn.value) return null;
  }

  const labelEl = (
    <label className="block text-sm font-semibold text-gray-700 mb-2">
      {field.label}
      {field.required && <span className="text-red-500 ml-1">*</span>}
    </label>
  );

  const errorEl = error ? (
    <p className="mt-1.5 text-xs text-red-500 font-medium">{error}</p>
  ) : null;

  // ── Button-group for short selects (≤4 options) ──
  if (field.type === "select" && field.options && field.options.length <= 4) {
    return (
      <div className="mb-5">
        {labelEl}
        <div className="flex flex-wrap gap-2">
          {field.options.map((opt) => {
            const selected = value === opt;
            return (
              <button
                key={opt}
                type="button"
                onClick={() => onChange(selected ? "" : opt)}
                className={`px-4 py-2.5 rounded-xl border-2 text-sm font-medium transition-all duration-150 active:scale-95
                  ${
                    selected
                      ? "border-green-500 bg-green-50 text-green-700"
                      : "border-gray-200 bg-white text-gray-600"
                  }`}
              >
                {opt}
              </button>
            );
          })}
        </div>
        {errorEl}
      </div>
    );
  }

  // ── Native <select> for longer lists ─────
  if (field.type === "select" && field.options) {
    return (
      <div className="mb-5">
        {labelEl}
        <div className="relative">
          <select
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className={`w-full appearance-none bg-white border-2 rounded-xl px-4 py-3 text-sm text-gray-800 font-medium pr-10 focus:outline-none focus:ring-0 transition-colors
              ${error ? "border-red-400" : value ? "border-green-400" : "border-gray-200"}`}
          >
            <option value="">Select…</option>
            {field.options.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
          {/* Chevron icon */}
          <svg
            className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2.5}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </div>
        {errorEl}
      </div>
    );
  }

  // ── Text input ────────────────────────────
  if (field.type === "text") {
    return (
      <div className="mb-5">
        {labelEl}
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={field.placeholder ?? ""}
          className={`w-full bg-white border-2 rounded-xl px-4 py-3 text-sm text-gray-800 font-medium focus:outline-none focus:ring-0 transition-colors
            ${error ? "border-red-400" : value ? "border-green-400" : "border-gray-200"}`}
        />
        {errorEl}
      </div>
    );
  }

  // ── Textarea ──────────────────────────────
  if (field.type === "textarea") {
    return (
      <div className="mb-5">
        {labelEl}
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={field.placeholder ?? ""}
          rows={3}
          className={`w-full bg-white border-2 rounded-xl px-4 py-3 text-sm text-gray-800 font-medium focus:outline-none focus:ring-0 transition-colors resize-none
            ${error ? "border-red-400" : value ? "border-green-400" : "border-gray-200"}`}
        />
        {errorEl}
      </div>
    );
  }

  return null;
}
