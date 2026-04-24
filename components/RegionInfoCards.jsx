"use client";

import { useMemo } from "react";
import { MapPin, BarChart3, CloudSun, Sprout, ShieldCheck } from "lucide-react";
import { BASE_REGIONS, REGION_VARIETIES } from "../interactive-map/data/region-infographic-data";

function RegionCard({ region, varieties, isActive, onHover, onLeave, onClick }) {
  const hasVarieties = varieties && varieties.length > 0;

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
          <h3 className="infographic-region-name">{region.name}</h3>
          <span className="infographic-region-name-en">{region.nameEn}</span>
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
            <span className="infographic-spec-label">Area:</span>
            <span className="infographic-spec-value">{region.area}</span>
          </div>
          <div className="infographic-spec-row">
            <CloudSun size={14} strokeWidth={2.2} />
            <span className="infographic-spec-label">Climate:</span>
            <span className="infographic-spec-value">{region.climate}</span>
          </div>
          <div className="infographic-spec-row">
            <Sprout size={14} strokeWidth={2.2} />
            <span className="infographic-spec-label">Varieties:</span>
            <span className="infographic-spec-value">
              {hasVarieties ? varieties.join(", ") : "—"}
            </span>
          </div>
        </div>

        {/* Province tags at the bottom */}
        <div className="infographic-province-tags">
          {region.provinces.slice(0, 6).map((province) => (
            <span key={province} className="infographic-province-tag">
              <MapPin size={10} strokeWidth={2.4} />
              {province}
            </span>
          ))}
          {region.provinces.length > 6 && (
            <span className="infographic-province-tag infographic-province-more">
              +{region.provinces.length - 6}
            </span>
          )}
        </div>
      </div>
    </article>
  );
}

export default function RegionInfoCards({ activeRegion, onRegionHover, onRegionLeave, onRegionClick, copy, activeCategory }) {
  const categoryVarieties = useMemo(() => REGION_VARIETIES[activeCategory] ?? {}, [activeCategory]);

  // Only show regions that have varieties for this category
  const regions = useMemo(() => {
    return BASE_REGIONS.filter((r) => (categoryVarieties[r.regionKey] ?? []).length > 0);
  }, [categoryVarieties]);

  const title = activeCategory
    ? `${activeCategory} — Growing Regions`
    : (copy?.regionListTitle ?? "Major Growing Regions");

  const subtitle = `Showing ${regions.length} region${regions.length !== 1 ? "s" : ""} of Vietnam for ${activeCategory}`;

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
          />
        ))}
      </div>
    </div>
  );
}
