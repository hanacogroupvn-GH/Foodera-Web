import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import 'leaflet/dist/leaflet.css';

import '../components/interactive-map.css';
import '../components/product-tab-map.css';
import InteractiveMapExplorer from '../components/InteractiveMapExplorer';
import AgriExportLineChart from '../components/AgriExportLineChart';
import { useLocale } from '../context/LocaleContext';
import { MapPin, LineChart, ArrowLeft } from 'lucide-react';

const MAP_COPYRIGHT = '\u00A9 2026 VIET NAM FOOD ERA COMPANY LIMITED All Rights Reserved.';

const CommercialTool: React.FC = () => {
  const { locale } = useLocale();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialMode = searchParams.get('view') === 'chart' ? 'chart' : 'map';
  const [viewMode, setViewModeState] = useState<'map' | 'chart'>(initialMode);

  const setViewMode = (mode: 'map' | 'chart') => {
    setViewModeState(mode);
    setSearchParams(mode === 'chart' ? { view: 'chart' } : {}, { replace: true });
  };

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
          panelCloseAria: '关闭省域详情'
        }
      : locale === 'vi'
      ? {
          brandEyebrow: 'FoodEra Origin Desk',
          brandAlt: 'FoodEra',
          copyrightLabel: MAP_COPYRIGHT,
          brandTitle: 'Vùng trồng Nông sản Việt Nam',
          backLabel: 'Quay lại',
          backAria: 'Quay lại trang trước',
          filterTitle: 'Bộ lọc Nông sản',
          filterSubtitle: 'Làm nổi bật các tỉnh theo danh mục nông sản',
          filterClear: 'Xóa lọc',
          filterEmpty: 'Chưa có danh mục nào được liên kết.',
          filterProvinceSingular: 'tỉnh',
          filterProvincePlural: 'tỉnh thành',
          filterTabProducts: 'Sản phẩm',
          filterTabRegions: 'Vùng miền',
          categoryRice: 'Lúa gạo',
          categoryAgriculture: 'Trái cây & Nông sản',
          categoryCoffee: 'Cà phê',
          categoryCashew: 'Hạt điều',
          legendTitle: 'Chú thích Vùng miền',
          legendSubtitle: 'Hệ thống màu sắc phân bổ 6 vùng sinh thái nông nghiệp',
          legendEmpty: 'Không có dữ liệu vùng.',
          legendButton: 'Chú thích',
          toggleLegendAria: 'Bật/tắt bảng chú thích',
          closeLegendAria: 'Đóng bảng chú thích',
          reopenLegendAria: 'Mở lại bảng chú thích',
          resetAria: 'Đặt lại bản đồ Việt Nam',
          editorAria: 'Mở trình chỉnh sửa nội dung',
          regionAria: 'Mã màu 6 vùng sinh thái',
          summaryTitle: 'Di chuột hoặc chọn tỉnh bất kỳ',
          summaryText: 'Xem thông số diện tích, năng suất, mùa vụ được quản lý từ CMS.',
          resetLabel: 'Toàn quốc',
          loading: 'Đang tải bản đồ vùng trồng...',
          loadError: 'Không thể tải dữ liệu bản đồ.',
          panelKicker: 'Chi tiết tỉnh thành',
          panelOverviewTitle: 'Đặc tính',
          panelSpecsTitle: 'Thông số kỹ thuật',
          panelCoordinatesLabel: 'Tọa độ GPS',
          panelCultivatedAreaLabel: 'Diện tích gieo trồng (ha)',
          panelAverageOutputLabel: 'Sản lượng bình quân (MT/năm)',
          panelSowingPeriodLabel: 'Thời vụ xuống giống',
          panelHarvestPeriodLabel: 'Thời vụ thu hoạch',
          panelCropsPerYearLabel: 'Số vụ canh tác/năm',
          panelVarietiesLabel: 'Giống cây trồng',
          panelNoData: 'Đang cập nhật',
          panelCloseAria: 'Đóng chi tiết'
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

  const ViewSwitcher = () => (
    <div className="inline-flex items-center p-1 bg-white/95 backdrop-blur-sm border border-foodera-forest/20 rounded-2xl shadow-sm">
      <button
        type="button"
        onClick={() => setViewMode('map')}
        className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-black transition-all ${
          viewMode === 'map'
            ? 'bg-foodera-forest text-white shadow-sm'
            : 'text-foodera-stone-600 hover:text-foodera-forest hover:bg-foodera-forest/5'
        }`}
      >
        <MapPin size={14} />
        <span>{locale === 'zh' ? '种植区地图' : locale === 'vi' ? 'Bản đồ vùng trồng' : 'Growing Map'}</span>
      </button>
      <button
        type="button"
        onClick={() => setViewMode('chart')}
        className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-black transition-all ${
          viewMode === 'chart'
            ? 'bg-foodera-forest text-white shadow-sm'
            : 'text-foodera-stone-600 hover:text-foodera-forest hover:bg-foodera-forest/5'
        }`}
      >
        <LineChart size={14} />
        <span>{locale === 'zh' ? '出口产量统计' : locale === 'vi' ? 'Biểu đồ xuất khẩu' : 'Export Line Chart'}</span>
      </button>
    </div>
  );

  return (
    <div className="relative min-h-screen">
      {viewMode === 'map' ? (
        <InteractiveMapExplorer
          copy={copy}
          locale={locale}
          headerAction={<ViewSwitcher />}
          onSwitchToChart={() => setViewMode('chart')}
        />
      ) : (
        <div className="ptm-page min-h-screen">
          <header className="ptm-header">
            <div className="ptm-header-top">
              <div className="ptm-header-brand">
                <button
                  type="button"
                  className="ptm-back-btn"
                  onClick={() => setViewMode('map')}
                  aria-label={copy.backAria}
                  title={locale === 'vi' ? 'Quay lại bản đồ' : locale === 'zh' ? '返回地图' : 'Back to map'}
                >
                  <ArrowLeft size={18} />
                </button>
                <img src="/logo-era.png" alt="FoodEra" className="ptm-logo" style={{ height: '51px', width: 'auto' }} />
                <div className="ptm-header-title-group">
                  <h1 className="ptm-header-title">
                    {locale === 'zh'
                      ? '越南主要农产品出口统计与产量'
                      : locale === 'vi'
                      ? 'Biểu đồ Thống kê Xuất khẩu Nông sản Việt Nam'
                      : 'Vietnam Agricultural Export Statistics'}
                  </h1>
                  <span className="ptm-header-subtitle">
                    {locale === 'zh'
                      ? '越南海关总署官方数据报告 (2026年7月与累计)'
                      : locale === 'vi'
                      ? 'Số liệu chính thức Tổng cục Hải quan (T7/2026 & Lũy kế)'
                      : 'Official Customs Report (July 2026 & Cumulative)'}
                  </span>
                </div>
              </div>
              <div className="ptm-header-actions">
                <ViewSwitcher />
              </div>
            </div>
          </header>

          <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
            <AgriExportLineChart showHeader={false} />
          </main>
        </div>
      )}
    </div>
  );
};

export default CommercialTool;
