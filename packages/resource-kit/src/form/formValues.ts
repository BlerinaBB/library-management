import dayjs from "dayjs";
import type { Dayjs } from "dayjs";
import { isMissing } from "../config/formatting";
import type { DateInput } from "../types/keys";

/** API date value → date-picker value. Missing or invalid values become `null`. */
export function toDayjs(value: DateInput | null | undefined): Dayjs | null {
  if (isMissing(value)) return null;
  const parsed = dayjs.isDayjs(value) ? value : dayjs(value);
  return parsed.isValid() ? parsed : null;
}

/** Date-picker value → API date string. Defaults to a date-only ISO string. */
export function fromDayjs(value: Dayjs | null | undefined, format = "YYYY-MM-DD"): string | null {
  return value && value.isValid() ? value.format(format) : null;
}
