import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import CerezoPage from "./page";

function renderWithClient(ui: React.ReactNode) {
  const client = new QueryClient();
  return render(
    <QueryClientProvider client={client}>{ui}</QueryClientProvider>
  );
}

function mockFetchOnce(payload: unknown) {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue({
      ok: true,
      json: async () => payload,
    })
  );
}

describe("Pagina /cerezo (Cerezo Digital)", () => {
  beforeEach(() => {
    vi.stubEnv("NEXT_PUBLIC_API_URL", "http://localhost:8000");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("muestra el saludo inicial del asistente", () => {
    renderWithClient(<CerezoPage />);
    expect(
      screen.getByText(/Soy Cerezo Digital/i)
    ).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /Cerezo Digital/i })).toBeInTheDocument();
  });

  it("envia un mensaje y renderiza la respuesta del asistente", async () => {
    mockFetchOnce({
      message: "Olimpia es el club mas titulado de Paraguay.",
      intent: "club_info",
      structured_data: null,
    });

    renderWithClient(<CerezoPage />);

    const input = screen.getByPlaceholderText(/Preguntale a Cerezo/i);
    const form = input.closest("form") as HTMLFormElement;

    fireEvent.change(input, { target: { value: "¿Quien es Olimpia?" } });
    fireEvent.submit(form);

    // El mensaje del usuario aparece en el chat
    expect(
      await screen.findByText("¿Quien es Olimpia?")
    ).toBeInTheDocument();

    // La respuesta del asistente aparece tras el fetch
    expect(
      await screen.findByText(/Olimpia es el club mas titulado/i)
    ).toBeInTheDocument();
  });

  it("muestra un mensaje de error si el backend falla", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: false, status: 500, json: async () => ({}) })
    );

    renderWithClient(<CerezoPage />);
    const input = screen.getByPlaceholderText(/Preguntale a Cerezo/i);
    const form = input.closest("form") as HTMLFormElement;

    fireEvent.change(input, { target: { value: "hola" } });
    fireEvent.submit(form);

    expect(
      await screen.findByText(/ocurri[óo] un error/i)
    ).toBeInTheDocument();
  });
});
