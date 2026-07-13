"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type {
  AppSettings,
  CalendarEvent,
  Category,
  DailyReflection,
  Mood,
  Routine,
  Todo,
} from "./types";
import { createSeedData, SEED_CATEGORIES } from "./seed";
import { todayKey } from "./date";
import { appStorage } from "./storage";

type RoutineInput = Pick<Routine, "name" | "emoji" | "timeOfDay" | "days" | "note">;
type TodoInput = Pick<
  Todo,
  "title" | "priority" | "categoryId" | "dueDate" | "estimateMinutes" | "note"
>;
type EventInput = Pick<
  CalendarEvent,
  "title" | "date" | "startTime" | "endTime" | "allDay" | "categoryId" | "location" | "note"
>;

interface AppState {
  routines: Routine[];
  todos: Todo[];
  events: CalendarEvent[];
  reflections: DailyReflection[];
  categories: Category[];
  settings: AppSettings;
  /** persist 완료 여부 — hydration mismatch 방지용 (persist 대상 아님) */
  hasHydrated: boolean;
  /** 미니 캘린더에서 고른 날짜 ("yyyy-MM-dd", persist 대상 아님) */
  selectedDate: string;

  setHasHydrated: (v: boolean) => void;
  setSelectedDate: (key: string) => void;

  addRoutine: (input: RoutineInput) => void;
  updateRoutine: (id: string, patch: Partial<RoutineInput>) => void;
  deleteRoutine: (id: string) => void;
  toggleRoutine: (id: string, dateKey: string) => void;

  addTodo: (input: TodoInput) => void;
  updateTodo: (id: string, patch: Partial<TodoInput>) => void;
  deleteTodo: (id: string) => void;
  toggleTodo: (id: string) => void;
  moveTodo: (id: string, direction: -1 | 1) => void;

  addEvent: (input: EventInput) => CalendarEvent;
  updateEvent: (id: string, patch: Partial<EventInput>) => void;
  deleteEvent: (id: string) => void;
  /** 동기화: 로컬 일정에 외부 키를 붙이고 소유 프로바이더를 기록 */
  markEventSynced: (id: string, source: CalendarEvent["source"], externalId: string) => void;
  /** 동기화: (source, externalId)로 찾아 갱신, 없으면 새로 추가 */
  upsertExternalEvent: (
    source: CalendarEvent["source"],
    externalId: string,
    fields: Omit<EventInput, "categoryId"> & { categoryId?: string }
  ) => void;
  lastSyncAt?: string;
  setLastSyncAt: (iso: string) => void;
  setAppleSyncEnabled: (v: boolean) => void;

  saveReflection: (date: string, data: { mood: Mood; wellDone: string; remember: string }) => void;

  setUserName: (name: string) => void;
  resetData: () => void;
}

