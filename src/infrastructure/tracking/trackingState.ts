"use client";

// --- 탐색 페이지 상태 ---
let _searchPageEnteredAt = 0;
let _searchAccumulatedTime = 0;
let _searchLastActiveAt = 0;
let _searchExitSent = false;
let _isFilteredSession = false;

export function getIsFilteredSession(): boolean {
  return _isFilteredSession;
}

// --- 상세 페이지 상태 ---
let _detailPageEnteredAt = 0;
let _detailAccumulatedTime = 0;
let _detailLastActiveAt = 0;
let _detailExitSent = false;
let _currentDetailFestivalId = "";
let _currentDetailFestivalName = "";
let _sectionsViewed = new Set<string>();
let _reviewClicked = false;
let _reviewClickCount = 0;

// --- 탐색 페이지 ---

export function resetSearchPageState(): void {
  _searchPageEnteredAt = Date.now();
  _searchAccumulatedTime = 0;
  _searchLastActiveAt = Date.now();
  _searchExitSent = false;
}

export function getSearchTimeOnPage(): number {
  if (_searchPageEnteredAt === 0) return 0;
  return _searchAccumulatedTime + (document.hidden ? 0 : Date.now() - _searchLastActiveAt);
}

export function getTimeSinceSearchPageEntered(): number {
  return _searchPageEnteredAt > 0 ? Date.now() - _searchPageEnteredAt : 0;
}

export function pauseSearchTimer(): void {
  _searchAccumulatedTime += Date.now() - _searchLastActiveAt;
}

export function resumeSearchTimer(): void {
  _searchLastActiveAt = Date.now();
}

export function isSearchExitSent(): boolean {
  return _searchExitSent;
}

export function markSearchExitSent(): void {
  _searchExitSent = true;
}

export function resetSearchExitSent(): void {
  _searchExitSent = false;
}

// --- 상세 페이지 ---

export function resetDetailPageState(festivalId: string): void {
  _detailPageEnteredAt = Date.now();
  _detailAccumulatedTime = 0;
  _detailLastActiveAt = Date.now();
  _detailExitSent = false;
  _currentDetailFestivalId = festivalId;
  _currentDetailFestivalName = "";
  _sectionsViewed = new Set<string>();
  _reviewClicked = false;
  _reviewClickCount = 0;
}

export function getDetailTimeOnPage(): number {
  if (_detailPageEnteredAt === 0) return 0;
  return _detailAccumulatedTime + (document.hidden ? 0 : Date.now() - _detailLastActiveAt);
}

export function getTimeSinceDetailPageEntered(): number {
  return _detailPageEnteredAt > 0 ? Date.now() - _detailPageEnteredAt : 0;
}

export function pauseDetailTimer(): void {
  _detailAccumulatedTime += Date.now() - _detailLastActiveAt;
}

export function resumeDetailTimer(): void {
  _detailLastActiveAt = Date.now();
}

export function isDetailExitSent(): boolean {
  return _detailExitSent;
}

export function markDetailExitSent(): void {
  _detailExitSent = true;
}

export function resetDetailExitSent(): void {
  _detailExitSent = false;
}

export function getCurrentDetailFestivalId(): string {
  return _currentDetailFestivalId;
}

export function getCurrentDetailFestivalName(): string {
  return _currentDetailFestivalName;
}

export function setDetailFestivalName(name: string): void {
  _currentDetailFestivalName = name;
}

export function getSectionsViewed(): Set<string> {
  return _sectionsViewed;
}

export function getSectionsViewedList(): string[] {
  return Array.from(_sectionsViewed);
}

export function addSectionViewed(sectionName: string): boolean {
  if (_sectionsViewed.has(sectionName)) return false;
  _sectionsViewed.add(sectionName);
  return true;
}

export function getReviewClicked(): boolean {
  return _reviewClicked;
}

export function getReviewClickCount(): number {
  return _reviewClickCount;
}

export function markReviewClicked(): void {
  _reviewClicked = true;
  _reviewClickCount += 1;
}

// --- 필터 세션 ---

export function markFilteredSession(): void {
  _isFilteredSession = true;
}

export function resetIsFilteredSession(): void {
  _isFilteredSession = false;
}
