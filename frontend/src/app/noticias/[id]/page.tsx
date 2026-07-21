import type { Metadata } from "next";
import NoticiaDetallePageClient from "./PageClient";
import { getNoticia } from "@/lib/api";
import { SITE_NAME } from "@/lib/config";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  try {
    const noticia = await getNoticia(id);
    const description = noticia.resumen
      ? noticia.resumen.slice(0, 160)
      : `${noticia.titulo} — ${noticia.fuente}. ${SITE_NAME}.`;
    return {
      title: `${noticia.titulo} — ${SITE_NAME}`,
      description,
      openGraph: {
        title: `${noticia.titulo} | Liga PY`,
        description,
        type: "article",
        publishedTime: noticia.pub_date,
        images: noticia.imagen_url ? [{ url: noticia.imagen_url }] : [],
      },
    };
  } catch {
    return { title: "Noticia no encontrada" };
  }
}

export default function NoticiaDetallePage({ params }: Props) {
  return <NoticiaDetallePageClient />;
}
