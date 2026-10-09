import { KIDS_CLASS_ID, REGULAR_CLASS_ID } from "@/lib/catalogueIds";

/**
 * Marketing copy for the cycling landing page. Anything that belongs to a Class, Venue or
 * Session (names, ages, sizes, prices, addresses, times) comes from data, not from here.
 */

/** LocoBike's standing in Hong Kong, shown in the hero, the about section and search previews. */
export const OPERATOR_CLAIM = "全港最大共享單車及單車亭營運商";

export const WHATSAPP_URL = "https://wa.me/85293380433";
export const FACEBOOK_URL = "https://www.facebook.com/locobikehk";

/** Per-Class extras shown on its card and in the lesson plan, keyed by class_id. */
export const CLASS_EXTRAS: Record<
  string,
  {
    badge: string;
    finderHint: string;
    note?: string;
    equipment: string;
    plan: { lead: string; steps: Array<[string, string, string]>; levels: string[]; feedback: string };
  }
> = {
  [KIDS_CLASS_ID]: {
    badge: "放學後 / 週末",
    finderHint: "放學後 / 週末上午",
    note: "家長或接送人須留喺場內，直至教練交回小朋友",
    equipment: "單車、頭盔及護具全包",
    plan: {
      lead: "以遊戲帶技巧，先學平衡再學踩；每段唔超過 15 分鐘，中間有飲水休息。",
      steps: [
        ["0–5", "報到及裝備", "點名、戴頭盔同護具、按身高分配單車"],
        ["5–10", "熱身及規則", "關節熱身；學「聽到哨聲即停」等三條規則"],
        ["10–20", "平衡練習", "推地滑行、提起雙腳滑行；初學者可拆走腳踏當平衡車"],
        ["20–25", "飲水休息", "休息及個別講評"],
        ["25–35", "起步及煞車", "腳踏放「三點鐘」位起步，聽口令用手煞車停定"],
        ["35–45", "轉向及控制", "繞雪糕筒蛇形、大圓圈、窄道直線"],
        ["45–55", "遊戲", "「紅燈綠燈」、「慢車比賽」——最慢到達者勝"],
        ["55–60", "總結及交回", "稱讚每人一個進步、派貼紙、向家長簡報進度"],
      ],
      levels: [
        "未能平衡：喺平衡區練滑行",
        "能滑行 5 米以上：練起步及煞車",
        "能自行起步、直線騎同停車：練轉向",
        "能繞雪糕筒、聽口令安全停車：練單手打手勢同往後望",
      ],
      feedback: "課後 WhatsApp 回饋：教練當日會話你知今堂學咗咩、屋企可以點練、建議下一堂。",
    },
  },
  [REGULAR_CLASS_ID]: {
    badge: "平日早上都有",
    finderHint: "平日早上、晚上 / 週末下午",
    equipment: "單車及頭盔全包",
    plan: {
      lead: "先講原理再練習，重點係控制、安全停車，同埋香港單車徑嘅使用規則。",
      steps: [
        ["0–5", "報到及調校", "戴頭盔、調校座高——坐低兩腳掌可以著地"],
        ["5–12", "認識單車", "前後煞車分別、車鈴、持車手勢"],
        ["12–25", "平衡及滑行", "推地滑行、提腳滑行、滑行中煞車"],
        ["25–40", "起步、停車及轉向", "三點鐘位起步、定點停車、U 形轉、蛇形繞雪糕筒"],
        ["40–50", "道路技巧及規則", "往後望、單手打手勢、靠左騎、超越前響鈴、過路口落車"],
        ["50–57", "綜合練習", "按口令騎一條小路線：起步、轉彎、打手勢、停車"],
        ["57–60", "總結", "個別講評、建議下一步、安排下一堂"],
      ],
      levels: [
        "未能平衡：練滑行及煞車",
        "能起步及直線騎：練轉向及定點停車",
        "能控制轉向：練往後望、單手打手勢及超越",
        "完成綜合路線：可由教練陪同去附近單車徑實習",
      ],
      feedback: "完成後點樣？同事會 WhatsApp 你下一堂報名資料；教練建議正式上單車徑前，先喺人少地方多練。",
    },
  },
};

