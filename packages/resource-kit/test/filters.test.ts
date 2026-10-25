import { describe, expect, it } from "vitest";
import { filters } from "../src/filters/filterFactories";
import { isEmptyFilterValue, setFilterValue } from "../src/filters/filterValues";
import { fromRefineFilters, toRefineFilters, toRefineSorters } from "../src/hooks/refineTranslation";
import type { FilterDef } from "../src/types/filter";
import { type Book, bookAuthor } from "./fixtures";

const definitions: FilterDef<Book>[] = [
  filters.text<Book>("title"),
  filters.boolean<Book>("inStock"),
  filters.enum<Book, "genre">("genre", { options: [{ value: "fiction", label: "Fiction" }], multiple: true }),
  filters.relation<Book>(bookAuthor),
];

describe("filter factories", () => {
  it("applies operator defaults", () => {
    expect(definitions.map((definition) => definition.operator)).toEqual(["contains", "eq", "in", "eq"]);
  });

  it("lets consumers configure key and operator", () => {
    const definition = filters.text<Book>("title", { key: "titlePrefix", operator: "startswith" });
    expect(definition).toMatchObject({ key: "titlePrefix", field: "title", operator: "startswith" });
  });

  it("filters relations by their foreign key", () => {
    expect(filters.relation<Book>(bookAuthor, { multiple: true })).toMatchObject({ field: "authorId", operator: "in" });
  });
});

describe("filter state", () => {
  it("treats false and 0 as set values", () => {
    expect(isEmptyFilterValue(false)).toBe(false);
    expect(isEmptyFilterValue(0)).toBe(false);
    expect([undefined, null, "", []].every(isEmptyFilterValue)).toBe(true);
  });

  it("drops a key when its value is cleared", () => {
    expect(setFilterValue({ title: "a", inStock: false }, "title", "")).toEqual({ inStock: false });
  });
});

describe("Refine filter translation", () => {
  it("translates values and omits empty ones", () => {
    expect(toRefineFilters(definitions, { title: "dub", inStock: undefined, genre: [] })).toEqual([
      { field: "title", operator: "contains", value: "dub" },
    ]);
  });

  it("preserves false and 0", () => {
    expect(toRefineFilters(definitions, { inStock: false, authorId: 0 })).toEqual([
      { field: "inStock", operator: "eq", value: false },
      { field: "authorId", operator: "eq", value: 0 },
    ]);
  });

  it("round-trips through Refine filters", () => {
    const values = { title: "dub", inStock: false, genre: ["fiction"], authorId: 0 };
    expect(fromRefineFilters(definitions, toRefineFilters(definitions, values))).toEqual(values);
  });

  it("ignores filters it does not own and normalizes URL strings", () => {
    const restored = fromRefineFilters(definitions, [
      { field: "inStock", operator: "eq", value: "false" },
      { field: "genre", operator: "in", value: "fiction" },
      { field: "price", operator: "gt", value: 10 },
    ]);
    expect(restored).toEqual({ inStock: false, genre: ["fiction"] });
  });
});

describe("Refine sorter translation", () => {
  it("maps antd sorter state and drops cleared columns", () => {
    expect(
      toRefineSorters<Book>([
        { columnKey: "title", order: "ascend" },
        { field: "price", order: "descend" },
        { columnKey: "genre", order: null },
      ]),
    ).toEqual([
      { field: "title", order: "asc" },
      { field: "price", order: "desc" },
    ]);
  });
});
