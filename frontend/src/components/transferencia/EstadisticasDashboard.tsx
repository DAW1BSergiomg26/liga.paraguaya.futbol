"use client";

import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import type { EstadisticasTransferencias } from "@/types";

const COLORS = ["#CC001C", "#00619E", "#FFCC00", "#1a4731", "#8B5CF6", "#F97316", "#06B6D4"];

export default function EstadisticasDashboard({ stats }: { stats: EstadisticasTransferencias }) {
  const tipoData = Object.entries(stats.distribucion_tipos).map(([name, value]) => ({ name, value }));
  const posData = Object.entries(stats.distribucion_posiciones).map(([name, value]) => ({ name, value }));
  const clubData = stats.gasto_total_por_club.slice(0, 10).map((c) => ({
    name: c.club_nombre.length > 12 ? c.club_nombre.slice(0, 12) + "…" : c.club_nombre,
    gastado: c.total_gastado,
    recibido: c.total_recibido,
  }));

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-bg-secundario border border-borde-sutil rounded-xl p-6 text-center">
          <p className="text-3xl font-bold text-apf-rojo">{stats.total_transferencias}</p>
          <p className="text-texto-secundario text-sm mt-1">Total transferencias</p>
        </div>
        <div className="bg-bg-secundario border border-borde-sutil rounded-xl p-6 text-center">
          <p className="text-3xl font-bold text-apf-dorado">
            ${stats.gasto_total_por_club.reduce((s, c) => s + c.total_gastado, 0).toFixed(1)}M
          </p>
          <p className="text-texto-secundario text-sm mt-1">Gasto total</p>
        </div>
        <div className="bg-bg-secundario border border-borde-sutil rounded-xl p-6 text-center">
          <p className="text-3xl font-bold text-green-400">
            ${stats.top_compras[0]?.monto?.toFixed(1) || 0}M
          </p>
          <p className="text-texto-secundario text-sm mt-1">Fichaje más caro</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-bg-secundario border border-borde-sutil rounded-xl p-6">
          <h3 className="text-texto-principal font-semibold mb-4">Por tipo</h3>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={tipoData} cx="50%" cy="50%" outerRadius={70} dataKey="value" label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}>
                {tipoData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-bg-secundario border border-borde-sutil rounded-xl p-6">
          <h3 className="text-texto-principal font-semibold mb-4">Por posición</h3>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={posData} cx="50%" cy="50%" outerRadius={70} dataKey="value" label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}>
                {posData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {clubData.length > 0 && (
        <div className="bg-bg-secundario border border-borde-sutil rounded-xl p-6">
          <h3 className="text-texto-principal font-semibold mb-4">Gasto por club (Top 10)</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={clubData}>
              <XAxis dataKey="name" tick={{ fill: "#94a3b8", fontSize: 11 }} />
              <YAxis tick={{ fill: "#94a3b8", fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="gastado" fill="#CC001C" radius={[4, 4, 0, 0]} />
              <Bar dataKey="recibido" fill="#00619E" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
