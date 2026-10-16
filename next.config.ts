import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // jobs.json is read with fs at runtime by dynamic routes; make sure Vercel bundles it.
  outputFileTracingIncludes: { "/**": ["./data/jobs.json"] },
};

export default nextConfig;
