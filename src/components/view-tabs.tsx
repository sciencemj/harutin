"use client";

import { BookHeart, CalendarDays, ListChecks, Repeat } from "lucide-react";
import { useAppStore } from "@/lib/store";
import type { ActiveTab } from "@/lib/types";
import { cn } from "@/lib/utils";

const TABS: { id: ActiveTab; icon: typeof Repeat; label: string }[] = [
  { id: "routines", icon: Repeat, label: "루틴" },
  { id: "todos", icon: ListChecks, label: "할 일" },
  { id: "calendar", icon: CalendarDays, label: "캘린더" },
  { id: "reflection", icon: BookHeart, label: "기록" },
];

/** 탭 보기 모드의 섹션 전환 탭바 */
export function ViewTabs() {
  const activeTab = useAppStore((s) => s.activeTab);
  const setActiveTab = useAppStore((s) => s.setActiveTab);

  return (
    <div
      role="tablist"
      aria-label="화면 선택"
      className="mx-auto flex w-full max-w-xl rounded-full border border-border bg-card p-1"
    >
      {TABS.map((t) => (
        <button
          key={t.id}
          type="button"
          role="tab"
          aria-selected={activeTab === t.id}
          onClick={() => setActiveTab(t.id)}
          className={cn(
            "flex flex-1 items-center justify-center gap-1.5 rounded-full px-3 py-2 text-sm transition-colors",
            "focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
            activeTab === t.id
              ? "bg-primary font-medium text-primary-foreground"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <t.icon className="size-4" aria-hidden />
          {t.label}
        </button>
      ))}
    </div>
  );
}
