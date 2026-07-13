"use client";

import { useState } from "react";
import { CalendarPlus, ListPlus, Plus, Sprout } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { TodoForm } from "@/components/forms/todo-form";
import { EventForm } from "@/components/forms/event-form";
import { RoutineForm } from "@/components/forms/routine-form";

type FormKind = "todo" | "event" | "routine" | null;

const OPTIONS: { kind: Exclude<FormKind, null>; icon: typeof Plus; label: string; sub: string }[] = [
  { kind: "todo", icon: ListPlus, label: "할 일", sub: "오늘 하고 싶은 일 하나" },
  { kind: "event", icon: CalendarPlus, label: "일정", sub: "시간이 정해진 약속" },
  { kind: "routine", icon: Sprout, label: "루틴", sub: "매일 반복하는 작은 습관" },
];

/** 데스크톱 상단 '새로 만들기' + 모바일 우하단 플로팅 버튼 */
export function QuickAdd() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [form, setForm] = useState<FormKind>(null);

  function openForm(kind: FormKind) {
    setDrawerOpen(false);
    setForm(kind);
  }

  return (
    <>
      {/* 데스크톱: 드롭다운 */}
      <div className="hidden lg:block">
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button>
                <Plus data-icon="inline-start" /> 새로 만들기
              </Button>
            }
          />
          <DropdownMenuContent align="end">
            {OPTIONS.map((o) => (
              <DropdownMenuItem key={o.kind} onClick={() => openForm(o.kind)}>
                <o.icon /> {o.label} 추가
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* 모바일: 플로팅 버튼 + 드로어 */}
      <Button
        size="icon-lg"
        aria-label="새로 만들기"
        onClick={() => setDrawerOpen(true)}
        className="fixed right-4 bottom-20 z-40 size-14 rounded-full shadow-lg shadow-primary/25 lg:hidden"
      >
        <Plus className="size-6" />
      </Button>
      <Drawer open={drawerOpen} onOpenChange={setDrawerOpen}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle className="font-serif">무엇을 추가할까요?</DrawerTitle>
            <DrawerDescription>가볍게 하나만 담아도 충분해요.</DrawerDescription>
          </DrawerHeader>
          <div className="grid gap-2 px-4 pb-8">
            {OPTIONS.map((o) => (
              <button
                key={o.kind}
                type="button"
                onClick={() => openForm(o.kind)}
                className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4 text-left transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
              >
                <span className="flex size-10 items-center justify-center rounded-full bg-sage-soft text-primary">
                  <o.icon className="size-5" aria-hidden />
                </span>
                <span>
                  <span className="block text-sm font-medium">{o.label} 추가</span>
                  <span className="block text-xs text-muted-foreground">{o.sub}</span>
                </span>
              </button>
            ))}
          </div>
        </DrawerContent>
      </Drawer>

      <TodoForm open={form === "todo"} onOpenChange={(o) => !o && setForm(null)} />
      <EventForm open={form === "event"} onOpenChange={(o) => !o && setForm(null)} />
      <RoutineForm open={form === "routine"} onOpenChange={(o) => !o && setForm(null)} />
    </>
  );
}
