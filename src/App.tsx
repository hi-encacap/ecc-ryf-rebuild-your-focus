import { useEffect, useState } from "react";
import { useRegisterSW } from "virtual:pwa-register/react";
import { Toaster, toast } from "sonner";
import {
  Sun,
  Route,
  ChartNoAxesCombined,
  BookOpen,
  Settings as SettingsIcon,
  Sprout,
  Timer,
  CloudOff,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  Menu,
  Download,
} from "lucide-react";
import { Button } from "./components/ui/button";
import { useAppData, updateData } from "./data/store";
import { dayNumber, localDate, phaseForDay, goalsForDay } from "./domain/model";
import { Onboarding } from "./features/Onboarding";
import { Today } from "./features/Today";
import { Program } from "./features/Program";
import { Tools } from "./features/Tools";
import { Library } from "./features/Library";
import { Insights } from "./features/Insights";
import { Settings } from "./features/Settings";

export async function perform(
  action: () => Promise<unknown>,
  success?: string,
) {
  try {
    await action();
    if (success) toast.success(success);
    return true;
  } catch (error) {
    toast.error(
      error instanceof Error
        ? error.message
        : "Chưa lưu được. Vui lòng thử lại.",
    );
    return false;
  }
}
type Page = "today" | "program" | "insights" | "library" | "settings" | "tools";
const nav = [
  { id: "today", label: "Hôm nay", icon: Sun },
  { id: "program", label: "Hành trình", icon: Route },
  { id: "insights", label: "Tiến triển", icon: ChartNoAxesCombined },
  { id: "library", label: "Thư viện", icon: BookOpen },
  { id: "settings", label: "Cài đặt", icon: SettingsIcon },
] as const;
export function App() {
  const { data, ready, error } = useAppData();
  const [page, setPage] = useState<Page>("today");
  const [toolsTab, setToolsTab] = useState<
    "focus" | "journal" | "recall" | "thinking"
  >("focus");
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [newRun, setNewRun] = useState(false);
  const [now, setNow] = useState(Date.now());
  const [online, setOnline] = useState(navigator.onLine);
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 30000);
    const change = () => {
      setOnline(navigator.onLine);
      setNow(Date.now());
    };
    window.addEventListener("online", change);
    window.addEventListener("offline", change);
    window.addEventListener("focus", change);
    return () => {
      clearInterval(id);
      window.removeEventListener("online", change);
      window.removeEventListener("offline", change);
      window.removeEventListener("focus", change);
    };
  }, []);
  const run = data.runs.find((x) => x.id === data.activeRunId);
  const actualDay = run
    ? dayNumber(run, localDate(run.timeZone, new Date(now)))
    : 1;
  const day = selectedDay ?? Math.min(30, Math.max(1, actualDay));
  const active = data.sessions.some(
    (s) => s.status === "running" || s.status === "paused",
  );
  const {
    needRefresh: [needRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisterError: () =>
      toast.error(
        "Chưa tải được bản offline. Giữ kết nối và tải lại khi tiện.",
      ),
  });
  const go = (p: Page) => {
    setPage(p);
    window.scrollTo({ top: 0, behavior: "instant" });
  };
  const openTools = (tab: typeof toolsTab) => {
    setToolsTab(tab);
    go("tools");
  };
  if (!ready)
    return (
      <div className="loading">
        <Sprout size={38} />
        <p>Đang mở không gian của bạn…</p>
        {error && <p role="alert">{error}</p>}
      </div>
    );
  return (
    <>
      <Toaster position="top-center" richColors />
      {error && !run && (
        <div className="notice error" role="alert">
          {error}
        </div>
      )}
      <a href="#main" className="skip-link">
        Đến nội dung
      </a>
      {!run || newRun ? (
        <Onboarding
          key={run?.id ?? "first-run"}
          data={data}
          onDone={() => {
            setNewRun(false);
            setSelectedDay(null);
            setPage("today");
          }}
          onCancel={run ? () => setNewRun(false) : undefined}
        />
      ) : (
        <div className="app-shell">
          <aside className="sidebar">
            <a
              className="brand"
              href="#"
              onClick={(e) => {
                e.preventDefault();
                setSelectedDay(null);
                go("today");
              }}
            >
              <span className="brand-mark">
                <Sprout size={25} />
              </span>
              ReMind<span className="brand-dot">.</span>
            </a>
            <p className="brand-caption">REBUILD YOUR FOCUS</p>
            <nav aria-label="Điều hướng chính">
              {nav.map((n) => (
                <button
                  key={n.id}
                  className={`nav-item ${page === n.id ? "active" : ""}`}
                  onClick={() => {
                    setSelectedDay(null);
                    go(n.id);
                  }}
                  aria-current={page === n.id ? "page" : undefined}
                >
                  <n.icon size={20} />
                  <span>{n.label}</span>
                  {page === n.id && <i />}
                </button>
              ))}
            </nav>
            <div className="sidebar-bottom">
              <div className="sidebar-note">
                <Sprout size={20} />
                <p>
                  Tiến bộ từng chút.
                  <br />
                  <strong>Theo nhịp của bạn.</strong>
                </p>
              </div>
              <button className="nav-item" onClick={() => openTools("focus")}>
                <Timer size={19} />
                <span>{active ? "Phiên đang mở" : "Góc tập trung"}</span>
                {active && <span className="live-dot" />}
              </button>
              <div className="local-status">
                <ShieldCheck size={15} />
                <span>Riêng tư. Lưu trên thiết bị.</span>
              </div>
            </div>
          </aside>
          <div className="main-shell">
            <header className="topbar">
              <div className="mobile-brand">
                <Sprout size={23} />
                <b>ReMind.</b>
              </div>
              <span className="topbar-title">
                Không gian cho một tâm trí thảnh thơi
              </span>
              <div className="topbar-right">
                <span className="date-text">
                  {new Intl.DateTimeFormat("vi-VN", {
                    weekday: "long",
                    day: "numeric",
                    month: "long",
                    timeZone: data.settings.displayTimeZone,
                  }).format(now)}
                </span>
                {!online && (
                  <span className="badge">
                    <CloudOff size={14} /> Offline
                  </span>
                )}
                <button
                  className="avatar"
                  onClick={() => go("settings")}
                  aria-label="Mở cài đặt cá nhân"
                >
                  R
                </button>
              </div>
            </header>
            <main id="main" tabIndex={-1}>
              {error && (
                <div className="notice error" role="alert">
                  {error} Nội dung chưa lưu có thể bị mất. Thử lại hoặc xuất bản
                  sao trong Cài đặt.
                </div>
              )}
              {needRefresh && (
                <div className="notice row">
                  <span>
                    {active
                      ? "Có bản cập nhật. Hoàn tất phiên trước khi tải lại."
                      : "ReMind có bản cập nhật mới. Dữ liệu của bạn vẫn được giữ."}
                  </span>
                  <Button
                    variant="outline"
                    disabled={active}
                    onClick={() => updateServiceWorker(true)}
                  >
                    Cập nhật
                  </Button>
                </div>
              )}
              {page === "today" && (
                <Today
                  key={`${run.id}-${day}`}
                  data={data}
                  run={run}
                  day={day}
                  actualDay={actualDay}
                  openTools={openTools}
                  openProgram={() => go("program")}
                  onDay={setSelectedDay}
                  onNewRun={() => setNewRun(true)}
                />
              )}
              {page === "program" && (
                <Program
                  data={data}
                  run={run}
                  onDay={(d) => {
                    setSelectedDay(d);
                    go("today");
                  }}
                />
              )}
              {page === "tools" && (
                <Tools
                  key={`${run.id}-${day}-${toolsTab}`}
                  data={data}
                  run={run}
                  day={day}
                  initialMinutes={
                    data.logs.find((l) => l.runId === run.id && l.day === day)
                      ?.mode === "minimum"
                      ? 10
                      : (data.logs.find(
                          (l) => l.runId === run.id && l.day === day,
                        )?.goals.focus ??
                        goalsForDay(run, day, data.overrides).focus)
                  }
                  initialTab={toolsTab}
                  onClose={() => go("today")}
                />
              )}
              {page === "insights" && <Insights data={data} run={run} />}
              {page === "library" && <Library />}
              {page === "settings" && (
                <Settings
                  key={run.id}
                  data={data}
                  run={run}
                  onNewRun={() => setNewRun(true)}
                />
              )}
              <footer className="page-footer">
                <Sprout size={14} />
                <span>Một việc mỗi lúc. Một chút mỗi ngày.</span>
                <span className="footer-right">ReMind · Không cần vội.</span>
              </footer>
            </main>
          </div>
          <nav className="bottom-nav" aria-label="Điều hướng di động">
            {nav.map((n) => (
              <button
                key={n.id}
                className={page === n.id ? "active" : ""}
                onClick={() => {
                  setSelectedDay(null);
                  go(n.id);
                }}
                aria-current={page === n.id ? "page" : undefined}
              >
                <n.icon size={21} />
                <span>{n.label}</span>
              </button>
            ))}
          </nav>
        </div>
      )}
    </>
  );
}
