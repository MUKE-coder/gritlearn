import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  reactStrictMode: true,
  transpilePackages: ["@repo/shared"],
  // Uncomment and run "ANALYZE=true pnpm build" to inspect the bundle
  // ...(process.env.ANALYZE === "true"
  //   ? { ...require("@next/bundle-analyzer")({ enabled: true })(nextConfig) }
  //   : {}),
};

export default nextConfig;
