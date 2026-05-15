"use client";

import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";

type LoginFormProps = {
  callbackUrl?: string;
};

export function LoginForm({ callbackUrl = "/admin" }: LoginFormProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const formData = new FormData(event.currentTarget);
    const result = await signIn("credentials", {
      callbackUrl,
      email: String(formData.get("email") ?? ""),
      password: String(formData.get("password") ?? ""),
      redirect: false,
    });

    setIsSubmitting(false);

    if (!result || result.error) {
      setError("邮箱或密码不正确，请检查管理员环境变量配置。");
      return;
    }

    router.push(result.url ?? callbackUrl);
    router.refresh();
  }

  return (
    <form className="flex flex-col gap-5" onSubmit={handleSubmit}>
      <label className="flex flex-col gap-2 text-sm font-medium text-ink-700">
        管理员邮箱
        <input
          autoComplete="email"
          className="h-11 rounded-md border border-line bg-white px-3 text-base text-ink-900 outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20"
          name="email"
          required
          type="email"
        />
      </label>

      <label className="flex flex-col gap-2 text-sm font-medium text-ink-700">
        管理员密码
        <input
          autoComplete="current-password"
          className="h-11 rounded-md border border-line bg-white px-3 text-base text-ink-900 outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20"
          name="password"
          required
          type="password"
        />
      </label>

      {error ? (
        <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      ) : null}

      <Button className="w-full" disabled={isSubmitting} type="submit">
        {isSubmitting ? "正在登录..." : "登录后台"}
      </Button>
    </form>
  );
}
