import { format, parse, subDays, differenceInMinutes, isValid } from "date-fns";
import { ko } from "date-fns/locale";
import type { CalendarEvent, Routine } from "./types";

export function dateKey(d: Date): string {
  return format(d, "yyyy-MM-dd");
}

export function todayKey(): string {
  return dateKey(new Date());
}

/** "yyyy-MM-dd" → Date. 잘못된 값이면 null */
export function parseDateKey(key: string): Date | null {
  const d = parse(key, "yyyy-MM-dd", new Date());
  return isValid(d) ? d : null;
}

/** "7월 13일 일요일" */
export function formatKoreanDate(d: Date): string {
  return format(d, "M월 d일 EEEE", { locale: ko });
}

/** "HH:mm" → "오전 10:00". 잘못된 값이면 원문 반환 */
export function formatTime(hhmm: string): string {
  const d = parse(hhmm, "HH:mm", new Date());
  return isValid(d) ? format(d, "a h:mm", { locale: ko }) : hhmm;
}

export interface Greeting {
  text: string;
  sub: string;
  period: "dawn" | "morning" | "afternoon" | "evening" | "night";
}

export function getGreeting(now: Date, name?: string): Greeting {
  const h = now.getHours();
  const who = name ? `${name}님, ` : "";
  if (h < 6)
    return {
      period: "dawn",
      text: `${who}고요한 새벽이에요`,
      sub: "무리하지 말고, 몸이 원하면 쉬어가요.",
    };
  if (h < 12)
    return {
      period: "morning",
      text: `${who}좋은 아침이에요`,
      sub: "오늘은 천천히, 하나씩 해봐요.",
    };
  if (h < 18)
    return {
      period: "afternoon",
      text: `${who}좋은 오후예요`,
      sub: "잠깐 숨 고르고, 남은 하루도 가볍게.",
    };
  if (h < 22)
    return {
      period: "evening",
      text: `${who}편안한 저녁이에요`,
      sub: "오늘 하루도 여기까지 잘 왔어요.",
    };
  return {
    period: "night",
    text: `${who}늦은 밤이에요`,
    sub: "내일의 나를 위해 슬슬 정리해볼까요.",
  };
}

export function isRoutineScheduledOn(routine: Routine, d: Date): boolean {
  return routine.days.includes(d.getDay());
}

/**
 * 연속 달성 일수. 반복 요일만 세고, 쉬는 요일은 건너뛴다.
 * 오늘이 반복일인데 아직 미완료면 오늘은 판정에서 제외한다.
 */
export function calcStreak(routine: Routine, today: Date): number {
  if (routine.days.length === 0) return 0;
  const done = new Set(routine.completedDates);
  let streak = 0;
  let cursor = today;
  if (isRoutineScheduledOn(routine, cursor) && !done.has(dateKey(cursor))) {
    cursor = subDays(cursor, 1);
  }
  for (let i = 0; i < 365; i++) {
    if (isRoutineScheduledOn(routine, cursor)) {
      if (done.has(dateKey(cursor))) streak++;
      else break;
    }
    cursor = subDays(cursor, 1);
  }
  return streak;
}

function eventDateTime(ev: CalendarEvent, time: string): Date | null {
  const d = parse(`${ev.date} ${time}`, "yyyy-MM-dd HH:mm", new Date());
  return isValid(d) ? d : null;
}

export type EventStatus = "past" | "ongoing" | "upcoming" | "allDay";

export function getEventStatus(ev: CalendarEvent, now: Date): EventStatus {
  if (ev.allDay || !ev.startTime) return "allDay";
  const start = eventDateTime(ev, ev.startTime);
  if (!start) return "allDay";
  const end = ev.endTime ? eventDateTime(ev, ev.endTime) : null;
  if (now < start) return "upcoming";
  if (end && now <= end) return "ongoing";
  if (!end && differenceInMinutes(now, start) < 60) return "ongoing";
  return "past";
}

/** 시작까지 남은 시간 문구. 예: "30분 후", "2시간 10분 후" */
export function untilText(ev: CalendarEvent, now: Date): string | null {
  if (ev.allDay || !ev.startTime) return null;
  const start = eventDateTime(ev, ev.startTime);
  if (!start || start <= now) return null;
  const mins = differenceInMinutes(start, now);
  if (mins < 1) return "곧 시작";
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (h === 0) return `${m}분 후`;
  return m === 0 ? `${h}시간 후` : `${h}시간 ${m}분 후`;
}

/** 시간순 정렬 키 — 종일 일정 먼저, 그다음 시작 시간순 */
export function eventSortKey(ev: CalendarEvent): string {
  return ev.allDay || !ev.startTime ? "00:00" : ev.startTime;
}
