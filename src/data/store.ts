import Dexie, { liveQuery, type Table } from "dexie";
import { useEffect, useSyncExternalStore } from "react";
import type { AppData } from "../domain/types";
import { validateBackup, validateData } from "./validation";
import { dayNumber, localDate } from "../domain/model";

export { validateBackup } from "./validation";

export function emptyData(): AppData {
  let displayTimeZone = "Asia/Ho_Chi_Minh";
  try {
    displayTimeZone =
      Intl.DateTimeFormat().resolvedOptions().timeZone || displayTimeZone;
  } catch {
    /* Safe first-run fallback. */
  }
  return {
    schemaVersion: 1,
    activeRunId: null,
    runs: [],
    overrides: [],
    logs: [],
    sessions: [],
    journal: [],
    cards: [],
    recallReviews: [],
    reviews: [],
    settings: {
      displayTimeZone,
      lastBackupAt: null,
      adaptationDismissedAt: null,
    },
  };
}

type StateRow = { id: "app"; data: AppData; revision: number };
class ReMindDatabase extends Dexie {
  state!: Table<StateRow, string>;
  constructor() {
    super("remind-local-v1");
    this.version(1).stores({ state: "id" });
  }
}
export const database = new ReMindDatabase();

type Snapshot = { data: AppData; ready: boolean; error: string | null };
let snapshot: Snapshot = { data: emptyData(), ready: false, error: null };
let initialization: Promise<void> | null = null;
const listeners = new Set<() => void>();
let subscription: { unsubscribe: () => void } | null = null;
function publish(next: Snapshot) {
  snapshot = next;
  for (const listener of listeners) listener();
}
function storageError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  return `Chưa lưu được dữ liệu trên thiết bị. Giữ nguyên nội dung và thử lại hoặc xuất bản sao lưu. ${message}`;
}

export async function initializeStore(): Promise<void> {
  if (initialization) return initialization;
  initialization = (async () => {
    try {
      await database.open();
      const row = await database.transaction("rw", database.state, async () => {
        const existing = await database.state.get("app");
        if (existing) return existing;
        const created: StateRow = { id: "app", data: emptyData(), revision: 0 };
        await database.state.add(created);
        return created;
      });
      const data = validateData(row.data);
      publish({ data, ready: true, error: null });
      subscription?.unsubscribe();
      subscription = liveQuery(() => database.state.get("app")).subscribe({
        next: (current) => {
          if (!current) return;
          try {
            publish({
              data: validateData(current.data),
              ready: true,
              error: null,
            });
          } catch (error) {
            publish({ ...snapshot, ready: true, error: storageError(error) });
          }
        },
        error: (error) =>
          publish({ ...snapshot, ready: true, error: storageError(error) }),
      });
    } catch (error) {
      initialization = null;
      publish({ ...snapshot, ready: true, error: storageError(error) });
    }
  })();
  return initialization;
}

export function useAppData(): Snapshot {
  useEffect(() => {
    void initializeStore();
  }, []);
  return useSyncExternalStore(
    (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    () => snapshot,
    () => snapshot,
  );
}

/** Calendar restrictions apply to new UI writes, not importing an existing complete backup. */
export function assertNoFutureWrites(
  previous: AppData,
  next: AppData,
  now = new Date(),
): void {
  const runDays = new Map(
    next.runs.map((run) => [
      run.id,
      dayNumber(run, localDate(run.timeZone, now)),
    ]),
  );
  for (const collection of [
    "logs",
    "sessions",
    "journal",
    "reviews",
  ] as const) {
    const old = new Map(
      previous[collection].map((item) => [item.id, JSON.stringify(item)]),
    );
    for (const item of next[collection]) {
      if (old.get(item.id) === JSON.stringify(item)) continue;
      if (item.day > (runDays.get(item.runId) ?? 0))
        throw new Error(
          "Ngày tương lai chỉ để xem trước. Chưa thể lưu ghi chép hoặc phiên thực hành.",
        );
    }
  }
  const oldOverrides = new Map(
    previous.overrides.map((item) => [item.id, JSON.stringify(item)]),
  );
  for (const item of next.overrides) {
    if (oldOverrides.get(item.id) === JSON.stringify(item)) continue;
    const current = runDays.get(item.runId) ?? 1;
    if (item.effectiveFromDay < Math.max(1, current))
      throw new Error(
        "Điều chỉnh mục tiêu chỉ áp dụng từ hôm nay hoặc một ngày sắp tới của hành trình.",
      );
  }
}

/** Reads the latest committed document inside a read/write transaction, so competing tabs cannot overwrite each other. */
export async function updateData(
  mutator: (draft: AppData) => void,
): Promise<void> {
  await initializeStore();
  try {
    const next = await database.transaction("rw", database.state, async () => {
      const row = await database.state.get("app");
      if (!row) throw new Error("Kho dữ liệu chưa sẵn sàng.");
      const draft = structuredClone(row.data);
      mutator(draft);
      const checked = validateData(draft);
      assertNoFutureWrites(row.data, checked);
      await database.state.put({
        id: "app",
        data: checked,
        revision: row.revision + 1,
      });
      return checked;
    });
    publish({ data: next, ready: true, error: null });
  } catch (error) {
    publish({ ...snapshot, error: storageError(error) });
    throw error;
  }
}

export async function exportBackup(): Promise<string> {
  await updateData((data) => {
    data.settings.lastBackupAt = new Date().toISOString();
  });
  // Use a fresh committed read rather than a live-query snapshot that may lag.
  const current = await database.state.get("app");
  if (!current) throw new Error("Không tìm thấy dữ liệu để sao lưu.");
  return JSON.stringify(
    {
      format: "remind-backup",
      schemaVersion: 1,
      exportedAt: new Date().toISOString(),
      data: current.data,
    },
    null,
    2,
  );
}

export async function importBackup(text: string): Promise<void> {
  const checked = validateBackup(text);
  await initializeStore();
  try {
    await database.transaction("rw", database.state, async () => {
      const row = await database.state.get("app");
      await database.state.put({
        id: "app",
        data: checked,
        revision: (row?.revision ?? 0) + 1,
      });
    });
    publish({ data: checked, ready: true, error: null });
  } catch (error) {
    publish({ ...snapshot, error: storageError(error) });
    throw error;
  }
}

/** Caller must obtain explicit confirmation before invoking this destructive local operation. */
export async function resetData(): Promise<void> {
  await updateData((draft) => {
    Object.assign(draft, emptyData());
  });
}
