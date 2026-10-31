import { db, json } from "../../_lib/auth.js";
import { requireAdmin } from "../../_lib/admin.js";

const MAX_FILE_BYTES = 10 * 1024 * 1024;
const MAX_FILES = 8;
const MEDIA_TYPES = new Map([
  ["image/jpeg", { extension: "jpg", kind: "image", signature: (b) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff }],
  ["image/png", { extension: "png", kind: "image", signature: (b) => b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47 && b[4] === 0x0d && b[5] === 0x0a && b[6] === 0x1a && b[7] === 0x0a }],
  ["image/webp", { extension: "webp", kind: "image", signature: (b) => String.fromCharCode(...b.slice(0, 4)) === "RIFF" && String.fromCharCode(...b.slice(8, 12)) === "WEBP" }],
  ["image/avif", { extension: "avif", kind: "image", signature: (b) => String.fromCharCode(...b.slice(4, 8)) === "ftyp" && ["avif", "avis"].includes(String.fromCharCode(...b.slice(8, 12))) }],
  ["video/mp4", { extension: "mp4", kind: "video", signature: (b) => String.fromCharCode(...b.slice(4, 8)) === "ftyp" }],
  ["video/webm", { extension: "webm", kind: "video", signature: (b) => b[0] === 0x1a && b[1] === 0x45 && b[2] === 0xdf && b[3] === 0xa3 }],
]);

export async function onRequestPost({ request, env }) {
  const admin = await requireAdmin(request, env);
  if (admin instanceof Response) return admin;
  if (!env.FILES) return json({ error: "Media storage is unavailable." }, 503);

  const form = await request.formData().catch(() => null);
  if (!form) return json({ error: "Expected a multipart media upload." }, 400);
  const purpose = String(form.get("purpose") || "");
  const files = form.getAll("files").filter((file) => file && typeof file !== "string");
  if (!files.length) return json({ error: "Choose at least one media file." }, 400);
  if (files.length > MAX_FILES) return json({ error: `Upload no more than ${MAX_FILES} files at once.` }, 400);
  if (files.some((file) => file.size > MAX_FILE_BYTES)) return json({ error: "Each media file must be 10 MB or smaller." }, 400);

  const uploaded = [];
  try {
    for (const file of files) {
      const media = MEDIA_TYPES.get(file.type);
      if (!media) throw new Error("Only JPEG, PNG, WebP, AVIF, MP4 and WebM files are allowed.");
      if (media.kind === "video" && purpose !== "hero") throw new Error("Video uploads are only available for the home hero.");
      const header = new Uint8Array(await file.slice(0, 16).arrayBuffer());
      if (!media.signature(header)) throw new Error(`${file.name || "File"} does not match its declared media type.`);

      const key = `cms/${crypto.randomUUID()}.${media.extension}`;
      await env.FILES.put(key, file.stream(), { httpMetadata: { contentType: file.type } });
      uploaded.push({ key, mime: file.type, size: file.size, alt: file.name || "" });
    }

    const sql = db(env);
    await sql.transaction(uploaded.map((file) => sql`INSERT INTO media (r2_key, kind, mime, size_bytes, alt, uploaded_by)
      VALUES (${file.key}, 'content', ${file.mime}, ${file.size}, ${file.alt}, ${admin.userId})`));
    return json({ files: uploaded.map((file) => ({
      key: file.key,
      url: `/api/files/${file.key.split("/").map(encodeURIComponent).join("/")}`,
      mime: file.mime,
      size: file.size,
    })) }, 201);
  } catch (error) {
    await Promise.all(uploaded.map((file) => env.FILES.delete(file.key).catch(() => undefined)));
    console.error("CMS media upload failed", error);
    return json({ error: error instanceof Error ? error.message : "Media upload failed." }, 400);
  }
}
