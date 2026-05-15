import { describe, expect, it } from "vitest";

describe("app smoke", () => {
  it("exports the app shell component", async () => {
    const mod = await import("../../components/layout/app-shell");
    expect(mod.AppShell).toBeTruthy();
  });
});
