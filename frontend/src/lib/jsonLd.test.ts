import { describe, it, expect } from "vitest";
import { buildSportsEvent, buildSportsClub, buildWebSiteSchema } from "./jsonLd";

describe("buildSportsEvent", () => {
  const base = {
    id: "apertura-2026-001",
    localNombre: "Club Olimpia",
    visitanteNombre: "Cerro Porteño",
    fecha: "2026-03-15",
    estado: "finalizado",
    torneo: "Apertura 2026",
    jornada: 5,
    golesLocal: 2,
    golesVisitante: 1,
  };

  it("genera un SportsEvent válido con todos los campos", () => {
    const result = buildSportsEvent({ ...base, estadio: "Osvaldo Domínguez Dibb" });

    expect(result["@context"]).toBe("https://schema.org");
    expect(result["@type"]).toBe("SportsEvent");
    expect(result.name).toBe("Club Olimpia vs Cerro Porteño");
    expect(result.startDate).toBe("2026-03-15");
    expect(result.competitor).toHaveLength(2);
    expect(result.competitor[0].name).toBe("Club Olimpia");
    expect(result.competitor[1].name).toBe("Cerro Porteño");
    expect(result.location).toEqual({ "@type": "Place", name: "Osvaldo Domínguez Dibb" });
    expect(result.organizer?.name).toBeTruthy();
  });

  it("omite location cuando estadio es null", () => {
    const result = buildSportsEvent({ ...base, estadio: null });

    expect(result).not.toHaveProperty("location");
  });

  it("omite location cuando estadio es undefined", () => {
    const result = buildSportsEvent({ ...base });

    expect(result).not.toHaveProperty("location");
  });

  it("usa eventStatus correcto para estado finalizado", () => {
    const result = buildSportsEvent({ ...base, estado: "finalizado" });
    expect(result.eventStatus).toBe("https://schema.org/EventScheduled");
  });

  it("usa eventStatus correcto para estado programado", () => {
    const result = buildSportsEvent({ ...base, estado: "programado" });
    expect(result.eventStatus).toBe("https://schema.org/EventScheduled");
  });
});

describe("buildSportsClub", () => {
  const base = {
    nombre: "Club Olimpia",
    descripcion: "El Decano del fútbol paraguayo",
    escudo: "https://example.com/olimpia.png",
    fundacion: 1902,
    estadio: "Osvaldo Domínguez Dibb",
    ciudad: "Asunción",
    sitio_web: "https://olimpia.com.py",
  };

  it("genera un SportsClub válido con todos los campos", () => {
    const result = buildSportsClub(base);

    expect(result["@context"]).toBe("https://schema.org");
    expect(result["@type"]).toBe("SportsClub");
    expect(result.name).toBe("Club Olimpia");
    expect(result.description).toBe("El Decano del fútbol paraguayo");
    expect(result.logo).toBe("https://example.com/olimpia.png");
    expect(result.foundingDate).toBe("1902");
    expect(result.sport).toBe("Football");
    expect(result.venue).toEqual({ "@type": "Place", name: "Osvaldo Domínguez Dibb" });
    expect(result.location).toEqual({ "@type": "Place", name: "Asunción" });
    expect(result.url).toBe("https://olimpia.com.py");
  });

  it("omite campos opcionales cuando son null", () => {
    const result = buildSportsClub({
      nombre: "Test Club",
      descripcion: null,
      escudo: null,
      fundacion: null,
      estadio: null,
      ciudad: null,
      sitio_web: null,
    });

    expect(result).not.toHaveProperty("description");
    expect(result).not.toHaveProperty("logo");
    expect(result).not.toHaveProperty("foundingDate");
    expect(result).not.toHaveProperty("venue");
    expect(result).not.toHaveProperty("location");
    expect(result).not.toHaveProperty("url");
  });

  it("omite campos opcionales cuando son undefined", () => {
    const result = buildSportsClub({ nombre: "Test Club" });

    expect(result).not.toHaveProperty("description");
    expect(result).not.toHaveProperty("logo");
    expect(result).not.toHaveProperty("foundingDate");
  });

  it("siempre incluye name, @type, sport y memberOf", () => {
    const result = buildSportsClub({ nombre: "Any Club" });

    expect(result.name).toBe("Any Club");
    expect(result["@type"]).toBe("SportsClub");
    expect(result.sport).toBe("Football");
    expect(result.memberOf).toBeDefined();
    expect(result.memberOf?.name).toBeTruthy();
  });
});

describe("buildWebSiteSchema", () => {
  it("genera un WebSite válido con campos requeridos", () => {
    const result = buildWebSiteSchema();

    expect(result["@context"]).toBe("https://schema.org");
    expect(result["@type"]).toBe("WebSite");
    expect(result.name).toBeTruthy();
    expect(result.url).toBeTruthy();
    expect(result.publisher).toBeDefined();
  });

  it("incluye description cuando se provee", () => {
    const result = buildWebSiteSchema({ description: "Test description" });

    expect(result.description).toBe("Test description");
  });

  it("omite description cuando no se provee", () => {
    const result = buildWebSiteSchema();

    expect(result).not.toHaveProperty("description");
  });
});
