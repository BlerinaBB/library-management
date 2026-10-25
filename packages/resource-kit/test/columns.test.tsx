import type { ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { createColumnFactories } from "../src/columns/createColumnFactories";
import { resolveColumns } from "../src/columns/resolveColumns";
import { PENDING_LOOKUP, buildRelationLookup, collectForeignIds, relationKey } from "../src/config/relations";
import type { TableColumn } from "../src/types/column";
import { AUTHOR_A, AUTHOR_B, type Author, type Book, book, bookAuthor } from "./fixtures";

const columns = createColumnFactories({ locale: "en-US", currency: "USD", emptyText: "n/a" });

function cell(column: TableColumn<Book>, record: Book): string {
  const value = record[column.dataIndex as keyof Book];
  const node = column.render?.(value, record, 0) as ReactNode;
  return typeof node === "string" ? node : renderToStaticMarkup(<>{node}</>);
}

describe("column factories", () => {
  it("render false and 0 as values, not as missing", () => {
    const record = book({ inStock: false, price: 0, pageCount: 0 });
    expect(cell(columns.boolean<Book>("inStock"), record)).toContain("No");
    expect(cell(columns.money<Book>("price"), record)).toBe("$0.00");
    expect(cell(columns.number<Book>("pageCount"), record)).toBe("0");
  });

  it("render missing values with the configured empty text", () => {
    const record = book({ pageCount: null, publishedDate: null });
    expect(cell(columns.number<Book>("pageCount"), record)).toBe("n/a");
    expect(cell(columns.date<Book>("publishedDate"), record)).toBe("n/a");
  });

  it("let per-column format override factory defaults", () => {
    const column = columns.money<Book>("price", { format: { locale: "de-DE", currency: "EUR" } });
    expect(cell(column, book({ price: 5 }))).toBe("5,00 €");
  });

  it("apply column overrides last", () => {
    const column = columns.text<Book>("title", { title: "Name", sortable: true, width: 200 });
    expect(column).toMatchObject({ key: "title", dataIndex: "title", title: "Name", sorter: true, width: 200 });
  });

  it("render enum labels and fall back to the raw value", () => {
    const column = columns.enum<Book, "genre">("genre", { options: [{ value: "fiction", label: "Fiction" }] });
    expect(cell(column, book({ genre: "fiction" }))).toBe("Fiction");
    expect(cell(column, book({ genre: "poetry" }))).toBe("poetry");
  });
});

describe("relation columns", () => {
  const records = [
    book({ id: "b1", authorId: AUTHOR_B }),
    book({ id: "b2", authorId: AUTHOR_A }),
    book({ id: "b3", authorId: AUTHOR_B }),
    book({ id: "b4", authorId: null }),
  ];

  it("collect unique UUID foreign keys once per page, in a stable order", () => {
    expect(collectForeignIds(records, bookAuthor)).toEqual([AUTHOR_A, AUTHOR_B]);
  });

  it("render resolved labels, missing references and unresolved keys", () => {
    const lookup = buildRelationLookup<Author>(bookAuthor, [{ id: AUTHOR_A, name: "James Joyce" }]);
    const [column] = resolveColumns([columns.relation<Book>(bookAuthor, { renderMissing: (id) => `missing ${id}` })], {
      [relationKey(bookAuthor)]: lookup,
    });
    expect(cell(column!, records[1]!)).toBe("James Joyce");
    expect(cell(column!, records[0]!)).toBe(`missing ${AUTHOR_B}`);
    expect(cell(column!, records[3]!)).toBe("n/a");

    const [unresolved] = resolveColumns([columns.relation<Book>(bookAuthor)]);
    expect(cell(unresolved!, records[1]!)).toBe(AUTHOR_A);
  });

  it("render a loading indicator, not a missing reference, while related records load", () => {
    const [pending] = resolveColumns([columns.relation<Book>(bookAuthor, { renderMissing: (id) => `missing ${id}` })], {
      [relationKey(bookAuthor)]: PENDING_LOOKUP,
    });
    const html = cell(pending!, records[0]!);
    expect(html).toContain("ant-spin");
    expect(html).not.toContain("missing");
  });
});
