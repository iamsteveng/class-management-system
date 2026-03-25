import clsx from "clsx";
import svgPaths from "./svg-ypfkyueyij";
import imgDsc09653Scaled1 from "figma:asset/d54ac782d568704845672fa2c56ae5346633aa13.png";

function Container1({ children }: React.PropsWithChildren<{}>) {
  return (
    <div className="bg-[rgba(105,192,232,0.3)] relative rounded-[10px] shrink-0 size-[48px]">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col items-start pt-[12px] px-[12px] relative size-full">{children}</div>
    </div>
  );
}

function Wrapper({ children }: React.PropsWithChildren<{}>) {
  return (
    <div className="relative shrink-0 w-[150px]">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col items-start leading-[24px] relative w-full">{children}</div>
    </div>
  );
}
type Icon2VectorProps = {
  additionalClassNames?: string;
};

function Icon2Vector({ additionalClassNames = "" }: Icon2VectorProps) {
  return (
    <div className={clsx("absolute", additionalClassNames)}>
      <div className="absolute inset-[-6.67%_-1px]">
        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 2 17">
          <path d="M1 1V16" id="Vector" stroke="var(--stroke-0, #3384A9)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
        </svg>
      </div>
    </div>
  );
}
type ContainerProps = {
  text: string;
  text1: string;
};

function Container({ text, text1 }: ContainerProps) {
  return (
    <Wrapper>
      <p className="font-['Roboto:Semibold','Noto_Sans_JP:Bold',sans-serif] relative shrink-0 text-[#225871] text-[16px] tracking-[0.15px] w-full" style={{ fontVariationSettings: "'wght' 700" }}>
        {text}
      </p>
      <p className="font-['Roboto:Regular','Noto_Sans_JP:Regular',sans-serif] font-normal relative shrink-0 text-[#141414] text-[14px] tracking-[0.3px] w-full" style={{ fontVariationSettings: "'wdth' 100" }}>
        {text1}
      </p>
    </Wrapper>
  );
}

