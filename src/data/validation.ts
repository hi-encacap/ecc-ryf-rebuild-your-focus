import { z } from "zod";
import type { AppData } from "../domain/types";

const MAX_BACKUP_BYTES = 10 * 1024 * 1024;
const text = z.string().max(10_000);
const id = z.string().uuid();
const finite = z.number().finite();
const minute = finite.min(0).max(1440);
const seconds = finite.min(0).max(86_400);
const count = finite.int().min(0).max(1_000_000);
const day = finite.int().min(1).max(30);
const date = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .refine((value) => {
    const parsed = new Date(`${value}T00:00:00.000Z`);
    return (
      Number.isFinite(parsed.getTime()) &&
      parsed.toISOString().slice(0, 10) === value
    );
  }, "Ngày không hợp lệ");
const timestamp = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?Z$/)
  .refine((value) => {
    const parsed = new Date(value);
    return (
      Number.isFinite(parsed.getTime()) &&
      parsed.toISOString().slice(0, 19) === value.slice(0, 19)
    );
  }, "Thời gian UTC không hợp lệ");
const timeZone = z
  .string()
  .max(100)
  .refine((value) => {
    try {
      new Intl.DateTimeFormat("en", { timeZone: value });
      return true;
    } catch {
      return false;
    }
  }, "Múi giờ không hợp lệ");
const status = z.enum(["pending", "done", "not_done", "not_applicable"]);
const mode = z.enum(["standard", "minimum"]);
const habitShape = {
  sleep: status,
  video: status,
  focus: status,
  reading: status,
  recall: status,
  thinking: status,
  activity: status,
  reflection: status,
};
const fieldMap = z
  .record(z.string().max(100), text)
  .refine((value) => Object.keys(value).length <= 100, "Quá nhiều trường");
const metrics = z
  .strictObject({
    video: minute.nullable(),
    pickups: count.nullable(),
    sleep: finite.min(0).max(24).nullable(),
    reading: minute.nullable(),
    focus: minute.nullable(),
    energy: finite.min(1).max(10).nullable(),
    moderate: minute.nullable(),
    vigorous: minute.nullable(),
    light: minute.nullable(),
    strength: z.boolean().nullable(),
    complex: count.nullable(),
    independent: count.nullable(),
    switches: count.nullable(),
    testMinutes: minute.nullable(),
    recall: finite.int().min(0).max(5).nullable(),
  })
  .refine(
    (value) =>
      value.independent === null ||
      value.complex === null ||
      value.independent <= value.complex,
    "Số việc tự suy nghĩ không được lớn hơn tổng số việc",
  );
const goals = z.strictObject({
  focus: minute,
  reading: minute,
  thinking: minute,
  sleep: finite.min(0).max(24),
  video: minute.nullable(),
  activity: minute,
});
const run = z.strictObject({
  id,
  programVersion: z.literal("1.0.0"),
  startDate: date,
  timeZone,
  baseline: metrics,
  goals: goals.partial(),
  createdAt: timestamp,
  updatedAt: timestamp,
  baselineUpdatedAt: timestamp.optional(),
  reflectionPrompts: fieldMap.optional(),
  routine: text.optional(),
  maintenance: z.array(text).max(50).optional(),
});
const override = z.strictObject({
  id,
  runId: id,
  effectiveFromDay: day,
  goals: goals.partial(),
  reason: text,
  createdAt: timestamp,
});
const log = z
  .strictObject({
    id,
    runId: id,
    day,
    date,
    mode,
    goals,
    habits: z.strictObject(habitShape),
    habitReasons: z
      .strictObject(
        Object.fromEntries(Object.keys(habitShape).map((key) => [key, text])),
      )
      .partial()
      .optional(),
    metrics,
    missionDone: z.boolean(),
    reflection: text,
    status: z.enum(["draft", "submitted"]),
    backfilled: z.boolean(),
    createdAt: timestamp,
    updatedAt: timestamp,
    modeHistory: z
      .array(z.strictObject({ mode, at: timestamp }))
      .max(1000)
      .optional(),
  })
  .refine(
    (value) =>
      value.status !== "submitted" ||
      (value.mode === "minimum"
        ? ["focus", "reading", "activity", "reflection"]
        : Object.keys(habitShape)
      ).every(
        (key) => value.habits[key as keyof typeof habitShape] !== "pending",
      ),
    "Ngày đã chốt không thể có thói quen đang chờ",
  );
const session = z
  .strictObject({
    id,
    runId: id,
    day,
    category: z.enum(["focus", "reading", "thinking", "rest", "custom"]),
    plannedSeconds: seconds,
    accumulatedSeconds: seconds,
    segmentStartedAt: finite.min(0).max(8.64e15).nullable(),
    startedAt: timestamp,
    endedAt: timestamp.nullable(),
    status: z.enum(["running", "paused", "completed", "cancelled"]),
    interruptions: count,
    longestSegmentSeconds: seconds,
    currentSegmentSeconds: seconds,
    actualSeconds: seconds.nullable(),
    outcome: text,
    needsConfirmation: z.boolean().optional(),
  })
  .refine(
    (value) => value.status !== "running" || value.segmentStartedAt !== null,
    "Phiên đang chạy thiếu thời gian bắt đầu",
  )
  .refine(
    (value) =>
      value.status !== "completed" ||
      (value.actualSeconds !== null && value.endedAt !== null),
    "Phiên hoàn tất thiếu thời lượng xác nhận",
  );
const journal = z.strictObject({
  id,
  runId: id,
  day,
  type: z.enum(["note", "thinking"]),
  title: text,
  text,
  fields: fieldMap.optional(),
  createdAt: timestamp,
  updatedAt: timestamp,
});
const safeLink = z
  .string()
  .max(2048)
  .refine((value) => {
    if (value === "") return true;
    try {
      return ["http:", "https:"].includes(new URL(value).protocol);
    } catch {
      return false;
    }
  }, "Liên kết chỉ được dùng http hoặc https");
