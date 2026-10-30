import { OrderHeader, PlayerDetail, ProductImage, ProductLineItem } from "@/types";
import {
  productSchemas,
  isConditionMet,
  SIZE_OPTIONS,
  NUMERIC_SIZE_OPTIONS,
} from "@/config/product-schemas";

/**
 * One description of an order that both the on-screen order form and the PDF draw from.
 * Everything is driven by what the customer picked: questions they never saw or left empty
 * are left out, and follow-up answers are joined to the question they belong to.
 */

export interface SpecLine {
  label: string;
  value: string;
}

export interface PrintSide {
  side: "Front" | "Back";
  type?: string;
  images: ProductImage[];
}

export interface AttachedFile {
  label: string;
  name: string;
  url: string;
}

export interface ProductSummary {
  index: number;
  productType: string;
  totalQty: number;
  specs: SpecLine[];
  sizes: { size: string; quantity: number }[];
  nameList: PlayerDetail[]; // sorted by size, then number
  front?: PrintSide;
  back?: PrintSide;
  files: AttachedFile[];
}

export interface OrderSummary {
  date: string;
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  deliveryDate: string;
  remarks: string;
  products: ProductSummary[];
  grandTotal: number;
}

// Print answers have their own section, so they're kept out of the spec list
const PRINT_FIELD_IDS = new Set(["frontPrint", "printType", "printTypeOtherText", "backPrint", "backPrintType"]);

const SIZE_ORDER = [...SIZE_OPTIONS, ...NUMERIC_SIZE_OPTIONS];
const sizeRank = (s?: string) => {
  const i = SIZE_ORDER.indexOf(s || "");
  return i === -1 ? SIZE_ORDER.length : i;
};

const isYes = (v: unknown) => /^yes$/i.test(String(v ?? "").trim());

/** "SELECT YOUR FABRIC" → "Fabric", "Select Collar Type" → "Collar Type" */
export function cleanLabel(label: string): string {
  const stripped = label.replace(/^select\s+(your\s+)?/i, "").trim();
  if (stripped === stripped.toUpperCase()) {
    return stripped.toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
  }
  return stripped;
}

