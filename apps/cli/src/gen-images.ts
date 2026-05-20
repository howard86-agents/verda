#!/usr/bin/env bun
import { existsSync } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { AI_MATCHES, PRODUCTS, REFERENCE_IMAGE } from "@verda/data";
import sharp from "sharp";

const STYLE_SUFFIX =
  "editorial product photography, soft directional daylight, " +
  "ivory paper backdrop, neutral natural palette, 35mm film grain, " +
  "shallow depth of field, centred composition, no text, no logo, no watermark";

const MODEL = "flux";
const WIDTH = 1024;
const HEIGHT = 1280;
const QUALITY = 82;

const OUT_DIR = resolve(import.meta.dir, "../../web/public/img");

interface Job {
  id: string;
  kind: "products" | "matches" | "reference";
  prompt: string;
  seed: number;
}

function loadJobs(): Job[] {
  const jobs: Job[] = [];
  for (const p of PRODUCTS) {
    jobs.push({
      kind: "products",
      id: p.id,
      prompt: p.imagePrompt,
      seed: p.imageSeed,
    });
  }
  for (const m of AI_MATCHES) {
    jobs.push({
      kind: "matches",
      id: m.id,
      prompt: m.imagePrompt,
      seed: m.imageSeed,
    });
  }
  jobs.push({
    kind: "reference",
    id: REFERENCE_IMAGE.id,
    prompt: REFERENCE_IMAGE.imagePrompt,
    seed: REFERENCE_IMAGE.imageSeed,
  });
  return jobs;
}

function pollinationsUrl(prompt: string, seed: number): string {
  const composed = `${prompt}. ${STYLE_SUFFIX}`;
  const params = new URLSearchParams({
    width: String(WIDTH),
    height: String(HEIGHT),
    model: MODEL,
    seed: String(seed),
    nologo: "true",
    enhance: "false",
  });
  return `https://image.pollinations.ai/prompt/${encodeURIComponent(composed)}?${params}`;
}

function outputPath(job: Job): string {
  if (job.kind === "reference") {
    return resolve(OUT_DIR, "reference.webp");
  }
  return resolve(OUT_DIR, job.kind, `${job.id}.webp`);
}

async function generate(job: Job): Promise<void> {
  const url = pollinationsUrl(job.prompt, job.seed);
  const res = await fetch(url, { redirect: "follow" });
  if (!res.ok) {
    throw new Error(
      `${res.status} ${res.statusText} for ${job.kind}/${job.id}`
    );
  }
  const buf = Buffer.from(await res.arrayBuffer());
  const webp = await sharp(buf)
    .resize(WIDTH, HEIGHT, { fit: "cover" })
    .webp({ quality: QUALITY })
    .toBuffer();
  const out = outputPath(job);
  await mkdir(dirname(out), { recursive: true });
  await writeFile(out, webp);
}

function parseArgs(argv: string[]): { force: boolean; only?: string } {
  const force = argv.includes("--force") || argv.includes("-f");
  const idIdx = argv.indexOf("--id");
  const only = idIdx >= 0 ? argv[idIdx + 1] : undefined;
  return { force, only };
}

async function main(): Promise<void> {
  const { force, only } = parseArgs(process.argv.slice(2));
  const jobs = loadJobs().filter((j) => (only ? j.id === only : true));
  if (only && jobs.length === 0) {
    throw new Error(`No job matched --id ${only}`);
  }

  let generated = 0;
  let skipped = 0;
  for (const job of jobs) {
    const out = outputPath(job);
    if (!force && existsSync(out)) {
      console.log(`[skip]   ${job.kind}/${job.id}`);
      skipped++;
      continue;
    }
    console.log(`[fetch]  ${job.kind}/${job.id} seed=${job.seed}`);
    try {
      await generate(job);
      console.log(`[wrote]  ${out}`);
      generated++;
    } catch (err) {
      console.error(
        `[error]  ${job.kind}/${job.id}: ${(err as Error).message}`
      );
      process.exitCode = 1;
    }
  }
  console.log(`\nDone. generated=${generated} skipped=${skipped}`);
}

await main();
