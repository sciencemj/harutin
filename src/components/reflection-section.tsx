"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { BookHeart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAppStore } from "@/lib/store";
import { todayKey } from "@/lib/date";
import { calcDayStats } from "@/lib/selectors";
import type { Mood } from "@/lib/types";
import { cn } from "@/lib/utils";

const MOODS: { value: Mood; emoji: string; label: string }[] = [
  { value: 1, emoji: "😞", label: "힘들었어요" },
  { value: 2, emoji: "😕", label: "아쉬웠어요" },
  { value: 3, emoji: "🙂", label: "무난했어요" },
  { value: 4, emoji: "😊", label: "좋았어요" },
  { value: 5, emoji: "🥰", label: "최고였어요" },
];

export function ReflectionSection() {
  const routines = useAppStore((s) => s.routines);
  const todos = useAppStore((s) => s.todos);
  const events = useAppStore((s) => s.events);
  const reflections = useAppStore((s) => s.reflections);
  const saveReflection = useAppStore((s) => s.saveReflection);

  const today = todayKey();
  const saved = reflections.find((r) => r.date === today);

  // 이 섹션은 store hydration 이후에만 렌더되므로 마운트 시점의 saved가 최신 값이다
  const [mood, setMood] = useState<Mood | null>(saved?.mood ?? null);
  const [wellDone, setWellDone] = useState(saved?.wellDone ?? "");
  const [remember, setRemember] = useState(saved?.remember ?? "");

  const progress = useMemo(
    () => calcDayStats(routines, todos, events, today, new Date()).progress,
    [routines, todos, events, today]
  );

  function handleSave() {
    if (!mood) {
      toast.error("오늘 기분을 먼저 골라주세요");
      return;
    }
    saveReflection(today, { mood, wellDone: wellDone.trim(), remember: remember.trim() });
    toast.success("오늘 하루를 잘 담아두었어요");
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

      <div className="space-y-4">
        <div>
          <p className="mb-2 text-sm font-medium">오늘 기분은 어땠나요?</p>
          <div className="flex gap-2" role="group" aria-label="오늘의 기분 선택">
            {MOODS.map((m) => (
              <button
                key={m.value}
                type="button"
                onClick={() => setMood(m.value)}
                aria-pressed={mood === m.value}
                aria-label={m.label}
                title={m.label}
                className={cn(
                  "flex size-11 items-center justify-center rounded-full border-2 text-xl transition-all",
                  "hover:scale-105 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
                  mood === m.value
                    ? "border-terracotta bg-terracotta-soft"
                    : "border-transparent bg-card/70 grayscale-[0.4] hover:grayscale-0"
                )}
              >
                <span aria-hidden>{m.emoji}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="reflection-well">오늘 잘한 일 한 줄</Label>
            <Input
              id="reflection-well"
              value={wellDone}
              onChange={(e) => setWellDone(e.target.value)}
              placeholder="작은 것도 충분해요"
              maxLength={100}
              className="bg-card"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="reflection-remember">내일 기억할 일 한 줄</Label>
            <Input
              id="reflection-remember"
              value={remember}
              onChange={(e) => setRemember(e.target.value)}
              placeholder="내일의 나에게 남기는 메모"
              maxLength={100}
              className="bg-card"
            />
          </div>
        </div>

        <div className="flex items-center justify-between gap-3">
          <p className="font-serif text-sm text-muted-foreground italic">
            “완벽하지 않아도 괜찮아요. 오늘도 하루를 살아냈으니까요.”
          </p>
          <Button onClick={handleSave} className="shrink-0">
            {saved ? "다시 저장" : "저장"}
          </Button>
        </div>
      </div>
    </section>
  );
}
