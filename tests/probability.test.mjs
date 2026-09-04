import assert from "node:assert/strict";
import test from "node:test";
import { compareProbability, formatProbability, probabilityPercent } from "../src/lib/probability.js";

test("probability labels show the theoretical ratio without a repeated percentage", () => {
  assert.equal(formatProbability({ probabilityDenominator: 54 }), "1/54");
  assert.equal(formatProbability({}), null);
});

test("percentage calculation and probability sorting remain available internally", () => {
  assert.equal(probabilityPercent({ probabilityDenominator: 54 }), 100 / 54);
  assert.ok(compareProbability({ id: "1", probabilityDenominator: 54 }, { id: "2", probabilityDenominator: 108 }) < 0);
});
