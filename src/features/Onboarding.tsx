import sproutIllustration from "../assets/remind-sprout.webp";
import { useState } from "react";
import {
  Sprout,
  ShieldCheck,
  Leaf,
  BookOpen,
  Focus,
  Check,
  ChevronLeft,
} from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { updateData } from "../data/store";
import { emptyMetrics, localDate } from "../domain/model";
import type { AppData, Metrics, Run } from "../domain/types";
import { perform } from "../App";
import { RestoreBackup } from "../components/RestoreBackup";
const prompts = [
  "Đọc tài liệu dài thấy khó tập trung",
  "Hay muốn tăng tốc độ video",
  "Vô thức cầm điện thoại khi rảnh",
  "Đọc nhiều nhưng nhớ lại ít",
  "Hỏi AI trước khi tự suy nghĩ",
  "Khó duy trì một việc đủ lâu",
  "Bận rộn nhưng ít điều đọng lại",
  "Ngại bắt đầu một chủ đề phức tạp",
];
export const metricFields: {
  key: keyof Metrics;
  label: string;
  unit: string;
  max: number;
  min?: number;
  step?: number;
}[] = [
  { key: "video", label: "Video ngắn", unit: "phút/ngày", max: 1440 },
  { key: "pickups", label: "Cầm điện thoại", unit: "lần/ngày", max: 10000 },
  { key: "sleep", label: "Giấc ngủ", unit: "giờ/đêm", max: 24, step: 0.1 },
  { key: "reading", label: "Đọc có chủ đích", unit: "phút/ngày", max: 1440 },
  { key: "focus", label: "Tập trung liên tục", unit: "phút/phiên", max: 1440 },
  {
    key: "energy",
    label: "Năng lượng tinh thần",
    unit: "1–10",
    max: 10,
    min: 1,
  },
  {
    key: "switches",
    label: "Tự chuyển việc trong bài 15 phút",
    unit: "lần",
    max: 10000,
  },
  {
    key: "recall",
    label: "Số ý nhớ lại (5 ý tham chiếu)",
    unit: "0–5",
    max: 5,
  },
];
export function MetricsFields({
  values,
  setValues,
  fields = metricFields,
}: {
  values: Metrics;
  setValues: (v: Metrics) => void;
  fields?: typeof metricFields;
}) {
  return (
    <div className="field-grid">
      {fields.map((f) => (
        <label className="field" key={f.key}>
          <span>{f.label}</span>
          <div className="unit-input">
            <Input
              type="number"
              inputMode="decimal"
              min={f.min ?? 0}
              max={f.max}
              step={f.step ?? 1}
              value={values[f.key] === null ? "" : String(values[f.key])}
              placeholder="Chưa biết"
              onChange={(e) =>
                setValues({
                  ...values,
                  [f.key]:
                    e.target.value === "" ? null : Number(e.target.value),
                })
              }
            />
            <span>{f.unit}</span>
          </div>
        </label>
      ))}
    </div>
  );
}
export function Onboarding({
  data,
  onDone,
  onCancel,
}: {
  data: AppData;
  onDone: () => void;
  onCancel?: () => void;
}) {
  const [step, setStep] = useState(0);
  const [baseline, setBaseline] = useState(emptyMetrics());
  const [tz, setTz] = useState(
    Intl.DateTimeFormat().resolvedOptions().timeZone || "Asia/Ho_Chi_Minh",
  );
  const [start, setStart] = useState(localDate(tz));
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [goal, setGoal] = useState({
    focus: 20,
    reading: 15,
    sleep: 7,
    video: "",
  });
  const [routine, setRoutine] = useState("");
  async function finish() {
    setSaving(true);
    await perform(async () => {
      new Intl.DateTimeFormat("vi", { timeZone: tz }).format();
      const now = new Date().toISOString();
      const run: Run = {
        id: crypto.randomUUID(),
        programVersion: "1.0.0",
        startDate: start,
        timeZone: tz,
        baseline: {
          ...baseline,
          testMinutes: baseline.switches !== null ? 15 : null,
        },
        goals: {
          ...(goal.focus !== 20 ? { focus: goal.focus } : {}),
          ...(goal.reading !== 15 ? { reading: goal.reading } : {}),
          sleep: goal.sleep,
          ...(goal.video !== "" ? { video: Number(goal.video) } : {}),
        },
        createdAt: now,
        updatedAt: now,
        reflectionPrompts: answers,
        routine,
      };
      await updateData((d) => {
        d.runs.push(run);
        d.activeRunId = run.id;
        d.settings.displayTimeZone = tz;
      });
      onDone();
    }, "Hành trình của bạn đã sẵn sàng.");
    setSaving(false);
  }
  return (
    <div className="onboarding">
      <header className="onboard-header">
        <div className="brand">
          <span className="brand-mark">
            <Sprout size={25} />
          </span>
          ReMind<span className="brand-dot">.</span>
        </div>
        <span className="badge">
          <ShieldCheck size={15} /> Chỉ dành cho bạn
        </span>
      </header>
      <main id="main" className="onboard-main">
        <section className="onboard-art">
          <div className="eyebrow">ÍT XAO NHÃNG HƠN. NHIỀU KHOẢNG THỞ HƠN.</div>
          <h1>
            Dành lại
            <br />
            sự tập trung<span>.</span>
          </h1>
          <p>
            Không cần thay đổi tất cả.
            <br />
            Chỉ cần bắt đầu từ một chút hôm nay.
          </p>
          <img
            src={sproutIllustration}
            alt="Mầm cây xanh mọc từ những viên đá sứ xếp cân bằng"
          />
          <div className="art-caption">
            <span>30 ngày</span>
            <i />
            <span>Một nhịp sống có chủ đích</span>
          </div>
        </section>
        <section className="onboard-form">
          <div className="step-indicator">
            {["Làm quen", "Điểm xuất phát", "Nhịp của bạn"].map((s, i) => (
              <span key={s} className={i <= step ? "active" : ""}>
                <i>{i < step ? <Check size={12} /> : i + 1}</i>
                {s}
              </span>
            ))}
          </div>
          {step === 0 ? (
            <>
              <p className="eyebrow">CHÀO MỪNG ĐẾN VỚI REMIND</p>
              <h2>
                Một khoảng riêng
                <br />
                cho tâm trí của bạn.
              </h2>
              <p className="muted">
                30 ngày thực hành tập trung, đọc sâu và suy nghĩ độc lập. Không
                thành tích để đuổi theo, không chuỗi ngày để giữ.
              </p>
              <div className="intro-benefits">
                {[
                  [
                    Focus,
                    "Làm một việc, trọn vẹn hơn",
                    "Những phiên tập trung vừa sức.",
                  ],
                  [
                    BookOpen,
                    "Đọc chậm, nhớ lâu hơn",
                    "Tự nhớ lại điều vừa học.",
                  ],
                  [
                    Leaf,
                    "Nghỉ ngơi cũng là tiến bộ",
                    "Ngày bận có thể nhẹ nhàng hơn.",
                  ],
                ].map(([Icon, title, text]) => {
                  const I = Icon as typeof Focus;
                  return (
                    <div key={String(title)}>
                      <span className="icon-tile">
                        <I size={21} />
                      </span>
                      <div>
                        <strong>{String(title)}</strong>
                        <p>{String(text)}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
              <details className="reflection-prompts">
                <summary>
                  Tự nhìn lại một chút <span>Không bắt buộc</span>
                </summary>
                <p className="small muted">
                  Đây là câu hỏi tự quan sát, không phải thang chẩn đoán.
                </p>
                {prompts.map((p, i) => (
                  <label key={p}>
                    {p}
                    <select
                      value={answers[i] ?? "skip"}
                      onChange={(e) =>
                        setAnswers({ ...answers, [i]: e.target.value })
                      }
                    >
                      <option value="skip">Bỏ qua</option>
                      <option value="often">Thường xuyên</option>
                      <option value="sometimes">Đôi khi</option>
                      <option value="rarely">Hiếm khi</option>
                    </select>
                  </label>
                ))}
              </details>
              <Button onClick={() => setStep(1)} className="wide">
                Bắt đầu hành trình <Sprout size={18} />
              </Button>
              <p className="onboard-privacy">
                Không tài khoản. Không quảng cáo. Dữ liệu ở trên thiết bị.
                <br />
                Một thử nghiệm thói quen, không phải công cụ y tế.
              </p>
            </>
          ) : step === 1 ? (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                setStep(2);
              }}
            >
              <p className="eyebrow">BIẾT MÌNH ĐANG Ở ĐÂU</p>
              <h2>Điểm xuất phát của bạn.</h2>
              <p className="muted">
                Ước lượng trung bình 7 ngày gần đây, hoặc xem Screen Time. Không
                biết thì để trống — không cần đoán.
              </p>
              <MetricsFields values={baseline} setValues={setBaseline} />
              <p className="small muted">
                Số liệu tự nhập. Video ngắn có thể cần ước lượng riêng từ tổng
                Screen Time.
              </p>
              <div className="form-actions">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setStep(0)}
                >
                  <ChevronLeft size={18} /> Quay lại
                </Button>
                <Button type="submit">Tiếp tục</Button>
              </div>
            </form>
          ) : (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                void finish();
              }}
            >
              <p className="eyebrow">MỘT KHỞI ĐẦU VỪA SỨC</p>
              <h2>Chọn nhịp của bạn.</h2>
              <p className="muted">
                Có thể thay đổi mục tiêu bất cứ lúc nào. Ưu tiên giấc ngủ và
                công việc cần thiết.
              </p>
              <div className="field-grid">
                <label className="field">
                  Ngày bắt đầu
                  <Input
                    required
                    type="date"
                    value={start}
                    onChange={(e) => setStart(e.target.value)}
                  />
                </label>
                <label className="field">
                  Múi giờ
                  <Input
                    required
                    list="timezones"
                    value={tz}
                    onChange={(e) => setTz(e.target.value)}
                  />
                  <datalist id="timezones">
                    <option>Asia/Ho_Chi_Minh</option>
                    <option>Asia/Singapore</option>
                    <option>Europe/London</option>
                    <option>America/New_York</option>
                  </datalist>
                </label>
                <label className="field">
                  Tập trung (phút/phiên)
                  <Input
                    type="number"
                    min="1"
                    max="180"
                    required
                    value={goal.focus}
                    onChange={(e) =>
                      setGoal({ ...goal, focus: Number(e.target.value) })
                    }
                  />
                </label>
                <label className="field">
                  Đọc (phút/ngày)
                  <Input
                    type="number"
                    min="1"
                    max="180"
                    required
                    value={goal.reading}
                    onChange={(e) =>
                      setGoal({ ...goal, reading: Number(e.target.value) })
                    }
                  />
                </label>
                <label className="field">
                  Ngủ (giờ/đêm)
                  <Input
                    type="number"
                    min="1"
                    max="24"
                    step="0.5"
                    required
                    value={goal.sleep}
                    onChange={(e) =>
                      setGoal({ ...goal, sleep: Number(e.target.value) })
                    }
                  />
                </label>
                <label className="field">
                  Giới hạn video ngắn (phút)
                  <Input
                    type="number"
                    min="0"
                    max="1440"
                    placeholder={
                      baseline.video === null
                        ? "Để trống nếu chưa biết"
                        : `${Math.round(baseline.video * 0.7)} · theo baseline`
                    }
                    value={goal.video}
                    onChange={(e) =>
                      setGoal({ ...goal, video: e.target.value })
                    }
                  />
                </label>
              </div>
              <label className="field">
                Khoảng thời gian thuận tiện
                <Input
                  placeholder="Ví dụ: đọc sau bữa tối, tập trung buổi sáng"
                  maxLength={500}
                  value={routine}
                  onChange={(e) => setRoutine(e.target.value)}
                />
              </label>
              <p className="notice small">
                Mục tiêu mặc định tăng dần qua 4 giai đoạn. Mục tiêu bạn chỉnh
                riêng sẽ được giữ. Không cần hoàn thành mọi thứ mới được sang
                ngày tiếp theo.
              </p>
              <div className="form-actions">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setStep(1)}
                >
                  <ChevronLeft size={18} /> Quay lại
                </Button>
                <Button disabled={saving} type="submit">
                  {saving ? "Đang tạo…" : "Sẵn sàng, bắt đầu thôi"}
                </Button>
              </div>
            </form>
          )}
          <RestoreBackup onRestored={onDone} hasData={data.runs.length > 0} />
          {onCancel && (
            <Button variant="ghost" onClick={onCancel}>
              Giữ hành trình hiện tại
            </Button>
          )}
        </section>
      </main>
      <footer className="onboard-footer">
        ReMind · Rebuild your focus{" "}
        <span>Ít thời gian trong app. Nhiều thời gian cho cuộc sống.</span>
      </footer>
    </div>
  );
}