/** camelCase keys that aren't in the product's form, e.g. "sleeveTipping" → "Sleeve Tipping" */
function labelFromKey(key: string): string {
  return key
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

/**
 * Follow-up label without the words it shares with the start of its parent's label:
 * "Collar Tipping Colour" under "Collar Tipping" → "Colour", "Collar Colour" under
 * "Collar Type" → "Colour", "Inner Padi Colour" under "Collar Padi" stays as is.
 */
function followUpLabel(parentLabel: string, label: string): string {
  const parentWords = cleanLabel(parentLabel).toLowerCase().split(/\s+/);
  const words = cleanLabel(label).split(/\s+/);
  let shared = 0;
  while (shared < words.length - 1 && words[shared].toLowerCase() === parentWords[shared]) shared++;
  return words.slice(shared).join(" ");
}

function str(v: unknown): string {
  if (v === null || v === undefined) return "";
  if (typeof v === "boolean") return v ? "Yes" : "No";
  return String(v).trim();
}

function buildSpecs(item: ProductLineItem): SpecLine[] {
  const fields = (item.fields || {}) as Record<string, string | boolean | undefined>;
  const schema = productSchemas[item.productType] ?? [];
  const specs: SpecLine[] = [];
  const used = new Set<string>();

  for (const f of schema) {
    if (PRINT_FIELD_IDS.has(f.id) || f.conditionalOn) continue;
    const value = str(fields[f.id]);
    used.add(f.id);
    if (!value) continue;

    // Answers that only appear because of this one, e.g. tipping line + colour
    const extras = schema
      .filter((c) => c.conditionalOn?.field === f.id && isConditionMet(c.conditionalOn, fields))
      .map((c) => {
        used.add(c.id);
        const v = str(fields[c.id]);
        return v ? `${followUpLabel(f.label, c.label)}: ${v}` : "";
      })
      .filter(Boolean);

    specs.push({
      label: cleanLabel(f.label),
      value: extras.length ? `${value} (${extras.join(", ")})` : value,
    });
  }

  // Anything saved that this product's form doesn't know about (older orders, custom keys)
  for (const [key, raw] of Object.entries(fields)) {
    if (used.has(key) || PRINT_FIELD_IDS.has(key) || schema.some((f) => f.id === key)) continue;
    const value = str(raw);
    if (value) specs.push({ label: labelFromKey(key), value });
  }
  return specs;
}

function buildPrintSides(item: ProductLineItem): { front?: PrintSide; back?: PrintSide } {
  const fields = (item.fields || {}) as Record<string, string | boolean | undefined>;
  const schema = productSchemas[item.productType] ?? [];
  const hasFrontQ = schema.some((f) => f.id === "frontPrint");
  const hasBackQ = schema.some((f) => f.id === "backPrint");

  let frontImages = (item.frontImages ?? []).filter((i) => i?.url || i?.thumbnail);
  let backImages = (item.backImages ?? []).filter((i) => i?.url || i?.thumbnail);
  // Very old orders only have one mixed image list
  if (!item.frontImages && !item.backImages && item.images?.length) {
    frontImages = item.images.filter((_, i) => i % 2 === 0);
    backImages = item.images.filter((_, i) => i % 2 === 1);
  }

  const frontType = [str(fields.printType), str(fields.printTypeOtherText)].filter(Boolean).join(" — ");
  const front =
    (hasFrontQ ? isYes(fields.frontPrint) : frontImages.length > 0)
      ? { side: "Front" as const, type: frontType || undefined, images: frontImages }
      : undefined;
  const back =
    (hasBackQ ? isYes(fields.backPrint) : backImages.length > 0)
      ? { side: "Back" as const, type: str(fields.backPrintType) || undefined, images: backImages }
      : undefined;
  return { front, back };
}

function buildNameList(item: ProductLineItem): PlayerDetail[] {
  const filled = (p: PlayerDetail) => (p.number || "").trim() || (p.name || "").trim();
  const list = item.nameList?.length
    ? item.nameList.filter(filled)
    : item.sizeQuantities.flatMap((r) => (r.players ?? []).filter(filled).map((p) => ({ ...p, size: r.size })));
  return [...list].sort(
    (a, b) =>
      sizeRank(a.size) - sizeRank(b.size) ||
      (parseInt(a.number || "", 10) || 9999) - (parseInt(b.number || "", 10) || 9999)
  );
}

export function buildOrderSummary(customer: Partial<OrderHeader>, items: ProductLineItem[]): OrderSummary {
  const products = items.map((item, i): ProductSummary => {
    const sizes = (item.sizeQuantities ?? [])
      .filter((s) => s.size && s.quantity > 0)
      .map((s) => ({ size: s.size, quantity: s.quantity }));
    const files: AttachedFile[] = [
      ...(item.repeatOrderFiles ?? []).map((f, n) => ({
        label: "Previous order",
        name: f.name || `File ${n + 1}`,
        url: f.url,
      })),
      ...(item.nameListFiles ?? []).map((f, n) => ({
        label: "Name list file",
        name: f.name || `List ${n + 1}`,
        url: f.url,
      })),
    ].filter((f) => f.url && !f.url.startsWith("data:"));

    return {
      index: i + 1,
      productType: item.productType || "Product",
      totalQty: sizes.reduce((sum, s) => sum + s.quantity, 0),
      specs: buildSpecs(item),
      sizes,
      nameList: buildNameList(item),
      ...buildPrintSides(item),
      files,
    };
  });

  return {
    date: new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "2-digit", year: "numeric" }),
    customerName: customer.customerName || "",
    customerPhone: customer.customerPhone || "",
    customerAddress: customer.customerAddress || "",
    deliveryDate: customer.dispatchDate || "",
    remarks: customer.remarks || "",
    products,
    grandTotal: products.reduce((sum, p) => sum + p.totalQty, 0),
  };
}

/** Name list split into per-size groups for display */
export function groupNamesBySize(list: PlayerDetail[]): { size: string; players: PlayerDetail[] }[] {
  const groups: { size: string; players: PlayerDetail[] }[] = [];
  for (const p of list) {
    const size = p.size || "No size";
    const g = groups.find((x) => x.size === size);
    if (g) g.players.push(p);
    else groups.push({ size, players: [p] });
  }
  return groups;
}
