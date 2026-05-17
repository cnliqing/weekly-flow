# Multi-Project Support Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Upgrade WeeklyFlow from a single-project weekly report app into a multi-project app with project-scoped routes, project creation, project roles, and strict data isolation.

**Architecture:** Project context moves into the URL under `/projects/[projectId]`. The Prisma schema keeps the existing project relations, changes `MemberRole` to `manager/developer`, and all project-scoped pages and APIs validate project ownership before reading or mutating records. The public member flow remains `/w`, but lists open cycles grouped by project.

**Tech Stack:** Next.js App Router, React 19, TypeScript, Prisma, PostgreSQL, Tailwind CSS, Vitest, Playwright.

---

## File Structure

- Modify: `prisma/schema.prisma` for `MemberRole` values and default role.
- Create: `prisma/migrations/<timestamp>_member_roles_manager_developer/migration.sql` to migrate real PostgreSQL enum values while preserving data.
- Modify: `prisma/seed.ts` to seed `manager/developer`.
- Create: `lib/member-role.ts` for role labels, validation, and form parsing.
- Modify: `lib/cycles.ts` to remove default-project behavior from creation paths.
- Modify: `lib/system-maintenance.ts` so cleanup can target one project.
- Modify: `app/page.tsx` into the project portal.
- Create: `app/projects/new/page.tsx` for project creation with initial team setup.
- Create: `app/projects/[projectId]/layout.tsx` for project-scoped navigation.
- Create: `components/layout/project-nav.tsx` for project navigation links.
- Create: `app/projects/[projectId]/page.tsx` for project dashboard.
- Create: `app/projects/[projectId]/members/page.tsx` for project member management.
- Create: `app/projects/[projectId]/cycles/page.tsx` for project cycle management.
- Create: `app/projects/[projectId]/cycles/[cycleId]/page.tsx` for project cycle details.
- Create: `app/projects/[projectId]/history/page.tsx` and `app/projects/[projectId]/history/[cycleId]/page.tsx` for project-scoped history.
- Create: `app/projects/[projectId]/settings/page.tsx` for project-scoped data maintenance.
- Modify: `app/(member)/w/page.tsx`, `app/(member)/w/[cycleId]/page.tsx`, and `app/(member)/w/[cycleId]/[memberId]/page.tsx` for role and grouping changes.
- Modify: `app/api/cycles/route.ts`, `app/api/ai/plan-check/route.ts`, and `app/api/submissions/[submissionId]/route.ts` to remove unsafe project fallbacks and enforce ownership.
- Modify: existing admin routes to redirect to `/` or project routes, preserving old links.
- Modify: tests under `tests/unit` and `tests/e2e`.
- Modify: `README.md` and `docs/deploy.md` to describe multi-project usage.

## Task 1: Role Model And Migration

**Files:**
- Modify: `prisma/schema.prisma`
- Create: `prisma/migrations/<timestamp>_member_roles_manager_developer/migration.sql`
- Modify: `prisma/seed.ts`
- Create: `lib/member-role.ts`
- Test: `tests/unit/lib/member-role.test.ts`

- [ ] **Step 1: Write failing role utility tests**

Create `tests/unit/lib/member-role.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import {
  formatMemberRole,
  isFillableMemberRole,
  normalizeMemberRole,
} from "@/lib/member-role";

describe("member role helpers", () => {
  it("formats project roles in Chinese", () => {
    expect(formatMemberRole("manager")).toBe("项目经理");
    expect(formatMemberRole("developer")).toBe("开发");
  });

  it("normalizes form role values", () => {
    expect(normalizeMemberRole("manager")).toBe("manager");
    expect(normalizeMemberRole("developer")).toBe("developer");
    expect(normalizeMemberRole("bad-value")).toBe("developer");
    expect(normalizeMemberRole(null)).toBe("developer");
  });

  it("only developers appear in the member submission flow", () => {
    expect(isFillableMemberRole("developer")).toBe(true);
    expect(isFillableMemberRole("manager")).toBe(false);
  });
});
```

- [ ] **Step 2: Run the failing test**

Run:

```bash
npm test -- tests/unit/lib/member-role.test.ts
```

Expected: FAIL because `@/lib/member-role` does not exist.

- [ ] **Step 3: Add role utility implementation**

Create `lib/member-role.ts`:

```ts
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
```

- [ ] **Step 4: Update Prisma schema role enum**

Change `prisma/schema.prisma`:

```prisma
enum MemberRole {
  manager
  developer
}
```

Change `Member.role` default:

```prisma
role        MemberRole         @default(developer)
```

- [ ] **Step 5: Create and edit migration**

Run:

```bash
npx prisma migrate dev --name member_roles_manager_developer --create-only
```

Replace the generated migration SQL with PostgreSQL-safe enum migration:

```sql
ALTER TYPE "MemberRole" RENAME TO "MemberRole_old";

CREATE TYPE "MemberRole" AS ENUM ('manager', 'developer');

ALTER TABLE "Member"
  ALTER COLUMN "role" DROP DEFAULT,
  ALTER COLUMN "role" TYPE "MemberRole"
  USING (
    CASE "role"::text
      WHEN 'admin' THEN 'manager'
      ELSE 'developer'
    END
  )::"MemberRole",
  ALTER COLUMN "role" SET DEFAULT 'developer';

DROP TYPE "MemberRole_old";
```

