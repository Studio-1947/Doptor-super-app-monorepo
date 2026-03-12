/** @type {import('next').NextConfig} */
const path = require("path");

const nextConfig = {
  transpilePackages: ["@doptor/shared"],
  images: {
    domains: ["ui-avatars.com"],
  },
  // Output as standalone to avoid static generation issues with React Context
  output: "standalone",
  // Allow build to continue even if some pages fail during static generation
  experimental: {
    missingSuspenseWithCSRBailout: false,
  },
  staticPageGenerationTimeout: 120,
};

module.exports = nextConfig;
