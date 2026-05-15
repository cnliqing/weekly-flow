# 周报通 / WeeklyFlow Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a single-project weekly report system where admins manage members, create weekly cycles, aggregate submissions with AI, and members submit reports with plan-coverage reminders.

**Architecture:** Use a single Next.js app for UI and server logic. Persist all business data in PostgreSQL through Prisma, keep admin auth in Auth.js, and isolate report formatting, date-range logic, and AI prompt/response handling into small server-side utility modules. Member submission uses a public entry flow, but the admin remains authenticated; repeated submissions overwrite the previous record for the same member and week.

**Tech Stack:** Next.js, TypeScript, PostgreSQL, Prisma, Auth.js, Tailwind CSS, Vitest, Playwright, Docker

---

### Task 1: Scaffold the app and shared runtime

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `next.config.ts`
- Create: `postcss.config.js`
- Create: `tailwind.config.ts`
- Create: `app/layout.tsx`
- Create: `app/page.tsx`
- Create: `app/globals.css`
- Create: `components/layout/app-shell.tsx`
- Create: `components/layout/sidebar.tsx`
- Create: `components/ui/button.tsx`
- Create: `components/ui/card.tsx`
- Create: `lib/env.ts`
- Create: `README.md`
- Create: `.env.example`

- [ ] **Step 1: Write the failing test**

Create `tests/smoke/app-smoke.test.ts`:

```ts
import { describe, expect, it } from "vitest";

describe("app smoke", () => {
  it("exports the app shell component", async () => {
    const mod = await import("../../components/layout/app-shell");
    expect(mod.AppShell).toBeTruthy();
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test -- tests/smoke/app-smoke.test.ts -v`

Expected: module not found or missing export.

- [ ] **Step 3: Write the minimal implementation**

Implement a minimal app shell and landing page:

```tsx
export function AppShell({ children }: { children: React.ReactNode }) {
  return <div className="min-h-screen bg-slate-50">{children}</div>;
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npm test -- tests/smoke/app-smoke.test.ts -v`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add package.json tsconfig.json next.config.ts postcss.config.js tailwind.config.ts app components lib README.md .env.example tests
git commit -m "feat: scaffold weeklyflow app"
```

### Task 2: Add database schema, Prisma client, and seed data

**Files:**
- Create: `prisma/schema.prisma`
- Create: `prisma/seed.ts`
- Create: `lib/prisma.ts`
- Create: `lib/ids.ts`
- Create: `tests/unit/lib/date-range.test.ts`
- Create: `tests/unit/lib/report-template.test.ts`

- [ ] **Step 1: Write the failing test**

Create `tests/unit/lib/date-range.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { getWeeklyRange } from "../../../lib/report-date-range";

