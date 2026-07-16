// frontend/src/app/red3d/page.tsx
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import PageHeader from "@/components/ui/PageHeader";
import { apiFetch } from "@/lib/api";
import { escudoUrl } from "@/lib/escudos";
import * as THREE from "three";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";

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
  escudo?: string;
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
  olimpia: "#FFFFFF",
  "cerro-porteno": "#3B82F6",
  libertad: "#E5E7EB",
  nacional: "#3B82F6",
  guarani: "#DC2626",
  "sol-de-america": "#FACC15",
  "sportivo-luqueno": "#22C55E",
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
    { id: "olimpia", name: "Club Olimpia", val: 48, color: "#FFFFFF", titulos: 48, intl: 8, tipo: "club", label: "" },
    { id: "cerro-porteno", name: "Club Cerro Porteño", val: 35, color: "#3B82F6", titulos: 35, intl: 0, tipo: "club", label: "" },
    { id: "libertad", name: "Club Libertad", val: 26, color: "#E5E7EB", titulos: 26, intl: 0, tipo: "club", label: "" },
    { id: "nacional", name: "Club Nacional", val: 13, color: "#3B82F6", titulos: 13, intl: 0, tipo: "club", label: "" },
    { id: "guarani", name: "Club Guaraní", val: 11, color: "#DC2626", titulos: 11, intl: 0, tipo: "club", label: "" },
  ],
  links: [
    { source: "olimpia", target: "cerro-porteno", value: 190, label: "Clásico del Fútbol Paraguayo", w: 3.8 },
    { source: "olimpia", target: "libertad", value: 140, label: "Clásico de barrio", w: 2.8 },
    { source: "cerro-porteno", target: "libertad", value: 130, label: "Rivalidad histórica", w: 2.6 },
  ],
};

