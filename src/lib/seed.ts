import { addDays, format } from "date-fns";
import type { CalendarEvent, Category, Routine, Todo } from "./types";

const ALL_DAYS = [0, 1, 2, 3, 4, 5, 6];
const WEEKDAYS = [1, 2, 3, 4, 5];

export const SEED_CATEGORIES: Category[] = [
  { id: "cat-work", name: "업무", color: "#C1704F" },
  { id: "cat-personal", name: "개인", color: "#7C9070" },
  { id: "cat-health", name: "건강", color: "#D99A6C" },
  { id: "cat-study", name: "학습", color: "#8E7CC3" },
];

export interface SeedData {
  routines: Routine[];
  todos: Todo[];
  events: CalendarEvent[];
  categories: Category[];
}

/** 첫 실행용 예시 데이터. 날짜는 생성 시점 기준으로 계산한다. */
export function createSeedData(): SeedData {
  const now = new Date();
  const iso = now.toISOString();
  const today = format(now, "yyyy-MM-dd");
  const tomorrow = format(addDays(now, 1), "yyyy-MM-dd");
  const in3days = format(addDays(now, 3), "yyyy-MM-dd");

  const base = (id: string) => ({ id, createdAt: iso, updatedAt: iso });

  const routines: Routine[] = [
    { ...base("seed-r1"), name: "물 한 잔 마시기", emoji: "💧", timeOfDay: "morning", days: ALL_DAYS, completedDates: [] },
    { ...base("seed-r2"), name: "아침 스트레칭", emoji: "🧘", timeOfDay: "morning", days: ALL_DAYS, note: "10분이면 충분해요", completedDates: [] },
    { ...base("seed-r3"), name: "영양제 챙기기", emoji: "💊", timeOfDay: "morning", days: ALL_DAYS, completedDates: [] },
    { ...base("seed-r4"), name: "30분 공부하기", emoji: "📚", timeOfDay: "afternoon", days: WEEKDAYS, completedDates: [] },
    { ...base("seed-r5"), name: "하루 정리하기", emoji: "🌙", timeOfDay: "evening", days: ALL_DAYS, completedDates: [] },
  ];

  const todos: Todo[] = [
    { ...base("seed-t1"), title: "데이터 분석 과제 정리", done: false, priority: "high", categoryId: "cat-study", dueDate: today, estimateMinutes: 90, order: 0 },
    { ...base("seed-t2"), title: "이메일 답장하기", done: false, priority: "medium", categoryId: "cat-work", dueDate: today, estimateMinutes: 20, order: 1 },
    { ...base("seed-t3"), title: "프로젝트 코드 리뷰", done: false, priority: "medium", categoryId: "cat-work", dueDate: tomorrow, estimateMinutes: 60, order: 2 },
    { ...base("seed-t4"), title: "장보기", done: false, priority: "low", categoryId: "cat-personal", dueDate: in3days, note: "우유, 달걀, 과일", order: 3 },
  ];

  const events: CalendarEvent[] = [
    { ...base("seed-e1"), title: "팀 미팅", date: today, startTime: "10:00", endTime: "11:00", allDay: false, categoryId: "cat-work", location: "회의실 A", source: "local" },
    { ...base("seed-e2"), title: "점심 약속", date: today, startTime: "13:00", endTime: "14:00", allDay: false, categoryId: "cat-personal", location: "회사 근처", source: "local" },
    { ...base("seed-e3"), title: "집중 작업", date: today, startTime: "16:00", endTime: "18:00", allDay: false, categoryId: "cat-work", note: "알림 끄고 몰입", source: "local" },
    { ...base("seed-e4"), title: "운동", date: today, startTime: "19:00", endTime: "20:00", allDay: false, categoryId: "cat-health", source: "local" },
  ];

  return { routines, todos, events, categories: SEED_CATEGORIES };
}
