import assert from "node:assert/strict";
import test from "node:test";
import { puzzles } from "cubing/puzzles";
import { casesByStage } from "../src/data/cfopData.js";
import { invertAlgorithm, trainingAlgorithms } from "../src/lib/algorithms.js";

const cubeRotations = ["", "x", "x2", "x'"].flatMap((x) =>
  ["", "y", "y2", "y'"].flatMap((y) =>
    ["", "z", "z2", "z'"].map((z) => [x, y, z].filter(Boolean).join(" ")),
  ),
);

function normalizeCubeOrientation(pattern) {
  const restoreOrientation = cubeRotations.find((rotation) => {
    const candidate = rotation ? pattern.applyAlg(rotation) : pattern;
    return candidate.patternData.CENTERS.pieces.every((piece, location) => piece === location);
  });

  assert.notEqual(restoreOrientation, undefined, "algorithm must preserve a valid cube orientation");
  return restoreOrientation ? pattern.applyAlg(restoreOrientation) : pattern;
}

function assertSolvedLocations(orbit, firstLocation, label) {
  for (let location = firstLocation; location < orbit.pieces.length; location += 1) {
    assert.equal(orbit.pieces[location], location, `${label} moves piece at location ${location}`);
    assert.equal(orbit.orientation[location], 0, `${label} twists or flips piece at location ${location}`);
  }
}

function svgColorMap(template) {
  return new Map(
    [...template.matchAll(/id="([A-Z]+-l\d+-o\d+)"[^>]*style="fill:\s*([^";]+)/g)].map(
      (match) => [match[1], match[2].trim()],
    ),
  );
}

function recognitionSignature(puzzle, originalColors, visibleStickerIds, pattern) {
  return visibleStickerIds.map((id) => {
    const [, orbitName, locationText, orientationText] = id.match(/^([A-Z]+)-l(\d+)-o(\d+)$/);
    const location = Number(locationText);
    const orientation = Number(orientationText);
    const orbitDefinition = puzzle.definition.orbits.find((orbit) => orbit.orbitName === orbitName);
    const orbit = pattern.patternData[orbitName];
    const sourceOrientation =
      (orbitDefinition.numOrientations - orbit.orientation[location] + orientation)
      % orbitDefinition.numOrientations;
    const sourceId = `${orbitName}-l${orbit.pieces[location]}-o${sourceOrientation}`;
    return originalColors.get(sourceId) === "yellow" ? "1" : "0";
  }).join("");
}

test("CFOP case library keeps the expected case counts and unique IDs", () => {
  assert.equal(casesByStage.f2l.length, 41);
  assert.equal(casesByStage.oll.length, 57);
  assert.equal(casesByStage.pll.length, 21);

  for (const [stage, cases] of Object.entries(casesByStage)) {
    assert.equal(new Set(cases.map((item) => item.id)).size, cases.length, `${stage} contains duplicate IDs`);
  }
});

test("every stored formula can produce a setup algorithm", () => {
  for (const item of Object.values(casesByStage).flat()) {
    if (!item.algorithm) continue;
    assert.doesNotThrow(() => invertAlgorithm(item.algorithm), `${item.stage} ${item.id}`);
  }
});

test("training algorithms include AUF and return the inverse setup", () => {
  const result = trainingAlgorithms({ algorithm: "R U R'" }, "U2");
  assert.equal(result.solution, "U2 R U R'");
  assert.equal(result.setup, invertAlgorithm(result.solution));
});

test("every PLL algorithm changes only the last layer", async () => {
  const puzzle = await puzzles["3x3x3"].kpuzzle();

  for (const item of casesByStage.pll) {
    const pattern = normalizeCubeOrientation(puzzle.defaultPattern().applyAlg(item.algorithm));

    const { CORNERS, EDGES } = pattern.patternData;
    assertSolvedLocations(CORNERS, 4, `${item.id} PLL`);
    assertSolvedLocations(EDGES, 4, `${item.id} PLL`);
    assert.ok(
      CORNERS.pieces.slice(0, 4).some((piece, location) => piece !== location)
        || EDGES.pieces.slice(0, 4).some((piece, location) => piece !== location),
      `${item.id} does not create a PLL case`,
    );
  }
});

test("every OLL algorithm changes only the last layer", async () => {
  const puzzle = await puzzles["3x3x3"].kpuzzle();

  for (const item of casesByStage.oll) {
    const pattern = normalizeCubeOrientation(puzzle.defaultPattern().applyAlg(item.algorithm));
    const { CORNERS, EDGES } = pattern.patternData;

    assertSolvedLocations(CORNERS, 4, `${item.id} OLL`);
    assertSolvedLocations(EDGES, 4, `${item.id} OLL`);
  }
});

test("the OLL library produces all 57 distinct recognition patterns", async () => {
  const puzzle = await puzzles["3x3x3"].kpuzzle();
  const template = await puzzles["3x3x3"].llSVG();
  const originalColors = svgColorMap(template);
  const visibleTemplate = template.split('<g style="opacity: 0">')[0];
  const visibleStickerIds = [...visibleTemplate.matchAll(/id="([A-Z]+-l\d+-o\d+)"/g)].map(
    (match) => match[1],
  );
  const signatures = new Map();

  for (const item of casesByStage.oll) {
    const setup = invertAlgorithm(item.algorithm);
    const pattern = puzzle.defaultPattern().applyAlg("z2").applyAlg(setup);
    const signature = ["", "U", "U2", "U'"]
      .map((auf) => recognitionSignature(
        puzzle,
        originalColors,
        visibleStickerIds,
        auf ? pattern.applyAlg(auf) : pattern,
      ))
      .sort()[0];

    assert.equal(signatures.get(signature), undefined, `${item.id} duplicates OLL ${signatures.get(signature)}`);
    signatures.set(signature, item.id);
  }

  assert.equal(signatures.size, 57);
});

test("every F2L algorithm preserves the cross and the other three slots", async () => {
  const puzzle = await puzzles["3x3x3"].kpuzzle();
  const pairedMiddleEdge = new Map([
    [4, 8],
    [5, 9],
    [6, 11],
    [7, 10],
  ]);

  for (const item of casesByStage.f2l) {
    const pattern = normalizeCubeOrientation(puzzle.defaultPattern().applyAlg(item.algorithm));
    const { CORNERS, EDGES } = pattern.patternData;
    const label = `${item.id} F2L`;

    for (let location = 4; location < 8; location += 1) {
      assert.equal(EDGES.pieces[location], location, `${label} breaks the cross at edge ${location}`);
      assert.equal(EDGES.orientation[location], 0, `${label} flips cross edge ${location}`);
    }

    const disturbedCorners = [4, 5, 6, 7].filter(
      (location) => CORNERS.pieces[location] !== location || CORNERS.orientation[location] !== 0,
    );
    const disturbedEdges = [8, 9, 10, 11].filter(
      (location) => EDGES.pieces[location] !== location || EDGES.orientation[location] !== 0,
    );

    assert.ok(disturbedCorners.length <= 1, `${label} disturbs more than one F2L corner slot`);
    assert.ok(disturbedEdges.length <= 1, `${label} disturbs more than one F2L edge slot`);
    if (disturbedCorners.length && disturbedEdges.length) {
      assert.equal(
        pairedMiddleEdge.get(disturbedCorners[0]),
        disturbedEdges[0],
        `${label} disturbs pieces from different F2L slots`,
      );
    }
    assert.ok(disturbedCorners.length || disturbedEdges.length, `${label} does not create an F2L case`);
  }
});
