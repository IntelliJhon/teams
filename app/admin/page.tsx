"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { AdminHeader, AdminLogin, Spinner, useAdmin } from "@/components/admin/AdminShell";
import { ORDER_STATUSES, statusStyle } from "@/lib/orderStatus";
import { totalPieces } from "@/lib/adminOrders";

const fmtDate = (iso: string) =>
  iso ? new Date(iso).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—";

export default function AdminOrdersPage() {
  const { me, setMe, orders, error, loading, reload, logout } = useAdmin();
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (orders ?? []).filter(
      (o) =>
        (!status || o.status === status) &&
        (!q ||
          o.orderId.toLowerCase().includes(q) ||
          o.customerName.toLowerCase().includes(q) ||
          o.customerPhone.includes(q))
    );
  }, [orders, query, status]);

  const counts = useMemo(() => {
    const c: Record<string, number> = {};
    for (const o of orders ?? []) c[o.status] = (c[o.status] || 0) + 1;
    return c;
  }, [orders]);

  if (me === undefined) return <Spinner label="Loading…" />;
  if (me === null) return <AdminLogin onLoggedIn={(m) => { setMe(m); reload(); }} />;

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminHeader me={me} onLogout={logout} />
      <main className="max-w-6xl mx-auto px-4 py-6 space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Orders</h1>
            <p className="text-sm text-gray-500">{orders ? `${orders.length} orders` : ""}</p>
          </div>
          <button
            onClick={reload}
            disabled={loading}
            className="px-3 py-2 rounded-xl border border-gray-300 bg-white text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-60 cursor-pointer"
          >
            {loading ? "Refreshing…" : "↻ Refresh"}
          </button>
        </div>

        {/* Status filter chips */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setStatus("")}
            className={`px-3 py-1.5 rounded-full border text-xs font-semibold cursor-pointer ${
              !status ? "bg-gray-900 text-white border-gray-900" : "bg-white text-gray-700 border-gray-300"
            }`}
          >
            All {orders ? `(${orders.length})` : ""}
          </button>
          {ORDER_STATUSES.map((s) => (
            <button
              key={s}
              onClick={() => setStatus(s === status ? "" : s)}
              className={`px-3 py-1.5 rounded-full border text-xs font-semibold cursor-pointer ${
                status === s ? "ring-2 ring-offset-1 ring-gray-900 " : ""
              }${statusStyle(s)}`}
            >
              {s} {counts[s] ? `(${counts[s]})` : ""}
            </button>
          ))}
        </div>

        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by order ID, customer name or phone"
          className="w-full bg-white border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-emerald-600"
        />

        {error && <p className="text-sm text-red-600 font-medium">{error}</p>}
        {!orders && !error && <Spinner label="Loading orders…" />}

        {orders && (
          <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
            <div className="hidden md:grid grid-cols-[1.3fr_1.6fr_1fr_0.8fr_1fr_1.1fr] gap-3 px-4 py-2.5 bg-gray-50 border-b border-gray-200 text-xs font-bold text-gray-500 uppercase">
              <span>Order</span>
              <span>Customer</span>
              <span>Products</span>
              <span>Pieces</span>
              <span>Delivery</span>
              <span>Status</span>
            </div>
            {filtered.length === 0 && <p className="p-6 text-center text-sm text-gray-500">No orders match.</p>}
            {filtered.map((o) => (
              <Link
                key={o.orderId}
                href={`/admin/orders/${encodeURIComponent(o.orderId)}`}
                className="grid grid-cols-2 md:grid-cols-[1.3fr_1.6fr_1fr_0.8fr_1fr_1.1fr] gap-x-3 gap-y-1 px-4 py-3 border-b border-gray-100 last:border-b-0 hover:bg-emerald-50/40 text-sm"
              >
                <span className="min-w-0">
                  <span className="block font-bold text-gray-900 truncate">{o.orderId}</span>
                  <span className="block text-xs text-gray-500">{fmtDate(o.createdAt)}</span>
                </span>
                <span className="min-w-0 text-right md:text-left">
                  <span className="block font-semibold text-gray-800 truncate">{o.customerName || "—"}</span>
                  <span className="block text-xs text-gray-500">{o.customerPhone}</span>
                </span>
                <span className="text-gray-700 truncate">
                  {o.items.map((i) => i.productType).join(", ") || "—"}
                </span>
                <span className="text-gray-700 text-right md:text-left">{totalPieces(o.items)} pcs</span>
                <span className="text-gray-700">{o.dispatchDate || "—"}</span>
                <span className="text-right md:text-left">
                  <span className={`inline-block px-2.5 py-0.5 rounded-full border text-xs font-bold ${statusStyle(o.status)}`}>
                    {o.status}
                  </span>
                </span>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
