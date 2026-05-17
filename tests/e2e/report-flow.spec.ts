import { expect, test } from "@playwright/test";

test("首页展示项目门户", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("heading", { exact: true, name: "项目" })).toBeVisible();
  await expect(
    page.getByRole("link", { exact: true, name: "项目列表" }),
  ).toHaveAttribute("aria-current", "page");
  await expect(
    page.getByRole("main").getByRole("link", { exact: true, name: "创建项目" }),
  ).toBeVisible();
});

test("旧管理后台入口重定向到项目门户", async ({ page }) => {
  await page.goto("/admin");

  await expect(page).toHaveURL("/");
  await expect(page.getByRole("heading", { exact: true, name: "项目" })).toBeVisible();
});

test("创建项目时可以增减团队成员", async ({ page }) => {
  await page.goto("/projects/new");

  const memberNameInputs = page.locator('input[name="memberName"]');
  await expect(memberNameInputs).toHaveCount(1);

  await page.getByRole("button", { name: "添加成员" }).click();
  await expect(memberNameInputs).toHaveCount(2);

  await page.getByRole("button", { name: "删除成员" }).nth(1).click();
  await expect(memberNameInputs).toHaveCount(1);
});

test("成员填写入口显示统一侧边栏菜单", async ({ page }) => {
  await page.goto("/w");

  await expect(page.getByRole("navigation", { name: "主导航" })).toBeVisible();
  await expect(page.getByRole("link", { exact: true, name: "项目列表" })).toBeVisible();
  await expect(page.getByRole("link", { exact: true, name: "新建项目" })).toBeVisible();
  await expect(
    page.locator('nav[aria-label="主导航"] a[aria-current="page"]'),
  ).toHaveCount(0);
  await expect(page.getByRole("link", { exact: true, name: "填写" })).toHaveCount(0);
});
