import React from "react";
import { useLocale } from "../context/LocaleContext";
import SectionHeading from "./SectionHeading";

interface ExportCountry {
  code: string;
  flag: string;
  name: { en: string; zh: string };
}

interface ExportRegion {
  key: string;
  label: { en: string; zh: string };
  countries: ExportCountry[];
}

// Countries FoodEra currently exports to, grouped into 3 broad regions.
const EXPORT_REGIONS: ExportRegion[] = [
  {
    key: "asia-pacific",
    label: { en: "Asia-Pacific", zh: "亚太地区" },
    countries: [
      { code: "tw", flag: "🇹🇼", name: { en: "Taiwan", zh: "台湾" } },
      { code: "hk", flag: "🇭🇰", name: { en: "Hong Kong", zh: "香港" } },
      { code: "cn", flag: "🇨🇳", name: { en: "China", zh: "中国" } },
      { code: "jp", flag: "🇯🇵", name: { en: "Japan", zh: "日本" } },
      { code: "kr", flag: "🇰🇷", name: { en: "South Korea", zh: "韩国" } },
      { code: "sg", flag: "🇸🇬", name: { en: "Singapore", zh: "新加坡" } },
      { code: "au", flag: "🇦🇺", name: { en: "Australia", zh: "澳大利亚" } },
      { code: "nz", flag: "🇳🇿", name: { en: "New Zealand", zh: "新西兰" } },
    ],
  },
  {
    key: "middle-east",
    label: { en: "Middle East", zh: "中东" },
    countries: [
      { code: "bh", flag: "🇧🇭", name: { en: "Bahrain", zh: "巴林" } },
      { code: "kw", flag: "🇰🇼", name: { en: "Kuwait", zh: "科威特" } },
      {
        code: "sa",
        flag: "🇸🇦",
        name: { en: "Saudi Arabia", zh: "沙特阿拉伯" },
      },
      { code: "ae", flag: "🇦🇪", name: { en: "Dubai", zh: "迪拜" } },
      { code: "om", flag: "🇴🇲", name: { en: "Sohar", zh: "苏哈尔" } },
      { code: "iq", flag: "🇮🇶", name: { en: "Iraq", zh: "伊拉克" } },
    ],
  },
  {
    key: "americas-europe",
    label: { en: "Americas & Europe", zh: "美洲与欧洲" },
    countries: [
      { code: "us", flag: "🇺🇸", name: { en: "United States", zh: "美国" } },
      { code: "gb", flag: "🇬🇧", name: { en: "United Kingdom", zh: "英国" } },
    ],
  },
];

const ExportReachMap: React.FC = () => {
  const { locale } = useLocale();
  const lang = locale === "zh" ? "zh" : "en";

  const copy =
    locale === "zh"
      ? {
          title: "我们已出口的国家",
          subtitle: "产品已服务全球 30+ 个国家和地区的进口商与经销商。",
        }
      : {
          title: "Countries We Target To",
          subtitle:
            "Serving importers and distributors across 30+ countries worldwide.",
        };

  return (
    <section className="relative overflow-hidden bg-white py-24">
      {/* Faint decorative world-map silhouette — static image, no
          interactivity or animation. Real (CC0 public-domain) simplified
          continent outlines, served as a static file so it's cached like
          any other image and adds nothing to the JS bundle. See
          feedback_world_map_perf memory before touching this: two prior
          heavy/animated hand-coded versions of a map here were removed at
          the user's request. */}
      <img
        src="/media/decorative/world-map-outline.svg"
        alt=""
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 h-full w-full select-none object-contain p-10 sm:p-14 lg:p-20"
      />

      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading title={copy.title} subtitle={copy.subtitle} />

        <div className="mx-auto grid max-w-4xl grid-cols-1 gap-x-10 gap-y-8 sm:grid-cols-2 lg:grid-cols-3">
          {EXPORT_REGIONS.map((region) => (
            <div key={region.key}>
              <h3 className="mb-3 text-xs font-black uppercase tracking-[0.2em] text-foodera-forest">
                {region.label[lang]}
              </h3>
              <ul className="flex flex-col gap-2.5">
                {region.countries.map((country) => (
                  <li
                    key={country.code}
                    className="flex items-center gap-2.5 text-sm font-semibold text-gray-700"
                  >
                    <span className="text-lg leading-none" aria-hidden="true">
                      {country.flag}
                    </span>
                    {country.name[lang]}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ExportReachMap;
