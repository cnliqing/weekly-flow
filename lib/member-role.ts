import type { MemberRole } from "@prisma/client";

export const memberRoleOptions: Array<{ value: MemberRole; label: string }> = [
  { value: "manager", label: "项目经理" },
  { value: "developer", label: "开发" },
];

export function formatMemberRole(role: MemberRole): string {
  return role === "manager" ? "项目经理" : "开发";
}

export function normalizeMemberRole(value: unknown): MemberRole {
  return value === "manager" || value === "developer" ? value : "developer";
}

export function isFillableMemberRole(role: MemberRole): boolean {
  return role === "developer";
}
