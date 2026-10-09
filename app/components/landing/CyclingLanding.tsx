"use client";

import Image from "next/image";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowRight,
  Award,
  Bike,
  Calendar,
  Check,
  ChevronDown,
  ChevronLeft,
  Clock,
  CloudRain,
  MapPin,
  MessageCircle,
  RefreshCw,
  ShieldCheck,
  TrainFront,
  User,
  Users,
} from "lucide-react";

import { ApplyForm, type ApplyClass, type ApplySession } from "@/app/components/apply/ApplyForm";
import { formatSessionDate } from "@/app/i18n/applyTranslations";
import {
  CLASS_EXTRAS,
  FACEBOOK_URL,
  OPERATOR_CLAIM,
  SLOT_LABELS,
  WEEKDAY_ZH,
  WHATSAPP_URL,
  buildFaqs,
  slotOf,
  type Slot,
} from "./landingContent";

export type LandingVenue = {
  venue: {
    venue_id: string;
    name_zh: string;
    district_zh: string;
    address_zh: string;
    opening_hours?: string;
    latitude: number;
    longitude: number;
    mtr_station_zh?: string;
    mtr_line_zh?: string;
    mtr_latitude?: number;
    mtr_longitude?: number;
    walk_minutes?: number;
    directions_zh?: string;
  };
  days: Array<{ cycle_week: number; weekday: number }>;
};

export type LandingData = {
  live: boolean;
  classes: Array<{ class: ApplyClass; sessions: Array<ApplySession & { venue_id?: string }> }>;
  venues: LandingVenue[];
  cycle_weeks: number;
  sessions_per_cycle: number;
  terms: { version: string; content: string } | null;
};

type Row = ApplySession & { venue_id?: string; cls: ApplyClass; slot: Slot };

