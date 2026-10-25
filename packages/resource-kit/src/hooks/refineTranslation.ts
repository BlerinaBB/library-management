import type { CrudFilter, CrudOperators, CrudSort, LogicalFilter } from "@refinedev/core";
import type { TableProps } from "antd";
import { isEmptyFilterValue } from "../filters/filterValues";
import type { FilterDef, FilterOperator, FilterValue, FilterValues } from "../types/filter";
import type { SortDef } from "../types/resource";

// Compile-time guarantee that the kit's operator names are valid Refine operators.
type AssertOperators<T extends CrudOperators> = T;
export type RefineFilterOperator = AssertOperators<FilterOperator>;

function isLogicalFilter(filter: CrudFilter): filter is LogicalFilter {
  return "field" in filter;
}

/** Controlled filter values → Refine filters. Empty values are omitted; `false` and `0` are kept. */
export function toRefineFilters<T>(definitions: ReadonlyArray<FilterDef<T>>, values: FilterValues): LogicalFilter[] {
  const result: LogicalFilter[] = [];
  for (const definition of definitions) {
    const value = values[definition.key];
    if (isEmptyFilterValue(value)) continue;
    result.push({ field: definition.field, operator: definition.operator, value: Array.isArray(value) ? [...value] : value });
  }
  return result;
}

function normalizeValue<T>(definition: FilterDef<T>, value: unknown): FilterValue | undefined {
  if (isEmptyFilterValue(value)) return undefined;
  // Values restored from the URL arrive as strings.
  if (definition.type === "boolean" && typeof value === "string") return value === "true";
  if ((definition.type === "enum" || definition.type === "relation") && definition.multiple) {
    return (Array.isArray(value) ? value : [value]) as ReadonlyArray<string | number>;
  }
  return value as FilterValue;
}

/** Refine filters → controlled filter values, so Refine's filter state stays the single source of truth. */
export function fromRefineFilters<T>(definitions: ReadonlyArray<FilterDef<T>>, filters: ReadonlyArray<CrudFilter>): FilterValues {
  const values: Record<string, FilterValue> = {};
  for (const definition of definitions) {
    const match = filters.find(
      (filter) => isLogicalFilter(filter) && filter.field === definition.field && filter.operator === definition.operator,
    );
    const value = match ? normalizeValue(definition, match.value) : undefined;
    if (value !== undefined) values[definition.key] = value;
  }
  return values;
}

type SorterArg<T> = Parameters<NonNullable<TableProps<T>["onChange"]>>[2];

/** Ant Design sorter state → Refine sorters. Cleared columns are dropped. */
export function toRefineSorters<T>(sorter: SorterArg<T>): CrudSort[] {
  const sorters = Array.isArray(sorter) ? sorter : [sorter];
  return sorters.flatMap((item) => {
    const field = item.columnKey ?? (Array.isArray(item.field) ? item.field.join(".") : item.field);
    if (!item.order || field === undefined) return [];
    return [{ field: String(field), order: item.order === "ascend" ? "asc" : "desc" } satisfies CrudSort];
  });
}

export function toSortDefs<T>(sorters: ReadonlyArray<CrudSort>): SortDef<T>[] {
  return sorters.map((sorter) => ({ field: sorter.field as SortDef<T>["field"], order: sorter.order }));
}
