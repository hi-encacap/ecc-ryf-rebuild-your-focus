import { describe, expect, it } from "vitest";
import {
  addDays,
  dayNumber,
  dueReviews,
  effectiveMetrics,
  emptyMetrics,
  goalsForDay,
  localDate,
  makeLog,
  program,
  scoreLog,
  shouldSuggestAdaptation,
  summarize,
} from "./model";
import type { AppData, DailyLog, Run } from "./types";

const now = "2026-11-26T10:00:00.000Z";
const run = (): Run => ({
  id: crypto.randomUUID(),
  programVersion: "1.0.0",
  startDate: "2026-11-01",
  timeZone: "Asia/Ho_Chi_Minh",
  baseline: emptyMetrics(),
  goals: {},
  createdAt: now,
  updatedAt: now,
});
const data = (r: Run): AppData => ({
  schemaVersion: 1,
  activeRunId: r.id,
  runs: [r],
  overrides: [],
  logs: [],
  sessions: [],
  journal: [],
  cards: [],
  recallReviews: [],
  reviews: [],
  settings: {
    displayTimeZone: r.timeZone,
    lastBackupAt: null,
    adaptationDismissedAt: null,
  },
});
const submit = (log: DailyLog, done = 6) => {
  Object.keys(log.habits).forEach((key, index) => {
    log.habits[key as keyof DailyLog["habits"]] =
      index < done ? "done" : "not_done";
  });
  log.status = "submitted";
  return log;
};

describe("calendar and immutable curriculum", () => {
  it("contains every unique Vietnamese mission from 1 to 30", () => {
    expect(program.days.map((day) => day.day)).toEqual(
      Array.from({ length: 30 }, (_, i) => i + 1),
    );
    expect(
      program.days.every(
        (day) => day.steps.length > 0 && day.outcome && day.why,
      ),
    ).toBe(true);
  });
  it("adds calendar days across leap, year and DST boundaries", () => {
    expect(addDays("2024-02-28", 1)).toBe("2024-02-29");
    expect(addDays("2024-02-28", 2)).toBe("2024-03-01");
    expect(addDays("2026-12-31", 1)).toBe("2027-01-01");
    expect(addDays("2026-03-08", 1)).toBe("2026-03-09");
    expect(() => addDays("2026-02-30", 1)).toThrow();
  });
  it("maps dates using run timezone instead of elapsed hours", () => {
    expect(
      localDate("Asia/Ho_Chi_Minh", new Date("2026-11-25T18:00:00Z")),
    ).toBe("2026-11-26");
    const r = {
      ...run(),
      startDate: "2026-03-07",
      timeZone: "America/New_York",
    };
    expect(
      dayNumber(r, localDate(r.timeZone, new Date("2026-03-09T04:30:00Z"))),
    ).toBe(3);
    expect(dayNumber(r, "2026-03-06")).toBe(0);
    expect(dayNumber(r, "2026-04-06")).toBe(31);
  });
});

describe("targets, scoring and adaptation", () => {
  it("keeps zero video baseline distinct from unknown and preserves old snapshots", () => {
    const r = run();
    expect(goalsForDay(r, 1).video).toBeNull();
    r.baseline.video = 0;
    expect(goalsForDay(r, 1).video).toBe(0);
    r.baseline.video = 100;
    expect(goalsForDay(r, 8).video).toBe(50);
    const log = makeLog(r, 1);
    const overrides = [
      {
        id: crypto.randomUUID(),
        runId: r.id,
        effectiveFromDay: 2,
        goals: { focus: 12 },
        reason: "Bớt tải",
        createdAt: now,
      },
    ];
    expect(goalsForDay(r, 2, overrides).focus).toBe(12);
    expect(log.goals.focus).toBe(20);
    expect(goalsForDay(r, 1, overrides).focus).toBe(20);
  });
  it("scores only submitted days, excludes N/A and never scores zero denominator", () => {
    const log = makeLog(run(), 1);
    log.habits.focus = "done";
    expect(scoreLog(log).ratio).toBeNull();
    submit(log, 6);
    log.habits.reflection = "not_applicable";
    expect(scoreLog(log)).toEqual({ done: 6, applicable: 7, ratio: 6 / 7 });
    Object.keys(log.habits).forEach((key) => {
      log.habits[key as keyof typeof log.habits] = "not_applicable";
    });
    expect(scoreLog(log).ratio).toBeNull();
  });
  it("separates minimum day adherence and excludes standard-only habits", () => {
    const log = makeLog(run(), 1);
    log.mode = "minimum";
    log.status = "submitted";
    for (const key of ["focus", "reading", "activity", "reflection"] as const)
      log.habits[key] = "done";
    expect(scoreLog(log)).toEqual({ done: 4, applicable: 4, ratio: 1 });
  });
  it("suggests reduction for three logged standard low days without counting missing days as failure", () => {
    const r = run(),
      d = data(r);
    d.logs = [1, 4, 6].map((day) => submit(makeLog(r, day), 4));
    expect(shouldSuggestAdaptation(d, r)).toBe(true);
    d.logs.pop();
    expect(shouldSuggestAdaptation(d, r)).toBe(false);
  });
});

