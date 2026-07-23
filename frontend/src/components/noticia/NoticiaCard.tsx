"use client";

import Link from "next/link";
import { Clock } from "lucide-react";
import type { Noticia } from "@/types";
import { htmlToText } from "@/lib/html";
import SmartImage from "@/components/ui/SmartImage";
import { getFallbackImage, calcularTiempoLectura, detectarCategoria } from "./fallbackImages";

function formatearFecha(iso: string): string {
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

function FuenteBadge({ fuente }: { fuente: string }) {
  const colors: Record<string, string> = {
    editorial: "bg-apf-rojo text-white",
    "ABC Color Deportes": "bg-blue-700 text-white",
    "ABC Color Futbol": "bg-blue-600 text-white",
    "ABC Color": "bg-blue-600 text-white",
    APF: "bg-green-600 text-white",
    "Noticias CDE": "bg-indigo-600 text-white",
    "ESPN Paraguay": "bg-red-500 text-white",
    Telefuturo: "bg-purple-600 text-white",
  };
  return (
    <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${colors[fuente] || "bg-gray-600 text-white"}`}>
      {fuente}
    </span>
  );
}

interface NoticiaCardProps {
  noticia: Noticia;
  variant?: "featured" | "normal" | "compact";
  priority?: boolean;
}

export default function NoticiaCard({ noticia, variant = "normal", priority = false }: NoticiaCardProps) {
  const isFeatured = variant === "featured";
  const isCompact = variant === "compact";
  const fallbackSrc = getFallbackImage(noticia.origen, noticia.titulo);
  const imagenSrc = noticia.imagen_url || fallbackSrc;
  const minutos = calcularTiempoLectura(noticia.resumen || noticia.contenido);
  const categoria = detectarCategoria(noticia.titulo);

  return (
    <Link
      href={`/noticias/${noticia.id}`}
      className={`group block rounded-xl border border-white/[0.06] bg-bg-secundario overflow-hidden transition-all duration-300 hover:border-apf-rojo/30 hover:shadow-[0_8px_32px_rgba(204,0,28,0.1)] ${
        isFeatured ? "md:col-span-2 md:row-span-2" : ""
      }`}
    >
      {/* Image zone — fixed height, clean container */}
      <div className={`relative overflow-hidden ${isFeatured ? "h-56 md:h-64" : isCompact ? "h-36" : "h-44"}`}>
        <SmartImage
          src={imagenSrc}
          alt={noticia.titulo}
          fill
          sizes={isFeatured ? "(max-width: 768px) 100vw, 66vw" : "(max-width: 768px) 100vw, 33vw"}
          priority={priority}
          className="object-cover transition-transform duration-500 ease-out group-hover:scale-[1.03]"
          fallback={
            <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-bg-terciario to-bg-secundario">
              <div className="flex flex-col items-center gap-2">
                <div className="w-12 h-12 rounded-full bg-white/[0.04] flex items-center justify-center">
                  <svg className="w-6 h-6 text-apf-rojo/25" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                  </svg>
                </div>
                <span className="text-[10px] text-texto-apagado/50 uppercase tracking-wider">Sin imagen</span>
              </div>
            </div>
          }
        />

        {/* Persistent overlay — badges always readable on any image */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-transparent pointer-events-none" />

        {/* Bottom fade — smooth transition to text body */}
        <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-bg-secundario to-transparent pointer-events-none" />

        {/* Category badge — top-left */}
        {categoria && (
          <span className={`absolute top-3 left-3 text-[11px] px-2.5 py-1 rounded-md font-medium shadow-sm ${categoria.color}`}>
            {categoria.label}
          </span>
        )}

        {/* Video play button */}
        {noticia.video_url && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
            <div className="w-14 h-14 rounded-full bg-white/90 flex items-center justify-center shadow-lg">
              <svg className="w-6 h-6 text-apf-rojo ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
            </div>
          </div>
        )}
      </div>

      {/* Text body — clean, independent from image */}
      <div className={`${isFeatured ? "p-5 md:p-6" : isCompact ? "p-3" : "p-4"}`}>
        <div className="flex items-center gap-2 mb-2">
          <FuenteBadge fuente={noticia.fuente} />
          <span className="text-[11px] text-texto-apagado">{formatearFecha(noticia.pub_date)}</span>
          {!isCompact && (
            <span className="flex items-center gap-1 text-[11px] text-texto-apagado ml-auto">
              <Clock className="w-3 h-3" />
              {minutos} min
            </span>
          )}
        </div>
        <h3 className={`font-bold text-texto-principal group-hover:text-apf-rojo transition-colors duration-200 leading-snug ${
          isFeatured ? "text-lg md:text-xl" : isCompact ? "text-sm" : "text-[15px]"
        }`}>
          {noticia.titulo}
        </h3>
        {noticia.resumen && !isCompact && (
          <p className="text-texto-secundario text-sm mt-2 line-clamp-2 leading-relaxed">{htmlToText(noticia.resumen)}</p>
        )}
      </div>
    </Link>
  );
}
