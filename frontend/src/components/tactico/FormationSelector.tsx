"use client";

interface FormationSelectorProps {
  formaciones: string[];
  actual: string;
  onChange: (formacion: string) => void;
}

export default function FormationSelector({ formaciones, actual, onChange }: FormationSelectorProps) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-texto-secundario">Formacion:</span>
      <select
        value={actual}
        onChange={(e) => onChange(e.target.value)}
        className="bg-bg-terciario border border-borde-sutil text-white text-sm rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-py-rojo"
      >
        {formaciones.map((f) => (
          <option key={f} value={f}>
            {f}
          </option>
        ))}
      </select>
    </div>
  );
}
