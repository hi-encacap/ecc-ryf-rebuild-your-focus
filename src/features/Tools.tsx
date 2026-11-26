import { useEffect, useRef, useState } from "react";
import {
  BookOpen,
  Brain,
  Check,
  ChevronLeft,
  Clock3,
  Copy,
  FileText,
  Flag,
  Pause,
  Play,
  Plus,
  RotateCcw,
  Search,
  Square,
  Trash2,
  X,
} from "lucide-react";
import { toast } from "sonner";
import type { AppData, FocusSession, JournalEntry, Run } from "../domain/types";
import { addDays, localDate } from "../domain/model";
import { updateData } from "../data/store";
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
} from "../domain/timer";
import "./tools.css";

type ToolTab = "focus" | "journal" | "recall" | "thinking";
type Props = {
  data: AppData;
  run: Run;
  day: number;
  initialTab?: ToolTab;
  initialMinutes?: number;
  onClose?: () => void;
};
const tabs = [
  { id: "focus", label: "Tập trung", icon: Clock3 },
  { id: "journal", label: "Nhật ký", icon: FileText },
  { id: "recall", label: "Nhớ lại", icon: BookOpen },
  { id: "thinking", label: "Suy nghĩ", icon: Brain },
] as const;
const categoryNames: Record<FocusSession["category"], string> = {
  focus: "Tập trung sâu",
  reading: "Đọc sâu",
  thinking: "Suy nghĩ độc lập",
  rest: "Nghỉ yên tĩnh",
  custom: "Hoạt động khác",
};
const fields = [
  {
    id: "problem",
    label: "Vấn đề",
    placeholder: "Mình đang cần giải quyết điều gì?",
  },
  {
    id: "constraints",
    label: "Ràng buộc",
    placeholder: "Thời gian, ngân sách, yêu cầu…",
  },
  {
    id: "assumptions",
    label: "Giả định",
    placeholder: "Điều gì mình đang cho là đúng?",
  },
  {
    id: "options",
    label: "Các phương án",
    placeholder: "Có những cách tiếp cận nào?",
  },
  {
    id: "tradeoffs",
    label: "Đánh đổi",
    placeholder: "Chi phí, bảo mật, khả năng duy trì và mở rộng…",
  },
  {
    id: "decision",
    label: "Quyết định",
    placeholder: "Mình chọn gì, và vì sao?",
  },
  {
    id: "validation",
    label: "Kiểm chứng",
    placeholder: "Làm sao biết quyết định này phù hợp?",
  },
];
const secondsLabel = (seconds: number) =>
  `${Math.floor(seconds / 60)
    .toString()
    .padStart(2, "0")}:${Math.floor(seconds % 60)
    .toString()
    .padStart(2, "0")}`;
const message = (error: unknown) =>
  error instanceof Error
    ? error.message
    : "Chưa lưu được dữ liệu. Hãy thử lại.";
async function save(operation: () => Promise<void>, success?: string) {
  try {
    await operation();
    if (success) toast.success(success);
    return true;
  } catch (error) {
    toast.error(message(error));
    return false;
  }
}
const active = (session: FocusSession) =>
  session.status === "running" || session.status === "paused";
// Check inside the transaction as well as disabling preview controls. A run may
// change in another tab while a form or confirmation is still open.
function updateToolData(
  run: Run,
  day: number,
  mutate: (draft: AppData) => void,
) {
  return updateData((draft) => {
    const currentRun = draft.runs.find((item) => item.id === run.id);
    if (!currentRun) throw new Error("Hành trình này không còn tồn tại.");
    assertWritableRunDay(currentRun, day);
    mutate(draft);
  });
}
function assertSessionDay(data: AppData, session: FocusSession) {
  const owner = data.runs.find((item) => item.id === session.runId);
  if (!owner) throw new Error("Không tìm thấy hành trình của phiên.");
  assertWritableRunDay(owner, session.day);
}

export function Tools({
  data,
  run,
  day,
  initialTab = "focus",
  initialMinutes = 20,
  onClose,
}: Props) {
  const [tab, setTab] = useState<ToolTab>(initialTab);
  const today = localDate(run.timeZone);
  const readOnly = addDays(run.startDate, day - 1) > today;
  useEffect(() => {
    setTab(initialTab);
  }, [initialTab]);
  return (
    <div className="tools-page">
      <div className="tools-heading">
        {onClose && (
          <button className="tool-back" onClick={onClose}>
            <ChevronLeft size={18} /> Hôm nay
          </button>
        )}
        <span className="tool-eyebrow">MỘT KHOẢNG RIÊNG CHO MÌNH</span>
        <h1>Ít xao nhãng. Nhiều chủ đích.</h1>
        <p>Những công cụ nhỏ để tập trung, nhớ lại và nghĩ sâu hơn.</p>
      </div>
      <div className="tool-tabs" role="tablist" aria-label="Công cụ">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            id={`tool-tab-${id}`}
            role="tab"
            aria-selected={tab === id}
            aria-controls={`tool-panel-${id}`}
            onClick={() => setTab(id)}
            className={tab === id ? "selected" : ""}
          >
            <Icon size={18} />
            <span>{label}</span>
          </button>
        ))}
      </div>
      {readOnly && (
        <p className="tool-notice">
          Ngày {day} chưa đến. Bạn có thể xem công cụ; việc ghi nhận sẽ mở vào
          đúng ngày.
        </p>
      )}
      <section
        role="tabpanel"
        id={`tool-panel-${tab}`}
        aria-labelledby={`tool-tab-${tab}`}
      >
        <fieldset className="tool-readonly-scope" disabled={readOnly}>
          {tab === "focus" && (
            <FocusTool
              key={`${run.id}:${day}`}
              data={data}
              run={run}
              day={day}
              initialMinutes={initialMinutes}
              readOnly={readOnly}
            />
          )}
          {tab === "journal" && (
            <JournalTool
              key={`${run.id}:${day}`}
              data={data}
              run={run}
              day={day}
              readOnly={readOnly}
            />
          )}
          {tab === "recall" && (
            <RecallTool
              key={`${run.id}:${day}`}
              data={data}
              run={run}
              day={day}
              readOnly={readOnly}
            />
          )}
          {tab === "thinking" && (
            <ThinkingTool
              key={`${run.id}:${day}`}
              data={data}
              run={run}
              day={day}
              readOnly={readOnly}
            />
          )}
        </fieldset>
      </section>
    </div>
  );
}

