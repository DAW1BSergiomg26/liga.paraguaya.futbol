// frontend/src/app/red3d/page.tsx
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import PageHeader from "@/components/ui/PageHeader";
import { apiFetch } from "@/lib/api";

interface GraphNode {
  id: string;
  name: string;
  val: number;
  color: string;
  label: string;
  tipo: "club";
  titulos?: number;
  intl?: number;
  movimientos?: number;
  x?: number;
  y?: number;
  z?: number;
}

interface GraphLink {
  source: string | GraphNode;
  target: string | GraphNode;
  value: number;
  label: string;
  w: number;
}

interface GraphData {
  nodes: GraphNode[];
  links: GraphLink[];
}

const CLUB_COLORS: Record<string, string> = {
  "olimpia": "#FFFFFF",
  "cerro-porteno": "#003399",
  "libertad": "#000000",
  "nacional": "#003366",
  "guarani": "#CC001C",
  "sol-de-america": "#FFCC00",
  "sportivo-luqueno": "#006600",
  "luqueno": "#006600",
  "ameliano": "#1E90FF",
  "2-de-mayo": "#8B0000",
  "san-lorenzo": "#00008B",
  "general-caballero": "#006400",
  "colegiales": "#B22222",
  "recoleta": "#4682B4",
  "rubio-nu": "#2E8B57",
};

const RIVALIDADES_FALLBACK: GraphData = {
  nodes: [
    { id: "olimpia", name: "Club Olimpia", val: 48, color: "#FFFFFF", titulos: 48, intl: 8, tipo: "club", label: "" },
    { id: "cerro-porteno", name: "Club Cerro Porteño", val: 35, color: "#003399", titulos: 35, intl: 0, tipo: "club", label: "" },
    { id: "libertad", name: "Club Libertad", val: 26, color: "#000000", titulos: 26, intl: 0, tipo: "club", label: "" },
    { id: "nacional", name: "Club Nacional", val: 13, color: "#003366", titulos: 13, intl: 0, tipo: "club", label: "" },
    { id: "guarani", name: "Club Guaraní", val: 11, color: "#CC001C", titulos: 11, intl: 0, tipo: "club", label: "" },
  ],
  links: [
    { source: "olimpia", target: "cerro-porteno", value: 190, label: "Clásico del Fútbol Paraguayo", w: 3.8 },
    { source: "olimpia", target: "libertad", value: 140, label: "Clásico de barrio", w: 2.8 },
    { source: "cerro-porteno", target: "libertad", value: 130, label: "Rivalidad histórica", w: 2.6 },
  ],
};

