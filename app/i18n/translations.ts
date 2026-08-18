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
    enrollButton: string;
    applyButton: string;
    priceIndividual: string;
    priceGroup: (minQty: number) => string;
    priceFree: string;
    comingSoon: string;
    course1: {
      title: string;
      description: string;
      duration: string;
      originalPrice: string;
      discountPrice: string;
      classes: Array<{
        date: string;
        time: string;
        location: string;
        isFull: boolean;
      }>;
    };
    course2: {
      title: string;
      description: string;
      duration: string;
      originalPrice: string;
      discountPrice: string;
      classes: Array<{
        date: string;
        time: string;
        location: string;
        isFull: boolean;
      }>;
    };
    course3: {
      title: string;
      description: string;
      duration: string;
      originalPrice: string;
      discountPrice: string;
      classes: Array<{
        date: string;
        time: string;
        location: string;
        isFull: boolean;
      }>;
    };
    course4: {
      title: string;
      description: string;
      duration: string;
      originalPrice: string;
      discountPrice: string;
      classes: Array<{
        date: string;
        time: string;
        location: string;
        isFull: boolean;
      }>;
    };
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
        description: '點擊「按此報名」跳轉至 Loco Mart 選購相關課程。',
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
      enrollButton: '按此報名',
      applyButton: '立即報名',
      priceIndividual: '個人',
      priceGroup: (minQty: number) => `${minQty}人或以上`,
      priceFree: '免費',
      comingSoon: '即將推出',
      course1: {
        title: '單車新手速成班',
        description: '教你由零出發學識踩單車 （包括：單車檢查、單車操控技巧、單車安全守則、模擬練習，完成後可優先參與**單車技術改進課程）',
        duration: '2 hours',
        originalPrice: 'HK$560',
        discountPrice: 'HK$400',
        classes: [
          { date: '1 Apr (Wed)', time: '14:00 - 16:00', location: '將軍澳南', isFull: false },
          { date: '2 Apr (Thu)', time: '14:00 - 16:00', location: '天水圍', isFull: false },
          { date: '5 Apr (Sun)', time: '10:00 - 12:00', location: '將軍澳南', isFull: false },
          { date: '8 Apr (Wed)', time: '14:00 - 16:00', location: '將軍澳南', isFull: true },
          { date: '9 Apr (Thu)', time: '14:00 - 16:00', location: '天水圍', isFull: false },
          { date: '12 Apr (Sun)', time: '10:00 - 12:00', location: '將軍澳南', isFull: true },
          { date: '15 Apr (Wed)', time: '14:00 - 16:00', location: '將軍澳南', isFull: false },
          { date: '16 Apr (Thu)', time: '14:00 - 16:00', location: '天水圍', isFull: false },
        ],
      },
      course2: {
        title: '單車技術改進班',
        description: '提升單車操控技巧，學習進階技術，包括：急剎車、繞圈技巧、上落斜坡、障礙物躲避等。完成後可優先參與進階課程。',
        duration: '2 hours',
        originalPrice: 'HK$560',
        discountPrice: 'HK$450',
        classes: [
          { date: '3 Apr (Fri)', time: '14:00 - 16:00', location: '將軍澳南', isFull: false },
          { date: '6 Apr (Mon)', time: '10:00 - 12:00', location: '天水圍', isFull: false },
          { date: '10 Apr (Fri)', time: '14:00 - 16:00', location: '將軍澳南', isFull: true },
          { date: '13 Apr (Mon)', time: '10:00 - 12:00', location: '天水圍', isFull: false },
          { date: '17 Apr (Fri)', time: '14:00 - 16:00', location: '將軍澳南', isFull: false },
          { date: '20 Apr (Mon)', time: '10:00 - 12:00', location: '天水圍', isFull: false },
        ],
      },
      course3: {
        title: '單車遊團',
        description: '帶你探索香港各區美景，享受單車樂趣。導賞團包括：路線規劃、安全講解、景點介紹等。適合已完成基礎課程的學員。',
        duration: '3 hours',
        originalPrice: 'HK$650',
        discountPrice: 'HK$550',
        classes: [
          { date: '7 Apr (Tue)', time: '09:00 - 12:00', location: '沙田', isFull: false },
          { date: '14 Apr (Tue)', time: '09:00 - 12:00', location: '大埔', isFull: true },
          { date: '21 Apr (Tue)', time: '09:00 - 12:00', location: '沙田', isFull: false },
          { date: '28 Apr (Tue)', time: '09:00 - 12:00', location: '大埔', isFull: false },
        ],
      },
      course4: {
        title: '小童單車新手速成班 （即將推出）',
        description: '教你由零出發學識踩單車 （包括：單車檢查、單車操控技巧、單車安全守則、模擬練習，完成後可優先參與**單車技術改進課程）',
        duration: '2 hours',
        originalPrice: 'HK$560',
        discountPrice: 'HK$400',
        classes: [],
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
        description: 'Click "Enroll Now" to visit Loco Mart and select your course.',
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
      enrollButton: 'Enroll Now',
      applyButton: 'Apply Now',
      priceIndividual: 'Individual',
      priceGroup: (minQty: number) => `${minQty}+ people`,
      priceFree: 'Free of charge',
      comingSoon: 'Coming Soon',
      course1: {
        title: 'Cycling Crash Course for Beginners',
        description: 'Learn to ride a bike from scratch (includes: bike inspection, bike handling skills, cycling safety rules, simulation practice. Upon completion, priority access to **Cycling Skill Improvement Course)',
        duration: '2 hours',
        originalPrice: 'HK$560',
        discountPrice: 'HK$400',
        classes: [
          { date: '1 Apr (Wed)', time: '14:00 - 16:00', location: 'Tseung Kwan O South', isFull: false },
          { date: '2 Apr (Thu)', time: '14:00 - 16:00', location: 'Tin Shui Wai', isFull: false },
          { date: '5 Apr (Sun)', time: '10:00 - 12:00', location: 'Tseung Kwan O South', isFull: false },
          { date: '8 Apr (Wed)', time: '14:00 - 16:00', location: 'Tseung Kwan O South', isFull: true },
          { date: '9 Apr (Thu)', time: '14:00 - 16:00', location: 'Tin Shui Wai', isFull: false },
          { date: '12 Apr (Sun)', time: '10:00 - 12:00', location: 'Tseung Kwan O South', isFull: true },
          { date: '15 Apr (Wed)', time: '14:00 - 16:00', location: 'Tseung Kwan O South', isFull: false },
          { date: '16 Apr (Thu)', time: '14:00 - 16:00', location: 'Tin Shui Wai', isFull: false },
        ],
      },
      course2: {
        title: 'Cycling Skill Improvement Course',
        description: 'Enhance bike handling skills, learn advanced techniques, including: emergency braking, circling techniques, uphill and downhill riding, obstacle avoidance, etc. Upon completion, priority access to advanced courses.',
        duration: '2 hours',
        originalPrice: 'HK$560',
        discountPrice: 'HK$450',
        classes: [
          { date: '3 Apr (Fri)', time: '14:00 - 16:00', location: 'Tseung Kwan O South', isFull: false },
          { date: '6 Apr (Mon)', time: '10:00 - 12:00', location: 'Tin Shui Wai', isFull: false },
          { date: '10 Apr (Fri)', time: '14:00 - 16:00', location: 'Tseung Kwan O South', isFull: true },
          { date: '13 Apr (Mon)', time: '10:00 - 12:00', location: 'Tin Shui Wai', isFull: false },
          { date: '17 Apr (Fri)', time: '14:00 - 16:00', location: 'Tseung Kwan O South', isFull: false },
          { date: '20 Apr (Mon)', time: '10:00 - 12:00', location: 'Tin Shui Wai', isFull: false },
        ],
      },
      course3: {
        title: 'Cycling Tours',
        description: 'Explore the beauty of different districts in Hong Kong, enjoy the fun of cycling. Tours include: route planning, safety briefing, sightseeing introduction, etc. Suitable for students who have completed the basic course.',
        duration: '3 hours',
        originalPrice: 'HK$650',
        discountPrice: 'HK$550',
        classes: [
          { date: '7 Apr (Tue)', time: '09:00 - 12:00', location: 'Sha Tin', isFull: false },
          { date: '14 Apr (Tue)', time: '09:00 - 12:00', location: 'Tai Po', isFull: true },
          { date: '21 Apr (Tue)', time: '09:00 - 12:00', location: 'Sha Tin', isFull: false },
          { date: '28 Apr (Tue)', time: '09:00 - 12:00', location: 'Tai Po', isFull: false },
        ],
      },
      course4: {
        title: 'Cycling Crash Course for Beginners (Coming Soon)',
        description: 'Learn to ride a bike from scratch (includes: bike inspection, bike handling skills, cycling safety rules, simulation practice. Upon completion, priority access to **Cycling Skill Improvement Course)',
        duration: '2 hours',
        originalPrice: 'HK$560',
        discountPrice: 'HK$400',
        classes: [],
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