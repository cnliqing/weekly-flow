# 周报通 / WeeklyFlow

周报通是一个单项目周报系统，支持开放工作台维护项目与成员、创建周报周期、成员免登录提交、计划承接提示、AI 汇总/润色、历史查看和单机应用部署。

## 本地开发

项目依赖 PostgreSQL。启动前先准备本地数据库，并在 `.env.local` 中配置 `DATABASE_URL` 和按需配置 AI 服务。

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
npm run test:e2e
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
AI_BASE_URL="https://your-openai-compatible-endpoint.example.com/v1"
AI_API_KEY="replace-with-your-ai-api-key"
AI_MODEL="your-model-name"
```

`DATABASE_URL` 用于 Prisma 连接 PostgreSQL。系统采用开放工作台模式，不需要管理员账号、密码或会话密钥；项目成员仍通过 Prisma `Member` 作为业务人员维护。

`AI_BASE_URL`、`AI_API_KEY` 和 `AI_MODEL` 用于成员提交时的计划承接检查，以及工作台中的 AI 汇总和润色。接口按 OpenAI-compatible `/chat/completions` 协议调用，可配置任意兼容云端模型服务，不固定为 OpenAI；缺少配置时系统会返回清晰错误并记录 AI 运行日志，不会生成假内容。

首次安装依赖后运行 `npm run prisma:generate` 生成 Prisma Client；数据库 schema 就绪后可运行 `npm run db:seed` 写入默认项目、成员和当前周报周期。

## 工作台

访问 `/admin` 可直接进入开放工作台，维护项目、成员、周报周期、汇总定稿和历史记录。系统不包含后台登录、注册或用户表；成员从 `/w` 选择开放周报周期和姓名后填写。
