"use client";

import { useState } from "react";
import { toast } from "sonner";
import { AdminHeader, AdminLogin, Spinner, useAdmin } from "@/components/admin/AdminShell";
import { PortalOption } from "@/lib/adminOrders";

/** Admin settings: the Branch and Marketing lists shown as dropdowns on the order form */
export default function AdminSettingsPage() {
  const { me, setMe, orders, options, error, reload, logout } = useAdmin();

  if (me === undefined) return <Spinner label="Loading…" />;
  if (me === null) return <AdminLogin onLoggedIn={(m) => { setMe(m); reload(); }} />;

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminHeader me={me} onLogout={logout} back />
      <main className="max-w-4xl mx-auto px-4 py-6 space-y-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
          <p className="text-sm text-gray-500">
            These lists are the Branch and Marketing dropdowns on the first page of the order form.
          </p>
        </div>
        {error && <p className="text-sm text-red-600 font-medium">{error}</p>}
        {!orders && !error ? (
          <Spinner label="Loading…" />
        ) : (
          <div className="grid md:grid-cols-2 gap-4 items-start">
            <OptionList title="Branches" type="branch" options={options} reload={reload} placeholder="e.g. Edappal" />
            <OptionList
              title="Marketing team"
              type="marketing"
              options={options}
              reload={reload}
              placeholder="e.g. Rahul"
            />
            <OptionList
              title="New order WhatsApp alerts"
              hint="These numbers get a WhatsApp message for every new order. Up to 5."
              type="notify"
              options={options}
              reload={reload}
              placeholder="10-digit mobile number"
              max={5}
            />
          </div>
        )}
      </main>
    </div>
  );
}

async function saveOption(body: { id?: string; type: string; name: string; active: boolean }) {
  const resp = await fetch("/api/admin/options", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await resp.json().catch(() => ({}));
  if (!resp.ok) throw new Error(data?.error || "Could not save");
}

function OptionList({
  title,
  type,
  options,
  reload,
  placeholder,
  hint,
  max,
}: {
  title: string;
  type: PortalOption["type"];
  options: PortalOption[];
  reload: () => Promise<void>;
  placeholder: string;
  hint?: string;
  max?: number;
}) {
  const [name, setName] = useState("");
  const [busy, setBusy] = useState("");
  const list = options.filter((o) => o.type === type);
  const active = list.filter((o) => o.active);
  const removed = list.filter((o) => !o.active);

  const run = async (key: string, fn: () => Promise<void>, done: string) => {
    setBusy(key);
    try {
      await fn();
      toast.success(done);
      await reload();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save");
    } finally {
      setBusy("");
    }
  };

  const add = () => {
    const n = name.replace(/\s+/g, " ").trim();
    if (!n) return;
    if (max && active.length >= max) return toast.error(`Up to ${max} only. Remove one first.`);
    const key = (v: string) => (type === "notify" ? v.replace(/\D/g, "").slice(-10) : v.toLowerCase());
    const existing = list.find((o) => key(o.name) === key(n));
    if (existing?.active) return toast.error(`"${existing.name}" is already in the list`);
    run(
      "add",
      async () => {
        // A removed entry with the same name is brought back instead of added twice
        await saveOption({ id: existing?.id, type, name: existing?.name || n, active: true });
        setName("");
      },
      `${n} added`
    );
  };

  return (
    <section className="bg-white border border-gray-200 rounded-2xl p-4 space-y-3">
      <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wide">
        {title} <span className="text-gray-400 font-semibold">({active.length})</span>
      </h2>
      {hint && <p className="text-xs text-gray-500 -mt-1">{hint}</p>}
      <div className="flex gap-2">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && add()}
          maxLength={80}
          placeholder={placeholder}
          className="flex-1 border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-emerald-600"
        />
        <button
          onClick={add}
          disabled={!name.trim() || busy === "add" || Boolean(max && active.length >= max)}
          className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold disabled:opacity-50 cursor-pointer"
        >
          {busy === "add" ? "Adding…" : "Add"}
        </button>
      </div>

      {active.length === 0 && <p className="text-sm text-gray-500">Nothing added yet.</p>}
      <ul className="divide-y divide-gray-100">
        {active.map((o) => (
          <li key={o.id} className="flex items-center justify-between py-2 text-sm">
            <span className="font-semibold text-gray-800">{showName(o)}</span>
            <button
              onClick={() => {
                if (confirm(`Remove "${o.name}" from the order form? Orders that already have it keep it.`)) {
                  run(o.id, () => saveOption({ id: o.id, type, name: o.name, active: false }), `${o.name} removed`);
                }
              }}
              disabled={busy === o.id}
              className="text-xs font-semibold text-gray-500 hover:text-red-600 disabled:opacity-40 cursor-pointer"
            >
              {busy === o.id ? "…" : "Remove"}
            </button>
          </li>
        ))}
      </ul>

      {removed.length > 0 && (
        <details className="text-sm">
          <summary className="text-xs font-semibold text-gray-500 cursor-pointer">Removed ({removed.length})</summary>
          <ul className="mt-2 divide-y divide-gray-100">
            {removed.map((o) => (
              <li key={o.id} className="flex items-center justify-between py-1.5">
                <span className="text-gray-500 line-through">{showName(o)}</span>
                <button
                  onClick={() => run(o.id, () => saveOption({ id: o.id, type, name: o.name, active: true }), `${o.name} restored`)}
                  disabled={busy === o.id}
                  className="text-xs font-semibold text-emerald-700 hover:underline disabled:opacity-40 cursor-pointer"
                >
                  {busy === o.id ? "…" : "Restore"}
                </button>
              </li>
            ))}
          </ul>
        </details>
      )}
    </section>
  );
}

/** Alert numbers are stored as 91XXXXXXXXXX; show them as +91 XXXXX XXXXX */
function showName(o: PortalOption) {
  return o.type === "notify" && /^91\d{10}$/.test(o.name) ? `+91 ${o.name.slice(2, 7)} ${o.name.slice(7)}` : o.name;
}
