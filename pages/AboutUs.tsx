import React, { useEffect, useRef } from "react";
import {
  Globe,
  Handshake,
  Leaf,
  ShieldCheck,
  Sprout,
  Factory,
  PackageCheck,
  Ship,
  Target,
  Eye,
  Gem,
  TrendingUp,
  Droplet,
  MapPin,
  ClipboardCheck,
  FileCheck,
  Truck,
  User,
} from "lucide-react";
import { useLocale } from "../context/LocaleContext";
import { useDocumentMeta, BASE_URL } from "../lib/useDocumentMeta";
import "../components/about-us.css";

/* ────────────────────────────────────────
   Scroll-triggered fade-in
   ──────────────────────────────────────── */
function FadeIn({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          el.classList.add("about-fade--visible");
          io.unobserve(el);
        }
      },
      { threshold: 0.12 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div ref={ref} className={`about-fade ${className}`}>
      {children}
    </div>
  );
}

/* ────────────────────────────────────────
   Decorative leaf SVG
   ──────────────────────────────────────── */
function LeafDeco({ pos }: { pos: "tr" | "bl" }) {
  return (
    <svg
      className={`about-leaf-deco about-leaf-deco--${pos}`}
      viewBox="0 0 200 200"
      fill="none"
    >
      <path
        d="M100 10C100 10 30 60 20 130C10 200 100 190 100 190C100 190 190 200 180 130C170 60 100 10 100 10Z"
        fill="#1B6B3A"
      />
      <path
        d="M100 10C100 10 100 100 100 190"
        stroke="#8BC34A"
        strokeWidth="2"
        opacity="0.5"
      />
    </svg>
  );
}

/* ────────────────────────────────────────
   Section heading helper
   ──────────────────────────────────────── */
function Heading({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="about-heading">
      <div className="about-heading__ornament">
        <span className="about-heading__line about-heading__line--left" />
        <Leaf size={16} color="#1B6B3A" />
        <span className="about-heading__line about-heading__line--right" />
      </div>
      <h2 className="about-heading__title">{title}</h2>
      {subtitle && <p className="about-heading__subtitle">{subtitle}</p>}
      <div className="about-heading__leaf-sep"></div>
    </div>
  );
}

/* ══════════════════════════════════════════
   ABOUT US PAGE
   ══════════════════════════════════════════ */
