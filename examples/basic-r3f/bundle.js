// Bundle the entire app into a single file
await Bun.build({
  entrypoints: ["./src/main.tsx"],
  outdir: "./dist",
  target: "browser",
  format: "esm",
  naming: "[name].bundle.js",
  minify: false,
  splitting: false,
  external: [], // Bundle everything
});

// Create standalone HTML
const html = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>XEVA - Basic R3F Example</title>
    <style>
      body {
        margin: 0;
        padding: 0;
        overflow: hidden;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
        background: #111;
      }
      #root {
        width: 100vw;
        height: 100vh;
      }
    </style>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="./main.bundle.js"></script>
  </body>
</html>`;

await Bun.write("./dist/index.html", html);
console.log("✅ Bundle complete!");
console.log("📦 Open dist/index.html in your browser or run:");
console.log("   bunx serve dist");