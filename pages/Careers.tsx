import React, { useEffect, useRef, useState } from 'react';
import {
  Globe, TrendingUp, Heart, Sprout, MapPin, Briefcase,
  Upload, Send, CheckCircle, Search, Mail, Phone, Linkedin, Facebook, MapPinned, FileDown
} from 'lucide-react';
import { useLocale } from '../context/LocaleContext';
import { useData } from '../context/DataContext';
import { getCareersContent, type CareersContent, type CareersBenefit } from '../lib/careersContent';
import { useDocumentMeta, BASE_URL } from '../lib/useDocumentMeta';
import '../components/careers.css';

/* ────────────────────────────────────────
   Icon resolver (maps string → Lucide component)
   ──────────────────────────────────────── */
const ICON_MAP: Record<string, React.FC<{ size?: number }>> = {
  Globe,
  TrendingUp,
  Heart,
  Sprout,
};

const resolveIcon = (name: string, size = 24) => {
  const Icon = ICON_MAP[name] || Globe;
  return <Icon size={size} />;
};

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
          el.classList.add('careers-fade--visible');
          io.unobserve(el);
        }
      },
      { threshold: 0.1 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return <div ref={ref} className={`careers-fade ${className}`}>{children}</div>;
}

/* ────────────────────────────────────────
   Position type badge class
   ──────────────────────────────────────── */
const getBadgeClass = (type: string) => {
  const lower = type.toLowerCase();
  if (lower.includes('thực tập') || lower.includes('intern')) return 'careers-pos-card__badge--intern';
  if (lower.includes('bán') || lower.includes('part')) return 'careers-pos-card__badge--pt';
  return 'careers-pos-card__badge--ft';
};

/* ══════════════════════════════════════════
   CAREERS PAGE — VNG-style Layout
   ══════════════════════════════════════════ */
