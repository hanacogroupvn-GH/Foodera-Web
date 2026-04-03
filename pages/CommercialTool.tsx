import React from 'react';
import 'leaflet/dist/leaflet.css';

import '../components/interactive-map.css';
import InteractiveMapExplorer from '../components/InteractiveMapExplorer';
import { useLocale } from '../context/LocaleContext';

const MAP_COPYRIGHT = '\u00A9 2026 Foodmax Agriculture Export Co., Ltd. All Rights Reserved.';

const CommercialTool: React.FC = () => {
  const { locale } = useLocale();

  const copy =
    locale === 'zh'
      ? {
          brandEyebrow: 'Foodmax Origin Desk',
          brandAlt: 'Foodmax',
          copyrightLabel: MAP_COPYRIGHT,
          brandTitle: 'è¶Šå—ç§æ¤åŒº',
          backLabel: 'è¿”å›ž',
          backAria: 'è¿”å›žä¸Šä¸€é¡µ',
          filterTitle: 'äº§å“ç­›é€‰',
          filterSubtitle: 'æŒ‰å·²æ˜ å°„çš„äº§å“ç±»åˆ«é«˜äº®çœä»½',
          filterClear: 'æ¸…é™¤',
          filterEmpty: 'æš‚æ— å·²æ˜ å°„çš„äº§å“ç±»åˆ«ã€‚',
          filterProvinceSingular: 'ä¸ªçœä»½',
          filterProvincePlural: 'ä¸ªçœä»½',
          filterTabProducts: 'äº§å“',
          filterTabRegions: 'åŒºåŸŸ',
          categoryRice: 'å¤§ç±³',
          categoryAgriculture: 'æ°´æžœä¸Žå†œäº§',
          categoryCoffee: 'å’–å•¡',
          categoryCashew: 'è…°æžœ',
          legendTitle: 'åŒºåŸŸå›¾ä¾‹',
          legendSubtitle: 'æŸ¥çœ‹åœ°å›¾ä¸Šä½¿ç”¨çš„åŒºåŸŸé¢œè‰²ç³»ç»Ÿ',
          legendEmpty: 'æš‚æ— åŒºåŸŸæ•°æ®ã€‚',
          legendButton: 'å›¾ä¾‹',
          toggleLegendAria: 'æ‰“å¼€æˆ–å…³é—­å›¾ä¾‹',
          closeLegendAria: 'å…³é—­å›¾ä¾‹',
          reopenLegendAria: 'é‡æ–°æ‰“å¼€å›¾ä¾‹',
          resetAria: 'é‡æ–°å®šä½è¶Šå—åœ°å›¾',
          editorAria: 'æ‰“å¼€åœ°å›¾å†…å®¹ç¼–è¾‘å™¨',
          regionAria: 'å…­å¤§åŒºåŸŸé¢œè‰²æ ‡è¯†',
          summaryTitle: 'æ‚¬åœæˆ–ç‚¹å‡»ä»»ä¸€çœå¸‚',
          summaryText: 'æ‚¬åœæˆ–ç‚¹å‡»ä»¥æŸ¥çœ‹ CMS ä¸­å·²æ˜ å°„çš„çœåŸŸå†…å®¹ã€‚',
          resetLabel: 'å…¨å›½',
          loading: 'æ­£åœ¨åŠ è½½è¶Šå—åœ°å›¾...',
          loadError: 'æ— æ³•åŠ è½½æ–°ç‰ˆè¶Šå—åœ°å›¾æ•°æ®ã€‚',
          panelKicker: 'çœåŸŸè¯¦æƒ…',
          panelOverviewTitle: 'ç‰¹æ€§',
          panelSpecsTitle: 'æ˜ å°„è§„æ ¼',
          panelCoordinatesLabel: 'GPS å��æ ‡ï¼ˆçº¬åº¦/ç»�åº¦ï¼‰',
          panelCultivatedAreaLabel: 'ç§æ¤�é�¢ç§¯ï¼ˆå…¬é¡·ï¼‰',
          panelAverageOutputLabel: 'å¹³å�‡äº§é‡�ï¼ˆMT/å¹´ï¼‰',
          panelSowingPeriodLabel: 'æ’­ç§�æ—¶é—´',
          panelHarvestPeriodLabel: 'æ”¶èŽ·æ—¶é—´',
          panelCropsPerYearLabel: 'æ¯�å¹´ä½œç‰©èŒ¬æ•°',
          panelVarietiesLabel: 'å“�ç§�',
          panelNoData: 'æš‚æœªæ˜ å°„',
          panelCloseAria: 'å…³é—­çœåŸŸè¯¦æƒ…'
        }
      : {
          brandEyebrow: 'Foodmax Origin Desk',
          brandAlt: 'Foodmax',
          copyrightLabel: MAP_COPYRIGHT,
          brandTitle: 'Vietnam Growing Areas',
          backLabel: 'Back',
          backAria: 'Go back to the previous page',
          filterTitle: 'Product Filters',
          filterSubtitle: 'Highlight provinces by mapped product categories',
          filterClear: 'Clear',
          filterEmpty: 'No mapped product categories yet.',
          filterProvinceSingular: 'province',
          filterProvincePlural: 'provinces',
          filterTabProducts: 'Products',
          filterTabRegions: 'Regions',
          categoryRice: 'Rice',
          categoryAgriculture: 'Fruits & Agriculture',
          categoryCoffee: 'Coffee',
          categoryCashew: 'Cashew',
          legendTitle: 'Region Legend',
          legendSubtitle: 'Review the regional growing-area colors used on the map.',
          legendEmpty: 'Region data is unavailable.',
          legendButton: 'Legend',
          toggleLegendAria: 'Toggle legend panel',
          closeLegendAria: 'Close legend panel',
          reopenLegendAria: 'Reopen legend panel',
          resetAria: 'Recenter the Vietnam map',
          editorAria: 'Open map content editor',
          regionAria: 'Six-region color reference',
          summaryTitle: 'Hover or Click Any Province',
          summaryText: 'Hover or click to view the province content currently mapped in CMS.',
          resetLabel: 'Nationwide',
          loading: 'Loading the Vietnam map...',
          loadError: 'Unable to load the updated Vietnam map layers.',
          panelKicker: 'Province Insight',
          panelOverviewTitle: 'Characteristics',
          panelSpecsTitle: 'Mapped Specifications',
          panelCoordinatesLabel: 'GPS coordinates (latitude/longitude)',
          panelCultivatedAreaLabel: 'Cultivated area (hectares)',
          panelAverageOutputLabel: 'Average output (MT/year)',
          panelSowingPeriodLabel: 'Sowing period',
          panelHarvestPeriodLabel: 'Harvest period',
          panelCropsPerYearLabel: 'Crops per year',
          panelVarietiesLabel: 'Varieties',
          panelNoData: 'Not mapped yet',
          panelCloseAria: 'Close province details'
        };

  return <InteractiveMapExplorer copy={copy} />;
};

export default CommercialTool;
