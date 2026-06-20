import "./lib/error-capture";

import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { Readable } from "node:stream";
import { createReadStream, existsSync, statSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join, normalize, sep } from "node:path";

type ServerEntry = {
  fetch: (request: Request, env?: unknown, ctx?: unknown) => Promise<Response> | Response;
};

const __dirname = dirname(fileURLToPath(import.meta.url));
// dist/server/server.node.js -> ../client
const CLIENT_DIR = join(__dirname, "..", "client");

const MIME_TYPES: Record<string, string> = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".map": "application/json; charset=utf-8",
  ".txt": "text/plain; charset=utf-8",
  ".xml": "application/xml; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".avif": "image/avif",
  ".ico": "image/x-icon",
  ".mp4": "video/mp4",
  ".webm": "video/webm",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".ttf": "font/ttf",
  ".otf": "font/otf",
  ".eot": "application/vnd.ms-fontobject",
  ".wasm": "application/wasm",
  ".pdf": "application/pdf",
};

function mimeFor(filePath: string): string {
  const dot = filePath.lastIndexOf(".");
  const ext = dot === -1 ? "" : filePath.slice(dot).toLowerCase();
  return MIME_TYPES[ext] ?? "application/octet-stream";
}

// Resolve a URL pathname to a safe absolute path inside CLIENT_DIR.
// Returns null on any traversal attempt or invalid encoding.
function resolveStaticPath(pathname: string): string | null {
  let decoded: string;
  try {
    decoded = decodeURIComponent(pathname);
  } catch {
    return null;
  }
  if (decoded.includes("\0")) return null;

  // Normalize and strip leading slashes so join keeps us inside CLIENT_DIR.
  const relative = normalize(decoded).replace(/^(\.\.(\/|\\|$))+/, "").replace(/^[/\\]+/, "");
  const candidate = join(CLIENT_DIR, relative);

  // Final containment check.
  const base = CLIENT_DIR.endsWith(sep) ? CLIENT_DIR : CLIENT_DIR + sep;
  if (candidate !== CLIENT_DIR && !candidate.startsWith(base)) return null;

  return candidate;
}

function parseRangeHeader(rangeHeader: string | undefined, size: number) {
  if (!rangeHeader?.startsWith("bytes=")) return null;
  const [startRaw, endRaw] = rangeHeader.replace("bytes=", "").split("-");

  let start = startRaw ? Number.parseInt(startRaw, 10) : Number.NaN;
  let end = endRaw ? Number.parseInt(endRaw, 10) : Number.NaN;

  if (Number.isNaN(start) && Number.isNaN(end)) return null;
  if (Number.isNaN(start)) {
    const suffixLength = end;
    start = Math.max(size - suffixLength, 0);
    end = size - 1;
  } else if (Number.isNaN(end)) {
    end = size - 1;
  }

  if (start < 0 || end >= size || start > end) return null;
  return { start, end };
}

function tryServeStatic(req: IncomingMessage, res: ServerResponse, pathname: string): boolean {
  const method = req.method ?? "GET";
  if (method !== "GET" && method !== "HEAD") return false;
  if (pathname === "/" || pathname.endsWith("/")) return false;

  const filePath = resolveStaticPath(pathname);
  if (!filePath) {
    res.statusCode = 400;
    res.end("Bad Request");
    return true;
  }

  if (!existsSync(filePath)) return false;
  const stat = statSync(filePath);
  if (!stat.isFile()) return false;

  // Content-hashed assets (Vite emits them under /assets/) can be cached forever.
  const isHashedAsset = pathname.startsWith("/assets/");
  const cacheControl = isHashedAsset
    ? "public, max-age=31536000, immutable"
    : "public, max-age=3600";

  const range = parseRangeHeader(req.headers.range, stat.size);

  if (req.headers.range && !range) {
    res.statusCode = 416;
    res.setHeader("Content-Range", `bytes */${stat.size}`);
    res.end();
    return true;
  }

  res.statusCode = range ? 206 : 200;
  res.setHeader("Content-Type", mimeFor(filePath));
  res.setHeader("Accept-Ranges", "bytes");
  res.setHeader("Content-Length", String(range ? range.end - range.start + 1 : stat.size));
  res.setHeader("Cache-Control", cacheControl);
  if (range) {
    res.setHeader("Content-Range", `bytes ${range.start}-${range.end}/${stat.size}`);
  }

  if (method === "HEAD") {
    res.end();
    return true;
  }

  const stream = createReadStream(filePath, range ? { start: range.start, end: range.end } : undefined);
  stream.on("error", () => {
    if (!res.headersSent) res.statusCode = 500;
    res.end();
  });
  stream.pipe(res);
  return true;
}

function nodeRequestToWebRequest(req: IncomingMessage): Request {
  const host = req.headers.host ?? "localhost";
  const protocol = (req.headers["x-forwarded-proto"] as string | undefined)?.split(",")[0] ?? "http";
  const url = `${protocol}://${host}${req.url ?? "/"}`;

  const headers = new Headers();
  for (const [key, value] of Object.entries(req.headers)) {
    if (value === undefined) continue;
    if (Array.isArray(value)) {
      for (const v of value) headers.append(key, v);
    } else {
      headers.set(key, value);
    }
  }

  const method = req.method ?? "GET";
  const hasBody = method !== "GET" && method !== "HEAD";

  const init: RequestInit & { duplex?: "half" } = { method, headers };
  if (hasBody) {
    init.body = Readable.toWeb(req) as unknown as ReadableStream;
    init.duplex = "half";
  }

  return new Request(url, init);
}

async function sendWebResponse(res: ServerResponse, response: Response): Promise<void> {
  res.statusCode = response.status;
  response.headers.forEach((value, key) => {
    res.setHeader(key, value);
  });

  if (!response.body) {
    res.end();
    return;
  }

  const nodeStream = Readable.fromWeb(response.body as unknown as Parameters<typeof Readable.fromWeb>[0]);
  nodeStream.on("error", () => {
    if (!res.headersSent) res.statusCode = 500;
    res.end();
  });
  nodeStream.pipe(res);
}

async function main() {
  const mod = (await import("@tanstack/react-start/server-entry")) as unknown as {
    default?: ServerEntry;
  } & ServerEntry;
  const handler: ServerEntry = (mod.default ?? mod) as ServerEntry;

  const PORT = Number(process.env.PORT) || 3006;
  const HOST = "0.0.0.0";

  const server = createServer(async (req, res) => {
    try {
      const pathname = (req.url ?? "/").split("?")[0];

      // 1) Static assets from dist/client (with traversal protection).
      if (tryServeStatic(req, res, pathname)) return;

      // 2) SSR fallback for every route handled by TanStack Start.
      const request = nodeRequestToWebRequest(req);
      const response = await handler.fetch(request);
      await sendWebResponse(res, response);
    } catch (error) {
      console.error("[server.node] request failed", error);
      if (!res.headersSent) {
        res.statusCode = 500;
        res.setHeader("Content-Type", "text/plain; charset=utf-8");
      }
      res.end("Internal Server Error");
    }
  });

  server.listen(PORT, HOST, () => {
    console.log(`[server.node] SSR server listening on http://${HOST}:${PORT}`);
  });
}

main().catch((error) => {
  console.error("[server.node] failed to start", error);
  process.exit(1);
});
