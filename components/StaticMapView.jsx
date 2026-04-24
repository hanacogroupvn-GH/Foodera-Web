"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import L from "leaflet";
import { GeoJSON, MapContainer, Marker, Pane, TileLayer, useMap } from "react-leaflet";

import provinceGeojsonUrl from "../interactive-map/public/data/vietnam-34-provinces-simplified.geojson?url";
import archipelagoGeojsonUrl from "../interactive-map/public/data/vietnam-archipelagos.geojson?url";
import {
  REGION_STYLE_ORDER,
  getProvinceRegionCode,
  getProvinceRegionMeta,
} from "../interactive-map/data/map-regions.js";

const TILE_URL = "https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png";
const TILE_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>';

const ARCHIPELAGO_LABELS = [
  { id: "hoang-sa", name: "QĐ. Hoàng Sa", coordinates: [16.85, 111.8] },
  { id: "truong-sa", name: "QĐ. Trường Sa", coordinates: [9.8, 113.2] },
];

const ARCHIPELAGO_STYLE = {
  color: "#f4687b",
  weight: 0.95,
  fillColor: "#ff8492",
  fillOpacity: 0.9,
};

function createLabelIcon(label) {
  return L.divIcon({
    className: "ig-territory-label",
    html: `<span>${label}</span>`,
    iconSize: [0, 0],
    iconAnchor: [0, 0],
  });
}

function getProvinceStyle(feature, highlightedRegion, hoveredProvinceId, highlightedRegions, inSeasonRegions) {
  const provinceId = feature?.properties?.id;
  const regionMeta = getProvinceRegionMeta(provinceId);
  const regionCode = getProvinceRegionCode(provinceId);
  const isHovered = provinceId === hoveredProvinceId;
  const isRegionHighlighted = highlightedRegion && regionCode === highlightedRegion;
  const isMultiHighlighted = highlightedRegions?.length > 0 && highlightedRegions.includes(regionCode);

  if (isHovered) {
    return {
      color: "#133f6d",
      weight: 2.8,
      fillColor: regionMeta.color,
      fillOpacity: 1,
    };
  }

  if (isRegionHighlighted || isMultiHighlighted) {
    return {
      color: "#1a3a2a",
      weight: 2.5,
      fillColor: regionMeta.color,
      fillOpacity: 1,
    };
  }

  const hasAnyHighlight = highlightedRegion || (highlightedRegions?.length > 0);
  const isDimmed = hasAnyHighlight && !isRegionHighlighted && !isMultiHighlighted;

  const isInSeason = inSeasonRegions?.includes(regionCode);

  return {
    color: "rgba(255, 255, 255, 0.92)",
    weight: 1.2,
    fillColor: regionMeta.color,
    fillOpacity: isDimmed ? 0.3 : 0.85,
    className: isInSeason ? "infographic-season-pulse" : "",
  };
}

function getHoveredStyle(feature) {
  const regionMeta = getProvinceRegionMeta(feature?.properties?.id);
  return {
    color: "#133f6d",
    weight: 2.8,
    fillColor: regionMeta.color,
    fillOpacity: 1,
  };
}

function MapFitController({ focusBounds }) {
  const map = useMap();
  const hasInit = useRef(false);

  useEffect(() => {
    map.setMaxBounds(L.latLngBounds([[6, 98], [25, 115]]));
    map.options.maxBoundsViscosity = 1.0;
    map.setMinZoom(5.3);
    map.setMaxZoom(8);
  }, [map]);

  useEffect(() => {
    if (!focusBounds?.isValid()) return;
    if (!hasInit.current) {
      map.fitBounds(focusBounds, { 
        paddingTopLeft: [0, 0],
        paddingBottomRight: [0, 0],
        animate: false 
      });
      hasInit.current = true;
    }
  }, [focusBounds, map]);

  useEffect(() => {
    const container = map.getContainer();
    if (!container) return undefined;
    const observer = new ResizeObserver(() => {
      map.invalidateSize({ pan: false, animate: false });
      if (focusBounds?.isValid() && !hasInit.current) {
        map.fitBounds(focusBounds, { 
        paddingTopLeft: [40, 80],
        paddingBottomRight: [40, 40],
        animate: false 
      });
      }
    });
    observer.observe(container);
    return () => observer.disconnect();
  }, [focusBounds, map]);

  return null;
}

function collectBounds(features) {
  let minLat = Infinity, minLng = Infinity, maxLat = -Infinity, maxLng = -Infinity;
  function walk(coords) {
    if (!Array.isArray(coords)) return;
    if (typeof coords[0] === "number") {
      const [lng, lat] = coords;
      minLng = Math.min(minLng, lng);
      minLat = Math.min(minLat, lat);
      maxLng = Math.max(maxLng, lng);
      maxLat = Math.max(maxLat, lat);
      return;
    }
    for (const c of coords) walk(c);
  }
  for (const f of features ?? []) walk(f.geometry?.coordinates);
  if (!Number.isFinite(minLat)) return null;
  return L.latLngBounds([minLat, minLng], [maxLat, maxLng]).pad(0.06);
}

function getProvinceTooltipContent(feature) {
  const provinceName = feature?.properties?.name ?? "Unknown";
  const regionMeta = getProvinceRegionMeta(feature?.properties?.id);
  return `<strong>${provinceName}</strong><br/>${regionMeta.label}`;
}

