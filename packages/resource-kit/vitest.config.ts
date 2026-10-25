import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    // Story interaction tests import stories, which import the package by its public name.
    alias: { "@library/resource-kit": fileURLToPath(new URL("./src/index.ts", import.meta.url)) },
  },
  test: {
    environment: "node",
    include: ["test/**/*.test.{ts,tsx}"],
    setupFiles: ["test/setup.ts"],
    // Interaction tests drive Ant Design popups and drawers in jsdom; give them headroom.
    testTimeout: 60_000,
  },
});
