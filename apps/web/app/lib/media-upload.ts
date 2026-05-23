export interface MediaUploadResult {
  alt: string;
  createdAt: string;
  filename: string;
  id: string;
  mimeType: string;
  url: string;
}

interface SignedUploadResponse {
  method: "PUT";
  path: string;
  provider: string;
  publicUrl: string;
  uploadUrl: string;
}

const EXT_RE = /\.[^.]+$/;

export async function uploadMediaAsset(
  file: File,
  role: string
): Promise<MediaUploadResult> {
  const alt = file.name.replace(EXT_RE, "");
  const signRes = await fetch("/api/cms/media/sign", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-cms-role": role,
    },
    body: JSON.stringify({ filename: file.name, mimeType: file.type }),
  });
  if (!signRes.ok) {
    throw new Error("Could not sign media upload");
  }
  const signed = (await signRes.json()) as SignedUploadResponse;

  const uploadRes = await fetch(signed.uploadUrl, {
    method: signed.method,
    headers: { "content-type": file.type },
    body: file,
  });
  if (!uploadRes.ok) {
    throw new Error("Could not upload media asset");
  }

  const metadataRes = await fetch("/api/cms/media", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-cms-role": role,
    },
    body: JSON.stringify({
      alt,
      filename: file.name,
      mimeType: file.type,
      path: signed.path,
      provider: signed.provider,
      url: signed.publicUrl,
    }),
  });
  if (!metadataRes.ok) {
    throw new Error("Could not record media metadata");
  }
  return (await metadataRes.json()) as MediaUploadResult;
}
