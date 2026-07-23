# Fase 3B — Voronoi Táctico de Formación: Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a Voronoi coverage zone overlay on the tactical formation field using d3-delaunay, with animated transitions on formation change and a mandatory honesty disclaimer.

**Architecture:** Pure computation utilities (no React) → SVG overlay in existing TacticalField → GSAP animation on formation change → disclaimer text. One file modified (`TacticalField.tsx`), two utility files created, one test file created.

**Tech Stack:** d3-delaunay (already installed v6.0.4), GSAP (already installed v3.15.0), React useState/useMemo, TypeScript.

## Global Constraints

- **Alcance:** Voronoi MATEMÁTICO sobre posiciones de formación teórica. NO datos de tracking real.
- **Regla de honestidad:** Disclaimer visible SIEMPRE que la capa Voronoi esté activa: "Distribución teórica según formación — no representa el movimiento real de un partido."
- **Librería:** d3-delaunay YA instalada. NO instalar dependencias nuevas.
- **Posiciones:** Reusar EXACTAMENTE `FORMACIONES_POSICIONES` de TacticalField.tsx (x/y 0-1). No inventar coordenadas.
- **Paleta APF:** Rojo #CC001C (equipo A), Azul #00619E (equipo B), Dorado #FFCC00 (líneas).
- **Animación:** GSAP `attr` tween sobre paths SVG, 0.4s, ease `power2.out`.
- **TDD:** Tests ANTES de implementar. `npm test` debe pasar antes de cada commit.
- **Verificación:** `npm run build` limpio (0 errores TS) + `python -m pytest backend/tests/ -v` 181+ verdes + E2E Playwright.
- **Sin tocar backend.** Todo es frontend puro.
- **Comunicación:** Spanish castellano. Commits en inglés.

---

## File Structure

| Archivo | Responsabilidad |
|---------|-----------------|
| `frontend/src/lib/voronoi.ts` | **CREAR** — Funciones puras: `computeVoronoiPaths()` (d3-delaunay → paths SVG) y `computeCellCentroids()` (para animación) |
| `frontend/src/components/tactico/TacticalField.tsx` | **MODIFICAR** — Agregar toggle Voronoi, SVG overlay, GSAP animation, disclaimer |
| `frontend/src/lib/__tests__/voronoi.test.ts` | **CREAR** — Tests unitarios del cálculo Voronoi |
| `frontend/e2e/voronoi-tactico.spec.ts` | **CREAR** — Tests E2E Playwright |

---

### Task 1: Voronoi computation tests (TDD RED)

**Files:**
- Create: `frontend/src/lib/__tests__/voronoi.test.ts`
- Create (empty placeholder for import): `frontend/src/lib/voronoi.ts` — just `export {}` so test can import

**Interfaces:**
- Consumes: Nothing (first task)
- Produces: `computeVoronoiPaths(points, bounds)` returning `{d: string, cellIndex: number}[]`; `computeCellCentroids(points, bounds)` returning `{x: number, y: number}[]`

- [ ] **Step 1: Create empty placeholder**

```typescript
// frontend/src/lib/voronoi.ts
export {};
```

- [ ] **Step 2: Write the failing tests**

