"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useCmsAuth } from "@/lib/cms-auth";
import { uploadMediaAsset } from "@/lib/media-upload";

interface MediaItem {
  alt: string;
  filename: string;
  id: string;
  url: string;
}

interface MediaPickerProps {
  onClose: () => void;
  onSelect: (asset: { id: string; url: string; alt: string }) => void;
}

export function MediaPicker({ onSelect, onClose }: MediaPickerProps) {
  const { role } = useCmsAuth();
  const [assets, setAssets] = useState<MediaItem[]>([]);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    const res = await fetch("/api/cms/media");
    if (res.ok) {
      setAssets(await res.json());
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const upload = useCallback(
    async (file: File) => {
      setUploading(true);
      try {
        await uploadMediaAsset(file, role);
        await load();
      } finally {
        setUploading(false);
      }
    },
    [role, load]
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/60">
      <div className="flex max-h-[80vh] w-full max-w-[640px] flex-col border border-line bg-paper">
        <div className="flex items-center justify-between border-line border-b px-5 py-3">
          <span className="font-mono text-[11px] uppercase tracking-[0.16em]">
            Media Library
          </span>
          <div className="flex gap-2">
            <input
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) {
                  upload(f);
                }
              }}
              ref={fileRef}
              type="file"
            />
            <button
              className="bg-vermilion px-3 py-1 font-mono text-[10px] text-cream uppercase tracking-[0.12em] disabled:opacity-50"
              disabled={uploading}
              onClick={() => fileRef.current?.click()}
              type="button"
            >
              {uploading ? "…" : "+ Upload"}
            </button>
            <button
              className="px-2 py-1 font-mono text-[10px] text-muted uppercase"
              onClick={onClose}
              type="button"
            >
              ✕
            </button>
          </div>
        </div>
        <div className="grid flex-1 grid-cols-[repeat(auto-fill,minmax(120px,1fr))] gap-3 overflow-y-auto p-4">
          {assets.map((a) => (
            <button
              className="border border-line bg-cream text-left hover:border-vermilion"
              key={a.id}
              onClick={() => onSelect({ id: a.id, url: a.url, alt: a.alt })}
              type="button"
            >
              <div className="aspect-square overflow-hidden">
                {/* biome-ignore lint/performance/noImgElement: blob URLs incompatible with next/image */}
                {/* biome-ignore lint/correctness/useImageSize: dynamic blob thumbnails */}
                <img
                  alt={a.alt}
                  className="size-full object-cover"
                  src={a.url}
                />
              </div>
              <div className="truncate px-2 py-1 font-mono text-[9px] text-muted">
                {a.filename}
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
