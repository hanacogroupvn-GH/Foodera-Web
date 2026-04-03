export const REGIONAL_CONTEXT_BOUNDS = {
  minLng: 89,
  maxLng: 126,
  minLat: -3,
  maxLat: 31,
};

export const CONTEXT_LABELS = [
  { id: "china", name: "Trung Quốc", coordinates: [24.8, 108.2], variant: "country" },
  { id: "laos", name: "Lào", coordinates: [18.8, 103.4], variant: "country" },
  { id: "cambodia", name: "Campuchia", coordinates: [12.0, 104.6], variant: "country" },
  { id: "thailand", name: "Thái Lan", coordinates: [15.4, 100.4], variant: "country" },
  { id: "east-sea", name: "Biển Đông", coordinates: [14.8, 112.2], variant: "sea" },
];

function makeIslandPolygon(lng, lat, scaleX = 0.14, scaleY = 0.09) {
  return [
    [
      [lng - scaleX, lat],
      [lng - scaleX * 0.25, lat + scaleY],
      [lng + scaleX * 0.8, lat + scaleY * 0.45],
      [lng + scaleX * 0.45, lat - scaleY * 0.95],
      [lng - scaleX, lat],
    ],
  ];
}

export const ARCHIPELAGO_FEATURES = {
  type: "FeatureCollection",
  features: [
    {
      type: "Feature",
      properties: {
        id: "hoang-sa",
        name: "Quần đảo Hoàng Sa",
        parentId: "da-nang",
        parentName: "Đà Nẵng",
        displayType: "schematic",
      },
      geometry: {
        type: "MultiPolygon",
        coordinates: [
          makeIslandPolygon(112.18, 16.85, 0.16, 0.09),
          makeIslandPolygon(112.55, 16.65, 0.12, 0.07),
          makeIslandPolygon(112.92, 16.48, 0.13, 0.08),
          makeIslandPolygon(112.62, 16.18, 0.1, 0.06),
          makeIslandPolygon(113.04, 16.92, 0.11, 0.07),
        ],
      },
    },
    {
      type: "Feature",
      properties: {
        id: "truong-sa",
        name: "Quần đảo Trường Sa",
        parentId: "khanh-hoa",
        parentName: "Khánh Hòa",
        displayType: "schematic",
      },
      geometry: {
        type: "MultiPolygon",
        coordinates: [
          makeIslandPolygon(114.35, 11.35, 0.13, 0.07),
          makeIslandPolygon(114.74, 10.84, 0.11, 0.06),
          makeIslandPolygon(115.18, 10.42, 0.12, 0.07),
          makeIslandPolygon(114.48, 9.76, 0.1, 0.06),
          makeIslandPolygon(115.55, 9.18, 0.12, 0.07),
          makeIslandPolygon(114.98, 8.72, 0.11, 0.06),
          makeIslandPolygon(113.92, 10.18, 0.09, 0.05),
        ],
      },
    },
  ],
};
