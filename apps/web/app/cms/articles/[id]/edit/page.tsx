"use client";

import { useParams } from "next/navigation";
import { ArticleEditor } from "./editor";

export default function CmsEditorPage() {
  const params = useParams<{ id: string }>();
  return <ArticleEditor articleId={params.id} />;
}
