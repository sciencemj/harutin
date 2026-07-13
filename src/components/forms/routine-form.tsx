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
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAppStore } from "@/lib/store";
import {
  DAY_LABELS,
  TIME_OF_DAY_LABEL,
  TIME_OF_DAY_ORDER,
  type Routine,
  type TimeOfDay,
} from "@/lib/types";
import { cn } from "@/lib/utils";

interface RoutineFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  routine?: Routine | null;
}

const ALL_DAYS = [0, 1, 2, 3, 4, 5, 6];

/** 루틴에 어울리는 추천 이모지 */
const EMOJI_CHOICES = [
  "💧", "🧘", "🏃", "💪", "🚶", "🚴", "🏊", "🤸",
  "💊", "🥗", "🍎", "☕", "🍵", "🥛", "🍳", "🚭",
  "📚", "✍️", "💻", "🗣️", "🎧", "🎹", "🎨", "📝",
  "🛏️", "😴", "🧹", "🧺", "🛁", "🪥", "🧴", "🌤️",
  "🌱", "🪴", "🌸", "☀️", "🌙", "⭐", "🔥", "🍀",
  "🙏", "❤️", "🐕", "🐈", "💰", "📵", "🧠", "🎯",
];

export function RoutineForm({ open, onOpenChange, routine }: RoutineFormProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        {/* DialogContent가 닫힐 때 unmount되므로 열 때마다 폼 상태가 새로 초기화된다 */}
        <RoutineFormBody routine={routine ?? null} onClose={() => onOpenChange(false)} />
      </DialogContent>
    </Dialog>
  );
}

function RoutineFormBody({
  routine,
  onClose,
}: {
  routine: Routine | null;
  onClose: () => void;
}) {
  const addRoutine = useAppStore((s) => s.addRoutine);
  const updateRoutine = useAppStore((s) => s.updateRoutine);

  const [name, setName] = useState(routine?.name ?? "");
  const [emoji, setEmoji] = useState(routine?.emoji ?? "🌱");
  const [emojiOpen, setEmojiOpen] = useState(false);
  const [timeOfDay, setTimeOfDay] = useState<TimeOfDay>(routine?.timeOfDay ?? "morning");
  const [days, setDays] = useState<number[]>(routine?.days ?? ALL_DAYS);
  const [note, setNote] = useState(routine?.note ?? "");
  const [error, setError] = useState("");

  function toggleDay(d: number) {
    setDays((prev) => (prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d]));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      setError("루틴 이름을 알려주세요.");
      return;
    }
    if (days.length === 0) {
      setError("반복할 요일을 하나 이상 골라주세요.");
      return;
    }
    const data = {
      name: name.trim(),
      emoji: emoji.trim() || "🌱",
      timeOfDay,
      days: [...days].sort(),
      note: note.trim() || undefined,
    };
    if (routine) {
      updateRoutine(routine.id, data);
      toast.success("루틴을 고쳤어요");
    } else {
      addRoutine(data);
      toast.success("새 루틴을 심었어요");
    }
    onClose();
  }

  return (
    <>
      <DialogHeader>
          <DialogTitle className="font-serif">
            {routine ? "루틴 고치기" : "새 루틴"}
          </DialogTitle>
          <DialogDescription>매일 반복하며 나를 돌보는 작은 습관이에요.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex gap-2">
            <div className="w-16 space-y-1.5">
              <Label htmlFor="routine-emoji">아이콘</Label>
              <Popover open={emojiOpen} onOpenChange={setEmojiOpen}>
                <PopoverTrigger
                  render={
                    <Button
                      id="routine-emoji"
                      type="button"
                      variant="outline"
                      className="w-full text-lg"
                      aria-label={`아이콘 선택 (현재 ${emoji})`}
                    >
                      <span aria-hidden>{emoji}</span>
                    </Button>
                  }
                />
                <PopoverContent className="w-72 p-2">
                  <div className="grid grid-cols-8 gap-0.5" role="listbox" aria-label="추천 아이콘">
                    {EMOJI_CHOICES.map((e) => (
                      <button
                        key={e}
                        type="button"
                        role="option"
                        aria-selected={emoji === e}
                        aria-label={`아이콘 ${e}`}
                        onClick={() => {
                          setEmoji(e);
                          setEmojiOpen(false);
                        }}
                        className={cn(
                          "flex size-8 items-center justify-center rounded-lg text-lg transition-colors hover:bg-muted",
                          "focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
                          emoji === e && "bg-sage-soft ring-1 ring-sage"
                        )}
                      >
                        {e}
                      </button>
                    ))}
                  </div>
                  <Input
                    value={emoji}
                    onChange={(e) => setEmoji(e.target.value)}
                    maxLength={4}
                    className="mt-2 text-center"
                    aria-label="아이콘 직접 입력"
                    placeholder="직접 입력"
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div className="flex-1 space-y-1.5">
              <Label htmlFor="routine-name">이름</Label>
              <Input
                id="routine-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="예: 물 한 잔 마시기"
                autoFocus
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="routine-time">시간대</Label>
            <Select value={timeOfDay} onValueChange={(v) => setTimeOfDay(v as TimeOfDay)}>
              <SelectTrigger id="routine-time" className="w-full">
                <SelectValue>{(v: TimeOfDay | null) => TIME_OF_DAY_LABEL[v ?? timeOfDay]}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                {TIME_OF_DAY_ORDER.map((t) => (
                  <SelectItem key={t} value={t}>
                    {TIME_OF_DAY_LABEL[t]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>반복 요일</Label>
            <div className="flex gap-1.5" role="group" aria-label="반복 요일 선택">
              {DAY_LABELS.map((label, i) => (
                <button
                  key={label}
                  type="button"
                  aria-pressed={days.includes(i)}
                  aria-label={`${label}요일`}
                  onClick={() => toggleDay(i)}
                  className={cn(
                    "flex size-9 items-center justify-center rounded-full border text-sm transition-colors",
                    "focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
                    days.includes(i)
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-input bg-card text-muted-foreground hover:bg-muted"
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="routine-note">메모 (선택)</Label>
            <Textarea
              id="routine-note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="이 루틴을 하는 이유나 팁을 남겨두세요"
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
            <Button type="submit">{routine ? "저장" : "루틴 추가"}</Button>
          </DialogFooter>
        </form>
    </>
  );
}
