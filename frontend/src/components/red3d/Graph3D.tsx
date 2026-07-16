"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import type { NodeObject, LinkObject } from "3d-force-graph";

interface ClubNode extends NodeObject {
  id: string;
  name: string;
  val: number;
  color: string;
  label: string;
  titulos?: number;
  intl?: number;
  movimientos?: number;
  escudo?: string;
}

interface ClubLink extends LinkObject {
  value: number;
  label: string;
  w: number;
}

type GraphData = { nodes: ClubNode[]; links: ClubLink[] };

const APF_ROJO = "#CC001C";

interface GraphInstance {
  _stars?: THREE.Points;
  refresh(): void;
  graphData(): { nodes?: ClubNode[]; links?: ClubLink[] };
  graphData(data: GraphData): GraphInstance;
  d3Force(name: string): { strength?: (v: number) => unknown; distance?: (fn: (l: ClubLink) => number) => unknown } | undefined;
  cameraPosition(): { x: number; y: number; z: number };
  cameraPosition(pos: { x: number; y: number; z: number }, lookAt?: { x: number; y: number; z: number }, ms?: number): GraphInstance;
  zoomToFit(ms?: number, pad?: number, filter?: (n: ClubNode) => boolean): GraphInstance;
  scene(): THREE.Scene;
  width(w: number): GraphInstance;
  height(h: number): GraphInstance;
  _destructor(): void;
  backgroundColor(c: string): GraphInstance;
  showNavInfo(enabled: boolean): GraphInstance;
  nodeLabel(accessor: (n: NodeObject) => string): GraphInstance;
  nodeColor(accessor: (n: NodeObject) => string): GraphInstance;
  nodeThreeObject(accessor: (n: NodeObject) => THREE.Object3D): GraphInstance;
  nodeThreeObjectExtend(extend: boolean): GraphInstance;
  nodeOpacity(o: number): GraphInstance;
  nodeResolution(r: number): GraphInstance;
  linkLabel(accessor: (l: LinkObject) => string): GraphInstance;
  linkColor(accessor: (l: LinkObject) => string): GraphInstance;
  linkWidth(accessor: (l: LinkObject) => number): GraphInstance;
  linkOpacity(o: number): GraphInstance;
  linkCurvature(c: number): GraphInstance;
  linkDirectionalParticles(p: number): GraphInstance;
  linkDirectionalParticleSpeed(s: number): GraphInstance;
  linkDirectionalParticleWidth(w: number): GraphInstance;
  linkDirectionalParticleColor(accessor: (l: LinkObject) => string): GraphInstance;
  onNodeHover(cb: (node: NodeObject | null) => void): GraphInstance;
  onNodeClick(cb: (node: NodeObject) => void): GraphInstance;
  enablePointerInteraction(enabled: boolean): GraphInstance;
  enableNodeDrag(enabled: boolean): GraphInstance;
}

const texLoader = new THREE.TextureLoader();
texLoader.setCrossOrigin("anonymous");
const texCache = new Map<string, THREE.Texture>();

function loadTexture(url?: string): THREE.Texture | null {
  if (!url) return null;
  if (texCache.has(url)) return texCache.get(url) as THREE.Texture;
  const t = texLoader.load(url);
  t.colorSpace = THREE.SRGBColorSpace;
  texCache.set(url, t);
  return t;
}

function buildNodeObject(node: ClubNode): THREE.Group {
  const size = 9 + Math.min(node.val, 60) * 0.32;
  const group = new THREE.Group();

  const tex = loadTexture(node.escudo);
  const discMat = new THREE.MeshBasicMaterial({
    map: tex ?? null,
    color: tex ? 0xffffff : new THREE.Color(node.color),
    transparent: true,
  });
  const disc = new THREE.Mesh(new THREE.CircleGeometry(size * 0.62, 48), discMat);
  group.add(disc);

  const ring = new THREE.Mesh(
    new THREE.RingGeometry(size * 0.66, size * 0.78, 48),
    new THREE.MeshBasicMaterial({ color: new THREE.Color(node.color), side: THREE.DoubleSide, transparent: true, opacity: 0.9 })
  );
  group.add(ring);

  const halo = new THREE.Mesh(
    new THREE.RingGeometry(size * 0.8, size * 1.08, 48),
    new THREE.MeshBasicMaterial({ color: new THREE.Color(APF_ROJO), side: THREE.DoubleSide, transparent: true, opacity: 0.22 })
  );
  group.add(halo);

  group.scale.setScalar(1);
  return group;
}

export interface Graph3DHandle {
  flyTo: (id: string) => void;
  zoomToFit: (ms?: number, pad?: number) => void;
  setAutoRotate: (v: boolean) => void;
}

interface Graph3DProps {
  data: GraphData | null;
  autoRotate: boolean;
  onSelect: (node: ClubNode | null) => void;
  onReady: (handle: Graph3DHandle) => void;
}

