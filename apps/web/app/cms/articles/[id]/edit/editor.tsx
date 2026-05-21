"use client";

import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { CATEGORIES } from "@verda/data";
import NextLink from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { CmsShell } from "@/_components/cms-shell";
import { can, useCmsAuth } from "@/lib/cms-auth";
import { track } from "@/lib/track";

interface ArticleData {
  author: string;
  bodyJson: string;
  cat: string;
  id: string;
  jp: string;
  kind: string;
  publishedAt?: string;
  scheduledAt?: string;
  slug: string;
  status: string;
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

export function ArticleEditor({ articleId }: { articleId: string | null }) {
  const { role } = useCmsAuth();
  const [article, setArticle] = useState<ArticleData | null>(null);
  const [title, setTitle] = useState("");
  const [jp, setJp] = useState("");
  const [slug, setSlug] = useState("");
  const [cat, setCat] = useState("");
  const [tag, setTag] = useState("");
  const [author, setAuthor] = useState("");
  const [kind, setKind] = useState("brand");
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<string | null>(null);
  const autoSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
      }),
      Link.configure({ openOnClick: false }),
      Image,
      Placeholder.configure({ placeholder: "Start writing…" }),
    ],
    content: "",
    editable: can("edit_draft", role),
  });

  // Load article
  useEffect(() => {
    if (!articleId) {
      return;
    }
    fetch(`/api/cms/articles/${articleId}`)
      .then((r) => r.json())
      .then((data: ArticleData) => {
        setArticle(data);
        setTitle(data.title);
        setJp(data.jp || "");
        setSlug(data.slug);
        setCat(data.cat);
        setTag(data.tag);
        setAuthor(data.author);
        setKind(data.kind);
        if (data.bodyJson && editor) {
          try {
            editor.commands.setContent(JSON.parse(data.bodyJson));
          } catch {
            // ignore parse errors
          }
        }
      });
  }, [articleId, editor]);

  const save = useCallback(async () => {
    if (!editor) {
      return;
    }
    setSaving(true);
    const bodyJson = JSON.stringify(editor.getJSON());
    const payload = { title, jp, slug, cat, tag, author, kind, bodyJson };

    const url = articleId
      ? `/api/cms/articles/${articleId}`
      : "/api/cms/articles";
    const method = articleId ? "PUT" : "POST";

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
      if (!articleId) {
        setArticle(data);
      }
      setLastSaved(
        new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        })
      );
    }
    setSaving(false);
  }, [editor, title, jp, slug, cat, tag, author, kind, articleId, role]);

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
        <>
          <NextLink
            className="border border-line bg-paper px-3 py-2 font-mono text-[11px] text-ink uppercase tracking-[0.16em]"
            href="/cms/articles"
          >
            ← Back
          </NextLink>
          {canEdit && (
            <button
              className="bg-ink px-[14px] py-2 font-mono text-[11px] text-cream uppercase tracking-[0.16em] disabled:opacity-50"
              disabled={saving}
              onClick={save}
              type="button"
            >
              {saving ? "Saving…" : "Save draft"}
            </button>
          )}
          {articleId &&
            can("publish", role) &&
            article?.status !== "published" && (
              <button
                className="bg-vermilion px-[14px] py-2 font-mono text-[11px] text-cream uppercase tracking-[0.16em]"
                onClick={async () => {
                  const res = await fetch(
                    `/api/cms/articles/${articleId}/publish`,
                    {
                      method: "POST",
                      headers: { "x-cms-role": role },
                    }
                  );
                  if (res.ok) {
                    setArticle((a) => (a ? { ...a, status: "published" } : a));
                    track("admin_article_publish", { articleId });
                  }
                }}
                type="button"
              >
                Publish →
              </button>
            )}
          {articleId &&
            can("unpublish", role) &&
            article?.status === "published" && (
              <button
                className="border border-ink bg-paper px-[14px] py-2 font-mono text-[11px] text-ink uppercase tracking-[0.16em]"
                onClick={async () => {
                  const res = await fetch(
                    `/api/cms/articles/${articleId}/unpublish`,
                    {
                      method: "POST",
                      headers: { "x-cms-role": role },
                    }
                  );
                  if (res.ok) {
                    setArticle((a) =>
                      a ? { ...a, status: "unpublished" } : a
                    );
                  }
                }}
                type="button"
              >
                Unpublish
              </button>
            )}
        </>
      }
      active="articles"
      breadcrumb={`Articles / ${articleId ? "Edit" : "New"}`}
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
              <ToolbarBtn
                onClick={() => {
                  // biome-ignore lint/suspicious/noAlert: dev-only CMS tool
                  const url = window.prompt("Image URL:");
                  if (url) {
                    editor.chain().focus().setImage({ src: url }).run();
                  }
                }}
              >
                + Image
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
        </aside>
      </section>
      <div className="h-10" />
    </CmsShell>
  );
}