- [ ] **Step 6: Apply migration to the real database**

Run:

```bash
npx prisma migrate dev
npm run prisma:generate
```

Expected: migration applies against the `.env.local` `DATABASE_URL`, Prisma Client regenerates, and existing rows keep their data.

- [ ] **Step 7: Update seed roles**

In `prisma/seed.ts`, replace manager seed role:

```ts
role: "manager",
```

Replace developer seed role:

```ts
role: "developer",
```

- [ ] **Step 8: Verify role tests pass**

Run:

```bash
npm test -- tests/unit/lib/member-role.test.ts
```

Expected: PASS.

## Task 2: Project Portal And Project Creation

**Files:**
- Modify: `app/page.tsx`
- Create: `app/projects/new/page.tsx`
- Create: `app/projects/[projectId]/page.tsx`
- Test: `tests/e2e/report-flow.spec.ts`

- [ ] **Step 1: Add E2E expectations for project portal**

Update `tests/e2e/report-flow.spec.ts` with a test that visits `/`, expects a heading named `项目`, clicks `创建项目`, fills `项目名称`, fills one manager and one developer, submits, and expects to land on a project dashboard heading.

- [ ] **Step 2: Run E2E test to verify it fails**

Run:

```bash
npm run test:e2e -- tests/e2e/report-flow.spec.ts
```

Expected: FAIL because `/projects/new` does not exist.

- [ ] **Step 3: Implement project portal**

Replace `app/page.tsx` with a server component that queries projects:

```ts
const projects = await prisma.project.findMany({
  include: {
    _count: { select: { members: true, cycles: true } },
    cycles: {
      orderBy: { weekStartDate: "desc" },
      take: 1,
    },
  },
  orderBy: { createdAt: "desc" },
});
```

Render project cards linking to `/projects/${project.id}` and a primary link to `/projects/new`.

- [ ] **Step 4: Implement project creation page**

Create `app/projects/new/page.tsx` with a server action that:

```ts
const project = await prisma.project.create({
  data: {
    name,
    description: description || null,
    members: {
      create: members.map((member) => ({
        name: member.name,
        role: member.role,
        isActive: true,
      })),
    },
  },
});
```

Parse member rows from form fields named `memberName` and `memberRole`. Use `normalizeMemberRole` for every submitted role.

- [ ] **Step 5: Implement project dashboard**

Create `app/projects/[projectId]/page.tsx` that loads current project by `id`, includes member and cycle counts, shows latest cycle, and links to member, cycle, history, and settings pages.

- [ ] **Step 6: Re-run E2E project creation test**

Run:

```bash
npm run test:e2e -- tests/e2e/report-flow.spec.ts
```

Expected: the project creation portion passes.

## Task 3: Project Layout And Scoped Pages

**Files:**
- Create: `app/projects/[projectId]/layout.tsx`
- Create: `components/layout/project-nav.tsx`
- Create: `app/projects/[projectId]/members/page.tsx`
- Create: `app/projects/[projectId]/cycles/page.tsx`
- Create: `app/projects/[projectId]/cycles/[cycleId]/page.tsx`
- Create: `app/projects/[projectId]/history/page.tsx`
- Create: `app/projects/[projectId]/history/[cycleId]/page.tsx`
- Create: `app/projects/[projectId]/settings/page.tsx`

- [ ] **Step 1: Create project layout**

Create a layout that loads `projectId`, verifies the project exists, renders `ProjectNav`, and passes children.

- [ ] **Step 2: Create project nav**

Create `components/layout/project-nav.tsx` with links:

```ts
[
  ["工作台", `/projects/${projectId}`],
  ["成员", `/projects/${projectId}/members`],
  ["周报", `/projects/${projectId}/cycles`],
  ["历史", `/projects/${projectId}/history`],
  ["设置", `/projects/${projectId}/settings`],
  ["填写", "/w"],
]
```

- [ ] **Step 3: Port members page into project scope**

Copy behavior from `app/(admin)/admin/members/page.tsx`, remove the project selector, and ensure all queries use:

```ts
where: { projectId }
```

Use `formatMemberRole` for display and `normalizeMemberRole` for writes.

- [ ] **Step 4: Port cycles page into project scope**

Copy behavior from `app/(admin)/admin/cycles/page.tsx`, remove `getDefaultProject()`, and call:

```ts
await createReportCycleForRange(projectId, startDate, endDate);
```

Only list cycles with:

```ts
where: { projectId }
```

- [ ] **Step 5: Port cycle detail page into project scope**

Copy behavior from `app/(admin)/admin/cycles/[cycleId]/page.tsx`, fetch by `id`, and call `notFound()` unless:

```ts
cycle.projectId === projectId
```

Only list fillable members using:

```ts
role: "developer"
```

- [ ] **Step 6: Port history pages into project scope**

Copy history list and detail pages, filter list by `projectId`, and verify detail cycle ownership before rendering.

