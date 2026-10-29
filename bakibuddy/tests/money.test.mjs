import assert from "node:assert/strict";
import test from "node:test";
import { formatMYR } from "../src/utils/money.ts";

test("formats zero and single sen amounts", () => {
  assert.equal(formatMYR(0), "RM0.00");
  assert.equal(formatMYR(1), "RM0.01");
  assert.equal(formatMYR(99), "RM0.99");
});
test("keeps exactly two decimal places and thousands separators", () => {
  assert.equal(formatMYR(100), "RM1.00");
  assert.equal(formatMYR(124580), "RM1,245.80");
  assert.equal(formatMYR(15013), "RM150.13");
});
test("handles negatives and negative zero", () => {
  assert.equal(formatMYR(-1), "−RM0.01");
  assert.equal(formatMYR(-124580), "−RM1,245.80");
  assert.equal(formatMYR(-0), "RM0.00");
});
test("preserves the safe integer boundaries", () => {
  assert.equal(formatMYR(Number.MAX_SAFE_INTEGER), "RM90,071,992,547,409.91");
  assert.equal(formatMYR(Number.MIN_SAFE_INTEGER), "−RM90,071,992,547,409.91");
});
test("rejects fractional sen, nonfinite values, and unsafe integers", () => {
  for (const value of [
    0.1,
    1250.5,
    NaN,
    Infinity,
    -Infinity,
    Number.MAX_SAFE_INTEGER + 1,
  ]) {
    assert.throws(() => formatMYR(value), RangeError);
  }
});
test("rejects missing and nonnumeric values at the runtime boundary", () => {
  for (const value of [undefined, null, "1250"])
    assert.throws(() => formatMYR(value), RangeError);
});
