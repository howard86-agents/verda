"use client";

import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import Youtube from "@tiptap/extension-youtube";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { CATEGORIES, SECTIONS } from "@verda/data";
import NextLink from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { ArticlePreview } from "@/_components/article-preview";
import { CmsShell } from "@/_components/cms-shell";
import { MediaPicker } from "@/_components/media-picker";
import { adminIdFor, can, useCmsAuth } from "@/lib/cms-auth";
import { track } from "@/lib/track";

interface ArticleData {
  author: string;
  bodyJson: string;
  cat: string;
  coverAssetId?: string;
  coverFocalPoint?: { x: number; y: number };
  coverUrl?: string;
  id: string;
  jp: string;
  kind: string;
  publishedAt?: string;
  scheduledAt?: string;
  /** Canonical section id (issue #87). */
  section?: string;
  /** Multi-part-series grouping (issue #87). */
  series?: { name: string; ordinal: number };
  slug: string;
  status: string;
  /** Member id for reader-contributed items (issue #87). */
  submittedBy?: string;
  tag: string;
  title: string;
}

function ToolbarBtn({
  active,
  children,
  onClick,
}: {
  active?: boolean;
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      className={`px-[6px] py-[2px] font-mono text-[11px] uppercase tracking-[0.12em] ${active ? "bg-ink text-cream" : "text-ink"}`}
      onClick={onClick}
      type="button"
    >
      {children}
    </button>
  );
}

function CoverPreview({
  canEdit,
  coverFocalPoint,
  coverUrl,
  onRemove,
  onSetFocal,
}: {
  canEdit: boolean;
  coverFocalPoint: { x: number; y: number };
  coverUrl: string;
  onRemove: () => void;
  onSetFocal: (fp: { x: number; y: number }) => void;
}) {
  return (
    <div className="relative">
      <button
        aria-label="Set focal point"
        className="block w-full cursor-crosshair border-0 bg-transparent p-0"
        disabled={!canEdit}
        onClick={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          const x = Math.round(((e.clientX - rect.left) / rect.width) * 100);
          const y = Math.round(((e.clientY - rect.top) / rect.height) * 100);
          onSetFocal({ x, y });
        }}
        type="button"
      >
        {/* biome-ignore lint/performance/noImgElement: blob URLs incompatible with next/image */}
        {/* biome-ignore lint/correctness/useImageSize: dynamic cover preview */}
        <img
          alt="Cover"
          className="aspect-[16/9] w-full border border-line object-cover"
          src={coverUrl}
          style={{
            objectPosition: `${coverFocalPoint.x}% ${coverFocalPoint.y}%`,
          }}
        />
      </button>
      <span
        className="pointer-events-none absolute size-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-vermilion bg-cream/80"
        style={{
          left: `${coverFocalPoint.x}%`,
          top: `${coverFocalPoint.y}%`,
        }}
      />
      <div className="mt-2 flex items-center justify-between">
        <span className="font-mono text-[9px] text-muted">
          Focal: {coverFocalPoint.x}%, {coverFocalPoint.y}%
        </span>
        {canEdit && (
          <button
            className="font-mono text-[9px] text-vermilion uppercase"
            onClick={onRemove}
            type="button"
          >
            Remove
          </button>
        )}
      </div>
    </div>
  );
}

function CoverPlaceholder({
  canEdit,
  onPick,
}: {
  canEdit: boolean;
  onPick: () => void;
}) {
  if (!canEdit) {
    return <span className="font-mono text-[10px] text-muted">No cover</span>;
  }
  return (
    <button
      className="w-full border border-line border-dashed py-4 font-mono text-[10px] text-muted uppercase tracking-[0.12em]"
      onClick={onPick}
      type="button"
    >
      + Set cover image
    </button>
  );
}

/**
 * Append a version-history entry for the just-saved article. Pulled out of
 * `save()` so the main save flow stays under the cognitive-complexity cap
 * (issue #76).
 */
