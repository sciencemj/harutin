/**
 * 동기화 플랫폼 공통 타입.
 *
 * 설계: 하루틴 스토어가 일정·TODO의 허브(single source of truth)이고,
 * 외부 프로그램(Apple Calendar, Obsidian, ...)은 SyncProvider 어댑터로 붙는다.
 * 매칭 키는 CalendarEvent/Todo의 (source, externalId) 쌍.
 * 지금은 Tauri 앱 안에서 실행되지만, 엔진과 프로바이더는 UI와 분리돼 있어
 * 추후 트레이 상주 백그라운드 프로세스로 그대로 옮길 수 있다.
 */

export interface DateRange {
  startMs: number;
  endMs: number;
}

/** 프로바이더가 주고받는 일정의 공통 표현 */
export interface ExternalEvent {
  /** 프로바이더 안에서 이 일정(또는 반복 회차)을 유일하게 가리키는 키 */
  key: string;
  title: string;
  startMs: number;
  endMs: number;
  allDay: boolean;
  location?: string;
  notes?: string;
  lastModifiedMs?: number;
  /** 원본 캘린더/파일 이름 등 부가 정보 */
  container?: string;
  /** false면 앱→프로바이더 수정을 보내지 않는다 (예: 반복 일정 회차) */
  pushable: boolean;
}

export interface ExternalEventInput {
  title: string;
  startMs: number;
  endMs: number;
  allDay: boolean;
  location?: string;
  notes?: string;
}

export interface SyncProvider {
  /** CalendarEvent.source / Todo.source 에 기록되는 ID */
  id: string;
  name: string;
  capabilities: { events: boolean; todos: boolean };
  /** 이 환경에서 쓸 수 있는가 (예: Tauri 데스크톱에서만) */
  isAvailable(): boolean;
  /** 접근 권한 확보. 사용자 승인 팝업이 뜰 수 있다. */
  requestAccess(): Promise<boolean>;
  pullEvents(range: DateRange): Promise<ExternalEvent[]>;
  /** 생성 후 외부 키 반환 */
  createEvent(input: ExternalEventInput): Promise<string>;
  updateEvent(key: string, input: ExternalEventInput): Promise<void>;
  deleteEvent(key: string): Promise<void>;
  // 추후: pullTodos / createTodo / ... (capabilities.todos)
}

export interface SyncResult {
  provider: string;
  pulled: number;
  pushed: number;
  deletedLocal: number;
}
