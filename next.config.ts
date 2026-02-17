import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-XSS-Protection", value: "1; mode=block" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          // Allow microphone access (used for voice input)
          { key: "Permissions-Policy", value: "camera=(), geolocation=(), microphone=(self)" },
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              // Next.js requires unsafe-inline and unsafe-eval for its runtime scripts
              "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
              // Google Fonts stylesheets + inline styles used by Tailwind
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              // Google Fonts woff2 files
              "font-src 'self' https://fonts.gstatic.com",
              // Images: self, data URIs (base64 avatars), blobs
              "img-src 'self' data: blob:",
              // API calls go to same origin only (Groq called server-side, not from browser)
              "connect-src 'self'",
              // Prevent this page from being embedded in iframes
              "frame-ancestors 'none'",
            ].join("; "),
          },
        ],
      },
    ];
  },
};

export default nextConfig;
