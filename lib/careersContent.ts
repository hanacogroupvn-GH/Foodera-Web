/**
 * ═══════════════════════════════════════════════════════════════
 * CAREERS PAGE — CMS CONTENT
 * ═══════════════════════════════════════════════════════════════
 *
 * Edit this file to update all content on the Careers page.
 * No code changes needed elsewhere — just modify the values below.
 */

// ─── Types ──────────────────────────────────────────────────────

export interface CareersBenefit {
  icon: string; // Lucide icon name
  title: string;
  description: string;
}

export interface CareersPosition {
  id: string;
  title: string;
  department: string;
  location: string;
  type: 'Toàn thời gian' | 'Bán thời gian' | 'Thực tập' | 'Full-time' | 'Part-time' | 'Internship';
  description: string;
  requirements: string[];
  isActive: boolean;
}

export interface CareersContent {
  hero: {
    title: string;
    subtitle: string;
    cta: string;
  };
  intro: {
    tagline: string;
    heading: string;
    description: string;
  };
  benefits: {
    heading: string;
    subtitle: string;
    items: CareersBenefit[];
  };
  positions: {
    heading: string;
    subtitle: string;
    emptyMessage: string;
    applyButton: string;
    items: CareersPosition[];
  };
  form: {
    heading: string;
    subtitle: string;
    fields: {
      fullName: string;
      email: string;
      phone: string;
      position: string;
      positionPlaceholder: string;
      cv: string;
      cvHint: string;
      message: string;
      messagePlaceholder: string;
      submit: string;
    };
    successMessage: string;
  };
  cta: {
    heading: string;
    description: string;
    emailLabel: string;
    email: string;
  };
}

// ─── Vietnamese Content (Primary) ──────────────────────────────

export const careersContentVi: CareersContent = {
  hero: {
    title: 'Kiến tạo',
    subtitle: 'Tương lai xanh',
    cta: 'Xem vị trí tuyển dụng',
  },
  intro: {
    tagline: 'Về FoodEra',
    heading: 'Nơi làm việc của những người dám nghĩ lớn',
    description:
      'FoodEra kết nối nông sản Việt Nam với thị trường quốc tế. Chúng tôi tìm kiếm những tài năng có khát vọng vươn tầm toàn cầu.',
  },
  benefits: {
    heading: 'Tại sao chọn FoodEra?',
    subtitle: 'Chúng tôi tin rằng nhân viên hạnh phúc sẽ tạo nên công ty vĩ đại',
    items: [
      {
        icon: 'Globe',
        title: 'Môi trường quốc tế',
        description: 'Làm việc với đối tác từ 30+ quốc gia, mở rộng tầm nhìn toàn cầu.',
      },
      {
        icon: 'TrendingUp',
        title: 'Phát triển sự nghiệp',
        description: 'Lộ trình thăng tiến rõ ràng, được đào tạo và mentoring liên tục.',
      },
      {
        icon: 'Heart',
        title: 'Phúc lợi hấp dẫn',
        description: 'Bảo hiểm sức khỏe, thưởng hiệu suất, team building và nhiều hơn nữa.',
      },
      {
        icon: 'Sprout',
        title: 'Đóng góp ý nghĩa',
        description: 'Góp phần đưa nông sản Việt Nam ra thế giới, hỗ trợ phát triển bền vững.',
      },
    ],
  },
  positions: {
    heading: 'Vị trí đang tuyển',
    subtitle: '',
    emptyMessage: 'Hiện tại chưa có vị trí nào đang tuyển. Hãy quay lại sau hoặc gửi CV cho chúng tôi!',
    applyButton: 'Apply Now',
    items: [
      {
        id: 'export-sales-manager',
        title: 'Export Sales Manager',
        department: 'Sales',
        location: '6 Mac Dinh Chi, Sai Gon Ward, Ho Chi Minh City',
        type: 'Toàn thời gian',
        description:
          'Develop and expand international customers for the company\'s Vietnamese agricultural export products, including rice, coffee, pepper, cashew nuts, and other agricultural products & spices.',
        requirements: [],
        isActive: true,
      },
    ],
  },
  form: {
    heading: 'Gửi hồ sơ ứng tuyển',
    subtitle: '',
    fields: {
      fullName: 'Full Name',
      email: 'Email',
      phone: 'Phone Number',
      position: 'Position',
      positionPlaceholder: '-- Select a position --',
      cv: 'Upload CV',
      cvHint: 'PDF, DOC, DOCX — max 5MB',
      message: 'Message',
      messagePlaceholder: 'Tell us about yourself...',
      submit: 'Submit Application',
    },
    successMessage: 'Thank you! Your application has been submitted successfully. We will contact you shortly.',
  },
  cta: {
    heading: 'Không tìm thấy vị trí phù hợp?',
    description:
      'Gửi CV của bạn đến email bên dưới, chúng tôi luôn chào đón những tài năng xuất sắc tham gia vào hành trình phát triển của FoodEra.',
    emailLabel: 'Gửi CV qua email',
    email: 'export@foodera.vn',
  },
};

