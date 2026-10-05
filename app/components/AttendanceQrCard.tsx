"use client";

import Image from "next/image";
import { useState } from "react";

import { useLanguage } from "../contexts/LanguageContext";
import { attendanceQrTranslations } from "../i18n/attendanceQrTranslations";

type Props = {
  qrCodeDataUrl: string;
  className: string;
};

const CARD_WIDTH = 1080;
const CARD_PADDING = 96;
const QR_SIZE = 720;
const FONT_FAMILY = '"PingFang TC", "Noto Sans TC", "Microsoft JhengHei", system-ui, sans-serif';
const TITLE_FONT = `600 60px ${FONT_FAMILY}`;
const TITLE_LINE_HEIGHT = 76;
// One token per CJK character (no spaces between them), whole words otherwise.
const WRAP_TOKEN = /[\u2E80-\u9FFF\uF900-\uFAFF\uFF00-\uFFEF]|[^\s\u2E80-\u9FFF\uF900-\uFAFF\uFF00-\uFFEF]+|\s+/g;

export function AttendanceQrCard({ qrCodeDataUrl, className }: Props) {
  const { language } = useLanguage();
  const tr = attendanceQrTranslations[language];
  const [saving, setSaving] = useState(false);
  const [saveFailed, setSaveFailed] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    setSaveFailed(false);
    try {
      const blob = await renderCardImage({
        qrCodeDataUrl,
        className,
        scanForDetails: tr.scanForDetails,
        imageReminder: tr.imageReminder,
      });
      const file = new File([blob], tr.imageFileName, { type: "image/png" });

      // Mobile: the share sheet offers "Save Image". Desktop: plain download.
      if (navigator.canShare?.({ files: [file] })) {
        try {
          await navigator.share({ files: [file] });
        } catch (err) {
          if (!(err instanceof DOMException && err.name === "AbortError")) {
            throw err;
          }
        }
        return;
      }

      const objectUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = objectUrl;
      link.download = tr.imageFileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(objectUrl);
    } catch {
      setSaveFailed(true);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="w-full space-y-4">
      <p
        data-testid="attendance-qr-reminder"
        className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-900"
      >
        {tr.reminder}
      </p>

      <div
        data-testid="attendance-qr-card"
        className="flex flex-col items-center space-y-4 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm"
      >
        <p className="text-center text-lg font-semibold text-zinc-900">{className}</p>
        <Image
          src={qrCodeDataUrl}
          alt={tr.qrAlt}
          width={360}
          height={360}
          className="h-[min(70vw,320px)] w-[min(70vw,320px)] rounded-lg border border-zinc-300 bg-white p-2"
        />
        <p className="text-center text-sm text-zinc-600">{tr.scanForDetails}</p>
      </div>

      <button
        type="button"
        onClick={handleSave}
        disabled={saving}
        className="w-full rounded-md bg-zinc-900 px-6 py-3 text-sm font-medium text-white transition hover:bg-zinc-700 disabled:opacity-60"
      >
        {saving ? tr.savingButton : tr.saveButton}
      </button>
      {saveFailed ? (
        <p role="alert" className="text-center text-sm text-red-700">
          {tr.saveFailed}
        </p>
      ) : null}
    </div>
  );
}

async function renderCardImage({
  qrCodeDataUrl,
  className,
  scanForDetails,
  imageReminder,
}: {
  qrCodeDataUrl: string;
  className: string;
  scanForDetails: string;
  imageReminder: string;
}): Promise<Blob> {
  const qrImage = await loadImage(qrCodeDataUrl);

  const canvas = document.createElement("canvas");
  canvas.width = CARD_WIDTH;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Canvas is not supported");
  }

  ctx.font = TITLE_FONT;
  const titleLines = wrapText(ctx, className, CARD_WIDTH - CARD_PADDING * 2).slice(0, 3);
  const qrTop = CARD_PADDING + titleLines.length * TITLE_LINE_HEIGHT + 48;
  const scanTextTop = qrTop + QR_SIZE + 56;
  const reminderTop = scanTextTop + 72;
  // Resizing the canvas resets the context, so set it before drawing anything.
  canvas.height = reminderTop + 40 + CARD_PADDING;

  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.textAlign = "center";
  ctx.textBaseline = "top";

  ctx.fillStyle = "#18181b";
  ctx.font = TITLE_FONT;
  titleLines.forEach((line, index) => {
    ctx.fillText(line, CARD_WIDTH / 2, CARD_PADDING + index * TITLE_LINE_HEIGHT);
  });

  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(qrImage, (CARD_WIDTH - QR_SIZE) / 2, qrTop, QR_SIZE, QR_SIZE);

  ctx.fillStyle = "#52525b";
  ctx.font = `400 40px ${FONT_FAMILY}`;
  ctx.fillText(scanForDetails, CARD_WIDTH / 2, scanTextTop);

  ctx.fillStyle = "#92400e";
  ctx.font = `500 36px ${FONT_FAMILY}`;
  ctx.fillText(imageReminder, CARD_WIDTH / 2, reminderTop);

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error("Unable to render image"))), "image/png");
  });
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new window.Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Unable to load QR image"));
    image.src = src;
  });
}

function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const lines: string[] = [];
  let current = "";
  for (const token of text.match(WRAP_TOKEN) ?? []) {
    const candidate = current + token;
    if (current.trim() && ctx.measureText(candidate.trimEnd()).width > maxWidth) {
      lines.push(current.trimEnd());
      current = token.trimStart();
    } else {
      current = candidate;
    }
  }
  if (current.trim()) {
    lines.push(current.trimEnd());
  }
  return lines;
}
