"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";

type FinalReportEditorProps = {
  cycleId: string;
  initialDraftContent?: string | null;
  initialPolishedContent?: string | null;
  initialFinalContent?: string | null;
  initialStatus?: "draft" | "finalized";
};

type ApiResult = {
  draftContent?: string;
  polishedContent?: string;
  error?: string;
};

export function FinalReportEditor({
  cycleId,
  initialDraftContent,
  initialPolishedContent,
  initialFinalContent,
  initialStatus = "draft",
}: FinalReportEditorProps) {
  const [draftContent, setDraftContent] = useState(
    initialDraftContent ?? initialFinalContent ?? "",
  );
  const [polishedContent, setPolishedContent] = useState(
    initialPolishedContent ?? "",
  );
  const [reportStatus, setReportStatus] = useState(initialStatus);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  function runAction(action: () => Promise<void>) {
    setError("");
    setMessage("");
    startTransition(() => {
      void action().catch((caught) => {
        setError(caught instanceof Error ? caught.message : "操作失败。");
      });
    });
  }

  async function summarize() {
    const result = await postJson<ApiResult>("/api/ai/summarize", { cycleId });
    setDraftContent(result.draftContent ?? "");
    setPolishedContent("");
    setReportStatus("draft");
    setMessage("AI 汇总草稿已生成。");
  }

  async function polish() {
    const source = polishedContent || draftContent;

    if (!source.trim()) {
      throw new Error("请先生成或填写草稿内容。");
    }

    const result = await postJson<ApiResult>("/api/ai/polish", {
      cycleId,
      reportContent: source,
    });

    setPolishedContent(result.polishedContent ?? "");
    setMessage("AI 润色稿已生成。");
  }

  async function saveFinal() {
    const finalContent = polishedContent || draftContent;

    if (!finalContent.trim()) {
      throw new Error("定稿内容不能为空。");
    }

    await postJson("/api/reports/finalize", {
      cycleId,
      finalContent,
    });

    setReportStatus("finalized");
    setMessage("定稿已保存。");
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h3 className="text-xl font-semibold">汇总与定稿</h3>
          <p className="mt-1 text-sm text-ink-500">
            当前状态：{reportStatus === "finalized" ? "已定稿" : "草稿"}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button disabled={isPending} onClick={() => runAction(summarize)}>
            AI 汇总
          </Button>
          <Button
            disabled={isPending || !draftContent.trim()}
            onClick={() => runAction(polish)}
            variant="secondary"
          >
            AI 润色
          </Button>
          <Button
            disabled={isPending || !(polishedContent || draftContent).trim()}
            onClick={() => runAction(saveFinal)}
            variant="secondary"
          >
            保存定稿
          </Button>
        </div>
      </div>

      {message ? <p className="text-sm font-medium text-accent">{message}</p> : null}
      {error ? <p className="text-sm font-medium text-red-600">{error}</p> : null}

      <label className="block">
        <span className="text-sm font-semibold text-ink-900">汇总草稿</span>
        <textarea
          className="mt-2 min-h-72 w-full resize-y rounded-md border border-line bg-white p-4 font-mono text-sm leading-6 text-ink-900 outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
          onChange={(event) => setDraftContent(event.target.value)}
          placeholder="点击 AI 汇总后生成草稿，也可以手动编辑。"
          value={draftContent}
        />
      </label>

      <label className="block">
        <span className="text-sm font-semibold text-ink-900">润色稿</span>
        <textarea
          className="mt-2 min-h-72 w-full resize-y rounded-md border border-line bg-white p-4 font-mono text-sm leading-6 text-ink-900 outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
          onChange={(event) => setPolishedContent(event.target.value)}
          placeholder="点击 AI 润色后生成润色稿；保存定稿会优先使用这里的内容。"
          value={polishedContent}
        />
      </label>
    </div>
  );
}

async function postJson<T = unknown>(
  url: string,
  payload: Record<string, unknown>,
): Promise<T> {
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const result = (await response.json().catch(() => null)) as
    | (T & { error?: string })
    | null;

  if (!response.ok) {
    throw new Error(result?.error ?? "请求失败。");
  }

  return result as T;
}
