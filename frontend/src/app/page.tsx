import { getClubes, getPartidos, getTabla } from "@/lib/api";
import type { PartidoPage } from "@/types";
import Link from "next/link";

export default async function HomePage() {
  const [clubes, partidosData, tabla] = await Promise.all([
    getClubes().catch(() => []),
    getPartidos().catch(() => ({ data: [], total: 0, page: 1, per_page: 25, total_pages: 1 } satisfies PartidoPage)),
    getTabla().catch(() => []),
  ]);

  return (
    <div className="max-w-6xl mx-auto px-4 py-12">
      {/* Hero */}
      <section className="mb-12 p-8 rounded-2xl border border-white/10 bg-[#0a1628]/80 shadow-xl">
        <p className="text-[#76e4f7] text-sm font-bold uppercase tracking-widest mb-3">
          Proyecto DAW · Next.js + FastAPI
        </p>
        <h1 className="text-4xl sm:text-6xl font-bold leading-tight mb-4">
          Liga Paraguaya de Fútbol
        </h1>
        <p className="text-gray-400 max-w-xl text-lg">
          Plataforma de datos, clubes, partidos y tabla de posiciones del fútbol paraguayo.
        </p>
        <div className="inline-flex items-center gap-2 mt-6 px-4 py-2 rounded-full bg-green-900/30 text-green-300 border border-green-500/30 text-sm">
          <span className="w-2.5 h-2.5 rounded-full bg-green-400 shadow-lg shadow-green-400/50" />
          Backend activo correctamente
        </div>
      </section>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-12">
        <div className="p-6 rounded-xl bg-[#0a1628]/60 border border-white/5 text-center">
          <p className="text-3xl font-bold text-[#76e4f7]">{clubes.length}</p>
          <p className="text-gray-400 mt-1">Clubes</p>
        </div>
        <div className="p-6 rounded-xl bg-[#0a1628]/60 border border-white/5 text-center">
          <p className="text-3xl font-bold text-[#76e4f7]">{partidosData.total}</p>
          <p className="text-gray-400 mt-1">Partidos</p>
        </div>
        <div className="p-6 rounded-xl bg-[#0a1628]/60 border border-white/5 text-center">
          <p className="text-3xl font-bold text-[#76e4f7]">{tabla.length}</p>
          <p className="text-gray-400 mt-1">Equipos en tabla</p>
        </div>
      </div>

      {/* Top Table */}
      {tabla.length > 0 && (
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-4">Tabla de Posiciones</h2>
          <div className="overflow-x-auto rounded-xl border border-white/10 bg-[#0a1628]/60">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10 text-gray-400 uppercase text-xs">
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
                  <tr key={row.club_id} className="border-b border-white/5 hover:bg-white/5">
                    <td className="p-4 font-bold">{row.posicion}</td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        {row.escudo && (
                          <img src={row.escudo} alt="" className="w-5 h-5 object-contain shrink-0" />
                        )}
                        {row.club}
                      </div>
                    </td>
                    <td className="p-4 text-center">{row.pj}</td>
                    <td className="p-4 text-center">{row.pg}</td>
                    <td className="p-4 text-center">{row.pe}</td>
                    <td className="p-4 text-center">{row.pp}</td>
                    <td className="p-4 text-center">{row.dg}</td>
                    <td className="p-4 text-center font-bold text-[#76e4f7]">{row.puntos}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-3 text-right">
            <Link href="/tabla" className="text-sm text-[#76e4f7] hover:underline">Ver tabla completa →</Link>
          </div>
        </section>
      )}

      {/* Quick Links */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Link href="/clubes" className="p-6 rounded-xl border border-white/10 bg-[#0a1628]/60 hover:bg-[#0a1628] transition">
          <h3 className="text-lg font-bold mb-2">Clubes</h3>
          <p className="text-gray-400 text-sm">Explora todos los clubes de la liga paraguaya</p>
        </Link>
        <Link href="/partidos" className="p-6 rounded-xl border border-white/10 bg-[#0a1628]/60 hover:bg-[#0a1628] transition">
          <h3 className="text-lg font-bold mb-2">Partidos</h3>
          <p className="text-gray-400 text-sm">Calendario y resultados de la temporada</p>
        </Link>
      </div>
    </div>
  );
}
