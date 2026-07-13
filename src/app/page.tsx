"use client";

import { useEffect } from "react";
import { isTauri } from "@tauri-apps/api/core";
import { AppSidebar } from "@/components/app-sidebar";
import { MobileNavigation } from "@/components/mobile-nav";
import { TodayHeader } from "@/components/today-header";
import { QuickAdd } from "@/components/quick-add";
import { RoutineSection } from "@/components/routine-section";
import { TodoSection } from "@/components/todo-section";
import { ScheduleSection, NextEventCard } from "@/components/schedule-section";
import { ReflectionSection } from "@/components/reflection-section";
import { useAppStore } from "@/lib/store";
import { sound } from "@/lib/sound";
import { runSync } from "@/lib/sync/engine";

function LoadingSkeleton() {
  return (
    <div className="mx-auto w-full max-w-5xl animate-pulse space-y-6 px-4 py-8 sm:px-6" aria-label="불러오는 중">
      <div className="h-8 w-52 rounded-xl bg-secondary" />
      <div className="h-4 w-72 rounded-lg bg-secondary" />
      <div className="h-3 w-full max-w-xl rounded-full bg-secondary" />
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="h-64 rounded-3xl bg-secondary/70" />
        <div className="h-64 rounded-3xl bg-secondary/70" />
      </div>
    </div>
  );
}

export default function Home() {
  const hasHydrated = useAppStore((s) => s.hasHydrated);

  // localStorage는 마운트 후에만 읽어 SSR과 첫 렌더를 일치시킨다
  useEffect(() => {
    useAppStore.persist.rehydrate();
  }, []);

  // 백그라운드 동기화: 시작 시 1회 + 5분 간격 (꺼져 있으면 runSync가 no-op)
  useEffect(() => {
    if (!hasHydrated || !isTauri()) return;
    runSync().catch((e) => console.warn("sync failed:", e));
    const t = setInterval(() => runSync().catch(() => {}), 5 * 60_000);
    return () => clearInterval(t);
  }, [hasHydrated]);

  // 모든 버튼 클릭에 아주 짧은 틱 효과음
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if ((e.target as HTMLElement | null)?.closest?.("button")) sound.click();
    };
    document.addEventListener("click", handler, { capture: true });
    return () => document.removeEventListener("click", handler, { capture: true });
  }, []);

  if (!hasHydrated) {
    return <LoadingSkeleton />;
  }

  const inTauri = isTauri();

  return (
    <div className="min-h-dvh">
      {/* 오버레이 타이틀바: 창 드래그 영역 (신호등 버튼 높이만큼) */}
      {inTauri && <div data-tauri-drag-region className="fixed inset-x-0 top-0 z-50 h-7" />}
      <AppSidebar topInset={inTauri} />
      <MobileNavigation />

      <main className="pb-28 lg:pb-12 lg:pl-60">
        <div className="mx-auto w-full max-w-5xl space-y-8 px-4 py-6 sm:px-6 lg:py-10">
          <TodayHeader action={<QuickAdd />} />

          {/* 모바일에서만 보이는 다음 일정 요약 */}
          <div className="lg:hidden">
            <NextEventCard />
          </div>

          <div className="grid gap-8 lg:grid-cols-5">
            <div className="space-y-8 lg:col-span-3">
              <RoutineSection />
              <TodoSection />
            </div>
            <div className="lg:col-span-2">
              <ScheduleSection />
            </div>
          </div>

          <ReflectionSection />

          <p className="pb-2 text-center font-serif text-sm text-muted-foreground">
            오늘도 나의 속도로, 한 걸음씩. 🍃
          </p>
        </div>
      </main>
    </div>
  );
}
