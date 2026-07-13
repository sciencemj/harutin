/** 공통 엔티티 필드 */
export interface BaseEntity {
  id: string;
  createdAt: string; // ISO 8601
  updatedAt: string; // ISO 8601
}

export type TimeOfDay = "morning" | "afternoon" | "evening";
export type Priority = "low" | "medium" | "high";
export type Mood = 1 | 2 | 3 | 4 | 5;

/** 반복 루틴. days: 0(일)~6(토), completedDates: "yyyy-MM-dd" */
export interface Routine extends BaseEntity {
  name: string;
  emoji: string;
  timeOfDay: TimeOfDay;
  days: number[];
  note?: string;
  completedDates: string[];
}

export interface Todo extends BaseEntity {
  title: string;
  done: boolean;
  completedAt?: string;
  priority: Priority;
  categoryId: string;
  dueDate?: string; // "yyyy-MM-dd"
  estimateMinutes?: number;
  note?: string;
  order: number;
  /** 동기화 플랫폼 확장 필드 — 외부 프로그램(예: Obsidian)에서 온 TODO 매칭용 */
  source?: string;
  externalId?: string;
}

/** "local" = 앱에서 만든 원본. 그 외에는 동기화 프로바이더 ID ("apple", "obsidian", ...) */
export type EventSource = "local" | (string & {});

/**
 * 일정. 외부 프로그램에서 온 일정은 source(프로바이더 ID) + externalId로 원본과 매칭된다.
 */
export interface CalendarEvent extends BaseEntity {
  title: string;
  date: string; // "yyyy-MM-dd"
  startTime?: string; // "HH:mm"
  endTime?: string; // "HH:mm"
  allDay: boolean;
  categoryId: string;
  location?: string;
  note?: string;
  source: EventSource;
  externalId?: string;
}

export interface DailyReflection extends BaseEntity {
  date: string; // "yyyy-MM-dd"
  mood: Mood;
  /** 과거 버전에서 쓰던 한 줄 기록 — 지금 UI는 기분만 남긴다 */
  wellDone?: string;
  remember?: string;
}

export const MOOD_META: Record<Mood, { emoji: string; label: string; color: string }> = {
  1: { emoji: "😞", label: "힘들었어요", color: "#C98A6E" },
  2: { emoji: "😕", label: "아쉬웠어요", color: "#E0B79A" },
  3: { emoji: "🙂", label: "무난했어요", color: "#D9D2B4" },
  4: { emoji: "😊", label: "좋았어요", color: "#A8BCA0" },
  5: { emoji: "🥰", label: "최고였어요", color: "#5F7355" },
};

export interface Category {
  id: string;
  name: string;
  /** 카드 좌측 점 등에 쓰는 표시 색 (hex) */
  color: string;
}

export type ViewMode = "all" | "tabs";
export type ActiveTab = "routines" | "todos" | "calendar" | "reflection" | "settings";

export interface AppSettings {
  userName: string;
  /** Apple 캘린더 양방향 동기화 (Tauri 데스크톱 앱에서만) */
  appleSyncEnabled: boolean;
  /** 클릭·완료 효과음 */
  soundEnabled: boolean;
  /** 보기 방식 — all(한눈에) / tabs(탭으로 나눠 여유롭게) */
  viewMode: ViewMode;
  /** 한눈에 보기에서 사이드바 접힘 */
  sidebarCollapsed: boolean;
}

export const TIME_OF_DAY_ORDER: TimeOfDay[] = ["morning", "afternoon", "evening"];

export const TIME_OF_DAY_LABEL: Record<TimeOfDay, string> = {
  morning: "아침",
  afternoon: "오후",
  evening: "저녁",
};

export const PRIORITY_LABEL: Record<Priority, string> = {
  low: "낮음",
  medium: "보통",
  high: "높음",
};

export const DAY_LABELS = ["일", "월", "화", "수", "목", "금", "토"] as const;
