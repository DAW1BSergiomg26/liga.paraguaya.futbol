"use client";

interface FiltrosNoticiasProps {
  filtro: string;
  onFiltroChange: (filtro: string) => void;
  busqueda: string;
  onBusquedaChange: (busqueda: string) => void;
}

const FILTROS = [
  { value: "", label: "Todas" },
  { value: "editorial", label: "Editorial" },
  { value: "rss", label: "RSS" },
];

export default function FiltrosNoticias({
  filtro,
  onFiltroChange,
  busqueda,
  onBusquedaChange,
}: FiltrosNoticiasProps) {
  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-8">
      <div className="flex gap-2">
        {FILTROS.map((f) => (
          <button
            key={f.value}
            onClick={() => onFiltroChange(f.value)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
              filtro === f.value
                ? "bg-apf-rojo text-white"
                : "bg-bg-terciario text-texto-secundario hover:text-white border border-borde-sutil"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>
      <input
        type="text"
        placeholder="Buscar noticias..."
        value={busqueda}
        onChange={(e) => onBusquedaChange(e.target.value)}
        className="px-4 py-2 rounded-lg bg-bg-terciario border border-borde-sutil text-white text-sm focus:outline-none focus:border-apf-rojo transition w-full sm:w-64"
      />
    </div>
  );
}
