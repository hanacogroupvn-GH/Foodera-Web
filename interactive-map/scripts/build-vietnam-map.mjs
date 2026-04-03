import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { merge } from "topojson-client";

import { ARCHIPELAGO_FEATURES } from "../data/map-layers.js";
import { VIETNAM_PROVINCES } from "../data/vietnam-territory.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");
const sourcePath = path.join(rootDir, "data", "source", "vietnam-adm2-legacy.topo.json");
const publicDir = path.join(rootDir, "public", "data");
const provincesOutputPath = path.join(publicDir, "vietnam-34-provinces.geojson");
const archipelagoDetailedOutputPath = path.join(publicDir, "vietnam-archipelagos.geojson");
const SOURCE_GEOMETRY_OVERRIDES = {
  // The source topology still carries historical Hà Tây separately, so modern Hà Nội
  // must merge both shapes to avoid leaving the old Hà Tây footprint as a visual gap.
  "ha-noi": ["Hà Nội", "Hà Tây"],
};

function normalizeName(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/gi, "d")
    .replace(/[^a-z0-9]+/gi, "")
    .toLowerCase();
}

function pickObjectKey(topology) {
  const objectKey = Object.keys(topology.objects || {})[0];

  if (!objectKey) {
    throw new Error("Topology file does not contain any named object.");
  }

  return objectKey;
}

function roundNestedCoordinates(value) {
  if (Array.isArray(value)) {
    return value.map((item) => roundNestedCoordinates(item));
  }

  return typeof value === "number" ? Math.round(value * 100000) / 100000 : value;
}

async function main() {
  const topology = JSON.parse(await readFile(sourcePath, "utf8"));
  const objectKey = pickObjectKey(topology);
  const geometries = topology.objects[objectKey].geometries || [];

  const featureCollection = {
    type: "FeatureCollection",
    features: VIETNAM_PROVINCES.map((province) => {
      const sourceNames = SOURCE_GEOMETRY_OVERRIDES[province.id] ?? province.mergedFrom;
      const sourceGeometries = sourceNames.map((legacyName) => {
        const geometry = geometries.find(
          (candidate) => normalizeName(candidate.properties?.name_vi) === normalizeName(legacyName),
        );

        if (!geometry) {
          throw new Error(`Missing source geometry for "${legacyName}" while building "${province.name}".`);
        }

        return geometry;
      });

      const mergedGeometry = merge(topology, sourceGeometries);

      return {
        type: "Feature",
        properties: {
          id: province.id,
          name: province.name,
          type: province.type,
          region: province.region,
          mergedFrom: province.mergedFrom,
          areaKm2: province.areaKm2,
          population: province.population,
        },
        geometry: {
          ...mergedGeometry,
          coordinates: roundNestedCoordinates(mergedGeometry.coordinates),
        },
      };
    }),
  };

  const archipelagoDetailedCollection = {
    type: "FeatureCollection",
    features: ARCHIPELAGO_FEATURES.features.map((feature) => ({
      ...feature,
      geometry: {
        ...feature.geometry,
        coordinates: roundNestedCoordinates(feature.geometry.coordinates),
      },
    })),
  };

  await mkdir(publicDir, { recursive: true });
  await writeFile(provincesOutputPath, `${JSON.stringify(featureCollection)}\n`, "utf8");
  await writeFile(archipelagoDetailedOutputPath, `${JSON.stringify(archipelagoDetailedCollection)}\n`, "utf8");

  console.log(`Built ${featureCollection.features.length} province features into ${path.relative(rootDir, provincesOutputPath)}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
