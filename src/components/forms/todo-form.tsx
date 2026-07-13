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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAppStore, findCategory } from "@/lib/store";
import { PRIORITY_LABEL, type Priority, type Todo } from "@/lib/types";

interface TodoFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  todo?: Todo | null;
}

const PRIORITIES: Priority[] = ["high", "medium", "low"];

export function TodoForm({ open, onOpenChange, todo }: TodoFormProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        {/* DialogContent가 닫힐 때 unmount되므로 열 때마다 폼 상태가 새로 초기화된다 */}
        <TodoFormBody todo={todo ?? null} onClose={() => onOpenChange(false)} />
      </DialogContent>
    </Dialog>
  );
}

function TodoFormBody({ todo, onClose }: { todo: Todo | null; onClose: () => void }) {
  const addTodo = useAppStore((s) => s.addTodo);
  const updateTodo = useAppStore((s) => s.updateTodo);
  const categories = useAppStore((s) => s.categories);

  const [title, setTitle] = useState(todo?.title ?? "");
  const [priority, setPriority] = useState<Priority>(todo?.priority ?? "medium");
  const [categoryId, setCategoryId] = useState(
    todo?.categoryId ?? categories[0]?.id ?? "cat-personal"
  );
  const [dueDate, setDueDate] = useState(todo?.dueDate ?? "");
  const [estimate, setEstimate] = useState(
    todo?.estimateMinutes ? String(todo.estimateMinutes) : ""
  );
  const [note, setNote] = useState(todo?.note ?? "");
  const [error, setError] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) {
      setError("무엇을 할지 적어주세요.");
      return;
    }
    const minutes = estimate ? Number(estimate) : undefined;
    if (minutes !== undefined && (!Number.isFinite(minutes) || minutes <= 0)) {
      setError("예상 시간은 1분 이상의 숫자로 적어주세요.");
      return;
    }
    const data = {
      title: title.trim(),
      priority,
      categoryId,
      dueDate: dueDate || undefined,
      estimateMinutes: minutes,
      note: note.trim() || undefined,
    };
    if (todo) {
      updateTodo(todo.id, data);
      toast.success("할 일을 고쳤어요");
    } else {
      addTodo(data);
      toast.success("할 일을 담았어요");
    }
    onClose();
  }

  return (
    <>
      <DialogHeader>
          <DialogTitle className="font-serif">{todo ? "할 일 고치기" : "새 할 일"}</DialogTitle>
          <DialogDescription>부담 없이, 오늘 할 수 있는 만큼만.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="todo-title">제목</Label>
            <Input
              id="todo-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="예: 이메일 답장하기"
              autoFocus
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="todo-priority">우선순위</Label>
              <Select value={priority} onValueChange={(v) => setPriority(v as Priority)}>
                <SelectTrigger id="todo-priority" className="w-full">
                  <SelectValue>
                    {(v: Priority | null) => PRIORITY_LABEL[v ?? priority]}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {PRIORITIES.map((p) => (
                    <SelectItem key={p} value={p}>
                      {PRIORITY_LABEL[p]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="todo-category">카테고리</Label>
              <Select value={categoryId} onValueChange={(v) => setCategoryId(v as string)}>
                <SelectTrigger id="todo-category" className="w-full">
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
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="todo-due">마감일 (선택)</Label>
              <Input
                id="todo-due"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="todo-estimate">예상 시간(분)</Label>
              <Input
                id="todo-estimate"
                type="number"
                min={1}
                inputMode="numeric"
                value={estimate}
                onChange={(e) => setEstimate(e.target.value)}
                placeholder="예: 30"
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="todo-note">메모 (선택)</Label>
            <Textarea
              id="todo-note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="세부 내용을 적어두세요"
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
            <Button type="submit">{todo ? "저장" : "할 일 추가"}</Button>
          </DialogFooter>
        </form>
    </>
  );
}