describe("honest analytics", () => {
  it("uses a seven-calendar-day window and keeps zero, unknown and missing distinct", () => {
    const r = run(),
      d = data(r);
    r.baseline.video = 0;
    const a = submit(makeLog(r, 1));
    a.metrics.video = 100;
    const b = submit(makeLog(r, 20));
    b.metrics.video = 0;
    b.metrics.sleep = 7;
    const c = submit(makeLog(r, 25));
    c.metrics.sleep = 8;
    d.logs = [a, b, c];
    const result = summarize(d, r, "2026-11-26");
    expect(result.metrics.video).toMatchObject({
      mean: 0,
      count: 1,
      baseline: 0,
      change: 0,
      reductionPercent: null,
    });
    expect(result.metrics.sleep.mean).toBe(7.5);
    expect(result.metrics.sleep.count).toBe(2);
    expect(result.coverage).toBe(2);
    expect(result.trend.find((item) => item.day === 21)!.focus).toBeNull();
  });
  it("aggregates task ratios and weights adherence by applicable habits", () => {
    const r = run(),
      d = data(r);
    const a = submit(makeLog(r, 20), 4);
    a.metrics.complex = 1;
    a.metrics.independent = 1;
    const b = submit(makeLog(r, 21), 1);
    b.metrics.complex = 9;
    b.metrics.independent = 0;
    b.habits.reading = "not_applicable";
    const c = submit(makeLog(r, 22), 8);
    c.mode = "minimum";
    d.logs = [a, b, c];
    const result = summarize(d, r, "2026-11-26");
    expect(result.thinking.ratio).toBe(0.1);
    expect(result.adherence.standard).toBe(5 / 15);
    expect(result.adherence.minimum).toBe(1);
  });
  it("shows increases without clamping and compares only 15-minute switch tests", () => {
    const r = run(),
      d = data(r);
    r.baseline.video = 10;
    r.baseline.switches = 4;
    r.baseline.testMinutes = 15;
    const a = makeLog(r, 20);
    a.metrics.video = 20;
    a.metrics.switches = 2;
    a.metrics.testMinutes = 15;
    const b = makeLog(r, 21);
    b.metrics.switches = 10;
    b.metrics.testMinutes = 30;
    d.logs = [a, b];
    const result = summarize(d, r, "2026-11-26");
    expect(result.metrics.video.reductionPercent).toBe(-100);
    expect(result.metrics.switches.mean).toBe(2);
  });
});

describe("spaced review queue", () => {
  it("retains overdue reviews, excludes completed intervals and archived cards", () => {
    const r = run(),
      d = data(r),
      id = crypto.randomUUID();
    d.cards = [
      {
        id,
        runId: r.id,
        source: "Sách",
        link: "",
        ideas: ["Một ý"],
        createdDate: "2026-11-01",
        dueDates: [1, 3, 7, 14].map((offset) => addDays("2026-11-01", offset)),
        archived: false,
      },
    ];
    d.recallReviews = [
      {
        id: crypto.randomUUID(),
        cardId: id,
        dueDate: "2026-11-02",
        actualDate: "2026-11-02",
        response: "Một ý",
        matched: 1,
        total: 1,
        createdAt: now,
      },
    ];
    expect(dueReviews(d, r, "2026-11-10").map((item) => item.dueDate)).toEqual([
      "2026-11-04",
      "2026-11-08",
    ]);
    d.cards[0].archived = true;
    expect(dueReviews(d, r, "2026-11-10")).toEqual([]);
  });
});

