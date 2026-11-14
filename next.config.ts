import type { NextConfig } from "next";
const config: NextConfig = {
  output: "standalone", poweredByHeader: false,
  outputFileTracingIncludes: { "/*": ["./content/**/*.json", "./eval/results.json", "./docs/reference/vectors.json"] },
};
export default config;
