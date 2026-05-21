"use client";

/**
 * Tiptap-based read-only renderer for an article's `bodyJson`.
 *
 * Mirrors the extension set used by the CMS editor so the preview matches the
 * editing experience exactly. Used by `<ArticlePreview />` for draft previews
 * on the CMS, and is intentionally framework-light so it can be wrapped in
 * either the standard site chrome or the mobile-WebView chrome.
 */

import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import Youtube from "@tiptap/extension-youtube";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { useEffect, useMemo } from "react";

interface ArticleBodyProps {
  /** Tiptap doc JSON serialised as a string (the editor's `getJSON()` output). */
  bodyJson: string;
  className?: string;
}

/**
 * A minimal Tiptap doc — used as a safe fallback when the input is empty or
 * malformed so the read-only renderer always mounts cleanly.
 */
export const EMPTY_DOC = { type: "doc", content: [] };

/**
 * Parse a serialised Tiptap doc, falling back to an empty doc on bad input so
 * the preview renderer always has something safe to mount.
 */
export function parseBodyJson(bodyJson: string): unknown {
  if (!bodyJson) {
    return EMPTY_DOC;
  }
  try {
    return JSON.parse(bodyJson);
  } catch {
    return EMPTY_DOC;
  }
}

export function ArticleBody({ bodyJson, className = "" }: ArticleBodyProps) {
  const content = useMemo(() => parseBodyJson(bodyJson), [bodyJson]);

  const editor = useEditor({
    editable: false,
    extensions: [
      StarterKit.configure({ heading: { levels: [1, 2, 3] } }),
      Link.configure({ openOnClick: false }),
      Image,
      Youtube.configure({ controls: true }),
    ],
    content: "",
    immediatelyRender: false,
  });

  // Load (and keep in sync) the parsed bodyJson via setContent so we don't
  // have to thread Tiptap's `Content` type through the component props.
  useEffect(() => {
    if (!editor) {
      return;
    }
    // Cast through unknown because Tiptap's setContent expects its own
    // Content union; the runtime accepts JSON docs identical to the editor's.
    editor.commands.setContent(
      content as unknown as Parameters<typeof editor.commands.setContent>[0]
    );
  }, [editor, content]);

  return (
    <div className={`prose-editor ${className}`}>
      <EditorContent editor={editor} />
    </div>
  );
}
