"use client";

import { format, subDays } from "date-fns";
import { ko } from "date-fns/locale";
import { Timer } from "lucide-react";
import { useAppStore } from "@/lib/store";
import { dateKey, parseDateKey } from "@/lib/date";
import { useToday } from "@/lib/use-today";
import { cn } from "@/lib/utils";

/** 최근 7일 집중 시간 미니 바 차트 */
export function FocusStats() {
  const focusLog = useAppStore((s) => s.focusLog);
  const today = useToday();

  const base = parseDateKey(today) ?? new Date();
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = subDays(base, 6 - i);
    const key = dateKey(d);
    return {
      key,
      label: format(d, "EEEEE", { locale: ko }),
      minutes: Math.round((focusLog[key] ?? 0) / 60),
      isToday: key === today,
    };
  });
  const max = Math.max(...days.map((d) => d.minutes), 1);
  const todayMinutes = days[6].minutes;
  const hasAny = days.some((d) => d.minutes > 0);

  return (
    <section aria-label="집중 기록" className="mt-4 rounded-2xl border bg-card p-4">
      <div className="mb-3 flex items-center justify-between">
        <p className="flex items-center gap-1.5 text-sm font-medium">
          <Timer className="size-4 text-primary" aria-hidden />
          집중 기록
        </p>
        <p className="text-xs text-muted-foreground">
          오늘 <b className="text-foreground">{todayMinutes}분</b>
        </p>
      </div>

      <div className="flex h-16 items-end gap-1.5">
        {days.map((d) => (
          <div
            key={d.key}
            title={`${format(parseDateKey(d.key) ?? base, "M월 d일", { locale: ko })} · ${d.minutes}분`}
            className="flex h-full flex-1 items-end"
          >
            <div
              className="w-full rounded-t-[4px]"
              style={{
                height: d.minutes > 0 ? `${Math.max((d.minutes / max) * 100, 6)}%` : "3px",
                backgroundColor: d.isToday ? "var(--terracotta)" : "var(--sage)",
                opacity: d.minutes > 0 ? 1 : 0.25,
              }}
            />
          </div>
        ))}
      </div>
      <div className="mt-1 flex gap-1.5">
        {days.map((d) => (
          <span
            key={d.key}
            className={cn(
              "flex-1 text-center text-[10px] text-muted-foreground",
              d.isToday && "font-bold text-terracotta"
            )}
          >
            {d.isToday ? "오늘" : d.label}
          </span>
        ))}
      </div>

      {!hasAny && (
        <p className="mt-2 text-xs text-muted-foreground">
          아직 집중 기록이 없어요. 위의 집중 버튼으로 시작해보세요.
        </p>
      )}
    </section>
  );
}
