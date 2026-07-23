"use client";

import type { Noticia } from "@/types";
import NoticiaCard from "./NoticiaCard";
import ScrollReveal from "@/components/ui/ScrollReveal";

interface NoticiaGridProps {
  noticias: Noticia[];
}

export default function NoticiaGrid({ noticias }: NoticiaGridProps) {
  if (noticias.length === 0) {
    return (
      <div className="text-center py-16">
        <p className="text-texto-apagado text-lg">No hay noticias disponibles</p>
      </div>
    );
  }

  return (
    <ScrollReveal variant="from-bottom" stagger={0.06}>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {noticias.map((noticia, i) => (
          <NoticiaCard
            key={noticia.id}
            noticia={noticia}
            variant={i === 0 ? "featured" : i < 5 ? "normal" : "compact"}
            priority={i < 3}
          />
        ))}
      </div>
    </ScrollReveal>
  );
}
