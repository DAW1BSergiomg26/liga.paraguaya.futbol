// frontend/src/components/red3d/Red2DFallback.tsx
"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import { escudoUrl } from "@/lib/escudos";

/* ── Interfaces ───────────────────────────────────────────── */

interface ClubNode {
  id: string;
  name: string;
  short: string;
  val: number;
  color: string;
  label: string;
  titulos?: number;
  intl?: number;
  movimientos?: number;
  escudo?: string;
}

interface ClubLink {
  source: string | ClubNode;
  target: string | ClubNode;
  value: number;
  label: string;
  w: number;
  transferenciaId?: string;
  tipo?: string;
  monto?: number;
}

interface GraphData {
  nodes: ClubNode[];
  links: ClubLink[];
}

interface TransferItem {
  id?: string;
  club_origen_id?: string;
  club_destino_id?: string;
  club_origen_nombre?: string;
  club_destino_nombre?: string;
  monto?: number;
  fecha?: string;
  jugador_nombre?: string;
  tipo?: string;
}

interface Red2DFallbackProps {
  rivalidadesData: GraphData;
  transfers: TransferItem[];
  onClubClick: (id: string) => void;
}

type TabId = "rivalidades" | "fichajes";

/* ── Componente ───────────────────────────────────────────── */

export default function Red2DFallback({
  rivalidadesData,
  transfers,
  onClubClick,
}: Red2DFallbackProps) {
  const [activeTab, setActiveTab] = useState<TabId>("rivalidades");
  const [expandedClub, setExpandedClub] = useState<string | null>(null);

  const toggleClub = (id: string) => {
    setExpandedClub((prev) => (prev === id ? null : id));
  };

  /* Rivalidades agrupadas por club */
  const rivalidadesByClub = useMemo(() => {
    const map = new Map<
      string,
      { club: ClubNode; rivalidades: Array<{ rival: string; rivalId: string; label: string; intensity: number }> }
    >();

    for (const node of rivalidadesData.nodes) {
      map.set(node.id, { club: node, rivalidades: [] });
    }

    for (const link of rivalidadesData.links) {
      const sourceId = typeof link.source === "string" ? link.source : link.source.id;
      const targetId = typeof link.target === "string" ? link.target : link.target.id;
      const sourceEntry = map.get(sourceId);
      const targetEntry = map.get(targetId);
      if (sourceEntry && targetEntry) {
        sourceEntry.rivalidades.push({
          rival: targetEntry.club.name,
          rivalId: targetId,
          label: link.label,
          intensity: link.value,
        });
        targetEntry.rivalidades.push({
          rival: sourceEntry.club.name,
          rivalId: sourceId,
          label: link.label,
          intensity: link.value,
        });
      }
    }

    return [...map.values()].sort((a, b) => (b.club.titulos ?? 0) - (a.club.titulos ?? 0));
  }, [rivalidadesData]);

  /* Fichajes agrupados por club destino */
  const fichajesByClub = useMemo(() => {
    const clubMap = new Map<
      string,
      {
        id: string;
        nombre: string;
        fichajes: TransferItem[];
        totalInversion: number;
      }
    >();

    for (const t of transfers) {
      const destId = t.club_destino_id;
      if (!destId) continue;
      if (!clubMap.has(destId)) {
        clubMap.set(destId, {
          id: destId,
          nombre: t.club_destino_nombre ?? destId,
          fichajes: [],
          totalInversion: 0,
        });
      }
      const entry = clubMap.get(destId)!;
      entry.fichajes.push(t);
      entry.totalInversion += t.monto ?? 0;
    }

    return [...clubMap.values()].sort((a, b) => b.totalInversion - a.totalInversion);
  }, [transfers]);

  return (
    <div className="space-y-4">
      {/* Tabs */}
      <div className="flex gap-2 p-1 rounded-xl bg-bg-secundario/70 backdrop-blur border border-borde-sutil">
        <button
          onClick={() => setActiveTab("rivalidades")}
          className={`flex-1 px-4 py-2.5 rounded-lg text-sm font-semibold transition ${
            activeTab === "rivalidades"
              ? "bg-apf-rojo text-white shadow-lg"
              : "text-texto-secundario hover:text-texto-principal"
          }`}
        >
          🟥 Rivalidades
        </button>
        <button
          onClick={() => setActiveTab("fichajes")}
          className={`flex-1 px-4 py-2.5 rounded-lg text-sm font-semibold transition ${
            activeTab === "fichajes"
              ? "bg-apf-dorado/90 text-bg-noche shadow-lg"
              : "text-texto-secundario hover:text-texto-principal"
          }`}
        >
          🟨 Mercado de Fichajes
        </button>
      </div>

      {/* Contenido */}
      {activeTab === "rivalidades" ? (
        <RivalidadesView
          data={rivalidadesByClub}
          expandedClub={expandedClub}
          onToggleClub={toggleClub}
          onClubClick={onClubClick}
        />
      ) : (
        <FichajesView
          data={fichajesByClub}
          expandedClub={expandedClub}
          onToggleClub={toggleClub}
          onClubClick={onClubClick}
        />
      )}
    </div>
  );
}

/* ── Sub-vista: Rivalidades ───────────────────────────────── */

interface RivalidadEntry {
  rival: string;
  rivalId: string;
  label: string;
  intensity: number;
}

