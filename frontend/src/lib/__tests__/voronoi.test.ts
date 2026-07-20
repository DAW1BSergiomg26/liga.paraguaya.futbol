// frontend/src/lib/__tests__/voronoi.test.ts
import { describe, it, expect } from "vitest";
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
