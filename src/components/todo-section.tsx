"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import {
  ArrowDown,
  ArrowUp,
  CalendarDays,
  Check,
  ChevronDown,
  ChevronUp,
  Clock,
  ListChecks,
  Minus,
  MoreHorizontal,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TodoForm } from "@/components/forms/todo-form";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { EmptyState } from "@/components/empty-state";
import { useAppStore, findCategory } from "@/lib/store";
import { sound } from "@/lib/sound";
import { isoToDateKey, parseDateKey, todayKey } from "@/lib/date";
import { useToday } from "@/lib/use-today";
import { sortTodos, todoBucket, type TodoBucket } from "@/lib/selectors";
import { PRIORITY_LABEL, type Category, type Priority, type Todo } from "@/lib/types";
import { cn } from "@/lib/utils";

const PRIORITY_ICON: Record<Priority, typeof ArrowUp> = {
  high: ArrowUp,
  medium: Minus,
  low: ArrowDown,
};

const PRIORITY_STYLE: Record<Priority, string> = {
  high: "bg-terracotta-soft text-terracotta",
  medium: "bg-secondary text-secondary-foreground",
  low: "bg-sage-soft text-primary",
};

function dueLabel(dueDate: string, today: string): { text: string; overdue: boolean } {
  if (dueDate === today) return { text: "오늘", overdue: false };
  const d = parseDateKey(dueDate);
  if (!d) return { text: dueDate, overdue: false };
  return { text: format(d, "M/d"), overdue: dueDate < today };
}

