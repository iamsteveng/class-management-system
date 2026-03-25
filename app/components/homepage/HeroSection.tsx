import { useLanguage } from '../../contexts/LanguageContext';
import svgPaths from './imports/svg-ypfkyueyij';
const imgDsc09653Scaled1 = '/images/homepage/d54ac782d568704845672fa2c56ae5346633aa13.png';

function FeatureIcon({ children }: React.PropsWithChildren<{}>) {
  return (
    <div className="bg-[rgba(105,192,232,0.3)] relative rounded-[10px] shrink-0 size-[48px]">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col items-start pt-[12px] px-[12px] relative size-full">
        {children}
      </div>
    </div>
  );
}

function FeatureText({ children }: React.PropsWithChildren<{}>) {
  return (
    <div className="relative shrink-0 w-[150px]">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col items-start leading-[24px] relative w-full">
        {children}
      </div>
    </div>
  );
}

function Icon2Vector({ additionalClassNames = "" }: { additionalClassNames?: string }) {
  return (
    <div className={additionalClassNames}>
      <div className="absolute inset-[-6.67%_-1px]">
        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 2 17">
          <path d="M1 1V16" id="Vector" stroke="var(--stroke-0, #3384A9)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
        </svg>
      </div>
    </div>
  );
}

type FeatureCardProps = {
  title: string;
  description: string;
  icon: 'instructor' | 'safety' | 'tour';
};

function FeatureCard({ title, description, icon }: FeatureCardProps) {
  return (
    <div className="backdrop-blur-[2px] bg-[rgba(255,255,255,0.5)] md:flex-none flex-[1_0_0] min-h-px min-w-px relative rounded-[14px] w-full md:w-auto">
      <div aria-hidden="true" className="absolute border border-[rgba(255,255,255,0.7)] border-solid inset-0 pointer-events-none rounded-[14px]" />
      <div className="flex flex-row items-center size-full">
        <div className="content-stretch flex gap-[16px] items-center px-[17px] py-px relative size-full">
          <FeatureIcon>
            <div className="h-[24px] overflow-clip relative shrink-0 w-full">
              {icon === 'instructor' && (
                <>
                  <div className="absolute inset-[62.5%_33.33%_12.5%_8.33%]">
                    <div className="absolute inset-[-16.67%_-7.14%]">
                      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 16 8">
                        <path d={svgPaths.p11b86180} id="Vector" stroke="var(--stroke-0, #3384A9)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
                      </svg>
                    </div>
                  </div>
                  <div className="absolute inset-[12.5%_45.83%_54.17%_20.83%]">
                    <div className="absolute inset-[-12.5%]">
                      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 10 10">
                        <path d={svgPaths.pb08b100} id="Vector" stroke="var(--stroke-0, #3384A9)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
                      </svg>
                    </div>
                  </div>
                  <div className="absolute inset-[63.04%_8.33%_12.5%_79.17%]">
                    <div className="absolute inset-[-17.04%_-33.33%_-17.04%_-33.34%]">
                      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 5.00024 7.87024">
                        <path d={svgPaths.p19976900} id="Vector" stroke="var(--stroke-0, #3384A9)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
                      </svg>
                    </div>
                  </div>
                  <div className="absolute inset-[13.04%_20.8%_54.67%_66.67%]">
                    <div className="absolute inset-[-12.91%_-33.25%]">
                      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 5.00808 9.75048">
                        <path d={svgPaths.p29500900} id="Vector" stroke="var(--stroke-0, #3384A9)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
                      </svg>
                    </div>
                  </div>
                </>
              )}
              {icon === 'safety' && (
                <>
                  <div className="absolute inset-[8.33%_16.67%_8.32%_16.67%]">
                    <div className="absolute inset-[-5%_-6.25%]">
                      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 18 22.0034">
                        <path d={svgPaths.p27979bf0} id="Vector" stroke="var(--stroke-0, #3384A9)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
                      </svg>
                    </div>
                  </div>
                  <div className="absolute inset-[41.67%_37.5%]">
                    <div className="absolute inset-[-25%_-16.67%]">
                      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 8 6">
                        <path d="M1 3L3 5L7 1" id="Vector" stroke="var(--stroke-0, #3384A9)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
                      </svg>
                    </div>
                  </div>
                </>
              )}
              {icon === 'tour' && (
                <>
                  <div className="absolute inset-[13.48%_12.5%]">
                    <div className="absolute inset-[-5.7%_-5.56%]">
                      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 20 19.5289">
                        <path d={svgPaths.p33b0ef00} id="Vector" stroke="var(--stroke-0, #3384A9)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
                      </svg>
                    </div>
                  </div>
                  <Icon2Vector additionalClassNames="absolute inset-[24.02%_37.5%_13.48%_62.5%]" />
                  <Icon2Vector additionalClassNames="absolute inset-[13.48%_62.5%_24.02%_37.5%]" />
                </>
              )}
            </div>
          </FeatureIcon>
          <FeatureText>
            <p className="font-['Roboto:Semibold','Noto_Sans_JP:Bold',sans-serif] relative shrink-0 text-[#225871] text-[16px] tracking-[0.15px] whitespace-nowrap md:whitespace-normal w-full" style={{ fontVariationSettings: "'wght' 700" }}>
              {title}
            </p>
            <p className="font-['Roboto:Regular','Noto_Sans_JP:Regular',sans-serif] font-normal min-w-full relative shrink-0 text-[#141414] text-[14px] tracking-[0.3px] w-[min-content]" style={{ fontVariationSettings: "'wdth' 100" }}>
              {description}
            </p>
          </FeatureText>
        </div>
      </div>
    </div>
  );
}

