import { promises as fs } from "fs";
import path from "path";

const DOCS_DIR = path.resolve(process.cwd(), "docs");

async function extractTitle(filePath, fallback) {
  try {
    const content = await fs.readFile(filePath, "utf8");
    const lines = content.split(/\r?\n/);
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.startsWith("#")) {
        const text = trimmed.replace(/^#+\s*/, "").trim();
        if (text.length > 0) return text;
      }
    }
  } catch (error) {
    console.warn(`[xreva-docs] Failed to read ${filePath}:`, error);
  }
  return fallback;
}

function toSlug(name) {
  if (name.toLowerCase() === "readme.md") {
    return "home";
  }
  return name
    .replace(/\.md$/, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function toTitle(slug) {
  return slug
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

async function main() {
  const entries = await fs.readdir(DOCS_DIR);
  const manifest = [];

  for (const entry of entries) {
    if (!entry.toLowerCase().endsWith(".md")) continue;
    if (entry.toLowerCase() === "index.md") continue;

    const filePath = path.join(DOCS_DIR, entry);
    const id = toSlug(entry);
    const fallbackTitle = toTitle(id);
    const title = await extractTitle(filePath, fallbackTitle);

    manifest.push({ id, file: entry, title });
  }

  manifest.sort((a, b) => {
    if (a.id === "home") return -1;
    if (b.id === "home") return 1;
    return a.title.localeCompare(b.title);
  });

  const outputPath = path.join(DOCS_DIR, "pages.json");
  await fs.writeFile(outputPath, JSON.stringify(manifest, null, 2), "utf8");
  console.log(`[xreva-docs] Wrote manifest with ${manifest.length} entries to ${outputPath}`);
}

main().catch((error) => {
  console.error("[xreva-docs] Failed to generate manifest", error);
  process.exit(1);
});
