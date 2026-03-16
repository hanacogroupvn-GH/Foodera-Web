import { NewsItem, Product } from '../types';

const jasmineTranslation = {
  name: '越南优质茉莉香米',
  subCategory: '优质与芳香米',
  shortDescription: '香气自然、口感柔滑、适合高端零售市场的出口级香米。',
  description:
    '我们的茉莉香米种植于湄公河三角洲肥沃产区，以花香、柔润口感和稳定品质著称，广泛供应北美、欧洲与中东高端零售市场。',
  specifications: {
    碎米率: '5.0% Max',
    水分: '14.0% Max',
    纯度: '90% Min',
    香气: 'Natural'
  }
};

const arabicaTranslation = {
  name: '精品阿拉比卡 S16',
  subCategory: '精品咖啡',
  shortDescription: '高海拔阿拉比卡，酸质明亮，口感干净。',
  description:
    '该款阿拉比卡来自大叻高海拔产区，手工精挑并经过精细处理。S16 规格确保烘焙均匀，呈现柑橘、黑巧克力与持久花香。',
  specifications: {
    海拔: '1500m+',
    处理法: 'Washed',
    筛网规格: '16 (6.3mm)',
    瑕疵率: 'Under 5%'
  }
};

export const FALLBACK_PRODUCT_TRANSLATIONS: Record<string, NonNullable<Product['translations']>['zh']> = {
  'rice-504-5': {
    name: '长粒白米 504 - 5%碎米',
    subCategory: '长粒白米',
    shortDescription: '高产型实用大米，米粒硬挺，适合团餐与工业餐饮。',
    description:
      '504 品种直链淀粉含量较高，煮熟后颗粒分明、不易粘连。5% 碎米规格属于这一高产品种中的优级标准，特别适合餐饮服务与政府项目采购。',
    specifications: {
      碎米率: '5.0% Max',
      水分: '14.0% Max',
      白垩粒: '6.0% Max',
      杂质: '0.1% Max'
    }
  },
  'rice-5451-5': {
    name: '长粒白米 5451 - 5%碎米',
    subCategory: '长粒白米',
    shortDescription: '口感柔软的长粒米，适合零售与家庭消费。',
    description:
      'OM 5451 是为柔软口感而开发的优质品种，米粒修长、乳白色泽明显，冷却后依然保持柔软，因此成为越南出口量较大的长粒米之一。',
    specifications: {
      碎米率: '5.0% Max',
      水分: '14.0% Max',
      黄粒: '0.5% Max',
      损伤粒: '0.5% Max'
    }
  },
  'rice-jasmine': jasmineTranslation,
  'rice-test': jasmineTranslation,
  'rice-2': jasmineTranslation,
  'rice-st25': {
    name: '越南 ST25 大米',
    subCategory: '优质与芳香米',
    shortDescription: '享有“世界最佳大米”美誉，带有菠萝与香兰叶香气。',
    description:
      'ST25 代表越南稻米育种的顶尖水平。米粒细长，煮后完整度高，散发香兰叶与青菠萝的复合香气，是高端餐饮与精品零售的理想选择。',
    specifications: {
      碎米率: '5.0% Max',
      水分: '14.0% Max',
      米长: '7.2mm',
      纯度: '95% Min'
    }
  },
  '1': arabicaTranslation,
  '2': arabicaTranslation,
  '3': arabicaTranslation,
  '4': arabicaTranslation,
  '5': arabicaTranslation,
  '6': arabicaTranslation,
  '7': arabicaTranslation,
  '8': arabicaTranslation,
  '9': arabicaTranslation,
  '10': arabicaTranslation,
  'agri-cashew-ww180': {
    name: '腰果仁 WW180（腰果之王）',
    subCategory: '腰果仁',
    shortDescription: '颗粒最大、等级最高的整粒白腰果。',
    description:
      'WW180 因尺寸与重量优势被称为“腰果之王”。该等级腰果完整洁白，主要来自平福优质产区，是高端礼盒与精品零售品牌的首选。',
    specifications: {
      等级: 'White Whole 180',
      粒数: '170-180/lb',
      水分: '5% Max',
      破碎率: '5% Max'
    }
  },
  'agri-cashew-ww240': {
    name: '腰果仁 WW240（大颗粒）',
    subCategory: '腰果仁',
    shortDescription: '大颗优质整白腰果，适合高端零食市场。',
    description:
      'WW240 在颗粒大小与性价比之间实现平衡，适合需要良好视觉呈现的国际零售包装与烘焙客户。',
    specifications: {
      等级: 'White Whole 240',
      粒数: '220-240/lb',
      水分: '5% Max',
      破碎率: '5% Max'
    }
  },
  'agri-cashew-ww320': {
    name: '腰果仁 WW320（标准级）',
    subCategory: '腰果仁',
    shortDescription: '全球主流出口等级腰果仁。',
    description:
      'WW320 是全球交易最广泛的腰果等级，尺寸与品质稳定，广泛应用于零食、烘焙及糖果加工。',
    specifications: {
      等级: 'White Whole 320',
      粒数: '300-320/lb',
      水分: '5% Max',
      破碎率: '5% Max'
    }
  },
  'agri-cashew-ws': {
    name: '腰果仁 WS（白腰果半片）',
    subCategory: '腰果仁',
    shortDescription: '洁白对开腰果，适合烘焙、糖果与食品加工。',
    description:
      'WS 为加工过程中自然纵向裂开的腰果仁，保留完整风味与酥脆口感，是食品工业中兼顾品质与成本的理想选择。',
    specifications: {
      等级: 'White Splits',
      颜色: 'White/Pale Ivory',
      水分: '5% Max',
      异物: 'Nil'
    }
  },
  'agri-cashew-lbw': {
    name: '腰果仁 LBW（浅斑整粒）',
    subCategory: '腰果仁',
    shortDescription: '表面轻微色差的整粒腰果，性价比较高。',
    description:
      'LBW 为表面有轻微色差或斑点的整粒腰果，虽然外观略有差异，但其营养价值与风味仍保持完整。',
    specifications: {
      等级: 'LBW',
      颜色: 'Light Brown/Deep Ivory',
      水分: '5% Max',
      破碎率: '5% Max'
    }
  }
};

