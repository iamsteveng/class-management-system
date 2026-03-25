import clsx from "clsx";
import svgPaths from "./svg-t8x886l11t";
import imgImageCyclingCrashCourseForBeginners from "figma:asset/f2129020d8c7d0b4d85f8c35537783b66bb6017f.png";
import imgDsc09653Scaled1 from "figma:asset/d54ac782d568704845672fa2c56ae5346633aa13.png";
import imgLightBigVertical from "figma:asset/68ca555f0ca55e85b799fc4861d7e68bc12627d4.png";
import imgImageCyclingCrashCourseForBeginners1 from "figma:asset/aef46db3a6bb022ce6c75a2483f6ecf534767b80.png";
import imgImageCyclingCrashCourseForBeginners2 from "figma:asset/214d9b0e085fe308c21ed54f3c76af0e8781f4e6.png";
import imgImageCyclingCrashCourseForBeginners3 from "figma:asset/0dbd51155216204b9f6a2a2eeb23de7144b3a766.png";
import imgAsset11 from "figma:asset/dab0f75dd9b9e8607ce30b36e95e0e7b5d3a1a6a.png";

function Wrapper7({ children }: React.PropsWithChildren<{}>) {
  return (
    <div style={{ fontVariationSettings: "'wdth' 100" }} className="flex flex-col justify-center relative shrink-0">
      <p className="leading-[20px]">{children}</p>
    </div>
  );
}
type Wrapper6Props = {
  additionalClassNames?: string;
};

function Wrapper6({ children, additionalClassNames = "" }: React.PropsWithChildren<Wrapper6Props>) {
  return (
    <div style={{ fontVariationSettings: "'wdth' 100" }} className={clsx("flex flex-col font-normal justify-center leading-[0] min-w-full relative shrink-0 text-[#141414] text-[16px] tracking-[0.3px] w-[min-content]", additionalClassNames)}>
      <p className="leading-[24px]">{children}</p>
    </div>
  );
}

function Wrapper5({ children }: React.PropsWithChildren<{}>) {
  return (
    <div style={{ fontVariationSettings: "'wdth' 100" }} className="flex flex-col font-['Roboto:Regular',sans-serif] font-normal justify-center leading-[0] relative shrink-0 text-[16px] text-white tracking-[0.15px] whitespace-nowrap">
      <p className="leading-[24px]">{children}</p>
    </div>
  );
}
type Wrapper4Props = {
  additionalClassNames?: string;
};

function Wrapper4({ children, additionalClassNames = "" }: React.PropsWithChildren<Wrapper4Props>) {
  return (
    <div style={{ fontVariationSettings: "'wght' 700" }} className={clsx("flex flex-col font-['Comfortaa:Semibold','Noto_Sans_JP:Bold',sans-serif] justify-center leading-[0] min-w-full relative shrink-0 text-[#44b0e2] text-[24px] w-[min-content]", additionalClassNames)}>
      <p className="leading-[32px]">{children}</p>
    </div>
  );
}

function Container3({ children }: React.PropsWithChildren<{}>) {
  return (
    <div className="bg-[rgba(105,192,232,0.3)] relative rounded-[10px] shrink-0 size-[48px]">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col items-start pt-[12px] px-[12px] relative size-full">{children}</div>
    </div>
  );
}

function Wrapper3({ children }: React.PropsWithChildren<{}>) {
  return (
    <div className="relative shrink-0 size-[24px]">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid overflow-clip relative rounded-[inherit] size-full">{children}</div>
    </div>
  );
}

function Wrapper2({ children }: React.PropsWithChildren<{}>) {
  return (
    <div className="relative shrink-0 w-[150px]">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col items-start leading-[24px] relative w-full">{children}</div>
    </div>
  );
}

function Wrapper1({ children }: React.PropsWithChildren<{}>) {
  return (
    <div className="relative shrink-0 size-[24px]">
      <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 24 24">
        {children}
      </svg>
    </div>
  );
}

function Wrapper({ children }: React.PropsWithChildren<{}>) {
  return (
    <div className="relative shrink-0 w-full">
      <div className="content-stretch flex flex-col gap-[20px] items-start px-[12px] py-[24px] relative w-full">{children}</div>
    </div>
  );
}
type Group1Props = {
  additionalClassNames?: string;
};

function Group1({ children, additionalClassNames = "" }: React.PropsWithChildren<Group1Props>) {
  return (
    <div className={clsx("absolute", additionalClassNames)}>
      <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 34.483 34.5123">
        <g id="Group">{children}</g>
      </svg>
    </div>
  );
}

function TextField({ children }: React.PropsWithChildren<{}>) {
  return (
    <div className="relative shrink-0 w-full">
      <div className="flex flex-col justify-end size-full">
        <div className="content-stretch flex flex-col gap-[8px] items-start justify-end relative w-full">{children}</div>
      </div>
    </div>
  );
}

function TextInput({ children }: React.PropsWithChildren<{}>) {
  return (
    <div className="bg-white h-[56px] relative rounded-[20px] shrink-0 w-full">
      <div aria-hidden="true" className="absolute border border-[#b9b9b9] border-solid inset-0 pointer-events-none rounded-[20px]" />
      <div className="flex flex-row items-center size-full">
        <div className="content-stretch flex gap-[8px] items-center p-[16px] relative size-full">{children}</div>
      </div>
    </div>
  );
}

