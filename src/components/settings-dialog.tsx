"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { getVersion } from "@tauri-apps/api/app";
import { isTauri } from "@tauri-apps/api/core";
import { format } from "date-fns";
import { RefreshCw } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { useAppStore } from "@/lib/store";
import type { ViewMode } from "@/lib/types";
import { cn } from "@/lib/utils";
import { appleCalendarProvider } from "@/lib/sync/apple-calendar";
import { runSync } from "@/lib/sync/engine";
import { checkForUpdate } from "@/lib/updater";

interface SettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SettingsDialog({ open, onOpenChange }: SettingsDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        {/* 닫힐 때 unmount되어 열 때마다 현재 설정으로 초기화된다 */}
        <SettingsBody onClose={() => onOpenChange(false)} />
      </DialogContent>
    </Dialog>
  );
}

function SettingsBody({ onClose }: { onClose: () => void }) {
  const userName = useAppStore((s) => s.settings.userName);
  const setUserName = useAppStore((s) => s.setUserName);
  const resetData = useAppStore((s) => s.resetData);
  const appleSyncEnabled = useAppStore((s) => s.settings.appleSyncEnabled);
  const setAppleSyncEnabled = useAppStore((s) => s.setAppleSyncEnabled);
  const soundEnabled = useAppStore((s) => s.settings.soundEnabled);
  const setSoundEnabled = useAppStore((s) => s.setSoundEnabled);
  const viewMode = useAppStore((s) => s.settings.viewMode);
  const setViewMode = useAppStore((s) => s.setViewMode);
  const lastSyncAt = useAppStore((s) => s.lastSyncAt);

  const [name, setName] = useState(userName);
  const [confirmReset, setConfirmReset] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [version, setVersion] = useState("");
  const [checkingUpdate, setCheckingUpdate] = useState(false);

  useEffect(() => {
    if (isTauri()) getVersion().then(setVersion).catch(() => {});
  }, []);

  function handleCheckUpdate() {
    setCheckingUpdate(true);
    checkForUpdate({ notifyUpToDate: true })
      .catch((e) => toast.error(`업데이트 확인에 실패했어요: ${e}`))
      .finally(() => setCheckingUpdate(false));
  }

  async function handleSyncToggle(on: boolean) {
    if (!on) {
      setAppleSyncEnabled(false);
      return;
    }
    const granted = await appleCalendarProvider.requestAccess().catch(() => false);
    if (!granted) {
      toast.error("캘린더 접근이 거부됐어요. 시스템 설정 > 개인정보 보호에서 허용해주세요.");
      return;
    }
    setAppleSyncEnabled(true);
    handleSyncNow();
  }

  function handleSyncNow() {
    setSyncing(true);
    runSync()
      .then((results) => {
        const r = results.find((x) => x.provider === "apple");
        if (r) {
          toast.success(
            `동기화 완료 — 가져옴 ${r.pulled} · 내보냄 ${r.pushed}` +
              (r.deletedLocal ? ` · 정리 ${r.deletedLocal}` : "")
          );
        }
      })
      .catch((e) => toast.error(`동기화에 실패했어요: ${e}`))
      .finally(() => setSyncing(false));
  }

  function handleSave() {
    setUserName(name.trim());
    toast.success("설정을 저장했어요");
    onClose();
  }

  return (
    <>
        <DialogHeader>
          <DialogTitle className="font-serif">설정</DialogTitle>
          <DialogDescription>인사말에 쓸 이름과 데이터를 관리해요.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="settings-name">이름 (선택)</Label>
            <Input
              id="settings-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="예: 민준"
              maxLength={20}
            />
          </div>
          <div className="rounded-xl border border-border bg-muted/50 p-3">
            <p className="text-sm font-medium">보기 방식</p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              탭으로 보면 루틴·할 일·캘린더·기록을 하나씩 여유롭게 볼 수 있어요.
            </p>
            <div
              className="mt-2 flex rounded-full border border-border bg-card p-0.5"
              role="group"
              aria-label="보기 방식 선택"
            >
              {(
                [
                  { value: "all", label: "한눈에 보기" },
                  { value: "tabs", label: "탭으로 보기" },
                ] as { value: ViewMode; label: string }[]
              ).map((o) => (
                <button
                  key={o.value}
                  type="button"
                  aria-pressed={viewMode === o.value}
                  onClick={() => setViewMode(o.value)}
                  className={cn(
                    "flex-1 rounded-full px-3 py-1 text-xs transition-colors",
                    "focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
                    viewMode === o.value
                      ? "bg-primary font-medium text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {o.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between gap-2 rounded-xl border border-border bg-muted/50 p-3">
            <div>
              <p className="text-sm font-medium">효과음</p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                클릭·완료할 때 작은 소리를 내요.
              </p>
            </div>
            <Switch
              checked={soundEnabled}
              onCheckedChange={setSoundEnabled}
              aria-label="효과음 켜기"
            />
          </div>

          {isTauri() && (
            <div className="space-y-2.5 rounded-xl border border-border bg-muted/50 p-3">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <p className="text-sm font-medium">Apple 캘린더 동기화</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    일정을 양방향으로 맞춰요. 앱에서 만든 일정은 기본 캘린더로 가요.
                  </p>
                </div>
                <Switch
                  checked={appleSyncEnabled}
                  onCheckedChange={handleSyncToggle}
                  aria-label="Apple 캘린더 동기화 켜기"
                />
              </div>
              {appleSyncEnabled && (
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs text-muted-foreground">
                    {lastSyncAt
                      ? `마지막 동기화 ${format(new Date(lastSyncAt), "M/d HH:mm")}`
                      : "아직 동기화 전"}
                  </span>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={handleSyncNow}
                    disabled={syncing}
                  >
                    <RefreshCw
                      data-icon="inline-start"
                      className={syncing ? "animate-spin" : undefined}
                    />
                    {syncing ? "동기화 중" : "지금 동기화"}
                  </Button>
                </div>
              )}
            </div>
          )}

          {isTauri() && (
            <div className="flex items-center justify-between gap-2 rounded-xl border border-border bg-muted/50 p-3">
              <div>
                <p className="text-sm font-medium">앱 업데이트</p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {version ? `현재 버전 v${version}` : "버전 확인 중…"}
                </p>
              </div>
              <Button
                variant="secondary"
                size="sm"
                onClick={handleCheckUpdate}
                disabled={checkingUpdate}
              >
                <RefreshCw
                  data-icon="inline-start"
                  className={checkingUpdate ? "animate-spin" : undefined}
                />
                {checkingUpdate ? "확인 중" : "업데이트 확인"}
              </Button>
            </div>
          )}

          <div className="rounded-xl border border-border bg-muted/50 p-3">
            <p className="text-sm font-medium">데이터 초기화</p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              모든 기록을 지우고 예시 데이터로 되돌려요.
            </p>
            <Button
              variant="destructive"
              size="sm"
              className="mt-2"
              onClick={() => setConfirmReset(true)}
            >
              초기화하기
            </Button>
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>
            취소
          </Button>
          <Button onClick={handleSave}>저장</Button>
        </DialogFooter>

      <ConfirmDialog
        open={confirmReset}
        onOpenChange={setConfirmReset}
        title="모든 데이터를 초기화할까요?"
        description="루틴, 할 일, 일정, 기록이 모두 지워지고 처음 상태로 돌아가요."
        confirmLabel="초기화할게요"
        onConfirm={() => {
          resetData();
          setConfirmReset(false);
          onClose();
          toast.success("처음 상태로 되돌렸어요");
        }}
      />
    </>
  );
}
