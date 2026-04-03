import { ProvinceMapProduct, ProvinceMapProfile } from '../types';
import { repairMojibakeDeep } from './repairMojibake';

const toFiniteNumber = (value: unknown, fallback: number, minimum = 0) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    return fallback;
  }

  return Math.max(minimum, parsed);
};

const toNullableNumber = (value: unknown, fallback: number | null = null) => {
  if (value === null || value === undefined || String(value).trim() === '') {
    return fallback;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const toNormalizedText = (value: unknown, fallback = '') => String(value ?? '').trim() || fallback;

export const normalizeProvinceMapProducts = (
  provinceId: string,
  products: Array<Partial<ProvinceMapProduct> & { id?: string }> | undefined,
  fallbackProducts: Array<Partial<ProvinceMapProduct> & { id?: string }> = []
) => {
  const source = Array.isArray(products) && products.length > 0 ? products : fallbackProducts;

  return source
    .filter((item) => String(item?.name ?? '').trim() || String(item?.location ?? '').trim())
    .map((item, index) => ({
      id: `${provinceId}-${index + 1}`,
      name: String(item?.name ?? '').trim(),
      location: String(item?.location ?? '').trim(),
      zoneCount: toFiniteNumber(item?.zoneCount, 1, 1),
      rating: Number.isFinite(Number(item?.rating)) ? Number(item?.rating) : null
    }));
};

export const mergeProvinceMapProfile = <
  T extends {
    provinceId: string;
    gpsLatitude: number | null;
    gpsLongitude: number | null;
    cultivatedAreaHectares: number | null;
    averageOutputMtPerYear: number | null;
    sowingPeriod: string;
    harvestPeriod: string;
    cropsPerYear: number | null;
    characteristics: string;
    varieties: string;
    products: Array<Partial<ProvinceMapProduct> & { id?: string }>;
  }
>(
  baseProfile: T,
  override?: ProvinceMapProfile | null
) => {
  const safeBaseProfile = repairMojibakeDeep(baseProfile);

  if (!override) {
    return {
      ...safeBaseProfile,
      products: normalizeProvinceMapProducts(safeBaseProfile.provinceId, safeBaseProfile.products)
    };
  }

  return repairMojibakeDeep({
    ...safeBaseProfile,
    gpsLatitude: toNullableNumber(override.gpsLatitude, safeBaseProfile.gpsLatitude),
    gpsLongitude: toNullableNumber(override.gpsLongitude, safeBaseProfile.gpsLongitude),
    cultivatedAreaHectares: toNullableNumber(
      override.cultivatedAreaHectares,
      safeBaseProfile.cultivatedAreaHectares
    ),
    averageOutputMtPerYear: toNullableNumber(
      override.averageOutputMtPerYear,
      safeBaseProfile.averageOutputMtPerYear
    ),
    sowingPeriod: toNormalizedText(override.sowingPeriod, safeBaseProfile.sowingPeriod),
    harvestPeriod: toNormalizedText(override.harvestPeriod, safeBaseProfile.harvestPeriod),
    cropsPerYear: toNullableNumber(override.cropsPerYear, safeBaseProfile.cropsPerYear),
    characteristics: toNormalizedText(override.characteristics, safeBaseProfile.characteristics),
    varieties: toNormalizedText(override.varieties, safeBaseProfile.varieties),
    products: normalizeProvinceMapProducts(safeBaseProfile.provinceId, override.products, safeBaseProfile.products)
  });
};

export const sanitizeProvinceMapProfile = (
  provinceId: string,
  profile: Partial<ProvinceMapProfile>
): ProvinceMapProfile => {
  const normalizedProducts = normalizeProvinceMapProducts(provinceId, profile.products).map(({ id, ...item }) => item);

  return {
    provinceId,
    gpsLatitude: toNullableNumber(profile.gpsLatitude),
    gpsLongitude: toNullableNumber(profile.gpsLongitude),
    cultivatedAreaHectares: toNullableNumber(profile.cultivatedAreaHectares),
    averageOutputMtPerYear: toNullableNumber(profile.averageOutputMtPerYear),
    sowingPeriod: toNormalizedText(profile.sowingPeriod),
    harvestPeriod: toNormalizedText(profile.harvestPeriod),
    cropsPerYear: toNullableNumber(profile.cropsPerYear),
    characteristics: toNormalizedText(profile.characteristics),
    varieties: toNormalizedText(profile.varieties),
    products: normalizedProducts
  };
};
