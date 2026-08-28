"use client";

interface DropdownRowProps {
  label: string;
  value?: string;
  placeholder?: string;
  onClick: () => void;
  onClear?: () => void;
  error?: string;
  isFloatingLabelWhenSelected?: boolean;
}

export function DropdownRow({
  label,
  value,
  placeholder,
  onClick,
  onClear,
  error,
  isFloatingLabelWhenSelected = true,
}: DropdownRowProps) {
  // If floating label style when value exists (matching Image 1)
  if (value && isFloatingLabelWhenSelected) {
    return (
      <div className="mb-4">
        <div
          onClick={onClick}
          className={`relative w-full bg-white border rounded-xl px-4 py-3 flex items-center justify-between cursor-pointer transition-colors ${
            error ? "border-red-400" : "border-gray-400 hover:border-gray-500"
          }`}
        >
          {/* Notched label at the top */}
          <span className="absolute -top-2.5 left-3 bg-white px-1 text-xs text-gray-500 font-normal">
            {label}
          </span>

          <span className="text-base text-gray-900 font-normal truncate">
            {value}
          </span>

          <div className="flex items-center gap-2 flex-shrink-0">
            {onClear && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onClear();
                }}
                className="p-1 text-gray-400 hover:text-gray-600 active:scale-95"
                aria-label="Clear selection"
              >
                <svg
                  className="w-5 h-5 text-gray-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </button>
            )}
          </div>
        </div>
        {error && (
          <p className="mt-1 text-xs text-red-500 font-medium px-1">{error}</p>
        )}
      </div>
    );
  }

  // If standard dropdown row (with chevron right)
  const displayText = value || placeholder || label;
  const isSelected = Boolean(value);

  return (
    <div className="mb-4">
      <div
        onClick={onClick}
        className={`w-full bg-white border rounded-xl px-4 py-3.5 flex items-center justify-between cursor-pointer transition-colors active:bg-gray-50 ${
          error
            ? "border-red-400"
            : isSelected
            ? "border-gray-400 hover:border-gray-500"
            : "border-gray-300 hover:border-gray-400"
        }`}
      >
        <span
          className={`text-sm truncate ${
            isSelected
              ? "text-gray-900 font-medium"
              : "text-gray-500 font-normal"
          }`}
        >
          {displayText}
        </span>

        <svg
          className="w-4 h-4 text-gray-400 flex-shrink-0 ml-2"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2.5}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M9 5l7 7-7 7"
          />
        </svg>
      </div>
      {error && (
        <p className="mt-1 text-xs text-red-500 font-medium px-1">{error}</p>
      )}
    </div>
  );
}
