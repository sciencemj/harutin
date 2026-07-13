"use client";

import { BookHeart, CalendarDays, ListChecks, Repeat, Settings } from "lucide-react";
import { useAppStore } from "@/lib/store";
import type { ActiveTab } from "@/lib/types";
import { cn } from "@/lib/utils";

const TABS: { id: ActiveTab; icon: typeof Repeat; label: string }[] = [
  { id: "routines", icon: Repeat, label: "루틴" },
  { id: "todos", icon: ListChecks, label: "할 일" },
  { id: "calendar", icon: CalendarDays, label: "캘린더" },
  { id: "reflection", icon: BookHeart, label: "기록" },
  { id: "settings", icon: Settings, label: "설정" },
];

/** 탭 보기 모드의 섹션 전환 탭바 — 초록 알약이 미끄러지며 선택을 따라간다 */
export function ViewTabs() {
  const activeTab = useAppStore((s) => s.activeTab);
  const setActiveTab = useAppStore((s) => s.setActiveTab);
  const activeIndex = Math.max(
    TABS.findIndex((t) => t.id === activeTab),
    0
  );

  return (
    <div
      role="tablist"
      aria-label="화면 선택"
      className="relative mx-auto flex w-full max-w-2xl rounded-full border border-border bg-card p-1"
    >
      {/* 슬라이딩 인디케이터 */}
      <span
        aria-hidden
        className="absolute inset-y-1 left-1 rounded-full bg-primary transition-transform duration-300 ease-out"
        style={{
          width: `calc((100% - 0.5rem) / ${TABS.length})`,
          transform: `translateX(${activeIndex * 100}%)`,
        }}
      />
      {TABS.map((t) => (
        <button
          key={t.id}
          type="button"
          role="tab"
          aria-selected={activeTab === t.id}
          onClick={() => setActiveTab(t.id)}
          className={cn(
            "relative z-10 flex flex-1 items-center justify-center gap-1.5 rounded-full px-3 py-2 text-sm transition-colors duration-300",
            "focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
            activeTab === t.id
              ? "font-medium text-primary-foreground"
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
