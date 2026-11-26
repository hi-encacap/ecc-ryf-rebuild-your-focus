import { describe, expect, it } from "vitest";
import {
  cancelSession,
  createSession,
  elapsedSeconds,
  finishSession,
  interruptSession,
  longestSeconds,
  pauseSession,
  resumeSession,
  assertWritableRunDay,
} from "./timer";

const start = Date.parse("2026-11-26T09:00:00.000Z");
const fresh = () =>
  createSession(
    {
      runId: "run-1",
      day: 1,
      category: "focus",
      plannedSeconds: 1200,
      outcome: "Read a chapter",
    },
    start,
  );

describe("timestamp based focus sessions", () => {
  it("prevents future run and future day writes in the frozen run timezone", () => {
    const now = new Date("2026-11-26T17:30:00.000Z");
    const vietnam = { startDate: "2026-11-27", timeZone: "Asia/Ho_Chi_Minh" };
    const losAngeles = {
      startDate: "2026-11-27",
      timeZone: "America/Los_Angeles",
    };
    expect(() => assertWritableRunDay(vietnam, 1, now)).not.toThrow();
    expect(() => assertWritableRunDay(losAngeles, 1, now)).toThrow("chưa đến");
    expect(() => assertWritableRunDay(vietnam, 2, now)).toThrow("chưa đến");
    expect(() => assertWritableRunDay(vietnam, 0, now)).toThrow();
    expect(() => assertWritableRunDay(vietnam, 31, now)).toThrow();
    expect(() => assertWritableRunDay(vietnam, 1.5, now)).toThrow();
  });
  it("recovers elapsed duration from persisted state without tick counts", () => {
    const restored = JSON.parse(JSON.stringify(fresh()));
    expect(elapsedSeconds(restored, start + 183_500)).toBe(183.5);
    expect(restored.actualSeconds).toBeNull();
    expect(restored.status).toBe("running");
  });

  it("retains the original run and day when a restored session finishes later", () => {
    const previousRunSession = createSession(
      {
        runId: "previous-run",
        day: 27,
        category: "reading",
        plannedSeconds: 1200,
        outcome: "",
      },
      start,
    );
    const restored = JSON.parse(JSON.stringify(previousRunSession));
    const done = finishSession(restored, 1200, 600, start + 90_000_000);
    expect(done.runId).toBe("previous-run");
    expect(done.day).toBe(27);
    expect(done.actualSeconds).toBe(1200);
    expect(done.longestSegmentSeconds).toBe(600);
  });

  it("excludes pauses and retains longest continuous segment across resume", () => {
    const paused = pauseSession(fresh(), start + 60_000);
    expect(elapsedSeconds(paused, start + 660_000)).toBe(60);
    const resumed = resumeSession(paused, start + 660_000);
    expect(elapsedSeconds(resumed, start + 690_000)).toBe(90);
    expect(longestSeconds(resumed, start + 690_000)).toBe(60);
    expect(resumed.interruptions).toBe(0);
  });

  it("records explicit interruptions without counting total duration as uninterrupted", () => {
    const interrupted = interruptSession(fresh(), start + 120_000);
    expect(interrupted.interruptions).toBe(1);
    expect(elapsedSeconds(interrupted, start + 300_000)).toBe(300);
    expect(longestSeconds(interrupted, start + 300_000)).toBe(180);
    const twice = interruptSession(interrupted, start + 300_000);
    expect(longestSeconds(twice, start + 360_000)).toBe(180);
    expect(elapsedSeconds(twice, start + 360_000)).toBe(360);
  });

  it("uses corrected actual duration and caps uninterrupted duration", () => {
    const done = finishSession(fresh(), 240, 300, start + 900_000);
    expect(done.actualSeconds).toBe(240);
    expect(done.longestSegmentSeconds).toBe(240);
    expect(elapsedSeconds(done, start + 1_000_000)).toBe(240);
    expect(done.segmentStartedAt).toBeNull();
    expect(done.needsConfirmation).toBe(false);
  });

  it("keeps repeated completion, resume, interruption and cancellation idempotent", () => {
    const done = finishSession(fresh(), 60, 60, start + 60_000);
    expect(finishSession(done, 100, 100, start + 100_000)).toBe(done);
    expect(resumeSession(done, start + 100_000)).toBe(done);
    expect(interruptSession(done, start + 100_000)).toBe(done);
    expect(cancelSession(done, start + 100_000)).toBe(done);
    const cancelled = cancelSession(fresh(), start + 20_000);
    expect(cancelled.actualSeconds).toBeNull();
    expect(finishSession(cancelled, 20, 20, start + 20_000)).toBe(cancelled);
  });

  it("bounds a backwards clock and flags a questionable recovered interval", () => {
    expect(elapsedSeconds(fresh(), start - 10_000)).toBe(0);
    expect(pauseSession(fresh(), start - 10_000).needsConfirmation).toBe(true);
    expect(elapsedSeconds(fresh(), start + 100_000_000)).toBe(86_400);
    expect(pauseSession(fresh(), start + 100_000_000).needsConfirmation).toBe(
      true,
    );
  });

  it("rejects nonfinite and out-of-range durations without mutating source", () => {
    const source = fresh();
    for (const invalid of [-1, Infinity, NaN, 86_401]) {
      expect(() => finishSession(source, invalid, 0, start)).toThrow();
      expect(() => finishSession(source, 60, invalid, start)).toThrow();
    }
    for (const plannedSeconds of [0, 59, 14_401, Infinity, NaN]) {
      expect(() =>
        createSession(
          {
            runId: "run-1",
            day: 1,
            category: "focus",
            plannedSeconds,
            outcome: "",
          },
          start,
        ),
      ).toThrow();
    }
    expect(source.status).toBe("running");
  });
});
