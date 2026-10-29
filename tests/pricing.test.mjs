import assert from "node:assert/strict";
import { test } from "node:test";
import { priceToMinorUnits } from "../src/lib/pricing.ts";

test("price amounts convert using the selected currency's minor unit", () => {
  assert.equal(priceToMinorUnits("12.34", "USD"), 1234);
  assert.equal(priceToMinorUnits("12.3", "EUR"), 1230);
  assert.equal(priceToMinorUnits("120", "JPY"), 120);
});

test("price amounts reject unsupported precision and invalid values", () => {
  assert.equal(priceToMinorUnits("12.34", "JPY"), null);
  assert.equal(priceToMinorUnits("12.345", "GBP"), null);
  assert.equal(priceToMinorUnits("-1", "USD"), null);
  assert.equal(priceToMinorUnits("1000000000", "USD"), null);
});
