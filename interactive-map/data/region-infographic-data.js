/**
 * 6 fixed Vietnam regions + per-category BI data.
 * Regions are constant; only "varieties" changes per product tab.
 */

export const CATEGORY_TABS = ["Rice", "Coffee", "Cashew", "Pepper", "Durian", "Watermelon"];

/* ── 6 Fixed Regions ── */
export const BASE_REGIONS = [
  {
    regionKey: "trung-du-mien-nui-phia-bac",
    number: 1,
    name: "Trung Du và Miền Núi Phía Bắc",
    nameEn: "Northern Midlands & Mountains",
    area: "~9.6 triệu ha",
    climate: "Khí hậu cận nhiệt đới, mùa đông lạnh, địa hình đồi núi",
    color: "#2f964f",
    provinces: ["Sơn La", "Điện Biên", "Lai Châu", "Lào Cai", "Phú Thọ", "Thái Nguyên"],
    certificates: ["VietGAP", "4C"],
  },
  {
    regionKey: "dong-bang-song-hong",
    number: 2,
    name: "Đồng Bằng Sông Hồng",
    nameEn: "Red River Delta",
    area: "~2.1 triệu ha",
    climate: "Khí hậu nhiệt đới gió mùa, đất phù sa màu mỡ",
    color: "#b1d127",
    provinces: ["Hà Nội", "Hải Phòng", "Thái Bình", "Nam Định", "Hải Dương", "Hưng Yên"],
    certificates: ["VietGAP"],
  },
  {
    regionKey: "bac-trung-bo-duyen-hai-mien-trung",
    number: 3,
    name: "Bắc Trung Bộ và Duyên Hải Miền Trung",
    nameEn: "North Central & Central Coast",
    area: "~9.6 triệu ha",
    climate: "Khí hậu nhiệt đới gió mùa, nắng nóng, mùa mưa bão",
    color: "#ffd06b",
    provinces: ["Thanh Hóa", "Nghệ An", "Quảng Trị", "Quảng Nam", "Quảng Ngãi", "Bình Định", "Khánh Hòa", "Bình Thuận"],
    certificates: ["VietGAP"],
  },
  {
    regionKey: "tay-nguyen",
    number: 4,
    name: "Tây Nguyên",
    nameEn: "Central Highlands",
    area: "~5.5 triệu ha",
    climate: "Đất đỏ bazan màu mỡ, độ cao 500–800m, khí hậu mát mẻ",
    color: "#b48a58",
    provinces: ["Đắk Lắk", "Đắk Nông", "Gia Lai", "Kon Tum", "Lâm Đồng"],
    certificates: ["4C", "Rainforest Alliance", "GlobalGAP"],
  },
  {
    regionKey: "dong-nam-bo",
    number: 5,
    name: "Đông Nam Bộ",
    nameEn: "Southeast",
    area: "~2.4 triệu ha",
    climate: "Khí hậu nhiệt đới ổn định, đất đỏ và phù sa cổ",
    color: "#d9e54d",
    provinces: ["Bình Phước", "Đồng Nai", "Bà Rịa - Vũng Tàu", "Tây Ninh", "Bình Dương"],
    certificates: ["GlobalGAP", "BRC", "HACCP"],
  },
  {
    regionKey: "dong-bang-song-cuu-long",
    number: 6,
    name: "Đồng Bằng Sông Cửu Long",
    nameEn: "Mekong Delta",
    area: "~4.0 triệu ha",
    climate: "Đất phù sa màu mỡ, hệ thống kênh rạch dày đặc",
    color: "#ff8d43",
    provinces: ["Cần Thơ", "An Giang", "Đồng Tháp", "Long An", "Tiền Giang", "Bến Tre", "Kiên Giang"],
    certificates: ["GlobalGAP", "SRP"],
  },
];

