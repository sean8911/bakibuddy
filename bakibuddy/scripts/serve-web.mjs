import { createServer } from "node:http";
import { createReadStream, existsSync, statSync } from "node:fs";
import path from "node:path";
const root = path.resolve("dist");
const types = {
  ".js": "text/javascript",
  ".wasm": "application/wasm",
  ".html": "text/html; charset=utf-8",
  ".css": "text/css",
  ".json": "application/json",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".ttf": "font/ttf",
};
const port = Number(process.env.PORT ?? 8082);
createServer((request, response) => {
  response.setHeader("Cross-Origin-Opener-Policy", "same-origin");
  response.setHeader("Cross-Origin-Embedder-Policy", "credentialless");
  response.setHeader("Cache-Control", "no-store");
  let pathname;
  try {
    pathname = decodeURIComponent(
      new URL(request.url ?? "/", "http://localhost").pathname,
    );
  } catch {
    response.writeHead(400).end();
    return;
  }
  const candidate = path.resolve(root, "." + pathname);
  if (candidate !== root && !candidate.startsWith(root + path.sep)) {
    response.writeHead(403).end();
    return;
  }
  const choices = [
    candidate,
    candidate + ".html",
    path.join(candidate, "index.html"),
  ];
  let file = choices.find(
    (item) => existsSync(item) && statSync(item).isFile(),
  );
  // Dynamic Expo routes resolve client-side from the root shell on a clean URL.
  if (!file && !path.extname(pathname)) file = path.join(root, "index.html");
  if (!file || !existsSync(file)) {
    response.writeHead(404).end("Not found");
    return;
  }
  response.setHeader(
    "Content-Type",
    types[path.extname(file)] ?? "application/octet-stream",
  );
  createReadStream(file).pipe(response);
}).listen(port, "127.0.0.1", () =>
  process.stdout.write(
    `BakiBuddy local SQLite web preview: http://localhost:${port}\n`,
  ),
);
