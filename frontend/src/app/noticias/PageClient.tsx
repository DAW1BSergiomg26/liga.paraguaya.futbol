"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getNoticias } from "@/lib/api";
import PageHeader from "@/components/ui/PageHeader";
import NoticiaGrid from "@/components/noticia/NoticiaGrid";
import FiltrosNoticias from "@/components/noticia/FiltrosNoticias";
import { NoticiaSkeletonGrid } from "@/components/noticia/NoticiaSkeleton";
import { Newspaper } from "lucide-react";

export default function NoticiasPage() {
  const [page, setPage] = useState(1);
  const [filtro, setFiltro] = useState("");
  const [busqueda, setBusqueda] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["noticias", page, filtro, busqueda],
    queryFn: () => getNoticias({ page, limit: 12, origen: filtro || undefined, search: busqueda || undefined }),
    staleTime: 5 * 60 * 1000,
  });

  const noticias = data?.noticias ?? [];
  const totalResults = data?.total ?? 0;
  const isEmpty = !isLoading && noticias.length === 0;

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
      ) : isEmpty ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 rounded-full bg-white/[0.04] flex items-center justify-center mb-4">
            <Newspaper className="w-8 h-8 text-texto-apagado" />
          </div>
          <h3 className="text-lg font-semibold text-texto-principal mb-2">
            No hay noticias disponibles
          </h3>
          <p className="text-texto-secundario text-sm mb-6 max-w-md">
            {busqueda
              ? `No se encontraron resultados para "${busqueda}". Intenta con otros términos.`
              : filtro === "editorial"
                ? "No hay noticias editoriales en este momento."
                : filtro === "rss"
                  ? "No hay noticias RSS disponibles. El feed puede estar actualizándose."
                  : "No hay noticias para mostrar."}
          </p>
          {(busqueda || filtro) && (
            <button
              onClick={() => { setBusqueda(""); setFiltro(""); setPage(1); }}
              className="px-5 py-2.5 rounded-lg bg-apf-rojo text-white text-sm font-medium hover:bg-apf-rojo/90 transition"
            >
              Ver todas las noticias
            </button>
          )}
        </div>
      ) : (
        <>
          {totalResults > 0 && (
            <p className="text-texto-apagado text-sm mb-4">
              {totalResults} noticia{totalResults !== 1 ? "s" : ""}
              {filtro && (
                <>
                  {" "}en{" "}
                  <span className="text-texto-secundario font-medium">
                    {filtro === "editorial" ? "Editorial" : filtro === "rss" ? "RSS" : filtro}
                  </span>
                </>
              )}
              {busqueda && (
                <>
                  {" "}para{" "}
                  <span className="text-texto-secundario font-medium">"{busqueda}"</span>
                </>
              )}
            </p>
          )}
          <NoticiaGrid noticias={noticias} />
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
