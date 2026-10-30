import { PlayerDetail } from "@/types";
import { SIZE_OPTIONS, NUMERIC_SIZE_OPTIONS } from "@/config/product-schemas";

/**
 * Reads a customer's name list (CSV or Excel) into Number · Name · Size rows.
 * Columns are found by their header (Size / Number / Name, in any order);
 * without a header each cell is guessed: a known size, a number, or a name.
 */

export function isImportableList(fileName: string): boolean {
  return /\.(csv|xlsx)$/i.test(fileName);
}

// Common ways people write sizes → the app's size values
const SIZE_ALIASES: Record<string, string> = {
  XXS: "XS",
  SMALL: "S",
  MEDIUM: "M",
  LARGE: "L",
  "2XL": "XXL",
  XXXL: "3XL",
  "3 XL": "3XL",
  XXXXL: "4XL",
  "4 XL": "4XL",
  FREE: "Free Size",
  FREESIZE: "Free Size",
  "FREE SIZE": "Free Size",
};

export function normalizeSize(raw: string): string {
  const v = raw.trim();
  if (!v) return "";
  const upper = v.toUpperCase().replace(/\s+/g, " ");
  const known = SIZE_OPTIONS.find((s) => s.toUpperCase() === upper);
  if (known) return known;
  if (SIZE_ALIASES[upper]) return SIZE_ALIASES[upper];
  const numeric = upper.replace(/^SIZE\s*/, "");
  if (NUMERIC_SIZE_OPTIONS.includes(numeric)) return numeric;
  return v; // keep what they wrote; the Size dropdown shows it as-is
}

function looksLikeSize(cell: string): boolean {
  const upper = cell.trim().toUpperCase();
  return (
    SIZE_OPTIONS.some((s) => s.toUpperCase() === upper) ||
    Boolean(SIZE_ALIASES[upper]) ||
    /^SIZE\s*\d+$/.test(upper)
  );
}

/** Splits CSV text into rows, handling quoted cells, commas inside quotes and ; or tab separators */
export function parseCsv(text: string): string[][] {
  const firstLine = text.split(/\r?\n/, 1)[0] ?? "";
  const sep = [",", ";", "\t"].sort((a, b) => firstLine.split(b).length - firstLine.split(a).length)[0];
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"' && text[i + 1] === '"') {
        cell += '"';
        i++;
      } else if (ch === '"') {
        inQuotes = false;
      } else {
        cell += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === sep) {
      row.push(cell);
      cell = "";
    } else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && text[i + 1] === "\n") i++;
      row.push(cell);
      rows.push(row);
      row = [];
      cell = "";
    } else {
      cell += ch;
    }
  }
  if (cell !== "" || row.length) {
    row.push(cell);
    rows.push(row);
  }
  return rows.map((r) => r.map((c) => c.trim())).filter((r) => r.some((c) => c !== ""));
}

export function rowsToPlayers(rows: string[][]): PlayerDetail[] {
  if (rows.length === 0) return [];

  // Header row: any cell naming a size / number / name column
  const headerIdx = rows.findIndex((r) =>
    r.some((c) => /^(size|sizes)$/i.test(c) || /^(name|player|player name|names)$/i.test(c))
  );
  let col: { size: number; number: number; name: number } | null = null;
  if (headerIdx !== -1) {
    const h = rows[headerIdx].map((c) => c.toLowerCase().trim());
    col = {
      size: h.findIndex((c) => /size/.test(c)),
      number: h.findIndex((c) => /^(no\.?|number|num|jersey( no\.?| number)?|#)$/.test(c) || /number/.test(c)),
      name: h.findIndex((c) => /name|player/.test(c)),
    };
  }

  const body = headerIdx === -1 ? rows : rows.slice(headerIdx + 1);
  return body
    .map((r) => {
      if (col) {
        return {
          number: col.number >= 0 ? r[col.number] ?? "" : "",
          name: (col.name >= 0 ? r[col.name] ?? "" : "").toUpperCase(),
          size: col.size >= 0 ? normalizeSize(r[col.size] ?? "") : "",
        };
      }
      // No header: guess each cell
      const p: PlayerDetail = { number: "", name: "", size: "" };
      for (const c of r) {
        if (!c) continue;
        if (!p.size && looksLikeSize(c)) p.size = normalizeSize(c);
        else if (!p.number && /^\d{1,3}$/.test(c)) p.number = c;
        else if (!p.name) p.name = c.toUpperCase();
      }
      return p;
    })
    .filter((p) => (p.number || "").trim() || (p.name || "").trim());
}

/** Reads a CSV / .xlsx file (first sheet) into a grid of text cells; null for types we can't read */
export async function readTable(file: Blob, fileName: string): Promise<string[][] | null> {
  if (/\.csv$/i.test(fileName) || file.type === "text/csv") {
    return parseCsv(await file.text());
  }
  if (/\.xlsx$/i.test(fileName)) {
    const { readSheet } = await import("read-excel-file/browser");
    const data = await readSheet(file);
    return data
      .map((r) => r.map((c) => (c === null || c === undefined ? "" : String(c).trim())))
      .filter((r) => r.some((c) => c !== ""));
  }
  return null;
}
