#!/usr/bin/env bun
import { existsSync } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { type ImageKind, SOCIAL, STORIES } from "@verda/data";
import sharp from "sharp";

const STYLE_SUFFIX =
  "editorial lifestyle photography, soft natural daylight, warm muted earthy " +
  "palette, 35mm film grain, gentle shallow depth of field, calm minimal " +
  "composition, no text, no logo, no watermark";

const MODEL = "flux";
// Landscape source — story covers render at 16:11 / 21:9 / 4:3, all cropped
// with object-cover, so one generous landscape frame serves every slot.
const WIDTH = 1280;
const HEIGHT = 854;
const QUALITY = 82;

const OUT_DIR = resolve(import.meta.dir, "../../web/public/img");

// Pollinations is rate-limited, so fetch a few covers at a time, not all at once.
const CONCURRENCY = 3;

interface Job {
  id: string;
  kind: ImageKind;
  prompt: string;
  seed: number;
}

function loadJobs(): Job[] {
  const jobs: Job[] = [];
  for (const s of STORIES) {
    jobs.push({
      kind: "stories",
      id: s.id,
      prompt: s.imagePrompt,
      seed: s.imageSeed,
    });
  }
  for (const r of SOCIAL) {
    jobs.push({
      kind: "social",
      id: r.id,
      prompt: r.imagePrompt,
      seed: r.imageSeed,
    });
  }
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
  let cursor = 0;

  const worker = async (): Promise<void> => {
    while (cursor < jobs.length) {
      const job = jobs[cursor];
      cursor++;
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
  };

  await Promise.all(
    Array.from({ length: Math.min(CONCURRENCY, jobs.length) }, () => worker())
  );
  console.log(`\nDone. generated=${generated} skipped=${skipped}`);
}

await main();
