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
    answer_zh: '如需調堂，必須於原定上課日期前不少於 48 小時提出申請。距離上課日期少於 48 小時，恕不接受調堂申請，亦不設退款。',
    answer_en: 'Rescheduling requests must be made at least 48 hours before the scheduled class. Requests made within 48 hours will not be accepted, and no refund will be issued.',
  },
  {
    id: 'weather',
    question_zh: '惡劣天氣如何安排？',
    question_en: 'What happens in bad weather?',
    answer_zh: '主辦機構會於課堂開始前 2 小時透過電郵通知。遇以下情況課堂將取消：3 號風球或以上、黃／紅／黑雨、場地出現明顯安全風險。因天氣取消的課堂，可安排退款或調至 1 個月內的課堂。',
    answer_en: 'Organisers will notify participants by email 2 hours before class. Classes are generally cancelled when: Typhoon Signal No. 3 or above is in effect, Yellow/Red/Black rainstorm warnings are issued, or the venue poses safety risks. Cancelled classes due to weather may be refunded or rescheduled within 1 month.',
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