export default function Red3DPage() {
  const containerRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const graphRef = useRef<any>(null);
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [isClient, setIsClient] = useState(false);
  const [mode, setMode] = useState<"rivalidades" | "fichajes">("rivalidades");
  const [temporada, setTemporada] = useState<string>("todas");

  const [rivalidadesData, setRivalidadesData] = useState<GraphData>(RIVALIDADES_FALLBACK);
  const [transfers, setTransfers] = useState<any[]>([]);

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Cargar datos de rivalidades (estático) y transferencias (API)
  useEffect(() => {
    fetch("/data/red-clubes.json")
      .then((r) => r.json())
      .then((d: GraphData) => {
        const nodes = d.nodes.map((n) => ({
          ...n,
          tipo: "club" as const,
          label: `<div style="color:#020a14;background:#FFCC00;padding:6px 10px;border-radius:6px;font-weight:600;font-size:13px;white-space:nowrap">${n.name}<br/><span style="font-size:11px;color:#333">${n.titulos ?? 0} títulos · ${n.intl ?? 0} internacionales</span></div>`,
        }));
        const links = d.links.map((l) => ({ ...l, w: Math.max(0.5, (l.value || 1) / 50) }));
        setRivalidadesData({ nodes, links });
      })
      .catch(() => setRivalidadesData(RIVALIDADES_FALLBACK));

    apiFetch<{ transferencias: any[] }>("/api/v1/transferencias?per_page=100")
      .then((d) => setTransfers(d.transferencias || []))
      .catch(() => setTransfers([]));
  }, []);

  // Construir grafo de fichajes (clubes = nodos, fichajes = aristas)
  const fichajesData = useMemo<GraphData>(() => {
    const vis = temporada === "todas"
      ? transfers
      : transfers.filter((t) => String(new Date(t.fecha).getFullYear()) === temporada);

    const clubMap = new Map<string, { id: string; name: string; count: number }>();
    const linkMap = new Map<string, { source: string; target: string; value: number; labels: string[] }>();

    for (const t of vis) {
      const oId = t.club_origen_id;
      const dId = t.club_destino_id;
      if (oId) {
        if (!clubMap.has(oId)) clubMap.set(oId, { id: oId, name: t.club_origen_nombre || oId, count: 0 });
        clubMap.get(oId)!.count++;
      }
      if (dId) {
        if (!clubMap.has(dId)) clubMap.set(dId, { id: dId, name: t.club_destino_nombre || dId, count: 0 });
        clubMap.get(dId)!.count++;
      }
      if (!oId || !dId) continue;
      const key = `${oId}->${dId}`;
      if (!linkMap.has(key)) linkMap.set(key, { source: oId, target: dId, value: 0, labels: [] });
      const l = linkMap.get(key)!;
      l.value += t.monto || 0;
      l.labels.push(`${t.jugador_nombre} · $${(t.monto || 0)}M`);
    }

    const nodes: GraphNode[] = [...clubMap.values()].map((c) => ({
      id: c.id,
      name: c.name,
      val: Math.max(c.count, 1) * 4,
      color: CLUB_COLORS[c.id] || "#FFCC00",
      tipo: "club",
      movimientos: c.count,
      label: `<div style="color:#020a14;background:#FFCC00;padding:6px 10px;border-radius:6px;font-weight:600;font-size:13px;white-space:nowrap">${c.name}<br/><span style="font-size:11px;color:#333">${c.count} movimientos</span></div>`,
    }));

    const links: GraphLink[] = [...linkMap.values()].map((l) => ({
      source: l.source,
      target: l.target,
      value: Math.max(l.value, 1),
      w: Math.max(0.5, Math.log10(l.value + 1) * 2),
      label: `<div style="color:#FFCC00;font-weight:600">${l.labels.join("<br/>")}</div>`,
    }));

    return { nodes, links };
  }, [transfers, temporada]);

  const graphData = useMemo<GraphData | null>(() => {
    return mode === "rivalidades" ? rivalidadesData : fichajesData;
  }, [mode, rivalidadesData, fichajesData]);

  // Crear el grafo 3D una sola vez
  useEffect(() => {
    if (!isClient || !containerRef.current || graphRef.current) return;

    let cancelled = false;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    import("3d-force-graph").then((mod: any) => {
      const ForceGraph3D = mod.default;
      if (cancelled || !containerRef.current) return;

      const Graph = ForceGraph3D()(containerRef.current)
        .backgroundColor("#020a14")
        .showNavInfo(false)
        .nodeLabel((n: GraphNode) => n.label)
        .nodeVal((n: GraphNode) => Math.max(n.val, 1) * 0.6)
        .nodeColor((n: GraphNode) => n.color)
        .nodeRelSize(4)
        .nodeOpacity(0.9)
        .nodeResolution(12)
        .linkLabel((l: GraphLink) => l.label)
        .linkColor(() => "rgba(255,204,0,0.25)")
        .linkWidth((l: GraphLink) => l.w)
        .linkOpacity(0.4)
        .linkCurvature(0.1)
        .linkDirectionalParticles(3)
        .linkDirectionalParticleSpeed(0.005)
        .linkDirectionalParticleColor(() => "#CC001C")
        .onNodeClick((node: GraphNode) => {
          const n = node as GraphNode & { x?: number; y?: number; z?: number };
          const distance = 120;
          const hypot = Math.hypot(n.x || 1, n.y || 1, n.z || 1);
          const distRatio = 1 + distance / hypot;
          Graph.cameraPosition(
            { x: (n.x || 0) * distRatio, y: (n.y || 0) * distRatio, z: (n.z || 0) * distRatio },
            node as unknown as { x: number; y: number; z: number },
            1500
          );
          setSelectedNode(n);
        })
        .enablePointerInteraction(true)
        .enableNodeDrag(true);

      graphRef.current = Graph;
    });

    return () => {
      cancelled = true;
      if (graphRef.current) {
        graphRef.current._destructor();
        graphRef.current = null;
      }
    };
  }, [isClient]);

  // Aplicar los datos según el modo/temporada
  useEffect(() => {
    if (graphRef.current && graphData) {
      graphRef.current.graphData(graphData);
    }
  }, [graphData]);

  const anios = useMemo(() => {
    const set = new Set<string>();
    transfers.forEach((t) => set.add(String(new Date(t.fecha).getFullYear())));
    return ["todas", ...[...set].sort().reverse()];
  }, [transfers]);

  return (
    <div className="min-h-screen">
      <PageHeader
        titulo="Red 3D de Clubes"
        subtitulo={
          mode === "rivalidades"
            ? "Mapa interactivo de rivalidades y conexiones entre los clubes de la Primera División"
            : "Mercado de fichajes: cada flecha es un fichaje entre clubes, filtrable por temporada"
        }
      />

      <div className="max-w-7xl mx-auto px-4 pb-12">
        {/* Modo + filtros */}
        <div className="flex flex-wrap items-center gap-3 mb-6">
          <div className="flex gap-2">
            <button
              onClick={() => setMode("rivalidades")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                mode === "rivalidades"
                  ? "bg-apf-rojo text-white"
                  : "bg-bg-secundario text-texto-secundario hover:text-texto-principal"
              }`}
            >
              Rivalidades
            </button>
            <button
              onClick={() => setMode("fichajes")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                mode === "fichajes"
                  ? "bg-apf-rojo text-white"
                  : "bg-bg-secundario text-texto-secundario hover:text-texto-principal"
              }`}
            >
              Mercado de Fichajes
            </button>
          </div>

          {mode === "fichajes" && (
            <select
              value={temporada}
              onChange={(e) => setTemporada(e.target.value)}
              className="px-4 py-2 rounded-lg bg-bg-noche border border-borde-sutil text-texto-principal text-sm focus:outline-none focus:border-apf-rojo/50 ml-auto"
            >
              {anios.map((a) => (
                <option key={a} value={a}>
                  {a === "todas" ? "Todas las temporadas" : `Temporada ${a}`}
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Instrucciones */}
        <div className="mb-6 flex flex-wrap items-center gap-4 text-sm text-texto-secundario">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-py-rojo" />
            Arrastrá para rotar
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-py-azul" />
            Scroll para zoom
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-dorado-medalla" />
            Click en un club para volar hacia él
          </div>
        </div>

        {/* Grafo */}
        <div className="relative w-full rounded-2xl border border-borde-marca overflow-hidden bg-[#020a14]">
          <div ref={containerRef} className="w-full h-[600px] lg:h-[700px]" />

          {selectedNode && (
            <div className="absolute bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-80 bg-bg-secundario/95 backdrop-blur-sm border border-borde-marca rounded-xl p-4 shadow-2xl">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-texto-principal font-bold text-lg">{selectedNode.name}</h3>
                  <div className="flex gap-4 mt-1 text-sm">
                    {mode === "rivalidades" ? (
                      <>
                        <span className="text-dorado-medalla">{selectedNode.titulos ?? 0} títulos</span>
                        <span className="text-texto-secundario">{selectedNode.intl ?? 0} internacionales</span>
                      </>
                    ) : (
                      <span className="text-dorado-medalla">{selectedNode.movimientos ?? 0} movimientos</span>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => setSelectedNode(null)}
                  className="text-texto-apagado hover:text-texto-principal text-xl leading-none"
                >
                  ×
                </button>
              </div>
              <a
                href={`/clubes/${selectedNode.id}`}
                className="mt-3 inline-flex items-center gap-1 text-sm text-apf-rojo hover:text-apf-rojo/80 transition-colors"
              >
                Ver ficha completa →
              </a>
            </div>
          )}
        </div>

        {/* Leyenda */}
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
          <div className="p-4 rounded-xl bg-bg-secundario/60 border border-borde-sutil">
            <p className="text-texto-principal font-semibold mb-1">Tamaño del nodo</p>
            <p className="text-texto-secundario">
              {mode === "rivalidades"
                ? "Representa la cantidad de títulos de Primera División del club."
                : "Representa la cantidad de movimientos en las que participa el club."}
            </p>
          </div>
          <div className="p-4 rounded-xl bg-bg-secundario/60 border border-borde-sutil">
            <p className="text-texto-principal font-semibold mb-1">Grosor del enlace</p>
            <p className="text-texto-secundario">
              {mode === "rivalidades"
                ? "Indica la cantidad histórica de enfrentamientos entre dos clubes."
                : "Indica la inversión total movilizada en los fichajes entre ambos clubes."}
            </p>
          </div>
          <div className="p-4 rounded-xl bg-bg-secundario/60 border border-borde-sutil">
            <p className="text-texto-principal font-semibold mb-1">Partículas rojas</p>
            <p className="text-texto-secundario">Animación que recorre los enlaces representando la intensidad de la conexión.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
