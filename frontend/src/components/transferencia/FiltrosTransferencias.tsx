// frontend/src/components/transferencia/FiltrosTransferencias.tsx
"use client";

import { useState } from "react";

interface Props {
  onFilter: (filters: Record<string, string>) => void;
}

const CLUBES = [
  { id: "", nombre: "Todos los clubes" },
  { id: "olimpia", nombre: "Olimpia" },
  { id: "cerro-porteno", nombre: "Cerro Porteño" },
  { id: "libertad", nombre: "Libertad" },
  { id: "nacional", nombre: "Nacional" },
  { id: "guarani", nombre: "Guaraní" },
  { id: "sol-de-america", nombre: "Sol de América" },
  { id: "sportivo-luqueno", nombre: "Sportivo Luqueño" },
];

const TIPOS = [
  { value: "", label: "Todos los tipos" },
  { value: "compra", label: "Compra" },
  { value: "prestamo", label: "Préstamo" },
  { value: "libre", label: "Libre" },
  { value: "cesion", label: "Cesión" },
  { value: "refuerzo", label: "Refuerzo" },
];

export default function FiltrosTransferencias({ onFilter }: Props) {
  const [filters, setFilters] = useState<Record<string, string>>({});

  function update(key: string, value: string) {
    const next = { ...filters, [key]: value };
    if (!value) delete next[key];
    setFilters(next);
    onFilter(next);
  }

  return (
    <div className="flex flex-wrap gap-3 mb-6">
      <input
        type="text"
        placeholder="Buscar jugador..."
        className="px-4 py-2 rounded-lg bg-bg-noche border border-borde-sutil text-texto-principal placeholder-texto-secundario focus:outline-none focus:border-apf-rojo/50 transition text-sm"
        onChange={(e) => update("jugador", e.target.value)}
      />
      <select
        className="px-4 py-2 rounded-lg bg-bg-noche border border-borde-sutil text-texto-principal text-sm focus:outline-none focus:border-apf-rojo/50"
        onChange={(e) => update("club_id", e.target.value)}
      >
        {CLUBES.map((c) => (
          <option key={c.id} value={c.id}>{c.nombre}</option>
        ))}
      </select>
      <select
        className="px-4 py-2 rounded-lg bg-bg-noche border border-borde-sutil text-texto-principal text-sm focus:outline-none focus:border-apf-rojo/50"
        onChange={(e) => update("tipo", e.target.value)}
      >
        {TIPOS.map((t) => (
          <option key={t.value} value={t.value}>{t.label}</option>
        ))}
      </select>
    </div>
  );
}