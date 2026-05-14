/** @type {import('next').NextConfig} */
const path = require("path");

const nextConfig = {
  transpilePackages: ["@doptor/shared"],
  images: {
    domains: ["ui-avatars.com"],
    dangerouslyAllowSVG: true,
    contentDispositionType: 'attachment',
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
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
