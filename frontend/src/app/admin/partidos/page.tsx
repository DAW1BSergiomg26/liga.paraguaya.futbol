"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getPartidos, updatePartido, getClubes } from "@/lib/api";
import type { Partido } from "@/types";

export default function AdminPartidosPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ goles_local: "", goles_visitante: "", estado: "programado" });
  const [filtroTorneo, setFiltroTorneo] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const key = localStorage.getItem("admin_api_key");
    if (!key) router.push("/admin");
    else setApiKey(key);
  }, [router]);

  const { data: partidos, isLoading } = useQuery<Partido[]>({
    queryKey: ["partidos", filtroTorneo, filtroEstado],
    queryFn: () => getPartidos(filtroTorneo || undefined, filtroEstado || undefined),
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

  async function handleSave(id: string) {
    if (!apiKey) return;
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
      queryClient.invalidateQueries({ queryKey: ["partidos"] });
      setEditingId(null);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Error al guardar");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-12">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">Admin - Partidos</h1>
        <button
          onClick={() => { localStorage.removeItem("admin_api_key"); router.push("/admin"); }}
          className="text-sm text-gray-400 hover:text-white transition"
        >
          Cerrar sesión
        </button>
      </div>

      <div className="flex gap-4 mb-6">
        <select
          value={filtroTorneo}
          onChange={(e) => setFiltroTorneo(e.target.value)}
          className="px-3 py-2 rounded-lg bg-[#1a2a3a] border border-white/10 text-white text-sm"
        >
          <option value="">Todos los torneos</option>
          <option value="Apertura 2026">Apertura 2026</option>
          <option value="Clausura 2026">Clausura 2026</option>
        </select>
        <select
          value={filtroEstado}
          onChange={(e) => setFiltroEstado(e.target.value)}
          className="px-3 py-2 rounded-lg bg-[#1a2a3a] border border-white/10 text-white text-sm"
        >
          <option value="">Todos los estados</option>
          <option value="programado">Programado</option>
          <option value="finalizado">Finalizado</option>
        </select>
      </div>

      {error && <div className="mb-4 p-3 rounded-lg bg-red-900/30 text-red-300 text-sm">{error}</div>}

      {isLoading ? (
        <div className="text-center py-12 text-gray-400">Cargando partidos...</div>
      ) : (
        <div className="space-y-2">
          {(partidos || []).slice(0, 50).map((p) => (
            <div
              key={p.id}
              className="p-4 rounded-xl border border-white/10 bg-[#0a1628]/60"
            >
              {editingId === p.id ? (
                <div className="space-y-3">
                  <div className="text-sm text-gray-400">
                    {p.torneo} · Jornada {p.jornada} · {new Date(p.fecha).toLocaleDateString("es-PY")}
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-white font-medium w-40 text-right">{clubMap.get(p.local_id) || p.local_id}</span>
                    <input
                      type="number"
                      className="w-16 px-3 py-2 rounded-lg bg-[#1a2a3a] border border-white/10 text-white text-center"
                      value={form.goles_local}
                      onChange={(e) => setForm({ ...form, goles_local: e.target.value })}
                    />
                    <span className="text-gray-400">vs</span>
                    <input
                      type="number"
                      className="w-16 px-3 py-2 rounded-lg bg-[#1a2a3a] border border-white/10 text-white text-center"
                      value={form.goles_visitante}
                      onChange={(e) => setForm({ ...form, goles_visitante: e.target.value })}
                    />
                    <span className="text-white font-medium w-40">{clubMap.get(p.visitante_id) || p.visitante_id}</span>
                    <select
                      value={form.estado}
                      onChange={(e) => setForm({ ...form, estado: e.target.value })}
                      className="px-3 py-2 rounded-lg bg-[#1a2a3a] border border-white/10 text-white text-sm"
                    >
                      <option value="programado">Programado</option>
                      <option value="finalizado">Finalizado</option>
                    </select>
                    <button
                      onClick={() => handleSave(p.id)}
                      disabled={saving}
                      className="px-4 py-2 rounded-lg bg-[#76e4f7] text-black font-semibold text-sm hover:bg-[#5ac8df] transition disabled:opacity-50"
                    >
                      {saving ? "Guardando..." : "Guardar"}
                    </button>
                    <button
                      onClick={() => setEditingId(null)}
                      className="px-4 py-2 rounded-lg border border-white/10 text-gray-400 text-sm hover:text-white transition"
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
                      <span className="text-gray-500">{p.torneo} · J{p.jornada}</span>
                      <span className={`px-2 py-0.5 rounded-full text-xs ${
                        p.estado === "finalizado"
                          ? "bg-green-900/30 text-green-300"
                          : "bg-yellow-900/30 text-yellow-300"
                      }`}>
                        {p.estado}
                      </span>
                      <span className="text-[#76e4f7] text-xs">Editar</span>
                    </div>
                  </div>
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
