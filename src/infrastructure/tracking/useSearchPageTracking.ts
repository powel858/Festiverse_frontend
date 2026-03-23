"use client";

import { useEffect, useRef, useCallback } from "react";
import { usePathname } from "next/navigation";
import { useStore } from "jotai";
import { EVENT_TYPES } from "./constants";
import { trackEvent, sendBeaconEvent } from "./trackEvent";
import { trackFavoriteToggled } from "./useAppTracking";
import {
  resetSearchPageState,
  getSearchTimeOnPage,
  getTimeSinceSearchPageEntered,
  pauseSearchTimer,
  resumeSearchTimer,
  isSearchExitSent,
  markSearchExitSent,
  resetSearchExitSent,
  markFilteredSession,
  getIsFilteredSession,
} from "./trackingState";
import { filterAtom } from "@/features/performance/application/atoms/performanceAtoms";

export function useSearchPageLifecycle(): void {
  const pathname = usePathname();
  const prevPathRef = useRef<string | null>(null);

  useEffect(() => {
    if (pathname !== "/") return;
    if (prevPathRef.current === pathname) return;
    prevPathRef.current = pathname;

    const capturedPath = window.location.pathname;
    resetSearchPageState();
    trackEvent(EVENT_TYPES.SEARCH_PAGE_ENTERED, {}, capturedPath);

    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        if (!isSearchExitSent()) {
          pauseSearchTimer();
          sendBeaconEvent(
            EVENT_TYPES.SEARCH_PAGE_EXITED,
            { time_on_page_ms: getSearchTimeOnPage() },
            capturedPath,
          );
          markSearchExitSent();
        }
      } else {
        resumeSearchTimer();
        resetSearchExitSent();
      }
    };

    const handlePageHide = () => {
      if (!isSearchExitSent()) {
        sendBeaconEvent(
          EVENT_TYPES.SEARCH_PAGE_EXITED,
          { time_on_page_ms: getSearchTimeOnPage() },
          capturedPath,
        );
        markSearchExitSent();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("pagehide", handlePageHide);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("pagehide", handlePageHide);
      if (!isSearchExitSent()) {
        sendBeaconEvent(
          EVENT_TYPES.SEARCH_PAGE_EXITED,
          { time_on_page_ms: getSearchTimeOnPage() },
          capturedPath,
        );
      }
      prevPathRef.current = null;
    };
  }, [pathname]);
}

export function useSearchPageTracking() {
  const store = useStore();

  const trackFilterOptionToggled = useCallback(
    (
      filterType: "region" | "genre",
      filterValue: string,
      isSelected: boolean,
    ) => {
      trackEvent(EVENT_TYPES.FILTER_OPTION_TOGGLED, {
        filter_type: filterType,
        filter_value: filterValue,
        is_selected: isSelected,
        time_since_page_entered_ms: getTimeSinceSearchPageEntered(),
      });
    },
    [],
  );

  const trackFilterApplyButtonClicked = useCallback(
    (region: string, genre: string) => {
      const appliedFilters = {
        region: region ? [region] : [],
        genre: genre ? [genre] : [],
      };
      const filterCount = appliedFilters.region.length + appliedFilters.genre.length;

      markFilteredSession();

      trackEvent(EVENT_TYPES.FILTER_APPLY_BUTTON_CLICKED, {
        applied_filters: appliedFilters,
        filter_count: filterCount,
        time_since_page_entered_ms: getTimeSinceSearchPageEntered(),
      });
    },
    [],
  );

  const trackCalendarDateClicked = useCallback(
    (selectedDate: string, calendarYear: number, calendarMonth: number) => {
      trackEvent(EVENT_TYPES.CALENDAR_DATE_CLICKED, {
        selected_date: selectedDate,
        calendar_year: calendarYear,
        calendar_month: calendarMonth,
      });
    },
    [],
  );

  const trackCalendarPeriodNavigated = useCallback(
    (direction: "next" | "prev", fromYearMonth: string, toYearMonth: string) => {
      trackEvent(EVENT_TYPES.CALENDAR_PERIOD_NAVIGATED, {
        direction,
        from_year_month: fromYearMonth,
        to_year_month: toYearMonth,
      });
    },
    [],
  );

  const trackFestivalItemClicked = useCallback(
    (
      festivalId: string,
      festivalName: string,
      listPosition: number,
    ) => {
      const filters = store.get(filterAtom);
      trackEvent(EVENT_TYPES.FESTIVAL_ITEM_CLICKED, {
        festival_id: festivalId,
        festival_name: festivalName,
        list_position: listPosition,
        active_filters: {
          region: filters.region ? [filters.region] : [],
          genre: filters.genre ? [filters.genre] : [],
          selected_date: filters.selectedDate || null,
          keyword: filters.keyword,
        },
        is_filtered_session: getIsFilteredSession(),
        time_since_page_entered_ms: getTimeSinceSearchPageEntered(),
      });
    },
    [store],
  );

  const trackSearchQuerySubmitted = useCallback(
    (
      queryText: string,
      resultsCount: number | null,
      source: "header" | "filter_section",
    ) => {
      trackEvent(EVENT_TYPES.SEARCH_QUERY_SUBMITTED, {
        query_text: queryText,
        results_count: resultsCount,
        source,
      });
    },
    [],
  );

  const trackSortChanged = useCallback(
    (sortValue: string, previousSortValue: string) => {
      trackEvent(EVENT_TYPES.SORT_CHANGED, {
        sort_value: sortValue,
        previous_sort_value: previousSortValue,
      });
    },
    [],
  );

  return {
    trackFilterOptionToggled,
    trackFilterApplyButtonClicked,
    trackCalendarDateClicked,
    trackCalendarPeriodNavigated,
    trackFestivalItemClicked,
    trackSearchQuerySubmitted,
    trackSortChanged,
    trackFavoriteToggled,
  };
}
