import "fake-indexeddb/auto";
import { beforeAll, beforeEach, describe, expect, it } from "vitest";
import {
  assertNoFutureWrites,
  database,
  emptyData,
  exportBackup,
  importBackup,
  initializeStore,
  resetData,
  updateData,
  validateBackup,
} from "./store";
import { addDays, emptyMetrics, localDate, makeLog } from "../domain/model";
import type { Run } from "../domain/types";

const now = "2026-11-26T10:00:00.000Z";
const run = (): Run => ({
  id: crypto.randomUUID(),
  programVersion: "1.0.0",
  startDate: "2026-11-01",
  timeZone: "Asia/Ho_Chi_Minh",
  baseline: emptyMetrics(),
  goals: {},
  createdAt: now,
  updatedAt: now,
});

beforeAll(async () => {
  await initializeStore();
});
beforeEach(async () => {
  await resetData();
});

describe("atomic IndexedDB storage and backup", () => {
  it("initializes a versioned schema without inventing baseline data", async () => {
    const row = await database.state.get("app");
    expect(database.verno).toBe(1);
    expect(row!.data.runs).toEqual([]);
    expect(row!.data.schemaVersion).toBe(1);
    expect(row!.data.activeRunId).toBeNull();
  });
  it("round-trips a complete run, zero measurements and notes through export, clear and import", async () => {
    const r = run(),
      log = makeLog(r, 1);
    log.metrics.video = 0;
    log.reflection = "Một ngày bình tĩnh.";
    await updateData((draft) => {
      draft.runs.push(r);
      draft.activeRunId = r.id;
      draft.logs.push(log);
    });
    const backup = await exportBackup();
    const checked = validateBackup(backup);
    expect(checked.settings.lastBackupAt).not.toBeNull();
    await resetData();
    expect((await database.state.get("app"))!.data.runs).toHaveLength(0);
    await importBackup(backup);
    expect((await database.state.get("app"))!.data).toEqual(checked);
  });
  it("rejects malformed and invalid imports without changing committed data", async () => {
    const r = run();
    await updateData((draft) => {
      draft.runs.push(r);
      draft.activeRunId = r.id;
    });
    const before = (await database.state.get("app"))!.data;
    await expect(importBackup("{bad")).rejects.toThrow();
    const broken = {
      format: "remind-backup",
      schemaVersion: 1,
      exportedAt: now,
      data: { ...before, activeRunId: crypto.randomUUID() },
    };
    await expect(importBackup(JSON.stringify(broken))).rejects.toThrow();
    expect((await database.state.get("app"))!.data).toEqual(before);
  });
  it("rolls back invalid multi-entity changes", async () => {
    await expect(
      updateData((draft) => {
        const r = run();
        draft.runs.push(r);
        draft.activeRunId = r.id;
        const log = makeLog(r, 1);
        log.metrics.sleep = 100;
        draft.logs.push(log);
      }),
    ).rejects.toThrow();
    expect((await database.state.get("app"))!.data.runs).toHaveLength(0);
  });
  it("reads committed data inside serialized transactions to retain competing writes", async () => {
    const a = run(),
      b = run();
    await Promise.all([
      updateData((draft) => {
        draft.runs.push(a);
      }),
      updateData((draft) => {
        draft.runs.push(b);
      }),
    ]);
    const result = (await database.state.get("app"))!.data;
    expect(new Set(result.runs.map((item) => item.id))).toEqual(
      new Set([a.id, b.id]),
    );
  });
  it("replaces every collection on import without partial legacy state", async () => {
    const r = run();
    await updateData((draft) => {
      draft.runs.push(r);
      draft.activeRunId = r.id;
    });
    const fresh = emptyData();
    await importBackup(
      JSON.stringify({
        format: "remind-backup",
        schemaVersion: 1,
        exportedAt: now,
        data: fresh,
      }),
    );
    expect((await database.state.get("app"))!.data).toEqual(fresh);
  });
});

describe("write calendar boundaries", () => {
  it("rejects future-day writes atomically in the run timezone", async () => {
    const r = run();
    r.startDate = addDays(localDate(r.timeZone), 1);
    await updateData((draft) => {
      draft.runs.push(r);
      draft.activeRunId = r.id;
    });
    await expect(
      updateData((draft) => {
        draft.logs.push(makeLog(r, 1));
      }),
    ).rejects.toThrow("Ngày tương lai");
    expect((await database.state.get("app"))!.data.logs).toEqual([]);
  });
  it("allows backfill and uses timezone-local midnight to permit the first day", () => {
    const r = run();
    r.startDate = "2026-11-27";
    const previous = emptyData();
    previous.runs.push(r);
    const next = structuredClone(previous);
    next.logs.push(makeLog(r, 1));
    expect(() =>
      assertNoFutureWrites(previous, next, new Date("2026-11-26T16:59:59Z")),
    ).toThrow();
    expect(() =>
      assertNoFutureWrites(previous, next, new Date("2026-11-26T17:00:00Z")),
    ).not.toThrow();
    expect(() =>
      assertNoFutureWrites(previous, next, new Date("2026-11-30T17:00:00Z")),
    ).not.toThrow();
  });
  it("prevents newly added retroactive overrides while preserving imported histories", () => {
    const r = run(),
      previous = emptyData();
    previous.runs.push(r);
    const next = structuredClone(previous);
    next.overrides.push({
      id: crypto.randomUUID(),
      runId: r.id,
      effectiveFromDay: 1,
      goals: { focus: 10 },
      reason: "Giảm",
      createdAt: now,
    });
    expect(() =>
      assertNoFutureWrites(previous, next, new Date("2026-11-05T12:00:00Z")),
    ).toThrow("hôm nay");
    expect(() =>
      assertNoFutureWrites(
        next,
        structuredClone(next),
        new Date("2026-11-05T12:00:00Z"),
      ),
    ).not.toThrow();
  });
});
