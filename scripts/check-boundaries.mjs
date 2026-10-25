// Verifies dependency direction between the shared package and its consumers,
// and between the package's internal layers. Exits non-zero on any violation.
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { dirname, join, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const kitSrc = join(root, "packages/resource-kit/src");
const appSrc = join(root, "apps/library-app/src");

const PEERS = new Set(["react", "react-dom", "react/jsx-runtime", "antd", "dayjs", "@refinedev/core"]);
// Layers that must work without Refine and without the composition layer.
const PRESENTATION_LAYERS = ["types", "config", "columns", "filters", "table", "form", "drawer"];
const IMPORT_PATTERN = /(?:^|\s)(?:import|export)\s[^;]*?from\s*["']([^"']+)["']|import\s*\(\s*["']([^"']+)["']\s*\)|^\s*import\s*["']([^"']+)["']/gm;

const violations = [];

function sourceFiles(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) return sourceFiles(path);
    return /\.(ts|tsx)$/.test(entry.name) ? [path] : [];
  });
}

function importsOf(file) {
  const text = readFileSync(file, "utf8");
  return [...text.matchAll(IMPORT_PATTERN)].map((match) => match[1] ?? match[2] ?? match[3]);
}

const rel = (path) => relative(root, path).split(sep).join("/");
const layerOf = (file) => relative(kitSrc, file).split(sep)[0];

for (const file of sourceFiles(kitSrc)) {
  const layer = layerOf(file);
  for (const specifier of importsOf(file)) {
    if (specifier.startsWith(".")) {
      const target = resolve(dirname(file), specifier);
      if (!target.startsWith(kitSrc + sep)) {
        violations.push(`${rel(file)}: relative import leaves the package (${specifier})`);
        continue;
      }
      const targetLayer = relative(kitSrc, target).split(sep)[0];
      if (PRESENTATION_LAYERS.includes(layer) && (targetLayer === "hooks" || targetLayer === "resource")) {
        violations.push(`${rel(file)}: presentation layer "${layer}" imports integration layer "${targetLayer}"`);
      }
      if (layer === "hooks" && targetLayer === "resource") {
        violations.push(`${rel(file)}: hooks import the composition layer`);
      }
    } else if (!PEERS.has(specifier)) {
      violations.push(`${rel(file)}: imports "${specifier}", which is not a declared peer dependency`);
    } else if (specifier === "@refinedev/core" && PRESENTATION_LAYERS.includes(layer)) {
      violations.push(`${rel(file)}: presentation layer "${layer}" depends on Refine`);
    }
  }
}

for (const file of sourceFiles(appSrc)) {
  for (const specifier of importsOf(file)) {
    if (specifier.startsWith("@library/resource-kit/")) {
      violations.push(`${rel(file)}: deep import "${specifier}"; use the public entry point`);
    }
    if (specifier.startsWith(".") && !resolve(dirname(file), specifier).startsWith(appSrc + sep)) {
      violations.push(`${rel(file)}: relative import leaves the app (${specifier})`);
    }
  }
}

// The app must resolve the kit through package exports, never through source aliases.
const appTsconfig = JSON.parse(readFileSync(join(root, "apps/library-app/tsconfig.json"), "utf8"));
if (appTsconfig.compilerOptions?.paths) violations.push("apps/library-app/tsconfig.json: path aliases are not allowed");
if (/alias\s*:/.test(readFileSync(join(root, "apps/library-app/vite.config.ts"), "utf8"))) {
  violations.push("apps/library-app/vite.config.ts: resolve aliases are not allowed");
}

// The built output may only reference peer dependencies.
const dist = join(root, "packages/resource-kit/dist/index.js");
if (!existsSync(dist)) {
  violations.push("packages/resource-kit/dist/index.js missing; build the package first");
} else {
  for (const specifier of importsOf(dist)) {
    if (!PEERS.has(specifier)) violations.push(`dist/index.js: references "${specifier}"`);
  }
}

if (violations.length) {
  console.error(`Boundary violations (${violations.length}):\n  ${violations.join("\n  ")}`);
  process.exit(1);
}
console.log("Boundaries OK: package ↛ app, presentation ↛ Refine, app → public exports only, dist → peers only.");
