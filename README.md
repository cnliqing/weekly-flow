# 周报通 / WeeklyFlow

周报通是一个单项目周报系统。当前阶段提供 Next.js、TypeScript、Tailwind CSS 与 Vitest 的基础骨架，后续会逐步加入成员管理、周报周期、提交与汇总能力。

## 本地开发

项目依赖 PostgreSQL。启动前先准备本地数据库，并在 `.env.local` 中配置 `DATABASE_URL`、Auth.js secret 和管理员账号。

```bash
npm install
npm run prisma:generate
npm run dev
```

默认开发地址为 `http://localhost:3000`。

## 常用命令

```bash
npm test
npm run lint
npm run typecheck
npm run build
npm run prisma:generate
npx prisma validate
npm run db:seed
```

## 环境变量

复制 `.env.example` 为 `.env.local` 后按需调整：

```bash
NEXT_PUBLIC_APP_URL=http://localhost:3000
DATABASE_URL="postgresql://user:password@localhost:5432/weeklyflow?schema=public"
AUTH_SECRET="replace-with-a-random-secret"
ADMIN_EMAIL="admin@example.com"
ADMIN_PASSWORD="change-me"
AI_BASE_URL="https://your-openai-compatible-endpoint.example.com/v1"
AI_API_KEY="replace-with-your-ai-api-key"
AI_MODEL="your-model-name"
```

`DATABASE_URL` 用于 Prisma 连接 PostgreSQL。`AUTH_SECRET` 用于 Auth.js 签名会话 token，建议使用随机长字符串；`ADMIN_EMAIL` 和 `ADMIN_PASSWORD` 是后台唯一管理员登录凭据。项目成员不需要登录，仍通过 Prisma `Member` 作为业务人员维护。

`AI_BASE_URL`、`AI_API_KEY` 和 `AI_MODEL` 用于管理员侧 AI 汇总、润色和计划承接检查。接口按 OpenAI-compatible `/chat/completions` 协议调用，可配置任意兼容云端模型服务，不固定为 OpenAI；缺少配置时系统会返回清晰错误并记录 AI 运行日志，不会生成假内容。

首次安装依赖后运行 `npm run prisma:generate` 生成 Prisma Client；数据库 schema 就绪后可运行 `npm run db:seed` 写入默认项目、成员和当前周报周期。

## 管理后台

访问 `/login` 使用 `.env.local` 中的管理员邮箱和密码登录。登录后进入 `/admin`，可查看后台总览、项目、成员、周报和历史入口。当前版本只实现管理员凭据登录，不包含成员登录、注册或用户表。
