import clsx from "clsx";
import svgPaths from "./svg-05zl6bzled";
import imgLightBigVertical from "figma:asset/68ca555f0ca55e85b799fc4861d7e68bc12627d4.png";
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

export default function AboutUs() {
  return (
    <div className="content-stretch flex flex-col items-center p-[80px] relative size-full" data-name="About Us">
      <div className="bg-white content-stretch flex gap-[20px] items-center justify-center relative shrink-0 w-full" data-name="Hero 20">
        <div className="content-stretch flex flex-col items-center justify-center relative shrink-0" data-name="container">
          <div className="-translate-x-1/2 absolute flex h-[528.1px] items-center justify-center left-[calc(50%-0.29px)] top-[-19.78px] w-[575.414px]" style={{ "--transform-inner-width": "1200", "--transform-inner-height": "0" } as React.CSSProperties}>
            <div className="-rotate-3 flex-none">
              <div className="bg-[#daeff9] h-[500px] rounded-[32px] w-[550px]" data-name="Vertical Image" />
            </div>
          </div>
          <div className="h-[480px] overflow-clip relative rounded-[32px] shrink-0 w-[530px]" data-name="Vertical Image">
            <div className="absolute h-[500px] left-0 top-0 w-[550px]" data-name="Light - Big Vertical">
              <img alt="" className="absolute inset-0 max-w-none object-cover pointer-events-none size-full" src={imgLightBigVertical} />
            </div>
          </div>
          <div className="absolute bg-white content-stretch flex flex-col gap-[6px] items-start left-[308px] p-[16px] rounded-[20px] shadow-[0px_8px_12px_0px_rgba(0,0,0,0.08),0px_4px_6px_0px_rgba(0,0,0,0.16)] text-[#19b2a8] top-[351px] w-[232px]">
            <div className="content-stretch flex gap-[4px] items-end relative shrink-0 w-full">
              <p className="font-['Roboto:Medium','Noto_Sans_JP:Medium',sans-serif] font-medium leading-[28px] relative shrink-0 text-[22px] whitespace-nowrap" style={{ fontVariationSettings: "'wdth' 100" }}>
                超過
              </p>
              <p className="font-['Comfortaa:Bold',sans-serif] font-bold h-[47px] leading-[54px] relative shrink-0 text-[48px] tracking-[-2px] w-[104px]">1,000</p>
              <p className="font-['Roboto:Medium','Noto_Sans_JP:Medium',sans-serif] font-medium leading-[28px] relative shrink-0 text-[22px] whitespace-nowrap" style={{ fontVariationSettings: "'wdth' 100" }}>
                學員
              </p>
            </div>
            <p className="font-['Roboto:Medium','Noto_Sans_JP:Medium','Noto_Sans_SC:Medium',sans-serif] font-medium leading-[28px] relative shrink-0 text-[22px] w-full" style={{ fontVariationSettings: "'wdth' 100" }}>
              成功發掘踩車樂趣
            </p>
          </div>
        </div>
        <div className="flex flex-[1_0_0] flex-row items-center self-stretch">
          <div className="flex-[1_0_0] h-full min-h-px min-w-[400px] relative">
            <div className="flex flex-col justify-center min-w-[inherit] size-full">
              <div className="content-stretch flex flex-col items-start justify-center min-w-[inherit] px-[40px] relative size-full">
                <div className="content-stretch flex flex-col gap-[32px] items-start justify-center max-w-[720px] pb-[24px] relative shrink-0 w-full">
                  <div className="bg-[#b4dff3] content-stretch flex items-center justify-center px-[12px] py-[4px] relative rounded-[40px] shrink-0" data-name="tooltip - session name">
                    <p className="font-['Inter:Semi_Bold','Noto_Sans_JP:Bold',sans-serif] font-semibold leading-[20px] not-italic relative shrink-0 text-[#225871] text-[14px] tracking-[-0.1504px] whitespace-nowrap">關於我們</p>
                  </div>
                  <div className="flex flex-col font-['Comfortaa:Semibold','Noto_Sans_JP:Bold',sans-serif] justify-center leading-[0] min-w-full relative shrink-0 text-[#44b0e2] text-[24px] w-[min-content]" style={{ fontVariationSettings: "'wght' 700" }}>
                    <p className="leading-[32px]">安全騎行，樂在社區</p>
                  </div>
                  <div className="flex flex-col font-['Roboto:Regular','Noto_Sans_JP:Regular','Noto_Sans_SC:Regular',sans-serif] font-normal justify-center leading-[0] min-w-full relative shrink-0 text-[#141414] text-[16px] tracking-[0.3px] w-[min-content]" style={{ fontVariationSettings: "'wdth' 100" }}>
                    <p className="leading-[24px]">「樂區單車安全學院」致力透過系統化訓練，陪伴你發展恆久又安全的踩車能力 。我們堅信「人人有車練」，旨在推動安全騎行與互讓文化，攜手打造對行人及單車更友善的城市 。不論是初學者或想穿梭市區的車友，我們專業的認證導師都會提供耐心指導 ，助你由零建立自信，安全享受踩車的自由。我們相信，當每個人都具備正確的騎行知識與禮讓態度，這座城市將會變得更加美好 。</p>
                  </div>
                  <div className="content-stretch flex flex-col gap-[16px] h-[144px] items-start relative shrink-0 w-full" data-name="List - advantages">
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
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}