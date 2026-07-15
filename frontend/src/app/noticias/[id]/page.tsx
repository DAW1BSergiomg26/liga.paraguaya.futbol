"use client";

import { useQuery } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { getNoticia } from "@/lib/api";
import { htmlToText, sanitizeHtml } from "@/lib/html";

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

  const { data: noticia, isLoading, error } = useQuery({
    queryKey: ["noticia", id],
    queryFn: () => getNoticia(id),
    staleTime: 10 * 60 * 1000,
  });

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 animate-pulse space-y-6">
        <div className="h-8 bg-texto-principal/5 rounded w-2/3" />
        <div className="h-64 bg-texto-principal/5 rounded-xl" />
        <div className="space-y-2">
          <div className="h-4 bg-texto-principal/5 rounded w-full" />
          <div className="h-4 bg-texto-principal/5 rounded w-5/6" />
        </div>
      </div>
    );
  }

  if (error || !noticia) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 text-center">
        <p className="text-texto-apagado text-lg">Noticia no encontrada</p>
        <Link href="/noticias" className="text-apf-rojo hover:underline mt-4 inline-block">
          Volver a noticias
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <Link href="/noticias" className="text-apf-rojo hover:underline text-sm mb-6 inline-block">
        ← Volver a noticias
      </Link>

      <h1 className="text-3xl font-bold text-texto-principal mb-4">{noticia.titulo}</h1>

      <div className="flex items-center gap-3 mb-6 text-sm text-texto-secundario">
        <span className="bg-bg-terciario px-3 py-1 rounded-full">{noticia.fuente}</span>
        <span>{formatearFechaCompleta(noticia.pub_date)}</span>
        {noticia.origen === "rss" && noticia.url_original && (
          <a href={noticia.url_original} target="_blank" rel="noopener noreferrer" className="text-apf-rojo hover:underline">
            Ver original →
          </a>
        )}
      </div>

      {noticia.imagen_url && (
        <div className="relative h-80 rounded-xl overflow-hidden mb-8">
          <Image src={noticia.imagen_url} alt={noticia.titulo} fill className="object-cover" />
        </div>
      )}

      {noticia.video_url && (
        <div className="aspect-video rounded-xl overflow-hidden mb-8">
          <iframe
            src={noticia.video_url.replace("watch?v=", "embed/")}
            className="w-full h-full"
            allowFullScreen
          />
        </div>
      )}

      {noticia.contenido && (
        <div
          className="prose prose-invert max-w-none text-texto-principal text-lg leading-relaxed"
          dangerouslySetInnerHTML={{ __html: sanitizeHtml(noticia.contenido) }}
        />
      )}

      {noticia.resumen && !noticia.contenido && (
        <p className="text-texto-principal text-lg leading-relaxed">{htmlToText(noticia.resumen)}</p>
      )}
    </div>
  );
}
