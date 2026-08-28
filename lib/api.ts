import { Order, ProductLineItem, SubmitOrderResponse } from "@/types";

// ─────────────────────────────────────────────
//  Typed API error
// ─────────────────────────────────────────────
export class ApiError extends Error {
  retryable: boolean;
  status?: number;

  constructor(message: string, retryable: boolean, status?: number) {
    super(message);
    this.name = "ApiError";
    this.retryable = retryable;
    this.status = status;
  }
}

// ─────────────────────────────────────────────
//  Public API calls (Route through Next.js Server API to avoid CORS)
// ─────────────────────────────────────────────

/**
 * Submit a new order. Returns orderId + tokens from n8n webhook.
 */
export async function submitOrder(
  order: Omit<Order, "status">
): Promise<SubmitOrderResponse> {
  let response: Response;
  try {
    response = await fetch("/api/order-submit", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(order),
    });
  } catch {
    throw new ApiError(
      "Network error — please check your connection and try again.",
      true
    );
  }

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const retryable = response.status >= 500 || response.status === 429;
    throw new ApiError(
      data?.error || `Submission failed (${response.status})`,
      retryable,
      response.status
    );
  }

  const raw = Array.isArray(data) ? data[0] : data;
  return {
    orderId: raw?.orderId || raw?.id || `ORD-${Date.now()}`,
    editToken: raw?.editToken || raw?.token || "",
    invoiceToken: raw?.invoiceToken || raw?.token || "",
  };
}

/**
 * Fetch an existing order for pre-filling the edit view.
 */
export async function getOrder(
  orderId: string,
  token: string
): Promise<Order> {
  let response: Response;
  try {
    response = await fetch(`/api/order/${orderId}?token=${encodeURIComponent(token)}`);
  } catch {
    throw new ApiError("Network error — could not load order.", true);
  }

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new ApiError(data?.error || "Failed to load order", true, response.status);
  }
  return Array.isArray(data) ? data[0] : data;
}

/**
 * Update an existing order (edit flow).
 */
export async function updateOrder(
  orderId: string,
  token: string,
  order: Omit<Order, "orderId" | "status">
): Promise<{ success: boolean }> {
  let response: Response;
  try {
    response = await fetch(
      `/api/order-update/${orderId}?token=${encodeURIComponent(token)}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(order),
      }
    );
  } catch {
    throw new ApiError("Network error — could not update order.", true);
  }

  const data = await response.json().catch(() => ({}));
  if (data?.error === "locked" || response.status === 423) {
    throw new ApiError(
      "This order is locked and can no longer be edited.",
      false,
      423
    );
  }

  if (!response.ok) {
    throw new ApiError(data?.error || "Update failed", true, response.status);
  }

  return { success: true };
}

/**
 * Trigger invoice download. Returns a Blob for the PDF.
 */
export async function getInvoice(
  orderId: string,
  token: string
): Promise<void> {
  const url = `/api/invoice/${orderId}?token=${encodeURIComponent(token)}`;
  let response: Response;

  try {
    response = await fetch(url);
  } catch {
    throw new ApiError(
      "Network error — could not download invoice.",
      true
    );
  }

  if (!response.ok) {
    throw new ApiError(`Could not download invoice (${response.status})`, true, response.status);
  }

  const blob = await response.blob();
  const objectUrl = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = objectUrl;
  a.download = `invoice-${orderId}.pdf`;
  a.click();
  URL.revokeObjectURL(objectUrl);
}

/**
 * Upload a single image file to n8n.
 */
export async function uploadImage(file: File): Promise<string> {
  const formData = new FormData();
  formData.append("file", file);

  let response: Response;
  try {
    response = await fetch("/api/upload-image", { method: "POST", body: formData });
  } catch {
    throw new ApiError("Network error — image upload failed.", true);
  }

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new ApiError(
      data?.error || `Image upload failed (${response.status})`,
      true,
      response.status
    );
  }

  return data.url;
}

export type { ProductLineItem };
