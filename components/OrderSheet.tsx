"use client";

import { OrderSummary, groupNamesBySize } from "@/lib/orderSummary";

/** The ICE FASHIONS order form drawn from an order summary (used by View Form and the admin panel) */
export function OrderSheet({ summary, orderNumber }: { summary: OrderSummary; orderNumber: string }) {
  return (
    <div id="ice-fashions-form" className="w-full border-2 border-black p-2.5 sm:p-4 box-border">
      {/* 1. Header Section */}
      <div className="flex items-center justify-between gap-2 mb-2 sm:mb-3">
        <div className="text-[11px] sm:text-xs font-bold whitespace-nowrap">
          NO. <span className="font-normal border-b border-dotted border-black px-1">{orderNumber}</span>
        </div>

        <div className="border-2 border-black rounded-lg px-2 sm:px-6 py-0.5 text-center">
          <span className="text-sm sm:text-lg font-black tracking-wider uppercase font-sans">
            ICE FASHIONS
          </span>
        </div>

        <div className="bg-[#222222] text-white px-2 sm:px-3 py-1 text-[9px] sm:text-[11px] font-black tracking-wider uppercase whitespace-nowrap">
          ORDER FORM
        </div>
      </div>

      {/* 2. FROM & DATE Row */}
      <div className="flex items-baseline justify-between gap-2 text-[10px] sm:text-xs font-bold mb-2 sm:mb-3">
        <div className="flex-1 flex items-baseline gap-1 min-w-0">
          <span className="flex-shrink-0">FROM</span>
          <span className="border-b border-dotted border-black flex-1 px-1 font-semibold text-gray-900 truncate">
            {summary.customerName || "—"} {summary.customerPhone ? `(${summary.customerPhone})` : ""}{" "}
            {summary.customerAddress ? `- ${summary.customerAddress}` : ""}
          </span>
        </div>

        <div className="flex items-baseline gap-1 flex-shrink-0">
          <span>DATE</span>
          <span className="border-b border-dotted border-black px-1 text-center font-semibold text-gray-900">
            {summary.date}
          </span>
        </div>
      </div>

      {summary.products.length === 0 && (
        <p className="border border-black p-4 text-center text-xs text-gray-500 mb-3">No products in this order.</p>
      )}

      {/* 3. One section per product, built from what was selected */}
      {summary.products.map((p) => (
        <div key={p.index} className="border border-black mb-2 sm:mb-3 break-inside-avoid">
          <div className="flex items-center justify-between bg-[#222222] text-white px-2 py-1 text-[10px] sm:text-xs font-black uppercase tracking-wide">
            <span>
              #{p.index} {p.productType}
            </span>
            <span>{p.totalQty} PCS</span>
          </div>

          {/* Specifications + Sizes */}
          <div className="grid grid-cols-1 sm:grid-cols-12 border-b border-black">
            <div className="sm:col-span-8 sm:border-r border-black">
              <div className="bg-[#e5e7eb] border-b border-black px-1.5 py-0.5 text-[9px] sm:text-[10px] font-bold uppercase">
                Specifications
              </div>
              {p.specs.length === 0 ? (
                <p className="px-1.5 py-1 text-[9px] sm:text-[11px] text-gray-500">—</p>
              ) : (
                <div className="divide-y divide-gray-300">
                  {p.specs.map((s) => (
                    <div key={s.label} className="grid grid-cols-12 text-[9px] sm:text-[11px] min-h-[20px] items-center">
                      <div className="col-span-5 px-1.5 py-0.5 text-gray-700 font-medium">{s.label}</div>
                      <div className="col-span-7 px-1.5 py-0.5 font-bold break-words">{s.value}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="sm:col-span-4 border-t sm:border-t-0 border-black">
              <div className="bg-[#e5e7eb] border-b border-black px-1.5 py-0.5 text-[9px] sm:text-[10px] font-bold uppercase grid grid-cols-2">
                <span>Size</span>
                <span className="text-right">Qty</span>
              </div>
              <div className="divide-y divide-gray-300">
                {p.sizes.map((s) => (
                  <div key={s.size} className="grid grid-cols-2 px-1.5 py-0.5 text-[9px] sm:text-[11px] font-semibold">
                    <span>{s.size}</span>
                    <span className="text-right">{s.quantity}</span>
                  </div>
                ))}
                <div className="grid grid-cols-2 px-1.5 py-0.5 text-[9px] sm:text-[11px] font-black bg-gray-50">
                  <span>TOTAL</span>
                  <span className="text-right">{p.totalQty} PCS</span>
                </div>
              </div>
            </div>
          </div>

          {/* Printing: only the sides that were selected */}
          {(p.front || p.back) && (
            <div className={`grid ${p.front && p.back ? "grid-cols-1 sm:grid-cols-2 sm:divide-x" : "grid-cols-1"} divide-black border-b border-black last:border-b-0`}>
              {[p.front, p.back].filter(Boolean).map((side) => (
                <div key={side!.side} className="p-2">
                  <p className="font-bold uppercase text-[9px] sm:text-[10px] text-gray-900">
                    {side!.side} Print: <span className="text-emerald-700">YES</span>
                    {side!.type && (
                      <span className="normal-case font-normal text-gray-800">
                        {" "}
                        · Type: <span className="font-bold">{side!.type}</span>
                      </span>
                    )}
                  </p>
                  {side!.images.length > 0 && (
                    <div className="mt-1.5 grid grid-cols-2 gap-1.5">
                      {side!.images.map((img, idx) => (
                        <a
                          key={idx}
                          href={img.url}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center gap-1.5 p-1 bg-blue-50 hover:bg-blue-100 border border-blue-300 rounded text-blue-800"
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={img.thumbnail || img.url}
                            alt={img.position || `${side!.side} ${idx + 1}`}
                            className="w-9 h-9 object-cover rounded border border-blue-200 bg-white flex-shrink-0"
                          />
                          <span className="min-w-0">
                            <span className="block text-[9px] sm:text-[10px] font-bold truncate">
                              {img.position || `${side!.side} #${idx + 1}`}
                            </span>
                            <span className="block text-[8px] text-blue-600">Open ↗</span>
                          </span>
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Attached files */}
          {p.files.length > 0 && (
            <div className="px-2 py-1.5 flex flex-wrap gap-1.5 text-[9px] sm:text-[10px]">
              {p.files.map((f, idx) => (
                <a
                  key={idx}
                  href={f.url}
                  target="_blank"
                  rel="noreferrer"
                  className="px-1.5 py-0.5 bg-amber-50 border border-amber-300 text-amber-900 rounded font-semibold max-w-[240px] truncate"
                >
                  📎 {f.label}: {f.name}
                </a>
              ))}
            </div>
          )}

          {p.nameList.length > 0 && (
            <div className="px-2 py-1 bg-indigo-50 text-indigo-900 text-[9px] sm:text-[10px] font-bold border-t border-black">
              Name list: {p.nameList.length} players — see below
            </div>
          )}
        </div>
      ))}

      {/* 4. Order total + remarks */}
      <div className="border border-black mb-2 sm:mb-3 grid grid-cols-12 text-[9px] sm:text-[11px]">
        <div className="col-span-8 p-1.5 border-r border-black">
          <p className="font-bold text-gray-800">Special Notes / Remarks:</p>
          <p className="text-gray-700 mt-0.5 whitespace-pre-wrap">{summary.remarks || "None"}</p>
        </div>
        <div className="col-span-4 p-1.5 flex flex-col justify-center items-center bg-gray-50">
          <span className="font-bold text-gray-600 uppercase text-[8px] sm:text-[10px]">Total quantity</span>
          <span className="font-black text-sm sm:text-base">{summary.grandTotal} PCS</span>
        </div>
      </div>

      {/* 5. Footer: Delivery Date & Name/Sign */}
      <div className="flex items-baseline justify-between text-[10px] sm:text-xs font-bold pt-1">
        <div className="flex items-baseline gap-1">
          <span>Delivery Date:</span>
          <span className="border-b border-dotted border-black min-w-[80px] sm:min-w-[140px] px-1 font-semibold text-gray-900">
            {summary.deliveryDate || "—"}
          </span>
        </div>

        <div className="flex items-baseline gap-1">
          <span>NAME/SIGN:</span>
          <span className="border-b border-dotted border-black min-w-[80px] sm:min-w-[140px] px-1 font-semibold text-gray-900 text-center">
            {summary.customerName || "—"}
          </span>
        </div>
      </div>

          {/* Name list grouped by size */}
          {summary.products.filter((p) => p.nameList.length > 0).map((p) => (
            <div key={p.index} className="border border-black mt-3 break-inside-avoid-page">
              <div className="bg-[#e5e7eb] border-b border-black px-1.5 py-0.5 text-[9px] sm:text-[10px] font-bold uppercase">
                Name List · #{p.index} {p.productType} ({p.nameList.length} players)
              </div>
              <div className="divide-y divide-gray-300">
                {groupNamesBySize(p.nameList).map((g) => (
                  <div key={g.size} className="grid grid-cols-12 text-[9px] sm:text-[11px]">
                    <div className="col-span-2 px-1.5 py-1 font-black border-r border-gray-300">
                      {g.size}
                      <span className="block font-semibold text-gray-500">× {g.players.length}</span>
                    </div>
                    <div className="col-span-10 px-1.5 py-1 grid grid-cols-2 sm:grid-cols-3 gap-x-3 gap-y-0.5">
                      {g.players.map((pl, i) => (
                        <span key={i} className="font-semibold uppercase truncate">
                          <span className="inline-block min-w-[22px] font-black">{pl.number || "–"}</span> {pl.name || "—"}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
    </div>
  );
}
