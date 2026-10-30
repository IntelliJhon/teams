"use client";

import { useEffect, useRef, useState } from "react";
import { ProductImage } from "@/types";
import { uploadImage, ApiError } from "@/lib/api";
import { compressImage, createThumbnail } from "@/lib/imageCompress";
import { PlayerDetail } from "@/types";
import { readTable, rowsToPlayers } from "@/lib/nameListImport";

interface ReferenceFilePanelProps {
  files: ProductImage[];
  onChange: (files: ProductImage[]) => void;
  maxFiles?: number;
  /** Called with the players found in an uploaded CSV / Excel list */
  onImport?: (players: PlayerDetail[], fileName: string) => void;
}

const ACCEPT = "image/*,.pdf,.csv,.xlsx,.xls,.doc,.docx";
const MAX_SIZE_BYTES = 15 * 1024 * 1024; // 15 MB

type Kind = "image" | "pdf" | "table" | "other";

function kindOf(name: string, url: string, type?: string): Kind {
  const s = `${type ?? ""} ${name} ${url}`.toLowerCase();
  if (/image\/|\.(png|jpe?g|webp|gif|heic|bmp)(\?|$|\s)/.test(s) || url.startsWith("data:image")) return "image";
  if (/application\/pdf|\.pdf(\?|$|\s)/.test(s)) return "pdf";
  if (/text\/csv|\.(csv|xlsx)(\?|$|\s)/.test(s)) return "table";
  return "other";
}

interface PreviewItem {
  file: ProductImage;
  previewUrl: string; // local object URL while the session lasts, else the uploaded URL
  kind: Kind;
  table?: string[][] | null; // CSV / Excel cells; undefined = not read yet, null = couldn't read
  uploading?: boolean;
  error?: string;
}

/**
 * Right-hand panel for the name-list modal: upload the customer's list
 * (photo / PDF / CSV / Excel) and keep it open in a large preview while typing.
 */