export default function HeroBanner() {
  return (
    <div className="relative size-full" data-name="Hero banner">
      <div className="absolute inset-0 overflow-clip" data-name="Horizontal Image">
        <div className="absolute aspect-[2560/1707] left-0 right-[-14.92%] top-[-127px]" data-name="DSC09653-scaled 1">
          <img alt="" className="absolute inset-0 max-w-none object-cover pointer-events-none size-full" src={imgDsc09653Scaled1} />
        </div>
        <div className="absolute bg-gradient-to-r from-[rgba(0,73,109,0.9)] h-[854px] left-0 to-[rgba(255,255,255,0)] top-0 via-[45%] via-[rgba(0,109,163,0.4)] w-[1280px]" data-name="Container" />
      </div>
      <div className="absolute content-stretch flex flex-col gap-[44px] items-start justify-center left-[80px] max-w-[740px] top-[264px] w-[550px]">
        <div className="flex flex-col font-['Comfortaa:Bold','Noto_Sans_JP:Bold',sans-serif] font-bold justify-center leading-[0] relative shrink-0 text-[72px] text-shadow-[0px_1px_3px_rgba(0,0,0,0.15),0px_1px_2px_rgba(0,0,0,0.3)] text-white w-[550px]">
          <p className="leading-[normal]">自信地掌控道路</p>
        </div>
        <div className="flex flex-col font-['Roboto:Regular','Noto_Sans_JP:Regular',sans-serif] font-normal justify-center leading-[0] relative shrink-0 text-[0px] text-shadow-[0px_1px_3px_rgba(0,0,0,0.15),0px_1px_2px_rgba(0,0,0,0.3)] text-white tracking-[0.15px] w-[550px]" style={{ fontVariationSettings: "'wdth' 100" }}>
          <p className="text-[16px]">
            <span className="leading-[24px]">無論你是零經驗的初學者、</span>
            <span className="font-['Roboto:Regular','Noto_Sans_JP:Regular',sans-serif] font-normal leading-[24px] tracking-[0.15px]" style={{ fontVariationSettings: "'wdth' 100" }}>
              還是
            </span>
            <span className="leading-[24px]">已經有一定經驗， 想尋求大突破，追求冒險的團體。歡迎加入單車安全學院，學習、進步並享受安全騎行的樂趣。</span>
          </p>
        </div>
        <div className="content-stretch flex h-[56px] items-start relative shrink-0 w-full" data-name="Container">
          <div className="bg-[#44b0e2] h-[56px] min-w-[120px] relative rounded-[360px] shrink-0" data-name="Button">
            <div aria-hidden="true" className="absolute border-2 border-[#44b0e2] border-solid inset-0 pointer-events-none rounded-[360px] shadow-[0px_8px_12px_0px_rgba(0,0,0,0.08),0px_4px_6px_0px_rgba(0,0,0,0.16)]" />
            <div className="flex flex-row items-center justify-center min-w-[inherit] size-full">
              <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex gap-[8px] h-full items-center justify-center min-w-[inherit] px-[32px] py-[16px] relative">
                <div className="overflow-clip relative shrink-0 size-[20px]" data-name="icons/outline/bike">
                  <div className="absolute inset-[22%_-7.7%_2.3%_12.3%]" data-name="Union">
                    <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 15.9004 12.6162">
                      <path d={svgPaths.p5f2680} fill="var(--fill-0, white)" id="Union" />
                    </svg>
                  </div>
                </div>
                <p className="font-['Roboto:Semibold','Noto_Sans_JP:Bold',sans-serif] leading-[24px] relative shrink-0 text-[16px] text-center text-white tracking-[0.15px] whitespace-nowrap" style={{ fontVariationSettings: "'wght' 700" }}>
                  探索單車課程
                </p>
              </div>
            </div>
          </div>
        </div>
        <div className="gap-x-[24px] gap-y-[24px] grid-cols-[repeat(3,fit-content(100%))] grid-rows-[repeat(1,minmax(0,1fr))] h-[98px] inline-grid relative shrink-0" data-name="Container">
          <div className="backdrop-blur-[2px] bg-[rgba(255,255,255,0.5)] col-1 content-stretch flex gap-[16px] items-center justify-self-start px-[17px] py-px relative rounded-[14px] row-1 self-stretch shrink-0" data-name="Container">
            <div aria-hidden="true" className="absolute border border-[rgba(255,255,255,0.7)] border-solid inset-0 pointer-events-none rounded-[14px]" />
            <Container1>
              <div className="h-[24px] overflow-clip relative shrink-0 w-full" data-name="Icon">
                <div className="absolute inset-[62.5%_33.33%_12.5%_8.33%]" data-name="Vector">
                  <div className="absolute inset-[-16.67%_-7.14%]">
                    <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 16 8">
                      <path d={svgPaths.p11b86180} id="Vector" stroke="var(--stroke-0, #3384A9)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
                    </svg>
                  </div>
                </div>
                <div className="absolute inset-[12.5%_45.83%_54.17%_20.83%]" data-name="Vector">
                  <div className="absolute inset-[-12.5%]">
                    <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 10 10">
                      <path d={svgPaths.pb08b100} id="Vector" stroke="var(--stroke-0, #3384A9)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
                    </svg>
                  </div>
                </div>
                <div className="absolute inset-[63.04%_8.33%_12.5%_79.17%]" data-name="Vector">
                  <div className="absolute inset-[-17.04%_-33.33%_-17.04%_-33.34%]">
                    <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 5.00024 7.87024">
                      <path d={svgPaths.p19976900} id="Vector" stroke="var(--stroke-0, #3384A9)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
                    </svg>
                  </div>
                </div>
                <div className="absolute inset-[13.04%_20.8%_54.67%_66.67%]" data-name="Vector">
                  <div className="absolute inset-[-12.91%_-33.25%]">
                    <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 5.00808 9.75048">
                      <path d={svgPaths.p29500900} id="Vector" stroke="var(--stroke-0, #3384A9)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
                    </svg>
                  </div>
                </div>
              </div>
            </Container1>
            <Wrapper>
              <p className="font-['Roboto:Semibold','Noto_Sans_JP:Bold',sans-serif] relative shrink-0 text-[#225871] text-[16px] tracking-[0.15px] whitespace-nowrap" style={{ fontVariationSettings: "'wght' 700" }}>
                專業導師
              </p>
              <p className="font-['Roboto:Regular','Noto_Sans_JP:Regular',sans-serif] font-normal min-w-full relative shrink-0 text-[#141414] text-[14px] tracking-[0.3px] w-[min-content]" style={{ fontVariationSettings: "'wdth' 100" }}>
                擁有豐富教學經驗
              </p>
            </Wrapper>
          </div>
          <div className="backdrop-blur-[2px] bg-[rgba(255,255,255,0.5)] col-2 content-stretch flex gap-[16px] items-center justify-self-start px-[17px] py-px relative rounded-[14px] row-1 self-stretch shrink-0" data-name="Container">
            <div aria-hidden="true" className="absolute border border-[rgba(255,255,255,0.7)] border-solid inset-0 pointer-events-none rounded-[14px]" />
            <Container1>
              <div className="h-[24px] overflow-clip relative shrink-0 w-full" data-name="Icon">
                <div className="absolute inset-[8.33%_16.67%_8.32%_16.67%]" data-name="Vector">
                  <div className="absolute inset-[-5%_-6.25%]">
                    <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 18 22.0034">
                      <path d={svgPaths.p27979bf0} id="Vector" stroke="var(--stroke-0, #3384A9)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
                    </svg>
                  </div>
                </div>
                <div className="absolute inset-[41.67%_37.5%]" data-name="Vector">
                  <div className="absolute inset-[-25%_-16.67%]">
                    <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 8 6">
                      <path d="M1 3L3 5L7 1" id="Vector" stroke="var(--stroke-0, #3384A9)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
                    </svg>
                  </div>
                </div>
              </div>
            </Container1>
            <Container text="安全至上" text1="在可控環境下安全學習" />
          </div>
          <div className="backdrop-blur-[2px] bg-[rgba(255,255,255,0.5)] col-3 content-stretch flex gap-[16px] items-center justify-self-start px-[17px] py-px relative rounded-[14px] row-1 self-stretch shrink-0" data-name="Container">
            <div aria-hidden="true" className="absolute border border-[rgba(255,255,255,0.7)] border-solid inset-0 pointer-events-none rounded-[14px]" />
            <Container1>
              <div className="h-[24px] overflow-clip relative shrink-0 w-full" data-name="Icon">
                <div className="absolute inset-[13.48%_12.5%]" data-name="Vector">
                  <div className="absolute inset-[-5.7%_-5.56%]">
                    <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 20 19.5289">
                      <path d={svgPaths.p33b0ef00} id="Vector" stroke="var(--stroke-0, #3384A9)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
                    </svg>
                  </div>
                </div>
                <Icon2Vector additionalClassNames="inset-[24.02%_37.5%_13.48%_62.5%]" />
                <Icon2Vector additionalClassNames="inset-[13.48%_62.5%_24.02%_37.5%]" />
              </div>
            </Container1>
            <Container text="單車導賞團" text1="不定期舉辦單車導賞團" />
          </div>
        </div>
      </div>
    </div>
  );
}