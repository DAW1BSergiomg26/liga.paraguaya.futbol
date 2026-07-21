// frontend/src/app/red3d/page.tsx
"use client";

import Image from "next/image";
import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import PageHeader from "@/components/ui/PageHeader";
import { apiFetch } from "@/lib/api";
import { escudoUrl } from "@/lib/escudos";
import { useIsMobile } from "@/hooks/useIsMobile";
import Red2DFallback from "@/components/red3d/Red2DFallback";

/* ── Lazy-load del componente 3D (solo se carga bajo demanda) ── */
const Graph3D = lazy(() => import("@/components/red3d/Graph3D"));

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
  conexiones?: number;
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

interface Graph3DHandle {
  flyTo: (id: string) => void;
  zoomToFit: (ms?: number, pad?: number) => void;
  setAutoRotate: (v: boolean) => void;
}

type ViewMode = "2d" | "3d";

/* ── Constantes ───────────────────────────────────────────── */

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

/* Cuenta las conexiones (grado) de cada nodo a partir de los links. */
function computeDegree(links: ClubLink[]): Record<string, number> {
  const map: Record<string, number> = {};
  for (const l of links) {
    const s = typeof l.source === "string" ? l.source : (l.source as ClubNode).id;
    const t = typeof l.target === "string" ? l.target : (l.target as ClubNode).id;
    if (s) map[s] = (map[s] ?? 0) + 1;
    if (t) map[t] = (map[t] ?? 0) + 1;
  }
  return map;
}

/* Construye el HTML del tooltip de hover (tarjeta compacta con datos clave). */
function richLabel(name: string, lines: string[]): string {
  const body = lines
    .map((l) => `<span style="font-size:11px;color:#222;font-weight:600">${l}</span>`)
    .join("<br/>");
  return `<div style="color:#020a14;background:${APF_DORADO};padding:8px 12px;border-radius:8px;font-weight:700;font-size:13px;white-space:nowrap;box-shadow:0 4px 12px rgba(0,0,0,0.45);text-align:left;line-height:1.5">${name}<br/>${body}</div>`;
}

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

/* ── Componente ───────────────────────────────────────────── */

