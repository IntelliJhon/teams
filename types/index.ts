// ─────────────────────────────────────────────
//  Shared type definitions
// ─────────────────────────────────────────────

export type OrderStatus = "Submitted" | "In Production" | "Locked";

export interface PlayerDetail {
  number?: string;
  name?: string;
  size?: string; // set on the back print master name list; per-size lists are built from it
}

export interface SizeQuantity {
  size: string;
  quantity: number;
  players?: PlayerDetail[];
}

export interface ProductImage {
  url: string;
  thumbnail?: string; // compact base64 thumbnail for instant preview & PDF rendering
  name?: string; // original file name (set for non-image documents like PDFs)
  position?: string; // where the design goes on the garment, e.g. "Left Chest Logo" (front images)
}

export interface ProductLineItem {
  lineId: string; // client-generated uuid, stable across edits
  productType: string; // "Tshirt" | "Jersey" | "Shorts" | ...
  fields: Record<string, string | boolean>;
  sizeQuantities: SizeQuantity[];
  images: ProductImage[]; // combined list for backwards compatibility
  frontImages?: ProductImage[]; // up to 10 front images
  backImages?: ProductImage[]; // up to 10 back images
  repeatOrderFiles?: ProductImage[]; // previous order files, only when productionType is "Repeat Order"
  nameList?: PlayerDetail[]; // back print names/numbers typed in the Name List modal
  nameListFiles?: ProductImage[]; // back print name list uploaded as Excel / CSV / photo
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
  /** Show when the field equals this value; leave out to show once the field has any value */
  value?: string;
}

export interface FieldDef {
  id: string;
  label: string;
  type: FieldType;
  options?: string[];
  conditionalOn?: ConditionalRule;
  required?: boolean;
  /** "chips" shows a short option list as tap-to-select buttons instead of a picker */
  display?: "chips";
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