function MobContainer({ children }: React.PropsWithChildren<{}>) {
  return (
    <div className="bg-white relative rounded-[32px] shrink-0 w-full">
      <div className="overflow-clip rounded-[inherit] size-full">
        <div className="content-stretch flex flex-col items-start p-px relative w-full">{children}</div>
      </div>
      <div aria-hidden="true" className="absolute border border-[#dcdcdc] border-solid inset-0 pointer-events-none rounded-[32px]" />
    </div>
  );
}
type GroupProps = {
  additionalClassNames?: string;
};

function Group({ children, additionalClassNames = "" }: React.PropsWithChildren<GroupProps>) {
  return (
    <div className={clsx("absolute", additionalClassNames)}>
      <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 17.2415 17.2561">
        <g id="Group">{children}</g>
      </svg>
    </div>
  );
}

function Container2({ children }: React.PropsWithChildren<{}>) {
  return (
    <div className="backdrop-blur-[2px] bg-[rgba(255,255,255,0.5)] flex-[1_0_0] min-h-px min-w-px relative rounded-[14px] w-full">
      <div aria-hidden="true" className="absolute border border-[rgba(255,255,255,0.7)] border-solid inset-0 pointer-events-none rounded-[14px]" />
      <div className="flex flex-row items-center size-full">
        <div className="content-stretch flex gap-[16px] items-center px-[17px] py-px relative size-full">{children}</div>
      </div>
    </div>
  );
}
type TextProps = {
  text: string;
  additionalClassNames?: string;
};

function Text({ text, children, additionalClassNames = "" }: React.PropsWithChildren<TextProps>) {
  return (
    <div className={clsx("bg-[#44b0e2] h-[56px] relative rounded-[360px] shrink-0 w-full", additionalClassNames)}>
      <div aria-hidden="true" className="absolute border-2 border-[#44b0e2] border-solid inset-0 pointer-events-none rounded-[360px]" />
      <div className="flex flex-row items-center justify-center min-w-[inherit] size-full">
        <div className="content-stretch flex gap-[8px] items-center justify-center min-w-[inherit] px-[32px] py-[16px] relative size-full">
          <div className="overflow-clip relative shrink-0 size-[20px]" data-name="icons/outline/pencil-alt">
            <div className="absolute inset-[8.33%_8.33%_12.5%_12.5%]" data-name="Icon (Stroke)">
              {children}
            </div>
          </div>
          <p className="font-['Roboto:Semibold','Noto_Sans_JP:Bold',sans-serif] leading-[24px] relative shrink-0 text-[16px] text-center text-white tracking-[0.15px] whitespace-nowrap" style={{ fontVariationSettings: "'wght' 700" }}>
            {text}
          </p>
        </div>
      </div>
    </div>
  );
}

function IconsOutlineArrowDown() {
  return (
    <div className="overflow-clip relative shrink-0 size-[24px]">
      <div className="absolute inset-[32.29%_15.63%_28.13%_15.63%]" data-name="Icon (Stroke)">
        <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 16.4998 9.49981">
          <path d={svgPaths.p34483700} fill="var(--fill-0, #979797)" id="Icon (Stroke)" />
        </svg>
      </div>
    </div>
  );
}
type CursorValueText1Props = {
  text: string;
};

function CursorValueText1({ text }: CursorValueText1Props) {
  return (
    <div className="content-stretch flex flex-[1_0_0] items-center min-h-px min-w-px relative">
      <p className="flex-[1_0_0] font-['Roboto:Regular',sans-serif] font-normal leading-[24px] min-h-px min-w-px relative text-[#979797] text-[16px] tracking-[0.3px]" style={{ fontVariationSettings: "'wdth' 100" }}>
        {text}
      </p>
    </div>
  );
}
type CursorValueTextProps = {
  text: string;
};

function CursorValueText({ text }: CursorValueTextProps) {
  return (
    <div className="content-stretch flex flex-[1_0_0] items-center min-h-px min-w-px relative">
      <p className="font-['Roboto:Regular',sans-serif] font-normal leading-[24px] relative shrink-0 text-[#979797] text-[16px] tracking-[0.3px] w-[241px]" style={{ fontVariationSettings: "'wdth' 100" }}>
        {text}
      </p>
    </div>
  );
}
type Container1Props = {
  text: string;
  text1: string;
};

