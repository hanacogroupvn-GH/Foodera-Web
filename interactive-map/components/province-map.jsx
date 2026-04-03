"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import L from "leaflet";
import {
  GeoJSON,
  MapContainer,
  Marker,
  Pane,
  TileLayer,
  useMap,
} from "react-leaflet";

import { getProvinceRegionMeta } from "@/data/map-regions";

const WORLD_TILE_URL = "https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png";
const WORLD_TILE_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>';
const SOUTHEAST_ASIA_BOUNDS = [
  [-1.5, 89],
  [29.5, 127],
];
const ARCHIPELAGO_LABELS = [
  { id: "hoang-sa", name: "Hoang Sa", coordinates: [16.85, 111.8] },
  { id: "truong-sa", name: "Truong Sa", coordinates: [9.8, 113.2] },
];
const ARCHIPELAGO_STYLE = {
  color: "#f4687b",
  weight: 0.95,
  fillColor: "#ff8492",
  fillOpacity: 0.9,
};

function collectGeometryBounds(node, bounds = { minLng: Infinity, minLat: Infinity, maxLng: -Infinity, maxLat: -Infinity }) {
  if (!Array.isArray(node)) {
    return bounds;
  }

  if (typeof node[0] === "number") {
    const [lng, lat] = node;
    bounds.minLng = Math.min(bounds.minLng, lng);
    bounds.minLat = Math.min(bounds.minLat, lat);
    bounds.maxLng = Math.max(bounds.maxLng, lng);
    bounds.maxLat = Math.max(bounds.maxLat, lat);
    return bounds;
  }

  for (const child of node) {
    collectGeometryBounds(child, bounds);
  }

  return bounds;
}

function getFeatureSortArea(feature) {
  const bounds = collectGeometryBounds(feature?.geometry?.coordinates);

  if (
    !Number.isFinite(bounds.minLng) ||
    !Number.isFinite(bounds.minLat) ||
    !Number.isFinite(bounds.maxLng) ||
    !Number.isFinite(bounds.maxLat)
  ) {
    return Number.POSITIVE_INFINITY;
  }

  return (bounds.maxLng - bounds.minLng) * (bounds.maxLat - bounds.minLat);
}

function createArchipelagoLabelIcon(label) {
  return L.divIcon({
    className: "territory-tag-icon",
    html: `<span>${label}</span>`,
    iconSize: [0, 0],
    iconAnchor: [0, 0],
  });
}

function getViewportPadding() {
  if (typeof window !== "undefined" && window.innerWidth < 900) {
    return {
      paddingTopLeft: [18, 86],
      paddingBottomRight: [18, 148],
    };
  }

  return {
    paddingTopLeft: [118, 96],
    paddingBottomRight: [430, 92],
  };
}

function getFocusMaxZoom() {
  if (typeof window !== "undefined" && window.innerWidth < 900) {
    return 5.95;
  }

  return 6.2;
}

function getProvinceTooltipContent(feature) {
  const provinceId = feature?.properties?.id;
  const provinceName = feature?.properties?.name ?? "Khong ro ten";
  const regionMeta = getProvinceRegionMeta(provinceId);

  return `<strong>${provinceName}</strong><br/>${regionMeta.label}`;
}

function getProvinceStyle(feature) {
  const provinceId = feature?.properties?.id;
  const regionMeta = getProvinceRegionMeta(provinceId);

  return {
    color: "rgba(255, 255, 255, 0.92)",
    weight: 1.2,
    fillColor: regionMeta.color,
    fillOpacity: 0.88,
  };
}

function buildVietnamFocusBounds(provinceData, archipelagoData) {
  if (!provinceData) {
    return null;
  }

  const bounds = L.geoJSON(provinceData).getBounds().pad(0.08);

  if (archipelagoData) {
    const archipelagoBounds = L.geoJSON(archipelagoData).getBounds();
    bounds.extend(archipelagoBounds.getSouthWest());
    bounds.extend(archipelagoBounds.getNorthEast());
  }

  for (const label of ARCHIPELAGO_LABELS) {
    bounds.extend(label.coordinates);
  }

  return bounds;
}

function MapViewportController({ focusBounds, resetSequence, onMapReady }) {
  const map = useMap();
  const hasInitializedRef = useRef(false);

  useEffect(() => {
    onMapReady(map);
  }, [map, onMapReady]);

  useEffect(() => {
    map.setMaxBounds(L.latLngBounds(SOUTHEAST_ASIA_BOUNDS));
    map.options.maxBoundsViscosity = 0.16;
    map.setMinZoom(4.1);
    map.setMaxZoom(9.2);
  }, [map]);

  useEffect(() => {
    if (!focusBounds?.isValid()) {
      return;
    }

    const applyView = (animate) => {
      map.invalidateSize({
        pan: false,
        animate: false,
      });

      if (animate) {
        map.flyToBounds(focusBounds, {
          ...getViewportPadding(),
          maxZoom: getFocusMaxZoom(),
          duration: 0.95,
        });
        return;
      }

      map.fitBounds(focusBounds, {
        ...getViewportPadding(),
        maxZoom: getFocusMaxZoom(),
        animate: false,
      });
    };

    applyView(hasInitializedRef.current);
    hasInitializedRef.current = true;
  }, [focusBounds, map, resetSequence]);

  useEffect(() => {
    const container = map.getContainer();

    if (!container || !focusBounds?.isValid()) {
      return undefined;
    }

    const syncSize = () => {
      map.invalidateSize({
        pan: false,
        animate: false,
      });
    };
    const resizeObserver = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(syncSize);

    resizeObserver?.observe(container);
    window.addEventListener("load", syncSize);

    return () => {
      resizeObserver?.disconnect();
      window.removeEventListener("load", syncSize);
    };
  }, [focusBounds, map]);

  return null;
}

