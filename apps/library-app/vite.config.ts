import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// No alias to the kit's source: the app resolves @library/resource-kit through
// its package.json "exports", exactly as an external repository would.
export default defineConfig({
  plugins: [react()],
});
