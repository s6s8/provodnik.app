import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  // Turbopack uses bundled CA roots by default; Google Fonts fetches during
  // `next build` can fail on networks with custom/system CAs (Windows).
  // See `ExperimentalConfig.turbopackUseSystemTlsCerts` in Next.js types.
  experimental: {
    turbopackUseSystemTlsCerts: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
    ],
  },
};

export default nextConfig;
