import React, { Suspense, lazy } from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Maximize2, Compass } from 'lucide-react';
import 'leaflet/dist/leaflet.css';
import '../components/interactive-map.css';
import '../components/product-tab-map.css';
import { useLocale } from '../context/LocaleContext';
import { appRoutes } from '../lib/routes';

const InteractiveMapExplorer = lazy(() => import('./InteractiveMapExplorer'));

interface InteractiveMapSectionProps {
  title?: string;
  subtitle?: string;
  className?: string;
}

const MAP_COPYRIGHT = '\u00A9 2026 VIET NAM FOOD ERA COMPANY LIMITED All Rights Reserved.';

export const InteractiveMapSection: React.FC<InteractiveMapSectionProps> = ({
  title,
  subtitle,
  className = ''
}) => {
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
          panelCoordinatesLabel: 'GPS 坐标（纬度/经度）',
          panelCultivatedAreaLabel: '种植面积（公顷）',
          panelAverageOutputLabel: '平均产量（MT/年）',
          panelSowingPeriodLabel: '播种时间',
          panelHarvestPeriodLabel: '收获时间',
          panelCropsPerYearLabel: '每年作物茬数',
          panelVarietiesLabel: '品种',
          panelNoData: '暂未映射',
          panelCloseAria: '关闭省域详情',
          sectionBadge: '农业产区互动工具',
          defaultTitle: '越南农产品核心种植区地图',
          defaultSubtitle: '直观探索越南六大农业生态区、土壤气候特性、产量及核心出口作物的种植规范（大米、咖啡、腰果、胡椒、榴莲、西瓜）。',
          fullscreenBtn: '全屏浏览地图'
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
          panelCloseAria: 'Close province details',
          sectionBadge: 'Interactive Sourcing Map',
          defaultTitle: 'Vietnam Agricultural Export Growing Regions',
          defaultSubtitle: 'Interactive mapping of 6 agro-ecological zones, climatic conditions, yield metrics, and export farming standards across key commodities (Rice, Coffee, Cashew, Pepper, Durian, Watermelon).',
          fullscreenBtn: 'Full Screen Map'
        };

  return (
    <section className={`py-16 md:py-20 bg-gradient-to-b from-gray-50/70 via-foodera-forest/[0.02] to-white border-t border-gray-100 ${className}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
          <div>
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-foodera-forest/10 text-foodera-forest text-xs font-black uppercase tracking-widest mb-3">
              <Compass size={14} className="text-foodera-forest" />
              <span>{copy.sectionBadge}</span>
            </div>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-[900] text-gray-900 tracking-tight leading-tight">
              {title || copy.defaultTitle}
            </h2>
            <p className="mt-2 text-sm sm:text-base text-gray-600 max-w-3xl font-medium leading-relaxed">
              {subtitle || copy.defaultSubtitle}
            </p>
          </div>

          <div className="flex items-center gap-3 flex-shrink-0">
            <Link
              to={appRoutes.commercialTool}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-foodera-forest text-white text-xs font-black uppercase tracking-wider hover:bg-foodera-forest/90 transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5"
            >
              <Maximize2 size={14} />
              <span>{copy.fullscreenBtn}</span>
            </Link>
          </div>
        </div>

        {/* Embedded Interactive Map */}
        <Suspense
          fallback={
            <div className="rounded-3xl border border-gray-200 bg-white p-12 text-center shadow-sm">
              <div className="w-10 h-10 border-4 border-foodera-forest/20 border-t-foodera-forest rounded-full animate-spin mx-auto mb-4" />
              <p className="text-sm font-bold text-gray-500">{copy.loading}</p>
            </div>
          }
        >
          <InteractiveMapExplorer
            copy={copy}
            locale={locale}
            embedded={true}
          />
        </Suspense>
      </div>
    </section>
  );
};

export default InteractiveMapSection;