function FocusTool({
  data,
  run,
  day,
  initialMinutes = 20,
  readOnly,
}: Omit<Props, "initialTab" | "onClose"> & { readOnly: boolean }) {
  const session = data.sessions.find(active);
  const [category, setCategory] = useState<FocusSession["category"]>("focus");
  const [minutes, setMinutes] = useState(
    String(
      Math.max(
        1,
        Math.min(240, Number.isFinite(initialMinutes) ? initialMinutes : 20),
      ),
    ),
  );
  const [outcome, setOutcome] = useState("");
  const [now, setNow] = useState(Date.now());
  const [confirming, setConfirming] = useState<string | null>(null);
  const [actual, setActual] = useState("");
  const [longest, setLongest] = useState("");
  const [manual, setManual] = useState(false);
  const [busy, setBusy] = useState(false);
  const [recovered, setRecovered] = useState(Boolean(session));
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [editSession, setEditSession] = useState<string | null>(null);
  const [attribution, setAttribution] = useState(String(day));
  const sessions = data.sessions.filter(
    (s) => s.runId === run.id && s.day === day && s.status === "completed",
  );
  const liveSeconds = session ? elapsedSeconds(session, now) : 0;
  useEffect(() => {
    if (!session)
      setMinutes(
        String(
          Math.max(
            1,
            Math.min(
              240,
              Number.isFinite(initialMinutes) ? initialMinutes : 20,
            ),
          ),
        ),
      );
  }, [initialMinutes, Boolean(session)]);
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 500);
    return () => window.clearInterval(timer);
  }, []);
  useEffect(() => {
    const listener = () => {
      if (!document.hidden) {
        setNow(Date.now());
        setRecovered(true);
      }
    };
    document.addEventListener("visibilitychange", listener);
    return () => document.removeEventListener("visibilitychange", listener);
  }, []);
  const mutateSession = async (fn: (value: FocusSession) => FocusSession) => {
    if (!session) return;
    await save(() =>
      updateToolData(run, day, (draft) => {
        const index = draft.sessions.findIndex((s) => s.id === session.id);
        if (index >= 0) {
          assertSessionDay(draft, draft.sessions[index]);
          draft.sessions[index] = fn(draft.sessions[index]);
        }
      }),
    );
  };
  const start = async () => {
    setBusy(true);
    const ok = await save(() =>
      updateToolData(run, day, (draft) => {
        if (draft.sessions.some(active))
          throw new Error(
            "Đang có một phiên trên thiết bị này. Hãy kết thúc phiên đó trước.",
          );
        draft.sessions.push(
          createSession({
            runId: run.id,
            day,
            category,
            plannedSeconds: Number(minutes) * 60,
            outcome: outcome.slice(0, 10000),
          }),
        );
      }),
    );
    setBusy(false);
    if (ok) {
      setRecovered(false);
      setManual(false);
    }
  };
  const beginFinish = async () => {
    if (!session) return;
    const duration = elapsedSeconds(session);
    const chunk = longestSeconds(session);
    await mutateSession((s) => pauseSession(s));
    setActual((duration / 60).toFixed(1));
    setLongest((chunk / 60).toFixed(1));
    setConfirming(session.id);
  };
  const complete = async () => {
    if (!confirming || !actual.trim() || !longest.trim()) return;
    setBusy(true);
    const ok = await save(
      () =>
        updateToolData(run, day, (draft) => {
          const index = draft.sessions.findIndex((s) => s.id === confirming);
          if (index < 0) throw new Error("Không tìm thấy phiên này.");
          assertSessionDay(draft, draft.sessions[index]);
          draft.sessions[index] = finishSession(
            draft.sessions[index],
            Number(actual) * 60,
            Number(longest) * 60,
          );
        }),
      "Đã lưu thời gian thực tế. Nghỉ một chút nhé.",
    );
    setBusy(false);
    if (ok) {
      setConfirming(null);
      setRecovered(false);
    }
  };
  const manualSave = async () => {
    if (!actual.trim() || !longest.trim()) return;
    setBusy(true);
    const ok = await save(
      () =>
        updateToolData(run, day, (draft) => {
          const created = createSession({
            runId: run.id,
            day,
            category,
            plannedSeconds: Number(minutes) * 60,
            outcome,
          });
          draft.sessions.push(
            finishSession(created, Number(actual) * 60, Number(longest) * 60),
          );
        }),
      "Đã ghi nhận phiên thủ công.",
    );
    setBusy(false);
    if (ok) setManual(false);
  };
  const correct = async () => {
    if (!editSession || !actual.trim() || !longest.trim()) return;
    const total = Number(actual) * 60;
    const chunk = Number(longest) * 60;
    const targetDay = Number(attribution);
    if (
      !Number.isFinite(total) ||
      total < 0 ||
      total > 86400 ||
      !Number.isFinite(chunk) ||
      chunk < 0 ||
      chunk > total ||
      !Number.isInteger(targetDay) ||
      targetDay < 1 ||
      targetDay > 30 ||
      addDays(run.startDate, targetDay - 1) > localDate(run.timeZone)
    ) {
      toast.error(
        "Kiểm tra thời lượng và ngày ghi nhận. Phiên liên tục không thể dài hơn tổng thời gian.",
      );
      return;
    }
    const ok = await save(
      () =>
        updateToolData(run, day, (draft) => {
          const found = draft.sessions.find(
            (s) =>
              s.id === editSession &&
              s.runId === run.id &&
              s.status === "completed",
          );
          if (found) {
            found.actualSeconds = total;
            found.accumulatedSeconds = total;
            found.longestSegmentSeconds = chunk;
            found.day = targetDay;
          }
        }),
      "Đã chỉnh phiên.",
    );
    if (ok) setEditSession(null);
  };
  return (
    <div className="tools-grid">
      <div className="tool-card focus-card">
        <div className="tool-card-title">
          <span className="tool-icon">
            <Clock3 size={21} />
          </span>
          <div>
            <h2>Một việc, ngay lúc này</h2>
            <p>Phiên được ghi cho ngày {session?.day ?? day}</p>
          </div>
        </div>
        {!session ? (
          <>
            <div className="tool-form-grid">
              <label>
                Hoạt động
                <select
                  value={category}
                  onChange={(e) =>
                    setCategory(e.target.value as FocusSession["category"])
                  }
                >
                  {Object.entries(categoryNames).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Mục tiêu · phút
                <input
                  aria-label="Mục tiêu phút"
                  type="number"
                  min="1"
                  max="240"
                  step="1"
                  value={minutes}
                  onChange={(e) => setMinutes(e.target.value)}
                />
              </label>
            </div>
            <label className="tool-field">
              Một kết quả mình muốn có
              <input
                placeholder="Ví dụ: viết xong phần mở đầu"
                maxLength={10000}
                value={outcome}
                onChange={(e) => setOutcome(e.target.value)}
              />
            </label>
            <div className="timer-dial">
              <span>
                {Math.max(0, Number(minutes) || 0)
                  .toString()
                  .padStart(2, "0")}
                :00
              </span>
              <small>CHỈ CẦN BẮT ĐẦU NHẸ NHÀNG</small>
            </div>
            <button
              className="tool-button primary full"
              onClick={start}
              disabled={
                busy ||
                readOnly ||
                !minutes ||
                Number(minutes) < 1 ||
                Number(minutes) > 240
              }
            >
              <Play size={18} /> Bắt đầu phiên
            </button>
            <button
              className="tool-button text full"
              disabled={readOnly}
              onClick={() => {
                setManual(!manual);
                setActual("20");
                setLongest("20");
              }}
            >
              <Plus size={16} /> Ghi một phiên đã làm
            </button>
          </>
        ) : (
          <>
            {session.runId !== run.id && (
              <p className="tool-notice">
                Phiên đang mở thuộc hành trình bắt đầu{" "}
                {data.runs.find((item) => item.id === session.runId)?.startDate}
                , ngày {session.day}. Kết quả sẽ được lưu vào hành trình đó.
              </p>
            )}
            <div className="timer-category">
              {categoryNames[session.category]} ·{" "}
              {session.runId === run.id
                ? `Ngày ${session.day}`
                : "Hành trình khác"}
            </div>
            {session.outcome && (
              <p className="timer-outcome">{session.outcome}</p>
            )}
            <div
              className={`timer-dial ${session.status === "running" ? "is-running" : ""}`}
            >
              <span aria-live="off">
                {secondsLabel(
                  Math.max(0, session.plannedSeconds - liveSeconds),
                )}
              </span>
              <small>
                {session.status === "paused"
                  ? "ĐANG TẠM DỪNG"
                  : liveSeconds >= session.plannedSeconds
                    ? "ĐÃ ĐẾN MỤC TIÊU · CÓ THỂ NGHỈ"
                    : "MỖI KHOẢNG TẬP TRUNG ĐỀU CÓ Ý NGHĨA"}
              </small>
            </div>
            <p className="timer-elapsed">
              Đã chạy {secondsLabel(liveSeconds)} · {session.interruptions} gián
              đoạn đã ghi
            </p>
            {recovered && (
              <p className="tool-notice">
                Phiên được khôi phục. Khi kết thúc, hãy xác nhận thời gian thực
                sự tập trung; thời gian khóa máy có thể vẫn nằm trong đồng hồ.
              </p>
            )}
            {!confirming && (
              <>
                <div className="tool-actions">
                  <button
                    className="tool-button primary"
                    onClick={() =>
                      mutateSession((s) =>
                        s.status === "running"
                          ? pauseSession(s)
                          : resumeSession(s),
                      )
                    }
                  >
                    {session.status === "running" ? (
                      <Pause size={18} />
                    ) : (
                      <Play size={18} />
                    )}
                    {session.status === "running" ? "Tạm dừng" : "Tiếp tục"}
                  </button>
                  <button className="tool-button" onClick={beginFinish}>
                    <Check size={18} /> Kết thúc
                  </button>
                </div>
                <div className="tool-actions small-actions">
                  <button
                    className="tool-button text"
                    disabled={session.status !== "running"}
                    onClick={() => mutateSession((s) => interruptSession(s))}
                  >
                    <Flag size={16} /> Ghi gián đoạn
                  </button>
                  <button
                    className="tool-button text"
                    onClick={() => setConfirmDelete(session.id)}
                  >
                    <X size={16} /> Hủy phiên
                  </button>
                </div>
              </>
            )}
          </>
        )}
        {(confirming || manual || editSession) && (
          <div className="tool-inline-form">
            <h3>
              {editSession
                ? "Chỉnh thời gian đã ghi"
                : "Xác nhận thời gian thực tế"}
            </h3>
            <p>
              Chỉ tính thời gian thực sự làm việc. Đọc sâu không gồm chuẩn bị và
              kiểm tra trí nhớ.
            </p>
            <div className="tool-form-grid">
              <label>
                Thời gian thực tế · phút
                <input
                  aria-label="Thời gian thực tế phút"
                  type="number"
                  min="0"
                  max="1440"
                  step="0.1"
                  value={actual}
                  onChange={(e) => setActual(e.target.value)}
                />
              </label>
              <label>
                Đoạn liên tục dài nhất · phút
                <input
                  aria-label="Đoạn liên tục dài nhất phút"
                  type="number"
                  min="0"
                  max={actual || "1440"}
                  step="0.1"
                  value={longest}
                  onChange={(e) => setLongest(e.target.value)}
                />
              </label>
            </div>
            {editSession && (
              <label className="tool-field">
                Ghi cho ngày
                <input
                  type="number"
                  min="1"
                  max="30"
                  value={attribution}
                  onChange={(e) => setAttribution(e.target.value)}
                />
              </label>
            )}
            <div className="tool-actions">
              <button
                className="tool-button primary"
                disabled={
                  busy ||
                  !actual.trim() ||
                  !longest.trim() ||
                  Number(longest) > Number(actual)
                }
                onClick={
                  editSession ? correct : confirming ? complete : manualSave
                }
              >
                Lưu phiên
              </button>
              <button
                className="tool-button"
                onClick={() => {
                  setConfirming(null);
                  setManual(false);
                  setEditSession(null);
                }}
              >
                Quay lại
              </button>
            </div>
          </div>
        )}
        {confirmDelete && (
          <div className="tool-inline-form">
            <h3>
              {sessions.some((s) => s.id === confirmDelete)
                ? "Xóa phiên đã ghi?"
                : "Hủy phiên đang chạy?"}
            </h3>
            <p>Phiên này sẽ không tính vào kết quả.</p>
            <div className="tool-actions">
              <button
                className="tool-button"
                onClick={() => setConfirmDelete(null)}
              >
                Giữ lại
              </button>
              <button
                className="tool-button"
                onClick={async () => {
                  const ok = await save(() =>
                    updateToolData(run, day, (draft) => {
                      const index = draft.sessions.findIndex(
                        (s) => s.id === confirmDelete,
                      );
                      if (index >= 0) {
                        assertSessionDay(draft, draft.sessions[index]);
                        if (active(draft.sessions[index]))
                          draft.sessions[index] = cancelSession(
                            draft.sessions[index],
                          );
                        else draft.sessions.splice(index, 1);
                      }
                    }),
                  );
                  if (ok) {
                    setConfirmDelete(null);
                    setConfirming(null);
                  }
                }}
              >
                Xác nhận
              </button>
            </div>
          </div>
        )}
      </div>
      <aside className="tools-side">
        <div className="tool-card">
          <span className="tool-eyebrow">TẠO KHOẢNG TRỐNG</span>
          <h3>Để ý nghĩ có chỗ đi xa.</h3>
          <ul className="tool-tips">
            <li>Đặt điện thoại ngoài tầm tay.</li>
            <li>Đóng những tab chưa cần dùng.</li>
            <li>Chọn một việc đủ nhỏ để bắt đầu.</li>
            <li>Nghỉ khi cơ thể cần, không cần cố đủ giờ.</li>
          </ul>
          <p className="tool-footnote">
            Đồng hồ không chặn ứng dụng và không xác định được bạn có đang tập
            trung hay không.
          </p>
        </div>
        <div className="tool-card">
          <div className="tool-section-title">
            <h3>Đã dành thời gian</h3>
            <span>{sessions.length} phiên</span>
          </div>
          {sessions.length === 0 ? (
            <div className="tool-empty compact">
              <Clock3 size={26} />
              <p>
                Chưa có phiên nào ở ngày {day}.<br />
                Một khoảng nhỏ cũng là khởi đầu tốt.
              </p>
            </div>
          ) : (
            <div className="session-list">
              {sessions.map((s) => (
                <div className="session-row" key={s.id}>
                  <div>
                    <strong>{categoryNames[s.category]}</strong>
                    <span>
                      {Math.round(((s.actualSeconds ?? 0) / 60) * 10) / 10} phút
                      · {s.interruptions} gián đoạn
                    </span>
                    {s.outcome && <small>{s.outcome}</small>}
                  </div>
                  <div>
                    <button
                      aria-label="Chỉnh phiên"
                      className="tool-icon-button"
                      onClick={() => {
                        setEditSession(s.id);
                        setActual(String((s.actualSeconds ?? 0) / 60));
                        setLongest(String(s.longestSegmentSeconds / 60));
                        setAttribution(String(s.day));
                      }}
                    >
                      Sửa
                    </button>
                    <button
                      aria-label="Xóa phiên"
                      className="tool-icon-button"
                      onClick={() => setConfirmDelete(s.id)}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
          <p className="tool-footnote">
            Các phiên đã xác nhận là nguồn thời gian tự động. Nếu nhập tổng thủ
            công ở Hôm nay, tổng đó sẽ thay thế số từ timer để tránh tính trùng.
          </p>
        </div>
      </aside>
    </div>
  );
}

function JournalTool({
  data,
  run,
  day,
  readOnly,
}: Omit<Props, "initialTab" | "onClose"> & { readOnly: boolean }) {
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [text, setText] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const entries = data.journal
    .filter(
      (e) =>
        e.runId === run.id &&
        e.type === "note" &&
        `${e.title} ${e.text}`
          .toLocaleLowerCase("vi")
          .includes(search.toLocaleLowerCase("vi")),
    )
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  const submit = async () => {
    const at = new Date().toISOString();
    const entry: JournalEntry = {
      id: editing ?? crypto.randomUUID(),
      runId: run.id,
      day,
      type: "note",
      title: title.trim() || `Một ghi chú ngày ${day}`,
      text: text.trim(),
      createdAt: at,
      updatedAt: at,
    };
    const ok = await save(
      () =>
        updateToolData(run, day, (draft) => {
          const index = draft.journal.findIndex((e) => e.id === entry.id);
          if (index >= 0)
            draft.journal[index] = {
              ...entry,
              day: draft.journal[index].day,
              createdAt: draft.journal[index].createdAt,
            };
          else draft.journal.push(entry);
        }),
      "Đã cất lại suy nghĩ của bạn.",
    );
    if (ok) {
      setTitle("");
      setText("");
      setEditing(null);
    }
  };
  return (
    <div className="tools-grid">
      <div className="tool-card">
        <div className="tool-card-title">
          <span className="tool-icon lavender">
            <FileText size={21} />
          </span>
          <div>
            <h2>Viết để nhìn rõ hơn</h2>
            <p>Không cần viết hay. Chỉ cần thật với mình.</p>
          </div>
        </div>
        <label className="tool-field">
          Tiêu đề
          <input
            value={title}
            maxLength={200}
            placeholder="Điều mình nhận ra hôm nay…"
            onChange={(e) => setTitle(e.target.value)}
          />
        </label>
        <label className="tool-field">
          Ghi chú
          <textarea
            rows={10}
            maxLength={10000}
            value={text}
            placeholder="Một ý nghĩ, một đoạn đã đọc, hay điều làm mình phân tâm."
            onChange={(e) => setText(e.target.value)}
          />
        </label>
        <div className="tool-actions">
          <button
            className="tool-button primary"
            disabled={readOnly || !text.trim()}
            onClick={submit}
          >
            <Check size={17} /> {editing ? "Lưu thay đổi" : "Lưu ghi chú"}
          </button>
          {editing && (
            <button
              className="tool-button"
              onClick={() => {
                setEditing(null);
                setTitle("");
                setText("");
              }}
            >
              Hủy sửa
            </button>
          )}
        </div>
        <p className="tool-footnote">
          Chỉ lưu trên trình duyệt này. Tránh ghi mật khẩu, dữ liệu khách hàng
          hoặc thông tin công việc bí mật.
        </p>
      </div>
      <div className="tool-card">
        <div className="tool-section-title">
          <h3>Những điều đã ghi</h3>
          <span>{entries.length} ghi chú</span>
        </div>
        <label className="tool-search">
          <Search size={18} />
          <input
            aria-label="Tìm ghi chú"
            placeholder="Tìm trong nhật ký"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </label>
        {entries.length === 0 ? (
          <div className="tool-empty">
            <FileText size={32} />
            <h3>Một trang để bắt đầu.</h3>
            <p>Suy nghĩ của bạn sẽ được cất ở đây.</p>
          </div>
        ) : (
          <div className="journal-list">
            {entries.map((entry) => (
              <article key={entry.id}>
                <small>NGÀY {entry.day}</small>
                <h3>{entry.title}</h3>
                <p>{entry.text}</p>
                <div className="tool-actions">
                  <button
                    className="tool-button text"
                    onClick={() => {
                      setEditing(entry.id);
                      setTitle(entry.title);
                      setText(entry.text);
                    }}
                  >
                    Chỉnh sửa
                  </button>
                  <button
                    className="tool-button text"
                    disabled={readOnly}
                    onClick={() => setDeleteId(entry.id)}
                  >
                    <Trash2 size={15} /> Xóa
                  </button>
                </div>
                {deleteId === entry.id && (
                  <div className="tool-notice">
                    Xóa ghi chú này?{" "}
                    <button
                      className="tool-button text"
                      onClick={async () => {
                        const ok = await save(() =>
                          updateToolData(run, day, (draft) => {
                            draft.journal = draft.journal.filter(
                              (e) => e.id !== entry.id,
                            );
                          }),
                        );
                        if (ok) {
                          setDeleteId(null);
                          if (editing === entry.id) {
                            setEditing(null);
                            setTitle("");
                            setText("");
                          }
                        }
                      }}
                    >
                      Xác nhận xóa
                    </button>
                    <button
                      className="tool-button text"
                      onClick={() => setDeleteId(null)}
                    >
                      Giữ lại
                    </button>
                  </div>
                )}
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function ThinkingTool({
  data,
  run,
  day,
  readOnly,
}: Omit<Props, "initialTab" | "onClose"> & { readOnly: boolean }) {
  const existing = data.journal
    .filter((e) => e.runId === run.id && e.day === day && e.type === "thinking")
    .at(-1);
  const entryId = useRef(existing?.id ?? crypto.randomUUID());
  const [values, setValues] = useState<Record<string, string>>(
    existing?.fields ?? {},
  );
  const [title, setTitle] = useState(existing?.title ?? "");
  const [dirty, setDirty] = useState(false);
  const [saved, setSaved] = useState(
    existing ? "Đã lưu trên thiết bị" : "Bản nháp riêng của bạn",
  );
  const editRevision = useRef(0);
  const dirtyRef = useRef(dirty);
  dirtyRef.current = dirty;
  const flushRef = useRef<(() => Promise<void>) | null>(null);
  useEffect(() => {
    entryId.current = existing?.id ?? crypto.randomUUID();
    setValues(existing?.fields ?? {});
    setTitle(existing?.title ?? "");
    setDirty(false);
  }, [run.id, day]);
  const persist = async () => {
    if (
      readOnly ||
      (!title.trim() && !Object.values(values).some((v) => v.trim()))
    )
      return;
    const targetId = entryId.current;
    const revision = editRevision.current;
    const at = new Date().toISOString();
    const plain = fields
      .map((f) => `## ${f.label}\n${values[f.id] ?? ""}`)
      .join("\n\n");
    await updateToolData(run, day, (draft) => {
      if (revision !== editRevision.current) return;
      const found = draft.journal.find(
        (e) => e.id === targetId && e.runId === run.id,
      );
      if (found) {
        found.title = title.trim() || `Suy nghĩ ngày ${day}`;
        found.fields = values;
        found.text = plain;
        found.updatedAt = at;
      } else
        draft.journal.push({
          id: targetId,
          runId: run.id,
          day,
          type: "thinking",
          title: title.trim() || `Suy nghĩ ngày ${day}`,
          text: plain,
          fields: values,
          createdAt: at,
          updatedAt: at,
        });
    });
    if (revision === editRevision.current) {
      setSaved("Đã lưu trên thiết bị");
      setDirty(false);
      dirtyRef.current = false;
    }
  };
  flushRef.current = persist;
  useEffect(
    () => () => {
      if (dirtyRef.current)
        void flushRef.current?.().catch((error) => toast.error(message(error)));
    },
    [],
  );
  useEffect(() => {
    if (!dirty || readOnly) return;
    const timer = setTimeout(() => {
      if (!dirtyRef.current) return;
      persist().catch((error) => {
        setSaved("Chưa lưu được · hãy thử lại");
        toast.error(message(error));
      });
    }, 700);
    return () => clearTimeout(timer);
  }, [values, title, dirty, readOnly]);
  const copy = async () => {
    await save(async () => {
      await persist();
      await navigator.clipboard.writeText(
        `# ${title.trim() || "Phân tích độc lập"}\n\n${fields.map((f) => `## ${f.label}\n${values[f.id] ?? ""}`).join("\n\n")}`,
      );
    }, "Đã copy. Chỉ chia sẻ nội dung không nhạy cảm với AI.");
  };
  return (
    <div className="tools-grid">
      <div className="tool-card">
        <div className="tool-card-title">
          <span className="tool-icon peach">
            <Brain size={21} />
          </span>
          <div>
            <h2>Nghĩ trước. Hỏi sau.</h2>
            <p>Một bản nháp của riêng bạn, trước khi nghe ý kiến khác.</p>
          </div>
        </div>
        <label className="tool-field">
          Tên vấn đề
          <input
            value={title}
            maxLength={200}
            placeholder="Mình muốn tìm lời giải cho…"
            disabled={readOnly}
            onBlur={() => {
              if (dirty) void save(persist);
            }}
            onChange={(e) => {
              setTitle(e.target.value);
              editRevision.current += 1;
              setDirty(true);
              setSaved("Đang lưu…");
            }}
          />
        </label>
        <div className="thinking-fields">
          {fields.map((field) => (
            <label className="tool-field" key={field.id}>
              {field.label}
              <textarea
                rows={3}
                maxLength={1200}
                placeholder={field.placeholder}
                value={values[field.id] ?? ""}
                disabled={readOnly}
                onBlur={() => {
                  if (dirty) void save(persist);
                }}
                onChange={(e) => {
                  setValues({ ...values, [field.id]: e.target.value });
                  editRevision.current += 1;
                  setDirty(true);
                  setSaved("Đang lưu…");
                }}
              />
            </label>
          ))}
        </div>
        <div className="tool-actions">
          <button
            className="tool-button primary"
            onClick={copy}
            disabled={readOnly}
          >
            <Copy size={17} /> Copy để nhờ phản biện
          </button>
          <button
            className="tool-button"
            onClick={() => save(persist)}
            disabled={readOnly}
          >
            Lưu bản nháp
          </button>
        </div>
        <p className="tool-footnote" aria-live="polite">
          {saved}
        </p>
      </div>
      <aside className="tools-side">
        <div className="tool-card">
          <span className="tool-eyebrow">AI LÀ NGƯỜI PHẢN BIỆN</span>
          <h3>Mình vẫn là người quyết định.</h3>
          <p>
            Dịch, định dạng hay boilerplate có thể nhờ AI và kiểm tra lại. Với
            việc học mới, kiến trúc, debugging khó hoặc quyết định lớn: thử tự
            nghĩ trước.
          </p>
          <div className="tool-quote">
            “Hãy chỉ ra giả định yếu nhất, một phản ví dụ và cách kiểm chứng
            phương án này.”
          </div>
          <p className="tool-footnote">
            Không có nội dung nào được gửi tự động. Copy chỉ đưa văn bản vào
            clipboard.
          </p>
        </div>
        <div className="tool-card">
          <h3>Các bản nháp đã cất</h3>
          {data.journal.filter(
            (e) => e.runId === run.id && e.type === "thinking",
          ).length === 0 ? (
            <p className="tool-footnote">
              Bản nháp đầu tiên sẽ xuất hiện ở đây.
            </p>
          ) : (
            data.journal
              .filter((e) => e.runId === run.id && e.type === "thinking")
              .sort((a, b) => b.day - a.day)
              .map((entry) => (
                <details className="thinking-history" key={entry.id}>
                  <summary>
                    Ngày {entry.day} · {entry.title}
                  </summary>
                  <p>{entry.text}</p>
                  <button
                    className="tool-button text"
                    onClick={async () => {
                      if (dirtyRef.current && !(await save(persist))) return;
                      entryId.current = entry.id;
                      setValues(entry.fields ?? {});
                      setTitle(entry.title);
                      setDirty(false);
                      dirtyRef.current = false;
                      setSaved(`Đang sửa bản nháp ngày ${entry.day}`);
                    }}
                  >
                    Mở để chỉnh sửa
                  </button>
                  <button
                    className="tool-button text"
                    disabled={readOnly}
                    onClick={() => {
                      if (window.confirm("Xóa bản nháp suy nghĩ này?")) {
                        if (entryId.current === entry.id) {
                          dirtyRef.current = false;
                          setDirty(false);
                          editRevision.current += 1;
                        }
                        void save(
                          () =>
                            updateToolData(run, day, (draft) => {
                              draft.journal = draft.journal.filter(
                                (e) => e.id !== entry.id,
                              );
                            }),
                          "Đã xóa bản nháp.",
                        ).then((ok) => {
                          if (ok && entryId.current === entry.id) {
                            entryId.current = crypto.randomUUID();
                            setTitle("");
                            setValues({});
                            setSaved("Bản nháp riêng của bạn");
                          }
                        });
                      }
                    }}
                  >
                    Xóa bản nháp
                  </button>
                </details>
              ))
          )}
        </div>
      </aside>
    </div>
  );
}

function RecallTool({
  data,
  run,
  day,
  readOnly,
}: Omit<Props, "initialTab" | "onClose"> & { readOnly: boolean }) {
  const [source, setSource] = useState("");
  const [link, setLink] = useState("");
  const [ideas, setIdeas] = useState("");
  const [creating, setCreating] = useState(false);
  const [intervals, setIntervals] = useState("1, 3, 7, 14");
  const [selected, setSelected] = useState<string | null>(null);
  const [response, setResponse] = useState("");
  const [revealed, setRevealed] = useState(false);
  const [matched, setMatched] = useState("0");
  const [deferred, setDeferred] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const today = localDate(run.timeZone);
  const cards = data.cards.filter((c) => c.runId === run.id && !c.archived);
  const due = cards
    .flatMap((card) =>
      card.dueDates
        .filter(
          (date) =>
            date <= today &&
            !data.recallReviews.some(
              (r) => r.cardId === card.id && r.dueDate === date,
            ),
        )
        .map((date) => ({ card, date, key: `${card.id}:${date}` })),
    )
    .sort((a, b) => a.date.localeCompare(b.date));
  const queue = due
    .filter((item) => !deferred.includes(item.card.id))
    .filter(
      (item, index, list) =>
        list.findIndex((other) => other.card.id === item.card.id) === index,
    )
    .slice(0, 3);
  const current = due.find((item) => item.key === selected);
  useEffect(() => {
    if (selected && !current) {
      setSelected(null);
      setRevealed(false);
      setResponse("");
      setMatched("0");
    }
  }, [selected, Boolean(current)]);
  const saveCard = async () => {
    const lines = ideas
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);
    if (lines.length < 1 || lines.length > 5) {
      toast.error("Nhập từ 1 đến 5 ý tham chiếu, mỗi ý một dòng.");
      return;
    }
    const schedule = [
      ...new Set(intervals.split(",").map((value) => Number(value.trim()))),
    ].sort((a, b) => a - b);
    if (
      schedule.length < 1 ||
      schedule.length > 12 ||
      schedule.some(
        (value) => !Number.isInteger(value) || value < 1 || value > 365,
      )
    ) {
      toast.error("Lịch ôn cần 1–12 mốc, mỗi mốc từ 1 đến 365 ngày.");
      return;
    }
    let safeLink = "";
    if (link.trim()) {
      try {
        const parsed = new URL(link.trim());
        if (!["http:", "https:"].includes(parsed.protocol)) throw new Error();
        safeLink = parsed.href;
      } catch {
        toast.error("Liên kết cần bắt đầu bằng https:// hoặc http://.");
        return;
      }
    }
    setBusy(true);
    const ok = await save(
      () =>
        updateToolData(run, day, (draft) => {
          draft.cards.push({
            id: crypto.randomUUID(),
            runId: run.id,
            source: source.trim(),
            link: safeLink,
            ideas: lines,
            createdDate: today,
            dueDates: schedule.map((n) => addDays(today, n)),
            archived: false,
          });
        }),
      `Đã tạo thẻ. Lần ôn đầu tiên sau ${schedule[0]} ngày.`,
    );
    setBusy(false);
    if (ok) {
      setSource("");
      setLink("");
      setIdeas("");
      setCreating(false);
    }
  };
  const review = async () => {
    if (!current) return;
    const count = Number(matched);
    if (
      !Number.isInteger(count) ||
      count < 0 ||
      count > current.card.ideas.length
    )
      return;
    setBusy(true);
    const ok = await save(
      () =>
        updateToolData(run, day, (draft) => {
          const liveCard = draft.cards.find(
            (card) =>
              card.id === current.card.id &&
              card.runId === run.id &&
              !card.archived,
          );
          if (!liveCard || !liveCard.dueDates.includes(current.date))
            throw new Error(
              "Thẻ này đã được thay đổi ở tab khác. Hãy mở lại danh sách ôn.",
            );
          if (
            draft.recallReviews.some(
              (r) => r.cardId === current.card.id && r.dueDate === current.date,
            )
          )
            throw new Error("Lượt này đã được lưu ở một tab khác.");
          draft.recallReviews.push({
            id: crypto.randomUUID(),
            cardId: current.card.id,
            dueDate: current.date,
            actualDate: today,
            response: response.trim(),
            matched: count,
            total: current.card.ideas.length,
            createdAt: new Date().toISOString(),
          });
        }),
      "Đã ghi nhận lượt nhớ lại.",
    );
    setBusy(false);
    if (ok) {
      setSelected(null);
      setRevealed(false);
      setResponse("");
      setMatched("0");
    }
  };
  return (
    <div className="tools-grid">
      <div className="tool-card">
        <div className="tool-card-title">
          <span className="tool-icon lavender">
            <BookOpen size={21} />
          </span>
          <div>
            <h2>Nhớ lại trước khi xem lại</h2>
            <p>Mỗi lần cố nhớ là một lần học.</p>
          </div>
        </div>
        {current ? (
          <div className="recall-review">
            <button
              className="tool-button text"
              onClick={() => setSelected(null)}
            >
              <ChevronLeft size={17} /> Danh sách ôn
            </button>
            <h3>{current.card.source}</h3>
            <p className="tool-footnote">
              Đến hạn{" "}
              {new Date(`${current.date}T12:00:00`).toLocaleDateString("vi-VN")}{" "}
              · {current.card.ideas.length} ý tham chiếu
            </p>
            <label className="tool-field">
              Mình nhớ được những gì?
              <textarea
                rows={7}
                maxLength={10000}
                value={response}
                placeholder="Thử viết bằng trí nhớ, chưa mở nguồn nhé."
                onChange={(e) => setResponse(e.target.value)}
              />
            </label>
            {!revealed ? (
              <button
                className="tool-button primary"
                disabled={readOnly}
                onClick={() => setRevealed(true)}
              >
                Xem ý tham chiếu
              </button>
            ) : (
              <div className="recall-answer">
                <span className="tool-eyebrow">ĐỐI CHIẾU VỚI NGUỒN</span>
                <ol>
                  {current.card.ideas.map((idea, i) => (
                    <li key={i}>{idea}</li>
                  ))}
                </ol>
                {current.card.link && (
                  <a
                    href={current.card.link}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Mở tài liệu gốc
                  </a>
                )}
                <label className="tool-field">
                  Số ý khớp · trên {current.card.ideas.length}
                  <select
                    value={matched}
                    onChange={(e) => setMatched(e.target.value)}
                  >
                    {Array.from(
                      { length: current.card.ideas.length + 1 },
                      (_, i) => (
                        <option key={i} value={i}>
                          {i} / {current.card.ideas.length}
                        </option>
                      ),
                    )}
                  </select>
                </label>
                <button
                  className="tool-button primary"
                  disabled={busy || readOnly}
                  onClick={review}
                >
                  Lưu tự đánh giá
                </button>
                <p className="tool-footnote">
                  Đây là tự đánh giá cho việc học, không phải phép đo trí nhớ
                  lâm sàng.
                </p>
              </div>
            )}
          </div>
        ) : (
          <>
            <div className="tool-section-title">
              <h3>Một ít thôi, đều đặn</h3>
              <span>{due.length} lượt đến hạn</span>
            </div>
            {queue.length ? (
              <div className="recall-queue">
                {queue.map((item) => (
                  <article key={item.key}>
                    <span className="tool-icon">
                      <BookOpen size={21} />
                    </span>
                    <div>
                      <h3>{item.card.source}</h3>
                      <p>
                        {item.card.ideas.length} ý ·{" "}
                        {item.date < today
                          ? "Có thể ôn bù khi sẵn sàng"
                          : "Đến hạn hôm nay"}
                      </p>
                      <div className="tool-actions">
                        <button
                          className="tool-button primary"
                          disabled={readOnly}
                          onClick={() => {
                            setSelected(item.key);
                            setResponse("");
                            setRevealed(false);
                            setMatched("0");
                          }}
                        >
                          Thử nhớ lại
                        </button>
                        <button
                          className="tool-button text"
                          onClick={() =>
                            setDeferred([...deferred, item.card.id])
                          }
                        >
                          Để lần sau
                        </button>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <div className="tool-empty">
                <BookOpen size={36} />
                <h3>
                  {due.length
                    ? "Hôm nay có thể dừng ở đây."
                    : "Trí nhớ cũng cần khoảng nghỉ."}
                </h3>
                <p>
                  {cards.length
                    ? "Không cần ôn dồn. Thẻ đến hạn sẽ xuất hiện ở đây."
                    : "Đọc một đoạn, ghi lại vài ý chính rồi quay lại vào ngày mai."}
                </p>
                {deferred.length > 0 && (
                  <button
                    className="tool-button text"
                    onClick={() => setDeferred([])}
                  >
                    <RotateCcw size={16} /> Xem lại lượt đã để sau
                  </button>
                )}
              </div>
            )}
            <button
              className="tool-button"
              disabled={readOnly}
              onClick={() => setCreating(!creating)}
            >
              <Plus size={18} /> Tạo thẻ nhớ lại
            </button>
          </>
        )}
        {creating && (
          <div className="tool-inline-form">
            <h3>Cất lại điều đáng nhớ</h3>
            <label className="tool-field">
              Tên tài liệu
              <input
                maxLength={300}
                value={source}
                onChange={(e) => setSource(e.target.value)}
                placeholder="Tên sách, bài viết hoặc concept"
              />
            </label>
            <label className="tool-field">
              Link nguồn · không bắt buộc
              <input
                type="url"
                maxLength={2000}
                value={link}
                onChange={(e) => setLink(e.target.value)}
                placeholder="https://…"
              />
            </label>
            <label className="tool-field">
              1–5 ý tham chiếu · mỗi ý một dòng
              <textarea
                rows={6}
                maxLength={5000}
                value={ideas}
                onChange={(e) => setIdeas(e.target.value)}
                placeholder={"Ý thứ nhất\nÝ thứ hai\nÝ thứ ba"}
              />
            </label>
            <details className="thinking-history">
              <summary>Điều chỉnh lịch ôn</summary>
              <label className="tool-field">
                Số ngày sau khi tạo · cách nhau bằng dấu phẩy
                <input
                  aria-label="Lịch ôn"
                  value={intervals}
                  onChange={(e) => setIntervals(e.target.value)}
                  placeholder="1, 3, 7, 14"
                />
              </label>
            </details>
            <p className="tool-footnote">
              Đối chiếu với nguồn trước khi lưu. Gợi ý ôn sau 1, 3, 7 và 14
              ngày; có thể để sau khi bận.
            </p>
            <div className="tool-actions">
              <button
                className="tool-button primary"
                disabled={busy || readOnly || !source.trim() || !ideas.trim()}
                onClick={saveCard}
              >
                Lưu thẻ
              </button>
              <button
                className="tool-button"
                onClick={() => setCreating(false)}
              >
                Đóng
              </button>
            </div>
          </div>
        )}
      </div>
      <aside className="tools-side">
        <div className="tool-card">
          <span className="tool-eyebrow">ĐỌC VỚI CHỦ ĐÍCH</span>
          <h3>Khép trang. Mở trí nhớ.</h3>
          <ol className="tool-tips">
            <li>Chọn một câu hỏi muốn hiểu.</li>
            <li>Đọc một khoảng vừa sức.</li>
            <li>Đóng tài liệu và thử nói lại.</li>
            <li>Đối chiếu, bổ sung phần còn thiếu.</li>
          </ol>
          <p className="tool-footnote">
            Mỗi lần gợi ý tối đa 3 thẻ. Lượt bỏ lỡ vẫn còn, không cần làm bù tất
            cả.
          </p>
        </div>
        <div className="tool-card">
          <div className="tool-section-title">
            <h3>Thư mục của mình</h3>
            <span>{cards.length} thẻ</span>
          </div>
          {cards.length === 0 ? (
            <p className="tool-footnote">
              Chưa có thẻ nào. Một ý chính là đủ để bắt đầu.
            </p>
          ) : (
            cards.map((card) => {
              const reviews = data.recallReviews.filter(
                (r) => r.cardId === card.id,
              );
              const next = card.dueDates.find(
                (date) => !reviews.some((r) => r.dueDate === date),
              );
              return (
                <div className="recall-saved" key={card.id}>
                  <h3>{card.source}</h3>
                  <p>
                    {card.ideas.length} ý · {reviews.length}/
                    {card.dueDates.length} lượt đã ôn
                  </p>
                  {next && (
                    <small>
                      Lần kế tiếp:{" "}
                      {new Date(`${next}T12:00:00`).toLocaleDateString("vi-VN")}
                    </small>
                  )}
                  {reviews.at(-1) && (
                    <small>
                      Lần gần nhất: {reviews.at(-1)!.matched}/
                      {reviews.at(-1)!.total} ý khớp
                    </small>
                  )}
                  <button
                    className="tool-button text"
                    disabled={readOnly}
                    onClick={() =>
                      save(
                        () =>
                          updateToolData(run, day, (draft) => {
                            const found = draft.cards.find(
                              (c) => c.id === card.id,
                            );
                            if (found) found.archived = true;
                          }),
                        "Đã lưu trữ thẻ và giữ lịch sử ôn.",
                      )
                    }
                  >
                    <Square size={13} /> Cất thẻ
                  </button>
                </div>
              );
            })
          )}
          {data.cards.some((c) => c.runId === run.id && c.archived) && (
            <details className="thinking-history">
              <summary>Thẻ đã cất</summary>
              {data.cards
                .filter((c) => c.runId === run.id && c.archived)
                .map((card) => (
                  <div key={card.id}>
                    <p>{card.source}</p>
                    <button
                      className="tool-button text"
                      disabled={readOnly}
                      onClick={() =>
                        save(() =>
                          updateToolData(run, day, (draft) => {
                            const found = draft.cards.find(
                              (c) => c.id === card.id,
                            );
                            if (found) found.archived = false;
                          }),
                        )
                      }
                    >
                      Đưa vào ôn lại
                    </button>
                    <button
                      className="tool-button text"
                      disabled={readOnly}
                      onClick={() => {
                        if (
                          window.confirm(
                            "Xóa thẻ và toàn bộ lịch sử ôn của thẻ này?",
                          )
                        )
                          void save(() =>
                            updateToolData(run, day, (draft) => {
                              draft.cards = draft.cards.filter(
                                (c) => c.id !== card.id,
                              );
                              draft.recallReviews = draft.recallReviews.filter(
                                (r) => r.cardId !== card.id,
                              );
                            }),
                          );
                      }}
                    >
                      Xóa
                    </button>
                  </div>
                ))}
            </details>
          )}
        </div>
      </aside>
    </div>
  );
}
