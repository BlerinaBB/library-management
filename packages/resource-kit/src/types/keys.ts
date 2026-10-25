import type { Dayjs } from "dayjs";

/** Primary or foreign key value. */
export type RecordId = string | number;

/** Values the date formatters and converters understand. */
export type DateInput = string | number | Date | Dayjs;

/**
 * Keys of `T` whose non-null value type is assignable to `V`.
 * Used to restrict factories to compatible fields, e.g. money → numeric keys.
 */
export type KeysOfType<T, V> = {
  [K in keyof T]-?: NonNullable<T[K]> extends V ? K : never;
}[keyof T] &
  string;

export type StringKey<T> = KeysOfType<T, string>;
export type NumberKey<T> = KeysOfType<T, number>;
export type BooleanKey<T> = KeysOfType<T, boolean>;
export type DateKey<T> = KeysOfType<T, DateInput>;
export type IdKey<T> = KeysOfType<T, RecordId>;
export type EnumKey<T> = KeysOfType<T, string | number>;
