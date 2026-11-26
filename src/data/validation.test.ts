import { describe, expect, it } from "vitest";
import type { AppData, Metrics, Run } from "../domain/types";
import { validateBackup, validateData } from "./validation";

const now = "2026-11-26T10:00:00.000Z";
function metrics(): Metrics {
  return {
    video: null,
    pickups: null,
    sleep: null,
    reading: null,
    focus: null,
    energy: null,
    moderate: null,
    vigorous: null,
    light: null,
    strength: null,
    complex: null,
    independent: null,
    switches: null,
    testMinutes: null,
    recall: null,
  };
}
function fixture(): AppData {
  const run: Run = {
    id: crypto.randomUUID(),
    programVersion: "1.0.0",
    startDate: "2026-11-26",
    timeZone: "Asia/Ho_Chi_Minh",
    baseline: metrics(),
    goals: {},
    createdAt: now,
    updatedAt: now,
  };
  return {
    schemaVersion: 1,
    activeRunId: run.id,
    runs: [run],
    overrides: [],
    logs: [],
    sessions: [],
    journal: [],
    cards: [],
    recallReviews: [],
    reviews: [],
    settings: {
      displayTimeZone: "Asia/Ho_Chi_Minh",
      lastBackupAt: null,
      adaptationDismissedAt: null,
    },
  };
}
function backup(data: unknown, version: number = 1) {
  return JSON.stringify({
    format: "remind-backup",
    schemaVersion: version,
    exportedAt: now,
    data,
  });
}

describe("backup schema and references", () => {
  it("preserves unknown versus observed zero", () => {
    const data = fixture();
    data.runs[0].baseline.video = 0;
    const result = validateBackup(backup(data));
    expect(result.runs[0].baseline.video).toBe(0);
    expect(result.runs[0].baseline.sleep).toBeNull();
  });
  it("rejects unsupported versions, malformed and oversized imports", () => {
    expect(() => validateBackup(backup(fixture(), 2))).toThrow(/Phiên bản/);
    expect(() => validateBackup("{")).toThrow(/JSON/);
    expect(() => validateBackup(" ".repeat(10 * 1024 * 1024 + 1))).toThrow(
      /10 MB/,
    );
  });
  it("rejects NaN, invalid calendars and timezones", () => {
    const data = fixture();
    data.runs[0].baseline.sleep = NaN;
    expect(() => validateData(data)).toThrow();
    data.runs[0].baseline.sleep = null;
    data.runs[0].startDate = "2026-02-30";
    expect(() => validateData(data)).toThrow();
    data.runs[0].startDate = "2026-11-26";
    data.runs[0].timeZone = "Fake/Zone";
    expect(() => validateData(data)).toThrow();
  });
  it("rejects duplicates and missing run references", () => {
    const data = fixture();
    data.runs.push({ ...data.runs[0] });
    expect(() => validateData(data)).toThrow(/trùng/);
    data.runs.pop();
    data.activeRunId = crypto.randomUUID();
    expect(() => validateData(data)).toThrow(/không tồn tại/);
  });
  it("rejects mismatched recall totals and unsafe source protocols", () => {
    const data = fixture();
    data.cards.push({
      id: crypto.randomUUID(),
      runId: data.runs[0].id,
      source: "Book",
      link: "https://example.com",
      ideas: ["One", "Two"],
      createdDate: "2026-11-26",
      dueDates: ["2026-11-27"],
      archived: false,
    });
    data.recallReviews.push({
      id: crypto.randomUUID(),
      cardId: data.cards[0].id,
      dueDate: "2026-11-27",
      actualDate: "2026-11-27",
      response: "One",
      matched: 1,
      total: 5,
      createdAt: now,
    });
    expect(() => validateData(data)).toThrow(/không khớp/);
    data.recallReviews[0].total = 2;
    data.cards[0].link = "javascript:alert(1)";
    expect(() => validateData(data)).toThrow(/http/);
  });
  it("rejects impossible counts without mutating input", () => {
    const data = fixture();
    data.runs[0].baseline.complex = 1;
    data.runs[0].baseline.independent = 2;
    const before = JSON.stringify(data);
    expect(() => validateData(data)).toThrow();
    expect(JSON.stringify(data)).toBe(before);
  });
});
