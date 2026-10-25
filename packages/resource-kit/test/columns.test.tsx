import type { ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { createColumnFactories } from "../src/columns/createColumnFactories";
import { resolveColumns } from "../src/columns/resolveColumns";
import { buildRelationLookup, collectForeignIds, relationKey } from "../src/config/relations";
import type { TableColumn } from "../src/types/column";
import { type Author, type Book, book, bookAuthor } from "./fixtures";

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
  const records = [book({ id: 1, authorId: 7 }), book({ id: 2, authorId: 7 }), book({ id: 3, authorId: 9 }), book({ id: 4, authorId: null })];

  it("collect unique foreign keys once per page", () => {
    expect(collectForeignIds(records, bookAuthor)).toEqual([7, 9]);
  });

  it("render resolved labels, missing references and unresolved keys", () => {
    const lookup = buildRelationLookup<Author>(bookAuthor, [{ id: 7, name: "James Joyce" }]);
    const [column] = resolveColumns([columns.relation<Book>(bookAuthor, { renderMissing: (id) => `missing ${id}` })], {
      [relationKey(bookAuthor)]: lookup,
    });
    expect(cell(column!, records[0]!)).toBe("James Joyce");
    expect(cell(column!, records[2]!)).toBe("missing 9");
    expect(cell(column!, records[3]!)).toBe("n/a");

    const [unresolved] = resolveColumns([columns.relation<Book>(bookAuthor)]);
    expect(cell(unresolved!, records[0]!)).toBe("7");
  });
});
