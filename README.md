# Library Manager

A small library management app (Authors and Books, full CRUD) built with **React, Refine, Ant Design and TypeScript**. The reusable part, a typed resource toolkit, lives in its own buildable package, `@library/resource-kit`, documented with Storybook.

```
apps/library-app         the application: domain models, resource configs, routes, providers
packages/resource-kit    the shared package: components, factories, config types, Refine integration
  ├─ src/                package source (the only thing that is built and shipped)
  ├─ stories/            Storybook stories, docs and fixtures (never shipped)
  └─ .storybook/         Storybook configuration
fake-api/                json-server fake API: seed.json (canonical) + db.json (runtime, git-ignored)
scripts/                 boundary check and package-consumption check
```

## 1. Prerequisites

- Node.js **20.19+** (developed and verified on Node 22.21) and npm 9+.
- No registry credentials, accounts or external services are needed.

## 2. Installation and quick start

```bash
npm install
npm run dev
```

`npm run dev` builds the shared package once, then runs three processes side by side:

| Name | What | URL |
| --- | --- | --- |
| `kit` | `@library/resource-kit` in watch mode (rebuilds `dist/` on change) | — |
| `api` | fake API (json-server 0.17.4) | http://localhost:3001/api |
| `app` | Vite dev server; proxies `/api` to the fake API | **http://localhost:5173** |

Press **Ctrl+C** once to stop all three. If any one of them exits, the others are stopped too (`concurrently --kill-others`), so nothing is left running.

Separate commands: `npm run api` (fake API only) and `npm run dev:app` (app only, needs a built kit: `npm run build:kit`).

## 3. Ports and environment variables

All variables are optional; copy `.env.example` to `.env` to change them. The app and the fake API both read the root `.env`.

| Variable | Default | Purpose |
| --- | --- | --- |
| `API_PORT` | `3001` | Fake API port; the Vite proxy targets it |
| `APP_PORT` | `5173` | Vite dev server port |
| `VITE_API_URL` | `/api` | API base URL used by the app (keep `/api` to use the proxy) |
| `API_DELAY_MS` | `0` | Artificial API latency, to make loading and submitting states visible |

## 4. Seed data and reset

- `fake-api/seed.json` is the canonical seed: 27 authors and 40 books with UUIDs. It covers every field, has several books per author plus three authors without books (so author deletion can be tried right away), `true`/`false` values, a zero price, and missing dates and page counts, with enough rows for pagination.
- `fake-api/db.json` is the writable runtime copy. It is created from the seed on first start and is git-ignored.
- **`npm run seed:reset`** restores `db.json` from the seed. A running API picks up the change without a restart.

Rules enforced at the fake API boundary (`fake-api/server.mjs`):

- **IDs:** the API generates a UUID (`crypto.randomUUID()`) for every create and ignores client-supplied ids. Updates cannot change an id.
- **Deleting a referenced author is rejected** with `409` and a readable message ("This author still has 3 book(s)…"), which the app shows as an error notification. Without this, json-server 0.17 would silently delete the author's books. Reassign or delete the books first.
- **Literal text filters:** text filters (`title_like`) match literally and case-insensitively. json-server would otherwise treat the value as a regular expression and return a 500 for input like `(`.

## 5. Storybook

```bash
npm run storybook         # dev server on http://localhost:6006 (not started by npm run dev)
npm run build-storybook   # static build in packages/resource-kit/storybook-static
```

Storybook documents the package's public API and runs without the fake API or any build step; Refine-based stories use an in-memory data provider. It contains short guides (configuration, relations, adding a resource), the main components and their states, every column factory, and Authors/Books screens plus a custom layout built without `ResourcePage`.

## 6. Validation commands

| Command | Checks |
| --- | --- |
| `npm run verify` | Everything below, in order |
| `npm run typecheck` | Builds the kit, then strict `tsc` over the package, its tests/stories and the app. The app type-checks against the kit's **built** declarations. |
| `npm run lint` | ESLint (typescript-eslint, react-hooks) over the repository |
| `npm test` | Vitest: formatting, filter/sorter translation, column rendering (`false`/`0`/missing/pending), plus Storybook interaction checks (filter reset, required-field validation, drawer submission, failed save, date round-trip) run as portable stories in jsdom |
| `npm run check:cycles` | madge: no circular imports |
| `npm run check:boundaries` | Dependency rules (see §7) |
| `npm run build` | Kit build + app production build |
| `npm run build-storybook` | Static Storybook build |
| `npm run check:consumer` | Independent package consumption (see §10) |

Type-level guarantees (for example, a money column on a text field fails to compile) are pinned in `packages/resource-kit/test/factory-types.typecheck.tsx`.

## 7. Architecture

