import type { FilterValue, FilterValues } from "../types/filter";

/** Unset filters are `undefined`, `null`, `""` or `[]`. `false` and `0` are real filter values. */
export function isEmptyFilterValue(value: unknown): value is undefined | null | "" | readonly [] {
  return value === undefined || value === null || value === "" || (Array.isArray(value) && value.length === 0);
}

/** Returns a new state with `key` set, dropping it when the value is empty. */
export function setFilterValue(values: FilterValues, key: string, value: FilterValue | undefined): FilterValues {
  const { [key]: _previous, ...rest } = values;
  return isEmptyFilterValue(value) ? rest : { ...rest, [key]: value };
}
