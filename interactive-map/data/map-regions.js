export const REGION_STYLE_ORDER = [
  {
    key: "trung-du-mien-nui-phia-bac",
    label: "Northern Midlands and Mountains",
    color: "#2f964f",
  },
  {
    key: "dong-bang-song-hong",
    label: "Red River Delta",
    color: "#b1d127",
  },
  {
    key: "bac-trung-bo-duyen-hai-mien-trung",
    label: "North Central and Central Coast",
    color: "#ffd06b",
  },
  {
    key: "tay-nguyen",
    label: "Central Highlands",
    color: "#b48a58",
  },
  {
    key: "dong-nam-bo",
    label: "Southeast",
    color: "#d9e54d",
  },
  {
    key: "dong-bang-song-cuu-long",
    label: "Mekong Delta",
    color: "#ff8d43",
  },
];

export const REGION_STYLE_BY_KEY = Object.fromEntries(REGION_STYLE_ORDER.map((item) => [item.key, item]));

export const PROVINCE_REGION_BY_ID = Object.freeze({
  "cao-bang": "trung-du-mien-nui-phia-bac",
  "lang-son": "trung-du-mien-nui-phia-bac",
  "tuyen-quang": "trung-du-mien-nui-phia-bac",
  "thai-nguyen": "trung-du-mien-nui-phia-bac",
  "dien-bien": "trung-du-mien-nui-phia-bac",
  "lai-chau": "trung-du-mien-nui-phia-bac",
  "son-la": "trung-du-mien-nui-phia-bac",
  "lao-cai": "trung-du-mien-nui-phia-bac",
  "phu-tho": "trung-du-mien-nui-phia-bac",
  "quang-ninh": "dong-bang-song-hong",
  "ha-noi": "dong-bang-song-hong",
  "bac-ninh": "dong-bang-song-hong",
  "hung-yen": "dong-bang-song-hong",
  "hai-phong": "dong-bang-song-hong",
  "ninh-binh": "dong-bang-song-hong",
  "thanh-hoa": "bac-trung-bo-duyen-hai-mien-trung",
  "nghe-an": "bac-trung-bo-duyen-hai-mien-trung",
  "ha-tinh": "bac-trung-bo-duyen-hai-mien-trung",
  "quang-tri": "bac-trung-bo-duyen-hai-mien-trung",
  "hue": "bac-trung-bo-duyen-hai-mien-trung",
  "da-nang": "bac-trung-bo-duyen-hai-mien-trung",
  "quang-ngai": "bac-trung-bo-duyen-hai-mien-trung",
  "khanh-hoa": "bac-trung-bo-duyen-hai-mien-trung",
  "gia-lai": "tay-nguyen",
  "dak-lak": "tay-nguyen",
  "lam-dong": "tay-nguyen",
  "ho-chi-minh-city": "dong-nam-bo",
  "dong-nai": "dong-nam-bo",
  "tay-ninh": "dong-nam-bo",
  "can-tho": "dong-bang-song-cuu-long",
  "vinh-long": "dong-bang-song-cuu-long",
  "dong-thap": "dong-bang-song-cuu-long",
  "ca-mau": "dong-bang-song-cuu-long",
  "an-giang": "dong-bang-song-cuu-long",
});

export function getRegionMeta(regionCode) {
  return (
    REGION_STYLE_BY_KEY[regionCode] ?? {
      key: "khac",
      label: "Other",
      color: "#d7dfd2",
    }
  );
}

export function getProvinceRegionCode(provinceId) {
  return PROVINCE_REGION_BY_ID[provinceId] ?? "khac";
}

export function getProvinceRegionMeta(provinceId) {
  return getRegionMeta(getProvinceRegionCode(provinceId));
}
