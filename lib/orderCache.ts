import { OrderHeader, ProductLineItem } from "@/types";

declare global {
  // eslint-disable-next-line no-var
  var __teamsOrderCache: Map<string, { customer: OrderHeader; items: ProductLineItem[]; createdAt: number }> | undefined;
}

if (!global.__teamsOrderCache) {
  global.__teamsOrderCache = new Map();
}

const orderCache = global.__teamsOrderCache;

export function cacheOrder(id: string, customer: OrderHeader, items: ProductLineItem[]) {
  orderCache.set(id, { customer, items, createdAt: Date.now() });

  // Cleanup entries older than 24 hours
  if (orderCache.size > 200) {
    const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
    for (const [key, val] of orderCache.entries()) {
      if (val.createdAt < oneDayAgo) {
        orderCache.delete(key);
      }
    }
  }
}

export function getCachedOrder(id: string) {
  return orderCache.get(id);
}
