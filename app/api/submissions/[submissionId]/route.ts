import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  normalizeStructuredContent,
  type SubmissionStructuredContent,
} from "@/lib/submission";

export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{
    submissionId: string;
  }>;
};

export async function PATCH(request: NextRequest, context: RouteContext) {
  const { submissionId } = await context.params;
  const body = (await request.json().catch(() => null)) as
    | {
        structuredContent?: Partial<SubmissionStructuredContent>;
        freeTextContent?: unknown;
      }
    | null;

  if (!body) {
    return NextResponse.json({ error: "请求内容为空。" }, { status: 400 });
  }

  const existingSubmission = await prisma.memberSubmission.findUnique({
    where: {
      id: submissionId,
    },
    include: {
      cycle: true,
      member: true,
    },
  });

  if (!existingSubmission) {
    return NextResponse.json({ error: "成员提交不存在。" }, { status: 404 });
  }

  if (existingSubmission.member.projectId !== existingSubmission.cycle.projectId) {
    return NextResponse.json(
      { error: "成员提交与周报周期不属于同一项目。" },
      { status: 400 },
    );
  }

  const submission = await prisma.memberSubmission.update({
    where: {
      id: existingSubmission.id,
    },
    data: {
      structuredContent: normalizeStructuredContent(body.structuredContent),
      freeTextContent:
        typeof body.freeTextContent === "string"
          ? body.freeTextContent.trim() || null
          : null,
      submittedAt: new Date(),
    },
  });

  return NextResponse.json({ submission });
}
