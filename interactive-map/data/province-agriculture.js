const crop = (name, location, zoneCount = 1, rating = null, options = {}) => ({
  name,
  location,
  zoneCount,
  rating,
  ...options
});

const REGION_PROFILE_TEMPLATES = Object.freeze({
  "trung-du-mien-nui-phia-bac": {
    headline: "Cụm nông sản vùng cao và dược liệu bản địa",
    overview: "Chè, quế, mận, mắc ca và dược liệu là nhóm nông sản nổi bật của khu vực này.",
    products: [
      crop("Chè xanh", "Vùng cao", 2, 4.8),
      crop("Quế", "Vùng nguyên liệu", 1, null),
      crop("Mận", "Vùng đồi", 1, null),
      crop("Mắc ca", "Vành đai cao nguyên", 1, null),
    ],
  },
  "dong-bang-song-hong": {
    headline: "Vùng sản xuất rau màu, lúa chất lượng cao và cây ăn quả",
    overview: "Lúa, rau an toàn, nhãn và hoa đang là thế mạnh nông nghiệp của khu vực đồng bằng Bắc Bộ.",
    products: [
      crop("Lúa chất lượng cao", "Vùng canh tác tập trung", 2, 4.7),
      crop("Rau an toàn", "Hợp tác xã nông nghiệp", 1, null),
      crop("Nhãn", "Vùng cây ăn quả", 1, null),
      crop("Hoa và cây cảnh", "Khu chuyên canh", 1, null, { appendProvinceName: false }),
    ],
  },
  "bac-trung-bo-duyen-hai-mien-trung": {
    headline: "Dải nguyên liệu trái cây, lạc và nông sản ven biển",
    overview: "Lạc, dứa, xoài, cam và rau màu là nhóm sản phẩm nổi bật của khu vực miền Trung.",
    products: [
      crop("Lạc", "Vùng nguyên liệu", 1, 4.9),
      crop("Dứa", "Khu chuyên canh", 1, null),
      crop("Xoài", "Vùng gò đồi", 1, null),
      crop("Cam", "Vùng cây ăn quả", 1, null),
      crop("Rau màu", "Vùng sản xuất tập trung", 1, null, { appendProvinceName: false }),
    ],
  },
  "tay-nguyen": {
    headline: "Thủ phủ cà phê, hồ tiêu và cây ăn trái cao nguyên",
    overview: "Cà phê, hồ tiêu, sầu riêng, bơ và mắc ca là nhóm nông sản chủ lực của Tây Nguyên.",
    products: [
      crop("Cà phê Robusta", "Vùng cao nguyên", 2, 5),
      crop("Hồ tiêu", "Khu nguyên liệu", 1, 4.8),
      crop("Sầu riêng", "Vùng cây ăn quả", 1, null),
      crop("Bơ", "Vùng sản xuất liên kết", 1, null),
      crop("Mắc ca", "Vùng chuyển đổi", 1, null),
    ],
  },
  "dong-nam-bo": {
    headline: "Vùng điều, trái cây nhiệt đới và nông nghiệp công nghệ cao",
    overview: "Điều, chuối, bưởi, hồ tiêu và trái cây nhiệt đới tạo nên lợi thế nông sản của Đông Nam Bộ.",
    products: [
      crop("Hạt điều", "Vùng nguyên liệu", 2, 4.9),
      crop("Chuối", "Trang trại liên kết", 1, null),
      crop("Bưởi", "Vùng cây ăn quả", 1, null),
      crop("Hồ tiêu", "Khu chuyên canh", 1, null),
    ],
  },
  "dong-bang-song-cuu-long": {
    headline: "Vùng nguyên liệu lúa gạo và trái cây lớn nhất cả nước",
    overview: "Lúa gạo, xoài, dừa, nhãn và rau màu đang là trụ cột nông nghiệp của Đồng bằng sông Cửu Long.",
    products: [
      crop("Lúa gạo", "Vùng nguyên liệu", 2, 5),
      crop("Xoài", "Vùng cây ăn quả", 1, null),
      crop("Dừa", "Khu sản xuất tập trung", 1, null),
      crop("Nhãn", "Vườn liên kết", 1, null),
      crop("Rau màu", "Vùng luân canh", 1, null, { appendProvinceName: false }),
    ],
  },
  khac: {
    headline: "Cụm nông sản địa phương đang được phát triển",
    overview: "Tỉnh hiện có nhiều vùng nguyên liệu đang mở rộng theo chuẩn truy xuất và xuất khẩu.",
    products: [
      crop("Rau màu", "Vùng sản xuất tập trung", 1, null, { appendProvinceName: false }),
      crop("Cây ăn quả", "Hợp tác xã", 1, null, { appendProvinceName: false }),
      crop("Nông sản chế biến", "Khu nguyên liệu", 1, null, { appendProvinceName: false }),
    ],
  },
});

