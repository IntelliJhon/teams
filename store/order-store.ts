import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { OrderHeader, ProductLineItem } from "@/types";

interface OrderState {
  // ── Header ──────────────────────────────────
  customerPhone: string;
  customerName: string;
  customerAddress: string;
  dispatchDate: string;
  remarks: string;
  branch: string;
  marketingPerson: string;
  fromName: string;
  signName: string;

  // ── Cart ────────────────────────────────────
  items: ProductLineItem[];

  // ── Draft (item being configured before push) ─
  draft: Partial<ProductLineItem> | null;

  // ── Edit-mode metadata ──────────────────────
  editOrderId: string | null;
  editToken: string | null;

  // ── Actions ─────────────────────────────────
  setHeader: (header: Partial<OrderHeader>) => void;
  setDraft: (draft: Partial<ProductLineItem> | null) => void;
  addItem: (item: ProductLineItem) => void;
  updateItem: (lineId: string, item: ProductLineItem) => void;
  removeItem: (lineId: string) => void;
  hydrateFromOrder: (
    header: OrderHeader,
    items: ProductLineItem[],
    orderId: string,
    token: string
  ) => void;
  clearOrder: () => void;
}

const initialState = {
  customerPhone: "",
  customerName: "",
  customerAddress: "",
  dispatchDate: "",
  remarks: "",
  branch: "",
  marketingPerson: "",
  fromName: "",
  signName: "",
  items: [],
  draft: null,
  editOrderId: null,
  editToken: null,
};

export const useOrderStore = create<OrderState>()(
  persist(
    (set) => ({
      ...initialState,

      setHeader: (header) =>
        set((state) => ({
          customerPhone: header.customerPhone ?? state.customerPhone,
          customerName:
            header.customerName !== undefined
              ? header.customerName
              : state.customerName,
          customerAddress:
            header.customerAddress !== undefined
              ? header.customerAddress
              : state.customerAddress,
          dispatchDate: header.dispatchDate ?? state.dispatchDate,
          remarks:
            header.remarks !== undefined ? header.remarks : state.remarks,
          branch: header.branch !== undefined ? header.branch : state.branch,
          marketingPerson:
            header.marketingPerson !== undefined ? header.marketingPerson : state.marketingPerson,
          fromName: header.fromName !== undefined ? header.fromName : state.fromName,
          signName: header.signName !== undefined ? header.signName : state.signName,
        })),

      setDraft: (draft) => set({ draft }),

      addItem: (item) =>
        set((state) => ({ items: [...state.items, item], draft: null })),

      updateItem: (lineId, updatedItem) =>
        set((state) => ({
          items: state.items.map((it) =>
            it.lineId === lineId ? updatedItem : it
          ),
          draft: null,
        })),

      removeItem: (lineId) =>
        set((state) => ({
          items: state.items.filter((it) => it.lineId !== lineId),
        })),

      hydrateFromOrder: (header, items, orderId, token) =>
        set({
          customerPhone: header.customerPhone,
          customerName: header.customerName ?? "",
          customerAddress: header.customerAddress ?? "",
          dispatchDate: header.dispatchDate,
          remarks: header.remarks ?? "",
          branch: header.branch ?? "",
          marketingPerson: header.marketingPerson ?? "",
          fromName: header.fromName ?? "",
          signName: header.signName ?? "",
          items,
          editOrderId: orderId,
          editToken: token,
          draft: null,
        }),

      clearOrder: () => set(initialState),
    }),
    {
      name: "order-draft",
      // sessionStorage: data lives only for the browser session tab
      storage: createJSONStorage(() => {
        if (typeof window !== "undefined") return sessionStorage;
        // SSR fallback — no-op storage
        return {
          getItem: () => null,
          setItem: () => {},
          removeItem: () => {},
        };
      }),
    }
  )
);

/** The order's header fields from the store, for submitting and for the PDF */
export function headerOf(s: OrderHeader): OrderHeader {
  return {
    customerPhone: s.customerPhone,
    customerName: s.customerName,
    customerAddress: s.customerAddress,
    dispatchDate: s.dispatchDate,
    remarks: s.remarks,
    branch: s.branch,
    marketingPerson: s.marketingPerson,
    fromName: s.fromName,
    signName: s.signName,
  };
}
