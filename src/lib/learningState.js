export const LEARNING_STORAGE_KEYS = {
  progress: "cfop-lab-progress",
  favorites: "cfop-lab-favorites",
  reviewHistory: "cfop-lab-review-history",
  owner: "cfop-lab-cloud-user",
  changedAt: "cfop-lab-state-updated-at",
};

function objectValue(value) {
  return value && typeof value === "object" && !Array.isArray(value) ? value : {};
}

function arrayValue(value) {
  return Array.isArray(value) ? value : [];
}

function readJSON(storage, key, fallback) {
  try {
    const value = JSON.parse(storage.getItem(key));
    return value ?? fallback;
  } catch {
    return fallback;
  }
}

export function normalizeLearningState(value = {}) {
  return {
    progress: objectValue(value.progress),
    favorites: objectValue(value.favorites),
    reviewHistory: arrayValue(value.reviewHistory || value.review_history),
  };
}

export function readLocalLearningState(storage = localStorage) {
  return normalizeLearningState({
    progress: readJSON(storage, LEARNING_STORAGE_KEYS.progress, {}),
    favorites: readJSON(storage, LEARNING_STORAGE_KEYS.favorites, {}),
    reviewHistory: readJSON(storage, LEARNING_STORAGE_KEYS.reviewHistory, []),
  });
}

export function writeLocalLearningState(value, storage = localStorage) {
  const state = normalizeLearningState(value);
  storage.setItem(LEARNING_STORAGE_KEYS.progress, JSON.stringify(state.progress));
  storage.setItem(LEARNING_STORAGE_KEYS.favorites, JSON.stringify(state.favorites));
  storage.setItem(LEARNING_STORAGE_KEYS.reviewHistory, JSON.stringify(state.reviewHistory));
  return state;
}

export function touchLocalLearningState(storage = localStorage, now = Date.now()) {
  storage.setItem(LEARNING_STORAGE_KEYS.changedAt, String(now));
}

export function hasLearningData(value) {
  const state = normalizeLearningState(value);
  return Object.keys(state.progress).length > 0
    || Object.values(state.favorites).some(Boolean)
    || state.reviewHistory.length > 0;
}

function progressTimestamp(value) {
  if (!value || typeof value !== "object") return 0;
  return Math.max(
    Number(value.updatedAt) || 0,
    Number(value.reviewedAt) || 0,
    Number(value.masteredAt) || 0,
    Number(value.startedAt) || 0,
  );
}

export function mergeFirstLoginState(localValue, remoteValue) {
  const local = normalizeLearningState(localValue);
  const remote = normalizeLearningState(remoteValue);
  const progress = { ...remote.progress };

  for (const [key, entry] of Object.entries(local.progress)) {
    const remoteEntry = remote.progress[key];
    if (!remoteEntry || progressTimestamp(entry) > progressTimestamp(remoteEntry)) {
      progress[key] = entry;
    }
  }

  const favorites = { ...remote.favorites };
  for (const [key, favorite] of Object.entries(local.favorites)) {
    favorites[key] = Boolean(favorite || favorites[key]);
  }

  return {
    progress,
    favorites,
    reviewHistory: [...new Set([...remote.reviewHistory, ...local.reviewHistory])].sort(),
  };
}

export function chooseHydratedState({ local, remote, localOwner, userId, localChangedAt = 0 }) {
  if (!remote) {
    return localOwner && localOwner !== userId
      ? normalizeLearningState()
      : normalizeLearningState(local);
  }

  if (!localOwner) return mergeFirstLoginState(local, remote);
  if (localOwner !== userId) return normalizeLearningState(remote);

  const remoteChangedAt = Date.parse(remote.updated_at || "") || 0;
  return Number(localChangedAt) > remoteChangedAt
    ? normalizeLearningState(local)
    : normalizeLearningState(remote);
}
