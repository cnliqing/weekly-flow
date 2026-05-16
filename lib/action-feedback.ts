import { redirect } from "next/navigation";

type FeedbackType = "success" | "error";

export function redirectWithFeedback(
  pathname: string,
  type: FeedbackType,
  message: string,
): never {
  const params = new URLSearchParams({
    feedbackType: type,
    feedbackMessage: message,
  });

  redirect(`${pathname}?${params.toString()}`);
}

export function getActionErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message.trim()) {
    return `${fallback}：${error.message}`;
  }

  return fallback;
}
