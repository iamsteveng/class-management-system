export interface CourseConfig {
  duration: string;
  originalPrice: string;
  discountPrice: string;
  image: string;
}

export const COURSE_CONFIG: Record<string, CourseConfig> = {
  class_cycling_fundamentals: {
    duration: '2 hours',
    originalPrice: 'HK$560',
    discountPrice: 'HK$400',
    image: '/images/homepage/30c657383d224670b9671a2f703069965543dc7c.png',
  },
  class_city_guided_tour: {
    duration: '3 hours',
    originalPrice: 'HK$650',
    discountPrice: 'HK$550',
    image: '/images/homepage/1b6dde4eac8d4c724b5927af3ad2e95753044659.png',
  },
};

export function getCourseConfig(class_id: string): CourseConfig | undefined {
  return COURSE_CONFIG[class_id];
}
