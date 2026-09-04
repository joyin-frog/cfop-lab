import assert from "node:assert/strict";
import test from "node:test";
import { chooseHydratedState, mergeFirstLoginState } from "../src/lib/learningState.js";

test("first login merges local progress without losing existing cloud cases", () => {
  const local = {
    progress: { "oll-27": { status: "mastered", updatedAt: 200 } },
    favorites: { "oll-27": true },
    reviewHistory: ["2026-09-04"],
  };
  const remote = {
    progress: { "pll-T": { status: "learning", updatedAt: 100 } },
    favorites: { "pll-T": true },
    reviewHistory: ["2026-09-03"],
  };

  assert.deepEqual(mergeFirstLoginState(local, remote), {
    progress: {
      "pll-T": { status: "learning", updatedAt: 100 },
      "oll-27": { status: "mastered", updatedAt: 200 },
    },
    favorites: { "pll-T": true, "oll-27": true },
    reviewHistory: ["2026-09-03", "2026-09-04"],
  });
});

test("a different signed-in user never inherits the previous account's local state", () => {
  const local = { progress: { "oll-27": { status: "mastered" } } };
  const remote = { progress: { "pll-T": { status: "learning" } }, updated_at: "2026-09-04T00:00:00Z" };
  const result = chooseHydratedState({ local, remote, localOwner: "user-a", userId: "user-b" });

  assert.deepEqual(result.progress, { "pll-T": { status: "learning" } });
});

test("newer offline local changes win when the same user reconnects", () => {
  const local = { progress: { "oll-27": { status: "mastered" } } };
  const remote = { progress: { "oll-27": { status: "learning" } }, updated_at: "2026-09-04T00:00:00Z" };
  const result = chooseHydratedState({
    local,
    remote,
    localOwner: "user-a",
    userId: "user-a",
    localChangedAt: Date.parse("2026-09-04T00:05:00Z"),
  });

  assert.equal(result.progress["oll-27"].status, "mastered");
});
