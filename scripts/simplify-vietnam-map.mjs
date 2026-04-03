import fs from "node:fs";
import path from "node:path";

const INPUT_PATH = path.join(process.cwd(), "interactive-map/public/data/vietnam-34-provinces.geojson");
const OUTPUT_PATH = path.join(process.cwd(), "interactive-map/public/data/vietnam-34-provinces-simplified.geojson");
const TOLERANCE = 0.0018;

function getSqSegDist(point, start, end) {
  let x = start[0];
  let y = start[1];
  let dx = end[0] - x;
  let dy = end[1] - y;

  if (dx !== 0 || dy !== 0) {
    const t = ((point[0] - x) * dx + (point[1] - y) * dy) / (dx * dx + dy * dy);

    if (t > 1) {
      x = end[0];
      y = end[1];
    } else if (t > 0) {
      x += dx * t;
      y += dy * t;
    }
  }

  dx = point[0] - x;
  dy = point[1] - y;
  return dx * dx + dy * dy;
}

function simplifyDPStep(points, first, last, sqTolerance, simplified) {
  let maxSqDist = sqTolerance;
  let index = -1;

  for (let pointIndex = first + 1; pointIndex < last; pointIndex += 1) {
    const sqDist = getSqSegDist(points[pointIndex], points[first], points[last]);

    if (sqDist > maxSqDist) {
      index = pointIndex;
      maxSqDist = sqDist;
    }
  }

  if (index === -1) {
    return;
  }

  if (index - first > 1) {
    simplifyDPStep(points, first, index, sqTolerance, simplified);
  }

  simplified.push(points[index]);

  if (last - index > 1) {
    simplifyDPStep(points, index, last, sqTolerance, simplified);
  }
}

function simplifyLine(points, tolerance) {
  if (!Array.isArray(points) || points.length <= 2) {
    return points;
  }

  const sqTolerance = tolerance * tolerance;
  const simplified = [points[0]];

  simplifyDPStep(points, 0, points.length - 1, sqTolerance, simplified);
  simplified.push(points.at(-1));

  return simplified;
}

function ensureClosedRing(points) {
  if (!Array.isArray(points) || points.length === 0) {
    return points;
  }

  const firstPoint = points[0];
  const lastPoint = points.at(-1);
  if (firstPoint[0] === lastPoint[0] && firstPoint[1] === lastPoint[1]) {
    return points;
  }

  return [...points, firstPoint];
}

function simplifyCoordinates(node, tolerance) {
  if (!Array.isArray(node) || node.length === 0) {
    return node;
  }

  if (typeof node[0]?.[0] === "number") {
    const simplifiedRing = ensureClosedRing(simplifyLine(node, tolerance));
    return simplifiedRing.length >= 4 ? simplifiedRing : node;
  }

  return node.map((childNode) => simplifyCoordinates(childNode, tolerance));
}

function countPoints(node) {
  if (!Array.isArray(node)) {
    return 0;
  }

  if (typeof node[0] === "number") {
    return 1;
  }

  return node.reduce((total, childNode) => total + countPoints(childNode), 0);
}

const rawPayload = fs.readFileSync(INPUT_PATH, "utf8");
const geojson = JSON.parse(rawPayload);
const beforeCount = countPoints(geojson.features.map((feature) => feature.geometry?.coordinates));

const simplifiedGeojson = {
  ...geojson,
  features: geojson.features.map((feature) => ({
    ...feature,
    geometry: {
      ...feature.geometry,
      coordinates: simplifyCoordinates(feature.geometry?.coordinates, TOLERANCE)
    }
  }))
};

const afterCount = countPoints(simplifiedGeojson.features.map((feature) => feature.geometry?.coordinates));

fs.writeFileSync(OUTPUT_PATH, JSON.stringify(simplifiedGeojson));

console.log(
  JSON.stringify(
    {
      input: path.relative(process.cwd(), INPUT_PATH),
      output: path.relative(process.cwd(), OUTPUT_PATH),
      tolerance: TOLERANCE,
      beforePoints: beforeCount,
      afterPoints: afterCount
    },
    null,
    2
  )
);
