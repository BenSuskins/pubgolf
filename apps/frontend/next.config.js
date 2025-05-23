const { configureRuntimeEnv } = require('next-runtime-env/build/configure');

configureRuntimeEnv();

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: "standalone",
};

module.exports = nextConfig;