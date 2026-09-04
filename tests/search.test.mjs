import assert from "node:assert/strict";
import test from "node:test";
import { casesByStage, stageMeta } from "../src/data/cfopData.js";
import { searchCases } from "../src/lib/search.js";

const allCases = Object.values(casesByStage).flat();

test("global search spans F2L, OLL, and PLL", () => {
  const stages = new Set(searchCases(allCases, "R U R", stageMeta, 119).map((item) => item.stage));
  assert.ok(stages.has("f2l"));
  assert.ok(stages.has("oll"));
  assert.ok(stages.has("pll"));
});

test("global search ranks an exact stage and number first", () => {
  const [result] = searchCases(allCases, "OLL 27", stageMeta);
  assert.equal(result.stage, "oll");
  assert.equal(result.id, "27");
});

test("global search finds localized aliases", () => {
  const results = searchCases(allCases, "小鱼", stageMeta);
  assert.ok(results.length > 0);
  assert.ok(results.every((item) => `${item.alias} ${item.group} ${item.name}`.includes("小鱼")));
});