describe("getWeeklyRange", () => {
  it("builds current week and next week ranges from a start date", () => {
    const range = getWeeklyRange(new Date("2026-05-15T00:00:00.000Z"));
    expect(range.weekStartDate).toBe("2026-05-11");
    expect(range.weekEndDate).toBe("2026-05-15");
    expect(range.nextWeekStartDate).toBe("2026-05-18");
    expect(range.nextWeekEndDate).toBe("2026-05-22");
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test -- tests/unit/lib/date-range.test.ts -v`

Expected: `getWeeklyRange` not found.

- [ ] **Step 3: Write the minimal implementation**

Create `lib/report-date-range.ts` with:

```ts
function startOfUtcDay(date: Date) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

function addUtcDays(date: Date, days: number) {
  const next = new Date(date);
  next.setUTCDate(next.getUTCDate() + days);
  return next;
}

function formatUtcDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

export function getWeeklyRange(date: Date): {
  weekStartDate: string;
  weekEndDate: string;
  nextWeekStartDate: string;
  nextWeekEndDate: string;
} {
  const base = startOfUtcDay(date);
  const day = base.getUTCDay();
  const diffToMonday = day === 0 ? -6 : 1 - day;
  const weekStart = addUtcDays(base, diffToMonday);
  const weekEnd = addUtcDays(weekStart, 4);
  const nextWeekStart = addUtcDays(weekStart, 7);
  const nextWeekEnd = addUtcDays(nextWeekStart, 4);

  return {
    weekStartDate: formatUtcDate(weekStart),
    weekEndDate: formatUtcDate(weekEnd),
    nextWeekStartDate: formatUtcDate(nextWeekStart),
    nextWeekEndDate: formatUtcDate(nextWeekEnd),
  };
}
```

Then define the Prisma models from the spec with this shape:

```prisma
enum MemberRole {
  admin
  member
}

enum CycleStatus {
  draft
  open
  closed
  archived
}

enum ReportStatus {
  draft
  finalized
}

enum AiRunType {
  plan_check
  summarize
  polish
}

model Project {
  id          String   @id @default(cuid())
  name        String
  description String?
  members     Member[]
  cycles      WeeklyReportCycle[]
  aiRuns      AiRunLog[]
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

model Member {
  id          String   @id @default(cuid())
  projectId   String
  name        String
  role        MemberRole @default(member)
  isActive    Boolean  @default(true)
  project     Project  @relation(fields: [projectId], references: [id])
  submissions MemberSubmission[]
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@unique([projectId, name])
}

model WeeklyReportCycle {
  id                String   @id @default(cuid())
  projectId         String
  weekStartDate     DateTime
  weekEndDate       DateTime
  nextWeekStartDate DateTime
  nextWeekEndDate   DateTime
  title             String
  status            CycleStatus @default(open)
  project           Project @relation(fields: [projectId], references: [id])
  submissions       MemberSubmission[]
  consolidatedReport ConsolidatedReport?
  aiRuns            AiRunLog[]
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
}

model MemberSubmission {
  id                String   @id @default(cuid())
  cycleId           String
  memberId          String
  structuredContent Json
  freeTextContent   String?
  planCheckSummary  String?
  planCheckWarnings Json?
  cycle             WeeklyReportCycle @relation(fields: [cycleId], references: [id])
  member            Member @relation(fields: [memberId], references: [id])
  submittedAt       DateTime @default(now())
  updatedAt         DateTime @updatedAt

  @@unique([cycleId, memberId])
}

model ConsolidatedReport {
  id              String   @id @default(cuid())
  cycleId         String   @unique
  draftContent    String?
  finalContent    String?
  polishedContent String?
  status          ReportStatus @default(draft)
  updatedBy       String?
  cycle           WeeklyReportCycle @relation(fields: [cycleId], references: [id])
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
}

model AiRunLog {
  id              String   @id @default(cuid())
  projectId       String
  cycleId         String?
  type            AiRunType
  model           String
  requestPayload  Json
  responsePayload Json?
  success         Boolean
  errorMessage    String?
  project         Project @relation(fields: [projectId], references: [id])
  cycle           WeeklyReportCycle? @relation(fields: [cycleId], references: [id])
  createdAt       DateTime @default(now())
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npm test -- tests/unit/lib/date-range.test.ts -v`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add prisma lib tests
git commit -m "feat: add prisma schema and date utilities"
```

### Task 3: Build the admin auth and admin shell

**Files:**
- Create: `app/api/auth/[...nextauth]/route.ts`
- Create: `app/(auth)/login/page.tsx`
- Create: `app/(admin)/admin/layout.tsx`
- Create: `app/(admin)/admin/page.tsx`
- Create: `app/(admin)/admin/projects/page.tsx`
- Create: `app/(admin)/admin/members/page.tsx`
- Create: `lib/auth.ts`
- Create: `components/forms/login-form.tsx`
- Create: `components/forms/member-form.tsx`

- [ ] **Step 1: Write the failing test**

Create `tests/unit/lib/auth.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { isAdminRole } from "../../../lib/auth-helpers";

describe("isAdminRole", () => {
  it("accepts only admin as privileged role", () => {
    expect(isAdminRole("admin")).toBe(true);
    expect(isAdminRole("member")).toBe(false);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test -- tests/unit/lib/auth.test.ts -v`

Expected: helper not found.

- [ ] **Step 3: Write the minimal implementation**

Implement `lib/auth-helpers.ts` and wire Auth.js so only admins can access `/admin`.

```ts
export function isAdminRole(role: string) {
  return role === "admin";
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npm test -- tests/unit/lib/auth.test.ts -v`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add app lib components
git commit -m "feat: add admin auth shell"
```

### Task 4: Implement weekly report creation, member submission, and overwrite flow

**Files:**
- Create: `app/(admin)/admin/cycles/page.tsx`
- Create: `app/(admin)/admin/cycles/[cycleId]/page.tsx`
- Create: `app/(member)/w/[cycleId]/[memberId]/page.tsx`
- Create: `app/api/cycles/route.ts`
- Create: `app/api/cycles/[cycleId]/submissions/route.ts`
- Create: `app/api/submissions/[submissionId]/route.ts`
- Create: `lib/report-template.ts`
- Create: `lib/submission.ts`
- Create: `lib/plan-check.ts`
- Create: `components/reports/report-editor.tsx`
- Create: `components/reports/plan-warning.tsx`

- [ ] **Step 1: Write the failing test**

Create `tests/unit/lib/submission.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { upsertMemberSubmission } from "../../../lib/submission";

describe("upsertMemberSubmission", () => {
  it("keeps only the latest submission for a member in one cycle", async () => {
    const first = await upsertMemberSubmission({
      cycleId: "cycle_1",
      memberId: "member_1",
      freeTextContent: "first",
    });
    const second = await upsertMemberSubmission({
      cycleId: "cycle_1",
      memberId: "member_1",
      freeTextContent: "second",
    });

    expect(first.id).toBeTruthy();
    expect(second.freeTextContent).toBe("second");
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test -- tests/unit/lib/submission.test.ts -v`

Expected: submission helper missing.

- [ ] **Step 3: Write the minimal implementation**

Implement `lib/submission.ts` around a Prisma `upsert` keyed by `cycleId + memberId`.

```ts
export async function upsertMemberSubmission(input: {
  cycleId: string;
  memberId: string;
  structuredContent?: Record<string, unknown>;
  freeTextContent?: string;
}) {
  return prisma.memberSubmission.upsert({
    where: { cycleId_memberId: { cycleId: input.cycleId, memberId: input.memberId } },
    update: { ...input, updatedAt: new Date() },
    create: { ...input },
  });
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npm test -- tests/unit/lib/submission.test.ts -v`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add app lib components tests
git commit -m "feat: add weekly submission flow"
```

### Task 5: Add AI provider, report aggregation, and polish

**Files:**
- Create: `lib/ai/client.ts`
- Create: `lib/ai/prompts.ts`
- Create: `lib/ai/summarize.ts`
- Create: `lib/ai/polish.ts`
- Create: `lib/ai/plan-check.ts`
- Create: `app/api/ai/summarize/route.ts`
- Create: `app/api/ai/polish/route.ts`
- Create: `app/api/ai/plan-check/route.ts`
- Create: `components/reports/final-report-editor.tsx`
- Create: `tests/unit/lib/report-template.test.ts`

- [ ] **Step 1: Write the failing test**

Create `tests/unit/lib/report-template.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { renderWeeklyReport } from "../../../lib/report-template";

describe("renderWeeklyReport", () => {
  it("renders the fixed sections in order", () => {
    const html = renderWeeklyReport({
      title: "项目周报（）（5月11日~5月15日）",
      workItems: ["完成周报通首页"],
      delayItems: [],
      aiAnalysis: "通过",
      problemItems: ["接口字段缺失"],
      nextPlanItems: ["完成 AI 汇总"],
    });

    expect(html).toContain("【本周工作情况】");
    expect(html).toContain("【工作事项延期情况说明】");
    expect(html).toContain("【AI审核效果分析】");
    expect(html).toContain("【问题及解决办法】");
    expect(html).toContain("【下周工作计划（");
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test -- tests/unit/lib/report-template.test.ts -v`

Expected: formatter missing.

- [ ] **Step 3: Write the minimal implementation**

Implement `renderWeeklyReport()` and the AI client adapter around OpenAI-compatible chat completions with these public functions:

```ts
export type WeeklyReportInput = {
  title: string;
  workItems: string[];
  delayItems: string[];
  aiAnalysis: string;
  problemItems: string[];
  nextPlanItems: string[];
};

export async function summarizeWeeklyReports(input: {
  title: string;
  submissions: Array<{
    memberName: string;
    structuredContent: Record<string, unknown>;
    freeTextContent: string | null;
    planCheckSummary: string | null;
  }>;
}): Promise<WeeklyReportInput> {
  return callWeeklyFlowAi("summarize", input);
}

export async function polishWeeklyReport(input: {
  reportContent: string;
}): Promise<{ polishedContent: string }> {
  return callWeeklyFlowAi("polish", input);
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npm test -- tests/unit/lib/report-template.test.ts -v`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add app lib components tests
git commit -m "feat: add ai report aggregation"
```

### Task 6: Add history views, cycle dashboard, and deployment docs

**Files:**
- Create: `app/(admin)/admin/history/page.tsx`
- Create: `app/(admin)/admin/history/[cycleId]/page.tsx`
- Create: `app/(admin)/admin/settings/page.tsx`
- Create: `docs/deploy.md`
- Create: `Dockerfile`
- Create: `.dockerignore`
- Create: `playwright.config.ts`
- Create: `tests/e2e/report-flow.spec.ts`

- [ ] **Step 1: Write the failing test**

Create `tests/e2e/report-flow.spec.ts`:

```ts
import { test, expect } from "@playwright/test";

test("admin can open a cycle and see member submissions", async ({ page }) => {
  await page.goto("/admin");
  await expect(page.getByText("项目周报")).toBeVisible();
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm run test:e2e -- tests/e2e/report-flow.spec.ts`

Expected: page route missing.

- [ ] **Step 3: Write the minimal implementation**

Implement the history page and ensure the admin dashboard links into it. Add Docker packaging and deployment notes for the external middleware setup.

- [ ] **Step 4: Run the test to verify it passes**

Run: `npm run test:e2e -- tests/e2e/report-flow.spec.ts`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add app docs Dockerfile .dockerignore playwright.config.ts tests
git commit -m "feat: add history and deployment docs"
```

## Self-check coverage

- Spec naming and single-project scope: Task 1, Task 6
- Admin login and admin-only area: Task 3
- Project personnel management: Task 3
- Weekly cycle creation: Task 4
- Member submission and overwrite: Task 4
- Template-fixed report rendering: Task 5
- History browsing: Task 6
- Previous-week plan reminder: Task 4 and Task 5
- AI aggregation and polish: Task 5
- Packaging and deployment boundary: Task 6

## Notes for implementation

- Keep the report template fixed and centralize it in `lib/report-template.ts`.
- Treat the member submission payload as structured JSON plus free text, not a blob of arbitrary HTML.
- Use one Prisma unique key on `(cycleId, memberId)` so overwrite behavior is explicit.
- Use service-side AI calls only; the browser should never see `apiKey`.
