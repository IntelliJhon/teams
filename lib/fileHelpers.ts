import { ProductImage } from "@/types";

/** True when an uploaded print file is a PDF (by its link or its file name) */
export function isPdfFile(img: Pick<ProductImage, "url" | "name">): boolean {
  return /\.pdf(\?|$)/i.test(img.url || "") || /\.pdf$/i.test(img.name || "");
}

/** Page 1 of a Cloudinary-hosted PDF as a JPG, or "" when the host can't render it */
export function pdfPreviewUrl(url: string): string {
  return /^https:\/\/res\.cloudinary\.com\/.+\/image\/upload\/.+\.pdf$/i.test(url || "")
    ? url.replace(/\.pdf$/i, ".jpg")
    : "";
}

/** Small grey "PDF" tile for PDFs that have no page preview */
export const PDF_ICON =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="8" fill="#fee2e2"/>' +
      '<text x="32" y="40" font-family="Arial,sans-serif" font-size="18" font-weight="700" fill="#b91c1c" text-anchor="middle">PDF</text></svg>'
  );

/** What to show as the thumbnail of an uploaded print file */
export function previewSrc(img: Pick<ProductImage, "url" | "name" | "thumbnail">): string {
  if (img.thumbnail) return img.thumbnail;
  if (isPdfFile(img)) return pdfPreviewUrl(img.url) || PDF_ICON;
  return img.url;
}
