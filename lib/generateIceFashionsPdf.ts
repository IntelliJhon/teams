import { jsPDF } from "jspdf";
import { OrderHeader, ProductImage, ProductLineItem } from "@/types";
import { buildOrderSummary, groupNamesBySize, PrintSide, ProductSummary } from "@/lib/orderSummary";

interface GeneratePdfProps {
  customer: OrderHeader;
  items: ProductLineItem[];
}

/**
 * Safely resolves an image URL or thumbnail to a base64 Data URL for jsPDF embedding
 */
async function resolveImageDataUrl(img: { url: string; thumbnail?: string }): Promise<string | null> {
  if (img.thumbnail && img.thumbnail.startsWith("data:")) {
    return img.thumbnail;
  }
  if (!img.url) return null;
  if (img.url.startsWith("data:")) return img.url;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);
    const res = await fetch(img.url, { signal: controller.signal });
    clearTimeout(timeout);
    if (!res.ok) return null;

    if (typeof window !== "undefined") {
      const blob = await res.blob();
      return new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve((reader.result as string) || "");
        reader.onerror = () => resolve("");
        reader.readAsDataURL(blob);
      });
    } else {
      const buf = Buffer.from(await res.arrayBuffer());
      const mime = res.headers.get("content-type") || "image/jpeg";
      return `data:${mime};base64,${buf.toString("base64")}`;
    }
  } catch {
    return null;
  }
}

// A4 portrait, millimetres
const PAGE_H = 297;
const LEFT = 14;
const RIGHT = 196;
const WIDTH = RIGHT - LEFT;
const BOTTOM_LIMIT = 280; // keep room for the page number line

type RGB = [number, number, number];
const GREY_FILL: RGB = [229, 231, 235];
const DARK_FILL: RGB = [34, 34, 34];

/**
 * Builds the ICE FASHIONS order form from what the customer actually selected:
 * one section per product (specifications, sizes, name list, printing with photos,
 * attached files), flowing onto as many pages as needed.
 */
