"use client";

import { useEffect, useState } from "react";

/** 30초마다 갱신되는 현재 시각 — 진행 중 일정·카운트다운용 */
export function useNow(intervalMs = 30_000): Date {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), intervalMs);
    return () => clearInterval(t);
  }, [intervalMs]);
  return now;
}
