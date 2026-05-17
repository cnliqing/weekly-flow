# WeeklyFlow 多项目支持设计稿

## 1. 目标

将当前单项目周报系统升级为多项目周报系统。首页作为项目门户，用户先选择或创建项目；进入项目后，只能配置和查看当前项目的成员、角色、周报周期、成员提交、AI 处理记录和历史周报。

本次升级采用项目上下文路由方案，项目之间的数据必须隔离。

## 2. 范围

### 2.1 包含

- 首页项目列表
- 创建项目
- 创建项目时配置团队成员
- 成员角色配置
- 项目内工作台
- 项目内成员维护
- 项目内周报周期创建和管理
- 项目内周报详情、汇总、润色和定稿
- 项目内历史周报
- 成员填写入口按项目和周期展示
- 数据库角色枚举迁移
- 真实数据库迁移执行

### 2.2 不包含

- 用户登录和权限认证
- 跨项目汇总报表
- 项目归档和删除保护策略
- Word、PDF、Markdown 导出
- 复杂审批流

## 3. 角色

系统只保留两类项目角色：

- 项目经理
- 开发

数据库枚举使用英文值：

```prisma
enum MemberRole {
  manager
  developer
}
```

旧数据迁移规则：

- `admin` 迁移为 `manager`
- `member` 迁移为 `developer`

页面展示统一使用中文：

- `manager` 显示为 `项目经理`
- `developer` 显示为 `开发`

## 4. 路由设计

### 4.1 首页

```text
/
```

首页改为项目门户：

- 展示项目列表
- 展示每个项目的成员数、开放周报数和最近周报
- 提供进入项目按钮
- 提供创建项目入口

### 4.2 项目内后台

```text
/projects/[projectId]
/projects/[projectId]/members
/projects/[projectId]/cycles
/projects/[projectId]/cycles/[cycleId]
/projects/[projectId]/history
/projects/[projectId]/settings
```

项目内页面必须从 URL 读取 `projectId`，所有查询必须带上当前项目边界。

### 4.3 成员填写入口

```text
/w
/w/[cycleId]
/w/[cycleId]/[memberId]
```

成员填写入口继续免登录。`/w` 按项目展示开放中的周报周期，避免多个项目同时开放时成员选错项目。

## 5. 创建项目流程

创建项目时一次完成项目和团队初始化：

1. 填写项目名称
2. 填写项目说明
3. 添加团队成员
4. 为每个成员选择角色
5. 创建成功后跳转到 `/projects/[projectId]`

第一版采用直接表单，不做多步骤向导。成员添加可以先使用多行文本或多行表单，默认角色为 `开发`，允许用户在创建时改为 `项目经理`。

## 6. 数据模型

### 6.1 Project

现有 `Project` 模型保留：

```prisma
model Project {
  id          String              @id @default(cuid())
  name        String              @unique
  description String?
  members     Member[]
  cycles      WeeklyReportCycle[]
  aiRuns      AiRunLog[]
  createdAt   DateTime            @default(now())
  updatedAt   DateTime            @updatedAt
}
```

项目名称继续全局唯一，避免首页项目列表出现同名项目。

### 6.2 Member

`Member` 保留 `projectId`，角色枚举改为 `manager/developer`：

```prisma
model Member {
  id          String             @id @default(cuid())
  projectId   String
  name        String
  role        MemberRole         @default(developer)
  isActive    Boolean            @default(true)
  project     Project            @relation(fields: [projectId], references: [id])
  submissions MemberSubmission[]
  createdAt   DateTime           @default(now())
  updatedAt   DateTime           @updatedAt

  @@unique([projectId, name])
}
```

同一项目内成员姓名唯一。不同项目可以有同名成员。

### 6.3 WeeklyReportCycle

现有 `WeeklyReportCycle` 模型保留：

```prisma
@@unique([projectId, weekStartDate])
```

同一项目同一开始日期只允许一个周报周期。不同项目可以创建相同日期的周报周期。

### 6.4 MemberSubmission

现有 `MemberSubmission` 模型保留：

```prisma
@@unique([cycleId, memberId])
```

成员提交时必须校验：

- `cycle.projectId === member.projectId`
- `member.role === "developer"` 或业务允许项目经理也填写时放宽为当前项目启用成员

