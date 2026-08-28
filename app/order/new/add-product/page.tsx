import { Suspense } from "react";
import AddProductContent from "./AddProductContent";

export default function AddProductPage() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <AddProductContent />
    </Suspense>
  );
}

function PageSkeleton() {
  return (
    <div className="min-h-screen bg-gray-50 px-4 pt-20 space-y-4 animate-pulse">
      <div className="h-6 w-40 bg-gray-200 rounded" />
      <div className="grid grid-cols-2 gap-3">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-24 bg-gray-100 rounded-2xl" />
        ))}
      </div>
    </div>
  );
}
