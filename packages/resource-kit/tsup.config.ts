import { defineConfig } from "tsup";

export default defineConfig((options) => ({
  entry: ["src/index.ts"],
  format: ["esm", "cjs"],
  dts: true,
  sourcemap: true,
  // In watch mode, keep the previous output in place so the app's dev server never
  // sees an empty dist folder mid-rebuild.
  clean: !options.watch,
  target: "es2020",
  // Peer dependencies are externalized by tsup; listed explicitly so the
  // intent survives config changes. Host apps must provide a single copy.
  external: ["react", "react-dom", "antd", "dayjs", "@refinedev/core"],
}));
