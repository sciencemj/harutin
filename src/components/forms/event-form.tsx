"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TimeSelect } from "@/components/time-select";
import { useAppStore, findCategory } from "@/lib/store";
import { todayKey } from "@/lib/date";
import { pushEventCreate, pushEventUpdate } from "@/lib/sync/engine";
import type { CalendarEvent } from "@/lib/types";

interface EventFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  event?: CalendarEvent | null;
  /** 새 일정의 기본 날짜 (미니 캘린더에서 고른 날) */
  defaultDate?: string;
}

export function EventForm({ open, onOpenChange, event, defaultDate }: EventFormProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        {/* DialogContent가 닫힐 때 unmount되므로 열 때마다 폼 상태가 새로 초기화된다 */}
        <EventFormBody
          event={event ?? null}
          defaultDate={defaultDate}
          onClose={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  );
}

function EventFormBody({
  event,
  defaultDate,
  onClose,
}: {
  event: CalendarEvent | null;
  defaultDate?: string;
  onClose: () => void;
}) {
  const addEvent = useAppStore((s) => s.addEvent);
  const updateEvent = useAppStore((s) => s.updateEvent);
  const categories = useAppStore((s) => s.categories);

  const [title, setTitle] = useState(event?.title ?? "");
  const [date, setDate] = useState(event?.date ?? defaultDate ?? todayKey());
  const [allDay, setAllDay] = useState(event?.allDay ?? false);
  const [startTime, setStartTime] = useState(event?.startTime ?? "");
  const [endTime, setEndTime] = useState(event?.endTime ?? "");
  const [categoryId, setCategoryId] = useState(
    event?.categoryId ?? categories[0]?.id ?? "cat-personal"
  );
  const [location, setLocation] = useState(event?.location ?? "");
  const [note, setNote] = useState(event?.note ?? "");
  const [error, setError] = useState("");

  /** 시작 시간을 고르면 종료가 비어 있거나 앞서 있을 때 +1시간으로 맞춰준다 */
  function handleStartChange(next: string) {
    setStartTime(next);
    if (next && (!endTime || endTime <= next)) {
      const [h, m] = next.split(":").map(Number);
      const end = `${String(Math.min(h + 1, 23)).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
      setEndTime(end > next ? end : "23:45");
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) {
      setError("일정 제목을 적어주세요.");
      return;
    }
    if (!date) {
      setError("날짜를 골라주세요.");
      return;
    }
    if (!allDay && !startTime) {
      setError("시작 시간을 골라주세요. 시간이 정해지지 않았다면 종일로 바꿔보세요.");
      return;
    }
    if (!allDay && startTime && endTime && endTime <= startTime) {
      setError("종료 시간은 시작 시간보다 뒤여야 해요.");
      return;
    }
    const data = {
      title: title.trim(),
      date,
      allDay,
      startTime: allDay ? undefined : startTime || undefined,
      endTime: allDay ? undefined : endTime || undefined,
      categoryId,
      location: location.trim() || undefined,
      note: note.trim() || undefined,
    };
    if (event) {
      updateEvent(event.id, data);
      pushEventUpdate({ ...event, ...data }).catch(() =>
        toast.error("Apple 캘린더에 반영하지 못했어요")
      );
      toast.success("일정을 고쳤어요");
    } else {
      const created = addEvent(data);
      pushEventCreate(created).catch(() =>
        toast.error("Apple 캘린더에 반영하지 못했어요")
      );
      toast.success("일정을 적어두었어요");
    }
    onClose();
  }

  return (
    <>
      <DialogHeader>
          <DialogTitle className="font-serif">{event ? "일정 고치기" : "새 일정"}</DialogTitle>
          <DialogDescription>하루의 흐름 속에 자리를 잡아둘게요.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="event-title">제목</Label>
            <Input
              id="event-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="예: 팀 미팅"
              autoFocus
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="event-date">날짜</Label>
              <Input
                id="event-date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="event-category">카테고리</Label>
              <Select value={categoryId} onValueChange={(v) => setCategoryId(v as string)}>
                <SelectTrigger id="event-category" className="w-full">
                  <SelectValue>
                    {(v: string | null) => findCategory(categories, v ?? categoryId).name}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {categories.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex items-center justify-between rounded-xl border border-border bg-muted/50 px-3 py-2.5">
            <Label htmlFor="event-allday" className="cursor-pointer">
              종일 일정
            </Label>
            <Switch id="event-allday" checked={allDay} onCheckedChange={(c) => setAllDay(c)} />
          </div>
          {!allDay && (
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="event-start">시작</Label>
                <TimeSelect
                  id="event-start"
                  value={startTime}
                  onChange={handleStartChange}
                  aria-label="시작 시간"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="event-end">종료 (선택)</Label>
                <TimeSelect
                  id="event-end"
                  value={endTime}
                  onChange={setEndTime}
                  allowEmpty
                  aria-label="종료 시간"
                />
              </div>
            </div>
          )}
          <div className="space-y-1.5">
            <Label htmlFor="event-location">장소 (선택)</Label>
            <Input
              id="event-location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="예: 회의실 A"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="event-note">메모 (선택)</Label>
            <Textarea
              id="event-note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="준비물이나 참고 사항"
              rows={2}
            />
          </div>
          {error && (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          )}
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={onClose}>
              취소
            </Button>
            <Button type="submit">{event ? "저장" : "일정 추가"}</Button>
          </DialogFooter>
        </form>
    </>
  );
}
