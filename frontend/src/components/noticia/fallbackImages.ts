const FALLBACK_MAP: Record<string, string> = {
  editorial: "/fallbacks/editorial-apf.svg",
  rss: "/fallbacks/futbol-estadio.svg",
  default: "/fallbacks/default-noticia.svg",
};

const CATEGORY_KEYWORDS: Record<string, string> = {
  "copa libertadores": "/fallbacks/copa-libertadores.svg",
  libertadores: "/fallbacks/copa-libertadores.svg",
  copa: "/fallbacks/copa-libertadores.svg",
  sudamericana: "/fallbacks/copa-libertadores.svg",
};

export function getFallbackImage(origen?: string, titulo?: string): string {
  if (titulo) {
    const lower = titulo.toLowerCase();
    for (const [keyword, image] of Object.entries(CATEGORY_KEYWORDS)) {
      if (lower.includes(keyword)) return image;
    }
  }
  return FALLBACK_MAP[origen || "default"] || FALLBACK_MAP.default;
}

export function calcularTiempoLectura(texto: string | null | undefined): number {
  if (!texto) return 1;
  const palabras = texto.trim().split(/\s+/).length;
  return Math.max(1, Math.ceil(palabras / 200));
}

export function detectarCategoria(titulo: string): { label: string; color: string } | null {
  const lower = titulo.toLowerCase();
  if (lower.includes("copa libertadores") || lower.includes("libertadores")) {
    return { label: "Copa Libertadores", color: "bg-apf-dorado/90 text-black" };
  }
  if (lower.includes("copa") || lower.includes("sudamericana")) {
    return { label: "Copa", color: "bg-apf-dorado/90 text-black" };
  }
  if (lower.includes("fichaje") || lower.includes("refuerzo") || lower.includes("incorpora")) {
    return { label: "Fichajes", color: "bg-apf-azul/90 text-white" };
  }
  if (lower.includes("fecha") || lower.includes("jornada") || lower.includes("fecha")) {
    return { label: "Fecha", color: "bg-apf-rojo/90 text-white" };
  }
  if (lower.includes("resultado") || lower.includes("victoria") || lower.includes("empate")) {
    return { label: "Resultado", color: "bg-green-600/90 text-white" };
  }
  return null;
}
