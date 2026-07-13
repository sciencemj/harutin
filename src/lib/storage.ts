import { invoke, isTauri } from "@tauri-apps/api/core";
import type { StateStorage } from "zustand/middleware";

function inTauri(): boolean {
  return typeof window !== "undefined" && isTauri();
}

/**
 * Tauri에서는 Application Support의 data.json에 저장해 앱 재설치에도 유지한다.
 * 파일이 없고 WKWebView localStorage에 기존 데이터가 있으면 파일로 옮긴다(1회 마이그레이션).
 * 브라우저에서는 localStorage 그대로.
 */
export const appStorage: StateStorage = {
  async getItem(name) {
    if (!inTauri()) return localStorage.getItem(name);
    const file = await invoke<string | null>("storage_read");
    if (file) return file;
    const legacy = localStorage.getItem(name);
    if (legacy) {
      await invoke("storage_write", { data: legacy });
      return legacy;
    }
    return null;
  },
  async setItem(name, value) {
    if (!inTauri()) {
      localStorage.setItem(name, value);
      return;
    }
    await invoke("storage_write", { data: value });
  },
  async removeItem(name) {
    if (!inTauri()) {
      localStorage.removeItem(name);
      return;
    }
    await invoke("storage_delete");
  },
};