function TodoItem({
  todo,
  category,
  canMoveUp,
  canMoveDown,
  onEdit,
  onDelete,
}: {
  todo: Todo;
  category: Category;
  canMoveUp: boolean;
  canMoveDown: boolean;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const toggleTodo = useAppStore((s) => s.toggleTodo);
  const moveTodo = useAppStore((s) => s.moveTodo);
  const today = todayKey();
  const due = todo.dueDate ? dueLabel(todo.dueDate, today) : null;
  const PIcon = PRIORITY_ICON[todo.priority];

  return (
    <div
      className={cn(
        "group flex items-start gap-2.5 rounded-2xl border bg-card p-[var(--card-pad)] transition-all duration-300",
        "hover:-translate-y-0.5 hover:shadow-[0_4px_16px_rgba(95,115,85,0.08)]",
        todo.done && "border-transparent bg-card/60"
      )}
    >
      <button
        type="button"
        onClick={() => {
          if (todo.done) sound.uncheck();
          else sound.check();
          toggleTodo(todo.id);
        }}
        aria-pressed={todo.done}
        aria-label={`${todo.title} ${todo.done ? "완료 취소" : "완료"}`}
        className={cn(
          "mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full border-2 transition-colors",
          "focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
          todo.done
            ? "animate-check-pop border-primary bg-primary text-primary-foreground"
            : "border-input hover:border-sage"
        )}
      >
        {todo.done && <Check className="size-3.5" aria-hidden />}
      </button>

      <div className="min-w-0 flex-1">
        <p
          className={cn(
            "text-sm font-medium",
            todo.done && "text-muted-foreground line-through decoration-1"
          )}
        >
          {todo.title}
        </p>
        <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
          <span
            className={cn(
              "flex items-center gap-0.5 rounded-full px-1.5 py-0.5",
              PRIORITY_STYLE[todo.priority]
            )}
          >
            <PIcon className="size-3" aria-hidden />
            {PRIORITY_LABEL[todo.priority]}
          </span>
          <span className="flex items-center gap-1">
            <span
              className="size-2 rounded-full"
              style={{ backgroundColor: category.color }}
              aria-hidden
            />
            {category.name}
          </span>
          {due && (
            <span
              className={cn("flex items-center gap-0.5", due.overdue && !todo.done && "text-destructive")}
            >
              <CalendarDays className="size-3" aria-hidden />
              {due.text}
              {due.overdue && !todo.done && " 지남"}
            </span>
          )}
          {todo.estimateMinutes && (
            <span className="flex items-center gap-0.5">
              <Clock className="size-3" aria-hidden />
              {todo.estimateMinutes}분
            </span>
          )}
        </div>
        {todo.note && <p className="mt-1 text-xs text-muted-foreground/80">{todo.note}</p>}
      </div>

      <div className="flex items-center gap-0.5">
        {!todo.done && (
          <div className="flex flex-col">
            <Button
              variant="ghost"
              size="icon-xs"
              aria-label={`${todo.title} 위로 이동`}
              disabled={!canMoveUp}
              onClick={() => moveTodo(todo.id, -1)}
            >
              <ChevronUp />
            </Button>
            <Button
              variant="ghost"
              size="icon-xs"
              aria-label={`${todo.title} 아래로 이동`}
              disabled={!canMoveDown}
              onClick={() => moveTodo(todo.id, 1)}
            >
              <ChevronDown />
            </Button>
          </div>
        )}
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label={`${todo.title} 메뉴`}
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
    </div>
  );
}

const BUCKET_LABEL: Record<TodoBucket, string> = {
  today: "오늘",
  upcoming: "예정",
  done: "완료",
};

export function TodoSection() {
  const todos = useAppStore((s) => s.todos);
  const categories = useAppStore((s) => s.categories);
  const addTodo = useAppStore((s) => s.addTodo);
  const deleteTodo = useAppStore((s) => s.deleteTodo);

  const [quickTitle, setQuickTitle] = useState("");
  const [bucket, setBucket] = useState<TodoBucket>("today");
  const [priorityFilter, setPriorityFilter] = useState<"all" | Priority>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Todo | null>(null);
  const [deleting, setDeleting] = useState<Todo | null>(null);
  const [showDoneToday, setShowDoneToday] = useState(false);

  const today = useToday();

  const counts = useMemo(() => {
    const c: Record<TodoBucket, number> = { today: 0, upcoming: 0, done: 0 };
    for (const t of todos) c[todoBucket(t, today)]++;
    return c;
  }, [todos, today]);

  const filtered = useMemo(() => {
    return sortTodos(todos).filter((t) => {
      if (todoBucket(t, today) !== bucket) return false;
      if (priorityFilter !== "all" && t.priority !== priorityFilter) return false;
      if (categoryFilter !== "all" && t.categoryId !== categoryFilter) return false;
      return true;
    });
  }, [todos, bucket, priorityFilter, categoryFilter, today]);

  // 오늘 탭에서 접어서 보여줄 오늘 완료 항목
  const doneToday = useMemo(
    () =>
      sortTodos(todos).filter(
        (t) => t.done && !!t.completedAt && isoToDateKey(t.completedAt) === today
      ),
    [todos, today]
  );

  function handleQuickAdd(e: React.FormEvent) {
    e.preventDefault();
    const title = quickTitle.trim();
    if (!title) return;
    addTodo({
      title,
      priority: "medium",
      categoryId: categories[0]?.id ?? "cat-personal",
      dueDate: today,
    });
    setQuickTitle("");
    toast.success("할 일을 담았어요");
  }

  return (
    <section id="todos" aria-labelledby="todos-title" className="scroll-mt-6">
      <div className="mb-[var(--head-gap)] flex items-center justify-between">
        <h2 id="todos-title" className="font-serif text-lg font-bold">
          오늘의 할 일
          <span className="ml-2 align-middle text-sm font-normal text-muted-foreground">
            {counts.done}개 완료
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
          <Plus data-icon="inline-start" /> 자세히 추가
        </Button>
      </div>

      <form onSubmit={handleQuickAdd} className="mb-3 flex gap-2">
        <Input
          value={quickTitle}
          onChange={(e) => setQuickTitle(e.target.value)}
          placeholder="할 일을 적고 Enter — 오늘 할 일로 담겨요"
          aria-label="빠른 할 일 추가"
          className="h-10 bg-card"
        />
        <Button type="submit" size="icon-lg" className="h-10 w-10 shrink-0" aria-label="할 일 추가">
          <Plus />
        </Button>
      </form>

      <div className="mb-3 flex flex-wrap items-center gap-2">
        <div
          className="flex rounded-full border border-border bg-card p-0.5"
          role="tablist"
          aria-label="할 일 보기 선택"
        >
          {(Object.keys(BUCKET_LABEL) as TodoBucket[]).map((b) => (
            <button
              key={b}
              type="button"
              role="tab"
              aria-selected={bucket === b}
              onClick={() => setBucket(b)}
              className={cn(
                "rounded-full px-3 py-1 text-xs transition-colors",
                "focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
                bucket === b
                  ? "bg-primary font-medium text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {BUCKET_LABEL[b]} {counts[b]}
            </button>
          ))}
        </div>
        <Select
          value={priorityFilter}
          onValueChange={(v) => setPriorityFilter(v as "all" | Priority)}
        >
          <SelectTrigger size="sm" aria-label="우선순위 필터">
            <SelectValue>
              {(v: string | null) =>
                v && v !== "all" ? PRIORITY_LABEL[v as Priority] : "우선순위"
              }
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">전체 우선순위</SelectItem>
            {(["high", "medium", "low"] as Priority[]).map((p) => (
              <SelectItem key={p} value={p}>
                {PRIORITY_LABEL[p]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={categoryFilter} onValueChange={(v) => setCategoryFilter(v as string)}>
          <SelectTrigger size="sm" aria-label="카테고리 필터">
            <SelectValue>
              {(v: string | null) =>
                v && v !== "all" ? findCategory(categories, v).name : "카테고리"
              }
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">전체 카테고리</SelectItem>
            {categories.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {filtered.length === 0 ? (
        bucket === "done" ? (
          <EmptyState
            icon={ListChecks}
            message="아직 완료한 일이 없어요"
            sub="괜찮아요, 하나씩 하다 보면 금방 쌓여요."
          />
        ) : (
          <EmptyState
            icon={ListChecks}
            message={
              bucket === "today" ? "오늘의 할 일을 비웠어요" : "예정된 할 일이 없어요"
            }
            sub="여유를 즐기거나, 가볍게 하나 담아볼까요?"
            actionLabel="할 일 추가"
            onAction={() => {
              setEditing(null);
              setFormOpen(true);
            }}
          />
        )
      ) : (
        <div className="space-y-[var(--list-gap)]">
          {filtered.map((t, i) => (
            <TodoItem
              key={t.id}
              todo={t}
              category={findCategory(categories, t.categoryId)}
              canMoveUp={i > 0}
              canMoveDown={i < filtered.length - 1}
              onEdit={() => {
                setEditing(t);
                setFormOpen(true);
              }}
              onDelete={() => setDeleting(t)}
            />
          ))}
        </div>
      )}

      {bucket === "today" && doneToday.length > 0 && (
        <div className="mt-3">
          <button
            type="button"
            onClick={() => setShowDoneToday((v) => !v)}
            aria-expanded={showDoneToday}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
          >
            <ChevronDown
              className={cn("size-3.5 transition-transform", showDoneToday && "rotate-180")}
              aria-hidden
            />
            오늘 완료한 일 {doneToday.length}개
          </button>
          {showDoneToday && (
            <div className="mt-2 space-y-[var(--list-gap)]">
              {doneToday.map((t) => (
                <TodoItem
                  key={t.id}
                  todo={t}
                  category={findCategory(categories, t.categoryId)}
                  canMoveUp={false}
                  canMoveDown={false}
                  onEdit={() => {
                    setEditing(t);
                    setFormOpen(true);
                  }}
                  onDelete={() => setDeleting(t)}
                />
              ))}
            </div>
          )}
        </div>
      )}

      <TodoForm open={formOpen} onOpenChange={setFormOpen} todo={editing} />
      <ConfirmDialog
        open={deleting !== null}
        onOpenChange={(o) => !o && setDeleting(null)}
        title={`'${deleting?.title}' 할 일을 지울까요?`}
        onConfirm={() => {
          if (deleting) {
            deleteTodo(deleting.id);
            toast.success("할 일을 지웠어요");
          }
          setDeleting(null);
        }}
      />
    </section>
  );
}
