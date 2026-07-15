"use client";

import { useEffect, useRef, useState } from "react";
import { Pause, Play, X } from "lucide-react";
import { isTauri } from "@tauri-apps/api/core";
import { useAppStore } from "@/lib/store";
import { sound } from "@/lib/sound";
import { todayKey } from "@/lib/date";
import { cn } from "@/lib/utils";

const FOCUS_MS = 25 * 60 * 1000;
const BREAK_MS = 5 * 60 * 1000;
/** 집중 시간은 30초 이상 쌓이면 스토어에 적립 (파일 쓰기 빈도 제한) */
const COMMIT_MS = 30 * 1000;

type Phase = "focus" | "break";

interface TimerState {
  phase: Phase;
  /** 현재 페이즈가 끝나는 시각 (epoch ms) */
  phaseEndsAt: number;
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
  { emoji: "🐬", top: "10%", dur: 24, delay: -9, size: "text-4xl", bob: 3.4 },
  { emoji: "🦈", top: "42%", dur: 58, delay: -40, size: "text-4xl", back: true, bob: 5.8 },
  { emoji: "🐙", top: "68%", dur: 48, delay: -22, size: "text-3xl", bob: 4.9 },
  { emoji: "🪼", top: "30%", dur: 64, delay: -15, size: "text-2xl", back: true, bob: 6.2 },
  { emoji: "🦐", top: "86%", dur: 36, delay: -28, size: "text-lg", back: true, bob: 2.8 },
  { emoji: "🐟", top: "52%", dur: 22, delay: -12, size: "text-lg", bob: 2.6 },
];

