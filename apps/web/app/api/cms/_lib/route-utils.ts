import { NextResponse } from "next/server";

export function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export function notFound(): Response {
  return NextResponse.json({ error: "Not found" }, { status: 404 });
}

export function invalid(message: string): Response {
  return NextResponse.json({ error: message }, { status: 400 });
}

export function integerOrNull(value: unknown): number | null {
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0) {
    return null;
  }
  return Math.floor(value);
}
