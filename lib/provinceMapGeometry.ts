type BoundsAccumulator = {
  minLng: number;
  minLat: number;
  maxLng: number;
  maxLat: number;
};

const roundCoordinate = (value: number) => Math.round(value * 100000) / 100000;

export const collectGeometryBounds = (
  node: unknown,
  bounds: BoundsAccumulator = {
    minLng: Number.POSITIVE_INFINITY,
    minLat: Number.POSITIVE_INFINITY,
    maxLng: Number.NEGATIVE_INFINITY,
    maxLat: Number.NEGATIVE_INFINITY
  }
): BoundsAccumulator => {
  if (!Array.isArray(node)) {
    return bounds;
  }

  if (typeof node[0] === 'number' && typeof node[1] === 'number') {
    const [lng, lat] = node as [number, number];
    bounds.minLng = Math.min(bounds.minLng, lng);
    bounds.minLat = Math.min(bounds.minLat, lat);
    bounds.maxLng = Math.max(bounds.maxLng, lng);
    bounds.maxLat = Math.max(bounds.maxLat, lat);
    return bounds;
  }

  for (const child of node) {
    collectGeometryBounds(child, bounds);
  }

  return bounds;
};

export const getGeometryCenterCoordinates = (
  node: unknown
): { latitude: number; longitude: number } | null => {
  const bounds = collectGeometryBounds(node);

  if (
    !Number.isFinite(bounds.minLng) ||
    !Number.isFinite(bounds.minLat) ||
    !Number.isFinite(bounds.maxLng) ||
    !Number.isFinite(bounds.maxLat)
  ) {
    return null;
  }

  return {
    latitude: roundCoordinate((bounds.minLat + bounds.maxLat) / 2),
    longitude: roundCoordinate((bounds.minLng + bounds.maxLng) / 2)
  };
};

export const getFeatureCenterCoordinates = (
  feature: { geometry?: { coordinates?: unknown } } | null | undefined
): { latitude: number; longitude: number } | null =>
  getGeometryCenterCoordinates(feature?.geometry?.coordinates);
