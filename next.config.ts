import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      allowedOrigins: [
        "localhost:3000",
        "z0xqsss1-3000.inc1.devtunnels.ms",
      ],
    },
  },

  serverExternalPackages: [
    "@sparticuz/chromium",
    "puppeteer-core",
  ],

  outputFileTracingIncludes: {
    "/api/**/*": [
      "./node_modules/@sparticuz/chromium/bin/**",
    ],
  },
};

export default nextConfig;