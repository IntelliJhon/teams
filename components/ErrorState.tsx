"use client";

interface ErrorStateProps {
  message: string;
  onRetry?: () => void;
  fullPage?: boolean;
}

export function ErrorState({ message, onRetry, fullPage = false }: ErrorStateProps) {
  const wrapper = fullPage
    ? "flex flex-col items-center justify-center min-h-[60vh] px-6 text-center"
    : "flex flex-col items-center gap-3 py-8 px-4 text-center";

  return (
    <div className={wrapper}>
      <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center mb-2">
        <svg
          className="w-7 h-7 text-red-500"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"
          />
        </svg>
      </div>
      <p className="text-gray-700 font-medium text-sm leading-relaxed max-w-xs">
        {message}
      </p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-3 px-6 py-2.5 bg-green-500 text-white rounded-xl font-semibold text-sm active:scale-95 transition-transform"
        >
          Try Again
        </button>
      )}
    </div>
  );
}
