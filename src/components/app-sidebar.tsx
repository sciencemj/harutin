"use client";

import { useState } from "react";
import {
  BookHeart,
  CalendarDays,
  ListChecks,
  PanelLeftClose,
  PanelLeftOpen,
  Repeat,
  Settings,
  Sun,
} from "lucide-react";
import { SettingsDialog } from "@/components/settings-dialog";
import { useAppStore } from "@/lib/store";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { id: "top", icon: Sun, label: "오늘" },
  { id: "calendar", icon: CalendarDays, label: "캘린더" },
  { id: "routines", icon: Repeat, label: "루틴" },
  { id: "todos", icon: ListChecks, label: "할 일" },
  { id: "reflection", icon: BookHeart, label: "기록" },
];

const TAB_IDS = ["routines", "todos", "calendar", "reflection"] as const;

export function scrollToSection(id: string) {
  // 탭 보기에서는 해당 탭으로 전환하고 위로 올린다
  const { settings, setActiveTab } = useAppStore.getState();
  if (settings.viewMode === "tabs" && (TAB_IDS as readonly string[]).includes(id)) {
    setActiveTab(id as (typeof TAB_IDS)[number]);
    document.getElementById("top")?.scrollIntoView({ behavior: "smooth", block: "start" });
    return;
  }
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
}

export function AppSidebar({ topInset = false }: { topInset?: boolean }) {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const collapsed = useAppStore((s) => s.settings.sidebarCollapsed);
  const setCollapsed = useAppStore((s) => s.setSidebarCollapsed);

  const navButtonClass = cn(
    "flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm text-sidebar-foreground/85 transition-colors",
    "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
    "focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
    collapsed && "justify-center px-0"
  );

  return (
    <aside
      className={cn(
        "fixed inset-y-0 left-0 z-30 hidden flex-col border-r border-sidebar-border bg-sidebar py-6 transition-[width,padding] duration-300 lg:flex",
        collapsed ? "w-16 px-2" : "w-60 px-4",
        // 오버레이 타이틀바(신호등 버튼) 아래로 로고를 내린다
        topInset && "pt-12"
      )}
    >
      <div className={cn("mb-8 flex items-center gap-2", collapsed ? "justify-center" : "px-2")}>
        <span className="text-2xl" aria-hidden>
          🌿
        </span>
        {!collapsed && (
          <div className="min-w-0">
            <p className="font-serif text-lg leading-tight font-bold">하루틴</p>
            <p className="text-[11px] text-muted-foreground">나의 하루를 돌보는 자리</p>
          </div>
        )}
      </div>

      <nav aria-label="주요 메뉴" className="flex flex-col gap-1">
        {NAV_ITEMS.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => scrollToSection(item.id)}
            title={collapsed ? item.label : undefined}
            aria-label={item.label}
            className={navButtonClass}
          >
            <item.icon className="size-4 shrink-0" aria-hidden />
            {!collapsed && item.label}
          </button>
        ))}
        <button
          type="button"
          onClick={() => setSettingsOpen(true)}
          title={collapsed ? "설정" : undefined}
          aria-label="설정"
          className={navButtonClass}
        >
          <Settings className="size-4 shrink-0" aria-hidden />
          {!collapsed && "설정"}
        </button>
      </nav>

      <button
        type="button"
        onClick={() => setCollapsed(!collapsed)}
        aria-label={collapsed ? "사이드바 펼치기" : "사이드바 접기"}
        title={collapsed ? "사이드바 펼치기" : "사이드바 접기"}
        className={cn(navButtonClass, "mt-auto text-muted-foreground")}
      >
        {collapsed ? (
          <PanelLeftOpen className="size-4 shrink-0" aria-hidden />
        ) : (
          <>
            <PanelLeftClose className="size-4 shrink-0" aria-hidden />
            접기
          </>
        )}
      </button>

      <SettingsDialog open={settingsOpen} onOpenChange={setSettingsOpen} />
    </aside>
  );
}