- [ ] **Step 7: Port settings page into project scope**

Use the project-scoped cleanup function from Task 4. Labels must say `当前项目`, not `全部项目`.

## Task 4: Project-Scoped Maintenance And API Ownership

**Files:**
- Modify: `lib/system-maintenance.ts`
- Modify: `app/api/cycles/route.ts`
- Modify: `app/api/ai/plan-check/route.ts`
- Modify: `app/api/submissions/[submissionId]/route.ts`
- Test: `tests/unit/lib/system-maintenance.test.ts`

- [ ] **Step 1: Update maintenance tests**

Extend `tests/unit/lib/system-maintenance.test.ts` with a case that passes `projectId: "project-a"` and expects every deleteMany call to receive project-scoped filters.

- [ ] **Step 2: Implement project-scoped cleanup**

Update `clearProjectData` options:

```ts
export type ClearProjectDataOptions = {
  preserveMembers: boolean;
  projectId?: string;
};
```

When `projectId` exists, delete through filters tied to that project:

```ts
await tx.aiRunLog.deleteMany({ where: { projectId } });
await tx.consolidatedReport.deleteMany({
  where: { cycle: { projectId } },
});
await tx.memberSubmission.deleteMany({
  where: { cycle: { projectId } },
});
await tx.weeklyReportCycle.deleteMany({ where: { projectId } });
```

Delete members and project only when `preserveMembers` is false.

- [ ] **Step 3: Remove default project from cycle API**

Update `app/api/cycles/route.ts` to require a string `projectId` in the JSON body. Return 400 when missing, 404 when the project does not exist, and create cycles only for that project.

- [ ] **Step 4: Remove plan-check project fallback**

In `app/api/ai/plan-check/route.ts`, compute `projectId` only from the found cycle or submission. Return 400 if neither is provided and no project can be derived.

- [ ] **Step 5: Harden submission update**

In `app/api/submissions/[submissionId]/route.ts`, fetch the submission with `cycle` and `member`, verify `submission.member.projectId === submission.cycle.projectId`, then update.

- [ ] **Step 6: Run focused unit tests**

Run:

```bash
npm test -- tests/unit/lib/system-maintenance.test.ts tests/unit/lib/member-role.test.ts
```

Expected: PASS.

## Task 5: Public Member Flow

**Files:**
- Modify: `app/(member)/w/page.tsx`
- Modify: `app/(member)/w/[cycleId]/page.tsx`
- Modify: `app/(member)/w/[cycleId]/[memberId]/page.tsx`

- [ ] **Step 1: Group open cycles by project**

Update `/w` to query open cycles with project data and render grouped sections by project name.

- [ ] **Step 2: Restrict member selection to developers**

Update `/w/[cycleId]` project member include:

```ts
where: {
  isActive: true,
  role: "developer",
}
```

- [ ] **Step 3: Restrict submission page to developers**

Update `/w/[cycleId]/[memberId]` guard:

```ts
member.role !== "developer"
```

- [ ] **Step 4: Run member flow tests**

Run:

```bash
npm run test:e2e -- tests/e2e/report-flow.spec.ts
```

Expected: member flow passes and project grouping is visible.

## Task 6: Legacy Route Redirects And Documentation

**Files:**
- Modify: `app/(admin)/admin/page.tsx`
- Modify: `app/(admin)/admin/projects/page.tsx`
- Modify: `app/(admin)/admin/members/page.tsx`
- Modify: `app/(admin)/admin/cycles/page.tsx`
- Modify: `app/(admin)/admin/history/page.tsx`
- Modify: `app/(admin)/admin/settings/page.tsx`
- Modify: `components/layout/admin-nav.tsx`
- Modify: `components/layout/sidebar.tsx`
- Modify: `README.md`
- Modify: `docs/deploy.md`

- [ ] **Step 1: Redirect old admin entry points**

Each old admin page should either redirect to `/` or render a short project-selection page. The simplest behavior is:

```ts
import { redirect } from "next/navigation";

export default function AdminPage() {
  redirect("/");
}
```

- [ ] **Step 2: Update navigation labels and links**

Global navigation should point to `/`, `/projects/new`, and `/w`. Project-specific navigation lives in `ProjectNav`.

- [ ] **Step 3: Update docs**

Change README wording from single-project to multi-project. Document:

```text
首页选择或创建项目；进入项目后维护成员、周期、汇总和历史。
```

- [ ] **Step 4: Run lint and typecheck**

Run:

```bash
npm run lint
npm run typecheck
```

Expected: both pass.

## Task 7: Final Verification

**Files:**
- No new files unless verification exposes a bug.

- [ ] **Step 1: Run full unit tests**

Run:

```bash
npm test
```

Expected: PASS.

- [ ] **Step 2: Run full E2E tests**

Run:

```bash
npm run test:e2e
```

Expected: PASS.

- [ ] **Step 3: Run production build**

Run:

```bash
npm run build
```

Expected: PASS.

- [ ] **Step 4: Inspect git diff**

Run:

```bash
git diff --stat
git diff --check
```

Expected: no whitespace errors and changed files match this plan.
