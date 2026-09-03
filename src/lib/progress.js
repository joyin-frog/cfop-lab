const DAY_MS = 24 * 60 * 60 * 1000;
const REVIEW_INTERVALS_DAYS = [3, 7, 14, 30, 60];

export function normalizeProgressEntry(value) {
  if (!value) return { status: "new" };
  if (typeof value === "string") return { status: value };
  return { status: "new", ...value };
}

export function progressStatus(value) {
  return normalizeProgressEntry(value).status;
}

export function isReviewDue(value, now = Date.now()) {
  const entry = normalizeProgressEntry(value);
  if (entry.status !== "mastered") return false;
  return !entry.reviewAt || entry.reviewAt <= now;
}

export function startLearning(value, now = Date.now()) {
  const entry = normalizeProgressEntry(value);
  return {
    ...entry,
    status: "learning",
    startedAt: entry.startedAt || now,
    reviewAt: null,
  };
}

export function markMastered(value, now = Date.now()) {
  const entry = normalizeProgressEntry(value);
  return {
    ...entry,
    status: "mastered",
    masteredAt: now,
    reviewLevel: 0,
    reviewAt: now + REVIEW_INTERVALS_DAYS[0] * DAY_MS,
  };
}

export function completeReview(value, now = Date.now()) {
  const entry = normalizeProgressEntry(value);
  const reviewLevel = Math.min((entry.reviewLevel || 0) + 1, REVIEW_INTERVALS_DAYS.length - 1);
  return {
    ...entry,
    status: "mastered",
    reviewLevel,
    reviewedAt: now,
    reviewAt: now + REVIEW_INTERVALS_DAYS[reviewLevel] * DAY_MS,
  };
}

export function formatReviewDate(value) {
  const entry = normalizeProgressEntry(value);
  if (!entry.reviewAt) return "现在可以复习";
  return `${new Date(entry.reviewAt).toLocaleDateString("zh-CN", { month: "numeric", day: "numeric" })} 复习`;
}
