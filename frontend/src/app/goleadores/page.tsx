"use client";

import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { getTorneos } from "@/lib/api";
import PageHeader from "@/components/ui/PageHeader";
import GoleadoresList from "@/components/GoleadoresList";
import GoleadoresHistorial from "@/components/GoleadoresHistorial";

type Tab = "torneo" | "historico";

export default function GoleadoresPage() {
  const [tab, setTab] = useState<Tab>("torneo");
  const [torneo, setTorneo] = useState("");

  const { data: torneos } = useQuery<string[]>({
    queryKey: ["torneos"],
    queryFn: () => getTorneos(),
    staleTime: 300_000,
  });

  useEffect(() => {
    if (torneos && torneos.length > 0 && !torneo) {
      setTorneo(torneos[0]);
    }
  }, [torneos, torneo]);

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <PageHeader
        titulo="Goleadores"
        subtitulo="Máximos goleadores del fútbol paraguayo"
        accion={
          <select
            value={torneo}
            onChange={(e) => setTorneo(e.target.value)}
            className="px-4 py-2 rounded-lg bg-bg-terciario border border-borde-sutil text-white text-sm focus:outline-none focus:border-apf-rojo transition"
          >
            {torneos?.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        }
      />

      <div className="flex gap-2 p-1 rounded-xl bg-bg-secundario/70 backdrop-blur border border-borde-sutil mb-6">
        <button
          onClick={() => setTab("torneo")}
          className={`flex-1 px-4 py-2 rounded-lg text-sm font-semibold transition ${
            tab === "torneo" ? "bg-apf-rojo text-white shadow-lg" : "text-texto-secundario hover:text-texto-principal"
          }`}
        >
          Por torneo
        </button>
        <button
          onClick={() => setTab("historico")}
          className={`flex-1 px-4 py-2 rounded-lg text-sm font-semibold transition ${
            tab === "historico" ? "bg-apf-dorado text-black shadow-lg" : "text-texto-secundario hover:text-texto-principal"
          }`}
        >
          Ranking histórico
        </button>
      </div>

      {tab === "torneo" ? (
        <GoleadoresList torneo={torneo} />
      ) : (
        <GoleadoresHistorial />
      )}
    </div>
  );
}
