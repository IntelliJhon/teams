"use client";

import { ProductLineItem } from "@/types";
import { productSchemas } from "@/config/product-schemas";

interface CartItemProps {
  item: ProductLineItem;
  onEdit: () => void;
  onDelete: () => void;
  index: number;
}

/** Returns up to 3 key field label+value pairs for the summary card */
function getSummaryFields(item: ProductLineItem) {
  const schema = productSchemas[item.productType] ?? [];
  const PRIORITY_FIELDS = ["fabric", "colour", "sleeveType", "collarType", "productionType"];
  const fields: { label: string; value: string }[] = [];

  for (const fieldId of PRIORITY_FIELDS) {
    const def = schema.find((f) => f.id === fieldId);
    const val = item.fields[fieldId];
    if (def && val && typeof val === "string" && val.length > 0) {
      fields.push({ label: def.label.replace("Select Your ", "").replace("Select ", ""), value: val });
      if (fields.length === 3) break;
    }
  }
  return fields;
}

const PRODUCT_ICONS: Record<string, string> = {
  Tshirt: "👕",
  Jersey: "🏆",
  Shorts: "🩳",
  Hoodie: "🧥",
  Polo: "👔",
};

export function CartItem({ item, onEdit, onDelete, index }: CartItemProps) {
  const totalQty = item.sizeQuantities.reduce((sum, s) => sum + s.quantity, 0);
  const summaryFields = getSummaryFields(item);
  const icon = PRODUCT_ICONS[item.productType] ?? "📦";

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
      {/* Header */}
      <div className="flex items-start gap-3 mb-3">
        <div className="w-11 h-11 rounded-xl bg-green-50 flex items-center justify-center text-2xl flex-shrink-0">
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
              #{index + 1}
            </span>
            <h3 className="font-bold text-gray-800 text-sm">{item.productType}</h3>
          </div>
          <p className="text-xs text-gray-400 mt-0.5">
            {totalQty} {totalQty === 1 ? "piece" : "pieces"} ·{" "}
            {item.sizeQuantities.length} size{item.sizeQuantities.length !== 1 ? "s" : ""}
          </p>
        </div>
      </div>

      {/* Key fields summary */}
      {summaryFields.length > 0 && (
        <div className="flex flex-wrap gap-x-4 gap-y-1 mb-3">
          {summaryFields.map((f) => (
            <div key={f.label} className="flex items-center gap-1 text-xs text-gray-600">
              <span className="text-gray-400">{f.label}:</span>
              <span className="font-semibold text-gray-700">{f.value}</span>
            </div>
          ))}
        </div>
      )}

      {/* Size badges */}
      {item.sizeQuantities.length > 0 && (
        <div className="space-y-1.5 mb-3">
          <div className="flex flex-wrap gap-1.5">
            {item.sizeQuantities.map((s, i) => {
              const filled = (s.players || []).filter((p) => p.number || p.name);
              return (
                <div key={i} className="flex flex-col">
                  <span className="text-xs font-medium text-gray-700 bg-gray-100 px-2.5 py-1 rounded-lg">
                    {s.size} × {s.quantity}
                    {filled.length > 0 && (
                      <span className="ml-1.5 text-[11px] font-bold text-emerald-700">
                        ({filled.map((p) => `${p.number ? '#' + p.number : ''} ${p.name || ''}`.trim()).join(", ")})
                      </span>
                    )}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Image thumbnails */}
      {item.images.length > 0 && (
        <div className="flex gap-2 mb-3">
          {item.images.map((img, i) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={i}
              src={img.url}
              alt={`ref-${i}`}
              className="w-12 h-12 rounded-xl object-cover border border-gray-200"
            />
          ))}
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2 pt-2 border-t border-gray-100">
        <button
          type="button"
          onClick={onEdit}
          className="flex-1 py-2 text-sm font-semibold text-green-600 bg-green-50 rounded-xl active:opacity-70 transition-opacity"
        >
          Edit
        </button>
        <button
          type="button"
          onClick={onDelete}
          className="flex-1 py-2 text-sm font-semibold text-red-500 bg-red-50 rounded-xl active:opacity-70 transition-opacity"
        >
          Remove
        </button>
      </div>
    </div>
  );
}
