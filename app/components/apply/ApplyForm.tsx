"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import { applyCopy, formatSessionDate, type ApplyLang } from "@/app/i18n/applyTranslations";
import {
  RIDING_EXPERIENCE,
  unitPriceFor,
  validateCheckout,
  type CheckoutError,
  type ParticipantInput,
  type RidingExperience,
} from "@/lib/checkoutRules";

export type ApplyClass = {
  class_id: string;
  name_zh: string;
  name_en?: string;
  description_zh?: string;
  description_en?: string;
  duration_minutes?: number;
  image_url?: string;
  price: number;
  group_price?: number;
  group_min_qty: number;
  currency: string;
  is_free: boolean;
  age_min?: number;
  age_max?: number;
  class_size?: number;
};

export type ApplySession = {
  session_id: string;
  date: string;
  time: string;
  end_time?: string;
  location_zh: string;
  location_en?: string;
  google_maps_url?: string;
  district_zh?: string;
  district_en?: string;
  remaining_quota: number;
};

export type ApplyData = {
  class: ApplyClass;
  sessions: ApplySession[];
  terms: { version: string; content: string } | null;
};

type PersonDraft = {
  name: string;
  age: string;
  height: string;
  riding_experience: RidingExperience;
  mobileSameAsCustomer: boolean;
  mobile: string;
  emergencySameAsFirst: boolean;
  emergency_contact_name: string;
  emergency_contact_phone: string;
  health_notes: string;
  photo_consent: boolean;
};

const emptyPerson = (): PersonDraft => ({
  name: "",
  age: "",
  height: "",
  riding_experience: "never",
  mobileSameAsCustomer: true,
  mobile: "+852 ",
  emergencySameAsFirst: true,
  emergency_contact_name: "",
  emergency_contact_phone: "+852 ",
  health_notes: "",
  photo_consent: false,
});

type HoldInfo = {
  hold_id: string;
  intent_id: string;
  client_secret?: string;
  expires_at: number;
};

type ApplyFormProps = {
  data: ApplyData;
  lang: ApplyLang;
  initialSessionId?: string;
  /** In the homepage sheet, "Change" goes back to the timetable instead of showing a picker. */
  onChangeSession?: () => void;
};

const inputClass =
  "w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-base text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-[#0B6FB8]";

