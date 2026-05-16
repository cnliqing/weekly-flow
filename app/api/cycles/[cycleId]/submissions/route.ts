import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";
import { checkPlanCompletion } from "@/lib/plan-check";
import { prisma } from "@/lib/prisma";
import {
  normalizeStructuredContent,
  upsertMemberSubmission,
  type SubmissionStructuredContent,
} from "@/lib/submission";

export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{
    cycleId: string;
  }>;
};

export async function GET(_request: NextRequest, context: RouteContext) {
  const session = await getAdminSession();

  if (!session) {
    return NextResponse.json({ error: "未登录或无管理员权限。" }, { status: 401 });
  }

  const { cycleId } = await context.params;
  const submissions = await prisma.memberSubmission.findMany({
    where: {
      cycleId,
    },
    include: {
      member: true,
    },
    orderBy: {
      submittedAt: "desc",
    },
  });

  return NextResponse.json({ submissions });
}

export async function POST(request: NextRequest, context: RouteContext) {
  const { cycleId } = await context.params;
  const body = (await request.json().catch(() => null)) as
    | {
        memberId?: unknown;
        structuredContent?: Partial<SubmissionStructuredContent>;
        freeTextContent?: unknown;
      }
    | null;

  if (!body || typeof body.memberId !== "string" || body.memberId.trim() === "") {
    return NextResponse.json({ error: "缺少成员信息。" }, { status: 400 });
  }

  const memberId = body.memberId.trim();
  const [cycle, member] = await Promise.all([
    prisma.weeklyReportCycle.findUnique({
      where: {
        id: cycleId,
      },
    }),
    prisma.member.findUnique({
      where: {
        id: memberId,
      },
    }),
  ]);

  if (!cycle) {
    return NextResponse.json({ error: "周报周期不存在。" }, { status: 404 });
  }

  if (!member || member.projectId !== cycle.projectId || !member.isActive) {
    return NextResponse.json({ error: "成员不在当前项目中。" }, { status: 404 });
  }

  const previousSubmission = await prisma.memberSubmission.findFirst({
    where: {
      cycle: {
        projectId: cycle.projectId,
        weekStartDate: {
          lt: cycle.weekStartDate,
        },
      },
      memberId,
    },
    orderBy: {
      cycle: {
        weekStartDate: "desc",
      },
    },
  });

  const structuredContent = normalizeStructuredContent(body.structuredContent);
  const previousPlanItems = normalizeStructuredContent(
    previousSubmission?.structuredContent as Partial<SubmissionStructuredContent> | null,
  ).nextPlanItems;
  const freeTextContent =
    typeof body.freeTextContent === "string" ? body.freeTextContent : "";
  const planCheck = checkPlanCompletion(
    previousPlanItems,
    structuredContent,
    freeTextContent,
  );
  const submission = await upsertMemberSubmission({
    cycleId,
    memberId,
    structuredContent,
    freeTextContent,
    planCheckSummary: planCheck.summary,
    planCheckWarnings: planCheck,
  });

  return NextResponse.json({ submission, planCheck }, { status: 201 });
}
