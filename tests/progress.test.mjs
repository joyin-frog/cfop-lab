import assert from "node:assert/strict";
import test from "node:test";
import { isReviewDue, markMastered, progressStatus, rateReview, startLearning } from "../src/lib/progress.js";

const DAY_MS = 24 * 60 * 60 * 1000;
const NOW = Date.UTC(2026, 8, 4, 0, 0, 0);

test("a new case moves through learning into the first review interval", () => {
  const learning = startLearning(undefined, NOW);
  assert.equal(progressStatus(learning), "learning");

  const mastered = markMastered(learning, NOW);
  assert.equal(progressStatus(mastered), "mastered");
  assert.equal(mastered.reviewAt, NOW + 3 * DAY_MS);
  assert.equal(isReviewDue(mastered, NOW + 3 * DAY_MS), true);
});

test("review ratings keep uncertain cases close and extend fluent cases", () => {
  const mastered = markMastered(undefined, NOW);
  const again = rateReview(mastered, "again", NOW + 3 * DAY_MS);
  const hard = rateReview(mastered, "hard", NOW + 3 * DAY_MS);
  const good = rateReview(mastered, "good", NOW + 3 * DAY_MS);

  assert.equal(progressStatus(again), "learning");
  assert.equal(hard.reviewAt, NOW + 5 * DAY_MS);
  assert.equal(good.reviewAt, NOW + 10 * DAY_MS);
});