const PROVINCE_PROFILE_OVERRIDES = Object.freeze({
  "ha-noi": {
    headline: "Vùng nông nghiệp ven đô với trái cây đặc sản và rau an toàn",
    overview: "Bưởi Diễn, nhãn chín muộn, rau an toàn và hoa là nhóm nông sản chủ lực quanh Hà Nội.",
    products: [
      crop("Bưởi Diễn", "Bắc Từ Liêm", 1, 4.9, { appendProvinceName: false }),
      crop("Nhãn chín muộn", "Hoài Đức", 1, null, { appendProvinceName: false }),
      crop("Rau an toàn", "Đông Anh", 1, null, { appendProvinceName: false }),
      crop("Hoa chất lượng cao", "Mê Linh", 1, null, { appendProvinceName: false }),
      crop("Lúa chất lượng cao", "Phú Xuyên", 1, null, { appendProvinceName: false }),
    ],
  },
  "nghe-an": {
    headline: "Cụm nông sản trái cây và nông sản khô của Bắc Trung Bộ",
    overview: "Lạc, nhãn, xoài, vải và dứa đang là nhóm nông sản nổi bật của Nghệ An.",
    products: [
      crop("Lạc", "Quỳnh Lưu", 1, 5, { appendProvinceName: false }),
      crop("Nhãn Nghệ An", "Đô Lương", 1, null, { appendProvinceName: false }),
      crop("Xoài Nghệ An", "Nghĩa Đàn", 1, null, { appendProvinceName: false }),
      crop("Vải Nghệ An", "Quế Phong", 1, null, { appendProvinceName: false }),
      crop("Dứa Nghệ An", "Con Cuông", 1, null, { appendProvinceName: false }),
    ],
  },
  "thanh-hoa": {
    headline: "Trục nông sản quy mô lớn của Bắc Trung Bộ",
    overview: "Mía, dứa, bưởi và lúa là những nhóm nông sản có vùng nguyên liệu ổn định tại Thanh Hóa.",
    products: [
      crop("Mía", "Thạch Thành", 1, 4.8, { appendProvinceName: false }),
      crop("Dứa", "Bỉm Sơn", 1, null, { appendProvinceName: false }),
      crop("Bưởi Luận Văn", "Thọ Xuân", 1, null, { appendProvinceName: false }),
      crop("Lúa chất lượng cao", "Yên Định", 1, null, { appendProvinceName: false }),
      crop("Rau củ", "Đông Sơn", 1, null, { appendProvinceName: false }),
    ],
  },
  "quang-ngai": {
    headline: "Vùng nông sản ven biển với cụm đặc sản và cây công nghiệp",
    overview: "Tỏi, lạc, quế và rau màu là những nhóm nông sản được nhắc đến nhiều tại Quảng Ngãi.",
    products: [
      crop("Tỏi Lý Sơn", "Lý Sơn", 1, 4.9, { appendProvinceName: false }),
      crop("Lạc", "Mộ Đức", 1, null, { appendProvinceName: false }),
      crop("Quế Trà Bồng", "Trà Bồng", 1, null, { appendProvinceName: false }),
      crop("Ớt", "Bình Sơn", 1, null, { appendProvinceName: false }),
      crop("Dưa hấu", "Đức Phổ", 1, null, { appendProvinceName: false }),
    ],
  },
  "gia-lai": {
    headline: "Cụm nguyên liệu cà phê, hồ tiêu và cây ăn trái cao nguyên",
    overview: "Gia Lai nổi bật với cà phê, chanh dây, hồ tiêu, chuối và mắc ca.",
    products: [
      crop("Cà phê Gia Lai", "Pleiku", 2, 5, { appendProvinceName: false }),
      crop("Chanh dây Gia Lai", "Mang Yang", 1, null, { appendProvinceName: false }),
      crop("Hồ tiêu Gia Lai", "Chư Sê", 1, 4.8, { appendProvinceName: false }),
      crop("Chuối Gia Lai", "Ia Grai", 1, null, { appendProvinceName: false }),
      crop("Mắc ca Gia Lai", "Đắk Đoa", 1, null, { appendProvinceName: false }),
    ],
  },
  "dak-lak": {
    headline: "Thủ phủ cà phê và cây ăn trái cao giá trị của Tây Nguyên",
    overview: "Cà phê, sầu riêng, bơ, hồ tiêu và mắc ca là nhóm nông sản nổi bật tại Đắk Lắk.",
    products: [
      crop("Cà phê Buôn Ma Thuột", "Buôn Ma Thuột", 2, 5, { appendProvinceName: false }),
      crop("Sầu riêng Đắk Lắk", "Krông Pắc", 1, null, { appendProvinceName: false }),
      crop("Bơ Đắk Lắk", "Cư M'gar", 1, null, { appendProvinceName: false }),
      crop("Hồ tiêu Đắk Lắk", "Ea H'leo", 1, 4.8, { appendProvinceName: false }),
      crop("Mắc ca Đắk Lắk", "Krông Năng", 1, null, { appendProvinceName: false }),
    ],
  },
  "lam-dong": {
    headline: "Cụm nông nghiệp công nghệ cao với rau hoa và cà phê Arabica",
    overview: "Arabica Đà Lạt, atiso, rau nhà kính, dâu tây và hoa đang là nhóm sản phẩm chủ lực của Lâm Đồng.",
    products: [
      crop("Arabica Đà Lạt", "Đà Lạt", 1, 5, { appendProvinceName: false }),
      crop("Atiso Lâm Đồng", "Đà Lạt", 1, null, { appendProvinceName: false }),
      crop("Rau nhà kính", "Đơn Dương", 1, null, { appendProvinceName: false }),
      crop("Dâu tây Đà Lạt", "Lạc Dương", 1, null, { appendProvinceName: false }),
      crop("Hoa cắt cành", "Đức Trọng", 1, null, { appendProvinceName: false }),
    ],
  },
  "ho-chi-minh-city": {
    headline: "Vùng nông nghiệp đô thị với rau, hoa và cây ăn trái công nghệ cao",
    overview: "Rau thủy canh, dưa lưới, nấm và hoa lan là nhóm sản phẩm nổi bật trong mô hình nông nghiệp đô thị.",
    products: [
      crop("Rau thủy canh", "Củ Chi", 1, 4.8, { appendProvinceName: false }),
      crop("Dưa lưới", "Hóc Môn", 1, null, { appendProvinceName: false }),
      crop("Hoa lan Mokara", "Củ Chi", 1, null, { appendProvinceName: false }),
      crop("Nấm ăn", "Bình Chánh", 1, null, { appendProvinceName: false }),
      crop("Bưởi da xanh", "Cần Giờ", 1, null, { appendProvinceName: false }),
    ],
  },
  "dong-nai": {
    headline: "Vùng cây ăn trái và nông sản công nghiệp quy mô lớn",
    overview: "Chuối, sầu riêng, chôm chôm, bưởi và hồ tiêu là những nhóm sản phẩm nổi bật tại Đồng Nai.",
    products: [
      crop("Chuối Đồng Nai", "Xuân Lộc", 1, 4.8, { appendProvinceName: false }),
      crop("Sầu riêng Đồng Nai", "Long Khánh", 1, null, { appendProvinceName: false }),
      crop("Chôm chôm Long Khánh", "Long Khánh", 1, null, { appendProvinceName: false }),
      crop("Bưởi Đồng Nai", "Tân Triều", 1, null, { appendProvinceName: false }),
      crop("Hồ tiêu Đồng Nai", "Cẩm Mỹ", 1, null, { appendProvinceName: false }),
    ],
  },
  "tay-ninh": {
    headline: "Vùng nguyên liệu trái cây nhiệt đới và cây công nghiệp",
    overview: "Mãng cầu, mía, chuối và rau màu là nhóm nông sản được khai thác mạnh tại Tây Ninh.",
    products: [
      crop("Mãng cầu Tây Ninh", "Dương Minh Châu", 1, 4.9, { appendProvinceName: false }),
      crop("Mía Tây Ninh", "Tân Châu", 1, null, { appendProvinceName: false }),
      crop("Chuối Tây Ninh", "Bến Cầu", 1, null, { appendProvinceName: false }),
      crop("Ớt Tây Ninh", "Châu Thành", 1, null, { appendProvinceName: false }),
      crop("Khoai mì", "Tân Biên", 1, null, { appendProvinceName: false }),
    ],
  },
  "can-tho": {
    headline: "Trung tâm nông sản của miền Tây với lúa gạo và trái cây",
    overview: "Lúa gạo, xoài, vú sữa, rau thủy canh và chanh không hạt là nhóm sản phẩm nổi bật của Cần Thơ.",
    products: [
      crop("Gạo chất lượng cao", "Thốt Nốt", 2, 5, { appendProvinceName: false }),
      crop("Xoài Cần Thơ", "Cờ Đỏ", 1, null, { appendProvinceName: false }),
      crop("Vú sữa Cần Thơ", "Phong Điền", 1, null, { appendProvinceName: false }),
      crop("Rau thủy canh", "Ninh Kiều", 1, null, { appendProvinceName: false }),
      crop("Chanh không hạt", "Thới Lai", 1, null, { appendProvinceName: false }),
    ],
  },
  "vinh-long": {
    headline: "Vùng cây ăn trái xen canh và nông sản giá trị cao",
    overview: "Bưởi, cam sành, khoai lang, chôm chôm và nhãn là nhóm nông sản tiêu biểu của Vĩnh Long.",
    products: [
      crop("Bưởi Năm Roi", "Bình Minh", 1, 4.9, { appendProvinceName: false }),
      crop("Cam sành", "Tam Bình", 1, null, { appendProvinceName: false }),
      crop("Khoai lang", "Bình Tân", 1, null, { appendProvinceName: false }),
      crop("Chôm chôm", "Long Hồ", 1, null, { appendProvinceName: false }),
      crop("Nhãn", "Vũng Liêm", 1, null, { appendProvinceName: false }),
    ],
  },
  "dong-thap": {
    headline: "Cụm trái cây và lúa gạo nổi bật của vùng thượng nguồn",
    overview: "Xoài, sen, quýt hồng, nhãn và lúa gạo là nhóm nông sản được nhắc đến nhiều của Đồng Tháp.",
    products: [
      crop("Xoài Cao Lãnh", "Cao Lãnh", 1, 5, { appendProvinceName: false }),
      crop("Sen Đồng Tháp", "Tháp Mười", 1, null, { appendProvinceName: false }),
      crop("Quýt hồng", "Lai Vung", 1, null, { appendProvinceName: false }),
      crop("Nhãn Đồng Tháp", "Châu Thành", 1, null, { appendProvinceName: false }),
      crop("Lúa chất lượng cao", "Hồng Ngự", 1, null, { appendProvinceName: false }),
    ],
  },
  "an-giang": {
    headline: "Cụm nông sản lúa gạo và trái cây của vùng biên Tây Nam",
    overview: "Nếp, xoài, thốt nốt, chuối và rau màu là nhóm nông sản nổi bật của An Giang.",
    products: [
      crop("Nếp An Giang", "Tri Tôn", 1, 4.9, { appendProvinceName: false }),
      crop("Xoài An Giang", "Chợ Mới", 1, null, { appendProvinceName: false }),
      crop("Thốt nốt", "Tịnh Biên", 1, null, { appendProvinceName: false }),
      crop("Chuối An Giang", "An Phú", 1, null, { appendProvinceName: false }),
      crop("Rau màu", "Thoại Sơn", 1, null, { appendProvinceName: false }),
    ],
  },
  "ca-mau": {
    headline: "Vùng cuối nguồn với lúa gạo, trái cây và nông sản ven biển",
    overview: "Lúa gạo, chuối, dừa nước, bí và rau màu đang được phát triển theo hướng vùng nguyên liệu tại Cà Mau.",
    products: [
      crop("Lúa chất lượng cao", "Trần Văn Thời", 1, 4.8, { appendProvinceName: false }),
      crop("Chuối Cà Mau", "U Minh", 1, null, { appendProvinceName: false }),
      crop("Bí xanh", "Thới Bình", 1, null, { appendProvinceName: false }),
      crop("Rau màu", "Cái Nước", 1, null, { appendProvinceName: false }),
      crop("Dừa nước", "Ngọc Hiển", 1, null, { appendProvinceName: false }),
    ],
  },
});

