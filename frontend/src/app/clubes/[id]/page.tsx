"use client";

import { useQuery } from "@tanstack/react-query";
import { getClub, getPartidos } from "@/lib/api";
import type { Club, ClubDetail, Partido, PartidoPage } from "@/types";
import { useParams } from "next/navigation";
import Link from "next/link";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import ErrorMessage from "@/components/ui/ErrorMessage";

export default function ClubDetailPage() {
  const params = useParams();
  const id = params.id as string;

  const { data: club, isLoading, error } = useQuery<ClubDetail>({
    queryKey: ["club", id],
    queryFn: () => getClub(id),
  });

  const { data: partidosPage } = useQuery<PartidoPage>({
    queryKey: ["partidos"],
    queryFn: () => getPartidos(),
  });
  const partidos = partidosPage?.data;

  if (isLoading) return <LoadingSpinner text="Cargando club..." />;

  if (error) return <ErrorMessage message="Error al cargar el club" />;

  if (!club) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-12">
        <Link href="/clubes" className="text-sm text-[#76e4f7] hover:underline mb-6 inline-block">
          ← Volver a clubes
        </Link>
        <div className="text-center py-16 text-gray-400">
          <p>Club no encontrado.</p>
        </div>
      </div>
    );
  }

  const clubPartidos = (partidos || []).filter(
    (p) => p.local_id === club.id || p.visitante_id === club.id
  );

  return (
    <div className="max-w-6xl mx-auto px-4 py-12">
      <Link href="/clubes" className="text-sm text-[#76e4f7] hover:underline mb-6 inline-block">
        ← Volver a clubes
      </Link>

      <div className="p-8 rounded-2xl border border-white/10 bg-[#0a1628]/80 shadow-xl">
        <div className="flex items-start gap-6 mb-6">
          {club.escudo && (
            <img src={club.escudo} alt={club.nombre} className="w-20 h-20 object-contain shrink-0" />
          )}
          <div className="flex-1">
            <div className="flex items-center gap-4">
              <h1 className="text-3xl font-bold">{club.nombre}</h1>
              <div className="flex gap-1.5">
                {(club.colores || []).map((color, i) => (
                  <span
                    key={i}
                    className="w-6 h-6 rounded-full border border-white/20 inline-block"
                    style={{ backgroundColor: color }}
                    title={color}
                  />
                ))}
              </div>
            </div>
            <p className="text-gray-400 text-lg mt-1">{club.apodo}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <div>
            <span className="text-gray-500 text-sm block">Ciudad</span>
            <span className="text-white font-medium">{club.ciudad}</span>
          </div>
          <div>
            <span className="text-gray-500 text-sm block">Fundación</span>
            <span className="text-white font-medium">{club.fundacion}</span>
          </div>
          <div>
            <span className="text-gray-500 text-sm block">Estadio</span>
            <span className="text-white font-medium">{club.estadio}</span>
          </div>
          <div>
            <span className="text-gray-500 text-sm block">Capacidad</span>
            <span className="text-white font-medium">{club.capacidad.toLocaleString()} espectadores</span>
          </div>
          <div>
            <span className="text-gray-500 text-sm block">Dirección</span>
            <span className="text-white font-medium">{club.direccion}</span>
          </div>
          <div>
            <span className="text-gray-500 text-sm block">ID</span>
            <span className="text-gray-400 font-mono text-sm">{club.id}</span>
          </div>
        </div>
      </div>

      <section className="mt-10">
        <h2 className="text-2xl font-bold mb-4">Próximos Partidos</h2>
        {clubPartidos.length > 0 ? (
          <div className="grid gap-4">
            {clubPartidos.map((p) => (
              <Link
                key={p.id}
                href={`/partidos/${p.id}`}
                className="p-4 rounded-xl border border-white/10 bg-[#0a1628]/60 hover:bg-[#0a1628] transition block"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-400">
                      {p.torneo} · Jornada {p.jornada}
                    </p>
                    <p className="text-white font-medium mt-1">
                      {p.local_id === club.id ? "Local" : "Visitante"} vs{" "}
                      {p.local_id === club.id ? p.visitante_id : p.local_id}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-500">
                      {new Date(p.fecha).toLocaleDateString("es-PY")}
                    </p>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      p.estado === "finalizado"
                        ? "bg-green-900/30 text-green-300"
                        : "bg-yellow-900/30 text-yellow-300"
                    }`}>
                      {p.estado}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="p-8 rounded-xl border border-white/10 bg-[#0a1628]/60 text-center">
            <p className="text-gray-500">No hay partidos registrados para este club.</p>
          </div>
        )}
      </section>
    </div>
  );
}
