import type { ReactNode } from "react";

/** Display options shared by column factories. Every field is optional. */
export interface FormatOptions {
  /** BCP 47 locale. Defaults to the runtime locale. */
  locale?: string;
  /** ISO 4217 currency code used by money columns and fields. */
  currency?: string;
  /** Options for `Intl.DateTimeFormat`. Defaults to `{ dateStyle: "medium" }`. */
  dateFormat?: Intl.DateTimeFormatOptions;
  /** Options for `Intl.NumberFormat` used by number columns. */
  numberFormat?: Intl.NumberFormatOptions;
  /** Rendered for `null`, `undefined` and empty strings. Defaults to an em dash. */
  emptyText?: ReactNode;
  /** Labels for boolean columns. */
  booleanLabels?: { true: ReactNode; false: ReactNode };
}
