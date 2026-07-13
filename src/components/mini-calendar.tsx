"use client";

import { useState } from "react";
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAppStore } from "@/lib/store";
import { dateKey, parseDateKey } from "@/lib/date";
import { DAY_LABELS } from "@/lib/types";
import { cn } from "@/lib/utils";

/** 일정(테라코타)·할 일(세이지) 점이 찍히는 미니 월간 캘린더 */
export function MiniCalendar({ className }: { className?: string }) {
  const selectedDate = useAppStore((s) => s.selectedDate);
  const setSelectedDate = useAppStore((s) => s.setSelectedDate);
  const events = useAppStore((s) => s.events);
  const todos = useAppStore((s) => s.todos);

  const selected = parseDateKey(selectedDate) ?? new Date();
  const [month, setMonth] = useState(() => startOfMonth(selected));
  const today = new Date();

  const days = eachDayOfInterval({
    start: startOfWeek(startOfMonth(month)),
    end: endOfWeek(endOfMonth(month)),
  });

  const eventDays = new Set(events.map((e) => e.date));
  const todoDays = new Set(todos.filter((t) => t.dueDate && !t.done).map((t) => t.dueDate));

  return (
    <div className={cn("select-none", className)}>
      <div className="mb-2 flex items-center justify-between">
        <p className="font-serif text-sm font-bold">{format(month, "yyyy년 M월")}</p>
        <div className="flex gap-0.5">
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="이전 달"
            onClick={() => setMonth((m) => addMonths(m, -1))}
          >
            <ChevronLeft />
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="다음 달"
            onClick={() => setMonth((m) => addMonths(m, 1))}
          >
            <ChevronRight />
          </Button>
        </div>
      </div>
      <div className="grid grid-cols-7 text-center text-[11px] text-muted-foreground">
        {DAY_LABELS.map((d) => (
          <span key={d} className="py-1">
            {d}
          </span>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {days.map((day) => {
          const key = dateKey(day);
          const isSelected = isSameDay(day, selected);
          const isToday = isSameDay(day, today);
          const inMonth = isSameMonth(day, month);
          return (
            <button
              key={key}
              type="button"
              onClick={() => setSelectedDate(key)}
              aria-label={format(day, "yyyy년 M월 d일")}
              aria-pressed={isSelected}
              className={cn(
                "relative mx-auto flex size-8 flex-col items-center justify-center rounded-full text-xs transition-colors",
                "hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
                !inMonth && "text-muted-foreground/50",
                isToday && !isSelected && "font-bold text-terracotta",
                isSelected && "bg-primary font-medium text-primary-foreground"
              )}
            >
              {format(day, "d")}
              <span className="absolute bottom-1 flex gap-0.5" aria-hidden>
                {eventDays.has(key) && (
                  <span
                    className={cn(
                      "size-1 rounded-full",
                      isSelected ? "bg-primary-foreground" : "bg-terracotta"
                    )}
                  />
                )}
                {todoDays.has(key) && (
                  <span
                    className={cn(
                      "size-1 rounded-full",
                      isSelected ? "bg-primary-foreground/70" : "bg-sage"
                    )}
                  />
                )}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