// ─── English Content ───────────────────────────────────────────

export const careersContentEn: CareersContent = {
  hero: {
    title: 'Building',
    subtitle: 'A Green Future',
    cta: 'View Open Positions',
  },
  intro: {
    tagline: 'About FoodEra',
    heading: 'Where bold thinkers grow',
    description:
      'FoodEra connects Vietnamese agriculture to global markets. We seek talents with a passion for international growth.',
  },
  benefits: {
    heading: 'Why FoodEra?',
    subtitle: 'We believe happy employees build great companies',
    items: [
      {
        icon: 'Globe',
        title: 'International Environment',
        description: 'Work with partners from 30+ countries and expand your global perspective.',
      },
      {
        icon: 'TrendingUp',
        title: 'Career Growth',
        description: 'Clear progression paths with continuous training and mentoring programs.',
      },
      {
        icon: 'Heart',
        title: 'Great Benefits',
        description: 'Health insurance, performance bonuses, team building, and much more.',
      },
      {
        icon: 'Sprout',
        title: 'Meaningful Impact',
        description: 'Help bring Vietnamese agriculture to the world and support sustainable growth.',
      },
    ],
  },
  positions: {
    heading: 'Open Positions',
    subtitle: '',
    emptyMessage: 'No positions are currently open. Please check back later or send us your CV!',
    applyButton: 'Apply Now',
    items: [
      {
        id: 'export-sales-manager',
        title: 'Export Sales Manager',
        department: 'Sales',
        location: '6 Mac Dinh Chi, Sai Gon Ward, Ho Chi Minh City',
        type: 'Full-time',
        description:
          'Develop and expand international customers for the company\'s Vietnamese agricultural export products, including rice, coffee, pepper, cashew nuts, and other agricultural products & spices.',
        requirements: [],
        isActive: true,
      },
    ],
  },
  form: {
    heading: 'Submit Your Application',
    subtitle: '',
    fields: {
      fullName: 'Full Name',
      email: 'Email',
      phone: 'Phone Number',
      position: 'Position',
      positionPlaceholder: '-- Select a position --',
      cv: 'Upload CV',
      cvHint: 'PDF, DOC, DOCX — max 5MB',
      message: 'Message',
      messagePlaceholder: 'Tell us about yourself...',
      submit: 'Submit Application',
    },
    successMessage: 'Thank you! Your application has been submitted successfully. We will contact you shortly.',
  },
  cta: {
    heading: "Can't find the right position?",
    description:
      'Send your CV to the email below. We always welcome exceptional talent to join the FoodEra journey.',
    emailLabel: 'Send CV via email',
    email: 'export@foodera.vn',
  },
};

// ─── Locale Selector ───────────────────────────────────────────

export const getCareersContent = (locale: 'en' | 'zh'): CareersContent => {
  // Vietnamese is the default/primary; English for 'en' locale
  // Chinese locale falls back to Vietnamese (same market)
  return locale === 'en' ? careersContentEn : careersContentVi;
};
