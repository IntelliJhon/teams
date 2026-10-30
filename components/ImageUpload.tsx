"use client";

import { useState, useRef, useEffect } from "react";
import { ProductImage } from "@/types";
import { uploadImage, ApiError } from "@/lib/api";
import { compressImage, createThumbnail } from "@/lib/imageCompress";

const DEFAULT_MAX_FILES = 10;
const MAX_SIZE_BYTES = 15 * 1024 * 1024; // 15 MB

interface ImageUploadProps {
  label?: string;
  sublabel?: string;
  maxFiles?: number;
  value: ProductImage[];
  onChange: (images: ProductImage[]) => void;
  error?: string;
  /** Also accept documents (PDF, Word, Excel, Illustrator, Corel, ZIP) besides images */
  allowDocuments?: boolean;
  /** Ask where each image goes (e.g. "Left Chest Logo"); the last option is free text */
  positionOptions?: string[];
  /** Overrides the accepted document types and the hint line (used with allowDocuments) */
  documentAccept?: string;
  hint?: string;
  buttonLabel?: string;
  /** Sees each picked file before upload (e.g. to read a CSV name list) */
  onFilesPicked?: (files: File[]) => void;
}

const DOCUMENT_ACCEPT =
  ".pdf,.doc,.docx,.xls,.xlsx,.ai,.cdr,.psd,.eps,.svg,.zip,.rar";

interface UploadSlot {
  localUrl: string;   // object URL for local thumbnail preview
  remoteUrl?: string; // short URL from server
  thumbnail?: string; // compact base64 dataUrl
  uploading: boolean;
  uploadError?: string;
  file: File;
  name?: string;     // original file name (documents only)
  isDocument?: boolean;
  position?: string;
  customPosition?: boolean; // "Others" picked: position holds the typed text
}

function toProductImages(slots: UploadSlot[]): ProductImage[] {
  return slots
    .filter((s) => s.remoteUrl)
    .map((s) => ({
      url: s.remoteUrl!,
      thumbnail: s.thumbnail,
      ...(s.name ? { name: s.name } : {}),
      ...(s.position ? { position: s.position } : {}),
    }));
}

function slotFromImage(img: ProductImage): UploadSlot {
  return {
    localUrl: img.thumbnail || img.url,
    remoteUrl: img.url,
    thumbnail: img.thumbnail,
    uploading: false,
    file: new File([], "existing"),
    name: img.name,
    isDocument: !img.thumbnail && Boolean(img.name),
    position: img.position,
  };
}

