// frontend/src/components/transferencia/MercadoStats.tsx
"use client";

import type { EstadisticasTransferencias, GastoPorClub } from "@/types";
import SmartImage from "@/components/ui/SmartImage";

function formatMonto(m: number | null | undefined): string {
  if (m === null || m === undefined) return "-";
  return `$${m}M`;
}

function maxGastado(list: GastoPorClub[]): number {
  return list.reduce((acc, g) => Math.max(acc, g.total_gastado || 0), 0);
}

export default function MercadoStats({ data }: { data: EstadisticasTransferencias }) {
  const topCompras = [...data.top_compras]
    .sort((a, b) => (b.monto || 0) - (a.monto || 0))
    .slice(0, 5);

  const gastoOrdenado = [...data.gasto_total_por_club].sort(
    (a, b) => (b.total_gastado || 0) - (a.total_gastado || 0)
  );
  const maxG = maxGastado(gastoOrdenado) || 1;

  const posiciones = Object.entries(data.distribucion_posiciones || {}).sort(
    (a, b) => b[1] - a[1]
  );
  const tipos = Object.entries(data.distribucion_tipos || {}).sort(
    (a, b) => b[1] - a[1]
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-8">
      {/* Total + distribución tipos */}
      <div className="bg-bg-secundario border border-borde-sutil rounded-xl p-5 flex flex-col">
        <p className="text-texto-secundario text-sm">Movimientos registrados</p>
        <p className="text-4xl font-bold text-apf-dorado mt-1">
          {data.total_transferencias}
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          {tipos.map(([tipo, n]) => (
            <span
              key={tipo}
              className="text-xs px-2 py-1 rounded-full bg-bg-noche text-texto-secundario capitalize"
            >
              {tipo} · {n}
            </span>
          ))}
        </div>
      </div>

      {/* Top compras */}
      <div className="bg-bg-secundario border border-borde-sutil rounded-xl p-5">
        <p className="text-texto-secundario text-sm mb-3">Top fichajes por monto</p>
        <ul className="flex flex-col gap-3">
          {topCompras.map((t, i) => (
            <li key={t.id} className="flex items-center gap-3">
              <span className="text-apf-dorado font-bold w-4 text-sm">{i + 1}</span>
              <div className="w-8 h-8 rounded-full bg-bg-noche flex items-center justify-center overflow-hidden flex-shrink-0">
                <SmartImage
                  src={t.club_destino_escudo}
                  alt=""
                  width={28}
                  height={28}
                  className="object-contain"
                  fallback={<span className="text-texto-secundario text-[10px]">?</span>}
                />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-texto-principal text-sm font-medium truncate">{t.jugador_nombre}</p>
                <p className="text-texto-secundario text-xs truncate">
                  {t.club_destino_nombre || "Libre"}
                </p>
              </div>
              <span className="text-apf-dorado font-semibold text-sm whitespace-nowrap">
                {formatMonto(t.monto)}
              </span>
            </li>
          ))}
          {topCompras.length === 0 && (
            <li className="text-texto-secundario text-sm">Sin datos de monto</li>
          )}
        </ul>
      </div>

      {/* Gasto por club */}
      <div className="bg-bg-secundario border border-borde-sutil rounded-xl p-5">
        <p className="text-texto-secundario text-sm mb-3">Inversión por club</p>
        <ul className="flex flex-col gap-2.5">
          {gastoOrdenado.map((g) => {
            const pct = Math.max(4, Math.round(((g.total_gastado || 0) / maxG) * 100));
            return (
              <li key={g.club_id}>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-texto-principal truncate">{g.club_nombre}</span>
                  <span className="text-apf-dorado font-semibold">{formatMonto(g.total_gastado)}</span>
                </div>
                <div className="h-2 rounded-full bg-bg-noche overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-apf-rojo to-apf-dorado transition-all duration-700"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </li>
            );
          })}
          {gastoOrdenado.length === 0 && (
            <li className="text-texto-secundario text-sm">Sin movimientos</li>
          )}
        </ul>
      </div>

      {/* Distribución por posición (full width) */}
      <div className="lg:col-span-3 bg-bg-secundario border border-borde-sutil rounded-xl p-5">
        <p className="text-texto-secundario text-sm mb-3">Distribución por posición</p>
        <div className="flex flex-wrap gap-2">
          {posiciones.map(([pos, n]) => (
            <span
              key={pos}
              className="text-xs px-3 py-1.5 rounded-lg bg-bg-noche text-texto-principal border border-borde-sutil"
            >
              {pos} <span className="text-apf-dorado font-semibold">{n}</span>
            </span>
          ))}
          {posiciones.length === 0 && (
            <span className="text-texto-secundario text-sm">Sin datos</span>
          )}
        </div>
      </div>
    </div>
  );
}
