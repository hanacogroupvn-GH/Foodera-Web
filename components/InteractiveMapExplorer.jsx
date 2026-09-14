"use client";

import ProductInfographicMap from "./ProductInfographicMap";

export default function InteractiveMapExplorer({ copy, locale = "en", headerAction, onSwitchToChart }) {
  return <ProductInfographicMap copy={copy} locale={locale} headerAction={headerAction} onSwitchToChart={onSwitchToChart} />;
}
