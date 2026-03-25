import clsx from "clsx";
import svgPaths from "./svg-2gr9t1i5ns";

function FooterHelper1({ children }: React.PropsWithChildren<{}>) {
  return (
    <div style={{ fontVariationSettings: "'wdth' 100" }} className="flex flex-col justify-center relative shrink-0">
      <p className="leading-[20px]">{children}</p>
    </div>
  );
}

function FooterHelper({ children }: React.PropsWithChildren<{}>) {
  return (
    <div style={{ fontVariationSettings: "'wdth' 100" }} className="flex flex-col font-['Roboto:Regular',sans-serif] font-normal justify-center leading-[0] relative shrink-0 text-[16px] text-white tracking-[0.15px] whitespace-nowrap">
      <p className="leading-[24px]">{children}</p>
    </div>
  );
}
type FooterGroupProps = {
  additionalClassNames?: string;
};

function FooterGroup({ children, additionalClassNames = "" }: React.PropsWithChildren<FooterGroupProps>) {
  return (
    <div className={clsx("absolute", additionalClassNames)}>
      <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 34.483 34.5123">
        <g id="Group">{children}</g>
      </svg>
    </div>
  );
}

function Helper() {
  return (
    <svg fill="none" preserveAspectRatio="none" viewBox="0 0 64 64" className="absolute block size-full">
      <path d={svgPaths.p34a63200} fill="var(--fill-0, white)" id="Vector" />
    </svg>
  );
}

