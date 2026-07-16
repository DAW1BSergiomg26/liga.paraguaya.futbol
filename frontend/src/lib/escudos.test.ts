import { describe, it, expect } from "vitest";
import { readdirSync } from "fs";
import { join } from "path";
import { ESCUDOS_LOCALES, escudoUrl } from "@/lib/escudos";

const PUBLIC_ESCUDOS = join(process.cwd(), "public", "escudos");

// Los 19 clubes que deben tener escudo según el brief.
const CLUBS_ESPERADOS = [
  "olimpia",
  "cerro-porteno",
  "libertad",
  "guarani",
  "nacional",
  "sol-de-america",
  "luqueno",
  "ameliano",
  "2-de-mayo",
  "san-lorenzo",
  "general-caballero",
  "colegiales",
  "recoleta",
  "rubio-nu",
  "tembetary",
  "trinidense",
  "general-diaz",
  "deportivo-capiata",
  "3-de-febrero",
];

describe("mapeo club -> escudo (red3d)", () => {
  it("mapea los 19 clubes a un archivo de escudo", () => {
    for (const id of CLUBS_ESPERADOS) {
      expect(ESCUDOS_LOCALES[id], `falta escudo para ${id}`).toBeDefined();
      expect(ESCUDOS_LOCALES[id]).toMatch(/^\/escudos\/.+\.png$/);
    }
  });

  it("escudoUrl devuelve undefined para id desconocido", () => {
    expect(escudoUrl("club-inexistente")).toBeUndefined();
    expect(escudoUrl(undefined)).toBeUndefined();
  });

  it("no inventa rutas: cada escudo apunta a un archivo que existe en public/escudos", () => {
    const existentes = new Set(readdirSync(PUBLIC_ESCUDOS));
    const rutas = new Set(Object.values(ESCUDOS_LOCALES));
    expect(rutas.size).toBeGreaterThanOrEqual(19);
    for (const ruta of rutas) {
      const archivo = ruta.replace(/^\/escudos\//, "");
      expect(existentes.has(archivo), `no existe en disco: ${ruta}`).toBe(true);
    }
  });

  it("todos los archivos de public/escudos están mapeados a un club", () => {
    const archivos = readdirSync(PUBLIC_ESCUDOS).filter((f) => f.endsWith(".png"));
    const mapeados = new Set(Object.values(ESCUDOS_LOCALES).map((r) => r.replace(/^\/escudos\//, "")));
    for (const archivo of archivos) {
      expect(mapeados.has(archivo), `${archivo} no está mapeado a ningún club`).toBe(true);
    }
  });
});