The reusable components and resource abstractions live in an independently buildable package, `@library/resource-kit`. The application consumes its public API, while domain models, configuration and business rules remain in the application. Storybook documents the package's components, supported states and composition patterns.

**Ownership**

- **Package:**
  - generic config types (`ResourceConfig`, `FieldDef`, `FilterDef`, `RelationDef`)
  - column, filter and field factories
  - `DataTable`, `ResourceForm`, `ResourceDrawer` and `ResourcePage`
  - Refine integration: `useResourceController`, relation resolution, filter translation
- **App:**
  - models, resource configs, validation rules and labels
  - routes, providers (`<Refine>`, data provider, notification provider), API URL
  - business rules (the delete policy lives at the API boundary)

**Dependency direction**, enforced by `npm run check:boundaries`:

```
apps/library-app ──► @library/resource-kit (public entry only; no path aliases, no deep imports)

resource/ (ResourcePage, RelationResolver, RefineRelationSelect)
   └─► hooks/ (useResourceController, useRelationLookup, Refine translation)   ← only these two layers import Refine
         └─► table/ form/ drawer/ filters/ columns/ ──► config/ ──► types/
```

The package never imports the app. Presentation layers never import Refine. Stories use public exports only, and `dist/` references peer dependencies only.

**Key decisions**

- **Configuration over code:** each resource is one typed `defineResource<TRecord, TForm, TVariables>()` object. `AuthorsPage` and `BooksPage` are one line each.
- **Refine owns server state:** list, pagination, sorting and filters live in Refine's `useTable`, and the filter UI state is *derived* from it, which is why filters survive a page refresh. The controller holds only UI state (drawer mode, pending delete, saving).
- **Explicit record vs form types:** API records keep dates as `YYYY-MM-DD` strings while the form holds `Dayjs` values. The conversions are required by the type system only when the types differ, and they avoid timezone shifts.
- **One drawer, one form per resource:** create and edit share the field list. The drawer is driven by a single `DrawerState` (`closed | create | edit(id)`).
- **Notifications:** `@refinedev/antd` 6.0.x requires antd 5, so the app provides a small Refine notification provider on antd 6's `App.useApp()` (`apps/library-app/src/app/useNotificationProvider.tsx`).

## 8. Column factories, forms, filters and relations

```tsx
export const bookAuthor = defineRelation<Book, Author>({
  resource: "authors", foreignKey: "authorId", valueField: "id", labelField: "name",
});

export const bookConfig = defineResource<Book, BookFormValues, BookVariables>({
  name: "books",
  labels: { singular: "Book", plural: "Books" },
  relations: { author: bookAuthor },
  table: {
    columns: [
      columns.text("title", { sortable: true }),
      columns.relation(bookAuthor, { title: "Author" }),     // shows the author's name
      columns.enum("genre", { options: GENRES }),
      columns.money("price", { sortable: true }),             // formatted with the app's currency
      columns.boolean("inStock", { title: "In stock" }),
    ],
    filters: [filters.text("title"), filters.relation(bookAuthor, { multiple: true }), filters.enum("genre", { options: GENRES, multiple: true })],
  },
  form: {
    fields: [fields.text("title", { rules: [{ required: true }] }), fields.relation("authorId", bookAuthor), fields.date("publishedDate")],
    toFormValues: (book) => ({ ...book, publishedDate: toDayjs(book.publishedDate) }),
    toVariables: (values) => ({ ...values, publishedDate: fromDayjs(values.publishedDate) }),
  },
});
```

**Columns**

- **Factories:** `id`, `text`, `longText`, `date`, `boolean`, `number`, `money`, `enum`, `relation` and `actions`. Every table column in the app is built with them, including the actions column.
- **Typed keys:** `money` and `number` accept only numeric fields, `boolean` only boolean fields, and enum options must match the field's union.
- **Formatting:** app-wide defaults (locale, currency, date format) are bound once with `createColumnFactories` (`apps/library-app/src/resources/formatting.ts`).
- **Values vs missing:** `false` and `0` render as values; `null`, `undefined` and `""` render an em dash.

**Filters**

- **Factories:** `text`, `boolean`, `enum` and `relation`, defined like columns and passed to `DataTable` as `filters`.
- **Operators:** they default sensibly and can be overridden.
- **Separation:** filter definitions, rendering, controlled state and Refine translation are separate.
- **Behavior:** they work against the fake API, survive refresh, and reset pagination to page 1.

**Forms**

- **Field types:** text, textarea, date, boolean, number, money, enum, relation and custom, as a discriminated union.
- **Consumer-owned:** validation is consumer-owned antd `rules`.
- **One shared definition:** create and edit use the same field list per resource.

**Author ↔ Book relation**

One `RelationDef` drives three things:

