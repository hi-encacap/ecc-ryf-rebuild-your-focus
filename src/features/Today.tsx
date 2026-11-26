import sproutIllustration from "../assets/remind-sprout.webp";
import { useEffect, useRef, useState } from "react";
import {
  Sun,
  Play,
  Check,
  ChevronLeft,
  ChevronRight,
  Plus,
  Leaf,
  Moon,
  Smartphone,
  Focus,
  BookOpen,
  Brain,
  Lightbulb,
  Footprints,
  PenLine,
  CheckCheck,
  SlidersHorizontal,
  CalendarDays,
  Sparkles,
} from "lucide-react";
import { Button } from "../components/ui/button";
import { Textarea } from "../components/ui/textarea";
import { Dialog, DialogContent } from "../components/ui/dialog";
import { Input } from "../components/ui/input";
import { updateData } from "../data/store";
import {
  addDays,
  program,
  phaseForDay,
  makeLog,
  habitKeys,
  scoreLog,
  dueReviews,
  effectiveMetrics,
  shouldSuggestAdaptation,
  goalsForDay,
} from "../domain/model";
import type {
  AppData,
  Run,
  DailyLog,
  HabitKey,
  Metrics,
  HabitStatus,
} from "../domain/types";
import { MetricsFields, metricFields } from "./Onboarding";
import { perform } from "../App";
const habitInfo = {
  sleep: { label: "Ngủ đủ, nghỉ tốt", icon: Moon, color: "lavender" },
  video: { label: "Lướt có chủ đích", icon: Smartphone, color: "blue" },
  focus: { label: "Tập trung sâu", icon: Focus, color: "sage" },
  reading: { label: "Đọc chậm một chút", icon: BookOpen, color: "peach" },
  recall: { label: "Nhớ lại điều đã học", icon: Brain, color: "lavender" },
  thinking: {
    label: "Suy nghĩ trước khi hỏi AI",
    icon: Lightbulb,
    color: "peach",
  },
  activity: {
    label: "Cho cơ thể chuyển động",
    icon: Footprints,
    color: "sage",
  },
  reflection: { label: "Nhìn lại ngày hôm nay", icon: PenLine, color: "blue" },
};
const allMetrics = [
  ...metricFields,
  {
    key: "light" as const,
    label: "Vận động nhẹ / đi bộ",
    unit: "phút",
    max: 1440,
  },
  { key: "moderate" as const, label: "Vận động vừa", unit: "phút", max: 1440 },
  { key: "vigorous" as const, label: "Vận động mạnh", unit: "phút", max: 1440 },
  { key: "complex" as const, label: "Việc phức tạp", unit: "việc", max: 10000 },
  {
    key: "independent" as const,
    label: "Đã tự nghĩ trước khi hỏi AI",
    unit: "việc",
    max: 10000,
  },
  {
    key: "testMinutes" as const,
    label: "Thời lượng bài kiểm tra chuyển việc",
    unit: "phút",
    max: 1440,
  },
];
export function Today({
  data,
  run,
  day,
  actualDay,
  openTools,
  openProgram,
  onDay,
  onNewRun,
}: {
  data: AppData;
  run: Run;
  day: number;
  actualDay: number;
  openTools: (tab: "focus" | "journal" | "recall" | "thinking") => void;
  openProgram: () => void;
  onDay: (day: number | null) => void;
  onNewRun: () => void;
}) {
  const stored = data.logs.find((l) => l.runId === run.id && l.day === day);
  const log = stored ?? makeLog(run, day, data.overrides);
  const mission = program.days[day - 1];
  const phase = phaseForDay(day);
  const readOnly = day > actualDay;
  const minimum = log.mode === "minimum";
  const keys = habitKeys(log.mode);
  const score = scoreLog(log);
  const metrics = effectiveMetrics(data, run.id, day);
  const [reflection, setReflection] = useState(log.reflection);
  const [metricsOpen, setMetricsOpen] = useState(false);
  const [metricDraft, setMetricDraft] = useState<Metrics>(log.metrics);
  const [finishOpen, setFinishOpen] = useState(false);
  const [modeOpen, setModeOpen] = useState(false);
  const [missionOpen, setMissionOpen] = useState(false);
  const [reviewDraft, setReviewDraft] = useState(
    data.reviews.find((r) => r.runId === run.id && r.day === day)?.fields ?? {},
  );
  const targetFocus = minimum ? 10 : log.goals.focus,
    targetReading = minimum ? 5 : log.goals.reading;
  const reflectionDirty = useRef(false);
  const reviewDirty = useRef(false);
  const reflectionValue = useRef(reflection);
  reflectionValue.current = reflection;
  useEffect(() => {
    if (!reflectionDirty.current) setReflection(stored?.reflection ?? "");
  }, [stored?.reflection]);
  const persistedReview = data.reviews.find(
    (r) => r.runId === run.id && r.day === day,
  );
  useEffect(() => {
    if (!reviewDirty.current) setReviewDraft(persistedReview?.fields ?? {});
  }, [persistedReview?.updatedAt]);
  const save = (mutate: (l: DailyLog) => void) =>
    perform(() =>
      updateData((d) => {
        if (readOnly) throw new Error("Ngày tương lai chỉ để xem trước.");
        let entry = d.logs.find((l) => l.runId === run.id && l.day === day);
        if (!entry) {
          entry = makeLog(run, day, d.overrides);
          d.logs.push(entry);
        }
        mutate(entry);
        entry.updatedAt = new Date().toISOString();
      }),
    );
  const persistReflection = (value: string) =>
    save((l) => {
      l.reflection = value;
    }).then((ok) => {
      if (ok && reflectionValue.current === value)
        reflectionDirty.current = false;
    });
  useEffect(() => {
    if (!reflectionDirty.current || readOnly) return;
    const timer = setTimeout(() => {
      void persistReflection(reflection);
    }, 450);
    return () => clearTimeout(timer);
  }, [reflection]);
  const setHabit = (key: HabitKey, status: HabitStatus) =>
    save((l) => {
      l.habits[key] = status;
      l.status = "draft";
    });
  function subtitle(k: HabitKey) {
    if (k === "sleep") return `${log.goals.sleep} giờ mỗi đêm`;
    if (k === "video")
      return log.goals.video === null
        ? "Chưa đặt giới hạn"
        : `Không quá ${log.goals.video} phút`;
    if (k === "focus") return `${targetFocus} phút · một việc cụ thể`;
    if (k === "reading") return `${targetReading} phút · không cần vội`;
    if (k === "recall") return "Thử nhớ trước khi xem lại";
    if (k === "thinking")
      return `${log.goals.thinking} phút trước việc phức tạp`;
    if (k === "activity")
      return `${minimum ? 10 : log.goals.activity} phút · theo sức của bạn`;
    return minimum ? "2 phút dành cho chính mình" : "Ghi lại một điều đọng lại";
  }
  function suggested(k: HabitKey) {
    return k === "sleep"
      ? metrics.sleep !== null && metrics.sleep >= log.goals.sleep
      : k === "video"
        ? metrics.video !== null &&
          log.goals.video !== null &&
          metrics.video <= log.goals.video
        : k === "focus"
          ? metrics.focus !== null && metrics.focus >= targetFocus
          : k === "reading"
            ? metrics.reading !== null && metrics.reading >= targetReading
            : k === "thinking"
              ? metrics.complex !== null &&
                metrics.complex > 0 &&
                metrics.independent === metrics.complex
              : k === "activity"
                ? [metrics.light, metrics.moderate, metrics.vigorous].some(
                    (x) => x !== null,
                  ) &&
                  (metrics.light ?? 0) +
                    (metrics.moderate ?? 0) +
                    (metrics.vigorous ?? 0) >=
                    (minimum ? 10 : log.goals.activity)
                : false;
  }
  async function switchMode() {
    const ok = await save((l) => {
      l.mode = l.mode === "standard" ? "minimum" : "standard";
      l.modeHistory = [
        ...(l.modeHistory ?? []),
        { mode: l.mode, at: new Date().toISOString() },
      ];
      for (const key of ["focus", "reading", "activity", "reflection"] as const)
        l.habits[key] = "pending";
      l.status = "draft";
    });
    if (ok) setModeOpen(false);
  }
  async function submitDay(markPending = false) {
    const ok = await save((l) => {
      l.reflection = reflection;
      if (markPending)
        for (const k of habitKeys(l.mode))
          if (l.habits[k] === "pending") l.habits[k] = "not_done";
      l.status = "submitted";
    });
    if (ok) {
      reflectionDirty.current = false;
      setFinishOpen(false);
    }
  }
  const date = addDays(run.startDate, day - 1);
  const due = dueReviews(data, run).length;
  return (
    <>
      <div className="page-header">
        <div>
          <div className="eyebrow">
            <Sun size={15} /> MỖI NGÀY MỘT CHÚT
          </div>
          <h1>
            {stored?.status === "submitted"
              ? "Hôm nay đủ rồi."
              : readOnly
                ? "Một chút cho ngày sắp tới."
                : "Hôm nay, dành chỗ cho điều quan trọng."}
          </h1>
          <p className="muted">
            {stored?.status === "submitted"
              ? "Khép lại màn hình. Dành thời gian cho cuộc sống của bạn."
              : "Không cần làm tất cả. Chỉ cần hiện diện với việc đang làm."}
          </p>
        </div>
        <Button
          variant={minimum ? "secondary" : "outline"}
          onClick={() => setModeOpen(true)}
          disabled={readOnly}
        >
          <Leaf size={17} />
          {minimum ? "Đang ở ngày nhẹ" : "Hôm nay cần nhẹ hơn"}
        </Button>
      </div>
      {actualDay > 30 && (
        <div className="notice row">
          <div>
            <strong>Bạn đã đi hết 30 ngày.</strong>
            <p>
              Giữ những thói quen phù hợp, xem lại tiến triển hoặc bắt đầu một
              hành trình mới. Dữ liệu cũ vẫn được giữ.
            </p>
          </div>
          <Button onClick={onNewRun}>Hành trình mới</Button>
        </div>
      )}
      {readOnly && (
        <div className="notice">
          Đây là bản xem trước ngày {date.split("-").reverse().join("/")}. Bạn
          có thể ghi chép khi ngày này bắt đầu.
        </div>
      )}
      {day < actualDay && actualDay <= 30 && (
        <div className="notice row">
          <span>
            Đang xem ngày {day}. Ghi chép mới ở đây được đánh dấu bổ sung.
          </span>
          <Button variant="ghost" onClick={() => onDay(null)}>
            Về hôm nay
          </Button>
        </div>
      )}
      <div className="journey-strip">
        <div className="journey-label">
          <span className="tiny-sprout">
            <SproutIcon />
          </span>
          <div>
            <strong>
              Ngày {day} <span>/ 30</span>
            </strong>
            <p>{phase.title}</p>
          </div>
        </div>
        <div className="week-days">
          {Array.from({ length: 7 }, (_, i) => {
            const n = Math.floor((day - 1) / 7) * 7 + i + 1;
            if (n > 30) return null;
            const d = data.logs.find((x) => x.runId === run.id && x.day === n);
            return (
              <button
                key={n}
                onClick={() => onDay(n)}
                className={`${n === day ? "selected" : ""} ${d?.status === "submitted" ? "complete" : ""}`}
                aria-label={`Xem ngày ${n}`}
              >
                <span>N{n}</span>
                <b>
                  {d?.status === "submitted" ? (
                    <Check size={16} />
                  ) : (
                    new Date(
                      addDays(run.startDate, n - 1) + "T12:00:00Z",
                    ).getUTCDate()
                  )}
                </b>
              </button>
            );
          })}
        </div>
        <Button
          variant="ghost"
          size="icon"
          aria-label="Xem hành trình"
          onClick={openProgram}
        >
          <ChevronRight size={20} />
        </Button>
      </div>
      <div className="today-grid">
        <div className="today-primary">
          <section className="focus-hero">
            <div className="hero-copy">
              <span className="eyebrow">
                {minimum ? "NHẸ NHÀNG VẪN LÀ TIẾN BỘ" : "MỘT KHOẢNG TẬP TRUNG"}
              </span>
              <h2>
                Một việc.
                <br />
                Trọn vẹn.
              </h2>
              <p>
                Cất những xao nhãng sang bên.
                <br />
                Bắt đầu với {targetFocus} phút cho điều bạn chọn.
              </p>
              <Button onClick={() => openTools("focus")} disabled={readOnly}>
                <Play size={16} fill="currentColor" /> Bắt đầu tập trung{" "}
                <span className="button-divider" />
                {targetFocus} phút
              </Button>
              <span className="hero-footnote">
                Một khoảng nghỉ nhỏ sau mỗi phiên.
              </span>
            </div>
            <img
              src={sproutIllustration}
              alt="Mầm cây và đá cân bằng"
              className="hero-art"
            />
          </section>
          <section className="card mission-card">
            <div className="section-heading">
              <div className="eyebrow">
                <Sparkles size={15} /> MỘT VIỆC CỦA HÔM NAY
              </div>
              <span className="badge">Ngày {day}</span>
            </div>
            <div className="mission-main">
              <div className="mission-icon">
                <Lightbulb size={25} />
              </div>
              <div>
                <h3>
                  {mission.title === "Đo baseline"
                    ? "Hiểu điểm xuất phát của bạn"
                    : mission.title}
                </h3>
                <p>{mission.why}</p>
              </div>
            </div>
            <div className="mission-actions">
              <Button variant="ghost" onClick={() => setMissionOpen(true)}>
                Xem hướng dẫn <ChevronRight size={16} />
              </Button>
              <button
                className={`text-check ${log.missionDone ? "checked" : ""}`}
                onClick={() =>
                  save((l) => {
                    l.missionDone = !l.missionDone;
                  })
                }
                disabled={readOnly}
              >
                <span>{log.missionDone && <Check size={13} />}</span>
                {log.missionDone ? "Đã thực hiện" : "Đánh dấu đã làm"}
              </button>
            </div>
          </section>
          <section className="card habits-card">
            <div className="section-heading">
              <div>
                <h2>Những điều nhỏ, mỗi ngày</h2>
                <p className="muted small">
                  {minimum
                    ? "4 việc vừa sức. Không cần làm bù."
                    : "Thói quen phục vụ bạn, không phải ngược lại."}
                </p>
              </div>
              <span className="count-badge">
                {score.done}/{score.applicable}
              </span>
            </div>
            <div className="habit-list">
              {keys.map((k) => {
                const info = habitInfo[k];
                const Icon = info.icon;
                return (
                  <div
                    className={`habit-row ${log.habits[k] === "done" ? "is-done" : ""}`}
                    key={k}
                  >
                    <button
                      className={`habit-check ${log.habits[k] === "done" ? "checked" : ""}`}
                      aria-label={`${log.habits[k] === "done" ? "Bỏ hoàn thành" : "Hoàn thành"} ${info.label}`}
                      onClick={() =>
                        setHabit(
                          k,
                          log.habits[k] === "done" ? "pending" : "done",
                        )
                      }
                      disabled={readOnly}
                    >
                      {log.habits[k] === "done" ? (
                        <Check size={17} />
                      ) : log.habits[k] === "not_applicable" ? (
                        <span>–</span>
                      ) : null}
                    </button>
                    <span className={`habit-icon ${info.color}`}>
                      <Icon size={19} />
                    </span>
                    <div className="habit-text">
                      <strong>{info.label}</strong>
                      <span>{subtitle(k)}</span>
                      {suggested(k) && log.habits[k] !== "done" && (
                        <button
                          className="suggestion-link"
                          onClick={() => setHabit(k, "done")}
                          disabled={readOnly}
                        >
                          Đã đạt số đo · xác nhận hoàn thành
                        </button>
                      )}
                    </div>
                    <select
                      aria-label={`Trạng thái ${info.label}`}
                      value={log.habits[k]}
                      disabled={readOnly}
                      onChange={(e) =>
                        setHabit(k, e.target.value as HabitStatus)
                      }
                    >
                      <option value="pending">Chưa ghi</option>
                      <option value="done">Đã làm</option>
                      <option value="not_done">Chưa làm</option>
                      <option value="not_applicable">Không áp dụng</option>
                    </select>
                  </div>
                );
              })}
            </div>
            <p className="small muted habits-note">
              Không có việc phức tạp hoặc hôm nay cần nghỉ? Chọn “Không áp
              dụng”.
            </p>
          </section>
        </div>
        <aside className="today-secondary">
          <section className="card checkin-card">
            <div className="section-heading">
              <h2>Một chút ghi nhận</h2>
              <span className="icon-tile small-tile">
                <SlidersHorizontal size={17} />
              </span>
            </div>
            <p className="muted small">Số liệu thực tế, không phán xét.</p>
            <div className="quick-metrics">
              {[
                ["sleep", "Ngủ đêm qua", "giờ", Moon],
                ["focus", "Tập trung lâu nhất", "phút", Focus],
                ["reading", "Đã đọc", "phút", BookOpen],
                ["video", "Video ngắn", "phút", Smartphone],
              ].map(([key, label, unit, Icon]) => {
                const I = Icon as typeof Moon;
                const value = metrics[key as keyof Metrics];
                return (
                  <div key={String(key)}>
                    <I size={17} />
                    <span>{String(label)}</span>
                    <strong>
                      {value === null
                        ? "—"
                        : Number(value).toLocaleString("vi-VN", {
                            maximumFractionDigits: 1,
                          })}{" "}
                      <small>{String(unit)}</small>
                    </strong>
                  </div>
                );
              })}
            </div>
            <Button
              className="wide"
              variant="outline"
              onClick={() => {
                setMetricDraft(log.metrics);
                setMetricsOpen(true);
              }}
              disabled={readOnly}
            >
              <Plus size={16} /> Ghi nhanh hôm nay
            </Button>
            <span className="tiny-note">
              Tự nhập hoặc từ phiên tập trung đã xác nhận.
            </span>
          </section>
          <section className="card reflection-card">
            <div className="section-heading">
              <h2>Một điều đọng lại</h2>
              <PenLine size={18} />
            </div>
            <p className="muted small">
              Hôm nay điều gì giúp bạn có mặt trọn vẹn hơn?
            </p>
            <Textarea
              placeholder="Có thể chỉ là một câu…"
              value={reflection}
              maxLength={10000}
              disabled={readOnly}
              onChange={(e) => {
                reflectionDirty.current = true;
                setReflection(e.target.value);
              }}
              onBlur={() => {
                if (reflection !== log.reflection)
                  void persistReflection(reflection);
              }}
            />
            <div className="reflection-footer">
              <span className="small muted">
                {reflection === log.reflection
                  ? "Đã lưu trên thiết bị"
                  : "Đang tự lưu…"}
              </span>
              <button
                onClick={() => openTools("journal")}
                className="text-link"
                disabled={readOnly}
              >
                Nhật ký <ChevronRight size={14} />
              </button>
            </div>
          </section>
          <button
            className="recall-shortcut"
            onClick={() => openTools("recall")}
            disabled={readOnly}
          >
            <span className="icon-tile lavender">
              <Brain size={22} />
            </span>
            <span>
              <strong>
                {due > 0
                  ? `${Math.min(due, 3)} lượt nhớ lại đang chờ`
                  : "Cho kiến thức được ở lại"}
              </strong>
              <small>
                {due > 0
                  ? "Một lượt cũng đã đủ tốt."
                  : "Tạo thẻ nhớ lại đầu tiên của bạn."}
              </small>
            </span>
            <ChevronRight size={18} />
          </button>
          <div className="gentle-note">
            <Leaf size={20} />
            <p>
              “Bạn không cần một ngày hoàn hảo.
              <br />
              Chỉ cần một ngày có chủ đích.”
            </p>
          </div>
        </aside>
      </div>
      {shouldSuggestAdaptation(data, run) && !readOnly && actualDay <= 30 && (
        <div className="notice row">
          <div>
            <strong>Có lẽ mình cần một nhịp nhẹ hơn.</strong>
            <p>
              Ba ngày đã ghi gần nhất có mức hoàn thành dưới 75%. Bạn có thể
              giảm mục tiêu 25%; ngày đã ghi sẽ được giữ nguyên.
            </p>
          </div>
          <Button
            variant="outline"
            onClick={() =>
              perform(() =>
                updateData((d) => {
                  d.settings.adaptationDismissedAt = new Date().toISOString();
                }),
              )
            }
          >
            Giữ nhịp hiện tại
          </Button>
          <Button
            onClick={() =>
              perform(
                () =>
                  updateData((d) => {
                    const g = goalsForDay(
                      run,
                      Math.max(1, actualDay),
                      d.overrides,
                    );
                    d.overrides.push({
                      id: crypto.randomUUID(),
                      runId: run.id,
                      effectiveFromDay: Math.max(1, actualDay),
                      goals: {
                        focus: Math.max(1, Math.round(g.focus * 0.75)),
                        reading: Math.max(1, Math.round(g.reading * 0.75)),
                        thinking: Math.max(1, Math.round(g.thinking * 0.75)),
                        activity: Math.max(1, Math.round(g.activity * 0.75)),
                      },
                      reason: "Điều chỉnh nhẹ hơn 25%",
                      createdAt: new Date().toISOString(),
                    });
                    d.settings.adaptationDismissedAt = new Date().toISOString();
                  }),
                "Đã điều chỉnh cho những ngày chưa có ghi chép.",
              )
            }
          >
            Giảm nhẹ mục tiêu
          </Button>
        </div>
      )}
      {mission.reviewType && (
        <section className="card weekly-review">
          <div className="section-heading">
            <h2>
              {day === 30 ? "Giữ lại điều có ích" : "Một khoảng nhìn lại"}
            </h2>
            <span className="badge">
              {day === 30 ? "Tổng kết 30 ngày" : "Review"}
            </span>
          </div>
          <div className="field-grid">
            {[
              "Điều gì đã tốt hơn?",
              "Điều gì khó và tác nhân nào đáng chú ý?",
              "Mục tiêu nào cần điều chỉnh?",
              "Một thay đổi cho tuần tới / lịch duy trì",
            ].map((label, i) => (
              <label className="field" key={label}>
                {label}
                <Textarea
                  value={reviewDraft[i] ?? ""}
                  onChange={(e) => {
                    reviewDirty.current = true;
                    setReviewDraft({ ...reviewDraft, [i]: e.target.value });
                  }}
                  maxLength={10000}
                  disabled={readOnly}
                />
              </label>
            ))}
          </div>
          {day === 30 && (
            <label className="field">
              3–5 thói quen muốn giữ (mỗi dòng một thói quen)
              <Textarea
                value={reviewDraft.maintenance ?? ""}
                onChange={(e) => {
                  reviewDirty.current = true;
                  setReviewDraft({
                    ...reviewDraft,
                    maintenance: e.target.value,
                  });
                }}
                maxLength={2000}
              />
            </label>
          )}
          <Button
            disabled={readOnly}
            onClick={() =>
              perform(
                () =>
                  updateData((d) => {
                    const r = d.reviews.find(
                      (x) => x.runId === run.id && x.day === day,
                    );
                    if (r) {
                      r.fields = reviewDraft;
                      r.updatedAt = new Date().toISOString();
                    } else
                      d.reviews.push({
                        id: crypto.randomUUID(),
                        runId: run.id,
                        day,
                        fields: reviewDraft,
                        updatedAt: new Date().toISOString(),
                      });
                    if (day === 30) {
                      const rr = d.runs.find((x) => x.id === run.id)!;
                      rr.maintenance = (reviewDraft.maintenance ?? "")
                        .split("\n")
                        .filter(Boolean)
                        .slice(0, 5);
                    }
                  }),
                "Đã lưu khoảng nhìn lại.",
              )
            }
          >
            Lưu review
          </Button>
        </section>
      )}
      <div className="finish-day">
        <div>
          <strong>
            {log.status === "submitted"
              ? "Đã khép lại ngày này."
              : minimum
                ? "Một ngày nhẹ, vẫn có ý nghĩa."
                : "Đã làm đủ cho hôm nay?"}
          </strong>
          <p>
            {log.status === "submitted"
              ? `Đã làm ${score.done}/${score.applicable} việc áp dụng${score.ratio === null ? " · Chưa có tỷ lệ để tính" : ""}. Bạn luôn có thể sửa lại.`
              : "Bản nháp tự lưu. Bạn chọn lúc khép lại ngày."}
          </p>
        </div>
        {log.status === "submitted" ? (
          <Button
            variant="outline"
            onClick={() =>
              save((l) => {
                l.status = "draft";
              })
            }
          >
            Mở lại ngày
          </Button>
        ) : (
          <Button
            disabled={readOnly}
            onClick={() =>
              keys.some((k) => log.habits[k] === "pending")
                ? setFinishOpen(true)
                : void submitDay()
            }
          >
            <CheckCheck size={18} /> Khép lại hôm nay
          </Button>
        )}
      </div>
      <Dialog open={metricsOpen} onOpenChange={setMetricsOpen}>
        <DialogContent
          title="Ghi nhanh hôm nay"
          description="Để trống nếu chưa biết. Số 0 nghĩa là bạn đã quan sát và thực tế bằng 0."
        >
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void save((l) => {
                l.metrics = metricDraft;
              }).then((ok) => {
                if (ok) setMetricsOpen(false);
              });
            }}
          >
            <p className="notice small">
              Phút đọc / tập trung nhập ở đây là tổng thực tế thay thế số từ
              timer, không cộng thêm. Xóa giá trị để dùng lại số từ các phiên.
            </p>
            <MetricsFields
              values={metricDraft}
              setValues={setMetricDraft}
              fields={allMetrics}
            />
            <label className="field">
              Tập sức mạnh hôm nay
              <select
                value={
                  metricDraft.strength === null
                    ? "unknown"
                    : String(metricDraft.strength)
                }
                onChange={(e) =>
                  setMetricDraft({
                    ...metricDraft,
                    strength:
                      e.target.value === "unknown"
                        ? null
                        : e.target.value === "true",
                  })
                }
              >
                <option value="unknown">Chưa ghi</option>
                <option value="true">Có</option>
                <option value="false">Không</option>
              </select>
            </label>
            <Button type="submit" className="wide">
              Lưu ghi nhận
            </Button>
          </form>
        </DialogContent>
      </Dialog>
      <Dialog open={finishOpen} onOpenChange={setFinishOpen}>
        <DialogContent
          title="Khép lại ngày theo cách của bạn"
          description="Một vài thói quen chưa được ghi nhận. Bạn muốn đánh dấu chúng là chưa làm, hay giữ bản nháp để quay lại sau?"
        >
          <div className="stack">
            <Button onClick={() => submitDay(true)}>
              Đánh dấu chưa làm và khép lại
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                void save((l) => {
                  l.reflection = reflection;
                });
                setFinishOpen(false);
              }}
            >
              Giữ bản nháp
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      <Dialog open={modeOpen} onOpenChange={setModeOpen}>
        <DialogContent
          title={
            minimum ? "Quay về nhịp tiêu chuẩn?" : "Hôm nay, nhẹ nhàng thôi."
          }
          description="Ngày nhẹ gồm 10 phút tập trung, 5 phút đọc, 10 phút đi bộ nếu phù hợp và 2 phút nhìn lại. Ưu tiên giấc ngủ."
        >
          <p>
            Đổi chế độ giữ nguyên số liệu, nhưng đặt lại trạng thái của 4 việc
            này để bạn xác nhận theo mục tiêu mới.
          </p>
          <div className="form-actions">
            <Button variant="ghost" onClick={() => setModeOpen(false)}>
              Giữ hiện tại
            </Button>
            <Button onClick={switchMode}>
              {minimum ? "Về ngày tiêu chuẩn" : "Chọn ngày nhẹ"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      <Dialog open={missionOpen} onOpenChange={setMissionOpen}>
        <DialogContent title={mission.title} description={mission.why}>
          <ol className="mission-steps">
            {mission.steps.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ol>
          <div className="notice">
            <strong>Điều mang theo</strong>
            <p>{mission.outcome}</p>
          </div>
          <Button className="wide" onClick={() => setMissionOpen(false)}>
            Mình hiểu rồi
          </Button>
        </DialogContent>
      </Dialog>
    </>
  );
}
function SproutIcon() {
  return <Leaf size={21} />;
}
