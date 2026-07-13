import { addDays, format } from "date-fns";
import { useAppStore } from "@/lib/store";
import { parseDateKey } from "@/lib/date";
import type { CalendarEvent } from "@/lib/types";
import { appleCalendarProvider } from "./apple-calendar";
import type {
  DateRange,
  ExternalEvent,
  ExternalEventInput,
  SyncProvider,
  SyncResult,
} from "./types";

/** 등록된 프로바이더 목록. 새 프로그램 연동은 여기에 어댑터를 추가한다. */
export const providers: SyncProvider[] = [appleCalendarProvider];

/** 동기화 범위: 과거 30일 ~ 미래 365일 */
function syncRange(now: Date): DateRange {
  return {
    startMs: addDays(now, -30).getTime(),
    endMs: addDays(now, 365).getTime(),
  };
}

function providerEnabled(provider: SyncProvider): boolean {
  const { settings } = useAppStore.getState();
  if (provider.id === "apple") return settings.appleSyncEnabled;
  return false;
}

/** CalendarEvent의 시작/종료를 epoch ms로 (종일이면 00:00~23:59) */
function eventTimes(ev: CalendarEvent): { startMs: number; endMs: number } | null {
  const day = parseDateKey(ev.date);
  if (!day) return null;
  if (ev.allDay || !ev.startTime) {
    const start = new Date(day);
    start.setHours(0, 0, 0, 0);
    const end = new Date(day);
    end.setHours(23, 59, 0, 0);
    return { startMs: start.getTime(), endMs: end.getTime() };
  }
  const [sh, sm] = ev.startTime.split(":").map(Number);
  const start = new Date(day);
  start.setHours(sh || 0, sm || 0, 0, 0);
  let end = new Date(start.getTime() + 60 * 60 * 1000);
  if (ev.endTime) {
    const [eh, em] = ev.endTime.split(":").map(Number);
    end = new Date(day);
    end.setHours(eh || 0, em || 0, 0, 0);
    if (end <= start) end = new Date(start.getTime() + 60 * 60 * 1000);
  }
  return { startMs: start.getTime(), endMs: end.getTime() };
}

function toExternalInput(ev: CalendarEvent): ExternalEventInput | null {
  const times = eventTimes(ev);
  if (!times) return null;
  return {
    title: ev.title,
    startMs: times.startMs,
    endMs: times.endMs,
    allDay: ev.allDay,
    location: ev.location,
    notes: ev.note,
  };
}

type EventFields = {
  title: string;
  date: string;
  startTime?: string;
  endTime?: string;
  allDay: boolean;
  location?: string;
  note?: string;
};

function toLocalFields(ext: ExternalEvent): EventFields {
  const start = new Date(ext.startMs);
  const end = new Date(ext.endMs);
  return {
    title: ext.title,
    date: format(start, "yyyy-MM-dd"),
    startTime: ext.allDay ? undefined : format(start, "HH:mm"),
    endTime: ext.allDay ? undefined : format(end, "HH:mm"),
    allDay: ext.allDay,
    location: ext.location,
    note: ext.notes,
  };
}

function fieldsDiffer(ev: CalendarEvent, f: EventFields): boolean {
  return (
    ev.title !== f.title ||
    ev.date !== f.date ||
    (ev.startTime ?? undefined) !== f.startTime ||
    (ev.endTime ?? undefined) !== f.endTime ||
    ev.allDay !== f.allDay ||
    (ev.location ?? undefined) !== (f.location ?? undefined) ||
    (ev.note ?? undefined) !== (f.note ?? undefined)
  );
}

function inRange(ev: CalendarEvent, range: DateRange): boolean {
  const times = eventTimes(ev);
  return times !== null && times.startMs >= range.startMs && times.startMs <= range.endMs;
}

