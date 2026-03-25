import { useState } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import svgPaths from '../../imports/svg-i6m4lm0t54';
import clsx from 'clsx';

type TopNavGroupProps = {
  additionalClassNames?: string;
};

function TopNavGroup({ children, additionalClassNames = "" }: React.PropsWithChildren<TopNavGroupProps>) {
  return (
    <div className={clsx("absolute", additionalClassNames)}>
      <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 17.2415 17.2561">
        <g id="Group">{children}</g>
      </svg>
    </div>
  );
}

export function Header() {
  const { language, setLanguage } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);

  const toggleLanguage = (lang: 'zh-TW' | 'en') => {
    setLanguage(lang);
    setIsOpen(false);
  };

  return (
    <header className="bg-[rgba(255,255,255,0.92)] sticky top-0 z-50 w-full backdrop-blur-sm" data-name="Top Nav">
      <div className="content-stretch flex flex-col items-start relative w-full">
        <div className="h-[70px] md:h-[110px] relative shrink-0 w-full">
          <div className="flex flex-row items-center size-full">
            <div className="content-stretch flex gap-[24px] items-center px-4 md:px-[80px] py-[16px] relative size-full">
              {/* Logo and Text */}
              <div className="content-stretch flex flex-[1_0_0] gap-[14px] items-center min-h-px min-w-px relative">
                <div className="h-[40px] md:h-[66px] overflow-clip relative shrink-0 w-[45px] md:w-[75px]" data-name="logo">
                  <div className="absolute inset-[59.56%_0_16%_78.09%]" data-name="Group">
                    <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 16.4346 16.1269">
                      <g id="Group">
                        <path d={svgPaths.p31e32fc0} fill="var(--fill-0, #FFED92)" id="Vector" />
                        <path d={svgPaths.p1a330d00} fill="var(--fill-0, #0C0014)" id="Vector_2" />
                      </g>
                    </svg>
                  </div>
                  <div className="absolute inset-[59.56%_78.09%_16%_0]" data-name="Group">
                    <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 16.4347 16.1269">
                      <g id="Group">
                        <path d={svgPaths.p35ea6480} fill="var(--fill-0, #FFED92)" id="Vector" />
                        <path d={svgPaths.p27051e80} fill="var(--fill-0, #0C0014)" id="Vector_2" />
                      </g>
                    </svg>
                  </div>
                  <div className="absolute inset-[66.58%_9.14%_0_9.14%]" data-name="Group">
                    <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 61.2854 22.0572">
                      <g id="Group">
                        <path d={svgPaths.p5c4c400} fill="var(--fill-0, #FFED92)" id="Vector" />
                        <path d={svgPaths.p1c056680} fill="var(--fill-0, #0C0014)" id="Vector_2" />
                      </g>
                    </svg>
                  </div>
                  <div className="absolute inset-[0_22.14%_21.47%_22.14%]" data-name="Vector">
                    <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 41.7885 51.8331">
                      <path d={svgPaths.p1d9c140} fill="var(--fill-0, #0C0014)" id="Vector" />
                    </svg>
                  </div>
                  <div className="absolute inset-[3.69%_25.39%_25.16%_25.39%]" data-name="Vector">
                    <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 36.9177 46.9586">
                      <path d={svgPaths.p1e5cd080} fill="var(--fill-0, #0C0014)" id="Vector" />
                    </svg>
                  </div>
                  <div className="absolute inset-[33.53%_25.39%_25.15%_25.39%]" data-name="Vector">
                    <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 36.9181 27.2694">
                      <path d={svgPaths.pa89c380} fill="var(--fill-0, #5FC8A7)" id="Vector" />
                    </svg>
                  </div>
                  <TopNavGroup additionalClassNames="inset-[3.69%_51.62%_70.16%_25.39%]">
                    <path d={svgPaths.p1053f1c0} fill="var(--fill-0, #60B4E5)" id="Vector" />
                    <path d={svgPaths.p3c8c5800} fill="var(--fill-0, white)" id="Vector_2" />
                    <path d={svgPaths.pa582f00} fill="var(--fill-0, white)" id="Vector_3" />
                  </TopNavGroup>
                  <TopNavGroup additionalClassNames="inset-[3.69%_25.39%_70.16%_51.62%]">
                    <path d={svgPaths.p1053f1c0} fill="var(--fill-0, #FF8D81)" id="Vector" />
                    <g id="Group_2">
                      <path d={svgPaths.p16b06a50} fill="var(--fill-0, white)" id="Vector_2" />
                      <path d={svgPaths.p1a70d080} fill="var(--fill-0, white)" id="Vector_3" />
                      <path d={svgPaths.p1e378170} fill="var(--fill-0, white)" id="Vector_4" />
                      <path d={svgPaths.p1f58b100} fill="var(--fill-0, white)" id="Vector_5" />
                      <path d={svgPaths.p323fb900} fill="var(--fill-0, #FF8D81)" id="Vector_6" />
                      <path d={svgPaths.p8a22400} fill="var(--fill-0, #FF8D81)" id="Vector_7" />
                      <path d={svgPaths.p38a65780} fill="var(--fill-0, #FF8D81)" id="Vector_8" />
                    </g>
                  </TopNavGroup>
                  <div className="absolute inset-[36.29%_27.02%_31.81%_27.29%]" data-name="Group">
                    <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 34.2666 21.0531">
                      <g id="Group">
                        <path d={svgPaths.ped2dc00} fill="var(--fill-0, white)" id="Vector" />
                        <path d={svgPaths.p3a7589c0} fill="var(--fill-0, white)" id="Vector_2" />
                        <path d={svgPaths.p24596e00} fill="var(--fill-0, white)" id="Vector_3" />
                        <path d={svgPaths.p13b80300} fill="var(--fill-0, white)" id="Vector_4" />
                        <path d={svgPaths.pb315080} fill="var(--fill-0, white)" id="Vector_5" />
                      </g>
                    </svg>
                  </div>
                  <div className="absolute inset-[36.3%_66.13%_56.29%_27.02%]" data-name="Vector">
                    <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 5.14008 4.89276">
                      <path d={svgPaths.p1c6e3700} fill="var(--fill-0, #FFED92)" id="Vector" />
                    </svg>
                  </div>
                  <div className="absolute inset-[74.89%_16.53%_5.63%_16.64%]" data-name="Group">
                    <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 50.1191 12.8597">
                      <g id="Group">
                        <path d={svgPaths.p8893000} fill="var(--fill-0, #0C0014)" id="Vector" />
                        <path d={svgPaths.p1916a800} fill="var(--fill-0, #0C0014)" id="Vector_2" />
                        <path d={svgPaths.p18b54100} fill="var(--fill-0, #0C0014)" id="Vector_3" />
                        <path d={svgPaths.p414ecf0} fill="var(--fill-0, #0C0014)" id="Vector_4" />
                        <path d={svgPaths.p10075d00} fill="var(--fill-0, #0C0014)" id="Vector_5" />
                        <path d={svgPaths.p32154a00} fill="var(--fill-0, #0C0014)" id="Vector_6" />
                        <path d={svgPaths.p3af8eb00} fill="var(--fill-0, #0C0014)" id="Vector_7" />
                        <path d={svgPaths.p3edc480} fill="var(--fill-0, #0C0014)" id="Vector_8" />
                      </g>
                    </svg>
                  </div>
                </div>
                <div className="hidden md:flex flex-col font-['Roboto:Semibold','Noto_Sans_JP:Bold',sans-serif] justify-center leading-[0] relative shrink-0 text-foreground text-[16px] tracking-[0.15px] whitespace-nowrap" style={{ fontVariationSettings: "'wght' 700" }}>
                  <p className="leading-[24px]">樂區單車安全學院</p>
                </div>
              </div>
              
              {/* Language Selector */}
              <div className="content-stretch flex gap-[36px] items-center justify-center relative shrink-0">
                <div className="relative">
                  <button
                    onClick={() => setIsOpen(!isOpen)}
                    className="content-stretch flex gap-[6px] h-[40px] md:h-[48px] items-center justify-center min-w-[100px] md:min-w-[120px] px-[12px] md:px-[16px] py-[8px] relative rounded-[var(--radius-button)] shrink-0 hover:bg-muted transition-colors"
                    data-name="Button"
                  >
                    <div aria-hidden="true" className="absolute border-2 border-[#515151] border-solid inset-0 pointer-events-none rounded-[var(--radius-button)]" />
                    <div className="overflow-clip relative shrink-0 size-[16px]" data-name="icons/outline/language">
                      <div className="absolute inset-[8.33%]" data-name="Vector">
                        <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 13.3333 13.3333">
                          <path d={svgPaths.p368fd000} fill="var(--fill-0, #141414)" id="Vector" />
                        </svg>
                      </div>
                    </div>
                    <p className="font-['Roboto:Medium','Noto_Sans_JP:Medium',sans-serif] font-medium leading-[20px] relative shrink-0 text-foreground text-[14px] tracking-[0.1px] whitespace-nowrap" style={{ fontVariationSettings: "'wdth' 100" }}>
                      {language === 'zh-TW' ? '繁體' : 'EN'}
                    </p>
                    <div className="overflow-clip relative shrink-0 size-[16px]" data-name="icons/outline/arrow-down">
                      <div className="absolute inset-[32.29%_15.63%_28.13%_15.63%]" data-name="Icon (Stroke)">
                        <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 10.9999 6.33321">
                          <path d={svgPaths.p27a3b300} fill="var(--fill-0, #979797)" id="Icon (Stroke)" />
                        </svg>
                      </div>
                    </div>
                  </button>
                  
                  {/* Dropdown Menu */}
                  {isOpen && (
                    <div className="absolute right-0 mt-2 w-[120px] bg-card border border-border rounded-[var(--radius)] shadow-lg overflow-hidden z-50">
                      <button
                        onClick={() => toggleLanguage('zh-TW')}
                        className={clsx(
                          "w-full px-4 py-3 text-left text-sm hover:bg-muted transition-colors",
                          language === 'zh-TW' ? 'bg-muted text-primary font-semibold' : 'text-foreground'
                        )}
                      >
                        繁體中文
                      </button>
                      <button
                        onClick={() => toggleLanguage('en')}
                        className={clsx(
                          "w-full px-4 py-3 text-left text-sm hover:bg-muted transition-colors",
                          language === 'en' ? 'bg-muted text-primary font-semibold' : 'text-foreground'
                        )}
                      >
                        English
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
