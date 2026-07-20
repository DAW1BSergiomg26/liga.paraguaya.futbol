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
  teamIndex: number;
}

export function computeVoronoiPaths(
  points: Point[],
  bounds: Bounds,
  teamSplit: number = 11
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
    teamIndex: i < teamSplit ? 0 : 1,
  }));
}

export function computeCellCentroids(
  points: Point[],
  bounds: Bounds,
  _teamSplit: number = 11
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
