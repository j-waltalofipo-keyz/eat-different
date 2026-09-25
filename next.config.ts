import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Dish photos uploaded from /admin live on Square's image hosts (menu-admin.md).
    remotePatterns: [
      { protocol: "https", hostname: "items-images-production.s3.us-west-2.amazonaws.com", pathname: "/files/**" },
      { protocol: "https", hostname: "items-images-sandbox.s3.us-west-2.amazonaws.com", pathname: "/files/**" },
    ],
  },
  experimental: {
    // Phone photos are shrunk in the browser first; this is headroom for the multipart overhead (menu-admin.md).
    serverActions: { bodySizeLimit: "5mb" },
  },
  async headers() {
    return [
      {
        // The URL holds a bearer token that unlocks the pickup address (Invariant 3).
        source: "/order/:token*",
        headers: [
          { key: "Referrer-Policy", value: "no-referrer" },
          { key: "X-Robots-Tag", value: "noindex, nofollow" },
        ],
      },
    ];
  },
};

export default nextConfig;
