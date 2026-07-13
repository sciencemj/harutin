//! Apple Calendar(EventKit) 연동 커맨드.
//! 동기화 플랫폼의 첫 번째 프로바이더 — 프론트의 apple-calendar SyncProvider가 호출한다.

#![cfg(target_os = "macos")]

use std::sync::mpsc;
use std::time::Duration;

use block2::RcBlock;
use objc2::runtime::Bool;
use objc2_event_kit::{EKAuthorizationStatus, EKEntityType, EKEvent, EKEventStore, EKSpan};
use objc2_foundation::{NSDate, NSError, NSString};
use serde::{Deserialize, Serialize};

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct AppleEvent {
    /// EventKit eventIdentifier. 반복 일정 occurrence는 "id::startMs" 형태의 키를 함께 준다.
    pub id: String,
    pub occurrence_key: String,
    pub title: String,
    pub start_ms: i64,
    pub end_ms: i64,
    pub all_day: bool,
    pub location: Option<String>,
    pub notes: Option<String>,
    pub last_modified_ms: Option<i64>,
    pub calendar: Option<String>,
    pub recurring: bool,
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct EventInput {
    pub title: String,
    pub start_ms: i64,
    pub end_ms: i64,
    pub all_day: bool,
    pub location: Option<String>,
    pub notes: Option<String>,
}

fn store() -> objc2::rc::Retained<EKEventStore> {
    unsafe { EKEventStore::new() }
}

fn status_label(status: EKAuthorizationStatus) -> &'static str {
    // 3 = FullAccess(구 Authorized), 4 = WriteOnly (macOS 14+)
    match status.0 {
        0 => "notDetermined",
        1 => "restricted",
        2 => "denied",
        3 => "fullAccess",
        4 => "writeOnly",
        _ => "unknown",
    }
}

#[tauri::command]
pub fn calendar_auth_status() -> String {
    let status = unsafe { EKEventStore::authorizationStatusForEntityType(EKEntityType::Event) };
    status_label(status).to_string()
}

/// 캘린더 전체 접근 권한 요청. 시스템 팝업이 뜨고 사용자의 선택을 기다린다.
#[tauri::command]
pub fn calendar_request_access() -> Result<bool, String> {
    let current = unsafe { EKEventStore::authorizationStatusForEntityType(EKEntityType::Event) };
    if current.0 == 3 {
        return Ok(true);
    }

    let (tx, rx) = mpsc::channel::<bool>();
    let block = RcBlock::new(move |granted: Bool, _err: *mut NSError| {
        let _ = tx.send(granted.as_bool());
    });
    let block_ptr = (&*block as *const block2::Block<dyn Fn(Bool, *mut NSError)>).cast_mut();
    unsafe { store().requestFullAccessToEventsWithCompletion(block_ptr) };

    rx.recv_timeout(Duration::from_secs(180))
        .map_err(|_| "권한 요청 응답을 기다리다 시간이 초과됐어요".to_string())
}

fn ns_date(ms: i64) -> objc2::rc::Retained<NSDate> {
    NSDate::dateWithTimeIntervalSince1970(ms as f64 / 1000.0)
}

fn ms_of(date: &NSDate) -> i64 {
    (date.timeIntervalSince1970() * 1000.0).round() as i64
}

fn ensure_access() -> Result<(), String> {
    let status = unsafe { EKEventStore::authorizationStatusForEntityType(EKEntityType::Event) };
    if status.0 == 3 {
        Ok(())
    } else {
        Err(format!(
            "캘린더 접근 권한이 없어요 (상태: {}). 시스템 설정 > 개인정보 보호에서 허용해주세요.",
            status_label(status)
        ))
    }
}

#[tauri::command]
pub fn calendar_fetch_events(start_ms: i64, end_ms: i64) -> Result<Vec<AppleEvent>, String> {
    ensure_access()?;
    let store = store();
    let events = unsafe {
        let predicate = store.predicateForEventsWithStartDate_endDate_calendars(
            &ns_date(start_ms),
            &ns_date(end_ms),
            None,
        );
        store.eventsMatchingPredicate(&predicate)
    };

    let mut out = Vec::new();
    for ev in events.iter() {
        let start = unsafe { ev.startDate() };
        let end = unsafe { ev.endDate() };
        let id = match unsafe { ev.eventIdentifier() } {
            Some(id) => id.to_string(),
            None => continue,
        };
        let start_ms = ms_of(&start);
        let recurring = unsafe { ev.hasRecurrenceRules() };
        let occurrence_key = if recurring {
            format!("{id}::{start_ms}")
        } else {
            id.clone()
        };
        out.push(AppleEvent {
            id,
            occurrence_key,
            title: unsafe { ev.title() }.to_string(),
            start_ms,
            end_ms: ms_of(&end),
            all_day: unsafe { ev.isAllDay() },
            location: unsafe { ev.location() }.map(|s| s.to_string()),
            notes: unsafe { ev.notes() }.map(|s| s.to_string()),
            last_modified_ms: unsafe { ev.lastModifiedDate() }.map(|d| ms_of(&d)),
            calendar: unsafe { ev.calendar() }.map(|c| unsafe { c.title() }.to_string()),
            recurring,
        });
    }
    Ok(out)
}

fn apply_input(ev: &EKEvent, input: &EventInput) {
    unsafe {
        ev.setTitle(Some(&NSString::from_str(&input.title)));
        ev.setStartDate(Some(&ns_date(input.start_ms)));
        ev.setEndDate(Some(&ns_date(input.end_ms)));
        ev.setAllDay(input.all_day);
        ev.setLocation(input.location.as_deref().map(NSString::from_str).as_deref());
        ev.setNotes(input.notes.as_deref().map(NSString::from_str).as_deref());
    }
}

/// 기본 캘린더에 새 일정 생성. 생성된 eventIdentifier 반환.
#[tauri::command]
pub fn calendar_create_event(input: EventInput) -> Result<String, String> {
    ensure_access()?;
    let store = store();
    unsafe {
        let ev = EKEvent::eventWithEventStore(&store);
        apply_input(&ev, &input);
        let calendar = store
            .defaultCalendarForNewEvents()
            .ok_or("기본 캘린더를 찾을 수 없어요")?;
        ev.setCalendar(Some(&calendar));
        store
            .saveEvent_span_error(&ev, EKSpan::ThisEvent)
            .map_err(|e| e.localizedDescription().to_string())?;
        ev.eventIdentifier()
            .map(|s| s.to_string())
            .ok_or("생성한 일정의 ID를 읽지 못했어요".into())
    }
}

#[tauri::command]
pub fn calendar_update_event(id: String, input: EventInput) -> Result<(), String> {
    ensure_access()?;
    let store = store();
    unsafe {
        let ev = store
            .eventWithIdentifier(&NSString::from_str(&id))
            .ok_or("Apple 캘린더에서 일정을 찾을 수 없어요")?;
        apply_input(&ev, &input);
        store
            .saveEvent_span_error(&ev, EKSpan::ThisEvent)
            .map_err(|e| e.localizedDescription().to_string())
    }
}

#[tauri::command]
pub fn calendar_delete_event(id: String) -> Result<(), String> {
    ensure_access()?;
    let store = store();
    unsafe {
        let Some(ev) = store.eventWithIdentifier(&NSString::from_str(&id)) else {
            // 이미 Apple 쪽에서 지워진 경우 — 성공으로 취급
            return Ok(());
        };
        store
            .removeEvent_span_error(&ev, EKSpan::ThisEvent)
            .map_err(|e| e.localizedDescription().to_string())
    }
}
