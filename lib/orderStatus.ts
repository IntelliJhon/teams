/** Order stages shown in the admin panel, in workflow order */
export const ORDER_STATUSES = [
  "Submitted",
  "Designing",
  "Design sent",
  "Changes requested",
  "Approved",
  "In production",
  "Dispatched",
  "Cancelled",
] as const;

export type AdminOrderStatus = (typeof ORDER_STATUSES)[number];

/** Badge colours per status (Tailwind classes) */
export const STATUS_STYLES: Record<string, string> = {
  Submitted: "bg-gray-100 text-gray-800 border-gray-300",
  Designing: "bg-sky-50 text-sky-800 border-sky-300",
  "Design sent": "bg-indigo-50 text-indigo-800 border-indigo-300",
  "Changes requested": "bg-amber-50 text-amber-900 border-amber-300",
  Approved: "bg-emerald-50 text-emerald-800 border-emerald-300",
  "In production": "bg-violet-50 text-violet-800 border-violet-300",
  Dispatched: "bg-teal-50 text-teal-800 border-teal-300",
  Cancelled: "bg-red-50 text-red-700 border-red-300",
};

export const statusStyle = (status: string) => STATUS_STYLES[status] || STATUS_STYLES.Submitted;
