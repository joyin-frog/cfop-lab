import { Alg } from "cubing/alg";

export const AUF_OPTIONS = ["", "U", "U2", "U'"];

export function normalizeAlgorithm(algorithm) {
  return algorithm.replace(/2'/g, "2").replace(/\s+/g, " ").trim();
}

export function invertAlgorithm(algorithm) {
  return normalizeAlgorithm(new Alg(algorithm).invert().toString());
}

export function trainingAlgorithms(item, auf = "") {
  const solution = normalizeAlgorithm([auf, item.algorithm].filter(Boolean).join(" "));
  return { solution, setup: invertAlgorithm(solution) };
}