export default function Graph3D({ data, autoRotate, onSelect, onReady }: Graph3DProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const graphRef = useRef<GraphInstance | null>(null);
  const autoRotateRef = useRef(autoRotate);
  const selectedRef = useRef<ClubNode | null>(null);
  const [hovered, setHovered] = useState<string | null>(null);
  const [, setReady] = useState(false);

  useEffect(() => {
    autoRotateRef.current = autoRotate;
  }, [autoRotate]);

  useEffect(() => {
    if (!containerRef.current || graphRef.current) return;
    const el = containerRef.current;
    let cancelled = false;
    let raf = 0;

    import("3d-force-graph")
      .then((mod) => {
        if (cancelled || !containerRef.current) return;
        const ForceGraph3D = mod.default;
        try {
          const factory = ForceGraph3D as unknown as (opts: { controlType: "orbit" }) => (el: HTMLElement) => GraphInstance;
          const Graph = factory({ controlType: "orbit" })(el)
            .backgroundColor("#020a14")
            .showNavInfo(false)
            .nodeLabel((n: NodeObject) => (n as ClubNode).label)
            .nodeColor((n: NodeObject) => (n as ClubNode).color)
            .nodeThreeObject((n: NodeObject) => buildNodeObject(n as ClubNode))
            .nodeThreeObjectExtend(false)
            .nodeOpacity(1)
            .nodeResolution(24)
            .linkLabel((l: LinkObject) => (l as ClubLink).label)
            .linkColor(() => "rgba(255,204,0,0.35)")
            .linkWidth((l: LinkObject) => (l as ClubLink).w)
            .linkOpacity(0.45)
            .linkCurvature(0.18)
            .linkDirectionalParticles(4)
            .linkDirectionalParticleSpeed(0.006)
            .linkDirectionalParticleWidth(2.4)
            .linkDirectionalParticleColor((l: LinkObject) => {
              const s = (l as ClubLink).source;
              return (s as ClubNode)?.color ?? APF_ROJO;
            })
            .onNodeHover((node: NodeObject | null) => {
              const id = (node as ClubNode | null)?.id ?? null;
              setHovered(id);
              if (el) el.style.cursor = id ? "pointer" : "grab";
              if (graphRef.current) graphRef.current.refresh();
            })
            .onNodeClick((node: NodeObject) => {
              const n = node as ClubNode;
              selectedRef.current = n;
              onSelect(n);
            })
            .enablePointerInteraction(true)
            .enableNodeDrag(true) as GraphInstance;

          Graph.d3Force("charge")?.strength?.(-180);
          Graph.d3Force("link")?.distance?.((l: ClubLink) => 60 + (l.value || 1) / 3);

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
          const stars = new THREE.Points(
            starGeo,
            new THREE.PointsMaterial({ color: 0x9fb4ff, size: 1.4, sizeAttenuation: true, transparent: true, opacity: 0.8 })
          );
          scene.add(stars);
          Graph._stars = stars;
          scene.fog = new THREE.FogExp2(0x020a14, 0.0016);

          graphRef.current = Graph;

          const tick = () => {
            if (cancelled) return;
            const g = graphRef.current;
            if (g) {
              if (autoRotateRef.current && !selectedRef.current) {
                const angle = 0.0009;
                const p = g.cameraPosition();
                const nx = p.x * Math.cos(angle) - p.z * Math.sin(angle);
                const nz = p.x * Math.sin(angle) + p.z * Math.cos(angle);
                g.cameraPosition({ x: nx, y: p.y, z: nz }, p);
              }
              if (g._stars) g._stars.rotation.y += 0.0004;
            }
            raf = requestAnimationFrame(tick);
          };
          tick();

          setReady(true);
          onReady({
            flyTo: (id: string) => {
              const node = (Graph.graphData().nodes ?? []).find((n) => n.id === id);
              if (!node) return;
              const distance = 130;
              const hypot = Math.hypot(node.x || 1, node.y || 1, node.z || 1) || 1;
              const distRatio = 1 + distance / hypot;
              Graph.cameraPosition(
                { x: (node.x || 0) * distRatio, y: (node.y || 0) * distRatio, z: (node.z || 0) * distRatio },
                { x: node.x || 0, y: node.y || 0, z: node.z || 0 },
                1500
              );
            },
            zoomToFit: (ms?: number, pad?: number) => Graph.zoomToFit(ms ?? 1000, pad ?? 80),
            setAutoRotate: (v: boolean) => {
              autoRotateRef.current = v;
            },
          });
          window.setTimeout(() => Graph.zoomToFit(800, 80), 400);
        } catch (err) {
          console.error("[red3d] error al inicializar el grafo 3D:", err);
        }
      })
      .catch((err) => {
        console.error("[red3d] no se pudo cargar 3d-force-graph:", err);
      });

    return () => {
      cancelled = true;
      if (raf) cancelAnimationFrame(raf);
      if (graphRef.current) {
        graphRef.current._destructor();
        graphRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const Graph = graphRef.current;
    if (Graph && data) {
      Graph.graphData(data);
      window.setTimeout(() => graphRef.current?.zoomToFit(800, 80), 400);
    }
  }, [data]);

  useEffect(() => {
    const Graph = graphRef.current;
    if (!Graph) return;
    const nodes = Graph.graphData().nodes ?? [];
    nodes.forEach((n) => {
      const obj = (n as ClubNode & { __threeObj?: THREE.Object3D }).__threeObj;
      if (!obj) return;
      const active = hovered === n.id || selectedRef.current?.id === n.id;
      obj.scale.setScalar(active ? 1.45 : 1);
    });
  }, [hovered]);

  useEffect(() => {
    const onResize = () => {
      const Graph = graphRef.current;
      const el = containerRef.current;
      if (!Graph || !el) return;
      Graph.width(el.clientWidth).height(el.clientHeight);
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  return <div ref={containerRef} className="w-full h-[600px] lg:h-[720px]" />;
}
