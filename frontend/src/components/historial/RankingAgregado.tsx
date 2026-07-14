// frontend/src/components/historial/RankingAgregado.tsx
"use client";

import { useQuery } from "@tanstack/react-query";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { getCampeones, getRankingClubes } from "@/lib/api";
import type { CampeonHistorico, RankingClubHistorico } from "@/types";

const COLORS = ["#CC001C", "#00619E", "#FFCC00", "#1a4731", "#8B5CF6", "#F97316"];

export default function RankingAgregado() {
  const { data: campeones, isLoading: l1 } = useQuery<CampeonHistorico[]>({
    queryKey: ["campeones"],
    queryFn: () => getCampeones(),
    staleTime: 300_000,
  });
  const { data: ranking, isLoading: l2 } = useQuery<RankingClubHistorico[]>({
    queryKey: ["ranking-clubes"],
    queryFn: () => getRankingClubes(),
    staleTime: 300_000,
  });

  if (l1 || l2) {
    return <div className="h-40 bg-bg-secundario rounded-xl animate-pulse" />;
  }

  const topTitulos = (ranking || [])
    .filter((r) => r.titulos > 0)
    .slice(0, 8)
    .map((r) => ({ name: r.club, titulos: r.titulos }));

  return (
    <div className="space-y-10">
      <section>
        <h2 className="text-xl font-semibold text-texto-principal mb-4">Campeones por año</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {(campeones || []).map((c) => (
            <div key={c.torneo} className="bg-bg-secundario border border-borde-sutil rounded-xl p-4 flex items-center gap-3">
              {c.escudo ? (
                <img src={c.escudo} alt="" className="w-10 h-10 object-contain" />
              ) : (
                <div className="w-10 h-10 rounded-full bg-bg-noche" />
              )}
              <div>
                <p className="text-texto-secundario text-xs">{c.torneo}</p>
                <p className="text-texto-principal font-semibold">{c.club}</p>
                <p className="text-apf-dorado text-sm">{c.puntos} pts</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-xl font-semibold text-texto-principal mb-4">Tabla all-time</h2>
        <div className="overflow-x-auto bg-bg-secundario border border-borde-sutil rounded-xl">
          <table className="w-full text-sm text-texto-principal">
            <thead className="text-texto-secundario">
              <tr className="border-b border-borde-sutil">
                <th className="px-3 py-2 text-left">Club</th>
                <th className="px-2 py-2 text-center">Títulos</th>
                <th className="px-2 py-2 text-center">PJ</th>
                <th className="px-2 py-2 text-center">GF</th>
                <th className="px-2 py-2 text-center">GC</th>
                <th className="px-2 py-2 text-center">DG</th>
                <th className="px-2 py-2 text-center">PTS</th>
              </tr>
            </thead>
            <tbody>
              {(ranking || []).map((r) => (
                <tr key={r.club_id} className="border-b border-borde-sutil/50">
                  <td className="px-3 py-2 font-medium flex items-center gap-2">
                    {r.escudo ? <img src={r.escudo} alt="" className="w-5 h-5 object-contain" /> : null}
                    {r.club}
                  </td>
                  <td className="px-2 py-2 text-center font-bold text-apf-dorado">{r.titulos}</td>
                  <td className="px-2 py-2 text-center">{r.pj}</td>
                  <td className="px-2 py-2 text-center">{r.gf}</td>
                  <td className="px-2 py-2 text-center">{r.gc}</td>
                  <td className="px-2 py-2 text-center">{r.dg}</td>
                  <td className="px-2 py-2 text-center font-bold">{r.puntos}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {topTitulos.length > 0 && (
        <section>
          <h2 className="text-xl font-semibold text-texto-principal mb-4">Títulos por club</h2>
          <div className="bg-bg-secundario border border-borde-sutil rounded-xl p-6">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={topTitulos}>
                <XAxis dataKey="name" tick={{ fill: "#94a3b8", fontSize: 11 }} />
                <YAxis tick={{ fill: "#94a3b8", fontSize: 11 }} allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="titulos" radius={[4, 4, 0, 0]}>
                  {topTitulos.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>
      )}
    </div>
  );
}
