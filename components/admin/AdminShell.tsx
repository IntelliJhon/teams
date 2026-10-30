"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { AdminOrder } from "@/lib/adminOrders";

/** Login state + order data shared by the admin pages */
export function useAdmin() {
  const [me, setMe] = useState<{ name: string } | null | undefined>(undefined);
  const [orders, setOrders] = useState<AdminOrder[] | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const resp = await fetch("/api/admin/orders", { cache: "no-store" });
      if (resp.status === 401) {
        setMe(null);
        return;
      }
      const data = await resp.json();
      if (!resp.ok) throw new Error(data?.error || "Could not load orders");
      setOrders(data.orders);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load orders");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/admin/login", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((s) => {
        if (cancelled) return;
        setMe(s);
        if (s) load();
      })
      .catch(() => !cancelled && setMe(null));
    return () => {
      cancelled = true;
    };
  }, [load]);

  const logout = async () => {
    await fetch("/api/admin/login", { method: "DELETE" });
    setMe(null);
    setOrders(null);
  };

  return { me, setMe, orders, error, loading, reload: load, logout };
}

export function AdminLogin({ onLoggedIn }: { onLoggedIn: (me: { name: string }) => void }) {
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    const resp = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, password }),
    });
    const data = await resp.json().catch(() => ({}));
    setBusy(false);
    if (!resp.ok) return setError(data?.error || "Could not log in");
    onLoggedIn(data);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <form onSubmit={submit} className="w-full max-w-sm bg-white border border-gray-200 rounded-3xl shadow-sm p-6 space-y-4">
        <div>
          <p className="text-xs font-bold tracking-widest text-emerald-700 uppercase">Ice Fashions</p>
          <h1 className="text-xl font-bold text-gray-900">Admin panel</h1>
          <p className="text-sm text-gray-500 mt-1">Your name is saved with every change you make.</p>
        </div>
        <label className="block">
          <span className="text-xs font-semibold text-gray-600">Your name</span>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoComplete="name"
            className="mt-1 w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-emerald-600"
            placeholder="e.g. Akash"
          />
        </label>
        <label className="block">
          <span className="text-xs font-semibold text-gray-600">Password</span>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            className="mt-1 w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-emerald-600"
          />
        </label>
        {error && <p className="text-sm text-red-600 font-medium">{error}</p>}
        <button
          type="submit"
          disabled={busy}
          className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm disabled:opacity-60 cursor-pointer"
        >
          {busy ? "Logging in…" : "Log in"}
        </button>
      </form>
    </div>
  );
}

export function AdminHeader({ me, onLogout, back }: { me: { name: string }; onLogout: () => void; back?: boolean }) {
  return (
    <header className="sticky top-0 z-20 bg-white/95 backdrop-blur border-b border-gray-200">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          {back && (
            <Link href="/admin" className="text-sm font-semibold text-emerald-700 hover:underline whitespace-nowrap">
              ← Orders
            </Link>
          )}
          <span className="font-bold text-gray-900 truncate">Ice Fashions · Admin</span>
        </div>
        <div className="flex items-center gap-3 text-sm">
          <span className="text-gray-500 hidden sm:inline">{me.name}</span>
          <button onClick={onLogout} className="text-gray-600 hover:text-gray-900 font-semibold cursor-pointer">
            Log out
          </button>
        </div>
      </div>
    </header>
  );
}

export function Spinner({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-3 text-gray-400">
      <svg className="animate-spin w-7 h-7 text-emerald-600" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
      </svg>
      <p className="text-sm font-medium">{label}</p>
    </div>
  );
}
