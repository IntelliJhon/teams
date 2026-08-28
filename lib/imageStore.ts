// Global in-memory image store for short URLs
declare global {
  // eslint-disable-next-line no-var
  var __teamsImageStore: Map<string, { buffer: Buffer; mimeType: string; createdAt: number }> | undefined;
}

if (!global.__teamsImageStore) {
  global.__teamsImageStore = new Map();
}

const imageStore = global.__teamsImageStore;

export function saveImage(id: string, buffer: Buffer, mimeType: string) {
  imageStore.set(id, { buffer, mimeType, createdAt: Date.now() });

  // Clean up images older than 24 hours (keep max 100 images)
  if (imageStore.size > 100) {
    const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
    for (const [key, val] of imageStore.entries()) {
      if (val.createdAt < oneDayAgo) {
        imageStore.delete(key);
      }
    }
  }
}

export function getImage(id: string) {
  return imageStore.get(id);
}