const Careers: React.FC = () => {
  const { locale } = useLocale();
  const { activeCareers } = useData();
  const content: CareersContent = getCareersContent(locale);
  const formRef = useRef<HTMLElement>(null);

  // Form state
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    position: '',
    message: '',
  });
  const [cvFile, setCvFile] = useState<File | null>(null);
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useDocumentMeta({
    title: locale === 'zh' ? 'Tuyển dụng — FoodEra' : 'Careers — FoodEra',
    description:
      locale === 'zh'
        ? 'Gia nhập đội ngũ FoodEra — tuyển dụng các vị trí kinh doanh, logistics, QC và marketing.'
        : 'Join the FoodEra team — open positions in sales, logistics, quality control, and marketing.',
    canonicalUrl: `${BASE_URL}/careers`,
    ogUrl: `${BASE_URL}/careers`,
  });

  // Use DB careers if available, otherwise fall back to static content
  const dbPositions = activeCareers.map((c) => ({
    id: c.id,
    title: c.title,
    department: c.department,
    location: c.location,
    type: c.type as any,
    description: c.description,
    requirements: c.requirements,
    isActive: c.isActive,
    jdFileUrl: c.jdFileUrl || '',
    jdFileName: c.jdFileName || '',
  }));
  const activePositions = dbPositions.length > 0
    ? dbPositions
    : content.positions.items.filter((p) => p.isActive);

  const scrollToForm = (positionTitle?: string) => {
    if (positionTitle) {
      setFormData((prev) => ({ ...prev, position: positionTitle }));
    }
    formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    if (file && file.size > 5 * 1024 * 1024) {
      alert(locale === 'zh' ? 'File quá lớn. Tối đa 5MB.' : 'File too large. Max 5MB.');
      return;
    }
    setCvFile(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.fullName || !formData.email || !formData.position || !cvFile) return;

    setIsSubmitting(true);
    // Simulate submission — can be wired to a real API later
    await new Promise<void>((resolve) => setTimeout(resolve, 1500));
    setFormSubmitted(true);
    setIsSubmitting(false);
  };

  const isVi = locale !== 'en';

  return (
    <div className="bg-white min-h-screen font-sans">
      {/* ═══════════════════════════════════════
          SECTION 1 — Hero Banner (VNG-style split)
          ═══════════════════════════════════════ */}
      <section className="careers-hero" id="careers-hero">
        <div className="careers-hero__inner">
          {/* Left: Title + Search */}
          <div className="careers-hero__text">
            <p className="careers-hero__title-line1">{content.hero.title}</p>
            <span className="careers-hero__title-line2">{content.hero.subtitle}</span>
            <div className="careers-hero__search">
              <input
                type="text"
                className="careers-hero__search-input"
                placeholder={isVi ? 'Bạn đang tìm kiếm công việc gì?' : 'What job are you looking for?'}
                readOnly
                onClick={() => {
                  const posEl = document.getElementById('careers-positions');
                  posEl?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }}
              />
              <button
                className="careers-hero__search-btn"
                type="button"
                onClick={() => {
                  const posEl = document.getElementById('careers-positions');
                  posEl?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }}
              >
                <Search size={18} />
              </button>
            </div>
          </div>

          {/* Right: Hero Image */}
          <div className="careers-hero__image">
            <img
              src="/media/careers/hero-bg.webp"
              alt={isVi ? 'Đội ngũ FoodEra' : 'FoodEra Team'}
              style={{ backgroundColor: '#e5e7eb' }}
              onError={(e) => {
                // Fallback: hide broken image and show solid color
                (e.currentTarget as HTMLImageElement).style.display = 'none';
              }}
            />
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════
          SECTION 2 — Benefits (VNG: heading left, list right)
          ═══════════════════════════════════════ */}
      <section className="careers-benefits" id="careers-benefits">
        <div className="max-w-[1296px] mx-auto px-5 sm:px-12">
          <FadeIn>
            <div className="careers-benefits__layout">
              {/* Left heading */}
              <div className="careers-benefits__heading">
                <p className="careers-benefits__label">{isVi ? 'PHÚC LỢI' : 'BENEFITS'}</p>
                <h2 className="careers-benefits__title">{content.benefits.heading}</h2>
              </div>

              {/* Right: benefit items */}
              <div className="careers-benefits__list">
                {content.benefits.items.map((benefit: CareersBenefit) => (
                  <div key={benefit.title} className="careers-benefit-item">
                    <div className="careers-benefit-item__icon">
                      {resolveIcon(benefit.icon, 26)}
                    </div>
                    <div>
                      <h4 className="careers-benefit-item__title">{benefit.title}</h4>
                      <p className="careers-benefit-item__desc">{benefit.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ═══════════════════════════════════════
          SECTION 3 — About / Intro (50/50 split)
          ═══════════════════════════════════════ */}
      <section className="careers-about" id="careers-about">
        <div
          className="careers-about__image"
          style={{
            backgroundImage: "url('/media/careers/about-bg.webp?v=2')",
            backgroundColor: '#e5e7eb',
          }}
        />
        <div className="careers-about__content">
          <h2 className="careers-about__title">{content.intro.heading}</h2>
          <p className="careers-about__block-text">{content.intro.description}</p>

          <p className="careers-about__block-title">
            {isVi ? 'Sứ mệnh' : 'Mission'}
          </p>
          <p className="careers-about__block-text">
            {isVi
              ? 'Đảm bảo chất lượng, tính bền vững và độ tin cậy trong mỗi lô hàng xuất khẩu.'
              : 'Ensuring quality, sustainability, and reliability in every export shipment.'}
          </p>
        </div>
      </section>

      {/* ═══════════════════════════════════════
          SECTION 4 — Open Positions
          ═══════════════════════════════════════ */}
      <section className="careers-positions" id="careers-positions">
        <div className="max-w-[1296px] mx-auto px-5 sm:px-12">
          <FadeIn>
            <div className="careers-positions__header">
              <div>
                <p className="careers-positions__label">
                  {isVi ? 'TUYỂN DỤNG' : 'OPEN POSITIONS'}
                </p>
                <h2 className="careers-positions__title">{content.positions.heading}</h2>
              </div>
              <p className="careers-positions__count">
                {activePositions.length} {isVi ? 'vị trí đang mở' : 'positions available'}
              </p>
            </div>

            <div className="careers-positions__grid">
              {activePositions.length > 0 ? (
                activePositions.map((position) => (
                  <div key={position.id} className="careers-pos-card">
                    <div className="careers-pos-card__top">
                      <h3 className="careers-pos-card__title">{position.title}</h3>
                      <span className={`careers-pos-card__badge ${getBadgeClass(position.type)}`}>
                        {position.type}
                      </span>
                    </div>
                    <div className="careers-pos-card__meta">
                      <span className="careers-pos-card__meta-tag">
                        <Briefcase size={13} />
                        {position.department}
                      </span>
                      <span className="careers-pos-card__meta-tag">
                        <MapPin size={13} />
                        {position.location}
                      </span>
                    </div>
                    <p className="careers-pos-card__desc">{position.description}</p>
                    {position.jdFileUrl && (
                      <a
                        href={position.jdFileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="careers-pos-card__jd-link"
                      >
                        <FileDown size={14} />
                        {isVi ? 'Xem JD chi tiết' : 'View Job Description'}
                      </a>
                    )}
                    <button
                      className="careers-pos-card__apply"
                      onClick={() => scrollToForm(position.title)}
                      type="button"
                    >
                      {content.positions.applyButton}
                      <Send size={14} />
                    </button>
                  </div>
                ))
              ) : (
                <div className="careers-positions__empty">
                  {content.positions.emptyMessage}
                </div>
              )}
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ═══════════════════════════════════════
          SECTION 5 — Job Alert CTA Banner
          ═══════════════════════════════════════ */}
      <div className="careers-alert">
        <FadeIn>
          <div className="careers-alert__card">
            <div className="careers-alert__text">
              <h2 className="careers-alert__title">
                {isVi ? 'Tạo thông báo việc làm' : 'Create Job Alert'}
              </h2>
              <p className="careers-alert__desc">
                {isVi ? 'Nhận thông báo việc làm mới nhất tại FoodEra.' : 'Get notified about new positions at FoodEra.'}
              </p>
            </div>
            <div className="careers-alert__form">
              <input
                type="email"
                className="careers-alert__input"
                placeholder={isVi ? 'Nhập địa chỉ email' : 'Enter your email address'}
              />
              <button className="careers-alert__submit" type="button">
                {isVi ? 'ĐĂNG KÝ' : 'SUBSCRIBE'}
              </button>
            </div>
          </div>
        </FadeIn>
      </div>

      {/* ═══════════════════════════════════════
          SECTION 6 — Application Form
          ═══════════════════════════════════════ */}
      <section className="careers-form-section" id="careers-form" ref={formRef}>
        <div className="max-w-[1296px] mx-auto px-5 sm:px-12">
          <FadeIn>
            <div className="careers-form-heading">
              <p className="careers-form-heading__label">
                {isVi ? 'ỨNG TUYỂN' : 'APPLICATION'}
              </p>
              <h2 className="careers-form-heading__title">{content.form.heading}</h2>
            </div>

            <form className="careers-form" onSubmit={handleSubmit}>
              {!formSubmitted ? (
                <div className="careers-form__grid">
                  <div className="careers-form__field">
                    <label className="careers-form__label" htmlFor="careers-fullName">
                      {content.form.fields.fullName}
                    </label>
                    <input
                      id="careers-fullName"
                      className="careers-form__input"
                      type="text"
                      name="fullName"
                      value={formData.fullName}
                      onChange={handleInputChange}
                      required
                    />
                  </div>

                  <div className="careers-form__field">
                    <label className="careers-form__label" htmlFor="careers-email">
                      {content.form.fields.email}
                    </label>
                    <input
                      id="careers-email"
                      className="careers-form__input"
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      required
                    />
                  </div>

                  <div className="careers-form__field">
                    <label className="careers-form__label" htmlFor="careers-phone">
                      {content.form.fields.phone}
                    </label>
                    <input
                      id="careers-phone"
                      className="careers-form__input"
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                    />
                  </div>

                  <div className="careers-form__field">
                    <label className="careers-form__label" htmlFor="careers-position">
                      {content.form.fields.position}
                    </label>
                    <select
                      id="careers-position"
                      className="careers-form__select"
                      name="position"
                      value={formData.position}
                      onChange={handleInputChange}
                      required
                    >
                      <option value="">{content.form.fields.positionPlaceholder}</option>
                      {activePositions.map((p) => (
                        <option key={p.id} value={p.title}>{p.title}</option>
                      ))}
                    </select>
                  </div>

                  <div className="careers-form__field careers-form__field--full">
                    <label className="careers-form__label">{content.form.fields.cv}</label>
                    <div className="careers-form__file-zone">
                      <input
                        type="file"
                        accept=".pdf,.doc,.docx"
                        onChange={handleFileChange}
                        required
                      />
                      <div className="careers-form__file-icon">
                        <Upload size={26} />
                      </div>
                      <p className="careers-form__file-hint">{content.form.fields.cvHint}</p>
                      {cvFile && (
                        <p className="careers-form__file-name">📎 {cvFile.name}</p>
                      )}
                    </div>
                  </div>

                  <div className="careers-form__field careers-form__field--full">
                    <label className="careers-form__label" htmlFor="careers-message">
                      {content.form.fields.message}
                    </label>
                    <textarea
                      id="careers-message"
                      className="careers-form__textarea"
                      name="message"
                      value={formData.message}
                      onChange={handleInputChange}
                      placeholder={content.form.fields.messagePlaceholder}
                    />
                  </div>

                  <button
                    type="submit"
                    className="careers-form__submit"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? '...' : content.form.fields.submit}
                  </button>
                </div>
              ) : (
                <div className="careers-form__success">
                  <div className="careers-form__success-icon">
                    <CheckCircle size={26} />
                  </div>
                  <p className="careers-form__success-text">{content.form.successMessage}</p>
                </div>
              )}
            </form>
          </FadeIn>
        </div>
      </section>

      {/* ═══════════════════════════════════════
          SECTION 7 — Contact (VNG-style circle icons)
          ═══════════════════════════════════════ */}
      <section className="careers-contact" id="careers-contact">
        <div className="max-w-[1296px] mx-auto px-5 sm:px-12">
          <FadeIn>
            <div className="careers-contact__layout">
              <div className="careers-contact__heading">
                <p className="careers-contact__label">
                  {isVi ? 'Chúng tôi luôn lắng nghe bạn' : "We'd love to hear from you"}
                </p>
                <h2 className="careers-contact__title">
                  {isVi ? 'Hãy liên lạc với chúng tôi' : 'Get in Touch'}
                </h2>
              </div>

              <div className="careers-contact__grid">
                <a
                  href="https://maps.google.com/?q=17+Dinh+Tien+Hoang,+District+1,+HCMC"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="careers-contact__item"
                >
                  <div className="careers-contact__circle">
                    <MapPinned size={20} />
                  </div>
                  <span className="careers-contact__item-label">FoodEra Office</span>
                </a>

                <a
                  href="tel:+84964791902"
                  className="careers-contact__item"
                >
                  <div className="careers-contact__circle">
                    <Phone size={20} />
                  </div>
                  <span className="careers-contact__item-label">+84 964 791 902</span>
                </a>

                <a
                  href={`mailto:${content.cta.email}`}
                  className="careers-contact__item"
                >
                  <div className="careers-contact__circle">
                    <Mail size={20} />
                  </div>
                  <span className="careers-contact__item-label">{content.cta.email}</span>
                </a>

                <a
                  href="https://www.facebook.com/foodera.vn"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="careers-contact__item"
                >
                  <div className="careers-contact__circle">
                    <Facebook size={20} />
                  </div>
                  <span className="careers-contact__item-label">FoodEra</span>
                </a>

                <a
                  href="https://www.linkedin.com/company/foodera"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="careers-contact__item"
                >
                  <div className="careers-contact__circle">
                    <Linkedin size={20} />
                  </div>
                  <span className="careers-contact__item-label">FoodEra Co.</span>
                </a>

                <a
                  href="https://www.foodera.vn"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="careers-contact__item"
                >
                  <div className="careers-contact__circle">
                    <Globe size={20} />
                  </div>
                  <span className="careers-contact__item-label">www.foodera.vn</span>
                </a>
              </div>
            </div>
          </FadeIn>
        </div>
      </section>
    </div>
  );
};

export default Careers;
