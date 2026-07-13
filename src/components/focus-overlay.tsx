"use client";

import { useEffect, useRef, useState } from "react";
import { Pause, Play, X } from "lucide-react";
import { useAppStore } from "@/lib/store";
import { sound } from "@/lib/sound";
import { todayKey } from "@/lib/date";
import { cn } from "@/lib/utils";

const FOCUS_SECONDS = 25 * 60;
const BREAK_SECONDS = 5 * 60;
/** 집중 시간은 30초 단위로 스토어에 적립 (파일 쓰기 빈도 제한) */
const COMMIT_EVERY = 30;

type Phase = "focus" | "break";

interface TimerState {
  phase: Phase;
  left: number;
  done: number; // 완료한 포모도로 수
}

const SEA_CREATURES: {
  emoji: string;
  top: string;
  dur: number;
  delay: number;
  size: string;
  back?: boolean;
  bob: number;
}[] = [
  { emoji: "🐟", top: "22%", dur: 26, delay: -4, size: "text-2xl", bob: 3.2 },
  { emoji: "🐠", top: "35%", dur: 34, delay: -20, size: "text-3xl", back: true, bob: 4.1 },
  { emoji: "🐡", top: "48%", dur: 40, delay: -11, size: "text-2xl", bob: 3.7 },
  { emoji: "🐢", top: "60%", dur: 52, delay: -30, size: "text-3xl", back: true, bob: 5.3 },
  { emoji: "🦑", top: "72%", dur: 45, delay: -7, size: "text-2xl", bob: 4.6 },
  { emoji: "🐋", top: "55%", dur: 70, delay: -25, size: "text-6xl", bob: 6.5 },
  { emoji: "🐟", top: "80%", dur: 30, delay: -16, size: "text-xl", back: true, bob: 3 },
  { emoji: "🐠", top: "15%", dur: 38, delay: -33, size: "text-2xl", bob: 4.4 },
];

const BUBBLES = [
  { left: "12%", dur: 9, delay: 0 },
  { left: "28%", dur: 12, delay: 3 },
  { left: "45%", dur: 8, delay: 6 },
  { left: "63%", dur: 11, delay: 1.5 },
  { left: "78%", dur: 10, delay: 4.5 },
  { left: "90%", dur: 13, delay: 7.5 },
];

