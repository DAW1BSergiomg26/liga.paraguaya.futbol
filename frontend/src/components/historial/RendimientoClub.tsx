// frontend/src/components/historial/RendimientoClub.tsx
"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { getClubes, getClubHistorial } from "@/lib/api";
import type { Club, ClubTemporadaHistorica } from "@/types";

export default function RendimientoClub() {
  const [clubId, setClubId] = useState("");
  const { data: clubes } = useQuery<Club[]>({
    queryKey: ["clubes-historial"],
    queryFn: () => getClubes(),
    staleTime: 300_000,
  });

  const { data: historial, isLoading } = useQuery<ClubTemporadaHistorica[]>({
    queryKey: ["club-historial", clubId],
    queryFn: () => getClubHistorial(clubId),
    enabled: clubId !== "",
    staleTime: 300_000,
  });

  const chartData = (historial || []).map((h) => ({
    temporada: h.torneo,
    posicion: h.posicion,
  }));

  return (
    <div>
      <select
        value={clubId}
        onChange={(e) => setClubId(e.target.value)}
        className="px-4 py-2 rounded-lg bg-bg-noche border border-borde-sutil text-texto-principal text-sm mb-8"
      >
        <option value="">Seleccioná un club</option>
        {(clubes || []).map((c) => (
          <option key={c.id} value={c.id}>{c.nombre}</option>
        ))}
      </select>

      {clubId === "" ? (
        <p className="text-texto-secundario text-center py-12">Elegí un club para ver su historial.</p>
      ) : isLoading ? (
        <div className="h-40 bg-bg-secundario rounded-xl animate-pulse" />
      ) : !historial || historial.length === 0 ? (
        <p className="text-texto-secundario text-center py-12">Sin datos históricos para este club.</p>
      ) : (
        <div className="space-y-10">
          <div className="bg-bg-secundario border border-borde-sutil rounded-xl p-6">
            <h3 className="text-texto-principal font-semibold mb-4">Posición por temporada</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2C2C2E" />
                <XAxis dataKey="temporada" tick={{ fill: "#94a3b8", fontSize: 10 }} />
                <YAxis reversed domain={[1, "dataMax"]} tick={{ fill: "#94a3b8", fontSize: 11 }} allowDecimals={false} />
                <Tooltip />
                <Line type="monotone" dataKey="posicion" stroke="#CC001C" strokeWidth={2} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="overflow-x-auto bg-bg-secundario border border-borde-sutil rounded-xl">
            <table className="w-full text-sm text-texto-principal">
              <thead className="text-texto-secundario">
                <tr className="border-b border-borde-sutil">
                  <th className="px-3 py-2 text-left">Temporada</th>
                  <th className="px-2 py-2 text-center">Posición</th>
                  <th className="px-2 py-2 text-center">PTS</th>
                  <th className="px-2 py-2 text-center">DG</th>
                </tr>
              </thead>
              <tbody>
                {historial.map((h) => (
                  <tr key={h.torneo} className="border-b border-borde-sutil/50">
                    <td className="px-3 py-2">{h.torneo}</td>
                    <td className="px-2 py-2 text-center font-bold">{h.posicion}</td>
                    <td className="px-2 py-2 text-center">{h.puntos}</td>
                    <td className="px-2 py-2 text-center">{h.dg}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