/* ── Per-category varieties for each region ── */
export const REGION_VARIETIES = {
  Rice: {
    "trung-du-mien-nui-phia-bac": ["Lúa nương", "Séng cù", "Tám thơm"],
    "dong-bang-song-hong": ["Bắc thơm 7", "Khang dân", "Nếp cái hoa vàng"],
    "bac-trung-bo-duyen-hai-mien-trung": ["Khang dân 18", "TH5", "Lúa địa phương"],
    "tay-nguyen": [],
    "dong-nam-bo": [],
    "dong-bang-song-cuu-long": ["OM 5451", "ST24", "ST25", "Đài thơm 8", "Jasmine 85"],
  },
  Coffee: {
    "trung-du-mien-nui-phia-bac": ["Arabica"],
    "dong-bang-song-hong": [],
    "bac-trung-bo-duyen-hai-mien-trung": [],
    "tay-nguyen": ["Robusta", "Arabica"],
    "dong-nam-bo": [],
    "dong-bang-song-cuu-long": [],
  },
  Cashew: {
    "trung-du-mien-nui-phia-bac": [],
    "dong-bang-song-hong": [],
    "bac-trung-bo-duyen-hai-mien-trung": ["PN1", "PN2"],
    "tay-nguyen": ["PN1", "PN2", "AB29"],
    "dong-nam-bo": ["PN1", "AB05-08", "AB29"],
    "dong-bang-song-cuu-long": ["PN1", "AB05-08"],
  },
  Pepper: {
    "trung-du-mien-nui-phia-bac": [],
    "dong-bang-song-hong": [],
    "bac-trung-bo-duyen-hai-mien-trung": ["Vĩnh Linh", "Tiêu sẻ"],
    "tay-nguyen": ["Vĩnh Linh", "Lộc Ninh", "Tiêu sẻ"],
    "dong-nam-bo": ["Vĩnh Linh", "Lộc Ninh"],
    "dong-bang-song-cuu-long": ["Vĩnh Linh", "Tiêu sẻ"],
  },
  Durian: {
    "trung-du-mien-nui-phia-bac": [],
    "dong-bang-song-hong": [],
    "bac-trung-bo-duyen-hai-mien-trung": ["Ri6", "Musang King"],
    "tay-nguyen": ["Ri6", "Dona", "Musang King"],
    "dong-nam-bo": ["Ri6", "Dona", "Musang King"],
    "dong-bang-song-cuu-long": ["Ri6", "Monthong"],
  },
  Watermelon: {
    "trung-du-mien-nui-phia-bac": ["Dưa hấu ruột đỏ"],
    "dong-bang-song-hong": ["Dưa hấu ruột đỏ", "Dưa hấu không hạt"],
    "bac-trung-bo-duyen-hai-mien-trung": ["Dưa hấu ruột đỏ", "Dưa hấu không hạt"],
    "tay-nguyen": ["Dưa hấu ruột đỏ (IQF)"],
    "dong-nam-bo": [],
    "dong-bang-song-cuu-long": ["Dưa hấu ruột đỏ", "Dưa hấu ruột vàng"],
  },
};

