import { PlayerDetail, ProductImage, ProductLineItem, SizeQuantity } from "@/types";

/** One logged event on an order: a design version, customer feedback, a status change, a note */
export interface OrderActivity {
  id: string;
  orderId: string;
  type: string; // design | feedback | customer_response | status | note
  version: string;
  status: string;
  files: ProductImage[];
  note: string;
  channel: string;
  by: string;
  createdAt: string;
}

export interface AdminOrder {
  orderId: string;
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  dispatchDate: string;
  remarks: string;
  status: string;
  editToken: string;
  createdAt: string; // ISO, from the ORD-<timestamp> id when the sheet has no created_at
  lastEdited: string;
  items: ProductLineItem[];
  activity: OrderActivity[]; // newest first
}

type Row = Record<string, unknown>;

const str = (v: unknown) => (v === null || v === undefined ? "" : String(v)).trim();

function parseJson<T>(v: unknown, fallback: T): T {
  if (Array.isArray(v) || (v && typeof v === "object")) return v as T;
  const s = str(v);
  if (!s) return fallback;
  try {
    return JSON.parse(s) as T;
  } catch {
    return fallback;
  }
}

/** Customer_test row → the same item shape the order form uses */
export function itemFromRow(r: Row): ProductLineItem {
  let fields = parseJson<Record<string, string>>(r.fields_json, {});
  if (!fields || Object.keys(fields).length === 0) {
    fields = {};
    if (str(r.fabric)) fields.fabric = str(r.fabric);
    if (str(r["colour "] ?? r.colour)) fields.colour = str(r["colour "] ?? r.colour);
    if (str(r.front_print)) fields.frontPrint = str(r.front_print);
    if (str(r.back_print)) fields.backPrint = str(r.back_print);
    if (str(r.collar_type)) fields.collarType = str(r.collar_type);
  }
  let sizes = parseJson<SizeQuantity[]>(r.size_quantities_json, []);
  if (sizes.length === 0 && str(r.quantity_size)) {
    sizes = str(r.quantity_size)
      .split(",")
      .map((s) => s.trim().match(/^(.+?)x(\d+)$/i))
      .filter((m): m is RegExpMatchArray => Boolean(m))
      .map((m) => ({ size: m[1], quantity: Number(m[2]), players: [] }));
  }
  const list = (key: string) => {
    const v = parseJson<ProductImage[]>(r[key], []);
    return v.length ? v : undefined;
  };
  const names = parseJson<PlayerDetail[]>(r.name_list_json, []);
  return {
    lineId: str(r.group_id),
    productType: str(r.product) || "Product",
    fields,
    sizeQuantities: sizes,
    images: parseJson<ProductImage[]>(r.images_json, []),
    frontImages: list("front_images_json"),
    backImages: list("back_images_json"),
    repeatOrderFiles: list("repeat_order_files_json"),
    nameList: names.length ? names : undefined,
    nameListFiles: list("name_list_files_json"),
  };
}

export function activityFromRow(r: Row): OrderActivity {
  return {
    id: str(r.activity_id),
    orderId: str(r.order_id),
    type: str(r.type),
    version: str(r.version),
    status: str(r.status),
    files: parseJson<ProductImage[]>(r.files_json, []),
    note: str(r.note),
    channel: str(r.channel),
    by: str(r.by),
    createdAt: str(r.created_at),
  };
}

function createdFromId(orderId: string): string {
  const ts = Number(orderId.replace(/^ORD-/, ""));
  return Number.isFinite(ts) && ts > 1e12 ? new Date(ts).toISOString() : "";
}

/** Joins the three sheet tabs (Order, Customer_test, Order_Activity) into orders, newest first */
export function buildAdminOrders(data: { orders?: Row[]; items?: Row[]; activity?: Row[] }): AdminOrder[] {
  const items = data.items ?? [];
  const activity = (data.activity ?? []).map(activityFromRow);
  return (data.orders ?? [])
    .filter((o) => str(o.order_id))
    .map((o) => {
      const orderId = str(o.order_id);
      return {
        orderId,
        customerName: str(o.customer_name),
        customerPhone: str(o.customer_phone),
        customerAddress: str(o.customer_address),
        dispatchDate: str(o.dispatch_date),
        remarks: str(o.remarks),
        status: str(o.status) || "Submitted",
        editToken: str(o.edit_token),
        createdAt: str(o.created_at) || createdFromId(orderId),
        lastEdited: str(o.last_edited),
        items: items.filter((r) => str(r.order_id) === orderId).map(itemFromRow),
        activity: activity
          .filter((a) => a.orderId === orderId)
          .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
      };
    })
    .sort((a, b) => (b.createdAt || b.orderId).localeCompare(a.createdAt || a.orderId));
}

/** Design versions sent so far, newest first */
export function designVersions(activity: OrderActivity[]): OrderActivity[] {
  return activity.filter((a) => a.type === "design");
}

export const totalPieces = (items: ProductLineItem[]) =>
  items.reduce((sum, it) => sum + (it.sizeQuantities ?? []).reduce((s, q) => s + (q.quantity || 0), 0), 0);