本次设计采用只有 `developer` 进入成员填写入口。项目经理负责项目管理和汇总，不作为默认填写成员。

### 6.5 AiRunLog

现有 `AiRunLog.projectId` 保留。AI 相关 API 不允许 fallback 到第一个项目，必须从当前 `cycleId` 或显式 `projectId` 推导出项目。

## 7. 数据隔离规则

数据隔离在三层执行：

1. 数据库层：保留所有 `projectId` 关系和项目内唯一约束
2. 查询层：项目内页面所有查询必须加 `projectId`
3. 服务端校验层：涉及 `cycleId`、`memberId`、`submissionId` 的 API 必须校验数据归属

关键校验：

- 项目内周期详情：`cycle.projectId === params.projectId`
- 创建周期：使用 `params.projectId`，不使用默认项目
- 成员提交：`member.projectId === cycle.projectId`
- AI 汇总和润色：使用 `cycle.projectId` 写日志
- 承接检查：使用提交或周期所属项目写日志，不允许使用任意第一个项目
- 修改提交：读取 submission 后校验其 cycle 或 member 属于目标项目

## 8. 数据库迁移

涉及表结构或枚举变更时，直接连接 `.env.local` 中的 `DATABASE_URL` 指向的数据库执行迁移。

执行顺序：

1. 修改 `prisma/schema.prisma`
2. 生成 Prisma migration
3. 在 migration 中处理 `MemberRole` 枚举值迁移
4. 执行 migration 到真实数据库
5. 运行 `npm run prisma:generate`
6. 验证旧数据角色已经迁移：
   - `admin` -> `manager`
   - `member` -> `developer`

迁移必须保留现有项目、成员、周期、提交、汇总报告和 AI 日志。

## 9. 页面改造

### 9.1 首页

替换当前单项目介绍卡片，改为项目列表和创建项目入口。

### 9.2 项目工作台

新增项目工作台，展示当前项目的核心状态：

- 成员数
- 开放周期数
- 最近周期
- 最近提交数量
- 快捷入口：成员、周报、历史、设置

### 9.3 成员页

成员页只显示当前项目成员。新增成员时只能添加到当前项目，不再提供全局项目下拉框。

### 9.4 周报页

周报页只显示当前项目周期。创建周报时使用当前 `projectId`。

### 9.5 历史页

历史页只显示当前项目周期和定稿记录。

### 9.6 设置页

设置页的数据清空操作必须改为项目范围：

- 清空当前项目过程数据
- 清空当前项目全部数据

不能再默认清空所有项目数据。

## 10. API 改造

### 10.1 `/api/cycles`

创建周期必须接收 `projectId`，不再调用 `getDefaultProject()`。

### 10.2 `/api/cycles/[cycleId]/submissions`

保留现有项目归属校验。查询提交时建议只用于周期详情，周期本身已经带项目边界。

### 10.3 `/api/submissions/[submissionId]`

更新提交前必须读取 submission，并校验提交所属周期和成员关系。不允许只凭 `submissionId` 直接更新。

### 10.4 AI API

- summarize：继续通过 `cycle.projectId` 写日志
- polish：继续通过 `cycle.projectId` 写日志
- plan-check：移除 fallback 到第一个项目

## 11. 测试策略

### 11.1 单元测试

补充：

- 角色格式化测试
- 项目数据清理只影响目标项目
- API 归属校验相关工具函数测试

### 11.2 E2E 测试

覆盖核心流程：

1. 首页创建项目
2. 创建项目时添加项目经理和开发
3. 进入项目
4. 创建当前项目周报周期
5. 成员从 `/w` 选择对应项目周期
6. 开发提交周报
7. 项目内周报详情看到该提交
8. 创建第二个项目后，第一个项目页面不显示第二个项目成员和周期

## 12. 验收标准

- 首页显示项目列表和创建项目入口
- 可创建项目并配置团队成员和角色
- 角色只有项目经理和开发两类
- 进入项目后，成员、周报、历史、设置均限定在当前项目
- 不同项目可拥有同名成员
- 不同项目可创建相同日期的周报周期
- A 项目成员不能提交到 B 项目周期
- A 项目历史不显示 B 项目数据
- 数据库旧角色值完成迁移
- `npm test`、`npm run typecheck`、`npm run lint` 通过
