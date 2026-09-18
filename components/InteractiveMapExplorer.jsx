"use client";

import ProductInfographicMap from "./ProductInfographicMap";

export default function InteractiveMapExplorer({ copy, locale = "en", headerAction, onSwitchToChart, embedded = false }) {
  return (
    <ProductInfographicMap
      copy={copy}
      locale={locale}
      headerAction={headerAction}
      onSwitchToChart={onSwitchToChart}
      embedded={embedded}
    />
  );
}
