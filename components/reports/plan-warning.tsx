import { clsx } from "clsx";

type PlanWarningProps = {
  summary?: string | null;
  missingItems?: string[];
  matchedItems?: string[];
};

export function PlanWarning({
  summary,
  missingItems = [],
  matchedItems = [],
}: PlanWarningProps) {
  if (!summary && missingItems.length === 0 && matchedItems.length === 0) {
    return null;
  }

  const hasMissingItems = missingItems.length > 0;

  return (
    <div
      className={clsx(
        "rounded-md border p-4 text-sm",
        hasMissingItems
          ? "border-amber-200 bg-amber-50 text-amber-950"
          : "border-emerald-200 bg-emerald-50 text-emerald-950",
      )}
    >
      {summary ? <p className="font-semibold">{summary}</p> : null}

      {missingItems.length > 0 ? (
        <div className="mt-3">
          <p className="font-medium">上周计划未在本周内容中体现：</p>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            {missingItems.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      ) : null}

      {matchedItems.length > 0 ? (
        <div className="mt-3">
          <p className="font-medium">已承接事项：</p>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            {matchedItems.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