/** 수면에 떠다니는 것들 — 고무 오리와 돛단배 */
const FLOATERS: { emoji: string; dur: number; delay: number; size: string; back?: boolean; rock: number }[] = [
  { emoji: "⛵", dur: 75, delay: -30, size: "text-4xl", rock: 4.5 },
  { emoji: "🐥", dur: 50, delay: -12, size: "text-2xl", back: true, rock: 2.8 },
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

  // 벽시계 기반: 인터벌은 화면 갱신용일 뿐, 시간 계산은 timestamp로 한다
  // (백그라운드에서 WKWebView가 타이머를 스로틀해도 기록이 정확하다)
  const stateRef = useRef<TimerState>({
    phase: "focus",
    phaseEndsAt: Date.now() + FOCUS_MS,
    done: 0,
  });
  const lastTickRef = useRef(Date.now());
  const accumMsRef = useRef(0); // 아직 스토어에 안 쓴 집중 시간(ms)
  const pausedRemainingRef = useRef(0);
  const [, force] = useState(0);

  function commitAccum(minMs: number) {
    if (accumMsRef.current < minMs) return;
    const seconds = Math.floor(accumMsRef.current / 1000);
    if (seconds > 0) {
      addFocusSeconds(todayKey(), seconds);
      accumMsRef.current -= seconds * 1000;
    }
  }

  /** 지난 시간을 벽시계로 정산 — 페이즈 경계를 넘었으면 경계까지만 집중으로 적립 */
  function settle() {
    const s = stateRef.current;
    const now = Date.now();
    let cursor = lastTickRef.current;
    // 백그라운드로 오래 있었어도 페이즈 전환을 순서대로 처리한다
    for (let guard = 0; guard < 100; guard++) {
      const segmentEnd = Math.min(now, s.phaseEndsAt);
      if (s.phase === "focus" && segmentEnd > cursor) {
        accumMsRef.current += segmentEnd - cursor;
      }
      cursor = segmentEnd;
      if (now < s.phaseEndsAt) break;
      if (s.phase === "focus") {
        s.done++;
        s.phase = "break";
        s.phaseEndsAt += BREAK_MS;
        sound.celebrate();
      } else {
        s.phase = "focus";
        s.phaseEndsAt += FOCUS_MS;
        sound.check();
      }
    }
    lastTickRef.current = now;
    commitAccum(COMMIT_MS);
    force((n) => n + 1);
  }

  // 등장: 다음 프레임에 물을 채워 transition 발동 + 물소리
  useEffect(() => {
    const raf = requestAnimationFrame(() => {
      setFilled(true);
      sound.waterRise();
    });
    return () => cancelAnimationFrame(raf);
  }, []);

  // 1초 화면 갱신 + 포그라운드 복귀 시 즉시 정산
  useEffect(() => {
    if (!running || draining) return;
    lastTickRef.current = Date.now();
    const id = setInterval(settle, 1000);
    const onVisible = () => {
      if (document.visibilityState === "visible") settle();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      clearInterval(id);
      document.removeEventListener("visibilitychange", onVisible);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running, draining]);

  function handlePauseResume() {
    const s = stateRef.current;
    if (running) {
      settle();
      pausedRemainingRef.current = Math.max(s.phaseEndsAt - Date.now(), 0);
      setRunning(false);
    } else {
      s.phaseEndsAt = Date.now() + pausedRemainingRef.current;
      lastTickRef.current = Date.now();
      setRunning(true);
    }
  }

  function exit() {
    if (draining) return;
    if (running) settle();
    commitAccum(0);
    setDraining(true);
    setFilled(false);
    sound.waterFall();
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
  const secondsLeft = running
    ? Math.max(0, Math.ceil((t.phaseEndsAt - Date.now()) / 1000))
    : Math.max(0, Math.ceil(pausedRemainingRef.current / 1000));
  const todayFocusSec =
    (focusLog[todayKey()] ?? 0) + Math.floor(accumMsRef.current / 1000);
  const focusMinutes = Math.floor(todayFocusSec / 60);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="집중 모드"
      className="fixed inset-0 z-[60]"
    >
      {/* 집중 모드에서도 창 상단 드래그로 이동 가능하게 */}
      {isTauri() && (
        <div data-tauri-drag-region className="absolute inset-x-0 top-0 z-30 h-7" />
      )}
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

        {/* 물결 — 세 겹 파도가 서로 다른 속도로 엇갈리며 찰랑인다 */}
        <div
          className="absolute inset-x-0 top-0 h-10 overflow-visible"
          style={{ animation: "wave-bob 3.2s ease-in-out infinite" }}
          aria-hidden
        >
          <svg
            className="absolute -top-2 left-0 h-9 w-[200%]"
            style={{ animation: "wave-slide 6s linear infinite" }}
            viewBox="0 0 1200 36"
            preserveAspectRatio="none"
          >
            <path
              d="M0 18 Q75 0 150 18 T300 18 T450 18 T600 18 T750 18 T900 18 T1050 18 T1200 18 V0 H0 Z"
              fill="#FBF7EE"
              opacity="0.3"
            />
          </svg>
          <svg
            className="absolute -top-1 left-0 h-8 w-[200%]"
            style={{ animation: "wave-slide-back 10s linear infinite" }}
            viewBox="0 0 1200 32"
            preserveAspectRatio="none"
          >
            <path
              d="M0 16 Q100 2 200 16 T400 16 T600 16 T800 16 T1000 16 T1200 16 V0 H0 Z"
              fill="#FBF7EE"
              opacity="0.18"
            />
          </svg>
          <svg
            className="absolute top-0 left-0 h-7 w-[200%]"
            style={{ animation: "wave-slide 15s linear infinite" }}
            viewBox="0 0 1200 28"
            preserveAspectRatio="none"
          >
            <path
              d="M0 14 Q60 3 120 14 T240 14 T360 14 T480 14 T600 14 T720 14 T840 14 T960 14 T1080 14 T1200 14 V0 H0 Z"
              fill="#7c9070"
              opacity="0.2"
            />
          </svg>

          {/* 수면 위 — 돛단배와 고무 오리 */}
          {FLOATERS.map((f, i) => (
            <span
              key={i}
              className="absolute left-0"
              style={{
                top: "-26px",
                animation: `${f.back ? "swim-back" : "swim"} ${f.dur}s linear infinite`,
                animationDelay: `${f.delay}s`,
              }}
            >
              <span
                className={cn("inline-block", f.size)}
                style={{ animation: `surface-rock ${f.rock}s ease-in-out infinite` }}
              >
                {f.emoji}
              </span>
            </span>
          ))}
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
        <p className="font-serif text-7xl font-bold tabular-nums sm:text-8xl">{fmt(secondsLeft)}</p>
        <p className="text-sm opacity-80" aria-label={`완료한 포모도로 ${t.done}개`}>
          {t.done > 0 ? "🍅".repeat(Math.min(t.done, 8)) + ` ${t.done}회 완료 · ` : ""}
          오늘 집중 {focusMinutes}분
        </p>
        <div className="mt-4 flex items-center gap-3">
          <button
            type="button"
            onClick={handlePauseResume}
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
