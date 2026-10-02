export type Language = 'zh-TW' | 'en';

export interface Translations {
  // Hero Section
  hero: {
    title: string;
    subtitle: string;
    ctaExplore: string;
    ctaEnroll: string;
    feature1Title: string;
    feature1Desc: string;
    feature2Title: string;
    feature2Desc: string;
    feature3Title: string;
    feature3Desc: string;
  };
  
  // About Section
  about: {
    tag: string;
    title: string;
    description: string;
    statsNumber: string;
    statsText1: string;
    statsText2: string;
    advantage1: string;
    advantage2: string;
    advantage3: string;
    advantage4: string;
  };
  
  // Application Steps Section
  applicationSteps: {
    tag: string;
    title: string;
    step1: {
      title: string;
      description: string;
    };
    step2: {
      title: string;
      description: string;
    };
    step3: {
      title: string;
      description: string;
    };
  };
  
  // Courses Section
  courses: {
    tag: string;
    title: string;
    subtitle: string;
    enrollingClasses: string;
    applyButton: string;
    priceIndividual: string;
    priceGroup: (minQty: number) => string;
    priceFree: string;
    comingSoon: string;
    duration: (minutes: number) => string;
  };
  
  // Footer Section
  footer: {
    followUs: string;
    poweredBy: string;
    copyright: string;
    privacyPolicy: string;
    termsConditions: string;
    scrollToTop: string;
  };
}

