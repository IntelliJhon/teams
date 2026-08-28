import { Suspense } from "react";
import OrderNewContent from "./OrderNewContent";

export default function OrderNewPage() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <OrderNewContent />
    </Suspense>
  );
}

function PageSkeleton() {
  return (
    <div className="min-h-screen bg-gray-50 px-4 pt-20 space-y-5 animate-pulse">
      <div className="h-6 w-32 bg-gray-200 rounded" />
      <div className="h-4 w-48 bg-gray-100 rounded" />
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="h-14 bg-gray-100 rounded-xl" />
      ))}
    </div>
  );
}
