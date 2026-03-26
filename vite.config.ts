import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { readFileSync } from "fs";
import { execSync } from "child_process";

const pkg = JSON.parse(readFileSync(new URL("./package.json", import.meta.url), "utf-8"));

// Build metadata: version + date/time + branch
const now = new Date();
const buildDate = now.toLocaleDateString("nl-BE", { day: "2-digit", month: "2-digit", year: "numeric" });
const buildTime = now.toLocaleTimeString("nl-BE", { hour: "2-digit", minute: "2-digit", hour12: false });
let gitBranch = "unknown";
try {
  gitBranch = execSync("git rev-parse --abbrev-ref HEAD").toString().trim();
} catch { /* CI or no git */ }

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version),
    __BUILD_DATE__: JSON.stringify(buildDate),
    __BUILD_TIME__: JSON.stringify(buildTime),
    __GIT_BRANCH__: JSON.stringify(gitBranch),
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
    dedupe: ["react", "react-dom", "react/jsx-runtime"],
  },
}));
