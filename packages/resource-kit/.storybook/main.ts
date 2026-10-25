import type { StorybookConfig } from "@storybook/react-vite";
import { fileURLToPath } from "node:url";
import { mergeConfig } from "vite";

// Stories import the package by its public name. The alias points that name at the
// public entry (src/index.ts) so Storybook needs no build step and prop tables are
// generated from source. Private paths stay unreachable: only the entry is aliased.
const publicEntry = fileURLToPath(new URL("../src/index.ts", import.meta.url));

const config: StorybookConfig = {
  stories: ["../stories/**/*.mdx", "../stories/**/*.stories.@(ts|tsx)"],
  addons: ["@storybook/addon-docs"],
  framework: { name: "@storybook/react-vite", options: {} },
  core: { disableTelemetry: true },
  typescript: {
    reactDocgen: "react-docgen-typescript",
    reactDocgenTypescriptOptions: {
      shouldExtractLiteralValuesFromEnum: true,
      shouldRemoveUndefinedFromOptional: true,
      // Document the kit's own props; the inherited Ant Design surface is linked in the docs instead.
      propFilter: (prop) => !prop.parent || !/node_modules/.test(prop.parent.fileName),
    },
  },
  viteFinal: (viteConfig) =>
    mergeConfig(viteConfig, {
      resolve: { alias: { "@library/resource-kit": publicEntry } },
    }),
};

export default config;
