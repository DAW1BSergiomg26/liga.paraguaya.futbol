"use client";

import Image from "next/image";
import Link from "next/link";
import type { Noticia } from "@/types";

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

function FuenteBadge({ fuente, origen }: { fuente: string; origen: string }) {
  const colors: Record<string, string> = {
    editorial: "bg-apf-rojo text-white",
    "ABC Color Deportes": "bg-blue-700 text-white",
    "ABC Color Fútbol": "bg-blue-600 text-white",
    "ABC Color": "bg-blue-600 text-white",
    APF: "bg-green-600 text-white",
    "Noticias CDE": "bg-indigo-600 text-white",
    "ESPN Paraguay": "bg-red-500 text-white",
    Telefuturo: "bg-purple-600 text-white",
  };
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${colors[fuente] || "bg-gray-600 text-white"}`}>
      {fuente}
    </span>
  );
}

interface NoticiaCardProps {
  noticia: Noticia;
  variant?: "featured" | "normal" | "compact";
}

export default function NoticiaCard({ noticia, variant = "normal" }: NoticiaCardProps) {
  const isFeatured = variant === "featured";
  const isCompact = variant === "compact";

  return (
    <Link
      href={`/noticias/${noticia.id}`}
      className={`block rounded-xl border border-borde-sutil overflow-hidden transition-all hover:border-apf-rojo/50 hover:shadow-lg group ${
        isFeatured ? "col-span-2 row-span-2" : ""
      }`}
    >
      {noticia.imagen_url ? (
        <div className={`relative overflow-hidden ${isFeatured ? "h-64" : isCompact ? "h-32" : "h-48"}`}>
          <Image
            src={noticia.imagen_url}
            alt={noticia.titulo}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
          />
          {noticia.video_url && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/30">
              <div className="w-12 h-12 rounded-full bg-white/90 flex items-center justify-center">
                <svg className="w-5 h-5 text-apf-rojo ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className={`flex items-center justify-center bg-gradient-to-br from-apf-azul/20 to-apf-rojo/20 ${isFeatured ? "h-64" : isCompact ? "h-32" : "h-48"}`}>
          <svg className={`text-apf-rojo/40 ${isFeatured ? "w-16 h-16" : "w-10 h-10"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
          </svg>
        </div>
      )}
      <div className={`bg-bg-secundario ${isFeatured ? "p-6" : "p-4"}`}>
        <div className="flex items-center gap-2 mb-2">
          <FuenteBadge fuente={noticia.fuente} origen={noticia.origen} />
          <span className="text-xs text-texto-apagado">{formatearFecha(noticia.pub_date)}</span>
        </div>
        <h3 className={`font-bold text-texto-principal group-hover:text-apf-rojo transition-colors ${
          isFeatured ? "text-xl" : "text-sm"
        }`}>
          {noticia.titulo}
        </h3>
        {noticia.resumen && !isCompact && (
          <p className="text-texto-secundario text-sm mt-2 line-clamp-2">{noticia.resumen}</p>
        )}
      </div>
    </Link>
  );
}
