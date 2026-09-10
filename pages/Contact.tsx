import React, { useEffect, useState } from "react";
import {
  Mail,
  Phone,
  Send,
  MapPin,
  Linkedin,
  Facebook,
  MessageCircle,
  User,
  X,
} from "lucide-react";
import { useLocale } from "../context/LocaleContext";
import { useDocumentMeta, BASE_URL } from "../lib/useDocumentMeta";
import { preserveVietnamesePlaceNamesDeep } from "../lib/preserveVietnamesePlaceNames";

const WhatsAppIcon: React.FC<{ size?: number }> = ({ size = 22 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="currentColor"
    aria-hidden="true"
  >
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.148-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347M12.05 21.785h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.436 9.884-9.885 9.884m8.412-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.86 11.86 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.481-8.413" />
  </svg>
);

const Contact: React.FC = () => {
  const { locale } = useLocale();
  const [activeQr, setActiveQr] = useState<"whatsapp" | "wechat" | null>(null);

  useEffect(() => {
    if (!activeQr) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setActiveQr(null);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activeQr]);

  useDocumentMeta({
    title: locale === "zh" ? "联系我们" : "Contact Us",
    description:
      locale === "zh"
        ? "联系 FoodEra 出口团队，咨询大米、咖啡、腰果出口合作事宜。24/7 全球出口热线与 WhatsApp 支持。"
        : "Contact FoodEra export specialists for rice, coffee & cashew import inquiries. 24/7 export hotline and WhatsApp support.",
    canonicalUrl: `${BASE_URL}/contact`,
    ogUrl: `${BASE_URL}/contact`,
  });
  const enCopy = {
    heroTitle: "Connect With Us",
    heroDesc:
      "Discuss your import requirements with our dedicated B2B export specialists.",
    channelsTitle: "Get in Touch",
    channelsSubtitle: "Reach us through whichever channel works best for you.",
    keyContactsTitle: "Key Contacts",
    keyContactsSubtitle: "Reach out directly to our export specialists.",
    emailLabel: "Email",
    hotlineLabel: "Hotline",
    whatsappLabel: "WhatsApp",
    wechatLabel: "WeChat",
    linkedinLabel: "LinkedIn",
    facebookLabel: "Facebook",
    sendEmail: "Send Email",
    callNow: "Call Now",
    scanToChat: "Scan to chat on WhatsApp",
    scanToAddWechat: "Scan to add on WeChat",
    viewQrCode: "View QR Code",
    closeQrCode: "Close",
    openWhatsapp: "Open WhatsApp",
    visitPage: "Visit Page",
    inquiryTitle: "Direct Export Inquiry",
    inquiryDesc:
      "Have a specific requirement? Email our export team directly and we will respond shortly.",
    mapTitle: "FoodEra Headquarters Location",
    officesTitle: "Our Global Offices",
    hqLabel: "Headquarters · Vietnam",
    hqAddress: "No. 6 Mac Dinh Chi St, Sai Gon Ward, Ho Chi Minh City, Vietnam",
    repOfficeLabel: "Representative Office · Australia",
    repOfficeAddress: "269 North Terrace, Adelaide SA 5000, Australia",
  };

  const zhCopy = {
    heroTitle: "联系我们",
    heroDesc: "与我们的 B2B 出口专员沟通您的进口需求。",
    channelsTitle: "联系我们",
    channelsSubtitle: "选择最适合您的联系方式与我们沟通。",
    keyContactsTitle: "主要联系人",
    keyContactsSubtitle: "直接联系我们的出口专员。",
    emailLabel: "邮箱",
    hotlineLabel: "热线电话",
    whatsappLabel: "WhatsApp",
    wechatLabel: "微信",
    linkedinLabel: "LinkedIn",
    facebookLabel: "Facebook",
    sendEmail: "发送邮件",
    callNow: "立即致电",
    scanToChat: "扫码添加 WhatsApp",
    scanToAddWechat: "扫码添加微信",
    viewQrCode: "查看二维码",
    closeQrCode: "关闭",
    openWhatsapp: "打开 WhatsApp",
    visitPage: "访问主页",
    inquiryTitle: "直接出口咨询",
    inquiryDesc: "有具体需求？直接发邮件给我们的出口团队，我们会尽快回复。",
    mapTitle: "FoodEra 总部位置",
    officesTitle: "全球办公室",
    hqLabel: "总部 · 越南",
    hqAddress: "越南胡志明市西贡坊麦廷芝街6号",
    repOfficeLabel: "代表处 · 澳大利亚",
    repOfficeAddress: "269 North Terrace, Adelaide SA 5000, Australia",
  };

  const rawCopy = locale === "zh" ? zhCopy : enCopy;
  const copy =
    locale === "zh" ? preserveVietnamesePlaceNamesDeep(rawCopy) : rawCopy;

  const keyContacts = [
    {
      name: "Mr. Brian Ho",
      role: locale === "zh" ? "国际销售总监" : "General Manager",
      email: "Brian.ho@foodera.vn",
      whatsapp: "84935587888",
      whatsappDisplay: "+84 935 587 888",
      photo: "/media/about/team-nghia-ho.jpg",
    },
    {
      name: "Ms. Dung Nguyen",
      role: locale === "zh" ? "业务拓展主管" : "Market Development Executive",
      email: "sales1@foodera.vn",
      photo: "/media/about/team-dung-nguyen.jpg",
    },
    {
      name: "Ms. Tu Phuong",
      role: locale === "zh" ? "业务拓展主管" : "Market Development Executive",
      email: "sales2@foodera.vn",
      photo: "/media/about/team-tu-phuong.jpg",
    },
  ];

  return (
    <div className="bg-white min-h-screen">
      <div className="bg-foodera-forest py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-5xl md:text-6xl font-black text-white mb-6">
            {copy.heroTitle}
          </h1>
          <p className="text-xl text-green-100 max-w-2xl mx-auto">
            {copy.heroDesc}
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-16 pb-24">
        {/* Contact Channels — prominent, above the fold */}
        <div className="mb-12">
          <div className="bg-white rounded-[2rem] shadow-2xl border border-gray-100 p-6 md:p-8">
            <h2 className="text-xl md:text-2xl font-black text-gray-900 mb-1">
              {copy.channelsTitle}
            </h2>
            <p className="text-gray-500 font-medium text-sm mb-6">
              {copy.channelsSubtitle}
            </p>

            <div className="grid grid-cols-3 lg:grid-cols-6 gap-3">
              {/* Email */}
              <div className="flex flex-col items-center text-center p-4 rounded-xl border border-gray-100 hover:border-foodera-forest/30 hover:shadow-md transition-all">
                <div className="w-10 h-10 rounded-lg bg-foodera-forest text-white flex items-center justify-center mb-3">
                  <Mail size={16} />
                </div>
                <h3 className="text-xs font-black text-gray-900">
                  {copy.emailLabel}
                </h3>
                <p className="text-[10px] text-gray-500 mb-3 truncate max-w-full">
                  export@foodera.vn
                </p>
                <a
                  href="mailto:export@foodera.vn"
                  className="mt-auto text-[9px] font-black text-foodera-forest uppercase tracking-widest hover:text-foodera-lime transition-colors"
                >
                  {copy.sendEmail}
                </a>
              </div>

              {/* Hotline */}
              <div className="flex flex-col items-center text-center p-4 rounded-xl border border-gray-100 hover:border-foodera-forest/30 hover:shadow-md transition-all">
                <div className="w-10 h-10 rounded-lg bg-foodera-forest text-white flex items-center justify-center mb-3">
                  <Phone size={16} />
                </div>
                <h3 className="text-xs font-black text-gray-900">
                  {copy.hotlineLabel}
                </h3>
                <p className="text-[10px] text-gray-500 mb-3">
                  +84 964 791 902
                </p>
                <a
                  href="tel:+84964791902"
                  className="mt-auto text-[9px] font-black text-foodera-forest uppercase tracking-widest hover:text-foodera-lime transition-colors"
                >
                  {copy.callNow}
                </a>
              </div>

              {/* LinkedIn */}
              <div className="flex flex-col items-center text-center p-4 rounded-xl border border-gray-100 hover:border-foodera-forest/30 hover:shadow-md transition-all">
                <div className="w-10 h-10 rounded-lg bg-foodera-forest text-white flex items-center justify-center mb-3">
                  <Linkedin size={16} />
                </div>
                <h3 className="text-xs font-black text-gray-900">
                  {copy.linkedinLabel}
                </h3>
                <p className="text-[10px] text-gray-500 mb-3 truncate max-w-full">
                  FoodEra Vietnam
                </p>
                <a
                  href="https://www.linkedin.com/company/fooderavn/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-auto text-[9px] font-black text-foodera-forest uppercase tracking-widest hover:text-foodera-lime transition-colors"
                >
                  {copy.visitPage}
                </a>
              </div>

              {/* Facebook */}
              <div className="flex flex-col items-center text-center p-4 rounded-xl border border-gray-100 hover:border-foodera-forest/30 hover:shadow-md transition-all">
                <div className="w-10 h-10 rounded-lg bg-foodera-forest text-white flex items-center justify-center mb-3">
                  <Facebook size={16} />
                </div>
                <h3 className="text-xs font-black text-gray-900">
                  {copy.facebookLabel}
                </h3>
                <p className="text-[10px] text-gray-500 mb-3 truncate max-w-full">
                  FoodEraVietnam
                </p>
                <a
                  href="https://www.facebook.com/FoodEraVietnam"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-auto text-[9px] font-black text-foodera-forest uppercase tracking-widest hover:text-foodera-lime transition-colors"
                >
                  {copy.visitPage}
                </a>
              </div>

              {/* WhatsApp */}
              <div className="flex flex-col items-center text-center p-4 rounded-xl border border-gray-100 hover:border-foodera-forest/30 hover:shadow-md transition-all">
                <div className="w-10 h-10 rounded-lg bg-foodera-forest text-white flex items-center justify-center mb-3">
                  <WhatsAppIcon size={16} />
                </div>
                <h3 className="text-xs font-black text-gray-900">
                  {copy.whatsappLabel}
                </h3>
                <p className="text-[10px] text-gray-500 mb-3">
                  +84 935 587 888
                </p>
                <button
                  type="button"
                  onClick={() => setActiveQr("whatsapp")}
                  className="mt-auto text-[9px] font-black text-foodera-forest uppercase tracking-widest hover:text-foodera-lime transition-colors"
                >
                  {copy.viewQrCode}
                </button>
              </div>

              {/* WeChat */}
              <div
                id="wechat"
                className="scroll-mt-32 flex flex-col items-center text-center p-4 rounded-xl border border-gray-100 hover:border-foodera-forest/30 hover:shadow-md transition-all"
              >
                <div className="w-10 h-10 rounded-lg bg-foodera-forest text-white flex items-center justify-center mb-3">
                  <MessageCircle size={16} />
                </div>
                <h3 className="text-xs font-black text-gray-900 mb-3">
                  {copy.wechatLabel}
                </h3>
                <button
                  type="button"
                  onClick={() => setActiveQr("wechat")}
                  className="mt-auto text-[9px] font-black text-foodera-forest uppercase tracking-widest hover:text-foodera-lime transition-colors"
                >
                  {copy.viewQrCode}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Key Contacts */}
        <div className="mb-16">
          <div className="bg-white rounded-[2rem] shadow-2xl border border-gray-100 p-8 md:p-10">
            <h2 className="text-2xl md:text-3xl font-black text-gray-900 mb-2">
              {copy.keyContactsTitle}
            </h2>
            <p className="text-gray-500 font-medium mb-8">
              {copy.keyContactsSubtitle}
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              {keyContacts.map((person) => (
                <div
                  key={person.email}
                  className="flex flex-col items-center text-center p-6 rounded-2xl border border-gray-100 hover:border-foodera-forest/30 hover:shadow-lg transition-all"
                >
                  <div className="w-24 h-24 rounded-full border-2 border-dashed border-foodera-forest/25 bg-green-50 text-foodera-forest flex items-center justify-center mb-4 overflow-hidden">
                    {person.photo ? (
                      <img
                        src={person.photo}
                        alt={person.name}
                        loading="lazy"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <User size={32} />
                    )}
                  </div>
                  <h3 className="text-base font-black text-gray-900">
                    {person.name}
                  </h3>
                  <p className="text-[10px] font-black text-foodera-forest uppercase tracking-widest mt-1 mb-4">
                    {person.role}
                  </p>
                  <div className="mt-auto flex flex-col gap-2 w-full">
                    <a
                      href={`mailto:${person.email}`}
                      className="text-xs font-bold text-gray-600 hover:text-foodera-forest transition-colors truncate"
                    >
                      {person.email}
                    </a>
                    {person.whatsapp && (
                      <a
                        href={`https://wa.me/${person.whatsapp}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center gap-1.5 text-xs font-black text-foodera-forest hover:text-foodera-lime transition-colors"
                      >
                        <WhatsAppIcon size={12} /> {person.whatsappDisplay}
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Direct Inquiry CTA */}
        <div className="bg-white p-10 md:p-14 rounded-2xl shadow-2xl border border-gray-50 text-center">
          <h2 className="text-3xl font-black text-gray-900 mb-4">
            {copy.inquiryTitle}
          </h2>
          <p className="text-gray-500 font-medium mb-8 max-w-xl mx-auto">
            {copy.inquiryDesc}
          </p>
          <a
            href="mailto:export@foodera.vn"
            className="inline-flex items-center justify-center gap-2 px-10 py-4 bg-foodera-forest text-white rounded-xl font-black uppercase tracking-widest text-sm hover:bg-foodera-forest/90 transition-all"
          >
            <Send size={18} /> {copy.sendEmail}
          </a>
        </div>

        {/* Our Global Offices */}
        <div className="mt-20">
          <h2 className="text-3xl font-black text-gray-900 mb-8">
            {copy.officesTitle}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-white p-8 rounded-2xl shadow-lg border border-gray-100">
              <div className="w-12 h-12 bg-green-50 text-foodera-forest rounded-xl flex items-center justify-center mb-6">
                <MapPin size={24} />
              </div>
              <p className="text-[10px] font-black text-foodera-forest uppercase tracking-widest mb-2">
                {copy.hqLabel}
              </p>
              <p className="text-lg font-bold text-gray-900 leading-snug">
                {copy.hqAddress}
              </p>
            </div>
            <div className="bg-white p-8 rounded-2xl shadow-lg border border-gray-100">
              <div className="w-12 h-12 bg-green-50 text-foodera-forest rounded-xl flex items-center justify-center mb-6">
                <MapPin size={24} />
              </div>
              <p className="text-[10px] font-black text-foodera-forest uppercase tracking-widest mb-2">
                {copy.repOfficeLabel}
              </p>
              <p className="text-lg font-bold text-gray-900 leading-snug">
                {copy.repOfficeAddress}
              </p>
            </div>
          </div>
        </div>

        {/* Interactive Google Map Section */}
        <div className="mt-20 h-80 sm:h-100 md:h-125 rounded-[2.5rem] overflow-hidden shadow-2xl border border-gray-100 bg-gray-50 relative group">
          <iframe
            src="https://www.google.com/maps?q=Vietnam+Food+Era+Company+Limited%2C+No.+6+Mac+Dinh+Chi+St%2C+Sai+Gon+Ward%2C+Ho+Chi+Minh+City%2C+Vietnam&output=embed"
            width="100%"
            height="100%"
            style={{ border: 0 }}
            allowFullScreen
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            className="transition-opacity duration-700 opacity-90 group-hover:opacity-100"
            title={copy.mapTitle}
          ></iframe>
        </div>
      </div>

      {/* QR Code Modal — WhatsApp / WeChat */}
      {activeQr && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <button
            type="button"
            aria-label={copy.closeQrCode}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setActiveQr(null)}
          />
          <div className="relative bg-white rounded-3xl shadow-2xl p-8 max-w-xs w-full text-center animate-in zoom-in-95 fade-in duration-200">
            <button
              type="button"
              onClick={() => setActiveQr(null)}
              aria-label={copy.closeQrCode}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 transition-colors"
            >
              <X size={20} />
            </button>

            <div className="w-12 h-12 rounded-xl bg-foodera-forest text-white flex items-center justify-center mx-auto mb-4">
              {activeQr === "whatsapp" ? (
                <WhatsAppIcon size={20} />
              ) : (
                <MessageCircle size={20} />
              )}
            </div>
            <h3 className="text-lg font-black text-gray-900 mb-1">
              {activeQr === "whatsapp" ? copy.whatsappLabel : copy.wechatLabel}
            </h3>
            {activeQr === "whatsapp" && (
              <p className="text-sm text-gray-500 font-bold mb-4">
                +84 935 587 888
              </p>
            )}

            <img
              src={
                activeQr === "whatsapp"
                  ? "/media/contact/whatsapp-qr.jpg"
                  : "/media/contact/wechat-qr.jpg"
              }
              alt={
                activeQr === "whatsapp" ? "WhatsApp QR code" : "WeChat QR code"
              }
              className={`w-48 h-48 mx-auto rounded-2xl border border-gray-100 object-cover ${activeQr === "whatsapp" ? "mt-0" : "mt-6"} mb-4`}
            />
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-5">
              {activeQr === "whatsapp" ? copy.scanToChat : copy.scanToAddWechat}
            </p>

            {activeQr === "whatsapp" && (
              <a
                href="https://wa.me/84935587888"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 w-full px-6 py-3 bg-foodera-forest text-white rounded-xl font-black uppercase tracking-widest text-xs hover:bg-foodera-forest/90 transition-all"
              >
                <WhatsAppIcon size={14} /> {copy.openWhatsapp}
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Contact;
