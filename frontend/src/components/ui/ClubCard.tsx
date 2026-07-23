"use client";

import Image from "next/image";
import type { Club } from "@/types";
import { useRouter } from "next/navigation";

export default function ClubCard({ club }: { club: Club }) {
  const router = useRouter();
  const totalInt = (club.titulos_internacionales || []).reduce(
    (s, t) => s + t.cantidad,
    0
  );

  return (
    <div
      className="carta-club group cursor-pointer"
      onClick={() => router.push(`/clubes/${club.id}`)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          router.push(`/clubes/${club.id}`);
        }
      }}
    >
      <div className="carta-club-inner">
        {/* FRENTE */}
        <div className="carta-club-cara">
          {club.escudo && (
            <Image
              src={club.escudo}
              alt={club.nombre}
              width={80}
              height={80}
              loading="lazy"
              className="w-20 h-20 object-contain mb-3 drop-shadow-lg"
            />
          )}
          <h3 className="text-xl font-bold text-center leading-tight">
            {club.nombre}
          </h3>
          {club.apodo && (
            <p className="text-xs text-texto-secundario uppercase tracking-widest mt-1">
              “{club.apodo}”
            </p>
          )}
          <div className="flex items-center gap-2 mt-3">
            {(club.colores || []).map((c, i) => (
              <span
                key={i}
                className="w-4 h-4 rounded-full border border-white/20"
                style={{ backgroundColor: c }}
                title={c}
              />
            ))}
          </div>
          <p className="text-xs text-texto-apagado mt-2">{club.ciudad}</p>
          <span className="mt-3 text-xs text-apf-rojo font-semibold uppercase tracking-wider opacity-0 group-hover:opacity-100 transition-opacity">
            Ver más →
          </span>
        </div>

        {/* DORSO */}
        <div className="carta-club-cara carta-club-dorso">
          <h4>Datos del club</h4>
          <dl className="space-y-2 w-full">
            <div className="flex justify-between">
              <dt className="text-texto-apagado text-xs">Estadio</dt>
              <dd className="text-texto-principal text-xs text-right max-w-[60%]">
                {club.estadio}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-texto-apagado text-xs">Capacidad</dt>
              <dd className="text-texto-principal text-xs">
                {club.capacidad.toLocaleString()}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-texto-apagado text-xs">Fundación</dt>
              <dd className="text-texto-principal text-xs">{club.fundacion}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-texto-apagado text-xs">Títulos</dt>
              <dd className="text-texto-principal text-xs">
                {club.titulos_liga} nac · {totalInt} int
              </dd>
            </div>
          </dl>
          {club.descripcion && (
            <p className="text-texto-secundario text-xs mt-3 leading-relaxed line-clamp-3">
              {club.descripcion}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
