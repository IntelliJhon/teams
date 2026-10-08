import { jsPDF } from "jspdf";
import { OrderHeader, ProductLineItem } from "@/types";

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

export async function generateIceFashionsPdf({ customer, items }: GeneratePdfProps): Promise<jsPDF> {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const primaryItem = items[0] || null;
  const primaryFields = (primaryItem?.fields || {}) as Record<string, string>;

  const shortsOrLowerItems = items.filter(
    (it) => it.productType === "Shorts" || it.productType === "Lower"
  );

  const modelName = primaryItem ? primaryItem.productType : "—";
  const cloth = primaryFields.fabric || primaryFields.cloth || "—";
  const collar = primaryFields.collarType || primaryFields.collarPadi || "—";

  const sleeveType = (primaryFields.sleeveType || "").toUpperCase();
  const isHS = sleeveType.includes("HALF") || sleeveType === "H/S" || sleeveType.includes("MEGA");
  const isFS = sleeveType.includes("FULL") || sleeveType === "F/S";

  const frontPrintYes = primaryFields.frontPrint === "YES" || primaryFields.frontPrint === "Yes";
  const frontPrintType = primaryFields.printType || "—";

  const backPrintYes = primaryFields.backPrint === "YES" || primaryFields.backPrint === "Yes";
  const backPrintType = primaryFields.backPrintType || "—";

  const jerseySizeRows = primaryItem ? primaryItem.sizeQuantities : [];

  const orderNumber = `IF-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
  const currentDate = new Date().toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

  const totalJerseyQty = jerseySizeRows.reduce((sum, r) => sum + r.quantity, 0);

  // 1. Header: ICE FASHIONS
  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.setTextColor(0, 0, 0);
  doc.text("ICE FASHIONS", 105, 14, { align: "center" });

  doc.setFontSize(8.5);
  doc.setFont("helvetica", "normal");
  doc.text("Kaniyapuram, Calicut Road, Edappal - 679576 | Mob: 8086863111", 105, 19, { align: "center" });

  // 2. Meta bar: No. & Date
  const metaY = 25;
  doc.setLineWidth(0.5);
  doc.rect(14, metaY, 182, 8);
  doc.line(105, metaY, 105, metaY + 8);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.text(`No: ${orderNumber}`, 18, metaY + 5.5);
  doc.text(`Date: ${currentDate}`, 109, metaY + 5.5);

  // 3. Table 1: Model, Cloth, Collar, Sleeve (HS / FS)
  const t1Y = 35;
  const t1H = 22;
  doc.rect(14, t1Y, 182, t1H);

  doc.line(14, t1Y + 11, 196, t1Y + 11);
  doc.line(105, t1Y, 105, t1Y + t1H);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.text("MODEL:", 18, t1Y + 7);
  doc.setFont("helvetica", "normal");
  doc.text(String(modelName), 35, t1Y + 7);

  doc.setFont("helvetica", "bold");
  doc.text("CLOTH:", 18, t1Y + 18);
  doc.setFont("helvetica", "normal");
  doc.text(String(cloth), 35, t1Y + 18);

  doc.setFont("helvetica", "bold");
  doc.text("COLLAR:", 109, t1Y + 7);
  doc.setFont("helvetica", "normal");
  doc.text(String(collar), 126, t1Y + 7);

  doc.setFont("helvetica", "bold");
  doc.text("SLEEVE:", 109, t1Y + 18);

  doc.text("H/S", 130, t1Y + 18);
  doc.rect(138, t1Y + 14.5, 4, 4);
  if (isHS) {
    doc.setFont("helvetica", "bold");
    doc.text("X", 139, t1Y + 17.8);
  }

  doc.setFont("helvetica", "normal");
  doc.text("F/S", 152, t1Y + 18);
  doc.rect(160, t1Y + 14.5, 4, 4);
  if (isFS) {
    doc.setFont("helvetica", "bold");
    doc.text("X", 161, t1Y + 17.8);
  }

  // 4. Table 2: Grid of Sizes & Player Numbers/Names
  const t2Y = 60;
  const t2W = 182;
  const t2H = 46;
  const t2MidX = 14 + 116;

  doc.rect(14, t2Y, t2W, t2H);
  doc.line(t2MidX, t2Y, t2MidX, t2Y + t2H);

  const t2RowH = 7.6;
  for (let r = 1; r < 6; r++) {
    doc.line(14, t2Y + r * t2RowH, 196, t2Y + r * t2RowH);
  }

  const sColWidth = 116 / 8;
  for (let c = 1; c < 8; c++) {
    doc.line(14 + c * sColWidth, t2Y, 14 + c * sColWidth, t2Y + t2RowH * 5);
  }

  const standardSizes = [
    ["18", "20", "22", "24", "26", "28", "30", "32"],
    ["34", "36", "38", "S", "M", "L", "XL", "XXL"],
  ];

  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);

  standardSizes[0].forEach((sz, idx) => {
    doc.text(sz, 14 + idx * sColWidth + sColWidth / 2, t2Y + 5.2, { align: "center" });
  });

  standardSizes[1].forEach((sz, idx) => {
    doc.text(sz, 14 + idx * sColWidth + sColWidth / 2, t2Y + t2RowH * 2 + 5.2, { align: "center" });
  });

  doc.setFont("helvetica", "normal");
  standardSizes[0].forEach((sz, idx) => {
    const row = jerseySizeRows.find((r) => r.size.toUpperCase() === sz);
    if (row && row.quantity > 0) {
      doc.text(String(row.quantity), 14 + idx * sColWidth + sColWidth / 2, t2Y + t2RowH + 5.2, { align: "center" });
    }
  });

  standardSizes[1].forEach((sz, idx) => {
    const row = jerseySizeRows.find((r) => r.size.toUpperCase() === sz);
    if (row && row.quantity > 0) {
      doc.text(String(row.quantity), 14 + idx * sColWidth + sColWidth / 2, t2Y + t2RowH * 3 + 5.2, { align: "center" });
    }
  });

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.text("TOTAL:", 18, t2Y + t2RowH * 4 + 5.2);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.text(`${totalJerseyQty} PCS`, 50, t2Y + t2RowH * 4 + 5.2);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.text("COLLAR TIPPING:", 18, t2Y + t2RowH * 5 + 5.5);
  doc.setFont("helvetica", "normal");
  const tippingVal = primaryFields.tipping || primaryFields.collarTipping || "—";
  doc.text(String(tippingVal), 52, t2Y + t2RowH * 5 + 5.5);

  const formatPlayer = (p: { number?: string; name?: string }) => {
    const num = (p.number || "").trim();
    const name = (p.name || "").trim();
    if (num && name) return `#${num} ${name}`;
    if (num) return `#${num}`;
    if (name) return name;
    return "";
  };

  const rightCellRows: { qty: string; text: string }[] = [
    { qty: "", text: "" },
    { qty: "", text: "" },
    { qty: "", text: "" },
    { qty: "", text: "" },
    { qty: "", text: "" },
  ];

  if (jerseySizeRows.length === 1) {
    const sz = jerseySizeRows[0];
    const playerTags = (sz.players || []).map(formatPlayer).filter((t) => t.length > 0);
    const maxPerLine = 4;
    for (let rIdx = 0; rIdx < 5; rIdx++) {
      const slice = playerTags.slice(rIdx * maxPerLine, (rIdx + 1) * maxPerLine);
      if (slice.length > 0) {
        rightCellRows[rIdx] = {
          qty: rIdx === 0 ? `${sz.size}: ${sz.quantity}` : "",
          text: slice.join(", "),
        };
      }
    }
  } else {
    jerseySizeRows.slice(0, 5).forEach((sz, idx) => {
      const playerTags = (sz.players || []).map(formatPlayer).filter((t) => t.length > 0);
      rightCellRows[idx] = {
        qty: `${sz.size}: ${sz.quantity}`,
        text: playerTags.join(", "),
      };
    });
  }

  for (let r = 0; r < 5; r++) {
    const rowY = t2Y + r * t2RowH;
    const rowData = rightCellRows[r];

    if (rowData.qty) {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(7.5);
      doc.text(rowData.qty, t2MidX + 2, rowY + 5.2);
    }

    if (rowData.text) {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7);
      const textX = rowData.qty ? t2MidX + 16 : t2MidX + 3;
      const truncated = doc.splitTextToSize(rowData.text, 194 - textX);
      doc.text(truncated[0] || "", textX, rowY + 5.2);
    }
  }

  // Row 6 right side: SLEEVE TIPPING
  const sleeveTippingVal = primaryFields.sleeveTipping || "—";
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.text("SLEEVE TIPPING:", t2MidX + 2, t2Y + t2RowH * 5 + 5.5);
  doc.setFont("helvetica", "normal");
  doc.text(String(sleeveTippingVal), t2MidX + 34, t2Y + t2RowH * 5 + 5.5);

  // 5. Table 3: Shorts & Special Remarks
  const t3Y = 108;
  const t3H = 43;
  doc.rect(14, t3Y, 182, t3H);

  doc.line(14, t3Y + 7, 196, t3Y + 7);
  doc.line(14, t3Y + 14, 196, t3Y + 14);
  doc.line(14, t3Y + 21, 196, t3Y + 21);

  doc.line(40, t3Y, 40, t3Y + 21);
  const s2ColW = (196 - 40) / 9;
  for (let c = 1; c < 9; c++) {
    doc.line(40 + c * s2ColW, t3Y, 40 + c * s2ColW, t3Y + 21);
  }

  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.text("SHORTS", 27, t3Y + 5, { align: "center" });

  const shortsSizes = ["22", "24", "26", "28", "30", "32", "34", "36", "38"];
  shortsSizes.forEach((sz, idx) => {
    doc.text(sz, 40 + idx * s2ColW + s2ColW / 2, t3Y + 5, { align: "center" });
  });

  const shortsItem = shortsOrLowerItems.find((it) => it.productType === "Shorts") || null;
  const lowerItem = shortsOrLowerItems.find((it) => it.productType === "Lower") || null;

  doc.setFont("helvetica", "bold");
  doc.text("QTY", 27, t3Y + 12, { align: "center" });
  doc.setFont("helvetica", "normal");
  if (shortsItem) {
    shortsSizes.forEach((sz, idx) => {
      const match = shortsItem.sizeQuantities.find((r) => r.size === sz);
      if (match && match.quantity > 0) {
        doc.text(String(match.quantity), 40 + idx * s2ColW + s2ColW / 2, t3Y + 12, { align: "center" });
      }
    });
  }

  doc.setFont("helvetica", "bold");
  doc.text("LOWER", 27, t3Y + 19, { align: "center" });
  doc.setFont("helvetica", "normal");
  if (lowerItem) {
    shortsSizes.forEach((sz, idx) => {
      const match = lowerItem.sizeQuantities.find((r) => r.size === sz);
      if (match && match.quantity > 0) {
        doc.text(String(match.quantity), 40 + idx * s2ColW + s2ColW / 2, t3Y + 19, { align: "center" });
      }
    });
  }

  // Table 3 bottom: Remarks
  const remarksY = t3Y + 24;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.text("SPECIAL NOTES / REMARKS:", 18, remarksY + 3);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  const remarksText = customer.remarks || primaryFields.remarks || primaryFields.specialInstructions || "None";
  const wrappedRemarks = doc.splitTextToSize(String(remarksText), 174);
  doc.text(wrappedRemarks.slice(0, 3), 18, remarksY + 8);

  // 6. Table 4: Jersey Printing Details with Real Photos & Clickable Links
  const t4Y = 153;
  const printBoxH = 120;
  doc.rect(14, t4Y, 182, printBoxH);

  doc.line(14, t4Y + 7, 196, t4Y + 7);
  doc.line(105, t4Y, 105, t4Y + printBoxH);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.text("JERSEY PRINTING DETAILS", 105, t4Y + 5, { align: "center" });

  // Front Print Box Header
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.text(`Front Print: ${frontPrintYes ? "YES" : "NO"}`, 18, t4Y + 13);
  if (frontPrintYes) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.text(`Print Type: ${frontPrintType}`, 18, t4Y + 18.5);
    if (primaryFields.printTypeOtherText) {
      doc.text(`Desc: ${primaryFields.printTypeOtherText}`, 18, t4Y + 24);
    }
  }

  // Back Print Box Header
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.text(`Back Print: ${backPrintYes ? "YES" : "NO"}`, 109, t4Y + 13);
  if (backPrintYes) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.text(`Print Type: ${backPrintType}`, 109, t4Y + 18.5);
  }

  // ── Render Real Photos & Clickable Badges (Front up to 10, Back up to 10) ──
  let rawFront = items.flatMap((it) => it.frontImages || []).filter((img) => Boolean(img?.url || img?.thumbnail));
  let rawBack = items.flatMap((it) => it.backImages || []).filter((img) => Boolean(img?.url || img?.thumbnail));

  // Legacy fallback: if front/back not explicitly set, distribute general images
  if (rawFront.length === 0 && rawBack.length === 0) {
    const legacyImages = items.flatMap((it) => it.images || []).filter((img) => Boolean(img?.url || img?.thumbnail));
    legacyImages.forEach((img, idx) => {
      if (idx % 2 === 0) rawFront.push(img);
      else rawBack.push(img);
    });
  }

  // Pre-resolve base64 data URLs in parallel so real photos render inside the PDF
  const [resolvedFront, resolvedBack] = await Promise.all([
    Promise.all(rawFront.map(async (img) => ({ url: img.url, dataUrl: await resolveImageDataUrl(img) }))),
    Promise.all(rawBack.map(async (img) => ({ url: img.url, dataUrl: await resolveImageDataUrl(img) }))),
  ]);

  const renderImageColumn = (
    imageList: Array<{ url: string; dataUrl: string | null }>,
    originX: number,
    sideName: "Front" | "Back"
  ) => {
    if (imageList.length === 0) return;
    const isMultiCol = imageList.length > 4;
    const badgeW = isMultiCol ? 39.5 : 82;
    const badgeH = isMultiCol ? 13.5 : 17;
    const photoSize = isMultiCol ? 10.5 : 14;
    const rowGap = isMultiCol ? 14.5 : 19;
    const baseStartY = isMultiCol ? t4Y + 26 : t4Y + 31;

    imageList.forEach((item, idx) => {
      const subCol = isMultiCol ? idx % 2 : 0;
      const subRow = isMultiCol ? Math.floor(idx / 2) : idx;
      const boxX = originX + subCol * 41.5;
      const startY = baseStartY + subRow * rowGap;

      // Ensure we don't overflow the print box
      if (startY + badgeH <= t4Y + printBoxH + 4) {
        // Draw blue container badge
        doc.setFillColor(243, 248, 255); // light-blue-50 fill
        doc.setDrawColor(147, 197, 253); // blue-300 border
        doc.setLineWidth(0.3);
        doc.roundedRect(boxX, startY, badgeW, badgeH, 1.5, 1.5, "FD");

        // Clickable link annotation over the full badge box
        if (item.url) {
          doc.link(boxX, startY, badgeW, badgeH, { url: item.url });
        }

        // Draw Actual Photo Thumbnail if dataUrl is available
        const photoX = boxX + 1.2;
        const photoY = startY + (badgeH - photoSize) / 2;

        if (item.dataUrl) {
          try {
            const format = (item.dataUrl.includes("image/png") ? "PNG" : "JPEG") as "PNG" | "JPEG";
            doc.addImage(item.dataUrl, format, photoX, photoY, photoSize, photoSize);

            // Draw a clean border around the embedded photo
            doc.setDrawColor(191, 219, 254);
            doc.setLineWidth(0.2);
            doc.rect(photoX, photoY, photoSize, photoSize);
          } catch (e) {
            console.warn(`Could not add ${sideName} photo to PDF:`, e);
          }
        } else {
          // Placeholder box
          doc.setFillColor(224, 231, 255);
          doc.rect(photoX, photoY, photoSize, photoSize, "F");
          doc.setFont("helvetica", "bold");
          doc.setFontSize(6);
          doc.setTextColor(59, 130, 246);
          doc.text(`[IMG]`, photoX + 1, photoY + photoSize / 2 + 1);
        }

        // Text beside the photo
        const textX = photoX + photoSize + 2;

        // Title line
        doc.setFont("helvetica", "bold");
        doc.setFontSize(isMultiCol ? 7 : 8.5);
        doc.setTextColor(29, 78, 216); // blue-700
        doc.text(`${sideName} #${idx + 1} ↗`, textX, startY + (isMultiCol ? 4.5 : 6));

        // Subtitle / Click hint
        doc.setFont("helvetica", "normal");
        doc.setFontSize(isMultiCol ? 5.5 : 6.5);
        doc.setTextColor(37, 99, 235); // blue-600
        doc.text(isMultiCol ? `[View full]` : `[Click to open full photo]`, textX, startY + (isMultiCol ? 9 : 11.5));

        // Reset draw & text colors for subsequent elements
        doc.setTextColor(0, 0, 0);
        doc.setDrawColor(0, 0, 0);
        doc.setLineWidth(0.5);
      }
    });
  };

  // Render Front images on the Left Column (originX = 18)
  renderImageColumn(resolvedFront, 18, "Front");

  // Render Back images on the Right Column (originX = 109)
  renderImageColumn(resolvedBack, 109, "Back");

  // 7. Footer: Delivery Date & Name/Sign
  const footerY = 278;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9.5);
  doc.text("Delivery Date", 14, footerY);
  doc.setFont("helvetica", "normal");
  doc.text(customer.dispatchDate || "—", 40, footerY);
  doc.line(38, footerY + 1, 95, footerY + 1);

  doc.setFont("helvetica", "bold");
  doc.text("NAME/SIGN", 115, footerY);
  doc.setFont("helvetica", "normal");
  doc.text(customer.customerName || "—", 140, footerY);
  doc.line(138, footerY + 1, 196, footerY + 1);

  return doc;
}
