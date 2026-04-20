import { ProvinceMapProduct } from '../types';
import { repairMojibakeText } from './repairMojibake';

type ProvinceMapBaseProfileInput = {
  provinceId: string;
  provinceName: string;
  provinceType?: string;
  regionLabel?: string;
  color?: string;
  gpsLatitude?: number | null;
  gpsLongitude?: number | null;
  staticProducts?: ProvinceMapProduct[];
  staticCharacteristics?: string;
};

export const buildProvinceMapBaseProfile = ({
  provinceId,
  provinceName,
  provinceType,
  regionLabel,
  color,
  gpsLatitude = null,
  gpsLongitude = null,
  staticProducts = [],
  staticCharacteristics = ''
}: ProvinceMapBaseProfileInput) => ({
  provinceId: String(provinceId ?? '').trim(),
  provinceName: repairMojibakeText(String(provinceName ?? '').trim() || 'Unknown province'),
  provinceType: repairMojibakeText(String(provinceType ?? '').trim() || 'Province'),
  regionLabel: repairMojibakeText(String(regionLabel ?? '').trim()),
  color: String(color ?? '#2f6eb4'),
  gpsLatitude: Number.isFinite(Number(gpsLatitude)) ? Number(gpsLatitude) : null,
  gpsLongitude: Number.isFinite(Number(gpsLongitude)) ? Number(gpsLongitude) : null,
  cultivatedAreaHectares: null,
  averageOutputMtPerYear: null,
  sowingPeriod: '',
  harvestPeriod: '',
  cropsPerYear: null,
  characteristics: staticCharacteristics,
  varieties: '',
  products: staticProducts
});

