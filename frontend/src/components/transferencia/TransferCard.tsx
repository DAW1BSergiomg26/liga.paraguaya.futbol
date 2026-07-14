"use client";

import Image from "next/image";
import Link from "next/link";
import type { Transferencia } from "@/types";
import VerificationBadge from "./VerificationBadge";
import TipoBadge from "./TipoBadge";

const PLACEHOLDER = "/placeholder-escudo.png";

export default function TransferCard({ transferencia: t }: { transferencia: Transferencia }) {
  return (
    <Link href={`/transferencias/${t.id}`}>
      <div className="group bg-bg-secundario border border-borde-sutil rounded-xl p-4 hover:border-apf-rojo/50 transition-all duration-300 cursor-pointer">
        <div className="flex items-center justify-between mb-3">
          <TipoBadge tipo={t.tipo} />
          <VerificationBadge level={t.verification_level} />
        </div>

        <div className="text-center mb-3">
          <p className="text-texto-principal font-semibold text-lg">{t.jugador_nombre}</p>
          {t.jugador_posicion && (
            <p className="text-texto-secundario text-sm">{t.jugador_posicion}</p>
          )}
        </div>

        <div className="flex items-center justify-center gap-3 mb-3">
          <div className="flex flex-col items-center">
            <div className="w-12 h-12 rounded-full bg-bg-noche flex items-center justify-center overflow-hidden">
              {t.club_origen_escudo ? (
                <Image src={t.club_origen_escudo} alt="" width={40} height={40} className="object-contain" />
              ) : (
                <span className="text-texto-secundario text-xs">?</span>
              )}
            </div>
            <p className="text-texto-secundario text-xs mt-1 max-w-[80px] truncate">{t.club_origen_nombre || "Libre"}</p>
          </div>

          <svg className="w-6 h-6 text-apf-rojo flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
          </svg>

          <div className="flex flex-col items-center">
            <div className="w-12 h-12 rounded-full bg-bg-noche flex items-center justify-center overflow-hidden">
              {t.club_destino_escudo ? (
                <Image src={t.club_destino_escudo} alt="" width={40} height={40} className="object-contain" />
              ) : (
                <span className="text-texto-secundario text-xs">?</span>
              )}
            </div>
            <p className="text-texto-secundario text-xs mt-1 max-w-[80px] truncate">{t.club_destino_nombre}</p>
          </div>
        </div>

        <div className="flex items-center justify-between text-xs text-texto-secundario">
          <span>{new Date(t.fecha).toLocaleDateString("es-PY")}</span>
          {t.monto && (
            <span className="text-apf-dorado font-semibold">${t.monto}M</span>
          )}
        </div>
      </div>
    </Link>
  );
}
