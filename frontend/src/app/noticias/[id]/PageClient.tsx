"use client";

import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Clock, Calendar } from "lucide-react";
import { getNoticia } from "@/lib/api";
import { htmlToText, sanitizeHtml } from "@/lib/html";
import SmartImage from "@/components/ui/SmartImage";
import NoticiasRelacionadas from "@/components/noticia/NoticiasRelacionadas";
import { getFallbackImage, calcularTiempoLectura, detectarCategoria } from "@/components/noticia/fallbackImages";
import { NoticiaDetalleSkeleton } from "@/components/noticia/NoticiaSkeleton";

function formatearFechaCompleta(iso: string): string {
  return new Date(iso).toLocaleDateString("es-PY", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export default function NoticiaDetallePage() {
  const params = useParams();
  const id = params.id as string;
  const [scrollY, setScrollY] = useState(0);

  const { data: noticia, isLoading, error } = useQuery({
    queryKey: ["noticia", id],
    queryFn: () => getNoticia(id),
    staleTime: 10 * 60 * 1000,
  });

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  if (isLoading) return <NoticiaDetalleSkeleton />;

  if (error || !noticia) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center px-4">
        <p className="text-texto-apagado text-lg mb-4">Noticia no encontrada</p>
        <Link href="/noticias" className="text-apf-rojo hover:underline">
          Volver a noticias
        </Link>
      </div>
    );
  }

  const fallbackSrc = getFallbackImage(noticia.origen, noticia.titulo);
  const imagenSrc = noticia.imagen_url || fallbackSrc;
  const minutos = calcularTiempoLectura(noticia.resumen || noticia.contenido);
  const categoria = detectarCategoria(noticia.titulo);
  const parallaxOffset = Math.min(scrollY * 0.4, 200);

  return (
    <article>
      {/* Hero full-width */}
      <div className="relative w-full h-[70vh] overflow-hidden">
        <div
          className="absolute inset-0"
          style={{ transform: `translateY(${parallaxOffset}px)` }}
        >
          <SmartImage
            src={imagenSrc}
            alt={noticia.titulo}
            fill
            sizes="100vw"
            priority
            className="object-cover"
            fallback={
              <div className="absolute inset-0 bg-gradient-to-br from-apf-azul/10 via-bg-primario to-apf-rojo/10" />
            }
          />
        </div>

        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/30 to-transparent" />

        <div className="absolute inset-x-0 bottom-0 px-4 pb-12 pt-32 max-w-4xl mx-auto">
          <Link
            href="/noticias"
            className="inline-flex items-center gap-1.5 text-white/70 hover:text-white text-sm mb-6 transition-colors duration-200"
          >
            <ArrowLeft className="w-4 h-4" />
            Volver a noticias
          </Link>

          <div className="flex flex-wrap items-center gap-3 mb-4">
            <span className="text-xs px-3 py-1 rounded-full bg-bg-secundario/80 backdrop-blur-sm border border-white/10 text-white font-medium">
              {noticia.fuente}
            </span>
            {categoria && (
              <span className={`text-xs px-3 py-1 rounded-full font-medium backdrop-blur-sm ${categoria.color}`}>
                {categoria.label}
              </span>
            )}
          </div>

          <h1 className="font-Barlow font-extrabold text-4xl md:text-5xl text-white leading-[1.1] mb-4">
            {noticia.titulo}
          </h1>

          <div className="flex flex-wrap items-center gap-4 text-sm text-white/60">
            <span className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5" />
              {formatearFechaCompleta(noticia.pub_date)}
            </span>
            <span className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" />
              {minutos} min de lectura
            </span>
            {noticia.origen === "rss" && noticia.url_original && (
              <a
                href={noticia.url_original}
                target="_blank"
                rel="noopener noreferrer"
                className="text-apf-rojo hover:text-white transition-colors duration-200 ml-auto"
              >
                Ver fuente original
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="max-w-3xl mx-auto px-4 py-12 space-y-10">
        {noticia.video_url && (
          <div className="aspect-video rounded-xl overflow-hidden border border-white/[0.06]">
            <iframe
              src={noticia.video_url.replace("watch?v=", "embed/")}
              className="w-full h-full"
              allowFullScreen
            />
          </div>
        )}

        {noticia.contenido ? (
          <div
            className="prose prose-invert prose-lg max-w-none text-texto-principal leading-[1.8]
              prose-headings:text-texto-principal prose-headings:font-bold
              prose-h2:text-2xl prose-h2:mt-10 prose-h2:mb-4
              prose-h3:text-xl prose-h3:mt-8 prose-h3:mb-3
              prose-p:text-texto-secundario prose-p:text-[17px]
              prose-a:text-apf-rojo prose-a:no-underline hover:prose-a:underline
              prose-strong:text-texto-principal
              prose-blockquote:border-l-apf-rojo prose-blockquote:text-texto-apagado"
            dangerouslySetInnerHTML={{ __html: sanitizeHtml(noticia.contenido) }}
          />
        ) : noticia.resumen ? (
          <p className="text-texto-secundario text-[17px] leading-[1.8]">
            {htmlToText(noticia.resumen)}
          </p>
        ) : null}

        {/* Related articles */}
        {noticia.fuente && (
          <div className="pt-8 border-t border-borde-sutil">
            <NoticiasRelacionadas fuente={noticia.fuente} excludeId={noticia.id} />
          </div>
        )}
      </div>
    </article>
  );
}
