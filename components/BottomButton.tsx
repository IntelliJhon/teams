"use client";

import { ReactNode } from "react";

interface BottomButtonProps {
  onClick?: () => void;
  type?: "button" | "submit";
  loading?: boolean;
  disabled?: boolean;
  children: ReactNode;
  variant?: "primary" | "secondary";
}

export function BottomButton({
  onClick,
  type = "button",
  loading = false,
  disabled = false,
  children,
  variant = "primary",
}: BottomButtonProps) {
  const base =
    "w-full py-4 rounded-2xl font-semibold text-base transition-all duration-200 flex items-center justify-center gap-2 active:scale-95";
  const styles = {
    primary:
      "bg-green-500 text-white shadow-lg shadow-green-500/20 disabled:opacity-50 disabled:cursor-not-allowed",
    secondary:
      "bg-white border-2 border-green-500 text-green-600 disabled:opacity-50 disabled:cursor-not-allowed",
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 px-4 pb-safe bg-gradient-to-t from-white via-white to-transparent pt-4">
      <button
        type={type}
        onClick={onClick}
        disabled={disabled || loading}
        className={`${base} ${styles[variant]}`}
      >
        {loading ? (
          <>
            <Spinner />
            <span>Please wait…</span>
          </>
        ) : (
          children
        )}
      </button>
    </div>
  );
}

function Spinner() {
  return (
    <svg
      className="animate-spin h-5 w-5"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8v8H4z"
      />
    </svg>
  );
}
