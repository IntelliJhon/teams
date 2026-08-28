import { Suspense } from "react";
import ConfirmationContent from "./ConfirmationContent";

export default function ConfirmationPage() {
  return (
    <Suspense fallback={<ConfirmationSkeleton />}>
      <ConfirmationContent />
    </Suspense>
  );
}

function ConfirmationSkeleton() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-4">
      <div className="w-20 h-20 rounded-full bg-gray-100 animate-pulse" />
      <div className="h-4 w-40 bg-gray-100 rounded animate-pulse" />
      <div className="h-3 w-56 bg-gray-100 rounded animate-pulse" />
    </div>
  );
}
