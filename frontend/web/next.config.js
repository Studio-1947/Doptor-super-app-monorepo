/** @type {import('next').NextConfig} */
const path = require("path");

const nextConfig = {
  transpilePackages: ["@doptor/shared"],
  images: {
    domains: ["ui-avatars.com"],
  },
};

module.exports = nextConfig;