const money = (cls: ApplyClass, n: number) => `HKD ${n.toLocaleString("en-US")}`;
const ages = (cls: ApplyClass) => `${cls.age_min ?? ""}–${cls.age_max ?? ""} 歲`;
const dLabel = (date: string) => formatSessionDate(date, "zh-TW");
const mapsUrl = (lat: number, lng: number) => `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;

function SeatLabel({ n }: { n: number }) {
  if (n <= 0) return <span className="text-[13px] font-bold text-[#6B7A86]">已滿</span>;
  return (
    <span className={`text-[13px] ${n <= 2 ? "font-bold text-[#C2541A]" : "font-medium text-[#1E7A4C]"}`}>
      尚餘 {n} 位
    </span>
  );
}

const btn =
  "inline-flex items-center justify-center gap-2 rounded-full font-bold whitespace-nowrap transition-colors focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-[#F2A65A]";
const btnPrimary = `${btn} bg-[#0B6FB8] text-white hover:bg-[#08548C]`;
const btnOutline = `${btn} bg-white text-[#0E2433] shadow-[inset_0_0_0_1.5px_#C9D6E0] hover:text-[#0B6FB8] hover:shadow-[inset_0_0_0_1.5px_#0B6FB8]`;

export function CyclingLanding({ data }: { data: LandingData }) {
  const router = useRouter();
  const params = useSearchParams();
  const [classFilter, setClassFilter] = useState(params.get("class") ?? "all");
  const [slotFilter, setSlotFilter] = useState(params.get("slot") ?? "all");
  const [districtFilter, setDistrictFilter] = useState(params.get("district") ?? "all");
  const [showAll, setShowAll] = useState(false);
  const [moreTiles, setMoreTiles] = useState<Record<string, boolean>>({});
  const [picked, setPicked] = useState<Record<string, string>>({});
  const [lastPickedClass, setLastPickedClass] = useState<string | null>(null);
  const [lessonTab, setLessonTab] = useState(data.classes[0]?.class.class_id ?? "");
  const [openFaq, setOpenFaq] = useState<Record<number, boolean>>({ 0: true });
  const [apply, setApply] = useState<{ classId: string; sessionId: string } | null>(null);
  const [barVisible, setBarVisible] = useState(false);
  const heroRef = useRef<HTMLElement | null>(null);

  const classes = data.classes;
  const rows: Row[] = useMemo(
    () =>
      classes
        .flatMap(({ class: cls, sessions }) =>
          sessions.map((s) => ({ ...s, cls, slot: slotOf(s.date, s.time) }))
        )
        .sort((a, b) => `${a.date}T${a.time}`.localeCompare(`${b.date}T${b.time}`)),
    [classes]
  );

  const matchesFilters = (r: Row, ignoreClass = false) =>
    (ignoreClass || classFilter === "all" || r.cls.class_id === classFilter) &&
    (slotFilter === "all" || r.slot === slotFilter) &&
    (districtFilter === "all" || r.venue_id === districtFilter);
  const filtered = rows.filter((r) => matchesFilters(r));
  const open = rows.filter((r) => r.remaining_quota > 0);
  const nextOpen = open[0];
  const [renderedAt] = useState(() => Date.now());
  const twoWeeks = open.filter((r) => Date.parse(`${r.date}T${r.time}:00+08:00`) < renderedAt + 14 * 86_400_000);

  // Keep the filters in the URL so a filtered view can be shared.
  useEffect(() => {
    const q = new URLSearchParams();
    if (classFilter !== "all") q.set("class", classFilter);
    if (slotFilter !== "all") q.set("slot", slotFilter);
    if (districtFilter !== "all") q.set("district", districtFilter);
    const qs = q.toString();
    window.history.replaceState(null, "", `${window.location.pathname}${qs ? `?${qs}` : ""}${window.location.hash}`);
  }, [classFilter, slotFilter, districtFilter]);

  useEffect(() => {
    const hero = heroRef.current;
    if (!hero || !("IntersectionObserver" in window)) return;
    const observer = new IntersectionObserver(([entry]) => setBarVisible(!entry.isIntersecting));
    observer.observe(hero);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    document.body.style.overflow = apply ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [apply]);

  const closeApply = useCallback(() => setApply(null), []);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && closeApply();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [closeApply]);

  const openApply = (classId: string, sessionId: string) => setApply({ classId, sessionId });

  const classSessions = (classId: string) =>
    rows.filter((r) => r.cls.class_id === classId && matchesFilters(r, true));
  const selectedFor = (classId: string) => {
    const list = classSessions(classId);
    const current = list.find((r) => r.session_id === picked[classId] && r.remaining_quota > 0);
    return current ?? list.find((r) => r.remaining_quota > 0) ?? null;
  };

  const resetFilters = () => {
    setClassFilter("all");
    setSlotFilter("all");
    setDistrictFilter("all");
  };

  const sizesLine = classes.map(({ class: c }) => `${c.name_zh}最多 ${c.class_size ?? "-"} 人`).join("、");
  const agesLine = classes.map(({ class: c }) => `${c.name_zh} ${ages(c)}`).join("，");
  const faqs = buildFaqs({ agesLine, sizesLine });
  const first = classes[0]?.class;
  const groupSaving = first?.group_price ? first.price - first.group_price : 0;
  const barPick = (lastPickedClass && selectedFor(lastPickedClass)) || filtered.find((r) => r.remaining_quota > 0) || null;
  const applyClass = apply ? classes.find((c) => c.class.class_id === apply.classId) : undefined;

  return (
    <div className="bg-[#F5F8FA] text-[#33495A] [font-family:'Noto_Sans_HK','Noto_Sans_TC','PingFang_TC','Microsoft_JhengHei',sans-serif]">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/95 shadow-[0_1px_0_#E3EAF0,0_6px_20px_rgba(14,36,51,.05)] backdrop-blur">
        <div className="mx-auto flex h-[68px] max-w-[1200px] items-center gap-6 px-4 sm:px-6">
          <a href="#top" className="flex items-center gap-2.5 text-[#0E2433] no-underline">
            <span className="inline-flex h-[38px] w-[38px] items-center justify-center rounded-xl bg-[#0B6FB8] text-white">
              <Bike className="h-6 w-6" />
            </span>
            <span className="text-lg font-black tracking-wide">樂區單車亭單車班</span>
          </a>
          <nav aria-label="主要導覽" className="ml-4 hidden gap-7 text-[15px] font-medium lg:flex">
            <a href="#course-finder" className="py-3 hover:text-[#0B6FB8]">課程</a>
            <a href="#sessions" className="py-3 hover:text-[#0B6FB8]">最近班期</a>
            <a href="#lesson" className="py-3 hover:text-[#0B6FB8]">一堂學咩</a>
            <a href="#sites" className="py-3 hover:text-[#0B6FB8]">上課地點及交通</a>
            <a href="#faq" className="py-3 hover:text-[#0B6FB8]">常見問題</a>
          </nav>
          <div className="ml-auto flex items-center gap-2.5">
            <a href={WHATSAPP_URL} className={`${btnOutline} min-h-11 px-4 text-[15px]`} aria-label="WhatsApp 查詢">
              <MessageCircle className="h-[18px] w-[18px] text-[#1E7A4C]" />
              <span className="hidden sm:inline">WhatsApp 查詢</span>
            </a>
            <a href="#course-finder" className={`${btnPrimary} min-h-11 px-4 text-[15px]`}>
              立即報名
            </a>
          </div>
        </div>
      </header>

      <main id="top">
        {/* Hero */}
        <section ref={heroRef} className="relative overflow-hidden bg-[#0E2433]" id="hero">
          <Image
            src="/images/revamp/hero.jpg"
            alt="學員於樂區單車亭旁騎單車"
            fill
            priority
            sizes="100vw"
            className="object-cover object-[70%_50%]"
          />
          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(10,30,44,.92)_0%,rgba(10,30,44,.78)_42%,rgba(10,30,44,.15)_75%)]" />
          <div className="relative z-[1] mx-auto flex max-w-[1200px] flex-col gap-6 px-4 pt-20 pb-20 sm:px-6">
            {nextOpen ? (
              <span className="inline-flex items-center gap-2 self-start rounded-full bg-white/15 px-3.5 py-1.5 text-sm font-medium text-white">
                <Calendar className="h-4 w-4 text-[#F2A65A]" />
                最近一班：{dLabel(nextOpen.date)}
                {nextOpen.time}・{nextOpen.cls.name_zh}・{nextOpen.district_zh ?? nextOpen.location_zh}
              </span>
            ) : null}
            <h1 className="max-w-[640px] text-[clamp(40px,6vw,72px)] leading-[1.08] font-black text-white">
              最快一個鐘，
              <br />
              學識踩單車
            </h1>
            <p className="max-w-[560px] text-xl leading-relaxed text-[#DCE7EF]">
              {classes.map(({ class: c }) => `${c.name_zh} ${ages(c)}`).join("・")}
              <br />
              {first ? `每堂 $${first.price}` : null}
              {first?.group_price ? `，${first.group_min_qty === 2 ? "二人" : `${first.group_min_qty} 人`}同行每位 $${first.group_price}` : null}
              ・單車同頭盔全包
            </p>
            <div className="flex flex-wrap gap-3.5">
              <a href="#course-finder" className={`${btnPrimary} min-h-14 px-7 text-lg`}>
                搵合適班期
                <ArrowRight className="h-5 w-5" />
              </a>
              <a
                href="#lesson"
                className={`${btn} min-h-14 bg-white/10 px-7 text-lg text-white shadow-[inset_0_0_0_1.5px_rgba(255,255,255,.7)] hover:bg-white/20`}
              >
                睇一堂學咩
              </a>
            </div>
            <ul className="mt-2 flex flex-wrap gap-x-8 gap-y-3 text-[15px] text-white">
              <li className="flex items-center gap-2" data-testid="operator-claim">
                <Award className="h-5 w-5 text-[#7CC4F2]" />
                <b>{OPERATOR_CLAIM}</b>
              </li>
              <li className="flex items-center gap-2">
                <Users className="h-5 w-5 text-[#7CC4F2]" />
                <b>1,000+</b>&nbsp;學員
              </li>
              <li className="flex items-center gap-2">
                <User className="h-5 w-5 text-[#7CC4F2]" />
                一位教練・{sizesLine}
              </li>
              <li className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-[#7CC4F2]" />
                單車、頭盔、護具全包
              </li>
              <li className="flex items-center gap-2">
                <MapPin className="h-5 w-5 text-[#7CC4F2]" />
                {data.venues.length} 區樂區單車亭・平日及週末
              </li>
            </ul>
          </div>
        </section>

        {/* Finder */}
        <section className="relative z-[2] mx-auto -mt-10 max-w-[1200px] px-4 sm:px-6" id="course-finder" aria-labelledby="finder-h">
          <div className="flex flex-col gap-5 rounded-3xl bg-white p-5 shadow-[0_18px_50px_rgba(14,36,51,.12)] sm:p-8">
            <div className="flex flex-wrap items-baseline gap-x-4 gap-y-2">
              <h2 id="finder-h" className="text-[28px] font-black text-[#0E2433]">邊個學踩單車？</h2>
              <p className="text-[15px] text-[#5B6B78]">揀班別、時段同地區，即時睇到啱你嘅班期</p>
            </div>
            <div role="radiogroup" aria-label="班別" className="grid gap-3 sm:grid-cols-3">
              {[{ id: "all", k: "全部", l: "所有班別", s: classes.map((c) => c.class.name_zh).join("同") }]
                .concat(
                  classes.map(({ class: c }) => ({
                    id: c.class_id,
                    k: ages(c),
                    l: c.name_zh,
                    s: CLASS_EXTRAS[c.class_id]?.finderHint ?? "",
                  }))
                )
                .map((a) => (
                  <button
                    key={a.id}
                    type="button"
                    role="radio"
                    aria-checked={classFilter === a.id}
                    onClick={() => {
                      setClassFilter(a.id);
                      setShowAll(false);
                      if (a.id !== "all") setLessonTab(a.id);
                    }}
                    className={`flex flex-col gap-1 rounded-2xl px-4 py-3.5 text-left transition ${
                      classFilter === a.id
                        ? "bg-[#0B6FB8] text-white shadow-[0_8px_20px_rgba(11,111,184,.28)]"
                        : "bg-[#F5F8FA] text-[#0E2433] shadow-[inset_0_0_0_1.5px_#DCE5EC] hover:shadow-[inset_0_0_0_1.5px_#0B6FB8]"
                    }`}
                  >
                    <span className="text-[13px] font-bold tracking-wide opacity-85">{a.k}</span>
                    <span className="text-[19px] font-black">{a.l}</span>
                    <span className="text-[13px] opacity-85">{a.s}</span>
                  </button>
                ))}
            </div>
            <FilterRow label="時段">
              {SLOT_LABELS.map(([id, label]) => (
                <Chip key={id} pressed={slotFilter === id} onClick={() => (setSlotFilter(id), setShowAll(false))}>
                  {label}
                </Chip>
              ))}
            </FilterRow>
            <FilterRow label="地區">
              <Chip pressed={districtFilter === "all"} onClick={() => (setDistrictFilter("all"), setShowAll(false))}>
                全部地區
              </Chip>
              {data.venues.map(({ venue }) => (
                <Chip
                  key={venue.venue_id}
                  pressed={districtFilter === venue.venue_id}
                  onClick={() => (setDistrictFilter(venue.venue_id), setShowAll(false))}
                >
                  {venue.district_zh}
                </Chip>
              ))}
            </FilterRow>
          </div>
        </section>

        {/* Sessions */}
        <section className="mx-auto max-w-[1200px] px-4 pt-16 sm:px-6" id="sessions" aria-labelledby="ses-h">
          <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 id="ses-h" className="mb-1.5 text-[28px] font-black text-[#0E2433]">最近班期</h2>
              <p className="text-[15px] text-[#5B6B78]" data-testid="session-count">
                未來四星期有 {filtered.length} 個班期符合你嘅選擇・按日期排列
              </p>
            </div>
            <span className="inline-flex items-center gap-1.5 text-[13px] text-[#5B6B78]">
              <span className="inline-block h-2.5 w-2.5 rounded-full bg-[#C2541A]" />
              名額緊張
              <span className="ml-2 inline-block h-2.5 w-2.5 rounded-full bg-[#9AA8B3]" />
              已滿
            </span>
          </div>
          <div className="overflow-hidden rounded-[20px] bg-white shadow-[0_1px_0_#E3EAF0]">
            {filtered.length === 0 ? (
              <div className="flex flex-col items-center gap-3 px-6 py-9 text-center">
                <strong className="text-[17px] text-[#0E2433]">暫時未有符合條件嘅班期</strong>
                <p className="text-[15px] text-[#5B6B78]">試吓其他時段或地區，或者 WhatsApp 問我哋最新班期。</p>
                <div className="flex flex-wrap justify-center gap-2.5">
                  <button type="button" className={`${btnOutline} min-h-12 px-5`} onClick={resetFilters}>
                    清除篩選
                  </button>
                  <a href={WHATSAPP_URL} className={`${btnPrimary} min-h-12 px-5`}>
                    <MessageCircle className="h-5 w-5" />
                    WhatsApp 查詢
                  </a>
                </div>
              </div>
            ) : (
              <>
                {(showAll ? filtered : filtered.slice(0, 8)).map((r) => (
                  <div
                    key={r.session_id}
                    data-row-session={r.session_id}
                    className="grid grid-cols-[1fr_auto] items-center gap-x-4 gap-y-1 border-b border-[#EEF2F5] px-4 py-3.5 last:border-b-0 sm:px-6 lg:grid-cols-[150px_120px_minmax(0,1.4fr)_minmax(0,1.2fr)_120px_128px]"
                  >
                    <div>
                      <div className="text-[17px] font-black text-[#0E2433]">{dLabel(r.date).replace(/（.）/, "")}</div>
                      <div className="text-[13px] text-[#5B6B78]">
                        星期{WEEKDAY_ZH[(new Date(`${r.date}T00:00:00Z`).getUTCDay() + 6) % 7]}・{r.time}
                        {r.end_time ? `–${r.end_time}` : ""}
                      </div>
                    </div>
                    <div className="hidden text-[15px] lg:block">
                      {r.time}
                      {r.end_time ? `–${r.end_time}` : ""}
                    </div>
                    <div className="order-3 col-span-2 text-[15px] font-medium text-[#0E2433] lg:order-none lg:col-span-1">
                      {r.cls.name_zh}（{ages(r.cls)}）
                    </div>
                    <div className="order-4 col-span-2 flex items-center gap-1.5 text-sm lg:order-none lg:col-span-1">
                      <MapPin className="h-4 w-4 text-[#5B6B78]" />
                      {r.google_maps_url ? (
                        <a href={r.google_maps_url} target="_blank" rel="noopener noreferrer" className="text-[#33495A] underline">
                          {r.location_zh}
                        </a>
                      ) : (
                        r.location_zh
                      )}
                    </div>
                    <div className="hidden lg:block">
                      <SeatLabel n={r.remaining_quota} />
                    </div>
                    <div className="row-span-1 flex flex-col items-end gap-1 lg:items-start">
                      <span className="lg:hidden">
                        <SeatLabel n={r.remaining_quota} />
                      </span>
                      {r.remaining_quota > 0 ? (
                        <button
                          type="button"
                          className={`${btnPrimary} min-h-11 px-4 text-[15px]`}
                          onClick={() => openApply(r.cls.class_id, r.session_id)}
                        >
                          報名
                        </button>
                      ) : null}
                    </div>
                  </div>
                ))}
                {filtered.length > 8 ? (
                  <div className="px-6 py-3 text-center">
                    <button type="button" className="min-h-11 px-2 text-[15px] font-bold text-[#0B6FB8]" onClick={() => setShowAll((s) => !s)}>
                      {showAll ? "收起" : `顯示全部 ${filtered.length} 個班期`}
                    </button>
                  </div>
                ) : null}
              </>
            )}
          </div>
        </section>

        {/* Courses */}
        <section className="mx-auto max-w-[1200px] px-4 pt-16 sm:px-6" id="courses" aria-labelledby="crs-h">
          <div className="mb-7">
            <h2 id="crs-h" className="mb-1.5 text-[28px] font-black text-[#0E2433]">
              {classes.length === 2 ? "兩個班別" : "班別"}
            </h2>
            <p className="text-[15px] text-[#5B6B78]">
              每堂 1 小時・單車由單車亭按身高提供
              {groupSaving > 0 ? `・${first?.group_min_qty === 2 ? "二人" : `${first?.group_min_qty} 人`}同行每位慳 $${groupSaving}` : ""}
            </p>
          </div>
          <div className="flex flex-col gap-7">
            {classes
              .filter(({ class: c }) => classFilter === "all" || classFilter === c.class_id)
              .map(({ class: c }) => {
                const extras = CLASS_EXTRAS[c.class_id];
                const list = classSessions(c.class_id);
                const sel = selectedFor(c.class_id);
                const shown = list.slice(0, moreTiles[c.class_id] ? list.length : 6);
                if (sel && !shown.includes(sel)) shown.push(sel);
                return (
                  <article
                    key={c.class_id}
                    id={`course-${c.class_id}`}
                    className="flex scroll-mt-24 flex-wrap overflow-hidden rounded-3xl bg-white shadow-[0_1px_0_#E3EAF0,0_10px_30px_rgba(14,36,51,.06)]"
                  >
                    <div className="relative min-h-[280px] flex-[1_1_340px] bg-[#DCE7EF]">
                      {c.image_url ? (
                        <Image src={c.image_url} alt={`${c.name_zh}上課情況`} fill sizes="(min-width: 1024px) 40vw, 100vw" className="object-cover" />
                      ) : null}
                      {extras?.badge ? (
                        <span className="absolute top-4 left-4 rounded-full bg-[#0E2433] px-3 py-1.5 text-[13px] font-bold text-white">
                          {extras.badge}
                        </span>
                      ) : null}
                    </div>
                    <div className="flex min-w-0 flex-[999_1_460px] flex-col gap-4 p-5 sm:p-8">
                      <div className="flex flex-wrap items-center gap-2.5">
                        <h3 className="text-[26px] font-black text-[#0E2433]">{c.name_zh}</h3>
                        <span className="rounded-full bg-[#E6F2FB] px-3 py-1 text-sm font-bold text-[#08548C]">{ages(c)}</span>
                      </div>
                      {c.description_zh ? <p className="text-[17px] font-medium text-[#0E2433]">{c.description_zh}</p> : null}
                      <div className="flex flex-wrap gap-x-5 gap-y-2 text-[15px]">
                        <span className="inline-flex items-center gap-1.5">
                          <Clock className="h-[18px] w-[18px] text-[#0B6FB8]" />
                          {c.duration_minutes ? `${c.duration_minutes / 60} 小時` : "1 小時"}
                        </span>
                        {c.class_size ? (
                          <span className="inline-flex items-center gap-1.5">
                            <Users className="h-[18px] w-[18px] text-[#0B6FB8]" />
                            一位教練・最多 {c.class_size} 人
                          </span>
                        ) : null}
                        <span className="inline-flex items-center gap-1.5">
                          <ShieldCheck className="h-[18px] w-[18px] text-[#0B6FB8]" />
                          {extras?.equipment ?? "單車及頭盔全包"}
                        </span>
                      </div>
                      {extras?.note ? (
                        <p className="flex items-center gap-1.5 text-sm text-[#5B6B78]">
                          <User className="h-[18px] w-[18px]" />
                          {extras.note}
                        </p>
                      ) : null}
                      <div className="flex flex-wrap items-end gap-x-5 gap-y-2 rounded-[14px] bg-[#F5F8FA] px-[18px] py-4">
                        {c.group_price ? (
                          <>
                            <div>
                              <small className="block text-[13px] text-[#5B6B78]">{c.group_min_qty === 2 ? "二人" : `${c.group_min_qty} 人或以上`}同行</small>
                              <div className="text-[30px] leading-tight font-black text-[#0E2433]">
                                {money(c, c.group_price)}
                                <span className="text-[15px] font-medium text-[#5B6B78]"> / 人</span>
                              </div>
                            </div>
                            <div className="pb-1 text-[15px] text-[#5B6B78]">單人 {money(c, c.price)} / 堂</div>
                            <div className="ml-auto pb-1 text-sm font-bold text-[#1E7A4C]">
                              同朋友 / 家人一齊報，每位慳 ${c.price - c.group_price}
                            </div>
                          </>
                        ) : (
                          <div className="text-[30px] leading-tight font-black text-[#0E2433]">
                            {c.is_free ? "免費" : `${money(c, c.price)}`}
                            {!c.is_free ? <span className="text-[15px] font-medium text-[#5B6B78]"> / 堂</span> : null}
                          </div>
                        )}
                      </div>
                      <div className="text-[15px] font-bold text-[#0E2433]">揀班期</div>
                      {list.length ? (
                        <>
                          <div role="radiogroup" aria-label={`${c.name_zh} 班期`} className="grid grid-cols-[repeat(auto-fill,minmax(150px,1fr))] gap-2.5">
                            {shown.map((s) => {
                              const on = sel?.session_id === s.session_id;
                              const full = s.remaining_quota <= 0;
                              return (
                                <button
                                  key={s.session_id}
                                  type="button"
                                  role="radio"
                                  aria-checked={on}
                                  aria-disabled={full}
                                  data-tile-session={s.session_id}
                                  onClick={() => {
                                    if (full) return;
                                    setPicked((p) => ({ ...p, [c.class_id]: s.session_id }));
                                    setLastPickedClass(c.class_id);
                                  }}
                                  className={`flex flex-col gap-1 rounded-[14px] px-3.5 py-3 text-left transition ${
                                    full
                                      ? "cursor-not-allowed bg-[#F1F4F6] text-[#6B7A86] shadow-[inset_0_0_0_1.5px_#E3EAF0]"
                                      : on
                                        ? "bg-[#0B6FB8] text-white shadow-[0_8px_18px_rgba(11,111,184,.25)]"
                                        : "bg-white text-[#0E2433] shadow-[inset_0_0_0_1.5px_#C9D6E0] hover:shadow-[inset_0_0_0_1.5px_#0B6FB8]"
                                  }`}
                                >
                                  <span className="flex w-full items-center justify-between gap-2">
                                    <span className="text-base font-black">{dLabel(s.date)}</span>
                                    {on ? <Check className="h-5 w-5" strokeWidth={2.4} /> : null}
                                  </span>
                                  <span className="text-sm opacity-90">{s.time}{s.end_time ? `–${s.end_time}` : ""}</span>
                                  <span className="text-sm opacity-90">{s.district_zh ?? s.location_zh}</span>
                                  {on ? <span className="text-[13px] font-bold">尚餘 {s.remaining_quota} 位</span> : <SeatLabel n={s.remaining_quota} />}
                                </button>
                              );
                            })}
                          </div>
                          {list.length > 6 && !moreTiles[c.class_id] ? (
                            <button
                              type="button"
                              className="self-start text-[15px] font-bold text-[#0B6FB8]"
                              onClick={() => setMoreTiles((m) => ({ ...m, [c.class_id]: true }))}
                            >
                              顯示更多班期（+{list.length - 6}）
                            </button>
                          ) : null}
                        </>
                      ) : (
                        <p className="text-[15px] text-[#5B6B78]">
                          所選時段 / 地區暫無班期{" "}
                          <button type="button" className="font-bold text-[#0B6FB8]" onClick={resetFilters}>
                            清除篩選
                          </button>
                        </p>
                      )}
                      {sel ? (
                        <button
                          type="button"
                          data-testid={`book-${c.class_id}`}
                          className={`${btnPrimary} min-h-14 px-7 text-lg whitespace-normal`}
                          onClick={() => openApply(c.class_id, sel.session_id)}
                        >
                          報名 {dLabel(sel.date)}
                          {sel.time} {sel.district_zh ?? sel.location_zh}
                          <ArrowRight className="h-5 w-5" />
                        </button>
                      ) : (
                        <a href={WHATSAPP_URL} className={`${btnOutline} min-h-14 px-7 text-lg`}>
                          <MessageCircle className="h-5 w-5" />
                          WhatsApp 查詢最新班期
                        </a>
                      )}
                      <p className="flex flex-wrap gap-x-4 gap-y-1.5 text-[13px] text-[#5B6B78]">
                        <span>✓ 惡劣天氣取消會補堂</span>
                        <span>✓ 上課前兩日前可自行改期</span>
                        <span>✓ 付款後即時 WhatsApp 確認</span>
                      </p>
                    </div>
                  </article>
                );
              })}
          </div>
        </section>

        {/* Lesson plan */}
        <section className="mx-auto max-w-[1200px] px-4 pt-16 sm:px-6" id="lesson" aria-labelledby="lesson-h">
          <div className="mb-5">
            <h2 id="lesson-h" className="mb-1.5 text-[28px] font-black text-[#0E2433]">一堂 60 分鐘學咩？</h2>
            <p className="text-[15px] text-[#5B6B78]">教練按每位學員程度分組，唔會同其他人比較</p>
          </div>
          <LessonPlan classes={classes.map((c) => c.class)} tab={lessonTab} setTab={setLessonTab} />
        </section>

        {/* Policy strip */}
        <section className="mx-auto max-w-[1200px] px-4 pt-14 sm:px-6" aria-label="上課保障">
          <div className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
            {(
              [
                [CloudRain, "天氣安排", "三號風球、紅/黑雨取消並補堂，上課前 2 小時通知 →", 0],
                [RefreshCw, "改期 / 調堂", "上課前兩日 00:00 前，可喺學員連結自行改期 →", 1],
                [ShieldCheck, "裝備全包", "12–24 吋單車按身高分配，頭盔及護具由單車亭提供 →", 2],
                [Users, "小班教學", `一位教練，${sizesLine} →`, 4],
              ] as const
            ).map(([Icon, title, text, faq]) => (
              <a
                key={title}
                href="#faq"
                onClick={() => setOpenFaq((o) => ({ ...o, [faq]: true }))}
                className="flex flex-col gap-2 rounded-[18px] bg-white p-[22px] shadow-[0_1px_0_#E3EAF0] transition hover:shadow-[inset_0_0_0_1.5px_#0B6FB8]"
              >
                <Icon className="h-7 w-7 text-[#0B6FB8]" />
                <b className="text-[17px] font-black text-[#0E2433]">{title}</b>
                <span className="text-sm text-[#5B6B78]">{text}</span>
              </a>
            ))}
          </div>
        </section>

        {/* Sites */}
        <section className="mx-auto max-w-[1200px] px-4 pt-16 sm:px-6" id="sites" aria-labelledby="sites-h">
          <div className="mb-5">
            <h2 id="sites-h" className="mb-1.5 text-[28px] font-black text-[#0E2433]">上課地點及交通</h2>
            <p className="text-[15px] text-[#5B6B78]">
              {data.venues.length} 個單車亭都可以由港鐵站行過去・{data.cycle_weeks === 2 ? "兩星期" : `${data.cycle_weeks} 星期`}一個循環
            </p>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {data.venues.map(({ venue, days }) => {
              const weekdayOnly = days.every((d) => d.weekday < 5);
              const next = open.find((r) => r.venue_id === venue.venue_id);
              const route =
                venue.mtr_latitude !== undefined && venue.mtr_longitude !== undefined
                  ? `https://www.google.com/maps/dir/?api=1&origin=${venue.mtr_latitude},${venue.mtr_longitude}&destination=${venue.latitude},${venue.longitude}&travelmode=walking`
                  : mapsUrl(venue.latitude, venue.longitude);
              return (
                <div key={venue.venue_id} className="flex flex-col gap-3 rounded-[20px] bg-white p-5 shadow-[0_1px_0_#E3EAF0]" data-venue={venue.venue_id}>
                  <div className="flex items-center gap-2">
                    <h3 className="text-xl font-black text-[#0E2433]">{venue.district_zh}</h3>
                    {weekdayOnly ? (
                      <span className="rounded-full bg-[#F5F8FA] px-2.5 py-0.5 text-xs font-bold text-[#5B6B78]">只設平日班</span>
                    ) : null}
                  </div>
                  <div className="text-sm text-[#5B6B78]">
                    {venue.address_zh}
                    {venue.opening_hours ? `・營業 ${venue.opening_hours}` : ""}
                  </div>
                  {venue.mtr_station_zh ? (
                    <div className="flex flex-col gap-2 rounded-[14px] bg-[#F5F8FA] p-3.5">
                      <div className="flex items-center gap-2.5">
                        <TrainFront className="h-[22px] w-[22px] text-[#0B6FB8]" />
                        <div className="flex-1">
                          <b className="block text-[15px] text-[#0E2433]">港鐵{venue.mtr_station_zh}</b>
                          <span className="text-[13px] text-[#5B6B78]">{venue.mtr_line_zh}</span>
                        </div>
                        {venue.walk_minutes ? (
                          <span className="text-[13px] font-bold text-[#1E7A4C]">步行約 {venue.walk_minutes} 分鐘</span>
                        ) : null}
                      </div>
                      {venue.directions_zh ? <p className="text-sm">{venue.directions_zh}</p> : null}
                      <a href={route} target="_blank" rel="noopener noreferrer" className={`${btnPrimary} min-h-11 self-start px-4 text-[15px]`}>
                        <MapPin className="h-4 w-4" />
                        Google Maps 步行路線
                      </a>
                    </div>
                  ) : null}
                  <div className="text-sm">
                    上課日：
                    <b>{days.map((d) => `第 ${d.cycle_week} 週星期${WEEKDAY_ZH[d.weekday]}`).join("、")}</b>
                  </div>
                  {next ? (
                    <div className="text-sm">
                      下一班：{dLabel(next.date)}
                      {next.time} {next.cls.name_zh}
                    </div>
                  ) : null}
                  <button
                    type="button"
                    className={`${btnOutline} min-h-11 self-start px-4 text-[15px]`}
                    onClick={() => {
                      setDistrictFilter(venue.venue_id);
                      setShowAll(false);
                      document.getElementById("sessions")?.scrollIntoView({ behavior: "smooth" });
                    }}
                  >
                    睇呢區班期
                  </button>
                </div>
              );
            })}
          </div>
        </section>

        {/* About */}
        <section className="mt-10 bg-white py-16" aria-labelledby="about-h">
          <div className="mx-auto flex max-w-[1200px] flex-wrap items-center gap-8 px-4 sm:px-6">
            <div className="flex flex-[1_1_380px] flex-col gap-3.5">
              <h2 id="about-h" className="text-[28px] font-black text-[#0E2433]">安全騎行，樂在社區</h2>
              <p className="text-base leading-[1.75]">
                由<b>{OPERATOR_CLAIM}</b> LocoBike 開辦。一位教練帶一小班，先學平衡再學踩，再學單車徑規則同手勢。安全行先：天氣、場地或學員狀況唔適合，教練會調整或取消課堂。
              </p>
              <div className="mt-1.5 flex flex-wrap gap-7">
                <div>
                  <b className="block text-4xl font-black text-[#0B6FB8]">1,000+</b>
                  <span className="text-sm text-[#5B6B78]">學員成功發掘踩車樂趣</span>
                </div>
                <div>
                  <b className="block text-4xl font-black text-[#0B6FB8]">{data.venues.length}</b>
                  <span className="text-sm text-[#5B6B78]">區樂區單車亭</span>
                </div>
                <div>
                  <b className="block text-4xl font-black text-[#0B6FB8]">{data.sessions_per_cycle}</b>
                  <span className="text-sm text-[#5B6B78]">堂・每{data.cycle_weeks === 2 ? "兩" : data.cycle_weeks}星期</span>
                </div>
              </div>
            </div>
            <div className="relative h-[300px] flex-[1_1_380px] overflow-hidden rounded-[22px] bg-[#DCE7EF]">
              <Image src="/images/revamp/about.jpg" alt="學員於郊區單車徑列隊騎行" fill sizes="(min-width: 1024px) 50vw, 100vw" className="object-cover" />
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="mx-auto max-w-[860px] px-4 pt-[72px] pb-10 sm:px-6" id="faq" aria-labelledby="faq-h">
          <h2 id="faq-h" className="text-[28px] font-black text-[#0E2433]">常見問題</h2>
          <div className="mt-3 rounded-[20px] bg-white px-5 py-1 sm:px-7">
            {faqs.map(([q, a], i) => (
              <div key={q} className="border-b border-[#EEF2F5] last:border-b-0">
                <button
                  type="button"
                  aria-expanded={!!openFaq[i]}
                  aria-controls={`fa${i}`}
                  id={`fq${i}`}
                  onClick={() => setOpenFaq((o) => ({ ...o, [i]: !o[i] }))}
                  className="flex min-h-11 w-full items-center justify-between gap-4 py-5 text-left text-[17px] font-bold text-[#0E2433]"
                >
                  <span>{q}</span>
                  <ChevronDown className={`h-5 w-5 flex-none text-[#5B6B78] transition-transform ${openFaq[i] ? "rotate-180" : ""}`} />
                </button>
                <div id={`fa${i}`} role="region" aria-labelledby={`fq${i}`} hidden={!openFaq[i]} className="pb-5 text-[15px] leading-[1.7]">
                  {a}
                </div>
              </div>
            ))}
          </div>
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <b className="text-base text-[#0E2433]">仲有問題？</b>
            <a href={WHATSAPP_URL} className={`${btnOutline} min-h-12 px-5`}>
              <MessageCircle className="h-5 w-5 text-[#1E7A4C]" />
              WhatsApp 我哋
            </a>
            <a href="#course-finder" className={`${btnPrimary} min-h-12 px-5`}>
              立即報名
            </a>
          </div>
        </section>

        {/* Band */}
        <section className="pt-6 pb-[72px]">
          <div className="mx-auto max-w-[1200px] px-4 sm:px-6">
            <div className="flex flex-wrap items-center justify-between gap-6 rounded-[28px] bg-[#0B6FB8] p-8 sm:p-11">
              <div>
                <h2 className="mb-2 text-[30px] font-black text-white">未來兩星期仲有 {twoWeeks.length} 班有位</h2>
                <p className="text-base text-[#DCEBF7]">揀好班期，3 分鐘完成報名</p>
              </div>
              <a href="#sessions" className={`${btn} min-h-14 bg-white px-7 text-lg text-[#08548C] hover:bg-[#EAF3FA]`}>
                睇班期
              </a>
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-[#0E2433] pt-11 pb-[120px] text-[#B9C7D2]">
        <div className="mx-auto flex max-w-[1200px] flex-wrap justify-between gap-6 px-4 text-sm sm:px-6">
          <div>
            <span className="mb-2 block text-[17px] font-black text-white">樂區單車亭 by LocoBike</span>
            {first ? `每人每堂 $${first.price}${first.group_price ? `，${first.group_min_qty === 2 ? "二人" : `${first.group_min_qty} 人`}同行每人 $${first.group_price}` : ""}・` : ""}
            版權所有 © {new Date().getFullYear()} Loco Cycling Safety Centre
          </div>
          <nav aria-label="頁尾連結" className="flex flex-wrap items-center gap-5">
            <a href={FACEBOOK_URL} target="_blank" rel="noopener noreferrer" className="text-white">
              Facebook
            </a>
            <a href={WHATSAPP_URL} className="text-white">
              WhatsApp
            </a>
          </nav>
        </div>
      </footer>

      {/* Mobile sticky bar */}
      <div
        aria-hidden={!barVisible}
        className={`fixed inset-x-0 bottom-0 z-[60] flex items-center gap-3 bg-white px-4 pt-3 pb-[calc(14px+env(safe-area-inset-bottom))] shadow-[0_-8px_24px_rgba(14,36,51,.12)] transition-transform duration-200 md:hidden ${
          barVisible && !apply ? "translate-y-0" : "translate-y-[110%]"
        }`}
      >
        <div className="min-w-0 flex-1">
          <small className="block text-xs text-[#5B6B78]">
            {barPick ? `${lastPickedClass ? "已揀" : "最近一班"}・${barPick.cls.name_zh}（${ages(barPick.cls)}）` : "暫無符合班期"}
          </small>
          <b className="block truncate text-[15px] text-[#0E2433]">
            {barPick ? `${dLabel(barPick.date)}${barPick.time} ${barPick.district_zh ?? barPick.location_zh}` : "WhatsApp 查詢最新班期"}
          </b>
        </div>
        {barPick ? (
          <button type="button" className={`${btnPrimary} min-h-12 px-5`} onClick={() => openApply(barPick.cls.class_id, barPick.session_id)}>
            報名 ›
          </button>
        ) : (
          <a href={WHATSAPP_URL} className={`${btnPrimary} min-h-12 px-5`}>
            查詢
          </a>
        )}
      </div>

      {/* Apply sheet */}
      {apply && applyClass ? (
        <>
          <div className="fixed inset-0 z-[90] bg-[rgba(14,36,51,.5)]" onClick={closeApply} aria-hidden />
          <aside
            role="dialog"
            aria-modal="true"
            aria-labelledby="sheet-title"
            className="fixed top-0 right-0 z-[100] flex h-full w-full max-w-[460px] flex-col bg-[#F5F8FA] shadow-[-20px_0_60px_rgba(14,36,51,.25)]"
          >
            <div className="flex h-[60px] flex-none items-center gap-2 bg-white px-2 shadow-[0_1px_0_#E3EAF0]">
              <button
                type="button"
                aria-label="關閉報名"
                onClick={closeApply}
                className="inline-flex h-11 w-11 items-center justify-center rounded-full text-[#0E2433] hover:bg-[#F5F8FA]"
              >
                <ChevronLeft className="h-[22px] w-[22px]" />
              </button>
              <b id="sheet-title" className="text-[17px] text-[#0E2433]">報名</b>
              <span className="ml-auto pr-3 text-[13px] text-[#5B6B78]">約 3 分鐘完成</span>
            </div>
            <div className="flex-1 overflow-y-auto px-4 pt-4">
              <ApplyForm
                key={`${apply.classId}-${apply.sessionId}`}
                data={{ class: applyClass.class, sessions: applyClass.sessions, terms: data.terms }}
                lang="zh-TW"
                initialSessionId={apply.sessionId}
                onChangeSession={() => {
                  closeApply();
                  router.push(`#course-${apply.classId}`);
                }}
              />
            </div>
          </aside>
        </>
      ) : null}
    </div>
  );
}

function FilterRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-center gap-2.5" role="group" aria-label={label}>
      <span className="mr-1 text-sm font-bold text-[#0E2433]">{label}</span>
      {children}
    </div>
  );
}

