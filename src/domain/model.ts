import curriculum from "../content/program.v1.json";
import type {
  AppData,
  DailyLog,
  GoalOverride,
  Goals,
  HabitKey,
  Metrics,
  Mode,
  RecallCard,
  Run,
} from "./types";

export const program = curriculum;
const DAY_MS = 86_400_000;
export const standardHabitKeys: HabitKey[] = [
  "sleep",
  "video",
  "focus",
  "reading",
  "recall",
  "thinking",
  "activity",
  "reflection",
];
export const minimumHabitKeys: HabitKey[] = [
  "focus",
  "reading",
  "activity",
  "reflection",
];

export function emptyMetrics(): Metrics {
  return {
    video: null,
    pickups: null,
    sleep: null,
    reading: null,
    focus: null,
    energy: null,
    moderate: null,
    vigorous: null,
    light: null,
    strength: null,
    complex: null,
    independent: null,
    switches: null,
    testMinutes: null,
    recall: null,
  };
}

export function localDate(timeZone: string, date = new Date()): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const get = (type: string) => parts.find((part) => part.type === type)!.value;
  return `${get("year")}-${get("month")}-${get("day")}`;
}

export function addDays(date: string, days: number): string {
  const parsed = new Date(`${date}T12:00:00.000Z`);
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(date) ||
    !Number.isInteger(days) ||
    !Number.isFinite(parsed.getTime()) ||
    parsed.toISOString().slice(0, 10) !== date
  )
    throw new Error("Ngày không hợp lệ.");
  parsed.setUTCDate(parsed.getUTCDate() + days);
  return parsed.toISOString().slice(0, 10);
}

export function dayNumber(run: Run, date = localDate(run.timeZone)): number {
  return (
    Math.round(
      (new Date(`${date}T12:00:00Z`).getTime() -
        new Date(`${run.startDate}T12:00:00Z`).getTime()) /
        DAY_MS,
    ) + 1
  );
}

export function phaseForDay(day: number) {
  const clamped = Math.max(1, Math.min(30, day));
  return program.phases.find(
    (phase) => clamped >= phase.startDay && clamped <= phase.endDay,
  )!;
}

export function goalsForDay(
  run: Run,
  day: number,
  overrides: GoalOverride[] = [],
): Goals {
  const phase = phaseForDay(day);
  const base: Goals = {
    focus: phase.targets.focusMinutes,
    reading: phase.targets.readingMinutes,
    thinking: phase.targets.thinkFirstMinutes,
    sleep: 7,
    video:
      run.baseline.video === null
        ? null
        : Math.max(
            0,
            Math.round(
              run.baseline.video * phase.targets.shortVideoBaselineRatio,
            ),
          ),
    activity: day <= 7 ? 20 : 30,
  };
  const goals = { ...base, ...run.goals };
  for (const override of overrides
    .filter((item) => item.runId === run.id && item.effectiveFromDay <= day)
    .sort(
      (a, b) =>
        a.effectiveFromDay - b.effectiveFromDay ||
        a.createdAt.localeCompare(b.createdAt),
    ))
    Object.assign(goals, override.goals);
  return goals;
}

export function habitKeys(mode: Mode): HabitKey[] {
  return [...(mode === "minimum" ? minimumHabitKeys : standardHabitKeys)];
}

export function makeLog(
  run: Run,
  day: number,
  overrides: GoalOverride[] = [],
): DailyLog {
  if (!Number.isInteger(day) || day < 1 || day > 30)
    throw new Error("Ngày chương trình phải từ 1 đến 30.");
  const date = addDays(run.startDate, day - 1);
  const now = new Date().toISOString();
  return {
    id: crypto.randomUUID(),
    runId: run.id,
    day,
    date,
    mode: "standard",
    goals: goalsForDay(run, day, overrides),
    habits: Object.fromEntries(
      standardHabitKeys.map((key) => [key, "pending"]),
    ) as DailyLog["habits"],
    metrics: emptyMetrics(),
    missionDone: false,
    reflection: "",
    status: "draft",
    backfilled: date < localDate(run.timeZone),
    createdAt: now,
    updatedAt: now,
  };
}

export function scoreLog(log: DailyLog) {
  const statuses = habitKeys(log.mode).map((key) => log.habits[key]);
  const applicable = statuses.filter(
    (status) => status !== "not_applicable",
  ).length;
  const done = statuses.filter((status) => status === "done").length;
  return {
    done,
    applicable,
    ratio:
      log.status === "submitted" &&
      applicable > 0 &&
      !statuses.includes("pending")
        ? done / applicable
        : null,
  };
}