export function ReferenceFilePanel({ files, onChange, maxFiles = 3, onImport }: ReferenceFilePanelProps) {
  const [items, setItems] = useState<PreviewItem[]>(() =>
    // The same file uploaded twice gets the same URL from the host, so keep one of each
    files
      .filter((f, i) => files.findIndex((g) => g.url === f.url) === i)
      .map((f) => ({ file: f, previewUrl: f.url, kind: kindOf(f.name ?? "", f.url) }))
  );
  const [active, setActive] = useState(0);
  const [zoomed, setZoomed] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Already-uploaded CSV / Excel lists: download once to show the table (and allow filling rows)
  useEffect(() => {
    items.forEach((it) => {
      if (it.kind !== "table" || it.table !== undefined || it.uploading || it.previewUrl.startsWith("blob:")) return;
      const key = it.previewUrl;
      fetch(key)
        .then((r) => (r.ok ? r.blob() : Promise.reject()))
        .then((blob) => readTable(blob, it.file.name || key))
        .catch(() => null)
        .then((table) => setItems((prev) => prev.map((p) => (p.previewUrl === key ? { ...p, table } : p))));
    });
  }, [items]);

  const commit = (next: PreviewItem[]) => {
    setItems(next);
    onChange(next.filter((i) => !i.uploading && !i.error && i.file.url).map((i) => i.file));
  };

  const handleFiles = async (list: FileList | null) => {
    if (!list) return;
    const incoming = Array.from(list).slice(0, maxFiles - items.length);

    for (const file of incoming) {
      if (file.size > MAX_SIZE_BYTES) {
        alert(`"${file.name}" exceeds the 15 MB limit.`);
        continue;
      }
      const kind = kindOf(file.name, "", file.type);
      const previewUrl = URL.createObjectURL(file);
      const table = kind === "table" ? await readTable(file, file.name).catch(() => null) : undefined;
      const placeholder: PreviewItem = {
        file: { url: "", name: file.name },
        previewUrl,
        kind,
        table,
        uploading: true,
      };

      // A CSV / Excel list fills the Number · Name · Size rows straight away
      if (table && onImport) {
        const players = rowsToPlayers(table);
        if (players.length > 0) onImport(players, file.name);
      }

      setItems((prev) => [...prev, placeholder]);
      setActive(Number.MAX_SAFE_INTEGER); // newest file (clamped below)
      setZoomed(false);

      try {
        // Lists must stay readable, so images are only lightly compressed
        const toUpload = kind === "image" ? await compressImage(file, 2400, 0.88) : file;
        const thumb = kind === "image" ? await createThumbnail(file, 140, 0.72) : undefined;
        const url = await uploadImage(toUpload);
        setItems((prev) => {
          const duplicate = prev.some((p) => p.previewUrl !== previewUrl && p.file.url === url);
          const next = duplicate
            ? prev.filter((p) => p.previewUrl !== previewUrl) // already in the list
            : prev.map((p) =>
                p.previewUrl === previewUrl
                  ? {
                      ...p,
                      uploading: false,
                      file: { url, name: file.name, ...(thumb ? { thumbnail: thumb } : {}) },
                    }
                  : p
              );
          Promise.resolve().then(() =>
            onChange(next.filter((i) => !i.uploading && !i.error && i.file.url).map((i) => i.file))
          );
          return next;
        });
      } catch (err) {
        const msg = err instanceof ApiError ? err.message : "Upload failed.";
        setItems((prev) => prev.map((p) => (p.previewUrl === previewUrl ? { ...p, uploading: false, error: msg } : p)));
      }
    }
  };

  const activeIdx = Math.max(0, Math.min(active, items.length - 1));

  const remove = (idx: number) => {
    commit(items.filter((_, i) => i !== idx));
    setActive(Math.max(0, activeIdx >= idx ? activeIdx - 1 : activeIdx));
    setZoomed(false);
  };

  const current = items[activeIdx];
  const tableRows = current?.kind === "table" && current.table ? current.table.slice(0, 500) : null;
  const importable = tableRows && onImport ? rowsToPlayers(tableRows) : [];

  return (
    <div className="flex flex-col h-full min-h-0">
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Your list (reference)</p>
        <div className="flex items-center gap-3">
        {importable.length > 0 && current && (
          <button
            type="button"
            onClick={() => onImport?.(importable, current.file.name || "file")}
            className="text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-full px-3 py-1 cursor-pointer"
          >
            ⤵ Fill rows ({importable.length})
          </button>
        )}
        {items.length > 0 && items.length < maxFiles && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 cursor-pointer"
          >
            + Add file
          </button>
        )}
        </div>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT}
        multiple
        className="hidden"
        onChange={(e) => {
          handleFiles(e.target.files);
          e.target.value = "";
        }}
      />

      {!current ? (
        /* Empty state: big drop / pick area */
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            handleFiles(e.dataTransfer.files);
          }}
          className="flex-1 min-h-[180px] w-full rounded-2xl border-2 border-dashed border-emerald-300 bg-emerald-50/50 flex flex-col items-center justify-center gap-2 text-center px-4 cursor-pointer hover:bg-emerald-50"
        >
          <span className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-2xl">
            ⬆
          </span>
          <span className="text-sm font-bold text-emerald-800">Upload your name list</span>
          <span className="text-xs text-gray-500">
            Photo, PDF, Excel or CSV — it stays open here
            <br />
            so you can copy names and numbers easily.
          </span>
        </button>
      ) : (
        <>
          {/* Large preview */}
          <div className="relative flex-1 min-h-[200px] rounded-2xl border border-gray-200 bg-white overflow-auto">
            {current.kind === "image" && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={current.previewUrl}
                alt={current.file.name || "Name list"}
                onClick={() => setZoomed((z) => !z)}
                className={
                  zoomed
                    ? "max-w-none w-[200%] cursor-zoom-out"
                    : "w-full h-full object-contain cursor-zoom-in"
                }
              />
            )}
            {current.kind === "pdf" && (
              <iframe src={current.previewUrl} title={current.file.name || "PDF"} className="w-full h-full min-h-[360px]" />
            )}
            {current.kind === "table" &&
              (tableRows && tableRows.length > 0 ? (
                <table className="w-full text-xs">
                  <tbody>
                    {tableRows.map((row, r) => (
                      <tr key={r} className={r === 0 ? "bg-gray-100 font-bold" : r % 2 ? "bg-white" : "bg-gray-50"}>
                        <td className="px-2 py-1 text-gray-400 w-8">{r + 1}</td>
                        {row.map((cell, c) => (
                          <td key={c} className="px-2 py-1 text-gray-900 whitespace-nowrap">
                            {cell}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <FileCard item={current} />
              ))}
            {current.kind === "other" && <FileCard item={current} />}

            {current.uploading && (
              <span className="absolute top-2 left-2 text-[11px] font-semibold bg-white/90 border border-gray-200 rounded-full px-2 py-0.5 text-emerald-700">
                Uploading…
              </span>
            )}
            {current.error && (
              <span className="absolute top-2 left-2 text-[11px] font-semibold bg-red-600 text-white rounded-full px-2 py-0.5">
                {current.error}
              </span>
            )}
            {current.kind === "image" && (
              <span className="absolute bottom-2 right-2 text-[10px] font-semibold bg-black/60 text-white rounded-full px-2 py-0.5 pointer-events-none">
                {zoomed ? "Tap to fit" : "Tap to zoom"}
              </span>
            )}
          </div>

          {/* File switcher */}
          <div className="flex gap-2 mt-2 overflow-x-auto">
            {items.map((it, i) => (
              <div
                key={`${i}:${it.previewUrl}`}
                className={`flex items-center gap-1.5 pl-2 pr-1 py-1 rounded-lg border text-[11px] font-medium max-w-[180px] ${
                  i === activeIdx ? "border-emerald-500 bg-emerald-50 text-emerald-800" : "border-gray-200 bg-white text-gray-600"
                }`}
              >
                <button
                  type="button"
                  onClick={() => {
                    setActive(i);
                    setZoomed(false);
                  }}
                  className="truncate cursor-pointer"
                  title={it.file.name}
                >
                  {it.kind === "image" ? "🖼️" : "📄"} {it.file.name || `File ${i + 1}`}
                </button>
                <button
                  type="button"
                  onClick={() => remove(i)}
                  className="w-5 h-5 rounded-full flex items-center justify-center text-gray-400 hover:text-red-600 flex-shrink-0 cursor-pointer"
                  aria-label={`Remove ${it.file.name || "file"}`}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function FileCard({ item }: { item: PreviewItem }) {
  const href = item.file.url || item.previewUrl;
  return (
    <div className="h-full min-h-[200px] flex flex-col items-center justify-center gap-2 p-4 text-center">
      <span className="text-4xl">📄</span>
      <span className="text-sm font-semibold text-gray-800 break-all">{item.file.name}</span>
      <span className="text-xs text-gray-500">This file can&apos;t be previewed here (old .xls files: save as .xlsx or CSV).</span>
      <a
        href={href}
        target="_blank"
        rel="noreferrer"
        className="text-xs font-semibold text-emerald-700 border border-emerald-600 rounded-full px-3 py-1.5 hover:bg-emerald-50"
      >
        Open in new tab
      </a>
    </div>
  );
}
