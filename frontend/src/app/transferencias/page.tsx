// frontend/src/app/transferencias/page.tsx
"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import type { TransferenciasPaginatedResponse } from "@/types";
import TransferCard from "@/components/transferencia/TransferCard";
import FiltrosTransferencias from "@/components/transferencia/FiltrosTransferencias";
import ScrollReveal from "@/components/ui/ScrollReveal";

const TABS = [
  { key: "confirmada", label: "Confirmadas" },
  { key: "rumor", label: "Rumores" },
  { key: "all", label: "Todas" },
];

export default function TransferenciasPage() {
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [tab, setTab] = useState("confirmada");
  const [page, setPage] = useState(1);

  const params = new URLSearchParams({ page: String(page), per_page: "20" });
  if (tab !== "all") params.set("estado", tab);
  Object.entries(filters).forEach(([k, v]) => { if (v) params.set(k, v); });

  const { data, isLoading } = useQuery<TransferenciasPaginatedResponse>({
    queryKey: ["transferencias", tab, filters, page],
    queryFn: () => apiFetch(`/api/v1/transferencias?${params}`),
  });

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-texto-principal">Mercado de Fichajes</h1>
        <p className="text-texto-secundario mt-1">Transferencias de la Primera División paraguaya</p>
      </div>

      <div className="flex gap-2 mb-6">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => { setTab(t.key); setPage(1); }}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
              tab === t.key
                ? "bg-apf-rojo text-white"
                : "bg-bg-secundario text-texto-secundario hover:text-texto-principal"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <FiltrosTransferencias onFilter={(f) => { setFilters(f); setPage(1); }} />

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-48 bg-bg-secundario rounded-xl animate-pulse" />
          ))}
        </div>
      ) : data?.transferencias.length === 0 ? (
        <p className="text-texto-secundario text-center py-12">No se encontraron transferencias</p>
      ) : (
        <ScrollReveal variant="from-bottom" stagger={0.05}>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {data?.transferencias.map((t) => (
              <TransferCard key={t.id} transferencia={t} />
            ))}
          </div>
        </ScrollReveal>
      )}

      {data && data.total_pages > 1 && (
        <div className="flex justify-center gap-2 mt-8">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-4 py-2 rounded-lg bg-bg-secundario text-texto-secundario disabled:opacity-50"
          >
            Anterior
          </button>
          <span className="px-4 py-2 text-texto-secundario">
            {data.page} / {data.total_pages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(data.total_pages, p + 1))}
            disabled={page === data.total_pages}
            className="px-4 py-2 rounded-lg bg-bg-secundario text-texto-secundario disabled:opacity-50"
          >
            Siguiente
          </button>
        </div>
      )}
    </div>
  );
}