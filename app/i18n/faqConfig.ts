export interface FaqItem {
  id: string;
  question_zh: string;
  question_en: string;
  answer_zh: string;
  answer_en: string;
}

export const FAQ_ITEMS: FaqItem[] = [
  {
    id: 'age',
    question_zh: '有沒有年齡限制？',
    question_en: 'Is there an age limit?',
    answer_zh: '成人班適合 18–60 歲人士參加。',
    answer_en: 'Adult classes are open to participants aged 18–60.',
  },
  {
    id: 'body',
    question_zh: '有沒有身高或體重限制？',
    question_en: 'Are there height or weight restrictions?',
    answer_zh: '沒有身高或體重限制。',
    answer_en: 'There are no height or weight restrictions.',
  },
  {
    id: 'curriculum',
    question_zh: '課程會學些什麼？',
    question_en: 'What will I learn in the course?',
    answer_zh: '3 小時課堂包括 2 小時教學及 1 小時自由練習。教學內容涵蓋：單車檢查、基本部件操作、單車安全知識、基本操控技巧（起步、平衡、煞車等）。全程教練在旁指導。',
    answer_en: 'The 3-hour class includes 2 hours of instruction and 1 hour of free practice. Topics covered: bike inspection, basic component operation, cycling safety knowledge, and basic handling skills (starting, balancing, braking, etc.). Instructors are present throughout.',
  },
  {
    id: 'ratio',
    question_zh: '師生比例是多少？',
    question_en: 'What is the instructor-to-student ratio?',
    answer_zh: '每班設有 1 位教練及 1 位助教帶領。',
    answer_en: 'Each class is led by 1 instructor and 1 assistant.',
  },
  {
    id: 'bring',
    question_zh: '需要帶什麼？',
    question_en: 'What should I bring?',
    answer_zh: '請穿著運動服或適合戶外活動的服飾及運動鞋，並自備水。頭盔及護具由 LocoBike 提供。',
    answer_en: 'Please wear sportswear or outdoor-suitable clothing and athletic shoes, and bring your own water. Helmets and protective gear are provided by LocoBike.',
  },
  {
    id: 'reschedule',
    question_zh: '如何調堂？',
    question_en: 'How do I reschedule?',
    answer_zh: '上課前兩日 00:00 之前（例如星期六嘅課堂，即星期四 00:00 前），可以喺學員連結自行改去同一課程其他有位嘅時段。之後恕不接受調堂申請，亦不設退款。因天氣取消嘅課堂不受此限。',
    answer_en: 'You can move to another session of the same class with spaces from your participant link until 00:00 two days before your class (Thursday 00:00 for a Saturday class). After that, rescheduling is not accepted and no refund is issued. Classes cancelled for bad weather are not affected.',
  },
  {
    id: 'weather',
    question_zh: '惡劣天氣如何安排？',
    question_en: 'What happens in bad weather?',
    answer_zh: '主辦機構會於課堂開始前 2 小時根據天文台資訊評估並通知。遇以下情況課堂一般會取消：三號熱帶氣旋警告信號或以上、紅／黑色暴雨警告信號，或（幼兒班）空氣質素健康風險「甚高」或「嚴重」。因天氣取消的課堂，可選擇退款，或透過學員連結自行調至同一課程其他有名額的時段。',
    answer_en: 'We assess the Observatory\'s latest information 2 hours before class and let you know. Classes are generally cancelled when Typhoon Signal No. 3 or above or a Red/Black Rainstorm Warning is in force, or (Kids Class) the Air Quality Health Index is at Very High or Serious risk. For a class cancelled by weather you can choose a refund, or move yourself to another session of the same class with spaces using your participant link.',
  },
  {
    id: 'illness',
    question_zh: '因病或受傷缺席如何處理？',
    question_en: 'What if I am absent due to illness or injury?',
    answer_zh: '如能提供有效醫生證明，可安排退款或調至 1 個月內的課堂。否則恕不安排退款或調堂。',
    answer_en: 'If you can provide a valid medical certificate, a refund or rescheduling within 1 month can be arranged. Otherwise, no refund or rescheduling will be offered.',
  },
  {
    id: 'contact',
    question_zh: '如何聯絡查詢？',
    question_en: 'How can I contact you?',
    answer_zh: '辦公時間（星期一至五 10:00–18:00）：WhatsApp 9258 3032 或電郵 social@locolla.hk。活動當日緊急查詢請致電 LocoBike 客戶服務部：5212 1706。',
    answer_en: 'During office hours (Mon–Fri 10:00–18:00): WhatsApp 9258 3032 or email social@locolla.hk. For urgent enquiries on the day of the activity, call LocoBike Customer Service: 5212 1706.',
  },
];
