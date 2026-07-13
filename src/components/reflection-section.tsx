"use client";

import { useMemo } from "react";
import { toast } from "sonner";
import { BookHeart } from "lucide-react";
import { MoodHeatmap } from "@/components/mood-heatmap";
import { useAppStore } from "@/lib/store";
import { todayKey } from "@/lib/date";
import { calcDayStats } from "@/lib/selectors";
import { MOOD_META, type Mood } from "@/lib/types";
import { cn } from "@/lib/utils";

const MOODS = [1, 2, 3, 4, 5] as Mood[];

export function ReflectionSection() {
  const routines = useAppStore((s) => s.routines);
  const todos = useAppStore((s) => s.todos);
  const events = useAppStore((s) => s.events);
  const reflections = useAppStore((s) => s.reflections);
  const saveReflection = useAppStore((s) => s.saveReflection);

  const today = todayKey();
  const mood = reflections.find((r) => r.date === today)?.mood ?? null;

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

      <div className="space-y-5">
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
        </div>

        <div>
          <p className="mb-2 text-sm font-medium">지나온 날들</p>
          <MoodHeatmap />
        </div>

        <p className="font-serif text-sm text-muted-foreground italic">
          “완벽하지 않아도 괜찮아요. 오늘도 하루를 살아냈으니까요.”
        </p>
      </div>
    </section>
  );
}
