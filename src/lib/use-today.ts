"use client";

import { useEffect, useState } from "react";
import { todayKey } from "./date";

/** 오늘 날짜 키("yyyy-MM-dd"). 자정을 넘기면 자동으로 새 날짜로 리렌더된다. */
export function useToday(): string {
  const [today, setToday] = useState(() => todayKey());
  useEffect(() => {
    const t = setInterval(() => {
      const k = todayKey();
      setToday((prev) => (prev === k ? prev : k));
    }, 60_000);
    return () => clearInterval(t);
  }, []);
  return today;
}