export function ApplyForm({ data, lang, initialSessionId, onChangeSession }: ApplyFormProps) {
  const copy = applyCopy[lang];
  const router = useRouter();
  const cls = data.class;
  const isMinorsClass = cls.age_max !== undefined && cls.age_max < 18;
  const className = lang === "en" ? (cls.name_en ?? cls.name_zh) : cls.name_zh;

  const bookable = data.sessions.filter((s) => s.remaining_quota > 0);
  const [sessionId, setSessionId] = useState<string | undefined>(
    bookable.find((s) => s.session_id === initialSessionId)?.session_id
  );
  const [pickingSession, setPickingSession] = useState(!sessionId);
  const session = data.sessions.find((s) => s.session_id === sessionId);
  const maxQty = Math.max(1, session?.remaining_quota ?? 1);

  const [people, setPeople] = useState<PersonDraft[]>([emptyPerson()]);
  const [customerMobile, setCustomerMobile] = useState("+852 ");
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<"card" | "alipay">("card");
  const [errors, setErrors] = useState<CheckoutError[]>([]);
  const [formError, setFormError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [hold, setHold] = useState<HoldInfo | null>(null);
  const [holdExpired, setHoldExpired] = useState(false);
  const [alipayQr, setAlipayQr] = useState<{ qrcode: string; startedAt: number } | null>(null);
  const [qrExpired, setQrExpired] = useState(false);
  const [cardReady, setCardReady] = useState(false);
  // While a card field has focus, extra room below the form lets it scroll above the keyboard.
  const [cardFocused, setCardFocused] = useState(false);
  const cardRef = useRef<{ confirm: (args: { intent_id: string; client_secret: string }) => Promise<unknown> } | null>(null);
  const sdkInitRef = useRef(false);
  const qrCanvasRef = useRef<HTMLCanvasElement | null>(null);
  // One request per set of details: if the Customer edits anything, the old hold is let go.
  const requestRef = useRef<{ key: string; id: string } | null>(null);

  const quantity = people.length;
  const unitPrice = unitPriceFor(
    {
      airwallex_price: cls.price,
      airwallex_group_price: cls.group_price,
      airwallex_group_min_qty: cls.group_min_qty,
      is_free: cls.is_free,
    },
    quantity
  );
  const money = (n: number) => `${cls.currency} ${n.toLocaleString("en-US")}`;
  const groupApplies = !!cls.group_price && quantity >= cls.group_min_qty;

  // Keep the number of people within what the chosen Session still has room for.
  useEffect(() => {
    if (people.length > maxQty) setPeople((p) => p.slice(0, maxQty));
  }, [maxQty, people.length]);

  useEffect(() => {
    if (cls.is_free || sdkInitRef.current) return;
    sdkInitRef.current = true;
    (async () => {
      try {
        const { init, createElement } = await import("@airwallex/components-sdk");
        await init({
          env: (process.env.NEXT_PUBLIC_AIRWALLEX_ENV as "demo" | "prod") ?? "demo",
          enabledElements: ["payments"],
        });
        // Three separate fields (number, expiry, CVC), each with room for 16px text: 16px
        // stops iPhone Safari zooming in on tap, and a single combined field was too
        // cramped on a phone to type into.
        const style = { base: { fontSize: "16px", color: "#0E2433" } };
        const [cardNumber, expiry, cvc] = await Promise.all([
          createElement("cardNumber", { style, placeholder: "卡號 Card number" }),
          createElement("expiry", { style, placeholder: "MM / YY" }),
          createElement("cvc", { style, placeholder: "CVC" }),
        ]);
        // Confirming on the card number field collects the expiry and CVC fields too.
        cardRef.current = cardNumber as unknown as typeof cardRef.current;
        cardNumber.mount("apply-card-number");
        expiry.mount("apply-card-expiry");
        cvc.mount("apply-card-cvc");

        const ready = new Set<string>();
        const fields = { cardNumber, expiry, cvc } as const;
        for (const [name, field] of Object.entries(fields)) {
          field.on("ready", () => {
            ready.add(name);
            if (ready.size === 3) setCardReady(true);
          });
          // The fields live in Airwallex's iframes, which iPhone Safari doesn't scroll into
          // view properly when the keyboard opens; bring the card section to the top.
          field.on("blur", () => setCardFocused(false));
          field.on("focus", () => {
            setCardFocused(true);
            const reveal = () =>
              document.getElementById("apply-card-section")?.scrollIntoView({ block: "start", behavior: "smooth" });
            reveal();
            const viewport = window.visualViewport;
            if (viewport) {
              const onResize = () => {
                viewport.removeEventListener("resize", onResize);
                reveal();
              };
              viewport.addEventListener("resize", onResize);
              setTimeout(() => viewport.removeEventListener("resize", onResize), 1000);
            }
            setTimeout(reveal, 400);
          });
        }
      } catch (err) {
        console.error("[apply] Airwallex init failed:", err);
      }
    })();
  }, [cls.is_free]);

  useEffect(() => {
    if (!hold) return;
    const ms = hold.expires_at - Date.now();
    if (ms <= 0) {
      setHoldExpired(true);
      return;
    }
    setHoldExpired(false);
    const timer = setTimeout(() => setHoldExpired(true), ms);
    return () => clearTimeout(timer);
  }, [hold]);

  // Each new Alipay HK QR is valid for 10 minutes.
  useEffect(() => {
    if (!alipayQr) return;
    setQrExpired(false);
    const timer = setTimeout(() => setQrExpired(true), 600_000 - (Date.now() - alipayQr.startedAt));
    return () => clearTimeout(timer);
  }, [alipayQr]);

  // Draw the QR once its canvas is on screen.
  useEffect(() => {
    const canvas = qrCanvasRef.current;
    if (!alipayQr?.qrcode || qrExpired || !canvas) return;
    import("qrcode").then((QRCode) => QRCode.toCanvas(canvas, alipayQr.qrcode, { width: 220 }));
  }, [alipayQr, qrExpired]);

  useEffect(() => {
    if (!alipayQr || qrExpired || !hold) return;
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/payment/alipay-hk/status?intent_id=${encodeURIComponent(hold.intent_id)}`);
        const { succeeded } = (await res.json()) as { succeeded?: boolean };
        if (succeeded) {
          clearInterval(interval);
          await finishPaid(hold);
        }
      } catch {
        // keep polling
      }
    }, 3000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [alipayQr, qrExpired, hold]);

  const toInputs = (): ParticipantInput[] =>
    people.map((p, i) => {
      const emergencySource = i > 0 && p.emergencySameAsFirst ? people[0] : p;
      return {
        name: p.name,
        age: Number(p.age),
        height: Number(p.height),
        riding_experience: p.riding_experience,
        mobile: isMinorsClass || p.mobileSameAsCustomer ? customerMobile : p.mobile,
        emergency_contact_name: emergencySource.emergency_contact_name,
        emergency_contact_phone: emergencySource.emergency_contact_phone,
        health_notes: p.health_notes.trim() || undefined,
        photo_consent: p.photo_consent,
      };
    });

  const errorFor = (index: number | undefined, ...codes: string[]) => {
    const err = errors.find((e) => e.index === index && codes.includes(e.code));
    if (!err) return null;
    return err.code === "age_range" ? copy.ageRangeError(cls.age_min, cls.age_max) : copy.fieldErrors[err.code];
  };

  const updatePerson = (i: number, patch: Partial<PersonDraft>) =>
    setPeople((list) => list.map((p, j) => (j === i ? { ...p, ...patch } : p)));

  const releaseHold = (current: HoldInfo | null) => {
    if (!current) return;
    void fetch("/api/checkout/release", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ hold_id: current.hold_id }),
    });
  };

  const goToDone = (holdId: string) =>
    router.push(`/apply/${encodeURIComponent(cls.class_id)}/done?hold=${encodeURIComponent(holdId)}&lang=${lang}`);

  async function finishPaid(current: HoldInfo) {
    const res = await fetch("/api/checkout/complete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ hold_id: current.hold_id, intent_id: current.intent_id }),
    });
    if (!res.ok) {
      setFormError(copy.errorPaidNotRecorded);
      return;
    }
    const result = (await res.json()) as { outcome: string };
    if (result.outcome === "seated") {
      goToDone(current.hold_id);
    } else if (result.outcome === "refunded") {
      setFormError(copy.errorRefunded);
    } else {
      setFormError(copy.errorPaymentFailed);
    }
  }

  /** Holds the seats (or reuses the hold for unchanged details) and returns it. */
  async function startCheckout(): Promise<HoldInfo | "done" | null> {
    const participants = toInputs();
    const payload = {
      class_id: cls.class_id,
      session_id: sessionId,
      customer_mobile: customerMobile,
      participants,
      terms_accepted: termsAccepted,
    };
    const key = JSON.stringify(payload);
    if (!requestRef.current || requestRef.current.key !== key) {
      if (requestRef.current) releaseHold(hold);
      requestRef.current = { key, id: crypto.randomUUID() };
      setHold(null);
    }

    const res = await fetch("/api/checkout/start", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...payload, request_id: requestRef.current.id }),
    });
    const body = await res.json();
    if (body.kind === "error") {
      requestRef.current = null;
      if (body.code === "full" || body.code === "session" || body.code === "expired") {
        setFormError(body.message);
      } else if (body.code in copy.fieldErrors) {
        setErrors([{ index: body.index, code: body.code, message: body.message }]);
        setFormError(copy.errorFix);
      } else {
        setFormError(body.message ?? copy.errorGeneric);
      }
      return null;
    }
    if (!res.ok) {
      setFormError(copy.errorGeneric);
      return null;
    }
    if (body.kind === "completed") {
      goToDone(body.hold_id);
      return "done";
    }
    const info: HoldInfo = {
      hold_id: body.hold_id,
      intent_id: body.intent_id,
      client_secret: body.client_secret,
      expires_at: body.expires_at,
    };
    setHold(info);
    return info;
  }

  async function handleSubmit() {
    setFormError(null);
    if (!sessionId) {
      setPickingSession(true);
      return;
    }
    const found = validateCheckout(customerMobile, toInputs(), cls);
    setErrors(found);
    if (found.length > 0 || !termsAccepted) {
      setFormError(found.length > 0 ? copy.errorFix : copy.errorTerms);
      return;
    }
    if (!cls.is_free && paymentMethod === "card" && (!cardRef.current || !cardReady)) {
      setFormError(copy.errorCardNotReady);
      return;
    }

    setBusy(true);
    try {
      const current = await startCheckout();
      if (!current || current === "done") return;

      if (paymentMethod === "card") {
        try {
          await cardRef.current!.confirm({ intent_id: current.intent_id, client_secret: current.client_secret! });
        } catch (err) {
          console.error("[apply] card confirm failed:", err);
          setFormError(copy.errorPaymentFailed);
          return;
        }
        await finishPaid(current);
      } else {
        const isMobile = /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);
        const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);
        const returnUrl = `${window.location.origin}/apply/${encodeURIComponent(cls.class_id)}/alipay-return?intent_id=${encodeURIComponent(current.intent_id)}&hold_id=${encodeURIComponent(current.hold_id)}&lang=${lang}`;
        const res = await fetch("/api/payment/alipay-hk/start", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            intent_id: current.intent_id,
            is_mobile: isMobile,
            os_type: isMobile ? (isIOS ? "ios" : "android") : undefined,
            return_url: returnUrl,
          }),
        });
        if (!res.ok) throw new Error("alipay start failed");
        const start = (await res.json()) as { type: string; qrcode?: string; url?: string };
        if (start.type === "redirect" && start.url) {
          window.location.href = start.url;
        } else if (start.type === "qrcode" && start.qrcode) {
          setAlipayQr({ qrcode: start.qrcode, startedAt: Date.now() });
        } else {
          throw new Error("no alipay next action");
        }
      }
    } catch (err) {
      console.error("[apply] checkout failed:", err);
      setFormError(copy.errorGeneric);
    } finally {
      setBusy(false);
    }
  }

  const sessionLabel = (s: ApplySession) =>
    `${formatSessionDate(s.date, lang)} ${s.time}${s.end_time ? `–${s.end_time}` : ""}`;
  const location = (s: ApplySession) => (lang === "en" ? (s.location_en ?? s.location_zh) : s.location_zh);


  return (
    <div
      className="space-y-4"
      data-testid="apply-form"
      style={cardFocused ? { paddingBottom: "70vh" } : undefined}
    >
      <ol className="flex gap-2 text-xs font-medium text-zinc-500" aria-label={copy.pageTitle}>
        <li className={session ? "text-[#0B6FB8]" : "text-zinc-900"}>1 {copy.stepSession}{session ? " ✓" : ""}</li>
        <li aria-hidden>›</li>
        <li className={session ? "text-zinc-900" : ""}>2 {copy.stepDetails}</li>
        <li aria-hidden>›</li>
        <li>3 {cls.is_free ? copy.register : copy.stepPay}</li>
      </ol>

      {/* Session */}
      <section className="rounded-xl border border-zinc-200 bg-white p-4">
        <div className="flex items-start gap-3">
          {cls.image_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={cls.image_url} alt="" className="h-16 w-16 flex-none rounded-lg object-cover" />
          ) : null}
          <div className="min-w-0 flex-1 text-sm">
            <p className="font-semibold text-zinc-900">
              {className}
              {cls.age_min !== undefined ? `（${copy.ages(cls.age_min, cls.age_max)}）` : ""}
              {cls.duration_minutes ? `・${copy.hour(cls.duration_minutes)}` : ""}
            </p>
            {session && !pickingSession ? (
              <>
                <p className="text-zinc-800" data-testid="selected-session">{sessionLabel(session)}</p>
                <p className="text-zinc-600">
                  {location(session)}
                  {session.google_maps_url ? (
                    <>
                      {"・"}
                      <a href={session.google_maps_url} target="_blank" rel="noopener noreferrer" className="underline">
                        {copy.map}
                      </a>
                    </>
                  ) : null}
                </p>
                <p className={session.remaining_quota <= 2 ? "text-amber-700" : "text-zinc-500"}>
                  {copy.seatsLeft(session.remaining_quota)}
                </p>
              </>
            ) : null}
          </div>
          {session && !pickingSession ? (
            <button
              type="button"
              className="text-sm font-medium text-[#0B6FB8] underline"
              onClick={() => (onChangeSession ? onChangeSession() : setPickingSession(true))}
            >
              {copy.change}
            </button>
          ) : null}
        </div>

        {pickingSession ? (
          <div className="mt-3">
            <p className="mb-2 text-sm font-medium text-zinc-800">{copy.chooseSession}</p>
            {data.sessions.length === 0 ? (
              <p className="text-sm text-zinc-600">{copy.noSessions}</p>
            ) : (
              <div role="radiogroup" aria-label={copy.chooseSession} className="grid max-h-80 gap-2 overflow-y-auto sm:grid-cols-2">
                {data.sessions.map((s) => {
                  const full = s.remaining_quota <= 0;
                  return (
                    <button
                      key={s.session_id}
                      type="button"
                      role="radio"
                      aria-checked={s.session_id === sessionId}
                      aria-disabled={full}
                      disabled={full}
                      data-session-id={s.session_id}
                      onClick={() => {
                        setSessionId(s.session_id);
                        setPickingSession(false);
                      }}
                      className={`rounded-lg border p-3 text-left text-sm ${
                        s.session_id === sessionId ? "border-[#0B6FB8] bg-emerald-50" : "border-zinc-200 bg-white"
                      } ${full ? "cursor-not-allowed opacity-50" : "hover:border-[#0B6FB8]"}`}
                    >
                      <span className="block font-medium text-zinc-900">{sessionLabel(s)}</span>
                      <span className="block text-zinc-600">{location(s)}</span>
                      <span className={`block ${full ? "text-zinc-500" : s.remaining_quota <= 2 ? "text-amber-700" : "text-zinc-500"}`}>
                        {full ? copy.full : copy.seatsLeft(s.remaining_quota)}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        ) : null}
      </section>

      {session && !pickingSession ? (
        <>
          {/* Quantity */}
          <section className="rounded-xl border border-zinc-200 bg-white p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-semibold text-zinc-900">{copy.people}</h3>
                {!cls.is_free && cls.group_price ? (
                  <p className="text-xs text-zinc-500">
                    {groupApplies
                      ? copy.groupApplied(money(cls.group_price))
                      : copy.groupHint(money(cls.price), cls.group_min_qty, money(cls.group_price))}
                  </p>
                ) : null}
              </div>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  aria-label="−"
                  disabled={quantity <= 1}
                  onClick={() => setPeople((p) => p.slice(0, -1))}
                  className="h-9 w-9 rounded-lg border border-zinc-300 text-lg disabled:opacity-40"
                >
                  −
                </button>
                <output aria-live="polite" data-testid="quantity" className="w-6 text-center font-semibold">
                  {quantity}
                </output>
                <button
                  type="button"
                  aria-label="+"
                  disabled={quantity >= maxQty}
                  onClick={() => setPeople((p) => [...p, emptyPerson()])}
                  className="h-9 w-9 rounded-lg border border-zinc-300 text-lg disabled:opacity-40"
                >
                  +
                </button>
              </div>
            </div>
            {!cls.is_free && cls.group_price ? (
              <p className={`mt-2 text-xs ${groupApplies ? "text-emerald-700" : "text-zinc-500"}`}>
                {groupApplies
                  ? copy.groupSaved(money((cls.price - cls.group_price) * quantity))
                  : copy.groupNudge(cls.group_min_qty, money(cls.price - cls.group_price))}
              </p>
            ) : null}
          </section>

          {/* Customer */}
          <section className="rounded-xl border border-zinc-200 bg-white p-4">
            <h3 className="mb-2 text-sm font-semibold text-zinc-900">{copy.customerTitle}</h3>
            <Field label={copy.customerMobile} hint={copy.customerMobileHint} error={errorFor(undefined, "customer_mobile")}>
              <input
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                name="customer_mobile"
                value={customerMobile}
                onChange={(e) => setCustomerMobile(e.target.value)}
                className={inputClass}
              />
            </Field>
          </section>

          {/* Participants */}
          {people.map((p, i) => (
            <section key={i} className="space-y-3 rounded-xl border border-zinc-200 bg-white p-4" data-participant={i}>
              <h3 className="text-sm font-semibold text-zinc-900">{copy.participantTitle(i + 1)}</h3>
              <Field label={copy.name} error={errorFor(i, "name")}>
                <input
                  name={`p${i}_name`}
                  value={p.name}
                  placeholder={copy.namePlaceholder}
                  autoComplete={i === 0 ? "name" : "off"}
                  onChange={(e) => updatePerson(i, { name: e.target.value })}
                  className={inputClass}
                />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label={copy.age} error={errorFor(i, "age", "age_range")}>
                  <input
                    name={`p${i}_age`}
                    inputMode="numeric"
                    maxLength={3}
                    value={p.age}
                    placeholder={cls.age_min !== undefined ? `${cls.age_min}–${cls.age_max ?? ""}` : ""}
                    onChange={(e) => updatePerson(i, { age: e.target.value.replace(/\D/g, "") })}
                    className={inputClass}
                  />
                </Field>
                <Field label={copy.height} error={errorFor(i, "height")}>
                  <input
                    name={`p${i}_height`}
                    inputMode="numeric"
                    maxLength={3}
                    value={p.height}
                    placeholder={copy.heightPlaceholder}
                    onChange={(e) => updatePerson(i, { height: e.target.value.replace(/\D/g, "") })}
                    className={inputClass}
                  />
                </Field>
              </div>
              <fieldset>
                <legend className="text-sm font-medium text-zinc-700">
                  {copy.experience} <span className="font-normal text-zinc-500">{copy.experienceHint}</span>
                </legend>
                <div className="mt-1 flex flex-wrap gap-2">
                  {RIDING_EXPERIENCE.map((value) => (
                    <label key={value} className="flex items-center gap-1.5 rounded-lg border border-zinc-200 px-3 py-1.5 text-sm">
                      <input
                        type="radio"
                        name={`p${i}_experience`}
                        value={value}
                        checked={p.riding_experience === value}
                        onChange={() => updatePerson(i, { riding_experience: value })}
                      />
                      {copy.experienceOptions[value]}
                    </label>
                  ))}
                </div>
              </fieldset>

              {!isMinorsClass ? (
                <div className="space-y-1">
                  <p className="text-sm font-medium text-zinc-700">{copy.participantMobile}</p>
                  <label className="flex items-center gap-2 text-sm text-zinc-700">
                    <input
                      type="checkbox"
                      name={`p${i}_mobile_same`}
                      checked={p.mobileSameAsCustomer}
                      onChange={(e) => updatePerson(i, { mobileSameAsCustomer: e.target.checked })}
                    />
                    {copy.sameAsCustomer}
                  </label>
                  {!p.mobileSameAsCustomer ? (
                    <input
                      type="tel"
                      inputMode="tel"
                      name={`p${i}_mobile`}
                      aria-label={copy.participantMobile}
                      value={p.mobile}
                      onChange={(e) => updatePerson(i, { mobile: e.target.value })}
                      className={inputClass}
                    />
                  ) : null}
                  {errorFor(i, "mobile") ? <p className="text-sm text-red-600">{errorFor(i, "mobile")}</p> : null}
                </div>
              ) : null}

              <div className="rounded-lg bg-zinc-50 p-3">
                <p className="text-sm font-medium text-zinc-800">
                  {isMinorsClass ? copy.guardianTitle : copy.emergencyTitle}
                </p>
                {i > 0 ? (
                  <label className="mt-1 flex items-center gap-2 text-sm text-zinc-700">
                    <input
                      type="checkbox"
                      name={`p${i}_emergency_same`}
                      checked={p.emergencySameAsFirst}
                      onChange={(e) => updatePerson(i, { emergencySameAsFirst: e.target.checked })}
                    />
                    {copy.sameAsFirst}
                  </label>
                ) : null}
                {i === 0 || !p.emergencySameAsFirst ? (
                  <div className="mt-2 grid gap-3 sm:grid-cols-2">
                    <Field label={copy.emergencyName} error={errorFor(i, "emergency_contact_name")}>
                      <input
                        name={`p${i}_emergency_name`}
                        value={p.emergency_contact_name}
                        onChange={(e) => updatePerson(i, { emergency_contact_name: e.target.value })}
                        className={inputClass}
                      />
                    </Field>
                    <Field label={copy.emergencyPhone} error={errorFor(i, "emergency_contact_phone", "emergency_contact_self")}>
                      <input
                        type="tel"
                        inputMode="tel"
                        name={`p${i}_emergency_phone`}
                        value={p.emergency_contact_phone}
                        onChange={(e) => updatePerson(i, { emergency_contact_phone: e.target.value })}
                        className={inputClass}
                      />
                    </Field>
                  </div>
                ) : errorFor(i, "emergency_contact_self") ? (
                  <p className="mt-1 text-sm text-red-600">{errorFor(i, "emergency_contact_self")}</p>
                ) : null}
                {isMinorsClass && i === 0 ? <p className="mt-2 text-xs text-zinc-600">{copy.guardianNote}</p> : null}
              </div>

              <Field label={copy.health} hint={copy.healthHint} error={errorFor(i, "health_notes")}>
                <textarea
                  name={`p${i}_health`}
                  rows={2}
                  value={p.health_notes}
                  onChange={(e) => updatePerson(i, { health_notes: e.target.value })}
                  className={inputClass}
                />
              </Field>
              <label className="flex items-start gap-2 text-sm text-zinc-700">
                <input
                  type="checkbox"
                  name={`p${i}_photo`}
                  checked={p.photo_consent}
                  onChange={(e) => updatePerson(i, { photo_consent: e.target.checked })}
                  className="mt-1"
                />
                {copy.photo}
              </label>
            </section>
          ))}

          {/* Terms */}
          <section className="space-y-2 rounded-xl border border-zinc-200 bg-white p-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-zinc-900">
                {copy.termsTitle}
                {data.terms ? <span className="ml-1 font-normal text-zinc-500">({data.terms.version})</span> : null}
              </h3>
              {data.terms ? (
                <button type="button" className="text-sm text-[#0B6FB8] underline" onClick={() => setShowTerms((s) => !s)}>
                  {showTerms ? copy.hideTerms : copy.readTerms}
                </button>
              ) : null}
            </div>
            {showTerms && data.terms ? (
              <p className="max-h-60 overflow-y-auto whitespace-pre-line rounded-lg bg-zinc-50 p-3 text-sm leading-6 text-zinc-700">
                {data.terms.content}
              </p>
            ) : null}
            <label className="flex items-start gap-2 text-sm text-zinc-800">
              <input
                type="checkbox"
                name="terms_accepted"
                checked={termsAccepted}
                onChange={(e) => setTermsAccepted(e.target.checked)}
                className="mt-1"
              />
              {copy.termsAgree(isMinorsClass)}
            </label>
          </section>

          {/* Payment */}
          {!cls.is_free ? (
            <section className="space-y-3 rounded-xl border border-zinc-200 bg-white p-4">
              <h3 className="text-sm font-semibold text-zinc-900">{copy.payment}</h3>
              <div className="flex overflow-hidden rounded-lg border border-zinc-300 text-sm font-medium" role="radiogroup">
                {(["card", "alipay"] as const).map((m) => (
                  <button
                    key={m}
                    type="button"
                    role="radio"
                    aria-checked={paymentMethod === m}
                    data-testid={m === "alipay" ? "alipay-tab" : "card-tab"}
                    onClick={() => setPaymentMethod(m)}
                    className={`flex-1 px-4 py-2 ${paymentMethod === m ? "bg-zinc-900 text-white" : "bg-white text-zinc-600"}`}
                  >
                    {m === "card" ? copy.card : copy.alipay}
                  </button>
                ))}
              </div>
              <div id="apply-card-section" className={paymentMethod === "card" ? "scroll-mt-4 space-y-1" : "hidden"}>
                <p className="text-sm text-zinc-700">{copy.cardLabel}</p>
                <div id="apply-card-container" className="space-y-2">
                  <div id="apply-card-number" className="min-h-[48px] rounded-lg border border-zinc-300 bg-white px-3 py-3" />
                  <div className="grid grid-cols-2 gap-2">
                    <div id="apply-card-expiry" className="min-h-[48px] rounded-lg border border-zinc-300 bg-white px-3 py-3" />
                    <div id="apply-card-cvc" className="min-h-[48px] rounded-lg border border-zinc-300 bg-white px-3 py-3" />
                  </div>
                </div>
              </div>
              {paymentMethod === "alipay" && alipayQr ? (
                <div className="flex flex-col items-center gap-2">
                  {qrExpired ? (
                    <>
                      <p className="text-sm text-red-600">{copy.qrExpired}</p>
                      <button type="button" className="text-sm underline" onClick={() => void handleSubmit()}>
                        {copy.regenerate}
                      </button>
                    </>
                  ) : (
                    <>
                      <p className="text-sm text-zinc-700">{copy.qrTitle}</p>
                      <canvas ref={qrCanvasRef} className="rounded-lg" />
                    </>
                  )}
                </div>
              ) : null}
            </section>
          ) : null}

          <ul className="space-y-1 text-xs text-zinc-600">
            {copy.perks.map((perk) => (
              <li key={perk}>✓ {perk}</li>
            ))}
          </ul>

          {hold && !cls.is_free ? (
            <p className={`rounded-lg px-3 py-2 text-sm ${holdExpired ? "bg-amber-50 text-amber-800" : "bg-emerald-50 text-emerald-800"}`}>
              {holdExpired ? copy.holdExpired : copy.holdNotice(15)}
            </p>
          ) : null}
          {formError ? (
            <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
              {formError}
            </p>
          ) : null}

          <div className="sticky bottom-0 -mx-4 flex items-center gap-3 border-t border-zinc-200 bg-white px-4 py-3">
            <div className="flex-1">
              <p className="text-xs text-zinc-500">{cls.is_free ? copy.free : copy.total(quantity, money(unitPrice))}</p>
              <p className="text-lg font-bold text-zinc-900" data-testid="total">
                {cls.is_free ? copy.free : money(unitPrice * quantity)}
              </p>
            </div>
            <button
              type="button"
              onClick={() => void handleSubmit()}
              disabled={busy}
              className="rounded-full bg-[#0B6FB8] px-6 py-3 hover:bg-[#08548C] text-base font-semibold text-white disabled:cursor-not-allowed disabled:bg-zinc-400"
            >
              {busy ? copy.processing : cls.is_free ? copy.register : copy.pay}
            </button>
          </div>
        </>
      ) : null}
    </div>
  );
}

function Field({
  label,
  hint,
  error,
  children,
}: {
  label: string;
  hint?: string;
  error?: string | null;
  children: React.ReactNode;
}) {
  return (
    <label className="block space-y-1">
      <span className="block text-sm font-medium text-zinc-700">
        {label}
        {hint ? <span className="block text-xs font-normal text-zinc-500">{hint}</span> : null}
      </span>
      {children}
      {error ? <span className="block text-sm text-red-600">{error}</span> : null}
    </label>
  );
}