export default function Red3DPage() {
  const isClient = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );
  const isMobile = useIsMobile();

  /* Estado de vista: en móvil arranca en 2D, en desktop en 3D */
  const [viewMode, setViewMode] = useState<ViewMode>("2d");
  const [autoRotate, setAutoRotate] = useState(true);
  const [graphError, setGraphError] = useState(false);

  /* Datos */
  const [selectedNode, setSelectedNode] = useState<ClubNode | null>(null);
  const [selectedLink, setSelectedLink] = useState<ClubLink | null>(null);
  const [mode, setMode] = useState<"rivalidades" | "fichajes">("rivalidades");
  const [temporada, setTemporada] = useState<string>("todas");
  const [query, setQuery] = useState("");
  const [rivalidadesData, setRivalidadesData] = useState<GraphData>(RIVALIDADES_FALLBACK);
  const [transfers, setTransfers] = useState<TransferItem[]>([]);
  const handleRef = useRef<Graph3DHandle | null>(null);

  /* Guía de usuario: aparece si el grafo 3D no recibe interacción en 5s */
  const [showGuide, setShowGuide] = useState(false);
  const guideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const markInteraction = useCallback(() => {
    setShowGuide(false);
    if (guideTimer.current) clearTimeout(guideTimer.current);
    guideTimer.current = setTimeout(() => setShowGuide(true), 5000);
  }, []);
  useEffect(() => {
    if (viewMode !== "3d") return;
    markInteraction();
    return () => {
      if (guideTimer.current) clearTimeout(guideTimer.current);
    };
  }, [viewMode, markInteraction]);
  useEffect(() => {
    markInteraction();
  }, [selectedNode, mode, autoRotate, markInteraction]);

  /* Inicializar vista según dispositivo */
  useEffect(() => {
    setViewMode(isMobile ? "2d" : "3d");
  }, [isMobile]);

  /* En móvil, auto-rotate apagado por defecto */
  useEffect(() => {
    if (isMobile) setAutoRotate(false);
  }, [isMobile]);

  /* Carga de datos */
  useEffect(() => {
    let active = true;

    fetch("/data/red-clubes.json")
      .then((r) => r.json())
      .then((d: GraphData) => {
        if (!active) return;
        const deg = computeDegree(d.links);
        const nodes = d.nodes.map((n) => ({
          ...n,
          short: SHORT[n.id] ?? n.name,
          color: CLUB_COLORS[n.id] ?? n.color,
          escudo: escudoUrl(n.id),
          conexiones: deg[n.id] ?? 0,
          label: richLabel(n.name, [
            `${(n.titulos ?? 0)} títulos · ${(n.intl ?? 0)} int.`,
            `${deg[n.id] ?? 0} rivalidades`,
          ]),
        }));
        const links = d.links.map((l) => ({ ...l, w: Math.max(0.5, (l.value || 1) / 50) }));
        setRivalidadesData({ nodes, links });
      })
      .catch(() => {
        if (active) setRivalidadesData(RIVALIDADES_FALLBACK);
      });

    apiFetch<{ transferencias: TransferItem[] }>("/api/v1/transferencias?per_page=100")
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

  /* Fichajes derivados */
  const fichajesData = useMemo<GraphData>(() => {
    const list = transfers;
    const vis = temporada === "todas" ? list : list.filter((t) => String(new Date(t.fecha ?? "").getFullYear()) === temporada);
    const clubMap = new Map<string, { id: string; name: string; count: number }>();
    const linkMap = new Map<string, { source: string; target: string; value: number; labels: string[]; first?: TransferItem }>();

    for (const t of vis) {
      const oId = t.club_origen_id;
      const dId = t.club_destino_id;
      if (oId && !clubMap.has(oId)) clubMap.set(oId, { id: oId, name: t.club_origen_nombre ?? oId, count: 0 });
      if (dId && !clubMap.has(dId)) clubMap.set(dId, { id: dId, name: t.club_destino_nombre ?? dId, count: 0 });
      if (oId) clubMap.get(oId)!.count++;
      if (dId) clubMap.get(dId)!.count++;
      if (!oId || !dId) continue;
      const key = `${oId}->${dId}`;
      if (!linkMap.has(key)) linkMap.set(key, { source: oId, target: dId, value: 0, labels: [], first: t });
      const l = linkMap.get(key)!;
      l.value += t.monto ?? 0;
      l.labels.push(`${t.jugador_nombre ?? "Jugador"} · $${t.monto ?? 0}M`);
    }

    const nodes: ClubNode[] = [...clubMap.values()].map((c) => ({
      id: c.id,
      name: c.name,
      short: SHORT[c.id] ?? c.name,
      val: Math.max(c.count, 1) * 4,
      color: CLUB_COLORS[c.id] ?? APF_DORADO,
      movimientos: c.count,
      escudo: escudoUrl(c.id),
      conexiones: 0,
      label: `<div style="color:#020a14;background:${APF_DORADO};padding:8px 12px;border-radius:8px;font-weight:700;font-size:13px;white-space:nowrap;box-shadow:0 4px 12px rgba(0,0,0,0.45);text-align:left;line-height:1.5">${c.name}<br/><span style="font-size:11px;color:#222;font-weight:600">${c.count} movimientos</span></div>`,
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
    const deg = computeDegree(links);
    for (const n of nodes) n.conexiones = deg[n.id] ?? 0;
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

  /* ── Callbacks del grafo 3D ─────────────────────────────── */

  const onReady = useCallback(
    (h: Graph3DHandle) => {
      handleRef.current = h;
      h.setAutoRotate(autoRotate && !isMobile);
    },
    [autoRotate, isMobile]
  );

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

  const handleClubPick = useCallback(
    (c: ClubNode) => {
      flyTo(c.id);
      setSelectedNode(c);
      markInteraction();
    },
    [flyTo]
  );

  const onLinkClick = useCallback((link: ClubLink) => {
    setSelectedLink(link);
    setAutoRotate(false);
  }, []);

  const resetCamera = useCallback(() => {
    setAutoRotate(false);
    handleRef.current?.zoomToFit(1000, 80);
    markInteraction();
  }, []);

  const anios = useMemo(() => {
    const set = new Set<string>();
    transfers.forEach((t) => {
      if (t.fecha) set.add(String(new Date(t.fecha).getFullYear()));
    });
    return ["todas", ...[...set].sort().reverse()];
  }, [transfers]);

  const totalLinks = graphData?.links.length ?? 0;
  const totalNodes = graphData?.nodes.length ?? 0;

  /* ── Toggle 3D con validación WebGL ─────────────────────── */

  const enable3D = useCallback(() => {
    // Verificar soporte WebGL antes de intentar cargar el grafo
    try {
      const canvas = document.createElement("canvas");
      const gl = canvas.getContext("webgl2") ?? canvas.getContext("webgl");
      if (!gl) {
        setGraphError(true);
        setViewMode("2d");
        return;
      }
    } catch {
      setGraphError(true);
      setViewMode("2d");
      return;
    }
    setGraphError(false);
    setViewMode("3d");
  }, []);

  const disable3D = useCallback(() => {
    setSelectedNode(null);
    setSelectedLink(null);
    setViewMode("2d");
  }, []);

  /* ── Error handler para el grafo 3D ─────────────────────── */

  const onGraphError = useCallback(() => {
    setGraphError(true);
    setViewMode("2d");
    setSelectedNode(null);
    setSelectedLink(null);
  }, []);

  /* ── Render ─────────────────────────────────────────────── */

  return (
    <div className="min-h-screen">
      <PageHeader
        titulo="Red de Clubes"
        subtitulo="El universo de la Primera División paraguaya, visualizado de forma interactiva"
      />

      <div className="max-w-7xl mx-auto px-4 pb-12">
        {/* Explicación */}
        <div className="mb-6 rounded-2xl border border-borde-marca bg-gradient-to-r from-[#1a0510] to-[#020a14] p-5 shadow-[0_0_30px_-12px_rgba(204,0,28,0.5)]">
          <h2 className="text-texto-principal font-bold text-lg mb-1">¿Qué es esto?</h2>
          <p className="text-texto-secundario text-sm leading-relaxed">
            Es un <span className="text-apf-dorado font-semibold">mapa interactivo</span> de los clubes de la Primera División.
            Cada <span className="text-texto-principal font-medium">escudo</span> es un club y cada
            <span className="text-apf-dorado font-semibold"> línea</span> es una relación entre ellos: en
            <span className="text-texto-principal font-medium"> Rivalidades</span> son los clásicos y enfrentamientos históricos;
            en <span className="text-texto-principal font-medium">Mercado de Fichajes</span> son los pases de jugadores entre clubes.
            {viewMode === "2d"
              ? " Tocá un club para ver sus rivalidades."
              : " El tamaño del escudo crece con la importancia del club."}
          </p>
        </div>

        {/* Controles principales */}
        <div className="flex flex-wrap items-center gap-3 mb-5">
          <div className="flex gap-2 p-1 rounded-xl bg-bg-secundario/70 backdrop-blur border border-borde-sutil" role="tablist" aria-label="Modo de visualización">
            <button
              role="tab"
              aria-selected={mode === "rivalidades"}
              onClick={() => setMode("rivalidades")}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${
                mode === "rivalidades" ? "bg-apf-rojo text-white shadow-lg" : "text-texto-secundario hover:text-texto-principal"
              }`}
            >
              Rivalidades
            </button>
            <button
              role="tab"
              aria-selected={mode === "fichajes"}
              onClick={() => setMode("fichajes")}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${
                mode === "fichajes" ? "bg-apf-rojo text-white shadow-lg" : "text-texto-secundario hover:text-texto-principal"
              }`}
            >
              Mercado de Fichajes
            </button>
          </div>

          {/* Solo mostrar controles 3D cuando estamos en vista 3D */}
          {viewMode === "3d" && (
            <>
              <button
                onClick={() => setAutoRotate((v) => !v)}
                aria-pressed={autoRotate}
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
                aria-label="Centrar cámara en el grafo"
                className="px-4 py-2 rounded-xl text-sm font-medium bg-bg-secundario/70 border border-borde-sutil text-texto-secundario hover:text-texto-principal transition"
              >
                ⟲ Centrar
              </button>
            </>
          )}

          {mode === "fichajes" && (
            <select
              value={temporada}
              onChange={(e) => setTemporada(e.target.value)}
              aria-label="Filtrar por temporada"
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

        {/* Subtítulo del modo */}
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
              aria-label="Buscar club"
              className="w-full px-4 py-2.5 rounded-xl bg-bg-noche border border-borde-sutil text-texto-principal text-sm placeholder:text-texto-apagado focus:outline-none focus:border-apf-dorado/50"
            />
          </div>
          <div className="text-xs text-texto-secundario px-3 py-2 rounded-lg bg-bg-secundario/60 border border-borde-sutil">
            {totalNodes} clubes · {totalLinks} conexiones
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════
            VISTA 2D (fallback de alta calidad)
            ═══════════════════════════════════════════════════════ */}
        {viewMode === "2d" && (
          <div className="space-y-5">
            <Red2DFallback
              rivalidadesData={rivalidadesData}
              transfers={transfers}
              onClubClick={(id) => {
                /* En 2D, scrollear al club seleccionado */
                setQuery(rivalidadesData.nodes.find((n) => n.id === id)?.name ?? "");
              }}
            />

            {/* Botón flotante para activar 3D */}
            {isClient && !graphError && (
              <div className="flex justify-center pt-2">
                <button
                  onClick={enable3D}
                  aria-label="Activar mapa interactivo 3D"
                  className="group flex items-center gap-2 px-6 py-3 rounded-2xl bg-gradient-to-r from-[#1a0510] to-[#0d1a2e] border border-apf-rojo/40 text-texto-principal text-sm font-semibold shadow-[0_0_20px_-6px_rgba(204,0,28,0.4)] hover:shadow-[0_0_30px_-4px_rgba(204,0,28,0.6)] hover:border-apf-rojo/60 transition-all duration-300"
                >
                  <span className="text-lg">🌐</span>
                  <span>Activar Mapa Interactivo 3D</span>
                  <span className="text-texto-apagado group-hover:text-apf-rojo transition-colors">→</span>
                </button>
              </div>
            )}

            {graphError && (
              <div className="text-center py-3 text-texto-apagado text-xs">
                El modo 3D no está disponible en este dispositivo. Usando vista optimizada.
              </div>
            )}
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════
            VISTA 3D (grafo WebGL)
            ═══════════════════════════════════════════════════════ */}
        {viewMode === "3d" && (
          <>
            {/* Botón para volver a 2D (siempre visible en 3D) */}
            <div className="flex justify-between items-center mb-3">
              <p className="text-xs text-texto-apagado">
                {isMobile ? "Modo 3D activo — usa los gestos para rotar y zoom" : "Modo interactivo 3D"}
              </p>
              <button
                onClick={disable3D}
                aria-label="Volver a vista 2D"
                className="px-3 py-1.5 rounded-lg text-xs font-medium bg-bg-secundario/70 border border-borde-sutil text-texto-secundario hover:text-texto-principal transition"
              >
                ← Vista 2D
              </button>
            </div>

            {/* Grafo + lista lateral */}
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-5">
              <div
                className="relative w-full rounded-2xl border border-borde-marca overflow-hidden bg-[#020a14] shadow-[0_0_40px_-10px_rgba(255,204,0,0.25)]"
                /* En móvil, limitar gestos para no secuestrar scroll */
                style={{ touchAction: isMobile ? "pinch-zoom" : "auto" }}
              >
                {isClient && (
                  <ErrorBoundary3D onError={onGraphError}>
                    <Suspense
                      fallback={
                        <div className="w-full h-[600px] lg:h-[720px] flex items-center justify-center">
                          <div className="text-center space-y-3">
                            <div className="w-10 h-10 border-2 border-apf-rojo border-t-transparent rounded-full animate-spin mx-auto" />
                            <p className="text-texto-apagado text-sm">Cargando grafo 3D…</p>
                          </div>
                        </div>
                      }
                    >
                      <Graph3D
                        data={graphData}
                        autoRotate={autoRotate && !isMobile}
                        onSelect={(n) => {
                          setSelectedNode(n);
                          markInteraction();
                        }}
                        onLinkClick={(l) => {
                          onLinkClick(l);
                          markInteraction();
                        }}
                        onReady={onReady}
                      />
                    </Suspense>
                  </ErrorBoundary3D>
                )}

                <div className="absolute top-3 left-3 flex flex-wrap gap-3 text-[11px] text-texto-secundario bg-bg-noche/70 backdrop-blur px-3 py-2 rounded-lg border border-borde-sutil">
                  <span>🖱 Arrastrá para rotar</span>
                  <span>🔍 Scroll para zoom</span>
                  <span>⚡ Click en un club para acercarte</span>
                </div>

                {/* Botón flotante Reset View / Centrar todo */}
                <button
                  onClick={resetCamera}
                  aria-label="Restablecer la vista del grafo (centrar todo)"
                  title="Centrar todo"
                  className="absolute bottom-4 right-4 z-10 flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold bg-bg-secundario/90 backdrop-blur border border-borde-sutil text-texto-principal shadow-lg hover:border-apf-dorado/50 hover:text-apf-dorado transition"
                >
                  <span className="text-base leading-none">⟲</span>
                  Centrar todo
                </button>

                {/* Guía de usuario tras 5s sin interacción */}
                {showGuide && (
                  <div
                    role="dialog"
                    aria-label="Guía rápida de la Red 3D"
                    className="absolute inset-x-3 top-16 mx-auto max-w-md z-20 bg-bg-secundario/95 backdrop-blur-sm border border-apf-dorado/40 rounded-2xl p-5 shadow-2xl ring-1 ring-white/10"
                  >
                    <div className="flex items-start gap-3">
                      <span className="text-2xl">🧭</span>
                      <div className="flex-1">
                        <h3 className="text-texto-principal font-bold text-base">Cómo explorar la Red 3D</h3>
                        <ul className="mt-2 space-y-1 text-sm text-texto-secundario list-disc list-inside">
                          <li>Arrastá el grafo para <span className="text-texto-principal">rotar</span> la cámara.</li>
                          <li>Usá la rueda o el pinza para hacer <span className="text-texto-principal">zoom</span>.</li>
                          <li>Clic en un club para <span className="text-apf-dorado">acercarte</span> y ver su ficha.</li>
                          <li>Seleccioná un club de la lista lateral para centrarlo.</li>
                        </ul>
                      </div>
                      <button
                        onClick={() => {
                          setShowGuide(false);
                          if (guideTimer.current) clearTimeout(guideTimer.current);
                        }}
                        aria-label="Cerrar guía"
                        className="text-texto-apagado hover:text-apf-rojo text-xl leading-none"
                      >
                        ×
                      </button>
                    </div>
                    <button
                      onClick={() => {
                        setShowGuide(false);
                        if (guideTimer.current) clearTimeout(guideTimer.current);
                      }}
                      className="mt-3 w-full px-4 py-2 rounded-xl text-sm font-semibold bg-apf-rojo text-white hover:bg-apf-rojo/90 transition"
                    >
                      Entendido
                    </button>
                  </div>
                )}

                {/* Panel de nodo seleccionado */}
                {selectedNode && (
                  <div className="absolute bottom-4 left-4 right-4 lg:left-4 lg:right-auto lg:w-80 bg-bg-secundario/95 backdrop-blur-sm border-l-4 border-apf-rojo rounded-xl p-4 shadow-2xl ring-1 ring-white/10">
                    <div className="flex items-start gap-3">
                      {selectedNode.escudo && (
                        <Image src={selectedNode.escudo} alt={selectedNode.name} width={56} height={56} loading="lazy" className="w-14 h-14 object-contain rounded-lg bg-white/10 p-1 shadow" />
                      )}
                      <div className="flex-1">
                        <p className="text-[11px] uppercase tracking-wider text-apf-dorado font-semibold">Detalles del club</p>
                        <h3 className="text-texto-principal font-bold text-lg leading-tight">{selectedNode.name}</h3>
                        <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1 text-sm">
                          {mode === "rivalidades" ? (
                            <>
                              <span className="text-apf-dorado font-semibold">{selectedNode.titulos ?? 0} títulos</span>
                              <span className="text-texto-secundario">{selectedNode.intl ?? 0} int.</span>
                            </>
                          ) : (
                            <span className="text-apf-dorado font-semibold">{selectedNode.movimientos ?? 0} movimientos</span>
                          )}
                          <span className="text-texto-secundario">{selectedNode.conexiones ?? 0} conexiones</span>
                        </div>
                      </div>
                      <button
                        onClick={() => setSelectedNode(null)}
                        aria-label="Cerrar panel de club"
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

                {/* Drawer de fichaje */}
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
                        aria-label="Cerrar panel de fichaje"
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

              {/* Lista lateral de clubes */}
              <aside aria-label="Lista de clubes" className="rounded-2xl border border-borde-sutil bg-bg-secundario/40 backdrop-blur p-3 h-[600px] lg:h-[720px] overflow-y-auto">
                <p className="text-xs uppercase tracking-wider text-texto-apagado mb-2 px-1">Clubes ({clubList.length})</p>
                <ul className="space-y-1">
                  {filteredList.map((c) => (
                      <li key={c.id}>
                        <button
                          onClick={() => handleClubPick(c)}
                          aria-label={`Centrar y ver ${c.name}`}
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
          </>
        )}

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
            <p className="text-texto-principal font-semibold mb-1">
              {viewMode === "2d" ? "Cómo navegar" : "Cómo navegar el 3D"}
            </p>
            <p className="text-texto-secundario">
              {viewMode === "2d"
                ? "Tocá un club para ver sus rivalidades. Desplegá para ver detalles."
                : "Arrastrá para rotar, scroll para zoom y click en un club para acercarte."}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Error Boundary ligero para el grafo 3D ────────────────── */

import { Component, type ReactNode } from "react";

interface ErrorBoundary3DProps {
  onError: () => void;
  children: ReactNode;
}

interface ErrorBoundary3DState {
  hasError: boolean;
}

class ErrorBoundary3D extends Component<ErrorBoundary3DProps, ErrorBoundary3DState> {
  constructor(props: ErrorBoundary3DProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): ErrorBoundary3DState {
    return { hasError: true };
  }

  componentDidCatch(error: Error): void {
    console.error("[red3d] Error en el grafo 3D, revirtiendo a 2D:", error);
    this.props.onError();
  }

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        <div className="w-full h-[600px] lg:h-[720px] flex items-center justify-center bg-[#020a14] rounded-2xl">
          <div className="text-center space-y-3 px-6">
            <p className="text-texto-secundario text-sm">
              El grafo 3D no pudo cargarse. Volviendo a la vista 2D…
            </p>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
