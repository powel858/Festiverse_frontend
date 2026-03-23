import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  getIsFilteredSession,
  resetIsFilteredSession,
  resetDetailPageState,
  resetSearchPageState,
  addSectionViewed,
  markReviewClicked,
  getTimeSinceSearchPageEntered,
  getSectionsViewedList,
  getSectionsViewed,
  getReviewClickCount,
} from "../trackingState";
import { useSearchPageTracking } from "../useSearchPageTracking";
import { useDetailPageTracking } from "../useDetailPageTracking";
import { renderHook } from "@testing-library/react";
import { Provider, createStore } from "jotai";
import type { ReactNode } from "react";
import { clearTrackingStorage, resetTrackingModules } from "./testUtils";

describe("검증 5 — trackingState 교차 검증", () => {
  beforeEach(() => {
    clearTrackingStorage();
    resetTrackingModules();
    resetIsFilteredSession();
    vi.spyOn(console, "log").mockImplementation(() => {});
  });

  it("section 3개 + ticket 시 sections_viewed_count_in_session = 3", () => {
    resetDetailPageState("PF1");
    addSectionViewed("hero");
    addSectionViewed("basic_info");
    addSectionViewed("lineup");
    const store = createStore();
    const { result } = renderHook(() => useDetailPageTracking(), {
      wrapper: ({ children }: { children: ReactNode }) => (
        <Provider store={store}>{children}</Provider>
      ),
    });
    result.current.trackTicketButtonClicked("melon");
    expect(getSectionsViewedList().length).toBe(3);
  });

  it("trackFilterApply 후 isFilteredSession → festival 클릭 시 is_filtered_session true", () => {
    resetIsFilteredSession();
    const store = createStore();
    const { result } = renderHook(() => useSearchPageTracking(), {
      wrapper: ({ children }: { children: ReactNode }) => (
        <Provider store={store}>{children}</Provider>
      ),
    });
    result.current.trackFilterApplyButtonClicked("서울", "");
    expect(getIsFilteredSession()).toBe(true);
    result.current.trackFestivalItemClicked("P", "n", 0);
  });

  it("필터 미적용 시 is_filtered_session false", () => {
    resetIsFilteredSession();
    expect(getIsFilteredSession()).toBe(false);
  });

  it("resetDetailPageState 후 sections/review 초기화", () => {
    addSectionViewed("hero");
    markReviewClicked();
    resetDetailPageState("PF9");
    expect(getSectionsViewed().size).toBe(0);
    expect(getReviewClickCount()).toBe(0);
  });

  it("resetSearchPageState 후 time since enter 유효", () => {
    vi.spyOn(Date, "now").mockReturnValue(Date.now() + 100);
    resetSearchPageState();
    const t1 = getTimeSinceSearchPageEntered();
    expect(t1).toBeLessThan(200);
    expect(t1).toBeGreaterThanOrEqual(0);
    vi.restoreAllMocks();
  });
});
