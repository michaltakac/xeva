import { build } from "bun";

await build({
  entrypoints: ["./src/App.tsx"],
  outdir: "./dist",
  target: "browser",
  format: "esm",
  splitting: false,
  sourcemap: "external",
  minify: false,
});

console.log("✅ Build complete! Files in ./dist/");