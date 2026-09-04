function normalize(value) {
  return String(value ?? "").trim().toLocaleLowerCase("zh-CN").replace(/\s+/g, " ");
}

function searchableText(item, stageMeta) {
  const meta = stageMeta[item.stage] || {};
  return normalize([
    item.stage,
    meta.label,
    meta.title,
    item.id,
    `${meta.label || item.stage} ${item.id}`,
    item.name,
    item.alias,
    item.group,
    item.algorithm,
  ].join(" "));
}

function resultScore(item, needle, stageMeta) {
  const meta = stageMeta[item.stage] || {};
  const stage = normalize(meta.label || item.stage);
  const identity = `${stage} ${normalize(item.id)}`;
  const name = normalize(item.name);
  const alias = normalize(item.alias);

  if (identity === needle) return 0;
  if (name === needle || alias === needle) return 1;
  if (identity.startsWith(needle) || name.startsWith(needle) || alias.startsWith(needle)) return 2;
  if (normalize(item.id) === needle) return 3;
  return 4;
}

export function searchCases(cases, query, stageMeta, limit = 8) {
  const needle = normalize(query);
  if (!needle) return [];

  const tokens = needle.split(" ").filter(Boolean);
  return cases
    .map((item, index) => ({ item, index, haystack: searchableText(item, stageMeta) }))
    .filter(({ haystack }) => tokens.every((token) => haystack.includes(token)))
    .sort((first, second) => {
      const score = resultScore(first.item, needle, stageMeta) - resultScore(second.item, needle, stageMeta);
      return score || first.index - second.index;
    })
    .slice(0, limit)
    .map(({ item }) => item);
}
