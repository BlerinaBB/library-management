import dayjs from "dayjs";
import { describe, expect, it } from "vitest";
import { formatDate, formatMoney, formatNumber, isMissing } from "../src/config/formatting";
import { fromDayjs, toDayjs } from "../src/form/formValues";

describe("isMissing", () => {
  it("treats null, undefined, empty string and NaN as missing", () => {
    expect([null, undefined, "", Number.NaN].every(isMissing)).toBe(true);
  });

  it("keeps false and 0 as values", () => {
    expect(isMissing(false)).toBe(false);
    expect(isMissing(0)).toBe(false);
  });
});

describe("formatters", () => {
  it("formats money with the configured locale and currency", () => {
    expect(formatMoney(1234.5, { locale: "en-US", currency: "USD" })).toBe("$1,234.50");
    expect(formatMoney(1234.5, { locale: "de-DE", currency: "EUR" })).toBe("1.234,50 €");
  });

  it("formats zero instead of treating it as missing", () => {
    expect(formatMoney(0, { locale: "en-US", currency: "USD" })).toBe("$0.00");
    expect(formatNumber(0, { locale: "en-US" })).toBe("0");
  });

  it("returns undefined for missing values", () => {
    expect(formatMoney(null)).toBeUndefined();
    expect(formatNumber(undefined)).toBeUndefined();
    expect(formatDate("")).toBeUndefined();
  });

  it("formats money without a currency as a two-decimal number", () => {
    expect(formatMoney(3, { locale: "en-US" })).toBe("3.00");
  });

  it("reads date-only strings as local dates", () => {
    expect(formatDate("1990-01-02", { locale: "en-US", dateFormat: { year: "numeric", month: "2-digit", day: "2-digit" } })).toBe(
      "01/02/1990",
    );
  });

  it("returns the raw value for unparseable dates", () => {
    expect(formatDate("not a date")).toBe("not a date");
  });
});

describe("form value conversion", () => {
  it("round-trips API dates through Dayjs", () => {
    const value = toDayjs("2024-02-29");
    expect(value?.format("YYYY-MM-DD")).toBe("2024-02-29");
    expect(fromDayjs(value)).toBe("2024-02-29");
  });

  it("maps missing and invalid values to null", () => {
    expect(toDayjs(null)).toBeNull();
    expect(toDayjs("garbage")).toBeNull();
    expect(fromDayjs(null)).toBeNull();
    expect(fromDayjs(dayjs("garbage"))).toBeNull();
  });
});