function newId(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
  return `id-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function stamp() {
  return new Date().toISOString();
}

const seed = createSeedData();

const initialData = {
  routines: seed.routines,
  todos: seed.todos,
  events: seed.events,
  reflections: [] as DailyReflection[],
  categories: seed.categories,
  settings: { userName: "", appleSyncEnabled: false } as AppSettings,
};

/** localStorage 값이 손상됐을 때를 대비해 배열/객체 형태를 검증하며 병합한다. */
function safeMerge(persisted: unknown, current: AppState): AppState {
  if (typeof persisted !== "object" || persisted === null) return current;
  const p = persisted as Record<string, unknown>;
  const arr = <T,>(v: unknown, fallback: T[]): T[] => (Array.isArray(v) ? (v as T[]) : fallback);
  return {
    ...current,
    routines: arr<Routine>(p.routines, current.routines),
    todos: arr<Todo>(p.todos, current.todos),
    events: arr<CalendarEvent>(p.events, current.events),
    reflections: arr<DailyReflection>(p.reflections, current.reflections),
    categories: arr<Category>(p.categories, SEED_CATEGORIES),
    settings:
      typeof p.settings === "object" && p.settings !== null
        ? {
            userName: String((p.settings as Record<string, unknown>).userName ?? ""),
            appleSyncEnabled:
              (p.settings as Record<string, unknown>).appleSyncEnabled === true,
          }
        : current.settings,
    lastSyncAt: typeof p.lastSyncAt === "string" ? p.lastSyncAt : undefined,
  };
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      ...initialData,
      hasHydrated: false,
      selectedDate: todayKey(),

      setHasHydrated: (v) => set({ hasHydrated: v }),
      setSelectedDate: (key) => set({ selectedDate: key }),

      addRoutine: (input) =>
        set((s) => ({
          routines: [
            ...s.routines,
            { ...input, id: newId(), createdAt: stamp(), updatedAt: stamp(), completedDates: [] },
          ],
        })),
      updateRoutine: (id, patch) =>
        set((s) => ({
          routines: s.routines.map((r) =>
            r.id === id ? { ...r, ...patch, updatedAt: stamp() } : r
          ),
        })),
      deleteRoutine: (id) =>
        set((s) => ({ routines: s.routines.filter((r) => r.id !== id) })),
      toggleRoutine: (id, dateKey) =>
        set((s) => ({
          routines: s.routines.map((r) => {
            if (r.id !== id) return r;
            const done = r.completedDates.includes(dateKey);
            return {
              ...r,
              completedDates: done
                ? r.completedDates.filter((d) => d !== dateKey)
                : [...r.completedDates, dateKey],
              updatedAt: stamp(),
            };
          }),
        })),

      addTodo: (input) =>
        set((s) => ({
          todos: [
            ...s.todos,
            {
              ...input,
              id: newId(),
              createdAt: stamp(),
              updatedAt: stamp(),
              done: false,
              order: Math.max(-1, ...s.todos.map((t) => t.order)) + 1,
            },
          ],
        })),
      updateTodo: (id, patch) =>
        set((s) => ({
          todos: s.todos.map((t) => (t.id === id ? { ...t, ...patch, updatedAt: stamp() } : t)),
        })),
      deleteTodo: (id) => set((s) => ({ todos: s.todos.filter((t) => t.id !== id) })),
      toggleTodo: (id) =>
        set((s) => ({
          todos: s.todos.map((t) =>
            t.id === id
              ? {
                  ...t,
                  done: !t.done,
                  completedAt: !t.done ? stamp() : undefined,
                  updatedAt: stamp(),
                }
              : t
          ),
        })),
      moveTodo: (id, direction) => {
        const { todos } = get();
        const target = todos.find((t) => t.id === id);
        if (!target) return;
        // 같은 완료 상태 그룹 안에서만 순서를 바꾼다
        const group = todos
          .filter((t) => t.done === target.done)
          .sort((a, b) => a.order - b.order);
        const idx = group.findIndex((t) => t.id === id);
        const neighbor = group[idx + direction];
        if (!neighbor) return;
        set((s) => ({
          todos: s.todos.map((t) => {
            if (t.id === target.id) return { ...t, order: neighbor.order, updatedAt: stamp() };
            if (t.id === neighbor.id) return { ...t, order: target.order, updatedAt: stamp() };
            return t;
          }),
        }));
      },

      addEvent: (input) => {
        const created: CalendarEvent = {
          ...input,
          id: newId(),
          createdAt: stamp(),
          updatedAt: stamp(),
          source: "local",
        };
        set((s) => ({ events: [...s.events, created] }));
        return created;
      },
      updateEvent: (id, patch) =>
        set((s) => ({
          events: s.events.map((e) => (e.id === id ? { ...e, ...patch, updatedAt: stamp() } : e)),
        })),
      deleteEvent: (id) => set((s) => ({ events: s.events.filter((e) => e.id !== id) })),
      markEventSynced: (id, source, externalId) =>
        set((s) => ({
          events: s.events.map((e) =>
            e.id === id ? { ...e, source, externalId, updatedAt: stamp() } : e
          ),
        })),
      upsertExternalEvent: (source, externalId, fields) =>
        set((s) => {
          const existing = s.events.find(
            (e) => e.source === source && e.externalId === externalId
          );
          if (existing) {
            return {
              events: s.events.map((e) =>
                e.id === existing.id ? { ...e, ...fields, updatedAt: stamp() } : e
              ),
            };
          }
          return {
            events: [
              ...s.events,
              {
                categoryId: "cat-personal",
                ...fields,
                id: newId(),
                createdAt: stamp(),
                updatedAt: stamp(),
                source,
                externalId,
              },
            ],
          };
        }),
      setLastSyncAt: (iso) => set({ lastSyncAt: iso }),
      setAppleSyncEnabled: (v) =>
        set((s) => ({ settings: { ...s.settings, appleSyncEnabled: v } })),

      saveReflection: (date, data) =>
        set((s) => {
          const existing = s.reflections.find((r) => r.date === date);
          if (existing) {
            return {
              reflections: s.reflections.map((r) =>
                r.date === date ? { ...r, ...data, updatedAt: stamp() } : r
              ),
            };
          }
          return {
            reflections: [
              ...s.reflections,
              { ...data, date, id: newId(), createdAt: stamp(), updatedAt: stamp() },
            ],
          };
        }),

      setUserName: (name) =>
        set((s) => ({ settings: { ...s.settings, userName: name } })),
      resetData: () => {
        const fresh = createSeedData();
        set({
          routines: fresh.routines,
          todos: fresh.todos,
          events: fresh.events,
          reflections: [],
          categories: fresh.categories,
          settings: { userName: "", appleSyncEnabled: false },
          lastSyncAt: undefined,
        });
      },
    }),
    {
      name: "daily-app-storage",
      version: 1,
      storage: createJSONStorage(() => appStorage),
      merge: safeMerge,
      partialize: (s) => ({
        routines: s.routines,
        todos: s.todos,
        events: s.events,
        reflections: s.reflections,
        categories: s.categories,
        settings: s.settings,
        lastSyncAt: s.lastSyncAt,
      }),
      // SSR과 첫 클라이언트 렌더를 동일하게 유지한 뒤 마운트 후 수동 hydrate
      skipHydration: true,
      onRehydrateStorage: () => () => {
        // 저장 데이터가 손상돼 hydrate가 실패해도 seed 상태로 앱을 띄운다
        useAppStore.setState({ hasHydrated: true });
      },
    }
  )
);

export function findCategory(categories: Category[], id: string): Category {
  return categories.find((c) => c.id === id) ?? { id, name: "기타", color: "#A8A29E" };
}
