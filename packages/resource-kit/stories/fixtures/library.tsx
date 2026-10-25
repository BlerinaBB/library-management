// Deterministic demo domain for Storybook. It mirrors the shape of the example app's
// resources but is independent of it: the package never imports application code.
import { defineRelation, defineResource, fields, filters, fromDayjs, toDayjs, columns } from "@library/resource-kit";
import type { EnumOption } from "@library/resource-kit";
import type { Dayjs } from "dayjs";

export type Genre = "fiction" | "non-fiction" | "poetry" | "biography" | "science";

export interface Author {
  id: string;
  name: string;
  nationality: string;
  birthDate: string | null;
  bio: string | null;
  active: boolean;
}

export interface Book {
  id: string;
  title: string;
  isbn: string;
  genre: Genre;
  publishedDate: string | null;
  pageCount: number | null;
  price: number;
  inStock: boolean;
  authorId: string;
}

export type AuthorFormValues = Omit<Author, "id" | "birthDate"> & { birthDate: Dayjs | null };
export type BookFormValues = Omit<Book, "id" | "publishedDate"> & { publishedDate: Dayjs | null };

/** Deterministic UUIDs so stories and interaction checks are reproducible. */
export const uuid = (prefix: number, n: number) =>
  `${String(prefix).padStart(8, "0")}-0000-4000-8000-${String(n).padStart(12, "0")}`;

const AUTHOR_ROWS: Array<[string, string, string | null, string | null, boolean]> = [
  ["Chinua Achebe", "Nigerian", "1930-11-16", "Novelist and critic.", false],
  ["Margaret Atwood", "Canadian", "1939-11-18", "Poet and novelist.", true],
  ["Jorge Luis Borges", "Argentine", "1899-08-24", null, false],
  ["Octavia E. Butler", "American", "1947-06-22", "Science fiction author.", false],
  ["Ted Chiang", "American", "1967-10-20", "Short fiction.", true],
  ["Annie Ernaux", "French", "1940-09-01", "Memoirist.", true],
  ["Seamus Heaney", "Irish", "1939-04-13", "Poet and translator.", false],
  ["Ismail Kadare", "Albanian", "1936-01-28", "Novelist and poet.", false],
  ["Ursula K. Le Guin", "American", "1929-10-21", "Speculative fiction.", false],
  ["Hilary Mantel", "British", null, "Historical novelist.", false],
  ["Mary Oliver", "American", "1935-09-10", "Poet of the natural world.", false],
  ["Ocean Vuong", "American", "1988-10-14", "Poet and novelist.", true],
];

export const AUTHORS: Author[] = AUTHOR_ROWS.map(([name, nationality, birthDate, bio, active], i) => ({
  id: uuid(1, i + 1),
  name,
  nationality,
  birthDate,
  bio,
  active,
}));

const authorId = (name: string) => AUTHORS.find((a) => a.name === name)!.id;

const BOOK_ROWS: Array<[string, string, Genre, string | null, number | null, number, boolean]> = [
  ["Things Fall Apart", "Chinua Achebe", "fiction", "1958-06-17", 209, 12.5, true],
  ["Arrow of God", "Chinua Achebe", "fiction", "1964-01-01", 287, 13.9, false],
  ["The Handmaid's Tale", "Margaret Atwood", "fiction", "1985-08-17", 311, 14.99, true],
  ["Ficciones", "Jorge Luis Borges", "fiction", "1944-01-01", 174, 10, true],
  ["Kindred", "Octavia E. Butler", "fiction", "1979-06-01", 264, 13, true],
  ["Exhalation", "Ted Chiang", "fiction", "2019-05-07", 350, 18, true],
  ["The Years", "Annie Ernaux", "biography", "2008-02-01", 232, 14, false],
  ["North", "Seamus Heaney", "poetry", "1975-06-01", 73, 9.5, false],
  ["Death of a Naturalist", "Seamus Heaney", "poetry", "1966-05-19", 57, 9.5, true],
  ["Chronicle in Stone", "Ismail Kadare", "fiction", "1971-01-01", 304, 14.5, true],
  ["Broken April", "Ismail Kadare", "fiction", "1978-01-01", 216, 12.5, false],
  ["The Dispossessed", "Ursula K. Le Guin", "fiction", "1974-05-01", 387, 14, true],
  ["Wolf Hall", "Hilary Mantel", "fiction", "2009-04-30", 653, 18.5, true],
  ["Devotions", "Mary Oliver", "poetry", "2017-10-10", 480, 20, true],
  ["Night Sky with Exit Wounds", "Ocean Vuong", "poetry", "2016-04-05", 89, 10.5, true],
  ["On Earth We're Briefly Gorgeous", "Ocean Vuong", "fiction", null, null, 0, false],
];

