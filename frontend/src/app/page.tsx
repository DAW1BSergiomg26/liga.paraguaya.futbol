import { getClubes, getPartidos, getTabla, getTorneos } from "@/lib/api";
import type { PartidoPage } from "@/types";
import Link from "next/link";

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
  return torneos.sort().reverse()[0];
}

export default async function HomePage() {
  const [[clubes, errClubes], [partidosData, errPartidos], [torneos, errTorneos]] = await Promise.all([
    safeFetch(() => getClubes(), []),
    safeFetch(() => getPartidos(), { data: [], total: 0, page: 1, per_page: 25, total_pages: 1 } satisfies PartidoPage),
    safeFetch(() => getTorneos(), []),
  ]);

  const torneo = errTorneos ? null : torneoActual(torneos);
  const [[tabla, errTabla]] = await Promise.all([
    safeFetch(() => getTabla(torneo ?? undefined), []),
  ]);

  const hasErrors = errClubes || errPartidos || errTabla;

  return (
    <div className="max-w-6xl mx-auto px-4 py-12">
      <section className="mb-12 p-8 rounded-2xl border border-borde-marca bg-bg-secundario/80 shadow-xl">
        <p className="text-py-rojo text-sm font-bold uppercase tracking-widest mb-3">
          Proyecto DAW · Next.js + FastAPI
        </p>
        <h1 className="text-4xl sm:text-6xl font-bold leading-tight mb-4 titulo-modulo">
          Liga Paraguaya de Fútbol
        </h1>
        <p className="text-texto-secundario max-w-xl text-lg">
          Plataforma de datos, clubes, partidos y tabla de posiciones del fútbol paraguayo.
        </p>
        {torneo && (
          <p className="text-texto-apagado text-sm mt-2">
            Temporada actual: <span className="text-texto-principal font-medium">{torneo}</span>
          </p>
        )}
        {hasErrors ? (
          <div className="inline-flex items-center gap-2 mt-6 px-4 py-2 rounded-full bg-derrota/20 text-derrota border border-derrota/30 text-sm">
            <span className="w-2.5 h-2.5 rounded-full bg-derrota shadow-lg shadow-derrota/50" />
            Error de conexión con el backend
          </div>
        ) : (
          <div className="inline-flex items-center gap-2 mt-6 px-4 py-2 rounded-full bg-victoria/20 text-victoria border border-victoria/30 text-sm">
            <span className="w-2.5 h-2.5 rounded-full bg-victoria shadow-lg shadow-victoria/50" />
            Backend activo correctamente
          </div>
        )}
      </section>

      {errClubes && (
        <div className="mb-4 px-4 py-3 rounded-lg bg-derrota/20 border border-derrota/30 text-derrota text-sm">
          Error al cargar clubes: {errClubes}
        </div>
      )}
      {errPartidos && (
        <div className="mb-4 px-4 py-3 rounded-lg bg-derrota/20 border border-derrota/30 text-derrota text-sm">
          Error al cargar partidos: {errPartidos}
        </div>
      )}
      {errTorneos && (
        <div className="mb-4 px-4 py-3 rounded-lg bg-derrota/20 border border-derrota/30 text-derrota text-sm">
          Error al cargar torneos: {errTorneos}
        </div>
      )}
      {errTabla && (
        <div className="mb-4 px-4 py-3 rounded-lg bg-derrota/20 border border-derrota/30 text-derrota text-sm">
          Error al cargar tabla: {errTabla}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-12">
        <div className="p-6 rounded-xl bg-bg-secundario/60 border border-borde-sutil text-center">
          <p className="text-3xl font-bold text-py-rojo">{clubes.length}</p>
          <p className="text-texto-secundario mt-1">Clubes</p>
        </div>
        <div className="p-6 rounded-xl bg-bg-secundario/60 border border-borde-sutil text-center">
          <p className="text-3xl font-bold text-py-rojo">{partidosData.total}</p>
          <p className="text-texto-secundario mt-1">Partidos</p>
        </div>
        <div className="p-6 rounded-xl bg-bg-secundario/60 border border-borde-sutil text-center">
          <p className="text-3xl font-bold text-py-rojo">{tabla.length}</p>
          <p className="text-texto-secundario mt-1">Equipos en tabla</p>
        </div>
      </div>

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
                {tabla.slice(0, 4).map((row) => (
                  <tr key={row.club_id} className="border-b border-borde-sutil transition-all duration-150 hover:bg-bg-terciario hover:translate-x-0.5">
                    <td className="p-4 font-bold">{row.posicion}</td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        {row.escudo && (
                          <img src={row.escudo} alt="" className="w-5 h-5 object-contain shrink-0 rounded-sm shadow-[0_1px_3px_rgba(0,0,0,0.3)]" />
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
                    <td className="p-4 text-center font-bold text-py-rojo">{row.puntos}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-3 text-right">
            <Link href="/tabla" className="text-sm text-py-rojo hover:underline">Ver tabla completa →</Link>
          </div>
        </section>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Link href="/clubes" className="p-6 rounded-xl border border-borde-sutil bg-bg-secundario/60 hover:bg-bg-secundario transition">
          <h3 className="text-lg font-bold mb-2">Clubes</h3>
          <p className="text-texto-secundario text-sm">Explora todos los clubes de la liga paraguaya</p>
        </Link>
        <Link href="/partidos" className="p-6 rounded-xl border border-borde-sutil bg-bg-secundario/60 hover:bg-bg-secundario transition">
          <h3 className="text-lg font-bold mb-2">Partidos</h3>
          <p className="text-texto-secundario text-sm">Calendario y resultados de la temporada</p>
        </Link>
      </div>
    </div>
  );
}
