// frontend/src/components/historial/HistorialTabs.tsx
"use client";

const TABS = [
  { key: "tablas", label: "Tablas por año" },
  { key: "ranking", label: "Ranking agregado" },
  { key: "club", label: "Rendimiento por club" },
  { key: "comparar", label: "Comparar Clubes" },
];

export default function HistorialTabs({
  active,
  onChange,
}: {
  active: string;
  onChange: (key: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2 mb-8">
      {TABS.map((t) => (
        <button
          key={t.key}
          onClick={() => onChange(t.key)}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
            active === t.key
              ? "bg-apf-rojo text-white"
              : "bg-bg-secundario text-texto-secundario hover:text-texto-principal"
          }`}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}
