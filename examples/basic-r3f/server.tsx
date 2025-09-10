import { serve } from "bun";

const server = serve({
  port: 3003,
  async fetch(req) {
    const url = new URL(req.url);
    
    // Serve index.html for root
    if (url.pathname === "/" || url.pathname === "/index.html") {
      return new Response(Bun.file("index.html"), {
        headers: { "Content-Type": "text/html" },
      });
    }
    
    // Serve TypeScript/TSX files with transpilation
    if (url.pathname.endsWith(".tsx") || url.pathname.endsWith(".ts")) {
      const file = Bun.file("." + url.pathname);
      const exists = await file.exists();
      
      if (exists) {
        const transpiler = new Bun.Transpiler({
          loader: url.pathname.endsWith(".tsx") ? "tsx" : "ts",
          jsx: "automatic",
        });
        
        const code = await file.text();
        const result = transpiler.transformSync(code);
        
        return new Response(result, {
          headers: { "Content-Type": "application/javascript" },
        });
      }
    }
    
    // Serve static files
    const file = Bun.file("." + url.pathname);
    const exists = await file.exists();
    
    if (exists) {
      return new Response(file);
    }
    
    return new Response("Not Found", { status: 404 });
  },
});

console.log(`🚀 Server running at http://localhost:${server.port}`);
console.log(`📦 XEVA Basic R3F Example`);
console.log(`   Open http://localhost:${server.port} in your browser`);