"use client";

import { BookHeart, CalendarDays, ListChecks, Repeat, Sun } from "lucide-react";
import { scrollToSection } from "@/components/app-sidebar";

const ITEMS = [
  { id: "top", icon: Sun, label: "오늘" },
  { id: "calendar", icon: CalendarDays, label: "캘린더" },
  { id: "routines", icon: Repeat, label: "루틴" },
  { id: "todos", icon: ListChecks, label: "할 일" },
  { id: "reflection", icon: BookHeart, label: "기록" },
];

export function MobileNavigation() {
  return (
    <nav
      aria-label="하단 메뉴"
      className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-card/95 backdrop-blur lg:hidden"
    >
      <div className="mx-auto flex max-w-md items-stretch justify-around px-2 pt-1 pb-[max(0.375rem,env(safe-area-inset-bottom))]">
        {ITEMS.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => scrollToSection(item.id)}
            className="flex min-w-14 flex-col items-center gap-0.5 rounded-xl px-2 py-1.5 text-muted-foreground transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
          >
            <item.icon className="size-5" aria-hidden />
            <span className="text-[10px]">{item.label}</span>
          </button>
        ))}
      </div>
    </nav>
  );
}
