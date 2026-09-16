import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";

// __dirname doesn't exist in native ESM — this is the standard replacement:
// derive this config file's own directory from its module URL.
const __dirname = path.dirname(fileURLToPath(import.meta.url));

function srcPath(subdir: string): string {
  return path.join(__dirname, "src", subdir);
}

export default defineConfig({
  resolve: {
    alias: {
      "@": srcPath("."),
    },
  },
});