export const FALLBACK_NEWS_TRANSLATIONS: Record<string, NonNullable<NewsItem['translations']>['zh']> = {
  'coffee-cupping-technique-2024': {
    title: '咖啡杯测技术：风味、品质与一致性如何被评估',
    excerpt: '一份面向 B2B 买家的权威指南，解析决定全球咖啡贸易价值与质量保证的标准化感官评估流程。',
    content: [
      '在全球咖啡贸易中，数百万美元的合同往往建立在感官判断之上，因此标准化语言不是偏好，而是刚需。这种语言就是“咖啡杯测”。对国际买家而言，杯测是把原始农产品转化为可量化商业价值的核心技术筛选器。Foodmax 将杯测视为质量保证体系的基石，确保交付到客户工厂的罗布斯塔或阿拉比卡与原产地确认的杯型一致。',
      '第一部分：什么是咖啡杯测？',
      '咖啡杯测是一套标准化方法，用来评估咖啡豆的香气与风味特征。与日常品尝不同，杯测是一项科学化感官流程，通过统一冲煮条件来排除萃取方式、水质和器具差异，使不同样品在同一基准下进行比较。',
      'Foodmax 洞察：杯测不仅用于发现优秀风味，也用于暴露缺陷。对于大宗进口商而言，首要目标往往是“干净度”，即避免出现酚味、霉味或发酵异味。',
      '第二部分：杯测在供应链中的位置',
      '杯测并非一次性动作，而是在 Foodmax 供应链多个关键节点重复执行的关口流程，包括产地选择、质量分级、装运前确认和到港复核。',
      '第三部分：标准杯测流程',
      '为了与国际市场保持一致，Foodmax 严格遵循精品咖啡协会 SCA 的杯测标准，从样品烘焙、研磨、注水比例到通过强力吸啜的品尝动作，均执行统一流程。',
      '第四部分：关键感官评估维度',
      '在 Foodmax 的评估中，Q-Grader 会根据香干香、湿香、风味、酸质、醇厚度、平衡感与余韵等多个维度进行加权评分。',
      '第五部分：如何理解杯测分数',
      'SCA 评分体系是行业黄金标准，总分 100 分。80-84 分为优秀，85-89 分为卓越，90 分以上则属于杰出咖啡。',
      '第六部分：让杯型与市场需求对齐',
      '对 B2B 买家来说，最高分并不总是最佳选择。Foodmax 会与客户共同定义符合商业场景的“目标杯型”，确保风味与用途一致。',
      '第七部分：杯测与实验室检测的关系',
      '杯测是感官评价的核心工具，但同时还需要水分、aw、水活度与筛网分布等实验室数据共同验证。',
      '结论：Foodmax 的质量承诺',
      '杯测是咖啡质量的最终话语权。通过严谨且标准化的评估体系，Foodmax 帮助国际进口商减少判断不确定性。我们也欢迎合作伙伴前往胡志明市和大叻的杯测实验室共同校准风味标准。'
    ]
  },
  'vietnam-rice-growing-regions-2025': {
    title: '越南稻米产区：稳定全球供应的根基',
    excerpt: '一篇权威分析，解释越南独特农业地理为何能为全球进口商提供长期粮食安全与稳定供给。',
    content: [
      '在复杂的全球农产品贸易中，“产地”不仅是地理标签，更是风险、品质与供应连续性的最终决定因素。放眼 2025-2030 年，越南正进一步巩固其作为全球稻米采购战略避风港的地位。',
      'Foodmax 洞察：2025 年的供应可靠性不再只是追求今天的低价，而是要锁定真正理解微气候与区域产能、能够对冲全球波动的合作伙伴。',
      '第一部分：湄公河三角洲，越南稻米腹地',
      '湄公河三角洲不仅是产区，更是全球效率最高的农业生态系统之一。这里由 12 个省组成，依托复杂河网与肥沃冲积土壤，具备极强的综合生产能力。',
      '第二部分：优质与芳香米带',
      '越南稻米地理分工高度明确，朔庄与薄辽等地区已成为 ST 系列等优质芳香米的世界级核心产地。',
      '第三部分：季节多样性与供应稳定性',
      '越南供应稳定性的根源在于三季种植结构。通过跨季节布局生产，越南能够有效降低局部天气事件带来的影响。',
      '第四部分：原产地可追溯与粮食安全',
      '现代食品安全建立在透明之上。Foodmax 的可追溯从种植区开始，我们与合作社一起落实品种控制与采后标准。',
      '第五部分：这对全球买家意味着什么',
      '对于非洲和中东买家而言，越南产地意味着对全球不确定性的有效对冲。Foodmax 则负责承接原产地与国际市场之间的物流与质量复杂性。',
      '结论',
      '全球粮食安全的基础是可靠的原产地。越南凭借肥沃地理条件与成熟基础设施，正在成为未来十年稻米贸易的首选来源。'
    ]
  },
  'market-update-q1-2024': {
    title: '东南亚大米市场：2024 年第一季度出口趋势',
    excerpt: '分析越南和泰国供应端动态，以及全球需求变化与物流压力下的市场表现。',
    content: [
      '2024 年第一季度，越南大米出口展现出强劲开局。尽管全球经济环境变化，高品质茉莉香米与 ST25 等芳香品种在中东和非洲市场的需求依然旺盛。',
      '我们的内部数据显示，出货量同比增长约 12%。这一趋势来自有竞争力的价格以及越南稻米在国际市场日益增强的口碑。',
      '不过，物流挑战仍是关键变量。主要港口拥堵要求客户更早进行订舱，并与船公司进行更紧密的协调，以保障交付时效。'
    ]
  }
};
