"use client";

import { useState, useMemo, useCallback } from "react";
import { ArrowLeft, Check, TrendingUp, Truck, Globe, Users, Mountain, Thermometer, Droplets, Target, Info, Sun, Map as MapIcon } from "lucide-react";
import { useNavigate } from "react-router-dom";
const Logo = "/logo-era.png";
import { appRoutes } from "../lib/routes";
import { CATEGORY_TABS, CATEGORY_BI_DATA, CATEGORY_TO_REGIONS } from "../interactive-map/data/region-infographic-data";
import StaticMapView from "./StaticMapView";
import RegionInfoCards from "./RegionInfoCards";

/* ── helpers ── */
const t = (obj, locale) => (typeof obj === "string" ? obj : obj?.[locale] ?? obj?.en ?? "");
const tArr = (obj, locale) => (Array.isArray(obj) ? obj : obj?.[locale] ?? obj?.en ?? []);

/* ── Sub-components ── */
// HeroBanner removed

function StatsRow({ data, locale }) {
  const stats = data.stats;
  const chart = data.chart;
  const icons = [TrendingUp, Truck, Globe, Users];
  const labels = ["Global standing", "Output / Value", "Export Markets", "Workforce"];
  const values = [stats.globalRank, stats.value, stats.markets, stats.workforce];
  const condIcons = [Mountain, Thermometer, Droplets, Target, Info, Sun, MapIcon];

  const maxVal = chart?.data ? Math.max(...chart.data.map((d) => d.value)) : 1;
  const total = chart?.data ? chart.data.reduce((s, d) => s + d.value, 0) : 1;

  return (
    <section className="ptm-stats-row">
      {/* Col 1: Stats */}
      <div className="ptm-stats-col">
        <h3 className="ptm-stats-col-title">{locale === "zh" ? "行业概览" : "Industry Overview"}</h3>
        <div className="ptm-stat-stack">
          {values.map((val, i) => {
            const Icon = icons[i];
            return (
              <div key={i} className="ptm-stat-card">
                <div className="ptm-stat-icon"><Icon size={18} strokeWidth={2} /></div>
                <div className="ptm-stat-content"><strong>{val}</strong><span>{labels[i]}</span></div>
              </div>
            );
          })}
        </div>
      </div>
      {/* Col 2: Conditions */}
      <div className="ptm-stats-col">
        <h3 className="ptm-stats-col-title">{locale === "zh" ? "有利自然条件" : "Key Characteristics"}</h3>
        <div className="ptm-conditions-grid">
          {stats.keyMetrics.map((m, i) => {
            const Icon = condIcons[i % condIcons.length];
            return (
              <div key={m.label} className="ptm-condition-row">
                <div className="ptm-condition-icon"><Icon size={15} strokeWidth={2} /></div>
                <div className="ptm-condition-content">
                  <span className="ptm-condition-label">{m.label}</span>
                  <strong className="ptm-condition-value">{m.value}</strong>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      {/* Col 3: Chart */}
      <div className="ptm-stats-col">
        <h3 className="ptm-stats-col-title">{chart?.title ?? "Chart"}</h3>
        {chart?.type === "donut" ? (
          <DonutChart data={chart.data} total={total} />
        ) : (
          <BarChart data={chart?.data ?? []} maxVal={maxVal} />
        )}
      </div>
    </section>
  );
}

function DonutChart({ data, total }) {
  let accumulated = 0;
  const radius = 80;
  const circumference = 2 * Math.PI * radius;
  const segments = data.map((d) => {
    const pct = (d.value / total) * 100;
    const offset = accumulated;
    accumulated += pct;
    return { ...d, pct, offset };
  });
  return (
    <div className="ptm-donut-wrap">
      <svg viewBox="0 0 200 200" className="ptm-donut-svg">
        {segments.map((s) => (
          <circle key={s.label} cx="100" cy="100" r={radius} fill="none"
            stroke={s.color || "#2f964f"} strokeWidth="30"
            strokeDasharray={`${(s.pct / 100) * circumference} ${circumference}`}
            strokeDashoffset={`${-(s.offset / 100) * circumference}`}
            transform="rotate(-90 100 100)" />
        ))}
        <circle cx="100" cy="100" r="58" fill="var(--sea, #edf3f6)" />
      </svg>
      <div className="ptm-donut-legend">
        {segments.map((s) => (
          <div key={s.label} className="ptm-donut-legend-item">
            <span className="ptm-legend-swatch" style={{ background: s.color }} />
            <span>{s.label}</span>
            <strong>{s.value}%</strong>
          </div>
        ))}
      </div>
    </div>
  );
}

function BarChart({ data, maxVal }) {
  return (
    <div className="ptm-bar-chart">
      {data.map((item) => (
        <div key={item.label} className="ptm-bar-item">
          <span className="ptm-bar-val">{item.value >= 1000 ? `${(item.value / 1000).toFixed(0)}K` : item.value.toLocaleString()}</span>
          <div className="ptm-bar-track">
            <div className="ptm-bar-fill" style={{ height: `${(item.value / maxVal) * 100}%` }} />
          </div>
          <span className="ptm-bar-label">{item.label}</span>
        </div>
      ))}
    </div>
  );
}

function PracticesRow({ data, locale }) {
  const cards = tArr(data.practiceCards, locale);
  if (!cards || cards.length === 0) return null;
  return (
    <section className="ptm-practices-row">
      {cards.map((card, i) => (
        <div key={i} className="ptm-practice-card">
          <h4 className="ptm-practice-title">{card.title}</h4>
          <ul className="ptm-practice-list">
            {card.items.map((item, j) => (
              <li key={j}><Check size={12} strokeWidth={3} /><span>{item}</span></li>
            ))}
          </ul>
        </div>
      ))}
    </section>
  );
}

/* ── MAIN ── */
export default function ProductInfographicMap({ copy, locale = "en" }) {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("Rice");
  const [hoveredRegion, setHoveredRegion] = useState(null);

  const data = CATEGORY_BI_DATA[activeTab];
  const matchingRegions = useMemo(() => CATEGORY_TO_REGIONS[activeTab] ?? [], [activeTab]);

  const handleBack = () => {
    const idx = Number(window.history.state?.idx ?? -1);
    if (idx >= 1 || window.history.length > 1) { navigate(-1); return; }
    navigate(appRoutes.home);
  };

  const handleRegionHover = useCallback((key) => setHoveredRegion(key), []);
  const handleRegionLeave = useCallback(() => setHoveredRegion(null), []);
  const handleRegionClick = useCallback((key) => setHoveredRegion((p) => (p === key ? null : key)), []);

  const tabLabels = {
    en: { Rice: "Rice", Coffee: "Coffee", Cashew: "Cashew", Pepper: "Pepper", Durian: "Durian", Watermelon: "Watermelon" },
    zh: { Rice: "大米", Coffee: "咖啡", Cashew: "腰果", Pepper: "胡椒", Durian: "榴莲", Watermelon: "西瓜" },
  };

  return (
    <div className="ptm-page">
      {/* Header */}
      <header className="ptm-header">
        <div className="ptm-header-top">
          <div className="ptm-header-brand">
            <button type="button" className="ptm-back-btn" onClick={handleBack} aria-label={copy?.backAria ?? "Back"}>
              <ArrowLeft size={18} />
            </button>
            <img src={Logo} alt="FoodEra" className="ptm-logo" style={{ height: '51px', width: 'auto' }} loading="eager" />
            <div className="ptm-header-title-group">
              <h1 className="ptm-header-title">{t(data.heroTitle, locale)}</h1>
              <span className="ptm-header-subtitle">{t(data.heroSubtitle, locale)}</span>
            </div>
          </div>
        </div>
        <nav className="ptm-tabs" role="tablist">
          {CATEGORY_TABS.map((tab) => (
            <button
              key={tab}
              role="tab"
              aria-selected={activeTab === tab}
              className={`ptm-tab ${activeTab === tab ? "is-active" : ""}`}
              onClick={() => setActiveTab(tab)}
            >
              {tabLabels[locale]?.[tab] ?? tab}
            </button>
          ))}
        </nav>
      </header>

      {/* Row 1: Map + Region Cards (Hero removed) */}
      <section className="ptm-map-row ptm-map-row-first">
        <div className="ptm-map-col">
          <StaticMapView
            highlightedRegion={hoveredRegion}
            highlightedRegions={matchingRegions}
            copy={copy}
            onProvinceHover={() => {}}
            onProvinceLeave={() => {}}
            onProvinceClick={() => {}}
            inSeasonRegions={[]}
          />
        </div>
        <div className="ptm-cards-col">
          <RegionInfoCards
            activeRegion={hoveredRegion}
            onRegionHover={handleRegionHover}
            onRegionLeave={handleRegionLeave}
            onRegionClick={handleRegionClick}
            copy={copy}
            activeCategory={activeTab}
          />
        </div>
      </section>

      {/* Row 3: Stats + Charts */}
      <StatsRow data={data} locale={locale} />

      {/* Row 4: Practices */}
      <PracticesRow data={data} locale={locale} />

      {/* Footer */}
      <footer className="ptm-footer">
        <span className="ptm-footer-source">{copy?.footerSource ?? "Source: General Dept. of Customs, MARD, 2024"}</span>
        <span className="ptm-footer-copyright">{copy?.copyrightLabel ?? "© 2026 FoodEra"}</span>
      </footer>
    </div>
  );
}
