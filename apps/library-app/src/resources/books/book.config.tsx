import { defineRelation, defineResource, fields, filters, fromDayjs, toDayjs } from "@library/resource-kit";
import type { EnumOption } from "@library/resource-kit";
import { Typography } from "antd";
import type { Author } from "../authors/author.types";
import { columns, libraryFormat } from "../formatting";
import type { Book, BookFormValues, BookVariables, Genre } from "./book.types";

/** One relation definition, reused by the column, the filter and the form field below. */
export const bookAuthor = defineRelation<Book, Author>({
  resource: "authors",
  foreignKey: "authorId",
  valueField: "id",
  labelField: "name",
});

const GENRES: ReadonlyArray<EnumOption<Genre>> = [
  { value: "fiction", label: "Fiction", color: "blue" },
  { value: "non-fiction", label: "Non-fiction", color: "purple" },
  { value: "poetry", label: "Poetry", color: "magenta" },
  { value: "biography", label: "Biography", color: "gold" },
  { value: "science", label: "Science", color: "cyan" },
];

// ISBN-10 or ISBN-13, digits with optional hyphens.
const ISBN_PATTERN = /^(?:\d[- ]?){9}[\dX]$|^(?:\d[- ]?){12}\d$/;

export const bookConfig = defineResource<Book, BookFormValues, BookVariables>({
  name: "books",
  labels: { singular: "Book", plural: "Books" },
  relations: { author: bookAuthor },

  table: {
    columns: [
      columns.id("id", { width: 120, ellipsis: true }),
      columns.text("title", { sortable: true }),
      columns.relation(bookAuthor, {
        title: "Author",
        renderMissing: (id) => <Typography.Text type="danger">Unknown author #{id}</Typography.Text>,
      }),
      columns.text("isbn", { title: "ISBN" }),
      columns.enum("genre", { options: GENRES }),
      columns.date("publishedDate", { title: "Published", sortable: true }),
      columns.number("pageCount", { title: "Pages" }),
      columns.money("price", { sortable: true }),
      columns.boolean("inStock", { title: "In stock" }),
    ],
    filters: [
      filters.text("title"),
      filters.relation(bookAuthor, { label: "Author", multiple: true }),
      filters.enum("genre", { options: GENRES, multiple: true }),
      filters.boolean("inStock", { label: "In stock" }),
    ],
  },

  form: {
    fields: [
      fields.text("title", { rules: [{ required: true, whitespace: true }] }),
      fields.relation("authorId", bookAuthor, { label: "Author", rules: [{ required: true }] }),
      fields.text("isbn", {
        label: "ISBN",
        rules: [{ required: true }, { pattern: ISBN_PATTERN, message: "Enter a valid ISBN-10 or ISBN-13" }],
      }),
      fields.enum("genre", { options: GENRES, rules: [{ required: true }] }),
      fields.date("publishedDate", { label: "Published" }),
      fields.number("pageCount", { label: "Pages", props: { min: 1, precision: 0 } }),
      fields.money("price", {
        currency: libraryFormat.currency,
        locale: libraryFormat.locale,
        rules: [{ required: true }, { type: "number", min: 0 }],
      }),
      fields.boolean("inStock", { label: "In stock" }),
    ],
    initialValues: { inStock: true, publishedDate: null, pageCount: null },
    toFormValues: (book) => ({ ...book, publishedDate: toDayjs(book.publishedDate) }),
    toVariables: (values) => ({ ...values, publishedDate: fromDayjs(values.publishedDate) }),
  },
});
