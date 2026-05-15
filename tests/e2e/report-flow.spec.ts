import { expect, test } from "@playwright/test";

test("公开首页展示产品名称", async ({ page }) => {
  await page.goto("/");

  await expect(
    page.getByRole("heading", { name: /周报通 \/ WeeklyFlow/ }),
  ).toBeVisible();
});

test("登录页展示管理员登录表单", async ({ page }) => {
  await page.goto("/login");

  await expect(
    page.getByRole("heading", { name: "管理员登录" }),
  ).toBeVisible();
  await expect(page.getByLabel("邮箱")).toBeVisible();
  await expect(page.getByLabel("密码")).toBeVisible();
});
