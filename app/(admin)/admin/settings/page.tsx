import { Card } from "@/components/ui/card";

export const dynamic = "force-dynamic";

type ConfigStatus = {
  label: string;
  description: string;
  configured: boolean;
  detail?: string;
};

function isSet(value: string | undefined): boolean {
  return Boolean(value && value.trim().length > 0);
}

function maskEmail(email: string | undefined): string | undefined {
  if (!email) {
    return undefined;
  }

  const [name, domain] = email.split("@");

  if (!name || !domain) {
    return "已设置";
  }

  const visiblePrefix = name.slice(0, 2);
  return `${visiblePrefix}${"*".repeat(Math.max(name.length - 2, 2))}@${domain}`;
}

function buildConfigStatuses(): ConfigStatus[] {
  const hasDatabase = isSet(process.env.DATABASE_URL);
  const hasAuthSecret = isSet(process.env.AUTH_SECRET);
  const hasAdminEmail = isSet(process.env.ADMIN_EMAIL);
  const hasAdminPassword = isSet(process.env.ADMIN_PASSWORD);
  const hasAiBaseUrl = isSet(process.env.AI_BASE_URL);
  const hasAiKey = isSet(process.env.AI_API_KEY);
  const hasAiModel = isSet(process.env.AI_MODEL);

  return [
    {
      label: "数据库",
      description: "用于 Prisma 连接外部 PostgreSQL。",
      configured: hasDatabase,
      detail: hasDatabase ? "DATABASE_URL 已设置" : "缺少 DATABASE_URL",
    },
    {
      label: "Auth.js Secret",
      description: "用于签名管理员会话 token。",
      configured: hasAuthSecret,
      detail: hasAuthSecret ? "AUTH_SECRET 已设置" : "缺少 AUTH_SECRET",
    },
    {
      label: "管理员账号",
      description: "后台唯一管理员凭据，密码不会在页面展示。",
      configured: hasAdminEmail && hasAdminPassword,
      detail:
        hasAdminEmail && hasAdminPassword
          ? `邮箱 ${maskEmail(process.env.ADMIN_EMAIL)}`
          : "缺少 ADMIN_EMAIL 或 ADMIN_PASSWORD",
    },
    {
      label: "AI 配置",
      description: "用于计划承接检查、周报汇总和润色。",
      configured: hasAiBaseUrl && hasAiKey && hasAiModel,
      detail:
        hasAiBaseUrl && hasAiKey && hasAiModel
          ? `模型 ${process.env.AI_MODEL}`
          : "需设置 AI_BASE_URL、AI_API_KEY、AI_MODEL",
    },
    {
      label: "应用地址",
      description: "用于生成和展示应用访问地址。",
      configured: isSet(process.env.NEXT_PUBLIC_APP_URL),
      detail: process.env.NEXT_PUBLIC_APP_URL
        ? "NEXT_PUBLIC_APP_URL 已设置"
        : "未设置时默认使用 http://localhost:3000",
    },
  ];
}

export default function AdminSettingsPage() {
  const statuses = buildConfigStatuses();
  const configuredCount = statuses.filter((status) => status.configured).length;

  return (
    <section className="mx-auto flex max-w-6xl flex-col gap-8">
      <div>
        <p className="text-sm font-semibold text-accent">系统设置</p>
        <h2 className="mt-3 text-3xl font-semibold tracking-normal">环境配置</h2>
        <p className="mt-4 max-w-2xl text-sm leading-7 text-ink-700">
          检查生产运行所需环境变量是否已配置。页面只展示状态和脱敏信息，不展示数据库连接串、密码或 API Key 明文。
        </p>
      </div>

      <Card>
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <h3 className="text-xl font-semibold">配置状态</h3>
            <p className="mt-2 text-sm text-ink-500">
              {configuredCount} / {statuses.length} 项已配置
            </p>
          </div>
          <span className="rounded-md border border-line bg-paper px-3 py-2 text-sm font-semibold text-ink-700">
            {process.env.NODE_ENV ?? "development"}
          </span>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {statuses.map((status) => (
            <div
              className="rounded-md border border-line bg-paper/50 p-4"
              key={status.label}
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h4 className="font-semibold text-ink-900">{status.label}</h4>
                  <p className="mt-2 text-sm leading-6 text-ink-700">
                    {status.description}
                  </p>
                </div>
                <span
                  className={
                    status.configured
                      ? "rounded-full bg-accent/10 px-3 py-1 text-xs font-semibold text-accent"
                      : "rounded-full bg-red-50 px-3 py-1 text-xs font-semibold text-red-700"
                  }
                >
                  {status.configured ? "已配置" : "未配置"}
                </span>
              </div>
              {status.detail ? (
                <p className="mt-3 text-xs text-ink-500">{status.detail}</p>
              ) : null}
            </div>
          ))}
        </div>
      </Card>
    </section>
  );
}
