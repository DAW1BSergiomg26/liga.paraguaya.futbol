"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getNoticias } from "@/lib/api";
import PageHeader from "@/components/ui/PageHeader";
import NoticiaGrid from "@/components/noticia/NoticiaGrid";
import FiltrosNoticias from "@/components/noticia/FiltrosNoticias";

export default function NoticiasPage() {
  const [page, setPage] = useState(1);
  const [filtro, setFiltro] = useState("");
  const [busqueda, setBusqueda] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["noticias", page, filtro, busqueda],
    queryFn: () => getNoticias({ page, limit: 12, fuente: filtro || undefined, search: busqueda || undefined }),
    staleTime: 5 * 60 * 1000,
  });

  return (
    <div className="max-w-6xl mx-auto px-4 py-12">
      <PageHeader
        titulo="Noticias"
        subtitulo="Últimas noticias del fútbol paraguayo"
      />
      <FiltrosNoticias
        filtro={filtro}
        onFiltroChange={(f) => { setFiltro(f); setPage(1); }}
        busqueda={busqueda}
        onBusquedaChange={(b) => { setBusqueda(b); setPage(1); }}
      />
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="animate-pulse rounded-xl border border-borde-sutil overflow-hidden">
              <div className="h-48 bg-texto-principal/5" />
              <div className="p-4 space-y-2">
                <div className="h-3 bg-texto-principal/5 rounded w-1/3" />
                <div className="h-4 bg-texto-principal/5 rounded w-full" />
                <div className="h-3 bg-texto-principal/5 rounded w-2/3" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <>
          <NoticiaGrid noticias={data?.noticias ?? []} />
          {data && data.total_pages > 1 && (
            <div className="flex justify-center gap-4 mt-10">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-4 py-2 rounded-lg bg-bg-terciario border border-borde-sutil text-texto-secundario hover:text-white disabled:opacity-40 transition"
              >
                ← Anterior
              </button>
              <span className="px-4 py-2 text-texto-secundario text-sm">
                Página {data.page} de {data.total_pages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(data.total_pages, p + 1))}
                disabled={page === data.total_pages}
                className="px-4 py-2 rounded-lg bg-bg-terciario border border-borde-sutil text-texto-secundario hover:text-white disabled:opacity-40 transition"
              >
                Siguiente →
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
