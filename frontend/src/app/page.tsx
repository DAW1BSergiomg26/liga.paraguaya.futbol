export const dynamic = 'force-dynamic';

import Image from "next/image";
import { getClubes, getPartidos, getTabla, getTorneos, getGlobalStats } from "@/lib/api";
import type { PartidoPage } from "@/types";
import Link from "next/link";
import HeroStats from "@/components/HeroStats";
import CinematicHero from "@/components/hero/CinematicHero";
import { SITE_NAME, SITE_SHORT, SITE_URL } from "@/lib/config";
import type { Metadata } from "next";
import JsonLd from "@/components/JsonLd";
import { buildWebSiteSchema } from "@/lib/jsonLd";

export const metadata: Metadata = {
  title: `${SITE_SHORT} — Fútbol Paraguayo en Tiempo Real`,
  description:
    `Portal oficial de datos y estadísticas del fútbol paraguayo. Clubes, partidos en vivo, tabla de posiciones, goleadores, transferencias y análisis táctico de la Primera División. ${SITE_NAME}.`,
  openGraph: {
    title: `${SITE_SHORT} — Fútbol Paraguayo en Tiempo Real`,
    description:
      `Datos, estadísticas y partidos en vivo del fútbol paraguayo. ${SITE_NAME}.`,
    type: "website",
    images: [{ url: `${SITE_URL}/api/og/home`, width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE_SHORT} — Fútbol Paraguayo en Tiempo Real`,
    description: `Datos, estadísticas y partidos en vivo del fútbol paraguayo. ${SITE_NAME}.`,
    images: [`${SITE_URL}/api/og/home`],
  },
};

async function safeFetch<T>(fn: () => Promise<T>, fallback: T): Promise<[T, string | null]> {
  try {
    const data = await fn();
    return [data, null];
  } catch (e) {
    return [fallback, e instanceof Error ? e.message : "Error de conexión"];
  }
}

function torneoActual(torneos: string[]): string | null {
  if (torneos.length === 0) return null;
  const yearRegex = /\b(20\d{2})\b/;
  const conAnio = torneos.filter(t => yearRegex.test(t));
  if (conAnio.length === 0) return torneos[0];
  return conAnio.sort((a, b) => {
    const yearA = parseInt(a.match(yearRegex)![1]);
    const yearB = parseInt(b.match(yearRegex)![1]);
    if (yearA !== yearB) return yearB - yearA;
    const apertura = /apertura/i;
    const aIsApertura = apertura.test(a) ? 0 : 1;
    const bIsApertura = apertura.test(b) ? 0 : 1;
    return aIsApertura - bIsApertura;
  })[0];
}

export default async function HomePage() {
  const [[clubes, errClubes], [partidosData, errPartidos], [torneos, errTorneos], [stats, errStats]] = await Promise.all([
    safeFetch(() => getClubes(), []),
    safeFetch(() => getPartidos(), { data: [], total: 0, page: 1, per_page: 25, total_pages: 1 } satisfies PartidoPage),
    safeFetch(() => getTorneos(), []),
    safeFetch(() => getGlobalStats(), { total_partidos: 348, total_goles: 892, total_clubes: 19 }),
  ]);

  const torneo = errTorneos ? null : torneoActual(torneos);
  const [[tabla, errTabla]] = await Promise.all([
    safeFetch(() => getTabla(torneo ?? undefined), []),
  ]);

  const hasErrors = errClubes || errPartidos || errTabla || errStats;

  return (
    <>
      <JsonLd data={buildWebSiteSchema({ description: "Portal oficial de datos y estadísticas del fútbol paraguayo." })} />
      <CinematicHero
        stats={{
          partidos: stats?.total_partidos ?? 348,
          goles: stats?.total_goles ?? 892,
          clubes: stats?.total_clubes ?? 19,
        }}
      />
      <div className="max-w-6xl mx-auto px-4 py-12">
      <HeroStats
        clubesCount={clubes.length}
        partidosTotal={partidosData.total}
        equiposCount={tabla.length}
        torneoLabel={torneo}
        hasErrors={!!hasErrors}
        errClubes={errClubes}
        errPartidos={errPartidos}
        errTorneos={errTorneos}
        errTabla={errTabla}
      />

      {tabla.length > 0 && (
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-4 titulo-modulo">Tabla de Posiciones</h2>
          <div className="overflow-x-auto rounded-xl border border-borde-sutil bg-bg-secundario/60">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-borde-sutil text-texto-secundario uppercase tracking-wider text-xs">
                  <th className="p-4 text-left">Pos</th>
                  <th className="p-4 text-left">Club</th>
                  <th className="p-4">PJ</th>
                  <th className="p-4">PG</th>
                  <th className="p-4">PE</th>
                  <th className="p-4">PP</th>
                  <th className="p-4">DG</th>
                  <th className="p-4">Pts</th>
                </tr>
              </thead>
              <tbody>
                {tabla.slice(0, 4).map((row, idx) => (
                  <tr key={`${row.club_id}-${idx}`} className="border-b border-borde-sutil transition-all duration-150 hover:bg-bg-terciario hover:translate-x-0.5">
                    <td className="p-4 font-bold">{row.posicion}</td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        {row.escudo && (
                          <Image src={row.escudo} alt="" width={20} height={20} loading="lazy" className="w-5 h-5 object-contain shrink-0 rounded-sm shadow-[0_1px_3px_rgba(0,0,0,0.3)]" />
                        )}
                        {row.club}
                      </div>
                    </td>
                    <td className="p-4 text-center text-texto-principal">{row.pj}</td>
                    <td className="p-4 text-center text-victoria">{row.pg}</td>
                    <td className="p-4 text-center text-empate">{row.pe}</td>
                    <td className="p-4 text-center text-derrota">{row.pp}</td>
                    <td className={`p-4 text-center font-semibold ${row.dg > 0 ? "text-victoria" : row.dg < 0 ? "text-derrota" : "text-texto-principal"}`}>
                      {row.dg > 0 ? `+${row.dg}` : row.dg}
                    </td>
                    <td className="p-4 text-center font-bold text-apf-rojo">{row.puntos}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-3 text-right">
            <Link href="/tabla" className="text-sm text-apf-rojo hover:underline">Ver tabla completa →</Link>
          </div>
        </section>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Link href="/clubes" className="p-6 rounded-xl border border-borde-sutil bg-bg-secundario/60 hover:bg-bg-secundario hover:border-l-apf-rojo transition-all duration-200 border-l-3">
          <h3 className="text-lg font-bold mb-2">Clubes</h3>
          <p className="text-texto-secundario text-sm">Explora todos los clubes de la liga paraguaya</p>
        </Link>
        <Link href="/partidos" className="p-6 rounded-xl border border-borde-sutil bg-bg-secundario/60 hover:bg-bg-secundario hover:border-l-apf-rojo transition-all duration-200 border-l-3">
          <h3 className="text-lg font-bold mb-2">Partidos</h3>
          <p className="text-texto-secundario text-sm">Calendario y resultados de la temporada</p>
        </Link>
      </div>
      </div>
    </>
  );
}
