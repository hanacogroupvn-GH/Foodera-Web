import React, { useEffect, useRef } from 'react';
import {
  Globe, Handshake, Leaf, ShieldCheck, Sprout, Factory, PackageCheck, Ship,
  Target, Eye, Gem, TrendingUp, Droplet, MapPin, ClipboardCheck, FileCheck, Truck
} from 'lucide-react';
import { useLocale } from '../context/LocaleContext';
import { useDocumentMeta, BASE_URL } from '../lib/useDocumentMeta';
import '../components/about-us.css';

/* ────────────────────────────────────────
   Scroll-triggered fade-in
   ──────────────────────────────────────── */
function FadeIn({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          el.classList.add('about-fade--visible');
          io.unobserve(el);
        }
      },
      { threshold: 0.12 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return <div ref={ref} className={`about-fade ${className}`}>{children}</div>;
}

/* ────────────────────────────────────────
   Decorative leaf SVG
   ──────────────────────────────────────── */
function LeafDeco({ pos }: { pos: 'tr' | 'bl' }) {
  return (
    <svg className={`about-leaf-deco about-leaf-deco--${pos}`} viewBox="0 0 200 200" fill="none">
      <path d="M100 10C100 10 30 60 20 130C10 200 100 190 100 190C100 190 190 200 180 130C170 60 100 10 100 10Z" fill="#1B6B3A" />
      <path d="M100 10C100 10 100 100 100 190" stroke="#8BC34A" strokeWidth="2" opacity="0.5" />
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
    title: locale === 'zh' ? '关于 FoodEra' : 'About FoodEra',
    description:
      locale === 'zh'
        ? 'FoodEra 致力于将越南优质农产品带向全球市场。'
        : 'FoodEra — professional sourcing partner & exporter based in Vietnam, bridging local producers and global markets.',
    canonicalUrl: `${BASE_URL}/about`,
    ogUrl: `${BASE_URL}/about`,
  });

  return (
    <div className="bg-white min-h-screen font-sans" style={{ paddingTop: '80px' }}>

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
                  <div className="who-blurb__icon"><Globe size={22} /></div>
                  <p className="who-blurb__text">
                    FoodEra is a <strong>professional sourcing partner &amp; exporter</strong> based in
                    Vietnam, bridging the gap between local producers and global markets.
                  </p>
                </div>

                <div className="who-blurb">
                  <div className="who-blurb__icon"><Handshake size={22} /></div>
                  <p className="who-blurb__text">
                    We work with <strong>multiple qualified suppliers</strong>, allowing us to
                    provide <strong>flexible sourcing solutions</strong>, adapt to <strong>different
                      specifications</strong>, and maintain <strong>stable supply</strong> for
                    international buyers.
                  </p>
                </div>

                <div className="who-features">
                  {[
                    { icon: <Handshake size={18} />, title: 'Reliable Partner', desc: 'Long-term cooperation based on trust.' },
                    { icon: <ShieldCheck size={18} />, title: 'Quality Focused', desc: 'Committed to consistent quality and compliance.' },
                    { icon: <Leaf size={18} />, title: 'Sustainable Mindset', desc: 'Supporting responsible sourcing and growth.' },
                    { icon: <Globe size={18} />, title: 'Global Reach', desc: 'Delivering value to markets worldwide.' },
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
                <img src="/media/about/hero-agriculture.webp" alt="Vietnamese agriculture" loading="eager" />
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
                <img src="/media/about/rice-field-story.webp" alt="Vietnamese rice field" loading="lazy" />
              </div>

              <div className="story-content">
                <h2>Our Story</h2>

                <div className="story-timeline">
                  <div className="story-item">
                    <div className="story-item__dot"><Sprout size={14} /></div>
                    <h3 className="story-item__title">FoodEra was built on a simple realization</h3>
                    <ul className="story-item__list">
                      <li>Vietnam has strong agricultural production, but connecting that supply to international markets is not always straightforward.</li>
                      <li>Buyers often face challenges in consistency, traceability, and reliable execution. At the same time, many farmers and processors lack direct access to global markets.</li>
                    </ul>
                  </div>

                  <div className="story-item">
                    <div className="story-item__dot"><Handshake size={14} /></div>
                    <h3 className="story-item__title">We saw an opportunity to bridge this gap</h3>
                    <ul className="story-item__list">
                      <li>From the beginning, FoodEra has focused on working closely with both state and private partners — from farms to processing facilities — to build a structured and dependable supply chain.</li>
                      <li>This approach allows us to not only match product specifications and volumes, but also ensure better coordination, transparency, and stability across each shipment.</li>
                      <li>Sustainability, traceability, and quality assurance are not just commitments — they are built into how we operate.</li>
                    </ul>
                  </div>

                  <div className="story-item">
                    <div className="story-item__dot"><TrendingUp size={14} /></div>
                    <h3 className="story-item__title">Looking ahead</h3>
                    <ul className="story-item__list">
                      <li>We believe that in agricultural trade, long-term success is not driven by price alone, but by consistency, trust, and the ability to deliver as promised.</li>
                      <li>Today, FoodEra continues to grow with the same mindset: to be a reliable sourcing partner for buyers who value stability, clarity, and long-term cooperation.</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ═══════════════════════════════════════
          SECTION 3 — What We Do
          ═══════════════════════════════════════ */}
      <section className="about-section" id="what-we-do">
        <LeafDeco pos="tr" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <FadeIn>
            <Heading title="What We Do" subtitle="Delivering quality, reliability, and trust at every step" />

            <div className="services-grid">
              {[
                {
                  icon: <Sprout size={28} />,
                  cls: 'service-card__icon--green',
                  title: 'Sourcing',
                  num: '01',
                  desc: 'Partnering with qualified suppliers, both state & private companies, to ensure a stable supply and flexible sourcing solutions.',
                },
                {
                  icon: <ClipboardCheck size={28} />,
                  cls: 'service-card__icon--dark',
                  title: 'Quality Control',
                  num: '02',
                  desc: 'Conducting pre-shipment inspections to ensure product consistency and specification compliance.',
                },
                {
                  icon: <Truck size={28} />,
                  cls: 'service-card__icon--lime',
                  title: 'Logistics',
                  num: '03',
                  desc: 'Managing documentation and shipment to ensure smooth, efficient, and reliable delivery.',
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
          SECTION 4 — Mission & Vision
          ═══════════════════════════════════════ */}
      <section className="about-section about-section--alt" id="mission-vision">
        <LeafDeco pos="bl" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <FadeIn>
            <div className="mv-header">
              <h2>Our Mission<br />&amp; Vision</h2>
              <div className="mv-header__bar" />
              <p>Committed to quality, reliability, and long-term partnerships.</p>
            </div>

            <div className="mv-cards">
              <div className="mv-card">
                <div className="mv-card__icon"><Target size={22} /></div>
                <h3 className="mv-card__title">Mission</h3>
                <ul className="mv-card__list">
                  <li><ShieldCheck size={15} color="#1B6B3A" /> Deliver consistent quality aligned with buyer requirements</li>
                  <li><ShieldCheck size={15} color="#1B6B3A" /> Support buyers with flexible sourcing and clear communication</li>
                  <li><ShieldCheck size={15} color="#1B6B3A" /> Build long-term cooperation based on trust and execution</li>
                </ul>
              </div>

              <div className="mv-card">
                <div className="mv-card__icon"><Eye size={22} /></div>
                <h3 className="mv-card__title">Vision</h3>
                <p className="mv-card__text">
                  To become a trusted sourcing partner connecting Vietnam's agricultural products to global markets.
                </p>
              </div>
            </div>

            <div className="mv-values">
              {[
                { icon: <Handshake size={20} />, title: 'Trust', desc: 'Building reliable relationships' },
                { icon: <Gem size={20} />, title: 'Quality', desc: 'Ensuring excellence in every step' },
                { icon: <Globe size={20} />, title: 'Growth', desc: 'Growing together for a sustainable future' },
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
          SECTION 5 — Supply Chain Management
          ═══════════════════════════════════════ */}
      <section className="about-section" id="supply-chain">
        <LeafDeco pos="tr" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <FadeIn>
            <Heading
              title="Supply Chain Management"
              subtitle="From farm to global market – managed with care, delivered with trust"
            />

            <div className="supply-flow">
              {[
                { icon: <Sprout size={26} />, num: '01', title: 'Farm', desc: 'Sourcing high-quality raw materials from trusted farms.' },
                { icon: <Factory size={26} />, num: '02', title: 'Processing', desc: 'Ensuring cleanliness, safety, and efficiency through modern processing.' },
                { icon: <ShieldCheck size={26} />, num: '03', title: 'QC', desc: 'Strict quality control at every step to meet international standards.' },
                { icon: <PackageCheck size={26} />, num: '04', title: 'Packing', desc: 'Careful packing to protect product quality and ensure safety during transit.' },
                { icon: <Ship size={26} />, num: '05', title: 'Export', desc: 'Timely delivery to global markets with complete documentation and reliable logistics.' },
              ].flatMap((step, i, arr) => {
                const el = (
                  <div key={step.title} className="supply-step">
                    <div className="supply-step__badge">{step.num}</div>
                    <div className="supply-step__circle">{step.icon}</div>
                    <h3 className="supply-step__title">{step.title}</h3>
                    <p className="supply-step__desc">{step.desc}</p>
                  </div>
                );
                return i < arr.length - 1 ? [el, <div key={`c${i}`} className="supply-connector" />] : [el];
              })}
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ═══════════════════════════════════════
          SECTION 6 — Quality Control
          ═══════════════════════════════════════ */}
      <section className="about-section about-section--alt" id="quality-control">
        <LeafDeco pos="bl" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <FadeIn>
            <Heading title="Quality Control" />

            <div className="qc-grid">
              {[
                { num: '01', icon: <ClipboardCheck size={18} />, title: 'Pre-shipment inspection', desc: 'by third-party (SGS, Vinacontrol)' },
                { num: '02', icon: <FileCheck size={18} />, title: 'Specification compliance monitoring', desc: '' },
                { num: '03', icon: <Droplet size={18} />, title: 'Moisture, grading, and foreign matter control', desc: '' },
                { num: '04', icon: <MapPin size={18} />, title: 'Traceability from farm to port', desc: '' },
              ].map((item) => (
                <div key={item.num} className="qc-card">
                  <div className="qc-card__badge">{item.num}</div>
                  <div>
                    <div className="qc-card__title">{item.title}</div>
                    {item.desc && <div className="qc-card__desc">{item.desc}</div>}
                  </div>
                </div>
              ))}
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ═══════════════════════════════════════
          SECTION 7 — International Standards
          ═══════════════════════════════════════ */}
      <section className="about-section" id="international-standards">
        <LeafDeco pos="tr" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <FadeIn>
            <Heading
              title="International Standard"
              subtitle="Committed to global quality, food safety, and sustainable development"
            />

            <div className="standards-grid">
              {[
                { img: '/media/about/cert-iso22000.webp', title: 'ISO 22000', desc: 'Food Safety Management System' },
                { img: '/media/about/cert-haccp.avif', title: 'HACCP', desc: 'Hazard Analysis and Critical Control Points' },
                { img: '/media/about/cert-rainforest.webp', title: 'Rainforest Alliance', desc: 'Sustainable Agriculture & Responsible Sourcing' },
                { img: '/media/about/cert-fda.webp', title: 'FDA', desc: 'U.S. Food and Drug Administration' },
                { img: '/media/about/cert-4c.webp', title: '40 Years of Experience', desc: 'Delivering Quality Products to Global Markets' },
              ].map((s) => (
                <div key={s.title} className="standard-card">
                  <img className="standard-card__img" src={s.img} alt={s.title} loading="lazy" />
                  <div className="standard-card__title">{s.title}</div>
                  <div className="standard-card__desc">{s.desc}</div>
                </div>
              ))}
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ═══════════════════════════════════════
          SECTION 8 — Product Portfolio
          ═══════════════════════════════════════ */}
      <section className="about-section about-section--alt" id="product-portfolio" style={{ paddingBottom: '5rem' }}>
        <LeafDeco pos="bl" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <FadeIn>
            <Heading
              title="Product Portfolio"
              subtitle="Quality agricultural products, carefully sourced and processed to meet global standards."
            />

            <div className="portfolio-grid">
              {[
                {
                  img: '/media/migrated/products/33b07f55-c6e6-493b-9de3-67d1c6674399-9e43d8f3be87.webp',
                  name: 'Rice',
                  desc: 'Premium-quality rice with excellent grain quality, aroma, and taste.',
                },
                {
                  img: '/media/migrated/products/9a8cac7b-0a16-4d78-924e-404902dcd52c-3f1f026fc1bb.webp',
                  name: 'Coffee',
                  desc: 'Sustainably sourced coffee beans with rich flavor and consistent quality.',
                },
                {
                  img: '/media/migrated/products/cashew-ww240-0c42769fe4d5.webp',
                  name: 'Cashew',
                  desc: 'High-quality cashews, carefully processed for great taste and freshness.',
                },
                {
                  img: '/media/pepper/pure-pepper.webp',
                  name: 'Pepper',
                  desc: 'Premium black pepper with strong aroma and consistent pungency.',
                },
              ].map((p) => (
                <div key={p.name} className="portfolio-card">
                  <div className="portfolio-card__img-wrap">
                    <img src={p.img} alt={p.name} loading="lazy" />
                  </div>
                  <div className="portfolio-card__body">
                    <h3 className="portfolio-card__name">{p.name}</h3>
                    <p className="portfolio-card__desc">{p.desc}</p>
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
