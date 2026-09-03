export function probabilityPercent(item) {
  if (!item?.probabilityDenominator) return null;
  return 100 / item.probabilityDenominator;
}

export function formatProbability(item) {
  const percent = probabilityPercent(item);
  if (percent === null) return null;
  return `1/${item.probabilityDenominator} · ${percent.toFixed(2)}%`;
}

export function compareProbability(first, second) {
  const firstDenominator = first.probabilityDenominator ?? Number.POSITIVE_INFINITY;
  const secondDenominator = second.probabilityDenominator ?? Number.POSITIVE_INFINITY;
  return firstDenominator - secondDenominator
    || first.id.localeCompare(second.id, undefined, { numeric: true });
}
