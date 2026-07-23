"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getNoticias } from "@/lib/api";
import PageHeader from "@/components/ui/PageHeader";
import NoticiaGrid from "@/components/noticia/NoticiaGrid";
import FiltrosNoticias from "@/components/noticia/FiltrosNoticias";
import { NoticiaSkeletonGrid } from "@/components/noticia/NoticiaSkeleton";

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
        <NoticiaSkeletonGrid count={6} />
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
                Anterior
              </button>
              <span className="px-4 py-2 text-texto-secundario text-sm">
                Pagina {data.page} de {data.total_pages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(data.total_pages, p + 1))}
                disabled={page === data.total_pages}
                className="px-4 py-2 rounded-lg bg-bg-terciario border border-borde-sutil text-texto-secundario hover:text-white disabled:opacity-40 transition"
              >
                Siguiente
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
