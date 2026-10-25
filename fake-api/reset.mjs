// Restores the writable runtime data (db.json) from the canonical seed.
import { copyFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
copyFileSync(join(here, "seed.json"), join(here, "db.json"));
console.log("[fake-api] db.json reset from seed.json");
