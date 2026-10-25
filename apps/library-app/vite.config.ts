import react from "@vitejs/plugin-react";
import { fileURLToPath } from "node:url";
import { defineConfig, loadEnv } from "vite";

// Environment files live at the repository root, shared with the fake API.
const envDir = fileURLToPath(new URL("../..", import.meta.url));

// No alias to the kit's source: the app resolves @library/resource-kit through
// its package.json "exports", exactly as an external repository would.
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, envDir, "");
  const apiPort = env.API_PORT ?? "3001";
  return {
    envDir,
    plugins: [react()],
    server: {
      port: Number(env.APP_PORT ?? 5173),
      strictPort: true,
      proxy: { "/api": `http://localhost:${apiPort}` },
    },
  };
});
