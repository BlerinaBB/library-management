// Fake REST API for the library app, built on json-server 0.17.4 (the query contract
// expected by @refinedev/simple-rest: _start/_end, _sort/_order, field_like, x-total-count).
//
// Domain rules live here, at the API boundary, not in the shared package:
//   - Text filters (`field_like`) match literally rather than as regular expressions.
//   - New records get a server-generated UUID; client-supplied ids are ignored.
//   - Updates cannot change a record's id.
//   - Deleting an author that books still reference is rejected (409), instead of
//     json-server's default cascade, which would silently delete those books.
import { randomUUID } from "node:crypto";
import { copyFileSync, existsSync, readFileSync, watch } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import jsonServer from "json-server";

const here = dirname(fileURLToPath(import.meta.url));
try {
  process.loadEnvFile(join(here, "..", ".env"));
} catch {
  // No .env file: defaults apply.
}

const PORT = Number(process.env.API_PORT ?? 3001);
const DELAY_MS = Number(process.env.API_DELAY_MS ?? 0);
const SEED_FILE = join(here, "seed.json");
const DB_FILE = join(here, "db.json");

if (!existsSync(DB_FILE)) {
  copyFileSync(SEED_FILE, DB_FILE);
  console.log("[fake-api] db.json created from seed.json");
}

const server = jsonServer.create();
const router = jsonServer.router(DB_FILE);

server.use(jsonServer.defaults({ logger: true, noCors: false }));
server.use(jsonServer.bodyParser);

if (DELAY_MS > 0) {
  // Optional latency, to make loading and submitting states observable.
  server.use((_req, _res, next) => setTimeout(next, DELAY_MS));
}

server.use("/api", (req, res, next) => {
  // json-server evaluates `field_like` as a regular expression; escape it so text
  // filters match literally (typing "(" would otherwise return a 500).
  for (const [key, value] of Object.entries(req.query)) {
    if (key.endsWith("_like") && typeof value === "string") {
      req.query[key] = value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    }
  }
  if (req.method === "POST") {
    req.body = { ...req.body, id: randomUUID() };
  }
  if (req.method === "PUT" || req.method === "PATCH") {
    req.body = Object.fromEntries(Object.entries(req.body ?? {}).filter(([key]) => key !== "id"));
  }
  const authorDelete = req.method === "DELETE" && req.path.match(/^\/authors\/([^/]+)$/);
  if (authorDelete) {
    const books = router.db.get("books").filter({ authorId: authorDelete[1] }).value();
    if (books.length > 0) {
      res.status(409).json({
        message: `This author still has ${books.length} book(s). Reassign or delete those books first.`,
      });
      return;
    }
  }
  next();
});

server.use("/api", router);

// Pick up external changes to db.json (e.g. `npm run seed:reset`) without a restart.
let reloadTimer;
watch(DB_FILE, () => {
  clearTimeout(reloadTimer);
  reloadTimer = setTimeout(() => {
    try {
      router.db.read();
    } catch {
      // File mid-write; the next change event reloads it.
    }
  }, 100);
});

server.listen(PORT, () => {
  const { authors, books } = JSON.parse(readFileSync(DB_FILE, "utf8"));
  console.log(`[fake-api] http://localhost:${PORT}/api  (${authors.length} authors, ${books.length} books)`);
});
