import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // The dev badge sits over the bottom-left registration mark in screenshots.
  devIndicators: false,
  // Member records are personal data about minors. Nothing about this site
  // should be indexed or cached by an intermediary.
  poweredByHeader: false,
  // components/Logo.tsx reads the brand SVGs from public/brand/ at runtime, so
  // they have to be traced into the serverless bundle.
  outputFileTracingIncludes: { "/**": ["./public/brand/*.svg"] },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "same-origin" },
          { key: "X-Frame-Options", value: "DENY" },
        ],
      },
      {
        source: "/admin/:path*",
        headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow, noarchive" }],
      },
    ];
  },
};

export default nextConfig;
