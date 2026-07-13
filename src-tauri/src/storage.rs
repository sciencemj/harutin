//! 앱 데이터 파일 저장.
//! WKWebView localStorage는 앱 삭제 시 함께 지워지므로,
//! Application Support(app_data_dir)의 data.json에 저장해 재설치에도 유지한다.

use std::fs;
use std::path::PathBuf;
use tauri::Manager;

fn data_file(app: &tauri::AppHandle) -> Result<PathBuf, String> {
    let dir = app
        .path()
        .app_data_dir()
        .map_err(|e| format!("데이터 폴더를 찾을 수 없어요: {e}"))?;
    Ok(dir.join("data.json"))
}

#[tauri::command]
pub fn storage_read(app: tauri::AppHandle) -> Result<Option<String>, String> {
    let path = data_file(&app)?;
    if !path.exists() {
        return Ok(None);
    }
    fs::read_to_string(&path).map(Some).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn storage_write(app: tauri::AppHandle, data: String) -> Result<(), String> {
    let path = data_file(&app)?;
    if let Some(dir) = path.parent() {
        fs::create_dir_all(dir).map_err(|e| e.to_string())?;
    }
    // 쓰다 만 파일로 데이터가 깨지지 않게 임시 파일에 쓰고 교체한다
    let tmp = path.with_extension("json.tmp");
    fs::write(&tmp, data).map_err(|e| e.to_string())?;
    fs::rename(&tmp, &path).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn storage_delete(app: tauri::AppHandle) -> Result<(), String> {
    let path = data_file(&app)?;
    if path.exists() {
        fs::remove_file(&path).map_err(|e| e.to_string())?;
    }
    Ok(())
}