function Chip({ pressed, onClick, children }: { pressed: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      onClick={onClick}
      className={`inline-flex min-h-11 items-center rounded-full px-[18px] text-[15px] font-medium ${
        pressed ? "bg-[#0E2433] text-white" : "bg-white text-[#33495A] shadow-[inset_0_0_0_1.5px_#DCE5EC] hover:shadow-[inset_0_0_0_1.5px_#0B6FB8]"
      }`}
    >
      {children}
    </button>
  );
}

function LessonPlan({
  classes,
  tab,
  setTab,
}: {
  classes: ApplyClass[];
  tab: string;
  setTab: (id: string) => void;
}) {
  const withPlans = classes.filter((c) => CLASS_EXTRAS[c.class_id]?.plan);
  const current = CLASS_EXTRAS[tab]?.plan ?? CLASS_EXTRAS[withPlans[0]?.class_id]?.plan;
  if (!current) return null;

  return (
    <div className="flex flex-wrap gap-6">
      <div className="min-w-0 flex-[2_1_480px] rounded-[20px] bg-white p-5 shadow-[0_1px_0_#E3EAF0] sm:p-7">
        <div role="tablist" aria-label="班別教案" className="mb-4 flex gap-2">
          {withPlans.map((c) => (
            <button
              key={c.class_id}
              type="button"
              role="tab"
              aria-selected={tab === c.class_id}
              onClick={() => setTab(c.class_id)}
              className={`min-h-11 rounded-full px-4 text-[15px] font-bold ${
                tab === c.class_id ? "bg-[#0E2433] text-white" : "bg-[#F5F8FA] text-[#33495A]"
              }`}
            >
              {c.name_zh} {c.age_min}–{c.age_max} 歲
            </button>
          ))}
        </div>
        <p className="mb-4 text-[15px]">{current.lead}</p>
        <ol className="flex flex-col gap-3">
          {current.steps.map(([minutes, title, detail]) => (
            <li key={title} className="flex gap-4">
              <span className="w-[72px] flex-none text-sm font-bold text-[#0B6FB8]">{minutes} 分</span>
              <div>
                <b className="block text-[15px] text-[#0E2433]">{title}</b>
                <span className="text-sm text-[#5B6B78]">{detail}</span>
              </div>
            </li>
          ))}
        </ol>
      </div>
      <div className="flex flex-[1_1_300px] flex-col gap-4">
        <div className="rounded-[20px] bg-white p-5 shadow-[0_1px_0_#E3EAF0]">
          <h3 className="mb-3 text-lg font-black text-[#0E2433]">四級進度</h3>
          <ol className="flex flex-col gap-2.5">
            {current.levels.map((level, i) => (
              <li key={level} className="flex gap-3 text-sm">
                <i className="inline-flex h-6 w-6 flex-none items-center justify-center rounded-full bg-[#E6F2FB] text-xs font-black text-[#08548C] not-italic">
                  {i + 1}
                </i>
                <span>{level}</span>
              </li>
            ))}
          </ol>
        </div>
        <div className="flex gap-3 rounded-[20px] bg-[#E9F5EE] p-5 text-sm text-[#0E2433]">
          <MessageCircle className="h-5 w-5 flex-none text-[#1E7A4C]" />
          <div>{current.feedback}</div>
        </div>
      </div>
    </div>
  );
}
