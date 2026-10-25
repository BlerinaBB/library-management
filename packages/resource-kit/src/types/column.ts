import type { TableColumnType } from "antd";
import type { ReactNode } from "react";
import type { FormatOptions } from "./format";
import type { AnyRelation, RelationLookup } from "./relation";

/** An Ant Design column definition. */
export type TableColumn<T> = TableColumnType<T>;

/** Options accepted by every column factory. Column props override the factory defaults. */
export type ColumnOptions<T> = Partial<TableColumn<T>> & {
  /** Enables server-side sorting for this column. */
  sortable?: boolean;
  /** Per-column formatting, merged over the factory defaults. */
  format?: FormatOptions;
};

/**
 * A column whose rendering needs resolved relation data.
 * It is bound to a lookup at render time, so the factory stays pure.
 */
export interface RelationColumn<T> {
  readonly relation: AnyRelation<T>;
  readonly bind: (lookup: RelationLookup | undefined) => TableColumn<T>;
}

export type ResourceColumn<T> = TableColumn<T> | RelationColumn<T>;

/** A per-row action rendered by the actions column. */
export interface RowAction<T> {
  key: string;
  label: ReactNode;
  onClick: (record: T) => void;
  danger?: boolean;
  disabled?: boolean;
}
