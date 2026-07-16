// Mapeo explícito club -> archivo de escudo (1:1).
// Usa EXCLUSIVAMENTE los 19 PNG reales que existen en /public/escudos.
// No se adivina el nombre: cada id apunta al archivo confirmado en disco.
export const ESCUDOS_LOCALES: Record<string, string> = {
  olimpia: "/escudos/olimpia.png",
  "cerro-porteno": "/escudos/cerro-porteno.png",
  libertad: "/escudos/libertad.png",
  guarani: "/escudos/guarani.png",
  nacional: "/escudos/nacional.png",
  "sol-de-america": "/escudos/sol-de-america.png",
  luqueno: "/escudos/luqueno.png",
  ameliano: "/escudos/ameliano.png",
  "2-de-mayo": "/escudos/2-de-mayo-logo-footylogos.png",
  "san-lorenzo": "/escudos/san-lorenzo.png",
  "general-caballero": "/escudos/general-caballero.png",
  colegiales: "/escudos/colegiales.png",
  recoleta: "/escudos/recoleta.png",
  "rubio-nu": "/escudos/rubio-nu.png",
  tembetary: "/escudos/tembetary.png",
  trinidense: "/escudos/trinidense.png",
  "general-diaz": "/escudos/general-diaz.png",
  "deportivo-capiata": "/escudos/capiata.png",
  "3-de-febrero": "/escudos/3-de-febrero.png",
};

export function escudoUrl(id?: string): string | undefined {
  if (!id) return undefined;
  return ESCUDOS_LOCALES[id];
}