export default function ProvinceMap({ resetSequence = 0 }) {
  const [provinceData, setProvinceData] = useState(null);
  const [archipelagoData, setArchipelagoData] = useState(null);
  const [mapInstance, setMapInstance] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    let isMounted = true;

    Promise.all([
      fetch("/data/vietnam-34-provinces.geojson", { cache: "force-cache" }).then((response) => {
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        return response.json();
      }),
      fetch("/data/vietnam-archipelagos.geojson", { cache: "force-cache" }).then((response) => {
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        return response.json();
      }),
    ])
      .then(([provincePayload, archipelagoPayload]) => {
        if (!isMounted) {
          return;
        }

        setProvinceData(provincePayload);
        setArchipelagoData(archipelagoPayload);
        setErrorMessage("");
      })
      .catch(() => {
        if (!isMounted) {
          return;
        }

        setErrorMessage("Khong tai duoc lop du lieu Viet Nam sau sap nhap.");
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const sortedProvinceData = useMemo(() => {
    if (!provinceData) {
      return null;
    }

    return {
      ...provinceData,
      features: [...provinceData.features].sort((left, right) => getFeatureSortArea(right) - getFeatureSortArea(left)),
    };
  }, [provinceData]);
  const focusBounds = useMemo(
    () => buildVietnamFocusBounds(sortedProvinceData, archipelagoData),
    [archipelagoData, sortedProvinceData],
  );

  function resetView() {
    if (!mapInstance || !focusBounds?.isValid()) {
      return;
    }

    mapInstance.flyToBounds(focusBounds, {
      ...getViewportPadding(),
      duration: 0.9,
      maxZoom: getFocusMaxZoom(),
    });
  }

  return (
    <div className="map-surface">
      {sortedProvinceData && focusBounds ? (
        <MapContainer
          center={[16.2, 106.2]}
          zoom={5.2}
          zoomControl={false}
          attributionControl
          scrollWheelZoom
          doubleClickZoom
          touchZoom
          boxZoom={false}
          keyboard={false}
          dragging
          preferCanvas
          zoomSnap={0.1}
          zoomDelta={0.25}
          wheelPxPerZoomLevel={115}
          inertia
          easeLinearity={0.2}
          className="leaflet-stage"
        >
          <Pane name="world-base" style={{ zIndex: 120 }}>
            <TileLayer
              pane="world-base"
              url={WORLD_TILE_URL}
              attribution={WORLD_TILE_ATTRIBUTION}
              subdomains="abcd"
              maxZoom={20}
              maxNativeZoom={20}
              keepBuffer={8}
              updateWhenIdle={false}
              updateWhenZooming={false}
            />
          </Pane>

          <MapViewportController
            focusBounds={focusBounds}
            resetSequence={resetSequence}
            onMapReady={setMapInstance}
          />

          <Pane name="vietnam-regions" style={{ zIndex: 360 }}>
            <GeoJSON
              data={sortedProvinceData}
              pane="vietnam-regions"
              style={(feature) => getProvinceStyle(feature)}
              onEachFeature={(feature, layer) => {
                layer.bindTooltip(getProvinceTooltipContent(feature), {
                  sticky: true,
                  direction: "top",
                  className: "map-tooltip",
                });

                layer.on("mouseover", () => {
                  layer.setStyle({
                    weight: 1.7,
                    fillOpacity: 0.97,
                  });
                  layer.bringToFront();
                });

                layer.on("mouseout", () => {
                  layer.setStyle(getProvinceStyle(feature));
                });
              }}
            />
          </Pane>

          {archipelagoData ? (
            <Pane name="archipelagos" style={{ zIndex: 430 }}>
              <GeoJSON data={archipelagoData} pane="archipelagos" style={ARCHIPELAGO_STYLE} />
            </Pane>
          ) : null}

          <Pane name="archipelago-tags" style={{ zIndex: 620, pointerEvents: "none" }}>
            {ARCHIPELAGO_LABELS.map((label) => (
              <Marker
                key={label.id}
                position={label.coordinates}
                icon={createArchipelagoLabelIcon(label.name)}
                interactive={false}
                keyboard={false}
              />
            ))}
          </Pane>
        </MapContainer>
      ) : (
        <div className="map-loading">{errorMessage || "Dang nap ban do Viet Nam..."}</div>
      )}

      <div className="territory-summary-card">
        <strong>34 tinh/thanh sau sap nhap</strong>
        <span>Ban do hien tai chi giu thong tin lanh tho va phan vung de san sang ket noi backend.</span>
      </div>

      <div className="map-toolbar">
        <button className="toolbar-button toolbar-button-wide" type="button" onClick={resetView}>
          Toan quoc
        </button>
        <button className="toolbar-button" type="button" onClick={() => mapInstance?.zoomIn()} title="Zoom in">
          +
        </button>
        <button className="toolbar-button" type="button" onClick={() => mapInstance?.zoomOut()} title="Zoom out">
          -
        </button>
      </div>
    </div>
  );
}
