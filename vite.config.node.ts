// vite.config.node.ts
//
// Production build config for self-hosted Node SSR (VPS / CloudPanel + PM2).
// Build with:  npm run build:vps  ->  vite build --config vite.config.node.ts
//
// Differences from the default vite.config.ts (Lovable Cloud / Cloudflare):
//   - nitro: false  -> no Cloudflare Worker bundling; plain Node-friendly output
//   - custom server entry "server.node" -> src/server.node.ts (a real http server)
//
// Output layout:
//   dist/server/server.node.js   (entry, run by `npm run start`)
//   dist/server/assets/*         (SSR chunks)
//   dist/client/*                (static client assets served by server.node.js)
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

export default defineConfig({
  // Disable the Cloudflare/Nitro deploy plugin for self-hosted Node builds.
  nitro: false,
  tanstackStart: {
    // Use src/server.node.ts as the server entry instead of src/server.ts.
    server: { entry: "server.node" },
  },
});
