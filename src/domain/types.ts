export type HabitStatus = "pending" | "done" | "not_done" | "not_applicable";
export type HabitKey =
  | "sleep"
  | "video"
  | "focus"
  | "reading"
  | "recall"
  | "thinking"
  | "activity"
  | "reflection";
export type Mode = "standard" | "minimum";
export type Metrics = {
  video: number | null;
  pickups: number | null;
  sleep: number | null;
  reading: number | null;
  focus: number | null;
  energy: number | null;
  moderate: number | null;
  vigorous: number | null;
  light: number | null;
  strength: boolean | null;
  complex: number | null;
  independent: number | null;
  switches: number | null;
  testMinutes: number | null;
  recall: number | null;
};
export type Goals = {
  focus: number;
  reading: number;
  thinking: number;
  sleep: number;
  video: number | null;
  activity: number;
};
export type Run = {
  id: string;
  programVersion: string;
  startDate: string;
  timeZone: string;
  baseline: Metrics;
  goals: Partial<Goals>;
  createdAt: string;
  updatedAt: string;
  baselineUpdatedAt?: string;
  reflectionPrompts?: Record<string, string>;
  routine?: string;
  maintenance?: string[];
};
export type GoalOverride = {
  id: string;
  runId: string;
  effectiveFromDay: number;
  goals: Partial<Goals>;
  reason: string;
  createdAt: string;
};
export type DailyLog = {
  id: string;
  runId: string;
  day: number;
  date: string;
  mode: Mode;
  goals: Goals;
  habits: Record<HabitKey, HabitStatus>;
  habitReasons?: Partial<Record<HabitKey, string>>;
  metrics: Metrics;
  missionDone: boolean;
  reflection: string;
  status: "draft" | "submitted";
  backfilled: boolean;
  createdAt: string;
  updatedAt: string;
  modeHistory?: { mode: Mode; at: string }[];
};
export type FocusSession = {
  id: string;
  runId: string;
  day: number;
  category: "focus" | "reading" | "thinking" | "rest" | "custom";
  plannedSeconds: number;
  accumulatedSeconds: number;
  segmentStartedAt: number | null;
  startedAt: string;
  endedAt: string | null;
  status: "running" | "paused" | "completed" | "cancelled";
  interruptions: number;
  longestSegmentSeconds: number;
  currentSegmentSeconds: number;
  actualSeconds: number | null;
  outcome: string;
  needsConfirmation?: boolean;
};
export type JournalEntry = {
  id: string;
  runId: string;
  day: number;
  type: "note" | "thinking";
  title: string;
  text: string;
  fields?: Record<string, string>;
  createdAt: string;
  updatedAt: string;
};
export type RecallCard = {
  id: string;
  runId: string;
  source: string;
  link: string;
  ideas: string[];
  createdDate: string;
  dueDates: string[];
  archived: boolean;
};
export type RecallReview = {
  id: string;
  cardId: string;
  dueDate: string;
  actualDate: string;
  response: string;
  matched: number;
  total: number;
  createdAt: string;
};
export type Review = {
  id: string;
  runId: string;
  day: number;
  fields: Record<string, string>;
  updatedAt: string;
};
export type AppData = {
  schemaVersion: 1;
  activeRunId: string | null;
  runs: Run[];
  overrides: GoalOverride[];
  logs: DailyLog[];
  sessions: FocusSession[];
  journal: JournalEntry[];
  cards: RecallCard[];
  recallReviews: RecallReview[];
  reviews: Review[];
  settings: {
    displayTimeZone: string;
    lastBackupAt: string | null;
    adaptationDismissedAt: string | null;
  };
};
