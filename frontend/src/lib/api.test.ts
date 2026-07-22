import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

describe("api.ts — API_URL resolution", () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it("usa NEXT_PUBLIC_API_URL cuando no es localhost", async () => {
    process.env.NEXT_PUBLIC_API_URL = "https://liga-paraguaya-futbol.onrender.com";
    process.env.NODE_ENV = "production";
    const { API_URL } = await import("@/lib/api");
    expect(API_URL).toBe("https://liga-paraguaya-futbol.onrender.com");
  });

  it("fuerza fallback si NEXT_PUBLIC_API_URL es localhost en producción", async () => {
    process.env.NEXT_PUBLIC_API_URL = "http://localhost:8000";
    process.env.NODE_ENV = "production";
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    const { API_URL } = await import("@/lib/api");
    expect(API_URL).toBe("https://liga-paraguaya-futbol.onrender.com");
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining("localhost")
    );
    warnSpy.mockRestore();
  });

  it("fuerza fallback si NEXT_PUBLIC_API_URL es 127.0.0.1 en producción", async () => {
    process.env.NEXT_PUBLIC_API_URL = "http://127.0.0.1:8000";
    process.env.NODE_ENV = "production";
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    const { API_URL } = await import("@/lib/api");
    expect(API_URL).toBe("https://liga-paraguaya-futbol.onrender.com");
    expect(warnSpy).toHaveBeenCalled();
    warnSpy.mockRestore();
  });

  it("permite localhost en desarrollo (NODE_ENV !== production)", async () => {
    process.env.NEXT_PUBLIC_API_URL = "http://localhost:8000";
    process.env.NODE_ENV = "development";
    const { API_URL } = await import("@/lib/api");
    expect(API_URL).toBe("http://localhost:8000");
  });

  it("usa fallback cuando NEXT_PUBLIC_API_URL no está definida", async () => {
    delete process.env.NEXT_PUBLIC_API_URL;
    process.env.NODE_ENV = "production";
    const { API_URL } = await import("@/lib/api");
    expect(API_URL).toBe("https://liga-paraguaya-futbol.onrender.com");
  });
});
