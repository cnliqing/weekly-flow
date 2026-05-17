import type { CycleStatus } from "@prisma/client";

const cycleStatusLabels: Record<CycleStatus, string> = {
  archived: "已归档",
  closed: "已关闭",
  draft: "草稿",
  open: "开放中",
};

export function formatCycleStatus(status: CycleStatus): string {
  return cycleStatusLabels[status] ?? status;
}
