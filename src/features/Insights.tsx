import { useState } from "react";
import {
  Activity,
  BookOpen,
  Brain,
  ChartNoAxesColumnIncreasing,
  Moon,
  Smartphone,
  Target,
} from "lucide-react";
import { Button } from "../components/ui/button";
import { summarize, type NumericMetric } from "../domain/model";
import type { AppData, Run } from "../domain/types";
import "./library-insights.css";

const number = (value: number | null, decimals = 1) =>
  value === null
    ? "—"
    : new Intl.NumberFormat("vi-VN", {
        maximumFractionDigits: decimals,
      }).format(value);
const percent = (value: number | null) =>
  value === null ? "—" : `${number(value * 100, 0)}%`;
const shortDate = (date: string) => {
  const [, month, day] = date.split("-");
  return `${day}/${month}`;
};
const metricLabels: {
  key: NumericMetric;
  label: string;
  unit: string;
  icon: typeof Target;
}[] = [
  {
    key: "focus",
    label: "Tập trung liên tục",
    unit: "phút / ngày",
    icon: Target,
  },
  { key: "video", label: "Video ngắn", unit: "phút / ngày", icon: Smartphone },
  {
    key: "reading",
    label: "Đọc có chủ đích",
    unit: "phút / ngày",
    icon: BookOpen,
  },
  { key: "sleep", label: "Giấc ngủ", unit: "giờ / đêm", icon: Moon },
];
const chartLabels = {
  focus: "Tập trung",
  reading: "Đọc",
  video: "Video ngắn",
  energy: "Năng lượng",
};

