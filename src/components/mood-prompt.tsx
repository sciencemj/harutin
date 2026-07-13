"use client";

import { useState } from "react";
import { format, subDays } from "date-fns";
import { ko } from "date-fns/locale";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useAppStore } from "@/lib/store";
import { sound } from "@/lib/sound";
import { dateKey, parseDateKey } from "@/lib/date";
import { useToday } from "@/lib/use-today";
import { MOOD_META, type Mood } from "@/lib/types";
import { cn } from "@/lib/utils";

const MOODS = [1, 2, 3, 4, 5] as Mood[];

/** 어제 기분을 안 남겼으면 하루 한 번 묻는 팝업 — 이모지 선택만 */
export function MoodPrompt() {
  const today = useToday();
  const reflections = useAppStore((s) => s.reflections);
  const saveReflection = useAppStore((s) => s.saveReflection);
  const dismissed = useAppStore((s) => s.moodPromptDismissed);
  const setDismissed = useAppStore((s) => s.setMoodPromptDismissed);
  // 아무 활동 기록도 없는 첫 사용자에겐 묻지 않는다
  const hasHistory = useAppStore(
    (s) =>
      s.reflections.length > 0 ||
      s.routines.some((r) => r.completedDates.length > 0) ||
      s.todos.some((t) => t.done)
  );

  // 이번 렌더 세션에서 사용자가 닫은 날짜 (자정 넘어가면 다시 뜰 수 있게 날짜로 기억)
  const [closedFor, setClosedFor] = useState<string | null>(null);

  const todayDate = parseDateKey(today);
  if (!todayDate) return null;
  const yesterday = dateKey(subDays(todayDate, 1));
  const yesterdayLabel = format(subDays(todayDate, 1), "M월 d일 EEEE", { locale: ko });

  const alreadyRecorded = reflections.some((r) => r.date === yesterday);
  const open =
    hasHistory && !alreadyRecorded && dismissed !== yesterday && closedFor !== yesterday;

  function skip() {
    setDismissed(yesterday);
    setClosedFor(yesterday);
  }

  function pick(m: Mood) {
    saveReflection(yesterday, { mood: m });
    sound.check();
    toast.success(`어제의 기분을 남겼어요 ${MOOD_META[m].emoji}`);
    setClosedFor(yesterday);
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && skip()}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="font-serif">어제 하루는 어땠나요?</DialogTitle>
          <DialogDescription>
            {yesterdayLabel}의 기분이 아직 비어 있어요. 이모지 하나면 충분해요.
          </DialogDescription>
        </DialogHeader>
        <div className="flex justify-center gap-2 py-2" role="group" aria-label="어제의 기분 선택">
          {MOODS.map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => pick(m)}
              aria-label={MOOD_META[m].label}
              title={MOOD_META[m].label}
              className={cn(
                "flex size-12 items-center justify-center rounded-full border-2 border-transparent bg-muted text-2xl transition-all",
                "hover:scale-110 hover:border-terracotta hover:bg-terracotta-soft",
                "focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
              )}
            >
              <span aria-hidden>{MOOD_META[m].emoji}</span>
            </button>
          ))}
        </div>
        <Button variant="ghost" size="sm" className="mx-auto" onClick={skip}>
          기억이 안 나요, 건너뛸게요
        </Button>
      </DialogContent>
    </Dialog>
  );
}