interface RivalidadClub {
  club: ClubNode;
  rivalidades: RivalidadEntry[];
}

function RivalidadesView({
  data,
  expandedClub,
  onToggleClub,
  onClubClick,
}: {
  data: RivalidadClub[];
  expandedClub: string | null;
  onToggleClub: (id: string) => void;
  onClubClick: (id: string) => void;
}) {
  return (
    <div className="space-y-2">
      {data.map(({ club, rivalidades }) => {
        const isExpanded = expandedClub === club.id;
        const escudo = escudoUrl(club.id);
        return (
          <div
            key={club.id}
            className="rounded-xl border border-borde-sutil bg-bg-secundario/60 overflow-hidden transition-all duration-200"
          >
            {/* Cabecera del club */}
            <button
              onClick={() => onToggleClub(club.id)}
              className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-bg-terciario/30 transition-colors"
            >
              {escudo && (
                <Image
                  src={escudo}
                  alt={club.name}
                  width={36}
                  height={36}
                  loading="lazy"
                  className="w-9 h-9 object-contain shrink-0"
                />
              )}
              <div className="flex-1 min-w-0">
                <p className="text-texto-principal font-semibold text-sm truncate">{club.name}</p>
                <p className="text-texto-apagado text-xs">
                  {club.titulos ?? 0} títulos · {rivalidades.length} rivalidade{rivalidades.length !== 1 ? "s" : ""}
                </p>
              </div>
              <span className={`text-texto-apagado text-lg transition-transform duration-200 ${isExpanded ? "rotate-90" : ""}`}>
                ›
              </span>
            </button>

            {/* Lista de rivalidades expandida */}
            {isExpanded && rivalidades.length > 0 && (
              <div className="px-4 pb-3 space-y-1.5 border-t border-borde-sutil/50">
                {rivalidades.map((r) => {
                  const rivalEscudo = escudoUrl(r.rivalId);
                  return (
                    <button
                      key={r.rivalId}
                      onClick={() => onClubClick(r.rivalId)}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-bg-noche/60 transition-colors text-left"
                    >
                      {rivalEscudo && (
                        <Image
                          src={rivalEscudo}
                          alt={r.rival}
                          width={28}
                          height={28}
                          loading="lazy"
                          className="w-7 h-7 object-contain shrink-0"
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-texto-principal text-sm font-medium truncate">{r.rival}</p>
                        <p className="text-texto-apagado text-xs truncate">{r.label}</p>
                      </div>
                      {/* Barra de intensidad */}
                      <div className="w-16 h-1.5 rounded-full bg-bg-noche overflow-hidden shrink-0">
                        <div
                          className="h-full rounded-full bg-apf-rojo/70"
                          style={{ width: `${Math.min((r.intensity / 200) * 100, 100)}%` }}
                        />
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ── Sub-vista: Fichajes ──────────────────────────────────── */

interface FichajesClub {
  id: string;
  nombre: string;
  fichajes: TransferItem[];
  totalInversion: number;
}

function FichajesView({
  data,
  expandedClub,
  onToggleClub,
  onClubClick,
}: {
  data: FichajesClub[];
  expandedClub: string | null;
  onToggleClub: (id: string) => void;
  onClubClick: (id: string) => void;
}) {
  if (data.length === 0) {
    return (
      <div className="text-center py-12 text-texto-apagado text-sm">
        No hay fichajes registrados para mostrar.
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {data.map((club) => {
        const isExpanded = expandedClub === club.id;
        const escudo = escudoUrl(club.id);
        return (
          <div
            key={club.id}
            className="rounded-xl border border-borde-sutil bg-bg-secundario/60 overflow-hidden transition-all duration-200"
          >
            {/* Cabecera */}
            <button
              onClick={() => onToggleClub(club.id)}
              className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-bg-terciario/30 transition-colors"
            >
              {escudo && (
                <Image
                  src={escudo}
                  alt={club.nombre}
                  width={36}
                  height={36}
                  loading="lazy"
                  className="w-9 h-9 object-contain shrink-0"
                />
              )}
              <div className="flex-1 min-w-0">
                <p className="text-texto-principal font-semibold text-sm truncate">{club.nombre}</p>
                <p className="text-texto-apagado text-xs">
                  {club.fichajes.length} fichaje{club.fichajes.length !== 1 ? "s" : ""} · ${club.totalInversion}M total
                </p>
              </div>
              <span className={`text-texto-apagado text-lg transition-transform duration-200 ${isExpanded ? "rotate-90" : ""}`}>
                ›
              </span>
            </button>

            {/* Lista de fichajes expandida */}
            {isExpanded && (
              <div className="px-4 pb-3 space-y-1.5 border-t border-borde-sutil/50">
                {club.fichajes.map((f, idx) => (
                  <div
                    key={f.id ?? idx}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-bg-noche/40"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-texto-principal text-sm font-medium truncate">
                        {f.jugador_nombre ?? "Jugador desconocido"}
                      </p>
                      <p className="text-texto-apagado text-xs">
                        {f.club_origen_nombre ?? "—"} → {club.nombre}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-apf-dorado text-sm font-semibold">${f.monto ?? 0}M</p>
                      {f.tipo && <p className="text-texto-apagado text-[10px] capitalize">{f.tipo}</p>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
