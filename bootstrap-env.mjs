// bootstrap-env.mjs
//
// Loaded BEFORE any application code via:
//   node --import ./bootstrap-env.mjs dist/server/server.node.js
//
// Purpose: populate process.env from .env and .env.production on the VPS,
// WITHOUT overriding variables already set by the shell / PM2 / CloudPanel.
// This runs only in the production Node runtime — it is never bundled into
// the client or the Lovable Cloud Worker.

import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import dotenv from "dotenv";

const __dirname = dirname(fileURLToPath(import.meta.url));

// Load order: .env first (base), then .env.production (overrides base values
// that were NOT already present in the real environment). `override: false`
// guarantees real shell/PM2 env vars always win.
const candidates = [".env", ".env.production"];

for (const file of candidates) {
  const fullPath = resolve(__dirname, file);
  if (existsSync(fullPath)) {
    dotenv.config({ path: fullPath, override: false });
    console.log(`[bootstrap-env] loaded ${file}`);
  } else {
    console.log(`[bootstrap-env] skipped ${file} (not found)`);
  }
}

// Log presence (never values) of the main env vars so deploys are debuggable.
const watched = [
  "NODE_ENV",
  "PORT",
  "SUPABASE_URL",
  "SUPABASE_PUBLISHABLE_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
  "VITE_SUPABASE_URL",
  "VITE_SUPABASE_PUBLISHABLE_KEY",
  "VITE_SUPABASE_PROJECT_ID",
];

const status = watched
  .map((key) => `${key}=${process.env[key] ? "set" : "MISSING"}`)
  .join("  ");

console.log(`[bootstrap-env] ${status}`);
