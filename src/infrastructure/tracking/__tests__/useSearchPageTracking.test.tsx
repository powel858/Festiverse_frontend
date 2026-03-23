import { describe, it, expect, beforeEach, vi } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { Provider, createStore } from "jotai";
import type { ReactNode } from "react";
import { useSearchPageTracking, useSearchPageLifecycle } from "../useSearchPageTracking";
import { EVENT_TYPES } from "../constants";
import { filterAtom } from "@/features/performance/application/atoms/performanceAtoms";
import { initialFilterState } from "@/features/performance/domain/state/filterState";
import {
  getIsFilteredSession,
  markFilteredSession,
  resetIsFilteredSession,
} from "../trackingState";
import { clearTrackingStorage, resetTrackingModules } from "./testUtils";

const { pathnameMock } = vi.hoisted(() => ({
  pathnameMock: vi.fn(() => "/"),
}));

vi.mock("next/navigation", () => ({
  usePathname: () => pathnameMock(),
}));

describe("검증 3 — useSearchPageTracking", () => {
  beforeEach(() => {
    clearTrackingStorage();
    resetTrackingModules();
    resetIsFilteredSession();
    pathnameMock.mockReturnValue("/");
    vi.stubGlobal("innerWidth", 1280);
  });

  describe("3-B 핸들러", () => {
    function wrapper(store: ReturnType<typeof createStore>) {
      return function W({ children }: { children: ReactNode }) {
        return <Provider store={store}>{children}</Provider>;
      };
    }

    it("trackFilterOptionToggled 필드", () => {
      const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
      const store = createStore();
      const { result } = renderHook(() => useSearchPageTracking(), {
        wrapper: wrapper(store),
      });
      result.current.trackFilterOptionToggled("region", "서울", true);
      const payload = logSpy.mock.calls.find((c) => c[0] === "[TrackEvent]")?.[1] as Record<
        string,
        unknown
      >;
      expect(payload?.event_type).toBe(EVENT_TYPES.FILTER_OPTION_TOGGLED);
      const ed = payload?.event_data as Record<string, unknown>;
      expect(ed?.filter_type).toBe("region");
      expect(ed?.filter_value).toBe("서울");
      expect(ed?.is_selected).toBe(true);
      expect(typeof ed?.time_since_page_entered_ms).toBe("number");
      logSpy.mockRestore();
    });

    it("trackFilterApplyButtonClicked + isFilteredSession = true", () => {
      resetIsFilteredSession();
      expect(getIsFilteredSession()).toBe(false);
      const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
      const store = createStore();
      const { result } = renderHook(() => useSearchPageTracking(), {
        wrapper: wrapper(store),
      });
      result.current.trackFilterApplyButtonClicked("서울", "EDM");
      expect(getIsFilteredSession()).toBe(true);
      const payload = logSpy.mock.calls.find((c) => c[0] === "[TrackEvent]")?.[1] as Record<
        string,
        unknown
      >;
      expect(payload?.event_type).toBe(EVENT_TYPES.FILTER_APPLY_BUTTON_CLICKED);
      const ed = payload?.event_data as Record<string, unknown>;
      expect(ed?.applied_filters).toEqual({ region: ["서울"], genre: ["EDM"] });
      expect(ed?.filter_count).toBe(2);
      logSpy.mockRestore();
    });

    it("trackCalendarDateClicked", () => {
      const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
      const store = createStore();
      const { result } = renderHook(() => useSearchPageTracking(), {
        wrapper: wrapper(store),
      });
      result.current.trackCalendarDateClicked("2026-03-21", 2026, 3);
      const payload = logSpy.mock.calls.at(-1)?.[1] as Record<string, unknown>;
      expect(payload?.event_data).toEqual({
        selected_date: "2026-03-21",
        calendar_year: 2026,
        calendar_month: 3,
      });
      logSpy.mockRestore();
    });

    it("trackCalendarPeriodNavigated", () => {
      const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
      const store = createStore();
      const { result } = renderHook(() => useSearchPageTracking(), {
        wrapper: wrapper(store),
      });
      result.current.trackCalendarPeriodNavigated("next", "2026-03", "2026-04");
      const payload = logSpy.mock.calls.at(-1)?.[1] as Record<string, unknown>;
      expect(payload?.event_data).toEqual({
        direction: "next",
        from_year_month: "2026-03",
        to_year_month: "2026-04",
      });
      logSpy.mockRestore();
    });

    it("trackFestivalItemClicked + active_filters + is_filtered_session", () => {
      const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
      const store = createStore();
      store.set(filterAtom, {
        ...initialFilterState,
        region: "R1",
        genre: "",
        selectedDate: "",
        keyword: "k",
      });
      markFilteredSession();
      const { result } = renderHook(() => useSearchPageTracking(), {
        wrapper: wrapper(store),
      });
      result.current.trackFestivalItemClicked("PF9", "이름", 2);
      const payload = logSpy.mock.calls.at(-1)?.[1] as Record<string, unknown>;
      const ed = payload?.event_data as Record<string, unknown>;
      expect(ed?.festival_id).toBe("PF9");
      expect(ed?.festival_name).toBe("이름");
      expect(ed?.list_position).toBe(2);
      expect(ed?.is_filtered_session).toBe(true);
      expect(ed?.active_filters).toEqual({
        region: ["R1"],
        genre: [],
        selected_date: null,
        keyword: "k",
      });
      logSpy.mockRestore();
    });

    it("trackSearchQuerySubmitted", () => {
      const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
      const store = createStore();
      const { result } = renderHook(() => useSearchPageTracking(), {
        wrapper: wrapper(store),
      });
      result.current.trackSearchQuerySubmitted("q", 5, "header");
      const payload = logSpy.mock.calls.at(-1)?.[1] as Record<string, unknown>;
      expect(payload?.event_data).toEqual({
        query_text: "q",
        results_count: 5,
        source: "header",
      });
      logSpy.mockRestore();
    });

    it("trackSortChanged", () => {
      const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
      const store = createStore();
      const { result } = renderHook(() => useSearchPageTracking(), {
        wrapper: wrapper(store),
      });
      result.current.trackSortChanged("latest", "popular");
      const payload = logSpy.mock.calls.at(-1)?.[1] as Record<string, unknown>;
      expect(payload?.event_data).toEqual({
        sort_value: "latest",
        previous_sort_value: "popular",
      });
      logSpy.mockRestore();
    });

    it("trackFavoriteToggled re-export", () => {
      const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
      const store = createStore();
      const { result } = renderHook(() => useSearchPageTracking(), {
        wrapper: wrapper(store),
      });
      expect(result.current.trackFavoriteToggled).toBeTypeOf("function");
      result.current.trackFavoriteToggled("PF1", false, "search");
      const payload = logSpy.mock.calls.at(-1)?.[1] as Record<string, unknown>;
      expect(payload?.event_type).toBe(EVENT_TYPES.FAVORITE_TOGGLED);
      logSpy.mockRestore();
    });
  });

  describe("3-A lifecycle", () => {
    it("마운트 시 search_page_entered + cleanup 시 search_page_exited + pageUrlOverride", async () => {
      const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
      pathnameMock.mockReturnValue("/");
      const { unmount } = renderHook(() => useSearchPageLifecycle());
      await waitFor(() => {
        const enter = logSpy.mock.calls.find(
          (c) =>
            (c[1] as Record<string, unknown>)?.event_type === EVENT_TYPES.SEARCH_PAGE_ENTERED,
        );
        expect(enter).toBeDefined();
        expect((enter?.[1] as Record<string, unknown>)?.event_data).toEqual({});
      });
      unmount();
      await waitFor(() => {
        const exit = logSpy.mock.calls.find(
          (c) =>
            c[0] === "[TrackEvent:beacon]" &&
            (c[1] as Record<string, unknown>)?.event_type === EVENT_TYPES.SEARCH_PAGE_EXITED,
        );
        expect(exit).toBeDefined();
        const p = exit?.[1] as Record<string, unknown>;
        expect(p?.page_url).toBe(window.location.pathname);
        expect((p?.event_data as { time_on_page_ms: number }).time_on_page_ms).toBeGreaterThanOrEqual(0);
      });
      logSpy.mockRestore();
    });

    it("pathname / → 다른 경로 → / 재진입 시 enter 재발화", async () => {
      const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
      pathnameMock.mockReturnValue("/");
      const { rerender } = renderHook(() => useSearchPageLifecycle());
      await waitFor(() => {
        const n = logSpy.mock.calls.filter(
          (c) =>
            (c[1] as Record<string, unknown> | undefined)?.event_type ===
            EVENT_TYPES.SEARCH_PAGE_ENTERED,
        ).length;
        expect(n).toBeGreaterThanOrEqual(1);
      });
      pathnameMock.mockReturnValue("/performance/X");
      rerender();
      pathnameMock.mockReturnValue("/");
      rerender();
      await waitFor(() => {
        const enters = logSpy.mock.calls.filter(
          (c) =>
            (c[1] as Record<string, unknown> | undefined)?.event_type ===
            EVENT_TYPES.SEARCH_PAGE_ENTERED,
        );
        expect(enters.length).toBeGreaterThanOrEqual(2);
      });
      logSpy.mockRestore();
    });
  });
});
