"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { OrderActivity } from "@/lib/adminOrders";

interface DesignView {
  orderId: string;
  customerName: string;
  status: string;
  activity: OrderActivity[];
}

const isImage = (url: string) => /\.(png|jpe?g|webp|gif)(\?|$)/i.test(url);

export default function DesignPage() {
  return (
    <Suspense fallback={<Loading />}>
      <DesignContent />
    </Suspense>
  );
}

function Loading() {
  return <p className="min-h-screen flex items-center justify-center text-sm text-gray-400">Loading design…</p>;
}

function DesignContent() {
  const { orderId } = useParams<{ orderId: string }>();
  const token = useSearchParams().get("token") || "";
  const [view, setView] = useState<DesignView | null>(null);
  const [error, setError] = useState("");
  const [mode, setMode] = useState<"idle" | "changes">("idle");
  const [comment, setComment] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<"" | "approved" | "changes">("");
  const [zoom, setZoom] = useState<string | null>(null);

  const load = useCallback(async () => {
    const resp = await fetch(`/api/design/${encodeURIComponent(orderId)}?token=${encodeURIComponent(token)}`, {
      cache: "no-store",
    });
    const data = await resp.json().catch(() => ({}));
    if (!resp.ok) return setError(data?.error || "This link is not valid");
    setView(data);
  }, [orderId, token]);

  useEffect(() => {
    // Initial fetch of the design for this link
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  const designs = (view?.activity ?? []).filter((a) => a.type === "design");
  const latest = designs[0];
  const older = designs.slice(1);
  const lastReply = (view?.activity ?? []).find((a) => a.type === "customer_response");
  const repliedToLatest = Boolean(latest && lastReply && lastReply.createdAt > latest.createdAt);
  const locked = ["Approved", "In production", "Dispatched", "Cancelled"].includes(view?.status || "");

  const respond = async (decision: "approved" | "changes") => {
    setBusy(true);
    const resp = await fetch(`/api/design/${encodeURIComponent(orderId)}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, decision, comment, version: latest?.version || "" }),
    });
    const data = await resp.json().catch(() => ({}));
    setBusy(false);
    if (!resp.ok) return setError(data?.error || "Could not send your reply");
    setDone(decision);
    setMode("idle");
    setComment("");
    load();
  };

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 text-center">
        <div>
          <p className="text-4xl mb-3">🔒</p>
          <p className="font-semibold text-gray-900">{error}</p>
          <p className="text-sm text-gray-500 mt-1">Please use the latest link we sent you on WhatsApp.</p>
        </div>
      </div>
    );
  }
  if (!view) return <Loading />;

  return (
    <div className="min-h-screen bg-gray-50 pb-40">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-3xl mx-auto px-4 py-4">
          <p className="text-xs font-bold tracking-widest text-emerald-700 uppercase">Ice Fashions</p>
          <h1 className="text-lg font-bold text-gray-900">Your design · {view.orderId}</h1>
          {view.customerName && <p className="text-sm text-gray-500">For {view.customerName}</p>}
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-5 space-y-5">
        {!latest && (
          <p className="bg-white border border-gray-200 rounded-2xl p-6 text-center text-sm text-gray-600">
            Your design is being prepared. We&apos;ll send it to you on WhatsApp soon.
          </p>
        )}

        {latest && (
          <section className="bg-white border border-gray-200 rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-gray-900">Design version {latest.version || designs.length}</h2>
              <StatusPill status={view.status} />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {latest.files.map((f, i) =>
                isImage(f.url) ? (
                  <button key={i} onClick={() => setZoom(f.url)} className="block rounded-xl overflow-hidden border border-gray-200 bg-gray-50 cursor-zoom-in">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={f.url} alt={`Design ${i + 1}`} className="w-full h-auto" />
                  </button>
                ) : (
                  <a key={i} href={f.url} target="_blank" rel="noreferrer" className="flex items-center gap-2 p-4 rounded-xl border border-gray-200 bg-gray-50 text-sm font-semibold text-emerald-800">
                    📄 {f.name || `Design file ${i + 1}`} — open
                  </a>
                )
              )}
            </div>
          </section>
        )}

        {lastReply && (
          <section className="bg-white border border-gray-200 rounded-2xl p-4">
            <p className="text-sm font-semibold text-gray-900">
              Your last reply: {lastReply.status === "Approved" ? "✅ Approved" : "✏️ Changes requested"}
            </p>
            {lastReply.note && <p className="text-sm text-gray-700 mt-1 whitespace-pre-wrap">“{lastReply.note}”</p>}
          </section>
        )}

        {older.length > 0 && (
          <details className="bg-white border border-gray-200 rounded-2xl p-4">
            <summary className="text-sm font-semibold text-gray-700 cursor-pointer">Earlier versions ({older.length})</summary>
            <div className="mt-3 space-y-3">
              {older.map((d) => (
                <div key={d.id}>
                  <p className="text-xs font-bold text-gray-500 mb-1">Version {d.version}</p>
                  <div className="flex flex-wrap gap-2">
                    {d.files.map((f, i) =>
                      isImage(f.url) ? (
                        <button key={i} onClick={() => setZoom(f.url)} className="cursor-zoom-in">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={f.url} alt="" className="w-24 h-24 object-cover rounded-lg border border-gray-200" />
                        </button>
                      ) : (
                        <a key={i} href={f.url} target="_blank" rel="noreferrer" className="text-xs font-semibold text-emerald-800 underline">
                          {f.name || `File ${i + 1}`}
                        </a>
                      )
                    )}
                  </div>
                </div>
              ))}
            </div>
          </details>
        )}
      </main>

      {/* Approve / request changes */}
      {latest && (
        <div className="fixed bottom-0 inset-x-0 bg-white border-t border-gray-200 shadow-[0_-4px_16px_rgba(0,0,0,0.06)]">
          <div className="max-w-3xl mx-auto px-4 py-3 space-y-2">
            {done && (
              <p className="text-sm font-semibold text-emerald-800 text-center">
                {done === "approved" ? "Thank you! Your design is approved. ✅" : "Thanks — we'll update the design and send it again."}
              </p>
            )}
            {locked && !done && (
              <p className="text-sm font-semibold text-emerald-800 text-center">This design is approved. ✅</p>
            )}
            {!locked && !done && mode === "changes" && (
              <div className="space-y-2">
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  rows={3}
                  autoFocus
                  placeholder="What should we change? e.g. bigger logo, sponsor in navy"
                  className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-emerald-600"
                />
                <div className="flex gap-2">
                  <button onClick={() => setMode("idle")} className="flex-1 py-3 rounded-xl border border-gray-300 text-sm font-semibold text-gray-700 cursor-pointer">
                    Back
                  </button>
                  <button
                    onClick={() => respond("changes")}
                    disabled={busy || !comment.trim()}
                    className="flex-[2] py-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-sm font-bold disabled:opacity-50 cursor-pointer"
                  >
                    {busy ? "Sending…" : "Send changes"}
                  </button>
                </div>
              </div>
            )}
            {!locked && !done && mode === "idle" && (
              <>
                {repliedToLatest && (
                  <p className="text-xs text-gray-500 text-center">You already replied to this version — you can still change your answer.</p>
                )}
                <div className="flex gap-2">
                  <button
                    onClick={() => setMode("changes")}
                    className="flex-1 py-3 rounded-xl border border-amber-400 text-amber-800 bg-amber-50 text-sm font-bold cursor-pointer"
                  >
                    ✏️ Request changes
                  </button>
                  <button
                    onClick={() => respond("approved")}
                    disabled={busy}
                    className="flex-1 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold disabled:opacity-50 cursor-pointer"
                  >
                    {busy ? "Sending…" : "✅ Approve design"}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {zoom && (
        <button onClick={() => setZoom(null)} className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-3 cursor-zoom-out">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={zoom} alt="Design" className="max-w-full max-h-full object-contain" />
        </button>
      )}
    </div>
  );
}

function StatusPill({ status }: { status: string }) {
  const map: Record<string, string> = {
    "Design sent": "Waiting for your reply",
    "Changes requested": "Changes requested",
    Approved: "Approved",
    "In production": "In production",
    Dispatched: "Dispatched",
  };
  return (
    <span className="px-2.5 py-0.5 rounded-full bg-gray-100 text-gray-700 text-xs font-bold">{map[status] || status}</span>
  );
}
