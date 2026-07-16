"use client";

interface StatCardProps {
  label: string;
  value: number | string;
  unit?: string;
  color?: string;
  maxValue?: number;
  showBar?: boolean;
}

export default function StatCard({
  label,
  value,
  unit = "",
  color = "text-white",
  maxValue = 100,
  showBar = false,
}: StatCardProps) {
  const numericValue = typeof value === "string" ? parseFloat(value) : value;
  const percentage = showBar ? Math.min((numericValue / maxValue) * 100, 100) : 0;

  return (
    <div className="p-4 rounded-xl bg-bg-terciario border border-borde-sutil">
      <div className="text-sm text-texto-secundario mb-1">{label}</div>
      <div className={`text-2xl font-bold ${color}`}>
        {value}
        {unit && <span className="text-sm font-normal ml-1">{unit}</span>}
      </div>
      {showBar && (
        <div className="mt-2 h-2 bg-gray-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-py-rojo transition-all duration-500"
            style={{ width: `${percentage}%` }}
          />
        </div>
      )}
    </div>
  );
}