export const BOOKS: Book[] = BOOK_ROWS.map(([title, author, genre, publishedDate, pageCount, price, inStock], i) => ({
  id: uuid(2, i + 1),
  title,
  isbn: `97800000${String(1000 + i * 37).padStart(5, "0")}`,
  genre,
  publishedDate,
  pageCount,
  price,
  inStock,
  authorId: authorId(author),
}));

export const GENRES: ReadonlyArray<EnumOption<Genre>> = [
  { value: "fiction", label: "Fiction", color: "blue" },
  { value: "non-fiction", label: "Non-fiction", color: "purple" },
  { value: "poetry", label: "Poetry", color: "magenta" },
  { value: "biography", label: "Biography", color: "gold" },
  { value: "science", label: "Science", color: "cyan" },
];

/** One relation definition reused by the column, filter and form field below. */
export const bookAuthor = defineRelation<Book, Author>({
  resource: "authors",
  foreignKey: "authorId",
  valueField: "id",
  labelField: "name",
});

export const authorConfig = defineResource<Author, AuthorFormValues, Omit<Author, "id">>({
  name: "authors",
  labels: { singular: "Author", plural: "Authors" },
  table: {
    pageSize: 5,
    initialSorters: [{ field: "name", order: "asc" }],
    columns: [
      columns.text("name", { sortable: true }),
      columns.text("nationality"),
      columns.date("birthDate", { title: "Born" }),
      columns.longText("bio", { lines: 1, width: 240 }),
      columns.boolean("active"),
    ],
    filters: [filters.text("name"), filters.boolean("active")],
  },
  form: {
    fields: [
      fields.text("name", { rules: [{ required: true }] }),
      fields.text("nationality", { rules: [{ required: true }] }),
      fields.date("birthDate", { label: "Birth date" }),
      fields.textarea("bio"),
      fields.boolean("active"),
    ],
    initialValues: { active: true, birthDate: null, bio: null },
    toFormValues: (author) => ({ ...author, birthDate: toDayjs(author.birthDate) }),
    toVariables: (values) => ({ ...values, birthDate: fromDayjs(values.birthDate) }),
  },
});

export const bookConfig = defineResource<Book, BookFormValues, Omit<Book, "id">>({
  name: "books",
  labels: { singular: "Book", plural: "Books" },
  relations: { author: bookAuthor },
  table: {
    pageSize: 5,
    columns: [
      columns.text("title", { sortable: true }),
      columns.relation(bookAuthor, { title: "Author" }),
      columns.enum("genre", { options: GENRES }),
      columns.date("publishedDate", { title: "Published" }),
      columns.money("price", { sortable: true, format: { currency: "EUR", locale: "en-GB" } }),
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
      fields.text("title", { rules: [{ required: true }] }),
      fields.relation("authorId", bookAuthor, { label: "Author", rules: [{ required: true }] }),
      fields.text("isbn", { label: "ISBN", rules: [{ required: true }] }),
      fields.enum("genre", { options: GENRES, rules: [{ required: true }] }),
      fields.date("publishedDate", { label: "Published" }),
      fields.number("pageCount", { label: "Pages", props: { min: 1, precision: 0 } }),
      fields.money("price", { currency: "EUR", locale: "en-GB", rules: [{ required: true }] }),
      fields.boolean("inStock", { label: "In stock" }),
    ],
    initialValues: { inStock: true, publishedDate: null, pageCount: null },
    toFormValues: (book) => ({ ...book, publishedDate: toDayjs(book.publishedDate) }),
    toVariables: (values) => ({ ...values, publishedDate: fromDayjs(values.publishedDate) }),
  },
});
