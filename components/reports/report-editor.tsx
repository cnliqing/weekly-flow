"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { PlanWarning } from "@/components/reports/plan-warning";
import type { PlanCheckResult } from "@/lib/plan-check";
import type { SubmissionStructuredContent } from "@/lib/submission";

type ReportEditorProps = {
  cycleId: string;
  memberId: string;
  initialContent?: Partial<SubmissionStructuredContent> | null;
  initialFreeText?: string | null;
  initialPlanCheck?: PlanCheckResult | null;
};

const fieldConfigs: Array<{
  key: keyof SubmissionStructuredContent;
  label: string;
  placeholder: string;
}> = [
  {
    key: "workItems",
    label: "本周工作情况",
    placeholder: "每行一条，例如：完成成员填写流程联调",
  },
  {
    key: "delayItems",
    label: "工作事项延期情况说明",
    placeholder: "每行一条，没有可留空",
  },
  {
    key: "problemItems",
    label: "问题及解决办法",
    placeholder: "每行一条，例如：审批入口缺少权限，已补充校验",
  },
  {
    key: "nextPlanItems",
    label: "下周工作计划",
    placeholder: "每行一条，例如：完善汇总页编辑体验",
  },
];

export function ReportEditor({
  cycleId,
  memberId,
  initialContent,
  initialFreeText,
  initialPlanCheck,
}: ReportEditorProps) {
  const [values, setValues] = useState<Record<keyof SubmissionStructuredContent, string>>(
    {
      workItems: joinItems(initialContent?.workItems),
      delayItems: joinItems(initialContent?.delayItems),
      problemItems: joinItems(initialContent?.problemItems),
      nextPlanItems: joinItems(initialContent?.nextPlanItems),
    },
  );
  const [freeTextContent, setFreeTextContent] = useState(initialFreeText ?? "");
  const [planCheck, setPlanCheck] = useState<PlanCheckResult | null>(
    initialPlanCheck ?? null,
  );
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">(
    "idle",
  );
  const [aiCheckStatus, setAiCheckStatus] = useState<
    "idle" | "checking" | "done" | "error"
  >("idle");
  const [aiCheckMessage, setAiCheckMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const structuredContent = useMemo(
    () => ({
      workItems: splitItems(values.workItems),
      delayItems: splitItems(values.delayItems),
      problemItems: splitItems(values.problemItems),
      nextPlanItems: splitItems(values.nextPlanItems),
    }),
    [values],
  );

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("saving");
    setAiCheckStatus("idle");
    setAiCheckMessage("");
    setErrorMessage("");

    let response: Response;

    try {
      response = await fetch(`/api/cycles/${cycleId}/submissions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          memberId,
          structuredContent,
          freeTextContent,
        }),
      });
    } catch {
      setStatus("error");
      setErrorMessage("网络异常，提交失败，请稍后重试。");
      return;
    }

    if (!response.ok) {
      const payload = (await response.json().catch(() => null)) as
        | { error?: string }
        | null;
      setStatus("error");
      setErrorMessage(payload?.error ?? "提交失败，请稍后重试。");
      return;
    }

    const payload = (await response.json()) as {
      planCheck?: PlanCheckResult | null;
      submission?: { id: string } | null;
    };
    setPlanCheck(payload.planCheck ?? null);
    setStatus("saved");

    if (payload.submission?.id) {
      void runAiPlanCheck(payload.submission.id);
    }
  }

  async function runAiPlanCheck(submissionId: string) {
    setAiCheckStatus("checking");
    setAiCheckMessage("AI 正在进行计划承接检查，完成后会自动更新提示。");

    const response = await fetch("/api/ai/plan-check", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        submissionId,
        memberId,
      }),
    });
    const payload = (await response.json().catch(() => null)) as
      | { planCheck?: PlanCheckResult; error?: string }
      | null;

    if (!response.ok) {
      setAiCheckStatus("error");
      setAiCheckMessage(payload?.error ?? "AI 承接检查失败，已保留本地检查结果。");
      return;
    }

    setPlanCheck(payload?.planCheck ?? null);
    setAiCheckStatus("done");
    setAiCheckMessage("AI 计划承接检查已完成。");
  }

  return (
    <form className="grid gap-5" onSubmit={handleSubmit}>
      <PlanWarning
        matchedItems={planCheck?.matchedItems}
        missingItems={planCheck?.missingItems}
        summary={planCheck?.summary}
      />

      {fieldConfigs.map((field) => (
        <label
          className="flex flex-col gap-2 text-sm font-medium text-ink-700"
          key={field.key}
        >
          {field.label}
          <textarea
            className="min-h-28 rounded-md border border-line bg-white px-3 py-3 text-base text-ink-900 outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20"
            name={field.key}
            onChange={(event) =>
              setValues((current) => ({
                ...current,
                [field.key]: event.target.value,
              }))
            }
            placeholder={field.placeholder}
            value={values[field.key]}
          />
        </label>
      ))}

      <label className="flex flex-col gap-2 text-sm font-medium text-ink-700">
        补充说明
        <textarea
          className="min-h-32 rounded-md border border-line bg-white px-3 py-3 text-base text-ink-900 outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20"
          name="freeTextContent"
          onChange={(event) => setFreeTextContent(event.target.value)}
          placeholder="可粘贴临时记录、风险说明或其他未结构化内容。"
          value={freeTextContent}
        />
      </label>

      <div className="flex flex-col gap-3 md:flex-row md:items-center">
        <Button disabled={status === "saving"} type="submit">
          {status === "saving" ? "提交中..." : "提交周报"}
        </Button>
        {status === "saving" ? (
          <p className="text-sm font-medium text-ink-500">
            正在保存并进行计划承接检查，请稍候。
          </p>
        ) : null}
        {status === "saved" ? (
          <p className="text-sm font-medium text-emerald-700">
            已保存，并已完成计划承接检查。本次提交会覆盖你之前的版本。
          </p>
        ) : null}
        {status === "error" ? (
          <p className="text-sm font-medium text-red-700">{errorMessage}</p>
        ) : null}
      </div>

      {aiCheckStatus !== "idle" ? (
        <p
          className={
            aiCheckStatus === "error"
              ? "text-sm font-medium text-amber-700"
              : "text-sm font-medium text-ink-500"
          }
        >
          {aiCheckMessage}
        </p>
      ) : null}
    </form>
  );
}

function joinItems(items?: string[]): string {
  return (items ?? []).join("\n");
}

function splitItems(value: string): string[] {
  return value
    .split(/\r?\n/)
    .map((item) => item.trim())
    .filter(Boolean);
}
