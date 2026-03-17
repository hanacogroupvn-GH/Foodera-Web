const LOCATION_REPLACEMENTS: Array<readonly [string, string]> = [
  ['\u8d8a\u5357\u80e1\u5fd7\u660e\u5e02\u7b2c\u4e00\u90e1\u65b0\u5b9a\u574a\u4e01\u5148\u7687\u8857 17 \u53f7', '17 Dinh Tien Hoang, Tan Dinh Ward, District 1, Ho Chi Minh City, Vietnam'],
  ['\u8d8a\u5357\u80e1\u5fd7\u660e\u5e02\u7b2c\u4e00\u90e1\u591a\u9ad8\u574a\u4e01\u5148\u7687\u8857 17 \u53f7', '17 Dinh Tien Hoang, Da Kao Ward, District 1, Ho Chi Minh City, Vietnam'],
  ['\u9760\u8fd1\u80e1\u5fd7\u660e\u5e02\u4e0e\u6d77\u9632\u4e3b\u8981\u6e2f\u53e3\uff0c\u786e\u4fdd\u88c5\u8fd0\u8c03\u5ea6\u5feb\u901f\u3001\u8231\u4f4d\u4f18\u5148\u3002', '\u9760\u8fd1 Ho Chi Minh City \u4e0e Hai Phong \u4e3b\u8981\u6e2f\u53e3\uff0c\u786e\u4fdd\u88c5\u8fd0\u8c03\u5ea6\u5feb\u901f\u3001\u8231\u4f4d\u4f18\u5148\u3002'],
  ['\u8fde\u63a5\u80e1\u5fd7\u660e\u5e02 Cat Lai\u3001\u5934\u987f Cai Mep \u4e0e\u6d77\u9632\u6e2f\uff0c\u7f29\u77ed\u5185\u9646\u8fd0\u8f93\u65f6\u95f4\u5e76\u63d0\u5347\u88c5\u8239\u6548\u7387\u3002', '\u8fde\u63a5 Ho Chi Minh City Cat Lai\u3001Vung Tau Cai Mep \u4e0e Hai Phong Port\uff0c\u7f29\u77ed\u5185\u9646\u8fd0\u8f93\u65f6\u95f4\u5e76\u63d0\u5347\u88c5\u8239\u6548\u7387\u3002'],
  ['\u80e1\u5fd7\u660e\u5e02\u548c\u5927\u53fb', 'Ho Chi Minh City \u548c Da Lat'],
  ['\u5c71\u7f57\u7701\uff08\u8d8a\u5357\u897f\u5317\uff09', 'Son La (Northwest)'],
  ['\u5e7f\u6cbb\u7701\uff08\u4e2d\u90e8\uff09', 'Quang Tri (Central)'],
  ['\u5609\u83b1\u7701\uff08\u897f\u539f\uff09', 'Gia Lai (Central Highlands)'],
  ['\u5f97\u4e50\u7701\uff08\u897f\u539f\uff09', 'Dak Lak (Central Highlands)'],
  ['\u6797\u540c\u7701\uff08Cau Dat\uff09', 'Lam Dong (Cau Dat)'],
  ['\u5e73\u798f\u96c6\u7fa4', 'Binh Phuoc Cluster'],
  ['\u5f97\u4e50\u9ad8\u539f', 'Dak Lak Plateau'],
  ['\u5f97\u4e50\u9ad8\u5730', 'Dak Lak Highlands'],
  ['\u6797\u540c\u9ad8\u5730', 'Lam Dong Highlands'],
  ['\u7f8e\u516c\u6cb3\u4e09\u89d2\u6d32', 'Mekong Delta'],
  ['\u7f8e\u516c\u6cb3\u7269\u6d41\u534f\u540c', 'Mekong Logistics Sync'],
  ['\u7f8e\u516c\u6cb3\u6c34\u7f51', 'Mekong Network'],
  ['\u7d22\u5e84\u4e0e\u8584\u8fbd', 'Soc Trang & Bac Lieu'],
  ['\u80e1\u5fd7\u660e\u5e02', 'Ho Chi Minh City'],
  ['\u5927\u53fb', 'Da Lat'],
  ['\u6d77\u9632', 'Hai Phong'],
  ['\u4e01\u5148\u7687\u8857', 'Dinh Tien Hoang'],
  ['\u65b0\u5b9a\u574a', 'Tan Dinh Ward'],
  ['\u591a\u9ad8\u574a', 'Da Kao Ward'],
  ['\u7b2c\u4e00\u90e1', 'District 1'],
  ['\u5c71\u7f57\u7701', 'Son La'],
  ['\u5e7f\u6cbb\u7701', 'Quang Tri'],
  ['\u5609\u83b1\u7701', 'Gia Lai'],
  ['\u5f97\u4e50\u7701', 'Dak Lak'],
  ['\u6797\u540c\u7701', 'Lam Dong'],
  ['\u5e73\u798f', 'Binh Phuoc'],
  ['\u7d22\u5e84', 'Soc Trang'],
  ['\u8584\u8fbd', 'Bac Lieu'],
  ['\u5934\u987f', 'Vung Tau']
];

export const preserveVietnamesePlaceNamesText = (value: string): string =>
  LOCATION_REPLACEMENTS.reduce((result, [from, to]) => result.split(from).join(to), value);

export const preserveVietnamesePlaceNamesDeep = <T>(value: T): T => {
  if (typeof value === 'string') {
    return preserveVietnamesePlaceNamesText(value) as T;
  }

  if (Array.isArray(value)) {
    return value.map((item) => preserveVietnamesePlaceNamesDeep(item)) as T;
  }

  if (!value || typeof value !== 'object') {
    return value;
  }

  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>).map(([key, entryValue]) => [key, preserveVietnamesePlaceNamesDeep(entryValue)])
  ) as T;
};
