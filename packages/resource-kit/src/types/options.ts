import type { ReactNode } from "react";

/** A selectable value with its display label, shared by enum columns, filters and fields. */
export interface EnumOption<V extends string | number = string | number> {
  value: V;
  label: ReactNode;
  /** Optional antd Tag color used by enum columns. */
  color?: string;
}
