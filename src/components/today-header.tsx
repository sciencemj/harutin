"use client";

import { useMemo, useState } from "react";
import { format } from "date-fns";
import {
  CalendarClock,
  ListChecks,
  Moon,
  MoonStar,
  Repeat,
  Settings,
  Sun,
  Sunrise,
  Sunset,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { DailyProgress } from "@/components/daily-progress";
import { SettingsDialog } from "@/components/settings-dialog";
import { useAppStore } from "@/lib/store";
import { formatKoreanDate, getGreeting, todayKey, type Greeting } from "@/lib/date";
import { calcDayStats } from "@/lib/selectors";
import { useNow } from "@/lib/use-now";

const PERIOD_ICON: Record<Greeting["period"], typeof Sun> = {
  dawn: MoonStar,
  morning: Sunrise,
  afternoon: Sun,
  evening: Sunset,
  night: Moon,
};

export function TodayHeader({ action }: { action?: React.ReactNode }) {
  const routines = useAppStore((s) => s.routines);
  const todos = useAppStore((s) => s.todos);
  const events = useAppStore((s) => s.events);
  const userName = useAppStore((s) => s.settings.userName);

  const now = useNow();
  const [settingsOpen, setSettingsOpen] = useState(false);

  const greeting = getGreeting(now, userName || undefined);
  const PeriodIcon = PERIOD_ICON[greeting.period];
  const stats = useMemo(
    () => calcDayStats(routines, todos, events, todayKey(), now),
    [routines, todos, events, now]
  );

  return (
    <header className="scroll-mt-6" id="top">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs text-muted-foreground">{format(now, "yyyy년")}</p>
          <h1 className="font-serif text-2xl font-bold sm:text-3xl">{formatKoreanDate(now)}</h1>
          <p className="mt-2 flex items-center gap-1.5 text-sm text-foreground/90">
            <PeriodIcon className="size-4 text-terracotta" aria-hidden />
            {greeting.text}. <span className="text-muted-foreground">{greeting.sub}</span>
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            aria-label="설정 열기"
            onClick={() => setSettingsOpen(true)}
          >
            <Settings />
          </Button>
          {action}
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2 text-xs">
        <span className="flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5">
          <ListChecks className="size-3.5 text-primary" aria-hidden />
          할 일 <b>{stats.todosDone}</b>/{stats.todosTotal}
        </span>
        <span className="flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5">
          <Repeat className="size-3.5 text-primary" aria-hidden />
          루틴 <b>{stats.routinesDone}</b>/{stats.routinesTotal}
        </span>
        <span className="flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5">
          <CalendarClock className="size-3.5 text-terracotta" aria-hidden />
          남은 일정 <b>{stats.eventsRemaining}</b>
        </span>
      </div>

      <DailyProgress progress={stats.progress} className="mt-5 max-w-xl" />

      <SettingsDialog open={settingsOpen} onOpenChange={setSettingsOpen} />
    </header>
  );
}
