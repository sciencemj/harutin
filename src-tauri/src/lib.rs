#[cfg(target_os = "macos")]
mod calendar;
mod storage;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  let builder = tauri::Builder::default().setup(|app| {
    if cfg!(debug_assertions) {
      app.handle().plugin(
        tauri_plugin_log::Builder::default()
          .level(log::LevelFilter::Info)
          .build(),
      )?;
    }
    Ok(())
  });

  #[cfg(target_os = "macos")]
  let builder = builder.invoke_handler(tauri::generate_handler![
    calendar::calendar_auth_status,
    calendar::calendar_request_access,
    calendar::calendar_fetch_events,
    calendar::calendar_create_event,
    calendar::calendar_update_event,
    calendar::calendar_delete_event,
    storage::storage_read,
    storage::storage_write,
    storage::storage_delete,
  ]);

  #[cfg(not(target_os = "macos"))]
  let builder = builder.invoke_handler(tauri::generate_handler![
    storage::storage_read,
    storage::storage_write,
    storage::storage_delete,
  ]);

  builder
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
