import type { InputProps, SelectProps } from "antd";
import type { ReactNode } from "react";
import type { BooleanKey, EnumKey, StringKey } from "./keys";
import type { EnumOption } from "./options";
import type { AnyRelation, RelationSelectProps } from "./relation";

/** Operator names. They match Refine's `CrudOperators`, so translation is lossless. */
export type FilterOperator =
  | "eq"
  | "ne"
  | "lt"
  | "lte"
  | "gt"
  | "gte"
  | "in"
  | "nin"
  | "contains"
  | "ncontains"
  | "containss"
  | "startswith"
  | "endswith";

export type FilterValue = string | number | boolean | ReadonlyArray<string | number>;

/** Controlled filter state, keyed by `FilterDef.key`. */
export type FilterValues = Readonly<Record<string, FilterValue | undefined>>;

interface FilterBase {
  /** Unique key within one table. Defaults to `field`. */
  key: string;
  /** Record field the filter applies to. */
  field: string;
  label: ReactNode;
  operator: FilterOperator;
  placeholder?: string;
}

export interface TextFilterDef<T> extends FilterBase {
  type: "text";
  field: StringKey<T>;
  inputProps?: Omit<InputProps, "value" | "onChange">;
}

export interface BooleanFilterDef<T> extends FilterBase {
  type: "boolean";
  field: BooleanKey<T>;
  trueLabel: ReactNode;
  falseLabel: ReactNode;
}

export interface EnumFilterDef<T> extends FilterBase {
  type: "enum";
  field: EnumKey<T>;
  options: ReadonlyArray<EnumOption>;
  multiple: boolean;
  selectProps?: Omit<SelectProps, "value" | "onChange" | "mode" | "options">;
}

export interface RelationFilterDef<T> extends FilterBase {
  type: "relation";
  relation: AnyRelation<T>;
  multiple: boolean;
  selectProps?: RelationSelectProps["selectProps"];
}

export type FilterDef<T> = TextFilterDef<T> | BooleanFilterDef<T> | EnumFilterDef<T> | RelationFilterDef<T>;
