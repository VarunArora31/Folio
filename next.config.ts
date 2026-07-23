import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Fix Turbopack bundling issues with yjs and related packages
  transpilePackages: ["yjs", "y-websocket", "y-protocols", "lib0", "@tiptap/y-tiptap"],
  // Disable React StrictMode — it double-invokes effects in dev which
  // causes two WebSocket connections and auth failures on the second one
  reactStrictMode: false,
};

export default nextConfig;
