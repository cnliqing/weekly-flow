# 周报通 / WeeklyFlow 部署说明

本文档面向单机应用部署。PostgreSQL、AI 模型服务等中间件默认使用已有外部服务，本项目不提供 docker-compose，也不在容器内编排数据库。

## 运行依赖

- Node.js 22
- npm
- 可访问的 PostgreSQL
- 可选：OpenAI-compatible `/chat/completions` AI 服务

## 必要环境变量

```bash
NEXT_PUBLIC_APP_URL="https://weeklyflow.example.com"
DATABASE_URL="postgresql://user:password@db-host:5432/weeklyflow?schema=public"
```

`DATABASE_URL` 指向外部 PostgreSQL。系统采用开放工作台模式，不需要配置管理员账号、密码或会话签名密钥。

## AI 环境变量

```bash
AI_BASE_URL="https://your-openai-compatible-endpoint.example.com/v1"
AI_API_KEY="replace-with-your-ai-api-key"
AI_MODEL="your-model-name"
```

缺少 AI 配置时，计划承接检查、汇总和润色会返回清晰错误，不会生成假内容。应用仍可用于成员提交和手动定稿。

## 应用打包运行

```bash
npm ci
npm run prisma:generate
npm run build
npm run start
```

首次部署或 schema 变更后，请先在目标数据库上执行 Prisma 迁移或同步流程，再启动应用。当前项目已提供 seed：

```bash
npm run db:seed
```

`db:seed` 会写入默认项目、成员和当前周报周期。生产环境请确认这符合预期后再执行，避免重复初始化业务数据。

## Docker 镜像

构建镜像：

```bash
docker build -t weeklyflow:latest .
```

运行容器：

```bash
docker run --rm -p 3000:3000 \
  -e NEXT_PUBLIC_APP_URL="https://weeklyflow.example.com" \
  -e DATABASE_URL="postgresql://user:password@db-host:5432/weeklyflow?schema=public" \
  -e AI_BASE_URL="https://your-openai-compatible-endpoint.example.com/v1" \
  -e AI_API_KEY="replace-with-your-ai-api-key" \
  -e AI_MODEL="your-model-name" \
  weeklyflow:latest
```

容器只包含 Next.js 应用和 Prisma Client，不包含 PostgreSQL。请确保容器网络可以访问 `DATABASE_URL` 中的数据库地址。

## 部署前检查

```bash
npm run lint
npm run typecheck
DATABASE_URL='postgresql://user:pass@localhost:5432/weeklyflow?schema=public' npx prisma validate
npm run build
```

如果目标环境没有执行过 `prisma generate`，请在构建前运行 `npm run prisma:generate`。如果需要初始化演示数据，可在数据库 schema 就绪后运行 `npm run db:seed`。
