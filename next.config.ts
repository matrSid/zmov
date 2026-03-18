import withPWA from "next-pwa";
// @ts-ignore
import runtimeCaching from "next-pwa/cache";
import type { NextConfig } from "next";

const baseConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "image.tmdb.org",
        pathname: "/t/p/**",
      },
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
        pathname: "/a/**",
      },
      // ADD THIS:
      {
        protocol: "https",
        hostname: "s4.anilist.co",
      },
    ],
  },
};

const withPWAConfig = withPWA({
  dest: "public",
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === "development",
  runtimeCaching,
});
// @ts-ignore
export default withPWAConfig(baseConfig);