describe("confirmed session metric derivation", () => {
  it("uses confirmed segments and sums reading while manual totals override", () => {
    const r = run(),
      d = data(r);
    const base = {
      id: crypto.randomUUID(),
      runId: r.id,
      day: 20,
      category: "focus" as const,
      plannedSeconds: 1200,
      accumulatedSeconds: 1200,
      segmentStartedAt: null,
      startedAt: now,
      endedAt: now,
      status: "completed" as const,
      interruptions: 1,
      longestSegmentSeconds: 900,
      currentSegmentSeconds: 300,
      actualSeconds: 600,
      outcome: "",
    };
    d.sessions = [
      base,
      {
        ...base,
        id: crypto.randomUUID(),
        category: "reading",
        actualSeconds: 120,
      },
      {
        ...base,
        id: crypto.randomUUID(),
        category: "reading",
        actualSeconds: 180,
      },
    ];
    expect(effectiveMetrics(d, r.id, 20)).toMatchObject({
      focus: 10,
      reading: 5,
    });
    const summary = summarize(d, r, "2026-11-26");
    expect(summary.coverage).toBe(0);
    expect(summary.metrics.focus).toMatchObject({ mean: 10, count: 1 });
    expect(summary.metrics.reading).toMatchObject({ mean: 5, count: 1 });
    expect(summary.metricDays).toBe(1);
    const log = makeLog(r, 20);
    log.metrics.reading = 0;
    log.metrics.focus = 7;
    d.logs.push(log);
    expect(effectiveMetrics(d, r.id, 20)).toMatchObject({
      focus: 7,
      reading: 0,
    });
  });
  it("counts next-day recall only for five-idea cards on the next local calendar date", () => {
    const r = run(),
      d = data(r),
      cardId = crypto.randomUUID();
    d.cards = [
      {
        id: cardId,
        runId: r.id,
        source: "Tài liệu",
        link: "",
        ideas: ["1", "2", "3", "4", "5"],
        createdDate: "2026-11-19",
        dueDates: ["2026-11-20", "2026-11-22"],
        archived: false,
      },
    ];
    d.recallReviews = [
      {
        id: crypto.randomUUID(),
        cardId,
        dueDate: "2026-11-20",
        actualDate: "2026-11-20",
        response: "Nhớ",
        matched: 4,
        total: 5,
        createdAt: now,
      },
    ];
    expect(effectiveMetrics(d, r.id, 20).recall).toBe(4);
    expect(summarize(d, r, "2026-11-26").metrics.recall).toMatchObject({
      mean: 4,
      count: 1,
    });
    d.recallReviews[0].actualDate = "2026-11-21";
    expect(effectiveMetrics(d, r.id, 21).recall).toBeNull();
  });
});

describe("activity measurement coverage", () => {
  it("does not infer aerobic zero from strength-only or strength zero from aerobic-only", () => {
    const r = run(),
      d = data(r),
      log = makeLog(r, 20);
    log.metrics.strength = true;
    d.logs = [log];
    let result = summarize(d, r, "2026-11-26");
    expect(result.activity).toMatchObject({
      coverage: 0,
      strengthCoverage: 1,
      strengthDays: 1,
      moderateCoverage: 0,
      vigorousCoverage: 0,
    });
    log.metrics.strength = null;
    log.metrics.moderate = 0;
    result = summarize(d, r, "2026-11-26");
    expect(result.activity).toMatchObject({
      coverage: 1,
      moderateEquivalent: 0,
      strengthCoverage: 0,
      moderateCoverage: 1,
    });
  });
});
