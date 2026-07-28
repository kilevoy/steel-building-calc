import { createReadStream, existsSync } from "node:fs";
import { createServer } from "node:http";
import { extname, normalize, resolve } from "node:path";

const root = resolve("dist");
const port = Number(globalThis.process.env.PORT ?? 4181);
const basePath = "/steel-building-calc";

const contentTypes = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".ico": "image/x-icon",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
};

createServer((request, response) => {
  const requestPath = new globalThis.URL(request.url ?? "/", "http://localhost").pathname;
  const relativePath = requestPath.startsWith(`${basePath}/`)
    ? requestPath.slice(basePath.length)
    : requestPath;
  const requestedFile = extname(relativePath) ? relativePath : "/index.html";
  const filePath = resolve(root, `.${normalize(requestedFile)}`);

  if (!filePath.startsWith(root) || !existsSync(filePath)) {
    response.writeHead(404).end("Not found");
    return;
  }

  response.writeHead(200, {
    "content-type": contentTypes[extname(filePath)] ?? "application/octet-stream",
  });
  createReadStream(filePath).pipe(response);
}).listen(port, "127.0.0.1", () => {
  globalThis.console.log(`Serving ${root} at http://127.0.0.1:${port}${basePath}/`);
});
