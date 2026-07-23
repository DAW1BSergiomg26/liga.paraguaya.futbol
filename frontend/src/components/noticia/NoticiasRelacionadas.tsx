"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { Newspaper } from "lucide-react";
import { getNoticiasRelacionadas } from "@/lib/api";
import type { Noticia } from "@/types";
import SmartImage from "@/components/ui/SmartImage";
import { getFallbackImage, calcularTiempoLectura } from "./fallbackImages";
import { NoticiaRelacionadasSkeleton } from "./NoticiaSkeleton";

function MiniCard({ noticia }: { noticia: Noticia }) {
  const fallbackSrc = getFallbackImage(noticia.origen, noticia.titulo);
  const imagenSrc = noticia.imagen_url || fallbackSrc;
  const minutos = calcularTiempoLectura(noticia.resumen || noticia.contenido);

  return (
    <Link
      href={`/noticias/${noticia.id}`}
      className="group flex gap-3 p-3 rounded-xl border border-white/[0.06] bg-bg-secundario hover:border-apf-rojo/30 hover:bg-white/[0.03] transition-all duration-300"
    >
      <div className="relative w-24 h-20 shrink-0 rounded-lg overflow-hidden">
        <SmartImage
          src={imagenSrc}
          alt={noticia.titulo}
          fill
          sizes="96px"
          className="object-cover transition-transform duration-500 group-hover:scale-105"
          fallback={
            <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-bg-terciario to-bg-secundario">
              <Newspaper className="w-5 h-5 text-apf-rojo/20" />
            </div>
          }
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/20 to-transparent pointer-events-none" />
      </div>
      <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
        <h4 className="text-sm font-semibold text-texto-principal group-hover:text-apf-rojo transition-colors duration-200 line-clamp-2 leading-tight">
          {noticia.titulo}
        </h4>
        <div className="flex items-center gap-2 text-[11px] text-texto-apagado">
          <span>{minutos} min</span>
          <span>{new Date(noticia.pub_date).toLocaleDateString("es-PY", { day: "numeric", month: "short" })}</span>
        </div>
      </div>
    </Link>
  );
}

interface NoticiasRelacionadasProps {
  fuente: string;
  excludeId: string;
}

export default function NoticiasRelacionadas({ fuente, excludeId }: NoticiasRelacionadasProps) {
  const { data, isLoading } = useQuery({
    queryKey: ["noticias-relacionadas", fuente, excludeId],
    queryFn: () => getNoticiasRelacionadas(fuente, excludeId, 3),
    staleTime: 5 * 60 * 1000,
  });

  if (isLoading) return <NoticiaRelacionadasSkeleton />;

  const relacionadas = data?.noticias.filter((n) => n.id !== excludeId).slice(0, 3) ?? [];
  if (relacionadas.length === 0) return null;

  return (
    <div>
      <h3 className="text-lg font-bold text-texto-principal mb-4 flex items-center gap-2">
        <Newspaper className="w-5 h-5 text-apf-rojo" />
        Noticias relacionadas
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {relacionadas.map((noticia) => (
          <MiniCard key={noticia.id} noticia={noticia} />
        ))}
      </div>
    </div>
  );
}
