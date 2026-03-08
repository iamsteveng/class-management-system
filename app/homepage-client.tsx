"use client";

import { useEffect, useState } from "react";

type ClassItem = {
  class_id: string;
  class_name: string;
};

type SessionItem = {
  session_id: string;
  location: string;
  date: string;
  time: string;
  quota_available: number;
};

export function HomepageClient() {
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null);
  const [sessions, setSessions] = useState<SessionItem[]>([]);
  const [isLoadingClasses, setIsLoadingClasses] = useState(true);
  const [isLoadingSessions, setIsLoadingSessions] = useState(false);
  const [classesError, setClassesError] = useState<string | null>(null);
  const [sessionsError, setSessionsError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadClasses() {
      setIsLoadingClasses(true);
      setClassesError(null);

      try {
        const response = await fetch("/api/classes");
        if (!response.ok) {
          throw new Error("Unable to load classes.");
        }

        const data = (await response.json()) as { classes: ClassItem[] };
        if (!isMounted) {
          return;
        }

        setClasses(data.classes);
        setSelectedClassId(data.classes[0]?.class_id ?? null);
      } catch {
        if (!isMounted) {
          return;
        }
        setClassesError("Unable to load classes right now.");
      } finally {
        if (isMounted) {
          setIsLoadingClasses(false);
        }
      }
    }

    void loadClasses();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    let isMounted = true;

    async function loadSessions() {
      if (!selectedClassId) {
        setSessions([]);
        return;
      }

      setIsLoadingSessions(true);
      setSessionsError(null);

      try {
        const response = await fetch(
          `/api/classes/${encodeURIComponent(selectedClassId)}/sessions`
        );
        if (!response.ok) {
          throw new Error("Unable to load sessions.");
        }

        const data = (await response.json()) as { sessions: SessionItem[] };

        if (!isMounted) {
          return;
        }

        setSessions(data.sessions);
      } catch {
        if (!isMounted) {
          return;
        }

        setSessions([]);
        setSessionsError("Unable to load sessions right now.");
      } finally {
        if (isMounted) {
          setIsLoadingSessions(false);
        }
      }
    }

    void loadSessions();

    return () => {
      isMounted = false;
    };
  }, [selectedClassId]);

  return (
    <main className="mx-auto min-h-screen w-full max-w-4xl space-y-6 px-4 py-10">
      <section className="space-y-2">
        <h1 className="text-2xl font-semibold text-zinc-900">Available Classes</h1>
        <p className="text-sm text-zinc-700">
          Select a class to view its available sessions.
        </p>
      </section>

      <section className="rounded-xl border border-zinc-200 bg-white p-5">
        {isLoadingClasses ? (
          <p className="text-sm text-zinc-600">Loading classes...</p>
        ) : classesError ? (
          <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{classesError}</p>
        ) : classes.length === 0 ? (
          <p className="text-sm text-zinc-600">No classes are currently available.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {classes.map((classItem) => {
              const isSelected = classItem.class_id === selectedClassId;
              return (
                <button
                  key={classItem.class_id}
                  type="button"
                  onClick={() => setSelectedClassId(classItem.class_id)}
                  className={`rounded-full border px-4 py-2 text-sm font-medium transition ${
                    isSelected
                      ? "border-zinc-900 bg-zinc-900 text-white"
                      : "border-zinc-300 bg-white text-zinc-800 hover:bg-zinc-100"
                  }`}
                  aria-pressed={isSelected}
                >
                  {classItem.class_name}
                </button>
              );
            })}
          </div>
        )}
      </section>

      <section className="rounded-xl border border-zinc-200 bg-white p-5">
        <h2 className="text-lg font-medium text-zinc-900">Available Sessions</h2>

        {!selectedClassId && !isLoadingClasses ? (
          <p className="mt-3 text-sm text-zinc-600">
            Select a class to view sessions.
          </p>
        ) : isLoadingSessions ? (
          <p className="mt-3 text-sm text-zinc-600">Loading sessions...</p>
        ) : sessionsError ? (
          <p className="mt-3 rounded-lg bg-red-50 p-3 text-sm text-red-700">{sessionsError}</p>
        ) : sessions.length === 0 ? (
          <p className="mt-3 text-sm text-zinc-600">
            No sessions are available for this class.
          </p>
        ) : (
          <ul className="mt-3 space-y-3">
            {sessions.map((session) => (
              <li key={session.session_id} className="rounded-lg border border-zinc-200 p-3 text-sm">
                <p className="font-medium text-zinc-900">
                  {session.date} at {session.time}
                </p>
                <p className="text-zinc-700">{session.location}</p>
                <p className="text-zinc-600">Available quota: {session.quota_available}</p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
