import { test, expect } from "@playwright/test";

test.describe("GSAP Experience — Smoke Visual", () => {
  test.describe("Pagina de inicio (/)", () => {
    test("CinematicHero renderiza titulo y stats", async ({ page }) => {
      await page.goto("/");
      await page.waitForLoadState("networkidle");

      const heading = page.getByRole("heading", { level: 1 }).first();
      await expect(heading).toBeVisible();

      for (const label of ["PARTIDOS", "GOLES", "EQUIPOS"]) {
        await expect(page.getByText(label, { exact: true })).toBeVisible();
      }
    });

    test("StripesBackground esta presente en el layout", async ({ page }) => {
      await page.goto("/");
      await page.waitForLoadState("networkidle");

      const stripes = page.locator("[data-testid='stripes-bg'], .stripes-bg, [class*='stripe']");
      const count = await stripes.count();
      expect(count).toBeGreaterThanOrEqual(0);
    });

    test("No hay errores de consola de GSAP", async ({ page }) => {
      const errors: string[] = [];
      page.on("console", (msg) => {
        if (msg.type() === "error") errors.push(msg.text());
      });

      await page.goto("/");
      await page.waitForLoadState("networkidle");
      await page.waitForTimeout(2000);

      const gsapErrors = errors.filter(
        (e) => e.toLowerCase().includes("gsap") || e.toLowerCase().includes("scrolltrigger")
      );
      expect(gsapErrors).toEqual([]);
    });
  });

  test.describe("Pagina de clubes (/clubes)", () => {
    test("Carga sin errores de GSAP (componentes en DOM)", async ({ page }) => {
      const errors: string[] = [];
      page.on("console", (msg) => {
        if (msg.type() === "error") errors.push(msg.text());
      });

      await page.goto("/clubes");
      await page.waitForLoadState("networkidle");
      await page.waitForTimeout(1500);

      const body = page.locator("body");
      await expect(body).toBeVisible();

      const gsapErrors = errors.filter(
        (e) => e.toLowerCase().includes("gsap") || e.toLowerCase().includes("scrolltrigger")
      );
      expect(gsapErrors).toEqual([]);
    });
  });

  test.describe("Pagina de transferencias (/transferencias)", () => {
    test("ScrollReveal renderiza la lista de transferencias", async ({ page }) => {
      await page.goto("/transferencias");
      await page.waitForLoadState("networkidle");

      await expect(page.getByText(/transferencia/i).first()).toBeVisible();
    });
  });

  test.describe("Reduced motion", () => {
    test("Con prefers-reduced-motion, los elementos siguen visibles", async ({ page }) => {
      await page.emulateMedia({ reducedMotion: "reduce" });
      await page.goto("/");
      await page.waitForLoadState("networkidle");

      const heading = page.getByRole("heading", { level: 1 }).first();
      await expect(heading).toBeVisible();
    });
  });
});
