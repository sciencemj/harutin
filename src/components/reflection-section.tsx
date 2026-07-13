"use client";

import { useMemo } from "react";
import { subDays } from "date-fns";
import { toast } from "sonner";
import { BookHeart } from "lucide-react";
import { MoodHeatmap } from "@/components/mood-heatmap";
import { useAppStore } from "@/lib/store";
import { dateKey, todayKey } from "@/lib/date";
import { calcDayStats } from "@/lib/selectors";
import { MOOD_META, type DailyReflection, type Mood } from "@/lib/types";
import { cn } from "@/lib/utils";

const MOODS = [1, 2, 3, 4, 5] as Mood[];

/** 오늘(미기록이면 어제)부터 거슬러 올라가는 연속 기록 일수 */
function calcRecordStreak(reflections: DailyReflection[]): number {
  const recorded = new Set(reflections.map((r) => r.date));
  let cursor = new Date();
  if (!recorded.has(dateKey(cursor))) cursor = subDays(cursor, 1);
  let streak = 0;
  while (recorded.has(dateKey(cursor))) {
    streak++;
    cursor = subDays(cursor, 1);
  }
  return streak;
}

/** 이번 달 가장 자주 남긴 기분 */
function monthTopMood(reflections: DailyReflection[], todayK: string): Mood | null {
  const month = todayK.slice(0, 7);
  const counts = new Map<Mood, number>();
  for (const r of reflections) {
    if (r.date.startsWith(month)) counts.set(r.mood, (counts.get(r.mood) ?? 0) + 1);
  }
  let top: Mood | null = null;
  let max = 0;
  for (const [m, c] of counts) {
    if (c > max) {
      max = c;
      top = m;
    }
  }
  return top;
}

export function ReflectionSection() {
  const routines = useAppStore((s) => s.routines);
  const todos = useAppStore((s) => s.todos);
  const events = useAppStore((s) => s.events);
  const reflections = useAppStore((s) => s.reflections);
  const saveReflection = useAppStore((s) => s.saveReflection);

  const today = todayKey();
  const mood = reflections.find((r) => r.date === today)?.mood ?? null;
  const recordedDays = reflections.length;
  const streak = calcRecordStreak(reflections);
  const topMood = monthTopMood(reflections, today);

  const progress = useMemo(
    () => calcDayStats(routines, todos, events, today, new Date()).progress,
    [routines, todos, events, today]
  );

  function handlePick(m: Mood) {
    saveReflection(today, { mood: m });
    toast.success(`오늘의 기분을 남겼어요 ${MOOD_META[m].emoji}`);
  }

  return (
    <section
      id="reflection"
      aria-labelledby="reflection-title"
      className="scroll-mt-6 rounded-3xl bg-cream/80 p-5 sm:p-7"
    >
      <div className="mb-4 flex items-center gap-2">
        <BookHeart className="size-5 text-terracotta" aria-hidden />
        <h2 id="reflection-title" className="font-serif text-lg font-bold">
          하루 마무리
        </h2>
        <span className="ml-auto text-xs text-muted-foreground">
          오늘 완료율 <b className="text-foreground">{progress}%</b>
        </span>
      </div>

      <div className="grid gap-6 lg:grid-cols-[264px_1fr]">
        <div>
          <p className="mb-2 text-sm font-medium">오늘 기분은 어땠나요?</p>
          <div className="flex gap-2" role="group" aria-label="오늘의 기분 선택">
            {MOODS.map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => handlePick(m)}
                aria-pressed={mood === m}
                aria-label={MOOD_META[m].label}
                title={MOOD_META[m].label}
                className={cn(
                  "flex size-11 items-center justify-center rounded-full border-2 text-xl transition-all",
                  "hover:scale-105 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
                  mood === m
                    ? "border-terracotta bg-terracotta-soft"
                    : "border-transparent bg-card/70 grayscale-[0.4] hover:grayscale-0"
                )}
              >
                <span aria-hidden>{MOOD_META[m].emoji}</span>
              </button>
            ))}
          </div>
          <dl className="mt-4 space-y-1.5 text-xs text-muted-foreground">
            <div className="flex justify-between">
              <dt>기록한 날</dt>
              <dd className="font-medium text-foreground">{recordedDays}일</dd>
            </div>
            <div className="flex justify-between">
              <dt>연속 기록</dt>
              <dd className="font-medium text-foreground">{streak}일</dd>
            </div>
            <div className="flex justify-between">
              <dt>이번 달 대표 기분</dt>
              <dd>
                {topMood ? (
                  <span title={MOOD_META[topMood].label}>{MOOD_META[topMood].emoji}</span>
                ) : (
                  <span>—</span>
                )}
              </dd>
            </div>
          </dl>
        </div>

        <div className="min-w-0">
          <p className="mb-2 text-sm font-medium">지나온 날들</p>
          <MoodHeatmap />
        </div>
      </div>

      <p className="mt-5 font-serif text-sm text-muted-foreground italic">
        “완벽하지 않아도 괜찮아요. 오늘도 하루를 살아냈으니까요.”
      </p>
    </section>
  );
}
