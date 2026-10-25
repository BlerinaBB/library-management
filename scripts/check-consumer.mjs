// Independent package-consumption check:
//   1. build @library/resource-kit
//   2. npm pack it and verify the tarball contents
//   3. install the tarball + peers into a temporary project outside the workspace
//   4. type-check (including the kit's declarations) and bundle that consumer
// The temporary project lives in the OS temp directory, so nothing can resolve through
// workspace symlinks, aliases or relative paths. It is deleted afterwards (KEEP=1 keeps it).
import { execSync } from "node:child_process";
import { cpSync, existsSync, mkdtempSync, readFileSync, realpathSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const fixture = join(root, "scripts", "consumer-fixture");
const work = realpathSync(mkdtempSync(join(tmpdir(), "resource-kit-consumer-")));
const consumer = join(work, "consumer");

const run = (command, cwd, { capture = false } = {}) => {
  console.log(`\n$ ${command}${cwd === root ? "" : `   (in ${cwd})`}`);
  return execSync(command, { cwd, stdio: capture ? "pipe" : "inherit", encoding: "utf8" });
};
const fail = (message) => {
  console.error(`\n✗ ${message}`);
  process.exitCode = 1;
};

try {
  if (!relative(root, work).startsWith("..")) throw new Error(`temp dir ${work} is inside the workspace`);

  run("npm --prefix packages/resource-kit run build", root);

  const [packed] = JSON.parse(run(`npm pack -w @library/resource-kit --pack-destination "${work}" --json`, root, { capture: true }));
  const files = packed.files.map((file) => file.path).sort();
  console.log(`tarball ${packed.filename}: ${files.join(", ")}`);
  const unexpected = files.filter((file) => !file.startsWith("dist/") && file !== "package.json");
  if (unexpected.length) fail(`tarball contains files outside dist/: ${unexpected.join(", ")}`);
  for (const required of ["dist/index.js", "dist/index.cjs", "dist/index.d.ts", "dist/index.d.cts"]) {
    if (!files.includes(required)) fail(`tarball is missing ${required}`);
  }
  if (files.some((file) => /stories|fixture|storybook|\.env|src\//i.test(file))) fail("tarball contains stories, fixtures or sources");

  cpSync(fixture, consumer, { recursive: true });
  const manifestPath = join(consumer, "package.json");
  const tarball = join(work, packed.filename).replaceAll("\\", "/");
  writeFileSync(manifestPath, readFileSync(manifestPath, "utf8").replace("__TARBALL__", tarball));

  run("npm install --no-audit --no-fund --loglevel=error", consumer);

  const resolved = realpathSync(join(consumer, "node_modules", "@library", "resource-kit"));
  console.log(`@library/resource-kit resolves to ${resolved}`);
  if (!resolved.startsWith(consumer)) fail("the kit did not resolve inside the temporary consumer");
  // Host frameworks are peers: the kit must not bring its own copies.
  if (existsSync(join(resolved, "node_modules"))) fail("the kit installed nested dependencies (duplicate host frameworks)");
  // No application code (domain models, configs, routes) may ship in the package.
  const bundle = readFileSync(join(resolved, "dist", "index.js"), "utf8");
  if (/library-app|resources\/(authors|books)|authorConfig|bookConfig/.test(bundle)) fail("application code found in dist/index.js");

  run("npm run typecheck", consumer);

  // Full library check, reported for the kit's own declarations only
  // (antd's transitive declarations have unrelated strictness issues).
  let libOutput = "";
  try {
    run("npx tsc --noEmit -p tsconfig.json --skipLibCheck false", consumer, { capture: true });
  } catch (error) {
    libOutput = `${error.stdout ?? ""}`;
  }
  const kitErrors = libOutput.split("\n").filter((line) => line.includes("@library/resource-kit"));
  if (kitErrors.length) fail(`declaration errors in the kit:\n${kitErrors.join("\n")}`);
  else console.log("kit declarations type-check with skipLibCheck=false");

  run("npm run build", consumer);

  if (!process.exitCode) console.log("\n✓ package consumption check passed");
} catch (error) {
  fail(error.message);
} finally {
  if (process.env.KEEP) console.log(`kept ${work}`);
  else rmSync(work, { recursive: true, force: true });
}
