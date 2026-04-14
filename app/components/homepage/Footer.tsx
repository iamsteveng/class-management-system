import { useLanguage } from '../../contexts/LanguageContext';
import Logo from './Logo';
import svgPaths from './imports/svg-2gr9t1i5ns';

export function Footer() {
  const { t } = useLanguage();

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="bg-[#44b0e2] w-full" data-name="Footer">
      <div className="flex flex-col gap-[40px] items-start px-4 sm:px-6 lg:px-[80px] py-[60px] lg:py-[80px] w-full">
        {/* Main Content */}
        <div className="flex flex-col lg:flex-row gap-[40px] lg:gap-[20px] items-start lg:items-end w-full">
          {/* Left Section - Logo, Social, Powered by */}
          <div className="flex flex-col sm:flex-row gap-[40px] sm:gap-[20px] items-start sm:items-end flex-1 w-full lg:min-w-[400px]">
            {/* Logo */}
            <div className="flex flex-col items-start justify-center flex-1 min-w-0">
              <div className="h-[132px] w-[150px] relative overflow-clip" data-name="logo">
                <Logo />
              </div>
            </div>

            {/* Follow Us */}
            <div className="flex flex-col gap-[12px] items-start justify-center flex-1 min-w-0">
              <p className="font-['Roboto:Regular',sans-serif] text-[16px] leading-[24px] text-white tracking-[0.15px]" style={{ fontVariationSettings: "'wdth' 100" }}>
                {t.footer.followUs}
              </p>
              <div className="flex flex-wrap gap-[12px] items-center w-full">
                {/* Facebook */}
                <a href="https://www.facebook.com/locobikehk" target="_blank" rel="noopener noreferrer" className="overflow-clip relative shrink-0 size-[32px] hover:opacity-80 transition-opacity" aria-label="Facebook">
                  <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 32 32">
                    <path d={svgPaths.p1199c300} fill="white" />
                  </svg>
                  <div className="absolute bottom-[24.86%] left-[39.11%] right-[37.75%] top-1/4">
                    <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 7.405 16.045">
                      <path d={svgPaths.p35ae5600} fill="#5EB4E5" />
                    </svg>
                  </div>
                </a>

                {/* Instagram */}
                <a href="#" className="overflow-clip relative shrink-0 size-[32px] hover:opacity-80 transition-opacity" aria-label="Instagram">
                  <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 64 64">
                    <path d={svgPaths.p34a63200} fill="white" />
                  </svg>
                  <div className="absolute inset-[26.56%_25.69%_25.69%_26.56%]">
                    <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 30.56 30.56">
                      <g>
                        <path d={svgPaths.p3e8ce500} fill="#5EB4E5" />
                        <path d={svgPaths.pa325d80} fill="#5EB4E5" />
                        <path d={svgPaths.p17499280} fill="#5EB4E5" />
                      </g>
                    </svg>
                  </div>
                </a>

                {/* YouTube */}
                <a href="#" className="overflow-clip relative shrink-0 size-[32px] hover:opacity-80 transition-opacity" aria-label="YouTube">
                  <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 64 64">
                    <path d={svgPaths.p34a63200} fill="white" />
                  </svg>
                  <div className="absolute inset-[32.81%_25.89%_33.55%_26.56%]">
                    <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 30.43 21.53">
                      <path d={svgPaths.pa89500} fill="#5EB4E5" />
                    </svg>
                  </div>
                </a>
              </div>
            </div>

            {/* Powered by */}
            <div className="flex flex-col gap-[12px] items-start justify-center flex-1 min-w-0">
              <p className="font-['Roboto:Regular',sans-serif] text-[16px] leading-[24px] text-white tracking-[0.15px]" style={{ fontVariationSettings: "'wdth' 100" }}>
                {t.footer.poweredBy}
              </p>
              <div className="h-[32px] w-[163px] overflow-clip relative" data-name="logo_locoBike_hor">
                <div className="absolute inset-[0_52.58%_0.15%_0]">
                  <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 77.2971 31.9513">
                    <path d={svgPaths.p389f500} fill="white" />
                  </svg>
                </div>
                <div className="absolute inset-[0_0_0.01%_49.6%]">
                  <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 82.1498 31.9981">
                    <g>
                      <path d={svgPaths.p241f1200} fill="white" />
                      <path d={svgPaths.p3384f0f0} fill="white" />
                      <path d={svgPaths.p38d4fda0} fill="white" />
                      <path d={svgPaths.p72a1180} fill="white" />
                      <path d={svgPaths.p3823f980} fill="white" />
                    </g>
                  </svg>
                </div>
              </div>
            </div>
          </div>

          {/* Right Section - Scroll to Top Button */}
          <div className="flex flex-col items-end w-full lg:max-w-[550px] lg:flex-1">
            <button
              onClick={scrollToTop}
              className="relative rounded-[100px] size-[64px] border border-solid border-white hover:bg-white/10 transition-colors cursor-pointer"
              aria-label={t.footer.scrollToTop}
            >
              <div className="flex items-center justify-center size-full">
                <div className="relative shrink-0 size-[24px]">
                  <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 24 24">
                    <g>
                      <path d="M12 19V5" stroke="white" strokeLinecap="round" strokeLinejoin="round" />
                      <path d="M5 12L12 5L19 12" stroke="white" strokeLinecap="round" strokeLinejoin="round" />
                    </g>
                  </svg>
                </div>
              </div>
            </button>
          </div>
        </div>

        {/* Bottom Links */}
        <div className="flex flex-col sm:flex-row font-['Roboto:Regular',sans-serif] items-start sm:items-center justify-between gap-4 w-full text-[14px] text-white tracking-[0.1px]">
          <p className="leading-[20px]" style={{ fontVariationSettings: "'wdth' 100" }}>
            {t.footer.copyright}
          </p>
          <div className="flex flex-wrap gap-[24px] items-center">
            <a href="#" className="leading-[20px] hover:underline" style={{ fontVariationSettings: "'wdth' 100" }}>
              {t.footer.privacyPolicy}
            </a>
            <a href="#" className="leading-[20px] hover:underline" style={{ fontVariationSettings: "'wdth' 100" }}>
              {t.footer.termsConditions}
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