async function syncProvider(provider: SyncProvider, now: Date): Promise<SyncResult> {
  const range = syncRange(now);
  const external = await provider.pullEvents(range);
  const byKey = new Map(external.map((e) => [e.key, e]));
  const store = useAppStore.getState();

  let pulled = 0;
  let pushed = 0;
  let deletedLocal = 0;
  const seen = new Set<string>();

  // 1) 프로바이더 소유 일정: 갱신(프로바이더 우선) 또는 로컬 삭제(원본에서 지워짐)
  for (const ev of store.events) {
    if (ev.source !== provider.id || !ev.externalId) continue;
    const ext = byKey.get(ev.externalId);
    if (ext) {
      seen.add(ext.key);
      const fields = toLocalFields(ext);
      if (fieldsDiffer(ev, fields)) {
        store.updateEvent(ev.id, fields);
        pulled++;
      }
    } else if (inRange(ev, range)) {
      store.deleteEvent(ev.id);
      deletedLocal++;
    }
  }

  // 2) 프로바이더에만 있는 일정 → 가져오기
  for (const ext of external) {
    if (seen.has(ext.key)) continue;
    store.upsertExternalEvent(provider.id, ext.key, toLocalFields(ext));
    pulled++;
  }

  // 3) 로컬에서 만든 일정 → 프로바이더로 내보내기
  for (const ev of useAppStore.getState().events) {
    if (ev.source !== "local" || !inRange(ev, range)) continue;
    const input = toExternalInput(ev);
    if (!input) continue;
    const key = await provider.createEvent(input);
    useAppStore.getState().markEventSynced(ev.id, provider.id, key);
    pushed++;
  }

  return { provider: provider.id, pulled, pushed, deletedLocal };
}

let syncing = false;

/** 사용 가능한·켜져 있는 모든 프로바이더와 동기화 */
export async function runSync(): Promise<SyncResult[]> {
  if (syncing) return [];
  syncing = true;
  try {
    const now = new Date();
    const results: SyncResult[] = [];
    for (const provider of providers) {
      if (!provider.isAvailable() || !providerEnabled(provider)) continue;
      results.push(await syncProvider(provider, now));
    }
    if (results.length > 0) {
      useAppStore.getState().setLastSyncAt(new Date().toISOString());
    }
    return results;
  } finally {
    syncing = false;
  }
}

/** 앱에서 일정 생성 직후 — 켜진 프로바이더에 즉시 반영 */
export async function pushEventCreate(ev: CalendarEvent): Promise<void> {
  for (const provider of providers) {
    if (!provider.isAvailable() || !providerEnabled(provider)) continue;
    const input = toExternalInput(ev);
    if (!input) return;
    const key = await provider.createEvent(input);
    useAppStore.getState().markEventSynced(ev.id, provider.id, key);
    return; // 첫 프로바이더가 소유자가 된다
  }
}

/** 앱에서 일정 수정 직후 — 소유 프로바이더에 반영. 반환값: 반영 여부 */
export async function pushEventUpdate(ev: CalendarEvent): Promise<boolean> {
  const provider = providers.find((p) => p.id === ev.source);
  if (!provider || !provider.isAvailable() || !providerEnabled(provider) || !ev.externalId) {
    return false;
  }
  // 반복 일정 회차는 push 불가 — 다음 pull에서 원본이 이긴다
  if (ev.externalId.includes("::")) return false;
  const input = toExternalInput(ev);
  if (!input) return false;
  await provider.updateEvent(ev.externalId, input);
  return true;
}

/** 앱에서 일정 삭제 직후 — 소유 프로바이더에서도 삭제 */
export async function pushEventDelete(ev: CalendarEvent): Promise<void> {
  const provider = providers.find((p) => p.id === ev.source);
  if (!provider || !provider.isAvailable() || !providerEnabled(provider) || !ev.externalId) {
    return;
  }
  // 반복 일정 회차 삭제를 원본 전체 삭제로 번지게 하지 않는다 — 다음 pull에서 되살아난다
  if (ev.externalId.includes("::")) return;
  await provider.deleteEvent(ev.externalId);
}
