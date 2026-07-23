import { SITE_URL, SITE_NAME } from "./config";

interface SportsEvent {
  "@context": "https://schema.org";
  "@type": "SportsEvent";
  name: string;
  description: string;
  startDate: string;
  eventStatus?: string;
  competitor: { "@type": "SportsTeam"; name: string }[];
  location?: { "@type": "Place"; name: string };
  organizer?: { "@type": "SportsOrganization"; name: string };
}

interface SportsClub {
  "@context": "https://schema.org";
  "@type": "SportsClub";
  name: string;
  description?: string;
  url?: string;
  logo?: string;
  foundingDate?: string;
  sport?: string;
  memberOf?: { "@type": "SportsOrganization"; name: string };
  location?: { "@type": "Place"; name: string };
  venue?: { "@type": "Place"; name: string; address?: string };
}

interface WebSiteSchema {
  "@context": "https://schema.org";
  "@type": "WebSite";
  name: string;
  url: string;
  description?: string;
  publisher?: { "@type": "SportsOrganization"; name: string; logo?: string };
}

export function buildSportsEvent(opts: {
  id: string;
  localNombre: string;
  visitanteNombre: string;
  fecha: string;
  estado: string;
  torneo: string;
  jornada: number;
  golesLocal?: number | null;
  golesVisitante?: number | null;
  estadio?: string | null;
}): SportsEvent {
  const eventStatusMap: Record<string, string> = {
    finalizado: "https://schema.org/EventScheduled",
    en_vivo: "https://schema.org/EventScheduled",
    programado: "https://schema.org/EventScheduled",
  };

  const status =
    opts.estado === "finalizado"
      ? "https://schema.org/EventScheduled"
      : eventStatusMap[opts.estado] ?? "https://schema.org/EventScheduled";

  const result: SportsEvent = {
    "@context": "https://schema.org",
    "@type": "SportsEvent",
    name: `${opts.localNombre} vs ${opts.visitanteNombre}`,
    description: `${opts.localNombre} vs ${opts.visitanteNombre} — ${opts.torneo}, Jornada ${opts.jornada}`,
    startDate: opts.fecha,
    eventStatus: status,
    competitor: [
      { "@type": "SportsTeam", name: opts.localNombre },
      { "@type": "SportsTeam", name: opts.visitanteNombre },
    ],
    organizer: { "@type": "SportsOrganization", name: SITE_NAME },
  };

  if (opts.estadio) {
    result.location = { "@type": "Place", name: opts.estadio };
  }

  return result;
}

export function buildSportsClub(opts: {
  nombre: string;
  descripcion?: string | null;
  escudo?: string | null;
  fundacion?: number | null;
  estadio?: string | null;
  ciudad?: string | null;
  sitio_web?: string | null;
}): SportsClub {
  const result: SportsClub = {
    "@context": "https://schema.org",
    "@type": "SportsClub",
    name: opts.nombre,
    sport: "Football",
    memberOf: { "@type": "SportsOrganization", name: SITE_NAME },
  };

  if (opts.descripcion) result.description = opts.descripcion;
  if (opts.escudo) result.logo = opts.escudo;
  if (opts.fundacion) result.foundingDate = String(opts.fundacion);
  if (opts.estadio) result.venue = { "@type": "Place", name: opts.estadio };
  if (opts.ciudad) {
    result.location = { "@type": "Place", name: opts.ciudad };
  }
  if (opts.sitio_web) result.url = opts.sitio_web;

  return result;
}

export function buildWebSiteSchema(opts?: {
  description?: string;
}): WebSiteSchema {
  const result: WebSiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE_NAME,
    url: SITE_URL,
    publisher: { "@type": "SportsOrganization", name: SITE_NAME },
  };

  if (opts?.description) result.description = opts.description;

  return result;
}
