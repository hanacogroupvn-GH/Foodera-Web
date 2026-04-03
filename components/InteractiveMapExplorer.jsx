"use client";

import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

import Logo from "../Logo-optimized.png";
import { appRoutes } from "../lib/routes";
import InteractiveProvinceMap from "./InteractiveProvinceMap";

export default function InteractiveMapExplorer({ copy }) {
  const navigate = useNavigate();

  const handleBack = () => {
    const historyIndex = Number(window.history.state?.idx ?? -1);
    if (historyIndex >= 1 || window.history.length > 1) {
      navigate(-1);
      return;
    }

    navigate(appRoutes.home);
  };

  return (
    <div className="map-page">
      <main className="map-shell">
        <InteractiveProvinceMap resetSequence={0} copy={copy} />

        <header className="map-topbar">
          <div className="map-masthead">
            <div className="map-brand" aria-label={copy.brandAlt}>
              <img src={Logo} alt={copy.brandAlt} className="map-brand-logo" loading="eager" decoding="async" />
            </div>

            <h1 className="map-hero-title">{copy.brandTitle}</h1>
          </div>

          <button
            type="button"
            className="map-back-button"
            onClick={handleBack}
            aria-label={copy.backAria}
          >
            <ArrowLeft size={18} />
            <span>{copy.backLabel}</span>
          </button>
        </header>

        <footer className="map-copyright" aria-label="Map page copyright">
          <span>{copy.copyrightLabel}</span>
        </footer>
      </main>
    </div>
  );
}
