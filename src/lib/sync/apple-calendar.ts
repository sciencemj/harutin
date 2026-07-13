import { invoke, isTauri } from "@tauri-apps/api/core";
import type {
  DateRange,
  ExternalEvent,
  ExternalEventInput,
  SyncProvider,
} from "./types";

interface AppleEventPayload {
  id: string;
  occurrenceKey: string;
  title: string;
  startMs: number;
  endMs: number;
  allDay: boolean;
  location: string | null;
  notes: string | null;
  lastModifiedMs: number | null;
  calendar: string | null;
  recurring: boolean;
}

/** 반복 일정 회차 키("id::startMs")에서 EventKit id만 추출 */
function eventKitId(key: string): string {
  return key.split("::")[0];
}

export const appleCalendarProvider: SyncProvider = {
  id: "apple",
  name: "Apple 캘린더",
  capabilities: { events: true, todos: false },

  isAvailable() {
    return isTauri();
  },

  async requestAccess() {
    return invoke<boolean>("calendar_request_access");
  },

  async pullEvents(range: DateRange): Promise<ExternalEvent[]> {
    const events = await invoke<AppleEventPayload[]>("calendar_fetch_events", {
      startMs: range.startMs,
      endMs: range.endMs,
    });
    return events.map((e) => ({
      key: e.occurrenceKey,
      title: e.title,
      startMs: e.startMs,
      endMs: e.endMs,
      allDay: e.allDay,
      location: e.location ?? undefined,
      notes: e.notes ?? undefined,
      lastModifiedMs: e.lastModifiedMs ?? undefined,
      container: e.calendar ?? undefined,
      // 반복 일정은 회차 단위 수정이 모호하므로 앱→Apple 반영은 막는다 (Apple이 원본)
      pushable: !e.recurring,
    }));
  },

  async createEvent(input: ExternalEventInput): Promise<string> {
    return invoke<string>("calendar_create_event", { input });
  },

  async updateEvent(key: string, input: ExternalEventInput): Promise<void> {
    await invoke("calendar_update_event", { id: eventKitId(key), input });
  },

  async deleteEvent(key: string): Promise<void> {
    await invoke("calendar_delete_event", { id: eventKitId(key) });
  },
};
