# Library Management: resource kit

`@library/resource-kit` is a shared package for building CRUD resource screens with **React, TypeScript, Refine and Ant Design**. It is meant to be consumed by many independent repositories. `apps/library-app` is a thin example consumer with two resources, Authors and Books.

```
library-management/
├── packages/resource-kit/     the shared package (the deliverable)
├── apps/library-app/          example consumer: models, configs, thin pages, Refine setup
└── scripts/check-boundaries.mjs
```

## Commands

| Command | What it does |
| --- | --- |
| `npm run verify` | Runs everything below in order. |
| `npm run build -w @library/resource-kit` | Builds ESM and CJS output plus `.d.ts`/`.d.cts` into `packages/resource-kit/dist`. |
| `npm run typecheck` | Strict `tsc` over the package, the type-level tests and the app. The app checks against the **built** declarations. |
| `npm test` | Vitest behavior tests for formatting, filter/sorter translation and column rendering. |
| `npm run check:cycles` | Runs madge to find circular imports. |
| `npm run check:boundaries` | Checks dependency direction (see below). |

The app imports the kit through `package.json` `exports`, the same way an external repository would. There are no `paths` or Vite aliases, so the package must be built before you typecheck or run the app.

## Package layout and responsibilities

| Folder | Responsibility | Depends on |
| --- | --- | --- |
| `types/` | Public types: key constraints, `ResourceConfig`, columns, filters, fields, relations, `DrawerState` | antd/dayjs types |
| `config/` | `defineResource`, `defineRelation`, pure formatting, default texts | `types` |
| `columns/` | Column factories, `resolveColumns`, `RowActions` | `config`, `types` |
| `filters/` | Filter factories, filter-state helpers, `FilterBar` / `FilterControl` | `config`, `types` |
| `table/` | `DataTable`, `composeHandlers`, `useControllableState` | `columns`, `filters` |
| `form/` | Field factories, `ResourceForm`, `FormField`, `toDayjs` / `fromDayjs` | `config`, `types` |
| `drawer/` | `ResourceDrawer`, `useDrawerState` | `config`, `types` |
| `hooks/` | **Refine integration:** `useResourceController`, `useRelationLookup`, Refine filter/sorter translation | everything above + `@refinedev/core` |
| `resource/` | **Composition:** `ResourcePage`, `RelationResolver`, `RefineRelationSelect`, `ResourceHeader`, `DeleteConfirmModal` | everything |

### Dependency direction

```
app ──► @library/resource-kit (public entry only)

resource ──► hooks ──► table / form / drawer / filters / columns ──► config ──► types
                │
                └──► @refinedev/core   (only hooks/ and resource/ may import Refine)
```

`scripts/check-boundaries.mjs` enforces these rules:

- The package never imports from the app or from anything outside its own `src/`.
- The package imports only its peer dependencies.
- The presentation layers (`types`, `config`, `columns`, `filters`, `table`, `form`, `drawer`) import neither Refine nor `hooks/` or `resource/`.
- The app imports only `@library/resource-kit`, never a deep path, and has no source aliases.
- `dist/` references peer dependencies only.

## Public API

Everything public is exported from `src/index.ts`. Anything not listed there is private.

- **Configuration:** `defineResource`, `defineRelation`, `relationKey`, `getRelationLabel`, `isMissing`, `formatDate`, `formatNumber`, `formatMoney`, `defaultTexts`
- **Factories:**
  - `columns`: `id`, `text`, `longText`, `date`, `boolean`, `number`, `money`, `enum`, `relation`, `actions`. Use `createColumnFactories(formatDefaults)` to bind formatting defaults.
  - `filters`: `text`, `boolean`, `enum`, `relation`
  - `fields`: `text`, `textarea`, `date`, `boolean`, `number`, `money`, `enum`, `relation`, `custom`
- **Components:** `DataTable`, `FilterBar`, `FilterControl`, `ResourceForm`, `ResourceDrawer`, `ResourcePage`, `ResourceHeader`, `DeleteConfirmModal`, `RelationResolver`, `RefineRelationSelect`, `RowActions`
- **Hooks:** `useResourceController`, `useRelationLookup`, `useDrawerState`
- **Translation and utilities:** `toRefineFilters`, `fromRefineFilters`, `toRefineSorters`, `resolveColumns`, `composeHandlers`, `toDayjs`, `fromDayjs`, `isEmptyFilterValue`, `setFilterValue`
- **Types:** `ResourceConfig`, `FieldDef`, `FilterDef`, `ResourceColumn`, `RelationDef`, `DrawerState`, and related types