const card = z.strictObject({
  id,
  runId: id,
  source: text,
  link: safeLink,
  ideas: z.array(text.min(1)).min(1).max(5),
  createdDate: date,
  dueDates: z.array(date).max(100),
  archived: z.boolean(),
});
const recallReview = z
  .strictObject({
    id,
    cardId: id,
    dueDate: date,
    actualDate: date,
    response: text,
    matched: finite.int().min(0).max(5),
    total: finite.int().min(1).max(5),
    createdAt: timestamp,
  })
  .refine(
    (value) => value.matched <= value.total,
    "Số ý nhớ được vượt tổng số ý",
  );
const review = z.strictObject({
  id,
  runId: id,
  day,
  fields: fieldMap,
  updatedAt: timestamp,
});
const appSchema = z.strictObject({
  schemaVersion: z.literal(1),
  activeRunId: id.nullable(),
  runs: z.array(run).max(1000),
  overrides: z.array(override).max(30_000),
  logs: z.array(log).max(30_000),
  sessions: z.array(session).max(100_000),
  journal: z.array(journal).max(100_000),
  cards: z.array(card).max(100_000),
  recallReviews: z.array(recallReview).max(400_000),
  reviews: z.array(review).max(30_000),
  settings: z.strictObject({
    displayTimeZone: timeZone,
    lastBackupAt: timestamp.nullable(),
    adaptationDismissedAt: timestamp.nullable(),
  }),
});

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}
function unique<T>(items: T[], key: (item: T) => string, label: string) {
  assert(
    new Set(items.map(key)).size === items.length,
    `${label}: có bản ghi bị trùng.`,
  );
}
function calendarDate(start: string, offset: number) {
  const value = new Date(`${start}T00:00:00.000Z`);
  value.setUTCDate(value.getUTCDate() + offset);
  return value.toISOString().slice(0, 10);
}

/** Validate complete state before any import or atomic persisted mutation. */
export function validateData(value: unknown): AppData {
  const parsed = appSchema.safeParse(value);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    throw new Error(
      `Dữ liệu không hợp lệ tại ${issue.path.join(".") || "gốc"}: ${issue.message}`,
    );
  }
  const data = parsed.data as AppData;
  const collections = [
    data.runs,
    data.overrides,
    data.logs,
    data.sessions,
    data.journal,
    data.cards,
    data.recallReviews,
    data.reviews,
  ];
  for (const collection of collections)
    unique(collection as { id: string }[], (item) => item.id, "ID");
  const runs = new Map(data.runs.map((item) => [item.id, item]));
  assert(
    data.activeRunId === null || runs.has(data.activeRunId),
    "Hành trình hiện tại không tồn tại.",
  );
  for (const collection of [
    data.overrides,
    data.logs,
    data.sessions,
    data.journal,
    data.cards,
    data.reviews,
  ]) {
    for (const item of collection)
      assert(
        runs.has(item.runId),
        "Bản ghi tham chiếu đến hành trình không tồn tại.",
      );
  }
  unique(data.logs, (item) => `${item.runId}:${item.day}`, "Nhật ký ngày");
  unique(data.reviews, (item) => `${item.runId}:${item.day}`, "Tổng kết");
  unique(
    data.recallReviews,
    (item) => `${item.cardId}:${item.dueDate}`,
    "Lần ôn tập",
  );
  for (const item of data.logs)
    assert(
      item.date === calendarDate(runs.get(item.runId)!.startDate, item.day - 1),
      "Ngày ghi chép không khớp lịch hành trình.",
    );
  const cards = new Map(data.cards.map((item) => [item.id, item]));
  for (const item of data.cards) {
    unique(item.dueDates, (value) => value, "Ngày ôn tập");
    assert(
      item.dueDates.every((value) => value > item.createdDate),
      "Ngày ôn tập phải sau ngày tạo thẻ.",
    );
  }
  for (const item of data.recallReviews) {
    const source = cards.get(item.cardId);
    assert(source, "Lần ôn tập tham chiếu thẻ không tồn tại.");
    assert(
      source.dueDates.includes(item.dueDate),
      "Lần ôn tập không thuộc lịch của thẻ.",
    );
    assert(item.total === source.ideas.length, "Tổng số ý không khớp thẻ.");
  }
  assert(
    data.sessions.filter(
      (item) => item.status === "running" || item.status === "paused",
    ).length <= 1,
    "Đã có một phiên đang chạy trên thiết bị này.",
  );
  return data;
}

export function validateBackup(source: string): AppData {
  assert(
    new TextEncoder().encode(source).byteLength <= MAX_BACKUP_BYTES,
    "Bản sao lưu vượt quá giới hạn 10 MB.",
  );
  let envelope: unknown;
  try {
    envelope = JSON.parse(source);
  } catch {
    throw new Error("Không thể đọc JSON. Hãy chọn bản sao lưu ReMind hợp lệ.");
  }
  assert(
    envelope !== null && typeof envelope === "object",
    "Bản sao lưu không hợp lệ.",
  );
  const candidate = envelope as Record<string, unknown>;
  assert(
    candidate.format === "remind-backup",
    "Đây không phải bản sao lưu ReMind.",
  );
  assert(
    candidate.schemaVersion === 1,
    "Phiên bản sao lưu chưa được hỗ trợ. Hãy cập nhật ReMind trước khi nhập.",
  );
  assert(
    timestamp.safeParse(candidate.exportedAt).success,
    "Thời gian xuất bản sao lưu không hợp lệ.",
  );
  return validateData(candidate.data);
}
