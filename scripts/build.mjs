import * as esbuild from "esbuild";
import { cpSync, mkdirSync } from "node:fs";

const watch = process.argv.includes("--watch");

mkdirSync("dist", { recursive: true });
cpSync("public", "dist", { recursive: true });

// Plus Jakarta Sans (OFL): only the latin + latin-ext upright subsets, with
// the license next to them as the OFL requires.
const fontDir = "node_modules/@fontsource-variable/plus-jakarta-sans";
mkdirSync("dist/fonts", { recursive: true });
for (const subset of ["latin", "latin-ext"]) {
  const file = `plus-jakarta-sans-${subset}-wght-normal.woff2`;
  cpSync(`${fontDir}/files/${file}`, `dist/fonts/${file}`);
}
cpSync(`${fontDir}/LICENSE`, "dist/fonts/OFL.txt");

const options = {
  entryPoints: {
    content: "src/content/index.ts",
    popup: "src/popup/index.ts",
  },
  bundle: true,
  outdir: "dist",
  target: "chrome120",
  format: "iife",
  sourcemap: watch ? "inline" : false,
  logLevel: "info",
};

// CSS is bundled separately so the manifest can inject it at document_start.
const cssOptions = {
  entryPoints: { content: "src/styles/index.css", popup: "src/popup/popup.css" },
  bundle: true,
  outdir: "dist",
  logLevel: "info",
  // Font URLs point into the extension package; esbuild must leave them alone.
  external: ["chrome-extension://*", "/fonts/*"],
};

if (watch) {
  const [js, css] = await Promise.all([esbuild.context(options), esbuild.context(cssOptions)]);
  await Promise.all([js.watch(), css.watch()]);
} else {
  await Promise.all([esbuild.build(options), esbuild.build(cssOptions)]);
}
