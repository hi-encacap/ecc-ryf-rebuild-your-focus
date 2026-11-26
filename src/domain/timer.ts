import type { FocusSession, Run } from "./types";
import { addDays, localDate } from "./model";

const MAX_SECONDS = 86_400;
const CATEGORIES = ["focus", "reading", "thinking", "rest", "custom"] as const;

/** Record creation/editing is unavailable for future program days. */
export function assertWritableRunDay(
  run: Pick<Run, "startDate" | "timeZone">,
  day: number,
  now = new Date(),
): void {
  if (!Number.isInteger(day) || day < 1 || day > 30)
    throw new Error("Ngày chương trình phải từ 1 đến 30.");
  if (addDays(run.startDate, day - 1) > localDate(run.timeZone, now)) {
    throw new Error(
      "Ngày này chưa đến. Chỉ có thể xem trước, chưa thể ghi dữ liệu.",
    );
  }
}

function validTime(now: number): void {
  if (!Number.isFinite(now) || !Number.isFinite(new Date(now).getTime())) {
    throw new Error("Thời gian trên thiết bị không hợp lệ.");
  }
}

function validDuration(seconds: number, name: string): void {
  if (!Number.isFinite(seconds) || seconds < 0 || seconds > MAX_SECONDS) {
    throw new Error(`${name} phải nằm trong khoảng 0–1440 phút.`);
  }
}

function bounded(value: number): number {
  return Number.isFinite(value) ? Math.max(0, Math.min(MAX_SECONDS, value)) : 0;
}

function runningSeconds(session: FocusSession, now: number): number {
  if (session.status !== "running" || session.segmentStartedAt === null)
    return 0;
  return bounded((now - session.segmentStartedAt) / 1000);
}

function clockNeedsConfirmation(session: FocusSession, now: number): boolean {
  return (
    session.needsConfirmation === true ||
    (session.segmentStartedAt !== null &&
      (now < session.segmentStartedAt ||
        now - session.segmentStartedAt > MAX_SECONDS * 1000))
  );
}

/** A display value only: unconfirmed elapsed time is never a completed outcome. */
export function elapsedSeconds(
  session: FocusSession,
  now = Date.now(),
): number {
  validTime(now);
  if (session.status === "completed" && session.actualSeconds !== null) {
    return bounded(session.actualSeconds);
  }
  return bounded(session.accumulatedSeconds + runningSeconds(session, now));
}

export function longestSeconds(
  session: FocusSession,
  now = Date.now(),
): number {
  validTime(now);
  return Math.min(
    elapsedSeconds(session, now),
    bounded(
      Math.max(
        session.longestSegmentSeconds,
        session.currentSegmentSeconds + runningSeconds(session, now),
      ),
    ),
  );
}

export function createSession(
  input: {
    runId: string;
    day: number;
    category: FocusSession["category"];
    plannedSeconds: number;
    outcome: string;
  },
  now = Date.now(),
): FocusSession {
  validTime(now);
  if (
    !Number.isFinite(input.plannedSeconds) ||
    input.plannedSeconds < 60 ||
    input.plannedSeconds > 14_400
  ) {
    throw new Error("Đặt thời lượng từ 1 đến 240 phút.");
  }
  if (
    !input.runId ||
    !Number.isInteger(input.day) ||
    input.day < 1 ||
    input.day > 30 ||
    !CATEGORIES.includes(input.category) ||
    input.outcome.length > 10_000
  ) {
    throw new Error("Thông tin phiên chưa hợp lệ.");
  }
  return {
    id: crypto.randomUUID(),
    runId: input.runId,
    day: input.day,
    category: input.category,
    plannedSeconds: input.plannedSeconds,
    accumulatedSeconds: 0,
    segmentStartedAt: now,
    startedAt: new Date(now).toISOString(),
    endedAt: null,
    status: "running",
    interruptions: 0,
    longestSegmentSeconds: 0,
    currentSegmentSeconds: 0,
    actualSeconds: null,
    outcome: input.outcome,
    needsConfirmation: false,
  };
}

/** Pause is a boundary between uninterrupted segments, not an interruption count. */
export function pauseSession(
  session: FocusSession,
  now = Date.now(),
): FocusSession {
  if (session.status !== "running") return session;
  validTime(now);
  return {
    ...session,
    accumulatedSeconds: elapsedSeconds(session, now),
    longestSegmentSeconds: longestSeconds(session, now),
    currentSegmentSeconds: 0,
    segmentStartedAt: null,
    status: "paused",
    needsConfirmation: clockNeedsConfirmation(session, now),
  };
}

export function resumeSession(
  session: FocusSession,
  now = Date.now(),
): FocusSession {
  if (session.status !== "paused") return session;
  validTime(now);
  return {
    ...session,
    status: "running",
    segmentStartedAt: now,
    currentSegmentSeconds: 0,
  };
}

/** Only this explicit action increments interruptions. Visibility does not. */
export function interruptSession(
  session: FocusSession,
  now = Date.now(),
): FocusSession {
  if (session.status !== "running") return session;
  validTime(now);
  return {
    ...session,
    accumulatedSeconds: elapsedSeconds(session, now),
    longestSegmentSeconds: longestSeconds(session, now),
    currentSegmentSeconds: 0,
    segmentStartedAt: now,
    interruptions: session.interruptions + 1,
    needsConfirmation: clockNeedsConfirmation(session, now),
  };
}

/** Saving a result always requires the user's actual-time confirmation. */
export function finishSession(
  session: FocusSession,
  actualSeconds: number,
  longestSegmentSeconds: number,
  now = Date.now(),
): FocusSession {
  if (session.status === "completed" || session.status === "cancelled")
    return session;
  validTime(now);
  validDuration(actualSeconds, "Thời lượng thực tế");
  validDuration(longestSegmentSeconds, "Đoạn liên tục dài nhất");
  return {
    ...session,
    accumulatedSeconds: actualSeconds,
    actualSeconds,
    longestSegmentSeconds: Math.min(longestSegmentSeconds, actualSeconds),
    currentSegmentSeconds: 0,
    segmentStartedAt: null,
    status: "completed",
    endedAt: new Date(now).toISOString(),
    needsConfirmation: false,
  };
}

export function cancelSession(
  session: FocusSession,
  now = Date.now(),
): FocusSession {
  if (session.status === "completed" || session.status === "cancelled")
    return session;
  validTime(now);
  return {
    ...session,
    accumulatedSeconds: elapsedSeconds(session, now),
    longestSegmentSeconds: longestSeconds(session, now),
    currentSegmentSeconds: 0,
    segmentStartedAt: null,
    actualSeconds: null,
    status: "cancelled",
    endedAt: new Date(now).toISOString(),
  };
}
