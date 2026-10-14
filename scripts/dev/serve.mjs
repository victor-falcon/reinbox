// QA harness: serves local Gmail DOM snapshots with the built extension
// injected, so styles can be checked without a logged-in Gmail session.
// The snapshots contain private mail and must never be committed.
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { extname, join, resolve, sep } from "node:path";

const FIXTURES = process.env.REINBOX_FIXTURES ?? "/Users/victor.falcon/Projects/reinbox-fixtures";
const PORT = Number(process.env.PORT ?? 8766);
const DIST = resolve("dist");

const PAGES = {
  "/inbox": "gmail-inbox.html",
  "/conversation": "gmail-conversation.html",
  "/compose": "gmail-compose.html",
};

const TYPES = {
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".json": "application/json",
  ".png": "image/png",
  ".woff2": "font/woff2",
  ".txt": "text/plain; charset=utf-8",
};

function prefsFrom(params) {
  const prefs = {};
  const theme = params.get("theme");
  if (["auto", "light", "dark"].includes(theme)) prefs.theme = theme;
  if (params.get("enabled") === "0") prefs.enabled = false;
  return prefs;
}

async function servePage(res, file, url) {
  // Snapshots keep Gmail's <base href>, so injected URLs must be absolute.
  const origin = `http://${url.host}`;
  const inject = [
    `<link rel="stylesheet" href="${origin}/dist/content.css">`,
    `<script>window.__REINBOX_PREFS__ = ${JSON.stringify(prefsFrom(url.searchParams))};</script>`,
    `<script src="${origin}/dist/content.js"></script>`,
  ].join("");
  const html = await readFile(join(FIXTURES, file), "utf8");
  const i = html.indexOf("</head>");
  res.writeHead(200, { "content-type": TYPES[".html"], "cache-control": "no-store" });
  res.end(i === -1 ? inject + html : html.slice(0, i) + inject + html.slice(i));
}

async function serveDist(res, pathname) {
  const file = resolve(DIST, decodeURIComponent(pathname.slice("/dist/".length)));
  if (!file.startsWith(DIST + sep)) return notFound(res);
  let body = await readFile(file);
  // Font URLs use the extension origin; point them at dist/ instead.
  if (extname(file) === ".css") {
    body = body.toString("utf8").replaceAll("chrome-extension://__MSG_@@extension_id__/", "/dist/");
  }
  res.writeHead(200, { "content-type": TYPES[extname(file)] ?? "application/octet-stream", "cache-control": "no-store" });
  res.end(body);
}

function notFound(res) {
  res.writeHead(404, { "content-type": "text/plain" });
  res.end("Not found");
}

function index(res) {
  const links = Object.keys(PAGES)
    .flatMap((p) => ["light", "dark", "auto"].map((t) => `<li><a href="${p}?theme=${t}">${p}?theme=${t}</a></li>`))
    .concat(Object.keys(PAGES).map((p) => `<li><a href="${p}?enabled=0">${p}?enabled=0</a></li>`));
  res.writeHead(200, { "content-type": TYPES[".html"] });
  res.end(`<!doctype html><title>Reinbox preview</title><ul>${links.join("")}</ul>`);
}

createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  try {
    if (url.pathname === "/") return index(res);
    if (PAGES[url.pathname]) return await servePage(res, PAGES[url.pathname], url);
    if (url.pathname.startsWith("/dist/")) return await serveDist(res, url.pathname);
    notFound(res);
  } catch (error) {
    if (error.code === "ENOENT") return notFound(res);
    res.writeHead(500, { "content-type": "text/plain" });
    res.end(String(error));
  }
}).listen(PORT, () => {
  console.log(`Reinbox preview on http://localhost:${PORT} (fixtures: ${FIXTURES})`);
});
