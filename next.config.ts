import type { NextConfig } from "next";

const supabaseHostname = process.env.NEXT_PUBLIC_SUPABASE_URL
  ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname
  : undefined;

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      // Admin image uploads go through a Server Action, and the default 1 MB
      // body limit rejects anything straight off a phone camera. lib/storage.ts
      // caps the accepted file at 12 MB.
      bodySizeLimit: "16mb",
    },
  },
  images: {
    // Admin-uploaded images live in a public Supabase Storage bucket.
    remotePatterns: supabaseHostname
      ? [
          {
            protocol: "https",
            hostname: supabaseHostname,
            pathname: "/storage/v1/object/public/**",
          },
        ]
      : [],
  },
};

export default nextConfig;
