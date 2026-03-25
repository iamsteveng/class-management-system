import { useLanguage } from '../contexts/LanguageContext';
import svgPaths from '../../imports/svg-05zl6bzled';
import imgLightBigVertical from 'figma:asset/68ca555f0ca55e85b799fc4861d7e68bc12627d4.png';

function Icon() {
  return (
    <div className="relative shrink-0 size-[24px]">
      <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 24 24">
        <g id="Icon">
          <path d={svgPaths.pace200} id="Vector" stroke="var(--stroke-0, #19B2A8)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
          <path d="M9 12L11 14L15 10" id="Vector_2" stroke="var(--stroke-0, #19B2A8)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
        </g>
      </svg>
    </div>
  );
}

export function AboutUsSection() {
  const { t } = useLanguage();

  return (
    <section className="w-full py-[80px] px-4 md:px-[80px] bg-white" data-name="About Us">
      <div className="max-w-[1440px] mx-auto">
        <div className="flex flex-col lg:flex-row gap-[40px] lg:gap-[20px] items-center justify-center">
          {/* Image Column - Desktop */}
          <div className="hidden lg:block relative shrink-0">
            {/* Rotated background */}
            <div className="absolute -translate-x-1/2 flex items-center justify-center left-[calc(50%-0.29px)] top-[-19.78px]" style={{ width: '575.414px', height: '528.1px' }}>
              <div className="-rotate-3">
                <div className="bg-[#daeff9] h-[500px] rounded-[32px] w-[550px]" />
              </div>
            </div>
            {/* Image container */}
            <div className="relative h-[480px] overflow-clip rounded-[32px] w-[530px]">
              <div className="absolute h-[500px] left-0 top-0 w-[550px]">
                <img alt="Cycling students" className="absolute inset-0 max-w-none object-cover pointer-events-none size-full" src={imgLightBigVertical} />
              </div>
            </div>
            {/* Stats Card */}
            <div className="absolute bg-white flex flex-col gap-[6px] left-[308px] p-[16px] rounded-[20px] shadow-[0px_8px_12px_0px_rgba(0,0,0,0.08),0px_4px_6px_0px_rgba(0,0,0,0.16)] text-[#19b2a8] top-[351px] w-[232px]">
              <div className="flex gap-[4px] items-end w-full">
                <p className="font-['Roboto:Medium','Noto_Sans_JP:Medium',sans-serif] font-medium leading-[28px] text-[22px] whitespace-nowrap" style={{ fontVariationSettings: "'wdth' 100" }}>
                  {t.about.statsText1}
                </p>
                <p className="font-['Comfortaa:Bold',sans-serif] font-bold h-[47px] leading-[54px] text-[48px] tracking-[-2px] w-[104px]">{t.about.statsNumber}</p>
                <p className="font-['Roboto:Medium','Noto_Sans_JP:Medium',sans-serif] font-medium leading-[28px] text-[22px] whitespace-nowrap" style={{ fontVariationSettings: "'wdth' 100" }}>
                  學員
                </p>
              </div>
              <p className="font-['Roboto:Medium','Noto_Sans_JP:Medium','Noto_Sans_SC:Medium',sans-serif] font-medium leading-[28px] text-[22px] whitespace-pre-line" style={{ fontVariationSettings: "'wdth' 100" }}>
                成功發掘踩車樂趣
              </p>
            </div>
          </div>

          {/* Image Column - Mobile */}
          <div className="lg:hidden relative w-full max-w-[530px]">
            {/* Rotated background */}
            <div className="absolute left-1/2 -translate-x-1/2 top-[-10px] w-[90%] max-w-[500px]" style={{ height: 'calc(100% + 20px)' }}>
              <div className="-rotate-3 h-full">
                <div className="bg-[#daeff9] h-full rounded-[32px] w-full" />
              </div>
            </div>
            {/* Image container */}
            <div className="relative h-[400px] sm:h-[480px] overflow-clip rounded-[32px] mx-auto" style={{ maxWidth: '90%' }}>
              <img alt="Cycling students" className="absolute inset-0 w-full h-full object-cover pointer-events-none" src={imgLightBigVertical} />
            </div>
            {/* Stats Card - Mobile */}
            <div className="absolute bottom-[-30px] right-[5%] bg-white flex flex-col gap-[6px] p-[16px] rounded-[20px] shadow-[0px_8px_12px_0px_rgba(0,0,0,0.08),0px_4px_6px_0px_rgba(0,0,0,0.16)] text-[#19b2a8] w-[200px] sm:w-[232px]">
              <div className="flex gap-[4px] items-end w-full flex-wrap">
                <p className="font-['Roboto:Medium','Noto_Sans_JP:Medium',sans-serif] font-medium leading-[28px] text-[18px] sm:text-[22px] whitespace-nowrap" style={{ fontVariationSettings: "'wdth' 100" }}>
                  {t.about.statsText1}
                </p>
                <p className="font-['Comfortaa:Bold',sans-serif] font-bold leading-[44px] sm:leading-[54px] text-[40px] sm:text-[48px] tracking-[-2px]">{t.about.statsNumber}</p>
                <p className="font-['Roboto:Medium','Noto_Sans_JP:Medium',sans-serif] font-medium leading-[28px] text-[18px] sm:text-[22px] whitespace-nowrap" style={{ fontVariationSettings: "'wdth' 100" }}>
                  學員
                </p>
              </div>
              <p className="font-['Roboto:Medium','Noto_Sans_JP:Medium','Noto_Sans_SC:Medium',sans-serif] font-medium leading-[24px] sm:leading-[28px] text-[18px] sm:text-[22px] whitespace-pre-line" style={{ fontVariationSettings: "'wdth' 100" }}>
                成功發掘踩車樂趣
              </p>
            </div>
          </div>

          {/* Content Column */}
          <div className="flex-1 w-full min-w-0 lg:min-w-[400px] mt-[40px] lg:mt-0">
            <div className="flex flex-col justify-center px-0 lg:px-[40px] max-w-[720px] mx-auto lg:mx-0">
              <div className="flex flex-col gap-[24px] sm:gap-[32px] pb-[24px]">
                {/* Tag */}
                <div className="bg-[#b4dff3] inline-flex items-center justify-center px-[12px] py-[4px] rounded-[40px] self-start">
                  <p className="font-['Inter:Semi_Bold','Noto_Sans_JP:Bold',sans-serif] font-semibold leading-[20px] text-[#225871] text-[14px] tracking-[-0.1504px] whitespace-nowrap">{t.about.tag}</p>
                </div>

                {/* Title */}
                <div className="flex flex-col font-['Comfortaa:Semibold','Noto_Sans_JP:Bold',sans-serif] text-[#44b0e2] text-[20px] sm:text-[24px]" style={{ fontVariationSettings: "'wght' 700" }}>
                  <p className="leading-[28px] sm:leading-[32px]">{t.about.title}</p>
                </div>

                {/* Description */}
                <div className="flex flex-col font-['Roboto:Regular','Noto_Sans_JP:Regular','Noto_Sans_SC:Regular',sans-serif] font-normal text-[#141414] text-[16px] tracking-[0.3px]" style={{ fontVariationSettings: "'wdth' 100" }}>
                  <p className="leading-[24px]">{t.about.description}</p>
                </div>

                {/* List - advantages */}
                <div className="flex flex-col gap-[12px] sm:gap-[16px]">
                  <div className="flex gap-[12px] items-start">
                    <Icon />
                    <p className="font-['Inter:Regular','Noto_Sans_JP:Regular',sans-serif] font-normal leading-[24px] text-[#364153] text-[16px] tracking-[-0.3125px] flex-1">
                      {t.about.advantage1}
                    </p>
                  </div>
                  <div className="flex gap-[12px] items-start">
                    <Icon />
                    <p className="font-['Inter:Regular','Noto_Sans_JP:Regular',sans-serif] font-normal leading-[24px] text-[#364153] text-[16px] tracking-[-0.3125px] flex-1">
                      {t.about.advantage2}
                    </p>
                  </div>
                  <div className="flex gap-[12px] items-start">
                    <Icon />
                    <p className="font-['Inter:Regular','Noto_Sans_JP:Regular',sans-serif] font-normal leading-[24px] text-[#364153] text-[16px] tracking-[-0.3125px] flex-1">
                      {t.about.advantage3}
                    </p>
                  </div>
                  <div className="flex gap-[12px] items-start">
                    <Icon />
                    <p className="font-['Inter:Regular','Noto_Sans_JP:Regular',sans-serif] font-normal leading-[24px] text-[#364153] text-[16px] tracking-[-0.3125px] flex-1">
                      {t.about.advantage4}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