```typescript
// frontend/src/lib/__tests__/voronoi.test.ts
import { computeVoronoiPaths, computeCellCentroids } from "../voronoi";

const BOUNDS = { xmin: 0, ymin: 0, xmax: 100, ymax: 150 };

describe("computeVoronoiPaths", () => {
  it("returns 11 cells for 11 points", () => {
    const points = Array.from({ length: 11 }, (_, i) => ({
      x: 10 + i * 8,
      y: 20 + (i % 3) * 30,
    }));
    const cells = computeVoronoiPaths(points, BOUNDS);
    expect(cells).toHaveLength(11);
    cells.forEach((cell) => {
      expect(typeof cell.d).toBe("string");
      expect(cell.d.length).toBeGreaterThan(0);
      expect(cell.d.startsWith("M")).toBe(true);
    });
  });

  it("returns 22 cells for 22 points (match view)", () => {
    const points = Array.from({ length: 22 }, (_, i) => ({
      x: 5 + (i % 11) * 8.5,
      y: i < 11 ? 20 + (i % 4) * 30 : 90 + (i % 4) * 15,
    }));
    const cells = computeVoronoiPaths(points, BOUNDS);
    expect(cells).toHaveLength(22);
  });

  it("handles collinear points without crashing", () => {
    const points = Array.from({ length: 11 }, (_, i) => ({
      x: 50,
      y: 10 + i * 12,
    }));
    const cells = computeVoronoiPaths(points, BOUNDS);
    expect(cells.length).toBeGreaterThanOrEqual(1);
  });

  it("handles points at field edges", () => {
    const points = [
      { x: 0, y: 0 },
      { x: 100, y: 0 },
      { x: 0, y: 150 },
      { x: 100, y: 150 },
      { x: 50, y: 75 },
      { x: 50, y: 0 },
      { x: 50, y: 150 },
      { x: 0, y: 75 },
      { x: 100, y: 75 },
      { x: 25, y: 75 },
      { x: 75, y: 75 },
    ];
    const cells = computeVoronoiPaths(points, BOUNDS);
    expect(cells).toHaveLength(11);
  });
});

describe("computeCellCentroids", () => {
  it("returns same count as input points", () => {
    const points = Array.from({ length: 11 }, (_, i) => ({
      x: 10 + i * 8,
      y: 20 + (i % 3) * 30,
    }));
    const centroids = computeCellCentroids(points, BOUNDS);
    expect(centroids).toHaveLength(11);
  });

  it("centroid coordinates are within bounds", () => {
    const points = Array.from({ length: 11 }, (_, i) => ({
      x: 10 + i * 8,
      y: 20 + (i % 3) * 30,
    }));
    const centroids = computeCellCentroids(points, BOUNDS);
    centroids.forEach((c) => {
      expect(c.x).toBeGreaterThanOrEqual(0);
      expect(c.x).toBeLessThanOrEqual(100);
      expect(c.y).toBeGreaterThanOrEqual(0);
      expect(c.y).toBeLessThanOrEqual(150);
    });
  });
});
```

- [ ] **Step 3: Run tests to verify they fail**

Run: `cd "C:\Users\astur\Desktop\liga.paraguaya.futbol\frontend" && npx vitest run src/lib/__tests__/voronoi.test.ts`
Expected: FAIL — `computeVoronoiPaths is not a function` or similar import error.

- [ ] **Step 4: Commit (TDD RED)**

```bash
cd "C:\Users\astur\Desktop\liga.paraguaya.futbol" && git add frontend/src/lib/__tests__/voronoi.test.ts frontend/src/lib/voronoi.ts && git commit -m "test(voronoi): add failing tests for voronoi computation"
```

---

### Task 2: Voronoi computation utility (TDD GREEN)

**Files:**
- Modify: `frontend/src/lib/voronoi.ts` — implement `computeVoronoiPaths` and `computeCellCentroids`
- Test: `frontend/src/lib/__tests__/voronoi.test.ts` — should now pass

**Interfaces:**
- Consumes: Nothing
- Produces: Two functions used by TacticalField.tsx in Task 5:
  - `computeVoronoiPaths(points: {x: number, y: number}[], bounds: {xmin: number, ymin: number, xmax: number, ymax: number}): {d: string, cellIndex: number}[]`
  - `computeCellCentroids(points: {x: number, y: number}[], bounds: {xmin: number, ymin: number, xmax: number, ymax: number}): {x: number, y: number}[]`

- [ ] **Step 1: Implement the functions**

```typescript
// frontend/src/lib/voronoi.ts
import { Delaunay } from "d3-delaunay";

interface Point {
  x: number;
  y: number;
}

interface Bounds {
  xmin: number;
  ymin: number;
  xmax: number;
  ymax: number;
}

export interface VoronoiPath {
  d: string;
  cellIndex: number;
}

export function computeVoronoiPaths(
  points: Point[],
  bounds: Bounds
): VoronoiPath[] {
  if (points.length === 0) return [];

  const delaunay = Delaunay.from(
    points,
    (p) => p.x,
    (p) => p.y
  );
  const voronoi = delaunay.voronoi([
    bounds.xmin,
    bounds.ymin,
    bounds.xmax,
    bounds.ymax,
  ]);

  return points.map((_, i) => ({
    d: voronoi.renderCell(i),
    cellIndex: i,
  }));
}

export function computeCellCentroids(
  points: Point[],
  bounds: Bounds
): Point[] {
  if (points.length === 0) return [];

  const delaunay = Delaunay.from(
    points,
    (p) => p.x,
    (p) => p.y
  );
  const voronoi = delaunay.voronoi([
    bounds.xmin,
    bounds.ymin,
    bounds.xmax,
    bounds.ymax,
  ]);

  return points.map((_, i) => {
    const cell = voronoi.renderCell(i);
    // Parse SVG path to compute centroid via polygon approximation
    const coords = parseSvgPath(cell);
    if (coords.length === 0) return points[i];

    const cx = coords.reduce((sum, c) => sum + c.x, 0) / coords.length;
    const cy = coords.reduce((sum, c) => sum + c.y, 0) / coords.length;
    return { x: cx, y: cy };
  });
}

function parseSvgPath(d: string): Point[] {
  const points: Point[] = [];
  const regex = /([ML])([\d.]+),([\d.]+)/g;
  let match;
  while ((match = regex.exec(d)) !== null) {
    points.push({
      x: parseFloat(match[2]),
      y: parseFloat(match[3]),
    });
  }
  return points;
}
```

