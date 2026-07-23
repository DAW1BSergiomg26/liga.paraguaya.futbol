import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/api", () => ({
  getClub: vi.fn(),
  getTabla: vi.fn(),
  getPartidos: vi.fn(),
}));

vi.mock("@/lib/config", () => ({
  SITE_URL: "https://frontend-ten-swart-85.vercel.app",
  SITE_NAME: "Liga Paraguaya de Fútbol",
  SITE_SHORT: "Liga PY",
}));

import { getClub, getTabla, getPartidos } from "@/lib/api";

const mockGetClub = vi.mocked(getClub);
const mockGetTabla = vi.mocked(getTabla);
const mockGetPartidos = vi.mocked(getPartidos);

describe("generateMetadata — clubes/[id]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("retorna título con el nombre real del club, no string genérico", async () => {
    mockGetClub.mockResolvedValue({
      id: "olimpia",
      nombre: "Olimpia",
      apodo: "El Rey de Copas",
      ciudad: "Asunción",
      estadio: "Estadio Manuel Ferreira",
      capacidad: 20000,
      fundacion: 1902,
      escudo: "https://example.com/olimpia.png",
      sitio_web: "https://olimpia.com.py",
      descripcion: "Club decano del fútbol paraguayo",
      titulos_liga: 45,
      titulos_info: [],
      titulos_internacionales: [],
      colores: ["#FFFFFF", "#CC001C"],
      direccion: "Av. Olimpia",
      camiseta: "Blanca con rojo",
    });
    mockGetTabla.mockResolvedValue([]);
    mockGetPartidos.mockResolvedValue({
      data: [],
      total: 0,
      page: 1,
      per_page: 25,
      total_pages: 1,
    });

    const { generateMetadata } = await import(
      "@/app/clubes/[id]/page"
    );
    const metadata = await generateMetadata({
      params: Promise.resolve({ id: "olimpia" }),
    });

    expect(metadata.title).toBe("Olimpia — Liga Paraguaya de Fútbol");
    expect(metadata.title).not.toContain("Club no encontrado");
    expect(metadata.title).not.toContain("Liga PY");
    expect(metadata.description).toContain("Olimpia");
    expect(metadata.description).toContain("El Rey de Copas");
    expect(metadata.description).toContain("45 títulos de liga");
  });

  it("retorna metadata de fallback si getClub lanza error", async () => {
    mockGetClub.mockRejectedValue(new Error("Not found"));

    const { generateMetadata } = await import(
      "@/app/clubes/[id]/page"
    );
    const metadata = await generateMetadata({
      params: Promise.resolve({ id: "inexistente" }),
    });

    expect(metadata.title).toBe("Club no encontrado");
  });

  it("incluye posición en tabla cuando el club aparece", async () => {
    mockGetClub.mockResolvedValue({
      id: "cerro-porteno",
      nombre: "Cerro Porteño",
      apodo: "El Ciclón",
      ciudad: "Asunción",
      estadio: "Estadio General Pablo Rojas",
      capacidad: 45000,
      fundacion: 1912,
      escudo: "https://example.com/cerro.png",
      sitio_web: "https://cerroporteno.com.py",
      descripcion: "",
      titulos_liga: 34,
      titulos_info: [],
      titulos_internacionales: [],
      colores: ["#0038A8", "#D52B1E"],
      direccion: "Barrio Obrero",
      camiseta: "Azul y roja",
    });
    mockGetTabla.mockResolvedValue([
      {
        posicion: 2,
        club_id: "cerro-porteno",
        club: "Cerro Porteño",
        escudo: "",
        pj: 10,
        pg: 7,
        pe: 2,
        pp: 1,
        gf: 20,
        gc: 8,
        dg: 12,
        puntos: 23,
      },
    ]);
    mockGetPartidos.mockResolvedValue({
      data: [],
      total: 0,
      page: 1,
      per_page: 25,
      total_pages: 1,
    });

    const { generateMetadata } = await import(
      "@/app/clubes/[id]/page"
    );
    const metadata = await generateMetadata({
      params: Promise.resolve({ id: "cerro-porteno" }),
    });

    expect(metadata.description).toContain("Posición #2 en tabla");
    expect(metadata.description).toContain("23 puntos");
  });
});
