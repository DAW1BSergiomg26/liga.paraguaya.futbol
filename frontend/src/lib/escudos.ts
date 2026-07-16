// Mapa local de escudos, reutilizando los mismos logos que la sección /clubes (footylogos en /public)
// y completando los clubes que no tienen footylogos con los PNG cacheados en /escudos.
// Mejor para la web: sin dependencias externas (Wikimedia 429), carga instantánea y consistencia visual.
const FOOTY: Record<string, string> = {
  olimpia: "/olimpia-logo-footylogos.png",
  "cerro-porteno": "/cerro-porteno-logo-footylogos.png",
  libertad: "/club-libertad-logo-footylogos.png",
  guarani: "/guarani-paraguay-logo-footylogos.png",
  nacional: "/nacional-paraguay-logo-footylogos.png",
  "2-de-mayo": "/club-sportivo-2-de-mayo-logo-footylogos.png",
  tembetary: "/club-atletico-tembetary-logo-footylogos.png",
  "general-caballero": "/general-caballero-jlm-logo-footylogos.png",
  luqueno: "/sportivo-luqueno-logo-footylogos.png",
  trinidense: "/sportivo-trinidense-logo-footylogos.png",
  ameliano: "/sportivo_ameliano.png",
  "deportivo-capiata": "/clubdeportivo_capiata.png",
};

const CACHE: Record<string, string> = {
  colegiales: "/escudos/colegiales.png",
  recoleta: "/escudos/recoleta.png",
  "rubio-nu": "/escudos/rubio-nu.png",
  "san-lorenzo": "/escudos/san-lorenzo.png",
  "sol-de-america": "/escudos/sol-de-america.png",
  "general-diaz": "/escudos/general-diaz.png",
  "3-de-febrero": "/escudos/3-de-febrero.png",
};

export const ESCUDOS_LOCALES: Record<string, string> = {
  ...CACHE,
  ...FOOTY,
  // asegurar los 19
  olimpia: FOOTY.olimpia,
  "cerro-porteno": FOOTY["cerro-porteno"],
  colegiales: CACHE.colegiales,
  libertad: FOOTY.libertad,
  guarani: FOOTY.guarani,
  "general-caballero": FOOTY["general-caballero"],
  nacional: FOOTY.nacional,
  recoleta: CACHE.recoleta,
  "rubio-nu": CACHE["rubio-nu"],
  "2-de-mayo": FOOTY["2-de-mayo"],
  ameliano: FOOTY.ameliano,
  luqueno: FOOTY.luqueno,
  "san-lorenzo": CACHE["san-lorenzo"],
  "sol-de-america": CACHE["sol-de-america"],
  tembetary: FOOTY.tembetary,
  trinidense: FOOTY.trinidense,
  "general-diaz": CACHE["general-diaz"],
  "3-de-febrero": CACHE["3-de-febrero"],
  "deportivo-capiata": FOOTY["deportivo-capiata"],
};

export function escudoUrl(id?: string): string | undefined {
  if (!id) return undefined;
  return ESCUDOS_LOCALES[id];
}
