"use client";

import { useMemo } from "react";
import { Globe, Truck, Users, TrendingUp, Droplets, Sun, Mountain, Thermometer, Info, Target, Map } from "lucide-react";
import { CATEGORY_BI_DATA } from "../interactive-map/data/region-infographic-data";

function StatCard({ icon: Icon, value, label }) {
  return (
    <div className="infographic-stat-card">
      <div className="infographic-stat-icon">
        <Icon size={20} strokeWidth={2} />
      </div>
      <div className="infographic-stat-content">
        <strong>{value}</strong>
        <span>{label}</span>
      </div>
    </div>
  );
}

function DonutChart({ data }) {
  const total = data.reduce((sum, d) => sum + d.value, 0);
  let accumulated = 0;
  const segments = data.map((d) => {
    const percentage = (d.value / total) * 100;
    const offset = accumulated;
    accumulated += percentage;
    return { ...d, percentage, offset };
  });
  const radius = 80;
  const circumference = 2 * Math.PI * radius;

  return (
    <div className="infographic-donut-wrapper">
      <svg viewBox="0 0 200 200" className="infographic-donut-svg">
        {segments.map((segment) => (
          <circle
            key={segment.label}
            cx="100" cy="100" r={radius}
            fill="none" stroke={segment.color || "var(--ig-accent)"} strokeWidth="32"
            strokeDasharray={`${(segment.percentage / 100) * circumference} ${circumference}`}
            strokeDashoffset={`${-(segment.offset / 100) * circumference}`}
            transform="rotate(-90 100 100)"
            className="infographic-donut-segment"
          />
        ))}
        <circle cx="100" cy="100" r="58" fill="var(--ig-surface)" />
      </svg>
      <div className="infographic-donut-legend">
        {segments.map((segment) => (
          <div key={segment.label} className="infographic-donut-legend-item">
            <span className="infographic-donut-legend-swatch" style={{ background: segment.color || "var(--ig-accent)" }} />
            <span className="infographic-donut-legend-label">{segment.label}</span>
            <strong className="infographic-donut-legend-value">{segment.value}%</strong>
          </div>
        ))}
      </div>
    </div>
  );
}

function BarChart({ data }) {
  const maxVal = Math.max(...data.map(d => d.value));

  return (
    <div className="infographic-bar-wrapper">
      <div className="infographic-bar-chart">
        {data.map((item) => {
          const heightPct = (item.value / maxVal) * 100;
          return (
            <div key={item.label} className="infographic-bar-item">
              <span className="infographic-bar-val">{item.value.toLocaleString()}</span>
              <div className="infographic-bar-track">
                <div className="infographic-bar-fill" style={{ height: `${heightPct}%` }}></div>
              </div>
              <span className="infographic-bar-label">{item.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function MetricsList({ metrics, copy }) {
  const icons = [Mountain, Thermometer, Droplets, Target, Info, Sun, Map];
  return (
    <div className="infographic-conditions">
      <h3 className="infographic-conditions-title">{copy?.statsConditionsTitle ?? "Key Characteristics"}</h3>
      <div className="infographic-conditions-grid">
        {metrics.map((metric, index) => {
          const Icon = icons[index % icons.length];
          return (
            <div key={metric.label} className="infographic-condition-row">
              <div className="infographic-condition-icon"><Icon size={16} strokeWidth={2} /></div>
              <div className="infographic-condition-content">
                <span className="infographic-condition-label">{metric.label}</span>
                <strong className="infographic-condition-value">{metric.value}</strong>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function MapOverviewStats({ copy, activeData }) {
  const data = activeData || CATEGORY_BI_DATA.All;
  const stats = data.stats;
  return (
    <div className="infographic-stats-column">
      <h3 className="infographic-stats-column-title">
        {data.category === "All" ? (copy?.statsOverviewTitle ?? "Vietnam — Global Agricultural Powerhouse") : `${data.category} Industry Overview`}
      </h3>
      <div className="infographic-stat-stack">
        <StatCard icon={TrendingUp} value={stats.globalRank} label="Global standing" />
        <StatCard icon={Truck} value={stats.value} label="Output / Value" />
        <StatCard icon={Globe} value={stats.markets} label="Export Markets" />
        <StatCard icon={Users} value={stats.workforce} label="Workforce / Farming" />
      </div>
    </div>
  );
}

export function MapConditions({ copy, activeData }) {
  const data = activeData || CATEGORY_BI_DATA.All;
  return (
    <div className="infographic-stats-column">
      <MetricsList metrics={data.stats.keyMetrics} copy={copy} />
    </div>
  );
}

export function MapChart({ activeData }) {
  const data = activeData || CATEGORY_BI_DATA.All;
  const chart = data.chart;
  return (
    <div className="infographic-stats-column">
      <h3 className="infographic-stats-column-title">{chart.title}</h3>
      {chart.type === "donut" ? (
        <DonutChart data={chart.data} />
      ) : (
        <BarChart data={chart.data} />
      )}
    </div>
  );
}

export default function MapStatistics({ copy, activeData }) {
  const data = activeData || CATEGORY_BI_DATA.All;
  const stats = data.stats;
  const chart = data.chart;

  return (
    <section className="infographic-statistics">
      <div className="infographic-stats-grid">
        <MapOverviewStats copy={copy} activeData={activeData} />
        <MapConditions copy={copy} activeData={activeData} />
        <MapChart activeData={activeData} />
      </div>
    </section>
  );
}
