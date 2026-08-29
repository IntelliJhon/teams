import { jsPDF } from "jspdf";
import { OrderHeader, ProductLineItem } from "@/types";

interface GeneratePdfProps {
  customer: OrderHeader;
  items: ProductLineItem[];
}

export function generateIceFashionsPdf({ customer, items }: GeneratePdfProps): jsPDF {
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

  // ─────────────────────────────────────────────
  // Colors & Styles
  // ─────────────────────────────────────────────
  doc.setDrawColor(0, 0, 0);
  doc.setTextColor(0, 0, 0);
  doc.setLineWidth(0.5);

  // Outer Box (x: 10, y: 10, w: 190, h: 277)
  doc.rect(10, 10, 190, 277);

  // 1. Header Row
  // NO.
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("NO.", 14, 19);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text(orderNumber, 24, 19);
  doc.line(23, 20, 65, 20);

  // ICE FASHIONS Box
  doc.setLineWidth(0.6);
  doc.roundedRect(72, 13, 66, 9, 2, 2);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text("ICE FASHIONS", 105, 19.5, { align: "center" });

  // ORDER FORM Badge
  doc.setFillColor(34, 34, 34);
  doc.rect(148, 13, 48, 9, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(10);
  doc.text("ORDER FORM", 172, 19, { align: "center" });
  doc.setTextColor(0, 0, 0);

  // 2. FROM & DATE Line
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9.5);
  doc.text("FROM", 14, 28);
  doc.setFont("helvetica", "normal");
  const fromStr = `${customer.customerName || "—"} (${customer.customerPhone || ""}) ${
    customer.customerAddress ? "- " + customer.customerAddress : ""
  }`;
  doc.text(doc.splitTextToSize(fromStr, 115)[0] || "", 27, 28);
  doc.line(26, 29, 142, 29);

  doc.setFont("helvetica", "bold");
  doc.text("DATE", 146, 28);
  doc.setFont("helvetica", "normal");
  doc.text(currentDate, 158, 28);
  doc.line(157, 29, 196, 29);

  // 3. Table 1: Specifications (MODEL | CLOTH | COLLAR | H/S | F/S)
  const t1Y = 32;
  const t1H = 14;
  doc.setLineWidth(0.4);
  doc.setFillColor(229, 231, 235);
  doc.rect(14, t1Y, 182, 7, "FD"); // Header bg
  doc.rect(14, t1Y + 7, 182, 7); // Data bg

  // Column vertical lines
  doc.line(54, t1Y, 54, t1Y + t1H);
  doc.line(94, t1Y, 94, t1Y + t1H);
  doc.line(146, t1Y, 146, t1Y + t1H);
  doc.line(172, t1Y, 172, t1Y + t1H);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.text("MODEL", 34, t1Y + 5, { align: "center" });
  doc.text("CLOTH", 74, t1Y + 5, { align: "center" });
  doc.text("COLLAR", 120, t1Y + 5, { align: "center" });
  doc.text("H/S", 159, t1Y + 5, { align: "center" });
  doc.text("F/S", 184, t1Y + 5, { align: "center" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.text(modelName, 34, t1Y + 11.5, { align: "center" });
  doc.text(cloth, 74, t1Y + 11.5, { align: "center" });
  doc.text(collar, 120, t1Y + 11.5, { align: "center" });
  doc.text(isHS ? "✓ (YES)" : "—", 159, t1Y + 11.5, { align: "center" });
  doc.text(isFS ? "✓ (YES)" : "—", 184, t1Y + 11.5, { align: "center" });

  // 4. Table 2: JERSEY DETAILS & SIZE & NUMBER
  const t2Y = 49;
  const t2RowH = 7.5;
  const t2HeaderH = 7;
  doc.setFillColor(229, 231, 235);
  doc.rect(14, t2Y, 182, t2HeaderH, "FD");
  doc.line(78, t2Y, 78, t2Y + t2HeaderH);
  doc.line(90, t2Y, 90, t2Y + t2HeaderH);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.text("JERSEY DETAILS", 46, t2Y + 4.8, { align: "center" });
  doc.text("SIZE & NUMBER", 143, t2Y + 4.8, { align: "center" });

  const jerseySpecs = [
    { label: "Production", val: primaryFields.productionType || "—" },
    { label: "Colour", val: primaryFields.colour || "—" },
    { label: "Collar Padi", val: primaryFields.collarPadi || "—" },
    { label: "Buttons", val: primaryFields.button || "—" },
    { label: "Pocket", val: primaryFields.pocket || "—" },
    { label: "Hand Cuff", val: primaryFields.handCuff || "—" },
  ];

  const totalJerseyQty = jerseySizeRows.reduce((sum, r) => sum + r.quantity, 0);

  // Helper to format a single player entry
  const formatPlayer = (p: { number?: string; name?: string }) => {
    const num = (p.number || "").trim();
    const name = (p.name || "").trim();
    if (num && name) return `#${num} ${name}`;
    if (num) return `#${num}`;
    if (name) return name;
    return "";
  };

  // Build 5 rows of right-hand cell data so that NO player numbers/names are ever truncated
  const rightCellRows: { qty: string; text: string }[] = [
    { qty: "", text: "" },
    { qty: "", text: "" },
    { qty: "", text: "" },
    { qty: "", text: "" },
    { qty: "", text: "" },
  ];

  if (jerseySizeRows.length === 1) {
    const sz = jerseySizeRows[0];
    const playerTags = (sz.players || [])
      .map(formatPlayer)
      .filter((t) => t.length > 0);

    rightCellRows[0].qty = String(sz.quantity);
    if (playerTags.length === 0) {
      rightCellRows[0].text = `Size: ${sz.size}  —  Quantity: ${sz.quantity} pcs`;
    } else {
      const chunkSize = 3;
      rightCellRows[0].text = `Size: ${sz.size} (${sz.quantity} pcs):  ${playerTags.slice(0, chunkSize).join(", ")}`;
      for (let r = 1; r < 5; r++) {
        const slice = playerTags.slice(r * chunkSize, (r + 1) * chunkSize);
        if (slice.length > 0) {
          rightCellRows[r].text = `   ${slice.join(", ")}`;
        }
      }
    }
  } else if (jerseySizeRows.length > 1) {
    jerseySizeRows.slice(0, 5).forEach((sz, idx) => {
      rightCellRows[idx].qty = String(sz.quantity);
      const playerTags = (sz.players || [])
        .map(formatPlayer)
        .filter((t) => t.length > 0);
      let line = `Size: ${sz.size} — Qty: ${sz.quantity} pcs`;
      if (playerTags.length > 0) {
        line += ` (${playerTags.join(", ")})`;
      }
      rightCellRows[idx].text = line;
    });
  }

  for (let i = 0; i < 6; i++) {
    const rowY = t2Y + t2HeaderH + i * t2RowH;
    doc.rect(14, rowY, 182, t2RowH);
    doc.line(78, rowY, 78, rowY + t2RowH);
    doc.line(90, rowY, 90, rowY + t2RowH);

    // Left spec
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.text(`${jerseySpecs[i].label}: `, 16, rowY + 5);
    doc.setFont("helvetica", "bold");
    doc.text(jerseySpecs[i].val, 36, rowY + 5);

    // Mid qty
    if (i === 5) {
      doc.setFillColor(243, 244, 246);
      doc.rect(78, rowY, 12, t2RowH, "FD");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8.5);
      doc.text(`${totalJerseyQty || "—"}`, 84, rowY + 5, { align: "center" });
    } else {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8.5);
      doc.text(rightCellRows[i].qty, 84, rowY + 5, { align: "center" });
    }

    // Right size text
    if (i === 5) {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8.5);
      doc.text(`TOTAL JERSEY QUANTITY: ${totalJerseyQty} PCS`, 93, rowY + 5);
    } else {
      const cellText = rightCellRows[i].text;
      if (cellText) {
        doc.setFont("helvetica", "bold");
        doc.setFontSize(7.5);
        const splitLines = doc.splitTextToSize(cellText, 102);
        if (splitLines.length === 1) {
          doc.text(splitLines[0], 93, rowY + 5);
        } else {
          doc.setFontSize(7);
          doc.text(splitLines[0], 93, rowY + 3.2);
          doc.text(splitLines[1], 93, rowY + 6.0);
        }
      }
    }
  }

  // 5. Table 3: SHORTS / LOWER & GK / LIBRO
  const t3Y = 104;
  doc.setFillColor(229, 231, 235);
  doc.rect(14, t3Y, 120, 7, "FD");
  doc.rect(134, t3Y, 62, 7, "FD");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.text("SHORTS / LOWER", 74, t3Y + 4.8, { align: "center" });
  doc.text("GK / LIBRO", 165, t3Y + 4.8, { align: "center" });

  // Subheaders for shorts
  const t3SubY = t3Y + 7;
  doc.rect(14, t3SubY, 120, 6);
  doc.line(36, t3SubY, 36, t3SubY + 6);
  doc.line(66, t3SubY, 66, t3SubY + 6);
  doc.line(96, t3SubY, 96, t3SubY + 6);

  doc.setFontSize(7.5);
  doc.text("SIZE", 25, t3SubY + 4.2, { align: "center" });
  doc.text("MODEL", 51, t3SubY + 4.2, { align: "center" });
  doc.text("CLOTH", 81, t3SubY + 4.2, { align: "center" });
  doc.text("COLOUR", 110, t3SubY + 4.2, { align: "center" });

  // Right GK / Libro box
  doc.rect(134, t3SubY, 62, 34);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.text("Special Notes:", 137, t3SubY + 5);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  if (primaryFields.collarTipping) {
    doc.text(`Collar Tipping: ${primaryFields.collarTipping}`, 137, t3SubY + 10);
  }
  if (customer.remarks) {
    doc.text(`Remarks: ${customer.remarks}`, 137, t3SubY + 15);
  }

  // 4 rows for Shorts / Lower
  const t3RowH = 7;
  for (let idx = 0; idx < 4; idx++) {
    const rowY = t3SubY + 6 + idx * t3RowH;
    doc.rect(14, rowY, 120, t3RowH);
    doc.line(36, rowY, 36, rowY + t3RowH);
    doc.line(66, rowY, 66, rowY + t3RowH);
    doc.line(96, rowY, 96, rowY + t3RowH);

    const it = shortsOrLowerItems[idx];
    if (it) {
      const itFields = (it.fields || {}) as Record<string, string>;
      const itSizeStr = it.sizeQuantities.map((s) => `${s.size}:${s.quantity}`).join(",");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(7.5);
      doc.text(itSizeStr, 25, rowY + 4.8, { align: "center" });
      doc.setFont("helvetica", "normal");
      doc.text(it.productType, 51, rowY + 4.8, { align: "center" });
      doc.text(itFields.fabric || "—", 81, rowY + 4.8, { align: "center" });
      doc.text(itFields.colour || "—", 110, rowY + 4.8, { align: "center" });
    }
  }

  // 6. Table 4: JERSEY PRINTING DETAILS (FRONT & BACK)
  const t4Y = 154;
  doc.setFillColor(229, 231, 235);
  doc.rect(14, t4Y, 36, 7, "FD");
  doc.rect(50, t4Y, 110, 7, "FD");
  doc.rect(160, t4Y, 36, 7, "FD");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.text("FRONT", 32, t4Y + 4.8, { align: "center" });
  doc.text("JERSEY PRINTING DETAILS", 105, t4Y + 4.8, { align: "center" });
  doc.text("BACK", 178, t4Y + 4.8, { align: "center" });

  const printBoxH = 100;
  doc.rect(14, t4Y + 7, 91, printBoxH);
  doc.rect(105, t4Y + 7, 91, printBoxH);

  // Front Print Box
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.text(`Front Print: ${frontPrintYes ? "YES" : "NO"}`, 18, t4Y + 14);
  if (frontPrintYes) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.text(`Print Type: ${frontPrintType}`, 18, t4Y + 20);
    if (primaryFields.printTypeOtherText) {
      doc.text(`Description: ${primaryFields.printTypeOtherText}`, 18, t4Y + 26);
    }
  }

  // Back Print Box
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.text(`Back Print: ${backPrintYes ? "YES" : "NO"}`, 109, t4Y + 14);
  if (backPrintYes) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.text(`Print Type: ${backPrintType}`, 109, t4Y + 20);
  }

  // ── Render Clickable Image Links in Table 4 ──
  const allImages = items.flatMap((it) => it.images || []);
  if (allImages.length > 0) {
    allImages.forEach((img, idx) => {
      if (!img.url) return;

      const isEven = idx % 2 === 0;
      const boxX = isEven ? 18 : 109;
      const rowOffset = Math.floor(idx / 2) * 22;
      const startY = t4Y + 34 + rowOffset;

      // Ensure we don't overflow the print box
      if (startY + 18 <= t4Y + printBoxH + 5) {
        // Draw blue link container badge
        doc.setFillColor(239, 246, 255); // light-blue fill
        doc.setDrawColor(59, 130, 246); // blue border
        doc.setLineWidth(0.3);
        doc.roundedRect(boxX, startY, 82, 16, 2, 2, "FD");

        // Clickable link annotation over the full badge box
        doc.link(boxX, startY, 82, 16, { url: img.url });

        // Title text
        doc.setFont("helvetica", "bold");
        doc.setFontSize(8);
        doc.setTextColor(29, 78, 216); // blue-700
        doc.text(`[CLICK HERE] View Uploaded Photo ${idx + 1} ->`, boxX + 3, startY + 5.5);

        // URL display line
        doc.setFont("helvetica", "normal");
        doc.setFontSize(6.5);
        doc.setTextColor(37, 99, 235); // blue-600
        const shortDisplayUrl = img.url.length > 45 ? img.url.slice(0, 42) + "..." : img.url;
        doc.text(shortDisplayUrl, boxX + 3, startY + 11);

        // Reset draw & text colors for subsequent elements
        doc.setTextColor(0, 0, 0);
        doc.setDrawColor(0, 0, 0);
        doc.setLineWidth(0.5);
      }
    });
  }

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
