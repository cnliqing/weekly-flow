import type { CycleStatus } from "@prisma/client";
import { formatCycleStatus } from "./cycle-status";

export function formatHistoryCycleStatus(status: CycleStatus): string {
  return formatCycleStatus(status);
}