export function Insights({ data, run }: { data: AppData; run: Run }) {
  const summary = summarize(data, run);
  const [chart, setChart] = useState<keyof typeof chartLabels>("focus");
  const maximum =
    chart === "energy"
      ? 10
      : Math.max(10, ...summary.trend.map((item) => item[chart] ?? 0));
  const hasChartData = summary.trend.some((item) => item[chart] !== null);
  const runLogs = data.logs.filter((log) => log.runId === run.id);
  const windowLogs = runLogs.filter(
    (log) => log.date >= summary.startDate && log.date <= summary.endDate,
  );
  const aerobicCoverage = windowLogs.filter(
    (log) => log.metrics.moderate !== null || log.metrics.vigorous !== null,
  ).length;
  const strengthCoverage = windowLogs.filter(
    (log) => log.metrics.strength !== null,
  ).length;
  const recallCards = data.cards.filter(
    (card) => card.runId === run.id && card.ideas.length === 5,
  );
  const nextDayReviews = data.recallReviews.filter((review) => {
    const card = recallCards.find((item) => item.id === review.cardId);
    if (
      !card ||
      review.actualDate < summary.startDate ||
      review.actualDate > summary.endDate ||
      review.total !== 5
    )
      return false;
    const created = new Date(`${card.createdDate}T12:00:00Z`);
    created.setUTCDate(created.getUTCDate() + 1);
    return review.actualDate === created.toISOString().slice(0, 10);
  });
  const recallMean = nextDayReviews.length
    ? nextDayReviews.reduce((sum, item) => sum + item.matched, 0) /
      nextDayReviews.length
    : null;
  return (
    <div className="stack insights-page">
      <header className="page-header">
        <p className="eyebrow">NHÌN LẠI, KHÔNG PHÁN XÉT</p>
        <h1>Những thay đổi nhỏ.</h1>
        <p className="muted">
          Quan sát điều đang phù hợp với bạn. Dữ liệu tự ghi nhận, không phải
          thước đo sức khỏe hay khả năng nhận thức.
        </p>
      </header>
      <section className="card insights-overview">
        <div>
          <span className="badge">
            {shortDate(summary.startDate)} – {shortDate(summary.endDate)}
          </span>
          <h2>Bảy ngày gần nhất</h2>
          <p className="muted">
            Cửa sổ 7 ngày theo lịch · {run.timeZone}
            <br />
            {summary.coverage === 0 && summary.metricDays === 0
              ? "Chưa có ghi nhận trong khoảng này. Hãy bắt đầu bằng hôm nay."
              : `${summary.coverage}/7 ngày có nhật ký · ${summary.submitted} ngày đã hoàn tất · ${summary.coverage - summary.submitted} bản nháp. ${summary.metricDays}/7 ngày có số liệu.`}
          </p>
        </div>
        <div
          className="coverage-visual"
          aria-label={`${summary.coverage} trên 7 ngày có nhật ký`}
        >
          <strong>
            {summary.coverage}
            <span>/7</span>
          </strong>
          <span>ngày có nhật ký</span>
          <div className="coverage-dots" aria-hidden="true">
            {summary.trend.map((item) => (
              <i
                key={item.date}
                className={
                  runLogs.some((log) => log.date === item.date) ? "filled" : ""
                }
              />
            ))}
          </div>
        </div>
      </section>
      <div className="metrics-grid insights-metrics">
        {metricLabels.map((metric) => {
          const item = summary.metrics[metric.key];
          return (
            <article className="card stat-card" key={metric.key}>
              <div className="stat-heading">
                <span>{metric.label}</span>
                <metric.icon size={19} aria-hidden="true" />
              </div>
              <div className="stat-value">
                {number(item.mean)}
                <span>{metric.unit}</span>
              </div>
              <div className="stat-comparison">
                <span>
                  Mốc ban đầu <strong>{number(item.baseline)}</strong>
                </span>
                <span>{item.count}/7 ngày</span>
              </div>
              {item.change !== null ? (
                <p className="metric-change">
                  {item.change === 0
                    ? "Không đổi so với mốc ban đầu"
                    : `${item.change > 0 ? "Tăng" : "Giảm"} ${number(Math.abs(item.change))} ${metric.key === "sleep" ? "giờ" : "phút"}`}
                  {metric.key === "video" &&
                  item.reductionPercent !== null &&
                  item.change !== 0
                    ? ` (${number(Math.abs(item.reductionPercent))}%)`
                    : ""}
                </p>
              ) : (
                <p className="metric-change muted">
                  {item.baseline === null
                    ? "Chưa có mốc ban đầu để so sánh"
                    : "Chưa đủ dữ liệu để so sánh"}
                </p>
              )}
            </article>
          );
        })}
      </div>
      <section className="card trend-card">
        <div className="section-heading">
          <div>
            <p className="eyebrow">MỖI NGÀY MỘT CHÚT</p>
            <h2>Nhịp của bạn</h2>
          </div>
          <ChartNoAxesColumnIncreasing size={24} aria-hidden="true" />
        </div>
        <div
          className="library-filters"
          role="group"
          aria-label="Chỉ số biểu đồ"
        >
          {Object.entries(chartLabels).map(([key, label]) => (
            <Button
              key={key}
              size="sm"
              variant={chart === key ? "default" : "ghost"}
              aria-pressed={chart === key}
              onClick={() => setChart(key as keyof typeof chartLabels)}
            >
              {label}
            </Button>
          ))}
        </div>
        <p className="muted chart-unit">
          {chart === "energy"
            ? "Năng lượng tự đánh giá, thang 1–10"
            : chart === "focus"
              ? "Phút tập trung liên tục dài nhất mỗi ngày"
              : "Phút thực tế mỗi ngày"}
        </p>
        <div
          className="trend-chart"
          role="img"
          aria-label={`${chartLabels[chart]}, ${summary.trend.map((item) => `${shortDate(item.date)}: ${item[chart] === null ? "chưa ghi nhận" : number(item[chart])}`).join("; ")}`}
        >
          {summary.trend.map((item) => (
            <div className="trend-column" key={item.date}>
              <span className="trend-value">{number(item[chart])}</span>
              <div className="trend-track">
                <div
                  className={`trend-bar ${item[chart] === null ? "is-missing" : ""}`}
                  style={{
                    height:
                      item[chart] === null
                        ? "3px"
                        : `${Math.max(item[chart] === 0 ? 1 : 3, (item[chart]! / maximum) * 100)}%`,
                  }}
                />
              </div>
              <span className="trend-date">{shortDate(item.date)}</span>
            </div>
          ))}
        </div>
        <p className="muted chart-note">
          {hasChartData
            ? "Dấu “—” là chưa ghi nhận; số 0 là bạn đã ghi nhận bằng 0. Khoảng trống không được tính thành thất bại."
            : "Biểu đồ sẽ xuất hiện khi bạn ghi số liệu. Không cần điền bù những ngày mình không nhớ."}
        </p>
      </section>
      <div className="insights-two-columns">
        <section className="card adherence-card">
          <p className="eyebrow">THÓI QUEN ĐÃ HOÀN THÀNH</p>
          <h2>Đều đặn theo sức mình</h2>
          <div className="adherence-row">
            <div>
              <h3>Ngày thường</h3>
              <p className="muted">{summary.standardDays} ngày đã hoàn tất</p>
            </div>
            <strong>{percent(summary.adherence.standard)}</strong>
          </div>
          <div className="quiet-progress" aria-hidden="true">
            <i
              style={{ width: `${(summary.adherence.standard ?? 0) * 100}%` }}
            />
          </div>
          <div className="adherence-row">
            <div>
              <h3>Ngày nhẹ</h3>
              <p className="muted">{summary.minimumDays} ngày đã hoàn tất</p>
            </div>
            <strong>{percent(summary.adherence.minimum)}</strong>
          </div>
          <div className="quiet-progress minimum" aria-hidden="true">
            <i
              style={{ width: `${(summary.adherence.minimum ?? 0) * 100}%` }}
            />
          </div>
          <p className="muted card-explanation">
            Tổng việc hoàn thành / tổng việc áp dụng của các ngày đã chốt. Hai
            chế độ được tính riêng. Bản nháp và việc không áp dụng không bị coi
            là không hoàn thành.
          </p>
          <div className="insight-footline">
            <span>{summary.missionDone} nhiệm vụ đã đánh dấu</span>
            <span>{summary.missingDays} ngày đã qua chưa có nhật ký</span>
          </div>
        </section>
        <section className="card activity-card">
          <div className="section-heading">
            <div>
              <p className="eyebrow">VẬN ĐỘNG & PHỤC HỒI</p>
              <h2>Cho cơ thể khoảng thở</h2>
            </div>
            <Activity size={24} aria-hidden="true" />
          </div>
          <div className="activity-total">
            <strong>
              {aerobicCoverage
                ? number(summary.activity.moderateEquivalent, 0)
                : "—"}
            </strong>
            <span>phút vận động tương đương vừa</span>
          </div>
          <p className="muted">
            Phút vừa + 2 × phút mạnh · {aerobicCoverage}/7 ngày có số liệu cường
            độ vừa hoặc mạnh.
          </p>
          <div className="activity-meta">
            <span>
              Tập sức mạnh{" "}
              <strong>
                {strengthCoverage
                  ? `${summary.activity.strengthDays} ngày (${strengthCoverage}/7 ghi nhận)`
                  : "—"}
              </strong>
            </span>
            <span>
              Vận động nhẹ{" "}
              <strong>
                {summary.metrics.light.count
                  ? `${number(summary.metrics.light.mean)} phút/ngày`
                  : "—"}
              </strong>
            </span>
          </div>
          <p className="muted card-explanation">
            WHO gợi ý người lớn hướng tới ít nhất 150 phút tương đương vừa và 2
            ngày tập sức mạnh mỗi tuần, khi phù hợp. Thời gian vận động nhẹ được
            hiển thị riêng. Dữ liệu thiếu khiến tổng tuần chưa đầy đủ.
          </p>
        </section>
      </div>
      <div className="insights-two-columns">
        <section className="card">
          <div className="section-heading">
            <h2>Suy nghĩ trước khi hỏi AI</h2>
            <Brain size={23} aria-hidden="true" />
          </div>
          <div className="insight-ratio">
            {percent(summary.thinking.ratio)}
            <span>
              {summary.thinking.total
                ? `${summary.thinking.independent}/${summary.thinking.total} việc phức tạp đã tự suy nghĩ trước`
                : "Chưa có việc phức tạp được ghi nhận đầy đủ"}
            </span>
          </div>
          <p className="muted">
            Tính từ tổng số việc, không lấy trung bình phần trăm từng ngày.
            Không có việc phức tạp thì không áp dụng.
          </p>
        </section>
        <section className="card">
          <div className="section-heading">
            <h2>Nhớ lại vào ngày kế tiếp</h2>
            <BookOpen size={23} aria-hidden="true" />
          </div>
          <div className="insight-ratio">
            {recallMean === null ? "—" : `${number(recallMean)}/5`}
            <span>
              {nextDayReviews.length} lượt ôn thẻ 5 ý vào ngày kế tiếp
            </span>
          </div>
          <p className="muted">
            Chỉ so sánh những thẻ có 5 ý được ôn vào ngày ngay sau khi tạo. Đây
            là tự đánh giá, không có nghĩa chính xác sau 24 giờ.
          </p>
        </section>
      </div>
      <section className="card">
        <h2>Những quan sát khác</h2>
        <p className="muted">So sánh cùng điều kiện, chỉ từ số liệu đã biết.</p>
        <div className="comparison-table-wrap">
          <table className="comparison-table">
            <caption className="sr-only">Baseline và trung bình trong cửa sổ bảy ngày</caption>
            <thead><tr><th scope="col">Quan sát</th><th scope="col">Ban đầu</th><th scope="col">Gần đây</th><th scope="col">Ngày có số liệu</th></tr></thead>
            <tbody>{([
              ['pickups', 'Cầm điện thoại · lần/ngày'],
              ['switches', 'Tự chuyển việc · bài 15 phút'],
              ['energy', 'Năng lượng tự đánh giá · 1–10'],
            ] as const).map(([key, label]) => <tr key={key}><th scope="row">{label}</th><td>{number(summary.metrics[key].baseline)}</td><td>{number(summary.metrics[key].mean)}</td><td>{summary.metrics[key].count}/7</td></tr>)}</tbody>
          </table>
        </div>
        <p className="small muted">Chuyển việc chỉ được so sánh khi bài thực hành dài đúng 15 phút. Số gián đoạn của timer là một số đo khác. Nên chọn công việc có độ khó tương đương.</p>
      </section>
      <p className="muted insights-disclaimer">
        Trung bình chỉ dùng giá trị đã ghi nhận, kể cả bản nháp và phiên đã xác
        nhận; mỗi chỉ số có độ đầy đủ riêng. Số liệu nhập tay thay thế tổng
        phiên tương ứng, không cộng trùng. Số liệu mô tả trải nghiệm của bạn,
        không chứng minh nguyên nhân. Từ ngày 29, cửa sổ cuối là ngày 24–30;
        ngày chưa tới không bị tính là thiếu nhật ký.
      </p>
    </div>
  );
}
