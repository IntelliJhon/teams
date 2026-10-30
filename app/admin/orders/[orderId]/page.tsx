"use client";

import { useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { toast } from "sonner";
import { AdminHeader, AdminLogin, Spinner, useAdmin } from "@/components/admin/AdminShell";
import { OrderSheet } from "@/components/OrderSheet";
import { ImageUpload } from "@/components/ImageUpload";
import { buildOrderSummary } from "@/lib/orderSummary";
import { AdminOrder, OrderActivity, designVersions, totalPieces } from "@/lib/adminOrders";
import { ORDER_STATUSES, statusStyle } from "@/lib/orderStatus";
import { downloadIceFashionsPdf } from "@/lib/downloadPdf";
import { ProductImage } from "@/types";

const CHANNELS = ["Phone call", "WhatsApp chat", "Walk-in", "Email", "Other"];

const fmtDateTime = (iso: string) =>
  iso
    ? new Date(iso).toLocaleString("en-IN", { day: "2-digit", month: "short", hour: "numeric", minute: "2-digit" })
    : "";

async function postAction(body: Record<string, unknown>) {
  const resp = await fetch("/api/admin/action", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await resp.json().catch(() => ({}));
  if (!resp.ok) throw new Error(data?.error || "Could not save");
  return data as { ok?: boolean; whatsapp?: string; whatsappError?: string; link?: string };
}

export default function AdminOrderPage() {
  const { orderId } = useParams<{ orderId: string }>();
  const { me, setMe, orders, error, reload, logout } = useAdmin();
  const order = useMemo(
    () => orders?.find((o) => o.orderId === decodeURIComponent(orderId)) ?? null,
    [orders, orderId]
  );

  if (me === undefined) return <Spinner label="Loading…" />;
  if (me === null) return <AdminLogin onLoggedIn={(m) => { setMe(m); reload(); }} />;

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminHeader me={me} onLogout={logout} back />
      <main className="max-w-6xl mx-auto px-4 py-6">
        {error && <p className="text-sm text-red-600 font-medium">{error}</p>}
        {!orders && !error && <Spinner label="Loading order…" />}
        {orders && !order && <p className="text-sm text-gray-600">Order not found.</p>}
        {order && <OrderDetail order={order} reload={reload} />}
      </main>
    </div>
  );
}

function OrderDetail({ order, reload }: { order: AdminOrder; reload: () => Promise<void> }) {
  const summary = useMemo(
    () =>
      buildOrderSummary(
        {
          customerName: order.customerName,
          customerPhone: order.customerPhone,
          customerAddress: order.customerAddress,
          dispatchDate: order.dispatchDate,
          remarks: order.remarks,
        },
        order.items
      ),
    [order]
  );
  const versions = designVersions(order.activity);
  const customerLink =
    typeof window !== "undefined" && order.editToken
      ? `${window.location.origin}/order/design/${encodeURIComponent(order.orderId)}?token=${encodeURIComponent(order.editToken)}`
      : "";
  const waPhone = order.customerPhone.replace(/\D/g, "").replace(/^(\d{10})$/, "91$1");

  return (
    <div className="grid lg:grid-cols-[1fr_380px] gap-6 items-start">
      {/* Left: order header + full order form */}
      <div className="space-y-4 min-w-0">
        <div className="bg-white border border-gray-200 rounded-2xl p-4 flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl font-bold text-gray-900">{order.orderId}</h1>
              <span className={`px-2.5 py-0.5 rounded-full border text-xs font-bold ${statusStyle(order.status)}`}>
                {order.status}
              </span>
            </div>
            <p className="text-sm text-gray-700 mt-1 font-semibold">{order.customerName || "—"}</p>
            <p className="text-sm text-gray-500">
              {order.customerPhone}
              {order.customerAddress ? ` · ${order.customerAddress}` : ""}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              {order.items.length} product{order.items.length === 1 ? "" : "s"} · {totalPieces(order.items)} pcs · Delivery{" "}
              {order.dispatchDate || "—"}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {order.customerPhone && (
              <>
                <a href={`tel:${order.customerPhone}`} className="px-3 py-2 rounded-xl border border-gray-300 bg-white text-xs font-bold text-gray-700 hover:bg-gray-50">
                  📞 Call
                </a>
                <a href={`https://wa.me/${waPhone}`} target="_blank" rel="noreferrer" className="px-3 py-2 rounded-xl border border-gray-300 bg-white text-xs font-bold text-gray-700 hover:bg-gray-50">
                  💬 WhatsApp
                </a>
              </>
            )}
            <button
              onClick={() =>
                downloadIceFashionsPdf({
                  customer: {
                    customerPhone: order.customerPhone,
                    customerName: order.customerName,
                    customerAddress: order.customerAddress,
                    dispatchDate: order.dispatchDate,
                    remarks: order.remarks,
                  },
                  items: order.items,
                }).catch(() => toast.error("Could not create the PDF"))
              }
              className="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold cursor-pointer"
            >
              ⬇ PDF
            </button>
            {order.editToken && (
              <a
                href={`/order/edit/${encodeURIComponent(order.orderId)}?token=${encodeURIComponent(order.editToken)}`}
                target="_blank"
                rel="noreferrer"
                className="px-3 py-2 rounded-xl border border-gray-300 bg-white text-xs font-bold text-gray-700 hover:bg-gray-50"
              >
                ✏️ Edit order
              </a>
            )}
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-2xl p-2 sm:p-4 overflow-x-auto">
          <OrderSheet summary={summary} orderNumber={order.orderId} />
        </div>
      </div>

      {/* Right: status, design, feedback, history */}
      <div className="space-y-4">
        <StatusCard order={order} reload={reload} />
        <DesignCard order={order} nextVersion={versions.length + 1} reload={reload} customerLink={customerLink} />
        <FeedbackCard order={order} latestVersion={versions[0]?.version || ""} reload={reload} />
        <Timeline activity={order.activity} />
      </div>
    </div>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="bg-white border border-gray-200 rounded-2xl p-4 space-y-3">
      <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wide">{title}</h2>
      {children}
    </section>
  );
}

function StatusCard({ order, reload }: { order: AdminOrder; reload: () => Promise<void> }) {
  const [status, setStatus] = useState(order.status);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const save = async () => {
    setBusy(true);
    try {
      await postAction({ orderId: order.orderId, type: "status", status, note });
      toast.success(`Status set to ${status}`);
      setNote("");
      await reload();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save");
    } finally {
      setBusy(false);
    }
  };
  return (
    <Card title="Status">
      <select
        value={status}
        onChange={(e) => setStatus(e.target.value)}
        className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm bg-white focus:outline-none focus:border-emerald-600"
      >
        {ORDER_STATUSES.map((s) => (
          <option key={s} value={s}>
            {s}
          </option>
        ))}
      </select>
      <input
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder="Note (optional)"
        className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-emerald-600"
      />
      <button
        onClick={save}
        disabled={busy || (status === order.status && !note.trim())}
        className="w-full py-2 rounded-xl bg-gray-900 text-white text-sm font-bold disabled:opacity-40 cursor-pointer"
      >
        {busy ? "Saving…" : "Save status"}
      </button>
    </Card>
  );
}

function DesignCard({
  order,
  nextVersion,
  reload,
  customerLink,
}: {
  order: AdminOrder;
  nextVersion: number;
  reload: () => Promise<void>;
  customerLink: string;
}) {
  const [files, setFiles] = useState<ProductImage[]>([]);
  const [note, setNote] = useState("");
  const [notify, setNotify] = useState(true);
  const [busy, setBusy] = useState(false);
  const [uploaderKey, setUploaderKey] = useState(0);

  const send = async () => {
    if (files.length === 0) return toast.error("Upload at least one design file");
    setBusy(true);
    try {
      const res = await postAction({
        orderId: order.orderId,
        type: "design",
        version: nextVersion,
        status: notify ? "Design sent" : "Designing",
        files,
        note,
        notify,
        customerPhone: order.customerPhone,
        customerName: order.customerName,
        editToken: order.editToken,
      });
      if (notify && res.whatsapp === "failed") {
        toast.warning("Design saved, but the WhatsApp message failed. Share the customer link instead.");
      } else {
        toast.success(notify ? `Design v${nextVersion} sent to the customer` : `Design v${nextVersion} saved`);
      }
      setFiles([]);
      setNote("");
      setUploaderKey((k) => k + 1);
      await reload();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card title={`New design · version ${nextVersion}`}>
      <ImageUpload
        key={uploaderKey}
        label="Design files"
        sublabel="Mock-ups / artwork for the customer"
        maxFiles={10}
        allowDocuments
        documentAccept=".pdf,.ai,.cdr,.psd,.eps,.svg"
        hint="Images or PDF, up to 10 files."
        buttonLabel="Upload design"
        value={files}
        onChange={setFiles}
      />
      <textarea
        value={note}
        onChange={(e) => setNote(e.target.value)}
        rows={2}
        placeholder="Note for the team (optional)"
        className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-emerald-600"
      />
      <label className="flex items-start gap-2 text-sm text-gray-700">
        <input type="checkbox" checked={notify} onChange={(e) => setNotify(e.target.checked)} className="mt-1" />
        <span>
          Send to the customer on WhatsApp with an <b>approve / request changes</b> link
        </span>
      </label>
      <button
        onClick={send}
        disabled={busy}
        className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold disabled:opacity-50 cursor-pointer"
      >
        {busy ? "Saving…" : notify ? "Send design to customer" : "Save design"}
      </button>
      {customerLink && (
        <button
          onClick={() => navigator.clipboard.writeText(customerLink).then(() => toast.success("Customer link copied"))}
          className="w-full text-xs font-semibold text-emerald-700 hover:underline cursor-pointer"
        >
          Copy the customer&apos;s design link
        </button>
      )}
    </Card>
  );
}

function FeedbackCard({
  order,
  latestVersion,
  reload,
}: {
  order: AdminOrder;
  latestVersion: string;
  reload: () => Promise<void>;
}) {
  const [channel, setChannel] = useState(CHANNELS[0]);
  const [outcome, setOutcome] = useState<"changes" | "approved" | "note">("changes");
  const [note, setNote] = useState("");
  const [files, setFiles] = useState<ProductImage[]>([]);
  const [busy, setBusy] = useState(false);
  const [uploaderKey, setUploaderKey] = useState(0);

  const save = async () => {
    if (!note.trim() && outcome !== "approved") return toast.error("Write what the customer said");
    setBusy(true);
    try {
      await postAction({
        orderId: order.orderId,
        type: "feedback",
        channel,
        version: latestVersion,
        status: outcome === "changes" ? "Changes requested" : outcome === "approved" ? "Approved" : "",
        note: outcome === "approved" && !note.trim() ? `Approved by ${channel.toLowerCase()}` : note,
        files,
      });
      toast.success("Feedback logged");
      setNote("");
      setFiles([]);
      setUploaderKey((k) => k + 1);
      await reload();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card title="Log customer feedback">
      <p className="text-xs text-gray-500">For changes or approval given by phone, in person or in a chat.</p>
      <div className="grid grid-cols-2 gap-2">
        <select
          value={channel}
          onChange={(e) => setChannel(e.target.value)}
          className="border border-gray-300 rounded-xl px-2 py-2 text-sm bg-white focus:outline-none focus:border-emerald-600"
        >
          {CHANNELS.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
        <select
          value={outcome}
          onChange={(e) => setOutcome(e.target.value as typeof outcome)}
          className="border border-gray-300 rounded-xl px-2 py-2 text-sm bg-white focus:outline-none focus:border-emerald-600"
        >
          <option value="changes">Wants changes</option>
          <option value="approved">Approved</option>
          <option value="note">Just a note</option>
        </select>
      </div>
      <textarea
        value={note}
        onChange={(e) => setNote(e.target.value)}
        rows={3}
        placeholder={outcome === "approved" ? "Anything they added (optional)" : "What did the customer ask for?"}
        className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-emerald-600"
      />
      <ImageUpload
        key={uploaderKey}
        label="Attachments (optional)"
        sublabel="Sketch, screenshot or photo they sent"
        maxFiles={5}
        allowDocuments
        value={files}
        onChange={setFiles}
      />
      <button
        onClick={save}
        disabled={busy}
        className="w-full py-2.5 rounded-xl bg-gray-900 text-white text-sm font-bold disabled:opacity-50 cursor-pointer"
      >
        {busy ? "Saving…" : "Save feedback"}
      </button>
    </Card>
  );
}

const TYPE_LABEL: Record<string, string> = {
  design: "Design",
  feedback: "Feedback",
  customer_response: "Customer reply",
  status: "Status",
  note: "Note",
};

function Timeline({ activity }: { activity: OrderActivity[] }) {
  return (
    <Card title="History">
      {activity.length === 0 && <p className="text-sm text-gray-500">Nothing yet.</p>}
      <ol className="space-y-3">
        {activity.map((a) => (
          <li key={a.id} className="border-l-2 border-gray-200 pl-3">
            <div className="flex flex-wrap items-center gap-1.5 text-xs">
              <span className="font-bold text-gray-900">
                {TYPE_LABEL[a.type] || a.type}
                {a.version ? ` v${a.version}` : ""}
              </span>
              {a.status && (
                <span className={`px-2 py-0.5 rounded-full border text-[10px] font-bold ${statusStyle(a.status)}`}>
                  {a.status}
                </span>
              )}
            </div>
            <p className="text-[11px] text-gray-500 mt-0.5">
              {fmtDateTime(a.createdAt)}
              {a.by ? ` · ${a.by}` : ""}
              {a.channel ? ` · ${a.channel}` : ""}
            </p>
            {a.note && <p className="text-sm text-gray-800 mt-1 whitespace-pre-wrap">{a.note}</p>}
            {a.files.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-1.5">
                {a.files.map((f, i) =>
                  /\.(png|jpe?g|webp|gif)(\?|$)/i.test(f.url) || /\/image\/upload\/.*\.(png|jpe?g|webp)/i.test(f.url) ? (
                    <a key={i} href={f.url} target="_blank" rel="noreferrer">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={f.url} alt={f.name || `File ${i + 1}`} className="w-14 h-14 object-cover rounded-lg border border-gray-200" />
                    </a>
                  ) : (
                    <a
                      key={i}
                      href={f.url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[11px] font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-lg px-2 py-1"
                    >
                      📎 {f.name || `File ${i + 1}`}
                    </a>
                  )
                )}
              </div>
            )}
          </li>
        ))}
      </ol>
    </Card>
  );
}