export const translations: Record<Language, Translations> = {
  'zh-TW': {
    hero: {
      title: '自信地掌控道路',
      subtitle: '無論你是零經驗的初學者、還是已經有一定經驗， 想尋求大突破，追求冒險的團體。歡迎加入單車安全學院，學習、進步並享受安全騎行的樂趣。',
      ctaExplore: '探索單車課程',
      ctaEnroll: '網上報名',
      feature1Title: '專業導師',
      feature1Desc: '擁有豐富教學經驗',
      feature2Title: '安全至上',
      feature2Desc: '在可控環境下安全學習',
      feature3Title: '單車導賞團',
      feature3Desc: '不定期舉辦單車導賞團',
    },
    about: {
      tag: '關於我們',
      title: '安全騎行，樂在社區',
      description: '「樂區單車安全教室」致力透過系統化訓練，陪伴你發展恆久又安全的踩車能力 。我們堅信「人人有車練」，旨在推動安全騎行與互讓文化，攜手打造對行人及單車更友善的城市 。不論是初學者或想穿梭市區的車友，我們專業的認證導師都會提供耐心指導 ，助你由零建立自信，安全享受踩車的自由。我們相信，當每個人都具備正確的騎行知識與禮讓態度，這座城市將會變得更加美好 。',
      statsNumber: '1,000',
      statsText1: '超過',
      statsText2: '學員\n成功發掘踩車樂趣',
      advantage1: '有系統地掌握安全平衡與控車的基礎技能',
      advantage2: '深入了解交通規則、路權共享及互讓技巧',
      advantage3: '在繁忙的市區與郊區環境中建立自信',
      advantage4: '享受自由自在與健康騎行的每一刻',
    },
    applicationSteps: {
      tag: '報名流程',
      title: '如何報名',
      step1: {
        title: '在線報名',
        description: '點擊「立即報名」，選擇人數並完成付款。',
      },
      step2: {
        title: '登記資料',
        description: '付款後，系統將發送 WhatsApp 訊息；請依指示填寫參加者資料並預約活動時段。',
      },
      step3: {
        title: '報到入場',
        description: '登記完成後，您將收到 QR Code 活動證。活動當天請出示該碼以完成簽到。',
      },
    },
    courses: {
      tag: '課程大綱',
      title: '尋找最適合你的單車課程',
      subtitle: '我們針對不同年齡及程度提供專業培訓，並在課程中實踐友善騎行文化 。所有課程均包含免費安全裝備租用 。',
      enrollingClasses: '現正招生班別',
      applyButton: '立即報名',
      priceIndividual: '個人',
      priceGroup: (minQty: number) => `${minQty}人或以上`,
      priceFree: '免費',
      comingSoon: '即將推出',
      duration: (minutes: number) => {
        const hours = Math.floor(minutes / 60);
        const rest = minutes % 60;
        return [hours > 0 ? `${hours} 小時` : '', rest > 0 ? `${rest} 分鐘` : ''].filter(Boolean).join(' ');
      },
    },
    footer: {
      followUs: '關注我們',
      poweredBy: '由 LocoBike 提供',
      copyright: '版權所有 © 2026 Loco Cycling Safety Centre',
      privacyPolicy: '隱私政策',
      termsConditions: '使用條款',
      scrollToTop: '返回頂部',
    },
  },
  'en': {
    hero: {
      title: 'Master the Road with Confidence',
      subtitle: 'Whether you\'re a complete beginner or already have experience and are looking for a breakthrough, seeking adventure in a group. Welcome to join the Cycling Safety Academy to learn, progress, and enjoy the fun of safe cycling.',
      ctaExplore: 'Explore Cycling Courses',
      ctaEnroll: 'Online Registration',
      feature1Title: 'Professional Instructors',
      feature1Desc: 'With rich teaching experience',
      feature2Title: 'Safety First',
      feature2Desc: 'Learn safely in a controlled environment',
      feature3Title: 'Cycling Tours',
      feature3Desc: 'Regularly organized cycling tours',
    },
    about: {
      tag: 'About Us',
      title: 'Safe Cycling, Community Joy',
      description: 'The "Loco Cycling Safety Centre" is dedicated to developing sustainable and safe cycling abilities through systematic training. We believe in "everyone has a bike to practice," aiming to promote safe cycling and mutual courtesy culture, working together to create a more pedestrian and bicycle-friendly city. Whether you are a beginner or an experienced cyclist navigating the city, our professional certified instructors will provide patient guidance to help you build confidence from scratch and safely enjoy the freedom of cycling. We believe that when everyone has the correct cycling knowledge and courteous attitude, this city will become even better.',
      statsNumber: '1,000',
      statsText1: 'Over',
      statsText2: 'Students\nSuccessfully Discovered the Joy of Cycling',
      advantage1: 'Systematically master basic skills of safe balance and bike control',
      advantage2: 'Gain in-depth understanding of traffic rules, right-of-way sharing, and courtesy techniques',
      advantage3: 'Build confidence in busy urban and suburban environments',
      advantage4: 'Enjoy every moment of free and healthy cycling',
    },
    applicationSteps: {
      tag: 'Registration Process',
      title: 'How to Enroll',
      step1: {
        title: 'Online Registration',
        description: 'Click "Apply Now", choose the number of participants and complete payment.',
      },
      step2: {
        title: 'Submit Information',
        description: 'After payment, you will receive a WhatsApp message. Please follow the instructions to fill in participant information and schedule your session.',
      },
      step3: {
        title: 'Check-In',
        description: 'Once registered, you will receive a QR Code activity pass. Please present this code on the day of the event to complete check-in.',
      },
    },
    courses: {
      tag: 'Course Outline',
      title: 'Find the Best Cycling Course for You',
      subtitle: 'We provide professional training for different ages and skill levels, practicing friendly cycling culture in all courses. All courses include free safety equipment rental.',
      enrollingClasses: 'Currently Enrolling',
      applyButton: 'Apply Now',
      priceIndividual: 'Individual',
      priceGroup: (minQty: number) => `${minQty}+ people`,
      priceFree: 'Free of charge',
      comingSoon: 'Coming Soon',
      duration: (minutes: number) => {
        const hours = Math.floor(minutes / 60);
        const rest = minutes % 60;
        return [
          hours > 0 ? `${hours} ${hours === 1 ? 'hour' : 'hours'}` : '',
          rest > 0 ? `${rest} min` : '',
        ].filter(Boolean).join(' ');
      },
    },
    footer: {
      followUs: 'Follow Us',
      poweredBy: 'Powered by LocoBike',
      copyright: 'Copyright © 2026 Loco Cycling Safety Centre',
      privacyPolicy: 'Privacy Policy',
      termsConditions: 'Terms & Conditions',
      scrollToTop: 'Scroll to Top',
    },
  },
};