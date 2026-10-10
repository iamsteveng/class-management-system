"use client";

import { AttendanceQrCard } from "@/app/components/AttendanceQrCard";
import { useLanguage } from "@/app/contexts/LanguageContext";
import { buildSessionIcs } from "@/lib/orderMessage";

export type DoneOrder = {
  class_id: string;
  class_name_zh: string;
  class_name_en?: string;
  quantity: number;
  session_date: string;
  session_time: string;
  session_end_time?: string;
  session_location_zh: string;
  session_location_en?: string;
  session_google_maps_url?: string;
  participants: Array<{ participant_id: string; name: string; qrCodeDataUrl: string }>;
};

const copy = {
  "zh-TW": {
    heading: "報名成功",
    whatsapp: "確認已 WhatsApp 俾你，入面有每位學員嘅連結。",
    saveQr: "請為每位學員儲存出席 QR Code，上堂時出示。",
    calendar: "加入日曆",
    bring: "記得帶：運動服、包頭鞋、飲用水。單車同頭盔由單車亭提供。",
    details: "睇學員資料 / 改期",
  },
  en: {
    heading: "You're booked",
    whatsapp: "We've sent a confirmation to your WhatsApp with each participant's link.",
    saveQr: "Please save each participant's attendance QR and show it at class.",
    calendar: "Add to calendar",
    bring: "Bring sportswear, closed shoes and water. Bikes and helmets are provided.",
    details: "Participant details / change session",
  },
};

export function DoneContent({ order, holdId }: { order: DoneOrder; holdId: string }) {
  const { language } = useLanguage();
  const tr = copy[language];
  const className = language === "en" ? (order.class_name_en ?? order.class_name_zh) : order.class_name_zh;
  const location = language === "en" ? (order.session_location_en ?? order.session_location_zh) : order.session_location_zh;

  const downloadIcs = () => {
    const ics = buildSessionIcs({
      uid: `${holdId}@locobike`,
      title: className,
      date: order.session_date,
      startTime: order.session_time,
      endTime: order.session_end_time,
      location,
      description: order.participants.map((p) => p.name).join(", "),
    });
    const url = URL.createObjectURL(new Blob([ics], { type: "text/calendar;charset=utf-8" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `${order.session_date}-class.ics`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col items-center space-y-6 px-4 py-8 text-center">
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-12 w-12" aria-hidden="true">
          <path
            fillRule="evenodd"
            d="M19.916 4.626a.75.75 0 01.208 1.04l-9 13.5a.75.75 0 01-1.154.114l-6-6a.75.75 0 011.06-1.06l5.353 5.353 8.493-12.74a.75.75 0 011.04-.207z"
            clipRule="evenodd"
          />
        </svg>
      </div>
      <h1 className="text-2xl font-semibold text-zinc-900">{tr.heading}</h1>
      <p className="text-sm text-zinc-700">{tr.whatsapp}</p>
      <button
        type="button"
        onClick={downloadIcs}
        data-testid="add-to-calendar"
        className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-800 hover:bg-zinc-50"
      >
        {tr.calendar}
      </button>
      <p className="rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-900">{tr.saveQr}</p>

      {order.participants.map((p) => (
        <section key={p.participant_id} className="w-full space-y-2" data-participant-card={p.participant_id}>
          <h2 className="text-lg font-semibold text-zinc-900">{p.name}</h2>
          <AttendanceQrCard
            qrCodeDataUrl={p.qrCodeDataUrl}
            className={className}
            session={{
              date: order.session_date,
              time: order.session_time,
              endTime: order.session_end_time,
              locationZh: order.session_location_zh,
              locationEn: order.session_location_en,
              googleMapsUrl: order.session_google_maps_url,
            }}
          />
          <a
            href={`/participant/${encodeURIComponent(p.participant_id)}`}
            data-participant-link={p.participant_id}
            className="text-sm font-medium text-zinc-700 underline underline-offset-4 hover:text-zinc-900"
          >
            {tr.details}
          </a>
        </section>
      ))}

      <p className="text-sm text-zinc-600">{tr.bring}</p>
    </main>
  );
}
