import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { normalizeStructuredContent, type SubmissionStructuredContent } from "@/lib/submission";

export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{
    submissionId: string;
  }>;
};

export async function PATCH(request: NextRequest, context: RouteContext) {
  const session = await getAdminSession();

  if (!session) {
    return NextResponse.json({ error: "未登录或无管理员权限。" }, { status: 401 });
  }

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

  const submission = await prisma.memberSubmission.update({
    where: {
      id: submissionId,
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