- [ ] **Step 2: Run tests to verify they pass**

Run: `cd "C:\Users\astur\Desktop\liga.paraguaya.futbol\frontend" && npx vitest run src/lib/__tests__/voronoi.test.ts`
Expected: All tests PASS.

- [ ] **Step 3: Commit (TDD GREEN)**

```bash
cd "C:\Users\astur\Desktop\liga.paraguaya.futbol" && git add frontend/src/lib/voronoi.ts && git commit -m "feat(voronoi): implement computeVoronoiPaths and computeCellCentroids with d3-delaunay"
```

---

### Task 3: SVG overlay + toggle state in TacticalField

**Files:**
- Modify: `frontend/src/components/tactico/TacticalField.tsx`

**Interfaces:**
- Consumes: `computeVoronoiPaths` from `@/lib/voronoi`
- Produces: Toggle state `showVoronoi` exposed via the "Zonas de cobertura" button in the FormationSelector bar

- [ ] **Step 1: Add toggle state and conditional SVG overlay**

In `TacticalField.tsx`, make these changes:

1. Add imports at top:
```typescript
import { useMemo } from "react";  // add useMemo to existing useState import
import { computeVoronoiPaths } from "@/lib/voronoi";
```

2. Add state after existing `useState` calls (around line 104):
```typescript
const [showVoronoi, setShowVoronoi] = useState(false);
```

3. Add Voronoi computation after `jugadoresConPosicion` (around line 113):
```typescript
const FIELD_BOUNDS = { xmin: 0, ymin: 0, xmax: 100, ymax: 150 };

const voronoiPaths = useMemo(() => {
  if (!showVoronoi || jugadoresConPosicion.length < 2) return [];
  return computeVoronoiPaths(
    jugadoresConPosicion.map((j) => ({ x: j.x * 100, y: j.y * 150 })),
    FIELD_BOUNDS
  );
}, [showVoronoi, jugadoresConPosicion]);
```

4. Add the toggle button next to FormationSelector. Replace the existing FormationSelector wrapper div (lines 117-124) with:
```tsx
<div className="flex items-center justify-between mb-4">
  {titulo && <h3 className="text-lg font-bold text-white">{titulo}</h3>}
  <div className="flex items-center gap-3">
    <FormationSelector
      formaciones={formacionesDisponibles}
      actual={formacion}
      onChange={setFormacion}
    />
    <button
      onClick={() => setShowVoronoi(!showVoronoi)}
      className={`px-3 py-2 rounded-lg text-xs font-medium transition border ${
        showVoronoi
          ? "bg-apf-dorado/20 border-apf-dorado text-apf-dorado"
          : "bg-bg-terciario border-borde-sutil text-texto-secundario hover:text-texto-principal"
      }`}
    >
      {showVoronoi ? "Ocultar zonas" : "Zonas de cobertura"}
    </button>
  </div>
</div>
```

