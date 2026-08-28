// ─────────────────────────────────────────────
//  Shared type definitions
// ─────────────────────────────────────────────

export type OrderStatus = "Submitted" | "In Production" | "Locked";

export interface PlayerDetail {
  number?: string;
  name?: string;
}

export interface SizeQuantity {
  size: string;
  quantity: number;
  players?: PlayerDetail[];
}

export interface ProductImage {
  url: string;
}

export interface ProductLineItem {
  lineId: string; // client-generated uuid, stable across edits
  productType: string; // "Tshirt" | "Jersey" | "Shorts" | ...
  fields: Record<string, string | boolean>;
  sizeQuantities: SizeQuantity[];
  images: ProductImage[];
}

export interface OrderHeader {
  customerPhone: string;
  customerName?: string;
  customerAddress?: string;
  dispatchDate: string; // ISO date string
  remarks?: string;
}

export interface ProductCatalogItem {
  name: string;
  description: string;
  meta: string;
  imageUrl?: string;
  icon?: string;
}

export interface Order extends OrderHeader {
  orderId?: string; // set by n8n on submit
  status?: OrderStatus;
  items: ProductLineItem[];
}

export interface SubmitOrderResponse {
  orderId: string;
  editToken: string;
  invoiceToken: string;
}

// ─────────────────────────────────────────────
//  Field schema types
// ─────────────────────────────────────────────

export type FieldType = "select" | "text" | "textarea";

export interface ConditionalRule {
  field: string;
  value: string;
}

export interface FieldDef {
  id: string;
  label: string;
  type: FieldType;
  options?: string[];
  conditionalOn?: ConditionalRule;
  required?: boolean;
  placeholder?: string;
}

// ─────────────────────────────────────────────
//  API error type
// ─────────────────────────────────────────────

export interface ApiError {
  message: string;
  retryable: boolean;
  status?: number;
}
