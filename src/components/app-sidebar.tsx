"use client";

import { useState } from "react";
import {
  BookHeart,
  CalendarDays,
  ListChecks,
  Repeat,
  Settings,
  Sun,
} from "lucide-react";
import { SettingsDialog } from "@/components/settings-dialog";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { id: "top", icon: Sun, label: "오늘" },
  { id: "calendar", icon: CalendarDays, label: "캘린더" },
  { id: "routines", icon: Repeat, label: "루틴" },
  { id: "todos", icon: ListChecks, label: "할 일" },
  { id: "reflection", icon: BookHeart, label: "기록" },
];

export function scrollToSection(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
}

export function AppSidebar({ topInset = false }: { topInset?: boolean }) {
  const [settingsOpen, setSettingsOpen] = useState(false);

  return (
    <aside
      className={cn(
        "fixed inset-y-0 left-0 z-30 hidden w-60 flex-col border-r border-sidebar-border bg-sidebar px-4 py-6 lg:flex",
        // 오버레이 타이틀바(신호등 버튼) 아래로 로고를 내린다
        topInset && "pt-12"
      )}
    >
      <div className="mb-8 flex items-center gap-2 px-2">
        <span className="text-2xl" aria-hidden>
          🌿
        </span>
        <div>
          <p className="font-serif text-lg leading-tight font-bold">하루틴</p>
          <p className="text-[11px] text-muted-foreground">나의 하루를 돌보는 자리</p>
        </div>
      </div>

      <nav aria-label="주요 메뉴" className="flex flex-col gap-1">
        {NAV_ITEMS.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => scrollToSection(item.id)}
            className={cn(
              "flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm text-sidebar-foreground/85 transition-colors",
              "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
              "focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
            )}
          >
            <item.icon className="size-4" aria-hidden />
            {item.label}
          </button>
        ))}
        <button
          type="button"
          onClick={() => setSettingsOpen(true)}
          className={cn(
            "flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm text-sidebar-foreground/85 transition-colors",
            "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
            "focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
          )}
        >
          <Settings className="size-4" aria-hidden />
          설정
        </button>
      </nav>

      <SettingsDialog open={settingsOpen} onOpenChange={setSettingsOpen} />
    </aside>
  );
}
