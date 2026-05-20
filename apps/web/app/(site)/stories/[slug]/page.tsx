import { STORIES } from "@verda/data";
import { notFound } from "next/navigation";
import { DetailReader } from "./detail-reader";

export function generateStaticParams() {
  return STORIES.map((s) => ({ slug: s.slug }));
}

export default async function StoryDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const story = STORIES.find((s) => s.slug === slug);
  if (!story) {
    notFound();
  }

  return <DetailReader story={story} />;
}