function Container1({ text, text1 }: Container1Props) {
  return (
    <Wrapper>
      <p className="font-['Roboto:Medium','Noto_Sans_JP:Medium',sans-serif] font-medium leading-[28px] relative shrink-0 text-[#141414] text-[22px] whitespace-nowrap" style={{ fontVariationSettings: "'wdth' 100" }}>
        {text}
      </p>
      <p className="font-['Roboto:Regular','Noto_Sans_JP:Regular','Noto_Sans_SC:Regular',sans-serif] font-normal leading-[24px] min-w-full relative shrink-0 text-[#292929] text-[14px] tracking-[0.3px] w-[min-content]" style={{ fontVariationSettings: "'wdth' 100" }}>
        {text1}
      </p>
      <div className="gap-x-[16px] gap-y-[16px] grid grid-cols-[repeat(2,minmax(0,1fr))] grid-rows-[repeat(1,fit-content(100%))] pb-[20px] relative shrink-0 w-full">
        <div aria-hidden="true" className="absolute border-[#dcdcdc] border-b border-solid inset-0 pointer-events-none" />
        <ContainerText text="3 hours" />
        <div className="col-2 content-stretch flex gap-[6px] items-center justify-self-stretch relative row-1 self-start shrink-0">
          <IconsOutlineFee />
          <p className="font-['Roboto:Semibold',sans-serif] leading-[24px] not-italic relative shrink-0 text-[#141414] text-[16px] tracking-[0.15px] whitespace-nowrap">{"HK$400"}</p>
        </div>
      </div>
      <ButtonText text="按此報名" />
    </Wrapper>
  );
}
type TextTextProps = {
  text: string;
  additionalClassNames?: string;
};

function TextText({ text, additionalClassNames = "" }: TextTextProps) {
  return (
    <div className={clsx("h-[24px] relative shrink-0", additionalClassNames)}>
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <p className="absolute font-['Inter:Regular','Noto_Sans_JP:Regular',sans-serif] font-normal leading-[24px] left-0 not-italic text-[#364153] text-[16px] top-[-0.5px] tracking-[-0.3125px] whitespace-nowrap">{text}</p>
      </div>
    </div>
  );
}

function Icon() {
  return (
    <Wrapper1>
      <g id="Icon">
        <path d={svgPaths.pace200} id="Vector" stroke="var(--stroke-0, #19B2A8)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
        <path d="M9 12L11 14L15 10" id="Vector_2" stroke="var(--stroke-0, #19B2A8)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
      </g>
    </Wrapper1>
  );
}
type ContainerText1Props = {
  text: string;
};

function ContainerText1({ text }: ContainerText1Props) {
  return (
    <div className="bg-[#b4dff3] content-stretch flex items-center justify-center px-[12px] py-[4px] relative rounded-[40px] shrink-0">
      <p className="font-['Inter:Semi_Bold','Noto_Sans_JP:Bold',sans-serif] font-semibold leading-[20px] not-italic relative shrink-0 text-[#225871] text-[14px] tracking-[-0.1504px] whitespace-nowrap">{text}</p>
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
    <Wrapper2>
      <p className="font-['Roboto:Semibold','Noto_Sans_JP:Bold',sans-serif] relative shrink-0 text-[#225871] text-[16px] tracking-[0.15px] w-full" style={{ fontVariationSettings: "'wght' 700" }}>
        {text}
      </p>
      <p className="font-['Roboto:Regular','Noto_Sans_JP:Regular',sans-serif] font-normal relative shrink-0 text-[#141414] text-[14px] tracking-[0.3px] w-full" style={{ fontVariationSettings: "'wdth' 100" }}>
        {text1}
      </p>
    </Wrapper2>
  );
}
type ButtonTextProps = {
  text: string;
};

function ButtonText({ text }: ButtonTextProps) {
  return (
    <Text text={text} additionalClassNames="min-w-[120px]">
      <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 18.9998 18.9998">
        <path d={svgPaths.p2f15e3b0} fill="var(--fill-0, white)" id="Icon (Stroke)" />
      </svg>
    </Text>
  );
}

function IconsOutlineFee() {
  return (
    <Wrapper3>
      <Vector />
      <div className="absolute inset-[23.79%_34.46%_23.79%_34.42%]" data-name="Vector">
        <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 7.47 12.58">
          <path d={svgPaths.p3ed81280} fill="var(--fill-0, #44B0E2)" id="Vector" />
        </svg>
      </div>
    </Wrapper3>
  );
}

function Vector() {
  return (
    <div className="absolute inset-[8.33%]">
      <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 20 20">
        <path d={svgPaths.p36263800} fill="var(--fill-0, #44B0E2)" id="Vector" />
      </svg>
    </div>
  );
}
type ContainerTextProps = {
  text: string;
};

