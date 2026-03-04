"use client";

import { type FormEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";

type ParticipantRow = {
  participant_id: string;
  name: string;
  mobile: string;
  terms_accepted: boolean;
  terms_version?: string;
  attendance_status: string;
};

type ScanResult = {
  status:
    | "success"
    | "invalid_session"
    | "already_attended"
    | "participant_not_found"
    | "admin_not_found";
  participant_id?: string;
  participant_name?: string;
  marked_at?: number;
};

type SessionParticipantsPanelProps = {
  participants: ParticipantRow[];
  onMarkAttendance: (participantId: string) => Promise<ScanResult>;
};

type ToastState = {
  tone: "success" | "warning" | "error";
  message: string;
};

type QrScannerInstance = {
  start: () => Promise<void>;
  stop: () => void | Promise<void>;
  destroy: () => void;
};

export function SessionParticipantsPanel({
  participants: initialParticipants,
  onMarkAttendance,
}: SessionParticipantsPanelProps) {
  const [participants, setParticipants] = useState(initialParticipants);
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [manualParticipantId, setManualParticipantId] = useState("");
  const [toast, setToast] = useState<ToastState | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const scannerRef = useRef<QrScannerInstance | null>(null);
  const handledScanRef = useRef(false);

  useEffect(() => {
    setParticipants(initialParticipants);
  }, [initialParticipants]);

  useEffect(() => {
    if (!toast) {
      return;
    }

    const timeoutId = setTimeout(() => setToast(null), 3500);
    return () => clearTimeout(timeoutId);
  }, [toast]);

  const toastClassName = useMemo(() => {
    if (!toast) {
      return "";
    }

    if (toast.tone === "success") {
      return "bg-emerald-600 text-white";
    }
    if (toast.tone === "warning") {
      return "bg-amber-100 text-amber-900";
    }
    return "bg-red-100 text-red-900";
  }, [toast]);

  const stopScanner = useCallback(async () => {
    const scanner = scannerRef.current;
    scannerRef.current = null;
    if (!scanner) {
      return;
    }

    try {
      await scanner.stop();
    } catch {
      // best effort cleanup
    }
    scanner.destroy();
  }, []);

  const handleMarkAttendance = useCallback(
    async (participantId: string) => {
      const normalizedId = participantId.trim();
      if (!normalizedId || isSubmitting) {
        return;
      }

      setIsSubmitting(true);
      const result = await onMarkAttendance(normalizedId);
      setIsSubmitting(false);

      if (result.status === "success" && result.participant_id && result.marked_at) {
        const attendedTimestamp = new Date(result.marked_at).toISOString();
        setParticipants((rows) =>
          rows.map((row) =>
            row.participant_id === result.participant_id
              ? {
                  ...row,
                  attendance_status: `\u2713 Attended at ${attendedTimestamp}`,
                }
              : row
          )
        );

        setToast({
          tone: "success",
          message: `${result.participant_name ?? "Participant"} marked as attended.`,
        });
        return;
      }

      if (result.status === "already_attended" && result.marked_at) {
        setToast({
          tone: "warning",
          message: `Already marked attended at ${new Date(result.marked_at).toISOString()}.`,
        });
        return;
      }

      if (result.status === "invalid_session") {
        setToast({
          tone: "error",
          message: "Participant not registered for this session.",
        });
        return;
      }

      if (result.status === "participant_not_found") {
        setToast({
          tone: "error",
          message: "Participant not found.",
        });
        return;
      }

      setToast({
        tone: "error",
        message: "Unable to mark attendance. Please sign in again.",
      });
    },
    [isSubmitting, onMarkAttendance]
  );

  const processScannedPayload = useCallback(
    async (payload: string) => {
      const participantId = extractParticipantId(payload);
      if (!participantId) {
        setToast({
          tone: "error",
          message: "QR code is invalid. Try scanning again.",
        });
        handledScanRef.current = false;
        return;
      }

      await handleMarkAttendance(participantId);
      setOpen(false);
    },
    [handleMarkAttendance]
  );

  useEffect(() => {
    if (!open || !videoRef.current) {
      return;
    }

    let cancelled = false;
    handledScanRef.current = false;

    const setupScanner = async () => {
      try {
        const { default: QrScanner } = await import("qr-scanner");
        if (cancelled || !videoRef.current) {
          return;
        }

        const scanner = new QrScanner(
          videoRef.current,
          (result: { data: string } | string) => {
            const rawValue = typeof result === "string" ? result : result.data;
            if (handledScanRef.current) {
              return;
            }
            handledScanRef.current = true;
            void processScannedPayload(rawValue);
          },
          {
            returnDetailedScanResult: true,
            highlightScanRegion: true,
            highlightCodeOutline: true,
          }
        );

        scannerRef.current = scanner;
        await scanner.start();
      } catch {
        setToast({
          tone: "error",
          message: "Unable to access camera for QR scanning.",
        });
        setOpen(false);
      }
    };

    void setupScanner();

    return () => {
      cancelled = true;
      void stopScanner();
    };
  }, [open, processScannedPayload, stopScanner]);

  const onManualSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await handleMarkAttendance(manualParticipantId);
    setManualParticipantId("");
  };

  return (
    <>
      {toast ? (
        <div
          role="status"
          className={`fixed bottom-5 right-5 z-50 rounded-lg px-4 py-3 text-sm font-medium shadow-lg ${toastClassName}`}
        >
          {toast.message}
        </div>
      ) : null}

      <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="inline-flex rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700"
          >
            Scan QR Code
          </button>

          <form onSubmit={onManualSubmit} className="flex w-full max-w-md items-center gap-2">
            <input
              type="text"
              value={manualParticipantId}
              onChange={(event) => setManualParticipantId(event.target.value)}
              placeholder="Paste participant ID"
              className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm text-zinc-900"
            />
            <button
              type="submit"
              disabled={isSubmitting || manualParticipantId.trim().length === 0}
              className="rounded-md border border-zinc-300 px-3 py-2 text-sm font-medium text-zinc-800 hover:bg-zinc-100 disabled:cursor-not-allowed disabled:text-zinc-400"
            >
              Mark
            </button>
          </form>
        </div>

        <section className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full border-collapse text-left text-sm">
              <thead className="bg-zinc-50 text-zinc-700">
                <tr>
                  <th className="px-4 py-3 font-medium">Participant ID</th>
                  <th className="px-4 py-3 font-medium">Name</th>
                  <th className="px-4 py-3 font-medium">Mobile</th>
                  <th className="px-4 py-3 font-medium">Terms Accepted</th>
                  <th className="px-4 py-3 font-medium">Terms Version</th>
                  <th className="px-4 py-3 font-medium">Attendance Status</th>
                </tr>
              </thead>
              <tbody>
                {participants.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-6 text-center text-zinc-600">
                      No participants found for this session.
                    </td>
                  </tr>
                ) : (
                  participants.map((participant) => (
                    <tr key={participant.participant_id} className="border-t border-zinc-200">
                      <td className="px-4 py-3 font-mono text-xs text-zinc-700">
                        {participant.participant_id}
                      </td>
                      <td className="px-4 py-3 text-zinc-900">{participant.name}</td>
                      <td className="px-4 py-3 text-zinc-700">{participant.mobile}</td>
                      <td className="px-4 py-3 text-zinc-700">
                        {participant.terms_accepted ? "Yes" : "No"}
                      </td>
                      <td className="px-4 py-3 text-zinc-700">
                        {participant.terms_version ?? "-"}
                      </td>
                      <td className="px-4 py-3 text-zinc-700">{participant.attendance_status}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      </section>

      {open ? (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-xl rounded-xl bg-white p-5 shadow-xl">
            <h2 className="text-lg font-semibold text-zinc-900">Scan Participant QR Code</h2>
            <p className="mt-1 text-sm text-zinc-700">
              Point the camera at a participant QR code to mark attendance.
            </p>
            <div className="mt-4 overflow-hidden rounded-lg border border-zinc-300 bg-black">
              <video ref={videoRef} className="max-h-[60vh] w-full object-cover" />
            </div>
            <div className="mt-4 flex justify-end">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-md border border-zinc-300 px-3 py-2 text-sm font-medium text-zinc-900 hover:bg-zinc-100"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

function extractParticipantId(payload: string): string | null {
  const raw = payload.trim();
  if (!raw) {
    return null;
  }

  try {
    const parsed = new URL(raw);
    const segments = parsed.pathname.split("/").filter(Boolean);
    const participantSegmentIndex = segments.findIndex((segment) => segment === "participant");
    if (participantSegmentIndex >= 0 && segments[participantSegmentIndex + 1]) {
      return decodeURIComponent(segments[participantSegmentIndex + 1]);
    }
  } catch {
    // payload is not a URL, continue
  }

  return raw;
}