export type FaqContext = {
  agesLine: string;
  sizesLine: string;
};

/** Frequently asked questions; the class ages and sizes come from data. */
export function buildFaqs({ agesLine, sizesLine }: FaqContext): Array<[string, string]> {
  return [
    [
      "天氣唔好點安排？",
      "三號或以上颱風信號、紅色或黑色暴雨警告：取消課堂並安排補堂。黃色暴雨或雷暴警告：停止騎行，轉到有蓋地方做講解同平衡練習。酷熱天氣：每 15 分鐘飲水休息。空氣質素健康風險「甚高」或「嚴重」：幼兒班取消，常規班按學員意願。如要取消，會喺上課前 2 小時 WhatsApp 通知你。",
    ],
    [
      "點樣改期 / 調堂？",
      "上課前兩日 00:00 之前（例如星期六嘅課堂，即星期四 00:00 前），可以喺學員連結自行改去同一班別其他有位嘅班期，唔使另外申請。之後如需改期，請 WhatsApp 我哋。因天氣取消嘅課堂唔受此限，可以隨時改期。",
    ],
    [
      "要帶咩？",
      "穿運動服同包頭鞋，自備飲用水。單車（12–24 吋，按身高分配）、頭盔由單車亭提供，幼兒班另有護膝同護肘。戶外帽子唔可以代替頭盔。平日日間班學員記得帶定運動鞋。",
    ],
    ["有冇年齡或身高要求？", `${agesLine}。報名時請提供身高，方便我哋預留啱尺寸嘅單車同頭盔。`],
    ["一班幾多人？", `每班一位教練：${sizesLine}。同一班會按程度分四級，喺唔同練習區練習。`],
    [
      "完全唔識踩都可以報？",
      "可以，大部分學員都係由零開始。第一級由平衡滑行練起，幼兒初學者可以拆走腳踏當平衡車咁練。",
    ],
    [
      "家長要留低嗎？",
      "幼兒班家長或接送人必須留喺場內，直至教練交回小朋友。歡迎旁觀，但請唔好落場或同時發指令。教練只會將小朋友交回報名時登記嘅家長或接送人。",
    ],
    [
      "萬一受傷點處理？",
      "教練會即時停止全班練習。輕微擦傷即場清潔處理，並即時通知家長或緊急聯絡人；如有頭部撞擊或懷疑骨折會即刻打 999，翌日再致電跟進。",
    ],
    [
      "報名要填咩資料？",
      "每位學員嘅姓名、年齡、身高、騎車經驗、緊急聯絡人（幼兒班為家長或接送人），以及需要教練留意嘅健康情況。報名人會代表各學員同意條款及風險聲明；18 歲以下學員須由家長報名，或已獲家長授權。",
    ],
    [
      "點樣付款？可唔可以退款？",
      "可用信用卡或支付寶HK付款。上課前 7 日或之前取消可全數退款；7 日內取消不設退款，但可以按改期安排轉堂。如因天氣取消而未能安排合適補堂，可全數退款。",
    ],
  ];
}

export const WEEKDAY_ZH = ["一", "二", "三", "四", "五", "六", "日"];

export type Slot = "morning" | "school" | "evening" | "weekend";

export const SLOT_LABELS: Array<[Slot | "all", string]> = [
  ["all", "全部時段"],
  ["morning", "平日早上"],
  ["school", "放學後"],
  ["evening", "下班後"],
  ["weekend", "週末"],
];

/** Which time slot a Session falls in, from its date and start time. */
export function slotOf(date: string, time: string): Slot {
  const day = new Date(`${date}T00:00:00Z`).getUTCDay();
  if (day === 0 || day === 6) return "weekend";
  if (time < "12:00") return "morning";
  if (time >= "18:00") return "evening";
  return "school";
}
