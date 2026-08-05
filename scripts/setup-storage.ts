import "dotenv/config";
import { MAX_UPLOAD_BYTES, STORAGE_BUCKET, supabaseAdmin } from "../lib/storage";

/**
 * Creates the public Storage bucket that holds admin-uploaded images.
 * Idempotent, so it is safe to run against a fresh Supabase project or an
 * existing one. Run with `npm run setup:storage`.
 */
async function main() {
  const { data: buckets, error: listError } =
    await supabaseAdmin.storage.listBuckets();

  if (listError) throw listError;

  if (buckets.some((bucket) => bucket.name === STORAGE_BUCKET)) {
    console.log(`Bucket "${STORAGE_BUCKET}" already exists.`);
    return;
  }

  const { error } = await supabaseAdmin.storage.createBucket(STORAGE_BUCKET, {
    // Public so next/image can fetch the originals. Writes still require the
    // secret key, which only ever lives on the server.
    public: true,
    fileSizeLimit: MAX_UPLOAD_BYTES,
    allowedMimeTypes: ["image/webp"],
  });

  if (error) throw error;

  console.log(`Created public bucket "${STORAGE_BUCKET}".`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