5. Add SVG overlay BEFORE the closing `</div>` of the field container (before line 151, after the PlayerDot mapping). The SVG sits inside the field div:
```tsx
{showVoronoi && voronoiPaths.length > 0 && (
  <svg
    viewBox="0 0 100 150"
    className="absolute inset-0 w-full h-full pointer-events-none"
    preserveAspectRatio="none"
  >
    {voronoiPaths.map((cell) => (
      <path
        key={cell.cellIndex}
        d={cell.d}
        fill={
          cell.cellIndex < 11
            ? "rgba(204, 0, 28, 0.20)"
            : "rgba(0, 97, 158, 0.20)"
        }
        stroke={
          cell.cellIndex < 11
            ? "rgba(204, 0, 28, 0.6)"
            : "rgba(0, 97, 158, 0.6)"
        }
        strokeWidth="0.3"
      />
    ))}
  </svg>
)}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `cd "C:\Users\astur\Desktop\liga.paraguaya.futbol\frontend" && npx tsc --noEmit`
Expected: No errors.

- [ ] **Step 3: Verify build**

Run: `cd "C:\Users\astur\Desktop\liga.paraguaya.futbol\frontend" && npm run build`
Expected: Build succeeds.

- [ ] **Step 4: Commit**

```bash
cd "C:\Users\astur\Desktop\liga.paraguaya.futbol" && git add frontend/src/components/tactico/TacticalField.tsx && git commit -m "feat(tactico): add Voronoi SVG overlay with toggle to TacticalField"
```

---

### Task 4: GSAP animation on formation change

**Files:**
- Modify: `frontend/src/components/tactico/TacticalField.tsx`

**Interfaces:**
- Consumes: `gsap` from `@/lib/gsap`, voronoi paths from Task 3
- Produces: Animated polygon transitions when formation changes

- [ ] **Step 1: Add GSAP refs and animation logic**

In `TacticalField.tsx`:

1. Add import:
```typescript
import { useEffect, useRef } from "react";  // add useEffect, useRef to existing import
import { initGSAP, gsap } from "@/lib/gsap";
```

2. Add ref for SVG group (after existing state):
```typescript
const voronoiGroupRef = useRef<SVGGElement>(null);
```

3. Add animation effect (after the `voronoiPaths` useMemo):
```typescript
useEffect(() => {
  if (!showVoronoi || !voronoiGroupRef.current) return;
  initGSAP();

  const paths = voronoiGroupRef.current.querySelectorAll("path");
  const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  paths.forEach((path, i) => {
    const targetD = voronoiPaths[i]?.d;
    if (!targetD) return;
    if (prefersReduced) {
      gsap.set(path, { attr: { d: targetD } });
    } else {
      gsap.to(path, {
        attr: { d: targetD },
        duration: 0.4,
        ease: "power2.out",
      });
    }
  });
}, [voronoiPaths, showVoronoi]);
```

4. Update the SVG element to use the ref. Replace the `<svg>` tag from Task 3 with:
```tsx
<svg
  viewBox="0 0 100 150"
  className="absolute inset-0 w-full h-full pointer-events-none"
  preserveAspectRatio="none"
>
  <g ref={voronoiGroupRef}>
    {voronoiPaths.map((cell) => (
      <path
        key={cell.cellIndex}
        d={cell.d}
        fill={
          cell.cellIndex < 11
            ? "rgba(204, 0, 28, 0.20)"
            : "rgba(0, 97, 158, 0.20)"
        }
        stroke={
          cell.cellIndex < 11
            ? "rgba(204, 0, 28, 0.6)"
            : "rgba(0, 97, 158, 0.6)"
        }
        strokeWidth="0.3"
      />
    ))}
  </g>
</svg>
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `cd "C:\Users\astur\Desktop\liga.paraguaya.futbol\frontend" && npx tsc --noEmit`
Expected: No errors.

- [ ] **Step 3: Verify build**

Run: `cd "C:\Users\astur\Desktop\liga.paraguaya.futbol\frontend" && npm run build`
Expected: Build succeeds.

- [ ] **Step 4: Commit**

```bash
cd "C:\Users\astur\Desktop\liga.paraguaya.futbol" && git add frontend/src/components/tactico/TacticalField.tsx && git commit -m "feat(tactico): add GSAP animation for Voronoi cells on formation change"
```

---

### Task 5: Disclaimer text + edge case: Voronoi stroke color per team

**Files:**
- Modify: `frontend/src/components/tactico/TacticalField.tsx`
- Modify: `frontend/src/lib/voronoi.ts` — add `teamIndex` field to `VoronoiPath`

**Interfaces:**
- Consumes: `colorEquipo` prop from TacticalField (to determine team side)
- Produces: Disclaimer visible when Voronoi is active; correct stroke colors

