import { createHmac, randomUUID, timingSafeEqual } from "node:crypto";
import { mkdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";

const DEFAULT_BUCKET = "media";
const LOCAL_PROVIDER = "local";
const SUPABASE_PROVIDER = "supabase";
const TOKEN_TTL_MS = 5 * 60 * 1000;
const TRAILING_SLASH_RE = /\/$/;

export interface SignedUpload {
  expiresAt: string;
  method: "PUT";
  path: string;
  provider: string;
  publicUrl: string;
  uploadUrl: string;
}

interface TokenPayload {
  exp: number;
  mimeType: string;
  path: string;
}

export function storageProvider(): string {
  return process.env.MEDIA_STORAGE_PROVIDER === SUPABASE_PROVIDER
    ? SUPABASE_PROVIDER
    : LOCAL_PROVIDER;
}

export function createObjectPath(filename: string, now = Date.now()): string {
  const safe = filename
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
  const suffix = safe.length > 0 ? safe : "upload.bin";
  return `${DEFAULT_BUCKET}/${now.toString(36)}-${randomUUID()}-${suffix}`;
}

export async function createSignedUpload({
  filename,
  mimeType,
}: {
  filename: string;
  mimeType: string;
}): Promise<SignedUpload> {
  const objectPath = createObjectPath(filename);
  const provider = storageProvider();

  if (provider === SUPABASE_PROVIDER) {
    return await createSupabaseSignedUpload(objectPath);
  }

  const expiresAtMs = Date.now() + TOKEN_TTL_MS;
  const token = signToken({ exp: expiresAtMs, mimeType, path: objectPath });
  return {
    expiresAt: new Date(expiresAtMs).toISOString(),
    method: "PUT",
    path: objectPath,
    provider,
    publicUrl: `/api/storage/local/public/${encodeURIComponent(objectPath)}`,
    uploadUrl: `/api/storage/local?token=${encodeURIComponent(token)}`,
  };
}

async function createSupabaseSignedUpload(
  objectPath: string
): Promise<SignedUpload> {
  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const bucket = process.env.SUPABASE_STORAGE_BUCKET || DEFAULT_BUCKET;
  if (!(supabaseUrl && serviceRoleKey)) {
    throw new Error(
      "SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required when MEDIA_STORAGE_PROVIDER=supabase"
    );
  }
  const baseUrl = supabaseUrl.replace(TRAILING_SLASH_RE, "");
  const storagePath = objectPath.replace(`${DEFAULT_BUCKET}/`, "");
  const response = await fetch(
    `${baseUrl}/storage/v1/object/upload/sign/${bucket}/${storagePath}`,
    {
      method: "POST",
      headers: {
        authorization: `Bearer ${serviceRoleKey}`,
        apikey: serviceRoleKey,
      },
    }
  );
  if (!response.ok) {
    throw new Error(`Supabase signed upload failed: ${response.status}`);
  }
  const body = (await response.json()) as { signedURL?: string; url?: string };
  const uploadUrl = body.signedURL || body.url;
  if (!uploadUrl) {
    throw new Error("Supabase signed upload response missing URL");
  }
  return {
    expiresAt: new Date(Date.now() + TOKEN_TTL_MS).toISOString(),
    method: "PUT",
    path: objectPath,
    provider: SUPABASE_PROVIDER,
    publicUrl: `${baseUrl}/storage/v1/object/public/${bucket}/${storagePath}`,
    uploadUrl: uploadUrl.startsWith("http")
      ? uploadUrl
      : `${baseUrl}${uploadUrl}`,
  };
}

export async function writeLocalUpload(token: string, body: ArrayBuffer) {
  const payload = verifyToken(token);
  const target = localPathFor(payload.path);
  await mkdir(path.dirname(target), { recursive: true });
  await writeFile(target, Buffer.from(body));
  return payload;
}

export async function deleteStoredObject(provider: string, objectPath: string) {
  if (provider === LOCAL_PROVIDER) {
    await rm(localPathFor(objectPath), { force: true });
    return;
  }

  if (provider === SUPABASE_PROVIDER) {
    await deleteSupabaseObject(objectPath);
  }
}

async function deleteSupabaseObject(objectPath: string) {
  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const bucket = process.env.SUPABASE_STORAGE_BUCKET || DEFAULT_BUCKET;
  if (!(supabaseUrl && serviceRoleKey)) {
    throw new Error(
      "SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required when deleting Supabase media"
    );
  }
  const baseUrl = supabaseUrl.replace(TRAILING_SLASH_RE, "");
  const storagePath = objectPath.replace(`${DEFAULT_BUCKET}/`, "");
  const response = await fetch(
    `${baseUrl}/storage/v1/object/${bucket}/remove`,
    {
      method: "POST",
      headers: {
        authorization: `Bearer ${serviceRoleKey}`,
        apikey: serviceRoleKey,
        "content-type": "application/json",
      },
      body: JSON.stringify({ prefixes: [storagePath] }),
    }
  );
  if (!response.ok) {
    throw new Error(`Supabase object delete failed: ${response.status}`);
  }
}

export function localPathFor(objectPath: string): string {
  const root =
    process.env.LOCAL_MEDIA_STORAGE_DIR ||
    path.join(process.cwd(), ".verda-storage");
  const safeParts = objectPath
    .split("/")
    .filter((part) => part && part !== ".." && !part.includes(path.sep));
  return path.join(root, ...safeParts);
}

function signToken(payload: TokenPayload): string {
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `${body}.${signature(body)}`;
}

function verifyToken(token: string): TokenPayload {
  const [body, sig] = token.split(".");
  if (!(body && sig)) {
    throw new Error("Invalid upload token");
  }
  const expected = signature(body);
  if (!safeEqual(sig, expected)) {
    throw new Error("Invalid upload token");
  }
  const payload = JSON.parse(
    Buffer.from(body, "base64url").toString()
  ) as TokenPayload;
  if (payload.exp < Date.now()) {
    throw new Error("Upload token expired");
  }
  return payload;
}

function signature(body: string): string {
  return createHmac(
    "sha256",
    process.env.AUTH_SECRET || "verda-local-media-dev"
  )
    .update(body)
    .digest("base64url");
}

function safeEqual(a: string, b: string): boolean {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  return left.length === right.length && timingSafeEqual(left, right);
}
