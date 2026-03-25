import { useLanguage } from '../contexts/LanguageContext';
import svgPaths from '../../imports/svg-tlbx5elpic';
import imgImageCyclingCrashCourseForBeginners from 'figma:asset/30c657383d224670b9671a2f703069965543dc7c.png';
import imgImageCyclingCrashCourseForBeginners1 from 'figma:asset/ae8fc430af09066bfde0c7ffad0be807cd71ce13.png';
import imgImageCyclingCrashCourseForBeginners2 from 'figma:asset/1b6dde4eac8d4c724b5927af3ad2e95753044659.png';
import imgImageCyclingCrashCourseForBeginners3 from 'figma:asset/4c5f4761ee4cc0fad74d8d80590fa681ed58cc51.png';
import imgAsset11 from 'figma:asset/dab0f75dd9b9e8607ce30b36e95e0e7b5d3a1a6a.png';

interface ClassSchedule {
  date: string;
  time: string;
  location: string;
  isFull: boolean;
}

interface Course {
  id: string;
  title: string;
  description: string;
  duration: string;
  originalPrice: string;
  discountPrice: string;
  image: string;
  classes: ClassSchedule[];
}

function CourseCard({ course }: { course: Course }) {
  const { t } = useLanguage();

  return (
    <div className="bg-white rounded-[32px] border border-[#dcdcdc] overflow-hidden flex flex-col lg:flex-row gap-5 p-px">
      {/* Image */}
      <div className="w-full lg:w-[550px] lg:max-w-[550px] h-[300px] lg:h-auto relative flex-shrink-0">
        <img
          alt={course.title}
          className="w-full h-full object-cover"
          src={course.image}
        />
      </div>

      {/* Content */}
      <div className="flex-1 p-6 lg:p-8 flex flex-col gap-5">
        {/* Title */}
        <h3 className="font-['Comfortaa:Semibold','Noto_Sans_JP:Bold',sans-serif] text-[24px] lg:text-[28px] leading-[32px] lg:leading-[36px] text-[#141414]" style={{ fontVariationSettings: "'wght' 700" }}>
          {course.title}
        </h3>

        {/* Description */}
        <p className="font-['Roboto:Regular','Noto_Sans_JP:Regular','Noto_Sans_SC:Regular',sans-serif] text-[14px] leading-[24px] text-[#292929] tracking-[0.3px]" style={{ fontVariationSettings: "'wdth' 100" }}>
          {course.description}
        </p>

        {/* Duration & Price */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pb-5 border-b border-[#dcdcdc]">
          {/* Duration */}
          <div className="flex gap-[6px] items-center">
            <div className="relative shrink-0 size-[28px]">
              <div className="absolute inset-[8.33%]">
                <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 23.3333 23.3333">
                  <path d={svgPaths.p389f4b00} fill="var(--fill-0, #44B0E2)" />
                </svg>
              </div>
              <div className="absolute inset-[20.83%_35.36%_36%_45.83%]">
                <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 5.26674 12.0867">
                  <path d={svgPaths.pb627880} fill="var(--fill-0, #44B0E2)" />
                </svg>
              </div>
            </div>
            <p className="font-['Roboto:Medium',sans-serif] font-medium text-[18px] lg:text-[22px] leading-[28px] text-[#141414]" style={{ fontVariationSettings: "'wdth' 100" }}>
              {course.duration}
            </p>
          </div>

          {/* Price */}
          <div className="flex gap-[6px] items-center">
            <div className="relative shrink-0 size-[28px]">
              <div className="absolute inset-[8.33%]">
                <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 23.3333 23.3333">
                  <path d={svgPaths.p389f4b00} fill="var(--fill-0, #44B0E2)" />
                </svg>
              </div>
              <div className="absolute inset-[23.79%_34.46%_23.79%_34.42%]">
                <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 8.715 14.6767">
                  <path d={svgPaths.peb0b480} fill="var(--fill-0, #44B0E2)" />
                </svg>
              </div>
            </div>
            <p className="font-['Roboto:Medium',sans-serif] font-medium text-[18px] lg:text-[22px] leading-[28px] text-[#e16036]" style={{ fontVariationSettings: "'wdth' 100" }}>
              {course.discountPrice}
            </p>
            <p className="font-['Roboto:Medium',sans-serif] font-medium text-[18px] lg:text-[22px] leading-[28px] text-[#515151] line-through decoration-solid" style={{ fontVariationSettings: "'wdth' 100" }}>
              {course.originalPrice}
            </p>
          </div>
        </div>

        {/* Currently Enrolling Classes */}
        <div className="flex flex-col gap-3 lg:gap-4">
          <div className="flex gap-[10px] items-center">
            <div className="relative shrink-0 size-[28px]">
              <div className="absolute inset-[8.33%_8.33%_12.5%_12.5%]">
                <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 22.1664 22.1664">
                  <path d={svgPaths.p2d0f62f0} fill="var(--fill-0, #3384A9)" />
                </svg>
              </div>
            </div>
            <p className="font-['Roboto:Regular','Noto_Sans_JP:Regular',sans-serif] text-[18px] lg:text-[22px] leading-[28px] text-[#3384a9]" style={{ fontVariationSettings: "'wdth' 100" }}>
              {course.classes.length > 0 ? t.courses.enrollingClasses : t.courses.comingSoon}
            </p>
          </div>

          {/* Class List or Coming Soon Message */}
          {course.classes.length > 0 ? (
            <div className="grid grid-cols-2 gap-3 min-h-[100px]">
              {course.classes.slice(0, 8).map((classItem, index) => (
                <div
                  key={index}
                  className={`rounded-[20px] border ${
                    classItem.isFull
                      ? 'bg-[#f8f8f8] border-[#b9b9b9]'
                      : 'bg-[#f4fcff] border-[#44b0e2]'
                  } px-4 py-2`}
                >
                  <div className={`flex items-center pb-[6px] border-b ${
                    classItem.isFull ? 'border-[#b9b9b9]' : 'border-[#44b0e2]'
                  } ${classItem.isFull ? 'gap-2' : ''}`}>
                    <p className={`flex-1 font-['Roboto:Semibold',sans-serif] text-[16px] leading-[24px] tracking-[0.15px] ${
                      classItem.isFull ? 'text-[#515151]' : 'text-[#292929]'
                    }`}>
                      {classItem.date}
                    </p>
                    {classItem.isFull && (
                      <div className="bg-[#e16036] rounded-[4px] px-2">
                        <p className="font-['Roboto:Semibold',sans-serif] text-[11px] leading-[16px] text-white tracking-[0.3px]">
                          FULL
                        </p>
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col gap-1 mt-[6px]">
                    <div className="flex gap-[2px] items-center">
                      <div className="relative shrink-0 size-[16px]">
                        <div className="absolute inset-[8.33%]">
                          <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 13.3333 13.3333">
                            <path d={svgPaths.pd2c6600} fill="var(--fill-0, #515151)" />
                          </svg>
                        </div>
                        <div className="absolute inset-[20.83%_35.36%_36%_45.83%]">
                          <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 3.00956 6.90667">
                            <path d={svgPaths.p2b3fd570} fill="var(--fill-0, #515151)" />
                          </svg>
                        </div>
                      </div>
                      <p className="font-['Roboto:Regular',sans-serif] text-[14px] leading-[20px] text-[#515151] tracking-[0.1px]" style={{ fontVariationSettings: "'wdth' 100" }}>
                        {classItem.time}
                      </p>
                    </div>
                    <div className="flex gap-[2px] items-center">
                      <div className="relative shrink-0 size-[16px]">
                        <div className="absolute inset-[8.33%_19.92%_8.29%_19.87%]">
                          <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 9.63333 13.34">
                            <path d={svgPaths.p23b33300} fill="var(--fill-0, #515151)" />
                          </svg>
                        </div>
                        <div className="absolute inset-[26.42%_37.96%_49.5%_37.96%]">
                          <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 3.85333 3.85333">
                            <path d={svgPaths.p37456e00} fill="var(--fill-0, #515151)" />
                          </svg>
                        </div>
                      </div>
                      <p className="font-['Roboto:Regular','Noto_Sans_JP:Regular',sans-serif] text-[14px] leading-[20px] text-[#515151] tracking-[0.1px]" style={{ fontVariationSettings: "'wdth' 100" }}>
                        {classItem.location}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-[#f4fcff] border border-[#44b0e2] rounded-[20px] px-6 py-8 flex items-center justify-center min-h-[100px]">
              <p className="font-['Roboto:Regular','Noto_Sans_JP:Regular',sans-serif] text-[16px] leading-[24px] text-[#3384a9] text-center tracking-[0.3px]" style={{ fontVariationSettings: "'wdth' 100" }}>
                {t.courses.comingSoon}
              </p>
            </div>
          )}
        </div>

        {/* Enroll Button */}
        <div className="bg-[#44b0e2] h-[56px] rounded-[360px] cursor-pointer hover:bg-[#3a9ad0] transition-colors border-2 border-[#44b0e2] shadow-[0px_8px_12px_0px_rgba(0,0,0,0.08),0px_4px_6px_0px_rgba(0,0,0,0.16)] w-full">
          <div className="flex items-center justify-center h-full gap-2 px-8 py-4">
            <div className="relative shrink-0 size-[20px]">
              <div className="absolute inset-[8.33%_8.33%_12.5%_12.5%]">
                <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 15.8331 15.8331">
                  <path d={svgPaths.p11544500} fill="var(--fill-0, white)" />
                </svg>
              </div>
            </div>
            <p className="font-['Roboto:Semibold','Noto_Sans_JP:Bold',sans-serif] text-[16px] leading-[24px] text-white tracking-[0.15px]" style={{ fontVariationSettings: "'wght' 700" }}>
              {t.courses.enrollButton}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export function CoursesSection() {
  const { t } = useLanguage();

  const courses: Course[] = [
    {
      id: '1',
      title: t.courses.course1.title,
      description: t.courses.course1.description,
      duration: t.courses.course1.duration,
      originalPrice: t.courses.course1.originalPrice,
      discountPrice: t.courses.course1.discountPrice,
      image: imgImageCyclingCrashCourseForBeginners,
      classes: t.courses.course1.classes,
    },
    {
      id: '2',
      title: t.courses.course2.title,
      description: t.courses.course2.description,
      duration: t.courses.course2.duration,
      originalPrice: t.courses.course2.originalPrice,
      discountPrice: t.courses.course2.discountPrice,
      image: imgImageCyclingCrashCourseForBeginners1,
      classes: t.courses.course2.classes,
    },
    {
      id: '3',
      title: t.courses.course3.title,
      description: t.courses.course3.description,
      duration: t.courses.course3.duration,
      originalPrice: t.courses.course3.originalPrice,
      discountPrice: t.courses.course3.discountPrice,
      image: imgImageCyclingCrashCourseForBeginners2,
      classes: t.courses.course3.classes,
    },
    {
      id: '4',
      title: t.courses.course4.title,
      description: t.courses.course4.description,
      duration: t.courses.course4.duration,
      originalPrice: t.courses.course4.originalPrice,
      discountPrice: t.courses.course4.discountPrice,
      image: imgImageCyclingCrashCourseForBeginners3,
      classes: t.courses.course4.classes,
    },
  ];

  return (
    <section className="relative w-full py-[60px] lg:py-[80px] px-4 sm:px-6 lg:px-[80px]" data-name="Courses">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-white from-[20%] to-[#b4dff2] to-[55%] -z-10" />
      <div className="absolute bottom-0 left-0 right-0 h-[300px] lg:h-[493px] -z-10">
        <img alt="" className="w-full h-full object-cover pointer-events-none" src={imgAsset11} />
      </div>

      {/* Content */}
      <div className="max-w-[1120px] mx-auto">
        {/* Header */}
        <div className="flex flex-col gap-6 lg:gap-8 items-center justify-center max-w-[720px] mx-auto mb-8 lg:mb-12">
          <div className="bg-[#b4dff3] px-3 py-1 rounded-[40px]">
            <p className="font-['Inter:Semi_Bold','Noto_Sans_JP:Bold',sans-serif] font-semibold text-[14px] leading-[20px] text-[#225871] tracking-[-0.1504px]">
              {t.courses.tag}
            </p>
          </div>
          <h2 className="font-['Comfortaa:Semibold','Noto_Sans_JP:Bold',sans-serif] text-[20px] sm:text-[24px] leading-[28px] sm:leading-[32px] text-[#44b0e2] text-center" style={{ fontVariationSettings: "'wght' 700" }}>
            {t.courses.title}
          </h2>
          <p className="font-['Roboto:Regular','Noto_Sans_JP:Regular',sans-serif] text-[16px] leading-[24px] text-[#141414] text-center tracking-[0.3px]" style={{ fontVariationSettings: "'wdth' 100" }}>
            {t.courses.subtitle}
          </p>
        </div>

        {/* Course Cards */}
        <div className="flex flex-col gap-8 lg:gap-12">
          {courses.map((course) => (
            <CourseCard key={course.id} course={course} />
          ))}
        </div>
      </div>
    </section>
  );
}