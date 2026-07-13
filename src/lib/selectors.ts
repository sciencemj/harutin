import type { CalendarEvent, Routine, Todo } from "./types";
import { getEventStatus, isRoutineScheduledOn, eventSortKey, parseDateKey } from "./date";

export type TodoBucket = "today" | "upcoming" | "done";

/** 오늘 = 미완료 중 마감이 오늘이거나 지났거나 없는 것 + 오늘 완료한 것 */
export function todoBucket(todo: Todo, todayKey: string): TodoBucket {
  if (todo.done) return "done";
  if (todo.dueDate && todo.dueDate > todayKey) return "upcoming";
  return "today";
}

export function sortTodos(todos: Todo[]): Todo[] {
  return [...todos].sort((a, b) => a.order - b.order);
}

export function routinesForDate(routines: Routine[], date: Date): Routine[] {
  return routines.filter((r) => isRoutineScheduledOn(r, date));
}

export function eventsForDate(events: CalendarEvent[], dateKey: string): CalendarEvent[] {
  return events
    .filter((e) => e.date === dateKey)
    .sort((a, b) => eventSortKey(a).localeCompare(eventSortKey(b)));
}

export interface DayStats {
  todosDone: number;
  todosTotal: number;
  routinesDone: number;
  routinesTotal: number;
  eventsRemaining: number;
  /** 0~100. 오늘 할 게 없으면 100 */
  progress: number;
}

export function calcDayStats(
  routines: Routine[],
  todos: Todo[],
  events: CalendarEvent[],
  todayKey: string,
  now: Date
): DayStats {
  const today = parseDateKey(todayKey) ?? now;
  const todayRoutines = routinesForDate(routines, today);
  const routinesDone = todayRoutines.filter((r) => r.completedDates.includes(todayKey)).length;

  const todayTodos = todos.filter((t) => {
    const bucket = todoBucket(t, todayKey);
    if (bucket === "today") return true;
    // 오늘 완료한 항목은 오늘 몫으로 센다
    return bucket === "done" && (t.completedAt ?? "").slice(0, 10) === todayKey;
  });
  const todosDone = todayTodos.filter((t) => t.done).length;

  const eventsRemaining = eventsForDate(events, todayKey).filter((e) => {
    const st = getEventStatus(e, now);
    return st === "upcoming" || st === "ongoing";
  }).length;

  const total = todayRoutines.length + todayTodos.length;
  const done = routinesDone + todosDone;
  const progress = total === 0 ? 100 : Math.round((done / total) * 100);

  return {
    todosDone,
    todosTotal: todayTodos.length,
    routinesDone,
    routinesTotal: todayRoutines.length,
    eventsRemaining,
    progress,
  };
}