const toKey = (value) =>
  String(value ?? "")
    .toLowerCase()
    .trim();

const normalizeLocation = (location, provinceName) => {
  const safeLocation = String(location ?? "").trim();

  if (!safeLocation) {
    return provinceName;
  }

  return safeLocation.includes(provinceName) ? safeLocation : `${safeLocation}, ${provinceName}`;
};

const normalizeProductName = (item, provinceName) => {
  if (item.appendProvinceName === false) {
    return item.name;
  }

  return item.name.includes(provinceName) ? item.name : `${item.name} ${provinceName}`;
};

const getProfileTemplate = (regionCode) => REGION_PROFILE_TEMPLATES[regionCode] ?? REGION_PROFILE_TEMPLATES.khac;

export function getProvinceAgricultureProfile({ provinceId, provinceName, provinceType, regionCode, regionLabel }) {
  const safeProvinceId = toKey(provinceId);
  const template = getProfileTemplate(regionCode);
  const override = PROVINCE_PROFILE_OVERRIDES[safeProvinceId];
  const rawProducts = override?.products ?? template.products;
  const products = rawProducts.map((item, index) => ({
    id: `${safeProvinceId}-${index + 1}`,
    name: normalizeProductName(item, provinceName),
    location: normalizeLocation(item.location, provinceName),
    zoneCount: Number(item.zoneCount ?? 1),
    rating: typeof item.rating === "number" ? item.rating : null,
  }));

  return {
    provinceId: safeProvinceId,
    provinceName,
    provinceType: provinceType || "Tỉnh",
    regionCode,
    regionLabel: regionLabel || template.headline,
    headline: override?.headline ?? template.headline,
    overview: override?.overview ?? template.overview,
    exportProduceCount: override?.exportProduceCount ?? products.length,
    growingZones:
      override?.growingZones ??
      products.reduce((sum, item) => {
        return sum + (item.zoneCount > 0 ? item.zoneCount : 1);
      }, 0),
    products,
  };
}