function fmt(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

/** 집중 모드 — 물이 차오르는 바닷속에서 돌아가는 포모도로 타이머 */
export function FocusOverlay({ onClose }: { onClose: () => void }) {
  const addFocusSeconds = useAppStore((s) => s.addFocusSeconds);
  const focusLog = useAppStore((s) => s.focusLog);

  const [filled, setFilled] = useState(false);
  const [draining, setDraining] = useState(false);
  const [running, setRunning] = useState(true);

  const stateRef = useRef<TimerState>({ phase: "focus", left: FOCUS_SECONDS, done: 0 });
  const accumRef = useRef(0); // 아직 스토어에 안 쓴 집중 초
  const [, force] = useState(0);

  // 등장: 다음 프레임에 물을 채워 transition 발동
  useEffect(() => {
    const raf = requestAnimationFrame(() => setFilled(true));
    return () => cancelAnimationFrame(raf);
  }, []);

  // 1초 틱 — 타이머 진행, 집중 시간 적립, 세션 전환
  useEffect(() => {
    if (!running || draining) return;
    const id = setInterval(() => {
      const s = stateRef.current;
      if (s.phase === "focus") {
        accumRef.current++;
        if (accumRef.current >= COMMIT_EVERY) {
          addFocusSeconds(todayKey(), accumRef.current);
          accumRef.current = 0;
        }
      }
      s.left--;
      if (s.left <= 0) {
        if (s.phase === "focus") {
          s.done++;
          s.phase = "break";
          s.left = BREAK_SECONDS;
          sound.celebrate();
        } else {
          s.phase = "focus";
          s.left = FOCUS_SECONDS;
          sound.check();
        }
      }
      force((n) => n + 1);
    }, 1000);
    return () => clearInterval(id);
  }, [running, draining, addFocusSeconds]);

  function exit() {
    if (draining) return;
    if (accumRef.current > 0) {
      addFocusSeconds(todayKey(), accumRef.current);
      accumRef.current = 0;
    }
    setDraining(true);
    setFilled(false);
    setTimeout(onClose, 1700);
  }

  // Esc로 종료
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.key === "Escape") exit();
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draining]);

  const t = stateRef.current;
  const todayFocus = (focusLog[todayKey()] ?? 0) + accumRef.current;
  const focusMinutes = Math.floor(todayFocus / 60);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="집중 모드"
      className="fixed inset-0 z-[60]"
    >
      {/* 어두워진 방 */}
      <div
        className={cn(
          "absolute inset-0 bg-[#1d2422] transition-opacity duration-700",
          filled ? "opacity-100" : "opacity-0"
        )}
      />

      {/* 차오르는 물 */}
      <div
        className="absolute inset-x-0 bottom-0 overflow-hidden transition-[height] duration-[1600ms] ease-in-out"
        style={{ height: filled ? "100%" : "0%" }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-[#3d6a74] via-[#2d5460] to-[#1d3b47]" />

        {/* 물결 — 물 표면 */}
        <div className="absolute inset-x-0 top-0 h-6 overflow-hidden" aria-hidden>
          <svg
            className="absolute top-0 left-0 h-6 w-[200%]"
            style={{ animation: "wave-slide 9s linear infinite" }}
            viewBox="0 0 1200 24"
            preserveAspectRatio="none"
          >
            <path
              d="M0 12 Q75 0 150 12 T300 12 T450 12 T600 12 T750 12 T900 12 T1050 12 T1200 12 V0 H0 Z"
              fill="#FBF7EE"
              opacity="0.25"
            />
          </svg>
        </div>

        {/* 물고기들 */}
        <div aria-hidden>
          {SEA_CREATURES.map((f, i) => (
            <span
              key={i}
              className="absolute left-0 will-change-transform"
              style={{
                top: f.top,
                animation: `${f.back ? "swim-back" : "swim"} ${f.dur}s linear infinite`,
                animationDelay: `${f.delay}s`,
              }}
            >
              <span
                className={cn("inline-block", f.size)}
                style={{
                  animation: `fish-bob ${f.bob}s ease-in-out infinite`,
                  transform: f.back ? undefined : "scaleX(-1)",
                }}
              >
                {f.emoji}
              </span>
            </span>
          ))}
        </div>

        {/* 거품 */}
        <div aria-hidden>
          {BUBBLES.map((b, i) => (
            <span
              key={i}
              className="absolute bottom-0 size-2.5 rounded-full bg-white/25"
              style={{
                left: b.left,
                animation: `bubble-rise ${b.dur}s ease-in infinite`,
                animationDelay: `${b.delay}s`,
              }}
            />
          ))}
        </div>
      </div>

      {/* 타이머 */}
      <div className="relative z-10 flex h-full flex-col items-center justify-center gap-4 text-[#FBF7EE]">
        <p className="text-sm tracking-widest opacity-80">
          {t.phase === "focus" ? "집중하는 중" : "잠깐 쉬어가요"}
        </p>
        <p className="font-serif text-7xl font-bold tabular-nums sm:text-8xl">{fmt(t.left)}</p>
        <p className="text-sm opacity-80" aria-label={`완료한 포모도로 ${t.done}개`}>
          {t.done > 0 ? "🍅".repeat(Math.min(t.done, 8)) + ` ${t.done}회 완료 · ` : ""}
          오늘 집중 {focusMinutes}분
        </p>
        <div className="mt-4 flex items-center gap-3">
          <button
            type="button"
            onClick={() => setRunning((r) => !r)}
            className="flex items-center gap-1.5 rounded-full border border-white/30 px-5 py-2 text-sm transition-colors hover:bg-white/10 focus-visible:ring-2 focus-visible:ring-white/50 focus-visible:outline-none"
          >
            {running ? (
              <>
                <Pause className="size-4" aria-hidden /> 일시정지
              </>
            ) : (
              <>
                <Play className="size-4" aria-hidden /> 계속하기
              </>
            )}
          </button>
          <button
            type="button"
            onClick={exit}
            className="flex items-center gap-1.5 rounded-full border border-white/30 px-5 py-2 text-sm transition-colors hover:bg-white/10 focus-visible:ring-2 focus-visible:ring-white/50 focus-visible:outline-none"
          >
            <X className="size-4" aria-hidden /> 끝내기
          </button>
        </div>
      </div>
    </div>
  );
}
