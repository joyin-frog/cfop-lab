import { mkdir, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { Alg } from "cubing/alg";
import { puzzles } from "cubing/puzzles";
import { f2lCases, ollCases, pllCases } from "../src/data/cfopData.js";
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const outputDir = path.join(root, "public", "diagrams");
const puzzle = await puzzles["3x3x3"].kpuzzle();
const llTemplate = await puzzles["3x3x3"].llSVG();
const fullTemplate = await puzzles["3x3x3"].svg();
function colorMap(template) { const colors = new Map(); for (const match of template.matchAll(/id="([A-Z]+-l\d+-o\d+)"[^>]*style="fill:\s*([^";]+)[^"]*"/g)) colors.set(match[1], match[2].trim()); return colors; }
function render(template, pattern, title, recognition = false) {
  const original = colorMap(template); const fills = new Map();
  for (const orbit of puzzle.definition.orbits) { const state = pattern.patternData[orbit.orbitName]; for (let location = 0; location < orbit.numPieces; location += 1) { for (let orientation = 0; orientation < orbit.numOrientations; orientation += 1) { const target = `${orbit.orbitName}-l${location}-o${orientation}`; const sourceOrientation = (orbit.numOrientations - state.orientation[location] + orientation) % orbit.numOrientations; const source = `${orbit.orbitName}-l${state.pieces[location]}-o${sourceOrientation}`; const color = original.get(source); fills.set(target, recognition ? (color === "yellow" ? "#f3cf24" : "#333a46") : color); } } }
  return template.replace(/<title>[^<]*<\/title>/, `<title>${title}</title>`).replace('width="288px" height="288px"', 'width="288" height="288"').replace(/id="([A-Z]+-l\d+-o\d+)"([^>]*)style="fill:\s*[^";]+[^"]*"/g, (full, id, rest) => fills.has(id) ? `id="${id}"${rest}style="fill: ${fills.get(id)}"` : full);
}
await mkdir(outputDir, { recursive: true });
for (const item of ollCases) { const pattern = puzzle.defaultPattern().applyAlg("z2").applyAlg(new Alg(item.algorithm).invert()); await writeFile(path.join(outputDir, `oll-${item.id.toLowerCase()}.svg`), render(llTemplate, pattern, `${item.name} OLL`, true), "utf8"); }
for (const item of pllCases) { const pattern = puzzle.defaultPattern().applyAlg("z2").applyAlg(new Alg(item.algorithm).invert()); await writeFile(path.join(outputDir, `pll-${item.id.toLowerCase()}.svg`), render(llTemplate, pattern, `${item.name} PLL`), "utf8"); }
for (const item of f2lCases) { const pattern = puzzle.defaultPattern().applyAlg(new Alg(item.algorithm).invert()); await writeFile(path.join(outputDir, `f2l-${item.id.toLowerCase()}.svg`), render(fullTemplate, pattern, `${item.name} F2L`), "utf8"); }
console.log(`Generated ${f2lCases.length + ollCases.length + pllCases.length} CFOP diagrams in ${outputDir}`);
