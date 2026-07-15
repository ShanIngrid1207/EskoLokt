import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Client-rendered SPA — Freighter (a browser extension) only works in the browser,
// so there is no SSR here and no need for "use client" guards.
export default defineConfig({
  // GitHub Pages serves this repo under the "/EskoLokt/" sub-path, so assets
  // must be prefixed there. Anywhere else (local dev, or a root-domain host
  // like Vercel) keeps "/". GITHUB_ACTIONS is set only in the Pages build.
  base: process.env.GITHUB_ACTIONS ? "/EskoLokt/" : "/",
  // StellarWalletsKit / stellar-sdk reference Node's `global` in the browser bundle.
  define: { global: "globalThis" },
  plugins: [react()],
});
