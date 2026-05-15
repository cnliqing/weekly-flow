# 周报通 / WeeklyFlow

周报通是一个单项目周报系统。当前阶段提供 Next.js、TypeScript、Tailwind CSS 与 Vitest 的基础骨架，后续会逐步加入成员管理、周报周期、提交与汇总能力。

## 本地开发

```bash
npm install
npm run dev
```

默认开发地址为 `http://localhost:3000`。

## 常用命令

```bash
npm test
npm run lint
npm run typecheck
npm run build
```

## 环境变量

复制 `.env.example` 为 `.env.local` 后按需调整：

```bash
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

当前骨架只读取应用访问地址，不包含数据库、认证或 AI 服务配置。
