import { isRelationColumn } from "../config/defineResource";
import { relationKey } from "../config/relations";
import type { ResourceColumn, TableColumn } from "../types/column";
import type { RelationData } from "../types/relation";
import type { SortDef } from "../types/resource";

/** Binds relation columns to their resolved lookups, producing plain Ant Design columns. */
export function resolveColumns<T>(columns: ReadonlyArray<ResourceColumn<T>>, relationData?: RelationData): TableColumn<T>[] {
  return columns.map((column) =>
    isRelationColumn(column) ? column.bind(relationData?.[relationKey(column.relation)]) : column,
  );
}

/** Reflects externally controlled sorting in sortable columns. */
export function applySortOrder<T>(columns: ReadonlyArray<TableColumn<T>>, sorters: ReadonlyArray<SortDef<T>>): TableColumn<T>[] {
  return columns.map((column) => {
    if (!column.sorter || column.sortOrder !== undefined) return column;
    const sorter = sorters.find((sort) => sort.field === column.key);
    return { ...column, sortOrder: sorter ? (sorter.order === "asc" ? "ascend" : "descend") : null };
  });
}
