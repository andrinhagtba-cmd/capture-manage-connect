import "./lib/error-capture";
import { createServer } from "node:http";

type ServerEntry = {
  fetch: (request: Request, env?: unknown, ctx?: unknown) => Promise<Response> | Response;
};

async function main() {
  const mod: any = await import("@tanstack/react-start/server-entry");
  const handler: ServerEntry = (mod.default ?? mod) as ServerEntry;
  const PORT = Number(process.env.PORT) || 3006;
  const server = createServer(async (req, res) => {
    const url = `http://${req.headers.host}${req.url}`;
    const request = new Request(url, { method: req.method });
    const response = await handler.fetch(request);
    res.statusCode = response.status;
    res.end(await response.text());
  });
  server.listen(PORT, "0.0.0.0", () => console.log("listening", PORT));
}
main();
