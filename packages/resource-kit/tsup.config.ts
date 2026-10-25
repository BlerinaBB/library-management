import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm", "cjs"],
  dts: true,
  sourcemap: true,
  clean: true,
  target: "es2020",
  // Peer dependencies are externalized by tsup; listed explicitly so the
  // intent survives config changes. Host apps must provide a single copy.
  external: ["react", "react-dom", "antd", "dayjs", "@refinedev/core"],
});
