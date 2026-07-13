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

/** 접힐 때 부드럽게 사라지는 라벨 — 아이콘은 제자리에 있고 글자만 접힌다 */
function CollapsibleLabel({
  collapsed,
  className,
  children,
}: {
  collapsed: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <span
      className={cn(
        "overflow-hidden whitespace-nowrap transition-[max-width,opacity,margin-left] duration-300 ease-in-out",
        collapsed ? "ml-0 max-w-0 opacity-0" : "ml-2.5 max-w-[9.5rem] opacity-100",
        className
      )}
    >
      {children}
    </span>
  );
}

export function AppSidebar({ topInset = false }: { topInset?: boolean }) {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const collapsed = useAppStore((s) => s.settings.sidebarCollapsed);
  const setCollapsed = useAppStore((s) => s.setSidebarCollapsed);

  // 아이콘 x좌표 고정: 사이드바(px-3) + 버튼(px-2.5) 패딩이 양쪽 상태에서 동일하다
  const navButtonClass = cn(
    "flex w-full items-center rounded-xl px-2.5 py-2 text-sm text-sidebar-foreground/85 transition-colors",
    "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
    "focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
  );

  return (
    <aside
      className={cn(
        "fixed inset-y-0 left-0 z-30 hidden flex-col overflow-hidden border-r border-sidebar-border bg-sidebar px-3 py-6 transition-[width] duration-300 ease-in-out lg:flex",
        collapsed ? "w-[4.25rem]" : "w-60",
        // 오버레이 타이틀바(신호등 버튼) 아래로 로고를 내린다
        topInset && "pt-12"
      )}
    >
      <div className="mb-8 flex items-center px-2.5">
        <span className="shrink-0 text-2xl" aria-hidden>
          🌿
        </span>
        <CollapsibleLabel collapsed={collapsed}>
          <span className="block font-serif text-lg leading-tight font-bold">하루틴</span>
          <span className="block text-[11px] text-muted-foreground">
            나의 하루를 돌보는 자리
          </span>
        </CollapsibleLabel>
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
            <CollapsibleLabel collapsed={collapsed}>{item.label}</CollapsibleLabel>
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
          <CollapsibleLabel collapsed={collapsed}>설정</CollapsibleLabel>
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
          <PanelLeftClose className="size-4 shrink-0" aria-hidden />
        )}
        <CollapsibleLabel collapsed={collapsed}>접기</CollapsibleLabel>
      </button>

      <SettingsDialog open={settingsOpen} onOpenChange={setSettingsOpen} />
    </aside>
  );
}