### Distribution

- **Exports:** the `exports` map exposes only `.` (`import` → `dist/index.js` + `index.d.ts`, `require` → `dist/index.cjs` + `index.d.cts`). Deep imports fail with `ERR_PACKAGE_PATH_NOT_EXPORTED`.
- **Peer dependencies:** `react`, `react-dom`, `antd@^6`, `@refinedev/core@^5` and `dayjs` are peers. They are external in the build, so the host provides the single copy.
- **No side effects:** `"sideEffects": false`. Importing the package registers nothing and adds no globals; this was verified by importing the packed tarball in Node.

## Required host providers

The host application owns its infrastructure:

1. **`<Refine dataProvider=…>`** is required by `useResourceController`, `ResourcePage`, `RelationResolver` and `RefineRelationSelect`. Refine sets up its own react-query client, and the host installs `@tanstack/react-query` as Refine's peer.
2. **Resources** must be registered with Refine under the same `name` used in `defineResource`.
3. **`routerProvider`** is needed only for `syncWithLocation: true`.
4. **Optional providers:** `notificationProvider` (mutation errors and successes are reported through it), `authProvider`, `accessControlProvider`, and an antd `ConfigProvider` / `App` for theme and locale.

The presentation components (`DataTable`, `ResourceForm`, `ResourceDrawer`, `FilterBar`) need no providers.

## Defining a resource

```tsx
import { defineResource, defineRelation, columns, fields, filters, toDayjs, fromDayjs } from "@library/resource-kit";

export const bookAuthor = defineRelation<Book, Author>({
  resource: "authors", foreignKey: "authorId", valueField: "id", labelField: "name",
});

export const bookConfig = defineResource<Book, BookFormValues, BookVariables>({
  name: "books",
  labels: { singular: "Book", plural: "Books" },
  relations: { author: bookAuthor },
  table: {
    columns: [columns.text("title", { sortable: true }), columns.relation(bookAuthor), columns.money("price")],
    filters: [filters.text("title"), filters.relation(bookAuthor, { multiple: true })],
  },
  form: {
    fields: [fields.text("title", { rules: [{ required: true }] }), fields.relation("authorId", bookAuthor), fields.date("publishedDate")],
    toFormValues: (book) => ({ ...book, publishedDate: toDayjs(book.publishedDate) }),
    toVariables: (values) => ({ ...values, publishedDate: fromDayjs(values.publishedDate) }),
  },
});

export const BooksPage = () => <ResourcePage config={bookConfig} />;
```

- **Typed keys:** factories infer the record or form type from the surrounding `defineResource<…>`, so no explicit generics are needed. `columns.money("title")` is a compile error, and so are `filters.boolean("price")` and enum options outside the field's union. `test/factory-types.typecheck.tsx` pins these cases.
- **Record, form and variables:** `TRecord` is the API shape, `TForm` is what Ant Design holds (for example `Dayjs` dates), and `TVariables` is the mutation payload. `toFormValues` and `toVariables` are **required by the type system only when the types differ**.
- **One field list:** create and edit share the same `form.fields`.

## Composing a custom screen

`ResourcePage` is a thin layer of composition. You can build the same screen yourself; see `apps/library-app/src/resources/books/BookInventoryScreen.tsx`:

```tsx
const controller = useResourceController(bookConfig);
return (
  <>
    <Statistic title="In stock" value={controller.records.filter((b) => b.inStock).length} />
    <RelationResolver relations={controller.relations} records={controller.records}>
      {(relationData) => (
        <DataTable {...controller.tableProps} relationData={relationData} relationSelect={RefineRelationSelect}
          columns={[...controller.tableProps.columns, columns.actions({ actions: () => [{ key: "edit", label: "Edit", onClick: controller.edit }] })]} />
      )}
    </RelationResolver>
    <ResourceDrawer {...controller.drawerProps}>
      <ResourceForm {...controller.formProps} relationSelect={RefineRelationSelect} />
    </ResourceDrawer>
  </>
);
```

`ResourcePage` also accepts focused render callbacks instead of boolean switches:

