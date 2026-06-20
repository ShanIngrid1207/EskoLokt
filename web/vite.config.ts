import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Client-rendered SPA — Freighter (a browser extension) only works in the browser,
// so there is no SSR here and no need for "use client" guards.
export default defineConfig({
  // Project is served from https://<user>.github.io/CodLock/, so assets must
  // resolve under that sub-path. Use "/" locally (npm run dev) and "/CodLock/" in CI.
  base: (globalThis as { process?: { env?: Record<string, string | undefined> } }).process?.env
    ?.GITHUB_ACTIONS
    ? "/CodLock/"
    : "/",
  plugins: [react()],
});