export const numericMetricKeys = [
  "video",
  "pickups",
  "sleep",
  "reading",
  "focus",
  "energy",
  "moderate",
  "vigorous",
  "light",
  "complex",
  "independent",
  "switches",
  "testMinutes",
  "recall",
] as const;
export type NumericMetric = (typeof numericMetricKeys)[number];
export type MetricSummary = {
  mean: number | null;
  count: number;
  baseline: number | null;
  change: number | null;
  reductionPercent: number | null;
};

/** Explicit manual daily values override session-derived totals, avoiding double counting. */
export function effectiveMetrics(
  data: AppData,
  runId: string,
  day: number,
): Metrics {
  const metrics = {
    ...emptyMetrics(),
    ...data.logs.find((log) => log.runId === runId && log.day === day)?.metrics,
  };
  const sessions = data.sessions.filter(
    (session) =>
      session.runId === runId &&
      session.day === day &&
      session.status === "completed" &&
      session.actualSeconds !== null,
  );
  const focus = sessions.filter((session) => session.category === "focus");
  const reading = sessions.filter((session) => session.category === "reading");
  if (metrics.focus === null && focus.length)
    metrics.focus = Math.max(
      ...focus.map(
        (session) =>
          Math.min(session.longestSegmentSeconds, session.actualSeconds!) / 60,
      ),
    );
  if (metrics.reading === null && reading.length)
    metrics.reading =
      reading.reduce((sum, session) => sum + session.actualSeconds!, 0) / 60;
  if (metrics.recall === null) {
    const run = data.runs.find((item) => item.id === runId);
    if (run) {
      const date = addDays(run.startDate, day - 1);
      const eligibleCards = new Set(
        data.cards
          .filter(
            (card) =>
              card.runId === runId &&
              card.ideas.length === 5 &&
              addDays(card.createdDate, 1) === date,
          )
          .map((card) => card.id),
      );
      const reviews = data.recallReviews.filter(
        (review) =>
          eligibleCards.has(review.cardId) &&
          review.actualDate === date &&
          review.total === 5,
      );
      if (reviews.length)
        metrics.recall =
          reviews.reduce((sum, review) => sum + review.matched, 0) /
          reviews.length;
    }
  }
  return metrics;
}

