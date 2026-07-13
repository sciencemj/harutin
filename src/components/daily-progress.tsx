"use client";

import { cn } from "@/lib/utils";

/** 하루 진행률 — 새싹이 자라 100%에서 꽃이 피는 시그니처 진행 바 */
export function DailyProgress({ progress, className }: { progress: number; className?: string }) {
  const pct = Math.max(0, Math.min(100, progress));
  const bloomed = pct >= 100;

  return (
    <div className={cn("w-full", className)}>
      <div className="mb-1.5 flex items-center justify-between text-xs text-muted-foreground">
        <span>오늘의 진행</span>
        <span className="font-medium text-foreground">{pct}%</span>
      </div>
      <div
        role="progressbar"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="하루 전체 진행률"
        className="relative h-2.5 rounded-full bg-secondary"
      >
        <div
          className="h-full rounded-full bg-gradient-to-r from-sage to-primary transition-[width] duration-700 ease-out"
          style={{ width: `${pct}%` }}
        />
        <span
          className="absolute -top-3 -translate-x-1/2 text-base transition-[left] duration-700 ease-out"
          style={{ left: `${pct}%` }}
          aria-hidden
        >
          {bloomed ? "🌸" : "🌱"}
        </span>
      </div>
      {bloomed && (
        <p className="animate-gentle-rise mt-2 text-xs text-primary">
          오늘 하루를 완성했어요. 정말 수고 많았어요!
        </p>
      )}
    </div>
  );
}
