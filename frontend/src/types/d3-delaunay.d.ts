declare module "d3-delaunay" {
  export class Delaunay<P> {
    static from<I>(
      iterable: Iterable<I>,
      x: (d: I) => number,
      y: (d: I) => number
    ): Delaunay<I>;
    voronoi(bounds: [number, number, number, number]): Voronoi<P>;
  }

  export class Voronoi<P> {
    renderCell(i: number): string;
  }
}
