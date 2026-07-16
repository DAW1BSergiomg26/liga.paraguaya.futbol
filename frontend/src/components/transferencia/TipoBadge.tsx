"use client";

const TIPO_CONFIG: Record<string, { bg: string; text: string; label: string }> = {
  compra: { bg: "bg-green-500/20", text: "text-green-400", label: "Compra" },
  prestamo: { bg: "bg-blue-500/20", text: "text-blue-400", label: "Préstamo" },
  libre: { bg: "bg-gray-500/20", text: "text-gray-400", label: "Libre" },
  cesion: { bg: "bg-purple-500/20", text: "text-purple-400", label: "Cesión" },
  refuerzo: { bg: "bg-apf-dorado/20", text: "text-apf-dorado", label: "Refuerzo" },
};

export default function TipoBadge({ tipo }: { tipo: string }) {
  const config = TIPO_CONFIG[tipo] || TIPO_CONFIG.compra;
  return (
    <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold ${config.bg} ${config.text}`}>
      {config.label}
    </span>
  );
}
