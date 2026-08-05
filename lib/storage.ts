import { createClient } from "@supabase/supabase-js";
import sharp from "sharp";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const secretKey = process.env.SUPABASE_SECRET_KEY;

export const STORAGE_BUCKET = process.env.SUPABASE_STORAGE_BUCKET ?? "site-images";

if (!supabaseUrl || !secretKey) {
  throw new Error(
    "NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SECRET_KEY must be set.",
  );
}

/**
 * Server-only Supabase client. The secret key bypasses row level security, so
 * this module must never be imported from a Client Component.
 */
export const supabaseAdmin = createClient(supabaseUrl, secretKey, {
  auth: { persistSession: false },
});

export const MAX_UPLOAD_BYTES = 12 * 1024 * 1024;

const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/avif"];

export type UploadResult = { url: string } | { error: string };

/**
 * Compresses an uploaded image and stores it in Supabase Storage.
 *
 * Everything is re-encoded to WebP at a capped width. That is a large size win
 * over the originals a phone or camera produces, and WebP at quality 82 is
 * visually indistinguishable at these dimensions.
 */
export async function uploadImage(
  file: File,
  folder: string,
  maxWidth = 2400,
): Promise<UploadResult> {
  if (file.size === 0) {
    return { error: "The selected file is empty." };
  }

  if (file.size > MAX_UPLOAD_BYTES) {
    return { error: "Images must be smaller than 12 MB." };
  }

  if (!ACCEPTED_TYPES.includes(file.type)) {
    return { error: "Use a JPEG, PNG, WebP or AVIF image." };
  }

  let compressed: Buffer;

  try {
    compressed = await sharp(Buffer.from(await file.arrayBuffer()))
      .rotate() // honour EXIF orientation before resizing
      .resize({ width: maxWidth, withoutEnlargement: true })
      .webp({ quality: 82 })
      .toBuffer();
  } catch {
    return { error: "That file could not be read as an image." };
  }

  const path = `${folder}/${crypto.randomUUID()}.webp`;

  const { error } = await supabaseAdmin.storage
    .from(STORAGE_BUCKET)
    .upload(path, compressed, { contentType: "image/webp" });

  if (error) {
    return { error: `Upload failed: ${error.message}` };
  }

  const { data } = supabaseAdmin.storage.from(STORAGE_BUCKET).getPublicUrl(path);

  return { url: data.publicUrl };
}
