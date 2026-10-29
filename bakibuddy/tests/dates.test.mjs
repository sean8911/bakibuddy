import assert from "node:assert/strict";
import test from "node:test";
import { FINANCIAL_TIMEZONE, formatFinancialDate } from "../src/utils/dates.ts";

test("uses the Malaysian financial timezone", () =>
  assert.equal(FINANCIAL_TIMEZONE, "Asia/Kuala_Lumpur"));
test("formats date-only values without changing the day", () => {
  assert.equal(formatFinancialDate("2026-10-26"), "26 Oct");
  assert.equal(formatFinancialDate("2026-11-01"), "1 Nov");
  assert.equal(formatFinancialDate("2026-01-01"), "1 Jan");
});
test("accepts a real leap day", () =>
  assert.equal(formatFinancialDate("2024-02-29"), "29 Feb"));
test("rejects impossible dates and timestamps", () => {
  for (const value of [
    "2026-02-29",
    "2026-02-30",
    "2026-13-01",
    "2026-00-01",
    "2026-10-32",
    "26/10/2026",
    "2026-10-26T00:00:00Z",
    "",
  ]) {
    assert.throws(() => formatFinancialDate(value), RangeError);
  }
});
