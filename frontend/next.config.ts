/* eslint-disable @typescript-eslint/no-explicit-any */
import type { NextConfig } from "next";

// Extend NextConfig to allow webpackDevMiddleware (some Next versions' types omit it)
type NextConfigWithWebpackDevMiddleware = NextConfig & {
  webpackDevMiddleware?: (config: any) => any;
};

const nextConfig: NextConfigWithWebpackDevMiddleware = {
  webpackDevMiddleware: (config: any) => {
    // defensive check - only modify if object is present
    if (config && typeof config === "object") {
      config.watchOptions = {
        poll: 1000,
        aggregateTimeout: 300,
      };
    }
    return config;
  },
};

export default nextConfig;