async function recordVersion(args: {
  bodyJson: string;
  role: ReturnType<typeof useCmsAuth>["role"];
  savedId: string;
  status: string | undefined;
}) {
  const { savedId, role, status, bodyJson } = args;
  await fetch(`/api/cms/articles/${savedId}/versions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-cms-role": role,
    },
    body: JSON.stringify({
      editor: adminIdFor(role),
      status: status || "draft",
      bodyJson,
      summary: "",
    }),
  });
}

/**
 * Build the optional `series` payload for save (issue #87). Returns
 * undefined unless both a non-empty name and a positive integer ordinal
 * are supplied so partial UI input doesn't overwrite an existing series
 * with a half-formed object.
 */
function composeSeriesPayload(
  name: string,
  ordinal: string
): { name: string; ordinal: number } | undefined {
  const trimmed = name.trim();
  const ordinalNum = Number.parseInt(ordinal, 10);
  if (!(trimmed && Number.isFinite(ordinalNum)) || ordinalNum <= 0) {
    return;
  }
  return { name: trimmed, ordinal: ordinalNum };
}

/**
 * Apply a freshly-loaded `ArticleData` payload to the editor's local
 * state. Pulled out of the load `useEffect` so its callback stays under
 * the cognitive-complexity cap once issue #87's section/series/submittedBy
 * fields land alongside the existing eight or so setters.
 */
function applyArticleToState(
  data: ArticleData,
  setters: {
    setArticle: (a: ArticleData) => void;
    setAuthor: (s: string) => void;
    setCat: (s: string) => void;
    setCoverAssetId: (s: string | null) => void;
    setCoverFocalPoint: (fp: { x: number; y: number }) => void;
    setCoverUrl: (s: string | null) => void;
    setJp: (s: string) => void;
    setKind: (s: string) => void;
    setSection: (s: string) => void;
    setSeriesName: (s: string) => void;
    setSeriesOrdinal: (s: string) => void;
    setSlug: (s: string) => void;
    setSubmittedBy: (s: string) => void;
    setTag: (s: string) => void;
    setTitle: (s: string) => void;
  }
): void {
  setters.setArticle(data);
  setters.setTitle(data.title);
  setters.setJp(data.jp || "");
  setters.setSlug(data.slug);
  setters.setCat(data.cat);
  setters.setSection(data.section ?? "");
  setters.setSeriesName(data.series?.name ?? "");
  setters.setSeriesOrdinal(
    data.series?.ordinal == null ? "" : String(data.series.ordinal)
  );
  setters.setSubmittedBy(data.submittedBy ?? "");
  setters.setTag(data.tag);
  setters.setAuthor(data.author);
  setters.setKind(data.kind);
  if (data.coverAssetId) {
    setters.setCoverAssetId(data.coverAssetId);
  }
  if (data.coverUrl) {
    setters.setCoverUrl(data.coverUrl);
  }
  if (data.coverFocalPoint) {
    setters.setCoverFocalPoint(data.coverFocalPoint);
  }
}

export function ArticleEditor({ articleId }: { articleId: string | null }) {
  const { role } = useCmsAuth();
  // `currentId` tracks the canonical id the editor is operating against. It
  // starts as the route's `articleId` (null on /cms/articles/new) and adopts
  // the server-assigned id after the first POST so subsequent saves PUT the
  // same record instead of creating duplicates (issue #76).
  const [currentId, setCurrentId] = useState<string | null>(articleId);
  const [article, setArticle] = useState<ArticleData | null>(null);
  const [title, setTitle] = useState("");
  const [jp, setJp] = useState("");
  const [slug, setSlug] = useState("");
  const [cat, setCat] = useState("");
  const [section, setSection] = useState("");
  const [seriesName, setSeriesName] = useState("");
  const [seriesOrdinal, setSeriesOrdinal] = useState("");
  const [submittedBy, setSubmittedBy] = useState("");
  const [tag, setTag] = useState("");
  const [author, setAuthor] = useState("");
  const [kind, setKind] = useState("brand");
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<string | null>(null);
  const [coverAssetId, setCoverAssetId] = useState<string | null>(null);
  const [coverUrl, setCoverUrl] = useState<string | null>(null);
  const [coverFocalPoint, setCoverFocalPoint] = useState<{
    x: number;
    y: number;
  }>({ x: 50, y: 50 });
  const [showMediaPicker, setShowMediaPicker] = useState<
    "cover" | "inline" | null
  >(null);
  const [showPreview, setShowPreview] = useState(false);
  const [showScheduleDialog, setShowScheduleDialog] = useState(false);
  const autoSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [versions, setVersions] = useState<
    {
      bodyJson: string;
      editor: string;
      id: string;
      status: string;
      summary: string;
      timestamp: string;
    }[]
  >([]);

  const loadVersions = useCallback(async (id: string) => {
    const res = await fetch(`/api/cms/articles/${id}/versions`);
    if (res.ok) {
      setVersions(await res.json());
    }
  }, []);

  /**
   * After the first successful POST, adopt the server-assigned id locally
   * and reflect it in the URL via `history.replaceState`. The replaceState
   * call deliberately doesn't go through `next/navigation`'s router so the
   * editor stays mounted — preserving in-progress edits — while a reload
   * still resolves to `/cms/articles/<id>/edit` (issue #76).
   */
  const adoptCreatedArticle = useCallback((data: ArticleData) => {
    setCurrentId(data.id);
    setArticle(data);
    if (typeof window !== "undefined") {
      window.history.replaceState(null, "", `/cms/articles/${data.id}/edit`);
    }
  }, []);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
      }),
      Link.configure({ openOnClick: false }),
      Image,
      Youtube.configure({ controls: true }),
      Placeholder.configure({ placeholder: "Start writing…" }),
    ],
    content: "",
    editable: can("edit_draft", role),
  });

  // Load article
  useEffect(() => {
    setCurrentId(articleId);
    if (!articleId) {
      return;
    }
    fetch(`/api/cms/articles/${articleId}`)
      .then((r) => r.json())
      .then((data: ArticleData) => {
        applyArticleToState(data, {
          setArticle,
          setAuthor,
          setCat,
          setCoverAssetId,
          setCoverFocalPoint,
          setCoverUrl,
          setJp,
          setKind,
          setSection,
          setSeriesName,
          setSeriesOrdinal,
          setSlug,
          setSubmittedBy,
          setTag,
          setTitle,
        });
        if (data.bodyJson && editor) {
          try {
            editor.commands.setContent(JSON.parse(data.bodyJson));
          } catch {
            // ignore parse errors
          }
        }
      });
    if (articleId) {
      loadVersions(articleId);
    }
  }, [articleId, editor, loadVersions]);

  const save = useCallback(async () => {
    if (!editor) {
      return;
    }
    // Guard against concurrent saves: a stale autosave firing while a
    // manual save is in flight can otherwise issue a second POST and
    // create a duplicate draft (issue #76).
    if (saving) {
      return;
    }
    setSaving(true);
    const bodyJson = JSON.stringify(editor.getJSON());
    const payload = {
      title,
      jp,
      slug,
      cat,
      section: section || undefined,
      series: composeSeriesPayload(seriesName, seriesOrdinal),
      submittedBy: submittedBy.trim() || undefined,
      tag,
      author,
      kind,
      bodyJson,
      coverAssetId: coverAssetId || undefined,
      coverUrl: coverUrl || undefined,
      coverFocalPoint,
    };

    const url = currentId
      ? `/api/cms/articles/${currentId}`
      : "/api/cms/articles";
    const method = currentId ? "PUT" : "POST";

    const res = await fetch(url, {
      method,
      headers: {
        "Content-Type": "application/json",
        "x-cms-role": role,
      },
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      const data = await res.json();
      const savedId: string = currentId ?? data.id;
      // First create: adopt the server-assigned id so subsequent autosaves
      // and manual saves PUT against the same record, and reflect the id
      // in the URL so a reload goes straight to the article's edit URL.
      if (!currentId) {
        adoptCreatedArticle(data);
      }
      await recordVersion({ savedId, role, status: data.status, bodyJson });
      await loadVersions(savedId);
      setLastSaved(
        new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        })
      );
    }
    setSaving(false);
  }, [
    editor,
    saving,
    title,
    jp,
    slug,
    cat,
    section,
    seriesName,
    seriesOrdinal,
    submittedBy,
    tag,
    author,
    kind,
    currentId,
    role,
    coverAssetId,
    coverUrl,
    coverFocalPoint,
    loadVersions,
    adoptCreatedArticle,
  ]);

  // Autosave on content change
  useEffect(() => {
    if (!editor) {
      return;
    }
    const handler = () => {
      if (autoSaveTimer.current) {
        clearTimeout(autoSaveTimer.current);
      }
      autoSaveTimer.current = setTimeout(save, 3000);
    };
    editor.on("update", handler);
    return () => {
      editor.off("update", handler);
      if (autoSaveTimer.current) {
        clearTimeout(autoSaveTimer.current);
      }
    };
  }, [editor, save]);

  const canEdit = can("edit_draft", role);

  return (
    <CmsShell
      actions={
        <EditorActions
          article={article}
          articleId={currentId}
          canEdit={canEdit}
          onOpenPreview={() => setShowPreview(true)}
          onOpenSchedule={() => setShowScheduleDialog(true)}
          onPublish={async () => {
            const res = await fetch(`/api/cms/articles/${currentId}/publish`, {
              method: "POST",
              headers: { "x-cms-role": role },
            });
            if (res.ok) {
              setArticle((a) => (a ? { ...a, status: "published" } : a));
              track("admin_article_publish", { articleId: currentId });
            }
          }}
          onSave={save}
          onUnpublish={async () => {
            const res = await fetch(
              `/api/cms/articles/${currentId}/unpublish`,
              {
                method: "POST",
                headers: { "x-cms-role": role },
              }
            );
            if (res.ok) {
              setArticle((a) => (a ? { ...a, status: "unpublished" } : a));
            }
          }}
          role={role}
          saving={saving}
        />
      }
      active="articles"
      breadcrumb={`Articles / ${currentId ? "Edit" : "New"}`}
    >
      <section className="grid grid-cols-[1fr_300px] items-start gap-6 px-8 pt-6 max-[1000px]:grid-cols-1 max-[860px]:px-5">
        {/* Editor */}
        <div className="border border-line bg-paper">
          {/* Toolbar */}
          {editor && (
            <div className="flex flex-wrap items-center gap-2 border-line border-b px-[18px] py-[10px]">
              <ToolbarBtn
                active={editor.isActive("heading", { level: 1 })}
                onClick={() =>
                  editor.chain().focus().toggleHeading({ level: 1 }).run()
                }
              >
                H1
              </ToolbarBtn>
              <ToolbarBtn
                active={editor.isActive("heading", { level: 2 })}
                onClick={() =>
                  editor.chain().focus().toggleHeading({ level: 2 }).run()
                }
              >
                H2
              </ToolbarBtn>
              <span className="h-[14px] w-px bg-line" />
              <ToolbarBtn
                active={editor.isActive("bold")}
                onClick={() => editor.chain().focus().toggleBold().run()}
              >
                B
              </ToolbarBtn>
              <ToolbarBtn
                active={editor.isActive("italic")}
                onClick={() => editor.chain().focus().toggleItalic().run()}
              >
                I
              </ToolbarBtn>
              <span className="h-[14px] w-px bg-line" />
              <ToolbarBtn
                active={editor.isActive("blockquote")}
                onClick={() => editor.chain().focus().toggleBlockquote().run()}
              >
                Quote
              </ToolbarBtn>
              <ToolbarBtn
                active={editor.isActive("bulletList")}
                onClick={() => editor.chain().focus().toggleBulletList().run()}
              >
                List
              </ToolbarBtn>
              <ToolbarBtn
                onClick={() => {
                  // biome-ignore lint/suspicious/noAlert: dev-only CMS tool
                  const url = window.prompt("URL:");
                  if (url) {
                    editor.chain().focus().setLink({ href: url }).run();
                  }
                }}
              >
                Link
              </ToolbarBtn>
              <span className="h-[14px] w-px bg-line" />
              <ToolbarBtn onClick={() => setShowMediaPicker("inline")}>
                + Image
              </ToolbarBtn>
              <ToolbarBtn
                onClick={() => {
                  // biome-ignore lint/suspicious/noAlert: dev-only CMS tool
                  const url = window.prompt("YouTube URL:");
                  if (url) {
                    editor.commands.setYoutubeVideo({ src: url });
                  }
                }}
              >
                Video
              </ToolbarBtn>
              <span className="ml-auto font-mono text-[10px] text-muted tracking-[0.1em]">
                {lastSaved ? `↺ saved · ${lastSaved}` : ""}
                {saving ? "saving…" : ""}
              </span>
            </div>
          )}

          {/* Title */}
          <div className="border-line border-b p-[22px]">
            <div className="mb-2 font-mono text-[10px] text-muted uppercase tracking-[0.22em]">
              Title · タイトル
            </div>
            <input
              className="w-full border-none bg-transparent font-display font-medium text-[32px] leading-[1.1] tracking-[-0.015em] outline-none placeholder:text-muted"
              disabled={!canEdit}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Article title"
              value={title}
            />
            <input
              className="mt-2 w-full border-none bg-transparent font-display text-[16px] text-muted italic outline-none placeholder:text-muted/50"
              disabled={!canEdit}
              onChange={(e) => setJp(e.target.value)}
              placeholder="Japanese subtitle"
              value={jp}
            />
          </div>

          {/* Body */}
          <div className="prose-editor min-h-[400px] p-6">
            <EditorContent editor={editor} />
          </div>
        </div>

        {/* Sidebar */}
        <aside className="flex flex-col gap-4">
          {/* Cover image */}
          <div className="border border-line bg-paper">
            <div className="border-line border-b px-[14px] py-[10px] font-mono text-[10.5px] text-ink uppercase tracking-[0.18em]">
              Cover Image
            </div>
            <div className="px-[14px] py-3">
              {coverUrl ? (
                <CoverPreview
                  canEdit={canEdit}
                  coverFocalPoint={coverFocalPoint}
                  coverUrl={coverUrl}
                  onRemove={() => {
                    setCoverAssetId(null);
                    setCoverUrl(null);
                  }}
                  onSetFocal={setCoverFocalPoint}
                />
              ) : (
                <CoverPlaceholder
                  canEdit={canEdit}
                  onPick={() => setShowMediaPicker("cover")}
                />
              )}
            </div>
          </div>

          {/* Status */}
          <div className="border border-line bg-paper">
            <div className="border-line border-b px-[14px] py-[10px] font-mono text-[10.5px] text-ink uppercase tracking-[0.18em]">
              Status
            </div>
            <div className="px-[14px] py-3">
              <div className="flex items-center gap-2 font-mono text-[11px] tracking-[0.14em]">
                <span className="size-2 bg-muted" />
                {article?.status?.toUpperCase() ?? "NEW"}
              </div>
              {article?.status === "scheduled" && article?.scheduledAt && (
                <div className="mt-2 font-mono text-[10px] text-vermilion uppercase tracking-[0.14em]">
                  Scheduled for{" "}
                  {new Date(article.scheduledAt).toLocaleString([], {
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Metadata */}
          <div className="border border-line bg-paper">
            <div className="border-line border-b px-[14px] py-[10px] font-mono text-[10.5px] text-ink uppercase tracking-[0.18em]">
              Metadata
            </div>
            <div className="flex flex-col gap-3 px-[14px] py-3">
              <label className="block">
                <span className="font-mono text-[9.5px] text-muted uppercase tracking-[0.14em]">
                  Slug
                </span>
                <input
                  className="mt-1 w-full border border-line bg-paper px-2 py-1 font-sans text-[12px]"
                  disabled={!canEdit}
                  onChange={(e) => setSlug(e.target.value)}
                  value={slug}
                />
              </label>
              <label className="block">
                <span className="font-mono text-[9.5px] text-muted uppercase tracking-[0.14em]">
                  Category
                </span>
                <select
                  className="mt-1 w-full border border-line bg-paper px-2 py-1 font-sans text-[12px]"
                  disabled={!canEdit}
                  onChange={(e) => setCat(e.target.value)}
                  value={cat}
                >
                  <option value="">Select…</option>
                  {CATEGORIES.filter((c) => c !== "All").map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block">
                <span className="font-mono text-[9.5px] text-muted uppercase tracking-[0.14em]">
                  Section
                </span>
                <select
                  className="mt-1 w-full border border-line bg-paper px-2 py-1 font-sans text-[12px]"
                  disabled={!canEdit}
                  onChange={(e) => setSection(e.target.value)}
                  value={section}
                >
                  <option value="">No section</option>
                  {SECTIONS.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </label>
              <div className="grid grid-cols-[1fr_80px] gap-2">
                <label className="block">
                  <span className="font-mono text-[9.5px] text-muted uppercase tracking-[0.14em]">
                    Series name
                  </span>
                  <input
                    className="mt-1 w-full border border-line bg-paper px-2 py-1 font-sans text-[12px]"
                    disabled={!canEdit}
                    onChange={(e) => setSeriesName(e.target.value)}
                    placeholder="Optional"
                    value={seriesName}
                  />
                </label>
                <label className="block">
                  <span className="font-mono text-[9.5px] text-muted uppercase tracking-[0.14em]">
                    Part #
                  </span>
                  <input
                    className="mt-1 w-full border border-line bg-paper px-2 py-1 font-sans text-[12px]"
                    disabled={!canEdit}
                    inputMode="numeric"
                    onChange={(e) =>
                      setSeriesOrdinal(e.target.value.replace(/\D+/g, ""))
                    }
                    placeholder="—"
                    value={seriesOrdinal}
                  />
                </label>
              </div>
              <label className="block">
                <span className="font-mono text-[9.5px] text-muted uppercase tracking-[0.14em]">
                  Submitted by (member id)
                </span>
                <input
                  className="mt-1 w-full border border-line bg-paper px-2 py-1 font-sans text-[12px]"
                  disabled={!canEdit}
                  onChange={(e) => setSubmittedBy(e.target.value)}
                  placeholder="Reader-contributed only"
                  value={submittedBy}
                />
              </label>
              <label className="block">
                <span className="font-mono text-[9.5px] text-muted uppercase tracking-[0.14em]">
                  Tags (comma-separated)
                </span>
                <input
                  className="mt-1 w-full border border-line bg-paper px-2 py-1 font-sans text-[12px]"
                  disabled={!canEdit}
                  onChange={(e) => setTag(e.target.value)}
                  value={tag}
                />
              </label>
              <label className="block">
                <span className="font-mono text-[9.5px] text-muted uppercase tracking-[0.14em]">
                  Author
                </span>
                <input
                  className="mt-1 w-full border border-line bg-paper px-2 py-1 font-sans text-[12px]"
                  disabled={!canEdit}
                  onChange={(e) => setAuthor(e.target.value)}
                  value={author}
                />
              </label>
              <label className="block">
                <span className="font-mono text-[9.5px] text-muted uppercase tracking-[0.14em]">
                  Kind
                </span>
                <select
                  className="mt-1 w-full border border-line bg-paper px-2 py-1 font-sans text-[12px]"
                  disabled={!canEdit}
                  onChange={(e) => setKind(e.target.value)}
                  value={kind}
                >
                  <option value="brand">Brand</option>
                  <option value="social">Social</option>
                </select>
              </label>
            </div>
          </div>

          {/* Version History */}
          {currentId && (
            <div className="border border-line bg-paper">
              <div className="border-line border-b px-[14px] py-[10px] font-mono text-[10.5px] text-ink uppercase tracking-[0.18em]">
                Versions · {versions.length}
              </div>
              <div className="max-h-[240px] overflow-y-auto">
                {versions.length === 0 ? (
                  <div className="px-[14px] py-3 font-mono text-[10px] text-muted">
                    No versions yet
                  </div>
                ) : (
                  versions.map((v) => (
                    <div
                      className="flex items-center justify-between border-line border-b px-[14px] py-[10px] last:border-b-0"
                      key={v.id}
                    >
                      <div>
                        <div className="font-mono text-[10px] text-ink tracking-[0.06em]">
                          {new Date(v.timestamp).toLocaleString([], {
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </div>
                        <div className="font-mono text-[9px] text-muted tracking-[0.06em]">
                          {v.editor} · {v.status}
                        </div>
                      </div>
                      {canEdit && (
                        <button
                          className="font-mono text-[9px] text-vermilion uppercase tracking-[0.1em]"
                          onClick={() => {
                            if (!editor) {
                              return;
                            }
                            try {
                              editor.commands.setContent(
                                JSON.parse(v.bodyJson)
                              );
                            } catch {
                              // ignore parse errors
                            }
                          }}
                          type="button"
                        >
                          Restore
                        </button>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </aside>
      </section>
      <div className="h-10" />
      {showMediaPicker && (
        <MediaPicker
          onClose={() => setShowMediaPicker(null)}
          onSelect={(asset) => {
            if (showMediaPicker === "cover") {
              setCoverAssetId(asset.id);
              setCoverUrl(asset.url);
            } else if (showMediaPicker === "inline" && editor) {
              editor
                .chain()
                .focus()
                .setImage({ src: asset.url, alt: asset.alt })
                .run();
            }
            setShowMediaPicker(null);
          }}
        />
      )}
      {showPreview && canEdit && (
        <ArticlePreview
          draft={{
            title,
            jp,
            cat,
            tag,
            author,
            coverUrl: coverUrl || null,
            coverFocalPoint,
            bodyJson: editor ? JSON.stringify(editor.getJSON()) : "",
          }}
          onClose={() => setShowPreview(false)}
        />
      )}
      {showScheduleDialog && currentId && (
        <ScheduleDialog
          articleId={currentId}
          currentScheduledAt={article?.scheduledAt}
          onClose={() => setShowScheduleDialog(false)}
          onPublishNow={async () => {
            const res = await fetch(`/api/cms/articles/${currentId}/publish`, {
              method: "POST",
              headers: { "x-cms-role": role },
            });
            if (res.ok) {
              setArticle((a) =>
                a ? { ...a, status: "published", scheduledAt: undefined } : a
              );
              track("admin_article_publish", { articleId: currentId });
            }
            setShowScheduleDialog(false);
          }}
          onScheduled={(scheduledAt) => {
            setArticle((a) =>
              a ? { ...a, status: "scheduled", scheduledAt } : a
            );
            setShowScheduleDialog(false);
          }}
          role={role}
        />
      )}
    </CmsShell>
  );
}

interface EditorActionsProps {
  article: ArticleData | null;
  articleId: string | null;
  canEdit: boolean;
  onOpenPreview: () => void;
  onOpenSchedule: () => void;
  onPublish: () => Promise<void>;
  onSave: () => Promise<void>;
  onUnpublish: () => Promise<void>;
  role: ReturnType<typeof useCmsAuth>["role"];
  saving: boolean;
}

/**
 * The CMS topbar action slot for the editor: Preview / Save draft /
 * Schedule / Publish / Unpublish. Extracted from `ArticleEditor` so the
 * parent component stays under the cognitive-complexity lint cap once the
 * Schedule branch is added (issue #77).
 */
function EditorActions({
  article,
  articleId,
  canEdit,
  onOpenPreview,
  onOpenSchedule,
  onPublish,
  onSave,
  onUnpublish,
  role,
  saving,
}: EditorActionsProps) {
  const showSchedule =
    !!articleId && can("publish", role) && article?.status !== "published";
  const showPublish = showSchedule;
  const showUnpublish =
    !!articleId && can("unpublish", role) && article?.status === "published";
  return (
    <>
      <NextLink
        className="border border-line bg-paper px-3 py-2 font-mono text-[11px] text-ink uppercase tracking-[0.16em]"
        href="/cms/articles"
      >
        ← Back
      </NextLink>
      {canEdit && (
        <button
          className="border border-ink bg-paper px-[14px] py-2 font-mono text-[11px] text-ink uppercase tracking-[0.16em]"
          onClick={onOpenPreview}
          type="button"
        >
          Preview
        </button>
      )}
      {canEdit && (
        <button
          className="bg-ink px-[14px] py-2 font-mono text-[11px] text-cream uppercase tracking-[0.16em] disabled:opacity-50"
          disabled={saving}
          onClick={onSave}
          type="button"
        >
          {saving ? "Saving…" : "Save draft"}
        </button>
      )}
      {showSchedule && (
        <button
          className="border border-ink bg-paper px-[14px] py-2 font-mono text-[11px] text-ink uppercase tracking-[0.16em]"
          onClick={onOpenSchedule}
          type="button"
        >
          {article?.status === "scheduled" ? "Reschedule" : "Schedule"}
        </button>
      )}
      {showPublish && (
        <button
          className="bg-vermilion px-[14px] py-2 font-mono text-[11px] text-cream uppercase tracking-[0.16em]"
          onClick={onPublish}
          type="button"
        >
          Publish →
        </button>
      )}
      {showUnpublish && (
        <button
          className="border border-ink bg-paper px-[14px] py-2 font-mono text-[11px] text-ink uppercase tracking-[0.16em]"
          onClick={onUnpublish}
          type="button"
        >
          Unpublish
        </button>
      )}
    </>
  );
}

interface ScheduleDialogProps {
  articleId: string;
  currentScheduledAt: string | undefined;
  onClose: () => void;
  onPublishNow: () => Promise<void>;
  onScheduled: (scheduledAt: string) => void;
  role: ReturnType<typeof useCmsAuth>["role"];
}

/**
 * Modal dialog presenting a `<input type="datetime-local">` and a Schedule
 * action wired to `POST /api/cms/articles/:id/schedule` (issue #77). A
 * past date is treated as immediate publish — the chosen behaviour from
 * the issue's "reject or treat as immediate publish" branch.
 */
function ScheduleDialog({
  articleId,
  currentScheduledAt,
  onClose,
  onPublishNow,
  onScheduled,
  role,
}: ScheduleDialogProps) {
  const [value, setValue] = useState<string>(() =>
    currentScheduledAt ? toLocalInputValue(currentScheduledAt) : ""
  );
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    setError(null);
    if (!value) {
      setError("Pick a date and time first.");
      return;
    }
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      setError("That date is not valid.");
      return;
    }
    setSubmitting(true);
    try {
      if (date.getTime() <= Date.now()) {
        // Past date → treated as immediate publish per the chosen branch.
        await onPublishNow();
        return;
      }
      const res = await fetch(`/api/cms/articles/${articleId}/schedule`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-cms-role": role,
        },
        body: JSON.stringify({ scheduledAt: date.toISOString() }),
      });
      if (!res.ok) {
        setError("Could not schedule the article.");
        return;
      }
      onScheduled(date.toISOString());
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      aria-label="Schedule article"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink/60 px-4"
      role="dialog"
    >
      <div className="w-full max-w-sm border border-ink bg-paper p-6">
        <div className="font-mono text-[10.5px] text-muted uppercase tracking-[0.18em]">
          Schedule article · 排程発布
        </div>
        <h2 className="mt-1 font-display font-medium text-[20px]">
          Pick a future date &amp; time
        </h2>
        <p className="mt-2 font-display text-[13px] text-muted leading-[1.5]">
          The article will publish automatically when the time is due. A past
          date publishes immediately.
        </p>
        <label className="mt-4 block">
          <span className="font-mono text-[10px] text-muted uppercase tracking-[0.16em]">
            Publish at
          </span>
          <input
            className="mt-1 w-full border border-line bg-paper px-2 py-2 font-sans text-[13px]"
            disabled={submitting}
            min={toLocalInputValue(new Date().toISOString())}
            onChange={(e) => setValue(e.target.value)}
            type="datetime-local"
            value={value}
          />
        </label>
        {error && (
          <div className="mt-2 font-mono text-[10px] text-vermilion uppercase tracking-[0.12em]">
            {error}
          </div>
        )}
        <div className="mt-5 flex items-center justify-end gap-2">
          <button
            className="border border-line bg-paper px-3 py-2 font-mono text-[11px] text-ink uppercase tracking-[0.16em]"
            disabled={submitting}
            onClick={onClose}
            type="button"
          >
            Cancel
          </button>
          <button
            className="bg-ink px-3 py-2 font-mono text-[11px] text-cream uppercase tracking-[0.16em] disabled:opacity-50"
            disabled={submitting}
            onClick={submit}
            type="button"
          >
            {submitting ? "Scheduling…" : "Schedule"}
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * Convert an ISO timestamp into the `YYYY-MM-DDTHH:mm` shape that
 * `<input type="datetime-local">` expects, in the user's local timezone.
 */
function toLocalInputValue(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return "";
  }
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}