/* ── Per-category BI data (stats, charts, practiceCards) ── */
export const CATEGORY_BI_DATA = {
  Rice: {
    category: "Rice",
    heroTitle: { en: "Vietnam Rice Growing Regions", zh: "越南大米种植区域" },
    heroSubtitle: { en: "The Pearl of the Land — Foundation of Food Security", zh: "大地之珠 — 粮食安全的基石" },
    sellingPoints: {
      en: ["Top 3 global rice exporter", "Multi-cropping (2–3 harvests/year)", "Premium ST25 world's best rice", "Alluvial fertile soil advantage"],
      zh: ["全球第三大大米出口国", "多季种植(2-3收/年)", "优质ST25世界最佳大米", "冲积沃土优势"],
    },
    practiceCards: {
      en: [
        { title: "Ideal Conditions", items: ["Hot humid monsoon climate", "Rich water from rivers & canals", "Alluvial soil in ĐBSCL & ĐBSH", "Centuries of farming experience"] },
        { title: "Popular Varieties", items: ["Fragrant: ST24, ST25, Đài thơm 8", "High-quality: OM 5451, OM 18", "Glutinous: Nếp cái hoa vàng, Nếp 97", "Jasmine 85, Nàng hoa 9…"] },
        { title: "Role & Value", items: ["Staple food for 100M Vietnamese", "Ensures national food security", "Top global rice exporter", "Livelihood for millions of farmers"] }
      ],
      zh: [
        { title: "理想条件", items: ["热带季风气候", "河流运河丰富水源", "三角洲冲积土壤", "数百年种植经验"] },
        { title: "主要品种", items: ["香米: ST24, ST25, 台香8", "高产: OM 5451, OM 18", "糯米: 黄花糯", "茉莉花85, 南花9…"] },
        { title: "角色与价值", items: ["1亿越南人的主食", "保障国家粮食安全", "全球顶级大米出口国", "数百万农民的生计"] }
      ]
    },
    stats: {
      globalRank: "Top 3 World", value: "~43.4M tons (2023)", workforce: "Millions of farmers", markets: "Global Food Security",
      keyMetrics: [
        { label: "Climate", value: "Hot, humid monsoon" },
        { label: "Water source", value: "Rivers, canals, reservoirs" },
        { label: "Premium varieties", value: "ST25, Jasmine 85, OM 5451" },
        { label: "Advantage", value: "2–3 crops/year, alluvial soil" },
      ],
    },
    chart: { type: "bar", title: "Milled Rice Output (Million Tons)", data: [
      { label: "2019", value: 43.4 }, { label: "2020", value: 42.8 }, { label: "2021", value: 43.9 }, { label: "2022", value: 45.7 }, { label: "2023", value: 43.4 },
    ]},
  },
  Coffee: {
    category: "Coffee",
    heroTitle: { en: "Vietnam Coffee Growing Regions", zh: "越南咖啡种植区域" },
    heroSubtitle: { en: "Diverse Terroir — Distinctive Quality — World Class", zh: "多样化产地 — 独特风味 — 世界级品质" },
    sellingPoints: {
      en: ["Top 2 global coffee exporter", "1.6–1.8M tons/year (2023)", "Exported to 80+ countries", "600,000+ farming households"],
      zh: ["全球第二大咖啡出口国", "年产160-180万吨(2023)", "出口80+国家", "60万+农户参与"],
    },
    practiceCards: {
      en: [
        { title: "Ideal Conditions", items: ["Elevation: 400–1,500 m", "Temperature: 18–26°C", "Rainfall: 1,500–2,500 mm/year", "Soil: Red basalt, porous"] },
        { title: "Sustainable Process", items: ["Select high-yield varieties", "Shade-grown & drip irrigation", "IPM pest management", "VietGAP / GlobalGAP certified"] },
        { title: "Competitive Edge", items: ["Robusta ~93% of area", "Arabica premium ~7%", "Deep processing & brand building", "Reaching world-class quality"] }
      ],
      zh: [
        { title: "理想条件", items: ["海拔: 400–1,500m", "温度: 18–26°C", "降雨量: 1,500–2,500mm", "土壤: 红色玄武岩"] },
        { title: "可持续流程", items: ["选择高产品种", "遮荫种植与滴灌", "IPM害虫管理", "VietGAP/GlobalGAP认证"] },
        { title: "竞争优势", items: ["罗布斯塔约占93%", "高端阿拉比卡约7%", "深加工与品牌建设", "迈向世界级品质"] }
      ]
    },
    stats: {
      globalRank: "Top 2 World", value: "1.6–1.8M tons/yr", workforce: "600,000+ farmers", markets: "80+ Countries",
      keyMetrics: [
        { label: "Ideal elevation", value: "400 – 1,500 m" },
        { label: "Temperature", value: "18 – 26°C" },
        { label: "Rainfall", value: "1,500 – 2,500 mm/year" },
        { label: "Main varieties", value: "Robusta 93%, Arabica 7%" },
      ],
    },
    chart: { type: "donut", title: "Production Share by Province (2023)", data: [
      { label: "Đắk Lắk", value: 41, color: "#b48a58" }, { label: "Lâm Đồng", value: 20, color: "#d9e54d" },
      { label: "Gia Lai", value: 17, color: "#2f964f" }, { label: "Đắk Nông", value: 12, color: "#ff8d43" },
      { label: "Sơn La", value: 10, color: "#133f6d" },
    ]},
  },
  Cashew: {
    category: "Cashew",
    heroTitle: { en: "Vietnam Cashew Growing Regions", zh: "越南腰果种植区域" },
    heroSubtitle: { en: "Vietnam Cashew — Premium Quality — World Champion", zh: "越南腰果 — 优质品质 — 世界冠军" },
    sellingPoints: {
      en: ["World's #1 cashew exporter", "Export value ~$3.6B (2023)", "Growth ~17% vs 2022", "1.1M+ direct workers"],
      zh: ["全球第一腰果出口国", "出口额约36亿美元(2023)", "同比增长约17%", "110万+直接劳动者"],
    },
    practiceCards: {
      en: [
        { title: "Ideal Conditions", items: ["Temperature: 24–28°C", "Rainfall: 1,000–1,500 mm/year", "Soil: Basalt, yellow-red, laterite", "Elevation: 0–800 m"] },
        { title: "Sustainable Process", items: ["High-yield disease-resistant varieties", "Economical fertilizer & IPM", "Harvest at optimal ripeness", "VietGAP / GlobalGAP certified"] },
        { title: "Key Products", items: ["White whole: W180, W240, W320, W450", "Roasted & salted cashews", "Value-added premium products", "Broken kernels for food industry"] }
      ],
      zh: [
        { title: "理想条件", items: ["温度: 24–28°C", "降雨量: 1,000–1,500mm", "土壤: 玄武岩、黄红土", "海拔: 0–800m"] },
        { title: "可持续流程", items: ["高产抗病品种", "经济施肥与IPM", "最佳成熟度收获", "VietGAP/GlobalGAP认证"] },
        { title: "主要产品", items: ["白色整仁: W180, W240, W320", "烤盐腰果", "高附加值产品", "碎仁(食品工业用)"] }
      ]
    },
    stats: {
      globalRank: "#1 World Exporter", value: "~$3.6 Billion (2023)", workforce: "1.1M+ workers", markets: "USA, China, EU",
      keyMetrics: [
        { label: "Temperature", value: "24 – 28°C" },
        { label: "Rainfall", value: "1,000 – 1,500 mm/year" },
        { label: "Soil", value: "Basalt, yellow-red, laterite" },
        { label: "Harvest season", value: "January – May" },
      ],
    },
    chart: { type: "donut", title: "Key Export Markets (2023)", data: [
      { label: "USA", value: 36, color: "#2f964f" }, { label: "China", value: 23, color: "#ff8d43" },
      { label: "Netherlands", value: 17, color: "#b48a58" }, { label: "Germany", value: 11, color: "#b1d127" },
      { label: "Australia", value: 6, color: "#d9e54d" }, { label: "Others", value: 7, color: "#133f6d" },
    ]},
  },
  Pepper: {
    category: "Pepper",
    heroTitle: { en: "Vietnam Pepper Growing Regions", zh: "越南胡椒种植区域" },
    heroSubtitle: { en: "Vietnam Pepper — Spicy Flavor, Conquering the World", zh: "越南胡椒 — 辛辣风味, 征服世界" },
    sellingPoints: {
      en: ["World's #1 pepper exporter", "Export value ~$906M (2023)", "Present in 100+ countries", "120,000+ farming households"],
      zh: ["全球第一胡椒出口国", "出口额约9.06亿美元(2023)", "销往100+国家", "12万+农户参与"],
    },
    practiceCards: {
      en: [
        { title: "Ideal Conditions", items: ["Temperature: 24–28°C", "Rainfall: 1,500–2,500 mm/year", "Soil: Red basalt, alluvium, rich humus", "Elevation: 0–800 m, Harvest: Feb–May"] },
        { title: "Sustainable Process", items: ["Select healthy high-yield varieties", "Live support poles or cement pillars", "Organic fertilizer & balanced nutrition", "IPM management, VietGAP/GlobalGAP"] },
        { title: "Key Products", items: ["Black pepper (whole grain)", "White pepper (processed)", "Green pepper, red pepper", "Ground pepper, pepper oil"] }
      ],
      zh: [
        { title: "理想条件", items: ["温度: 24–28°C", "降雨量: 1,500–2,500mm", "土壤: 玄武岩、冲积土", "海拔: 0–800m"] },
        { title: "可持续流程", items: ["选择健壮高产品种", "活体支撑柱或水泥柱", "有机肥与均衡营养", "IPM管理, VietGAP/GlobalGAP"] },
        { title: "主要产品", items: ["黑胡椒(整粒)", "白胡椒(加工)", "青胡椒, 红胡椒", "研磨胡椒, 胡椒油"] }
      ]
    },
    stats: {
      globalRank: "#1 World Exporter", value: "~$906M (2023)", workforce: "120,000+ farmers", markets: "100+ Countries",
      keyMetrics: [
        { label: "Temperature", value: "24 – 28°C" },
        { label: "Rainfall", value: "1,500 – 2,500 mm/year" },
        { label: "Soil", value: "Red basalt, alluvium, humus-rich" },
        { label: "Harvest season", value: "February – May" },
      ],
    },
    chart: { type: "donut", title: "Key Export Markets (2023)", data: [
      { label: "USA", value: 24, color: "#2f964f" }, { label: "India", value: 21, color: "#ff8d43" },
      { label: "Germany", value: 18, color: "#b48a58" }, { label: "China", value: 10, color: "#b1d127" },
      { label: "Netherlands", value: 5, color: "#d9e54d" }, { label: "UAE & Others", value: 22, color: "#133f6d" },
    ]},
  },
  Durian: {
    category: "Durian",
    heroTitle: { en: "Vietnam Durian Growing Regions", zh: "越南榴莲种植区域" },
    heroSubtitle: { en: "Vietnam Durian — Rising Star of Agriculture Export", zh: "越南榴莲 — 农业出口新星" },
    sellingPoints: {
      en: ["World's largest durian exporter (2023)", "Export value ~$2.3B (2023)", "Growth ~5x vs 2022", "Key markets: China, Thailand, Hong Kong"],
      zh: ["全球最大榴莲出口国(2023)", "出口额约23亿美元(2023)", "同比增长约5倍", "主要市场: 中国, 泰国, 香港"],
    },
    practiceCards: {
      en: [
        { title: "Growing Zone Code", items: ["Clear planting zone planning", "Detailed production records", "Permitted pesticide use only", "Full traceability ensured"] },
        { title: "Best Practices", items: ["Clean & safe production", "Environmental & biodiversity protection", "Quality improvement continuously", "VietGAP/GlobalGAP certified"] },
        { title: "Important Notes", items: ["Comply with zone codes & packaging", "Quality & Cadmium control", "Harvest at correct ripeness", "Meet import country requirements"] }
      ],
      zh: [
        { title: "种植区编码", items: ["明确的种植区规划", "详细的生产记录", "仅使用许可农药", "确保全程可追溯"] },
        { title: "最佳实践", items: ["清洁安全生产", "保护环境与生物多样性", "持续提高品质", "VietGAP/GlobalGAP认证"] },
        { title: "重要注意事项", items: ["遵守区域编码与包装", "品质与镉含量控制", "正确成熟度采收", "满足进口国要求"] }
      ]
    },
    stats: {
      globalRank: "#1 Exporter (2023)", value: "~$2.3 Billion (2023)", workforce: "5x growth vs 2022", markets: "China, Thailand, HK, US, Japan",
      keyMetrics: [
        { label: "Export value", value: "~$2.3 Billion (2023)" },
        { label: "Growth", value: "~5x vs 2022" },
        { label: "Main varieties", value: "Ri6, Dona, Musang King" },
        { label: "Key markets", value: "China, Thailand, Hong Kong" },
      ],
    },
    chart: { type: "bar", title: "Durian Export Value ($M)", data: [
      { label: "2019", value: 56 }, { label: "2020", value: 85 }, { label: "2021", value: 110 }, { label: "2022", value: 875 }, { label: "2023", value: 2300 },
    ]},
  },
  Watermelon: {
    category: "Watermelon",
    heroTitle: { en: "Vietnam Watermelon Growing Regions", zh: "越南西瓜种植区域" },
    heroSubtitle: { en: "Sweet Tropical Harvest — Freshness Preserved — Export Ready", zh: "甜美热带收获 — 保持新鲜 — 出口就绪" },
    sellingPoints: {
      en: ["Output ~1.43M tons (2023)", "Export growth +130% H1 2023", "Protocol signed with China (Dec 2023)", "Suitable for IQF frozen processing"],
      zh: ["产量约143万吨(2023)", "出口增长+130%(2023上半年)", "与中国签署议定书(2023.12)", "适合IQF冷冻加工"],
    },
    practiceCards: {
      en: [
        { title: "Ideal Conditions", items: ["Hot tropical climate, plenty of sun", "Sandy loam & alluvial soil", "Dry season or irrigated fields", "Growth cycle: 60–80 days"] },
        { title: "Sustainable Process", items: ["Disease-resistant hybrid seeds", "Drip irrigation & mulching", "IPM pest management", "VietGAP quality standard"] },
        { title: "Key Products", items: ["Fresh whole watermelon", "IQF frozen diced watermelon", "Watermelon juice concentrate", "Seedless & mini varieties"] }
      ],
      zh: [
        { title: "理想条件", items: ["热带气候，充足阳光", "沙壤土与冲积土", "旱季或灌溉农田", "生长周期: 60-80天"] },
        { title: "可持续流程", items: ["抗病杂交种子", "滴灌与覆膜技术", "IPM害虫管理", "VietGAP质量标准"] },
        { title: "主要产品", items: ["新鲜整瓜", "IQF冷冻切块西瓜", "西瓜浓缩汁", "无籽及迷你品种"] }
      ]
    },
    stats: {
      globalRank: "Major Producer", value: "~1.43M tons (2023)", workforce: "Thousands of farmers", markets: "China (97%), UAE, Korea",
      keyMetrics: [
        { label: "Output (2023)", value: "~1.43 million tons" },
        { label: "Export growth", value: "+130.4% (H1 2023)" },
        { label: "Main market", value: "China (~97%)" },
        { label: "IQF processing", value: "Diced, frozen at -40°C" },
      ],
    },
    chart: { type: "donut", title: "Consumption Split (2023)", data: [
      { label: "Domestic", value: 80, color: "#2f964f" }, { label: "Export", value: 20, color: "#ff8d43" },
    ]},
  },
};

/* ── Helpers ── */
export const CATEGORY_TO_REGIONS = {};
for (const key of CATEGORY_TABS) {
  // Only include regions that have varieties for this category
  const varieties = REGION_VARIETIES[key] ?? {};
  CATEGORY_TO_REGIONS[key] = BASE_REGIONS
    .filter((r) => (varieties[r.regionKey] ?? []).length > 0)
    .map((r) => r.regionKey);
}

export function getRegionsForCategory(category) {
  return CATEGORY_TO_REGIONS[category] ?? [];
}

export function getVarietiesForRegion(category, regionKey) {
  return REGION_VARIETIES[category]?.[regionKey] ?? [];
}
