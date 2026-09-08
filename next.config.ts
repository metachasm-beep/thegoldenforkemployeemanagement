import type { NextConfig } from "next";

const securityHeaders = [
  // [SECURITY] Prevent clickjacking by disallowing iframes from other origins
  { key: "X-Frame-Options", value: "DENY" },
  // [SECURITY] Prevent MIME type sniffing which can lead to XSS
  { key: "X-Content-Type-Options", value: "nosniff" },
  // [SECURITY] Limit referrer information sent to third parties
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // [SECURITY] Enforce HTTPS for 1 year
  { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" },
  // [SECURITY] Restrict browser features to only what's necessary
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  // [SECURITY] Content Security Policy — allow scripts/styles only from self and Pusher CDN
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.pusher.com",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob: https://*.public.blob.vercel-storage.com https://ui-avatars.com",
      "connect-src 'self' https://*.pusher.com wss://*.pusher.com",
      "font-src 'self'",
      "frame-ancestors 'none'",
    ].join("; "),
  },
];

const nextConfig: NextConfig = {
  reactStrictMode: false,
  output: process.env.BUILD_STANDALONE === "true" ? 'standalone' : undefined,
  async headers() {
    return [
      {
        // Apply security headers to all routes
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        // [SECURITY] Pinned to the specific Vercel blob storage pattern
        // (was a broad wildcard before, now constrained to public blobs only)
        hostname: '**.public.blob.vercel-storage.com',
      },
      {
        protocol: 'https',
        hostname: 'ui-avatars.com',
      }
    ],
  },
};

export default nextConfig;
