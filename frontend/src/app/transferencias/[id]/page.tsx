import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import Image from "next/image";
import Link from "next/link";
import { apiFetch } from "@/lib/api";
import type { Transferencia } from "@/types";
import TipoBadge from "@/components/transferencia/TipoBadge";
import VerificationBadge from "@/components/transferencia/VerificationBadge";
import { EstadoTransferencia } from "@/types"; // Import EstadoTransferencia type

const PLACEHOLDER = "/placeholder-escudo.png";

// Helper to map backend estado to readable labels for the page
const ESTADO_LABELS: Record<EstadoTransferencia, string> = {
  confirmada: "Confirmada",
  rumor: "Rumor",
  oficial: "Oficial",
  desmentida: "Desmentida",
};

export default function TransferenciaDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;

  const { data: transferencia, isLoading } = useQuery<Transferencia>({
    queryKey: ["transferencias", id],
    queryFn: () => apiFetch(`/api/v1/transferencias/${id}`),
    enabled: !!id, // Only run query if id is available
  });

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <p className="text-texto-principal animate-pulse">Cargando detalles...</p>
      </div>
    );
  }

  if (!transferencia) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <p className="text-apf-rojo">Transferencia no encontrada.</p>
      </div>
    );
  }

  const formattedFecha = new Date(transferencia.fecha).toLocaleDateString("es-PY", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const montoDisplay = transferencia.monto
    ? `$${transferencia.monto}M`
    : "N/D";

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <TipoBadge tipo={transferencia.tipo} />
          <VerificationBadge level={transferencia.verification_level} />
        </div>
        <p className="text-sm text-texto-secundario">{formattedFecha}</p>
      </div>

      <div className="bg-bg-secundario border border-borde-sutil rounded-xl p-6 mb-6">
        <div className="text-center mb-6">
          <p className="text-texto-principal font-bold text-3xl mb-2">
            {transferencia.jugador_nombre}
          </p>
          {transferencia.jugador_posicion && (
            <p className="text-texto-secundario text-lg">
              {transferencia.jugador_posicion}
            </p>
          )}
        </div>

        <div className="flex items-center justify-center gap-6 mb-6">
          {/* Origen Club */}
          <div className="flex flex-col items-center">
            <div className="w-20 h-20 rounded-full bg-bg-noche flex items-center justify-center overflow-hidden border-2 border-borde-sutil shadow-lg">
              {transferencia.club_origen_escudo ? (
                <Image
                  src={transferencia.club_origen_escudo}
                  alt={transferencia.club_origen_nombre || "Club Origen"}
                  width={60}
                  height={60}
                  className="object-contain"
                />
              ) : (
                <Image
                  src={PLACEHOLDER}
                  alt="Placeholder Escudo"
                  width={60}
                  height={60}
                  className="object-contain opacity-50"
                />
              )}
            </div>
            <p className="text-texto-secundario text-sm mt-2 max-w-[120px] truncate">
              {transferencia.club_origen_nombre || "Libre"}
            </p>
          </div>

          {/* Arrow */}
          <svg
            className="w-10 h-10 text-apf-rojo flex-shrink-0"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 7l5 5m0 0l-5 5m5-5H6"
            />
          </svg>

          {/* Destino Club */}
          <div className="flex flex-col items-center">
            <div className="w-20 h-20 rounded-full bg-bg-noche flex items-center justify-center overflow-hidden border-2 border-borde-sutil shadow-lg">
              {transferencia.club_destino_escudo ? (
                <Image
                  src={transferencia.club_destino_escudo}
                  alt={transferencia.club_destino_nombre || 'Club Destino'}
                  width={60}
                  height={60}
                  className="object-contain"
                />
              ) : (
                <Image
                  src={PLACEHOLDER}
                  alt="Placeholder Escudo"
                  width={60}
                  height={60}
                  className="object-contain opacity-50"
                />
              )}
            </div>
            <p className="text-texto-secundario text-sm mt-2 max-w-[120px] truncate">
              {transferencia.club_destino_nombre}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <span className="font-medium text-texto-principal">Monto:</span>{" "}
            <span className="text-texto-secundario">{montoDisplay}</span>
          </div>
          <div>
            <span className="font-medium text-texto-principal">Duración:</span>{" "}
            <span className="text-texto-secundario">
              {transferencia.duracion_meses ? `${transferencia.duracion_meses} meses` : "N/D"}
            </span>
          </div>
           <div>
            <span className="font-medium text-texto-principal">Estado:</span>{" "}
            <span className="text-texto-secundario">
              {ESTADO_LABELS[transferencia.estado as keyof typeof ESTADO_LABELS] || transferencia.estado}
            </span>
          </div>
        </div>
      </div>

      {transferencia.fuente_url && (
        <div className="mt-6 text-center">
          <Link
            href={transferencia.fuente_url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-apf-rojo hover:underline text-sm flex items-center justify-center gap-1"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 60l-3-3m0 0l3-3m-3 3h15a2 2 0 012 2v15a2 2 0 01-2 2H3a2 2 0 01-2-2v-15a2 2 0 012-2h15z"
              />
            </svg>
            Fuente: {transferencia.fuente_nombre || transferencia.fuente_url}
          </Link>
        </div>
      )}

       <div className="mt-8 text-center">
        <Link
          href="/transferencias"
          className="text-texto-principal hover:text-apf-rojo font-semibold transition-colors duration-300 flex items-center justify-center gap-1"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            className="w-5 h-5"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9 15L3 9m0 0l6-6M3 9h12M6 18h12a2 2 0 002-2v-15a2 2 0 00-2-2H6a2 2 0 00-2 2v15a2 2 0 002 2z"
            />
          </svg>
          Volver al Listado
        </Link>
      </div>
    </div>
  );
}
