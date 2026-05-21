import React from 'react';
import 'leaflet/dist/leaflet.css';

import '../components/interactive-map.css';
import '../components/product-tab-map.css';
import InteractiveMapExplorer from '../components/InteractiveMapExplorer';
import { useLocale } from '../context/LocaleContext';

const MAP_COPYRIGHT = '\u00A9 2026 VIET NAM FOOD ERA COMPANY LIMITED All Rights Reserved.';

const CommercialTool: React.FC = () => {
  const { locale } = useLocale();

  const copy =
    locale === 'zh'
      ? {
          brandEyebrow: 'FoodEra Origin Desk',
          brandAlt: 'FoodEra',
          copyrightLabel: MAP_COPYRIGHT,
          brandTitle: '越南种植区',
          backLabel: '返回',
          backAria: '返回上一页',
          filterTitle: '产品筛选',
          filterSubtitle: '按已映射的产品类别高亮省份',
          filterClear: '清除',
          filterEmpty: '暂无已映射的产品类别。',
          filterProvinceSingular: '个省份',
          filterProvincePlural: '个省份',
          filterTabProducts: '产品',
          filterTabRegions: '区域',
          categoryRice: '大米',
          categoryAgriculture: '水果与农产',
          categoryCoffee: '咖啡',
          categoryCashew: '腰果',
          legendTitle: '区域图例',
          legendSubtitle: '查看地图上使用的区域颜色系统',
          legendEmpty: '暂无区域数据。',
          legendButton: '图例',
          toggleLegendAria: '打开或关闭图例',
          closeLegendAria: '关闭图例',
          reopenLegendAria: '重新打开图例',
          resetAria: '重新定位越南地图',
          editorAria: '打开地图内容编辑器',
          regionAria: '六大区域颜色标识',
          summaryTitle: '悬停或点击任一省市',
          summaryText: '悬停或点击以查看 CMS 中已映射的省域内容。',
          resetLabel: '全国',
          loading: '正在加载越南地图...',
          loadError: '无法加载新版越南地图数据。',
          panelKicker: '省域详情',
          panelOverviewTitle: '特性',
          panelSpecsTitle: '映射规格',
          panelCoordinatesLabel: 'GPS å��æ ‡ï¼ˆçº¬åº¦/ç»�åº¦ï¼‰',
          panelCultivatedAreaLabel: 'ç§æ¤�é�¢ç§¯ï¼ˆå…¬é¡·ï¼‰',
          panelAverageOutputLabel: 'å¹³å�‡äº§é‡�ï¼ˆMT/å¹´ï¼‰',
          panelSowingPeriodLabel: 'æ’­ç§�æ—¶é—´',
          panelHarvestPeriodLabel: '收获时间',
          panelCropsPerYearLabel: 'æ¯�å¹´ä½œç‰©èŒ¬æ•°',
          panelVarietiesLabel: 'å“�ç§�',
          panelNoData: '暂未映射',
          panelCloseAria: '关闭省域详情'
        }
      : {
          brandEyebrow: 'FoodEra Origin Desk',
          brandAlt: 'FoodEra',
          copyrightLabel: MAP_COPYRIGHT,
          brandTitle: 'Vietnam Growing Areas',
          backLabel: 'Back',
          backAria: 'Go back to the previous page',
          filterTitle: 'Product Filters',
          filterSubtitle: 'Highlight provinces by mapped product categories',
          filterClear: 'Clear',
          filterEmpty: 'No mapped product categories yet.',
          filterProvinceSingular: 'province',
          filterProvincePlural: 'provinces',
          filterTabProducts: 'Products',
          filterTabRegions: 'Regions',
          categoryRice: 'Rice',
          categoryAgriculture: 'Fruits & Agriculture',
          categoryCoffee: 'Coffee',
          categoryCashew: 'Cashew',
          legendTitle: 'Region Legend',
          legendSubtitle: 'Review the regional growing-area colors used on the map.',
          legendEmpty: 'Region data is unavailable.',
          legendButton: 'Legend',
          toggleLegendAria: 'Toggle legend panel',
          closeLegendAria: 'Close legend panel',
          reopenLegendAria: 'Reopen legend panel',
          resetAria: 'Recenter the Vietnam map',
          editorAria: 'Open map content editor',
          regionAria: 'Six-region color reference',
          summaryTitle: 'Hover or Click Any Province',
          summaryText: 'Hover or click to view the province content currently mapped in CMS.',
          resetLabel: 'Nationwide',
          loading: 'Loading the Vietnam map...',
          loadError: 'Unable to load the updated Vietnam map layers.',
          panelKicker: 'Province Insight',
          panelOverviewTitle: 'Characteristics',
          panelSpecsTitle: 'Mapped Specifications',
          panelCoordinatesLabel: 'GPS coordinates (latitude/longitude)',
          panelCultivatedAreaLabel: 'Cultivated area (hectares)',
          panelAverageOutputLabel: 'Average output (MT/year)',
          panelSowingPeriodLabel: 'Sowing period',
          panelHarvestPeriodLabel: 'Harvest period',
          panelCropsPerYearLabel: 'Crops per year',
          panelVarietiesLabel: 'Varieties',
          panelNoData: 'Not mapped yet',
          panelCloseAria: 'Close province details'
        };

  return <InteractiveMapExplorer copy={copy} locale={locale} />;
};

export default CommercialTool;
