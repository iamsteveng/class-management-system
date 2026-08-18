export interface CourseConfig {
  duration: string;
  originalPrice: string;
  discountPrice: string;
  image: string;
  description_zh: string;
  description_en?: string;
}

export const COURSE_CONFIG: Record<string, CourseConfig> = {
  // Beginner Cycling Course — 單車新手速成班 (UAT slug)
  class_cycling_fundamentals: {
    duration: '3 hours',
    originalPrice: 'HK$560',
    discountPrice: 'HK$400',
    image: '/images/homepage/30c657383d224670b9671a2f703069965543dc7c.png',
    description_zh: '教你由零出發學識踩單車（包括：單車檢查、單車操控技巧、單車安全守則、模擬練習，完成後可優先參與單車技術改進課程）',
    description_en: 'Learn to ride a bike from scratch (includes: bike inspection, handling skills, safety rules, simulation practice)',
  },
  // Beginner Cycling Course — 單車新手速成班 (production UUID)
  '67261272-c799-4439-9146-4ee12ce51b7c': {
    duration: '3 hours',
    originalPrice: 'HK$400',
    discountPrice: 'HK$298',
    image: '/images/homepage/30c657383d224670b9671a2f703069965543dc7c.png',
    description_zh: '教你由零出發學識踩單車（包括：單車檢查、單車操控技巧、單車安全守則、模擬練習，完成後可優先參與單車技術改進課程）',
    description_en: 'Learn to ride a bike from scratch (includes: bike inspection, handling skills, safety rules, simulation practice)',
  },
  // Guided Bike Tour — 單車導賞團 (UAT slug)
  class_city_guided_tour: {
    duration: '2 hours',
    originalPrice: 'HK$650',
    discountPrice: 'HK$550',
    image: '/images/homepage/1b6dde4eac8d4c724b5927af3ad2e95753044659.png',
    description_zh: '帶你探索香港各區美景，享受單車樂趣。導賞團包括：路線規劃、安全講解、景點介紹等',
    description_en: 'Explore Hong Kong scenic districts by bike. Tours include route planning, safety briefing, and sightseeing',
  },
  // Teen Beginner Cycling Course — 青少年單車新手速成班 (production UUID)
  '85714c5b-8b37-4469-bfeb-d60f46129387': {
    duration: '3 hours',
    originalPrice: 'HK$400',
    discountPrice: 'HK$298',
    image: 'https://s3.ap-east-1.amazonaws.com/asset.loco.hk/images/academy/teen.jpg',
    description_zh: '專為青少年設計的單車入門課程，由淺入深學習踩單車技巧（包括：單車檢查、單車操控技巧、單車安全守則、模擬練習，完成後可優先參與單車技術改進課程）',
    description_en: 'Beginner cycling course designed for teenagers, covering bike inspection, handling skills, safety rules, and simulation practice',
  },
  // Middle Kids Beginner Cycling Course — 中童單車新手速成班 (production UUID)
  '9e415878-038b-42ae-b6e6-91873c32dd15': {
    duration: '3 hours',
    originalPrice: 'HK$400',
    discountPrice: 'HK$298',
    image: 'https://s3.ap-east-1.amazonaws.com/asset.loco.hk/images/academy/midkid.jpg',
    description_zh: '專為中童（10-12歲）設計的單車入門課程，由淺入深學習踩單車技巧（包括：單車檢查、單車操控技巧、單車安全守則、模擬練習，完成後可優先參與單車技術改進課程）',
    description_en: 'Beginner cycling course designed for children aged 10–12, covering bike inspection, handling skills, safety rules, and simulation practice',
  },
  // Young Kids Beginner Cycling Course — 幼兒單車新手速成班 (production UUID)
  '087ff81e-737a-42f9-957c-192a23de30dc': {
    duration: '3 hours',
    originalPrice: 'HK$400',
    discountPrice: 'HK$298',
    image: 'https://s3.ap-east-1.amazonaws.com/asset.loco.hk/images/academy/smallkid.jpg',
    description_zh: '專為幼兒設計的單車入門課程，以趣味方式引導小朋友學習踩單車技巧（包括：平衡感訓練、單車操控技巧、單車安全守則）',
    description_en: 'Fun beginner cycling course designed for young children, covering balance training, bike handling skills, and safety rules',
  },
  // Teen Beginner Cycling Course — 青少年單車新手速成班 (13-17歲) (production UUID)
  'a7a53c64-8cf0-4b71-9749-7f1076045f99': {
    duration: '3 hours',
    originalPrice: 'HK$400',
    discountPrice: 'HK$298',
    image: 'https://s3.ap-east-1.amazonaws.com/asset.loco.hk/images/academy/teen.jpg',
    description_zh: '專為青少年設計的單車入門課程，由淺入深學習踩單車技巧（包括：單車檢查、單車操控技巧、單車安全守則、模擬練習，完成後可優先參與單車技術改進課程）',
    description_en: 'Beginner cycling course designed for teenagers, covering bike inspection, handling skills, safety rules, and simulation practice',
  },
  // Young Kids Beginner Cycling Course — 幼兒單車新手速成班 (6-9歲) (production UUID)
  'a07413ca-9be9-4492-94d3-da01a93a3e04': {
    duration: '3 hours',
    originalPrice: 'HK$400',
    discountPrice: 'HK$298',
    image: 'https://s3.ap-east-1.amazonaws.com/asset.loco.hk/images/academy/smallkid.jpg',
    description_zh: '專為幼兒設計的單車入門課程，以趣味方式引導小朋友學習踩單車技巧（包括：平衡感訓練、單車操控技巧、單車安全守則）',
    description_en: 'Fun beginner cycling course designed for young children, covering balance training, bike handling skills, and safety rules',
  },
  // Middle Kids Beginner Cycling Course — 中童單車新手速成班 (10-12歲) (production UUID)
  'a2f45f61-4f3f-4345-84b6-6241c4adb532': {
    duration: '3 hours',
    originalPrice: 'HK$400',
    discountPrice: 'HK$298',
    image: 'https://s3.ap-east-1.amazonaws.com/asset.loco.hk/images/academy/midkid.jpg',
    description_zh: '專為中童（10-12歲）設計的單車入門課程，由淺入深學習踩單車技巧（包括：單車檢查、單車操控技巧、單車安全守則、模擬練習，完成後可優先參與單車技術改進課程）',
    description_en: 'Beginner cycling course designed for children aged 10–12, covering bike inspection, handling skills, safety rules, and simulation practice',
  },
  // Guided Bike Tour — 單車導賞團 (production UUID)
  '7fe78618-d6c1-4a35-ad01-a0453a943180': {
    duration: '2 hours',
    originalPrice: 'HK$200',
    discountPrice: 'HK$150',
    image: '/images/homepage/1b6dde4eac8d4c724b5927af3ad2e95753044659.png',
    description_zh: '帶你探索香港各區美景，享受單車樂趣。導賞團包括：路線規劃、安全講解、景點介紹等',
    description_en: 'Explore Hong Kong scenic districts by bike. Tours include route planning, safety briefing, and sightseeing',
  },
  // Guided Bike Tour Practicum — 單車導賞實習團 (production UUID)
  'ef5da20f-6ee5-4960-96bd-d7c8615e1e8c': {
    duration: '2 hours',
    originalPrice: 'HK$0',
    discountPrice: '免費',
    image: '/images/homepage/fd4d1d8fb6d982eadb491c135a33b2ff72209b94.jpg',
    description_zh: '由保良局李兆基青年綠洲青年見習導賞員帶領，免費參加。踩住單車探索北部都會區美景，一路輕鬆睇風景、享受單車樂趣。',
    description_en: 'Led by trainee tour guides from PLK Lee Shau Kee Youth Oasis — free to join. Explore the scenic Northern Metropolis by bike and enjoy a relaxing ride with beautiful views.',
  },
  // Guided Bike Tour Practicum — 單車導賞實習團 (dev UUID)
  '7a35a3af-0ce8-4c63-b902-63be721656d0': {
    duration: '2 hours',
    originalPrice: 'HK$0',
    discountPrice: '免費',
    image: '/images/homepage/fd4d1d8fb6d982eadb491c135a33b2ff72209b94.jpg',
    description_zh: '由保良局李兆基青年綠洲青年見習導賞員帶領，免費參加。踩住單車探索北部都會區美景，一路輕鬆睇風景、享受單車樂趣。',
    description_en: 'Led by trainee tour guides from PLK Lee Shau Kee Youth Oasis — free to join. Explore the scenic Northern Metropolis by bike and enjoy a relaxing ride with beautiful views.',
  },
  // Guided Bike Tour Practicum — 單車導賞實習團 (UAT slug)
  class_guided_tour_practicum: {
    duration: '2 hours',
    originalPrice: 'HK$0',
    discountPrice: '免費',
    image: '/images/homepage/fd4d1d8fb6d982eadb491c135a33b2ff72209b94.jpg',
    description_zh: '由保良局李兆基青年綠洲青年見習導賞員帶領，免費參加。踩住單車探索北部都會區美景，一路輕鬆睇風景、享受單車樂趣。',
    description_en: 'Led by trainee tour guides from PLK Lee Shau Kee Youth Oasis — free to join. Explore the scenic Northern Metropolis by bike and enjoy a relaxing ride with beautiful views.',
  },
};

export function getCourseConfig(class_id: string): CourseConfig | undefined {
  return COURSE_CONFIG[class_id];
}
