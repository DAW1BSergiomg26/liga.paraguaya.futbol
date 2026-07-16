import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor, within } from "@testing-library/react";

// Graph3D usa three/3d-force-graph (WebGL) -> lo mockeamos en jsdom.
vi.mock("@/components/red3d/Graph3D", () => ({
  default: ({ onReady }: { onReady?: (h: unknown) => void }) => {
    if (onReady) {
      // Simula el handle que la pagina espera.
      setTimeout(() => onReady({ flyTo: vi.fn(), zoomToFit: vi.fn(), setAutoRotate: vi.fn() }), 0);
    }
    return <div data-testid="graph3d-mock" />;
  },
}));

import Red3DPage from "./page";

describe("Pagina /red3d", () => {
  beforeEach(() => {
    // La pagina hace fetch a /data/red-clubes.json y a la API de transferencias.
    vi.stubGlobal(
      "fetch",
      vi.fn((url: string) => {
        if (url.includes("red-clubes.json")) {
          return Promise.resolve({
            ok: true,
            json: async () => ({
              nodes: [
                { id: "olimpia", name: "Club Olimpia", short: "Olimpia", titulos: 48, intl: 8 },
                { id: "cerro-porteno", name: "Club Cerro Porteño", short: "Cerro", titulos: 35, intl: 0 },
                { id: "libertad", name: "Club Libertad", short: "Libertad", titulos: 26, intl: 0 },
              ],
              links: [{ source: "olimpia", target: "cerro-porteno", value: 190 }],
            }),
          });
        }
        return Promise.resolve({ ok: true, json: async () => ({ transferencias: [] }) });
      })
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("explica el proposito de la seccion (panel ¿Que es esto?)", async () => {
    render(<Red3DPage />);
    expect(
      await screen.findByText((c) => c.includes("Qué es esto"))
    ).toBeInTheDocument();
    expect(
      screen.getByText(/mapa interactivo en 3D/i)
    ).toBeInTheDocument();
  });

  it("lista los clubes con nombre visible despues de cargar datos", async () => {
    render(<Red3DPage />);
    // El fallback renderiza 19 clubes; con fetch mockeado muestra los 3 del JSON.
    expect((await screen.findAllByText("Club Olimpia")).length).toBeGreaterThan(0);
    expect(screen.getAllByText("Club Cerro Porteño").length).toBeGreaterThan(0);
  });

  it("permite alternar entre modos Rivalidades y Mercado de Fichajes", async () => {
    render(<Red3DPage />);
    expect((await screen.findAllByText("¿Qué es esto?")).length).toBeGreaterThan(0);

    const modoFichajes = screen.getAllByRole("button", { name: /Mercado de Fichajes/i })[0];
    fireEvent.click(modoFichajes);

    expect(
      (await screen.findAllByText(/pases de jugadores/i)).length
    ).toBeGreaterThan(0);
  });
});
