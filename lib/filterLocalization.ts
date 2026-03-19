import { ProductFilters, SupportedLocale } from '../types';

const FILTER_VALUE_LABELS: Partial<Record<SupportedLocale, Record<string, string>>> = {
  zh: {
    'long grain': '\u957f\u7c92',
    fragrant: '\u9999\u7c73',
    arabica: '\u963f\u62c9\u6bd4\u5361',
    robusta: '\u7f57\u5e03\u65af\u5854',
    cashew: '\u8170\u679c',
    '5%': '5%\u788e\u7c73',
    '25%': '25%\u788e\u7c73',
    long: '\u957f\u7c92',
    medium: '\u4e2d\u7b49',
    standard: '\u6807\u51c6',
    soft: '\u8f6f\u8d28',
    premium: '\u4f18\u9009',
    luxury: '\u9ad8\u7aef',
    specialty: '\u7cbe\u54c1',
    'fully washed': '\u5168\u6c34\u6d17',
    dried: '\u5e72\u71e5',
    'wet polished': '\u6e7f\u629b\u5149',
    'semi washed': '\u534a\u6c34\u6d17',
    cleaned: '\u51c0\u9009',
    'dry processed': '\u65e5\u6652',
    'white-label / oem supply': '\u767d\u724c / OEM\u4f9b\u5e94',
    'broken bits': '\u788e\u7c92',
    'broken pieces': '\u788e\u5757',
    'butt-end pieces': '\u5c3e\u90e8\u788e\u5757',
    'whole kernel': '\u6574\u4ec1',
    'split halves': '\u5bf9\u534a\u4ec1',
    'lengthwise split halves': '\u7eb5\u5207\u534a\u4ec1',
    'flat split halves': '\u5e73\u5207\u534a\u4ec1',
    'large pieces': '\u5927\u7247',
    'small pieces': '\u5c0f\u7247',
    'lengthwise': '\u7eb5\u5207',
    'cross-cut': '\u6a2a\u5207',
    'off-white': '\u7c73\u767d\u8272',
    'pure off-white': '\u7eaf\u7c73\u767d\u8272',
    'off-white mixed light brown': '\u7c73\u767d\u6df7\u6d45\u68d5',
    'dark brown': '\u6df1\u68d5\u8272',
    'near-black': '\u8fd1\u9ed1\u8272',
    'pale yellow-brown': '\u6d45\u9ec4\u68d5\u8272',
    blemished: '\u7455\u75b5\u679c',
    'lightly scorched': '\u8f7b\u5ea6\u7126\u8272',
    'medium scorched': '\u4e2d\u5ea6\u7126\u8272',
    'heavily scorched': '\u91cd\u5ea6\u7126\u8272',
    'lightly scorched during drying': '\u5e72\u71e5\u8fc7\u7a0b\u4e2d\u8f7b\u5ea6\u7126\u8272',
    'economy grade': '\u7ecf\u6d4e\u7ea7',
    'export standard': '\u51fa\u53e3\u6807\u51c6',
    'premium export': '\u4f18\u8d28\u51fa\u53e3\u7ea7',
    'highest in broken category': '\u788e\u4ec1\u7c7b\u522b\u6700\u9ad8\u7b49\u7ea7',
    'second quality': '\u4e8c\u7ea7\u54c1\u8d28',
    'third quality': '\u4e09\u7ea7\u54c1\u8d28',
    'mid-range': '\u4e2d\u6863',
    'most traded': '\u6700\u5e38\u4ea4\u6613',
    'premier / king of cashews': '\u9876\u7ea7 / \u8170\u679c\u4e4b\u738b',
    'raw / unroasted': '\u751f\u8c46 / \u672a\u70d8\u7119',
    'unroasted with light testa': '\u8f7b\u76ae\u672a\u70d8\u7119',
    'unroasted with testa': '\u5e26\u76ae\u672a\u70d8\u7119',
    'roasted grade 1': '\u70d8\u70e4\u4e00\u7ea7',
    'roasted grade 2': '\u70d8\u70e4\u4e8c\u7ea7',
    'roasted grade 3': '\u70d8\u70e4\u4e09\u7ea7',
    'roasted grade 4': '\u70d8\u70e4\u56db\u7ea7',
    'roasted with testa grade 1': '\u5e26\u76ae\u70d8\u70e4\u4e00\u7ea7',
    'roasted with testa grade 2': '\u5e26\u76ae\u70d8\u70e4\u4e8c\u7ea7',
    'roasted with testa grade 3': '\u5e26\u76ae\u70d8\u70e4\u4e09\u7ea7',
    'with testa grade 2': '\u5e26\u76ae\u4e8c\u7ea7',
    'butter roasted': '\u9ec4\u6cb9\u70d8\u70e4',
    'industrial processing': '\u5de5\u4e1a\u52a0\u5de5',
    'industrial processing / cashew butter': '\u5de5\u4e1a\u52a0\u5de5 / \u8170\u679c\u9171',
    'oil pressing / industrial processing': '\u538b\u6cb9 / \u5de5\u4e1a\u52a0\u5de5',
    'snack / chocolate coating': '\u96f6\u98df / \u5de7\u514b\u529b\u5305\u8863',
    'snack / trail mix': '\u96f6\u98df / \u6df7\u5408\u575a\u679c',
    'snack / trail mix / bakery': '\u96f6\u98df / \u6df7\u5408\u575a\u679c / \u70d8\u7119',
    'snack / mixed nuts': '\u96f6\u98df / \u6df7\u5408\u575a\u679c',
    'snack / gift / cocktail': '\u96f6\u98df / \u793c\u76d2 / \u9e21\u5c3e\u9152\u642d\u914d',
    'snack / confectionery / trail mix / cooking': '\u96f6\u98df / \u7cd6\u679c\u5236\u54c1 / \u6df7\u5408\u575a\u679c / \u70f9\u996a',
    'snack / bakery / granola / trail mix': '\u96f6\u98df / \u70d8\u7119 / \u683c\u5170\u8bfa\u62c9 / \u6df7\u5408\u575a\u679c',
    'snack / granola': '\u96f6\u98df / \u683c\u5170\u8bfa\u62c9',
    'snack / granola / chocolate coating / functional food':
      '\u96f6\u98df / \u683c\u5170\u8bfa\u62c9 / \u5de7\u514b\u529b\u5305\u8863 / \u529f\u80fd\u98df\u54c1',
    'premium snack': '\u9ad8\u7aef\u96f6\u98df',
    'premium ready-to-eat': '\u9ad8\u7aef\u5373\u98df',
    'premium snack / gift / granola bar': '\u9ad8\u7aef\u96f6\u98df / \u793c\u76d2 / \u683c\u5170\u8bfa\u62c9\u68d2',
    'premium snack / granola / chocolate coating':
      '\u9ad8\u7aef\u96f6\u98df / \u683c\u5170\u8bfa\u62c9 / \u5de7\u514b\u529b\u5305\u8863',
    'premium snack / premium gift / fine dining':
      '\u9ad8\u7aef\u96f6\u98df / \u9ad8\u7aef\u793c\u76d2 / \u7cbe\u81f4\u9910\u996e',
    'premium pastry / premium snack mix / white chocolate':
      '\u9ad8\u7aef\u7cd5\u70b9 / \u9ad8\u7aef\u96f6\u98df\u6df7\u5408 / \u767d\u5de7\u514b\u529b',
    'pastry decoration / premium snack mix / chocolate coating':
      '\u7cd5\u70b9\u88c5\u9970 / \u9ad8\u7aef\u96f6\u98df\u6df7\u5408 / \u5de7\u514b\u529b\u5305\u8863',
    'cake decoration / snack mix': '\u86cb\u7cd5\u88c5\u9970 / \u96f6\u98df\u6df7\u5408',
    'cake decoration / snack mix / pesto sauce':
      '\u86cb\u7cd5\u88c5\u9970 / \u96f6\u98df\u6df7\u5408 / \u9999\u84dc\u9171',
    'flavored snack / bakery filling': '\u8c03\u5473\u96f6\u98df / \u70d8\u7119\u9985\u6599',
    'roasted bakery filling': '\u70d8\u7119\u9985\u6599',
    'natural snack / dark cashew paste': '\u5929\u7136\u96f6\u98df / \u6df1\u8272\u8170\u679c\u9171',
    'natural snack / macrobiotic': '\u5929\u7136\u96f6\u98df / \u5b8f\u91cf\u8425\u517b',
    'natural snack / organic': '\u5929\u7136\u96f6\u98df / \u6709\u673a',
    'health snack / organic / macrobiotic': '\u5065\u5eb7\u96f6\u98df / \u6709\u673a / \u5b8f\u91cf\u8425\u517b',
    'cashew butter / confectionery / chocolate coating':
      '\u8170\u679c\u9171 / \u7cd6\u679c\u5236\u54c1 / \u5de7\u514b\u529b\u5305\u8863',
    'cashew paste / cashew oil': '\u8170\u679c\u9171 / \u8170\u679c\u6cb9',
    'cashew oil / dark cashew paste': '\u8170\u679c\u6cb9 / \u6df1\u8272\u8170\u679c\u9171',
    'dark cashew paste / roasted cashew oil': '\u6df1\u8272\u8170\u679c\u9171 / \u70d8\u70e4\u8170\u679c\u6cb9',
    'whole-grain cashew butter / natural granola': '\u5168\u7c92\u8170\u679c\u9171 / \u5929\u7136\u683c\u5170\u8bfa\u62c9',
    'granola / protein bar / cashew sauce': '\u683c\u5170\u8bfa\u62c9 / \u86cb\u767d\u68d2 / \u8170\u679c\u9171',
    'granola / protein bar / cookies': '\u683c\u5170\u8bfa\u62c9 / \u86cb\u767d\u68d2 / \u66f2\u5947',
    'polyphenol-rich': '\u5bcc\u542b\u591a\u915a',
    'antioxidant-rich': '\u5bcc\u542b\u6297\u6c27\u5316\u7269',
    unrefined: '\u672a\u7cbe\u5236',
    'grade 1': '\u4e00\u7ea7',
    'grade 2': '\u4e8c\u7ea7',
    'grade 3': '\u4e09\u7ea7',
    'screen 13': '13\u76ee\u7b5b',
    'screen 16': '16\u76ee\u7b5b',
    'screen 18': '18\u76ee\u7b5b',
    vietnam: '\u8d8a\u5357',
    'calrose': 'Calrose',
    '20 x 20 mm': '20 x 20 mm',
    '24 months': '24 \u4e2a\u6708',
    'smoothie, juice, ice cream, dessert, bakery, ready-to-eat mix':
      '\u51b0\u6c99\u3001\u679c\u6c41\u3001\u51b0\u6dc7\u6dcb\u3001\u751c\u70b9\u3001\u70d8\u7119\u3001\u5373\u98df\u6df7\u5408',
    'w180 \u2014 largest': 'W180 \u2014 \u6700\u5927\u7c92',
    'w210 \u2014 jumbo': 'W210 \u2014 \u7279\u5927\u7c92',
    'w240': 'W240',
    'w320': 'W320',
    'w320 \u2014 most popular': 'W320 \u2014 \u6700\u53d7\u6b22\u8fce',
    'w450 \u2014 smallest ww': 'W450 \u2014 \u6700\u5c0fWW',
    'w450+': 'W450+',
    'w180\u2013w240': 'W180\u2013W240',
    'w240\u2013w320': 'W240\u2013W320',
    'w320\u2013w450': 'W320\u2013W450'
  }
};

const normalizeLookupKey = (value: string) => value.trim().toLowerCase();

export const translateFilterValue = (value: string, locale: SupportedLocale): string => {
  if (locale === 'en') {
    return value;
  }

  const trimmed = String(value || '').trim();
  if (!trimmed) {
    return '';
  }

  return FILTER_VALUE_LABELS[locale]?.[normalizeLookupKey(trimmed)] || trimmed;
};

export const translateProductFilters = (
  filters?: Record<string, string> | ProductFilters,
  locale: SupportedLocale = 'zh',
  existing?: Record<string, string> | ProductFilters
): Record<string, string> | undefined => {
  if (!filters || typeof filters !== 'object') {
    return existing;
  }

  const translatedEntries = Object.entries(filters)
    .map(([key, value]) => [String(key).trim(), translateFilterValue(String(value || ''), locale)] as const)
    .filter(([key, value]) => key && value);

  if (translatedEntries.length === 0) {
    return existing;
  }

  return {
    ...(existing || {}),
    ...Object.fromEntries(translatedEntries)
  };
};