export function ImageUpload({
  label = "Upload (Optional)",
  sublabel = "Upload Image",
  maxFiles = DEFAULT_MAX_FILES,
  value,
  onChange,
  error,
  allowDocuments = false,
  positionOptions,
  documentAccept = DOCUMENT_ACCEPT,
  hint,
  buttonLabel,
  onFilesPicked,
}: ImageUploadProps) {
  const otherOption = positionOptions?.[positionOptions.length - 1];
  const [slots, setSlots] = useState<UploadSlot[]>(value.map(slotFromImage));
  const inputRef = useRef<HTMLInputElement>(null);

  // Sync internal slots if external value changes (e.g. edit mode hydration)
  useEffect(() => {
    // Only resync if the count or urls differ to avoid tearing
    const currentUrls = slots.map((s) => s.remoteUrl).filter(Boolean);
    const incomingUrls = value.map((v) => v.url).filter(Boolean);
    if (JSON.stringify(currentUrls) !== JSON.stringify(incomingUrls)) {
      setSlots(value.map(slotFromImage));
    }
  }, [value]);

  const commitSlots = (next: UploadSlot[]) => {
    setSlots(next);
    onChange(toProductImages(next));
  };

  const handleFiles = async (files: FileList | null) => {
    if (!files) return;
    const incoming = Array.from(files).slice(0, maxFiles - slots.length);
    onFilesPicked?.(incoming);

    for (const file of incoming) {
      if (file.size > MAX_SIZE_BYTES) {
        alert(`"${file.name}" exceeds the 15 MB limit.`);
        continue;
      }
      if (!file.type.startsWith("image/")) {
        if (!allowDocuments) {
          alert(`"${file.name}" is not an image file.`);
          continue;
        }
        await uploadDocument(file);
        continue;
      }

      // Generate local preview URL & instant base64 thumbnail
      const localUrl = URL.createObjectURL(file);
      const thumb = await createThumbnail(file, 140, 0.72);

      // Add slot in uploading state
      const newSlot: UploadSlot = {
        localUrl,
        thumbnail: thumb,
        uploading: true,
        file,
      };

      setSlots((prev) => [...prev, newSlot]);

      try {
        // Compress image before upload to downscale 5MB-10MB mobile photos to ~150KB
        const compressedFile = await compressImage(file, 1600, 0.82);
        const shortUrl = await uploadImage(compressedFile);

        setSlots((prev) => {
          const next = prev.map((s) =>
            s.file === file
              ? { ...s, uploading: false, remoteUrl: shortUrl, thumbnail: thumb }
              : s
          );
          Promise.resolve().then(() => onChange(toProductImages(next)));
          return next;
        });
      } catch (err: any) {
        console.error("Image upload failed:", err);
        const msg = err instanceof ApiError ? err.message : "Upload failed.";
        setSlots((prev) =>
          prev.map((s) =>
            s.file === file
              ? { ...s, uploading: false, uploadError: msg }
              : s
          )
        );
      }
    }
  };

  // Documents are uploaded as-is (no compression or thumbnail)
  const uploadDocument = async (file: File) => {
    const newSlot: UploadSlot = {
      localUrl: "",
      uploading: true,
      file,
      name: file.name,
      isDocument: true,
    };
    setSlots((prev) => [...prev, newSlot]);

    try {
      const shortUrl = await uploadImage(file);
      setSlots((prev) => {
        const next = prev.map((s) =>
          s.file === file ? { ...s, uploading: false, remoteUrl: shortUrl } : s
        );
        Promise.resolve().then(() => onChange(toProductImages(next)));
        return next;
      });
    } catch (err) {
      console.error("File upload failed:", err);
      const msg = err instanceof ApiError ? err.message : "Upload failed.";
      setSlots((prev) =>
        prev.map((s) =>
          s.file === file ? { ...s, uploading: false, uploadError: msg } : s
        )
      );
    }
  };

  const removeSlot = (idx: number) => {
    const next = slots.filter((_, i) => i !== idx);
    commitSlots(next);
  };

  const canAddMore = slots.length < maxFiles;

  const updateSlot = (idx: number, patch: Partial<UploadSlot>) => {
    commitSlots(slots.map((s, i) => (i === idx ? { ...s, ...patch } : s)));
  };

  // Value shown in the position dropdown: a custom (typed) position shows as the "Others" option
  const positionSelectValue = (slot: UploadSlot) => {
    if (slot.customPosition) return otherOption ?? "";
    if (!slot.position) return "";
    return positionOptions?.includes(slot.position) ? slot.position : otherOption ?? "";
  };

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-0.5">
        <h3 className="text-base font-semibold text-gray-900">
          {label}
        </h3>
        <span className="text-xs font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
          {slots.length} / {maxFiles}
        </span>
      </div>
      <p className="text-sm font-medium text-gray-600 mb-0.5">
        {sublabel}
      </p>
      <p className="text-xs text-gray-400 mb-3">
        {hint ??
          (allowDocuments
            ? `Add up to ${maxFiles} photos or files (PDF, Word, Excel, AI, CDR, ZIP).`
            : `Add up to ${maxFiles} photos.`)}
      </p>

      {/* Take photo / Select Image button (position mode shows it below the list instead) */}
      {canAddMore && !positionOptions && (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="w-full py-2.5 px-4 rounded-full border border-emerald-600 bg-white text-emerald-700 text-sm font-medium flex items-center justify-center gap-2 active:bg-emerald-50 transition-colors mb-3 cursor-pointer"
        >
          <svg
            className="w-5 h-5 text-emerald-700"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
            />
          </svg>
          <span>{buttonLabel ?? (allowDocuments ? "Upload photo / file" : "Take photo / Upload")}</span>
        </button>
      )}

      {/* Hidden file input */}
      <input
        ref={inputRef}
        type="file"
        accept={allowDocuments ? `image/*,${documentAccept}` : "image/*"}
        multiple
        className="hidden"
        onChange={(e) => {
          handleFiles(e.target.files);
          e.target.value = "";
        }}
      />

      {/* Position mode: one row per image with a "where does it go" dropdown */}
      {positionOptions && (
        <div className="space-y-3">
          {slots.map((slot, idx) => {
            const selectValue = positionSelectValue(slot);
            const isOther = Boolean(otherOption) && selectValue === otherOption;
            return (
              <div
                key={idx}
                className="flex gap-3 items-start p-2.5 rounded-2xl border border-gray-200 bg-gray-50/60"
              >
                <div className="relative w-16 h-16 rounded-xl overflow-hidden border border-gray-200 bg-white flex-shrink-0">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={slot.localUrl} alt={`upload-${idx}`} className="w-full h-full object-cover" />
                  {slot.uploading && (
                    <div className="absolute inset-0 bg-white/70 flex items-center justify-center">
                      <svg className="animate-spin w-5 h-5 text-emerald-600" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth={4} />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                      </svg>
                    </div>
                  )}
                  {slot.uploadError && (
                    <div className="absolute inset-0 bg-red-500/80 flex items-center justify-center p-1">
                      <span className="text-white text-[9px] text-center leading-tight">{slot.uploadError}</span>
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0 space-y-2">
                  <select
                    value={selectValue}
                    onChange={(e) => {
                      const v = e.target.value;
                      if (v === otherOption) {
                        updateSlot(idx, { customPosition: true, position: "" });
                      } else {
                        updateSlot(idx, { customPosition: false, position: v || undefined });
                      }
                    }}
                    className={`w-full bg-white border rounded-xl px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:border-emerald-600 cursor-pointer ${
                      error && !slot.position ? "border-red-400" : "border-gray-300"
                    }`}
                  >
                    <option value="">Where does this go?</option>
                    {positionOptions.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                  {isOther && (
                    <input
                      type="text"
                      value={slot.position ?? ""}
                      onChange={(e) => updateSlot(idx, { customPosition: true, position: e.target.value })}
                      placeholder="Type the position (e.g. Back of collar)"
                      className="w-full bg-white border border-gray-300 rounded-xl px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-emerald-600"
                    />
                  )}
                </div>

                {!slot.uploading && (
                  <button
                    type="button"
                    onClick={() => removeSlot(idx)}
                    className="w-7 h-7 rounded-full bg-white border border-gray-200 flex items-center justify-center text-gray-500 hover:text-red-600 hover:border-red-300 flex-shrink-0 cursor-pointer"
                    aria-label="Remove image"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
            );
          })}

          {canAddMore && (
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className={`w-full py-2.5 px-4 rounded-full text-sm font-medium flex items-center justify-center gap-2 transition-colors cursor-pointer ${
                slots.length === 0
                  ? "border border-emerald-600 bg-white text-emerald-700 active:bg-emerald-50"
                  : "border border-dashed border-emerald-500 bg-emerald-50/40 text-emerald-700 hover:bg-emerald-50"
              }`}
            >
              <span className="text-lg leading-none">+</span>
              <span>{slots.length === 0 ? "Upload image" : "Add more images"}</span>
            </button>
          )}
        </div>
      )}

      {/* Thumbnails of uploaded images */}
      {slots.length > 0 && !positionOptions && (
        <div className="flex flex-wrap gap-3 mt-2">
          {slots.map((slot, idx) => (
            <div
              key={idx}
              className="relative w-20 h-20 rounded-xl overflow-hidden border border-gray-200 bg-gray-50 flex-shrink-0"
            >
              {slot.isDocument ? (
                <div
                  className="w-full h-full flex flex-col items-center justify-center gap-1 px-1"
                  title={slot.name}
                >
                  <svg
                    className="w-7 h-7 text-emerald-700"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={1.8}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                  <span className="text-[9px] leading-tight text-gray-600 font-medium w-full text-center truncate">
                    {slot.name}
                  </span>
                </div>
              ) : (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={slot.localUrl}
                  alt={`upload-${idx}`}
                  className="w-full h-full object-cover"
                />
              )}

              {/* Uploading spinner */}
              {slot.uploading && (
                <div className="absolute inset-0 bg-white/70 flex items-center justify-center">
                  <svg
                    className="animate-spin w-5 h-5 text-emerald-600"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth={4}
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8v8H4z"
                    />
                  </svg>
                </div>
              )}

              {/* Upload error */}
              {slot.uploadError && (
                <div className="absolute inset-0 bg-red-500/80 flex flex-col items-center justify-center gap-1 p-1">
                  <span className="text-white text-[9px] text-center leading-tight">
                    {slot.uploadError}
                  </span>
                </div>
              )}

              {/* Remove button */}
              {!slot.uploading && (
                <button
                  type="button"
                  onClick={() => removeSlot(idx)}
                  className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/60 flex items-center justify-center hover:bg-black/80 cursor-pointer"
                  aria-label="Remove image"
                >
                  <svg
                    className="w-3 h-3 text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={3}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              )}

              {/* Uploaded badge */}
              {slot.remoteUrl && !slot.uploading && (
                <div className="absolute bottom-1 right-1 w-4 h-4 rounded-full bg-emerald-500 flex items-center justify-center">
                  <svg
                    className="w-2.5 h-2.5 text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={3}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* General validation error */}
      {error && <p className="mt-1 text-xs text-red-500 font-medium">{error}</p>}
    </div>
  );
}