export default function Footer() {
  return (
    <div className="bg-[#44b0e2] relative size-full" data-name="Footer">
      <div className="content-stretch flex flex-col gap-[40px] items-start p-[80px] relative w-full">
        <div className="content-stretch flex gap-[20px] items-start relative shrink-0 w-full">
          <div className="content-stretch flex flex-[1_0_0] gap-[20px] items-end min-h-px min-w-[400px] relative">
            <div className="content-stretch flex flex-[1_0_0] flex-col items-start justify-center min-h-px min-w-px relative">
              <div className="h-[132px] overflow-clip relative shrink-0 w-[150px]" data-name="logo">
                <div className="absolute inset-[59.56%_0_16%_78.09%]" data-name="Group">
                  <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 32.8692 32.2539">
                    <g id="Group">
                      <path d={svgPaths.p2830dde0} fill="var(--fill-0, #FFED92)" id="Vector" />
                      <path d={svgPaths.p369e3b00} fill="var(--fill-0, #0C0014)" id="Vector_2" />
                    </g>
                  </svg>
                </div>
                <div className="absolute inset-[59.56%_78.09%_16%_0]" data-name="Group">
                  <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 32.8694 32.2539">
                    <g id="Group">
                      <path d={svgPaths.pb82eb00} fill="var(--fill-0, #FFED92)" id="Vector" />
                      <path d={svgPaths.p16431c00} fill="var(--fill-0, #0C0014)" id="Vector_2" />
                    </g>
                  </svg>
                </div>
                <div className="absolute inset-[66.58%_9.14%_0_9.14%]" data-name="Group">
                  <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 122.571 44.1144">
                    <g id="Group">
                      <path d={svgPaths.p1bfc9c00} fill="var(--fill-0, #FFED92)" id="Vector" />
                      <path d={svgPaths.p3d71ee80} fill="var(--fill-0, #0C0014)" id="Vector_2" />
                    </g>
                  </svg>
                </div>
                <div className="absolute inset-[0_22.14%_21.47%_22.14%]" data-name="Vector">
                  <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 83.577 103.666">
                    <path d={svgPaths.p18b43a00} fill="var(--fill-0, #0C0014)" id="Vector" />
                  </svg>
                </div>
                <div className="absolute inset-[3.69%_25.39%_25.16%_25.39%]" data-name="Vector">
                  <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 73.8353 93.9172">
                    <path d={svgPaths.p29ad3bf0} fill="var(--fill-0, #0C0014)" id="Vector" />
                  </svg>
                </div>
                <div className="absolute inset-[33.53%_25.39%_25.15%_25.39%]" data-name="Vector">
                  <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 73.8363 54.5389">
                    <path d={svgPaths.p1d1bcb80} fill="var(--fill-0, #5FC8A7)" id="Vector" />
                  </svg>
                </div>
                <FooterGroup additionalClassNames="inset-[3.69%_51.62%_70.16%_25.39%]">
                  <path d={svgPaths.p4d3100} fill="var(--fill-0, #60B4E5)" id="Vector" />
                  <path d={svgPaths.p35eb1100} fill="var(--fill-0, white)" id="Vector_2" />
                  <path d={svgPaths.p3b2ac780} fill="var(--fill-0, white)" id="Vector_3" />
                </FooterGroup>
                <FooterGroup additionalClassNames="inset-[3.69%_25.39%_70.16%_51.62%]">
                  <path d={svgPaths.p4d3100} fill="var(--fill-0, #FF8D81)" id="Vector" />
                  <g id="Group_2">
                    <path d={svgPaths.p1b86f500} fill="var(--fill-0, white)" id="Vector_2" />
                    <path d={svgPaths.p3e0f5f70} fill="var(--fill-0, white)" id="Vector_3" />
                    <path d={svgPaths.p2a29ba00} fill="var(--fill-0, white)" id="Vector_4" />
                    <path d={svgPaths.p1ed1e370} fill="var(--fill-0, white)" id="Vector_5" />
                    <path d={svgPaths.p2b490e00} fill="var(--fill-0, #FF8D81)" id="Vector_6" />
                    <path d={svgPaths.pedae780} fill="var(--fill-0, #FF8D81)" id="Vector_7" />
                    <path d={svgPaths.p3529a980} fill="var(--fill-0, #FF8D81)" id="Vector_8" />
                  </g>
                </FooterGroup>
                <div className="absolute inset-[36.29%_27.02%_31.81%_27.29%]" data-name="Group">
                  <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 68.5332 42.1061">
                    <g id="Group">
                      <path d={svgPaths.p1e69ec40} fill="var(--fill-0, white)" id="Vector" />
                      <path d={svgPaths.p13cc8d00} fill="var(--fill-0, white)" id="Vector_2" />
                      <path d={svgPaths.p1956d880} fill="var(--fill-0, white)" id="Vector_3" />
                      <path d={svgPaths.p33955a00} fill="var(--fill-0, white)" id="Vector_4" />
                      <path d={svgPaths.p26e3a680} fill="var(--fill-0, white)" id="Vector_5" />
                    </g>
                  </svg>
                </div>
                <div className="absolute inset-[36.3%_66.13%_56.29%_27.02%]" data-name="Vector">
                  <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 10.2802 9.78552">
                    <path d={svgPaths.p833ff00} fill="var(--fill-0, #FFED92)" id="Vector" />
                  </svg>
                </div>
                <div className="absolute inset-[74.89%_16.53%_5.63%_16.64%]" data-name="Group">
                  <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 100.238 25.7193">
                    <g id="Group">
                      <path d={svgPaths.p36aa8830} fill="var(--fill-0, #0C0014)" id="Vector" />
                      <path d={svgPaths.p54560f2} fill="var(--fill-0, #0C0014)" id="Vector_2" />
                      <path d={svgPaths.p375ebc80} fill="var(--fill-0, #0C0014)" id="Vector_3" />
                      <path d={svgPaths.p1513f700} fill="var(--fill-0, #0C0014)" id="Vector_4" />
                      <path d={svgPaths.pe84f680} fill="var(--fill-0, #0C0014)" id="Vector_5" />
                      <path d={svgPaths.pe25680} fill="var(--fill-0, #0C0014)" id="Vector_6" />
                      <path d={svgPaths.p9a67700} fill="var(--fill-0, #0C0014)" id="Vector_7" />
                      <path d={svgPaths.p4ca5000} fill="var(--fill-0, #0C0014)" id="Vector_8" />
                    </g>
                  </svg>
                </div>
              </div>
            </div>
            <div className="content-stretch flex flex-[1_0_0] flex-col gap-[12px] items-start justify-center min-h-px min-w-px relative">
              <FooterHelper>Follow Us</FooterHelper>
              <div className="content-center flex flex-wrap gap-[12px] items-center relative shrink-0 w-full">
                <div className="overflow-clip relative shrink-0 size-[32px]" data-name="ic_facebook">
                  <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 32 32">
                    <path d={svgPaths.p1199c300} fill="var(--fill-0, white)" id="Vector" />
                  </svg>
                  <div className="absolute bottom-[24.86%] left-[39.11%] right-[37.75%] top-1/4" data-name="Vector">
                    <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 7.405 16.045">
                      <path d={svgPaths.p35ae5600} fill="var(--fill-0, #5EB4E5)" id="Vector" />
                    </svg>
                  </div>
                </div>
                <div className="overflow-clip relative shrink-0 size-[32px]" data-name="ic_instagram">
                  <Helper />
                  <div className="absolute inset-[26.56%_25.69%_25.69%_26.56%]" data-name="Group">
                    <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 30.56 30.56">
                      <g id="Group">
                        <path d={svgPaths.p3e8ce500} fill="var(--fill-0, #5EB4E5)" id="Vector" />
                        <path d={svgPaths.pa325d80} fill="var(--fill-0, #5EB4E5)" id="Vector_2" />
                        <path d={svgPaths.p17499280} fill="var(--fill-0, #5EB4E5)" id="Vector_3" />
                      </g>
                    </svg>
                  </div>
                </div>
                <div className="overflow-clip relative shrink-0 size-[32px]" data-name="ic_youtube">
                  <Helper />
                  <div className="absolute inset-[32.81%_25.89%_33.55%_26.56%]" data-name="Vector">
                    <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 30.43 21.53">
                      <path d={svgPaths.pa89500} fill="var(--fill-0, #5EB4E5)" id="Vector" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
            <div className="content-stretch flex flex-[1_0_0] flex-col gap-[12px] items-start justify-center min-h-px min-w-px relative">
              <FooterHelper>Powered by</FooterHelper>
              <div className="h-[32px] overflow-clip relative shrink-0 w-[163px]" data-name="logo_locoBike_hor">
                <div className="absolute inset-[0_52.58%_0.15%_0]" data-name="Combined-Shape">
                  <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 77.2971 31.9513">
                    <path d={svgPaths.p389f500} fill="var(--fill-0, white)" id="Combined-Shape" />
                  </svg>
                </div>
                <div className="absolute inset-[0_0_0.01%_49.6%]" data-name="Group">
                  <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 82.1498 31.9981">
                    <g id="Group">
                      <path d={svgPaths.p241f1200} fill="var(--fill-0, white)" id="Vector" />
                      <path d={svgPaths.p3384f0f0} fill="var(--fill-0, white)" id="Vector_2" />
                      <path d={svgPaths.p38d4fda0} fill="var(--fill-0, white)" id="Vector_3" />
                      <path d={svgPaths.p72a1180} fill="var(--fill-0, white)" id="Vector_4" />
                      <path d={svgPaths.p3823f980} fill="var(--fill-0, white)" id="Vector_5" />
                    </g>
                  </svg>
                </div>
              </div>
            </div>
          </div>
          <div className="content-stretch flex flex-[1_0_0] flex-col items-end max-w-[550px] min-h-px min-w-px relative">
            <div className="relative rounded-[100px] shrink-0 size-[64px]" data-name="Scroll Button">
              <div aria-hidden="true" className="absolute border border-solid border-white inset-[-0.5px] pointer-events-none rounded-[100.5px]" />
              <div className="flex flex-row items-center justify-center size-full">
                <div className="content-stretch flex items-center justify-center relative size-full">
                  <div className="relative shrink-0 size-[24px]" data-name="arrow-up 1">
                    <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 24 24">
                      <g id="arrow-up 1">
                        <path d="M12 19V5" id="Vector" stroke="var(--stroke-0, white)" strokeLinecap="round" strokeLinejoin="round" />
                        <path d="M5 12L12 5L19 12" id="Vector_2" stroke="var(--stroke-0, white)" strokeLinecap="round" strokeLinejoin="round" />
                      </g>
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="content-stretch flex font-['Roboto:Regular',sans-serif] font-normal items-start justify-between leading-[0] relative shrink-0 text-[14px] text-white tracking-[0.1px] w-full whitespace-nowrap">
          <FooterHelper1>Copyright © 2026 Locolla.com</FooterHelper1>
          <div className="content-stretch flex gap-[24px] items-center relative shrink-0">
            <FooterHelper1>Privacy Policy</FooterHelper1>
            <FooterHelper1>{`Terms & Conditions`}</FooterHelper1>
          </div>
        </div>
      </div>
    </div>
  );
}