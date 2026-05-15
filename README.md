# 周报通 / WeeklyFlow

周报通是一个单项目周报系统。当前阶段提供 Next.js、TypeScript、Tailwind CSS 与 Vitest 的基础骨架，后续会逐步加入成员管理、周报周期、提交与汇总能力。

## 本地开发

项目依赖 PostgreSQL。启动前先准备本地数据库，并在 `.env.local` 中配置 `DATABASE_URL`。

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
```

`DATABASE_URL` 用于 Prisma 连接 PostgreSQL。首次安装依赖后运行 `npm run prisma:generate` 生成 Prisma Client；数据库 schema 就绪后可运行 `npm run db:seed` 写入默认项目、成员和当前周报周期。
