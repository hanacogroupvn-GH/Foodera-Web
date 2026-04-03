"use client";

import dynamic from "next/dynamic";
import { useMemo, useState } from "react";

import { REGION_STYLE_ORDER } from "@/data/map-regions";

const ProvinceMap = dynamic(() => import("@/components/province-map"), {
  ssr: false,
  loading: () => (
    <div className="map-shell">
      <div className="map-surface">
        <div className="map-loading">Dang khoi tao ban do...</div>
      </div>
    </div>
  ),
});

export default function MapExplorer() {
  const [legendOpen, setLegendOpen] = useState(true);
  const [resetSequence, setResetSequence] = useState(0);
  const regionItems = useMemo(() => REGION_STYLE_ORDER, []);

  return (
    <div className="map-page">
      <main className="map-shell">
        <ProvinceMap resetSequence={resetSequence} />

        <header className="map-topbar">
          <button
            type="button"
            className="chrome-button chrome-button-menu"
            aria-label="Dong mo bang chu giai"
            onClick={() => setLegendOpen((currentValue) => !currentValue)}
          >
            <span />
            <span />
            <span />
          </button>

          <div className="map-brand">
            <p>Ban do Viet Nam</p>
            <strong>Lanh tho sau sap nhap</strong>
          </div>
        </header>

        <aside className="map-rail">
          <button
            type="button"
            className="rail-action-button"
            aria-label="Can giua lai lanh tho Viet Nam"
            onClick={() => setResetSequence((currentValue) => currentValue + 1)}
          >
            <span className="target-dot" />
          </button>

          <div className="rail-divider" />

          <div className="rail-region-stack" aria-label="Nhan dien mau 6 vung">
            {regionItems.map((region) => (
              <span
                key={region.key}
                className="rail-region-token"
                style={{ "--region-color": region.color }}
                title={region.label}
              />
            ))}
          </div>
        </aside>

        <aside className={`map-legend-panel ${legendOpen ? "" : "collapsed"}`}>
          <div className="legend-panel-header">
            <span>Chu giai vung</span>
            <button
              type="button"
              className="legend-toggle-button"
              aria-label="Dong bang chu giai"
              onClick={() => setLegendOpen(false)}
            >
              x
            </button>
          </div>

          <div className="legend-list">
            {regionItems.map((region) => (
              <div key={region.key} className="legend-row">
                <span className="legend-swatch" style={{ "--region-color": region.color }} />
                <span>{region.label}</span>
              </div>
            ))}
          </div>
        </aside>

        {!legendOpen ? (
          <button
            type="button"
            className="legend-reopen-button"
            aria-label="Mo lai bang chu giai"
            onClick={() => setLegendOpen(true)}
          >
            Chu giai
          </button>
        ) : null}
      </main>
    </div>
  );
}
