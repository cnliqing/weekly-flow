import { expect, test } from "@playwright/test";

test("首页展示项目门户", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("heading", { exact: true, name: "项目" })).toBeVisible();
  await expect(
    page.getByRole("main").getByRole("link", { exact: true, name: "创建项目" }),
  ).toBeVisible();
});

test("旧管理后台入口重定向到项目门户", async ({ page }) => {
  await page.goto("/admin");

  await expect(page).toHaveURL("/");
  await expect(page.getByRole("heading", { exact: true, name: "项目" })).toBeVisible();
});

test("成员填写入口显示统一侧边栏菜单", async ({ page }) => {
  await page.goto("/w");

  await expect(page.getByRole("navigation", { name: "主导航" })).toBeVisible();
  await expect(page.getByRole("link", { exact: true, name: "项目" })).toBeVisible();
  await expect(page.getByRole("link", { exact: true, name: "创建项目" })).toBeVisible();
  await expect(page.getByRole("link", { exact: true, name: "填写" })).toBeVisible();
});
