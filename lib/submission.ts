import { prisma } from "./prisma";
import type { Prisma } from "@prisma/client";

export type SubmissionStructuredContent = {
  workItems: string[];
  delayItems: string[];
  problemItems: string[];
  nextPlanItems: string[];
};

export type UpsertMemberSubmissionInput = {
  cycleId: string;
  memberId: string;
  structuredContent?: Partial<SubmissionStructuredContent> | null;
  freeTextContent?: string | null;
  planCheckSummary?: string | null;
  planCheckWarnings?: Prisma.InputJsonValue;
};

export type MemberSubmissionRepository<TSubmission = unknown> = {
  upsert(input: {
    cycleId: string;
    memberId: string;
    structuredContent: SubmissionStructuredContent;
    freeTextContent: string | null;
    planCheckSummary: string | null;
    planCheckWarnings: Prisma.InputJsonValue | undefined;
  }): Promise<TSubmission>;
};

const emptyStructuredContent: SubmissionStructuredContent = {
  workItems: [],
  delayItems: [],
  problemItems: [],
  nextPlanItems: [],
};

export function normalizeStructuredContent(
  content?: Partial<SubmissionStructuredContent> | null,
): SubmissionStructuredContent {
  return {
    workItems: normalizeItems(content?.workItems),
    delayItems: normalizeItems(content?.delayItems),
    problemItems: normalizeItems(content?.problemItems),
    nextPlanItems: normalizeItems(content?.nextPlanItems),
  };
}

function normalizeItems(items: unknown): string[] {
  if (!Array.isArray(items)) {
    return [];
  }

  return items
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim())
    .filter(Boolean);
}

const prismaSubmissionRepository: MemberSubmissionRepository = {
  async upsert(input) {
    const submittedAt = new Date();

    return prisma.memberSubmission.upsert({
      where: {
        cycleId_memberId: {
          cycleId: input.cycleId,
          memberId: input.memberId,
        },
      },
      update: {
        structuredContent: input.structuredContent,
        freeTextContent: input.freeTextContent,
        planCheckSummary: input.planCheckSummary,
        planCheckWarnings: input.planCheckWarnings,
        submittedAt,
      },
      create: {
        cycleId: input.cycleId,
        memberId: input.memberId,
        structuredContent: input.structuredContent,
        freeTextContent: input.freeTextContent,
        planCheckSummary: input.planCheckSummary,
        planCheckWarnings: input.planCheckWarnings,
        submittedAt,
      },
    });
  },
};

export async function upsertMemberSubmission<TSubmission = unknown>(
  input: UpsertMemberSubmissionInput,
  repository: MemberSubmissionRepository<TSubmission> = prismaSubmissionRepository as MemberSubmissionRepository<TSubmission>,
): Promise<TSubmission> {
  return repository.upsert({
    cycleId: input.cycleId,
    memberId: input.memberId,
    structuredContent:
      input.structuredContent === undefined
        ? { ...emptyStructuredContent }
        : normalizeStructuredContent(input.structuredContent),
    freeTextContent: input.freeTextContent?.trim() || null,
    planCheckSummary: input.planCheckSummary?.trim() || null,
    planCheckWarnings: input.planCheckWarnings,
  });
}