export function summarize(data: AppData, run: Run, windowEnd?: string) {
  const finalDate = addDays(run.startDate, 29);
  const today = localDate(run.timeZone);
  const endDate =
    windowEnd ??
    (dayNumber(run, today) >= 29 ? finalDate : [today, finalDate].sort()[0]);
  const startDate = addDays(endDate, -6);
  const logs = data.logs.filter(
    (log) =>
      log.runId === run.id && log.date >= startDate && log.date <= endDate,
  );
  const submitted = logs.filter((log) => log.status === "submitted");
  const observedDays = new Set(logs.map((log) => log.day));
  for (const session of data.sessions) {
    if (session.runId !== run.id || session.status !== "completed") continue;
    const date = addDays(run.startDate, session.day - 1);
    if (date >= startDate && date <= endDate) observedDays.add(session.day);
  }
  const runCards = new Set(
    data.cards.filter((card) => card.runId === run.id).map((card) => card.id),
  );
  for (const review of data.recallReviews) {
    if (
      !runCards.has(review.cardId) ||
      review.actualDate < startDate ||
      review.actualDate > endDate
    )
      continue;
    const day = dayNumber(run, review.actualDate);
    if (day >= 1 && day <= 30) observedDays.add(day);
  }
  const metricRows = [...observedDays].map((day) => ({
    day,
    date: addDays(run.startDate, day - 1),
    metrics: effectiveMetrics(data, run.id, day),
  }));
  const weighted = (mode: Mode) => {
    const scores = submitted
      .filter((log) => log.mode === mode)
      .map(scoreLog)
      .filter((score) => score.ratio !== null);
    const denominator = scores.reduce(
      (sum, score) => sum + score.applicable,
      0,
    );
    return denominator
      ? scores.reduce((sum, score) => sum + score.done, 0) / denominator
      : null;
  };
  const metrics = Object.fromEntries(
    numericMetricKeys.map((key) => {
      const comparableLogs =
        key === "switches"
          ? metricRows.filter((log) => log.metrics.testMinutes === 15)
          : metricRows;
      const values = comparableLogs
        .map((log) => log.metrics[key])
        .filter(
          (value): value is number => value !== null && Number.isFinite(value),
        );
      const mean = values.length
        ? values.reduce((sum, value) => sum + value, 0) / values.length
        : null;
      const baseline =
        key === "switches" && run.baseline.testMinutes !== 15
          ? null
          : run.baseline[key];
      const change =
        mean !== null && baseline !== null ? mean - baseline : null;
      return [
        key,
        {
          mean,
          count: values.length,
          baseline,
          change,
          reductionPercent:
            mean !== null && baseline !== null && baseline > 0
              ? ((baseline - mean) / baseline) * 100
              : null,
        },
      ];
    }),
  ) as Record<NumericMetric, MetricSummary>;
  const comparable = metricRows.filter(
    (log) => log.metrics.complex !== null && log.metrics.independent !== null,
  );
  const total = comparable.reduce((sum, log) => sum + log.metrics.complex!, 0);
  const independent = comparable.reduce(
    (sum, log) => sum + log.metrics.independent!,
    0,
  );
  const activityLogs = metricRows.filter(
    (log) => log.metrics.moderate !== null || log.metrics.vigorous !== null,
  );
  const trend = Array.from({ length: 7 }, (_, offset) => {
    const date = addDays(startDate, offset);
    const log = metricRows.find((item) => item.date === date);
    return {
      date,
      day: dayNumber(run, date),
      focus: log?.metrics.focus ?? null,
      reading: log?.metrics.reading ?? null,
      energy: log?.metrics.energy ?? null,
      video: log?.metrics.video ?? null,
    };
  });
  const eligibleDays = trend.filter(
    (item) =>
      item.date >= run.startDate &&
      item.date <= today &&
      item.day >= 1 &&
      item.day <= 30,
  ).length;
  return {
    startDate,
    endDate,
    eligibleDays,
    metricDays: metricRows.filter((row) =>
      Object.values(row.metrics).some((value) => value !== null),
    ).length,
    coverage: logs.length,
    submitted: submitted.length,
    standardDays: submitted.filter((log) => log.mode === "standard").length,
    minimumDays: submitted.filter((log) => log.mode === "minimum").length,
    missingDays: Math.max(0, eligibleDays - logs.length),
    adherence: { standard: weighted("standard"), minimum: weighted("minimum") },
    metrics,
    activity: {
      moderateEquivalent: metricRows.reduce(
        (sum, log) =>
          sum + (log.metrics.moderate ?? 0) + 2 * (log.metrics.vigorous ?? 0),
        0,
      ),
      strengthDays: metricRows.filter((log) => log.metrics.strength === true)
        .length,
      coverage: activityLogs.length,
      moderateCoverage: metricRows.filter(
        (log) => log.metrics.moderate !== null,
      ).length,
      vigorousCoverage: metricRows.filter(
        (log) => log.metrics.vigorous !== null,
      ).length,
      strengthCoverage: metricRows.filter(
        (log) => log.metrics.strength !== null,
      ).length,
    },
    thinking: {
      independent,
      total,
      ratio: total > 0 ? independent / total : null,
    },
    trend,
    missionDone: logs.filter((log) => log.missionDone).length,
  };
}

export function dueReviews(
  data: AppData,
  run: Run,
  today = localDate(run.timeZone),
): { card: RecallCard; dueDate: string }[] {
  const completed = new Set(
    data.recallReviews.map((review) => `${review.cardId}:${review.dueDate}`),
  );
  return data.cards
    .filter((card) => card.runId === run.id && !card.archived)
    .flatMap((card) =>
      card.dueDates
        .filter((date) => date <= today && !completed.has(`${card.id}:${date}`))
        .map((dueDate) => ({ card, dueDate })),
    )
    .sort(
      (a, b) =>
        a.dueDate.localeCompare(b.dueDate) ||
        a.card.source.localeCompare(b.card.source),
    );
}

export function shouldSuggestAdaptation(data: AppData, run: Run): boolean {
  const logs = data.logs
    .filter(
      (log) =>
        log.runId === run.id &&
        log.status === "submitted" &&
        log.mode === "standard",
    )
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 3);
  if (logs.length < 3) return false;
  if (
    data.settings.adaptationDismissedAt &&
    logs[0].updatedAt <= data.settings.adaptationDismissedAt
  )
    return false;
  return logs.every((log) => {
    const score = scoreLog(log);
    return score.ratio !== null && score.ratio < 0.75;
  });
}