- `renderHeader(defaultHeader, controller)`
- `renderBeforeTable(controller)`
- `rowActions(record, defaults, controller)`
- `texts`
- `tableProps` (its handlers are **composed** with the controller's, not replaced)
- `drawerProps`
- `relationSelect`

## Adding a third resource

1. In the app, create `src/resources/members/member.types.ts` with the record type, plus form and variables types if they differ.
2. Create `member.config.tsx` with `defineResource<Member, …>({ … })` built from the factories, and add any `defineRelation`.
3. Create `MembersPage.tsx` returning `<ResourcePage config={memberConfig} />`.
4. Register `{ name: "members" }` with `<Refine resources>` and add a route.

No package change is needed.

## Consuming the package from another repository

```bash
# in this repo
npm run build -w @library/resource-kit
npm pack -w @library/resource-kit            # → library-resource-kit-0.1.0.tgz

# in the other repo
npm install ./library-resource-kit-0.1.0.tgz \
  react react-dom antd @refinedev/core @tanstack/react-query dayjs
```

```tsx
import { ResourcePage, defineResource, columns, fields } from "@library/resource-kit";
```

This flow was verified with a separate scratch project: strict `NodeNext` typecheck with library checking on for the kit's declarations, ESM and CJS runtime import, and rejected deep imports.

**Versioned distribution later:** publish the same tarball to a private registry (GitHub Packages, Artifactory, Verdaccio) by adding `publishConfig.registry`. Then version it with Changesets or semantic-release and have consumers pin `^x.y.z`. Treat changes to `src/index.ts` and to the exported types as the semver surface, and widen the peer ranges only after testing.

## Extension points

| Need | Extension point |
| --- | --- |
| Locale, currency, date format, empty text, boolean labels | `createColumnFactories(defaults)`, or `format` on any column |
| Any column prop (width, fixed, render, sorter…) | Column `options`, spread last |
| Filter operators and keys | `operator` / `key` on filter factories; operator names are Refine `CrudOperators` |
| Unusual form controls | `fields.custom(name, { render })` with a typed `value` and `onChange` |
| API ↔ form conversion | `toFormValues` / `toVariables` (with a `{ mode, record }` context) |
| Validation | Consumer-supplied antd `rules` per field |
| How relation options load | `relationSelect` component (contract: `RelationSelectProps`); default `RefineRelationSelect` |
| Relation labels and missing references | `formatLabel` on the relation; `renderRelated` / `renderMissing` on the column |
| Row actions and business rules | `rowActions(record, defaults)`; `columns.actions` in custom layouts |
| Post-save and post-delete behavior | `controllerOptions.onSaved` / `onDeleted`; `invalidates` |
| Data provider, meta, URL sync | `controllerOptions.dataProviderName`, `meta`, `syncWithLocation` |
| User-facing strings | `texts` (partial `ResourceTexts`) |

## Architectural tradeoffs

- **One package, layered internally.** One package keeps versioning simple for 100+ consumers. Separation is enforced by folder rules and the boundary script rather than by package boundaries. Splitting it later (for example into a core package and a Refine adapter) needs only new entry points.
- **Refine is the single source of truth for server state.** Filter UI state is *derived* from Refine's filters (`fromRefineFilters`), not stored twice; that also makes `syncWithLocation` work. Local state is limited to UI concerns: drawer mode, the pending delete, and saving.
- **Relation resolution without hook loops.** `RelationResolver` renders one `RelationLookupStep` per relation, and each makes a single `useMany` call over the unique foreign keys on the current page. Hooks keep fixed positions, there are no per-row requests, and the cache belongs to Refine. Relation columns are "deferred" (`{ relation, bind(lookup) }`), so factories stay pure while still receiving resolved data.
- **`valueField` must be what `getMany` matches**, normally the related primary key. Batch lookups use `dataProvider.getMany`. Relations on other fields need a custom `relationSelect` and a custom resolution hook.
- **Relation fields take an explicit `name`.** `fields.relation("authorId", bookAuthor)` checks the name against the *form* type, which may differ from the record type the relation was declared on.
- **Mutations use only `mutateAsync`.** Refine 5.0.12's published typings for `useCreate`/`useUpdate` disagree with their runtime return shape. The controller relies only on `mutateAsync`, which both shapes provide, and tracks the saving flag itself.
- **Text filters apply on every keystroke.** Refine's `useTable` has no debounce. Add one in a custom `FilterControl` if your API needs it.
- **Default English strings** live in `defaultTexts`. Full i18n is left to the host, either by passing `texts` or by wiring Refine's `i18nProvider` into them.

## Intentionally out of scope

There is no backend, fake API, seed data, authentication, permissions-aware UI, notification provider, deployment or publishing automation. `apps/library-app` is wired to `@refinedev/simple-rest` at `VITE_API_URL` (default `/api`), but no server is included.
