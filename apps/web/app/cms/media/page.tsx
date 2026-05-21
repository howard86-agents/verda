"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { CmsShell } from "@/_components/cms-shell";
import { can, useCmsAuth } from "@/lib/cms-auth";

interface MediaItem {
  alt: string;
  createdAt: string;
  filename: string;
  id: string;
  mimeType: string;
  url: string;
}

const EXT_RE = /\.[^.]+$/;

function MediaGrid({
  assets,
  canUpload,
  onDelete,
}: {
  assets: MediaItem[];
  canUpload: boolean;
  onDelete: (id: string) => void;
}) {
  if (assets.length === 0) {
    return (
      <p className="mt-8 font-mono text-[12px] text-muted uppercase tracking-[0.14em]">
        No media assets yet. Upload an image to get started.
      </p>
    );
  }
  return (
    <div className="mt-6 grid grid-cols-[repeat(auto-fill,minmax(180px,1fr))] gap-4 pb-10">
      {assets.map((a) => (
        <div className="group relative border border-line bg-paper" key={a.id}>
          <div className="aspect-square overflow-hidden bg-cream">
            {/* biome-ignore lint/performance/noImgElement: blob URLs incompatible with next/image */}
            {/* biome-ignore lint/correctness/useImageSize: dynamic blob thumbnails */}
            <img alt={a.alt} className="size-full object-cover" src={a.url} />
          </div>
          <div className="px-3 py-2">
            <div className="truncate font-mono text-[10.5px] text-ink tracking-[0.06em]">
              {a.filename}
            </div>
            <div className="mt-[2px] font-mono text-[9.5px] text-muted tracking-[0.06em]">
              {a.alt}
            </div>
          </div>
          {canUpload && (
            <button
              className="absolute top-1 right-1 hidden bg-ink px-2 py-[2px] font-mono text-[9px] text-cream uppercase group-hover:block"
              onClick={() => onDelete(a.id)}
              type="button"
            >
              ✕
            </button>
          )}
        </div>
      ))}
    </div>
  );
}

export default function CmsMediaPage() {
  const { role } = useCmsAuth();
  const [assets, setAssets] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/cms/media");
    if (res.ok) {
      setAssets(await res.json());
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const upload = useCallback(
    async (file: File) => {
      setUploading(true);
      const form = new FormData();
      form.append("file", file);
      form.append("alt", file.name.replace(EXT_RE, ""));
      const res = await fetch("/api/cms/media", {
        method: "POST",
        headers: { "x-cms-role": role },
        body: form,
      });
      if (res.ok) {
        await load();
      }
      setUploading(false);
    },
    [role, load]
  );

  const handleDelete = useCallback(
    async (id: string) => {
      await fetch(`/api/cms/media/${id}`, {
        method: "DELETE",
        headers: { "x-cms-role": role },
      });
      await load();
    },
    [role, load]
  );

  const canUpload = can("upload_media", role);

  return (
    <CmsShell
      actions={
        canUpload ? (
          <>
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
              className="bg-vermilion px-[14px] py-2 font-mono text-[11px] text-cream uppercase tracking-[0.16em] disabled:opacity-50"
              disabled={uploading}
              onClick={() => fileRef.current?.click()}
              type="button"
            >
              {uploading ? "Uploading…" : "+ Upload"}
            </button>
          </>
        ) : null
      }
      active="media"
      breadcrumb="Media · メディア"
    >
      <section className="px-8 pt-7 max-[860px]:px-5">
        <h1 className="m-0 font-display font-medium text-[36px] tracking-[-0.015em]">
          Media<span className="text-vermilion">.</span>
          <span className="ml-[14px] font-display text-[16px] text-muted italic">
            メディアライブラリ
          </span>
        </h1>

        {loading ? (
          <p className="mt-8 font-mono text-[12px] text-muted uppercase tracking-[0.14em]">
            Loading…
          </p>
        ) : (
          <MediaGrid
            assets={assets}
            canUpload={canUpload}
            onDelete={handleDelete}
          />
        )}
      </section>
    </CmsShell>
  );
}
