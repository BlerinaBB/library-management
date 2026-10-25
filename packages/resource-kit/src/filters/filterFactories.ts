import type { InputProps } from "antd";
import type { ReactNode } from "react";
import { humanize } from "../config/defineResource";
import type {
  BooleanFilterDef,
  EnumFilterDef,
  FilterOperator,
  RelationFilterDef,
  TextFilterDef,
} from "../types/filter";
import type { BooleanKey, EnumKey, StringKey } from "../types/keys";
import type { EnumOption } from "../types/options";
import type { AnyRelation, RelationSelectProps } from "../types/relation";

interface FilterOptions {
  /** Unique key within a table. Defaults to the field name. */
  key?: string;
  label?: ReactNode;
  operator?: FilterOperator;
  placeholder?: string;
}

export interface TextFilterOptions extends FilterOptions {
  inputProps?: Omit<InputProps, "value" | "onChange">;
}

export interface BooleanFilterOptions extends FilterOptions {
  trueLabel?: ReactNode;
  falseLabel?: ReactNode;
}

export interface EnumFilterOptions<V extends string | number> extends FilterOptions {
  options: ReadonlyArray<EnumOption<V>>;
  /** Allows several values; the default operator becomes `in`. */
  multiple?: boolean;
  selectProps?: EnumFilterDef<unknown>["selectProps"];
}

export interface RelationFilterOptions extends FilterOptions {
  multiple?: boolean;
  selectProps?: RelationSelectProps["selectProps"];
}

export interface FilterFactories {
  /** Defaults to the `contains` operator. */
  text<T>(field: StringKey<T>, options?: TextFilterOptions): TextFilterDef<T>;
  /** Defaults to the `eq` operator. */
  boolean<T>(field: BooleanKey<T>, options?: BooleanFilterOptions): BooleanFilterDef<T>;
  /** Defaults to `eq`, or `in` when `multiple` is set. */
  enum<T, K extends EnumKey<T>>(
    field: K,
    options: EnumFilterOptions<Extract<NonNullable<T[K]>, string | number>>,
  ): EnumFilterDef<T>;
  /** Filters by the relation's foreign key. Defaults to `eq`, or `in` when `multiple` is set. */
  relation<T>(relation: AnyRelation<T>, options?: RelationFilterOptions): RelationFilterDef<T>;
}

/** Pure factories for filter definitions. Rendering, state and Refine translation live elsewhere. */
export const filters: FilterFactories = {
  text(field, options = {}) {
    const { key = field, label = humanize(field), operator = "contains", ...rest } = options;
    return { type: "text", key, field, label, operator, ...rest };
  },

  boolean(field, options = {}) {
    const { key = field, label = humanize(field), operator = "eq", trueLabel = "Yes", falseLabel = "No", ...rest } = options;
    return { type: "boolean", key, field, label, operator, trueLabel, falseLabel, ...rest };
  },

  enum(field, options) {
    const { multiple = false, key = field, label = humanize(field), operator = multiple ? "in" : "eq", ...rest } = options;
    return { type: "enum", key, field, label, operator, multiple, ...rest };
  },

  relation(relation, options = {}) {
    const field = relation.foreignKey;
    const { multiple = false, key = field, label = humanize(field), operator = multiple ? "in" : "eq", ...rest } = options;
    return { type: "relation", key, field, label, operator, multiple, relation, ...rest };
  },
};
