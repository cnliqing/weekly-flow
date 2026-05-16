"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { clsx } from "clsx";

type ToastState = {
  type: "success" | "error";
  message: string;
};

export function FeedbackToast() {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [toast, setToast] = useState<ToastState | null>(null);

  useEffect(() => {
    const type = searchParams.get("feedbackType");
    const message = searchParams.get("feedbackMessage");

    if ((type === "success" || type === "error") && message) {
      setToast({ type, message });

      const nextParams = new URLSearchParams(searchParams.toString());
      nextParams.delete("feedbackType");
      nextParams.delete("feedbackMessage");
      const query = nextParams.toString();
      router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
    }
  }, [pathname, router, searchParams]);

  useEffect(() => {
    if (!toast) {
      return;
    }

    const timer = window.setTimeout(() => setToast(null), 4200);
    return () => window.clearTimeout(timer);
  }, [toast]);

  if (!toast) {
    return null;
  }

  return (
    <div className="fixed right-4 top-4 z-50 max-w-sm">
      <div
        className={clsx(
          "rounded-md border px-4 py-3 shadow-lg",
          toast.type === "success"
            ? "border-emerald-200 bg-emerald-50 text-emerald-800"
            : "border-red-200 bg-red-50 text-red-800",
        )}
        role={toast.type === "error" ? "alert" : "status"}
      >
        <div className="flex items-start gap-3">
          <p className="text-sm font-medium leading-6">{toast.message}</p>
          <button
            aria-label="关闭提示"
            className="ml-auto text-lg leading-5 opacity-70 transition hover:opacity-100"
            onClick={() => setToast(null)}
            type="button"
          >
            x
          </button>
        </div>
      </div>
    </div>
  );
}
