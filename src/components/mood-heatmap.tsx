"use client";

import { useEffect, useRef } from "react";
import { addDays, format, isSameDay, startOfWeek, subWeeks } from "date-fns";
import { ko } from "date-fns/locale";
import { useAppStore } from "@/lib/store";
import { dateKey } from "@/lib/date";
import { MOOD_META, type Mood } from "@/lib/types";
import { cn } from "@/lib/utils";

const WEEKS = 52;
const EMPTY_COLOR = "#EDE6D6";

/** 깃허브 잔디 스타일 — 최근 1년의 기분 기록 */
export function MoodHeatmap() {
  const reflections = useAppStore((s) => s.reflections);
  const scrollRef = useRef<HTMLDivElement>(null);

  // 좁은 화면에선 가장 최근(오른쪽 끝)이 먼저 보이게
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollLeft = el.scrollWidth;
  }, []);

  // 셀 140개 수준이라 memo 없이 매 렌더 계산해도 충분히 싸다 (React Compiler가 알아서 캐시)
  const moodByDate = new Map(reflections.map((r) => [r.date, r.mood]));

  const today = new Date();
  const start = startOfWeek(subWeeks(today, WEEKS - 1));
  const weeks = Array.from({ length: WEEKS }, (_, w) =>
    Array.from({ length: 7 }, (_, d) => addDays(start, w * 7 + d))
  );

  // 주가 바뀌며 달이 바뀌는 지점에 월 라벨
  const monthLabels = weeks.map((week, i) => {
    const m = week[0].getMonth();
    if (i === 0 || m !== weeks[i - 1][0].getMonth()) {
      return format(week[0], "M월", { locale: ko });
    }
    return null;
  });

  return (
    <div>
      <div ref={scrollRef} className="overflow-x-auto pb-1">
        <div className="w-max">
          <div className="mb-1 grid auto-cols-max grid-flow-col gap-[3px] text-[10px] text-muted-foreground">
            {monthLabels.map((label, i) => (
              <span key={i} className="h-3 w-3.5 overflow-visible whitespace-nowrap">
                {label}
              </span>
            ))}
          </div>
          <div
            className="grid auto-cols-max grid-flow-col gap-[3px]"
            role="img"
            aria-label="최근 1년 동안의 기분 기록"
          >
            {weeks.map((week, wi) => (
              <div key={wi} className="grid gap-[3px]">
                {week.map((day) => {
                  if (day > today) {
                    return <span key={day.getTime()} className="size-3.5" aria-hidden />;
                  }
                  const mood = moodByDate.get(dateKey(day)) as Mood | undefined;
                  const isToday = isSameDay(day, today);
                  return (
                    <span
                      key={day.getTime()}
                      title={
                        format(day, "M월 d일 (EEE)", { locale: ko }) +
                        (mood ? ` · ${MOOD_META[mood].emoji} ${MOOD_META[mood].label}` : " · 기록 없음")
                      }
                      className={cn("size-3.5 rounded-[4px]", isToday && "ring-1 ring-terracotta")}
                      style={{ backgroundColor: mood ? MOOD_META[mood].color : EMPTY_COLOR }}
                    />
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="mt-2 flex items-center gap-1.5 text-[10px] text-muted-foreground">
        <span>힘든 날</span>
        {([1, 2, 3, 4, 5] as Mood[]).map((m) => (
          <span
            key={m}
            className="size-2.5 rounded-[3px]"
            style={{ backgroundColor: MOOD_META[m].color }}
            aria-hidden
          />
        ))}
        <span>좋은 날</span>
      </div>
    </div>
  );
}
