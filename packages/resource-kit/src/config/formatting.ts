import dayjs from "dayjs";
import type { DateInput } from "../types/keys";
import type { FormatOptions } from "../types/format";

export const DEFAULT_EMPTY_TEXT = "—";
const DEFAULT_DATE_FORMAT: Intl.DateTimeFormatOptions = { dateStyle: "medium" };

/** `null`, `undefined`, empty strings and `NaN` are missing. `false` and `0` are values. */
export function isMissing(value: unknown): value is null | undefined | "" {
  return value === null || value === undefined || value === "" || (typeof value === "number" && Number.isNaN(value));
}

export function mergeFormat(defaults: FormatOptions, overrides?: FormatOptions): FormatOptions {
  return overrides ? { ...defaults, ...overrides } : defaults;
}

const formatterCache = new Map<string, Intl.NumberFormat | Intl.DateTimeFormat>();

function numberFormatter(locale: string | undefined, options: Intl.NumberFormatOptions): Intl.NumberFormat {
  const key = `n|${locale ?? ""}|${JSON.stringify(options)}`;
  let formatter = formatterCache.get(key) as Intl.NumberFormat | undefined;
  if (!formatter) {
    formatter = new Intl.NumberFormat(locale, options);
    formatterCache.set(key, formatter);
  }
  return formatter;
}

function dateFormatter(locale: string | undefined, options: Intl.DateTimeFormatOptions): Intl.DateTimeFormat {
  const key = `d|${locale ?? ""}|${JSON.stringify(options)}`;
  let formatter = formatterCache.get(key) as Intl.DateTimeFormat | undefined;
  if (!formatter) {
    formatter = new Intl.DateTimeFormat(locale, options);
    formatterCache.set(key, formatter);
  }
  return formatter;
}

/** Parses a date value. Date-only strings are read as local dates, which avoids off-by-one-day display. */
export function toDate(value: DateInput): Date | undefined {
  const parsed = dayjs.isDayjs(value) ? value : dayjs(value);
  return parsed.isValid() ? parsed.toDate() : undefined;
}

/** Returns `undefined` for missing values and the raw string for unparseable dates. */
export function formatDate(value: DateInput | null | undefined, options: FormatOptions = {}): string | undefined {
  if (isMissing(value)) return undefined;
  const date = toDate(value);
  if (!date) return String(value);
  return dateFormatter(options.locale, options.dateFormat ?? DEFAULT_DATE_FORMAT).format(date);
}

export function formatNumber(value: number | null | undefined, options: FormatOptions = {}): string | undefined {
  if (isMissing(value)) return undefined;
  return numberFormatter(options.locale, options.numberFormat ?? {}).format(value);
}

/** Formats with the configured currency, or as a two-decimal number when no currency is configured. */
export function formatMoney(value: number | null | undefined, options: FormatOptions = {}): string | undefined {
  if (isMissing(value)) return undefined;
  const intlOptions: Intl.NumberFormatOptions = options.currency
    ? { style: "currency", currency: options.currency }
    : { minimumFractionDigits: 2, maximumFractionDigits: 2 };
  return numberFormatter(options.locale, intlOptions).format(value);
}

/** Currency symbol and fraction digits, used by money inputs. */
export function currencyDisplay(currency: string, locale?: string): { symbol: string; fractionDigits: number } {
  const formatter = numberFormatter(locale, { style: "currency", currency });
  const symbol = formatter.formatToParts(0).find((part) => part.type === "currency")?.value ?? currency;
  return { symbol, fractionDigits: formatter.resolvedOptions().maximumFractionDigits ?? 2 };
}
