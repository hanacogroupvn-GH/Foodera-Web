"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import L from "leaflet";
import { Filter, MapPin, X } from "lucide-react";
import { GeoJSON, MapContainer, Marker, Pane, TileLayer, useMap } from "react-leaflet";

import { useData } from "../context/DataContext";
import provinceGeojsonUrl from "../interactive-map/public/data/vietnam-34-provinces-simplified.geojson?url";
import archipelagoGeojsonUrl from "../interactive-map/public/data/vietnam-archipelagos.geojson?url";
import {
  REGION_STYLE_ORDER,
  getRegionMeta,
  getProvinceRegionCode,
  getProvinceRegionMeta
} from "../interactive-map/data/map-regions.js";
import { api } from "../lib/apiClient";
import { getFeatureCenterCoordinates } from "../lib/provinceMapGeometry";
import { buildProvinceMapBaseProfile } from "../lib/provinceMapBaseProfile";
import { mergeProvinceMapProfile } from "../lib/provinceMapProfiles";

const WORLD_TILE_URL = "https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png";
const WORLD_TILE_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>';
const SOUTHEAST_ASIA_BOUNDS = [
  [-1.5, 89],
  [29.5, 127]
];
const ARCHIPELAGO_LABELS = [
  { id: "hoang-sa", name: "Hoang Sa", coordinates: [16.85, 111.8] },
  { id: "truong-sa", name: "Truong Sa", coordinates: [9.8, 113.2] }
];
const ARCHIPELAGO_STYLE = {
  color: "#f4687b",
  weight: 0.95,
  fillColor: "#ff8492",
  fillOpacity: 0.9
};
const CATEGORY_ORDER = ["Rice", "Agriculture", "Coffee", "Cashew"];
const CATEGORY_META = Object.freeze({
  Rice: { label: "Rice", color: "#2563eb" },
  Agriculture: { label: "Fruits & Agriculture", color: "#e11d48" },
  Coffee: { label: "Coffee", color: "#7c3aed" },
  Cashew: { label: "Cashew", color: "#0f766e" }
});
const PANEL_COPY_DEFAULTS = {
  panelKicker: "Analytical Province",
  panelTabOverview: "Overview",
  panelTabProducts: "Products",
  panelOverviewTitle: "Characteristics",
  panelSpecsTitle: "Mapped Specifications",
  panelProductsTitle: "Mapped Agricultural Products",
  panelProductsEmpty: "No agricultural products mapped yet.",
  panelZoneCountSuffix: "zones",
  panelCoordinatesLabel: "GPS coordinates (latitude/longitude)",
  panelCultivatedAreaLabel: "Cultivated area (hectares)",
  panelAverageOutputLabel: "Average output (MT/year)",
  panelSowingPeriodLabel: "Sowing period",
  panelHarvestPeriodLabel: "Harvest period",
  panelCropsPerYearLabel: "Crops per year",
  panelVarietiesLabel: "Varieties",
  panelNoData: "Not mapped yet",
  panelCloseAria: "Close province details",
  filterTitle: "Products",
  filterSubtitle: "Highlight provinces by mapped product categories",
  filterClear: "Clear",
  filterEmpty: "No mapped product categories yet.",
  filterProvinceSingular: "province",
  filterProvincePlural: "provinces",
  filterTabProducts: "Products",
  filterTabRegions: "Regions",
  categoryRice: "Rice",
  categoryAgriculture: "Fruits & Agriculture",
  categoryCoffee: "Coffee",
  categoryCashew: "Cashew",
  legendTitle: "Region Legend",
  legendSubtitle: "Review the regional growing-area colors used on the map.",
  legendEmpty: "Region data is unavailable."
};

