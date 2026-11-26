import { useRef, useState } from "react";
import {
  Download,
  Upload,
  ShieldCheck,
  Smartphone,
  Settings as SettingsIcon,
  RefreshCw,
  Trash2,
  Database,
  Calendar,
  Check,
  Share,
  PlusSquare,
} from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";
import { Dialog, DialogContent } from "../components/ui/dialog";
import {
  updateData,
  exportBackup,
  validateBackup,
  importBackup,
  resetData,
} from "../data/store";
import { dayNumber, goalsForDay, localDate } from "../domain/model";
import type { AppData, Goals, Run } from "../domain/types";
import { MetricsFields } from "./Onboarding";
import { perform } from "../App";
function download(text: string, name: string, type = "application/json") {
  const url = URL.createObjectURL(new Blob([text], { type }));
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
export function Settings({
  data,
  run,
  onNewRun,
}: {
  data: AppData;
  run: Run;
  onNewRun: () => void;
}) {
  const today = Math.max(1, Math.min(30, dayNumber(run)));
  const [goals, setGoals] = useState<Goals>(
    goalsForDay(run, today, data.overrides),
  );
  const [fromDay, setFromDay] = useState(today);
  const [baseline, setBaseline] = useState(run.baseline);
  const [baselineOpen, setBaselineOpen] = useState(false);
  const [resetOpen, setResetOpen] = useState(false);
  const [resetWord, setResetWord] = useState("");
  const [importText, setImportText] = useState("");
  const [preview, setPreview] = useState<AppData | null>(null);
  const [tz, setTz] = useState(data.settings.displayTimeZone);
  const [routine, setRoutine] = useState(run.routine ?? "");
  const [busy, setBusy] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);
  const backup = () =>
    perform(async () => {
      const text = await exportBackup();
      download(text, `remind-${localDate(run.timeZone)}.json`);
    }, "Đã tải bản sao lưu. Giữ file ở nơi riêng tư.");
  async function readImport(file?: File) {
    if (!file) return;
    await perform(async () => {
      if (file.size > 10 * 1024 * 1024)
        throw new Error("File vượt quá giới hạn 10 MB.");
      const text = await file.text();
      const parsed = validateBackup(text);
      setImportText(text);
      setPreview(parsed);
    });
    if (fileInput.current) fileInput.current.value = "";
  }
  const csv = () => {
    const columns = [
      "date",
      "day",
      "mode",
      "status",
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
      "reflection",
    ];
    const escape = (x: unknown) => {
      let value = x === null || x === undefined ? "" : String(x);
      if (/^[=+\-@\t\r]/.test(value)) value = "'" + value;
      return '"' + value.replace(/"/g, '""') + '"';
    };
    const rows = data.logs
      .filter((x) => x.runId === run.id)
      .sort((a, b) => a.day - b.day)
      .map((l) => [
        l.date,
        l.day,
        l.mode,
        l.status,
        l.metrics.video,
        l.metrics.pickups,
        l.metrics.sleep,
        l.metrics.reading,
        l.metrics.focus,
        l.metrics.energy,
        l.metrics.moderate,
        l.metrics.vigorous,
        l.metrics.light,
        l.metrics.complex,
        l.metrics.independent,
        l.reflection,
      ]);
    download(
      "\ufeff" +
        [columns, ...rows].map((r) => r.map(escape).join(",")).join("\r\n"),
      "remind-ghi-nhan.csv",
      "text/csv;charset=utf-8",
    );
  };
  return (
    <>
      <div className="page-header">
        <div>
          <div className="eyebrow">
            <SettingsIcon size={15} /> KHÔNG GIAN CỦA BẠN
          </div>
          <h1>Vừa với nhịp sống của bạn.</h1>
          <p className="muted">
            Mục tiêu có thể đổi. Dữ liệu luôn thuộc về bạn.
          </p>
        </div>
      </div>
      <div className="settings-layout">
        <div className="stack">
          <section className="card">
            <div className="section-heading">
              <h2>Mục tiêu & nhịp sinh hoạt</h2>
              <span className="icon-tile">
                <Calendar size={19} />
              </span>
            </div>
            <p className="muted">
              Thay đổi áp dụng từ ngày bạn chọn, giữ nguyên mục tiêu của những
              ngày đã có ghi chép.
            </p>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                void perform(
                  () =>
                    updateData((d) => {
                      d.overrides.push({
                        id: crypto.randomUUID(),
                        runId: run.id,
                        effectiveFromDay: fromDay,
                        goals,
                        reason: "Mục tiêu cá nhân",
                        createdAt: new Date().toISOString(),
                      });
                      const rr = d.runs.find((r) => r.id === run.id)!;
                      rr.routine = routine;
                      rr.updatedAt = new Date().toISOString();
                    }),
                  "Đã lưu mục tiêu mới.",
                );
              }}
            >
              <div className="field-grid">
                {(
                  [
                    { key: "focus", label: "Tập trung (phút)", max: 180 },
                    { key: "reading", label: "Đọc (phút)", max: 180 },
                    {
                      key: "thinking",
                      label: "Suy nghĩ trước AI (phút)",
                      max: 180,
                    },
                    { key: "sleep", label: "Ngủ (giờ)", max: 24 },
                    {
                      key: "video",
                      label: "Giới hạn video ngắn (phút)",
                      max: 1440,
                    },
                    { key: "activity", label: "Vận động (phút)", max: 180 },
                  ] as const
                ).map((f) => (
                  <label className="field" key={f.key}>
                    {f.label}
                    <Input
                      required={f.key !== "video"}
                      type="number"
                      min={f.key === "video" ? 0 : 1}
                      max={f.max}
                      step={f.key === "sleep" ? 0.5 : 1}
                      value={goals[f.key] ?? ""}
                      onChange={(e) =>
                        setGoals({
                          ...goals,
                          [f.key]:
                            e.target.value === ""
                              ? null
                              : Number(e.target.value),
                        })
                      }
                    />
                  </label>
                ))}
              </div>
              <label className="field">
                Áp dụng từ ngày
                <Input
                  required
                  type="number"
                  min={today}
                  max="30"
                  value={fromDay}
                  onChange={(e) => setFromDay(Number(e.target.value))}
                />
              </label>
              <label className="field">
                Nhịp sinh hoạt của bạn
                <Textarea
                  value={routine}
                  maxLength={500}
                  placeholder="Buổi sáng tập trung, sau bữa tối đọc sách…"
                  onChange={(e) => setRoutine(e.target.value)}
                />
              </label>
              <Button type="submit" disabled={dayNumber(run) > 30}>
                Lưu mục tiêu
              </Button>
              {dayNumber(run) > 30 && (
                <p className="small muted">
                  Hành trình đã kết thúc. Chọn thói quen duy trì trong tổng kết
                  ngày 30, hoặc bắt đầu hành trình mới.
                </p>
              )}
            </form>
            <details className="settings-detail">
              <summary>Sửa mục tiêu của riêng một ngày đã ghi</summary>
              <p className="small muted">
                Thay đổi này làm thay đổi mục tiêu tham chiếu của ngày đó. Trạng
                thái được giữ để bạn kiểm tra lại; ngày sẽ trở thành bản nháp.
              </p>
              <div className="field">
                <select id="snapshot-day" defaultValue="">
                  <option value="" disabled>
                    Chọn ngày đã ghi
                  </option>
                  {data.logs
                    .filter((l) => l.runId === run.id)
                    .map((l) => (
                      <option key={l.id} value={l.day}>
                        Ngày {l.day}
                      </option>
                    ))}
                </select>
                <Button
                  variant="outline"
                  onClick={() => {
                    const value = Number(
                      (
                        document.getElementById(
                          "snapshot-day",
                        ) as HTMLSelectElement
                      ).value,
                    );
                    if (!value) return;
                    if (
                      window.confirm(
                        `Áp dụng bộ mục tiêu phía trên cho ngày ${value} và mở lại bản nháp?`,
                      )
                    )
                      void perform(
                        () =>
                          updateData((d) => {
                            const l = d.logs.find(
                              (l) => l.runId === run.id && l.day === value,
                            )!;
                            l.goals = { ...goals };
                            l.status = "draft";
                            l.updatedAt = new Date().toISOString();
                          }),
                        "Đã đổi mục tiêu. Kiểm tra lại trạng thái của ngày đó.",
                      );
                  }}
                >
                  Xác nhận sửa ngày đã chọn
                </Button>
              </div>
            </details>
          </section>
          <section className="card">
            <div className="section-heading">
              <h2>Điểm xuất phát</h2>
              <Button variant="outline" onClick={() => setBaselineOpen(true)}>
                Chỉnh baseline
              </Button>
            </div>
            <p className="muted">
              Bạn có thể bổ sung những gì chưa biết. Chỉnh baseline sẽ thay đổi
              các phép so sánh trong Tiến triển.
            </p>
            <p className="small">
              Cập nhật:{" "}
              {new Date(
                run.baselineUpdatedAt ?? run.createdAt,
              ).toLocaleDateString("vi-VN")}
            </p>
            <label className="field">
              Múi giờ hiển thị
              <Input
                value={tz}
                onChange={(e) => setTz(e.target.value)}
                placeholder="Asia/Ho_Chi_Minh"
              />
            </label>
            <p className="small muted">
              Lịch hành trình luôn dùng {run.timeZone}. Đổi múi giờ hiển thị
              không chuyển ngày đã ghi.
            </p>
            <Button
              variant="outline"
              onClick={() =>
                perform(
                  () =>
                    updateData((d) => {
                      new Intl.DateTimeFormat("vi", { timeZone: tz }).format();
                      d.settings.displayTimeZone = tz;
                    }),
                  "Đã đổi múi giờ hiển thị.",
                )
              }
            >
              Lưu múi giờ
            </Button>
          </section>
          <section className="card">
            <div className="section-heading">
              <h2>Các hành trình của bạn</h2>
              <span className="badge">{data.runs.length} hành trình</span>
            </div>
            {data.runs.map((r) => (
              <div className="run-row" key={r.id}>
                <div>
                  <strong>
                    Bắt đầu {r.startDate.split("-").reverse().join("/")}
                  </strong>
                  <p className="small muted">
                    {
                      data.logs.filter(
                        (l) => l.runId === r.id && l.status === "submitted",
                      ).length
                    }{" "}
                    ngày đã khép lại{r.id === run.id ? " · Đang xem" : ""}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  disabled={r.id === run.id}
                  onClick={() =>
                    perform(() =>
                      updateData((d) => {
                        d.activeRunId = r.id;
                      }),
                    )
                  }
                >
                  Mở
                </Button>
              </div>
            ))}
            <Button variant="outline" onClick={onNewRun}>
              <PlusSquare size={17} /> Bắt đầu hành trình mới
            </Button>
          </section>
        </div>
        <aside className="stack">
          <section className="card privacy-card">
            <ShieldCheck size={30} />
            <h2>Riêng tư từ những điều nhỏ.</h2>
            <p>
              Nhật ký và số liệu được lưu trong trình duyệt trên thiết bị này.
              Không gửi lên máy chủ, không theo dõi, không tự đồng bộ.
            </p>
            <p className="small muted">
              Đây không phải kho mã hóa. Xóa dữ liệu trình duyệt, đổi thiết bị
              hoặc trình duyệt tự dọn bộ nhớ có thể làm mất dữ liệu. Tránh ghi
              mật khẩu hay thông tin công việc mật.
            </p>
          </section>
          <section className="card">
            <div className="section-heading">
              <h2>Mang dữ liệu theo bạn</h2>
              <Database size={20} />
            </div>
            <p className="small muted">
              Bản JSON chứa toàn bộ dữ liệu riêng tư. Sao lưu định kỳ và giữ
              file ở nơi an toàn.
            </p>
            <div className="stack">
              <Button onClick={backup}>
                <Download size={17} /> Xuất bản sao lưu JSON
              </Button>
              <Button
                variant="outline"
                onClick={() => fileInput.current?.click()}
              >
                <Upload size={17} /> Khôi phục từ bản sao lưu
              </Button>
              <input
                ref={fileInput}
                type="file"
                accept=".json,application/json"
                hidden
                onChange={(e) => void readImport(e.target.files?.[0])}
              />
              <Button variant="ghost" onClick={csv}>
                Tải số liệu đã nhập CSV
              </Button>
            </div>
            <p className="tiny-note">
              CSV không phải bản sao lưu đầy đủ. JSON gồm cả phiên tập trung và
              thẻ nhớ.
            </p>
            <p className="small muted">
              Lần sao lưu:{" "}
              {data.settings.lastBackupAt
                ? new Date(data.settings.lastBackupAt).toLocaleString("vi-VN")
                : "Chưa có"}
            </p>
            <Button
              variant="ghost"
              onClick={() =>
                perform(async () => {
                  const granted = await navigator.storage?.persist?.();
                  if (!granted)
                    throw new Error(
                      "Trình duyệt chưa cấp lưu trữ bền vững. Bạn vẫn có thể dùng app và xuất bản sao.",
                    );
                }, "Trình duyệt đã cấp lưu trữ bền vững. Vẫn nên sao lưu.")
              }
            >
              Giữ dữ liệu trên thiết bị
            </Button>
          </section>
          <section className="card install-card">
            <Smartphone size={28} />
            <h2>Một chạm, vào khoảng riêng.</h2>
            <p>Thêm ReMind vào màn hình chính iPhone:</p>
            <ol>
              <li>
                Mở đường dẫn bằng <strong>Safari</strong>.
              </li>
              <li>
                Chạm <strong>Chia sẻ</strong> <Share size={15} /> rồi{" "}
                <strong>Thêm vào Màn hình chính</strong>.
              </li>
              <li>
                Chạm <strong>Thêm</strong>. Vậy là xong.
              </li>
            </ol>
            <p className="small muted">
              Mở online một lần để tải app. Sau đó vẫn ghi chép được khi
              offline. Timer khi rời app cần bạn xác nhận thời gian thực tế.
            </p>
          </section>
          <section className="card reset-card">
            <h3>Bắt đầu lại dữ liệu</h3>
            <p className="small muted">
              Xóa toàn bộ hành trình, nhật ký và phiên trên thiết bị này.
            </p>
            <Button
              variant="ghost"
              className="danger-text"
              onClick={() => setResetOpen(true)}
            >
              <Trash2 size={16} /> Xóa dữ liệu trên thiết bị
            </Button>
          </section>
        </aside>
      </div>
      <Dialog open={baselineOpen} onOpenChange={setBaselineOpen}>
        <DialogContent
          title="Chỉnh điểm xuất phát"
          description="Việc này thay đổi các phép so sánh, không thay đổi số liệu những ngày đã ghi."
        >
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void perform(
                () =>
                  updateData((d) => {
                    const r = d.runs.find((x) => x.id === run.id)!;
                    r.baseline = {
                      ...baseline,
                      testMinutes: baseline.switches !== null ? 15 : null,
                    };
                    r.baselineUpdatedAt = new Date().toISOString();
                    r.updatedAt = r.baselineUpdatedAt;
                  }),
                "Đã cập nhật baseline.",
              ).then((ok) => {
                if (ok) setBaselineOpen(false);
              });
            }}
          >
            <MetricsFields values={baseline} setValues={setBaseline} />
            <Button className="wide" type="submit">
              Xác nhận cập nhật baseline
            </Button>
          </form>
        </DialogContent>
      </Dialog>
      <Dialog
        open={preview !== null}
        onOpenChange={(open) => {
          if (!open) {
            setPreview(null);
            setImportText("");
          }
        }}
      >
        <DialogContent
          title="Khôi phục bản sao lưu?"
          description="Dữ liệu trong file sẽ thay thế toàn bộ dữ liệu đang có trên thiết bị này."
        >
          {preview && (
            <>
              <div className="notice">
                {preview.runs.length} hành trình · {preview.logs.length} ngày
                ghi chép · {preview.sessions.length} phiên ·{" "}
                {preview.cards.length} thẻ nhớ
              </div>
              <p>
                Nên tải bản sao hiện tại trước khi tiếp tục. Việc thay thế được
                thực hiện toàn bộ, file không hợp lệ sẽ không làm thay đổi dữ
                liệu.
              </p>
              <div className="stack">
                <Button variant="outline" onClick={backup}>
                  <Download size={16} /> Sao lưu dữ liệu hiện tại
                </Button>
                <Button
                  disabled={busy}
                  onClick={() => {
                    setBusy(true);
                    void perform(async () => {
                      await importBackup(importText);
                      setPreview(null);
                      setImportText("");
                    }, "Đã khôi phục bản sao lưu.").finally(() =>
                      setBusy(false),
                    );
                  }}
                >
                  Xác nhận thay thế dữ liệu
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
      <Dialog open={resetOpen} onOpenChange={setResetOpen}>
        <DialogContent
          title="Xóa dữ liệu trên thiết bị?"
          description="Thao tác này xóa toàn bộ hành trình và ghi chép. Bạn chỉ có thể khôi phục nếu đã giữ bản sao JSON."
        >
          <div className="stack">
            <Button variant="outline" onClick={backup}>
              Xuất bản sao trước
            </Button>
            <label className="field">
              Nhập XÓA để xác nhận
              <Input
                value={resetWord}
                onChange={(e) => setResetWord(e.target.value)}
              />
            </label>
            <Button
              variant="destructive"
              disabled={resetWord !== "XÓA"}
              onClick={() =>
                perform(async () => {
                  await resetData();
                  setResetOpen(false);
                })
              }
            >
              Xóa toàn bộ dữ liệu
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
