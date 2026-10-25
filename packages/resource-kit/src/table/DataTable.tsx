import { Flex, Table } from "antd";
import type { TableProps } from "antd";
import { useMemo } from "react";
import type { ComponentType, ReactNode } from "react";
import { applySortOrder, resolveColumns } from "../columns/resolveColumns";
import { FilterBar } from "../filters/FilterBar";
import type { ResourceColumn } from "../types/column";
import type { FilterDef, FilterValues } from "../types/filter";
import type { RelationData, RelationSelectProps } from "../types/relation";
import type { SortDef } from "../types/resource";
import { useControllableState } from "./useControllableState";

const NO_FILTER_VALUES: FilterValues = {};

export interface DataTableProps<T> extends Omit<TableProps<T>, "columns"> {
  /** Column definitions from the column factories, or plain Ant Design columns. */
  columns: ReadonlyArray<ResourceColumn<T>>;
  /** Resolved related records for relation columns. */
  relationData?: RelationData;
  /** Controlled sort state reflected in sortable column headers. */
  sorters?: ReadonlyArray<SortDef<T>>;
  filters?: ReadonlyArray<FilterDef<T>>;
  /** Controlled filter state. Omit to let the table hold filter state itself. */
  filterValues?: FilterValues;
  defaultFilterValues?: FilterValues;
  onFilterValuesChange?: (values: FilterValues) => void;
  /** Component used by relation filters. */
  relationSelect?: ComponentType<RelationSelectProps>;
  /** Content rendered at the end of the filter bar. */
  toolbar?: ReactNode;
  /** Placeholder for unset select filters. */
  anyLabel?: string;
}

/**
 * Ant Design Table with typed column factories and a filter bar.
 * It renders filters and emits their values; it knows nothing about Refine or how filters are applied.
 */
export function DataTable<T>({
  columns,
  relationData,
  sorters,
  filters,
  filterValues,
  defaultFilterValues = NO_FILTER_VALUES,
  onFilterValuesChange,
  relationSelect,
  toolbar,
  anyLabel,
  rowKey = "id",
  ...tableProps
}: DataTableProps<T>) {
  const [values, setValues] = useControllableState(filterValues, defaultFilterValues, onFilterValuesChange);

  const resolvedColumns = useMemo(() => {
    const resolved = resolveColumns(columns, relationData);
    return sorters ? applySortOrder(resolved, sorters) : resolved;
  }, [columns, relationData, sorters]);

  const hasFilterBar = (filters && filters.length > 0) || toolbar;

  return (
    <Flex vertical gap="middle">
      {hasFilterBar && (
        <FilterBar
          filters={filters ?? []}
          values={values}
          onChange={setValues}
          relationSelect={relationSelect}
          anyLabel={anyLabel}
          extra={toolbar}
        />
      )}
      <Table<T> rowKey={rowKey} {...tableProps} columns={resolvedColumns} />
    </Flex>
  );
}
