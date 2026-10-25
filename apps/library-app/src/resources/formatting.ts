import { createColumnFactories } from "@library/resource-kit";
import type { FormatOptions } from "@library/resource-kit";

/** App-wide display conventions. Individual columns can still override them. */
export const libraryFormat: FormatOptions = {
  locale: "en-GB",
  currency: "EUR",
  dateFormat: { day: "numeric", month: "short", year: "numeric" },
  booleanLabels: { true: "Yes", false: "No" },
};

export const columns = createColumnFactories(libraryFormat);