export async function generateIceFashionsPdf({ customer, items }: GeneratePdfProps): Promise<jsPDF> {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const summary = buildOrderSummary(customer, items);
  const orderNumber = `IF-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

  // Photos are fetched up front, in parallel
  const allImages: ProductImage[] = summary.products.flatMap((p) => [
    ...(p.front?.images ?? []),
    ...(p.back?.images ?? []),
  ]);
  const resolved = new Map<ProductImage, string | null>();
  await Promise.all(allImages.map(async (img) => resolved.set(img, await resolveImageDataUrl(img))));

  let y = 0;

  const setFont = (style: "normal" | "bold", size: number, color: RGB = [0, 0, 0]) => {
    doc.setFont("helvetica", style);
    doc.setFontSize(size);
    doc.setTextColor(color[0], color[1], color[2]);
  };

  const cell = (x: number, top: number, w: number, h: number, fill?: RGB) => {
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.25);
    if (fill) {
      doc.setFillColor(fill[0], fill[1], fill[2]);
      doc.rect(x, top, w, h, "FD");
    } else {
      doc.rect(x, top, w, h);
    }
  };

  const drawFirstHeader = () => {
    setFont("bold", 22);
    doc.text("ICE FASHIONS", 105, 14, { align: "center" });
    setFont("normal", 8.5);
    doc.text("Kaniyapuram, Calicut Road, Edappal - 679576 | Mob: 8086863111", 105, 19, { align: "center" });

    // No. & Date bar
    cell(LEFT, 23, WIDTH, 8);
    doc.line(105, 23, 105, 31);
    setFont("bold", 9);
    doc.text(`No: ${orderNumber}`, LEFT + 4, 28.5);
    doc.text(`Date: ${summary.date}`, 109, 28.5);
    doc.setFillColor(...DARK_FILL);
    doc.rect(RIGHT - 30, 23, 30, 8, "F");
    setFont("bold", 8, [255, 255, 255]);
    doc.text("ORDER FORM", RIGHT - 15, 28.3, { align: "center" });

    // From
    setFont("bold", 9);
    doc.text("FROM:", LEFT, 37);
    setFont("normal", 9);
    const from = [
      summary.customerName || "—",
      summary.customerPhone ? `(${summary.customerPhone})` : "",
      summary.customerAddress ? `- ${summary.customerAddress}` : "",
    ]
      .filter(Boolean)
      .join(" ");
    const fromLines = doc.splitTextToSize(from, WIDTH - 14) as string[];
    doc.text(fromLines.slice(0, 2), LEFT + 13, 37);
    y = 37 + Math.min(fromLines.length, 2) * 4 + 2;
  };

  const drawContinuedHeader = () => {
    setFont("bold", 11);
    doc.text("ICE FASHIONS", LEFT, 12);
    setFont("normal", 8, [90, 90, 90]);
    doc.text(`Order ${orderNumber} · ${summary.customerName || ""} (continued)`, RIGHT, 12, { align: "right" });
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.4);
    doc.line(LEFT, 14.5, RIGHT, 14.5);
    y = 19;
  };

  /** Starts a new page when the next block of height h won't fit */
  const ensure = (h: number) => {
    if (y + h > BOTTOM_LIMIT) {
      doc.addPage();
      drawContinuedHeader();
    }
  };

  const sectionLabel = (text: string, x = LEFT, w = WIDTH) => {
    cell(x, y, w, 5.5, GREY_FILL);
    setFont("bold", 7.5);
    doc.text(text.toUpperCase(), x + 2, y + 3.9);
    y += 5.5;
  };

  // ── Specifications (left) + sizes (right), row by row ──
  const drawSpecsAndSizes = (p: ProductSummary) => {
    const specX = LEFT;
    const specW = 122;
    const labelW = 44;
    const sizeX = LEFT + specW;
    const sizeW = WIDTH - specW;

    ensure(12);
    cell(specX, y, specW, 5.5, GREY_FILL);
    cell(sizeX, y, sizeW, 5.5, GREY_FILL);
    setFont("bold", 7.5);
    doc.text("SPECIFICATIONS", specX + 2, y + 3.9);
    doc.text("SIZE", sizeX + 2, y + 3.9);
    doc.text("QTY", RIGHT - 2, y + 3.9, { align: "right" });
    y += 5.5;

    const sizeRows: { left: string; right: string; bold?: boolean }[] = [
      ...p.sizes.map((s) => ({ left: s.size, right: String(s.quantity) })),
      { left: "TOTAL", right: `${p.totalQty} PCS`, bold: true },
    ];
    const specs = p.specs.length ? p.specs : [{ label: "—", value: "" }];
    const rows = Math.max(specs.length, sizeRows.length);

    for (let r = 0; r < rows; r++) {
      const spec = specs[r];
      setFont("bold", 8);
      const valueLines = spec ? (doc.splitTextToSize(spec.value, specW - labelW - 4) as string[]) : [];
      const h = Math.max(5.5, valueLines.length * 3.6 + 2);
      ensure(h);

      cell(specX, y, labelW, h);
      cell(specX + labelW, y, specW - labelW, h);
      if (spec) {
        setFont("normal", 8, [60, 60, 60]);
        doc.text(spec.label, specX + 2, y + 3.9);
        setFont("bold", 8);
        doc.text(valueLines, specX + labelW + 2, y + 3.9);
      }

      cell(sizeX, y, sizeW, h, sizeRows[r]?.bold ? [243, 244, 246] : undefined);
      const sr = sizeRows[r];
      if (sr) {
        setFont(sr.bold ? "bold" : "normal", 8);
        doc.text(sr.left, sizeX + 2, y + 3.9);
        setFont("bold", 8);
        doc.text(sr.right, RIGHT - 2, y + 3.9, { align: "right" });
      }
      y += h;
    }
  };

  // ── Name list grouped by size, three players per line; headings repeat on every page ──
  const drawNameList = (p: ProductSummary) => {
    if (p.nameList.length === 0) return;
    const title = `Name list · #${p.index} ${p.productType} (${p.nameList.length} players)`;
    ensure(16);
    sectionLabel(title);
    const sizeColW = 20;
    const perLine = 3;
    const colW = (WIDTH - sizeColW) / perLine;
    const rowH = 5;

    for (const g of groupNamesBySize(p.nameList)) {
      for (let i = 0; i < g.players.length; i += perLine) {
        const pageBefore = doc.getNumberOfPages();
        ensure(rowH);
        const newPage = doc.getNumberOfPages() !== pageBefore;
        if (newPage) sectionLabel(`${title} — continued`);
        const showSize = i === 0 || newPage;
        cell(LEFT, y, sizeColW, rowH);
        cell(LEFT + sizeColW, y, WIDTH - sizeColW, rowH);
        if (showSize) {
          setFont("bold", 8);
          doc.text(i === 0 ? `${g.size}  × ${g.players.length}` : `${g.size} (cont.)`, LEFT + 2, y + 3.5);
        }
        g.players.slice(i, i + perLine).forEach((pl, k) => {
          const x = LEFT + sizeColW + k * colW + 2;
          setFont("bold", 8);
          doc.text(pl.number || "–", x, y + 3.5);
          setFont("normal", 8);
          const name = doc.splitTextToSize((pl.name || "—").toUpperCase(), colW - 11) as string[];
          doc.text(name[0] || "", x + 8, y + 3.5);
        });
        y += rowH;
      }
    }
  };

  // ── Printing: selected sides only, photos with their position, each a link ──
  const drawPrinting = (p: ProductSummary) => {
    const sides = [p.front, p.back].filter(Boolean) as PrintSide[];
    if (sides.length === 0) return;

    const colW = WIDTH / sides.length;
    const perRow = sides.length === 1 ? 4 : 2;
    const badgeW = (colW - 4 - (perRow - 1) * 2) / perRow;
    const badgeH = 14;
    const rowsNeeded = Math.max(...sides.map((s) => Math.ceil(s.images.length / perRow)));
    const blockH = 11 + rowsNeeded * (badgeH + 2) + (rowsNeeded ? 1 : 0);
    ensure(Math.min(blockH, BOTTOM_LIMIT - 25));

    const top = y;
    sides.forEach((side, si) => {
      const x0 = LEFT + si * colW;
      cell(x0, top, colW, blockH);
      setFont("bold", 8);
      doc.text(`${side.side.toUpperCase()} PRINT: YES`, x0 + 2, top + 4.5);
      if (side.type) {
        setFont("normal", 8);
        const t = doc.splitTextToSize(`Type: ${side.type}`, colW - 4) as string[];
        doc.text(t[0] || "", x0 + 2, top + 8.5);
      }

      side.images.forEach((img, idx) => {
        const bx = x0 + 2 + (idx % perRow) * (badgeW + 2);
        const by = top + 11 + Math.floor(idx / perRow) * (badgeH + 2);
        doc.setFillColor(243, 248, 255);
        doc.setDrawColor(147, 197, 253);
        doc.setLineWidth(0.3);
        doc.roundedRect(bx, by, badgeW, badgeH, 1.2, 1.2, "FD");
        if (img.url) doc.link(bx, by, badgeW, badgeH, { url: img.url });

        const photo = badgeH - 2.4;
        const data = resolved.get(img);
        if (data) {
          try {
            const format = (data.includes("image/png") ? "PNG" : "JPEG") as "PNG" | "JPEG";
            doc.addImage(data, format, bx + 1.2, by + 1.2, photo, photo);
          } catch (e) {
            console.warn(`Could not add ${side.side} photo to PDF:`, e);
          }
        } else {
          doc.setFillColor(224, 231, 255);
          doc.rect(bx + 1.2, by + 1.2, photo, photo, "F");
        }

        const tx = bx + photo + 2.6;
        const label = doc.splitTextToSize(img.position || `${side.side} #${idx + 1}`, badgeW - photo - 3.5) as string[];
        setFont("bold", 7, [29, 78, 216]);
        doc.text(label.slice(0, 2), tx, by + 4.6);
        setFont("normal", 6, [37, 99, 235]);
        doc.text("Open photo", tx, by + badgeH - 2);
      });
      doc.setTextColor(0, 0, 0);
      doc.setDrawColor(0, 0, 0);
    });
    y = top + blockH;
  };

  const drawFiles = (p: ProductSummary) => {
    if (p.files.length === 0) return;
    const h = 4 + p.files.length * 4.5;
    ensure(h);
    cell(LEFT, y, WIDTH, h);
    p.files.forEach((f, i) => {
      const ty = y + 4 + i * 4.5;
      setFont("bold", 7.5);
      doc.text(`${f.label}:`, LEFT + 2, ty);
      setFont("normal", 7.5, [29, 78, 216]);
      doc.textWithLink(f.name, LEFT + 30, ty, { url: f.url });
    });
    doc.setTextColor(0, 0, 0);
    y += h;
  };

  // ── Build the document ──
  drawFirstHeader();

  if (summary.products.length === 0) {
    ensure(10);
    cell(LEFT, y, WIDTH, 10);
    setFont("normal", 9, [110, 110, 110]);
    doc.text("No products in this order.", 105, y + 6, { align: "center" });
    y += 14;
  }

  for (const p of summary.products) {
    // Keep the product heading together with its spec table where possible
    const specRows = Math.max(p.specs.length, p.sizes.length + 1);
    ensure(Math.min(12.5 + specRows * 5.8, 120));
    doc.setFillColor(...DARK_FILL);
    doc.rect(LEFT, y, WIDTH, 7, "F");
    setFont("bold", 10, [255, 255, 255]);
    doc.text(`#${p.index}  ${p.productType.toUpperCase()}`, LEFT + 2.5, y + 4.9);
    doc.text(`${p.totalQty} PCS`, RIGHT - 2.5, y + 4.9, { align: "right" });
    y += 7;

    drawSpecsAndSizes(p);
    drawPrinting(p);
    drawFiles(p);
    if (p.nameList.length > 0) {
      ensure(6);
      cell(LEFT, y, WIDTH, 6, [238, 242, 255]);
      setFont("bold", 8, [55, 48, 163]);
      doc.text(`Name list: ${p.nameList.length} players — see "Name list · #${p.index}" after the signature`, LEFT + 2, y + 4.1);
      doc.setTextColor(0, 0, 0);
      y += 6;
    }
    y += 5;
  }

  // Remarks + order total
  setFont("normal", 8);
  const remarkLines = doc.splitTextToSize(summary.remarks || "None", 118) as string[];
  const remarksH = Math.max(16, 9 + remarkLines.length * 3.6);
  ensure(remarksH + 14);
  cell(LEFT, y, 124, remarksH);
  cell(LEFT + 124, y, WIDTH - 124, remarksH, [243, 244, 246]);
  setFont("bold", 8.5);
  doc.text("SPECIAL NOTES / REMARKS:", LEFT + 2, y + 5);
  setFont("normal", 8);
  doc.text(remarkLines, LEFT + 2, y + 9.5);
  setFont("bold", 7.5, [80, 80, 80]);
  doc.text("TOTAL QUANTITY", LEFT + 124 + (WIDTH - 124) / 2, y + remarksH / 2 - 1.5, { align: "center" });
  setFont("bold", 13);
  doc.text(`${summary.grandTotal} PCS`, LEFT + 124 + (WIDTH - 124) / 2, y + remarksH / 2 + 4.5, { align: "center" });
  y += remarksH + 10;

  // Footer: Delivery Date & Name/Sign
  setFont("bold", 9.5);
  doc.text("Delivery Date", LEFT, y);
  setFont("normal", 9.5);
  doc.text(summary.deliveryDate || "—", 40, y);
  doc.setLineWidth(0.4);
  doc.line(38, y + 1, 95, y + 1);
  setFont("bold", 9.5);
  doc.text("NAME/SIGN", 115, y);
  setFont("normal", 9.5);
  doc.text(summary.customerName || "—", 140, y);
  doc.line(138, y + 1, RIGHT, y + 1);
  y += 8;

  // Name lists come last so the order details stay together on the first page(s)
  const withNames = summary.products.filter((p) => p.nameList.length > 0);
  withNames.forEach((p, i) => {
    if (i === 0) {
      doc.addPage();
      drawContinuedHeader();
    } else {
      y += 4;
    }
    drawNameList(p);
  });

  // Page numbers on every page
  const pages = doc.getNumberOfPages();
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i);
    setFont("normal", 7.5, [120, 120, 120]);
    doc.text(`Page ${i} of ${pages}`, RIGHT, PAGE_H - 8, { align: "right" });
    doc.text(`ICE FASHIONS · ${orderNumber}`, LEFT, PAGE_H - 8);
  }
  doc.setTextColor(0, 0, 0);

  return doc;
}
