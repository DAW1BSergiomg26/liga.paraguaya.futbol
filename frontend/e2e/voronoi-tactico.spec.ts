// frontend/e2e/voronoi-tactico.spec.ts
import { test, expect } from "@playwright/test";

test.describe("Voronoi Táctico — Cobertura de formación", () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to a team tactical page (mock data, any team ID works)
    await page.goto("/tactico/equipo/Olimpia");
    await page.waitForLoadState("networkidle");
  });

  test("El botón 'Zonas de cobertura' está visible", async ({ page }) => {
    const toggle = page.getByRole("button", { name: /Zonas de cobertura/i });
    await expect(toggle).toBeVisible();
  });

  test("Click en toggle muestra disclaimer", async ({ page }) => {
    const toggle = page.getByRole("button", { name: /Zonas de cobertura/i });
    await toggle.click();

    await expect(
      page.getByText("Distribución teórica según formación")
    ).toBeVisible();
  });

  test("Click en toggle nuevamente oculta disclaimer", async ({ page }) => {
    const toggle = page.getByRole("button", { name: /Zonas de cobertura/i });
    await toggle.click();
    await expect(page.getByText("Distribución teórica según formación")).toBeVisible();

    await toggle.click();
    await expect(
      page.getByText("Distribución teórica según formación")
    ).not.toBeVisible();
  });

  test("SVG con paths de Voronoi aparece al activar", async ({ page }) => {
    const toggle = page.getByRole("button", { name: /Zonas de cobertura/i });
    await toggle.click();

    const svg = page.locator("svg.pointer-events-none");
    await expect(svg).toBeVisible({ timeout: 5000 });

    const paths = svg.locator("path");
    const count = await paths.count();
    expect(count).toBeGreaterThanOrEqual(11);
  });

  test("Cambia de formación y el Voronoi se recalcula", async ({ page }) => {
    const toggle = page.getByRole("button", { name: /Zonas de cobertura/i });
    await toggle.click();

    const svg = page.locator("svg.pointer-events-none");
    await expect(svg).toBeVisible({ timeout: 5000 });
    const initialPaths = await svg.locator("path").count();

    // Change formation
    const select = page.locator("select");
    await select.selectOption("4-4-2");

    // Wait for GSAP animation to settle
    await page.waitForTimeout(600);

    // Paths should still exist (same count, different shapes)
    const afterPaths = await svg.locator("path").count();
    expect(afterPaths).toBe(initialPaths);
  });

  test("No errores de consola al usar Voronoi", async ({ page }) => {
    const errors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") errors.push(msg.text());
    });

    const toggle = page.getByRole("button", { name: /Zonas de cobertura/i });
    await toggle.click();
    await page.waitForTimeout(1000);

    const criticalErrors = errors.filter(
      (e) =>
        e.toLowerCase().includes("uncaught") ||
        e.toLowerCase().includes("unhandled") ||
        e.toLowerCase().includes("typeerror")
    );
    expect(criticalErrors).toEqual([]);
  });
});
