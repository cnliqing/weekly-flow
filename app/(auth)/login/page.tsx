import { redirect } from "next/navigation";
import { Card } from "@/components/ui/card";
import { LoginForm } from "@/components/forms/login-form";
import { getAdminSession } from "@/lib/auth";
import { sanitizeAdminCallbackUrl } from "@/lib/auth-helpers";

type LoginPageProps = {
  searchParams?: Promise<{
    callbackUrl?: string | string[];
  }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const session = await getAdminSession();
  const resolvedSearchParams = await searchParams;
  const callbackUrl = sanitizeAdminCallbackUrl(
    resolvedSearchParams?.callbackUrl,
  );

  if (session) {
    redirect(callbackUrl);
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-paper px-5 py-12 text-ink-900">
      <section className="w-full max-w-md">
        <div className="mb-8">
          <p className="text-sm font-semibold text-accent">周报通 / WeeklyFlow</p>
          <h1 className="mt-3 text-3xl font-semibold tracking-normal">
            管理员登录
          </h1>
          <p className="mt-3 text-sm leading-7 text-ink-700">
            使用环境变量中配置的管理员账号进入后台。成员填写周报无需登录。
          </p>
        </div>

        <Card>
          <LoginForm callbackUrl={callbackUrl} />
        </Card>
      </section>
    </main>
  );
}
