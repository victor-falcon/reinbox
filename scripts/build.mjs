import * as esbuild from "esbuild";
import { cpSync, mkdirSync } from "node:fs";

const watch = process.argv.includes("--watch");

mkdirSync("dist", { recursive: true });
cpSync("public", "dist", { recursive: true });

const options = {
  entryPoints: {
    content: "src/content/index.ts",
  },
  bundle: true,
  outdir: "dist",
  target: "chrome120",
  format: "iife",
  sourcemap: watch ? "inline" : false,
  logLevel: "info",
  loader: { ".css": "css" },
};

// CSS is bundled separately so the manifest can inject it at document_start.
const cssOptions = {
  entryPoints: { content: "src/styles/index.css" },
  bundle: true,
  outdir: "dist",
  logLevel: "info",
};

if (watch) {
  const [js, css] = await Promise.all([esbuild.context(options), esbuild.context(cssOptions)]);
  await Promise.all([js.watch(), css.watch()]);
} else {
  await Promise.all([esbuild.build(options), esbuild.build(cssOptions)]);
}