function ContainerText({ text }: ContainerTextProps) {
  return (
    <div className="col-1 content-stretch flex gap-[6px] items-center justify-self-stretch relative row-1 self-start shrink-0">
      <Wrapper3>
        <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 32 32">
          <g id="Vector" />
        </svg>
        <Vector />
        <div className="absolute inset-[20.83%_35.36%_36%_45.83%]" data-name="Vector">
          <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 4.51435 10.36">
            <path d={svgPaths.p1089d480} fill="var(--fill-0, #44B0E2)" id="Vector" />
          </svg>
        </div>
      </Wrapper3>
      <p className="font-['Roboto:Semibold',sans-serif] leading-[24px] not-italic relative shrink-0 text-[#141414] text-[16px] tracking-[0.15px] whitespace-nowrap">{text}</p>
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

export default function LandingMobile() {
  return (
    <div className="bg-white relative size-full" data-name="landing mobile">
      <div className="absolute h-[984px] left-0 top-0 w-[390px]">
        <div className="absolute bg-[#5eb4e5] inset-0 overflow-clip" data-name="Horizontal Image">
          <div className="absolute h-[480px] left-0 top-0 w-[390px]" data-name="DSC09653-scaled 1">
            <img alt="" className="absolute inset-0 max-w-none object-cover pointer-events-none size-full" src={imgDsc09653Scaled1} />
          </div>
          <div className="absolute bg-gradient-to-r from-[rgba(0,73,109,0.9)] h-[480px] left-0 to-[rgba(255,255,255,0)] top-0 via-[45%] via-[rgba(0,109,163,0.4)] w-[390px]" data-name="Container" />
        </div>
        <div className="-translate-x-1/2 absolute content-stretch flex flex-col gap-[44px] items-start justify-center left-1/2 max-w-[740px] top-[190px] w-[358px]">
          <div className="flex flex-col font-['Comfortaa:Semibold','Noto_Sans_JP:Bold',sans-serif] justify-center leading-[0] relative shrink-0 text-[32px] text-shadow-[0px_1px_3px_rgba(0,0,0,0.15),0px_1px_2px_rgba(0,0,0,0.3)] text-white w-full" style={{ fontVariationSettings: "'wght' 700" }}>
            <p className="leading-[40px]">自信地掌控道路</p>
          </div>
          <div className="flex flex-col font-['Roboto:Regular','Noto_Sans_JP:Regular',sans-serif] font-normal justify-center leading-[0] relative shrink-0 text-[0px] text-shadow-[0px_1px_3px_rgba(0,0,0,0.15),0px_1px_2px_rgba(0,0,0,0.3)] text-white tracking-[0.15px] w-full" style={{ fontVariationSettings: "'wdth' 100" }}>
            <p className="text-[16px]">
              <span className="leading-[24px]">無論你是零經驗的初學者、</span>
              <span className="font-['Roboto:Regular','Noto_Sans_JP:Regular',sans-serif] font-normal leading-[24px] tracking-[0.15px]" style={{ fontVariationSettings: "'wdth' 100" }}>
                還是
              </span>
              <span className="leading-[24px]">已經有一定經驗， 想尋求大突破，追求冒險的團體。歡迎加入單車安全學院，學習、進步並享受安全騎行的樂趣。</span>
            </p>
          </div>
          <div className="content-stretch flex flex-col gap-[16px] items-start relative shrink-0 w-full" data-name="Container">
            <div className="bg-[#44b0e2] h-[56px] min-w-[120px] relative rounded-[360px] shrink-0 w-full" data-name="Button">
              <div aria-hidden="true" className="absolute border-2 border-[#44b0e2] border-solid inset-0 pointer-events-none rounded-[360px] shadow-[0px_8px_12px_0px_rgba(0,0,0,0.08),0px_4px_6px_0px_rgba(0,0,0,0.16)]" />
              <div className="flex flex-row items-center justify-center min-w-[inherit] size-full">
                <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex gap-[8px] items-center justify-center min-w-[inherit] px-[32px] py-[16px] relative size-full">
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
            <div className="bg-white h-[56px] min-w-[120px] relative rounded-[360px] shrink-0 w-full" data-name="Button">
              <div aria-hidden="true" className="absolute border-2 border-[#44b0e2] border-solid inset-0 pointer-events-none rounded-[360px]" />
              <div className="flex flex-row items-center justify-center min-w-[inherit] size-full">
                <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex gap-[8px] items-center justify-center min-w-[inherit] p-[16px] relative size-full">
                  <p className="font-['Roboto:Semibold','Noto_Sans_JP:Bold',sans-serif] leading-[24px] relative shrink-0 text-[#515151] text-[16px] text-center tracking-[0.15px] whitespace-nowrap" style={{ fontVariationSettings: "'wght' 700" }}>
                    網上報名
                  </p>
                </div>
              </div>
            </div>
          </div>
          <div className="content-stretch flex flex-col gap-[24px] h-[342px] items-start relative shrink-0 w-full" data-name="Container">
            <Container2>
              <Container3>
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
              </Container3>
              <Wrapper2>
                <p className="font-['Roboto:Semibold','Noto_Sans_JP:Bold',sans-serif] relative shrink-0 text-[#225871] text-[16px] tracking-[0.15px] whitespace-nowrap" style={{ fontVariationSettings: "'wght' 700" }}>
                  專業導師
                </p>
                <p className="font-['Roboto:Regular','Noto_Sans_JP:Regular',sans-serif] font-normal min-w-full relative shrink-0 text-[#141414] text-[14px] tracking-[0.3px] w-[min-content]" style={{ fontVariationSettings: "'wdth' 100" }}>
                  擁有豐富教學經驗
                </p>
              </Wrapper2>
            </Container2>
            <Container2>
              <Container3>
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
              </Container3>
              <Container text="安全至上" text1="在可控環境下安全學習" />
            </Container2>
            <Container2>
              <Container3>
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
              </Container3>
              <Container text="單車導賞團" text1="不定期舉辦單車導賞團" />
            </Container2>
          </div>
        </div>
      </div>
      <div className="absolute bg-[rgba(255,255,255,0.92)] content-stretch flex gap-[24px] h-[110px] items-center left-0 p-[16px] top-0 w-[390px]">
        <div className="content-stretch flex flex-[1_0_0] gap-[14px] items-center min-h-px min-w-px relative">
          <div className="h-[66px] overflow-clip relative shrink-0 w-[75px]" data-name="logo">
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
            <Group additionalClassNames="inset-[3.69%_51.62%_70.16%_25.39%]">
              <path d={svgPaths.p1053f1c0} fill="var(--fill-0, #60B4E5)" id="Vector" />
              <path d={svgPaths.p3c8c5800} fill="var(--fill-0, white)" id="Vector_2" />
              <path d={svgPaths.pa582f00} fill="var(--fill-0, white)" id="Vector_3" />
            </Group>
            <Group additionalClassNames="inset-[3.69%_25.39%_70.16%_51.62%]">
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
            </Group>
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
          <div className="flex flex-col font-['Roboto:Semibold','Noto_Sans_JP:Bold',sans-serif] justify-center leading-[0] relative shrink-0 text-[#141414] text-[16px] tracking-[0.15px] whitespace-nowrap" style={{ fontVariationSettings: "'wght' 700" }}>
            <p className="leading-[24px]">樂區單車安全學院</p>
          </div>
        </div>
        <div className="content-stretch flex items-center justify-center relative shrink-0">
          <div className="overflow-clip relative shrink-0 size-[32px]" data-name="icons/outline/menu">
            <div className="absolute bottom-1/4 contents left-[12.5%] right-[12.5%] top-1/4">
              <div className="absolute bg-[#141414] bottom-[66.67%] left-[12.5%] right-[12.5%] rounded-[1px] top-1/4" />
              <div className="absolute bg-[#141414] inset-[45.83%_12.5%] rounded-[1px]" />
              <div className="absolute bg-[#141414] bottom-1/4 left-[12.5%] right-[12.5%] rounded-[1px] top-[66.67%]" />
            </div>
          </div>
        </div>
      </div>
      <div className="absolute content-stretch flex flex-col items-center left-0 overflow-clip px-[16px] py-[80px] top-[984px] w-[390px]" data-name="Hero 02">
        <div className="bg-white content-stretch flex flex-col gap-[20px] items-center justify-center relative shrink-0 w-full" data-name="Hero 20">
          <div className="content-stretch flex flex-col items-start justify-center relative shrink-0 w-full">
            <div className="content-stretch flex flex-col gap-[32px] items-start justify-center max-w-[720px] pb-[24px] relative shrink-0 w-full">
              <ContainerText1 text="關於我們" />
              <Wrapper4>安全騎行，樂在社區</Wrapper4>
              <Wrapper6 additionalClassNames="font-['Roboto:Regular','Noto_Sans_JP:Regular','Noto_Sans_SC:Regular',sans-serif]">「樂區單車安全學院」致力透過系統化訓練，陪伴你發展恆久又安全的踩車能力 。我們堅信「人人有車練」，旨在推動安全騎行與互讓文化，攜手打造對行人及單車更友善的城市 。不論是初學者或想穿梭市區的車友，我們專業的認證導師都會提供耐心指導 ，助你由零建立自信，安全享受踩車的自由。我們相信，當每個人都具備正確的騎行知識與禮讓態度，這座城市將會變得更加美好 。</Wrapper6>
              <div className="content-stretch flex flex-col gap-[16px] h-[144px] items-start relative shrink-0 w-full" data-name="List">
                <div className="content-stretch flex gap-[12px] h-[24px] items-start relative shrink-0 w-full" data-name="List Item">
                  <Icon />
                  <TextText text="有系統地掌握安全平衡與控車的基礎技能" additionalClassNames="w-[380.641px]" />
                </div>
                <div className="content-stretch flex gap-[12px] h-[24px] items-start relative shrink-0 w-full" data-name="List Item">
                  <Icon />
                  <TextText text="深入了解交通規則、路權共享及互讓技巧" additionalClassNames="w-[381.906px]" />
                </div>
                <div className="content-stretch flex gap-[12px] h-[24px] items-start relative shrink-0 w-full" data-name="List Item">
                  <Icon />
                  <TextText text="在繁忙的市區與郊區環境中建立自信" additionalClassNames="w-[425.781px]" />
                </div>
                <div className="content-stretch flex gap-[12px] h-[24px] items-start relative shrink-0 w-full" data-name="List Item">
                  <Icon />
                  <TextText text="享受自由自在與健康騎行的每一刻" additionalClassNames="w-[414.344px]" />
                </div>
              </div>
            </div>
          </div>
          <div className="content-stretch flex flex-col items-center justify-center relative shrink-0 w-full">
            <div className="-translate-x-1/2 -translate-y-1/2 absolute flex h-[343.745px] items-center justify-center left-[calc(50%+0.27px)] top-[calc(50%+0.64px)] w-[374.542px]" style={{ "--transform-inner-width": "1200", "--transform-inner-height": "0" } as React.CSSProperties}>
              <div className="-rotate-3 flex-none">
                <div className="bg-[#daeff9] h-[325.455px] rounded-[32px] w-[358px]" data-name="Vertical Image" />
              </div>
            </div>
            <div className="h-[313px] overflow-clip relative rounded-[32px] shrink-0 w-[346px]" data-name="Vertical Image">
              <div className="absolute h-[313px] left-0 top-0 w-[344px]" data-name="Light - Big Vertical">
                <img alt="" className="absolute inset-0 max-w-none object-cover pointer-events-none size-full" src={imgLightBigVertical} />
              </div>
            </div>
            <div className="absolute bg-white bottom-[12px] content-stretch flex flex-col gap-[6px] items-start p-[16px] right-0 rounded-[12px] shadow-[0px_8px_12px_0px_rgba(0,0,0,0.08),0px_4px_6px_0px_rgba(0,0,0,0.16)] text-[#19b2a8] w-[165px]">
              <div className="content-stretch flex gap-[4px] items-end relative shrink-0 w-full whitespace-nowrap">
                <p className="font-['Roboto:Medium','Noto_Sans_JP:Medium',sans-serif] font-medium leading-[20px] relative shrink-0 text-[14px] tracking-[0.1px]" style={{ fontVariationSettings: "'wdth' 100" }}>
                  超過
                </p>
                <p className="font-['Comfortaa:Bold',sans-serif] font-bold leading-[28px] relative shrink-0 text-[32px] tracking-[-2px]">1,000</p>
                <p className="font-['Roboto:Medium','Noto_Sans_JP:Medium',sans-serif] font-medium leading-[20px] relative shrink-0 text-[14px] tracking-[0.1px]" style={{ fontVariationSettings: "'wdth' 100" }}>
                  學員
                </p>
              </div>
              <p className="font-['Roboto:Medium','Noto_Sans_JP:Medium','Noto_Sans_SC:Medium',sans-serif] font-medium leading-[20px] relative shrink-0 text-[14px] tracking-[0.1px] w-full" style={{ fontVariationSettings: "'wdth' 100" }}>
                成功發掘踩車樂趣
              </p>
            </div>
          </div>
        </div>
      </div>
      <div className="absolute bg-[#f4fcff] content-stretch flex flex-col items-center left-0 px-[16px] py-[80px] top-[2017px] w-[390px]" data-name="Hero 3">
        <div className="content-stretch flex flex-col gap-[10px] items-center justify-center relative shrink-0 w-full">
          <div className="content-stretch flex flex-col gap-[32px] items-center justify-center max-w-[720px] pb-[24px] relative shrink-0 w-full">
            <ContainerText1 text="課程大綱" />
            <Wrapper4 additionalClassNames="text-center">尋找最適合你的單車課程</Wrapper4>
            <Wrapper6 additionalClassNames="font-['Roboto:Regular','Noto_Sans_JP:Regular',sans-serif] text-center">我們針對不同年齡及程度提供專業培訓，並在課程中實踐友善騎行文化 。所有課程均包含免費安全裝備租用 。</Wrapper6>
          </div>
          <div className="content-stretch flex flex-col gap-[20px] items-start overflow-clip relative shrink-0 w-full" data-name="Hero 20">
            <div className="bg-white relative rounded-[32px] shrink-0 w-full" data-name="mob_Container">
              <div className="content-stretch flex flex-col items-start overflow-clip p-px relative rounded-[inherit] w-full">
                <div className="h-[260px] overflow-clip relative shrink-0 w-full" data-name="Container">
                  <div className="absolute h-[260px] left-0 top-0 w-[356px]" data-name="Image (Cycling Crash Course for Beginners)">
                    <img alt="" className="absolute inset-0 max-w-none object-contain pointer-events-none size-full" src={imgImageCyclingCrashCourseForBeginners} />
                  </div>
                </div>
                <Wrapper>
                  <p className="font-['Roboto:Medium','Noto_Sans_JP:Medium',sans-serif] font-medium leading-[28px] relative shrink-0 text-[#141414] text-[22px] whitespace-nowrap" style={{ fontVariationSettings: "'wdth' 100" }}>
                    單車新手速成班
                  </p>
                  <p className="font-['Roboto:Regular','Noto_Sans_JP:Regular','Noto_Sans_SC:Regular',sans-serif] font-normal leading-[24px] min-w-full relative shrink-0 text-[#292929] text-[14px] tracking-[0.3px] w-[min-content]" style={{ fontVariationSettings: "'wdth' 100" }}>
                    教你由零出發學識踩單車 （包括：單車檢查、單車操控技巧、單車安全守則、模擬練習，完成後可優先參與**單車技術改進課程）
                  </p>
                  <div className="gap-x-[16px] gap-y-[16px] grid grid-cols-[repeat(2,minmax(0,1fr))] grid-rows-[repeat(1,fit-content(100%))] pb-[20px] relative shrink-0 w-full" data-name="Container">
                    <div aria-hidden="true" className="absolute border-[#dcdcdc] border-b border-solid inset-0 pointer-events-none" />
                    <ContainerText text="3 hours" />
                    <div className="col-2 content-stretch flex gap-[6px] items-center justify-self-stretch relative row-1 self-start shrink-0" data-name="Container">
                      <IconsOutlineFee />
                      <p className="font-['Roboto:Semibold',sans-serif] leading-[24px] not-italic relative shrink-0 text-[#e16036] text-[16px] tracking-[0.15px] whitespace-nowrap">HK$400</p>
                      <p className="[text-decoration-skip-ink:none] decoration-solid font-['Roboto:SemiBold',sans-serif] font-semibold leading-[24px] line-through not-italic relative shrink-0 text-[#515151] text-[16px] tracking-[0.15px] whitespace-nowrap" style={{ fontVariationSettings: "'wdth' 100" }}>
                        HK$400
                      </p>
                    </div>
                  </div>
                  <ButtonText text="按此報名" />
                </Wrapper>
              </div>
              <div aria-hidden="true" className="absolute border border-[#dcdcdc] border-solid inset-0 pointer-events-none rounded-[32px]" />
            </div>
            <MobContainer>
              <div className="h-[260px] overflow-clip relative shrink-0 w-full" data-name="Container">
                <div className="absolute h-[260px] left-0 top-0 w-[356px]" data-name="Image (Cycling Crash Course for Beginners)">
                  <img alt="" className="absolute inset-0 max-w-none object-contain pointer-events-none size-full" src={imgImageCyclingCrashCourseForBeginners1} />
                </div>
              </div>
              <Container1 text="單車技術改進課程" text1="教你由零出發學識踩單車 （包括：單車檢查、單車操控技巧、單車安全守則、模擬練習，完成後可優先參與**單車技術改進課程）" />
            </MobContainer>
            <MobContainer>
              <div className="h-[260px] overflow-clip relative shrink-0 w-full" data-name="Container">
                <div className="absolute h-[260px] left-0 top-0 w-[356px]" data-name="Image (Cycling Crash Course for Beginners)">
                  <img alt="" className="absolute inset-0 max-w-none object-contain pointer-events-none size-full" src={imgImageCyclingCrashCourseForBeginners2} />
                </div>
              </div>
              <Container1 text="單車導賞團" text1="教你由零出發學識踩單車 （包括：單車檢查、單車操控技巧、單車安全守則、模擬練習，完成後可優先參與**單車技術改進課程）" />
            </MobContainer>
            <MobContainer>
              <div className="h-[260px] overflow-clip relative shrink-0 w-full" data-name="Container">
                <div className="absolute h-[260px] left-0 top-0 w-[356px]" data-name="Image (Cycling Crash Course for Beginners)">
                  <img alt="" className="absolute inset-0 max-w-none object-contain pointer-events-none size-full" src={imgImageCyclingCrashCourseForBeginners3} />
                </div>
              </div>
              <Container1 text="小童單車新手速成班 （即將推出）" text1="教你由零出發學識踩單車 （包括：單車檢查、單車操控技巧、單車安全守則、模擬練習，完成後可優先參與**單車技術改進課程）" />
            </MobContainer>
          </div>
        </div>
      </div>
      <div className="absolute bg-gradient-to-b from-[20.192%] from-white h-[1106px] left-0 to-[#b4dff2] to-[54.808%] top-[4747px] w-[390px]" data-name="bg">
        <div className="absolute bottom-0 h-[150px] left-0 w-[390px]" data-name="Asset 1 1">
          <img alt="" className="absolute inset-0 max-w-none object-cover pointer-events-none size-full" src={imgAsset11} />
        </div>
      </div>
      <div className="absolute content-stretch flex flex-col items-center justify-center left-0 px-[16px] py-[80px] top-[4747px] w-[390px]" data-name="Hero 4">
        <div className="bg-white content-stretch flex flex-col gap-[24px] items-center max-w-[740px] overflow-clip relative rounded-[24px] shadow-[0px_8px_12px_6px_rgba(0,0,0,0.08),0px_4px_6px_0px_rgba(0,0,0,0.16)] shrink-0 w-full" data-name="Container">
          <div className="bg-[#44b0e2] relative shrink-0 w-full" data-name="Container">
            <div className="flex flex-col items-center size-full">
              <div className="content-stretch flex flex-col items-center px-[12px] py-[40px] relative w-full">
                <div className="content-stretch flex flex-col gap-[16px] items-center max-w-[360px] relative shrink-0 text-center w-full">
                  <p className="font-['Comfortaa:Semibold','Noto_Sans_JP:Bold',sans-serif] leading-[40px] relative shrink-0 text-[32px] text-white w-full" style={{ fontVariationSettings: "'wght' 700" }}>
                    立即報名
                  </p>
                  <p className="font-['Roboto:Regular','Noto_Sans_JP:Regular','Noto_Sans_SC:Regular',sans-serif] font-normal leading-[24px] relative shrink-0 text-[#d0fae5] text-[16px] tracking-[0.15px] w-full" style={{ fontVariationSettings: "'wdth' 100" }}>
                    準備好開啟你的安全騎行之旅了嗎？請填寫表格，我們的團隊會盡快聯絡你安排課程 。
                  </p>
                </div>
              </div>
            </div>
          </div>
          <div className="relative shrink-0 w-full" data-name="Form">
            <div className="content-stretch flex flex-col gap-[24px] items-start pb-[24px] px-[12px] relative w-full">
              <div className="content-stretch flex flex-col gap-[24px] items-start relative shrink-0 w-full" data-name="Container">
                <TextField>
                  <p className="font-['Roboto:Regular',sans-serif] font-normal leading-[20px] relative shrink-0 text-[#515151] text-[14px] tracking-[0.1px] whitespace-nowrap" style={{ fontVariationSettings: "'wdth' 100" }}>
                    姓名 *
                  </p>
                  <TextInput>
                    <CursorValueText text="陳大文" />
                  </TextInput>
                </TextField>
                <TextField>
                  <p className="font-['Roboto:Regular',sans-serif] font-normal leading-[20px] relative shrink-0 text-[#515151] text-[14px] tracking-[0.1px] whitespace-nowrap" style={{ fontVariationSettings: "'wdth' 100" }}>
                    電郵地址 *
                  </p>
                  <TextInput>
                    <CursorValueText1 text="email@example.com" />
                  </TextInput>
                </TextField>
                <TextField>
                  <p className="font-['Roboto:Regular',sans-serif] font-normal leading-[20px] relative shrink-0 text-[#515151] text-[14px] tracking-[0.1px] whitespace-nowrap" style={{ fontVariationSettings: "'wdth' 100" }}>
                    手提電話 *
                  </p>
                  <TextInput>
                    <CursorValueText text="51234567" />
                  </TextInput>
                </TextField>
                <TextField>
                  <p className="font-['Roboto:Regular',sans-serif] font-normal leading-[20px] relative shrink-0 text-[#515151] text-[14px] tracking-[0.1px] whitespace-nowrap" style={{ fontVariationSettings: "'wdth' 100" }}>
                    年齡 *
                  </p>
                  <TextInput>
                    <CursorValueText text="請選擇" />
                    <IconsOutlineArrowDown />
                  </TextInput>
                </TextField>
              </div>
              <TextField>
                <p className="font-['Roboto:Regular',sans-serif] font-normal leading-[20px] relative shrink-0 text-[#515151] text-[14px] tracking-[0.1px] whitespace-nowrap" style={{ fontVariationSettings: "'wdth' 100" }}>
                  單車課程 *
                </p>
                <TextInput>
                  <CursorValueText1 text="請選擇" />
                  <IconsOutlineArrowDown />
                </TextInput>
              </TextField>
              <div className="content-stretch flex flex-col items-start pt-[12px] relative shrink-0 w-full">
                <Text text="遞交" additionalClassNames="min-w-[170px]">
                  <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 15.8331 15.8331">
                    <path d={svgPaths.p11544500} fill="var(--fill-0, white)" id="Icon (Stroke)" />
                  </svg>
                </Text>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="absolute bg-[#44b0e2] content-stretch flex flex-col gap-[40px] items-center left-0 overflow-clip px-[16px] py-[80px] top-[5853px] w-[390px]" data-name="Footer">
        <div className="content-stretch flex gap-[20px] items-start relative shrink-0 w-full">
          <div className="content-stretch flex flex-[1_0_0] flex-col gap-[24px] items-start justify-end min-h-px min-w-px relative">
            <div className="content-stretch flex flex-col items-start justify-center relative shrink-0 w-full">
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
                <Group1 additionalClassNames="inset-[3.69%_51.62%_70.16%_25.39%]">
                  <path d={svgPaths.p4d3100} fill="var(--fill-0, #60B4E5)" id="Vector" />
                  <path d={svgPaths.p35eb1100} fill="var(--fill-0, white)" id="Vector_2" />
                  <path d={svgPaths.p3b2ac780} fill="var(--fill-0, white)" id="Vector_3" />
                </Group1>
                <Group1 additionalClassNames="inset-[3.69%_25.39%_70.16%_51.62%]">
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
                </Group1>
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
            <div className="content-stretch flex flex-col gap-[12px] items-start justify-center relative shrink-0 w-full">
              <Wrapper5>Follow Us</Wrapper5>
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
            <div className="content-stretch flex flex-col gap-[12px] items-start justify-center relative shrink-0 w-full">
              <Wrapper5>Powered by</Wrapper5>
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
                  <Wrapper1>
                    <g id="arrow-up 1">
                      <path d="M12 19V5" id="Vector" stroke="var(--stroke-0, white)" strokeLinecap="round" strokeLinejoin="round" />
                      <path d="M5 12L12 5L19 12" id="Vector_2" stroke="var(--stroke-0, white)" strokeLinecap="round" strokeLinejoin="round" />
                    </g>
                  </Wrapper1>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="content-stretch flex flex-col font-['Roboto:Regular',sans-serif] font-normal gap-[10px] items-start leading-[0] relative shrink-0 text-[14px] text-white tracking-[0.1px] w-full whitespace-nowrap">
          <Wrapper7>Copyright © 2026 Locolla.com</Wrapper7>
          <div className="content-stretch flex gap-[24px] items-center relative shrink-0">
            <Wrapper7>Privacy Policy</Wrapper7>
            <Wrapper7>{`Terms & Conditions`}</Wrapper7>
          </div>
        </div>
      </div>
    </div>
  );
}