- **The column:** it shows the author's name.
- **The filter:** a searchable, multi-select author filter.
- **The form field:** a searchable author select that also shows the current author when they are not on the first page of options.

For the table, `RelationResolver` collects the unique author ids of the current page and resolves them with **one `getMany` request per page**, not one per row. It uses Refine's cache, and its hooks never run in loops over configuration. Cells show a spinner while authors load, and a "missing reference" rendering for ids that do not resolve.

## 9. Adding a resource

A third resource (for example Members) needs only:

1. **A domain model:** `member.types.ts`.
2. **A resource configuration:** `member.config.tsx` using the factories, plus a one-line `MembersPage`.
3. **API support:** a `members` collection in `fake-api/seed.json`, then `npm run seed:reset` to copy it into the runtime database (`db.json`). Note that the reset overwrites any local changes made through the app.
4. **Registration:** `{ name: "members" }` in `<Refine resources>` and a route in `App.tsx`.

No shared CRUD component changes. Storybook's **Guide → Recipes** page shows a complete, type-checked Member example, including a relation to Books (`packages/resource-kit/stories/examples/member.resource.tsx`). It also shows how to compose `DataTable`, `ResourceDrawer` and `useResourceController` into a custom screen without `ResourcePage`, which **Composition → Custom screen** runs live.

## 10. Package-consumption verification

```bash
npm run check:consumer
```

This builds the package, packs it with `npm pack`, installs the tarball into a temporary project outside the workspace, and type-checks and builds a consumer that uses only the public API. It shows the package can be used by another repository without copying source code. React, antd, Refine and dayjs are peer dependencies, so the package bundles none of them.

## 11. Scaling the approach across repositories

These are proposals for a real organization, not part of this submission. Here the app and `@library/resource-kit` live in one repository, so reviewers can run everything without registry access. Nothing is published.

**Private packages and versioning.** I would publish `resource-kit` as a private package on GitHub Packages, versioned with semver. Each project then installs the version it needs and upgrades on its own schedule, instead of copying components between repositories. Upgrades would come with release notes, migration notes for breaking changes, and automated upgrade PRs (for example Renovate), so teams adopt new versions deliberately.

**Shared hooks and utilities.** If several projects end up sharing the same hooks or helpers, those could move into their own small private packages. I would only do this after the reuse is real, not in anticipation of it.

**Simple shared components.** Shared components should handle presentation and generic behavior only. Project-specific rules stay in the consuming application and reach the components through props, callbacks or configuration, as the resource configs do here. I would avoid adding options and branches for use cases nobody has asked for yet.

**Independence from applications.** The shared package must never depend on an application's modules, services or business rules. Keeping its public API small, generic and predictable is what lets unrelated projects adopt it independently. The boundary check in this repository (`npm run check:boundaries`) is a small version of that rule.

**A standard project template.** For many repositories, I would propose a GitHub template repository with the agreed React/TypeScript structure, shared lint/test/build configuration, and the approved internal packages already listed as dependencies. New projects start from "Use this template" and install dependencies through the package manager as usual. That removes repeated setup and keeps projects consistent.

**A shared design system.** Reusable components only stay reusable if projects agree on design. I would work with designers on shared design tokens and a small set of component variants, such as a fixed set of button styles. The alternative is per-project CSS overrides, custom class names and `!important` rules, which gradually break the shared components.

**Not abstracting too early.** I would extract a shared package or component only when reuse clearly pays off. When projects' requirements differ substantially, keeping code local is often simpler and easier to maintain than forcing it into one generic abstraction.

## 12. What I would improve with more time

- **Text filters query on every keystroke:** Refine's `useTable` has no debounce. A debounced text filter control would reduce requests.
- **No sorting by author name:** the relation column is not sortable, because the API can only sort books by `authorId`.
- **json-server sorting is case-sensitive:** it orders values with lodash `orderBy`, so lower-case names would sort after upper-case ones. A real API would sort with collation.
- **Relation resolution uses `getMany`:** a relation's `valueField` must be the related record's id. Relations on other fields would need a custom resolver.
- **No server-side validation:** the fake API does not validate payloads beyond ids and the delete rule. The controller already maps a Refine `HttpError.errors` response onto form fields, but this API never sends one.
- **Refine typing mismatch:** Refine 5.0.12's published typings for `useCreate`/`useUpdate` disagree with their runtime return value. The controller relies only on `mutateAsync` and tracks its own saving flag.
- **No committed end-to-end suite:** browser flows were verified with a Playwright script during development, but that script is not committed. A committed Playwright suite against the fake API would make the checks repeatable in CI.
- **English UI text only:** labels and validation messages are English. `ResourceTexts` can be overridden, but no i18n provider is wired in.
- **Large single bundle:** the app ships as one bundle (about 1.4 MB, mostly antd), with no route-level code splitting.