const AboutUs: React.FC = () => {
  const { locale } = useLocale();

  useDocumentMeta({
    title: locale === "zh" ? "关于 FoodEra" : "About FoodEra",
    description:
      locale === "zh"
        ? "FoodEra 致力于将越南优质农产品带向全球市场。"
        : "FoodEra — professional sourcing partner & exporter based in Vietnam, bridging local producers and global markets.",
    canonicalUrl: `${BASE_URL}/about`,
    ogUrl: `${BASE_URL}/about`,
  });

  return (
    <div
      className="bg-white min-h-screen font-sans"
      style={{ paddingTop: "80px" }}
    >
      {/* ═══════════════════════════════════════
          SECTION 1 — Who We Are
          ═══════════════════════════════════════ */}
      <section className="about-section" id="who-we-are">
        <LeafDeco pos="tr" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <FadeIn>
            <div className="who-grid">
              <div className="who-content">
                <h1>Who We Are?</h1>

                <div className="who-blurb">
                  <div className="who-blurb__icon">
                    <Globe size={22} />
                  </div>
                  <p className="who-blurb__text">
                    FoodEra is a{" "}
                    <strong>
                      professional sourcing partner &amp; exporter
                    </strong>{" "}
                    based in Vietnam, bridging the gap between local producers
                    and global markets.
                  </p>
                </div>

                <div className="who-blurb">
                  <div className="who-blurb__icon">
                    <Handshake size={22} />
                  </div>
                  <p className="who-blurb__text">
                    We work with <strong>multiple qualified suppliers</strong>,
                    allowing us to provide{" "}
                    <strong>flexible sourcing solutions</strong>, adapt to{" "}
                    <strong>different specifications</strong>, and maintain{" "}
                    <strong>stable supply</strong> for international buyers.
                  </p>
                </div>

                <div className="who-features">
                  {[
                    {
                      icon: <Handshake size={18} />,
                      title: "Reliable Partner",
                      desc: "Long-term cooperation based on trust.",
                    },
                    {
                      icon: <ShieldCheck size={18} />,
                      title: "Quality Focused",
                      desc: "Committed to consistent quality and compliance.",
                    },
                    {
                      icon: <Leaf size={18} />,
                      title: "Sustainable Mindset",
                      desc: "Supporting responsible sourcing and growth.",
                    },
                    {
                      icon: <Globe size={18} />,
                      title: "Global Reach",
                      desc: "Delivering value to markets worldwide.",
                    },
                  ].map((f) => (
                    <div key={f.title} className="who-feature">
                      <div className="who-feature__icon">{f.icon}</div>
                      <div className="who-feature__title">{f.title}</div>
                      <div className="who-feature__desc">{f.desc}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="who-image">
                <img
                  src="/media/about/team-photo.jpg"
                  alt="The FoodEra team"
                  loading="eager"
                />
              </div>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ═══════════════════════════════════════
          SECTION 2 — Our Story
          ═══════════════════════════════════════ */}
      <section className="about-section about-section--alt" id="our-story">
        <LeafDeco pos="bl" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <FadeIn>
            <div className="story-grid">
              <div className="story-image">
                <img
                  src="/media/about/rice-field-story.webp"
                  alt="Vietnamese rice field"
                  loading="lazy"
                />
              </div>

              <div className="story-content">
                <h2>Our Story</h2>

                <div className="story-timeline">
                  <div className="story-item">
                    <div className="story-item__dot">
                      <Sprout size={14} />
                    </div>
                    <h3 className="story-item__title">
                      FoodEra was built on a simple realization
                    </h3>
                    <ul className="story-item__list">
                      <li>
                        Vietnam has strong agricultural production, but
                        connecting that supply to international markets is not
                        always straightforward.
                      </li>
                      <li>
                        Buyers often face challenges in consistency,
                        traceability, and reliable execution. At the same time,
                        many farmers and processors lack direct access to global
                        markets.
                      </li>
                    </ul>
                  </div>

                  <div className="story-item">
                    <div className="story-item__dot">
                      <Handshake size={14} />
                    </div>
                    <h3 className="story-item__title">
                      We saw an opportunity to bridge this gap
                    </h3>
                    <ul className="story-item__list">
                      <li>
                        From the beginning, FoodEra has focused on working
                        closely with both state and private partners — from
                        farms to processing facilities — to build a structured
                        and dependable supply chain.
                      </li>
                      <li>
                        This approach allows us to not only match product
                        specifications and volumes, but also ensure better
                        coordination, transparency, and stability across each
                        shipment.
                      </li>
                      <li>
                        Sustainability, traceability, and quality assurance are
                        not just commitments — they are built into how we
                        operate.
                      </li>
                    </ul>
                  </div>

                  <div className="story-item">
                    <div className="story-item__dot">
                      <TrendingUp size={14} />
                    </div>
                    <h3 className="story-item__title">Looking ahead</h3>
                    <ul className="story-item__list">
                      <li>
                        We believe that in agricultural trade, long-term success
                        is not driven by price alone, but by consistency, trust,
                        and the ability to deliver as promised.
                      </li>
                      <li>
                        Today, FoodEra continues to grow with the same mindset:
                        to be a reliable sourcing partner for buyers who value
                        stability, clarity, and long-term cooperation.
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ═══════════════════════════════════════
          SECTION 3 — Our Team
          ═══════════════════════════════════════ */}
      <section className="about-section" id="our-team">
        <LeafDeco pos="tr" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <FadeIn>
            <Heading
              title="Our Team"
              subtitle="The people driving FoodEra's mission forward"
            />

            <div className="team-grid team-grid--leadership">
              {[
                {
                  name: "Mr. Ngoc Dao",
                  role: "Chairman",
                  photo: "/media/about/team-ngoc-dao.jpg",
                },
                {
                  name: "Mr. Michael Dao",
                  role: "B.O.M",
                  photo: "/media/about/team-michael-dao.jpg",
                },
                {
                  name: "Mr. Brian Ho",
                  role: "General Manager",
                  photo: "/media/about/team-nghia-ho.jpg",
                },
              ].map((member, i) => (
                <div key={`leadership-${i}`} className="team-card">
                  <div className="team-card__photo">
                    {member.photo ? (
                      <img
                        src={member.photo}
                        alt={member.name}
                        loading="lazy"
                      />
                    ) : (
                      <User size={40} />
                    )}
                  </div>
                  <h3 className="team-card__name">{member.name}</h3>
                  <p className="team-card__role">{member.role}</p>
                </div>
              ))}
            </div>

            <div className="team-grid team-grid--sales">
              {[
                {
                  name: "Ms. Tu Phuong",
                  role: "Market Development Executive",
                  photo: "/media/about/team-tu-phuong.jpg",
                },
                {
                  name: "Ms. Dung Nguyen",
                  role: "Market Development Executive",
                  photo: "/media/about/team-dung-nguyen.jpg",
                },
                {
                  name: "Mr. Hai Nguyen",
                  role: "Market Development Executive",
                  photo: "/media/about/team-hai-nguyen.jpg",
                },
              ].map((member, i) => (
                <div key={`sales-${i}`} className="team-card">
                  <div className="team-card__photo team-card__photo--sm">
                    {member.photo ? (
                      <img
                        src={member.photo}
                        alt={member.name}
                        loading="lazy"
                      />
                    ) : (
                      <User size={32} />
                    )}
                  </div>
                  <h3 className="team-card__name">{member.name}</h3>
                  <p className="team-card__role">{member.role}</p>
                </div>
              ))}
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ═══════════════════════════════════════
          SECTION 4 — What We Do
          ═══════════════════════════════════════ */}
      <section className="about-section about-section--alt" id="what-we-do">
        <LeafDeco pos="bl" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <FadeIn>
            <Heading
              title="What We Do"
              subtitle="Delivering quality, reliability, and trust at every step"
            />

            <div className="services-grid">
              {[
                {
                  icon: <Sprout size={28} />,
                  cls: "service-card__icon--green",
                  title: "Sourcing",
                  num: "01",
                  desc: "Partnering with qualified suppliers, both state & private companies, to ensure a stable supply and flexible sourcing solutions.",
                },
                {
                  icon: <ClipboardCheck size={28} />,
                  cls: "service-card__icon--dark",
                  title: "Quality Control",
                  num: "02",
                  desc: "Conducting pre-shipment inspections to ensure product consistency and specification compliance.",
                },
                {
                  icon: <Truck size={28} />,
                  cls: "service-card__icon--lime",
                  title: "Logistics",
                  num: "03",
                  desc: "Managing documentation and shipment to ensure smooth, efficient, and reliable delivery.",
                },
              ].map((s) => (
                <div key={s.title} className="service-card">
                  <div className={`service-card__icon ${s.cls}`}>{s.icon}</div>
                  <h3 className="service-card__title">{s.title}</h3>
                  <div className="service-card__divider" />
                  <p className="service-card__desc">{s.desc}</p>
                  <div className="service-card__num">{s.num}</div>
                </div>
              ))}
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ═══════════════════════════════════════
          SECTION 5 — Mission & Vision
          ═══════════════════════════════════════ */}
      <section className="about-section" id="mission-vision">
        <LeafDeco pos="tr" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <FadeIn>
            <div className="mv-header">
              <h2>Our Mission &amp; Vision</h2>
              <div className="mv-header__bar" />
              <p>
                Committed to quality, reliability, and long-term partnerships.
              </p>
            </div>

            <div className="mv-cards">
              <div className="mv-card">
                <div className="mv-card__icon">
                  <Target size={22} />
                </div>
                <h3 className="mv-card__title">Mission</h3>
                <ul className="mv-card__list">
                  <li>
                    <ShieldCheck size={15} color="#1B6B3A" /> Deliver consistent
                    quality aligned with buyer requirements
                  </li>
                  <li>
                    <ShieldCheck size={15} color="#1B6B3A" /> Support buyers
                    with flexible sourcing and clear communication
                  </li>
                  <li>
                    <ShieldCheck size={15} color="#1B6B3A" /> Build long-term
                    cooperation based on trust and execution
                  </li>
                </ul>
              </div>

              <div className="mv-card">
                <div className="mv-card__icon">
                  <Eye size={22} />
                </div>
                <h3 className="mv-card__title">Vision</h3>
                <p className="mv-card__text">
                  To become a trusted sourcing partner connecting Vietnam's
                  agricultural products to global markets.
                </p>
              </div>
            </div>

            <div className="mv-values">
              {[
                {
                  icon: <Handshake size={20} />,
                  title: "Trust",
                  desc: "Building reliable relationships",
                },
                {
                  icon: <Gem size={20} />,
                  title: "Quality",
                  desc: "Ensuring excellence in every step",
                },
                {
                  icon: <Globe size={20} />,
                  title: "Growth",
                  desc: "Growing together for a sustainable future",
                },
              ].map((v) => (
                <div key={v.title} className="mv-value">
                  <div className="mv-value__icon">{v.icon}</div>
                  <div className="mv-value__title">{v.title}</div>
                  <div className="mv-value__desc">{v.desc}</div>
                </div>
              ))}
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ═══════════════════════════════════════
          SECTION 6 — Supply Chain Management
          ═══════════════════════════════════════ */}
      <section className="about-section about-section--alt" id="supply-chain">
        <LeafDeco pos="bl" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <FadeIn>
            <Heading
              title="Supply Chain Management"
              subtitle="From farm to global market – managed with care, delivered with trust"
            />

            <div className="supply-flow">
              {[
                {
                  icon: <Sprout size={26} />,
                  num: "01",
                  title: "Farm",
                  desc: "Sourcing high-quality raw materials from trusted farms.",
                },
                {
                  icon: <Factory size={26} />,
                  num: "02",
                  title: "Processing",
                  desc: "Ensuring cleanliness, safety, and efficiency through modern processing.",
                },
                {
                  icon: <ShieldCheck size={26} />,
                  num: "03",
                  title: "QC",
                  desc: "Strict quality control at every step to meet international standards.",
                },
                {
                  icon: <PackageCheck size={26} />,
                  num: "04",
                  title: "Packing",
                  desc: "Careful packing to protect product quality and ensure safety during transit.",
                },
                {
                  icon: <Ship size={26} />,
                  num: "05",
                  title: "Export",
                  desc: "Timely delivery to global markets with complete documentation and reliable logistics.",
                },
              ].flatMap((step, i, arr) => {
                const el = (
                  <div key={step.title} className="supply-step">
                    <div className="supply-step__badge">{step.num}</div>
                    <div className="supply-step__circle">{step.icon}</div>
                    <h3 className="supply-step__title">{step.title}</h3>
                    <p className="supply-step__desc">{step.desc}</p>
                  </div>
                );
                return i < arr.length - 1
                  ? [el, <div key={`c${i}`} className="supply-connector" />]
                  : [el];
              })}
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ═══════════════════════════════════════
          SECTION 7 — Quality Control
          ═══════════════════════════════════════ */}
      <section className="about-section" id="quality-control">
        <LeafDeco pos="tr" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <FadeIn>
            <Heading title="Quality Control" />

            <div className="qc-grid">
              {[
                {
                  num: "01",
                  icon: <ClipboardCheck size={18} />,
                  title: "Pre-shipment inspection",
                  desc: "by third-party (SGS, Vinacontrol)",
                },
                {
                  num: "02",
                  icon: <FileCheck size={18} />,
                  title: "Specification compliance monitoring",
                  desc: "",
                },
                {
                  num: "03",
                  icon: <Droplet size={18} />,
                  title: "Moisture, grading, and foreign matter control",
                  desc: "",
                },
                {
                  num: "04",
                  icon: <MapPin size={18} />,
                  title: "Traceability from farm to port",
                  desc: "",
                },
              ].map((item) => (
                <div key={item.num} className="qc-card">
                  <div className="qc-card__badge">{item.num}</div>
                  <div>
                    <div className="qc-card__title">{item.title}</div>
                    {item.desc && (
                      <div className="qc-card__desc">{item.desc}</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ═══════════════════════════════════════
          SECTION 8 — International Standards
          ═══════════════════════════════════════ */}
      <section
        className="about-section about-section--alt"
        id="international-standards"
      >
        <LeafDeco pos="bl" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <FadeIn>
            <Heading
              title="Certifications"
              subtitle="Committed to global quality, food safety, and sustainable development"
            />

            <div className="cert-groups">
              {[
                {
                  group: "Organic Production Certification",
                  items: [
                    { name: "HKORC Organic", img: "/media/about/certifications/cert-organic-hkorc.jpg" },
                    { name: "Australian Certified Organic", img: "/media/about/certifications/cert-organic-australia.webp" },
                    { name: "BioGro New Zealand", img: "/media/about/certifications/cert-organic-biogro-nz.webp" },
                    { name: "Canada Organic / Biologique", img: "/media/about/certifications/cert-organic-canada.webp" },
                    { name: "EU Organic", img: "/media/about/certifications/cert-organic-eu.webp" },
                    { name: "JAS Organic (Japan)", img: "/media/about/certifications/cert-organic-jas.png" },
                    { name: "USDA Organic", img: "/media/about/certifications/cert-organic-usda.jpg" },
                  ],
                },
                {
                  group: "Product Certification",
                  items: [
                    { name: "Kosher Certified", img: "/media/about/certifications/cert-product-kosher.jpg" },
                    { name: "Halal", img: "/media/about/certifications/cert-product-halal.jpg" },
                    { name: "Fairtrade International", img: "/media/about/certifications/cert-product-fairtrade.webp" },
                    { name: "Rainforest Alliance", img: "/media/about/certifications/cert-product-rainforest.webp" },
                    { name: "4C", img: "/media/about/certifications/cert-product-4c.webp" },
                    { name: "GLOBALG.A.P.", img: "/media/about/certifications/cert-product-globalgap.webp" },
                  ],
                },
                {
                  group: "Manufacturing Certification",
                  items: [
                    { name: "HACCP", img: "/media/about/certifications/cert-mfg-haccp.webp" },
                    { name: "IFS Food", img: "/media/about/certifications/cert-mfg-ifs-food.png" },
                    { name: "FSSC 22000", img: "/media/about/certifications/cert-mfg-fssc22000.webp" },
                    { name: "ISO 45001:2018", img: "/media/about/certifications/cert-mfg-iso45001-a.webp" },
                    { name: "ISO 45001", img: "/media/about/certifications/cert-mfg-iso45001-b.png" },
                  ],
                },
                {
                  group: "Inspection Certification",
                  items: [
                    { name: "SGS", img: "/media/about/certifications/cert-inspect-sgs.webp" },
                    { name: "Vinacontrol CE", img: "/media/about/certifications/cert-inspect-vinacontrol.png" },
                    { name: "Eurofins", img: "/media/about/certifications/cert-inspect-eurofins.png" },
                    { name: "ISO 17025 Accredited Laboratory", img: "/media/about/certifications/cert-inspect-iso17025.webp" },
                  ],
                },
                {
                  group: "Other Certification",
                  items: [
                    { name: "EUDR", img: "/media/about/certifications/cert-other-eudr.webp" },
                    { name: "Non-GMO Project Verified", img: "/media/about/certifications/cert-other-nongmo.webp" },
                  ],
                },
              ].map((g) => (
                <div key={g.group}>
                  <h3 className="cert-group__title">{g.group}</h3>
                  <div className="cert-grid">
                    {g.items.map((item) => (
                      <div key={item.name} className="cert-card">
                        <img
                          className="cert-card__img"
                          src={item.img}
                          alt={item.name}
                          loading="lazy"
                        />
                        <div className="cert-card__name">{item.name}</div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </FadeIn>
        </div>
      </section>

    </div>
  );
};

export default AboutUs;
