import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  getOrCreateAnonymousId,
  getOrCreateSessionId,
  getDeviceType,
  getReturnVisitInfo,
  updateLastVisitDate,
} from "../trackingUtils";
import { getIsFilteredSession, markFilteredSession } from "../trackingState";
import { clearTrackingStorage, resetTrackingModules } from "./testUtils";

describe("검증 1 — trackingUtils (세션/사용자 식별)", () => {
  beforeEach(() => {
    clearTrackingStorage();
    resetTrackingModules();
    vi.stubGlobal("innerWidth", 1280);
  });

  it("getOrCreateAnonymousId: 최초 생성 후 localStorage 저장, 재호출 시 동일 값", () => {
    const a = getOrCreateAnonymousId();
    expect(a).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
    );
    expect(localStorage.getItem("festiverse_anon_id")).toBe(a);
    expect(getOrCreateAnonymousId()).toBe(a);
  });

  it("getOrCreateSessionId: sessionStorage 저장 + 동일 탭에서 동일 값", () => {
    const s1 = getOrCreateSessionId();
    expect(sessionStorage.getItem("festiverse_session_id")).toBe(s1);
    expect(getOrCreateSessionId()).toBe(s1);
  });

  it("getOrCreateSessionId: 30분 초과 시 새 session_id + isFilteredSession 리셋", () => {
    const first = getOrCreateSessionId();
    expect(first).toBeTruthy();

    markFilteredSession();
    expect(getIsFilteredSession()).toBe(true);

    localStorage.setItem(
      "festiverse_last_activity",
      String(Date.now() - 31 * 60 * 1000),
    );

    const second = getOrCreateSessionId();
    expect(second).not.toBe(first);
    expect(getIsFilteredSession()).toBe(false);
  });

  it("getDeviceType: width < 1024 → mobile, ≥ 1024 → desktop", () => {
    vi.stubGlobal("innerWidth", 500);
    expect(getDeviceType()).toBe("mobile");
    vi.stubGlobal("innerWidth", 1024);
    expect(getDeviceType()).toBe("desktop");
  });

  it("getReturnVisitInfo: last_visit 없으면 is_return_user false, days null", () => {
    expect(getReturnVisitInfo()).toEqual({
      is_return_user: false,
      days_since_last_visit: null,
    });
  });

  it("getReturnVisitInfo: last_visit 있으면 is_return_user true 및 days_since 계산", () => {
    const d = new Date();
    d.setDate(d.getDate() - 3);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    localStorage.setItem("festiverse_last_visit_date", `${y}-${m}-${day}`);
    const info = getReturnVisitInfo();
    expect(info.is_return_user).toBe(true);
    expect(info.days_since_last_visit).toBe(3);
  });

  it("updateLastVisitDate: 오늘 YYYY-MM-DD로 갱신", () => {
    updateLastVisitDate();
    const t = new Date();
    const expected = `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, "0")}-${String(t.getDate()).padStart(2, "0")}`;
    expect(localStorage.getItem("festiverse_last_visit_date")).toBe(expected);
  });
});
