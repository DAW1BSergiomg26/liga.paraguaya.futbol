"use client";

import { useQuery } from "@tanstack/react-query";
import { getNoticias } from "@/lib/api";

function formatearFecha(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  const ahora = new Date();
  const diffMs = ahora.getTime() - d.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return "Ahora";
  if (diffMin < 60) return `Hace ${diffMin}m`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `Hace ${diffHr}h`;
  const diffDias = Math.floor(diffHr / 24);
  if (diffDias < 7) return `Hace ${diffDias}d`;
  return d.toLocaleDateString("es-PY", { day: "numeric", month: "short" });
}

export default function FeedNoticias() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["noticias"],
    queryFn: getNoticias,
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });

  if (isLoading) {
    return (
      <div className="bg-bg-secundario rounded-xl border border-borde-sutil p-4">
        <h3 className="font-barlow text-lg font-semibold uppercase tracking-wide text-texto-principal mb-3">
          Noticias
        </h3>
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="animate-pulse space-y-1.5">
              <div className="h-3 bg-texto-principal/5 rounded w-full" />
              <div className="h-2 bg-texto-principal/5 rounded w-2/3" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-bg-secundario rounded-xl border border-borde-sutil p-4">
        <h3 className="font-barlow text-lg font-semibold uppercase tracking-wide text-texto-principal mb-3">
          Noticias
        </h3>
        <p className="text-texto-apagado text-sm">No hay noticias disponibles</p>
      </div>
    );
  }

  const noticias = data?.noticias ?? [];

  if (noticias.length === 0) {
    return (
      <div className="bg-bg-secundario rounded-xl border border-borde-sutil p-4">
        <h3 className="font-barlow text-lg font-semibold uppercase tracking-wide text-texto-principal mb-3">
          Noticias
        </h3>
        <p className="text-texto-apagado text-sm">No hay noticias disponibles</p>
      </div>
    );
  }

  return (
    <div className="bg-bg-secundario rounded-xl border border-borde-sutil p-4">
      <h3 className="font-barlow text-lg font-semibold uppercase tracking-wide text-texto-principal mb-3">
        Noticias
      </h3>
      <div className="space-y-4">
        {noticias.map((n, i) => (
          <a
            key={i}
            href={n.url}
            target="_blank"
            rel="noopener noreferrer"
            className="block border-l-2 border-py-rojo pl-3 hover:border-py-rojo/70 transition-colors group"
          >
            <p className="text-sm text-texto-principal group-hover:text-py-rojo transition-colors leading-snug">
              {n.titulo}
            </p>
            <p className="text-xs text-texto-secundario mt-1">
              {n.fuente}
              {n.pub_date ? ` · ${formatearFecha(n.pub_date)}` : ""}
            </p>
          </a>
        ))}
      </div>
    </div>
  );
}