function collectGeometryBounds(
  node,
  bounds = { minLng: Infinity, minLat: Infinity, maxLng: -Infinity, maxLat: -Infinity }
) {
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

function normalizeLookupKey(value) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function buildProductLookup(products) {
  const nextLookup = new Map();

  for (const product of products ?? []) {
    const candidateNames = [product?.name, product?.translations?.zh?.name];

    for (const candidateName of candidateNames) {
      const normalizedKey = normalizeLookupKey(candidateName);

      if (normalizedKey && !nextLookup.has(normalizedKey)) {
        nextLookup.set(normalizedKey, product);
      }
    }
  }

  return nextLookup;
}

function getCategoryMeta(category) {
  return (
    CATEGORY_META[category] ?? {
      label: String(category ?? "Other"),
      color: "#2f6eb4"
    }
  );
}

function resolveCategoryLabel(category, copy) {
  if (category === "Rice") return copy.categoryRice;
  if (category === "Agriculture") return copy.categoryAgriculture;
  if (category === "Coffee") return copy.categoryCoffee;
  if (category === "Cashew") return copy.categoryCashew;
  return getCategoryMeta(category).label;
}

function createArchipelagoLabelIcon(label) {
  return L.divIcon({
    className: "territory-tag-icon",
    html: `<span>${label}</span>`,
    iconSize: [0, 0],
    iconAnchor: [0, 0]
  });
}

function getViewportPadding(hasProvincePanel = false) {
  if (typeof window !== "undefined" && window.innerWidth < 900) {
    return hasProvincePanel
      ? {
          paddingTopLeft: [18, 96],
          paddingBottomRight: [18, 400]
        }
      : {
          paddingTopLeft: [18, 86],
          paddingBottomRight: [18, 148]
        };
  }

  return hasProvincePanel
    ? {
        paddingTopLeft: [520, 112],
        paddingBottomRight: [96, 112]
      }
    : {
        paddingTopLeft: [118, 96],
        paddingBottomRight: [430, 92]
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
  const provinceName = feature?.properties?.name ?? "Unknown province";
  const regionMeta = getProvinceRegionMeta(provinceId);

  return `<strong>${provinceName}</strong><br/>${regionMeta.label}`;
}

function buildVietnamFocusBounds(provinceData, archipelagoData) {
  if (!provinceData) {
    return null;
  }

  const geometryBounds = collectGeometryBounds(provinceData.features?.map((feature) => feature.geometry?.coordinates));

  if (
    !Number.isFinite(geometryBounds.minLng) ||
    !Number.isFinite(geometryBounds.minLat) ||
    !Number.isFinite(geometryBounds.maxLng) ||
    !Number.isFinite(geometryBounds.maxLat)
  ) {
    return null;
  }

  const bounds = L.latLngBounds(
    [geometryBounds.minLat, geometryBounds.minLng],
    [geometryBounds.maxLat, geometryBounds.maxLng]
  ).pad(0.08);

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

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function getProvinceMonogram(name) {
  const words = String(name ?? "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (words.length === 0) {
    return "PR";
  }

  return words
    .slice(0, 2)
    .map((word) => word.charAt(0).toUpperCase())
    .join("");
}

function buildEnrichedProvinceProfileFromFeature(feature, provinceProfileOverrides, productLookup) {
  const provinceId = feature?.properties?.id;
  const provinceName = feature?.properties?.name ?? "Unknown province";
  const regionMeta = getProvinceRegionMeta(provinceId);
  const center = getFeatureCenterCoordinates(feature);
  const baseProfile = buildProvinceMapBaseProfile({
    provinceId,
    provinceName,
    provinceType: feature?.properties?.type,
    regionLabel: regionMeta.label,
    color: regionMeta.color,
    gpsLatitude: center?.latitude ?? null,
    gpsLongitude: center?.longitude ?? null
  });
  const mergedProfile = mergeProvinceMapProfile(baseProfile, provinceProfileOverrides?.[provinceId]);
  const enrichedProducts = mergedProfile.products.map((item) => {
    const matchedProduct = productLookup.get(normalizeLookupKey(item.name)) ?? null;
    const category = matchedProduct?.category ?? null;
    const categoryMeta = getCategoryMeta(category);

    return {
      ...item,
      productId: matchedProduct?.id ?? null,
      category,
      image: matchedProduct?.image ?? "",
      categoryColor: categoryMeta.color
    };
  });

  return {
    ...mergedProfile,
    profileKind: "province",
    products: enrichedProducts,
    categories: Array.from(new Set(enrichedProducts.map((item) => item.category).filter(Boolean)))
  };
}

function buildRegionInsightProfile(regionCode, provinceProfiles) {
  const regionMeta = getRegionMeta(regionCode);
  const validProvinceProfiles = provinceProfiles.filter(Boolean);

  if (validProvinceProfiles.length === 0) {
    return null;
  }

  const provinceNames = validProvinceProfiles.map((profile) => profile.provinceName).filter(Boolean);
  const productMap = new Map();
  const latitudeValues = [];
  const longitudeValues = [];
  const cultivatedAreaValues = [];
  const averageOutputValues = [];
  const sowingPeriods = new Set();
  const harvestPeriods = new Set();
  const cropsPerYearValues = new Set();
  const characteristicsValues = [];
  const varietiesValues = new Set();

  for (const profile of validProvinceProfiles) {
    if (Number.isFinite(Number(profile.gpsLatitude))) {
      latitudeValues.push(Number(profile.gpsLatitude));
    }

    if (Number.isFinite(Number(profile.gpsLongitude))) {
      longitudeValues.push(Number(profile.gpsLongitude));
    }

    if (Number.isFinite(Number(profile.cultivatedAreaHectares))) {
      cultivatedAreaValues.push(Number(profile.cultivatedAreaHectares));
    }

    if (Number.isFinite(Number(profile.averageOutputMtPerYear))) {
      averageOutputValues.push(Number(profile.averageOutputMtPerYear));
    }

    if (profile.sowingPeriod) {
      sowingPeriods.add(profile.sowingPeriod);
    }

    if (profile.harvestPeriod) {
      harvestPeriods.add(profile.harvestPeriod);
    }

    if (Number.isFinite(Number(profile.cropsPerYear))) {
      cropsPerYearValues.add(Number(profile.cropsPerYear));
    }

    if (profile.characteristics) {
      characteristicsValues.push(String(profile.characteristics).trim());
    }

    for (const variety of splitVarietiesText(profile.varieties)) {
      varietiesValues.add(variety);
    }

    for (const item of profile.products ?? []) {
      const productKey = normalizeLookupKey(item.name) || String(item.id ?? `${regionCode}-${productMap.size}`);
      if (!productMap.has(productKey)) {
        productMap.set(productKey, {
          ...item,
          id: `region-${regionCode}-${productKey}`
        });
      }
    }
  }

  const products = [...productMap.values()].sort((left, right) => String(left.name ?? "").localeCompare(String(right.name ?? "")));
  const provincePreview = formatListPreview(provinceNames, 5);
  const distinctCropsPerYearValues = [...cropsPerYearValues].sort((left, right) => left - right);
  const cropsPerYearLabel =
    distinctCropsPerYearValues.length === 0
      ? ""
      : distinctCropsPerYearValues.length === 1
        ? formatNumericValue(distinctCropsPerYearValues[0], 1)
        : `${formatNumericValue(distinctCropsPerYearValues[0], 1)}-${formatNumericValue(
            distinctCropsPerYearValues[distinctCropsPerYearValues.length - 1],
            1
          )}`;
  const characteristics =
    characteristicsValues.filter(Boolean).slice(0, 2).join(" ") ||
    (provincePreview ? `Mapped provinces include ${provincePreview}.` : "");

  return {
    profileKind: "region",
    provinceId: `region:${regionCode}`,
    regionCode,
    provinceName: regionMeta.label,
    provinceType: "Region",
    regionLabel: regionMeta.label,
    gpsLatitude: averageNumbers(latitudeValues),
    gpsLongitude: averageNumbers(longitudeValues),
    cultivatedAreaHectares: sumNumbers(cultivatedAreaValues),
    averageOutputMtPerYear: sumNumbers(averageOutputValues),
    sowingPeriod: formatListPreview([...sowingPeriods], 3),
    harvestPeriod: formatListPreview([...harvestPeriods], 3),
    cropsPerYear: distinctCropsPerYearValues.length === 1 ? distinctCropsPerYearValues[0] : null,
    cropsPerYearLabel,
    characteristics,
    varieties: formatListPreview([...varietiesValues], 8),
    color: regionMeta.color,
    mappedProvinceCount: validProvinceProfiles.length,
    mappedProvinceNames: provinceNames,
    products,
    categories: Array.from(new Set(products.map((item) => item.category).filter(Boolean)))
  };
}

function getProvinceFilterState(profile, selectedCategories) {
  const isFilterActive = selectedCategories.length > 0;
  const matchedCategories = isFilterActive
    ? profile.categories.filter((category) => selectedCategories.includes(category))
    : profile.categories;

  return {
    isFilterActive,
    isMatch: !isFilterActive || matchedCategories.length > 0,
    matchedCategories,
    matchedCount: matchedCategories.length,
    accentColor: matchedCategories.length > 0 ? getCategoryMeta(matchedCategories[0]).color : null
  };
}

function getProvinceStyle(feature, selectedProvinceId = null, provinceFilterStateById = {}, selectedRegionCode = null) {
  const provinceId = feature?.properties?.id;
  const regionMeta = getProvinceRegionMeta(provinceId);
  const provinceRegionCode = getProvinceRegionCode(provinceId);
  const isProvinceSelected = provinceId === selectedProvinceId;
  const isRegionSelected = !isProvinceSelected && Boolean(selectedRegionCode) && provinceRegionCode === selectedRegionCode;
  const isSelected = isProvinceSelected || isRegionSelected;
  const filterState = provinceFilterStateById?.[provinceId];

  if (isRegionSelected) {
    return {
      color: "#245b8f",
      weight: 2.35,
      fillColor: regionMeta.color,
      fillOpacity: 0.98
    };
  }

  if (filterState?.isFilterActive) {
    if (!filterState.isMatch) {
      return {
        color: "rgba(110, 135, 159, 0.28)",
        weight: isSelected ? 1.35 : 0.9,
        fillColor: regionMeta.color,
        fillOpacity: isSelected ? 0.3 : 0.16
      };
    }

    return {
      color: isSelected ? "#133f6d" : filterState.accentColor || "#255e99",
      weight: isSelected ? 3 : filterState.matchedCount > 1 ? 2.7 : 2.15,
      fillColor: regionMeta.color,
      fillOpacity: isSelected ? 1 : 0.95
    };
  }

  return {
    color: isSelected ? "#133f6d" : "rgba(255, 255, 255, 0.92)",
    weight: isSelected ? 2.6 : 1.2,
    fillColor: regionMeta.color,
    fillOpacity: isSelected ? 0.98 : 0.88
  };
}

function getHoveredProvinceStyle(feature, selectedProvinceId = null, provinceFilterStateById = {}, selectedRegionCode = null) {
  const provinceId = feature?.properties?.id;
  const provinceRegionCode = getProvinceRegionCode(provinceId);
  const isSelected = provinceId === selectedProvinceId;
  const isRegionSelected = !isSelected && Boolean(selectedRegionCode) && provinceRegionCode === selectedRegionCode;
  const baseStyle = getProvinceStyle(feature, selectedProvinceId, provinceFilterStateById, selectedRegionCode);
  const filterState = provinceFilterStateById?.[provinceId];

  if (isRegionSelected) {
    return {
      ...baseStyle,
      color: "#245b8f",
      weight: 2.55,
      fillOpacity: 1
    };
  }

  if (filterState?.isFilterActive && !filterState.isMatch) {
    return {
      ...baseStyle,
      color: "rgba(97, 126, 155, 0.4)",
      weight: isSelected ? 1.45 : 1.05,
      fillOpacity: isSelected ? 0.34 : 0.22
    };
  }

  if (filterState?.isFilterActive && filterState.isMatch) {
    return {
      ...baseStyle,
      color: isSelected ? "#133f6d" : filterState.accentColor || "#255e99",
      weight: isSelected ? 3.2 : 2.45,
      fillOpacity: 1
    };
  }

  return {
    ...baseStyle,
    color: isSelected ? "#133f6d" : "#255e99",
    weight: isSelected ? 2.8 : 1.8,
    fillOpacity: isSelected ? 1 : 0.97
  };
}

function formatListPreview(items, maxItems = 3) {
  if (!Array.isArray(items) || items.length === 0) {
    return "";
  }

  const visibleItems = items.slice(0, maxItems);
  const hiddenCount = items.length - visibleItems.length;

  return hiddenCount > 0 ? `${visibleItems.join(", ")} +${hiddenCount}` : visibleItems.join(", ");
}

function averageNumbers(values) {
  const numericValues = values.map((value) => Number(value)).filter((value) => Number.isFinite(value));
  if (numericValues.length === 0) {
    return null;
  }

  return numericValues.reduce((sum, value) => sum + value, 0) / numericValues.length;
}

function sumNumbers(values) {
  const numericValues = values.map((value) => Number(value)).filter((value) => Number.isFinite(value));
  if (numericValues.length === 0) {
    return null;
  }

  return numericValues.reduce((sum, value) => sum + value, 0);
}

function splitVarietiesText(value) {
  return String(value ?? "")
    .split(/[,;\n]+/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function formatNumericValue(value, maximumFractionDigits = 2) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    return "";
  }

  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits
  }).format(parsed);
}

function formatCoordinatePair(latitude, longitude) {
  const hasLatitude = Number.isFinite(Number(latitude));
  const hasLongitude = Number.isFinite(Number(longitude));

  if (!hasLatitude || !hasLongitude) {
    return "";
  }

  return `${Number(latitude).toFixed(5)}, ${Number(longitude).toFixed(5)}`;
}

function formatCropsPerYearValue(profile) {
  if (profile?.cropsPerYearLabel) {
    return profile.cropsPerYearLabel;
  }

  return formatNumericValue(profile?.cropsPerYear, 1);
}

function getFeatureMarkerPosition(feature) {
  const bounds = collectGeometryBounds(feature?.geometry?.coordinates);

  if (
    !Number.isFinite(bounds.minLng) ||
    !Number.isFinite(bounds.minLat) ||
    !Number.isFinite(bounds.maxLng) ||
    !Number.isFinite(bounds.maxLat)
  ) {
    return null;
  }

  return L.latLng((bounds.minLat + bounds.maxLat) / 2, (bounds.minLng + bounds.maxLng) / 2);
}

function getProvinceMarkerItems(profile, selectedCategories, copy) {
  const visibleCategories = selectedCategories.length > 0 ? new Set(selectedCategories) : null;
  const firstProductByCategory = new Map();

  for (const item of profile.products) {
    if (!item.category) {
      continue;
    }

    if (visibleCategories && !visibleCategories.has(item.category)) {
      continue;
    }

    if (!firstProductByCategory.has(item.category)) {
      firstProductByCategory.set(item.category, item);
    }
  }

  const orderedCategories = [...firstProductByCategory.keys()].sort((left, right) => {
    if (selectedCategories.length > 0) {
      return selectedCategories.indexOf(left) - selectedCategories.indexOf(right);
    }

    const leftIndex = CATEGORY_ORDER.indexOf(left);
    const rightIndex = CATEGORY_ORDER.indexOf(right);
    return (leftIndex === -1 ? Number.MAX_SAFE_INTEGER : leftIndex) - (rightIndex === -1 ? Number.MAX_SAFE_INTEGER : rightIndex);
  });

  const allItems = orderedCategories.map((category) => {
    const product = firstProductByCategory.get(category);
    return {
      ...product,
      category,
      categoryColor: getCategoryMeta(category).color,
      categoryLabel: resolveCategoryLabel(category, copy)
    };
  });

  return {
    items: allItems.slice(0, 3),
    extraCount: Math.max(0, allItems.length - 3)
  };
}

function getLayerTooltipCenter(layer) {
  const bounds = layer?.getBounds?.();
  return bounds?.isValid?.() ? bounds.getCenter() : undefined;
}

function createProvinceMarkerIcon(markerItems, extraCount) {
  const thumbMarkup = markerItems
    .map((item) => {
      const hasImage = Boolean(String(item.image ?? "").trim());
      const inlineStyle = hasImage
        ? `style="--marker-color:${escapeHtml(item.categoryColor)}; background-image:url('${escapeHtml(item.image)}')"`
        : `style="--marker-color:${escapeHtml(item.categoryColor)}"`;

      return `<span class="map-product-marker-thumb ${hasImage ? "has-image" : "is-fallback"}" ${inlineStyle} title="${escapeHtml(
        item.categoryLabel || item.name
      )}">${hasImage ? "" : escapeHtml(getProvinceMonogram(item.name || item.categoryLabel))}</span>`;
    })
    .join("");

  const countMarkup =
    extraCount > 0 ? `<span class="map-product-marker-count">+${escapeHtml(String(extraCount))}</span>` : "";

  return L.divIcon({
    className: "map-product-marker-icon",
    html: `<div class="map-product-marker-stack">${thumbMarkup}${countMarkup}</div>`,
    iconSize: [0, 0],
    iconAnchor: [0, 0]
  });
}

function ProvinceInsightPanelCompact({ profile, copy, onClose }) {
  const resolvedCopy = {
    ...PANEL_COPY_DEFAULTS,
    ...(copy ?? {})
  };
  const isRegionProfile = profile?.profileKind === "region";
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    setActiveTab("overview");
  }, [profile?.provinceId]);

  if (!profile) {
    return null;
  }

  const productRows = Array.isArray(profile.products)
    ? profile.products.filter(
        (item) => String(item?.name ?? "").trim() || String(item?.location ?? "").trim()
      )
    : [];

  const specRows = [
    {
      label: resolvedCopy.panelCoordinatesLabel,
      value: formatCoordinatePair(profile.gpsLatitude, profile.gpsLongitude) || resolvedCopy.panelNoData
    },
    {
      label: resolvedCopy.panelCultivatedAreaLabel,
      value: formatNumericValue(profile.cultivatedAreaHectares) || resolvedCopy.panelNoData
    },
    {
      label: resolvedCopy.panelAverageOutputLabel,
      value: formatNumericValue(profile.averageOutputMtPerYear) || resolvedCopy.panelNoData
    },
    {
      label: resolvedCopy.panelSowingPeriodLabel,
      value: profile.sowingPeriod || resolvedCopy.panelNoData
    },
    {
      label: resolvedCopy.panelHarvestPeriodLabel,
      value: profile.harvestPeriod || resolvedCopy.panelNoData
    },
    {
      label: resolvedCopy.panelCropsPerYearLabel,
      value: formatCropsPerYearValue(profile) || resolvedCopy.panelNoData
    },
    {
      label: resolvedCopy.panelVarietiesLabel,
      value: profile.varieties || resolvedCopy.panelNoData
    }
  ].filter((row) => row.value);

  return (
    <aside className="province-insight-panel province-insight-panel-compact" aria-label={`${profile.provinceName} details`}>
      <div className="province-insight-scroll province-insight-sheet">
        <div className="province-insight-cover" style={{ "--province-accent": profile.color }}>
          <div className="province-insight-cover-inner">
            <div className="province-insight-heading province-insight-heading-compact">
              <span className="province-insight-kicker">{resolvedCopy.panelKicker}</span>
              <h2>
                {profile.provinceName}
                {isRegionProfile ? (
                  profile.mappedProvinceCount ? <span>[{profile.mappedProvinceCount} provinces]</span> : null
                ) : profile.regionLabel ? (
                  <span>[{profile.regionLabel}]</span>
                ) : null}
              </h2>
              {!isRegionProfile && profile.regionLabel ? <p>{profile.regionLabel}</p> : null}
            </div>

            <button
              type="button"
              className="province-insight-close"
              aria-label={resolvedCopy.panelCloseAria}
              onClick={onClose}
            >
              <X size={18} strokeWidth={2.2} />
            </button>
          </div>
        </div>

        <div className="province-insight-tabs" role="tablist" aria-label={`${profile.provinceName} insight tabs`}>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "overview"}
            className={`province-insight-tab ${activeTab === "overview" ? "is-active" : ""}`}
            onClick={() => setActiveTab("overview")}
          >
            {resolvedCopy.panelTabOverview}
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "products"}
            className={`province-insight-tab ${activeTab === "products" ? "is-active" : ""}`}
            onClick={() => setActiveTab("products")}
          >
            {resolvedCopy.panelTabProducts}
          </button>
        </div>

        {activeTab === "overview" ? (
          <div className="province-insight-section-stack">
            {profile.characteristics ? (
              <section className="province-insight-quote-card">
                <span className="province-insight-section-label">{resolvedCopy.panelOverviewTitle}</span>
                <p>{profile.characteristics}</p>
              </section>
            ) : null}

            <section className="province-insight-specs-card">
              <span className="province-insight-section-label">{resolvedCopy.panelSpecsTitle}</span>

              <div className="province-insight-spec-list">
                {specRows.map((row) => (
                  <div key={row.label} className="province-insight-spec-row">
                    <span>{row.label}</span>
                    <strong>{row.value}</strong>
                  </div>
                ))}
              </div>
            </section>
          </div>
        ) : (
          <section className="province-insight-specs-card">
            <div className="province-products-section">
              <div className="province-products-header">
                <strong>{resolvedCopy.panelProductsTitle}</strong>
                <span>{productRows.length}</span>
              </div>

              {productRows.length > 0 ? (
                <div className="province-insight-product-stack">
                  {productRows.map((item, index) => (
                    <div
                      key={item.id ?? `${profile.provinceId}-product-${index}`}
                      className="province-insight-product-row"
                    >
                      <div className="province-insight-product-copy">
                        <strong>{item.name || resolvedCopy.panelNoData}</strong>
                        <span>
                          <MapPin size={14} strokeWidth={2} />
                          {item.location || profile.provinceName}
                        </span>
                      </div>

                      <span className="province-zone-pill">
                        {Number.isFinite(Number(item.zoneCount))
                          ? `${formatNumericValue(item.zoneCount, 0)} ${resolvedCopy.panelZoneCountSuffix}`
                          : resolvedCopy.panelNoData}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="province-products-empty">{resolvedCopy.panelProductsEmpty}</div>
              )}
            </div>
          </section>
        )}
      </div>
    </aside>
  );
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
        animate: false
      });

      if (animate) {
        map.flyToBounds(focusBounds, {
          ...getViewportPadding(false),
          maxZoom: getFocusMaxZoom(),
          duration: 0.95
        });
        return;
      }

      map.fitBounds(focusBounds, {
        ...getViewportPadding(false),
        maxZoom: getFocusMaxZoom(),
        animate: false
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
        animate: false
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

export default function InteractiveProvinceMap({ resetSequence = 0, copy }) {
  const enableHoverPanel = false;
  const enableProvinceTooltip = false;
  const resolvedCopy = {
    ...PANEL_COPY_DEFAULTS,
    ...(copy ?? {})
  };
  const { activeProducts } = useData();
  const [provinceData, setProvinceData] = useState(null);
  const [archipelagoData, setArchipelagoData] = useState(null);
  const [provinceProfileOverrides, setProvinceProfileOverrides] = useState({});
  const [mapInstance, setMapInstance] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [hoveredProvinceProfile, setHoveredProvinceProfile] = useState(null);
  const [pinnedProvinceProfile, setPinnedProvinceProfile] = useState(null);
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [activeFilterTab, setActiveFilterTab] = useState("products");
  const provinceLayersRef = useRef(new Map());
  const pinnedProvinceIdRef = useRef(null);
  const provinceProfilesByIdRef = useRef({});
  const regionProfilesByCodeRef = useRef({});
  const productLookup = useMemo(() => buildProductLookup(activeProducts), [activeProducts]);
  const activeInsightProfile = pinnedProvinceProfile ?? (enableHoverPanel ? hoveredProvinceProfile : null);
  const activeProvinceId = activeInsightProfile?.profileKind === "province" ? activeInsightProfile.provinceId : null;
  const activeRegionCode = activeInsightProfile?.profileKind === "region" ? activeInsightProfile.regionCode : null;

  function clearHoveredProvinceProfile(provinceId = null) {
    if (pinnedProvinceIdRef.current) {
      return;
    }

    setHoveredProvinceProfile((currentValue) => {
      if (!currentValue) {
        return currentValue;
      }

      if (provinceId && currentValue.provinceId !== provinceId) {
        return currentValue;
      }

      return null;
    });
  }

  function isProvincePointerTarget(target) {
    if (!(target instanceof Element)) {
      return false;
    }

    return Boolean(target.closest(".leaflet-vietnam-regions-pane")) && Boolean(target.closest(".leaflet-interactive"));
  }

  useEffect(() => {
    let isMounted = true;

    Promise.all([
      fetch(provinceGeojsonUrl, { cache: "force-cache" }).then((response) => {
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        return response.json();
      }),
      fetch(archipelagoGeojsonUrl, { cache: "force-cache" }).then((response) => {
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        return response.json();
      })
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

        setErrorMessage(resolvedCopy.loadError);
      });

    return () => {
      isMounted = false;
    };
  }, [resolvedCopy.loadError]);

  useEffect(() => {
    let isMounted = true;

    api
      .getProvinceMapProfiles()
      .then((payload) => {
        if (!isMounted) {
          return;
        }

        setProvinceProfileOverrides(
          Object.fromEntries((payload.profiles ?? []).map((profile) => [profile.provinceId, profile]))
        );
      })
      .catch(() => {
        if (!isMounted) {
          return;
        }

        setProvinceProfileOverrides({});
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
      features: [...provinceData.features].sort((left, right) => getFeatureSortArea(right) - getFeatureSortArea(left))
    };
  }, [provinceData]);

  const provinceProfilesById = useMemo(() => {
    if (!sortedProvinceData) {
      return {};
    }

    return Object.fromEntries(
      sortedProvinceData.features.map((feature) => {
        const profile = buildEnrichedProvinceProfileFromFeature(feature, provinceProfileOverrides, productLookup);
        return [profile.provinceId, profile];
      })
    );
  }, [productLookup, provinceProfileOverrides, sortedProvinceData]);

  const regionProfilesByCode = useMemo(
    () =>
      Object.fromEntries(
        REGION_STYLE_ORDER.map((regionMeta) => {
          const regionProfile = buildRegionInsightProfile(
            regionMeta.key,
            Object.values(provinceProfilesById).filter(
              (profile) => getProvinceRegionCode(profile.provinceId) === regionMeta.key
            )
          );

          return regionProfile ? [regionMeta.key, regionProfile] : null;
        }).filter(Boolean)
      ),
    [provinceProfilesById]
  );

  useEffect(() => {
    provinceProfilesByIdRef.current = provinceProfilesById;
  }, [provinceProfilesById]);

  useEffect(() => {
    regionProfilesByCodeRef.current = regionProfilesByCode;
  }, [regionProfilesByCode]);

  const provinceFilterStateById = useMemo(
    () =>
      Object.fromEntries(
        Object.entries(provinceProfilesById).map(([provinceId, profile]) => [
          provinceId,
          getProvinceFilterState(profile, selectedCategories)
        ])
      ),
    [provinceProfilesById, selectedCategories]
  );

  const categoryOptions = useMemo(() => {
    const provinceCountByCategory = {};

    Object.values(provinceProfilesById).forEach((profile) => {
      new Set(profile.categories).forEach((category) => {
        provinceCountByCategory[category] = (provinceCountByCategory[category] ?? 0) + 1;
      });
    });

    const activeCatalogCategories = Array.from(new Set((activeProducts ?? []).map((product) => product.category)));
    const orderedCategories = [
      ...CATEGORY_ORDER.filter((category) => activeCatalogCategories.includes(category) || provinceCountByCategory[category] > 0),
      ...activeCatalogCategories.filter((category) => !CATEGORY_ORDER.includes(category))
    ];

    return orderedCategories.map((category) => ({
      category,
      label: resolveCategoryLabel(category, resolvedCopy),
      color: getCategoryMeta(category).color,
      provinceCount: provinceCountByCategory[category] ?? 0
    }));
  }, [activeProducts, provinceProfilesById, resolvedCopy]);

  const regionOptions = useMemo(() => {
    const provinceCountByRegion = {};

    (sortedProvinceData?.features ?? []).forEach((feature) => {
      const regionCode = getProvinceRegionCode(feature?.properties?.id);
      provinceCountByRegion[regionCode] = (provinceCountByRegion[regionCode] ?? 0) + 1;
    });

    return REGION_STYLE_ORDER.map((region) => ({
      key: region.key,
      label: region.label,
      color: region.color,
      provinceCount: provinceCountByRegion[region.key] ?? 0
    })).filter((region) => region.provinceCount > 0);
  }, [sortedProvinceData]);

  useEffect(() => {
    setSelectedCategories((currentValue) =>
      currentValue.filter((category) =>
        categoryOptions.some((option) => option.category === category && option.provinceCount > 0)
      )
    );
  }, [categoryOptions]);

  useEffect(() => {
    provinceLayersRef.current.forEach((layer, provinceId) => {
      const isSelected = provinceId === activeProvinceId;
      const isRegionSelected =
        !isSelected && Boolean(activeRegionCode) && getProvinceRegionCode(provinceId) === activeRegionCode;
      layer.setStyle(getProvinceStyle(layer.feature, activeProvinceId, provinceFilterStateById, activeRegionCode));

      if (enableProvinceTooltip) {
        if (isSelected) {
          layer.openTooltip(getLayerTooltipCenter(layer));
        } else {
          layer.closeTooltip();
        }
      }

      if (isSelected || isRegionSelected) {
        layer.bringToFront();
      }
    });
  }, [activeProvinceId, activeRegionCode, enableProvinceTooltip, provinceFilterStateById]);

  useEffect(() => {
    pinnedProvinceIdRef.current = pinnedProvinceProfile?.provinceId ?? null;
  }, [pinnedProvinceProfile?.provinceId]);

  useEffect(() => {
    const syncProvinceProfile = (profile, setter) => {
      if (!profile) {
        return;
      }

      const nextProfile =
        profile.profileKind === "region"
          ? regionProfilesByCode[profile.regionCode]
          : provinceProfilesById[profile.provinceId];

      if (!nextProfile) {
        return;
      }

      setter(nextProfile);
    };

    syncProvinceProfile(pinnedProvinceProfile, setPinnedProvinceProfile);
    syncProvinceProfile(hoveredProvinceProfile, setHoveredProvinceProfile);
  }, [hoveredProvinceProfile, pinnedProvinceProfile, provinceProfilesById, regionProfilesByCode]);

  const focusBounds = useMemo(
    () => buildVietnamFocusBounds(sortedProvinceData, archipelagoData),
    [archipelagoData, sortedProvinceData]
  );

  const provinceMarkerEntries = useMemo(() => {
    if (!sortedProvinceData) {
      return [];
    }

    return sortedProvinceData.features
      .map((feature) => {
        const provinceId = feature?.properties?.id;
        const profile = provinceProfilesById[provinceId];
        const filterState = provinceFilterStateById[provinceId];
        const markerPosition = getFeatureMarkerPosition(feature);

        if (!profile || !markerPosition) {
          return null;
        }

        if (filterState?.isFilterActive && !filterState.isMatch) {
          return null;
        }

        const markerPreview = getProvinceMarkerItems(profile, selectedCategories, resolvedCopy);

        if (markerPreview.items.length === 0) {
          return null;
        }

        return {
          provinceId,
          profile,
          markerPosition,
          markerItems: markerPreview.items,
          extraCount: markerPreview.extraCount
        };
      })
      .filter(Boolean);
  }, [provinceFilterStateById, provinceProfilesById, resolvedCopy, selectedCategories, sortedProvinceData]);

function focusProvinceLayer(layer) {
    const map = layer?._map ?? mapInstance;

    if (!map || !layer?.getBounds) {
      return;
    }

    const layerBounds = layer.getBounds();
    if (!layerBounds?.isValid()) {
      return;
    }

    map.stop();
    map.fitBounds(layerBounds.pad(0.35), {
      ...getViewportPadding(true),
      animate: false,
      maxZoom: 7.2
    });

    if (enableProvinceTooltip) {
      requestAnimationFrame(() => {
        layer.openTooltip(getLayerTooltipCenter(layer));
      });
    }
  }

  function buildInsightProfile(feature) {
    const provinceId = feature?.properties?.id;
    return (
      provinceProfilesByIdRef.current[provinceId] ??
      regionProfilesByCodeRef.current[getProvinceRegionCode(provinceId)] ??
      null
    );
  }

  function handleProvinceSelection(feature, layer) {
    const nextProfile = buildInsightProfile(feature);
    if (!nextProfile) {
      return;
    }

    setPinnedProvinceProfile((currentValue) => {
      if (currentValue?.provinceId === nextProfile.provinceId) {
        return currentValue;
      }

      return nextProfile;
    });

    setHoveredProvinceProfile(null);

    if (enableProvinceTooltip) {
      layer.openTooltip(getLayerTooltipCenter(layer));
    }

    layer.bringToFront();
    focusProvinceLayer(layer);
  }

  function handleMarkerSelection(provinceId) {
    const provinceLayer = provinceLayersRef.current.get(provinceId);

    if (provinceLayer?.feature) {
      handleProvinceSelection(provinceLayer.feature, provinceLayer);
      return;
    }

    const nextProfile = provinceProfilesByIdRef.current[provinceId];
    if (!nextProfile) {
      return;
    }

    setPinnedProvinceProfile(nextProfile);
    setHoveredProvinceProfile(null);
  }

  function toggleCategoryFilter(category) {
    setSelectedCategories((currentValue) =>
      currentValue.includes(category)
        ? currentValue.filter((item) => item !== category)
        : [...currentValue, category]
    );
  }

  function resetView() {
    if (!mapInstance || !focusBounds?.isValid()) {
      return;
    }

    mapInstance.stop();
    mapInstance.fitBounds(focusBounds, {
      ...getViewportPadding(false),
      animate: false,
      maxZoom: getFocusMaxZoom()
    });
  }

  return (
    <div
      className="map-surface"
      onPointerMoveCapture={
        enableHoverPanel
          ? (event) => {
              if (isProvincePointerTarget(event.target)) {
                return;
              }

              clearHoveredProvinceProfile();
            }
          : undefined
      }
      onPointerLeave={enableHoverPanel ? () => clearHoveredProvinceProfile() : undefined}
    >
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
          zoomAnimation={false}
          fadeAnimation={false}
          markerZoomAnimation={false}
          zoomSnap={0.25}
          zoomDelta={0.5}
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
              keepBuffer={2}
              updateWhenIdle
              updateWhenZooming={false}
            />
          </Pane>

          <MapViewportController focusBounds={focusBounds} resetSequence={resetSequence} onMapReady={setMapInstance} />

          <Pane name="vietnam-regions" style={{ zIndex: 360 }}>
            <GeoJSON
              data={sortedProvinceData}
              pane="vietnam-regions"
              interactive
              style={(feature) => getProvinceStyle(feature, activeProvinceId, provinceFilterStateById, activeRegionCode)}
              onEachFeature={(feature, layer) => {
                const provinceId = feature?.properties?.id;
                provinceLayersRef.current.set(provinceId, layer);

                if (enableProvinceTooltip) {
                  layer.bindTooltip(getProvinceTooltipContent(feature), {
                    sticky: false,
                    direction: "top",
                    className: "map-tooltip"
                  });
                }

                layer.on("click", () => handleProvinceSelection(feature, layer));
              }}
            />
          </Pane>

          {archipelagoData ? (
            <Pane name="archipelagos" style={{ zIndex: 430 }}>
              <GeoJSON data={archipelagoData} pane="archipelagos" style={ARCHIPELAGO_STYLE} />
            </Pane>
          ) : null}

          <Pane name="product-markers" style={{ zIndex: 600 }}>
            {provinceMarkerEntries.map((entry) => (
              <Marker
                key={`marker-${entry.provinceId}`}
                position={entry.markerPosition}
                icon={createProvinceMarkerIcon(entry.markerItems, entry.extraCount)}
                zIndexOffset={entry.provinceId === activeProvinceId ? 1200 : 900}
                eventHandlers={{
                  click: () => handleMarkerSelection(entry.provinceId)
                }}
              />
            ))}
          </Pane>

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
        <div className="map-loading">{errorMessage || resolvedCopy.loading}</div>
      )}

      <section className="map-filter-panel" aria-label={resolvedCopy.filterTitle}>
        <div className="map-filter-header">
          <div className="map-filter-copy">
            <strong>
              {activeFilterTab === "products" ? (
                <Filter size={14} strokeWidth={2.3} />
              ) : (
                <MapPin size={14} strokeWidth={2.3} />
              )}
              {activeFilterTab === "products" ? resolvedCopy.filterTitle : resolvedCopy.legendTitle}
            </strong>
            <span>
              {activeFilterTab === "products" ? resolvedCopy.filterSubtitle : resolvedCopy.legendSubtitle}
            </span>
          </div>

          {activeFilterTab === "products" && selectedCategories.length > 0 ? (
            <button type="button" className="map-filter-clear" onClick={() => setSelectedCategories([])}>
              {resolvedCopy.filterClear}
            </button>
          ) : null}
        </div>

        <div className="map-filter-tabs" role="tablist" aria-label="Map side panel tabs">
          <button
            type="button"
            role="tab"
            aria-selected={activeFilterTab === "products"}
            className={`map-filter-tab ${activeFilterTab === "products" ? "is-active" : ""}`}
            onClick={() => setActiveFilterTab("products")}
          >
            {resolvedCopy.filterTabProducts}
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeFilterTab === "regions"}
            className={`map-filter-tab ${activeFilterTab === "regions" ? "is-active" : ""}`}
            onClick={() => setActiveFilterTab("regions")}
          >
            {resolvedCopy.filterTabRegions}
          </button>
        </div>

        {activeFilterTab === "products" ? (
          <div className="map-filter-chip-list">
            {categoryOptions.length > 0 ? (
              categoryOptions.map((option) => {
                const isActive = selectedCategories.includes(option.category);

                return (
                  <button
                    key={option.category}
                    type="button"
                    className={`map-filter-chip ${isActive ? "is-active" : ""}`}
                    style={{ "--filter-color": option.color }}
                    onClick={() => toggleCategoryFilter(option.category)}
                    disabled={option.provinceCount === 0}
                  >
                    <span className="map-filter-swatch" />
                    <span className="map-filter-chip-copy">
                      <strong>{option.label}</strong>
                      <small>
                        {option.provinceCount}{" "}
                        {option.provinceCount === 1
                          ? resolvedCopy.filterProvinceSingular
                          : resolvedCopy.filterProvincePlural}
                      </small>
                    </span>
                  </button>
                );
              })
            ) : (
              <div className="map-filter-empty">{resolvedCopy.filterEmpty}</div>
            )}
          </div>
        ) : (
          <div className="map-region-chip-list">
            {regionOptions.length > 0 ? (
              regionOptions.map((option) => (
                <div
                  key={option.key}
                  className="map-region-chip"
                  style={{ "--region-color": option.color }}
                >
                  <span className="map-region-swatch" />
                  <span className="map-region-chip-copy">
                    <strong>{option.label}</strong>
                    <small>
                      {option.provinceCount}{" "}
                      {option.provinceCount === 1
                        ? resolvedCopy.filterProvinceSingular
                        : resolvedCopy.filterProvincePlural}
                    </small>
                  </span>
                </div>
              ))
            ) : (
              <div className="map-filter-empty">{resolvedCopy.legendEmpty}</div>
            )}
          </div>
        )}
      </section>

      <ProvinceInsightPanelCompact
        profile={activeInsightProfile}
        copy={resolvedCopy}
        onClose={() => {
          setPinnedProvinceProfile(null);
          setHoveredProvinceProfile(null);
        }}
      />

      <div className={`map-toolbar ${activeInsightProfile ? "panel-open" : ""}`}>
        <button className="toolbar-button toolbar-button-wide" type="button" onClick={resetView}>
          {resolvedCopy.resetLabel}
        </button>
        <div className="map-toolbar-zoom-stack" aria-label="Map zoom controls">
          <button className="toolbar-button" type="button" onClick={() => mapInstance?.zoomIn()} title="Zoom in">
            +
          </button>
          <button className="toolbar-button" type="button" onClick={() => mapInstance?.zoomOut()} title="Zoom out">
            -
          </button>
        </div>
      </div>
    </div>
  );
}
