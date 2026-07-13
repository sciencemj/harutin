"use client";

import { useMemo } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatTime } from "@/lib/date";

const NONE = "__none__";

/** 15분 간격 "HH:mm" 목록 */
const SLOTS: string[] = Array.from({ length: 24 * 4 }, (_, i) => {
  const h = String(Math.floor(i / 4)).padStart(2, "0");
  const m = String((i % 4) * 15).padStart(2, "0");
  return `${h}:${m}`;
});

interface TimeSelectProps {
  id?: string;
  value: string; // "" 또는 "HH:mm"
  onChange: (value: string) => void;
  /** true면 "선택 안 함" 항목 제공 */
  allowEmpty?: boolean;
  placeholder?: string;
  "aria-label"?: string;
}

/**
 * 네이티브 <input type="time"> 대체 시간 선택.
 * WKWebView(Tauri)의 부실한 타임 피커와 다이얼로그 포커스 트랩 충돌을 피한다.
 */
export function TimeSelect({
  id,
  value,
  onChange,
  allowEmpty = false,
  placeholder = "시간 선택",
  "aria-label": ariaLabel,
}: TimeSelectProps) {
  // 15분 그리드 밖의 값(예: Apple에서 온 10:05)도 목록에 끼워 표시한다
  const options = useMemo(() => {
    if (!value || SLOTS.includes(value)) return SLOTS;
    return [...SLOTS, value].sort();
  }, [value]);

  return (
    <Select
      value={value === "" ? NONE : value}
      onValueChange={(v) => onChange(v === NONE ? "" : (v as string))}
    >
      <SelectTrigger id={id} className="w-full" aria-label={ariaLabel}>
        <SelectValue>
          {(v: string | null) =>
            !v || v === NONE ? (
              <span className="text-muted-foreground">{placeholder}</span>
            ) : (
              formatTime(v)
            )
          }
        </SelectValue>
      </SelectTrigger>
      <SelectContent className="max-h-64">
        {allowEmpty && <SelectItem value={NONE}>선택 안 함</SelectItem>}
        {options.map((t) => (
          <SelectItem key={t} value={t}>
            {formatTime(t)}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
