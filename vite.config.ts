import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
let pkg = { version: "0.0.0" };
let buildDate = "";
let buildTime = "";
let gitBranch = "unknown";

try {
  const { readFileSync } = await import("fs");
  const { execSync } = await import("child_process");
  pkg = JSON.parse(readFileSync(new URL("./package.json", import.meta.url), "utf-8"));
  const now = new Date();
  buildDate = now.toLocaleDateString("nl-BE", { day: "2-digit", month: "2-digit", year: "numeric" });
  buildTime = now.toLocaleTimeString("nl-BE", { hour: "2-digit", minute: "2-digit", hour12: false });
  gitBranch = execSync("git rev-parse --abbrev-ref HEAD").toString().trim();
} catch { /* sandbox or CI */ }

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const supabaseUrl = env.VITE_SUPABASE_URL || "https://sjmwmcsuvcgebreubkge.supabase.co";
  const supabasePublishableKey = env.VITE_SUPABASE_PUBLISHABLE_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNqbXdtY3N1dmNnZWJyZXVia2dlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI5OTQ0MzMsImV4cCI6MjA4ODU3MDQzM30.PjCnEO99rZXn6ny3g4jCmpD_cZeWu2dZdqiC4QSnvxc";
  const supabaseProjectId = env.VITE_SUPABASE_PROJECT_ID || "sjmwmcsuvcgebreubkge";

  return {
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
      "import.meta.env.VITE_SUPABASE_URL": JSON.stringify(supabaseUrl),
      "import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY": JSON.stringify(supabasePublishableKey),
      "import.meta.env.VITE_SUPABASE_PROJECT_ID": JSON.stringify(supabaseProjectId),
    },
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
      dedupe: ["react", "react-dom", "react/jsx-runtime"],
    },
  };
});
