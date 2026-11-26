import { Route, Check, ChevronRight, Leaf } from "lucide-react";
import { program, dayNumber, addDays } from "../domain/model";
import type { AppData, Run } from "../domain/types";
import { Button } from "../components/ui/button";
export function Program({
  data,
  run,
  onDay,
}: {
  data: AppData;
  run: Run;
  onDay: (day: number) => void;
}) {
  const current = dayNumber(run);
  const done = data.logs.filter(
    (l) => l.runId === run.id && l.status === "submitted",
  ).length;
  return (
    <>
      <div className="page-header">
        <div>
          <div className="eyebrow">
            <Route size={16} /> HÀNH TRÌNH 30 NGÀY
          </div>
          <h1>Mỗi bước nhỏ đều có chỗ.</h1>
          <p className="muted">
            4 giai đoạn, một nhịp của riêng bạn. Có thể xem trước và quay lại
            bất kỳ ngày nào.
          </p>
        </div>
        <span className="badge">{done} ngày đã ghi nhận</span>
      </div>
      <div className="program-intro">
        <Leaf size={25} />
        <div>
          <strong>Không cần bắt kịp. Chỉ cần tiếp tục.</strong>
          <p>
            Ngày bỏ lỡ không phải điểm 0. Bạn không cần làm bù để được bước
            tiếp.
          </p>
        </div>
      </div>
      <div className="phases">
        {program.phases.map((phase, i) => (
          <section className="card phase-card" key={phase.id}>
            <div className="phase-heading">
              <span className={`phase-number phase-${i}`}>
                {String(i + 1).padStart(2, "0")}
              </span>
              <div>
                <span className="eyebrow">
                  NGÀY {phase.startDay}–{phase.endDay}
                </span>
                <h2>{phase.title}</h2>
                <p>
                  {phase.targets.focusMinutes} phút tập trung ·{" "}
                  {phase.targets.readingMinutes} phút đọc
                </p>
              </div>
              {current >= phase.startDay && current <= phase.endDay && (
                <span className="badge">Bạn đang ở đây</span>
              )}
            </div>
            <div className="program-days">
              {program.days
                .filter((d) => d.phaseId === phase.id)
                .map((d) => {
                  const log = data.logs.find(
                    (x) => x.runId === run.id && x.day === d.day,
                  );
                  return (
                    <button
                      key={d.day}
                      onClick={() => onDay(d.day)}
                      className={`program-day ${d.day === current ? "current" : ""}`}
                    >
                      <span
                        className={`day-number ${log?.status === "submitted" ? "submitted" : ""}`}
                      >
                        {log?.status === "submitted" ? (
                          <Check size={18} />
                        ) : (
                          String(d.day).padStart(2, "0")
                        )}
                      </span>
                      <div>
                        <strong>{d.title}</strong>
                        <small>
                          {addDays(run.startDate, d.day - 1)
                            .split("-")
                            .reverse()
                            .slice(0, 2)
                            .join("/")}{" "}
                          ·{" "}
                          {log?.status === "submitted"
                            ? "Đã khép lại"
                            : log
                              ? "Bản nháp"
                              : d.day > current
                                ? "Xem trước"
                                : d.day === current
                                  ? "Hôm nay"
                                  : "Chưa ghi nhận"}
                        </small>
                      </div>
                      {d.reviewType && (
                        <span className="review-label">Review</span>
                      )}
                      <ChevronRight size={17} />
                    </button>
                  );
                })}
            </div>
          </section>
        ))}
      </div>
    </>
  );
}
