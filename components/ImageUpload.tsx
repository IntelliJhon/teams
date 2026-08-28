"use client";

import { useState, useRef } from "react";
import { ProductImage } from "@/types";
import { uploadImage, ApiError } from "@/lib/api";

const MAX_FILES = 3;
const MAX_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB

interface ImageUploadProps {
  value: ProductImage[];
  onChange: (images: ProductImage[]) => void;
  error?: string;
}

interface UploadSlot {
  localUrl: string;   // object URL for local thumbnail preview
  remoteUrl?: string; // short URL from server
  uploading: boolean;
  uploadError?: string;
  file: File;
}

function toProductImages(slots: UploadSlot[]): ProductImage[] {
  return slots
    .filter((s) => s.remoteUrl)
    .map((s) => ({ url: s.remoteUrl! }));
}

export function ImageUpload({ value, onChange, error }: ImageUploadProps) {
  const [slots, setSlots] = useState<UploadSlot[]>(
    value.map((img) => ({
      localUrl: img.url,
      remoteUrl: img.url,
      uploading: false,
      file: new File([], "existing"),
    }))
  );
  const inputRef = useRef<HTMLInputElement>(null);

  const commitSlots = (next: UploadSlot[]) => {
    setSlots(next);
    onChange(toProductImages(next));
  };

  const handleFiles = async (files: FileList | null) => {
    if (!files) return;
    const incoming = Array.from(files).slice(0, MAX_FILES - slots.length);

    for (const file of incoming) {
      if (file.size > MAX_SIZE_BYTES) {
        alert(`"${file.name}" exceeds the 10 MB limit.`);
        continue;
      }
      if (!file.type.startsWith("image/")) {
        alert(`"${file.name}" is not an image file.`);
        continue;
      }

      const localUrl = URL.createObjectURL(file);

      // Add slot in uploading state
      const newSlot: UploadSlot = {
        localUrl,
        uploading: true,
        file,
      };

      setSlots((prev) => [...prev, newSlot]);

      try {
        const shortUrl = await uploadImage(file);
        setSlots((prev) => {
          const next = prev.map((s) =>
            s.file === file
              ? { ...s, uploading: false, remoteUrl: shortUrl }
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

  const removeSlot = (idx: number) => {
    const next = slots.filter((_, i) => i !== idx);
    commitSlots(next);
  };

  const canAddMore = slots.length < MAX_FILES;

  return (
    <div className="mb-6">
      <h3 className="text-base font-semibold text-gray-900 mb-0.5">
        Upload (Optional)
      </h3>
      <p className="text-sm font-medium text-gray-700 mb-0.5">
        Upload Image
      </p>
      <p className="text-xs text-gray-500 mb-3">
        Add up to 3 photos.
      </p>

      {/* Take photo / Select Image button */}
      {canAddMore && (
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
          <span>Take photo / Upload</span>
        </button>
      )}

      {/* Thumbnails of uploaded images */}
      {slots.length > 0 && (
        <div className="flex flex-wrap gap-3 mt-2">
          {slots.map((slot, idx) => (
            <div
              key={idx}
              className="relative w-20 h-20 rounded-xl overflow-hidden border border-gray-200 bg-gray-50 flex-shrink-0"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={slot.localUrl}
                alt={`upload-${idx}`}
                className="w-full h-full object-cover"
              />

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
            </div>
          ))}
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => {
          handleFiles(e.target.files);
          e.target.value = "";
        }}
      />

      {error && <p className="mt-2 text-xs text-red-500 font-medium">{error}</p>}
    </div>
  );
}