export default function StaticMapView({ highlightedRegion, highlightedRegions, onProvinceHover, onProvinceLeave, onProvinceClick, copy, inSeasonRegions }) {
  const [provinceData, setProvinceData] = useState(null);
  const [archipelagoData, setArchipelagoData] = useState(null);
  const [hoveredProvinceId, setHoveredProvinceId] = useState(null);
  const geoJsonRef = useRef(null);
  const provinceLayersRef = useRef(new Map());

  useEffect(() => {
    let alive = true;
    Promise.all([
      fetch(provinceGeojsonUrl, { cache: "force-cache" }).then((r) => r.json()),
      fetch(archipelagoGeojsonUrl, { cache: "force-cache" }).then((r) => r.json()),
    ])
      .then(([prov, arch]) => {
        if (!alive) return;
        setProvinceData(prov);
        setArchipelagoData(arch);
      })
      .catch(() => {});
    return () => { alive = false; };
  }, []);

  const focusBounds = useMemo(() => {
    if (!provinceData) return null;
    const bounds = collectBounds(provinceData.features);
    if (!bounds) return null;
    for (const label of ARCHIPELAGO_LABELS) {
      bounds.extend(label.coordinates);
    }
    return bounds;
  }, [provinceData]);

  // Re-style provinces when highlighted region or hovered province changes
  useEffect(() => {
    if (!geoJsonRef.current) return;
    geoJsonRef.current.eachLayer((layer) => {
      layer.setStyle(getProvinceStyle(layer.feature, highlightedRegion, hoveredProvinceId, highlightedRegions, inSeasonRegions));
      const provinceId = layer.feature?.properties?.id;
      const regionCode = getProvinceRegionCode(provinceId);
      if (provinceId === hoveredProvinceId) {
        layer.bringToFront();
      } else if (highlightedRegion && regionCode === highlightedRegion) {
        layer.bringToFront();
      } else if (highlightedRegions?.includes(regionCode)) {
        layer.bringToFront();
      }
    });
  }, [highlightedRegion, highlightedRegions, hoveredProvinceId]);

  const handleEachFeature = useCallback((feature, layer) => {
    const provinceId = feature?.properties?.id;
    provinceLayersRef.current.set(provinceId, layer);

    layer.bindTooltip(getProvinceTooltipContent(feature), {
      sticky: true,
      direction: "top",
      className: "ig-map-tooltip",
    });

    layer.on("mouseover", () => {
      setHoveredProvinceId(provinceId);
      layer.setStyle(getHoveredStyle(feature));
      layer.bringToFront();
      if (onProvinceHover) onProvinceHover(provinceId);
    });

    layer.on("mouseout", () => {
      setHoveredProvinceId(null);
      layer.setStyle(getProvinceStyle(feature, highlightedRegion, null, highlightedRegions, inSeasonRegions));
      if (onProvinceLeave) onProvinceLeave(provinceId);
    });

    layer.on("click", () => {
      const regionCode = getProvinceRegionCode(provinceId);
      if (onProvinceClick) onProvinceClick(provinceId, regionCode);
    });
  }, [highlightedRegion, onProvinceHover, onProvinceLeave, onProvinceClick]);

  const loadingText = copy?.loading || "Loading map...";

  if (!provinceData || !focusBounds) {
    return (
      <div className="ig-map-loading">
        <div className="ig-map-loading-spinner" />
        <span>{loadingText}</span>
      </div>
    );
  }

  return (
    <div className="ig-map-container">
      <MapContainer
        center={[15.5, 106.2]}
        zoom={5.4}
        zoomSnap={0.1}
        zoomDelta={0.5}
        wheelPxPerZoomLevel={120}
        zoomControl={false}
        attributionControl={false}
        scrollWheelZoom
        doubleClickZoom
        touchZoom
        dragging
        boxZoom={false}
        keyboard={false}
        className="ig-leaflet-map"
      >
        <Pane name="world-base" style={{ zIndex: 120 }}>
          <TileLayer
            pane="world-base"
            url={TILE_URL}
            attribution={TILE_ATTRIBUTION}
            subdomains="abcd"
            maxZoom={20}
            maxNativeZoom={20}
          />
        </Pane>

        <MapFitController focusBounds={focusBounds} />

        <Pane name="vietnam-regions" style={{ zIndex: 360 }}>
          <GeoJSON
            ref={geoJsonRef}
            data={provinceData}
            pane="vietnam-regions"
            interactive
            style={(feature) => getProvinceStyle(feature, highlightedRegion, hoveredProvinceId, highlightedRegions, inSeasonRegions)}
            onEachFeature={handleEachFeature}
          />
        </Pane>

        {archipelagoData && (
          <Pane name="archipelagos" style={{ zIndex: 430 }}>
            <GeoJSON data={archipelagoData} pane="archipelagos" style={ARCHIPELAGO_STYLE} interactive={false} />
          </Pane>
        )}

        <Pane name="labels" style={{ zIndex: 600, pointerEvents: "none" }}>
          {ARCHIPELAGO_LABELS.map((label) => (
            <Marker
              key={label.id}
              position={label.coordinates}
              icon={createLabelIcon(label.name)}
              interactive={false}
            />
          ))}
        </Pane>
      </MapContainer>

      {/* Inline Legend */}
      <div className="ig-map-legend">
        {REGION_STYLE_ORDER.map((region) => (
          <div
            key={region.key}
            className={`ig-legend-item ${highlightedRegion === region.key ? "is-active" : ""}`}
          >
            <span className="ig-legend-swatch" style={{ background: region.color }} />
            <span className="ig-legend-label">{region.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
