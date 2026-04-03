import React, { useMemo, useState } from 'react';
import { Mail, Phone, Send } from 'lucide-react';
import { api } from '../lib/apiClient';
import { useLocale } from '../context/LocaleContext';
import { preserveVietnamesePlaceNamesDeep } from '../lib/preserveVietnamesePlaceNames';

const Contact: React.FC = () => {
  const { locale } = useLocale();
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const defaultSubject = locale === 'zh' ? '大米出口咨询' : 'Rice Export Inquiry';
  const rawCopy = locale === 'zh'
    ? {
        required: '请填写所有必填字段。',
        failed: '发送失败，请稍后重试。',
        heroTitle: '联系我们',
        heroDesc: '与我们的 B2B 出口专员沟通您的进口需求。',
        emailChannels: '邮箱渠道',
        exportInquiries: '全球出口咨询：',
        emailNote: '我们的国际贸易团队 24/7 监控这些邮箱，便于快速响应。',
        phoneWhatsapp: '电话与 WhatsApp',
        hotline: '出口热线：',
        available24: '支持 24/7 电话和 WhatsApp 信息',
        inquiryTitle: '直接出口咨询',
        inquiryReceived: '我们已收到您的咨询，会尽快与您联系。',
        companyName: '公司名称',
        fullName: '姓名',
        email: '邮箱地址',
        phone: '电话 / WhatsApp',
        subject: '主题',
        message: '消息内容',
        sending: '发送中...',
        send: '发送消息',
        adminNote: '该咨询将存储到 Foodmax CMS，并可在后台查看。',
        subjects: ['大米出口咨询', '咖啡出口咨询', '物流与船运', '自有品牌合作', '其他企业咨询'],
        headquarters: '全球总部',
        directions: '获取路线',
        officeLabel: '总部办公室',
        address: '越南胡志明市第一郡多高坊丁先皇街 17 号',
        mapTitle: 'Foodmax 总部位置'
      }
    : {
        required: 'Please fill in all required fields.',
        failed: 'Failed to send. Please try again.',
        heroTitle: 'Connect With Us',
        heroDesc: 'Discuss your import requirements with our dedicated B2B export specialists.',
        emailChannels: 'Email Channels',
        exportInquiries: 'Global Export Inquiries:',
        emailNote: 'Both addresses monitored 24/7 by our international trade desk for immediate response.',
        phoneWhatsapp: 'Direct Phone & WhatsApp',
        hotline: 'Export Hotline:',
        available24: 'Available for calls and WhatsApp messages 24/7',
        inquiryTitle: 'Direct Export Inquiry',
        inquiryReceived: "Inquiry received. We'll be in touch shortly.",
        companyName: 'Company Name',
        fullName: 'Full Name',
        email: 'Email Address',
        phone: 'Phone / WhatsApp',
        subject: 'Subject',
        message: 'Message Detail',
        sending: 'SENDING...',
        send: 'SEND MESSAGE',
        adminNote: 'This inquiry will be stored in Foodmax CMS and visible to Admin.',
        subjects: ['Rice Export Inquiry', 'Coffee Export Inquiry', 'Logistics & Shipping', 'Private Label Partnership', 'Other Corporate Inquiry'],
        headquarters: 'Global Headquarters',
        directions: 'Get Directions',
        officeLabel: 'HQ Office',
        address: '17 Dinh Tien Hoang, Da Kao, District 1, Ho Chi Minh City, Vietnam',
        mapTitle: 'Foodmax Headquarters Location'
      };
  const copy = locale === 'zh' ? preserveVietnamesePlaceNamesDeep(rawCopy) : rawCopy;

  const [form, setForm] = useState({
    companyName: '',
    fullName: '',
    email: '',
    phone: '',
    subject: defaultSubject,
    message: '',
  });

  React.useEffect(() => {
    setForm((prev) => {
      const enIndex = copy.subjects.indexOf(prev.subject);
      if (enIndex >= 0) {
        return prev;
      }

      const englishSubjects = [
        'Rice Export Inquiry',
        'Coffee Export Inquiry',
        'Logistics & Shipping',
        'Private Label Partnership',
        'Other Corporate Inquiry'
      ];
      const chineseSubjects = ['大米出口咨询', '咖啡出口咨询', '物流与船运', '自有品牌合作', '其他企业咨询'];

      const sourceIndex =
        englishSubjects.indexOf(prev.subject) >= 0
          ? englishSubjects.indexOf(prev.subject)
          : chineseSubjects.indexOf(prev.subject);

      return {
        ...prev,
        subject: copy.subjects[sourceIndex >= 0 ? sourceIndex : 0] || defaultSubject
      };
    });
  }, [copy.subjects, defaultSubject]);

  const isValid = useMemo(() => {
    // basic validation to avoid empty inserts
    if (!form.companyName.trim()) return false;
    if (!form.fullName.trim()) return false;
    if (!form.email.trim()) return false;
    if (!form.message.trim()) return false;
    return true;
  }, [form]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;

    setErrorMsg(null);
    setSent(false);

    if (!isValid) {
      setErrorMsg(copy.required);
      return;
    }

    setLoading(true);

    try {
      await api.submitContactInquiry({
        companyName: form.companyName.trim(),
        fullName: form.fullName.trim(),
        email: form.email.trim(),
        phone: form.phone.trim() || undefined,
        subject: form.subject,
        message: form.message.trim()
      });

      setSent(true);
      setForm({
        companyName: '',
        fullName: '',
        email: '',
        phone: '',
        subject: defaultSubject,
        message: '',
      });
    } catch (err: any) {
      setErrorMsg(err?.message || copy.failed);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white min-h-screen">
      <div className="bg-foodmax-forest py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-5xl md:text-6xl font-black text-white mb-6">{copy.heroTitle}</h1>
          <p className="text-xl text-green-100 max-w-2xl mx-auto">
            {copy.heroDesc}
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-16 pb-24">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Info Cards */}
          <div className="space-y-6">
            <div className="bg-white p-8 rounded-2xl shadow-lg border border-gray-100">
              <div className="w-12 h-12 bg-green-50 text-foodmax-forest rounded-xl flex items-center justify-center mb-6">
                <Mail size={24} />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">{copy.emailChannels}</h3>
              <p className="text-sm text-gray-500 mb-4">{copy.exportInquiries}</p>
              <div className="space-y-2">
                <a
                  href="mailto:export@foodmax.vn"
                  className="block text-md font-bold text-foodmax-forest hover:text-foodmax-lime transition-colors"
                >
                  export@foodmax.vn
                </a>
                <a
                  href="mailto:support@foodmax.vn"
                  className="block text-md font-bold text-foodmax-forest hover:text-foodmax-lime transition-colors"
                >
                  support@foodmax.vn
                </a>
              </div>
              <p className="text-xs text-gray-400 mt-6 leading-relaxed">
                {copy.emailNote}
              </p>
            </div>

            <div className="bg-white p-8 rounded-2xl shadow-lg border border-gray-100">
              <div className="w-12 h-12 bg-green-50 text-foodmax-forest rounded-xl flex items-center justify-center mb-6">
                <Phone size={24} />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">{copy.phoneWhatsapp}</h3>
              <p className="text-sm text-gray-500 mb-4">{copy.hotline}</p>
              <p className="text-lg font-bold text-foodmax-forest">+84 964 791 902</p>
              <p className="text-xs text-gray-400 mt-2">{copy.available24}</p>
            </div>
          </div>

          {/* Form */}
          <div className="lg:col-span-2 bg-white p-10 rounded-2xl shadow-2xl border border-gray-50">
            <h2 className="text-3xl font-black text-gray-900 mb-6">{copy.inquiryTitle}</h2>

            {/* Status */}
            {(errorMsg || sent) && (
              <div
                className={`mb-6 rounded-xl px-4 py-3 text-sm font-bold ${
                  errorMsg ? 'bg-red-50 text-red-700 border border-red-100' : 'bg-green-50 text-green-700 border border-green-100'
                }`}
              >
                {errorMsg ? errorMsg : copy.inquiryReceived}
              </div>
            )}

            <form className="space-y-6" onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">
                    {copy.companyName}
                  </label>
                  <input
                    type="text"
                    required
                    value={form.companyName}
                    onChange={(e) => setForm({ ...form, companyName: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:border-foodmax-forest focus:ring-1 focus:ring-foodmax-forest transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">
                    {copy.fullName}
                  </label>
                  <input
                    type="text"
                    required
                    value={form.fullName}
                    onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:border-foodmax-forest focus:ring-1 focus:ring-foodmax-forest transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">
                    {copy.email}
                  </label>
                  <input
                    type="email"
                    required
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:border-foodmax-forest focus:ring-1 focus:ring-foodmax-forest transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">
                    {copy.phone}
                  </label>
                  <input
                    type="text"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:border-foodmax-forest focus:ring-1 focus:ring-foodmax-forest transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">{copy.subject}</label>
                <select
                  value={form.subject}
                  onChange={(e) => setForm({ ...form, subject: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:border-foodmax-forest focus:ring-1 focus:ring-foodmax-forest transition-all"
                >
                  {copy.subjects.map((subject) => (
                    <option key={subject}>{subject}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">
                  {copy.message}
                </label>
                <textarea
                  rows={5}
                  required
                  value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:border-foodmax-forest focus:ring-1 focus:ring-foodmax-forest transition-all resize-none"
                ></textarea>
              </div>

              <button
                type="submit"
                disabled={loading}
                className={`w-full py-4 rounded-xl font-bold text-white transition-all flex items-center justify-center gap-2 ${
                  loading ? 'bg-gray-400 cursor-not-allowed' : 'bg-foodmax-forest hover:bg-foodmax-forest/90'
                }`}
              >
                {loading ? copy.sending : (
                  <>
                    <Send size={18} /> {copy.send}
                  </>
                )}
              </button>

              <p className="text-[10px] text-gray-400 text-center uppercase tracking-widest font-bold mt-4">
                {copy.adminNote}
              </p>
            </form>
          </div>
        </div>

        {/* Interactive Google Map Section */}
        <div className="mt-20 h-[500px] rounded-[2.5rem] overflow-hidden shadow-2xl border border-gray-100 bg-gray-50 relative group">
          <iframe
            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3919.2312217143924!2d106.6966048!3d10.7886314!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x31752f35502367ed%3A0x2f65bca97a0b52ed!2zMTcgxJDDrG5oIFRpw6puIEhvw6BuZywgxJGEIEthbywgUXXhuq1uIDEsIEjhu5MgQ2jDrSBNaW5oLCBWaWV0bmFt!5e0!3m2!1sen!2s!4v1738150000000!5m2!1sen!2s"
            width="100%"
            height="100%"
            style={{ border: 0 }}
            allowFullScreen
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            className="grayscale hover:grayscale-0 transition-all duration-700 opacity-90 group-hover:opacity-100"
            title={copy.mapTitle}
          ></iframe>

          <div className="absolute top-6 left-6 pointer-events-none">
            <div className="bg-white/95 backdrop-blur-md px-6 py-5 rounded-3xl shadow-2xl border border-gray-100 max-w-xs group-hover:translate-y-[-4px] transition-transform duration-500">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-2 h-2 rounded-full bg-foodmax-lime animate-pulse"></div>
                <h4 className="text-xs font-black text-foodmax-forest uppercase tracking-[0.2em]">{copy.headquarters}</h4>
              </div>
              <p className="text-[11px] font-bold text-gray-700 leading-relaxed mb-4">
                {copy.address}
              </p>
              <div className="flex items-center justify-between border-t border-gray-100 pt-3">
                <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">{copy.officeLabel}</span>
                <a
                  href="https://www.google.com/maps/place/17+%C4%90inh+Ti%C3%AAn+Ho%C3%A0ng,+%C4%90a+Kao,+Qu%E1%BA%ADn+1,+Th%C3%A0nh+ph%E1%BB%91+H%E1%BB%93+Ch%C3%AD+Minh,+Vietnam/@10.7886314,106.6966048,17z"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="pointer-events-auto text-[9px] font-black text-foodmax-forest hover:text-foodmax-lime transition-colors uppercase tracking-widest underline decoration-2 underline-offset-4"
                >
                  {copy.directions}
                </a>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Contact;
