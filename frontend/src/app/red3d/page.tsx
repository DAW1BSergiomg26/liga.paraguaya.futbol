"use client";

import { useEffect, useRef, useState } from "react";
import PageHeader from "@/components/ui/PageHeader";

interface GraphNode {
  id: string;
  name: string;
  val: number;
  color: string;
  titles: number;
  intl: number;
  x?: number;
  y?: number;
  z?: number;
}

interface GraphLink {
  source: string | GraphNode;
  target: string | GraphNode;
  value: number;
  name: string;
}

interface GraphData {
  nodes: GraphNode[];
  links: GraphLink[];
}

export default function Red3DPage() {
  const containerRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const graphRef = useRef<any>(null);
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

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
        .nodeLabel((n: GraphNode) => {
          return `<div style="color:#020a14;background:#FFCC00;padding:6px 10px;border-radius:6px;font-weight:600;font-size:13px;white-space:nowrap">${n.name}<br/><span style="font-size:11px;color:#333">${n.titles} títulos · ${n.intl} internacionales</span></div>`;
        })
        .nodeVal((n: GraphNode) => Math.max(n.val, 1) * 0.6)
        .nodeColor((n: GraphNode) => n.color)
        .nodeRelSize(4)
        .nodeOpacity(0.9)
        .nodeResolution(12)
        .linkLabel((l: GraphLink) => `<div style="color:#FFCC00;font-weight:600">${l.name}</div><div style="color:#ccc;font-size:11px">~${l.value} enfrentamientos</div>`)
        .linkColor(() => "rgba(255,204,0,0.25)")
        .linkWidth((l: GraphLink) => Math.max(0.5, l.value / 50))
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

      // Fetch data
      fetch("/data/red-clubes.json")
        .then((r) => r.json())
        .then((data: GraphData) => {
          if (!cancelled) Graph.graphData(data);
        })
        .catch(() => {
          // Fallback inline data
          if (!cancelled) {
            Graph.graphData({
              nodes: [
                { id: "olimpia", name: "Club Olimpia", val: 48, color: "#FFFFFF", titles: 48, intl: 8 },
                { id: "cerro-porteno", name: "Club Cerro Porteño", val: 35, color: "#003399", titles: 35, intl: 0 },
                { id: "libertad", name: "Club Libertad", val: 26, color: "#000000", titles: 26, intl: 0 },
                { id: "nacional", name: "Club Nacional", val: 13, color: "#003366", titles: 13, intl: 0 },
                { id: "guarani", name: "Club Guaraní", val: 11, color: "#CC001C", titles: 11, intl: 0 },
              ],
              links: [
                { source: "olimpia", target: "cerro-porteno", value: 190, name: "Clásico del Fútbol Paraguayo" },
                { source: "olimpia", target: "libertad", value: 140, name: "Clásico de barrio" },
                { source: "cerro-porteno", target: "libertad", value: 130, name: "Rivalidad histórica" },
              ],
            });
          }
        });

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

  return (
    <div className="min-h-screen">
      <PageHeader
        titulo="Red 3D de Clubes"
        subtitulo="Mapa interactivo de rivalidades y conexiones entre los clubes de la Primera División"
      />

      <div className="max-w-7xl mx-auto px-4 pb-12">
        {/* Instructions */}
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

        {/* Graph container */}
        <div className="relative w-full rounded-2xl border border-borde-marca overflow-hidden bg-[#020a14]">
          <div ref={containerRef} className="w-full h-[600px] lg:h-[700px]" />

          {/* Selected node panel */}
          {selectedNode && (
            <div className="absolute bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-80 bg-bg-secundario/95 backdrop-blur-sm border border-borde-marca rounded-xl p-4 shadow-2xl">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-texto-principal font-bold text-lg">{selectedNode.name}</h3>
                  <div className="flex gap-4 mt-1 text-sm">
                    <span className="text-dorado-medalla">{selectedNode.titles} títulos</span>
                    <span className="text-texto-secundario">{selectedNode.intl} internacionales</span>
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

        {/* Legend */}
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
          <div className="p-4 rounded-xl bg-bg-secundario/60 border border-borde-sutil">
            <p className="text-texto-principal font-semibold mb-1">Tamaño del nodo</p>
            <p className="text-texto-secundario">Representa la cantidad de títulos de Primera División del club.</p>
          </div>
          <div className="p-4 rounded-xl bg-bg-secundario/60 border border-borde-sutil">
            <p className="text-texto-principal font-semibold mb-1">Grosor del enlace</p>
            <p className="text-texto-secundario">Indica la cantidad histórica de enfrentamientos entre dos clubes.</p>
          </div>
          <div className="p-4 rounded-xl bg-bg-secundario/60 border border-borde-sutil">
            <p className="text-texto-principal font-semibold mb-1">Partículas rojas</p>
            <p className="text-texto-secundario">Animación que recorre los enlaces representando la intensidad de la rivalidad.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
