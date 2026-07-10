"use client";

import { useQuery } from "@tanstack/react-query";
import { getClubes } from "@/lib/api";
import type { Club } from "@/types";
import Link from "next/link";
import { CardSkeleton } from "@/components/ui/Skeleton";
import ErrorMessage from "@/components/ui/ErrorMessage";
import Sidebar from "@/components/sidebar/Sidebar";

export default function ClubesPage() {
  const { data: clubes, isLoading, error } = useQuery<Club[]>({
    queryKey: ["clubes"],
    queryFn: () => getClubes(),
    staleTime: 60_000,
  });

  if (isLoading) return <CardSkeleton count={6} />;

  if (error) return <ErrorMessage message="Error al cargar los clubes" />;

  if (!clubes || clubes.length === 0) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="lg:grid lg:grid-cols-[1fr_320px] lg:gap-8">
          <div>
            <h1 className="text-3xl font-bold mb-8">Club de la Liga Paraguaya</h1>
            <div className="text-center py-16 text-texto-secundario">
              <p>No hay clubes registrados actualmente.</p>
            </div>
          </div>
          <div className="mt-8 lg:mt-0">
            <Sidebar />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-12">
      <div className="lg:grid lg:grid-cols-[1fr_320px] lg:gap-8">
        <div>
          <h1 className="text-3xl font-bold mb-8">Club de la Liga Paraguaya</h1>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {clubes.map((club) => (
              <Link
                key={club.id}
                href={`/clubes/${club.id}`}
                className="p-6 rounded-xl border border-borde-sutil bg-bg-secundario/60 hover:bg-bg-secundario transition block"
              >
                <div className="flex items-center gap-4 mb-3">
                  {club.escudo && (
                    <img src={club.escudo} alt={club.nombre} loading="lazy" className="w-12 h-12 object-contain" />
                  )}
                  <h2 className="text-xl font-bold">{club.nombre}</h2>
                </div>
                <div className="space-y-2 text-sm text-texto-secundario">
                  <p><span className="text-texto-apagado">Ciudad:</span> {club.ciudad}</p>
                  <p><span className="text-texto-apagado">Apodo:</span> {club.apodo}</p>
                  <p><span className="text-texto-apagado">Estadio:</span> {club.estadio}</p>
                  <p><span className="text-texto-apagado">Capacidad:</span> {club.capacidad.toLocaleString()} espectadores</p>
                  <p><span className="text-texto-apagado">Fundación:</span> {club.fundacion}</p>
                  <div className="flex items-center gap-2 pt-2">
                    <span className="text-texto-apagado">Colores:</span>
                    {(club.colores || []).map((color, i) => (
                      <span
                        key={i}
                        className="w-5 h-5 rounded-full border border-white/20 inline-block"
                        style={{ backgroundColor: color }}
                        title={color}
                      />
                    ))}
                  </div>
                  <div className="flex items-center gap-3 pt-2 border-t border-white/5">
                    <span className="text-sm text-texto-apagado">🏆 {club.titulos_liga} nacionales</span>
                    {club.titulos_internacionales?.length > 0 && (
                      <span className="text-sm text-yellow-400 font-medium">
                        🌍 {club.titulos_internacionales.reduce((s, t) => s + t.cantidad, 0)} internacionales
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
        <div className="mt-8 lg:mt-0">
          <Sidebar />
        </div>
      </div>
    </div>
  );
}
