import type { NextConfig } from "next";
import path from "node:path";

const isDev = process.env.NODE_ENV !== "production";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["127.0.0.1", "localhost"],
  turbopack: {
    root: path.join(__dirname)
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "api.qrserver.com" },
      { protocol: "https", hostname: "pixabay.com" },
      { protocol: "https", hostname: "cdn.pixabay.com" },
      { protocol: "https", hostname: "upload.wikimedia.org" },
      { protocol: "https", hostname: "picsum.photos" }
    ]
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(self), geolocation=()" },
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              "img-src 'self' data: https:",
              "media-src 'self' blob: data:",
              "style-src 'self' 'unsafe-inline'",
              `script-src 'self' 'unsafe-inline' https://t1.kakaocdn.net${isDev ? " 'unsafe-eval'" : ""}`,
              "font-src 'self' https://fonts.gstatic.com",
              "connect-src 'self' https://api.openai.com https://*.supabase.co https://api.resend.com https://kapi.kakao.com https://kauth.kakao.com",
              "frame-src 'self' https://chathub.studiobyyou.kr http://localhost:3102 http://127.0.0.1:3102",
              "frame-ancestors 'none'",
              "base-uri 'self'",
              "form-action 'self' https://sharer.kakao.com"
            ].join("; ")
          }
        ]
      }
    ];
  }
};

export default nextConfig;
