import { Alg } from "cubing/alg";

export const AUF_OPTIONS = ["", "U", "U2", "U'"];
export const OLL_TRAINING_REMAINDER = "M2 U M U2 M' U M2";

export function normalizeAlgorithm(algorithm) {
  return algorithm.replace(/2'/g, "2").replace(/\s+/g, " ").trim();
}

export function invertAlgorithm(algorithm) {
  return normalizeAlgorithm(new Alg(algorithm).invert().toString());
}

export function setupForSolution(item, solution = item.algorithm) {
  const inverse = invertAlgorithm(solution);
  if (item.stage?.toLowerCase() !== "oll") return inverse;
  return normalizeAlgorithm(`${OLL_TRAINING_REMAINDER} ${inverse}`);
}

export function trainingAlgorithms(item, auf = "") {
  const solution = normalizeAlgorithm([auf, item.algorithm].filter(Boolean).join(" "));
  return { solution, setup: setupForSolution(item, solution) };
}
