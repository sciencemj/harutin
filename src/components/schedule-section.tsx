"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import {
  CalendarDays,
  CalendarPlus,
  Check,
  MapPin,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EventForm } from "@/components/forms/event-form";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { EmptyState } from "@/components/empty-state";
import { MiniCalendar } from "@/components/mini-calendar";
import { useAppStore, findCategory } from "@/lib/store";
import {
  formatTime,
  getEventStatus,
  parseDateKey,
  todayKey,
  untilText,
} from "@/lib/date";
import { eventsForDate } from "@/lib/selectors";
import { pushEventDelete } from "@/lib/sync/engine";
import { useNow } from "@/lib/use-now";
import type { CalendarEvent, Category } from "@/lib/types";
import { cn } from "@/lib/utils";

function TimelineItem({
  event,
  category,
  now,
  isNext,
  isToday,
  isLast,
  onEdit,
  onDelete,
}: {
  event: CalendarEvent;
  category: Category;
  now: Date;
  isNext: boolean;
  isToday: boolean;
  isLast: boolean;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const status = isToday ? getEventStatus(event, now) : "allDay";
  const until = isNext ? untilText(event, now) : null;
  const past = isToday && status === "past";

  return (
    <div className="group grid grid-cols-[3.25rem_auto_1fr_auto] gap-x-3">
      {/* 시간 */}
      <div className={cn("flex flex-col pt-0.5 text-right", past && "opacity-60")}>
        {event.allDay || !event.startTime ? (
          <span className="font-serif text-base font-bold">종일</span>
        ) : (
          <>
            <span className="font-serif text-base font-bold tabular-nums">{event.startTime}</span>
            {event.endTime && (
              <span className="text-xs text-muted-foreground tabular-nums">{event.endTime}</span>
            )}
          </>
        )}
      </div>

      {/* 타임라인 점과 선 */}
      <div className="flex flex-col items-center pt-1.5">
        <span
          className={cn(
            "grid size-3.5 shrink-0 place-items-center rounded-full bg-card ring-1",
            status === "ongoing" ? "ring-terracotta" : "ring-border"
          )}
          aria-hidden
        >
          <span
            className="size-2 rounded-full"
            style={{ backgroundColor: category.color }}
          />
        </span>
        {!isLast && <span className="w-px flex-1 bg-border" aria-hidden />}
      </div>

      {/* 내용 */}
      <div className={cn("min-w-0", !isLast && "pb-[calc(var(--list-gap)*3)]", past && "opacity-60")}>
        <div className="flex flex-wrap items-center gap-1.5">
          <p className="text-sm font-bold">{event.title}</p>
          {status === "ongoing" && (
            <Badge className="bg-terracotta text-[10px] text-white">진행 중</Badge>
          )}
          {past && (
            <span className="flex items-center gap-0.5 text-[11px] text-muted-foreground">
              <Check className="size-3" aria-hidden /> 지나감
            </span>
          )}
          {until && <span className="text-[11px] font-medium text-terracotta">{until}</span>}
        </div>
        <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
          <span
            className="size-2 rounded-full"
            style={{ backgroundColor: category.color }}
            aria-hidden
          />
          {category.name}
        </p>
        {(event.location || event.note) && (
          <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
            {event.location && (
              <span className="flex items-center gap-1">
                <MapPin className="size-3" aria-hidden />
                {event.location}
              </span>
            )}
            {event.note && <span className="truncate">{event.note}</span>}
          </p>
        )}
      </div>

      {/* 수정·삭제 */}
      <div className="flex items-start gap-0.5">
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label={`${event.title} 수정`}
          className="opacity-60 group-hover:opacity-100"
          onClick={onEdit}
        >
          <Pencil />
        </Button>
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label={`${event.title} 삭제`}
          className="text-destructive opacity-60 group-hover:opacity-100"
          onClick={onDelete}
        >
          <Trash2 />
        </Button>
      </div>
    </div>
  );
}

/** 모바일 상단에 보여줄 다음 일정 한 줄 카드 */
export function NextEventCard() {
  const events = useAppStore((s) => s.events);
  const now = useNow();
  const today = todayKey();

  const next = useMemo(
    () =>
      eventsForDate(events, today).find((e) => getEventStatus(e, now) === "upcoming") ?? null,
    [events, today, now]
  );
  if (!next) return null;
  const remain = untilText(next, now);

  return (
    <div className="flex items-center gap-3 rounded-2xl border border-terracotta/30 bg-terracotta-soft/60 px-4 py-3">
      <CalendarDays className="size-4 shrink-0 text-terracotta" aria-hidden />
      <p className="min-w-0 flex-1 truncate text-sm">
        <span className="font-medium">{next.title}</span>
        {next.startTime && (
          <span className="text-muted-foreground"> · {formatTime(next.startTime)}</span>
        )}
      </p>
      {remain && <span className="shrink-0 text-xs font-medium text-terracotta">{remain}</span>}
    </div>
  );
}

export function ScheduleSection() {
  const events = useAppStore((s) => s.events);
  const todos = useAppStore((s) => s.todos);
  const categories = useAppStore((s) => s.categories);
  const deleteEvent = useAppStore((s) => s.deleteEvent);
  const selectedDate = useAppStore((s) => s.selectedDate);

  const now = useNow();
  const today = todayKey();
  const isToday = selectedDate === today;

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<CalendarEvent | null>(null);
  const [deleting, setDeleting] = useState<CalendarEvent | null>(null);

  const dayEvents = useMemo(() => eventsForDate(events, selectedDate), [events, selectedDate]);
  const nextId = useMemo(
    () => (isToday ? dayEvents.find((e) => getEventStatus(e, now) === "upcoming")?.id : undefined),
    [isToday, dayEvents, now]
  );
  const dayTodos = useMemo(
    () => todos.filter((t) => t.dueDate === selectedDate && !t.done),
    [todos, selectedDate]
  );

  const selectedLabel = (() => {
    const d = parseDateKey(selectedDate);
    return d ? format(d, "M월 d일 EEEE", { locale: ko }) : selectedDate;
  })();

  return (
    <section id="calendar" aria-labelledby="calendar-title" className="scroll-mt-6">
      <div className="mb-4 rounded-2xl border bg-card p-4">
        <MiniCalendar />
      </div>

      {/* 하루 일정 타임라인 카드 */}
      <div className="rounded-3xl border bg-card p-[var(--sect-pad)] sm:p-[calc(var(--sect-pad)+0.25rem)]">
        <p className="text-xs font-bold tracking-wide text-primary">시간의 흐름</p>
        <div className="mt-1 mb-6 flex items-start justify-between gap-2">
          <h2 id="calendar-title" className="font-serif text-xl font-bold sm:text-2xl">
            {selectedLabel} 일정
          </h2>
          <Button
            variant="outline"
            size="sm"
            className="shrink-0 rounded-full"
            onClick={() => {
              setEditing(null);
              setFormOpen(true);
            }}
          >
            <Plus data-icon="inline-start" /> 추가
          </Button>
        </div>

        {dayEvents.length === 0 ? (
          <EmptyState
            icon={CalendarPlus}
            message={isToday ? "오늘은 잡힌 일정이 없어요" : "이 날은 아직 일정이 없어요"}
            sub="온전히 나를 위한 시간으로 채워도 좋겠어요."
            actionLabel="일정 추가"
            onAction={() => {
              setEditing(null);
              setFormOpen(true);
            }}
          />
        ) : (
          <div>
            {dayEvents.map((e, i) => (
              <TimelineItem
                key={e.id}
                event={e}
                category={findCategory(categories, e.categoryId)}
                now={now}
                isNext={e.id === nextId}
                isToday={isToday}
                isLast={i === dayEvents.length - 1}
                onEdit={() => {
                  setEditing(e);
                  setFormOpen(true);
                }}
                onDelete={() => setDeleting(e)}
              />
            ))}
          </div>
        )}
      </div>

      {dayTodos.length > 0 && (
        <div className="mt-4">
          <p className="mb-1.5 text-xs font-medium text-muted-foreground">이 날의 할 일</p>
          <ul className="space-y-1">
            {dayTodos.map((t) => (
              <li
                key={t.id}
                className="flex items-center gap-2 rounded-xl bg-muted/60 px-3 py-2 text-sm"
              >
                <span
                  className="size-2 shrink-0 rounded-full"
                  style={{ backgroundColor: findCategory(categories, t.categoryId).color }}
                  aria-hidden
                />
                <span className="truncate">{t.title}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <EventForm
        open={formOpen}
        onOpenChange={setFormOpen}
        event={editing}
        defaultDate={selectedDate}
      />
      <ConfirmDialog
        open={deleting !== null}
        onOpenChange={(o) => !o && setDeleting(null)}
        title={`'${deleting?.title}' 일정을 지울까요?`}
        onConfirm={() => {
          if (deleting) {
            pushEventDelete(deleting).catch(() =>
              toast.error("Apple 캘린더에서 지우지 못했어요")
            );
            deleteEvent(deleting.id);
            toast.success("일정을 지웠어요");
          }
          setDeleting(null);
        }}
      />
    </section>
  );
}
