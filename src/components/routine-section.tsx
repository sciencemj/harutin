"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
  Check,
  Flame,
  MoreHorizontal,
  Moon,
  Pencil,
  Plus,
  Sprout,
  Sun,
  Sunrise,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { RoutineForm } from "@/components/forms/routine-form";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { EmptyState } from "@/components/empty-state";
import { useAppStore } from "@/lib/store";
import { calcStreak, isRoutineScheduledOn, todayKey } from "@/lib/date";
import {
  TIME_OF_DAY_LABEL,
  TIME_OF_DAY_ORDER,
  type Routine,
  type TimeOfDay,
} from "@/lib/types";
import { cn } from "@/lib/utils";

const TIME_ICON: Record<TimeOfDay, typeof Sun> = {
  morning: Sunrise,
  afternoon: Sun,
  evening: Moon,
};

function RoutineCard({
  routine,
  today,
  onEdit,
  onDelete,
}: {
  routine: Routine;
  today: string;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const toggleRoutine = useAppStore((s) => s.toggleRoutine);
  const done = routine.completedDates.includes(today);
  const streak = calcStreak(routine, new Date());

  return (
    <div
      className={cn(
        "group flex items-center gap-3 rounded-2xl border bg-card p-3 transition-all duration-300",
        "hover:-translate-y-0.5 hover:shadow-[0_4px_16px_rgba(95,115,85,0.08)]",
        done && "border-sage/50 bg-sage-soft/70"
      )}
    >
      <button
        type="button"
        onClick={() => toggleRoutine(routine.id, today)}
        aria-pressed={done}
        aria-label={`${routine.name} ${done ? "완료 취소" : "완료"}`}
        className={cn(
          "flex size-11 shrink-0 items-center justify-center rounded-full border-2 text-xl transition-colors",
          "focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
          done
            ? "animate-check-pop border-primary bg-primary text-primary-foreground"
            : "border-border bg-background hover:border-sage"
        )}
      >
        {done ? <Check className="size-5" aria-hidden /> : <span aria-hidden>{routine.emoji}</span>}
      </button>
      <div className="min-w-0 flex-1">
        <p className={cn("truncate text-sm font-medium", done && "text-primary")}>
          {routine.name}
        </p>
        <div className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">
          {streak > 0 && (
            <span className="flex items-center gap-0.5 text-terracotta">
              <Flame className="size-3.5" aria-hidden />
              {streak}일 연속
            </span>
          )}
          {routine.note && <span className="truncate">{routine.note}</span>}
        </div>
      </div>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label={`${routine.name} 메뉴`}
              className="opacity-60 group-hover:opacity-100"
            >
              <MoreHorizontal />
            </Button>
          }
        />
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={onEdit}>
            <Pencil /> 수정
          </DropdownMenuItem>
          <DropdownMenuItem variant="destructive" onClick={onDelete}>
            <Trash2 /> 삭제
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

export function RoutineSection() {
  const routines = useAppStore((s) => s.routines);
  const deleteRoutine = useAppStore((s) => s.deleteRoutine);

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Routine | null>(null);
  const [deleting, setDeleting] = useState<Routine | null>(null);

  const today = todayKey();
  const now = new Date();
  const todays = routines.filter((r) => isRoutineScheduledOn(r, now));
  const resting = routines.filter((r) => !isRoutineScheduledOn(r, now));
  const doneCount = todays.filter((r) => r.completedDates.includes(today)).length;
  const allDone = todays.length > 0 && doneCount === todays.length;

  return (
    <section id="routines" aria-labelledby="routines-title" className="scroll-mt-6">
      <div className="mb-3 flex items-center justify-between">
        <h2 id="routines-title" className="font-serif text-lg font-bold">
          오늘의 루틴
          <span className="ml-2 align-middle text-sm font-normal text-muted-foreground">
            {doneCount}/{todays.length}
          </span>
        </h2>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            setEditing(null);
            setFormOpen(true);
          }}
        >
          <Plus data-icon="inline-start" /> 추가
        </Button>
      </div>

      {allDone && (
        <div className="animate-gentle-rise mb-3 flex items-center gap-2 rounded-2xl bg-sage-soft px-4 py-3 text-sm text-accent-foreground">
          <span className="text-base" aria-hidden>
            🌸
          </span>
          오늘의 루틴을 모두 마쳤어요. 스스로에게 잘했다고 말해주세요.
        </div>
      )}

      {todays.length === 0 ? (
        <EmptyState
          icon={Sprout}
          message="오늘 돌볼 루틴이 아직 없어요"
          sub="작은 습관 하나부터 심어볼까요?"
          actionLabel="첫 루틴 만들기"
          onAction={() => {
            setEditing(null);
            setFormOpen(true);
          }}
        />
      ) : (
        <div className="space-y-4">
          {TIME_OF_DAY_ORDER.map((t) => {
            const group = todays.filter((r) => r.timeOfDay === t);
            if (group.length === 0) return null;
            const TimeIcon = TIME_ICON[t];
            return (
              <div key={t}>
                <p className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                  <TimeIcon className="size-3.5" aria-hidden />
                  {TIME_OF_DAY_LABEL[t]}
                </p>
                <div className="space-y-2">
                  {group.map((r) => (
                    <RoutineCard
                      key={r.id}
                      routine={r}
                      today={today}
                      onEdit={() => {
                        setEditing(r);
                        setFormOpen(true);
                      }}
                      onDelete={() => setDeleting(r)}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {resting.length > 0 && (
        <details className="mt-3">
          <summary className="cursor-pointer text-xs text-muted-foreground hover:text-foreground">
            오늘은 쉬어가는 루틴 {resting.length}개
          </summary>
          <div className="mt-2 space-y-1.5">
            {resting.map((r) => (
              <div
                key={r.id}
                className="flex items-center gap-2 rounded-xl border border-dashed border-border px-3 py-2 text-sm text-muted-foreground"
              >
                <span aria-hidden>{r.emoji}</span>
                <span className="flex-1 truncate">{r.name}</span>
                <span className="text-xs">오늘은 쉬는 날</span>
              </div>
            ))}
          </div>
        </details>
      )}

      <RoutineForm open={formOpen} onOpenChange={setFormOpen} routine={editing} />
      <ConfirmDialog
        open={deleting !== null}
        onOpenChange={(o) => !o && setDeleting(null)}
        title={`'${deleting?.name}' 루틴을 지울까요?`}
        description="그동안의 달성 기록도 함께 사라져요."
        onConfirm={() => {
          if (deleting) {
            deleteRoutine(deleting.id);
            toast.success("루틴을 지웠어요");
          }
          setDeleting(null);
        }}
      />
    </section>
  );
}
