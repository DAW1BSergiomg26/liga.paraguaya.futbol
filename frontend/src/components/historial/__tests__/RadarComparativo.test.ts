import { describe, it, expect } from "vitest";

const AXES = [
  { key: "ataque", label: "Ataque" },
  { key: "defensa", label: "Defensa" },
  { key: "rendimiento", label: "Rendimiento" },
  { key: "palmares", label: "Palmarés" },
  { key: "gol_individual", label: "Gol Individual" },
  { key: "actividad_mercado", label: "Actividad Mercado" },
] as const;

// Copia EXACTA de la función actual (bug: Math.PI * 3 en vez de * 2)
function getAxisAngleBuggy(index: number): number {
  return -Math.PI / 2 + (index * Math.PI * 3) / AXES.length;
}

// Fix: Math.PI * 2 para distribución uniforme en 360°
function getAxisAngleFixed(index: number): number {
  return -Math.PI / 2 + (index * Math.PI * 2) / AXES.length;
}

function angleToXY(angle: number, r: number) {
  return { x: Math.cos(angle) * r, y: Math.sin(angle) * r };
}

describe("RadarComparativo axis angles", () => {
  it("BUG: buggy formula wraps 540° into 360° → labels overlap in pairs", () => {
    const r = 180;
    const positions = Array.from({ length: AXES.length }, (_, i) => {
      const angle = getAxisAngleBuggy(i);
      const pos = angleToXY(angle, r);
      return { index: i, label: AXES[i].label, x: pos.x, y: pos.y };
    });

    // With Math.PI*3 step = 90°, 6 axes = 540° → wraps
    // Index 0 (-90°) = Index 4 (270°) → same position
    expect(positions[0].x).toBeCloseTo(positions[4].x, 5);
    expect(positions[0].y).toBeCloseTo(positions[4].y, 5);
    // Index 1 (0°) = Index 5 (360°) → same position
    expect(positions[1].x).toBeCloseTo(positions[5].x, 5);
    expect(positions[1].y).toBeCloseTo(positions[5].y, 5);
    // Only 4 unique positions out of 6 axes
    const uniqueKeys = new Set(positions.map((p) => `${Math.round(p.x)},${Math.round(p.y)}`));
    expect(uniqueKeys.size).toBe(4);
  });

  it("FIX: all 6 label positions must be distinct", () => {
    const r = 180;
    const positions = Array.from({ length: AXES.length }, (_, i) => {
      const angle = getAxisAngleFixed(i);
      const pos = angleToXY(angle, r);
      return { index: i, label: AXES[i].label, x: pos.x, y: pos.y };
    });

    const uniqueKeys = new Set(positions.map((p) => `${Math.round(p.x)},${Math.round(p.y)}`));
    expect(uniqueKeys.size).toBe(6);
  });

  it("FIX: no two axes share the same angle", () => {
    const angles = Array.from({ length: AXES.length }, (_, i) => getAxisAngleFixed(i));
    const uniqueAngles = new Set(angles.map((a) => Math.round(a * 1e6)));
    expect(uniqueAngles.size).toBe(6);
  });

  it("FIX: angles span exactly 360° with 60° steps", () => {
    const step = (2 * Math.PI) / 6; // 60°
    for (let i = 0; i < 6; i++) {
      const angle = getAxisAngleFixed(i);
      const expected = -Math.PI / 2 + i * step;
      expect(angle).toBeCloseTo(expected, 10);
    }
  });
});
