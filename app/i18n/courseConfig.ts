export interface CourseConfig {
  duration: string;
  originalPrice: string;
  discountPrice: string;
  image: string;
  description_zh: string;
  description_en?: string;
}

export const COURSE_CONFIG: Record<string, CourseConfig> = {
  class_cycling_fundamentals: {
    duration: '2 hours',
    originalPrice: 'HK$560',
    discountPrice: 'HK$400',
    image: '/images/homepage/30c657383d224670b9671a2f703069965543dc7c.png',
    description_zh: '教你由零出發學識踩單車（包括：單車檢查、單車操控技巧、單車安全守則、模擬練習，完成後可優先參與單車技術改進課程）',
    description_en: 'Learn to ride a bike from scratch (includes: bike inspection, handling skills, safety rules, simulation practice)',
  },
  class_city_guided_tour: {
    duration: '3 hours',
    originalPrice: 'HK$650',
    discountPrice: 'HK$550',
    image: '/images/homepage/1b6dde4eac8d4c724b5927af3ad2e95753044659.png',
    description_zh: '帶你探索香港各區美景，享受單車樂趣。導賞團包括：路線規劃、安全講解、景點介紹等',
    description_en: 'Explore Hong Kong scenic districts by bike. Tours include route planning, safety briefing, and sightseeing',
  },
};

export function getCourseConfig(class_id: string): CourseConfig | undefined {
  return COURSE_CONFIG[class_id];
}
