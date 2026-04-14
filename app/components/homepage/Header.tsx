import { useState } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import Logo from './Logo';
import svgPaths from './imports/svg-i6m4lm0t54';
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
                  <Logo />
                </div>
                <div className="hidden md:flex flex-col font-['Roboto:Semibold','Noto_Sans_JP:Bold',sans-serif] justify-center leading-[0] relative shrink-0 text-foreground text-[16px] tracking-[0.15px] whitespace-nowrap" style={{ fontVariationSettings: "'wght' 700" }}>
                  <p className="leading-[24px]">樂區單車安全教室</p>
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
