"use client";

import ProductInfographicMap from "./ProductInfographicMap";

export default function InteractiveMapExplorer({ copy, locale = "en" }) {
  return <ProductInfographicMap copy={copy} locale={locale} />;
}
