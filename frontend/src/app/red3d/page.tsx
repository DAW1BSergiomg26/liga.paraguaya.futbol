// frontend/src/app/red3d/page.tsx
"use client";

import Image from "next/image";
import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import PageHeader from "@/components/ui/PageHeader";
import { apiFetch } from "@/lib/api";
import { escudoUrl } from "@/lib/escudos";

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

type GraphData = { nodes: ClubNode[]; links: ClubLink[] };

const APF_DORADO = "#FFCC00";

const SHORT: Record<string, string> = {
  olimpia: "Olimpia",
  "cerro-porteno": "Cerro",
  libertad: "Libertad",
  nacional: "Nacional",
  guarani: "Guaraní",
  "sol-de-america": "Sol",
  luqueno: "Luqueño",
  ameliano: "Ameliano",
  "2-de-mayo": "2 de Mayo",
  "san-lorenzo": "S. Lorenzo",
  "general-caballero": "G. Caballero",
  colegiales: "Colegiales",
  recoleta: "Recoleta",
  "rubio-nu": "Rubio Ñu",
  tembetary: "Tembetary",
  trinidense: "Trinidense",
  "general-diaz": "G. Díaz",
  "deportivo-capiata": "Capiatá",
  "3-de-febrero": "3 de Febrero",
};

const CLUB_COLORS: Record<string, string> = {
  olimpia: "#FFFFFF",
  "cerro-porteno": "#3B82F6",
  libertad: "#E5E7EB",
  nacional: "#3B82F6",
  guarani: "#DC2626",
  "sol-de-america": "#FACC15",
  luqueno: "#22C55E",
  ameliano: "#38BDF8",
  "2-de-mayo": "#B91C1C",
  "san-lorenzo": "#2563EB",
  "general-caballero": "#16A34A",
  colegiales: "#EF4444",
  recoleta: "#60A5FA",
  "rubio-nu": "#10B981",
};

const RIVALIDADES_FALLBACK: GraphData = {
  nodes: [
    { id: "olimpia", name: "Club Olimpia", short: "Olimpia", val: 48, color: "#FFFFFF", titulos: 48, intl: 8, label: "" },
    { id: "cerro-porteno", name: "Club Cerro Porteño", short: "Cerro", val: 35, color: "#3B82F6", titulos: 35, intl: 0, label: "" },
    { id: "libertad", name: "Club Libertad", short: "Libertad", val: 26, color: "#E5E7EB", titulos: 26, intl: 0, label: "" },
    { id: "nacional", name: "Club Nacional", short: "Nacional", val: 13, color: "#3B82F6", titulos: 13, intl: 0, label: "" },
    { id: "guarani", name: "Club Guaraní", short: "Guaraní", val: 11, color: "#DC2626", titulos: 11, intl: 0, label: "" },
  ],
  links: [
    { source: "olimpia", target: "cerro-porteno", value: 190, label: "Clásico del Fútbol Paraguayo", w: 3.8 },
    { source: "olimpia", target: "libertad", value: 140, label: "Clásico de barrio", w: 2.8 },
    { source: "cerro-porteno", target: "libertad", value: 130, label: "Rivalidad histórica", w: 2.6 },
  ],
};

interface Graph3DHandle {
  flyTo: (id: string) => void;
  zoomToFit: (ms?: number, pad?: number) => void;
  setAutoRotate: (v: boolean) => void;
}

import Graph3D from "@/components/red3d/Graph3D";