const texLoader = new THREE.TextureLoader();
texLoader.setCrossOrigin("anonymous");
const texCache = new Map<string, THREE.Texture>();
function loadTex(u?: string): THREE.Texture | null {
  if (!u) return null;
  if (texCache.has(u)) return texCache.get(u)!;
  const t = texLoader.load(u);
  t.colorSpace = THREE.SRGBColorSpace;
  texCache.set(u, t);
  return t;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function makeNodeObject(n: GraphNode): any {
  const size = 9 + Math.min(n.val, 60) * 0.32;
  const group = new THREE.Group();

  // Disco circular con el escudo del club (textura) siempre visible
  const tex = loadTex(n.escudo);
  const discMat = new THREE.MeshBasicMaterial({
    map: tex || null,
    color: tex ? 0xffffff : new THREE.Color(n.color),
    transparent: true,
  });
  const disc = new THREE.Mesh(new THREE.CircleGeometry(size * 0.62, 48), discMat);
  group.add(disc);

  // Anillo glow del color del club
  const ring = new THREE.Mesh(
    new THREE.RingGeometry(size * 0.66, size * 0.78, 48),
    new THREE.MeshBasicMaterial({ color: new THREE.Color(n.color), side: THREE.DoubleSide, transparent: true, opacity: 0.9 })
  );
  group.add(ring);

  // Halo exterior albirrojo (identidad APF: rojo #CC001C) tenue — bloom lo realza
  const halo = new THREE.Mesh(
    new THREE.RingGeometry(size * 0.8, size * 1.08, 48),
    new THREE.MeshBasicMaterial({ color: new THREE.Color("#CC001C"), side: THREE.DoubleSide, transparent: true, opacity: 0.22 })
  );
  group.add(halo);

  const baseScale = 1;
  group.userData.baseScale = baseScale;
  group.scale.setScalar(baseScale);
  return group;
}

export default function Red3DPage() {
  const containerRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const graphRef = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const bloomRef = useRef<any>(null);
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [hovered, setHovered] = useState<string | null>(null);
  const [isClient, setIsClient] = useState(false);
  const [mode, setMode] = useState<"rivalidades" | "fichajes">("rivalidades");
  const [temporada, setTemporada] = useState<string>("todas");
  const [query, setQuery] = useState("");
  const [autoRotate, setAutoRotate] = useState(true);
  const [rivalidadesData, setRivalidadesData] = useState<GraphData>(RIVALIDADES_FALLBACK);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [transfers, setTransfers] = useState<any[]>([]);
  const [graphReady, setGraphReady] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Cargar rivalidades (estático) y transferencias (API)
  useEffect(() => {
    fetch("/data/red-clubes.json")
      .then((r) => r.json())
      .then((d: GraphData) => {
        const nodes = d.nodes.map((n) => ({
          ...n,
          color: CLUB_COLORS[n.id] || n.color,
          tipo: "club" as const,
          escudo: escudoUrl(n.id),
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

  // Grafo de fichajes
  const fichajesData = useMemo<GraphData>(() => {
    const vis = temporada === "todas" ? transfers : transfers.filter((t) => String(new Date(t.fecha).getFullYear()) === temporada);
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
      escudo: escudoUrl(c.id),
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

  const graphData = useMemo<GraphData | null>(() => (mode === "rivalidades" ? rivalidadesData : fichajesData), [mode, rivalidadesData, fichajesData]);

  const clubList = useMemo(() => rivalidadesData.nodes.slice().sort((a, b) => (b.titulos ?? 0) - (a.titulos ?? 0)), [rivalidadesData]);
  const filteredList = useMemo(() => clubList.filter((c) => c.name.toLowerCase().includes(query.toLowerCase())), [clubList, query]);

  // Crear grafo 3D + post-procesado (bloom) + starfield
  useEffect(() => {
    if (!isClient || !containerRef.current || graphRef.current) return;
    let cancelled = false;

    import("3d-force-graph").then((mod: any) => {
      const ForceGraph3D = mod.default;
      if (cancelled || !containerRef.current) return;
      const el = containerRef.current;

      const Graph = ForceGraph3D()(el)
        .backgroundColor("#020a14")
        .showNavInfo(false)
        .nodeLabel((n: GraphNode) => n.label)
        .nodeColor((n: GraphNode) => n.color)
        .nodeThreeObject(makeNodeObject)
        .nodeThreeObjectExtend(false)
        .nodeOpacity(1)
        .nodeResolution(24)
        .linkLabel((l: GraphLink) => l.label)
        .linkColor(() => "rgba(255,204,0,0.35)")
        .linkWidth((l: GraphLink) => l.w)
        .linkOpacity(0.45)
        .linkCurvature(0.18)
        .linkDirectionalParticles(4)
        .linkDirectionalParticleSpeed(0.006)
        .linkDirectionalParticleWidth(2.4)
        .linkDirectionalParticleColor((l: GraphLink) => {
          const s = typeof l.source === "object" ? (l.source as GraphNode).color : "#CC001C";
          return s || "#CC001C";
        })
        .onNodeHover((node: any) => {
          const id = node?.id ?? null;
          setHovered(id);
          if (el) el.style.cursor = id ? "pointer" : "grab";
          if (graphRef.current) graphRef.current.refresh();
        })
        .onNodeClick((node: GraphNode) => {
          const n = node as GraphNode & { x?: number; y?: number; z?: number };
          const distance = 130;
          const hypot = Math.hypot(n.x || 1, n.y || 1, n.z || 1) || 1;
          const distRatio = 1 + distance / hypot;
          Graph.cameraPosition(
            { x: (n.x || 0) * distRatio, y: (n.y || 0) * distRatio, z: (n.z || 0) * distRatio },
            node as unknown as { x: number; y: number; z: number },
            1600
          );
          setAutoRotate(false);
          setSelectedNode(n);
        })
        .enablePointerInteraction(true)
        .enableNodeDrag(true);

      // Fuerzas: separación y evitar hacinamiento en el centro
      Graph.d3Force("charge")?.strength(-180);
      Graph.d3Force("link")?.distance((l: any) => 60 + (l.value || 1) / 3);

      // Starfield de fondo
      const scene = Graph.scene();
      const starGeo = new THREE.BufferGeometry();
      const starCount = 1400;
      const pos = new Float32Array(starCount * 3);
      for (let i = 0; i < starCount; i++) {
        const r = 600 + Math.random() * 900;
        const th = Math.random() * Math.PI * 2;
        const ph = Math.acos(2 * Math.random() - 1);
        pos[i * 3] = r * Math.sin(ph) * Math.cos(th);
        pos[i * 3 + 1] = r * Math.sin(ph) * Math.sin(th);
        pos[i * 3 + 2] = r * Math.cos(ph);
      }
      starGeo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
      const stars = new THREE.Points(starGeo, new THREE.PointsMaterial({ color: 0x9fb4ff, size: 1.4, sizeAttenuation: true, transparent: true, opacity: 0.8 }));
      scene.add(stars);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (Graph as any)._stars = stars;

      // Niebla para profundidad
      scene.fog = new THREE.FogExp2(0x020a14, 0.0016);

      // Post-procesado: Bloom
      const renderer = Graph.renderer();
      const composer = new EffectComposer(renderer);
      composer.addPass(new RenderPass(scene, Graph.camera()));
      const bloom = new UnrealBloomPass(new THREE.Vector2(el.clientWidth || 800, el.clientHeight || 600), 1.1, 0.55, 0.12);
      composer.addPass(bloom);
      bloomRef.current = bloom;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (Graph as any)._composer = composer;

      // Reemplazar el render loop para usar composer
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let raf = 0 as any;
      const tick = () => {
        if (cancelled) return;
        const g: any = Graph;
        if (g._stars) g._stars.rotation.y += 0.0004;
        if (autoRotateRef.current && !selectedNodeRef.current) {
          const angle = 0.0009;
          const x = Graph.cameraPosition().x;
          const z = Graph.cameraPosition().z;
          Graph.cameraPosition({ x: x * Math.cos(angle) - z * Math.sin(angle), z: x * Math.sin(angle) + z * Math.cos(angle) });
        }
        composer.render();
        raf = requestAnimationFrame(tick);
      };
      tick();

      graphRef.current = Graph;
      graphReadyRef.current = false;
    });

    return () => {
      cancelled = true;
      if (graphRef.current) {
        graphRef.current._destructor?.();
        graphRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isClient]);

  // refs para usar en el loop sin re-crear el grafo
  const autoRotateRef = useRef(autoRotate);
  const selectedNodeRef = useRef(selectedNode);
  const graphReadyRef = useRef(false);
  useEffect(() => { autoRotateRef.current = autoRotate; }, [autoRotate]);
  useEffect(() => { selectedNodeRef.current = selectedNode; }, [selectedNode]);

  // Aplicar datos
  useEffect(() => {
    if (graphRef.current && graphData) {
      graphRef.current.graphData(graphData);
      graphReadyRef.current = true;
      setGraphReady(true);
      setTimeout(() => graphRef.current?.zoomToFit(800, 80), 400);
    } else {
      setGraphReady(false);
    }
  }, [graphData]);

  // Hover scale
  useEffect(() => {
    const g: any = graphRef.current;
    if (!g) return;
    const nodes = g.graphData()?.nodes || [];
    nodes.forEach((n: any) => {
      const obj = n.__threeObj;
      if (!obj) return;
      const active = hovered === n.id || selectedNode?.id === n.id;
      const target = active ? 1.45 : 1;
      obj.scale.setScalar(target);
    });
  }, [hovered, selectedNode]);

  // Resize
  useEffect(() => {
    const onResize = () => {
      const g: any = graphRef.current;
      if (!g || !containerRef.current) return;
      const w = containerRef.current.clientWidth;
      const h = containerRef.current.clientHeight;
      g.width(w).height(h);
      g._composer?.setSize(w, h);
      g.renderer()?.setSize?.(w, h, false);
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const flyTo = (id: string) => {
    const g: any = graphRef.current;
    if (!g) return;
    const node = g.graphData()?.nodes?.find((n: any) => n.id === id);
    if (!node) return;
    const n = node as GraphNode & { x?: number; y?: number; z?: number };
    const distance = 130;
    const hypot = Math.hypot(n.x || 1, n.y || 1, n.z || 1) || 1;
    const distRatio = 1 + distance / hypot;
    g.cameraPosition(
      { x: (n.x || 0) * distRatio, y: (n.y || 0) * distRatio, z: (n.z || 0) * distRatio },
      n as unknown as { x: number; y: number; z: number },
      1500
    );
    setAutoRotate(false);
    setSelectedNode(n);
  };

  const anios = useMemo(() => {
    const set = new Set<string>();
    transfers.forEach((t) => set.add(String(new Date(t.fecha).getFullYear())));
    return ["todas", ...[...set].sort().reverse()];
  }, [transfers]);

  const totalLinks = graphData?.links.length ?? 0;
  const totalNodes = graphData?.nodes.length ?? 0;

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
        {/* Controles glass */}
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
              autoRotate ? "bg-dorado-medalla/15 border-dorado-medalla/40 text-dorado-medalla" : "bg-bg-secundario/70 border-borde-sutil text-texto-secundario"
            }`}
          >
            {autoRotate ? "⏸ Auto-rotar" : "▶ Auto-rotar"}
          </button>

          <button
            onClick={() => {
              setAutoRotate(false);
              graphRef.current?.zoomToFit(1000, 80);
            }}
            className="px-4 py-2 rounded-xl text-sm font-medium bg-bg-secundario/70 border border-borde-sutil text-texto-secundario hover:text-texto-principal transition"
          >
            ⟲ Reset cámara
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

        {/* Buscador + contador */}
        <div className="mb-5 flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[220px]">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar club…"
              className="w-full px-4 py-2.5 rounded-xl bg-bg-noche border border-borde-sutil text-texto-principal text-sm placeholder:text-texto-apagado focus:outline-none focus:border-dorado-medalla/50"
            />
          </div>
          <div className="text-xs text-texto-secundario px-3 py-2 rounded-lg bg-bg-secundario/60 border border-borde-sutil">
            {totalNodes} clubes · {totalLinks} conexiones
          </div>
        </div>

        {/* Layout: grafo + lista lateral */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-5">
          <div className="relative w-full rounded-2xl border border-borde-marca overflow-hidden bg-[#020a14] shadow-[0_0_40px_-10px_rgba(255,204,0,0.25)]">
            <div ref={containerRef} className="w-full h-[600px] lg:h-[720px]" />
            {!graphReady && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-[#020a14]">
                <div className="w-10 h-10 border-2 border-apf-rojo/30 border-t-apf-rojo rounded-full animate-spin" />
                <p className="text-texto-secundario text-sm">Cargando grafo 3D…</p>
              </div>
            )}

            {/* Instrucciones flotantes */}
            <div className="absolute top-3 left-3 flex flex-wrap gap-3 text-[11px] text-texto-secundario bg-bg-noche/70 backdrop-blur px-3 py-2 rounded-lg border border-borde-sutil">
              <span>🖱 Arrastrá para rotar</span>
              <span>🔍 Scroll para zoom</span>
              <span>⚡ Click en un club para volar</span>
            </div>

            {selectedNode && (
              <div className="absolute bottom-4 left-4 right-4 lg:left-4 lg:right-auto lg:w-80 bg-bg-secundario/95 backdrop-blur-sm border-l-4 border-apf-rojo rounded-xl p-4 shadow-2xl ring-1 ring-white/10">
                <div className="flex items-start gap-3">
                  {selectedNode.escudo && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={selectedNode.escudo} alt={selectedNode.name} className="w-14 h-14 object-contain rounded-lg bg-white/10 p-1 shadow" />
                  )}
                  <div className="flex-1">
                    <h3 className="text-texto-principal font-bold text-lg leading-tight">{selectedNode.name}</h3>
                    <div className="flex gap-4 mt-1 text-sm">
                      {mode === "rivalidades" ? (
                        <>
                          <span className="text-dorado-medalla font-semibold">{selectedNode.titulos ?? 0} títulos</span>
                          <span className="text-texto-secundario">{selectedNode.intl ?? 0} int.</span>
                        </>
                      ) : (
                        <span className="text-dorado-medalla font-semibold">{selectedNode.movimientos ?? 0} movimientos</span>
                      )}
                    </div>
                  </div>
                  <button onClick={() => setSelectedNode(null)} className="text-texto-apagado hover:text-apf-rojo text-xl leading-none">
                    ×
                  </button>
                </div>
                <a href={`/clubes/${selectedNode.id}`} className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-apf-rojo hover:text-white transition-colors">
                  Ver ficha completa →
                </a>
              </div>
            )}
          </div>

          {/* Lista lateral clicable */}
          <aside className="rounded-2xl border border-borde-sutil bg-bg-secundario/40 backdrop-blur p-3 h-[600px] lg:h-[720px] overflow-y-auto">
            <p className="text-xs uppercase tracking-wider text-texto-apagado mb-2 px-1">Clubes</p>
            <ul className="space-y-1">
              {filteredList.map((c) => (
                <li key={c.id}>
                  <button
                    onClick={() => flyTo(c.id)}
                    onMouseEnter={() => setHovered(c.id)}
                    onMouseLeave={() => setHovered(null)}
                    className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-left transition ${
                      selectedNode?.id === c.id ? "bg-apf-rojo/15 ring-1 ring-apf-rojo/40" : "hover:bg-bg-noche"
                    }`}
                  >
                    {c.escudo && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={c.escudo} alt="" className="w-7 h-7 object-contain rounded bg-white/5 p-0.5" />
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
            <p className="text-texto-principal font-semibold mb-1">Tamaño del nodo</p>
            <p className="text-texto-secundario">
              {mode === "rivalidades" ? "Cantidad de títulos de Primera División del club." : "Cantidad de movimientos en los que participa."}
            </p>
          </div>
          <div className="p-4 rounded-xl bg-bg-secundario/60 border border-borde-sutil">
            <p className="text-texto-principal font-semibold mb-1">Grosor del enlace</p>
            <p className="text-texto-secundario">
              {mode === "rivalidades" ? "Enfrentamientos históricos entre dos clubes." : "Inversión total movilizada en fichajes."}
            </p>
          </div>
          <div className="p-4 rounded-xl bg-bg-secundario/60 border border-borde-sutil">
            <p className="text-texto-principal font-semibold mb-1">Partículas</p>
            <p className="text-texto-secundario">Estela que recorre los enlaces según la intensidad de la conexión.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
