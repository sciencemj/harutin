"use client";

import { useAppStore } from "./store";

/**
 * Web Audio로 합성하는 작은 효과음 — 오디오 파일 없이 가볍게.
 * 설정의 soundEnabled가 꺼져 있으면 모두 무음.
 */

let ctx: AudioContext | null = null;

function audioCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  ctx ??= new AudioContext();
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
}

function enabled(): boolean {
  return useAppStore.getState().settings.soundEnabled;
}

interface ToneOpts {
  start?: number;
  dur?: number;
  type?: OscillatorType;
  gain?: number;
}

function tone(freq: number, { start = 0, dur = 0.12, type = "sine", gain = 0.12 }: ToneOpts = {}) {
  const c = audioCtx();
  if (!c) return;
  const t = c.currentTime + start;
  const osc = c.createOscillator();
  const g = c.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(gain, t + 0.012);
  g.gain.exponentialRampToValueAtTime(0.0008, t + dur);
  osc.connect(g).connect(c.destination);
  osc.start(t);
  osc.stop(t + dur + 0.05);
}

export const sound = {
  /** 버튼 클릭 — 아주 짧고 조용한 틱 */
  click() {
    if (!enabled()) return;
    tone(880, { dur: 0.045, type: "triangle", gain: 0.045 });
  },
  /** 루틴·할 일 완료 — 밝은 두 음 */
  check() {
    if (!enabled()) return;
    tone(659.25, { dur: 0.09, gain: 0.11 });
    tone(987.77, { start: 0.07, dur: 0.16, gain: 0.11 });
  },
  /** 완료 취소 — 낮은 한 음 */
  uncheck() {
    if (!enabled()) return;
    tone(440, { dur: 0.08, type: "triangle", gain: 0.07 });
  },
  /** 모든 루틴 완료 — 짧은 아르페지오 */
  celebrate() {
    if (!enabled()) return;
    [523.25, 659.25, 783.99, 1046.5].forEach((f, i) =>
      tone(f, { start: i * 0.09, dur: 0.2, gain: 0.09 })
    );
  },
  /** 집중 모드 — 물이 차오르는 소리 (노이즈 스웰) */
  waterRise() {
    if (!enabled()) return;
    waterWhoosh(true);
  },
  /** 집중 모드 — 물이 빠지는 소리 */
  waterFall() {
    if (!enabled()) return;
    waterWhoosh(false);
  },
};

let noiseCache: AudioBuffer | null = null;

function noiseBuffer(c: AudioContext): AudioBuffer {
  if (noiseCache) return noiseCache;
  const buf = c.createBuffer(1, c.sampleRate * 2, c.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  noiseCache = buf;
  return buf;
}

/** 로우패스 필터를 스윕한 화이트노이즈 — 파도가 밀려오고 빠지는 소리 */
function waterWhoosh(rise: boolean) {
  const c = audioCtx();
  if (!c) return;
  const t = c.currentTime;
  const dur = 1.8;
  const src = c.createBufferSource();
  src.buffer = noiseBuffer(c);
  src.loop = true;
  const filter = c.createBiquadFilter();
  filter.type = "lowpass";
  filter.Q.value = 0.8;
  filter.frequency.setValueAtTime(rise ? 350 : 950, t);
  filter.frequency.linearRampToValueAtTime(rise ? 950 : 250, t + dur);
  const g = c.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(0.11, t + 0.4);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  src.connect(filter);
  filter.connect(g);
  g.connect(c.destination);
  src.start(t);
  src.stop(t + dur + 0.1);
}
