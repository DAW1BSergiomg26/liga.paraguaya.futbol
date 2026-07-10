"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getPartidos, updatePartido, getClubes } from "@/lib/api";
import type { Partido, PartidoPage } from "@/types";
import Pagination from "@/components/Pagination";

export default function AdminPartidosPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [apiKey] = useState<string | null>(() => {
    try { return localStorage.getItem("admin_api_key"); } catch { return null; }
  });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ goles_local: "", goles_visitante: "", estado: "programado" });
  const [filtroTorneo, setFiltroTorneo] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("");
  const [page, setPage] = useState(1);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);

  useEffect(() => {
    if (!apiKey) router.push("/admin");
  }, [apiKey, router]);

  const showToast = useCallback((type: "success" | "error", message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3000);
  }, []);

  const { data: pageData, isLoading } = useQuery<PartidoPage>({
    queryKey: ["partidos", filtroTorneo, filtroEstado, page],
    queryFn: () => getPartidos(filtroTorneo || undefined, filtroEstado || undefined, page, 20),
    enabled: !!apiKey,
  });

  const { data: clubes } = useQuery({
    queryKey: ["clubes"],
    queryFn: () => getClubes(),
    enabled: !!apiKey,
  });

  const clubMap = new Map(clubes?.map((c) => [c.id, c.nombre]) || []);

  function startEdit(p: Partido) {
    setEditingId(p.id);
    setForm({
      goles_local: p.goles_local?.toString() ?? "",
      goles_visitante: p.goles_visitante?.toString() ?? "",
      estado: p.estado,
    });
    setError("");
  }

  function validarGoles(val: string): boolean {
    if (val === "") return true;
    const n = Number(val);
    return Number.isInteger(n) && n >= 0;
  }

  async function handleSave(id: string) {
    if (!apiKey) return;
    if (!validarGoles(form.goles_local) || !validarGoles(form.goles_visitante)) {
      setError("Los goles deben ser números enteros no negativos");
      return;
    }
    setSaving(true);
    setError("");
    try {
      await updatePartido(
        id,
        {
          goles_local: form.goles_local !== "" ? Number(form.goles_local) : null,
          goles_visitante: form.goles_visitante !== "" ? Number(form.goles_visitante) : null,
          estado: form.estado,
        },
        apiKey
      );
      await queryClient.invalidateQueries({ queryKey: ["partidos"] });
      setEditingId(null);
      showToast("success", "Partido actualizado correctamente");
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Error al guardar";
      setError(msg);
      showToast("error", msg);
    } finally {
      setSaving(false);
    }
  }

  function handleFilterChange(type: "torneo" | "estado", value: string) {
    if (type === "torneo") setFiltroTorneo(value);
    else setFiltroEstado(value);
    setPage(1);
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-12">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">Admin - Partidos</h1>
        <button
          onClick={() => { localStorage.removeItem("admin_api_key"); router.push("/admin"); }}
          className="text-sm text-texto-secundario hover:text-white transition"
        >
          Cerrar sesión
        </button>
      </div>

      {toast && (
        <div className={`fixed top-6 right-6 z-50 px-6 py-3 rounded-xl shadow-2xl text-sm font-medium transition-all ${
          toast.type === "success"
            ? "bg-green-900/80 text-green-200 border border-green-700/50"
            : "bg-red-900/80 text-red-200 border border-red-700/50"
        }`}>
          {toast.type === "success" ? "✓ " : "✗ "}{toast.message}
        </div>
      )}

      <div className="flex gap-4 mb-6">
        <select
          value={filtroTorneo}
          onChange={(e) => handleFilterChange("torneo", e.target.value)}
          className="px-3 py-2 rounded-lg bg-bg-terciario border border-borde-sutil text-white text-sm"
        >
          <option value="">Todos los torneos</option>
          <option value="Apertura 2026">Apertura 2026</option>
          <option value="Clausura 2026">Clausura 2026</option>
        </select>
        <select
          value={filtroEstado}
          onChange={(e) => handleFilterChange("estado", e.target.value)}
          className="px-3 py-2 rounded-lg bg-bg-terciario border border-borde-sutil text-white text-sm"
        >
          <option value="">Todos los estados</option>
          <option value="programado">Programado</option>
          <option value="finalizado">Finalizado</option>
        </select>
      </div>

      {error && <div className="mb-4 p-3 rounded-lg bg-red-900/30 text-red-300 text-sm">{error}</div>}

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-16 bg-white/5 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : (
        <>
          <div className="space-y-2">
            {(pageData?.data || []).map((p) => (
              <div
                key={p.id}
                className={`p-4 rounded-xl border border-borde-sutil transition-colors ${
                  editingId === p.id ? "bg-[#0a2a1a]/60 border-green-700/30" : "bg-bg-secundario/60"
                }`}
              >
                {editingId === p.id ? (
                  <div className="space-y-3">
                    <div className="text-sm text-texto-secundario">
                      {p.torneo} · Jornada {p.jornada} · {new Date(p.fecha).toLocaleDateString("es-PY")}
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-white font-medium w-40 text-right">{clubMap.get(p.local_id) || p.local_id}</span>
                      <input
                        type="number"
                        min="0"
                        className="w-16 px-3 py-2 rounded-lg bg-bg-terciario border border-borde-sutil text-white text-center"
                        value={form.goles_local}
                        onChange={(e) => setForm({ ...form, goles_local: e.target.value })}
                      />
                      <span className="text-texto-secundario">vs</span>
                      <input
                        type="number"
                        min="0"
                        className="w-16 px-3 py-2 rounded-lg bg-bg-terciario border border-borde-sutil text-white text-center"
                        value={form.goles_visitante}
                        onChange={(e) => setForm({ ...form, goles_visitante: e.target.value })}
                      />
                      <span className="text-white font-medium w-40">{clubMap.get(p.visitante_id) || p.visitante_id}</span>
                      <select
                        value={form.estado}
                        onChange={(e) => setForm({ ...form, estado: e.target.value })}
                        className="px-3 py-2 rounded-lg bg-bg-terciario border border-borde-sutil text-white text-sm"
                      >
                        <option value="programado">Programado</option>
                        <option value="finalizado">Finalizado</option>
                      </select>
                      <button
                        onClick={() => handleSave(p.id)}
                        disabled={saving}
                        className="px-4 py-2 rounded-lg bg-apf-rojo text-black font-semibold text-sm hover:bg-apf-rojo-oscuro transition disabled:opacity-50"
                      >
                        {saving ? "Guardando..." : "Guardar"}
                      </button>
                      <button
                        onClick={() => setEditingId(null)}
                        className="px-4 py-2 rounded-lg border border-borde-sutil text-texto-secundario text-sm hover:text-white transition"
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                ) : (
                  <button onClick={() => startEdit(p)} className="w-full text-left">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-white font-medium w-40 text-right">{clubMap.get(p.local_id) || p.local_id}</span>
                        <span className="text-white font-bold">
                          {p.goles_local !== null ? `${p.goles_local} - ${p.goles_visitante}` : "vs"}
                        </span>
                        <span className="text-white font-medium w-40">{clubMap.get(p.visitante_id) || p.visitante_id}</span>
                      </div>
                      <div className="flex items-center gap-3 text-sm">
                        <span className="text-texto-apagado">{p.torneo} · J{p.jornada}</span>
                        <span className={`px-2 py-0.5 rounded-full text-xs ${
                          p.estado === "finalizado"
                            ? "bg-green-900/30 text-green-300"
                            : "bg-yellow-900/30 text-yellow-300"
                        }`}>
                          {p.estado}
                        </span>
                        <span className="text-apf-rojo text-xs">Editar</span>
                      </div>
                    </div>
                  </button>
                )}
              </div>
            ))}
          </div>

          {pageData && (
            <Pagination
              page={pageData.page}
              totalPages={pageData.total_pages}
              onPageChange={setPage}
            />
          )}
        </>
      )}
    </div>
  );
}
