"use client";

import { useMemo } from "react";
import { MapPin, BarChart3, CloudSun, Sprout, ShieldCheck } from "lucide-react";
import { BASE_REGIONS, REGION_VARIETIES } from "../interactive-map/data/region-infographic-data";

function RegionCard({ region, varieties, isActive, onHover, onLeave, onClick, locale = 'en' }) {
  const isZh = locale === 'zh';

  const regionName = typeof region.name === 'object'
    ? (region.name[locale] || region.name.en)
    : (isZh ? (region.nameZh || region.name) : (region.nameEn || region.name));

  const subName = isZh
    ? (typeof region.name === 'object' ? region.name.en : region.nameEn)
    : null;

  const area = typeof region.area === 'object'
    ? (region.area[locale] || region.area.en)
    : region.area;

  const climate = typeof region.climate === 'object'
    ? (region.climate[locale] || region.climate.en)
    : region.climate;

  const provinceList = Array.isArray(region.provinces)
    ? region.provinces
    : (region.provinces?.[locale] || region.provinces?.en || []);

  const localizedVarieties = Array.isArray(varieties)
    ? varieties
    : (varieties?.[locale] || varieties?.en || []);

  const hasVarieties = localizedVarieties && localizedVarieties.length > 0;

  return (
    <article
      className={`infographic-region-card ${isActive ? "is-active" : ""} ${!hasVarieties ? "is-dimmed" : ""}`}
      style={{ "--region-accent": region.color }}
      onMouseEnter={() => onHover(region.regionKey)}
      onMouseLeave={onLeave}
      onClick={() => onClick(region.regionKey)}
    >
      <div className="infographic-region-card-header">
        <span className="infographic-region-number">{region.number}</span>
        <div className="infographic-region-titles">
          <h3 className="infographic-region-name">{regionName}</h3>
          {subName && <span className="infographic-region-name-en">{subName}</span>}
        </div>
      </div>

      {region.certificates && region.certificates.length > 0 && (
        <div className="infographic-certificates">
          {region.certificates.map(cert => (
            <span key={cert} className="infographic-cert-badge">
              <ShieldCheck size={12} strokeWidth={2.5} />
              {cert}
            </span>
          ))}
        </div>
      )}

      <div className="infographic-region-body">
        <div className="infographic-region-specs">
          <div className="infographic-spec-row">
            <BarChart3 size={14} strokeWidth={2.2} />
            <span className="infographic-spec-label">{isZh ? '面积:' : 'Area:'}</span>
            <span className="infographic-spec-value">{area}</span>
          </div>
          <div className="infographic-spec-row">
            <CloudSun size={14} strokeWidth={2.2} />
            <span className="infographic-spec-label">{isZh ? '气候:' : 'Climate:'}</span>
            <span className="infographic-spec-value">{climate}</span>
          </div>
          <div className="infographic-spec-row">
            <Sprout size={14} strokeWidth={2.2} />
            <span className="infographic-spec-label">{isZh ? '品种:' : 'Varieties:'}</span>
            <span className="infographic-spec-value">
              {hasVarieties ? localizedVarieties.join(", ") : "—"}
            </span>
          </div>
        </div>

        {/* Province tags at the bottom */}
        <div className="infographic-province-tags">
          {provinceList.slice(0, 6).map((province) => (
            <span key={province} className="infographic-province-tag">
              <MapPin size={10} strokeWidth={2.4} />
              {province}
            </span>
          ))}
          {provinceList.length > 6 && (
            <span className="infographic-province-tag infographic-province-more">
              +{provinceList.length - 6}
            </span>
          )}
        </div>
      </div>
    </article>
  );
}

export default function RegionInfoCards({ activeRegion, onRegionHover, onRegionLeave, onRegionClick, copy, activeCategory, locale = 'en' }) {
  const categoryVarieties = useMemo(() => REGION_VARIETIES[activeCategory] ?? {}, [activeCategory]);

  // Only show regions that have varieties for this category
  const regions = useMemo(() => {
    return BASE_REGIONS.filter((r) => {
      const v = categoryVarieties[r.regionKey];
      if (Array.isArray(v)) return v.length > 0;
      return (v?.en?.length ?? 0) > 0 || (v?.zh?.length ?? 0) > 0;
    });
  }, [categoryVarieties]);

  const isZh = locale === 'zh';
  const categoryNamesZh = {
    Rice: '大米',
    Coffee: '咖啡',
    Cashew: '腰果',
    Pepper: '胡椒',
    Durian: '榴莲',
    Watermelon: '西瓜'
  };
  const catDisplay = isZh ? (categoryNamesZh[activeCategory] || activeCategory) : activeCategory;

  const title = activeCategory
    ? (isZh ? `${catDisplay} — 重点产区` : `${activeCategory} — Growing Regions`)
    : (copy?.regionListTitle ?? (isZh ? "主要农业产区" : "Major Growing Regions"));

  const subtitle = isZh
    ? `展示越南 ${regions.length} 个 ${catDisplay} 核心种植区`
    : `Showing ${regions.length} region${regions.length !== 1 ? "s" : ""} of Vietnam for ${activeCategory}`;

  return (
    <div className="infographic-region-list">
      <div className="infographic-region-list-header">
        <h2 className="infographic-section-title">{title}</h2>
        <span className="infographic-section-subtitle">{subtitle}</span>
      </div>

      <div className="infographic-region-cards">
        {regions.map((region) => (
          <RegionCard
            key={region.regionKey}
            region={region}
            varieties={categoryVarieties[region.regionKey] ?? []}
            isActive={activeRegion === region.regionKey}
            onHover={onRegionHover}
            onLeave={onRegionLeave}
            onClick={onRegionClick}
            locale={locale}
          />
        ))}
      </div>
    </div>
  );
}