- [ ] **Step 1: Extend VoronoiPath with teamIndex**

In `frontend/src/lib/voronoi.ts`, update the interface and function:

```typescript
export interface VoronoiPath {
  d: string;
  cellIndex: number;
  teamIndex: number; // 0 = first team, 1 = second team
}

export function computeVoronoiPaths(
  points: Point[],
  bounds: Bounds,
  teamSplit: number = 11
): VoronoiPath[] {
  // ... existing code ...
  return points.map((_, i) => ({
    d: voronoi.renderCell(i),
    cellIndex: i,
    teamIndex: i < teamSplit ? 0 : 1,
  }));
}
```

Also update `computeCellCentroids` signature to accept `teamSplit` (though it doesn't use it, keep signatures consistent):

```typescript
export function computeCellCentroids(
  points: Point[],
  bounds: Bounds,
  _teamSplit: number = 11
): Point[] {
  // ... existing code unchanged ...
}
```

- [ ] **Step 2: Add disclaimer text in TacticalField**

After the SVG overlay and before the position legend div (the `<div className="mt-4 flex flex-wrap gap-2...">`), add:

```tsx
{showVoronoi && (
  <p className="text-xs text-texto-secundario italic text-center mt-3 px-4">
    Distribución teórica según formación — no representa el movimiento real de un partido.
  </p>
)}
```

- [ ] **Step 3: Update test to match new interface**

Update the test file `frontend/src/lib/__tests__/voronoi.test.ts` to also check `teamIndex`:

Add this test inside the `computeVoronoiPaths` describe block:

```typescript
it("assigns teamIndex correctly with default split", () => {
  const points = Array.from({ length: 22 }, (_, i) => ({
    x: 5 + (i % 11) * 8.5,
    y: i < 11 ? 20 + (i % 4) * 30 : 90 + (i % 4) * 15,
  }));
  const cells = computeVoronoiPaths(points, BOUNDS);
  cells.forEach((cell) => {
    if (cell.cellIndex < 11) {
      expect(cell.teamIndex).toBe(0);
    } else {
      expect(cell.teamIndex).toBe(1);
    }
  });
});

it("respects custom teamSplit", () => {
  const points = Array.from({ length: 22 }, (_, i) => ({
    x: 5 + (i % 11) * 8.5,
    y: i < 11 ? 20 + (i % 4) * 30 : 90 + (i % 4) * 15,
  }));
  const cells = computeVoronoiPaths(points, BOUNDS, 11);
  expect(cells[0].teamIndex).toBe(0);
  expect(cells[11].teamIndex).toBe(1);
});
```

- [ ] **Step 4: Run all tests**

Run: `cd "C:\Users\astur\Desktop\liga.paraguaya.futbol\frontend" && npx vitest run`
Expected: All tests pass.

- [ ] **Step 5: Verify TypeScript compiles**

Run: `cd "C:\Users\astur\Desktop\liga.paraguaya.futbol\frontend" && npx tsc --noEmit`
Expected: No errors.

- [ ] **Step 6: Commit**

```bash
cd "C:\Users\astur\Desktop\liga.paraguaya.futbol" && git add frontend/src/lib/voronoi.ts frontend/src/lib/__tests__/voronoi.test.ts frontend/src/components/tactico/TacticalField.tsx && git commit -m "feat(tactico): add honesty disclaimer and team-aware Voronoi stroke colors"
```

---

### Task 6: Fix color prop integration (team A vs team B)

**Files:**
- Modify: `frontend/src/components/tactico/TacticalField.tsx`

**Interfaces:**
- Consumes: `colorEquipo` prop (existing)
- Produces: Voronoi cell colors derived from `colorEquipo` instead of hardcoded hex values

**Context:** In the match view (`/tactico/partido/[id]`), each TacticalField gets a different `colorEquipo` (red for local, blue for visitante). The Voronoi should use the team's color for its cells instead of always using hardcoded red/blue. This makes the Voronoi work correctly when only one team's field is shown (11 players = all cells in that team's color).

- [ ] **Step 1: Derive Voronoi colors from colorEquipo**

Replace the hardcoded fill/stroke in the SVG paths with computed values:

```tsx
// Before the return statement, compute team colors:
const voronoiFill = colorEquipo === "#D52B1E" || colorEquipo === "#CC001C"
  ? "rgba(204, 0, 28, 0.20)"
  : "rgba(0, 97, 158, 0.20)";
const voronoiStroke = colorEquipo === "#D52B1E" || colorEquipo === "#CC001C"
  ? "rgba(204, 0, 28, 0.6)"
  : "rgba(0, 97, 158, 0.6)";
```

Then in the SVG path elements, replace the ternary with:
```tsx
fill={voronoiFill}
stroke={voronoiStroke}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `cd "C:\Users\astur\Desktop\liga.paraguaya.futbol\frontend" && npx tsc --noEmit`
Expected: No errors.

- [ ] **Step 3: Verify build**

Run: `cd "C:\Users\astur\Desktop\liga.paraguaya.futbol\frontend" && npm run build`
Expected: Build succeeds.

- [ ] **Step 4: Commit**

```bash
cd "C:\Users\astur\Desktop\liga.paraguaya.futbol" && git add frontend/src/components/tactico/TacticalField.tsx && git commit -m "feat(tactico): derive Voronoi colors from colorEquipo prop"
```

---

### Task 7: E2E Playwright tests

**Files:**
- Create: `frontend/e2e/voronoi-tactico.spec.ts`

**Interfaces:**
- Consumes: The TacticalField with Voronoi toggle at `/tactico/equipo/Olimpia` (or any team)
- Produces: E2E test coverage for toggle, disclaimer, formation change

- [ ] **Step 1: Write E2E tests**

```typescript
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
```

- [ ] **Step 2: Verify test file compiles (syntax check)**

Run: `cd "C:\Users\astur\Desktop\liga.paraguaya.futbol\frontend" && npx tsc --noEmit`
Expected: No errors (Playwright types included via `@playwright/test`).

- [ ] **Step 3: Commit**

```bash
cd "C:\Users\astur\Desktop\liga.paraguaya.futbol" && git add frontend/e2e/voronoi-tactico.spec.ts && git commit -m "test(e2e): add Playwright tests for Voronoi tactico"
```

---

### Task 8: Final verification

**Files:** None created/modified (verification only)

- [ ] **Step 1: Run backend tests (no changes expected)**

Run: `cd "C:\Users\astur\Desktop\liga.paraguaya.futbol" && python -m pytest backend/tests/ -v`
Expected: 181+ tests pass. No backend files were touched.

- [ ] **Step 2: Run frontend unit tests**

Run: `cd "C:\Users\astur\Desktop\liga.paraguaya.futbol\frontend" && npx vitest run`
Expected: All tests pass (voronoi tests + any existing tests).

- [ ] **Step 3: Run frontend build**

Run: `cd "C:\Users\astur\Desktop\liga.paraguaya.futbol\frontend" && npm run build`
Expected: Build succeeds, 0 TypeScript errors.

- [ ] **Step 4: Git status clean**

Run: `cd "C:\Users\astur\Desktop\liga.paraguaya.futbol" && git status --short`
Expected: No uncommitted changes.

- [ ] **Step 5: Visual description of Voronoi with APF palette**

Report to user: Confirm that the Voronoi cells render with:
- Rojo translúcido (`rgba(204, 0, 28, 0.20)`) for team A cells
- Azul translúcido (`rgba(0, 97, 158, 0.20)`) for team B cells (when 22 players present)
- Dorado stroke (`rgba(255, 204, 0, 0.4)`) — NOTE: this was in the spec but the implementation uses team-colored strokes. Clarify if dorado divider lines are needed as a separate layer.
- Disclaimer text visible below the field when toggle is active

---

## Summary

| Task | Descripción | Commit |
|------|-------------|--------|
| 1 | Voronoi tests (TDD RED) | `test(voronoi): add failing tests` |
| 2 | Voronoi computation (TDD GREEN) | `feat(voronoi): implement computeVoronoiPaths` |
| 3 | SVG overlay + toggle state | `feat(tactico): add Voronoi SVG overlay with toggle` |
| 4 | GSAP animation | `feat(tactico): add GSAP animation for Voronoi cells` |
| 5 | Disclaimer + teamIndex | `feat(tactico): add honesty disclaimer and team-aware colors` |
| 6 | colorEquipo integration | `feat(tactico): derive Voronoi colors from colorEquipo` |
| 7 | E2E Playwright tests | `test(e2e): add Playwright tests for Voronoi tactico` |
| 8 | Final verification | (no commit — verification only) |
