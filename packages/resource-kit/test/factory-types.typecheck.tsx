// Compile-time checks, run by `tsc -p tsconfig.test.json` (not by vitest).
// Each `@ts-expect-error` must fail to compile; an unused directive is itself an error.
import type { Dayjs } from "dayjs";
import { columns } from "../src/columns/createColumnFactories";
import { defineResource } from "../src/config/defineResource";
import { defineRelation } from "../src/config/relations";
import { filters } from "../src/filters/filterFactories";
import { fields } from "../src/form/fieldFactories";
import { type Author, type Book, bookAuthor } from "./fixtures";

type BookForm = Omit<Book, "publishedDate"> & { publishedDate: Dayjs | null };

// Valid configuration: keys are inferred from context without explicit generics.
defineResource<Book, BookForm, Omit<Book, "id">>({
  name: "books",
  labels: { singular: "Book", plural: "Books" },
  table: {
    columns: [
      columns.id("id"),
      columns.text("title"),
      columns.money("price"),
      columns.number("pageCount"),
      columns.boolean("inStock"),
      columns.date("publishedDate"),
      columns.enum("genre", { options: [{ value: "poetry", label: "Poetry" }] }),
      columns.relation(bookAuthor),
    ],
    filters: [filters.text("title"), filters.boolean("inStock"), filters.relation(bookAuthor)],
    initialSorters: [{ field: "title", order: "asc" }],
  },
  form: {
    fields: [
      fields.text("title"),
      fields.date("publishedDate"),
      fields.money("price"),
      fields.relation("authorId", bookAuthor),
      fields.custom("pageCount", {
        render: ({ value, onChange }) => {
          const typed: number | null | undefined = value;
          return <button onClick={() => onChange((typed ?? 0) + 1)} />;
        },
      }),
    ],
    toFormValues: (book) => ({ ...book, publishedDate: null }),
    toVariables: ({ id: _id, ...values }) => ({ ...values, publishedDate: null }),
  },
});

const bookColumns: ReadonlyArray<ReturnType<typeof columns.text<Book>>> = [
  // @ts-expect-error money columns require numeric fields
  columns.money<Book>("title"),
  // @ts-expect-error boolean columns require boolean fields
  columns.boolean<Book>("price"),
  // @ts-expect-error date columns reject boolean fields
  columns.date<Book>("inStock"),
  // @ts-expect-error unknown keys are rejected
  columns.text<Book>("subtitle"),
];

// @ts-expect-error enum options must match the field's value type
columns.enum<Book, "genre">("genre", { options: [{ value: "drama", label: "Drama" }] });

// @ts-expect-error boolean filters require boolean fields
filters.boolean<Book>("title");

// @ts-expect-error date fields require Dayjs form values; API strings must be converted first
fields.date<Book>("publishedDate");

// @ts-expect-error relation field names must be id-typed keys of the form
fields.relation<BookForm>("inStock", bookAuthor);

defineRelation<Book, Author>({
  resource: "authors",
  // @ts-expect-error foreign keys must be id-typed fields of the owning record
  foreignKey: "inStock",
  valueField: "id",
  labelField: "name",
});

defineResource<Book, BookForm, Omit<Book, "id">>({
  name: "books",
  labels: { singular: "Book", plural: "Books" },
  table: { columns: [] },
  // @ts-expect-error toFormValues is required when record and form types differ
  form: { fields: [], toVariables: ({ id: _id, ...values }) => ({ ...values, publishedDate: null }) },
});

// Record and form types match: conversions are optional.
defineResource<Book>({
  name: "books",
  labels: { singular: "Book", plural: "Books" },
  table: { columns: [] },
  form: { fields: [fields.number("price")] },
});

export { bookColumns };
