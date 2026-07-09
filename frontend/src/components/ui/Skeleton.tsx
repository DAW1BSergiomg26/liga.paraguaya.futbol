export function TableSkeleton({ rows = 5, cols = 6 }: { rows?: number; cols?: number }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-borde-sutil bg-bg-secundario/60">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-borde-sutil">
            {Array.from({ length: cols }).map((_, i) => (
              <th key={i} className="p-4">
                <div className="h-3 bg-white/10 rounded animate-pulse w-12 mx-auto" />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: rows }).map((_, r) => (
            <tr key={r} className="border-b border-borde-sutil">
              {Array.from({ length: cols }).map((_, c) => (
                <td key={c} className="p-4">
                  <div className="h-4 bg-texto-principal/5 rounded animate-pulse w-full" style={{ maxWidth: c === 1 ? "120px" : "40px" }} />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function CardSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="p-6 rounded-xl border border-borde-sutil bg-bg-secundario/60">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 rounded-full bg-white/10 animate-pulse" />
            <div className="h-5 bg-white/10 rounded animate-pulse w-32" />
          </div>
          <div className="space-y-2">
            <div className="h-3 bg-white/5 rounded animate-pulse w-24" />
            <div className="h-3 bg-white/5 rounded animate-pulse w-20" />
            <div className="h-3 bg-white/5 rounded animate-pulse w-28" />
            <div className="h-3 bg-white/5 rounded animate-pulse w-16" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function StatsSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-12">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="p-6 rounded-xl bg-bg-secundario/60 border border-borde-sutil text-center">
          <div className="h-8 bg-white/10 rounded animate-pulse w-16 mx-auto mb-2" />
          <div className="h-4 bg-white/5 rounded animate-pulse w-20 mx-auto" />
        </div>
      ))}
    </div>
  );
}