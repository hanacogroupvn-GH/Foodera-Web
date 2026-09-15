import React, { useState, useEffect, useMemo, useRef } from 'react';
import { ExportStatItem } from '../types';
import { useLocale } from '../context/LocaleContext';
import { api } from '../lib/apiClient';
import defaultStatsData from '../data/export-stats.json';
import { Layers, DollarSign, Scale, Calendar, Info, TrendingUp, BarChart2, ChevronDown } from 'lucide-react';

export interface AgriExportLineChartProps {
  data?: ExportStatItem[];
  title?: string;
  subtitle?: string;
  showControls?: boolean;
  showHeader?: boolean;
  className?: string;
}

interface PeriodDetails {
  month: number;
  year: number;
  raw: string;
}

const parsePeriodDetails = (periodStr?: string): PeriodDetails => {
  if (!periodStr) return { month: 7, year: 2026, raw: '07/2026' };
  const parts = String(periodStr).trim().split('/');
  if (parts.length === 2) {
    const m = parseInt(parts[0], 10);
    const y = parseInt(parts[1], 10);
    if (!isNaN(m) && !isNaN(y)) {
      return { month: m, year: y, raw: periodStr };
    }
  }
  return { month: 7, year: 2026, raw: periodStr };
};

const formatPeriodDisplay = (periodStr: string, locale: string): string => {
  const { month, year, raw } = parsePeriodDetails(periodStr);
  if (!raw.includes('/')) return raw;
  if (locale === 'vi') return `Tháng ${month < 10 ? `0${month}` : month}/${year}`;
  if (locale === 'zh') return `${year}年${month}月`;
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${monthNames[month - 1] || month} ${year}`;
};

type MetricType = 'volume' | 'value';
type SeriesSelection = 'both' | 'month' | 'year';
type ChartType = 'line' | 'bar';

interface NiceScale {
  ticks: number[];
  niceMax: number;
  step: number;
}

const getNiceScale = (maxVal: number, isVolume: boolean, isYearOnly: boolean): NiceScale => {
  if (maxVal <= 0) {
    return { ticks: [0, 50], niceMax: 50, step: 50 };
  }

  // 1. Month Volume (e.g. Rice 472k): exact 50k steps (0, 50k, 100k, 150k, 200k, ... 500k)
  if (isVolume && !isYearOnly && maxVal <= 650000) {
    const step = 50000;
    const niceMax = Math.ceil(maxVal / step) * step;
    const ticks: number[] = [];
    for (let v = 0; v <= niceMax + step * 0.001; v += step) {
      ticks.push(v);
    }
    return { ticks, niceMax, step };
  }

  // 2. Year Volume (e.g. Rice 5.5M): 500k or 1M steps
  if (isVolume && isYearOnly) {
    const step = maxVal <= 7000000 ? 500000 : 1000000;
    const niceMax = Math.ceil(maxVal / step) * step;
    const ticks: number[] = [];
    for (let v = 0; v <= niceMax + step * 0.001; v += step) {
      ticks.push(v);
    }
    return { ticks, niceMax, step };
  }

  // 3. Month Value (e.g. $642M - $1075M): 100M or 200M steps (50M if small)
  if (!isVolume && !isYearOnly) {
    const step = maxVal <= 500 ? 50 : maxVal <= 1000 ? 100 : 200;
    const niceMax = Math.ceil(maxVal / step) * step;
    const ticks: number[] = [];
    for (let v = 0; v <= niceMax + step * 0.001; v += step) {
      ticks.push(v);
    }
    return { ticks, niceMax, step };
  }

  // 4. Year Value (e.g. $5.45B): 500M or 1000M ($1B) steps
  if (!isVolume && isYearOnly) {
    const step = 1000;
    const niceMax = Math.ceil(maxVal / step) * step;
    const ticks: number[] = [];
    for (let v = 0; v <= niceMax + step * 0.001; v += step) {
      ticks.push(v);
    }
    return { ticks, niceMax, step };
  }

  // Fallback nice scale
  const rawStep = maxVal / 6;
  const power = Math.pow(10, Math.floor(Math.log10(rawStep)));
  const frac = rawStep / power;
  let factor = 10;
  if (frac <= 1) factor = 1;
  else if (frac <= 2) factor = 2;
  else if (frac <= 2.5) factor = 2.5;
  else if (frac <= 5) factor = 5;

  const step = factor * power;
  const niceMax = Math.ceil(maxVal / step) * step;
  const ticks: number[] = [];
  for (let v = 0; v <= niceMax + step * 0.001; v += step) {
    ticks.push(Math.round(v * 1000) / 1000);
  }
  return { ticks, niceMax, step };
};

const formatAxisTick = (val: number, isVolume: boolean) => {
  if (val === 0) return isVolume ? '0' : '$0';
  if (isVolume) {
    if (val >= 1_000_000) {
      const m = val / 1_000_000;
      return Number.isInteger(m) ? `${m}M` : `${m.toFixed(1)}M`;
    }
    const k = val / 1_000;
    return `${k}k`;
  }
  // Value (Million USD)
  if (val >= 1_000) {
    const b = val / 1_000;
    return Number.isInteger(b) ? `$${b}B` : `$${b.toFixed(1)}B`;
  }
  return `$${val}M`;
};

export const AgriExportLineChart: React.FC<AgriExportLineChartProps> = ({
  data: propData,
  title,
  subtitle,
  showControls = true,
  showHeader = true,
  className = ''
}) => {
  const { locale } = useLocale();
  const [fetchedData, setFetchedData] = useState<ExportStatItem[] | null>(null);

  useEffect(() => {
    if (propData && propData.length > 0) return;
    let isMounted = true;
    api.getExportStats()
      .then((res) => {
        if (isMounted && res.stats && res.stats.length > 0) {
          setFetchedData(res.stats);
        }
      })
      .catch(() => {
        // Keep static fallback
      });
    return () => {
      isMounted = false;
    };
  }, [propData]);

  const rawData: ExportStatItem[] = useMemo(() => {
    const list = propData && propData.length > 0
      ? propData
      : fetchedData && fetchedData.length > 0
      ? fetchedData
      : (defaultStatsData as unknown as ExportStatItem[]);
    return list.filter((item) => item.isActive !== false).sort((a, b) => a.sortOrder - b.sortOrder);
  }, [propData, fetchedData]);

  // Extract all available periods, sorted newest to oldest
  const availablePeriods = useMemo(() => {
    const periods = Array.from(new Set(rawData.map((d) => d.reportingPeriod).filter(Boolean)));
    return periods.sort((a, b) => {
      const pA = parsePeriodDetails(a);
      const pB = parsePeriodDetails(b);
      if (pA.year !== pB.year) return pB.year - pA.year;
      return pB.month - pA.month;
    });
  }, [rawData]);

  const [selectedPeriod, setSelectedPeriod] = useState<string>('');

  useEffect(() => {
    if (availablePeriods.length > 0 && (!selectedPeriod || !availablePeriods.includes(selectedPeriod))) {
      setSelectedPeriod(availablePeriods[0]);
    }
  }, [availablePeriods, selectedPeriod]);

  // Filter items by the chosen period
  const periodFilteredData = useMemo(() => {
    if (!selectedPeriod) return rawData;
    const filtered = rawData.filter((d) => d.reportingPeriod === selectedPeriod);
    return filtered.length > 0 ? filtered : rawData;
  }, [rawData, selectedPeriod]);

  const [metric, setMetric] = useState<MetricType>('volume');
  const [series, setSeries] = useState<SeriesSelection>('both');
  const [chartType, setChartType] = useState<ChartType>('line');
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Filter items for chart (if in volume mode, filter commodities that have volume)
  const chartItems = useMemo(() => {
    if (metric === 'volume') {
      return periodFilteredData.filter((d) => d.monthVolume != null && d.yearVolume != null);
    }
    return periodFilteredData;
  }, [periodFilteredData, metric]);

  const periodInfo = useMemo(() => parsePeriodDetails(selectedPeriod), [selectedPeriod]);
  const monthNum = periodInfo.month;
  const yearNum = periodInfo.year;
  const monthPadded = monthNum < 10 ? `0${monthNum}` : `${monthNum}`;
  const monthNamesEn = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const monthNameEn = monthNamesEn[monthNum - 1] || `${monthNum}`;

  // Labels and copy dynamically adapted to the selected reporting period
  const copy = useMemo(() => {
    if (locale === 'zh') {
      return {
        defaultTitle: '越南主要农产品出口统计与产量',
        defaultSubtitle: `越南海关总署官方数据报告 (${yearNum}年${monthNum}月与累计)`,
        metricVolume: '出口产量 (吨 - Ton)',
        metricValue: '出口金额 (百万美元 - Million USD)',
        seriesBoth: '对比月度与年度',
        seriesMonth: `当月 (${monthNum}/${yearNum})`,
        seriesYear: `累计 (${monthNum}个月)`,
        monthLegend: `月度 (${monthNum}/${yearNum})`,
        yearLegend: `年度累计 (${monthNum}个月)`,
        totalVolume: `${monthNum}个月累计总产量`,
        totalValue: `${monthNum}个月累计总金额`,
        topCommodity: '最大出口类目',
        sourceNote: '来源：越南海关总署 (Customs Table 14B/TCHQ)',
        momLabel: '环比 (MoM)',
        yoyLabel: '同比 (YoY)',
        tons: '吨',
        millionUsd: '百万美元',
        chartLine: '折线图',
        chartBar: '柱状图',
        periodLabel: '统计周期'
      };
    }
    if (locale === 'vi') {
      return {
        defaultTitle: 'Biểu đồ Sản lượng & Kim ngạch Xuất khẩu Nông sản',
        defaultSubtitle: `Số liệu chính thức từ Tổng cục Hải quan Việt Nam (Tháng ${monthPadded}/${yearNum} & Lũy kế)`,
        metricVolume: 'Sản lượng (Tấn)',
        metricValue: 'Kim ngạch (Triệu USD)',
        seriesBoth: 'Cả tháng & năm',
        seriesMonth: `Tháng ${monthPadded}/${yearNum}`,
        seriesYear: `Lũy kế ${monthNum}T`,
        monthLegend: `Tháng ${monthPadded}/${yearNum}`,
        yearLegend: `Lũy kế ${monthNum} tháng ${yearNum}`,
        totalVolume: `Tổng sản lượng ${monthNum}T`,
        totalValue: `Tổng kim ngạch ${monthNum}T`,
        topCommodity: 'Mặt hàng dẫn đầu',
        sourceNote: 'Nguồn: Tổng cục Hải quan (Biểu số 14B/TCHQ)',
        momLabel: 'So với tháng trước',
        yoyLabel: 'So với cùng kỳ năm trước',
        tons: 'Tấn',
        millionUsd: 'Triệu USD',
        chartLine: 'Đường',
        chartBar: 'Cột',
        periodLabel: 'Kỳ báo cáo'
      };
    }
    return {
      defaultTitle: 'Vietnam Agricultural Export Volume & Value',
      defaultSubtitle: `Official Statistics by Vietnam General Department of Customs (${monthNameEn} ${yearNum} & YTD)`,
      metricVolume: 'Volume (Metric Tons)',
      metricValue: 'Export Turnover (Million USD)',
      seriesBoth: 'Month & Year',
      seriesMonth: `${monthNameEn} ${yearNum}`,
      seriesYear: `${monthNum}M YTD`,
      monthLegend: `Month (${monthNameEn} ${yearNum})`,
      yearLegend: `Year-to-Date (${monthNum} Months)`,
      totalVolume: `Total ${monthNum}-Month Volume`,
      totalValue: `Total ${monthNum}-Month Turnover`,
      topCommodity: 'Top Export Line',
      sourceNote: 'Source: Vietnam General Department of Customs (Table 14B/TCHQ)',
      momLabel: 'MoM Change',
      yoyLabel: 'YoY Change',
      tons: 'Tons',
      millionUsd: 'M USD',
      chartLine: 'Line',
      chartBar: 'Bar',
      periodLabel: 'Period'
    };
  }, [locale, monthNum, yearNum, monthPadded, monthNameEn]);

  const getItemName = (item: ExportStatItem) => {
    if (locale === 'vi') return item.commodityNameVi || item.commodityNameEn;
    if (locale === 'zh') return item.commodityNameZh || item.commodityNameEn;
    return item.commodityNameEn;
  };

  // Values calculation
  const getMonthVal = (d: ExportStatItem) => {
    if (metric === 'volume') return d.monthVolume ?? 0;
    return (d.monthValueUsd ?? 0) / 1_000_000; // in Million USD
  };

  const getYearVal = (d: ExportStatItem) => {
    if (metric === 'volume') return d.yearVolume ?? 0;
    return (d.yearValueUsd ?? 0) / 1_000_000; // in Million USD
  };

  // SVG dimensions with generous breathing room
  const svgWidth = 840;
  const svgHeight = 420;
  const padding = { top: 55, right: 60, bottom: 85, left: 70 };
  const chartW = svgWidth - padding.left - padding.right;
  const chartH = svgHeight - padding.top - padding.bottom;

  // Max calculations for scaling
  const rawMaxMonth = useMemo(() => Math.max(...chartItems.map(getMonthVal), 1), [chartItems, metric]);
  const rawMaxYear = useMemo(() => Math.max(...chartItems.map(getYearVal), 1), [chartItems, metric]);

  // If showing 'both', we use a dual-axis normalization
  const useDualScale = series === 'both';

  // Even, round number tick scales (e.g. 50k - 100k - 150k... or round millions/billions)
  const monthScale = useMemo(
    () => getNiceScale(rawMaxMonth, metric === 'volume', false),
    [rawMaxMonth, metric]
  );
  const yearScale = useMemo(
    () => getNiceScale(rawMaxYear, metric === 'volume', true),
    [rawMaxYear, metric]
  );

  const activePrimaryScale = series === 'year' ? yearScale : monthScale;

  const activeGridTicks = useMemo(() => {
    if (series === 'both') {
      return monthScale.ticks.map((v) => ({
        val: v,
        rightVal: (v / monthScale.niceMax) * yearScale.niceMax
      }));
    }
    if (series === 'year') {
      return yearScale.ticks.map((v) => ({ val: v, rightVal: null }));
    }
    return monthScale.ticks.map((v) => ({ val: v, rightVal: null }));
  }, [series, monthScale, yearScale]);

  const getX = (index: number) => {
    if (chartItems.length <= 1) return padding.left + chartW / 2;
    return padding.left + (index / (chartItems.length - 1)) * chartW;
  };

  const getYMonth = (val: number) => {
    const ratio = Math.max(0, Math.min(1, val / monthScale.niceMax));
    return padding.top + chartH - ratio * chartH;
  };

  const getYYear = (val: number) => {
    const targetMax = useDualScale ? yearScale.niceMax : (series === 'year' ? yearScale.niceMax : monthScale.niceMax);
    const ratio = Math.max(0, Math.min(1, val / targetMax));
    return padding.top + chartH - ratio * chartH;
  };

  // Fritsch-Carlson Monotone Cubic Spline (guaranteed NO overshooting, NO dips below baseline)
  const buildMonotoneCubicPath = (points: { x: number; y: number }[]) => {
    const n = points.length;
    if (n === 0) return '';
    if (n === 1) return `M ${points[0].x.toFixed(1)} ${points[0].y.toFixed(1)}`;
    if (n === 2) return `M ${points[0].x.toFixed(1)} ${points[0].y.toFixed(1)} L ${points[1].x.toFixed(1)} ${points[1].y.toFixed(1)}`;

    const dxs: number[] = [];
    const dys: number[] = [];
    const slopes: number[] = [];
    for (let i = 0; i < n - 1; i++) {
      const dx = points[i + 1].x - points[i].x;
      const dy = points[i + 1].y - points[i].y;
      dxs.push(dx);
      dys.push(dy);
      slopes.push(dx === 0 ? 0 : dy / dx);
    }

    const m: number[] = new Array(n);
    m[0] = slopes[0];
    for (let i = 1; i < n - 1; i++) {
      if (slopes[i - 1] * slopes[i] <= 0) {
        m[i] = 0;
      } else {
        m[i] = (slopes[i - 1] + slopes[i]) / 2;
      }
    }
    m[n - 1] = slopes[n - 2];

    for (let i = 0; i < n - 1; i++) {
      if (dys[i] === 0) {
        m[i] = 0;
        m[i + 1] = 0;
      } else {
        const alpha = m[i] / slopes[i];
        const beta = m[i + 1] / slopes[i];
        const s = alpha * alpha + beta * beta;
        if (s > 9) {
          const tau = 3 / Math.sqrt(s);
          m[i] = tau * alpha * slopes[i];
          m[i + 1] = tau * beta * slopes[i];
        }
      }
    }

    let d = `M ${points[0].x.toFixed(1)} ${points[0].y.toFixed(1)}`;
    for (let i = 0; i < n - 1; i++) {
      const cp1x = points[i].x + dxs[i] / 3;
      const cp1y = points[i].y + (m[i] * dxs[i]) / 3;
      const cp2x = points[i + 1].x - dxs[i] / 3;
      const cp2y = points[i + 1].y - (m[i + 1] * dxs[i]) / 3;
      d += ` C ${cp1x.toFixed(1)} ${cp1y.toFixed(1)}, ${cp2x.toFixed(1)} ${cp2y.toFixed(1)}, ${points[i + 1].x.toFixed(1)} ${points[i + 1].y.toFixed(1)}`;
    }
    return d;
  };

  const monthPoints = useMemo(
    () => chartItems.map((d, i) => ({ x: getX(i), y: getYMonth(getMonthVal(d)) })),
    [chartItems, monthScale, chartW, chartH]
  );

  const yearPoints = useMemo(
    () => chartItems.map((d, i) => ({ x: getX(i), y: getYYear(getYearVal(d)) })),
    [chartItems, yearScale, chartW, chartH, useDualScale]
  );

  const monthPath = useMemo(() => buildMonotoneCubicPath(monthPoints), [monthPoints]);
  const yearPath = useMemo(() => buildMonotoneCubicPath(yearPoints), [yearPoints]);

  const monthAreaPath = useMemo(() => {
    if (monthPoints.length === 0) return '';
    const lastX = monthPoints[monthPoints.length - 1].x;
    const firstX = monthPoints[0].x;
    const bottomY = padding.top + chartH;
    return `${monthPath} L ${lastX.toFixed(1)} ${bottomY} L ${firstX.toFixed(1)} ${bottomY} Z`;
  }, [monthPath, monthPoints, padding.top, chartH]);

  const yearAreaPath = useMemo(() => {
    if (yearPoints.length === 0) return '';
    const lastX = yearPoints[yearPoints.length - 1].x;
    const firstX = yearPoints[0].x;
    const bottomY = padding.top + chartH;
    return `${yearPath} L ${lastX.toFixed(1)} ${bottomY} L ${firstX.toFixed(1)} ${bottomY} Z`;
  }, [yearPath, yearPoints, padding.top, chartH]);

  // Overall calculations for summary statistics cards
  const totalTurnoverYear = useMemo(
    () => periodFilteredData.reduce((acc, curr) => acc + (curr.yearValueUsd || 0), 0) / 1_000_000_000,
    [periodFilteredData]
  );

  const totalVolumeYear = useMemo(
    () => periodFilteredData.reduce((acc, curr) => acc + (curr.yearVolume || 0), 0) / 1_000_000,
    [periodFilteredData]
  );

  const topTurnoverCommodity = useMemo(() => {
    if (periodFilteredData.length === 0) return null;
    return [...periodFilteredData].sort((a, b) => b.yearValueUsd - a.yearValueUsd)[0];
  }, [periodFilteredData]);

  const hoveredItem = hoveredIndex !== null ? chartItems[hoveredIndex] : null;

  return (
    <div
      ref={containerRef}
      className={`bg-white rounded-3xl border border-gray-200 shadow-xl p-6 md:p-8 ${className}`}
    >
      {/* Optional Header Banner */}
      {showHeader && (
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5 pb-6 border-b border-gray-100 mb-6">
          <div>
            <div className="flex items-center gap-2 text-emerald-800 font-black text-xs uppercase tracking-wider mb-1">
              <Calendar size={14} className="text-lime-500" />
              <span>Vietnam Agri-Export Trade Intelligence</span>
            </div>
            <h3 className="text-xl md:text-2xl font-black text-emerald-950">
              {title || copy.defaultTitle}
            </h3>
            <p className="text-sm text-gray-500 mt-1">
              {subtitle || copy.defaultSubtitle}
            </p>
          </div>

          {/* Period Selector (Kỳ báo cáo) */}
          <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200/80 px-4 py-2 rounded-2xl shadow-sm self-start lg:self-center">
            <Calendar size={15} className="text-emerald-700 flex-shrink-0" />
            <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider">{copy.periodLabel}:</span>
            {availablePeriods.length > 1 ? (
              <div className="relative">
                <select
                  value={selectedPeriod}
                  onChange={(e) => setSelectedPeriod(e.target.value)}
                  className="appearance-none bg-white text-xs font-black text-emerald-950 pl-3 pr-8 py-1.5 rounded-xl border border-emerald-200 shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 cursor-pointer"
                >
                  {availablePeriods.map((p) => (
                    <option key={p} value={p} className="text-gray-900 font-semibold">
                      {formatPeriodDisplay(p, locale)}
                    </option>
                  ))}
                </select>
                <ChevronDown size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-emerald-700 pointer-events-none" />
              </div>
            ) : (
              <span className="text-xs font-black text-emerald-950">
                {formatPeriodDisplay(selectedPeriod, locale)}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Controls Bar: Metric, Series & Chart Type */}
      {showControls && (
        <div className="flex flex-wrap items-center justify-between gap-3 pb-5 border-b border-gray-100 mb-6">
          <div className="flex flex-wrap items-center gap-3">
            {/* Period Selector (when showHeader is false) */}
            {!showHeader && (
              <div className="inline-flex items-center gap-2 bg-emerald-50 border border-emerald-200 px-3.5 py-1.5 rounded-2xl shadow-sm">
                <Calendar size={13} className="text-emerald-700 flex-shrink-0" />
                <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider">{copy.periodLabel}:</span>
                {availablePeriods.length > 1 ? (
                  <div className="relative">
                    <select
                      value={selectedPeriod}
                      onChange={(e) => setSelectedPeriod(e.target.value)}
                      className="appearance-none bg-white text-xs font-black text-emerald-950 pl-2.5 pr-7 py-1 rounded-xl border border-emerald-200 shadow-sm focus:outline-none cursor-pointer"
                    >
                      {availablePeriods.map((p) => (
                        <option key={p} value={p} className="text-gray-900 font-semibold">
                          {formatPeriodDisplay(p, locale)}
                        </option>
                      ))}
                    </select>
                    <ChevronDown size={11} className="absolute right-2 top-1/2 -translate-y-1/2 text-emerald-700 pointer-events-none" />
                  </div>
                ) : (
                  <span className="text-xs font-black text-emerald-950">
                    {formatPeriodDisplay(selectedPeriod, locale)}
                  </span>
                )}
              </div>
            )}

            {/* Metric Switcher: Volume vs Value */}
            <div className="inline-flex bg-gray-100/90 p-1 rounded-2xl border border-gray-200 shadow-inner">
              <button
                type="button"
                onClick={() => setMetric('volume')}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-black transition-all ${
                  metric === 'volume'
                    ? 'bg-white text-emerald-950 shadow-sm'
                    : 'text-gray-600 hover:text-emerald-950'
                }`}
              >
                <Scale size={13} />
                {copy.metricVolume}
              </button>
              <button
                type="button"
                onClick={() => setMetric('value')}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-black transition-all ${
                  metric === 'value'
                    ? 'bg-white text-emerald-950 shadow-sm'
                    : 'text-gray-600 hover:text-emerald-950'
                }`}
              >
                <DollarSign size={13} />
                {copy.metricValue}
              </button>
            </div>

            {/* Series Switcher */}
            <div className="inline-flex bg-gray-100/90 p-1 rounded-2xl border border-gray-200 shadow-inner">
              <button
                type="button"
                onClick={() => setSeries('both')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  series === 'both'
                    ? 'bg-emerald-900 text-white shadow-sm'
                    : 'text-gray-600 hover:text-emerald-950'
                }`}
              >
                {copy.seriesBoth}
              </button>
              <button
                type="button"
                onClick={() => setSeries('month')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  series === 'month'
                    ? 'bg-emerald-900 text-white shadow-sm'
                    : 'text-gray-600 hover:text-emerald-950'
                }`}
              >
                {copy.seriesMonth}
              </button>
              <button
                type="button"
                onClick={() => setSeries('year')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  series === 'year'
                    ? 'bg-emerald-900 text-white shadow-sm'
                    : 'text-gray-600 hover:text-emerald-950'
                }`}
              >
                {copy.seriesYear}
              </button>
            </div>
          </div>

          {/* Chart Type: Line vs Bar */}
          <div className="inline-flex bg-gray-100/90 p-1 rounded-2xl border border-gray-200 shadow-inner">
            <button
              type="button"
              onClick={() => setChartType('line')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                chartType === 'line'
                  ? 'bg-white text-emerald-950 shadow-sm'
                  : 'text-gray-600 hover:text-emerald-950'
              }`}
            >
              <TrendingUp size={14} />
              <span>{copy.chartLine}</span>
            </button>
            <button
              type="button"
              onClick={() => setChartType('bar')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                chartType === 'bar'
                  ? 'bg-white text-emerald-950 shadow-sm'
                  : 'text-gray-600 hover:text-emerald-950'
              }`}
            >
              <BarChart2 size={14} />
              <span>{copy.chartBar}</span>
            </button>
          </div>
        </div>
      )}

      {/* Summary Highlight Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="p-4 rounded-2xl bg-emerald-50/50 border border-emerald-900/10 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-emerald-900/10 flex items-center justify-center text-emerald-900 flex-shrink-0">
            <DollarSign size={20} />
          </div>
          <div>
            <div className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">{copy.totalValue}</div>
            <div className="text-xl font-black text-emerald-950">${totalTurnoverYear.toFixed(2)}B USD</div>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-emerald-50/50 border border-emerald-900/10 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-lime-500/20 flex items-center justify-center text-emerald-900 flex-shrink-0">
            <Scale size={20} />
          </div>
          <div>
            <div className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">{copy.totalVolume}</div>
            <div className="text-xl font-black text-emerald-950">{totalVolumeYear.toFixed(2)}M {copy.tons}</div>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-emerald-50/50 border border-emerald-900/10 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-700 flex-shrink-0">
            <Layers size={20} />
          </div>
          <div>
            <div className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">{copy.topCommodity}</div>
            <div className="text-base font-black text-emerald-950 truncate">
              {topTurnoverCommodity ? getItemName(topTurnoverCommodity) : 'Coffee'} (${((topTurnoverCommodity?.yearValueUsd || 0) / 1e9).toFixed(2)}B)
            </div>
          </div>
        </div>
      </div>

      {/* Legend & Scale indicators */}
      <div className="flex flex-wrap items-center justify-between text-xs text-gray-600 gap-3 mb-3 px-1">
        <div className="flex items-center gap-5">
          {(series === 'both' || series === 'month') && (
            <div className="flex items-center gap-2">
              <span className="w-3.5 h-3.5 rounded-full bg-emerald-500 ring-2 ring-emerald-200" />
              <span className="font-bold text-emerald-950">{copy.monthLegend}</span>
            </div>
          )}
          {(series === 'both' || series === 'year') && (
            <div className="flex items-center gap-2">
              <span className="w-3.5 h-3.5 rounded-full bg-emerald-900 ring-2 ring-emerald-900/20" />
              <span className="font-bold text-emerald-950">{copy.yearLegend}</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-1.5 text-[11px] text-gray-500 italic">
          <Info size={13} className="text-lime-600" />
          <span>{copy.sourceNote}</span>
        </div>
      </div>

      {/* SVG Chart Container */}
      <div className="relative w-full overflow-x-auto select-none pt-2">
        <svg
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          className="w-full h-auto min-w-[650px] overflow-visible"
        >
          <defs>
            {/* Gradients for area below lines */}
            <linearGradient id="monthGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10b981" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
            </linearGradient>
            <linearGradient id="yearGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#064e3b" stopOpacity="0.2" />
              <stop offset="100%" stopColor="#064e3b" stopOpacity="0.0" />
            </linearGradient>
            <linearGradient id="monthGradSolid" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#34d399" />
              <stop offset="100%" stopColor="#059669" />
            </linearGradient>
            <linearGradient id="yearGradSolid" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#065f46" />
              <stop offset="100%" stopColor="#022c22" />
            </linearGradient>

            <filter id="pointShadow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="2" stdDeviation="2" floodOpacity="0.2" />
            </filter>
          </defs>

          {/* Grid lines with nice, even round numbers (e.g. 50k, 100k, 150k...) */}
          {activeGridTicks.map((tick, i) => {
            const ratio = tick.val / activePrimaryScale.niceMax;
            const y = padding.top + chartH * (1 - ratio);
            const isZero = tick.val === 0;

            return (
              <g key={i}>
                <line
                  x1={padding.left}
                  y1={y}
                  x2={padding.left + chartW}
                  y2={y}
                  stroke={isZero ? '#cbd5e1' : '#e2e8f0'}
                  strokeDasharray={isZero ? 'none' : '4 4'}
                  strokeWidth={isZero ? '1.5' : '1'}
                />
                {/* Left Y Axis Label (Month or primary scale) */}
                <text
                  x={padding.left - 10}
                  y={y + 4}
                  textAnchor="end"
                  className="text-[10px] fill-emerald-800 font-bold"
                >
                  {formatAxisTick(tick.val, metric === 'volume')}
                </text>

                {/* Right Y Axis Label (Year scale when both active) */}
                {series === 'both' && tick.rightVal != null && (
                  <text
                    x={padding.left + chartW + 10}
                    y={y + 4}
                    textAnchor="start"
                    className="text-[10px] fill-emerald-950 font-bold"
                  >
                    {formatAxisTick(tick.rightVal, metric === 'volume')}
                  </text>
                )}
              </g>
            );
          })}

          {/* Bar Chart Mode */}
          {chartType === 'bar' && (
            <g>
              {chartItems.map((d, i) => {
                const x = getX(i);
                const yM = getYMonth(getMonthVal(d));
                const yY = getYYear(getYearVal(d));
                const baseH = padding.top + chartH;
                const hM = Math.max(4, baseH - yM);
                const hY = Math.max(4, baseH - yY);
                const isHovered = hoveredIndex === i;

                if (series === 'both') {
                  const barW = 20;
                  return (
                    <g key={d.id || i} opacity={hoveredIndex !== null && !isHovered ? 0.45 : 1} className="transition-opacity duration-150">
                      {/* Year Bar (Dark green) */}
                      <rect
                        x={x - barW - 2}
                        y={yY}
                        width={barW}
                        height={hY}
                        rx={5}
                        fill="url(#yearGradSolid)"
                      />
                      <text
                        x={x - barW / 2 - 2}
                        y={yY - 6}
                        textAnchor="middle"
                        className="text-[9px] font-black fill-emerald-950"
                      >
                        {metric === 'volume'
                          ? `${(getYearVal(d) / 1000).toFixed(0)}k`
                          : `$${getYearVal(d).toFixed(0)}M`}
                      </text>

                      {/* Month Bar (Emerald green) */}
                      <rect
                        x={x + 2}
                        y={yM}
                        width={barW}
                        height={hM}
                        rx={5}
                        fill="url(#monthGradSolid)"
                      />
                      <text
                        x={x + barW / 2 + 2}
                        y={yM - 6}
                        textAnchor="middle"
                        className="text-[9px] font-black fill-emerald-600"
                      >
                        {metric === 'volume'
                          ? `${(getMonthVal(d) / 1000).toFixed(1)}k`
                          : `$${getMonthVal(d).toFixed(0)}M`}
                      </text>
                    </g>
                  );
                }

                const barW = 34;
                const isMonth = series === 'month';
                const y = isMonth ? yM : yY;
                const h = isMonth ? hM : hY;
                const val = isMonth ? getMonthVal(d) : getYearVal(d);

                return (
                  <g key={d.id || i} opacity={hoveredIndex !== null && !isHovered ? 0.45 : 1} className="transition-opacity duration-150">
                    <rect
                      x={x - barW / 2}
                      y={y}
                      width={barW}
                      height={h}
                      rx={6}
                      fill={isMonth ? 'url(#monthGradSolid)' : 'url(#yearGradSolid)'}
                    />
                    <text
                      x={x}
                      y={y - 7}
                      textAnchor="middle"
                      className="text-[10px] font-black fill-emerald-950"
                    >
                      {metric === 'volume'
                        ? `${(val / 1000).toFixed(1)}k`
                        : `$${val.toFixed(0)}M`}
                    </text>
                  </g>
                );
              })}
            </g>
          )}

          {/* Line Chart Mode */}
          {chartType === 'line' && (
            <g>
              {/* Area Fills */}
              {(series === 'both' || series === 'year') && (
                <path d={yearAreaPath} fill="url(#yearGrad)" />
              )}
              {(series === 'both' || series === 'month') && (
                <path d={monthAreaPath} fill="url(#monthGrad)" />
              )}

              {/* Stroke Lines (Fritsch-Carlson strictly monotonic - no overshoot) */}
              {(series === 'both' || series === 'year') && (
                <path
                  d={yearPath}
                  fill="none"
                  stroke="#064e3b"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              )}
              {(series === 'both' || series === 'month') && (
                <path
                  d={monthPath}
                  fill="none"
                  stroke="#10b981"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              )}

              {/* Interactive Hover Guides & Crosshairs */}
              {hoveredIndex !== null && (
                <line
                  x1={getX(hoveredIndex)}
                  y1={padding.top}
                  x2={getX(hoveredIndex)}
                  y2={padding.top + chartH}
                  stroke="#064e3b"
                  strokeWidth="1.5"
                  strokeDasharray="3 3"
                  strokeOpacity="0.6"
                />
              )}

              {/* Data Points and Value Badges */}
              {chartItems.map((d, i) => {
                const x = getX(i);
                const yM = getYMonth(getMonthVal(d));
                const yY = getYYear(getYearVal(d));
                const isHovered = hoveredIndex === i;

                return (
                  <g key={`points-${d.id || i}`}>
                    {/* Year Point & Value Badge */}
                    {(series === 'both' || series === 'year') && (
                      <g>
                        <circle
                          cx={x}
                          cy={yY}
                          r={isHovered ? 7 : 4.5}
                          fill="#064e3b"
                          stroke="#ffffff"
                          strokeWidth={isHovered ? '3' : '2'}
                          filter="url(#pointShadow)"
                          className="transition-all duration-150"
                        />
                        <g transform={`translate(${x}, ${yY - 14})`}>
                          <rect
                            x={-24}
                            y={-11}
                            width={48}
                            height={16}
                            rx={8}
                            fill="#064e3b"
                            className="drop-shadow-sm"
                          />
                          <text
                            x={0}
                            y={0}
                            textAnchor="middle"
                            dominantBaseline="middle"
                            className="text-[9px] font-black fill-white select-none"
                          >
                            {metric === 'volume'
                              ? `${(getYearVal(d) / 1000).toFixed(0)}k`
                              : `$${getYearVal(d).toFixed(0)}M`}
                          </text>
                        </g>
                      </g>
                    )}

                    {/* Month Point & Value Badge */}
                    {(series === 'both' || series === 'month') && (
                      <g>
                        <circle
                          cx={x}
                          cy={yM}
                          r={isHovered ? 7 : 4.5}
                          fill="#10b981"
                          stroke="#ffffff"
                          strokeWidth={isHovered ? '3' : '2'}
                          filter="url(#pointShadow)"
                          className="transition-all duration-150"
                        />
                        <g transform={`translate(${x}, ${series === 'both' ? yM + 16 : yM - 14})`}>
                          <rect
                            x={-24}
                            y={-11}
                            width={48}
                            height={16}
                            rx={8}
                            fill="#10b981"
                            className="drop-shadow-sm"
                          />
                          <text
                            x={0}
                            y={0}
                            textAnchor="middle"
                            dominantBaseline="middle"
                            className="text-[9px] font-black fill-white select-none"
                          >
                            {metric === 'volume'
                              ? `${(getMonthVal(d) / 1000).toFixed(1)}k`
                              : `$${getMonthVal(d).toFixed(0)}M`}
                          </text>
                        </g>
                      </g>
                    )}
                  </g>
                );
              })}
            </g>
          )}

          {/* Bottom X-Axis Commodity Labels & Click Areas */}
          {chartItems.map((d, i) => {
            const x = getX(i);
            const isHovered = hoveredIndex === i;

            return (
              <g key={`xaxis-${d.id || i}`}>
                {/* Commodity Label */}
                <text
                  x={x}
                  y={padding.top + chartH + 26}
                  textAnchor="middle"
                  className={`text-xs font-bold transition-colors ${
                    isHovered ? 'fill-emerald-950 font-black' : 'fill-gray-700'
                  }`}
                >
                  {getItemName(d)}
                </text>

                {/* Category / Unit Tag */}
                <text
                  x={x}
                  y={padding.top + chartH + 44}
                  textAnchor="middle"
                  className="text-[10px] fill-gray-400 uppercase tracking-widest font-semibold"
                >
                  {d.unit === 'USD' ? 'USD' : copy.tons}
                </text>

                {/* Invisible wide capture area for easy hovering */}
                <rect
                  x={x - chartW / (chartItems.length * 2)}
                  y={padding.top}
                  width={chartW / chartItems.length}
                  height={chartH + 50}
                  fill="transparent"
                  className="cursor-pointer"
                  onMouseEnter={() => setHoveredIndex(i)}
                  onMouseLeave={() => setHoveredIndex(null)}
                />
              </g>
            );
          })}
        </svg>

        {/* Floating Detail Tooltip */}
        {hoveredItem && hoveredIndex !== null && (
          <div
            className="absolute z-30 pointer-events-none bg-emerald-950 text-white rounded-2xl shadow-2xl p-4 text-xs w-72 transition-all duration-150 border border-white/10"
            style={{
              left: `calc(${((getX(hoveredIndex) / svgWidth) * 100).toFixed(1)}%)`,
              top: '15px',
              transform: getX(hoveredIndex) > svgWidth * 0.65 ? 'translateX(-100%)' : 'translateX(10px)'
            }}
          >
            <div className="flex items-center justify-between pb-2 border-b border-white/10 mb-2.5">
              <span className="font-black text-sm text-lime-400">
                {getItemName(hoveredItem)}
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/10 font-bold uppercase tracking-wider text-white/80">
                {formatPeriodDisplay(hoveredItem.reportingPeriod, locale)}
              </span>
            </div>

            <div className="space-y-2">
              {/* Month Data */}
              <div className="flex items-center justify-between">
                <span className="text-white/70 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  {copy.monthLegend}:
                </span>
                <span className="font-bold text-white">
                  {hoveredItem.monthVolume != null
                    ? `${hoveredItem.monthVolume.toLocaleString()} ${copy.tons}`
                    : ''}
                  {hoveredItem.monthValueUsd
                    ? ` ($${(hoveredItem.monthValueUsd / 1e6).toFixed(1)}M)`
                    : ''}
                </span>
              </div>

              {/* Year Data */}
              <div className="flex items-center justify-between">
                <span className="text-white/70 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-lime-400" />
                  {copy.yearLegend}:
                </span>
                <span className="font-bold text-white">
                  {hoveredItem.yearVolume != null
                    ? `${hoveredItem.yearVolume.toLocaleString()} ${copy.tons}`
                    : ''}
                  {hoveredItem.yearValueUsd
                    ? ` ($${(hoveredItem.yearValueUsd / 1e6).toFixed(1)}M)`
                    : ''}
                </span>
              </div>

              {/* Growth Stats */}
              {(hoveredItem.momGrowthPercent != null || hoveredItem.yoyGrowthPercent != null) && (
                <div className="pt-2 border-t border-white/10 flex items-center justify-between text-[11px]">
                  {hoveredItem.momGrowthPercent != null && (
                    <div className="flex items-center gap-1">
                      <span className="text-white/60">{copy.momLabel}:</span>
                      <span
                        className={`font-black flex items-center ${
                          hoveredItem.momGrowthPercent >= 0 ? 'text-emerald-400' : 'text-rose-400'
                        }`}
                      >
                        {hoveredItem.momGrowthPercent >= 0 ? '+' : ''}
                        {hoveredItem.momGrowthPercent}%
                      </span>
                    </div>
                  )}

                  {hoveredItem.yoyGrowthPercent != null && (
                    <div className="flex items-center gap-1">
                      <span className="text-white/60">{copy.yoyLabel}:</span>
                      <span
                        className={`font-black flex items-center ${
                          hoveredItem.yoyGrowthPercent >= 0 ? 'text-emerald-400' : 'text-rose-400'
                        }`}
                      >
                        {hoveredItem.yoyGrowthPercent >= 0 ? '+' : ''}
                        {hoveredItem.yoyGrowthPercent}%
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AgriExportLineChart;
