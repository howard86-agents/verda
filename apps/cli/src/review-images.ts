#!/usr/bin/env bun
import { existsSync } from "node:fs";
import { copyFile, mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { type ImageKind, SOCIAL, STORIES } from "@verda/data";
import sharp from "sharp";

const STYLE_SUFFIX =
  "editorial lifestyle photography, soft natural daylight, warm muted earthy " +
  "palette, 35mm film grain, gentle shallow depth of field, calm minimal " +
  "composition, no text, no logo, no watermark";

const WIDTH = 1280;
const HEIGHT = 854;
const QUALITY = 82;

const REPO_ROOT = resolve(import.meta.dir, "../../..");
const PUBLIC_DIR = resolve(REPO_ROOT, "apps/web/public/img");
const STAGING_DIR = resolve(REPO_ROOT, "apps/cli/staging");
const ARCHIVE_DIR = resolve(STAGING_DIR, ".archive");
const VERDICT_PATH = resolve(STAGING_DIR, ".verdicts.json");
const SCHEMA_PATH = resolve(import.meta.dir, "verdict.schema.json");

interface Job {
  id: string;
  kind: ImageKind;
  prompt: string;
}

interface FacetScore {
  existing: number;
  new: number;
}

interface Verdict {
  facets: {
    backdrop: FacetScore;
    composition: FacetScore;
    grain: FacetScore;
    lighting: FacetScore;
    palette: FacetScore;
  };
  reason: string;
  winner: "existing" | "new";
}

interface VerdictRecord {
  applied: boolean;
  judged_at: string;
  verdict: Verdict;
}

type VerdictCache = Record<string, VerdictRecord>;

interface ParsedArgs {
  apply: boolean;
  force: boolean;
  only?: string;
}

function loadJobs(): Job[] {
  const jobs: Job[] = [];
  for (const s of STORIES) {
    jobs.push({ kind: "stories", id: s.id, prompt: s.imagePrompt });
  }
  for (const r of SOCIAL) {
    jobs.push({ kind: "social", id: r.id, prompt: r.imagePrompt });
  }
  return jobs;
}

function publicPath(job: Job): string {
  return resolve(PUBLIC_DIR, job.kind, `${job.id}.webp`);
}

function stagingPath(job: Job): string {
  return resolve(STAGING_DIR, job.kind, `${job.id}.webp`);
}

function cacheKey(job: Job): string {
  return `${job.kind}/${job.id}`;
}

async function loadVerdicts(): Promise<VerdictCache> {
  if (!existsSync(VERDICT_PATH)) {
    return {};
  }
  const raw = await readFile(VERDICT_PATH, "utf8");
  return JSON.parse(raw) as VerdictCache;
}

async function saveVerdicts(cache: VerdictCache): Promise<void> {
  await mkdir(dirname(VERDICT_PATH), { recursive: true });
  await writeFile(VERDICT_PATH, `${JSON.stringify(cache, null, 2)}\n`);
}

function parseArgs(argv: string[]): ParsedArgs {
  const apply = argv.includes("--apply");
  const force = argv.includes("--force") || argv.includes("-f");
  const idIdx = argv.indexOf("--id");
  const only = idIdx >= 0 ? argv[idIdx + 1] : undefined;
  return { apply, force, only };
}

// Strip ANSI escape sequences so regex/JSON parsing is reliable.
// biome-ignore lint/suspicious/noControlCharactersInRegex: stripping ANSI by design
const ANSI_RE = /\x1b\[[0-9;]*[A-Za-z]/g;
const PNG_PATH_RE = /\/[^\s"'`]*\/ig_[a-f0-9]+\.png/g;

function stripAnsi(s: string): string {
  return s.replace(ANSI_RE, "");
}

function extractLastJsonObject(text: string): string {
  const lastClose = text.lastIndexOf("}");
  if (lastClose < 0) {
    throw new Error("no closing brace in output");
  }
  let depth = 0;
  for (let i = lastClose; i >= 0; i--) {
    const ch = text[i];
    if (ch === "}") {
      depth++;
    } else if (ch === "{") {
      depth--;
      if (depth === 0) {
        return text.slice(i, lastClose + 1);
      }
    }
  }
  throw new Error("no balanced JSON object in output");
}

async function runCodex(args: string[], prompt: string): Promise<string> {
  // `--` terminates flag parsing so variadic `-i <FILE>...` doesn't slurp the prompt.
  const proc = Bun.spawn(
    [
      "codex",
      "exec",
      "--color",
      "never",
      "--skip-git-repo-check",
      ...args,
      "--",
      prompt,
    ],
    { stdout: "pipe", stderr: "pipe" }
  );
  const [out, err, code] = await Promise.all([
    new Response(proc.stdout).text(),
    new Response(proc.stderr).text(),
    proc.exited,
  ]);
  if (code !== 0) {
    throw new Error(
      `codex exec failed (exit ${code})\nSTDERR:\n${err}\nSTDOUT:\n${out}`
    );
  }
  return stripAnsi(out);
}

async function codexGenerate(job: Job): Promise<string> {
  const prompt = [
    `Use your image generation tool to produce a landscape lifestyle photograph at roughly ${WIDTH}x${HEIGHT} (3:2).`,
    `Subject: ${job.prompt}.`,
    `Required style: ${STYLE_SUFFIX}.`,
    "After the image is generated, your final reply must be ONLY the absolute file path of the saved PNG file. No prose, no markdown, no quotes.",
  ].join("\n");

  const out = await runCodex(["-s", "read-only"], prompt);
  const matches = out.match(PNG_PATH_RE);
  if (!matches || matches.length === 0) {
    throw new Error(`no ig_*.png path found in codex output:\n${out}`);
  }
  return matches.at(-1) as string;
}

async function processToWebp(srcPng: string, dstWebp: string): Promise<void> {
  await mkdir(dirname(dstWebp), { recursive: true });
  await sharp(srcPng)
    .resize(WIDTH, HEIGHT, { fit: "cover" })
    .webp({ quality: QUALITY })
    .toFile(dstWebp);
}

async function codexJudge(
  job: Job,
  existing: string,
  candidate: string
): Promise<Verdict> {
  const prompt = [
    "You are a product-photography style critic.",
    "Two images are attached. Image 1 = EXISTING, Image 2 = NEW.",
    `Both attempt this subject: ${job.prompt}.`,
    `Required editorial style: ${STYLE_SUFFIX}.`,
    "Judge ONLY editorial style adherence (not subject fidelity).",
    "Score each image 0-5 on five facets: backdrop, lighting, palette, grain, composition.",
    "The winner is the image whose total facet score is higher; ties go to existing.",
    "Return JSON conforming to the provided output schema. No prose outside the JSON object.",
  ].join("\n");

  const out = await runCodex(
    [
      "-s",
      "read-only",
      "--output-schema",
      SCHEMA_PATH,
      "-i",
      existing,
      "-i",
      candidate,
    ],
    prompt
  );
  const json = extractLastJsonObject(out);
  return JSON.parse(json) as Verdict;
}

async function archiveExisting(existing: string, id: string): Promise<void> {
  await mkdir(ARCHIVE_DIR, { recursive: true });
  const ts = new Date().toISOString().replace(/[:.]/g, "-");
  await rename(existing, resolve(ARCHIVE_DIR, `${id}-${ts}.webp`));
}

function totalFacets(v: Verdict): { existing: number; new: number } {
  const facets = Object.values(v.facets);
  return facets.reduce(
    (acc, f) => ({ existing: acc.existing + f.existing, new: acc.new + f.new }),
    { existing: 0, new: 0 }
  );
}

async function processJob(
  job: Job,
  args: ParsedArgs,
  cache: VerdictCache
): Promise<string> {
  const key = cacheKey(job);
  const cached = cache[key];
  if (cached && cached.verdict.winner === "existing" && !args.force) {
    console.log(`[skip]   ${key} (cached: existing wins)`);
    return "skip-cached";
  }
  const existing = publicPath(job);
  if (!existsSync(existing)) {
    console.log(`[skip]   ${key} (no existing image at ${existing})`);
    return "skip-no-existing";
  }

  console.log(`[gen]    ${key}`);
  const png = await codexGenerate(job);
  const staged = stagingPath(job);
  await processToWebp(png, staged);
  console.log(`[stage]  ${staged}`);

  console.log(`[judge]  ${key}`);
  const verdict = await codexJudge(job, existing, staged);
  const sums = totalFacets(verdict);
  console.log(
    `         winner=${verdict.winner} totals existing=${sums.existing} new=${sums.new}`
  );
  console.log(`         reason: ${verdict.reason}`);

  cache[key] = {
    verdict,
    judged_at: new Date().toISOString(),
    applied: false,
  };

  if (verdict.winner === "new") {
    await archiveExisting(existing, job.id);
    await copyFile(staged, existing);
    cache[key].applied = true;
    console.log(`[apply]  ${existing} (prior archived)`);
    return "replaced";
  }
  return "kept-existing";
}

function printDryRun(jobs: Job[], cache: VerdictCache, args: ParsedArgs): void {
  console.log(`DRY RUN. ${jobs.length} job(s) in scope.`);
  let willProcess = 0;
  for (const j of jobs) {
    const cached = cache[cacheKey(j)];
    const skipCached =
      cached && cached.verdict.winner === "existing" && !args.force;
    const noExisting = !existsSync(publicPath(j));
    let label: string;
    if (noExisting) {
      label = "skip (no existing image — use gen-images.ts first)";
    } else if (skipCached) {
      label = "skip (cached: existing wins; pass --force to redo)";
    } else {
      label = "regen + judge";
      willProcess++;
    }
    console.log(`  - ${cacheKey(j)}: ${label}`);
  }
  console.log(
    `\n${willProcess} call pair(s) would run (gen + judge per job, against your ChatGPT codex quota).`
  );
  console.log("Re-run with --apply to execute.");
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));
  let jobs = loadJobs();
  if (args.only) {
    jobs = jobs.filter((j) => j.id === args.only);
    if (jobs.length === 0) {
      throw new Error(`no job matched --id ${args.only}`);
    }
  }

  const cache = await loadVerdicts();

  if (!args.apply) {
    printDryRun(jobs, cache, args);
    return;
  }

  await mkdir(STAGING_DIR, { recursive: true });

  const counts: Record<string, number> = {};
  for (const job of jobs) {
    try {
      const status = await processJob(job, args, cache);
      counts[status] = (counts[status] ?? 0) + 1;
    } catch (err) {
      console.error(`[error]  ${cacheKey(job)}: ${(err as Error).message}`);
      counts.error = (counts.error ?? 0) + 1;
      process.exitCode = 1;
    }
    await saveVerdicts(cache);
  }

  console.log(`\nDone. ${JSON.stringify(counts)}`);
}

await main();
