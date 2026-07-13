"use client";

import { check } from "@tauri-apps/plugin-updater";
import { relaunch } from "@tauri-apps/plugin-process";
import { toast } from "sonner";

/**
 * GitHub Releases의 latest.json을 확인해 새 버전이 있으면
 * 토스트로 알리고, 누르면 내려받아 설치 후 재시작한다.
 */
export async function checkForUpdate(): Promise<void> {
  const update = await check();
  if (!update) return;

  toast(`새 버전 v${update.version}이 나왔어요`, {
    description: "지금 업데이트하면 잠깐 재시작돼요. 데이터는 그대로예요.",
    duration: Infinity,
    action: {
      label: "업데이트",
      onClick: () => {
        const run = async () => {
          await update.downloadAndInstall();
          await relaunch();
        };
        toast.promise(run(), {
          loading: "새 버전을 내려받는 중…",
          success: "설치 완료! 다시 시작할게요.",
          error: "업데이트에 실패했어요. 다음에 다시 시도할게요.",
        });
      },
    },
  });
}
