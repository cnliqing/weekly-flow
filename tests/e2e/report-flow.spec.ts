import { expect, test } from "@playwright/test";

test("公开首页展示产品名称", async ({ page }) => {
  await page.goto("/");

  await expect(
    page.getByRole("heading", { name: /周报通 \/ WeeklyFlow/ }),
  ).toBeVisible();
});

test("管理后台无需登录即可访问", async ({ page }) => {
  await page.goto("/admin");

  await expect(
    page.getByRole("heading", { name: /周报通 \/ WeeklyFlow/ }),
  ).toBeVisible();
  await expect(page.getByRole("navigation", { name: "后台导航" })).toBeVisible();
});

test("成员填写入口显示统一侧边栏菜单", async ({ page }) => {
  await page.goto("/w");

  await expect(page.getByRole("navigation", { name: "主导航" })).toBeVisible();
  await expect(page.getByRole("link", { name: "工作台" })).toBeVisible();
  await expect(page.getByRole("link", { name: "填写" })).toBeVisible();
});

test("系统设置显示数据维护操作", async ({ page }) => {
  await page.goto("/admin/settings");

  await expect(
    page.getByRole("heading", { name: "数据维护" }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "清空，保留团队成员信息" }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "清空，不保留全部删除" }),
  ).toBeVisible();
  await expect(page.getByText("配置状态")).toHaveCount(0);
});
