import { test, expect } from "@playwright/test";

test.describe("Comparación de Clubes — Radar", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/historial");
    await page.waitForLoadState("networkidle");
  });

  test("El tab 'Comparar Clubes' aparece y es clickeable", async ({ page }) => {
    const tab = page.getByRole("button", { name: /Comparar Clubes/i });
    await expect(tab).toBeVisible();
    await tab.click();

    await expect(page.getByText("Club A")).toBeVisible();
    await expect(page.getByText("Club B")).toBeVisible();
  });

  test("Los selectores de club se cargan con opciones", async ({ page }) => {
    await page.getByRole("button", { name: /Comparar Clubes/i }).click();

    const selectA = page.locator("select").nth(0);
    const selectB = page.locator("select").nth(1);

    await expect(selectA).toBeVisible();
    await expect(selectB).toBeVisible();

    // Wait for options to load (beyond the default "Seleccionar club")
    await expect
      .poll(async () => selectA.locator("option").count(), { timeout: 10000 })
      .toBeGreaterThan(1);
    await expect
      .poll(async () => selectB.locator("option").count(), { timeout: 10000 })
      .toBeGreaterThan(1);
  });

  test("Seleccionar dos clubes diferentes muestra el radar", async ({ page }) => {
    await page.getByRole("button", { name: /Comparar Clubes/i }).click();

    const selectA = page.locator("select").nth(0);
    const selectB = page.locator("select").nth(1);

    // Wait for clubs to load
    await expect
      .poll(async () => selectA.locator("option").count(), { timeout: 10000 })
      .toBeGreaterThan(1);

    // Select first two different clubs
    const optionsA = await selectA.locator("option").allTextContents();
    const validOptions = optionsA.filter((o) => o !== "Seleccionar club" && o !== "Cargando clubes...");
    expect(validOptions.length).toBeGreaterThanOrEqual(2);

    await selectA.selectOption({ label: validOptions[0] });
    await selectB.selectOption({ label: validOptions[1] });

    // Wait for radar to appear (SVG with radar polygons)
    const svg = page.locator("svg");
    await expect(svg).toBeVisible({ timeout: 10000 });

    // Check that radar polygons exist (paths inside SVG)
    const paths = svg.locator("path");
    await expect(paths.first()).toBeVisible({ timeout: 10000 });

    // Check legend shows both club names
    await expect(page.getByText(validOptions[0])).toBeVisible();
    await expect(page.getByText(validOptions[1])).toBeVisible();
  });

  test("Seleccionar el mismo club muestra advertencia", async ({ page }) => {
    await page.getByRole("button", { name: /Comparar Clubes/i }).click();

    const selectA = page.locator("select").nth(0);
    const selectB = page.locator("select").nth(1);
    await expect
      .poll(async () => selectA.locator("option").count(), { timeout: 10000 })
      .toBeGreaterThan(1);

    const options = await selectA.locator("option").allTextContents();
    const validOptions = options.filter((o) => o !== "Seleccionar club" && o !== "Cargando clubes...");
    expect(validOptions.length).toBeGreaterThanOrEqual(1);

    await selectA.selectOption({ label: validOptions[0] });
    await selectB.selectOption({ label: validOptions[0] });

    await expect(page.getByText("elegí dos clubes diferentes")).toBeVisible({ timeout: 5000 });
  });

  test("La tabla de métricas muestra las 6 métricas", async ({ page }) => {
    await page.getByRole("button", { name: /Comparar Clubes/i }).click();

    const selectA = page.locator("select").nth(0);
    const selectB = page.locator("select").nth(1);
    await expect
      .poll(async () => selectA.locator("option").count(), { timeout: 10000 })
      .toBeGreaterThan(1);

    const options = await selectA.locator("option").allTextContents();
    const validOptions = options.filter((o) => o !== "Seleccionar club" && o !== "Cargando clubes...");
    expect(validOptions.length).toBeGreaterThanOrEqual(2);

    await selectA.selectOption({ label: validOptions[0] });
    await selectB.selectOption({ label: validOptions[1] });

    // Wait for stats table
    const table = page.locator("table");
    await expect(table).toBeVisible({ timeout: 10000 });

    // Check all 6 metrics are in the table
    for (const metric of ["Ataque", "Defensa", "Rendimiento", "Palmarés", "Gol Individual", "Actividad Mercado"]) {
      await expect(table.getByText(metric)).toBeVisible();
    }
  });

  test("No hay errores de consola al cargar comparación", async ({ page }) => {
    const errors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") errors.push(msg.text());
    });

    await page.getByRole("button", { name: /Comparar Clubes/i }).click();

    const selectA = page.locator("select").nth(0);
    const selectB = page.locator("select").nth(1);
    await expect
      .poll(async () => selectA.locator("option").count(), { timeout: 10000 })
      .toBeGreaterThan(1);

    const options = await selectA.locator("option").allTextContents();
    const validOptions = options.filter((o) => o !== "Seleccionar club" && o !== "Cargando clubes...");
    expect(validOptions.length).toBeGreaterThanOrEqual(2);

    await selectA.selectOption({ label: validOptions[0] });
    await selectB.selectOption({ label: validOptions[1] });

    await page.waitForTimeout(3000);

    const criticalErrors = errors.filter(
      (e) =>
        e.toLowerCase().includes("uncaught") ||
        e.toLowerCase().includes("unhandled") ||
        e.toLowerCase().includes("cannot read") ||
        e.toLowerCase().includes("typeerror")
    );
    expect(criticalErrors).toEqual([]);
  });
});