export default function Red3DPage() {
  const isClient = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );
  const [selectedNode, setSelectedNode] = useState<ClubNode | null>(null);
  const [selectedLink, setSelectedLink] = useState<ClubLink | null>(null);
  const [mode, setMode] = useState<"rivalidades" | "fichajes">("rivalidades");
  const [temporada, setTemporada] = useState<string>("todas");
  const [query, setQuery] = useState("");
  const [autoRotate, setAutoRotate] = useState(true);
  const [rivalidadesData, setRivalidadesData] = useState<GraphData>(RIVALIDADES_FALLBACK);
  const [transfers, setTransfers] = useState<unknown[]>([]);
  const handleRef = useRef<Graph3DHandle | null>(null);

  useEffect(() => {
    let active = true;

    fetch("/data/red-clubes.json")
      .then((r) => r.json())
      .then((d: GraphData) => {
        if (!active) return;
        const nodes = d.nodes.map((n) => ({
          ...n,
          short: SHORT[n.id] ?? n.name,
          color: CLUB_COLORS[n.id] ?? n.color,
          escudo: escudoUrl(n.id),
          label: `<div style="color:#020a14;background:${APF_DORADO};padding:6px 10px;border-radius:6px;font-weight:700;font-size:13px;white-space:nowrap">${n.name}<br/><span style="font-size:11px;color:#333">${n.titulos ?? 0} títulos · ${n.intl ?? 0} int.</span></div>`,
        }));
        const links = d.links.map((l) => ({ ...l, w: Math.max(0.5, (l.value || 1) / 50) }));
        setRivalidadesData({ nodes, links });
      })
      .catch(() => {
        if (active) setRivalidadesData(RIVALIDADES_FALLBACK);
      });

    apiFetch<{ transferencias: unknown[] }>("/api/v1/transferencias?per_page=100")
      .then((d) => {
        if (active) setTransfers(d.transferencias ?? []);
      })
      .catch(() => {
        if (active) setTransfers([]);
      });

    return () => {
      active = false;
    };
  }, []);

  const fichajesData = useMemo<GraphData>(() => {
    const list = transfers as Array<{
      id?: string;
      club_origen_id?: string;
      club_destino_id?: string;
      club_origen_nombre?: string;
      club_destino_nombre?: string;
      monto?: number;
      fecha?: string;
      jugador_nombre?: string;
      tipo?: string;
    }>;
    const vis = temporada === "todas" ? list : list.filter((t) => String(new Date(t.fecha ?? "").getFullYear()) === temporada);
    const clubMap = new Map<string, { id: string; name: string; count: number }>();
    const linkMap = new Map<string, { source: string; target: string; value: number; labels: string[]; first?: (typeof list)[number] }>();

    for (const t of vis) {
      const oId = t.club_origen_id;
      const dId = t.club_destino_id;
      if (oId && !clubMap.has(oId)) clubMap.set(oId, { id: oId, name: t.club_origen_nombre ?? oId, count: 0 });
      if (dId && !clubMap.has(dId)) clubMap.set(dId, { id: dId, name: t.club_destino_nombre ?? dId, count: 0 });
      if (oId) (clubMap.get(oId) as { count: number }).count++;
      if (dId) (clubMap.get(dId) as { count: number }).count++;
      if (!oId || !dId) continue;
      const key = `${oId}->${dId}`;
      if (!linkMap.has(key)) linkMap.set(key, { source: oId, target: dId, value: 0, labels: [], first: t });
      const l = linkMap.get(key) as { value: number; labels: string[]; first?: (typeof list)[number] };
      l.value += t.monto ?? 0;
      l.labels.push(`${t.jugador_nombre ?? "Jugador"} · $${(t.monto ?? 0)}M`);
    }

    const nodes: ClubNode[] = [...clubMap.values()].map((c) => ({
      id: c.id,
      name: c.name,
      short: SHORT[c.id] ?? c.name,
      val: Math.max(c.count, 1) * 4,
      color: CLUB_COLORS[c.id] ?? APF_DORADO,
      movimientos: c.count,
      escudo: escudoUrl(c.id),
      label: `<div style="color:#020a14;background:${APF_DORADO};padding:6px 10px;border-radius:6px;font-weight:700;font-size:13px;white-space:nowrap">${c.name}<br/><span style="font-size:11px;color:#333">${c.count} movimientos</span></div>`,
    }));
    const links: ClubLink[] = [...linkMap.values()].map((l) => ({
      source: l.source,
      target: l.target,
      value: Math.max(l.value, 1),
      w: Math.max(0.5, Math.log10(l.value + 1) * 2),
      transferenciaId: l.first?.id,
      tipo: l.first?.tipo,
      monto: l.first?.monto,
      label: `<div style="color:${APF_DORADO};font-weight:600">${l.labels.join("<br/>")}</div>`,
    }));
    return { nodes, links };
  }, [transfers, temporada]);

  const graphData = useMemo<GraphData | null>(
    () => (mode === "rivalidades" ? rivalidadesData : fichajesData),
    [mode, rivalidadesData, fichajesData]
  );

  const clubList = useMemo(
    () => rivalidadesData.nodes.slice().sort((a, b) => (b.titulos ?? 0) - (a.titulos ?? 0)),
    [rivalidadesData]
  );
  const filteredList = useMemo(
    () => clubList.filter((c) => c.name.toLowerCase().includes(query.toLowerCase())),
    [clubList, query]
  );

  const onReady = useCallback((h: Graph3DHandle) => {
    handleRef.current = h;
    h.setAutoRotate(autoRotate);
  }, [autoRotate]);

  const clubName = useCallback(
    (ref: string | ClubNode) => (typeof ref === "string" ? clubList.find((c) => c.id === ref)?.name ?? ref : ref.name),
    [clubList]
  );

  useEffect(() => {
    handleRef.current?.setAutoRotate(autoRotate);
  }, [autoRotate]);

  const flyTo = useCallback((id: string) => {
    handleRef.current?.flyTo(id);
    setAutoRotate(false);
  }, []);

  const onLinkClick = useCallback((link: ClubLink) => {
    setSelectedLink(link);
    setAutoRotate(false);
  }, []);

  const resetCamera = useCallback(() => {
    setAutoRotate(false);
    handleRef.current?.zoomToFit(1000, 80);
  }, []);

  const anios = useMemo(() => {
    const set = new Set<string>();
    (transfers as Array<{ fecha?: string }>).forEach((t) => {
      if (t.fecha) set.add(String(new Date(t.fecha).getFullYear()));
    });
    return ["todas", ...[...set].sort().reverse()];
  }, [transfers]);

  const totalLinks = graphData?.links.length ?? 0;
  const totalNodes = graphData?.nodes.length ?? 0;

  return (
    <div className="min-h-screen">
      <PageHeader
        titulo="Red 3D de Clubes"
        subtitulo="El universo de la Primera División paraguaya, visualizado en 3D"
      />

      <div className="max-w-7xl mx-auto px-4 pb-12">
        {/* Explicación clara de para qué sirve la sección */}
        <div className="mb-6 rounded-2xl border border-borde-marca bg-gradient-to-r from-[#1a0510] to-[#020a14] p-5 shadow-[0_0_30px_-12px_rgba(204,0,28,0.5)]">
          <h2 className="text-texto-principal font-bold text-lg mb-1">¿Qué es esto?</h2>
          <p className="text-texto-secundario text-sm leading-relaxed">
            Es un <span className="text-apf-dorado font-semibold">mapa interactivo en 3D</span> de los clubes de la Primera División.
            Cada <span className="text-texto-principal font-medium">escudo</span> es un club y cada
            <span className="text-apf-dorado font-semibold"> línea</span> es una relación entre ellos: en
            <span className="text-texto-principal font-medium"> Rivalidades</span> son los clásicos y enfrentamientos históricos;
            en <span className="text-texto-principal font-medium">Mercado de Fichajes</span> son los pases de jugadores entre clubes.
            El tamaño del escudo crece con la importancia del club (títulos o movimientos).
          </p>
        </div>

        {/* Controles */}
        <div className="flex flex-wrap items-center gap-3 mb-5">
          <div className="flex gap-2 p-1 rounded-xl bg-bg-secundario/70 backdrop-blur border border-borde-sutil">
            <button
              onClick={() => setMode("rivalidades")}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${
                mode === "rivalidades" ? "bg-apf-rojo text-white shadow-lg" : "text-texto-secundario hover:text-texto-principal"
              }`}
            >
              Rivalidades
            </button>
            <button
              onClick={() => setMode("fichajes")}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${
                mode === "fichajes" ? "bg-apf-rojo text-white shadow-lg" : "text-texto-secundario hover:text-texto-principal"
              }`}
            >
              Mercado de Fichajes
            </button>
          </div>

          <button
            onClick={() => setAutoRotate((v) => !v)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition border ${
              autoRotate
                ? "bg-apf-dorado/15 border-apf-dorado/40 text-apf-dorado"
                : "bg-bg-secundario/70 border-borde-sutil text-texto-secundario"
            }`}
          >
            {autoRotate ? "⏸ Pausar giro" : "▶ Girar"}
          </button>

          <button
            onClick={resetCamera}
            className="px-4 py-2 rounded-xl text-sm font-medium bg-bg-secundario/70 border border-borde-sutil text-texto-secundario hover:text-texto-principal transition"
          >
            ⟲ Centrar
          </button>

          {mode === "fichajes" && (
            <select
              value={temporada}
              onChange={(e) => setTemporada(e.target.value)}
              className="px-4 py-2 rounded-xl bg-bg-noche border border-borde-sutil text-texto-principal text-sm focus:outline-none focus:border-apf-rojo/50 ml-auto"
            >
              {anios.map((a) => (
                <option key={a} value={a}>
                  {a === "todas" ? "Todas las temporadas" : `Temporada ${a}`}
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Subtítulo del modo actual */}
        <p className="text-sm text-texto-secundario mb-4">
          {mode === "rivalidades"
            ? "🟥 Líneas = clásicos y enfrentamientos. Más gruesa = más historia en común."
            : "🟨 Líneas = fichajes. El grosor indica la inversión movilizada."}
        </p>

        {/* Buscador + contador */}
        <div className="mb-5 flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[220px]">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar club…"
              className="w-full px-4 py-2.5 rounded-xl bg-bg-noche border border-borde-sutil text-texto-principal text-sm placeholder:text-texto-apagado focus:outline-none focus:border-apf-dorado/50"
            />
          </div>
          <div className="text-xs text-texto-secundario px-3 py-2 rounded-lg bg-bg-secundario/60 border border-borde-sutil">
            {totalNodes} clubes · {totalLinks} conexiones
          </div>
        </div>

        {/* Grafo + lista lateral */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-5">
          <div className="relative w-full rounded-2xl border border-borde-marca overflow-hidden bg-[#020a14] shadow-[0_0_40px_-10px_rgba(255,204,0,0.25)]">
            {isClient && (
              <Graph3D data={graphData} autoRotate={autoRotate} onSelect={setSelectedNode} onLinkClick={onLinkClick} onReady={onReady} />
            )}

            <div className="absolute top-3 left-3 flex flex-wrap gap-3 text-[11px] text-texto-secundario bg-bg-noche/70 backdrop-blur px-3 py-2 rounded-lg border border-borde-sutil">
              <span>🖱 Arrastrá para rotar</span>
              <span>🔍 Scroll para zoom</span>
              <span>⚡ Click en un club para acercarte</span>
            </div>

            {selectedNode && (
              <div className="absolute bottom-4 left-4 right-4 lg:left-4 lg:right-auto lg:w-80 bg-bg-secundario/95 backdrop-blur-sm border-l-4 border-apf-rojo rounded-xl p-4 shadow-2xl ring-1 ring-white/10">
                <div className="flex items-start gap-3">
                  {selectedNode.escudo && (
                    <Image src={selectedNode.escudo} alt={selectedNode.name} width={56} height={56} loading="lazy" className="w-14 h-14 object-contain rounded-lg bg-white/10 p-1 shadow" />
                  )}
                  <div className="flex-1">
                    <h3 className="text-texto-principal font-bold text-lg leading-tight">{selectedNode.name}</h3>
                    <div className="flex gap-4 mt-1 text-sm">
                      {mode === "rivalidades" ? (
                        <>
                          <span className="text-apf-dorado font-semibold">{selectedNode.titulos ?? 0} títulos</span>
                          <span className="text-texto-secundario">{selectedNode.intl ?? 0} int.</span>
                        </>
                      ) : (
                        <span className="text-apf-dorado font-semibold">{selectedNode.movimientos ?? 0} movimientos</span>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedNode(null)}
                    className="text-texto-apagado hover:text-apf-rojo text-xl leading-none"
                  >
                    ×
                  </button>
                </div>
                <a
                  href={`/clubes/${selectedNode.id}`}
                  className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-apf-rojo hover:text-white transition-colors"
                >
                  Ver ficha completa →
                </a>
              </div>
            )}

            {/* Drawer de detalle de fichaje (modo Mercado de Fichajes) */}
            {selectedLink && mode === "fichajes" && (
              <div className="absolute bottom-4 left-4 right-4 lg:left-4 lg:right-auto lg:w-80 bg-bg-secundario/95 backdrop-blur-sm border-l-4 border-apf-dorado rounded-xl p-4 shadow-2xl ring-1 ring-white/10">
                <div className="flex items-start gap-2">
                  <div className="flex-1">
                    <p className="text-[11px] uppercase tracking-wider text-apf-dorado font-semibold">Fichaje</p>
                    <p className="text-texto-principal font-bold text-base leading-tight mt-0.5">
                      {clubName(selectedLink.source)} → {clubName(selectedLink.target)}
                    </p>
                  </div>
                  <button
                    onClick={() => setSelectedLink(null)}
                    className="text-texto-apagado hover:text-apf-rojo text-xl leading-none"
                  >
                    ×
                  </button>
                </div>
                <div className="mt-2 space-y-1 text-sm">
                  <p className="text-texto-secundario">
                    Inversión: <span className="text-apf-amarillo font-semibold">${selectedLink.monto ?? 0}M</span>
                  </p>
                  {selectedLink.tipo && (
                    <p className="text-texto-secundario capitalize">Tipo: <span className="text-texto-principal">{selectedLink.tipo}</span></p>
                  )}
                </div>
                {selectedLink.transferenciaId && (
                  <a
                    href={`/transferencias/${selectedLink.transferenciaId}`}
                    className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-apf-rojo hover:text-white transition-colors"
                  >
                    Ver ficha del jugador →
                  </a>
                )}
              </div>
            )}
          </div>

          {/* Lista lateral de clubes con escudo + nombre */}
          <aside className="rounded-2xl border border-borde-sutil bg-bg-secundario/40 backdrop-blur p-3 h-[600px] lg:h-[720px] overflow-y-auto">
            <p className="text-xs uppercase tracking-wider text-texto-apagado mb-2 px-1">Clubes ({clubList.length})</p>
            <ul className="space-y-1">
              {filteredList.map((c) => (
                <li key={c.id}>
                  <button
                    onClick={() => flyTo(c.id)}
                    className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-left transition ${
                      selectedNode?.id === c.id ? "bg-apf-rojo/15 ring-1 ring-apf-rojo/40" : "hover:bg-bg-noche"
                    }`}
                  >
                    {c.escudo && (
                      <Image src={c.escudo} alt="" width={28} height={28} loading="lazy" className="w-7 h-7 object-contain rounded bg-white/5 p-0.5" />
                    )}
                    <span className="text-sm text-texto-principal truncate">{c.name}</span>
                  </button>
                </li>
              ))}
              {filteredList.length === 0 && <li className="text-sm text-texto-apagado px-2 py-2">Sin resultados</li>}
            </ul>
          </aside>
        </div>

        {/* Leyenda */}
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
          <div className="p-4 rounded-xl bg-bg-secundario/60 border border-borde-sutil">
            <p className="text-texto-principal font-semibold mb-1">Tamaño del escudo</p>
            <p className="text-texto-secundario">
              {mode === "rivalidades" ? "Más títulos = escudo más grande." : "Más fichajes = escudo más grande."}
            </p>
          </div>
          <div className="p-4 rounded-xl bg-bg-secundario/60 border border-borde-sutil">
            <p className="text-texto-principal font-semibold mb-1">Líneas</p>
            <p className="text-texto-secundario">
              {mode === "rivalidades" ? "Clásicos y enfrentamientos históricos." : "Pases de jugadores entre clubes."}
            </p>
          </div>
          <div className="p-4 rounded-xl bg-bg-secundario/60 border border-borde-sutil">
            <p className="text-texto-principal font-semibold mb-1">Cómo navegar</p>
            <p className="text-texto-secundario">Arrastrá para rotar, scroll para zoom y click en un club para acercarte.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
