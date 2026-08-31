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