export function HeroSection() {
  const { t } = useLanguage();

  return (
    <section className="relative w-full h-[680px] md:h-[854px]" data-name="Hero banner">
      {/* Background Image with Gradient */}
      <div className="absolute inset-0 overflow-clip">
        <div className="absolute w-full h-full">
          <img 
            alt="Cycling" 
            className="absolute inset-0 w-full h-full object-cover pointer-events-none" 
            src={imgDsc09653Scaled1} 
          />
        </div>
        <div className="absolute bg-gradient-to-r from-[rgba(0,73,109,0.9)] to-[rgba(255,255,255,0)] via-[45%] via-[rgba(0,109,163,0.4)] h-full left-0 top-0 w-full md:w-[1280px]" />
      </div>

      {/* Content - Desktop */}
      <div className="hidden md:flex absolute flex-col gap-[32px] items-start justify-center left-[80px] max-w-[740px] top-[200px] w-[550px]">
        <div className="flex flex-col font-['Comfortaa:Bold','Noto_Sans_JP:Bold',sans-serif] font-bold justify-center leading-[0] relative shrink-0 text-[72px] text-shadow-[0px_1px_3px_rgba(0,0,0,0.15),0px_1px_2px_rgba(0,0,0,0.3)] text-white w-[550px]">
          <p className="leading-[normal]">{t.hero.title}</p>
        </div>
        <div className="flex flex-col font-['Roboto:Regular','Noto_Sans_JP:Regular',sans-serif] font-normal justify-center leading-[0] relative shrink-0 text-[16px] text-shadow-[0px_1px_3px_rgba(0,0,0,0.15),0px_1px_2px_rgba(0,0,0,0.3)] text-white tracking-[0.15px] w-[550px]" style={{ fontVariationSettings: "'wdth' 100" }}>
          <p className="leading-[24px]">{t.hero.subtitle}</p>
        </div>
        <div className="content-stretch flex h-[56px] items-start relative shrink-0 w-full">
          <div className="bg-[#44b0e2] h-[56px] min-w-[120px] relative rounded-[360px] shrink-0 cursor-pointer hover:bg-[#3a9ad0] transition-colors">
            <div aria-hidden="true" className="absolute border-2 border-[#44b0e2] border-solid inset-0 pointer-events-none rounded-[360px] shadow-[0px_8px_12px_0px_rgba(0,0,0,0.08),0px_4px_6px_0px_rgba(0,0,0,0.16)]" />
            <div className="flex flex-row items-center justify-center min-w-[inherit] size-full">
              <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex gap-[8px] h-full items-center justify-center min-w-[inherit] px-[32px] py-[16px] relative">
                <div className="overflow-clip relative shrink-0 size-[20px]">
                  <div className="absolute inset-[22%_-7.7%_2.3%_12.3%]">
                    <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 15.9004 12.6162">
                      <path d={svgPaths.p5f2680} fill="var(--fill-0, white)" id="Union" />
                    </svg>
                  </div>
                </div>
                <p className="font-['Roboto:Semibold','Noto_Sans_JP:Bold',sans-serif] leading-[24px] relative shrink-0 text-[16px] text-center text-white tracking-[0.15px] whitespace-nowrap" style={{ fontVariationSettings: "'wght' 700" }}>
                  {t.hero.ctaExplore}
                </p>
              </div>
            </div>
          </div>
        </div>
        <div className="gap-x-[24px] gap-y-[24px] grid-cols-[repeat(3,fit-content(100%))] grid-rows-[repeat(1,minmax(0,1fr))] h-[98px] inline-grid relative shrink-0">
          <FeatureCard title={t.hero.feature1Title} description={t.hero.feature1Desc} icon="instructor" />
          <FeatureCard title={t.hero.feature2Title} description={t.hero.feature2Desc} icon="safety" />
          <FeatureCard title={t.hero.feature3Title} description={t.hero.feature3Desc} icon="tour" />
        </div>
      </div>

      {/* Content - Mobile */}
      <div className="md:hidden absolute left-1/2 -translate-x-1/2 flex flex-col gap-[24px] items-start top-[80px] w-[calc(100%-32px)] max-w-[390px] px-4">
        <div className="flex flex-col font-['Comfortaa:Semibold','Noto_Sans_JP:Bold',sans-serif] relative shrink-0 text-[32px] text-shadow-[0px_1px_3px_rgba(0,0,0,0.15),0px_1px_2px_rgba(0,0,0,0.3)] text-white w-full" style={{ fontVariationSettings: "'wght' 700" }}>
          <p className="leading-[40px]">{t.hero.title}</p>
        </div>
        <div className="flex flex-col font-['Roboto:Regular','Noto_Sans_JP:Regular',sans-serif] font-normal relative shrink-0 text-[16px] text-shadow-[0px_1px_3px_rgba(0,0,0,0.15),0px_1px_2px_rgba(0,0,0,0.3)] text-white tracking-[0.15px] w-full" style={{ fontVariationSettings: "'wdth' 100" }}>
          <p className="leading-[24px]">{t.hero.subtitle}</p>
        </div>
        <div className="flex flex-col gap-[12px] items-start relative shrink-0 w-full">
          {/* Primary Button */}
          <div className="bg-[#44b0e2] h-[56px] min-w-[120px] relative rounded-[360px] shrink-0 w-full cursor-pointer hover:bg-[#3a9ad0] transition-colors">
            <div aria-hidden="true" className="absolute border-2 border-[#44b0e2] border-solid inset-0 pointer-events-none rounded-[360px] shadow-[0px_8px_12px_0px_rgba(0,0,0,0.08),0px_4px_6px_0px_rgba(0,0,0,0.16)]" />
            <div className="flex flex-row items-center justify-center min-w-[inherit] size-full">
              <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex gap-[8px] items-center justify-center min-w-[inherit] px-[32px] py-[16px] relative size-full">
                <div className="overflow-clip relative shrink-0 size-[20px]">
                  <div className="absolute inset-[22%_-7.7%_2.3%_12.3%]">
                    <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 15.9004 12.6162">
                      <path d={svgPaths.p5f2680} fill="var(--fill-0, white)" id="Union" />
                    </svg>
                  </div>
                </div>
                <p className="font-['Roboto:Semibold','Noto_Sans_JP:Bold',sans-serif] leading-[24px] relative shrink-0 text-[16px] text-center text-white tracking-[0.15px] whitespace-nowrap" style={{ fontVariationSettings: "'wght' 700" }}>
                  {t.hero.ctaExplore}
                </p>
              </div>
            </div>
          </div>
          {/* Secondary Button */}
          <div className="bg-white h-[56px] min-w-[120px] relative rounded-[360px] shrink-0 w-full cursor-pointer hover:bg-gray-50 transition-colors">
            <div aria-hidden="true" className="absolute border-2 border-[#44b0e2] border-solid inset-0 pointer-events-none rounded-[360px]" />
            <div className="flex flex-row items-center justify-center min-w-[inherit] size-full">
              <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex gap-[8px] items-center justify-center min-w-[inherit] p-[16px] relative size-full">
                <p className="font-['Roboto:Semibold','Noto_Sans_JP:Bold',sans-serif] leading-[24px] relative shrink-0 text-[#515151] text-[16px] text-center tracking-[0.15px] whitespace-nowrap" style={{ fontVariationSettings: "'wght' 700" }}>
                  {t.hero.ctaEnroll}
                </p>
              </div>
            </div>
          </div>
        </div>
        <div className="flex flex-col gap-[16px] items-start relative shrink-0 w-full">
          <FeatureCard title={t.hero.feature1Title} description={t.hero.feature1Desc} icon="instructor" />
          <FeatureCard title={t.hero.feature2Title} description={t.hero.feature2Desc} icon="safety" />
          <FeatureCard title={t.hero.feature3Title} description={t.hero.feature3Desc} icon="tour" />
        </div>
      </div>
    </section>
  );
}